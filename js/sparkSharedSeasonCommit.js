(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const commitModule=typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit;
  const resultsModule=typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults;
  const RUNTIME_REVISION="1.9.1-r10";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^season_commit_op_[0-9a-f]{32}$/;
  const RESULT_OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const COMMIT_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","resultsRevision","results","acknowledgedRoles","operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);

  function scpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scpResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_COMMIT_PROVIDER_FAILED"});}
  function scpSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function scpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function scpExact(value,keys,code="SEASON_COMMIT_PROVIDER_STATE_INVALID"){if(!scpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scpFail(code);return value;}
  function scpClone(value){return JSON.parse(JSON.stringify(value));}
  function scpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scpFreeze);Object.freeze(value);}return value;}
  function scpCanonical(value){if(Array.isArray(value))return `[${value.map(scpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function scpHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scpFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scpCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function scpTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function scpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))scpFail("SEASON_COMMIT_RIVALRY_INVALID");return id;}
  function scpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))scpFail("SEASON_COMMIT_SESSION_INVALID");return id;}
  function scpNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))scpFail("SEASON_COMMIT_DEVICE_INACTIVE");return id;}
  function scpSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)scpFail("SEASON_COMMIT_SEASON_INVALID");return n;}
  function scpOperation(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))scpFail("SEASON_COMMIT_COMMAND_INVALID");return id;}
  function scpBase(value){const n=Number(value);if(!Number.isInteger(n)||n<0||n>3)scpFail("SEASON_COMMIT_COMMAND_INVALID");return n;}
  function scpUid(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)scpFail("SEASON_COMMIT_AUTH_REQUIRED");return id;}
  function scpNow(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)scpFail("SEASON_COMMIT_CLOCK_INVALID");return n;}
  function scpResult(value){scpExact(value,RESULT_KEYS,"SEASON_COMMIT_RESULTS_INVALID");if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>20||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>114||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)scpFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scpFail("SEASON_COMMIT_RESULTS_INVALID");}return scpClone(value);}
  function scpSdk(options){if(!options.firestore)scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
  function scpPath(sdk,db,...parts){return sdk.doc(db,...parts);}
  async function scpGet(tx,ref){return scpSnapshot(await tx.get(ref));}

  function scpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||value.data?.status!=="active")scpFail("SEASON_COMMIT_MANAGER_INACTIVE");}
  function scpAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||value.data?.deviceId!==deviceId||value.data?.state!=="active")scpFail("SEASON_COMMIT_DEVICE_INACTIVE");}
  function scpAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||value.data?.connectionState!=="active")scpFail("SEASON_COMMIT_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)scpFail("SEASON_COMMIT_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(slot=>authorized.includes(slot.accountId)))scpFail("SEASON_COMMIT_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)scpFail("SEASON_COMMIT_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actorRole:actor.slotId});
  }
  function scpAssertSession(value,rivalryId,sessionId,authorized,now){const members=value?.data?.memberAccountIds,expires=scpTimestampMillis(value?.data?.expiresAt);if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||value.data?.rivalryId!==rivalryId||value.data?.state!=="active"||!Array.isArray(members)||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires)||now>=expires)scpFail("SEASON_COMMIT_ACTIVE_SESSION_REQUIRED");}
  function scpAssertSetup(value,rivalryId,seasonNumber){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||seasonNumber>value.totalSeasons||!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return value;}
  function scpAssertPublicResults(value,rivalryId,seasonNumber){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r9"||value.phase!=="RESULTS_READY"||value.revision!==2)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");for(const key of ["publishedRoles","operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==2)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");}if(new Set(value.publishedRoles).size!==2||!ROLES.every(role=>value.publishedRoles.includes(role))||new Set(value.operationIds).size!==2||value.operationIds.some(id=>!RESULT_OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return value;}
  function scpAssertPrivateResult(value,rivalryId,seasonNumber,role){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!RESULT_OPERATION.test(value.operationId||"")||!HASH.test(value.commandHash||""))scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return {...value,result:scpResult(value.result)};}

  async function scpReadyState(publicResult,privateResults,cryptoImpl){
    const receipts=publicResult.actorRoles.map((role,index)=>{const own=privateResults[role];if(!own||own.operationId!==publicResult.operationIds[index]||publicResult.publishedRoles[index]!==role)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return {operationId:publicResult.operationIds[index],baseRevision:publicResult.baseRevisions[index],actorRole:role,type:"publish-result",commandHash:own.commandHash};});
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r9",seasonNumber:publicResult.seasonNumber,phase:"RESULTS_READY",revision:2,publishedRoles:[...publicResult.publishedRoles],results:{playerOne:scpResult(privateResults.playerOne.result),playerTwo:scpResult(privateResults.playerTwo.result)},receipts};
    const contentHash=await scpHash(core,cryptoImpl),state={...core,contentHash};
    if(!resultsModule||typeof resultsModule.createProtocol!=="function")scpFail("SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE");
    const protocol=await resultsModule.createProtocol({teamCount:20,cryptoImpl});
    try{await protocol.verifyState(state);}catch(_error){scpFail("SEASON_COMMIT_RESULTS_NOT_READY");}
    return scpFreeze(state);
  }
  async function scpCoreFromStorage(value,ready,cryptoImpl){
    scpExact(value,COMMIT_KEYS,"SEASON_COMMIT_PROVIDER_STATE_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.runtimeRevision!==RUNTIME_REVISION||value.seasonNumber!==ready.seasonNumber||!["COMMITTED","ACKNOWLEDGED"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");
    scpExact(value.results,ROLES,"SEASON_COMMIT_PROVIDER_STATE_INVALID");for(const role of ROLES)scpResult(value.results[role]);
    if(JSON.stringify(value.results)!==JSON.stringify(ready.results))scpFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");}
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision-1)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");
    const receipts=value.operationIds.map((operationId,index)=>({operationId,baseRevision:value.baseRevisions[index],actorRole:value.actorRoles[index],type:index===0?"commit-season":"acknowledge-season",commandHash:value.operationHashes[index]}));
    const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:value.seasonNumber,phase:value.phase,revision:value.revision,resultsRevision:2,resultsContentHash:ready.contentHash,results:scpClone(value.results),acknowledgedRoles:[...value.acknowledgedRoles],receipts};
    const contentHash=await scpHash(core,cryptoImpl);return {...core,contentHash};
  }
  function scpStorageFromCore(state,{rivalryId,sessionId,deviceId,serverTimestamp}){return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber:state.seasonNumber,runtimeRevision:RUNTIME_REVISION,phase:state.phase,revision:state.revision,resultsRevision:state.resultsRevision,results:scpClone(state.results),acknowledgedRoles:[...state.acknowledgedRoles],operationIds:state.receipts.map(r=>r.operationId),operationHashes:state.receipts.map(r=>r.commandHash),baseRevisions:state.receipts.map(r=>r.baseRevision),actorRoles:state.receipts.map(r=>r.actorRole),activeSessionId:sessionId,updatedAt:serverTimestamp,updatedByDeviceId:deviceId};}

  async function scpContext(tx,options){
    const sdk=scpSdk(options),db=options.firestore,uid=scpUid(options.user),rivalryId=scpNormalizeRivalryId(options.rivalryId),sessionId=scpNormalizeSessionId(options.sessionId),deviceId=scpNormalizeDeviceId(options.deviceId),seasonNumber=scpSeason(options.seasonNumber),now=scpNow(options.nowEpochMs),seasonId=`season_${seasonNumber}`;
    const accountRef=scpPath(sdk,db,"accounts",uid),deviceRef=scpPath(sdk,db,"accounts",uid,"devices",deviceId),rivalryRef=scpPath(sdk,db,"rivalries",rivalryId),sessionRef=scpPath(sdk,db,"rivalries",rivalryId,"sessions",sessionId),setupRef=scpPath(sdk,db,"rivalries",rivalryId,"sharedSetup","authoritative"),publicRef=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId),p1Ref=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId,"roles","playerOne"),p2Ref=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId,"roles","playerTwo"),commitRef=scpPath(sdk,db,"rivalries",rivalryId,"seasonCommits",seasonId);
    scpAssertAccount(await scpGet(tx,accountRef),uid);scpAssertDevice(await scpGet(tx,deviceRef),deviceId);const rivalry=scpAssertRivalry(await scpGet(tx,rivalryRef),rivalryId,uid);scpAssertSession(await scpGet(tx,sessionRef),rivalryId,sessionId,rivalry.authorized,now);const setup=scpAssertSetup(await scpGet(tx,setupRef),rivalryId,seasonNumber);const publicResult=scpAssertPublicResults(await scpGet(tx,publicRef),rivalryId,seasonNumber);const p1=scpAssertPrivateResult(await scpGet(tx,p1Ref),rivalryId,seasonNumber,"playerOne"),p2=scpAssertPrivateResult(await scpGet(tx,p2Ref),rivalryId,seasonNumber,"playerTwo");const ready=await scpReadyState(publicResult,{playerOne:p1,playerTwo:p2},options.cryptoImpl||root.crypto);const stored=await scpGet(tx,commitRef);
    return {sdk,db,uid,rivalryId,sessionId,deviceId,seasonNumber,seasonId,actorRole:rivalry.actorRole,setup,ready,stored,commitRef};
  }
  async function scpRun(type,options){
    try{
      const sdk=scpSdk(options),operationId=scpOperation(options.operationId),baseRevision=scpBase(options.baseRevision),cryptoImpl=options.cryptoImpl||root.crypto;
      return await sdk.runTransaction(options.firestore,async tx=>{
        const ctx=await scpContext(tx,options),protocol=await commitModule.createProtocol({teamCount:20,cryptoImpl,seasonResultsModule:resultsModule});
        let current=null;if(ctx.stored){current=await scpCoreFromStorage(ctx.stored,ctx.ready,cryptoImpl);try{current=await protocol.verifyState(current);}catch(_error){scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");}}
        const applied=await protocol.apply({state:current,setup:ctx.setup,seasonResults:ctx.ready,seasonNumber:ctx.seasonNumber,actorRole:ctx.actorRole,command:{type,operationId,baseRevision}});
        if(!applied.idempotent){tx.set(ctx.commitRef,scpStorageFromCore(applied.state,{rivalryId:ctx.rivalryId,sessionId:ctx.sessionId,deviceId:ctx.deviceId,serverTimestamp:sdk.serverTimestamp()}));}
        return scpFreeze({ok:true,replayed:Boolean(applied.idempotent),revision:applied.state.revision,phase:applied.state.phase,state:protocol.projectForRole(applied.state,ctx.actorRole)});
      });
    }catch(error){return scpResultError(error);}
  }
  async function scpRead(options){
    try{
      const sdk=scpSdk(options),cryptoImpl=options.cryptoImpl||root.crypto;
      return await sdk.runTransaction(options.firestore,async tx=>{const ctx=await scpContext(tx,options);if(!ctx.stored)return scpFreeze({ok:true,committed:false,ready:true,managerRole:ctx.actorRole,seasonNumber:ctx.seasonNumber,phase:"RESULTS_READY",revision:0,results:scpClone(ctx.ready.results),coordinatorRole:ctx.setup.coordinatorRole});const protocol=await commitModule.createProtocol({teamCount:20,cryptoImpl,seasonResultsModule:resultsModule});let current=await scpCoreFromStorage(ctx.stored,ctx.ready,cryptoImpl);current=await protocol.verifyState(current);return scpFreeze({ok:true,committed:true,ready:true,coordinatorRole:ctx.setup.coordinatorRole,...protocol.projectForRole(current,ctx.actorRole)});});
    }catch(error){return scpResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-season-commit",runtimeRevision:RUNTIME_REVISION,commitSeason:options=>scpRun("commit-season",options),acknowledgeSeason:options=>scpRun("acknowledge-season",options),read:scpRead,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true,storagePath:"rivalries/{rivalryId}/seasonCommits/{seasonId}"});
});