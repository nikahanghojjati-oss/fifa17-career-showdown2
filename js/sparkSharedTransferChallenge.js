(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedTransferChallenge.js"):root.CareerModeSharedTransferChallenge;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
    "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
    "activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings",
    "guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  // JOB-1051: a role document written by r66 has exactly PRIVATE_KEYS (no salts); a new one has PRIVATE_KEYS plus both salt keys.
  const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
  const SALT=/^[0-9a-f]{64}$/;
  // r87 (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's Russian
  // Roster Roulette. Before the window opens, the season's public document may exist as a small pre-window mark document:
  // each manager adds his own role to spins (one merge write, no read) when he confirms his release. START needs both;
  // starting the window replaces the document with the normal ledger (exactly PUBLIC_KEYS, so no other reader changes).
  const SPIN_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","phase","spins","updatedAt"]);
  // F2-02 (Fable job 2): a mark records that season's outcome for its manager (js/rosterRoulette.js outcome): fired, hitName,
  // hitNumber, hitSlot (0-14) and the engine and data version. A mark from a phone that ran no roulette (switched off, no
  // confirm time) is plain true. Each manager writes his own entry once (the Rules refuse a second write).
  const OUTCOME_KEYS=Object.freeze(["fired","hitName","hitNumber","hitSlot","version"]);
  const OUTCOME_VERSION=/^rr[0-9]{1,3}\.[0-9]{1,4}\.[0-9a-f]{8}$/;
  // The durable copy START makes of both marks (the mark document itself is replaced by the ledger), so later seasons replay the
  // saved shots: rivalries/{rid}/transferChallenges/season_N/roulette/spins, written once, never changed.
  const RECORD_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","spins"]);
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const CANONICAL_LEAGUE_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES:[]).map(item=>item&&item.id).filter(Boolean));
  const CANONICAL_NATIONALITY_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES:[]).map(item=>item&&item.id).filter(Boolean));

  function stspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"TRANSFER_PROVIDER_FAILED"});}
  function stspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function stspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stspExact(value,keys,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!stspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stspFail(code);return value;}
  function stspClone(value){return JSON.parse(JSON.stringify(value));}
  function stspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stspFreeze);Object.freeze(value);}return value;}
  function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function stspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  // JOB-1051: 32 random bytes, hex. Stored only in the actor's own private role document (unreadable by the rival until COMPLETED).
  function stspNewSalt(cryptoImpl){if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");}
  function stspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_RIVALRY_INVALID");return id;}
  function stspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_SESSION_INVALID");return id;}
  function stspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))stspFail("TRANSFER_DEVICE_INACTIVE");return id;}
  function stspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))stspFail("TRANSFER_COMMAND_INVALID");return id;}
  function stspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stspFail("TRANSFER_AUTH_REQUIRED");return id;}
  function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
  function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
  // RT5-FLOW-02 eligibility, shared by this provider, the Transfer Challenge UI and (by its fromMs) js/rosterRouletteStep.js:
  // the roulette runs for a Showdown whose Setup was confirmed at or after RRR_FROM_MS, unless CMS_ROSTER_ROULETTE is "off".
  const ROULETTE_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs)&&confirmedAtMs>=ROULETTE_FROM_MS&&root.CMS_ROSTER_ROULETTE!=="off";}
  function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
  function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function stspValidateSdk(options){if(!options.firestore)stspFail("TRANSFER_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}if(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}
  function stspRoleList(value,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stspFail(code);return value;}
  function stspCatalog(){
    if(CANONICAL_LEAGUE_IDS.length!==36||CANONICAL_NATIONALITY_IDS.length!==164)stspFail("TRANSFER_CATALOG_UNAVAILABLE");
    return Object.freeze({leagueIds:new Set(CANONICAL_LEAGUE_IDS),nationalityIds:new Set(CANONICAL_NATIONALITY_IDS)});
  }
  function stspNormalizeGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_GUESSES_INVALID");const slots=new Set();
    return value.map(item=>{stspExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_GUESSES_INVALID");slots.add(item.slot);if(item.type!=="league"&&item.type!=="nationality")stspFail("TRANSFER_GUESSES_INVALID");const allowed=item.type==="league"?catalog.leagueIds:catalog.nationalityIds;if(!allowed.has(item.valueId))stspFail("TRANSFER_GUESSES_INVALID");return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function stspNormalizeSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_SIGNINGS_INVALID");const slots=new Set();
    return value.map(item=>{const hasOverall=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall")),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));/* r87: optional FIFA 17 overall (30-99) and position */stspExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");if(hasPosition&&!["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"].includes(item.position))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasOverall&&!(Number.isInteger(item.overall)&&item.overall>=30&&item.overall<=99))stspFail("TRANSFER_SIGNINGS_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_SIGNINGS_INVALID");slots.add(item.slot);if(typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))stspFail("TRANSFER_SIGNINGS_INVALID");const row={slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;return row;}).sort((a,b)=>a.slot-b.slot);
  }
  function stspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")stspFail("TRANSFER_MANAGER_INACTIVE");}
  function stspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")stspFail("TRANSFER_DEVICE_INACTIVE");}
  function stspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")stspFail("TRANSFER_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)stspFail("TRANSFER_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))stspFail("TRANSFER_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)stspFail("TRANSFER_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function stspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)stspFail("TRANSFER_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
  }
  function stspAssertSetup(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");return value;
  }
  function stspAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")stspFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stspFail("TRANSFER_CAREER_START_NOT_READY");return value;
  }
  // The pre-window mark document: null when it is absent or the ledger has started, else the roles that have spun (in role order).
  function stspIsPreWindow(value){return stspPlain(value)&&value.phase==="NOT_STARTED";}
  // A valid outcome (frozen copy), or null.
  function stspOutcome(value){
    if(!stspPlain(value)||Object.keys(value).length!==OUTCOME_KEYS.length||OUTCOME_KEYS.some(key=>!Object.hasOwn(value,key)))return null;
    if(typeof value.fired!=="boolean"||typeof value.version!=="string"||!OUTCOME_VERSION.test(value.version))return null;
    if(value.fired){
      if(typeof value.hitName!=="string"||!value.hitName||value.hitName!==value.hitName.trim()||value.hitName.length>80||!Number.isInteger(value.hitSlot)||value.hitSlot<0||value.hitSlot>14||!(value.hitNumber===null||(Number.isInteger(value.hitNumber)&&value.hitNumber>=0&&value.hitNumber<=99)))return null;
    }else if(value.hitName!==null||value.hitNumber!==null||value.hitSlot!==null)return null;
    return Object.freeze({fired:value.fired,hitName:value.hitName,hitNumber:value.hitNumber,hitSlot:value.hitSlot,version:value.version});
  }
  // {playerOne, playerTwo}: each manager's stored entry (true, or his outcome), or null when he has none.
  function stspSpinEntries(spins){
    if(!stspPlain(spins)||Object.keys(spins).some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const entries={};
    for(const role of ROLES){
      if(!Object.hasOwn(spins,role)){entries[role]=null;continue;}
      const entry=spins[role]===true?true:stspOutcome(spins[role]);
      if(!entry)stspFail("TRANSFER_PROVIDER_STATE_INVALID");entries[role]=entry;
    }
    return Object.freeze(entries);
  }
  function stspSpinMarks(value,rivalryId,seasonNumber){
    if(!stspIsPreWindow(value))return null;stspExact(value,SPIN_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspSpinEntries(value.spins);
  }
  function stspSpins(value,rivalryId,seasonNumber){const marks=stspSpinMarks(value,rivalryId,seasonNumber);return marks?ROLES.filter(role=>marks[role]!==null):null;}
  function stspPublicState(value,rivalryId,seasonNumber,setup){
    if(!value||stspIsPreWindow(value))return null;stspExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocol.runtimeRevision||value.coordinatorRole!==setup.coordinatorRole||!protocol.phases.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>7)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const startedAtEpochMs=stspTimestampMillis(value.startedAt),endedAtEpochMs=value.endedAt===null?null:stspTimestampMillis(value.endedAt);if(!Number.isFinite(startedAtEpochMs)||(value.endedAt!==null&&!Number.isFinite(endedAtEpochMs)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    stspRoleList(value.endRequestedRoles);stspRoleList(value.guessLockedRoles);stspRoleList(value.signingLockedRoles);
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)stspFail("TRANSFER_PROVIDER_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="WINDOW_OPEN"&&(value.endedAt!==null||value.guessLockedRoles.length||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.endedAt===null||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspFreeze({seasonNumber,coordinatorRole:value.coordinatorRole,phase:value.phase,revision:value.revision,startedAtEpochMs,endedAtEpochMs,endRequestedRoles:[...value.endRequestedRoles],guessLockedRoles:[...value.guessLockedRoles],signingLockedRoles:[...value.signingLockedRoles],operationIds:[...value.operationIds],operationTypes:[...value.operationTypes],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function stspPrivateState(value,rivalryId,seasonNumber,role,catalog){
    if(!value)return null;
    const salted=stspPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);stspExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guesses=value.guesses===null?null:stspNormalizeGuesses(value.guesses,catalog),signings=value.signings===null?null:stspNormalizeSignings(value.signings,catalog),guessLockedAtEpochMs=value.guessLockedAt===null?null:stspTimestampMillis(value.guessLockedAt),signingLockedAtEpochMs=value.signingLockedAt===null?null:stspTimestampMillis(value.signingLockedAt);
    if((guesses===null)!==(guessLockedAtEpochMs===null)||(signings===null)!==(signingLockedAtEpochMs===null)||(guessLockedAtEpochMs!==null&&!Number.isFinite(guessLockedAtEpochMs))||(signingLockedAtEpochMs!==null&&!Number.isFinite(signingLockedAtEpochMs))||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guessSalt=salted?value.guessSalt:null,signingSalt=salted?value.signingSalt:null;
    // A salt exists only together with the lock it belongs to, and is exactly 64 lowercase hex characters.
    for(const [salt,locked] of [[guessSalt,guesses],[signingSalt,signings]])if(salt!==null&&(typeof salt!=="string"||!SALT.test(salt)||locked===null))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    return stspFreeze({guesses,signings,guessLockedAtEpochMs,signingLockedAtEpochMs,guessSalt,signingSalt});
  }
  function stspPublicLedger(state,ctx,serverNow,type){
    const prior=ctx.publicValue||null,startedAt=type==="start-window"?serverNow:(prior?.startedAt||stspTimestamp(ctx.sdk,state.startedAtEpochMs));let endedAt=null;
    if(state.endedAtEpochMs!==null){
      const earlyEnd=type==="request-end-window"&&state.phase==="GUESS_ENTRY"&&state.endRequestedRoles.length===2;
      if(earlyEnd||type==="advance-expired-window")endedAt=serverNow;
      else endedAt=prior?.endedAt||stspTimestamp(ctx.sdk,state.endedAtEpochMs);
    }
    return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocol.runtimeRevision,coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt,endedAt,endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:[...state.operationIds],operationTypes:[...state.operationTypes],operationHashes:[...state.operationHashes],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};
  }
  function stspPrivateLedger(privateState,ctx,role,serverNow,type){
    const prior=ctx.ownValue||null;
    const guessLockedAt=type==="lock-guesses"?serverNow:(prior?.guessLockedAt||(privateState.guessLockedAtEpochMs===null||privateState.guessLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.guessLockedAtEpochMs)));
    const signingLockedAt=type==="lock-signings"?serverNow:(prior?.signingLockedAt||(privateState.signingLockedAtEpochMs===null||privateState.signingLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.signingLockedAtEpochMs)));
    return {schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:role,guesses:privateState.guesses?stspClone(privateState.guesses):null,signings:privateState.signings?stspClone(privateState.signings):null,guessLockedAt,signingLockedAt,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId,guessSalt:privateState.guessSalt||null,signingSalt:privateState.signingSalt||null};
  }
  async function stspContext(options,transaction,{readOpponent=false}={}){
    stspValidateSdk(options);const catalog=stspCatalog(),uid=stspAccountId(options.user),rivalryId=stspNormalizeRivalryId(options.rivalryId),sessionId=stspNormalizeSessionId(options.sessionId),deviceId=stspNormalizeDeviceId(options.deviceId),now=stspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    stspAssertAccount(stspSnapshot(await transaction.get(baseRefs.account)),uid);stspAssertDevice(stspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=stspAssertRivalry(stspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);stspAssertSession(stspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setup=stspAssertSetup(stspSnapshot(await transaction.get(baseRefs.setup)),rivalryId);stspAssertCareer(stspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setup);const seasonNumber=stspSeason(options.seasonNumber,setup.totalSeasons),role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${seasonNumber}`;
    const refs={...baseRefs,public:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId),own:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",role),opponent:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",opponentRole)};
    const publicValue=stspSnapshot(await transaction.get(refs.public)),state=stspPublicState(publicValue,rivalryId,seasonNumber,setup),spinMarks=state?null:(stspSpinMarks(publicValue,rivalryId,seasonNumber)||Object.freeze({playerOne:null,playerTwo:null})),spunRoles=spinMarks?ROLES.filter(item=>spinMarks[item]!==null):null,ownValue=stspSnapshot(await transaction.get(refs.own)),own=stspPrivateState(ownValue,rivalryId,seasonNumber,role,catalog);let opponent=null;
    if(readOpponent==="ifCompleted"&&!(state&&state.phase==="COMPLETED"))readOpponent=false;if(readOpponent){if(!state||state.phase!=="COMPLETED")stspFail("TRANSFER_PRIVATE_READ_BLOCKED");opponent=stspPrivateState(stspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,catalog);if(!opponent)stspFail("TRANSFER_PRIVATE_STATE_INVALID");}
    refs.roulette=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roulette","spins");
    return Object.freeze({catalog,uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setup,seasonNumber,role,opponentRole,state,spunRoles,spinMarks,own,publicValue,ownValue,opponent,refs});
  }
  function stspProjection(ctx){
    const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:Object.freeze([...(ctx.spunRoles||[])]),spinMarks:ctx.spinMarks||Object.freeze({playerOne:null,playerTwo:null}),ownInputs:null,opponentInputs:null,verdicts:null});
    const ownInputs=ctx.own?{guesses:stspClone(ctx.own.guesses),signings:stspClone(ctx.own.signings)}:{guesses:null,signings:null};
    const opponentInputs=state.phase==="COMPLETED"&&ctx.opponent?{guesses:stspClone(ctx.opponent.guesses),signings:stspClone(ctx.opponent.signings)}:null;let verdicts=null;
    if(state.phase==="COMPLETED"){
      if(!ctx.own||!ctx.opponent||!ctx.own.guesses||!ctx.own.signings||!ctx.opponent.guesses||!ctx.opponent.signings)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
      const inputs={};inputs[ctx.role]=ctx.own;inputs[ctx.opponentRole]=ctx.opponent;const evalState={phase:"COMPLETED",inputs};
      verdicts={playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)};
    }
    return stspFreeze({ok:true,revision:state.revision,state:stspClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:null,spinMarks:null,ownInputs,opponentInputs,verdicts});
  }
  function stspProtocolVerdict(role,state){
    const opponent=role==="playerOne"?"playerTwo":"playerOne",guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
  }
  // RS-02 (r87): one pass. The opponent's private document is read only after this same pass has seen the public document
  // COMPLETED (the Rules allow it only then); before, a COMPLETED season read the whole context twice (17 gets in one transaction).
  async function stspRead(options={}){try{return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{return stspProjection(await stspContext(options,transaction,{readOpponent:"ifCompleted"}));});}catch(error){return stspResultError(error);}}
  async function stspMutate(options,type,payload){
    try{
      stspValidateSdk(options);const operationId=stspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>7)stspFail("TRANSFER_COMMAND_INVALID");const cryptoImpl=options.cryptoImpl||root.crypto;
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await stspContext(options,transaction),current=ctx.state,revision=current?current.revision:0;let normalizedPayload={};
        if(type==="lock-guesses")normalizedPayload={guesses:stspNormalizeGuesses(payload.guesses,ctx.catalog)};else if(type==="lock-signings")normalizedPayload={signings:stspNormalizeSignings(payload.signings,ctx.catalog)};
        // JOB-1051: a lock's hash commits to the private payload AND a fresh random salt that only the actor's own private role document holds.
        // The rival can read the public ledger but not the role document before COMPLETED, so it cannot brute-force the small guess space.
        const privateType=type==="lock-guesses"||type==="lock-signings",saltKey=type==="lock-guesses"?"guessSalt":"signingSalt";
        const commit=salt=>stspHash({actorRole:ctx.role,type,operationId,baseRevision,...normalizedPayload,...(salt?{salt}:{})},cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){
          // Replays recompute with the salt already stored in the actor's own document; a role document without a salt (written by r66) uses the old unsalted payload hash.
          const storedSalt=privateType&&ctx.own?ctx.own[saltKey]:null;
          if(current.operationTypes[index]!==type||current.operationHashes[index]!==await commit(storedSalt)||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)stspFail("TRANSFER_IDEMPOTENCY_CONFLICT");return stspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:stspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
        const salt=privateType?stspNewSalt(cryptoImpl):null,operationHash=await commit(salt);
        if(baseRevision!==revision)stspFail("TRANSFER_STALE_BASE_REVISION");if(!current&&type!=="start-window")stspFail("TRANSFER_NOT_STARTED");if(current&&type==="start-window")stspFail("TRANSFER_ALREADY_STARTED");if(current&&current.phase==="COMPLETED")stspFail("TRANSFER_ALREADY_COMPLETED");
        let next=current?stspClone(current):{seasonNumber:ctx.seasonNumber,coordinatorRole:ctx.setup.coordinatorRole,phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:ctx.now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
        let own=ctx.own?stspClone(ctx.own):{guesses:null,signings:null,guessLockedAtEpochMs:null,signingLockedAtEpochMs:null,guessSalt:null,signingSalt:null};let writePrivate=false;
        if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");
          // RT5-FLOW-02: START needs both marks whenever this Showdown is roulette-eligible (decided here from the Setup ledger
          // this transaction already read, the same rule as the UI and the roulette step: no caller opt-in), and whenever any
          // mark exists. A Showdown confirmed before RRR_FROM_MS, or with the roulette switched off, has no marks and passes.
          const spun=ctx.spunRoles||[];if((spun.length||stspRouletteEligible(stspTimestampMillis(ctx.setup.updatedAt)))&&!ROLES.every(role=>spun.includes(role)))stspFail("TRANSFER_ROULETTE_PENDING");
          next.startedAtEpochMs=ctx.now;}
        else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
        else if(type==="advance-expired-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}
        else if(type==="lock-guesses"){if(next.phase!=="GUESS_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(next.guessLockedRoles.includes(ctx.role)||own.guesses!==null)stspFail("TRANSFER_GUESSES_ALREADY_LOCKED");own.guesses=normalizedPayload.guesses;own.guessSalt=salt;next.guessLockedRoles.push(ctx.role);if(next.guessLockedRoles.length===2)next.phase="SIGNING_ENTRY";writePrivate=true;}
        else if(type==="lock-signings"){if(next.phase!=="SIGNING_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(!next.guessLockedRoles.includes(ctx.role)||!own.guesses)stspFail("TRANSFER_GUESSES_REQUIRED");if(next.signingLockedRoles.includes(ctx.role)||own.signings!==null)stspFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");own.signings=normalizedPayload.signings;own.signingSalt=salt;next.signingLockedRoles.push(ctx.role);if(next.signingLockedRoles.length===2)next.phase="COMPLETED";writePrivate=true;}
        else stspFail("TRANSFER_COMMAND_INVALID");
        next.operationIds.push(operationId);next.operationTypes.push(type);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;
        const serverNow=stspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,stspPublicLedger(next,ctx,serverNow,type));if(writePrivate)transaction.set(ctx.refs.own,stspPrivateLedger(own,ctx,ctx.role,serverNow,type));
        // F2-02: START from a document holding both marks keeps them: one durable record, an exact copy (the Rules compare it with
        // the marks being replaced), so later seasons replay each saved shot instead of recomputing it.
        if(type==="start-window"&&ctx.spinMarks&&ROLES.every(role=>ctx.spinMarks[role]!==null))transaction.set(ctx.refs.roulette,{schemaVersion:1,objectType:"sharedTransferRouletteSpins",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,spins:stspClone(ctx.publicValue.spins)});
        return stspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:stspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:type==="start-window"||next.phase==="COMPLETED"});
      });
    }catch(error){return stspResultError(error);}
  }
  // RT5-FLOW-02: this manager's own "spun" mark for this season, one merge write and no read (the Rules check that the signed-in
  // member writes only his own role, never removes a mark, and only before the window opens). Writing it again changes nothing
  // but updatedAt, so a retry after a lost answer or a reload is safe. A window that already opened refuses it
  // (permission-denied): the mark is not needed any more, so the caller treats that as done.
  async function stspMarkSpun(options={}){
    try{
      if(!options.firestore||!options.firebaseSdk||typeof options.firebaseSdk.doc!=="function"||typeof options.firebaseSdk.runTransaction!=="function"||typeof options.firebaseSdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      // F2-02: with options.outcome (this manager's own turn, js/rosterRoulette.js outcome) the entry records it; without one
      // (no roulette ran on this phone) it is true. A malformed outcome is refused here, before any write.
      let entry=true;if(options.outcome!==undefined&&options.outcome!==null){entry=stspOutcome(options.outcome);if(!entry)stspFail("TRANSFER_SPIN_OUTCOME_INVALID");entry={...entry};}
      const sdk=options.firebaseSdk,ref=sdk.doc(options.firestore,"rivalries",rivalryId,"transferChallenges",`season_${season}`);
      await sdk.runTransaction(options.firestore,async transaction=>{transaction.set(ref,{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId,seasonNumber:season,phase:"NOT_STARTED",spins:{[role]:entry},updatedAt:stspServerTimestamp(sdk)},{merge:true});});
      return Object.freeze({ok:true,managerRole:role,seasonNumber:season});
    }catch(error){return stspResultError(error);}
  }
  // F2-12 (Fable job 2): an earlier season for the roulette boards, with plain document gets and no prerequisite transaction:
  // this manager's own role document, the partner's (the Rules allow it only once the season's window is COMPLETED) and the
  // durable spin record. Verdicts are computed as stspProtocolVerdict does. options.verdicts false reads the record only (the
  // verdicts are already kept on this phone). hits is {playerOne, playerTwo} (an outcome or null), or null without a record.
  async function stspReadRouletteSeason(options={}){
    try{
      const sdk=options.firebaseSdk,db=options.firestore;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      const opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${season}`,wantVerdicts=options.verdicts!==false;
      const get=parts=>sdk.getDoc(sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,...parts)).then(stspSnapshot);
      const settled=await Promise.allSettled([get(["roulette","spins"]),...(wantVerdicts?[get(["roles",role]),get(["roles",opponentRole])]:[])]);
      if(settled[0].status==="rejected")throw settled[0].reason;
      let hits=null;const record=settled[0].value;
      if(record){
        stspExact(record,RECORD_KEYS);
        if(record.schemaVersion!==1||record.objectType!=="sharedTransferRouletteSpins"||record.rivalryId!==rivalryId||record.seasonNumber!==season)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
        const entries=stspSpinEntries(record.spins);hits=Object.freeze(Object.fromEntries(ROLES.map(item=>[item,entries[item]&&entries[item]!==true?entries[item]:null])));
      }
      if(!wantVerdicts)return Object.freeze({ok:true,seasonNumber:season,verdicts:null,hits});
      const catalog=stspCatalog();
      if(settled[1].status==="rejected")throw settled[1].reason;
      const own=stspPrivateState(settled[1].value,rivalryId,season,role,catalog);
      if(!own||!own.guesses||!own.signings)stspFail("TRANSFER_NOT_COMPLETED");
      if(settled[2].status==="rejected")throw settled[2].reason;
      const opponent=stspPrivateState(settled[2].value,rivalryId,season,opponentRole,catalog);
      if(!opponent||!opponent.guesses||!opponent.signings)stspFail("TRANSFER_NOT_COMPLETED");
      const inputs={[role]:own,[opponentRole]:opponent},evalState={phase:"COMPLETED",inputs};
      return stspFreeze({ok:true,seasonNumber:season,verdicts:{playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)},hits});
    }catch(error){return stspResultError(error);}
  }
  const stspStartWindow=options=>stspMutate(options,"start-window",{});
  const stspRequestEndWindow=options=>stspMutate(options,"request-end-window",{});
  const stspAdvanceExpiredWindow=options=>stspMutate(options,"advance-expired-window",{});
  const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
  const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,markSpun:stspMarkSpun,readRouletteSeason:stspReadRouletteSeason,outcomeValid:value=>Boolean(stspOutcome(value)),rouletteFromMs:ROULETTE_FROM_MS,rouletteEligible:stspRouletteEligible,startWindow:stspStartWindow,requestEndWindow:stspRequestEndWindow,advanceExpiredWindow:stspAdvanceExpiredWindow,lockGuesses:stspLockGuesses,lockSignings:stspLockSignings,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateInputsSplit:true,serverClockAuthoritative:true,repositoryCatalogSnapshot:true,callerCatalogOverride:false});
});