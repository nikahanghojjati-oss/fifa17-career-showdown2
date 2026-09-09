(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocolModule=typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults;
  const setupProvider=typeof require==="function"?require("./sparkSharedShowdownSetup.js"):root.CareerModeSparkSharedShowdownSetup;
  const catalogModule=typeof require==="function"?require("./sharedShowdownCatalog.js"):root.CareerModeSharedShowdownCatalog;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","submittedRoles",
    "operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","completedAt","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","result","submittedAt","activeSessionId","updatedAt","updatedByDeviceId"
  ]);

  function ssrspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_RESULT_PROVIDER_FAILED"});}
  function ssrspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function ssrspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function ssrspExact(value,keys,code="SEASON_RESULT_PROVIDER_STATE_INVALID"){if(!ssrspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrspFail(code);return value;}
  function ssrspClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrspFreeze);Object.freeze(value);}return value;}
  function ssrspCanonical(value){if(Array.isArray(value))return `[${value.map(ssrspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function ssrspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrspFail("SEASON_RESULT_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function ssrspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))ssrspFail("SEASON_RESULT_RIVALRY_INVALID");return id;}
  function ssrspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))ssrspFail("SEASON_RESULT_SESSION_INVALID");return id;}
  function ssrspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))ssrspFail("SEASON_RESULT_DEVICE_INACTIVE");return id;}
  function ssrspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))ssrspFail("SEASON_RESULT_COMMAND_INVALID");return id;}
  function ssrspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)ssrspFail("SEASON_RESULT_AUTH_REQUIRED");return id;}
  function ssrspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)ssrspFail("SEASON_RESULT_CLOCK_INVALID");return n;}
  function ssrspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function ssrspServerTimestamp(sdk){if(typeof sdk.serverTimestamp==="function")return sdk.serverTimestamp();if(sdk.Timestamp&&typeof sdk.Timestamp.fromMillis==="function")return sdk.Timestamp.fromMillis(Date.now());ssrspFail("SEASON_RESULT_PROVIDER_UNAVAILABLE");}
  function ssrspValidateSdk(options){if(!options.firestore)ssrspFail("SEASON_RESULT_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")ssrspFail("SEASON_RESULT_PROVIDER_UNAVAILABLE");}if(typeof options.firebaseSdk.serverTimestamp!=="function"&&(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function"))ssrspFail("SEASON_RESULT_PROVIDER_UNAVAILABLE");}
  function ssrspRoleList(value){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");return value;}
  function ssrspSeason(value,totalSeasons){const n=Number(value);if(!Number.isInteger(n)||n<1||n>totalSeasons)ssrspFail("SEASON_RESULT_SEASON_INVALID");return n;}
  function ssrspNormalizeResult(value,teamCount){
    ssrspExact(value,RESULT_KEYS,"SEASON_RESULT_INVALID");
    const leaguePosition=Number(value.leaguePosition),leaguePoints=Number(value.leaguePoints),leagueGoals=Number(value.leagueGoals);
    if(!Number.isInteger(leaguePosition)||leaguePosition<1||leaguePosition>teamCount)ssrspFail("SEASON_RESULT_POSITION_INVALID");
    if(!Number.isSafeInteger(leaguePoints)||leaguePoints<0)ssrspFail("SEASON_RESULT_POINTS_INVALID");
    if(!Number.isSafeInteger(leagueGoals)||leagueGoals<0)ssrspFail("SEASON_RESULT_GOALS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrspFail("SEASON_RESULT_ACHIEVEMENT_INVALID");}
    return Object.freeze({leaguePosition,leaguePoints,leagueGoals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist});
  }
  function ssrspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrspFail("SEASON_RESULT_MANAGER_INACTIVE");}
  function ssrspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")ssrspFail("SEASON_RESULT_DEVICE_INACTIVE");}
  function ssrspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")ssrspFail("SEASON_RESULT_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)ssrspFail("SEASON_RESULT_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))ssrspFail("SEASON_RESULT_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)ssrspFail("SEASON_RESULT_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function ssrspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)ssrspFail("SEASON_RESULT_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=ssrspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires)||now>=expires)ssrspFail("SEASON_RESULT_ACTIVE_SESSION_REQUIRED");
  }
  function ssrspAssertSetupLedger(value,rivalryId,resolvedSetup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||![1,3,5,10].includes(value.totalSeasons))ssrspFail("SEASON_RESULT_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role))||resolvedSetup.phase!=="SHOWDOWN_CONFIRMED"||resolvedSetup.revision!==6||resolvedSetup.totalSeasons!==value.totalSeasons)ssrspFail("SEASON_RESULT_SETUP_NOT_CONFIRMED");return value;
  }
  function ssrspAssertCareer(value,rivalryId,setupLedger){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setupLedger.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")ssrspFail("SEASON_RESULT_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrspFail("SEASON_RESULT_CAREER_START_NOT_READY");return value;
  }
  function ssrspAssertTransfer(value,rivalryId,seasonNumber){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r8"||value.phase!=="COMPLETED")ssrspFail("SEASON_RESULT_TRANSFER_NOT_COMPLETE");
    if(!Array.isArray(value.guessLockedRoles)||value.guessLockedRoles.length!==2||!ROLES.every(role=>value.guessLockedRoles.includes(role))||!Array.isArray(value.signingLockedRoles)||value.signingLockedRoles.length!==2||!ROLES.every(role=>value.signingLockedRoles.includes(role)))ssrspFail("SEASON_RESULT_TRANSFER_NOT_COMPLETE");return value;
  }
  function ssrspAssertPrevious(value,rivalryId,seasonNumber){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber-1||value.runtimeRevision!==protocolModule.runtimeRevision||value.phase!=="COMPLETED"||value.revision!==2)ssrspFail("SEASON_RESULT_PREVIOUS_SEASON_REQUIRED");
  }
  function ssrspPublicState(value,rivalryId,seasonNumber){
    if(!value)return null;ssrspExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocolModule.runtimeRevision||!(["RESULT_ENTRY","COMPLETED"].includes(value.phase))||!Number.isInteger(value.revision)||value.revision<1||value.revision>2)ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");
    ssrspRoleList(value.submittedRoles);
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");}
    if(value.submittedRoles.length!==value.revision||new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some((role,index)=>role!==value.submittedRoles[index]))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");
    const completedAtEpochMs=value.completedAt===null?null:ssrspTimestampMillis(value.completedAt);
    if(value.phase==="RESULT_ENTRY"&&(value.revision!==1||value.completedAt!==null))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.revision!==2||value.submittedRoles.length!==2||!Number.isFinite(completedAtEpochMs)))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");
    return ssrspFreeze({phase:value.phase,revision:value.revision,submittedRoles:[...value.submittedRoles],operationIds:[...value.operationIds],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles],completedAtEpochMs});
  }
  function ssrspPrivateState(value,rivalryId,seasonNumber,role,teamCount){
    if(!value)return null;ssrspExact(value,PRIVATE_KEYS,"SEASON_RESULT_PRIVATE_STATE_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");
    const submittedAtEpochMs=ssrspTimestampMillis(value.submittedAt);if(!Number.isFinite(submittedAtEpochMs)||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");
    return ssrspFreeze({result:ssrspNormalizeResult(value.result,teamCount),submittedAtEpochMs});
  }
  async function ssrspResolvedSetup(options){
    if(!protocolModule||typeof protocolModule.createProtocol!=="function"||!setupProvider||typeof setupProvider.read!=="function"||!catalogModule||catalogModule.version!=="shared-showdown-catalog-v1"||!catalogModule.catalog)ssrspFail("SEASON_RESULT_PROVIDER_UNAVAILABLE");
    const result=await setupProvider.read(options);if(!result||result.ok!==true||!result.state)ssrspFail(result&&result.code||"SEASON_RESULT_SETUP_NOT_CONFIRMED");
    const setup=result.state,clubs=catalogModule.catalog[setup.leagueId];if(setup.phase!=="SHOWDOWN_CONFIRMED"||setup.revision!==6||!Array.isArray(clubs)||clubs.length<2||clubs.length>20)ssrspFail("SEASON_RESULT_SETUP_NOT_CONFIRMED");
    return Object.freeze({setup,teamCount:clubs.length});
  }
  async function ssrspContext(options,transaction,resolved,{readOpponent=false}={}){
    ssrspValidateSdk(options);const uid=ssrspAccountId(options.user),rivalryId=ssrspNormalizeRivalryId(options.rivalryId),sessionId=ssrspNormalizeSessionId(options.sessionId),deviceId=ssrspNormalizeDeviceId(options.deviceId),now=ssrspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    ssrspAssertAccount(ssrspSnapshot(await transaction.get(baseRefs.account)),uid);ssrspAssertDevice(ssrspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=ssrspAssertRivalry(ssrspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);ssrspAssertSession(ssrspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setupLedger=ssrspAssertSetupLedger(ssrspSnapshot(await transaction.get(baseRefs.setup)),rivalryId,resolved.setup);ssrspAssertCareer(ssrspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setupLedger);const seasonNumber=ssrspSeason(options.seasonNumber,setupLedger.totalSeasons),seasonId=`season_${seasonNumber}`;
    const refs={...baseRefs,transfer:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",seasonId),public:sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId),own:null,opponent:null,previous:seasonNumber>1?sdk.doc(db,"rivalries",rivalryId,"seasonResults",`season_${seasonNumber-1}`):null};
    ssrspAssertTransfer(ssrspSnapshot(await transaction.get(refs.transfer)),rivalryId,seasonNumber);if(refs.previous)ssrspAssertPrevious(ssrspSnapshot(await transaction.get(refs.previous)),rivalryId,seasonNumber);
    const role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne";refs.own=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",role);refs.opponent=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",opponentRole);
    const publicState=ssrspPublicState(ssrspSnapshot(await transaction.get(refs.public)),rivalryId,seasonNumber),own=ssrspPrivateState(ssrspSnapshot(await transaction.get(refs.own)),rivalryId,seasonNumber,role,resolved.teamCount);let opponent=null;
    if(publicState){const ownSubmitted=publicState.submittedRoles.includes(role);if(ownSubmitted!==Boolean(own))ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");}
    if(readOpponent){if(!publicState||publicState.phase!=="COMPLETED")ssrspFail("SEASON_RESULT_PRIVATE_READ_BLOCKED");opponent=ssrspPrivateState(ssrspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,resolved.teamCount);if(!opponent)ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");}
    return Object.freeze({uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setupLedger,setup:resolved.setup,teamCount:resolved.teamCount,seasonNumber,role,opponentRole,publicState,own,opponent,refs});
  }
  async function ssrspProtocolProjection(ctx,cryptoImpl){
    const publicState=ctx.publicState;if(!publicState)return ssrspFreeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:null,opponentResult:null,scoring:null,winner:null,finalRecord:null});
    if(publicState.phase!=="COMPLETED")return ssrspFreeze({ok:true,revision:publicState.revision,state:ssrspClone(publicState),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:ctx.own?ssrspClone(ctx.own.result):null,opponentResult:null,scoring:null,winner:null,finalRecord:null});
    if(!ctx.own||!ctx.opponent)ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");
    const protocol=await protocolModule.createProtocol({teamCount:ctx.teamCount,cryptoImpl});let state=null;
    const privateByRole={[ctx.role]:ctx.own,[ctx.opponentRole]:ctx.opponent};
    for(let index=0;index<publicState.revision;index+=1){const actorRole=publicState.actorRoles[index],privateState=privateByRole[actorRole];if(!privateState)ssrspFail("SEASON_RESULT_PRIVATE_STATE_INVALID");const applied=await protocol.apply({state,setup:ctx.setup,careerStart:{phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]},transferChallenge:{phase:"COMPLETED",seasonNumber:ctx.seasonNumber,guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerOne","playerTwo"]},previousSeasonComplete:true,seasonNumber:ctx.seasonNumber,actorRole,command:{type:"submit-result",operationId:publicState.operationIds[index],baseRevision:publicState.baseRevisions[index],result:privateState.result},nowEpochMs:privateState.submittedAtEpochMs});if(!applied||applied.ok!==true)ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");state=applied.state;if(state.receipts[index].commandHash!==publicState.operationHashes[index])ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");}
    if(!state||state.phase!==publicState.phase||state.revision!==publicState.revision||JSON.stringify(state.submittedRoles)!==JSON.stringify(publicState.submittedRoles))ssrspFail("SEASON_RESULT_PROVIDER_STATE_INVALID");const projection=protocol.projectForRole(state,ctx.role),finalRecord=protocol.buildFinalRecord(state);
    return ssrspFreeze({ok:true,revision:state.revision,state:ssrspClone(publicState),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:ssrspClone(projection.ownResult),opponentResult:ssrspClone(projection.opponentResult),scoring:ssrspClone(projection.scoring),winner:projection.winner,finalRecord:ssrspClone(finalRecord)});
  }
  function ssrspPublicLedger(next,ctx,serverNow){return {schemaVersion:1,objectType:"sharedSeasonResults",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocolModule.runtimeRevision,phase:next.phase,revision:next.revision,submittedRoles:[...next.submittedRoles],operationIds:[...next.operationIds],operationHashes:[...next.operationHashes],baseRevisions:[...next.baseRevisions],actorRoles:[...next.actorRoles],activeSessionId:ctx.sessionId,completedAt:next.phase==="COMPLETED"?serverNow:null,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};}
  function ssrspPrivateLedger(result,ctx,serverNow){return {schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:ctx.role,result:ssrspClone(result),submittedAt:serverNow,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};}
  async function ssrspRead(options={}){
    try{ssrspValidateSdk(options);const resolved=await ssrspResolvedSetup(options),cryptoImpl=options.cryptoImpl||root.crypto;return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const base=await ssrspContext(options,transaction,resolved);if(base.publicState&&base.publicState.phase==="COMPLETED"){const full=await ssrspContext(options,transaction,resolved,{readOpponent:true});return ssrspProtocolProjection(full,cryptoImpl);}return ssrspProtocolProjection(base,cryptoImpl);});}catch(error){return ssrspResultError(error);}
  }
  async function ssrspSubmit(options={}){
    try{
      ssrspValidateSdk(options);const resolved=await ssrspResolvedSetup(options),operationId=ssrspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)ssrspFail("SEASON_RESULT_COMMAND_INVALID");const normalized=ssrspNormalizeResult(options.result,resolved.teamCount),cryptoImpl=options.cryptoImpl||root.crypto;
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const ctx=await ssrspContext(options,transaction,resolved),current=ctx.publicState,revision=current?current.revision:0;const operationHash=await ssrspHash({actorRole:ctx.role,type:"submit-result",operationId,baseRevision,result:normalized},cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){if(current.operationHashes[index]!==operationHash||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)ssrspFail("SEASON_RESULT_IDEMPOTENCY_CONFLICT");return ssrspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:ssrspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
        if(baseRevision!==revision)ssrspFail("SEASON_RESULT_STALE_BASE_REVISION");if(current&&current.phase==="COMPLETED")ssrspFail("SEASON_RESULT_ALREADY_COMPLETED");if(current&&current.submittedRoles.includes(ctx.role))ssrspFail("SEASON_RESULT_ALREADY_SUBMITTED");
        const next=current?ssrspClone(current):{phase:"RESULT_ENTRY",revision:0,submittedRoles:[],operationIds:[],operationHashes:[],baseRevisions:[],actorRoles:[],completedAtEpochMs:null};next.submittedRoles.push(ctx.role);next.operationIds.push(operationId);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;if(next.submittedRoles.length===2)next.phase="COMPLETED";
        const serverNow=ssrspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.own,ssrspPrivateLedger(normalized,ctx,serverNow));transaction.set(ctx.refs.public,ssrspPublicLedger(next,ctx,serverNow));return ssrspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:ssrspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:next.phase==="COMPLETED"});});
    }catch(error){return ssrspResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-season-results",runtimeRevision:protocolModule&&protocolModule.runtimeRevision||"1.9.1-r9",read:ssrspRead,submit:ssrspSubmit,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateResultsSplit:true,repositoryTeamCount:true,callerTeamCountOverride:false});
});
