(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedFinalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  const PANEL_ID="sharedFinalReconciliationPanel";
  let installed=false,busy=false,protocol=null,multiApi=null,historyApi=null,localApi=null,view=null,refreshPromise=null;
  function pfrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pfrShared(){const s=pfrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
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
  function pfrRender(){
    const ui=pfrEnsureUi();if(!ui)return false;const active=Boolean(view&&view.phase==="FINAL_SEASON_RECONCILED"&&view.finalSeasonReconciled===true);
    pfrHidden(ui.panel,!active);if(!active)return false;
    pfrText(ui.heading,"SHOWDOWN FINAL RECONCILED");
    pfrText(ui.summary,`${view.acceptedSeasons} OF ${view.totalSeasons} SEASONS ACCEPTED · NO ADDITIONAL SEASON`);
    const winner=view.winner==="draw"?"DRAW":`${pfrManagerName(view.winner)} WINS`;
    pfrText(ui.winner,`${pfrManagerName("playerOne")} ${view.managerTotals.playerOne} · ${pfrManagerName("playerTwo")} ${view.managerTotals.playerTwo} · ${winner}`);
    pfrText(ui.close,"FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP");
    return true;
  }
  async function pfrRefreshNow(){
    if(!pfrShared()){view=null;pfrRender();return null;}
    await pfrEnsureDependencies();
    await multiApi.refresh();await historyApi.refresh();localApi.refresh();
    const next=protocol.reconcile({sharedActive:true,multiSeason:multiApi.getState(),history:historyApi.getState(),localReconciliation:localApi.getState()});
    view=next;pfrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-final-reconciliation-state-change",{detail:view}));}catch(_error){}
    return view;
  }
  function pfrRefresh(){if(refreshPromise)return refreshPromise;busy=true;const current=pfrRefreshNow().catch(error=>{view=null;pfrRender();pfrReport("Unable to reconcile final Shared Showdown",error);return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;});refreshPromise=current;return current;}
  function pfrWake(){if(busy||root.document?.visibilityState==="hidden")return;void pfrRefresh();}
  function pfrInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-multi-season-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-connected-account-state-change"]){root.addEventListener?.(event,pfrWake);}root.document?.addEventListener?.("visibilitychange",pfrWake);if(typeof root.setInterval==="function")root.setInterval(pfrWake,POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pfrWake,0);return true;}
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-final-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r17",pollIntervalMs:POLL_MS,install:pfrInstall,refresh:pfrRefresh,getState:()=>view,isActive:pfrShared,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
