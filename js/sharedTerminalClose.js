(function(root,factory){
  const finalModule=typeof module!=="undefined"&&module.exports?require("./sharedFinalReconciliation.js"):root.CareerModeSharedFinalReconciliation;
  const api=factory(finalModule);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeSharedTerminalClose=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(finalModule){
  "use strict";
  const RUNTIME_REVISION="1.9.1-r18",READY_PHASE="TERMINAL_CLOSE_READY",CLOSED_PHASE="TERMINAL_CLOSED";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const INTENT_KEYS=Object.freeze(["schemaVersion","runtimeRevision","phase","rivalryId","sessionId","acceptedRevisionKey","totalSeasons","completedSeason","fixedClubs","managerTotals","winner","terminal","finalSeasonReconciled","nextSeason","extraSeasonAllowed","rivalryConnectionState","sessionTargetState","terminalReadAllowed","canonicalStorageMutation","providerWriteRequired","listPermissionRequired","billingRequired"]);
  function tcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function tcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function tcClone(value){return JSON.parse(JSON.stringify(value));}
  function tcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(tcFreeze);Object.freeze(value);}return value;}
  function tcStable(value){if(value===null||typeof value!=="object")return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(tcStable).join(",")}]`;return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${tcStable(value[key])}`).join(",")}}`;}
  function tcVerifyIntent(value){
    if(!tcPlain(value)||Object.keys(value).length!==INTENT_KEYS.length||INTENT_KEYS.some(key=>!Object.hasOwn(value,key)))tcFail("TERMINAL_CLOSE_INTENT_INVALID");
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!==READY_PHASE)tcFail("TERMINAL_CLOSE_INTENT_INVALID");
    if(!/^pair_[0-9a-f]{64}$/.test(String(value.rivalryId||"")))tcFail("TERMINAL_CLOSE_RIVALRY_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(String(value.sessionId||"")))tcFail("TERMINAL_CLOSE_SESSION_INVALID");
    if(typeof value.acceptedRevisionKey!=="string"||!value.acceptedRevisionKey)tcFail("TERMINAL_CLOSE_REVISION_KEY_INVALID");
    if(![1,3,5,10].includes(value.totalSeasons)||value.completedSeason!==value.totalSeasons)tcFail("TERMINAL_CLOSE_SEASON_BOUNDARY_INVALID");
    if(!tcPlain(value.fixedClubs)||typeof value.fixedClubs.playerOne!=="string"||!value.fixedClubs.playerOne||typeof value.fixedClubs.playerTwo!=="string"||!value.fixedClubs.playerTwo||value.fixedClubs.playerOne===value.fixedClubs.playerTwo)tcFail("TERMINAL_CLOSE_CLUB_AUTHORITY_INVALID");
    if(!tcPlain(value.managerTotals)||!Number.isInteger(value.managerTotals.playerOne)||value.managerTotals.playerOne<0||!Number.isInteger(value.managerTotals.playerTwo)||value.managerTotals.playerTwo<0)tcFail("TERMINAL_CLOSE_SCORE_AUTHORITY_INVALID");
    const winner=value.managerTotals.playerOne>value.managerTotals.playerTwo?"playerOne":value.managerTotals.playerTwo>value.managerTotals.playerOne?"playerTwo":"draw";
    if(value.winner!==winner||(!ROLES.includes(value.winner)&&value.winner!=="draw"))tcFail("TERMINAL_CLOSE_WINNER_MISMATCH");
    if(value.terminal!==true||value.finalSeasonReconciled!==true||value.nextSeason!==null||value.extraSeasonAllowed!==false)tcFail("TERMINAL_CLOSE_FINAL_AUTHORITY_INVALID");
    if(value.rivalryConnectionState!=="closed"||value.sessionTargetState!=="closed"||value.terminalReadAllowed!==true)tcFail("TERMINAL_CLOSE_STATE_INVALID");
    if(value.canonicalStorageMutation!==false||value.providerWriteRequired!==true||value.listPermissionRequired!==false||value.billingRequired!==false)tcFail("TERMINAL_CLOSE_SAFETY_INVALID");
    return tcFreeze(tcClone(value));
  }
  function tcPrepare(finalReconciliation,{sessionId}={}){
    if(!finalModule||typeof finalModule.verifyProjection!=="function")tcFail("TERMINAL_CLOSE_FINAL_PROTOCOL_UNAVAILABLE");
    let final;try{final=finalModule.verifyProjection(finalReconciliation);}catch(_error){tcFail("TERMINAL_CLOSE_FINAL_RECONCILIATION_REQUIRED");}
    return tcVerifyIntent({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:READY_PHASE,rivalryId:final.rivalryId,sessionId:String(sessionId||"").trim().toLowerCase(),acceptedRevisionKey:final.acceptedRevisionKey,totalSeasons:final.totalSeasons,completedSeason:final.completedSeason,fixedClubs:tcClone(final.fixedClubs),managerTotals:tcClone(final.managerTotals),winner:final.winner,terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:"closed",sessionTargetState:"closed",terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false});
  }
  function tcWitnessKey(value){return tcStable(tcVerifyIntent(value));}
  function tcSameWitness(left,right){try{return tcWitnessKey(left)===tcWitnessKey(right);}catch(_error){return false;}}
  function tcClosed(intent,providerResult){
    const verified=tcVerifyIntent(intent);
    if(!tcPlain(providerResult)||providerResult.ok!==true||!Number.isInteger(providerResult.rivalryRevision)||providerResult.rivalryRevision<1||!Number.isInteger(providerResult.sessionRevision)||providerResult.sessionRevision<1)tcFail("TERMINAL_CLOSE_PROVIDER_RESULT_INVALID");
    if(String(providerResult.rivalryId||"")!==verified.rivalryId||String(providerResult.sessionId||"")!==verified.sessionId||providerResult.sessionState!=="closed"||providerResult.rivalryState!=="closed")tcFail("TERMINAL_CLOSE_PROVIDER_RESULT_INVALID");
    return tcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:CLOSED_PHASE,rivalryId:verified.rivalryId,sessionId:verified.sessionId,acceptedRevisionKey:verified.acceptedRevisionKey,totalSeasons:verified.totalSeasons,winner:verified.winner,managerTotals:tcClone(verified.managerTotals),rivalryRevision:providerResult.rivalryRevision,sessionRevision:providerResult.sessionRevision,replayed:providerResult.replayed===true,terminal:true,nextSeason:null,extraSeasonAllowed:false,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-shared-terminal-close",runtimeRevision:RUNTIME_REVISION,readyPhase:READY_PHASE,closedPhase:CLOSED_PHASE,prepare:tcPrepare,verifyIntent:tcVerifyIntent,witnessKey:tcWitnessKey,sameWitness:tcSameWitness,closeResult:tcClosed,createsAdditionalSeason:false,preservesAccumulatedScoring:true,terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false});
});
