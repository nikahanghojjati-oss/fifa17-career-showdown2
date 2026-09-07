(function(root){
  "use strict";
  const load=root.loadRuntimeScript;
  if(typeof load!=="function")return;
  const install=(id,path,key)=>load(id,path,()=>root[key]).then(()=>{
    const api=root[key];
    if(!api||typeof api.install!=="function")throw new Error(`${path} loaded without an installable ${key} API.`);
    api.install();
    return api;
  });
  const acceptanceEnabled=!!(root.location&&new URLSearchParams(root.location.search).get("ssjr-acceptance")==="1");
  Promise.all([
    load("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
    install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry"),
    install("ssjr-production-guard","js/productionSharedJourneyGuard.js","CareerModeProductionSharedJourneyGuard")
  ]).then(async()=>{
    if(!acceptanceEnabled)return;
    await install("ssjr-acceptance-polished-bridge","js/ssjrAcceptancePolishedBridge.js","CareerModeSSJRAcceptancePolishedBridge");
    await install("ssjr-production-acceptance-recorder","js/ssjrProductionAcceptanceRecorder.js","CareerModeSSJRProductionAcceptanceRecorder");
  }).catch(error=>root.console?.warn?.("[Career Mode Showdown] Shared Journey bootstrap unavailable.",error));
})(typeof window!=="undefined"?window:globalThis);
