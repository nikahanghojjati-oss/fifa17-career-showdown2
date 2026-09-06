(function(root){
  "use strict";
  const load=root.loadRuntimeScript;
  if(typeof load!=="function")return;
  const install=(id,path,key)=>load(id,path,()=>root[key]).then(api=>{if(api&&typeof api.install==="function")api.install();return api;});
  Promise.all([
    load("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
    install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry"),
    install("ssjr-production-guard","js/productionSharedJourneyGuard.js","CareerModeProductionSharedJourneyGuard")
  ]).catch(error=>root.console?.warn?.("[Career Mode Showdown] Shared Journey bootstrap unavailable.",error));
})(typeof window!=="undefined"?window:globalThis);
