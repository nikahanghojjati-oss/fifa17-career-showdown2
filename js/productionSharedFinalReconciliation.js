(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedFinalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  const PANEL_ID="sharedFinalReconciliationPanel";
  const SAFE_LOCAL_PHASES=new Set(["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"]);
  let installed=false,busy=false,protocol=null,multiApi=null,historyApi=null,localApi=null,view=null,viewContextKey="",refreshPromise=null,refreshContextKey="";
  function pfrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pfrShared(){const s=pfrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function pfrRequest(){const s=pfrShowdown();if(!s||s.sharedJourney?.mode!=="shared")return null;const rivalryId=String(s.sharedJourney?.rivalryId||"").trim(),saveId=String(s.identity?.saveId||"").trim(),playerOneProfileId=String(s.identity?.managerProfileIds?.playerOne||"").trim(),playerTwoProfileId=String(s.identity?.managerProfileIds?.playerTwo||"").trim();if(!rivalryId||!/^save_[0-9a-f]{24}$/.test(saveId)||!/^profile_[0-9a-f]{24}$/.test(playerOneProfileId)||!/^profile_[0-9a-f]{24}$/.test(playerTwoProfileId))return null;return Object.freeze({rivalryId,saveId,playerOneProfileId,playerTwoProfileId,key:`${saveId}|${rivalryId}|${playerOneProfileId}|${playerTwoProfileId}|final-reconciliation`});}
  function pfrContextMatches(request){const current=pfrRequest();return Boolean(request&&current&&request.key===current.key);}
  function pfrLocalAuthorityMatches(request,localState){const role=String(localState?.binding?.managerRole||"");const activeProfileId=role==="playerOne"?request?.playerOneProfileId:role==="playerTwo"?request?.playerTwoProfileId:"";return Boolean(request&&localState&&SAFE_LOCAL_PHASES.has(localState.phase)&&localState.canonicalStorageMutation===false&&localState.providerWriteRequired===false&&localState.automaticLocalApply===false&&localState.candidateCOnly===true&&String(localState.binding?.saveId||"")===request.saveId&&activeProfileId&&String(localState.binding?.profileId||"")===activeProfileId);}
  function pfrSnapshotsMatch(request,multiState,historyState,localState){return Boolean(request&&multiState&&historyState&&String(multiState.rivalryId||"")===request.rivalryId&&String(historyState.rivalryId||"")===request.rivalryId&&pfrLocalAuthorityMatches(request,localState));}
  function pfrField(id){return root.document&&root.document.getElementById(id);}
  function pfrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pfrText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pfrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pfrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pfrEnsureDependencies(){
    await pfrLoad("ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js",()=>root.CareerModeSharedFinalReconciliation);
    await pfrLoad("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
    await pfrLoad("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
    await pfrLoad("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js",()=>root.CareerModeProductionSharedLocalReconciliation);
    protocol=root.CareerModeSharedFinalReconciliation;multiApi=root.CareerModeProductionSharedMultiSeasonProgression;historyApi=root.CareerModeProductionSharedHistoryConvergence;localApi=root.CareerModeProductionSharedLocalReconciliation;
    if(!protocol||typeof protocol.reconcile!=="function"||!multiApi||typeof multiApi.refresh!=="function"||typeof multiApi.getState!=="function"||!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function"||!localApi||typeof localApi.refresh!=="function"||typeof localApi.getState!=="function")throw Object.assign(new Error("Final Reconciliation dependencies are unavailable."),{code:"FINAL_RECONCILIATION_DEPENDENCY_UNAVAILABLE"});
  }
  function pfrManagerName(role){return String(pfrShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pfrEnsureUi(){
    if(!root.document)return null;const review=pfrField("seasonReviewPanel");if(!review)return null;
    let panel=pfrField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedFinalReconciliationPanel hidden";review.appendChild(panel);}
    let heading=pfrField("sharedFinalReconciliationHeading");if(!heading){heading=root.document.createElement("h3");heading.id="sharedFinalReconciliationHeading";panel.appendChild(heading);}
    let summary=pfrField("sharedFinalReconciliationSummary");if(!summary){summary=root.document.createElement("p");summary.id="sharedFinalReconciliationSummary";panel.appendChild(summary);}
    let winner=pfrField("sharedFinalReconciliationWinner");if(!winner){winner=root.document.createElement("p");winner.id="sharedFinalReconciliationWinner";panel.appendChild(winner);}
    let close=pfrField("sharedFinalReconciliationClose");if(!close){close=root.document.createElement("p");close.id="sharedFinalReconciliationClose";panel.appendChild(close);}
    return {panel,heading,summary,winner,close};
  }
  function pfrCurrentView(){const request=pfrRequest();let localState=null;try{localState=localApi?.getState?.()||null;}catch(_error){}return request&&view&&viewContextKey===request.key&&pfrLocalAuthorityMatches(request,localState)?view:null;}
  function pfrRender(){
    const ui=pfrEnsureUi();if(!ui)return false;const current=pfrCurrentView(),active=Boolean(current&&current.phase==="FINAL_SEASON_RECONCILED"&&current.finalSeasonReconciled===true);
    pfrHidden(ui.panel,!active);if(!active)return false;
    pfrText(ui.heading,"SHOWDOWN FINAL RECONCILED");
    pfrText(ui.summary,`${current.acceptedSeasons} OF ${current.totalSeasons} SEASONS ACCEPTED · NO ADDITIONAL SEASON`);
    const winner=current.winner==="draw"?"DRAW":`${pfrManagerName(current.winner)} WINS`;
    pfrText(ui.winner,`${pfrManagerName("playerOne")} ${current.managerTotals.playerOne} · ${pfrManagerName("playerTwo")} ${current.managerTotals.playerTwo} · ${winner}`);
    pfrText(ui.close,"FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP");
    return true;
  }
  function pfrDiscard(request){if(request&&viewContextKey===request.key){view=null;viewContextKey="";}pfrRender();return null;}
  async function pfrRefreshNow(request=pfrRequest()){
    if(!request||!pfrContextMatches(request))return pfrDiscard(request);
    await pfrEnsureDependencies();if(!pfrContextMatches(request))return pfrDiscard(request);
    const multiState=await multiApi.refresh();if(!pfrContextMatches(request))return pfrDiscard(request);
    const historyState=await historyApi.refresh();if(!pfrContextMatches(request))return pfrDiscard(request);
    const localState=localApi.refresh();if(!pfrContextMatches(request)||!pfrSnapshotsMatch(request,multiState,historyState,localState))return pfrDiscard(request);
    const next=protocol.reconcile({sharedActive:true,multiSeason:multiState,history:historyState,localReconciliation:localState});
    if(!pfrContextMatches(request)||!pfrSnapshotsMatch(request,multiState,historyState,localState))return pfrDiscard(request);
    view=next;viewContextKey=request.key;pfrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-final-reconciliation-state-change",{detail:view}));}catch(_error){}
    return view;
  }
  function pfrRefresh(){
    const request=pfrRequest();if(!request){view=null;viewContextKey="";pfrRender();return Promise.resolve(null);}
    if(viewContextKey&&viewContextKey!==request.key){view=null;viewContextKey="";pfrRender();}
    if(refreshPromise&&refreshContextKey===request.key)return refreshPromise;
    busy=true;const current=pfrRefreshNow(request).catch(error=>{if(pfrContextMatches(request)){pfrDiscard(request);pfrReport("Unable to reconcile final Shared Showdown",error);}return null;}).finally(()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";busy=false;}});
    refreshPromise=current;refreshContextKey=request.key;return current;
  }
  function pfrWake(event){if(root.document?.visibilityState==="hidden")return;const request=pfrRequest();if(!request){view=null;viewContextKey="";pfrRender();return;}if(event?.type==="career-mode-shared-local-reconciliation-state-change"){let localState=event.detail||null;if(!localState){try{localState=localApi?.getState?.()||null;}catch(_error){}}if(!pfrLocalAuthorityMatches(request,localState)){pfrDiscard(request);return;}}if(viewContextKey&&viewContextKey!==request.key){view=null;viewContextKey="";pfrRender();}if(busy&&refreshPromise&&refreshContextKey===request.key)return;void pfrRefresh();}
  function pfrInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-multi-season-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-showdown-state-change","career-mode-active-save-changed"]){root.addEventListener?.(event,pfrWake);}root.document?.addEventListener?.("visibilitychange",pfrWake);if(typeof root.setInterval==="function")root.setInterval(pfrWake,POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pfrWake,0);return true;}
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-final-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r17",pollIntervalMs:POLL_MS,install:pfrInstall,refresh:pfrRefresh,getState:pfrCurrentView,isActive:pfrShared,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
