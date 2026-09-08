(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRProductionNegativeProbeRunner=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const FEATURE="ssjr-production-negative-probe-runner";
  const CONTRACT="ssjr-negative-probe-runner-v1";
  const SOURCES=Object.freeze({
    wrongSession:"production-shared-setup-wrong-session-probe",
    expiredSession:"production-shared-setup-expired-session-probe",
    unrelatedAccount:"stage5f-third-account-provider-probe",
    revokedIdentity:"stage5f-revoked-device-provider-probe",
    staleRevision:"production-shared-setup-stale-revision-probe",
    replayConflict:"production-shared-setup-replay-conflict-probe",
    directFieldSubstitution:"shared-setup-production-direct-field-probe",
    coordinatorBypass:"shared-setup-production-coordinator-bypass-probe"
  });
  const EXPECTED=Object.freeze({
    wrongSession:new Set(["SETUP_SESSION_INVALID","SETUP_SESSION_MISMATCH","SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_AUTHORITY_MISMATCH"]),
    expiredSession:new Set(["SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_ACTIVE_SESSION_REQUIRED"]),
    unrelatedAccount:new Set(["STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED"]),
    revokedIdentity:new Set(["STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED"]),
    staleRevision:new Set(["SETUP_STALE_BASE_REVISION"]),
    replayConflict:new Set(["SETUP_IDEMPOTENCY_CONFLICT"]),
    directFieldSubstitution:new Set(["SETUP_DRAW_MISMATCH"]),
    coordinatorBypass:new Set(["SETUP_COORDINATOR_REQUIRED","SHARED_SETUP_HOST_REQUIRED"])
  });
  function ssjrNegProbeFail(code,message){const e=new Error(message||code);e.code=code;throw e;}
  function ssjrNegProbeStorageSnapshot(storage=root["local"+"Storage"]){if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;const rows=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);rows.push([k,storage.getItem(k)]);}rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));return JSON.stringify(rows);}
  function ssjrNegProbeRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")ssjrNegProbeFail("SSJR_NEGATIVE_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `setup_op_${Array.from(bytes,v=>v.toString(16).padStart(2,"0")).join("")}`;}
  function ssjrNegProbeAlternateSessionId(current){const base=String(current||"");if(!/^session_[0-9a-f]{64}$/.test(base))ssjrNegProbeFail("SSJR_NEGATIVE_SESSION_UNAVAILABLE");const last=base.at(-1);return `${base.slice(0,-1)}${last==="0"?"1":"0"}`;}
  function ssjrNegProbeTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();const n=Number(value);return Number.isFinite(n)?n:Number.NaN;}
  async function ssjrNegProbeEnsureScript(id,path,key){if(root[key])return root[key];if(typeof root.loadRuntimeScript!=="function")ssjrNegProbeFail("SSJR_NEGATIVE_RUNTIME_LOADER_UNAVAILABLE");await root.loadRuntimeScript(id,path,()=>root[key]);if(!root[key])ssjrNegProbeFail("SSJR_NEGATIVE_DEPENDENCY_UNAVAILABLE",`${path} unavailable.`);return root[key];}
  async function ssjrNegProbeBaseContext(){
    const setup=root.CareerModeProductionSharedShowdownSetup||await ssjrNegProbeEnsureScript("ssjr-neg-production-setup","js/productionSharedShowdownSetup.js","CareerModeProductionSharedShowdownSetup");
    const adapter=root.CareerModeSparkSharedShowdownSetup||await ssjrNegProbeEnsureScript("ssjr-neg-spark-setup","js/sparkSharedShowdownSetup.js","CareerModeSparkSharedShowdownSetup");
    const runtime=root.CareerModeProductionFirebaseRuntime||await ssjrNegProbeEnsureScript("ssjr-neg-runtime","js/productionFirebaseRuntime.js","CareerModeProductionFirebaseRuntime");
    if(!setup||typeof setup.getState!=="function"||!adapter||typeof adapter.read!=="function"||typeof adapter.mutate!=="function"||!runtime||typeof runtime.ensureAccountServices!=="function")ssjrNegProbeFail("SSJR_NEGATIVE_DEPENDENCY_UNAVAILABLE");
    const state=setup.getState();
    if(!state||state.ready!==true||!state.rivalryId||!state.sessionId||!state.deviceId||!state.managerRole)ssjrNegProbeFail("SSJR_NEGATIVE_ACTIVE_SETUP_REQUIRED","Resolve the exact ACTIVE Shared Setup authority before running this probe.");
    const services=await runtime.ensureAccountServices();
    const user=services&&services.auth&&services.auth.currentUser;
    if(!services||services.ok!==true||!user)ssjrNegProbeFail("SSJR_NEGATIVE_AUTH_REQUIRED");
    return {setup,adapter,runtime,state,services,user};
  }
  function ssjrNegProbeAdapterOptions(ctx,extra={}){return {firestore:ctx.services.firestore,firebaseSdk:ctx.services.firestoreSdk,user:ctx.user,rivalryId:ctx.state.rivalryId,sessionId:ctx.state.sessionId,deviceId:ctx.state.deviceId,nowEpochMs:Date.now(),cryptoImpl:root.crypto,...extra};}
  async function ssjrNegProbeReadSetupLedger(ctx){
    const sdk=ctx.services.firestoreSdk,db=ctx.services.firestore;
    if(!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function")ssjrNegProbeFail("SSJR_NEGATIVE_PROVIDER_UNAVAILABLE");
    return sdk.runTransaction(db,async tx=>{const snap=await tx.get(sdk.doc(db,"rivalries",ctx.state.rivalryId,"sharedSetup","authoritative"));return snap&&typeof snap.exists==="function"&&snap.exists()?snap.data():null;});
  }
  async function ssjrNegProbeReadAuthority(ctx){
    const sdk=ctx.services.firestoreSdk,db=ctx.services.firestore;if(!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function")ssjrNegProbeFail("SSJR_NEGATIVE_PROVIDER_UNAVAILABLE");
    return sdk.runTransaction(db,async tx=>{
      const rivalrySnap=await tx.get(sdk.doc(db,"rivalries",ctx.state.rivalryId));
      const sessionSnap=await tx.get(sdk.doc(db,"rivalries",ctx.state.rivalryId,"sessions",ctx.state.sessionId));
      const rivalry=rivalrySnap&&rivalrySnap.exists&&rivalrySnap.exists()?rivalrySnap.data():null;
      const session=sessionSnap&&sessionSnap.exists&&sessionSnap.exists()?sessionSnap.data():null;
      if(!rivalry||!rivalry.data||!session||!session.data)ssjrNegProbeFail("SSJR_NEGATIVE_PROVIDER_AUTHORITY_UNAVAILABLE");
      const slots=Array.isArray(rivalry.data.managerSlots)?rivalry.data.managerSlots:[];
      const actor=slots.find(item=>item&&item.accountId===ctx.user.uid);
      if(!actor)ssjrNegProbeFail("SSJR_NEGATIVE_ACTOR_NOT_ENTITLED");
      const expiresAt=ssjrNegProbeTimestampMillis(session.data.expiresAt);
      if(!Number.isFinite(expiresAt))ssjrNegProbeFail("SSJR_NEGATIVE_SESSION_EXPIRY_UNAVAILABLE");
      return {authority:{rivalryId:ctx.state.rivalryId,connectionState:"active",managerSlots:slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:item.entitlementState})),actor:{accountId:actor.accountId,deviceId:ctx.state.deviceId,deviceState:"active",managerRole:actor.slotId,profileId:actor.profileId,saveId:actor.saveId},session:{sessionId:ctx.state.sessionId,rivalryId:ctx.state.rivalryId,state:session.data.state,hostAccountId:session.data.hostAccountId,memberAccountIds:[...(session.data.memberAccountIds||[])],expiresAtEpochMs:expiresAt},nowEpochMs:Date.now()},actorRole:actor.slotId};
    });
  }
  function ssjrNegProbeFinalize(name,code,before,after){if(!EXPECTED[name]||!EXPECTED[name].has(code))ssjrNegProbeFail("SSJR_NEGATIVE_UNEXPECTED_DENIAL",`${name} returned ${code}.`);if(before!==after)ssjrNegProbeFail("SSJR_NEGATIVE_LOCAL_STORAGE_CHANGED");return Object.freeze({ok:true,probeContract:CONTRACT,denied:true,source:SOURCES[name],code,localStorageUnchanged:true});}
  async function ssjrNegProbeRunInternal(name){
    const ctx=await ssjrNegProbeBaseContext(),before=ssjrNegProbeStorageSnapshot();let code=null;
    if(name==="wrongSession"){const result=await ctx.adapter.read(ssjrNegProbeAdapterOptions(ctx,{sessionId:ssjrNegProbeAlternateSessionId(ctx.state.sessionId)}));code=result&&result.ok===false?result.code:null;}
    else if(name==="expiredSession"){const auth=await ssjrNegProbeReadAuthority(ctx);const result=await ctx.adapter.read(ssjrNegProbeAdapterOptions(ctx,{nowEpochMs:auth.authority.session.expiresAtEpochMs}));code=result&&result.ok===false?result.code:null;}
    else if(name==="staleRevision"){const current=await ctx.adapter.read(ssjrNegProbeAdapterOptions(ctx));if(!current||current.ok!==true)ssjrNegProbeFail("SSJR_NEGATIVE_SETUP_READ_FAILED");const result=await ctx.adapter.mutate(ssjrNegProbeAdapterOptions(ctx,{type:"open",operationId:ssjrNegProbeRandomOperationId(),baseRevision:(current.revision||0)+1}));code=result&&result.ok===false?result.code:null;}
    else if(name==="replayConflict"){const ledger=await ssjrNegProbeReadSetupLedger(ctx);if(!ledger||!Array.isArray(ledger.operationIds)||!ledger.operationIds.length)ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_NOT_READY","Run replay-conflict after Shared Setup has at least one accepted operation.");const result=await ctx.adapter.mutate(ssjrNegProbeAdapterOptions(ctx,{type:"commit-length",operationId:ledger.operationIds[0],baseRevision:0,totalSeasons:1}));code=result&&result.ok===false?result.code:null;}
    else if(name==="directFieldSubstitution"||name==="coordinatorBypass"){
      const current=await ctx.adapter.read(ssjrNegProbeAdapterOptions(ctx));if(!current||current.ok!==true||!current.state)ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_NOT_READY","Shared Setup must be open for this probe.");
      const protocolModule=root.CareerModeSharedShowdownSetup||await ssjrNegProbeEnsureScript("ssjr-neg-protocol","js/sharedShowdownSetup.js","CareerModeSharedShowdownSetup");
      const catalogModule=root.CareerModeSharedShowdownCatalog||await ssjrNegProbeEnsureScript("ssjr-neg-catalog","js/sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog");
      const protocol=await protocolModule.createProtocol({catalog:catalogModule.catalog,cryptoImpl:root.crypto});const auth=await ssjrNegProbeReadAuthority(ctx);let command;
      if(name==="directFieldSubstitution"){
        if(current.state.phase==="SHARED_SETUP_OPEN"){const expected=await protocol.prepareDraw({state:current.state,type:"commit-league",operationId:ssjrNegProbeRandomOperationId()});const alternate=protocolModule.leagueIds.find(id=>id!==expected.leagueId);command={...expected,leagueId:alternate};}
        else if(current.state.phase==="LEAGUE_WHEEL_COMMITTED"){const expected=await protocol.prepareDraw({state:current.state,type:"commit-clubs",operationId:ssjrNegProbeRandomOperationId()});const clubs=[...catalogModule.catalog[current.state.leagueId]];let p1=clubs.find(c=>c!==expected.clubs.playerOne&&c!==expected.clubs.playerTwo);let p2=clubs.find(c=>c!==p1&&c!==expected.clubs.playerTwo);if(!p1||!p2)ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_NOT_READY");command={...expected,clubs:{playerOne:p1,playerTwo:p2}};}
        else ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_NOT_READY","Run direct-field substitution while the league or clubs draw is pending.");
      }else{
        if(auth.actorRole===current.state.coordinatorRole)ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_ROLE_NOT_SUITABLE","Coordinator-bypass must be observed from the non-coordinator manager.");
        if(current.state.phase==="SHARED_SETUP_OPEN")command=await protocol.prepareDraw({state:current.state,type:"commit-league",operationId:ssjrNegProbeRandomOperationId()});
        else if(current.state.phase==="LEAGUE_WHEEL_COMMITTED")command=await protocol.prepareDraw({state:current.state,type:"commit-clubs",operationId:ssjrNegProbeRandomOperationId()});
        else if(current.state.phase==="CLUB_ASSIGNMENTS_COMMITTED")command={type:"commit-length",operationId:ssjrNegProbeRandomOperationId(),baseRevision:current.state.revision,totalSeasons:1};
        else ssjrNegProbeFail("SSJR_NEGATIVE_PROBE_NOT_READY","Run coordinator-bypass before season-length confirmation.");
      }
      const result=await protocol.apply({state:current.state,authority:auth.authority,command});code=result&&result.ok===false?result.code:null;
    }else ssjrNegProbeFail("SSJR_NEGATIVE_NAME_INVALID");
    return ssjrNegProbeFinalize(name,code,before,ssjrNegProbeStorageSnapshot());
  }
  async function ssjrNegProbeRunStage5f(name,options={}){
    const ctx=await ssjrNegProbeBaseContext(),before=ssjrNegProbeStorageSnapshot();
    const stage=root.CareerModeStage5fProductionAuthenticatedNegatives||await ssjrNegProbeEnsureScript("ssjr-neg-stage5f","js/stage5fProductionAuthenticatedNegatives.js","CareerModeStage5fProductionAuthenticatedNegatives");let result;
    if(name==="revokedIdentity"){
      const pairing=root.CareerModeSparkPrivatePairing||await ssjrNegProbeEnsureScript("ssjr-neg-pairing","js/sparkPrivatePairing.js","CareerModeSparkPrivatePairing");
      const protocol=root.CareerModeSparkStandardAuthPrivateSession||await ssjrNegProbeEnsureScript("ssjr-neg-private-session","js/sparkStandardAuthPrivateSession.js","CareerModeSparkStandardAuthPrivateSession");
      const actor=await pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
      result=await stage.probeRevokedDeviceProviderDenial({user:ctx.user,firestore:ctx.services.firestore,firebaseSdk:ctx.services.firestoreSdk,pairingApi:pairing,protocolApi:protocol,actorIdentity:actor,rivalryId:ctx.state.rivalryId,localStorageImpl:root["local"+"Storage"],indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
    }else if(name==="unrelatedAccount"){
      const rivalryId=String(options.rivalryId||ctx.state.rivalryId||"").trim();
      result=await stage.probeAnyAuthenticatedThirdAccountDenial({user:ctx.user,firestore:ctx.services.firestore,firebaseSdk:ctx.services.firestoreSdk,rivalryId,hostVerifiedRivalryId:options.hostVerifiedRivalryId||null,operatorConfirmedThirdAccount:options.operatorConfirmedThirdAccount===true,operatorConfirmedActiveRivalry:options.operatorConfirmedActiveRivalry===true,localStorageImpl:root["local"+"Storage"],cryptoImpl:root.crypto});
    }else ssjrNegProbeFail("SSJR_NEGATIVE_NAME_INVALID");
    if(!result||result.ok!==true)ssjrNegProbeFail(result&&result.code||"SSJR_NEGATIVE_PROBE_NOT_PROVEN",result&&result.message||"Production denial was not proven.");
    return ssjrNegProbeFinalize(name,result.code,before,ssjrNegProbeStorageSnapshot());
  }
  async function ssjrNegProbeRun(name,options={}){if(["unrelatedAccount","revokedIdentity"].includes(name))return ssjrNegProbeRunStage5f(name,options);return ssjrNegProbeRunInternal(name);}
  return Object.freeze({contractVersion:1,feature:FEATURE,probeContract:CONTRACT,sources:SOURCES,run:ssjrNegProbeRun,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false});
});
