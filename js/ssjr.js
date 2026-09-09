(function(root){
  "use strict";
  const load=root.loadRuntimeScript;
  if(typeof load!=="function")return;
  const install=(id,path,key)=>load(id,path,()=>root[key]).then(()=>{const api=root[key];if(!api||typeof api.install!=="function")throw new Error(`${path} loaded without an installable ${key} API.`);api.install();return api;});
  const params=root.location?new URLSearchParams(root.location.search):new URLSearchParams();
  const acceptanceEnabled=params.get("ssjr-acceptance")==="1";
  const witnessEnabled=acceptanceEnabled&&params.get("ssjr-witness")==="1";
  (async()=>{
    const seasonResultsRoute=install("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js","CareerModeProductionSharedSeasonResultsRoute");
    await Promise.all([
      load("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
      install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry"),
      install("ssjr-production-guard","js/productionSharedJourneyGuard.js","CareerModeProductionSharedJourneyGuard"),
      install("ssjr-production-career-start","js/productionSharedCareerStart.js","CareerModeProductionSharedCareerStart"),
      install("ssjr-production-season-results","js/productionSharedSeasonResults.js","CareerModeProductionSharedSeasonResults"),
      (async()=>{await seasonResultsRoute;return install("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js","CareerModeProductionSharedTransferChallenge");})()
    ]);
    if(!acceptanceEnabled)return;
    if(!witnessEnabled)await install("ssjr-acceptance-polished-bridge","js/ssjrAcceptancePolishedBridge.js","CareerModeSSJRAcceptancePolishedBridge");
    await load("ssjr-stage5f-negative-probes","js/stage5fProductionAuthenticatedNegatives.js",()=>root.CareerModeStage5fProductionAuthenticatedNegatives);
    if(!witnessEnabled)await load("ssjr-production-negative-probe-runner","js/ssjrProductionNegativeProbeRunner.js",()=>root.CareerModeSSJRProductionNegativeProbeRunner);
    await load("ssjr-production-negative-evidence","js/ssjrProductionNegativeEvidence.js",()=>root.CareerModeSSJRProductionNegativeEvidence);
    if(!witnessEnabled)await install("ssjr-production-acceptance-recorder","js/ssjrProductionAcceptanceRecorder.js","CareerModeSSJRProductionAcceptanceRecorder");
    const actor=root.CareerModeSSJRProductionActorEvidence;
    if(!actor||typeof actor.install!=="function")throw new Error("js/ssjrProductionNegativeEvidence.js loaded without the actor-attributed v2 acceptance sidecar.");
    actor.install();
    if(!witnessEnabled&&root.document){
      const recorder=root.document.getElementById("ssjrProductionAcceptanceRecorder");
      const actorPanel=root.document.getElementById("ssjrActorEvidenceV2");
      if(recorder&&actorPanel){
        actorPanel.style.cssText="position:static;max-width:100%;max-height:none;overflow:visible;margin:12px 0 0;padding:12px;background:#111;color:#fff;border:1px solid #777;border-radius:8px;font:14px/1.4 system-ui";
        recorder.append(actorPanel);
      }
    }
  })().catch(error=>root.console?.warn?.("[Career Mode Showdown] Shared Journey bootstrap unavailable.",error));
})(typeof window!=="undefined"?window:globalThis);
