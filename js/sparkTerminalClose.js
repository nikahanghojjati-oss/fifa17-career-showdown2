(function(root,factory){
  const protocol=typeof module!=="undefined"&&module.exports?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose;
  const sessionProtocol=typeof module!=="undefined"&&module.exports?require("./sparkPrivateSession.js"):root.CareerModeSparkPrivateSession;
  const api=factory(root,protocol,sessionProtocol);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkTerminalClose=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,protocol,sessionProtocol){
  "use strict";

  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function resultError(error,fallback){return {ok:false,code:error&&typeof error.code==="string"?error.code:fallback,message:error&&error.message?error.message:"Terminal Close could not be completed."};}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
  function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function hashEnvelopeValue(value,cryptoImpl=root.crypto){if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")fail("TERMINAL_CLOSE_CRYPTO_UNAVAILABLE","Secure SHA-256 support is unavailable.");const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(digest))}`;}
  function normalizeId(value,pattern,code){const normalized=typeof value==="string"?value.trim().toLowerCase():"";if(!pattern.test(normalized))fail(code);return normalized;}
  function normalizeAccount(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)fail("TERMINAL_CLOSE_AUTH_REQUIRED","A connected private account is required.");return id;}
  function timestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function snapshotValue(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function envelopeShape(value,type,id){return Boolean(value&&value.schemaVersion===1&&value.objectType===type&&value.objectId===id&&Number.isInteger(value.revision)&&value.revision>=0&&value.lifecycleState==="live"&&typeof value.contentHash==="string"&&/^sha256:[0-9a-f]{64}$/.test(value.contentHash)&&value.data&&typeof value.data==="object"&&value.tombstone===null);}
  async function verifyEnvelope(value,type,id,cryptoImpl){if(!envelopeShape(value,type,id))fail("TERMINAL_CLOSE_AUTHORITY_INVALID");const expected=await hashEnvelopeValue({objectType:type,objectId:id,revision:value.revision,data:value.data},cryptoImpl);if(expected!==value.contentHash)fail("TERMINAL_CLOSE_INTEGRITY_FAILED");return value;}
  function assertActiveAccount(value,accountId){if(!envelopeShape(value,"account",accountId)||value.data.status!=="active")fail("TERMINAL_CLOSE_ACCOUNT_INACTIVE");}
  function assertActiveDevice(value,deviceId){if(!envelopeShape(value,"device",deviceId)||value.data.deviceId!==deviceId||value.data.state!=="active")fail(value&&value.data&&value.data.state==="revoked"?"TERMINAL_CLOSE_DEVICE_REVOKED":"TERMINAL_CLOSE_DEVICE_INACTIVE");}
  function validateSdk(firestore,sdk){if(!firestore)fail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");for(const method of ["doc","runTransaction"]){if(!sdk||typeof sdk[method]!=="function")fail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");}if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")fail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");}
  function normalizeOptions(options={}){
    validateSdk(options.firestore,options.firebaseSdk);
    if(!protocol||typeof protocol.verifyIntent!=="function"||!sessionProtocol||typeof sessionProtocol.verifySession!=="function"||typeof sessionProtocol.buildEnvelope!=="function")fail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
    const intent=protocol.verifyIntent(options.intent);
    const rivalryId=normalizeId(options.rivalryId,/^pair_[0-9a-f]{64}$/,"TERMINAL_CLOSE_RIVALRY_INVALID");
    if(intent.rivalryId!==rivalryId)fail("TERMINAL_CLOSE_RIVALRY_MISMATCH");
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0)fail("TERMINAL_CLOSE_TIME_INVALID");
    return freeze({firestore:options.firestore,firebaseSdk:options.firebaseSdk,accountId:normalizeAccount(options.user),deviceId:normalizeId(options.deviceId,/^device_[0-9a-f]{32}$/,"TERMINAL_CLOSE_DEVICE_INVALID"),rivalryId,sessionId:normalizeId(options.sessionId,/^session_[0-9a-f]{64}$/,"TERMINAL_CLOSE_SESSION_INVALID"),intent,nowEpochMs,cryptoImpl:options.cryptoImpl||root.crypto});
  }
  function refs(operation){const sdk=operation.firebaseSdk,db=operation.firestore;return freeze({account:sdk.doc(db,"accounts",operation.accountId),device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),rivalry:sdk.doc(db,"rivalries",operation.rivalryId),session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId)});}
  function entitledRivalry(rivalry,accountId){const ids=Array.isArray(rivalry.data.authorizedAccountIds)?rivalry.data.authorizedAccountIds:[],slots=Array.isArray(rivalry.data.managerSlots)?rivalry.data.managerSlots:[];if(ids.length!==2||new Set(ids).size!==2||!ids.includes(accountId)||slots.length!==2||slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")||!ids.every(id=>slots.some(slot=>slot.accountId===id)))fail("TERMINAL_CLOSE_RIVALRY_AUTHORITY_INVALID");return ids;}
  async function buildRivalryEnvelope(operation,prior,data,now){const revision=prior.revision+1;return {schemaVersion:1,objectType:"rivalry",objectId:operation.rivalryId,revision,parentRevision:prior.revision,lifecycleState:"live",contentHash:await hashEnvelopeValue({objectType:"rivalry",objectId:operation.rivalryId,revision,data},operation.cryptoImpl),priorContentHash:prior.contentHash,updatedAt:now,updatedByAccountId:operation.accountId,updatedByDeviceId:operation.deviceId,data,tombstone:null};}
  function accepted(operation,rivalry,session,replayed){return freeze({ok:true,status:replayed?"replayed":"accepted",replayed:Boolean(replayed),rivalryId:operation.rivalryId,sessionId:operation.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:rivalry.revision,sessionRevision:session.revision,terminalWitness:clone(operation.intent),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});}

  async function close(options={}){
    try{
      const operation=normalizeOptions(options),references=refs(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const accountValue=snapshotValue(await transaction.get(references.account));assertActiveAccount(accountValue,operation.accountId);
        const deviceValue=snapshotValue(await transaction.get(references.device));assertActiveDevice(deviceValue,operation.deviceId);
        const rivalryValue=snapshotValue(await transaction.get(references.rivalry));await verifyEnvelope(rivalryValue,"rivalry",operation.rivalryId,operation.cryptoImpl);const authorized=entitledRivalry(rivalryValue,operation.accountId);
        const sessionValue=snapshotValue(await transaction.get(references.session));if(!sessionValue)fail("TERMINAL_CLOSE_SESSION_NOT_FOUND");const session=await sessionProtocol.verifySession(sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        if(!session.members.includes(operation.accountId))fail("TERMINAL_CLOSE_SESSION_MEMBER_REQUIRED");
        if(rivalryValue.data.connectionState==="closed"){
          if(!protocol.sameWitness(rivalryValue.data.terminalClose,operation.intent))fail("TERMINAL_CLOSE_REPLAY_CONFLICT");
          if(session.data.state!=="closed")fail("TERMINAL_CLOSE_PARTIAL_STATE_INVALID");
          return accepted(operation,rivalryValue,sessionValue,true);
        }
        if(rivalryValue.data.connectionState!=="active")fail("TERMINAL_CLOSE_RIVALRY_NOT_ACTIVE");
        if(session.data.state!=="active"||session.members.length!==2||authorized.some(id=>!session.members.includes(id)))fail("TERMINAL_CLOSE_SESSION_NOT_ACTIVE");
        if(operation.nowEpochMs>=session.expiresAtEpochMs)fail("TERMINAL_CLOSE_SESSION_EXPIRED");
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const sessionData={...session.data,state:"closed",lastActivityAt:now,revokedAt:null};
        const nextSession=await sessionProtocol.buildEnvelope({sessionId:operation.sessionId,revision:sessionValue.revision+1,parentRevision:sessionValue.revision,priorContentHash:sessionValue.contentHash,updatedAt:now,accountId:operation.accountId,deviceId:operation.deviceId,data:sessionData,cryptoImpl:operation.cryptoImpl});
        const rivalryData={...rivalryValue.data,connectionState:"closed",terminalClose:clone(operation.intent)};
        const nextRivalry=await buildRivalryEnvelope(operation,rivalryValue,rivalryData,now);
        transaction.set(references.session,nextSession);transaction.set(references.rivalry,nextRivalry);
        return accepted(operation,nextRivalry,nextSession,false);
      });
    }catch(error){return resultError(error,"TERMINAL_CLOSE_FAILED");}
  }

  async function read(options={}){
    try{
      validateSdk(options.firestore,options.firebaseSdk);
      if(!protocol||typeof protocol.verifyIntent!=="function")fail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
      const accountId=normalizeAccount(options.user),deviceId=normalizeId(options.deviceId,/^device_[0-9a-f]{32}$/,"TERMINAL_CLOSE_DEVICE_INVALID"),rivalryId=normalizeId(options.rivalryId,/^pair_[0-9a-f]{64}$/,"TERMINAL_CLOSE_RIVALRY_INVALID"),cryptoImpl=options.cryptoImpl||root.crypto,sdk=options.firebaseSdk,db=options.firestore;
      return await sdk.runTransaction(db,async transaction=>{
        assertActiveAccount(snapshotValue(await transaction.get(sdk.doc(db,"accounts",accountId))),accountId);
        assertActiveDevice(snapshotValue(await transaction.get(sdk.doc(db,"accounts",accountId,"devices",deviceId))),deviceId);
        const rivalry=await verifyEnvelope(snapshotValue(await transaction.get(sdk.doc(db,"rivalries",rivalryId))),"rivalry",rivalryId,cryptoImpl);entitledRivalry(rivalry,accountId);
        if(rivalry.data.connectionState!=="closed")return freeze({ok:true,status:"open",rivalryId,rivalryState:rivalry.data.connectionState,terminal:false});
        const intent=protocol.verifyIntent(rivalry.data.terminalClose);if(intent.rivalryId!==rivalryId)fail("TERMINAL_CLOSE_RIVALRY_MISMATCH");
        return freeze({ok:true,status:"closed",rivalryId,rivalryState:"closed",rivalryRevision:rivalry.revision,terminal:true,terminalWitness:clone(intent),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
      });
    }catch(error){return resultError(error,"TERMINAL_CLOSE_READ_FAILED");}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-terminal-close",runtimeRevision:"1.9.1-r18",atomicRivalryAndSessionClose:true,newCollectionRequired:false,terminalReadAfterClose:true,productionRulesPublished:false,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false,close,read});
});
