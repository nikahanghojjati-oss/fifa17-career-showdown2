(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedMultiSeasonProgression=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r13";
  const SUPPORTED_LENGTHS=Object.freeze([1,3,5,10]);
  const PHASES=Object.freeze(["SEASON_READY","SHOWDOWN_COMPLETE"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","phase","revision","rivalryId","setupRevision","leagueId","totalSeasons","acceptedSeasons","activeSeason","completedSeason","fixedClubs","acceptedRevisionKey","terminal","canonicalStorageMutation","providerWriteRequired","listPermissionRequired"]);
  const defaultHistoryModule=typeof require==="function"?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence;

  function mspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function mspPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function mspClone(value){return JSON.parse(JSON.stringify(value));}
  function mspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(mspFreeze);Object.freeze(value);}return value;}
  function mspExact(value,keys,code){if(!mspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))mspFail(code);return value;}
  function mspRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))mspFail("MULTI_SEASON_RIVALRY_INVALID");return id;}
  function mspSetup(value,rivalryId){
    if(!mspPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!SUPPORTED_LENGTHS.includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!mspPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)mspFail("MULTI_SEASON_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)mspFail("MULTI_SEASON_RIVALRY_MISMATCH");
    return value;
  }
  function mspHistory(value,{historyModule,rivalryId,setup}){
    if(value===null||value===undefined)return null;
    let history;
    try{history=historyModule.verifyProjection(value);}catch(_error){mspFail("MULTI_SEASON_HISTORY_INVALID");}
    if(!history||history.phase!=="HISTORY_CONVERGED"||history.revision!==1||String(history.rivalryId||"")!==rivalryId||history.setupRevision!==6||history.totalSeasons!==setup.totalSeasons||history.leagueId!==setup.leagueId||!Number.isInteger(history.acceptedSeasons)||history.acceptedSeasons<1||history.acceptedSeasons>setup.totalSeasons||!Array.isArray(history.seasonHistory)||history.seasonHistory.length!==history.acceptedSeasons)mspFail("MULTI_SEASON_HISTORY_INVALID");
    if(history.managerRecords?.playerOne?.club!==setup.clubs.playerOne||history.managerRecords?.playerTwo?.club!==setup.clubs.playerTwo)mspFail("MULTI_SEASON_CLUB_DRIFT");
    for(let index=0;index<history.seasonHistory.length;index+=1){
      const season=history.seasonHistory[index];
      if(!season||season.roundNumber!==index+1||season.acceptedResultRevision!==2||season.seasonCommitRevision!==3||season.canonicalScoringRevision!==1||!HASH.test(String(season.acceptedResultContentHash||"")))mspFail("MULTI_SEASON_HISTORY_GAP");
    }
    const expectedKey=history.seasonHistory.map(season=>`${season.roundNumber}:${season.acceptedResultRevision}:${season.acceptedResultContentHash}`).join("|");
    if(history.acceptedRevisionKey!==expectedKey)mspFail("MULTI_SEASON_HISTORY_REVISION_MISMATCH");
    return history;
  }
  function mspBuildState({rivalryId,setup,history=null}={},historyModule){
    const id=mspRivalry(rivalryId),confirmed=mspSetup(setup,id),accepted=mspHistory(history,{historyModule,rivalryId:id,setup:confirmed});
    const acceptedSeasons=accepted?accepted.acceptedSeasons:0,totalSeasons=confirmed.totalSeasons,terminal=acceptedSeasons===totalSeasons;
    const state={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:terminal?"SHOWDOWN_COMPLETE":"SEASON_READY",revision:acceptedSeasons,rivalryId:id,setupRevision:6,leagueId:confirmed.leagueId,totalSeasons,acceptedSeasons,activeSeason:terminal?null:acceptedSeasons+1,completedSeason:acceptedSeasons||null,fixedClubs:{playerOne:confirmed.clubs.playerOne,playerTwo:confirmed.clubs.playerTwo},acceptedRevisionKey:accepted?accepted.acceptedRevisionKey:"",terminal,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false};
    return mspFreeze(state);
  }
  function mspVerifyState(value){
    mspExact(value,STATE_KEYS,"MULTI_SEASON_STATE_INVALID");
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!PHASES.includes(value.phase)||!SUPPORTED_LENGTHS.includes(value.totalSeasons)||value.setupRevision!==6||typeof value.leagueId!=="string"||!value.leagueId.trim()||!Number.isInteger(value.revision)||value.revision<0||value.revision>value.totalSeasons||value.acceptedSeasons!==value.revision||!mspPlain(value.fixedClubs)||typeof value.fixedClubs.playerOne!=="string"||!value.fixedClubs.playerOne||typeof value.fixedClubs.playerTwo!=="string"||!value.fixedClubs.playerTwo||value.fixedClubs.playerOne===value.fixedClubs.playerTwo||value.canonicalStorageMutation!==false||value.providerWriteRequired!==false||value.listPermissionRequired!==false)mspFail("MULTI_SEASON_STATE_INVALID");
    mspRivalry(value.rivalryId);
    const terminal=value.acceptedSeasons===value.totalSeasons;
    if(value.terminal!==terminal||value.phase!==(terminal?"SHOWDOWN_COMPLETE":"SEASON_READY")||value.activeSeason!==(terminal?null:value.acceptedSeasons+1)||value.completedSeason!==(value.acceptedSeasons||null))mspFail("MULTI_SEASON_STATE_INVALID");
    if(value.acceptedSeasons===0&&value.acceptedRevisionKey!=="")mspFail("MULTI_SEASON_STATE_INVALID");
    if(value.acceptedSeasons>0){const parts=String(value.acceptedRevisionKey||"").split("|");if(parts.length!==value.acceptedSeasons||parts.some((part,index)=>!new RegExp(`^${index+1}:2:sha256:[0-9a-f]{64}$`).test(part)))mspFail("MULTI_SEASON_STATE_INVALID");}
    return mspFreeze(mspClone(value));
  }
  function mspSamePlan(a,b){return a.rivalryId===b.rivalryId&&a.setupRevision===b.setupRevision&&a.leagueId===b.leagueId&&a.totalSeasons===b.totalSeasons&&a.fixedClubs.playerOne===b.fixedClubs.playerOne&&a.fixedClubs.playerTwo===b.fixedClubs.playerTwo;}
  function mspObserve({previous=null,rivalryId,setup,history=null}={},historyModule){
    const next=mspBuildState({rivalryId,setup,history},historyModule);
    if(!previous)return next;
    const prior=mspVerifyState(previous);
    if(!mspSamePlan(prior,next))mspFail("MULTI_SEASON_PLAN_DRIFT");
    if(prior.terminal){if(next.acceptedSeasons!==prior.acceptedSeasons||next.acceptedRevisionKey!==prior.acceptedRevisionKey)mspFail("MULTI_SEASON_TERMINAL_RESURRECTION");return next;}
    const delta=next.acceptedSeasons-prior.acceptedSeasons;
    if(delta<0)mspFail("MULTI_SEASON_REGRESSION");
    if(delta>1)mspFail("MULTI_SEASON_SKIPPED_ADVANCE");
    if(delta===0&&next.acceptedRevisionKey!==prior.acceptedRevisionKey)mspFail("MULTI_SEASON_REPLAY_ALTERED");
    if(delta===1){
      const prefix=prior.acceptedRevisionKey?`${prior.acceptedRevisionKey}|`:"";
      if(!next.acceptedRevisionKey.startsWith(prefix)||next.completedSeason!==prior.acceptedSeasons+1)mspFail("MULTI_SEASON_ADVANCE_INVALID");
    }
    return next;
  }
  function mspCreateProtocol({historyModule=defaultHistoryModule}={}){
    if(!historyModule||typeof historyModule.verifyProjection!=="function")mspFail("MULTI_SEASON_HISTORY_PROTOCOL_UNAVAILABLE");
    return mspFreeze({contractVersion:1,feature:"ssjr-shared-multi-season-progression",runtimeRevision:RUNTIME_REVISION,supportedLengths:SUPPORTED_LENGTHS,phases:PHASES,derive:options=>mspBuildState(options,historyModule),observe:options=>mspObserve(options,historyModule),verifyState:mspVerifyState,fixedClubs:true,exactOnceProgression:true,resumableFromContiguousHistory:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-multi-season-progression-factory",runtimeRevision:RUNTIME_REVISION,supportedLengths:SUPPORTED_LENGTHS,phases:PHASES,createProtocol:mspCreateProtocol,fixedClubs:true,exactOnceProgression:true,resumableFromContiguousHistory:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});