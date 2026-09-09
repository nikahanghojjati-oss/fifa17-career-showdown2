(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const resultsModule=typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults;
  const setupModule=typeof require==="function"?require("./sharedShowdownSetup.js"):root.CareerModeSharedShowdownSetup;
  const catalogModule=typeof require==="function"?require("./sharedShowdownCatalog.js"):root.CareerModeSharedShowdownCatalog;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","publishedRoles",
    "operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","result","operationId","commandHash",
    "activeSessionId","publishedAt","updatedByDeviceId"
  ]);
  const SETUP_LEDGER_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole",
    "operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons",
    "confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const TRANSFER_PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
    "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
    "activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const TRANSFER_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);

  function ssrpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrpResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_RESULTS_PROVIDER_FAILED"});}
  function ssrpSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function ssrpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function ssrpExact(value,keys,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!ssrpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrpFail(code);return value;}
  function ssrpClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrpFreeze);Object.freeze(value);}return value;}
  function ssrpCanonical(value){if(Array.isArray(value))return `[${value.map(ssrpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function ssrpHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrpFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrpCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function ssrpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_RIVALRY_INVALID");return id;}
  function ssrpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_SESSION_INVALID");return id;}
  function ssrpNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))ssrpFail("SEASON_RESULTS_DEVICE_INACTIVE");return id;}
  function ssrpNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))ssrpFail("SEASON_RESULTS_COMMAND_INVALID");return id;}
  function ssrpAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)ssrpFail("SEASON_RESULTS_AUTH_REQUIRED");return id;}
  function ssrpEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)ssrpFail("SEASON_RESULTS_CLOCK_INVALID");return n;}
  function ssrpTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function ssrpServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function ssrpValidateSdk(options){if(!options.firestore)ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");}}
  function ssrpRoleList(value,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrpFail(code);return value;}
  function ssrpResultShape(value,teamCount){
    ssrpExact(value,RESULT_KEYS,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
    const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals);
    if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>114||!Number.isInteger(goals)||goals<0||goals>300)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");}
    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist};
  }

  function ssrpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrpFail("SEASON_RESULTS_MANAGER_INACTIVE");}
  function ssrpAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")ssrpFail("SEASON_RESULTS_DEVICE_INACTIVE");}
  function ssrpAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")ssrpFail("SEASON_RESULTS_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)ssrpFail("SEASON_RESULTS_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string"||!/^profile_[0-9a-f]{24}$/.test(item.profileId||"")||!/^save_[0-9a-f]{24}$/.test(item.saveId||"")))ssrpFail("SEASON_RESULTS_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId))||!authorized.every(id=>ordered.some(item=>item.accountId===id)))ssrpFail("SEASON_RESULTS_TWO_MANAGERS_REQUIRED");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)ssrpFail("SEASON_RESULTS_ACTOR_NOT_ENTITLED");
    return Object.freeze({slots:ordered,authorized,actor});
  }
  function ssrpAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)ssrpFail("SEASON_RESULTS_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=ssrpTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires)||now>=expires)ssrpFail("SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");
  }
  function ssrpAssertSetupLedger(value,rivalryId){
    ssrpExact(value,SETUP_LEDGER_KEYS,"SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==6)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");}
    const expectedTypes=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
    if(new Set(value.operationIds).size!==6||value.operationIds.some(id=>!/^setup_op_[0-9a-f]{32}$/.test(id))||value.operationTypes.some((type,index)=>type!==expectedTypes[index])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||JSON.stringify(value.confirmedRoles)!==JSON.stringify(value.actorRoles.slice(4))||new Set(value.confirmedRoles).size!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    return value;
  }
  function ssrpAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")ssrpFail("SEASON_RESULTS_CAREER_START_NOT_READY");
    if(!Array.isArray(value.setupOperationIds)||JSON.stringify(value.setupOperationIds)!==JSON.stringify(setup.operationIds)||!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrpFail("SEASON_RESULTS_CAREER_START_NOT_READY");
    return value;
  }
  function ssrpAssertTransfer(value,rivalryId,seasonNumber,setup){
    ssrpExact(value,TRANSFER_PUBLIC_KEYS,"SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r8"||value.coordinatorRole!==setup.coordinatorRole||value.phase!=="COMPLETED"||value.revision!==7)ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(!Array.isArray(value.guessLockedRoles)||value.guessLockedRoles.length!==2||!ROLES.every(role=>value.guessLockedRoles.includes(role))||!Array.isArray(value.signingLockedRoles)||value.signingLockedRoles.length!==2||!ROLES.every(role=>value.signingLockedRoles.includes(role)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==7)ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");}
    if(new Set(value.operationIds).size!==7||value.operationIds.some(id=>!/^transfer_op_[0-9a-f]{32}$/.test(id))||value.operationTypes.some(type=>!TRANSFER_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(value.endedAt===null||!Number.isFinite(ssrpTimestampMillis(value.startedAt))||!Number.isFinite(ssrpTimestampMillis(value.endedAt)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    return value;
  }

  function ssrpAuthority({rivalryId,rivalry,role,sessionId,deviceId,now,hostRole}){
    const slot=rivalry.slots.find(item=>item.slotId===role),host=rivalry.slots.find(item=>item.slotId===hostRole);
    if(!slot||!host)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    return {
      rivalryId,connectionState:"active",
      managerSlots:rivalry.slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"})),
      actor:{accountId:slot.accountId,deviceId,deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},
      session:{sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Math.max(now+1,Number.MAX_SAFE_INTEGER-1)},
      nowEpochMs:now
    };
  }
  async function ssrpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,now,cryptoImpl){
    if(!setupModule||typeof setupModule.createProtocol!=="function"||!catalogModule||catalogModule.version!=="shared-showdown-catalog-v1"||!catalogModule.catalog)ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
    const setupProtocol=await setupModule.createProtocol({catalog:catalogModule.catalog,cryptoImpl});
    let state=null;
    for(let index=0;index<ledger.revision;index++){
      const type=ledger.operationTypes[index],role=ledger.actorRoles[index],authority=ssrpAuthority({rivalryId,rivalry,role,sessionId,deviceId,now,hostRole:ledger.coordinatorRole});
      let command;
      if(type==="commit-league"||type==="commit-clubs")command=await setupProtocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});
      else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};
      else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await setupProtocol.confirmationHash(state)};
      else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};
      const applied=await setupProtocol.apply({state,authority,command});
      if(!applied.ok)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");state=applied.state;
    }
    if(!state||state.phase!=="SHOWDOWN_CONFIRMED"||state.revision!==6||!catalogModule.catalog[state.leagueId])ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    return state;
  }

  function ssrpPublicState(value,rivalryId,seasonNumber){
    if(!value)return null;ssrpExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==resultsModule.runtimeRevision||!["COLLECTING","RESULTS_READY"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>2)ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    ssrpRoleList(value.publishedRoles);
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");}
    if(value.publishedRoles.length!==value.revision||new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some((role,index)=>!ROLES.includes(role)||role!==value.publishedRoles[index]))ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    if((value.phase==="COLLECTING"&&value.revision!==1)||(value.phase==="RESULTS_READY"&&value.revision!==2))ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    return ssrpFreeze({phase:value.phase,revision:value.revision,publishedRoles:[...value.publishedRoles],operationIds:[...value.operationIds],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function ssrpPrivateState(value,rivalryId,seasonNumber,role,teamCount){
    if(!value)return null;ssrpExact(value,PRIVATE_KEYS,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!OPERATION.test(value.operationId)||!HASH.test(value.commandHash)||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||"")||!Number.isFinite(ssrpTimestampMillis(value.publishedAt)))ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    return ssrpFreeze({result:ssrpResultShape(value.result,teamCount),operationId:value.operationId,commandHash:value.commandHash});
  }
  async function ssrpNormalizeResult(value,teamCount,setupState,career,transfer,seasonNumber,role,operationId,cryptoImpl){
    if(!resultsModule||typeof resultsModule.createProtocol!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
    const resultProtocol=await resultsModule.createProtocol({teamCount,cryptoImpl});
    const applied=await resultProtocol.apply({state:null,setup:setupState,careerStart:career,transferChallenge:transfer,seasonNumber,actorRole:role,command:{type:"publish-result",operationId,baseRevision:0,result:value}});
    if(!applied.ok||!applied.state?.results?.[role])ssrpFail("SEASON_RESULTS_PAYLOAD_INVALID");return ssrpClone(applied.state.results[role]);
  }

  async function ssrpContext(options,transaction,{readOpponent=false}={}){
    ssrpValidateSdk(options);
    const uid=ssrpAccountId(options.user),rivalryId=ssrpNormalizeRivalryId(options.rivalryId),sessionId=ssrpNormalizeSessionId(options.sessionId),deviceId=ssrpNormalizeDeviceId(options.deviceId),now=ssrpEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
    const refs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    ssrpAssertAccount(ssrpSnapshot(await transaction.get(refs.account)),uid);ssrpAssertDevice(ssrpSnapshot(await transaction.get(refs.device)),deviceId);
    const rivalry=ssrpAssertRivalry(ssrpSnapshot(await transaction.get(refs.rivalry)),rivalryId,uid);ssrpAssertSession(ssrpSnapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,now);
    const ledger=ssrpAssertSetupLedger(ssrpSnapshot(await transaction.get(refs.setup)),rivalryId),setupState=await ssrpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,now,cryptoImpl),career=ssrpAssertCareer(ssrpSnapshot(await transaction.get(refs.career)),rivalryId,ledger);
    const seasonNumber=Number(options.seasonNumber);if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>setupState.totalSeasons)ssrpFail("SEASON_RESULTS_SEASON_INVALID");
    const teamCount=catalogModule.catalog[setupState.leagueId].length,role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",seasonId=`season_${seasonNumber}`;
    refs.transfer=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",seasonId);refs.public=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId);refs.own=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",role);refs.opponent=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",opponentRole);
    const transfer=ssrpAssertTransfer(ssrpSnapshot(await transaction.get(refs.transfer)),rivalryId,seasonNumber,ledger),state=ssrpPublicState(ssrpSnapshot(await transaction.get(refs.public)),rivalryId,seasonNumber),own=ssrpPrivateState(ssrpSnapshot(await transaction.get(refs.own)),rivalryId,seasonNumber,role,teamCount);
    if(state&&state.publishedRoles.includes(role)!==Boolean(own))ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    let opponent=null;if(readOpponent){if(!state||state.phase!=="RESULTS_READY")ssrpFail("SEASON_RESULTS_PRIVATE_READ_BLOCKED");opponent=ssrpPrivateState(ssrpSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,teamCount);if(!opponent)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");}
    return Object.freeze({uid,rivalryId,sessionId,deviceId,now,sdk,db,cryptoImpl,rivalry,ledger,setupState,career,transfer,seasonNumber,teamCount,role,opponentRole,state,own,opponent,refs});
  }

  function ssrpProjection(ctx){
    const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:null,opponentResult:null,allResults:null});
    const ownResult=ctx.own?ssrpClone(ctx.own.result):null,ready=state.phase==="RESULTS_READY",opponentResult=ready&&ctx.opponent?ssrpClone(ctx.opponent.result):null;
    let allResults=null;if(ready&&opponentResult){allResults={};allResults[ctx.role]=ownResult;allResults[ctx.opponentRole]=opponentResult;}
    return ssrpFreeze({ok:true,revision:state.revision,state:ssrpClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult,opponentResult,allResults});
  }
  async function ssrpRead(options={}){
    try{ssrpValidateSdk(options);return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const base=await ssrpContext(options,transaction);if(base.state&&base.state.phase==="RESULTS_READY")return ssrpProjection(await ssrpContext(options,transaction,{readOpponent:true}));return ssrpProjection(base);});}catch(error){return ssrpResultError(error);}
  }
  async function ssrpPublishResult(options={}){
    try{
      ssrpValidateSdk(options);const operationId=ssrpNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)ssrpFail("SEASON_RESULTS_COMMAND_INVALID");
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await ssrpContext(options,transaction),current=ctx.state,revision=current?current.revision:0;
        const normalizedResult=await ssrpNormalizeResult(options.result,ctx.teamCount,ctx.setupState,ctx.career,ctx.transfer,ctx.seasonNumber,ctx.role,operationId,ctx.cryptoImpl);
        const operationHash=await ssrpHash({actorRole:ctx.role,type:"publish-result",operationId,baseRevision},ctx.cryptoImpl);
        const commandHash=await ssrpHash({actorRole:ctx.role,type:"publish-result",operationId,baseRevision,result:normalizedResult},ctx.cryptoImpl);
        if(current){
          const index=current.operationIds.indexOf(operationId);
          if(index>=0){
            if(current.operationHashes[index]!==operationHash||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role||!ctx.own||ctx.own.operationId!==operationId||ctx.own.commandHash!==commandHash)ssrpFail("SEASON_RESULTS_IDEMPOTENCY_CONFLICT");
            const projected=current.phase==="RESULTS_READY"?ssrpProjection(await ssrpContext(options,transaction,{readOpponent:true})):ssrpProjection(ctx);
            return ssrpFreeze({...projected,status:"accepted",replayed:true,needsRefresh:current.phase==="RESULTS_READY"});
          }
        }
        if(baseRevision!==revision)ssrpFail("SEASON_RESULTS_STALE_BASE_REVISION");if(current&&current.phase==="RESULTS_READY")ssrpFail("SEASON_RESULTS_ALREADY_READY");if(current&&current.publishedRoles.includes(ctx.role))ssrpFail("SEASON_RESULTS_ROLE_ALREADY_PUBLISHED");if(ctx.own)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
        const next=current?ssrpClone(current):{phase:"COLLECTING",revision:0,publishedRoles:[],operationIds:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
        next.publishedRoles.push(ctx.role);next.operationIds.push(operationId);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;if(next.revision===2)next.phase="RESULTS_READY";
        const serverNow=ssrpServerTimestamp(ctx.sdk);
        transaction.set(ctx.refs.public,{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:resultsModule.runtimeRevision,phase:next.phase,revision:next.revision,publishedRoles:[...next.publishedRoles],operationIds:[...next.operationIds],operationHashes:[...next.operationHashes],baseRevisions:[...next.baseRevisions],actorRoles:[...next.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId});
        transaction.set(ctx.refs.own,{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:ctx.role,result:normalizedResult,operationId,commandHash,activeSessionId:ctx.sessionId,publishedAt:serverNow,updatedByDeviceId:ctx.deviceId});
        return ssrpFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:ssrpClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:ssrpClone(normalizedResult),opponentResult:null,allResults:null,needsRefresh:next.phase==="RESULTS_READY"});
      });
    }catch(error){return ssrpResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-season-results",runtimeRevision:resultsModule&&resultsModule.runtimeRevision||null,read:ssrpRead,publishResult:ssrpPublishResult,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateInputsSplit:true,privateCommandHash:true,publicResultHash:false,serverClockAuthoritative:true,repositorySetupCatalog:true,callerTeamCountOverride:false});
});