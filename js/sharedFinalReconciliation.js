(function(root,factory){
  const api=factory(typeof require==="function"?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedFinalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(historyModule){
  "use strict";
  const RUNTIME_REVISION="1.9.1-r17";
  const FINAL_PHASE="FINAL_SEASON_RECONCILED";
  const RIVALRY=/^pair_[0-9a-f]{64}$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const SAFE_LOCAL_PHASES=new Set(["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"]);
  const FINAL_KEYS=Object.freeze(["schemaVersion","runtimeRevision","phase","rivalryId","leagueId","totalSeasons","acceptedSeasons","completedSeason","acceptedRevisionKey","fixedClubs","managerTotals","winner","terminal","finalSeasonReconciled","nextSeason","extraSeasonAllowed","terminalCloseRequired","canonicalStorageMutation","providerWriteRequired","listPermissionRequired","billingRequired"]);
  function frFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function frPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function frClone(value){return JSON.parse(JSON.stringify(value));}
  function frFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(frFreeze);Object.freeze(value);}return value;}
  function frRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY.test(id))frFail("FINAL_RECONCILIATION_RIVALRY_INVALID");return id;}
  function frBase(phase,extra={}){return frFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,...extra});}
  function frBlocked(reason){return frBase("BLOCKED",{reason:String(reason||"authority-incomplete"),terminal:false,finalSeasonReconciled:false,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:false});}
  function frManagerTotal(record,role){if(!frPlain(record)||record.role!==role||!Number.isInteger(record.seasons)||record.seasons<1||!Number.isInteger(record.totalPoints)||record.totalPoints<0)frFail("FINAL_RECONCILIATION_MANAGER_RECORD_INVALID");return record.totalPoints;}
  function frVerifyHistory(history,rivalryId,totalSeasons){
    if(!history||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||String(history.rivalryId||"")!==rivalryId||!history.projection)frFail("FINAL_RECONCILIATION_HISTORY_INVALID");
    let projection;
    try{projection=historyModule.verifyProjection(history.projection);}catch(_error){frFail("FINAL_RECONCILIATION_HISTORY_INVALID");}
    if(projection.rivalryId!==rivalryId||projection.acceptedSeasons!==totalSeasons||projection.totalSeasons!==totalSeasons||projection.seasonHistory.length!==totalSeasons)frFail("FINAL_RECONCILIATION_HISTORY_INCOMPLETE");
    return projection;
  }
  function frVerifyLocal(localReconciliation,projection){
    if(!localReconciliation||!SAFE_LOCAL_PHASES.has(localReconciliation.phase))return false;
    if(localReconciliation.canonicalStorageMutation!==false||localReconciliation.providerWriteRequired!==false||localReconciliation.automaticLocalApply!==false||localReconciliation.candidateCOnly!==true)frFail("FINAL_RECONCILIATION_LOCAL_SAFETY_INVALID");
    const binding=localReconciliation.binding;
    if(!frPlain(binding)||!ROLES.includes(binding.managerRole))frFail("FINAL_RECONCILIATION_LOCAL_BINDING_INVALID");
    const slot=Array.isArray(projection.managerSlots)?projection.managerSlots.find(item=>item&&item.slotId===binding.managerRole):null;
    const record=projection.managerRecords?.[binding.managerRole];
    if(!slot||!record||slot.profileId!==binding.profileId||slot.saveId!==binding.saveId||record.role!==binding.managerRole||record.profileId!==binding.profileId||record.saveId!==binding.saveId)frFail("FINAL_RECONCILIATION_LOCAL_BINDING_MISMATCH");
    return true;
  }
  function frReconcile({sharedActive=false,multiSeason=null,history=null,localReconciliation=null}={}){
    if(!sharedActive)return frBase("INACTIVE",{reason:"local-journey",terminal:false,finalSeasonReconciled:false,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:false});
    if(!multiSeason||multiSeason.ok!==true||multiSeason.authoritative!==true||multiSeason.phase!=="SHOWDOWN_COMPLETE"||!frPlain(multiSeason.state))return frBlocked("multi-season-not-terminal");
    const rivalryId=frRivalry(multiSeason.rivalryId),state=multiSeason.state,totalSeasons=Number(state.totalSeasons);
    if(state.rivalryId!==rivalryId||state.phase!=="SHOWDOWN_COMPLETE"||state.terminal!==true||![1,3,5,10].includes(totalSeasons)||state.acceptedSeasons!==totalSeasons||state.completedSeason!==totalSeasons||state.activeSeason!==null||typeof state.acceptedRevisionKey!=="string"||!state.acceptedRevisionKey)frFail("FINAL_RECONCILIATION_MULTI_SEASON_INVALID");
    if(!localReconciliation||!SAFE_LOCAL_PHASES.has(localReconciliation.phase))return frBlocked("local-reconciliation-not-ready");
    const projection=frVerifyHistory(history,rivalryId,totalSeasons);
    frVerifyLocal(localReconciliation,projection);
    if(projection.acceptedRevisionKey!==state.acceptedRevisionKey||projection.leagueId!==state.leagueId||projection.managerRecords?.playerOne?.club!==state.fixedClubs?.playerOne||projection.managerRecords?.playerTwo?.club!==state.fixedClubs?.playerTwo)frFail("FINAL_RECONCILIATION_AUTHORITY_MISMATCH");
    const playerOne=frManagerTotal(projection.managerRecords.playerOne,"playerOne"),playerTwo=frManagerTotal(projection.managerRecords.playerTwo,"playerTwo");
    const winner=playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw";
    return frFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:FINAL_PHASE,rivalryId,leagueId:projection.leagueId,totalSeasons,acceptedSeasons:totalSeasons,completedSeason:totalSeasons,acceptedRevisionKey:projection.acceptedRevisionKey,fixedClubs:frClone(state.fixedClubs),managerTotals:{playerOne,playerTwo},winner,terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
  }
  function frVerifyFinal(value){
    if(!frPlain(value)||Object.keys(value).length!==FINAL_KEYS.length||FINAL_KEYS.some(key=>!Object.hasOwn(value,key)))frFail("FINAL_RECONCILIATION_PROJECTION_INVALID");
    frRivalry(value.rivalryId);
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!==FINAL_PHASE||![1,3,5,10].includes(value.totalSeasons)||value.acceptedSeasons!==value.totalSeasons||value.completedSeason!==value.totalSeasons||typeof value.acceptedRevisionKey!=="string"||!value.acceptedRevisionKey||!frPlain(value.fixedClubs)||typeof value.fixedClubs.playerOne!=="string"||!value.fixedClubs.playerOne||typeof value.fixedClubs.playerTwo!=="string"||!value.fixedClubs.playerTwo||value.fixedClubs.playerOne===value.fixedClubs.playerTwo||!frPlain(value.managerTotals)||!Number.isInteger(value.managerTotals.playerOne)||value.managerTotals.playerOne<0||!Number.isInteger(value.managerTotals.playerTwo)||value.managerTotals.playerTwo<0||!ROLES.includes(value.winner)&&value.winner!=="draw"||value.terminal!==true||value.finalSeasonReconciled!==true||value.nextSeason!==null||value.extraSeasonAllowed!==false||value.terminalCloseRequired!==true||value.canonicalStorageMutation!==false||value.providerWriteRequired!==false||value.listPermissionRequired!==false||value.billingRequired!==false)frFail("FINAL_RECONCILIATION_PROJECTION_INVALID");
    const expected=value.managerTotals.playerOne>value.managerTotals.playerTwo?"playerOne":value.managerTotals.playerTwo>value.managerTotals.playerOne?"playerTwo":"draw";
    if(value.winner!==expected)frFail("FINAL_RECONCILIATION_WINNER_MISMATCH");
    return frFreeze(frClone(value));
  }
  if(!historyModule||typeof historyModule.verifyProjection!=="function")frFail("FINAL_RECONCILIATION_HISTORY_PROTOCOL_UNAVAILABLE");
  return Object.freeze({contractVersion:1,feature:"ssjr-shared-final-reconciliation",runtimeRevision:RUNTIME_REVISION,phase:FINAL_PHASE,reconcile:frReconcile,verifyProjection:frVerifyFinal,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
