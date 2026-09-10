(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  let installed=false,state=null,unsubscribe=null,timer=null;
  function showdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function sharedActive(){const s=showdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function online(){return !(root.navigator&&root.navigator.onLine===false);}
  function protocol(){return root.CareerModeSharedLocalReconciliation||null;}
  function history(){try{return root.CareerModeProductionSharedHistoryConvergence?.getState?.()||null;}catch(_error){return null;}}
  function connected(){return root.CareerModeSparkConnectedRivalry||null;}
  function dispatch(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:state}));}catch(_error){}return state;}
  function refresh(){
    const p=protocol();if(!p||typeof p.project!=="function"){state=null;return null;}
    let c=null;try{c=connected()?.getState?.()||null;}catch(_error){}
    state=p.project({sharedActive:sharedActive(),history:history(),connected:c,online:online()});
    return dispatch();
  }
  async function ensureConnected(){
    if(!connected()&&typeof root.loadRuntimeScript==="function")await root.loadRuntimeScript("spark-connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry);
    const api=connected();
    if(!api||typeof api.getState!=="function"||typeof api.previewLocalReconciliation!=="function"||typeof api.applyLocalReconciliation!=="function")throw Object.assign(new Error("Connected Rivalry reconciliation authority is unavailable."),{code:"LOCAL_RECONCILIATION_AUTHORITY_UNAVAILABLE"});
    if(typeof api.initialize==="function")await api.initialize();
    return api;
  }
  async function preview(){
    const api=await ensureConnected();let before=refresh();
    if(!before||before.previewAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_BLOCKED",state:before};
    await api.previewLocalReconciliation(before.binding);
    const after=refresh();
    if(!after||!(after.phase==="PREVIEW_READY"||after.phase==="OFFLINE_FALLBACK"))return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_FAILED",state:after};
    return {ok:true,state:after};
  }
  async function apply({confirmed=false}={}){
    if(confirmed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_CONFIRMATION_REQUIRED",state:refresh()};
    if(!online())return {ok:false,code:"LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED",state:refresh()};
    const api=await ensureConnected();const before=refresh();
    if(!before||before.phase!=="PREVIEW_READY"||before.applyAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_BLOCKED",state:before};
    await api.applyLocalReconciliation(before.binding);
    const after=refresh();
    if(!after||after.phase!=="APPLIED")return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_FAILED",state:after};
    return {ok:true,state:after};
  }
  function install(){
    if(installed)return true;installed=true;
    const c=connected();if(c&&typeof c.subscribe==="function")unsubscribe=c.subscribe(refresh);
    root.addEventListener?.("online",refresh);root.addEventListener?.("offline",refresh);
    for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-season-cursor-change","career-mode-showdown-state-change"])root.addEventListener?.(event,refresh);
    if(typeof root.setInterval==="function")timer=root.setInterval(refresh,POLL_MS);
    refresh();return true;
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-local-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r16",pollIntervalMs:POLL_MS,install,refresh,preview,apply,getState:()=>state,isActive:sharedActive,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true});
});
