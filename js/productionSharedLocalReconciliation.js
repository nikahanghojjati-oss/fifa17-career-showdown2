(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  let installed=false,state=null,unsubscribe=null,timer=null;
  function lrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function lrSharedActive(){const s=lrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function lrOnline(){return !(root.navigator&&root.navigator.onLine===false);}
  function lrProtocol(){return root.CareerModeSharedLocalReconciliation||null;}
  function lrHistory(){try{return root.CareerModeProductionSharedHistoryConvergence?.getState?.()||null;}catch(_error){return null;}}
  function lrConnected(){return root.CareerModeSparkConnectedRivalry||null;}
  function lrDispatch(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:state}));}catch(_error){}return state;}
  function lrRefresh(){
    const p=lrProtocol();if(!p||typeof p.project!=="function"){state=null;return null;}
    let c=null;try{c=lrConnected()?.getState?.()||null;}catch(_error){}
    state=p.project({sharedActive:lrSharedActive(),history:lrHistory(),connected:c,online:lrOnline()});
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
    await api.previewLocalReconciliation(before.binding);
    const after=lrRefresh();
    if(!after||!(after.phase==="PREVIEW_READY"||after.phase==="OFFLINE_FALLBACK"))return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_FAILED",state:after};
    return {ok:true,state:after};
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
    if(installed)return true;installed=true;
    const c=lrConnected();if(c&&typeof c.subscribe==="function")unsubscribe=c.subscribe(lrRefresh);
    root.addEventListener?.("online",lrRefresh);root.addEventListener?.("offline",lrRefresh);
    for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-season-cursor-change","career-mode-showdown-state-change"])root.addEventListener?.(event,lrRefresh);
    if(typeof root.setInterval==="function")timer=root.setInterval(lrRefresh,POLL_MS);
    lrRefresh();return true;
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-local-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r16",pollIntervalMs:POLL_MS,install:lrInstall,refresh:lrRefresh,preview:lrPreview,apply:lrApply,getState:()=>state,isActive:lrSharedActive,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true});
});
