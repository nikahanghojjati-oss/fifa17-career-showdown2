(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000,PANEL_ID="sharedLocalReconciliationPanel",ACTION_ID="sharedLocalReconciliationPreview";
  let installed=false,state=null,unsubscribe=null,timer=null,uiBusy=false,uiError="",uiContextKey="";
  function lrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function lrSharedActive(){const s=lrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function lrOnline(){return !(root.navigator&&root.navigator.onLine===false);}
  function lrProtocol(){return root.CareerModeSharedLocalReconciliation||null;}
  function lrHistory(){try{return root.CareerModeProductionSharedHistoryConvergence?.getState?.()||null;}catch(_error){return null;}}
  function lrConnected(){return root.CareerModeSparkConnectedRivalry||null;}
  function lrField(id){return root.document&&root.document.getElementById(id);}
  function lrText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function lrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function lrHistoryReady(){const history=lrHistory();return Boolean(history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED");}
  function lrEnsureUi(){
    if(!root.document)return null;const review=lrField("seasonReviewPanel");if(!review)return null;
    let panel=lrField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedLocalReconciliationPanel hidden";review.appendChild(panel);}
    const ensure=(id,tag,className="")=>{let node=lrField(id);if(!node){node=root.document.createElement(tag);node.id=id;if(className)node.className=className;panel.appendChild(node);}return node;};
    const heading=ensure("sharedLocalReconciliationHeading","h3"),summary=ensure("sharedLocalReconciliationSummary","p"),status=ensure("sharedLocalReconciliationStatus","p","stateNote"),actions=ensure("sharedLocalReconciliationActions","div","seasonReviewActions");
    status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    let preview=lrField(ACTION_ID);if(!preview){preview=root.document.createElement("button");preview.id=ACTION_ID;preview.className="menuButton";preview.type="button";preview.addEventListener("click",()=>{void lrPreviewFromUi();});actions.appendChild(preview);}
    return {panel,heading,summary,status,actions,preview};
  }
  function lrReason(reason){return ({["history-not-authoritative"]:"Waiting for authoritative Shared History.",["connected-rivalry-not-exact"]:"Checking the exact connected rivalry and registered local Save.",["remote-not-observed"]:"Waiting for the current remote snapshot.",["offline-preview-only"]:"Offline: the read-only preview can use the last observed remote snapshot.",["offline-no-observed-remote"]:"Offline with no observed remote snapshot yet."})[reason]||"Local Reconciliation is preparing.";}
  function lrRender(){
    const ui=lrEnsureUi();if(!ui)return false;const visible=Boolean(lrSharedActive()&&lrHistoryReady()&&state);lrHidden(ui.panel,!visible);if(!visible)return false;
    lrText(ui.heading,"LOCAL RECONCILIATION");
    lrText(ui.summary,"Preview the exact remote snapshot against this device without changing the canonical local Save. Candidate C Apply is intentionally not exposed in this gameplay flow.");
    const ready=state.phase==="PREVIEW_READY",applied=state.phase==="APPLIED";
    const message=uiError||(ready?"PREVIEW READY ✓ · CANONICAL LOCAL SAVE REMAINS UNCHANGED":applied?"LOCAL RECONCILIATION WAS ALREADY APPLIED THROUGH ADVANCED RECOVERY":state.phase==="OFFLINE_FALLBACK"&&state.previewAllowed?"OFFLINE PREVIEW AVAILABLE · APPLY REMAINS DISABLED":lrReason(state.reason));
    lrText(ui.status,message);
    lrHidden(ui.preview,ready||applied);ui.preview.disabled=uiBusy;lrText(ui.preview,uiBusy?"CHECKING LOCAL RECONCILIATION…":"PREVIEW LOCAL RECONCILIATION");
    return true;
  }
  function lrDispatch(){lrRender();try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:state}));}catch(_error){}return state;}
  function lrContextKey(){const showdown=lrShowdown(),binding=state?.binding;return [showdown?.id||"",showdown?.sharedJourney?.rivalryId||"",binding?.saveId||"",binding?.profileId||"",binding?.managerRole||""].join("|");}
  function lrRefresh(){
    const p=lrProtocol();if(!p||typeof p.project!=="function"){state=null;return null;}
    let c=null;try{c=lrConnected()?.getState?.()||null;}catch(_error){}
    state=p.project({sharedActive:lrSharedActive(),history:lrHistory(),connected:c,online:lrOnline()});
    const nextContextKey=lrContextKey();
    if(nextContextKey!==uiContextKey||state.phase==="PREVIEW_READY"||state.phase==="APPLIED")uiError="";
    uiContextKey=nextContextKey;
    return lrDispatch();
  }
  async function lrEnsureConnected(){
    if(!lrConnected()&&typeof root.loadRuntimeScript==="function")await root.loadRuntimeScript("spark-connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry);
    const api=lrConnected();
    if(!api||typeof api.getState!=="function"||typeof api.previewLocalReconciliation!=="function"||typeof api.applyLocalReconciliation!=="function")throw Object.assign(new Error("Connected Rivalry reconciliation authority is unavailable."),{code:"LOCAL_RECONCILIATION_AUTHORITY_UNAVAILABLE"});
    if(typeof api.initialize==="function")await api.initialize();
    return api;
  }
  async function lrPreview(){
    const api=await lrEnsureConnected();let before=lrRefresh();
    if(!before||before.previewAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_BLOCKED",state:before};
    const acceptance=root.CareerModeSSJRPhysicalJourneyAcceptance;
    const acceptanceEnabled=Boolean(acceptance&&acceptance.enabled===true&&typeof acceptance.captureLocalReconciliationBaseline==="function"&&typeof acceptance.verifyLocalReconciliationPreview==="function");
    let proofArmed=false;
    if(acceptanceEnabled)proofArmed=await acceptance.captureLocalReconciliationBaseline();
    try{await api.previewLocalReconciliation(before.binding);}
    finally{if(proofArmed)await acceptance.verifyLocalReconciliationPreview();}
    const after=lrRefresh();
    if(!after||!(after.phase==="PREVIEW_READY"||after.phase==="OFFLINE_FALLBACK"))return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_FAILED",state:after};
    return {ok:true,state:after};
  }
  async function lrPreviewFromUi(){
    if(uiBusy)return false;uiBusy=true;uiError="";lrRender();
    try{const result=await lrPreview();if(!result||result.ok!==true){uiError=`LOCAL RECONCILIATION PREVIEW NOT READY · ${result?.code||"TRY AGAIN AFTER SHARED HISTORY/CONNECTION RECOVERS"}`;return false;}return true;}
    catch(error){uiError=`LOCAL RECONCILIATION PREVIEW FAILED · ${error?.code||error?.message||"TRY AGAIN"}`;return false;}
    finally{uiBusy=false;lrRender();}
  }
  async function lrApply({confirmed=false}={}){
    if(confirmed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_CONFIRMATION_REQUIRED",state:lrRefresh()};
    if(!lrOnline())return {ok:false,code:"LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED",state:lrRefresh()};
    const api=await lrEnsureConnected();const before=lrRefresh();
    if(!before||before.phase!=="PREVIEW_READY"||before.applyAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_BLOCKED",state:before};
    await api.applyLocalReconciliation(before.binding);
    const after=lrRefresh();
    if(!after||after.phase!=="APPLIED")return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_FAILED",state:after};
    return {ok:true,state:after};
  }
  function lrInstall(){
    if(installed){lrRender();return true;}installed=true;if(root.document)lrEnsureUi();
    const c=lrConnected();if(c&&typeof c.subscribe==="function")unsubscribe=c.subscribe(lrRefresh);
    root.addEventListener?.("online",lrRefresh);root.addEventListener?.("offline",lrRefresh);
    for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-season-cursor-change","career-mode-showdown-state-change"])root.addEventListener?.(event,lrRefresh);
    if(typeof root.setInterval==="function")timer=root.setInterval(lrRefresh,POLL_MS);
    lrRefresh();return true;
  }
  return Object.freeze({contractVersion:2,feature:"ssjr-production-shared-local-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r20",pollIntervalMs:POLL_MS,install:lrInstall,refresh:lrRefresh,preview:lrPreview,previewFromUi:lrPreviewFromUi,apply:lrApply,getState:()=>state,isActive:lrSharedActive,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,acceptanceStorageProofScope:"local-reconciliation-preview"});
});
