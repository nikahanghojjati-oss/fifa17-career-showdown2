(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkCompletedShowdownReader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-08 (D2): session-free, read-only reader for one Showdown closed by a verified Terminal Close.
  // Exact document gets only (rivalry, setup ledger, season_1..season_N results/roles/commits);
  // no session, no device, no transaction, no list, no write, no browser storage.
  const csrModule=(file,key)=>typeof require==="function"?require(file):root[key];
  const csrModules={
    get setup(){return csrModule("./sharedShowdownSetup.js","CareerModeSharedShowdownSetup");},
    get catalog(){return csrModule("./sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog");},
    get results(){return csrModule("./sharedSeasonResults.js","CareerModeSharedSeasonResults");},
    get commit(){return csrModule("./sharedSeasonCommit.js","CareerModeSharedSeasonCommit");},
    get scoring(){return csrModule("./sharedCanonicalScoring.js","CareerModeSharedCanonicalScoring");},
    get history(){return csrModule("./sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence");},
    get terminal(){return csrModule("./sharedTerminalClose.js","CareerModeSharedTerminalClose");}
  };
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const PROGRESS_KEYS=Object.freeze(["schemaVersion","runtimeRevision","totalSeasons","acceptedThroughSeason","managerTotals","closedSessionRevision"]);
  const SETUP_LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole","operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons","confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const COMMIT_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","resultsRevision","results","acknowledgedRoles","operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable","never-started"]);

  function csrFail(code){const error=new Error(code);error.code=code;throw error;}
  function csrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(csrFreeze);Object.freeze(value);}return value;}
  function csrPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function csrExact(value,keys,code){if(!csrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))csrFail(code);return value;}
  function csrClone(value){return JSON.parse(JSON.stringify(value));}
  function csrSortedCanonical(value){if(Array.isArray(value))return `[${value.map(csrSortedCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${csrSortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  function csrEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(csrEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=csrEnvelopeCanonical(value[key]);return out;}return value;}
  async function csrDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")csrFail("COMPLETED_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function csrSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function csrResult(value,teamCount){csrExact(value,RESULT_KEYS,"COMPLETED_SEASON_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)csrFail("COMPLETED_SEASON_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")csrFail("COMPLETED_SEASON_INVALID");}return csrClone(value);}

  function csrState(status,fields={}){
    return csrFreeze({status,code:fields.code||null,rivalryId:fields.rivalryId||null,managerRole:fields.managerRole||null,terminalWitness:fields.terminalWitness||null,projection:fields.projection||null,final:fields.final||null});
  }
  async function csrGet(sdk,db,parts){
    try{return csrSnapshot(await sdk.getDoc(sdk.doc(db,...parts)));}
    catch(error){csrFail(error&&typeof error.code==="string"&&error.code?error.code:"COMPLETED_READ_FAILED");}
  }

  async function csrVerifyRivalry(value,rivalryId,cryptoImpl){
    if(!value||value.schemaVersion!==1||value.objectType!=="rivalry"||value.objectId!==rivalryId||!Number.isInteger(value.revision)||value.revision<0||value.lifecycleState!=="live"||!HASH.test(String(value.contentHash||""))||!csrPlain(value.data)||value.tombstone!==null)csrFail("COMPLETED_RIVALRY_INVALID");
    const expected=await csrDigest(JSON.stringify(csrEnvelopeCanonical({objectType:"rivalry",objectId:rivalryId,revision:value.revision,data:value.data})),cryptoImpl);
    if(expected!==value.contentHash)csrFail("COMPLETED_RIVALRY_INTEGRITY_FAILED");
  }
  function csrNeverStarted(data,uid){
    // Only the provider's intact creator/open-slot shape is a never-joined code.
    // ACTIVE roots and any terminal witness still require the full two-manager binding.
    if(!["pending-pair","closed"].includes(data.connectionState)||Object.hasOwn(data,"terminalClose")||Object.hasOwn(data,"terminalProgress"))return null;
    const slots=data.managerSlots,authorized=data.authorizedAccountIds;
    if(!Array.isArray(authorized)||authorized.length!==1)return null;
    if(authorized[0]!==uid||data.createdByAccountId!==uid)csrFail("COMPLETED_NOT_A_MANAGER");
    if(!Array.isArray(slots)||slots.length!==2)csrFail("COMPLETED_BINDING_INVALID");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    const actor=ordered.find(slot=>slot?.accountId===uid),open=ordered.find(slot=>slot?.entitlementState==="open");
    if(!actor||actor===open||actor.entitlementState!=="active"||!/^profile_[0-9a-f]{24}$/.test(String(actor.profileId||""))||!/^save_[0-9a-f]{24}$/.test(String(actor.saveId||""))||!open||open.accountId!==null||open.profileId!==null||open.saveId!==null)csrFail("COMPLETED_BINDING_INVALID");
    return actor.slotId;
  }
  function csrVerifyManagers(data,uid){
    const slots=data.managerSlots,authorized=data.authorizedAccountIds;
    if(!Array.isArray(authorized)||authorized.length!==2||new Set(authorized).size!==2||!authorized.includes(uid)||!Array.isArray(slots)||slots.length!==2)csrFail("COMPLETED_NOT_A_MANAGER");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!authorized.includes(slot.accountId)||!/^profile_[0-9a-f]{24}$/.test(String(slot.profileId||""))||!/^save_[0-9a-f]{24}$/.test(String(slot.saveId||"")))||ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)csrFail("COMPLETED_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)csrFail("COMPLETED_NOT_A_MANAGER");
    return {slots:ordered,authorized:[...authorized],managerRole:actor.slotId};
  }
  function csrVerifyWitness(data,rivalryId){
    let intent;
    try{intent=csrModules.terminal.verifyIntent(data.terminalClose);}catch(_error){csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");}
    const progress=data.terminalProgress;
    if(!csrPlain(progress)||Object.keys(progress).length!==PROGRESS_KEYS.length||PROGRESS_KEYS.some(key=>!Object.hasOwn(progress,key)))csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");
    if(intent.rivalryId!==rivalryId||progress.schemaVersion!==1||progress.runtimeRevision!=="1.9.1-r18"||progress.totalSeasons!==intent.totalSeasons||progress.acceptedThroughSeason!==progress.totalSeasons||!Number.isInteger(progress.closedSessionRevision)||progress.closedSessionRevision<1||!csrPlain(progress.managerTotals)||progress.managerTotals.playerOne!==intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==intent.managerTotals.playerTwo)csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");
    return intent;
  }
  function csrAssertLedger(value,rivalryId,totalSeasons){
    csrExact(value,SETUP_LEDGER_KEYS,"COMPLETED_SETUP_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||value.totalSeasons!==totalSeasons||!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))csrFail("COMPLETED_SETUP_INVALID");
    for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==6)csrFail("COMPLETED_SETUP_INVALID");}
    if(JSON.stringify(value.operationTypes)!==JSON.stringify(["open","commit-league","commit-clubs","commit-length","confirm","confirm"])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))csrFail("COMPLETED_SETUP_INVALID");
    return value;
  }
  function csrAuthority(rivalryId,rivalry,role,sessionId,hostRole){
    const slot=rivalry.slots.find(item=>item.slotId===role),host=rivalry.slots.find(item=>item.slotId===hostRole);
    if(!slot||!host)csrFail("COMPLETED_SETUP_INVALID");
    // Replays the stored ledger through the setup protocol; the session values are inert replay inputs, not a live session.
    return {rivalryId,connectionState:"active",managerSlots:rivalry.slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"})),actor:{accountId:slot.accountId,deviceId:"device_"+"0".repeat(32),deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},session:{sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Number.MAX_SAFE_INTEGER},nowEpochMs:0};
  }
  async function csrRebuildSetup(ledger,rivalry,rivalryId,cryptoImpl){
    if(!csrModules.setup||typeof csrModules.setup.createProtocol!=="function"||!csrModules.catalog||!csrModules.catalog.catalog)csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.setup.createProtocol({catalog:csrModules.catalog.catalog,cryptoImpl});let state=null;
    for(let index=0;index<ledger.revision;index+=1){
      const type=ledger.operationTypes[index],authority=csrAuthority(rivalryId,rivalry,ledger.actorRoles[index],ledger.activeSessionId,ledger.coordinatorRole);let command;
      if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});
      else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};
      else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await protocol.confirmationHash(state)};
      else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};
      const applied=await protocol.apply({state,authority,command});if(!applied||!applied.ok)csrFail("COMPLETED_SETUP_INVALID");state=applied.state;
    }
    if(!state||state.phase!=="SHOWDOWN_CONFIRMED"||state.revision!==6)csrFail("COMPLETED_SETUP_INVALID");
    return state;
  }
  function csrTeamCount(setup){const clubs=csrModules.catalog?.catalog?.[setup?.leagueId];if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)csrFail("COMPLETED_SETUP_INVALID");return clubs.length;}
  function csrAssertPublicResults(value,rivalryId,seasonNumber){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r9"||value.phase!=="RESULTS_READY"||value.revision!==2)csrFail("COMPLETED_SEASON_INVALID");
    for(const key of ["publishedRoles","operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==2)csrFail("COMPLETED_SEASON_INVALID");}
    if(new Set(value.publishedRoles).size!==2||!ROLES.every(role=>value.publishedRoles.includes(role))||new Set(value.operationIds).size!==2||value.operationIds.some(id=>!RESULT_OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))csrFail("COMPLETED_SEASON_INVALID");
    return value;
  }
  function csrAssertRoleResult(value,rivalryId,seasonNumber,role,teamCount){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!RESULT_OPERATION.test(value.operationId||"")||!HASH.test(value.commandHash||""))csrFail("COMPLETED_SEASON_INVALID");
    return {...value,result:csrResult(value.result,teamCount)};
  }
  async function csrReadyState(publicResult,roleResults,teamCount,cryptoImpl){
    const receipts=publicResult.actorRoles.map((role,index)=>{const own=roleResults[role];if(!own||own.operationId!==publicResult.operationIds[index]||publicResult.publishedRoles[index]!==role)csrFail("COMPLETED_SEASON_INVALID");return {operationId:publicResult.operationIds[index],baseRevision:publicResult.baseRevisions[index],actorRole:role,type:"publish-result",commandHash:own.commandHash};});
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r9",seasonNumber:publicResult.seasonNumber,phase:"RESULTS_READY",revision:2,publishedRoles:[...publicResult.publishedRoles],results:{playerOne:csrResult(roleResults.playerOne.result,teamCount),playerTwo:csrResult(roleResults.playerTwo.result,teamCount)},receipts};
    const state={...core,contentHash:await csrDigest(csrSortedCanonical(core),cryptoImpl)};
    if(!csrModules.results||typeof csrModules.results.createProtocol!=="function")csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.results.createProtocol({teamCount,cryptoImpl});
    try{await protocol.verifyState(state);}catch(_error){csrFail("COMPLETED_SEASON_INVALID");}
    return state;
  }
  async function csrAcknowledgedCommit(value,ready,teamCount,cryptoImpl){
    csrExact(value,COMMIT_KEYS,"COMPLETED_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.runtimeRevision!=="1.9.1-r10"||value.seasonNumber!==ready.seasonNumber||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2)csrFail("COMPLETED_SEASON_INVALID");
    csrExact(value.results,ROLES,"COMPLETED_SEASON_INVALID");for(const role of ROLES)csrResult(value.results[role],teamCount);
    if(JSON.stringify(value.results)!==JSON.stringify(ready.results))csrFail("COMPLETED_SEASON_INVALID");
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==3)csrFail("COMPLETED_SEASON_INVALID");}
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2)csrFail("COMPLETED_SEASON_INVALID");
    const receipts=value.operationIds.map((operationId,index)=>({operationId,baseRevision:value.baseRevisions[index],actorRole:value.actorRoles[index],type:index===0?"commit-season":"acknowledge-season",commandHash:value.operationHashes[index]}));
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r10",seasonNumber:value.seasonNumber,phase:value.phase,revision:value.revision,resultsRevision:2,resultsContentHash:ready.contentHash,results:csrClone(value.results),acknowledgedRoles:[...value.acknowledgedRoles],receipts};
    const state={...core,contentHash:await csrDigest(csrSortedCanonical(core),cryptoImpl)};
    if(!csrModules.commit||typeof csrModules.commit.createProtocol!=="function")csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.commit.createProtocol({teamCount,cryptoImpl,seasonResultsModule:csrModules.results});
    try{await protocol.verifyState(state);}catch(_error){csrFail("COMPLETED_SEASON_INVALID");}
    return state;
  }

  async function csrRead(options={}){
    let rivalryId=null,managerRole=null;
    try{
      const sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")csrFail("COMPLETED_PROVIDER_UNAVAILABLE");
      const uid=options.user&&typeof options.user.uid==="string"?options.user.uid.trim():"";if(!uid)csrFail("COMPLETED_AUTH_REQUIRED");
      rivalryId=String(options.rivalryId||"").trim().toLowerCase();if(!RIVALRY_ID.test(rivalryId)){rivalryId=null;csrFail("COMPLETED_RIVALRY_INVALID");}
      const value=await csrGet(sdk,db,["rivalries",rivalryId]);if(!value)csrFail("COMPLETED_RIVALRY_MISSING");
      await csrVerifyRivalry(value,rivalryId,cryptoImpl);
      const state=value.data.connectionState;
      if(!["pending-pair","active","closed"].includes(state))csrFail("COMPLETED_RIVALRY_INVALID");
      const neverStartedRole=csrNeverStarted(value.data,uid);
      if(neverStartedRole)return csrState("never-started",{rivalryId,managerRole:neverStartedRole});
      const rivalry=csrVerifyManagers(value.data,uid);managerRole=rivalry.managerRole;
      if(state==="pending-pair"||state==="active")return csrState("not-closed",{rivalryId,managerRole});
      if(state!=="closed")csrFail("COMPLETED_RIVALRY_INVALID");
      // Abandoned (closed without a Terminal Close witness): status only, nothing else is read or counted.
      if(!Object.hasOwn(value.data,"terminalClose"))return csrState("abandoned",{rivalryId,managerRole});
      const intent=csrVerifyWitness(value.data,rivalryId),total=intent.totalSeasons;
      const ledger=csrAssertLedger(await csrGet(sdk,db,["rivalries",rivalryId,"sharedSetup","authoritative"]),rivalryId,total);
      const setup=await csrRebuildSetup(ledger,rivalry,rivalryId,cryptoImpl),teamCount=csrTeamCount(setup);
      const scoringProtocol=await csrModules.scoring.createProtocol({teamCount,cryptoImpl,seasonCommitModule:csrModules.commit});
      const seasons=[];
      for(let seasonNumber=1;seasonNumber<=total;seasonNumber+=1){
        const seasonId=`season_${seasonNumber}`;
        const publicValue=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId]);
        const p1=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId,"roles","playerOne"]);
        const p2=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId,"roles","playerTwo"]);
        const stored=await csrGet(sdk,db,["rivalries",rivalryId,"seasonCommits",seasonId]);
        // A gap is never a shorter history: any missing season makes the whole Showdown unavailable.
        if(!publicValue||!p1||!p2||!stored)csrFail("COMPLETED_SEASON_MISSING");
        const ready=await csrReadyState(csrAssertPublicResults(publicValue,rivalryId,seasonNumber),{playerOne:csrAssertRoleResult(p1,rivalryId,seasonNumber,"playerOne",teamCount),playerTwo:csrAssertRoleResult(p2,rivalryId,seasonNumber,"playerTwo",teamCount)},teamCount,cryptoImpl);
        const commit=await csrAcknowledgedCommit(stored,ready,teamCount,cryptoImpl);
        const scored=scoringProtocol.scoreAuthoritativeResults(commit.results);
        seasons.push({
          commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,results:csrClone(commit.results),rivalryId},
          scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,scoring:csrClone(scored.scoring),winner:scored.winner,rivalryId}
        });
      }
      const projection=csrModules.history.buildProjection({rivalryId,setup:{...setup,rivalryId},managerSlots:rivalry.slots,seasons});
      csrModules.history.verifyProjection(projection);
      const a=projection.managerRecords.playerOne.totalPoints,b=projection.managerRecords.playerTwo.totalPoints,winner=a>b?"playerOne":b>a?"playerTwo":"draw";
      // Full coverage and both reconstructed totals must equal the Terminal Close witness; totals-only final winner.
      if(projection.acceptedSeasons!==total||projection.totalSeasons!==total||a!==intent.managerTotals.playerOne||b!==intent.managerTotals.playerTwo||winner!==intent.winner)csrFail("COMPLETED_TOTALS_MISMATCH");
      return csrState("completed",{rivalryId,managerRole,terminalWitness:csrClone(intent),projection,final:{totals:{playerOne:a,playerTwo:b},winner,margin:Math.abs(a-b),seasonsPlayed:total}});
    }catch(error){
      return csrState("unavailable",{rivalryId,managerRole,code:error&&typeof error.code==="string"&&error.code?error.code:"COMPLETED_READ_FAILED"});
    }
  }

  return Object.freeze({contractVersion:1,feature:"cms-completed-showdown-reader",statuses:STATUSES,readCompletedShowdown:csrRead,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false,sourceAuthorityPaths:Object.freeze(["rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/seasonResults/season_{N}","rivalries/{rivalryId}/seasonResults/season_{N}/roles/{playerOne|playerTwo}","rivalries/{rivalryId}/seasonCommits/season_{N}"])});
});
