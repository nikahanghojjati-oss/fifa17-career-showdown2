(function(){
  const hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const validId=value=>typeof value==="string"&&value.trim().length>0;
  const plainObject=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  const deepFreeze=value=>{
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  };
  const CANONICAL_LOCAL_KEYS=Object.freeze(["saveLibrary","legacyShowdowns","preferences"]);
  const ACCOUNT_STATES=Object.freeze(["active","disabled","deletion-pending"]);
  const DEVICE_STATES=Object.freeze(["active","revoked"]);
  const MEMBERSHIP_STATES=Object.freeze(["active","retained","relinquished"]);
  const RELATIONSHIP_STATES=Object.freeze(["active","revoked-read-only","single-owner-retained","deletion-pending"]);

  function stableStringify(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  function result(status,extra={}){
    return Object.assign({ok:false,status},extra);
  }
  function normalizeLocalRaw(raw){
    const source=plainObject(raw)?raw:{};
    const output={};
    for(const key of CANONICAL_LOCAL_KEYS){
      const value=hasOwn(source,key)?source[key]:null;
      output[key]=value===null||typeof value==="string"?value:null;
    }
    return output;
  }
  function normalizeAccounts(accounts){
    if(!plainObject(accounts)||Object.keys(accounts).length!==2)return null;
    const normalized={};
    for(const [accountId,record] of Object.entries(accounts)){
      if(!validId(accountId))return null;
      const state=plainObject(record)&&ACCOUNT_STATES.includes(record.state)?record.state:"active";
      normalized[accountId]={state};
    }
    return normalized;
  }
  function normalizeDevices(devices,accounts,initialAuthority){
    if(!plainObject(devices)||Object.keys(devices).length!==2)return null;
    const normalized={};
    for(const [deviceId,record] of Object.entries(devices)){
      if(!validId(deviceId)||!plainObject(record)||!validId(record.accountId)||!accounts[record.accountId])return null;
      const state=DEVICE_STATES.includes(record.state)?record.state:"active";
      normalized[deviceId]={
        accountId:record.accountId,
        state,
        online:record.online!==false,
        observedRevision:initialAuthority.revision,
        observedContentHash:initialAuthority.contentHash,
        observedTombstone:Boolean(initialAuthority.tombstone),
        localRaw:normalizeLocalRaw(record.localRaw)
      };
    }
    return normalized;
  }
  function normalizeMemberships(memberships,accounts){
    const source=plainObject(memberships)?memberships:{};
    const normalized={};
    for(const accountId of Object.keys(accounts)){
      normalized[accountId]=MEMBERSHIP_STATES.includes(source[accountId])?source[accountId]:"active";
    }
    return normalized;
  }
  function isValidPayload(payload,supportedVersions){
    if(!plainObject(payload))return {ok:false,status:"invalid-request"};
    if(!Number.isInteger(payload.payloadFormatVersion)||payload.payloadFormatVersion<=0)return {ok:false,status:"invalid-request"};
    if(!supportedVersions.includes(payload.payloadFormatVersion))return {ok:false,status:"unsupported-payload"};
    return {ok:true,status:"valid"};
  }
  function isValidContentHash(value){
    return typeof value==="string"&&/^sha256:[0-9a-f]{64}$/.test(value);
  }
  function createHarness(options={}){
    const revisionModel=window.CareerModeSyncRevisionModel;
    const transactionEngine=window.runCareerModeRawStorageTransaction;
    if(!revisionModel||typeof revisionModel.createAuthority!=="function"||typeof revisionModel.applyMutation!=="function"){
      return result("revision-model-unavailable");
    }
    if(typeof transactionEngine!=="function")return result("storage-transaction-unavailable");
    if(!validId(options.rivalryId))return result("invalid-harness");
    const accounts=normalizeAccounts(options.accounts);
    if(!accounts)return result("invalid-harness");
    // Phase 1A uses an account-scoped CAS kernel. Phase 1E supplies one fixed, non-user
    // sentinel only inside that dormant kernel; authenticated actor accountId remains
    // separate and is enforced by the harness authorization layer.
    const authorityScopeId="phase1e_shared_authority_scope";
    const seedInput=plainObject(options.initialAuthority)?options.initialAuthority:{};
    const seed=revisionModel.createAuthority({
      accountId:authorityScopeId,
      objectType:"sharedState",
      objectId:options.rivalryId,
      revision:Number.isInteger(seedInput.revision)&&seedInput.revision>=0?seedInput.revision:0,
      parentRevision:Number.isInteger(seedInput.parentRevision)?seedInput.parentRevision:null,
      contentHash:seedInput.tombstone===true?null:(isValidContentHash(seedInput.contentHash)?seedInput.contentHash:null),
      priorContentHash:seedInput.priorContentHash,
      content:hasOwn(seedInput,"content")?seedInput.content:{payloadFormatVersion:1},
      tombstone:seedInput.tombstone===true,
      updatedByDeviceId:seedInput.updatedByDeviceId
    });
    if(!seed.ok)return result("invalid-harness");
    const devices=normalizeDevices(options.devices,accounts,seed.state);
    if(!devices)return result("invalid-harness");
    const memberships=normalizeMemberships(options.memberships,accounts);
    const supportedPayloadFormatVersions=Array.isArray(options.supportedPayloadFormatVersions)&&options.supportedPayloadFormatVersions.length
      ?Array.from(new Set(options.supportedPayloadFormatVersions.filter(value=>Number.isInteger(value)&&value>0))).sort((a,b)=>a-b)
      :[1];
    if(!supportedPayloadFormatVersions.length)return result("invalid-harness");
    let authority=seed.state;
    let ledger=seed.ledger;
    let remoteEnabled=options.remoteEnabled!==false;
    let relationshipState=RELATIONSHIP_STATES.includes(options.relationshipState)?options.relationshipState:"active";
    let sequence=0;

    function authorityView(){
      const view=clone(authority);
      delete view.accountId;
      return view;
    }
    function authorityDigest(){
      return {revision:authority.revision,contentHash:authority.contentHash,tombstone:Boolean(authority.tombstone)};
    }
    function currentAuthorization(deviceId,{requireOnline=true,requireMutation=true}={}){
      const device=devices[deviceId];
      if(!device)return result("unknown-device");
      if(!remoteEnabled)return result("remote-disabled");
      if(requireOnline&&device.online!==true)return result("offline");
      const account=accounts[device.accountId];
      if(!account)return result("forbidden");
      if(account.state==="disabled")return result("account-disabled");
      if(account.state==="deletion-pending")return result("forbidden",{code:"ACCOUNT_DELETION_PENDING"});
      if(device.state!=="active")return result("device-revoked");
      const membership=memberships[device.accountId];
      if(membership==="relinquished")return result("relationship-revoked");
      if(requireMutation&&(relationshipState!=="active"||membership!=="active"))return result("relationship-revoked");
      return {ok:true,status:"authorized",device,accountId:device.accountId,membership,relationshipState};
    }
    function validateIntent(intent){
      if(!plainObject(intent)||!validId(intent.deviceId)||!validId(intent.idempotencyKey))return result("invalid-request");
      if(!["put","delete","restore"].includes(intent.operation))return result("invalid-request");
      if(!Number.isInteger(intent.baseRevision)||intent.baseRevision<0)return result("invalid-request");
      if(intent.objectType!=="sharedState"||intent.objectId!==options.rivalryId)return result("invalid-request");
      if(intent.operation==="put"||intent.operation==="restore"){
        if(!isValidContentHash(intent.contentHash))return result("invalid-request");
        const payloadValidation=isValidPayload(intent.content,supportedPayloadFormatVersions);
        if(!payloadValidation.ok)return payloadValidation;
      }else if(intent.content!==null||intent.contentHash!==null){
        return result("invalid-request");
      }
      return {ok:true,status:"valid"};
    }
    function makeIntent(deviceId,input={}){
      const device=devices[deviceId];
      if(!device)return result("unknown-device");
      if(!plainObject(input)||!["put","delete","restore"].includes(input.operation)||!validId(input.idempotencyKey))return result("invalid-request");
      if(input.operation==="put"||input.operation==="restore"){
        if(!isValidContentHash(input.contentHash))return result("invalid-request");
        const payloadValidation=isValidPayload(input.payload,supportedPayloadFormatVersions);
        if(!payloadValidation.ok)return payloadValidation;
      }
      const intent={
        intentId:`intent_${++sequence}`,
        deviceId,
        operation:input.operation,
        objectType:"sharedState",
        objectId:options.rivalryId,
        baseRevision:device.observedRevision,
        idempotencyKey:input.idempotencyKey,
        contentHash:input.operation==="delete"?null:input.contentHash,
        content:input.operation==="delete"?null:clone(input.payload)
      };
      return {ok:true,status:"intent-created",intent:deepFreeze(intent)};
    }
    function submitIntent(intent){
      const validation=validateIntent(intent);
      if(!validation.ok)return Object.assign(validation,{authority:authorityDigest()});
      const authorization=currentAuthorization(intent.deviceId,{requireOnline:true,requireMutation:true});
      if(!authorization.ok)return Object.assign(authorization,{baseRevision:intent.baseRevision,authority:authorityDigest()});
      const request={
        operation:intent.operation,
        accountId:authorityScopeId,
        objectType:"sharedState",
        objectId:options.rivalryId,
        deviceId:intent.deviceId,
        baseRevision:intent.baseRevision,
        idempotencyKey:intent.idempotencyKey,
        contentHash:intent.contentHash,
        content:intent.content
      };
      const applied=revisionModel.applyMutation(authority,ledger,request);
      if(applied.ok&&applied.status==="accepted"){
        authority=applied.state;
        ledger=applied.ledger;
        const device=devices[intent.deviceId];
        device.observedRevision=authority.revision;
        device.observedContentHash=authority.contentHash;
        device.observedTombstone=Boolean(authority.tombstone);
      }else if(applied.ok&&applied.status==="replayed"){
        ledger=applied.ledger;
      }
      return Object.assign({},clone(applied),{
        actorAccountId:authorization.accountId,
        originalBaseRevision:intent.baseRevision,
        authoritativeRevision:authority.revision
      });
    }
    function reconnect(deviceId){
      const authorization=currentAuthorization(deviceId,{requireOnline:true,requireMutation:false});
      if(!authorization.ok)return Object.assign(authorization,{authority:authorityDigest()});
      const device=devices[deviceId];
      const previousObservedRevision=device.observedRevision;
      device.observedRevision=authority.revision;
      device.observedContentHash=authority.contentHash;
      device.observedTombstone=Boolean(authority.tombstone);
      return {
        ok:true,status:"reconnected",previousObservedRevision,observedRevision:device.observedRevision,
        observedContentHash:device.observedContentHash,observedTombstone:device.observedTombstone,
        accountId:authorization.accountId,membership:authorization.membership,relationshipState
      };
    }
    function simulateProviderRetry(intent,optionsForRetry={}){
      const validation=validateIntent(intent);
      if(!validation.ok)return validation;
      const authorization=currentAuthorization(intent.deviceId,{requireOnline:true,requireMutation:true});
      if(!authorization.ok)return authorization;
      const originalBaseRevision=intent.baseRevision;
      const firstReadRevision=authority.revision;
      if(originalBaseRevision!==firstReadRevision){
        const staleResult=submitIntent(intent);
        return {
          ok:staleResult.ok,status:staleResult.status,originalBaseRevision,retryBaseRevision:intent.baseRevision,
          firstReadRevision,retryReadRevision:authority.revision,interveningResult:null,result:clone(staleResult)
        };
      }
      let interveningResult=null;
      if(plainObject(optionsForRetry)&&optionsForRetry.interveningIntent){
        interveningResult=submitIntent(optionsForRetry.interveningIntent);
      }
      const retryReadRevision=authority.revision;
      const retryResult=submitIntent(intent);
      return {
        ok:retryResult.ok,
        status:retryResult.status,
        originalBaseRevision,
        retryBaseRevision:intent.baseRevision,
        firstReadRevision,
        retryReadRevision,
        interveningResult:clone(interveningResult),
        result:clone(retryResult)
      };
    }
    function setDeviceOnline(deviceId,online){
      if(!devices[deviceId])return result("unknown-device");
      devices[deviceId].online=Boolean(online);
      return {ok:true,status:devices[deviceId].online?"online":"offline"};
    }
    function revokeDevice(deviceId){
      if(!devices[deviceId])return result("unknown-device");
      devices[deviceId].state="revoked";
      return {ok:true,status:"device-revoked"};
    }
    function setAccountState(accountId,state){
      if(!accounts[accountId]||!ACCOUNT_STATES.includes(state))return result("invalid-account-state");
      accounts[accountId].state=state;
      return {ok:true,status:state};
    }
    function setMembershipState(accountId,state){
      if(!accounts[accountId]||!MEMBERSHIP_STATES.includes(state))return result("invalid-membership-state");
      memberships[accountId]=state;
      return {ok:true,status:state};
    }
    function setRelationshipState(state){
      if(!RELATIONSHIP_STATES.includes(state))return result("invalid-relationship-state");
      relationshipState=state;
      return {ok:true,status:state};
    }
    function setRemoteEnabled(enabled){
      remoteEnabled=Boolean(enabled);
      return {ok:true,status:remoteEnabled?"remote-enabled":"remote-disabled"};
    }
    function mutateLocalRaw(deviceId,key,value){
      const device=devices[deviceId];
      if(!device)return result("unknown-device");
      if(!CANONICAL_LOCAL_KEYS.includes(key)||(value!==null&&typeof value!=="string"))return result("invalid-local-mutation");
      device.localRaw[key]=value;
      return {ok:true,status:"local-mutated",key,value};
    }
    function previewLocalApply(deviceId,candidateRaw){
      const device=devices[deviceId];
      if(!device)return result("unknown-device");
      if(!plainObject(candidateRaw))return result("invalid-local-plan");
      const keys=Object.keys(candidateRaw);
      if(!keys.length||keys.some(key=>!CANONICAL_LOCAL_KEYS.includes(key)))return result("invalid-local-plan");
      for(const key of keys){
        if(candidateRaw[key]!==null&&typeof candidateRaw[key]!=="string")return result("invalid-local-plan");
      }
      const expectedRaw=clone(device.localRaw);
      const safeCandidate=clone(candidateRaw);
      return {
        ok:true,
        status:"local-preview-ready",
        preview:Object.freeze({
          deviceId,
          candidateRaw:safeCandidate,
          expectedRaw,
          fingerprint:stableStringify({candidateRaw:safeCandidate,expectedRaw})
        })
      };
    }
    function applyLocalPreview(preview,applyOptions={}){
      if(!plainObject(preview)||!devices[preview.deviceId]||!plainObject(preview.candidateRaw)||!plainObject(preview.expectedRaw))return result("invalid-local-preview");
      const device=devices[preview.deviceId];
      const failCommitKey=plainObject(applyOptions)&&CANONICAL_LOCAL_KEYS.includes(applyOptions.failCommitKey)?applyOptions.failCommitKey:null;
      const concurrent=plainObject(applyOptions)&&plainObject(applyOptions.concurrentMutationOnFailure)?applyOptions.concurrentMutationOnFailure:null;
      let concurrentApplied=false;
      const io={
        read(name){
          if(!CANONICAL_LOCAL_KEYS.includes(name))return {ok:false};
          return {ok:true,value:device.localRaw[name]};
        },
        write(name,value,phase){
          if(!CANONICAL_LOCAL_KEYS.includes(name))return false;
          if(phase==="commit"&&name===failCommitKey){
            if(!concurrentApplied&&concurrent&&CANONICAL_LOCAL_KEYS.includes(concurrent.key)&&(concurrent.value===null||typeof concurrent.value==="string")){
              device.localRaw[concurrent.key]=concurrent.value;
              concurrentApplied=true;
            }
            return false;
          }
          device.localRaw[name]=value;
          return true;
        }
      };
      const transaction=transactionEngine(preview.candidateRaw,io,preview.expectedRaw,{guardRequestedBeforeEachWrite:true});
      return {
        ok:transaction.ok,
        status:transaction.status,
        transaction:clone(transaction),
        localRaw:clone(device.localRaw)
      };
    }
    function localCapabilities(){
      return {
        localSaveLibraryUsable:true,
        candidateAExport:"available-non-mutating",
        candidateBAnalysis:"read-only",
        candidateCApply:"exclusive-destructive-authority",
        canonicalStorageKeys:CANONICAL_LOCAL_KEYS.slice(),
        remoteEnabled
      };
    }
    function snapshot(){
      const deviceSnapshot={};
      for(const deviceId of Object.keys(devices).sort())deviceSnapshot[deviceId]=clone(devices[deviceId]);
      const accountSnapshot={};
      for(const accountId of Object.keys(accounts).sort())accountSnapshot[accountId]=clone(accounts[accountId]);
      const membershipSnapshot={};
      for(const accountId of Object.keys(memberships).sort())membershipSnapshot[accountId]=memberships[accountId];
      const ledgerSnapshot={};
      for(const key of Object.keys(ledger).sort())ledgerSnapshot[key]=clone(ledger[key]);
      return {
        rivalryId:options.rivalryId,
        authority:authorityView(),
        ledger:ledgerSnapshot,
        accounts:accountSnapshot,
        devices:deviceSnapshot,
        memberships:membershipSnapshot,
        relationshipState,
        remoteEnabled,
        supportedPayloadFormatVersions:supportedPayloadFormatVersions.slice(),
        localCapabilities:localCapabilities()
      };
    }

    return {
      ok:true,
      status:"ready",
      createIntent:makeIntent,
      submitIntent,
      reconnect,
      simulateProviderRetry,
      setDeviceOnline,
      revokeDevice,
      setAccountState,
      setMembershipState,
      setRelationshipState,
      setRemoteEnabled,
      mutateLocalRaw,
      previewLocalApply,
      applyLocalPreview,
      localCapabilities,
      authority:authorityView,
      snapshot
    };
  }

  window.CareerModeTwoDeviceSyncHarness=Object.freeze({
    contractVersion:1,
    providerNeutral:true,
    canonicalLocalKeys:CANONICAL_LOCAL_KEYS,
    createHarness,
    stableStringify
  });
})();
