(function(root){
  "use strict";
  const load=root.loadRuntimeScript;
  if(typeof load!=="function")return;
  const install=(id,path,key)=>load(id,path,()=>root[key]).then(()=>{const api=root[key];if(!api||typeof api.install!=="function")throw new Error(`${path} loaded without an installable ${key} API.`);api.install();return api;});
  const prepare=(items)=>items.reduce((chain,[id,path,key])=>chain.then(()=>load(id,path,()=>root[key]).then(()=>{const api=root[key];if(!api)throw new Error(`${path} loaded without its expected ${key} API.`);return api;})),Promise.resolve());
  const params=root.location?new URLSearchParams(root.location.search):new URLSearchParams();
  const acceptanceEnabled=params.get("ssjr-acceptance")==="1";
  const witnessEnabled=acceptanceEnabled&&params.get("ssjr-witness")==="1";
  const physicalEnabled=acceptanceEnabled&&!witnessEnabled&&params.get("ssjr-physical")==="1";
  (async()=>{
    const seasonResultsRoute=install("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js","CareerModeProductionSharedSeasonResultsRoute");
    const seasonCommit=install("ssjr-production-season-commit","js/productionSharedSeasonCommit.js","CareerModeProductionSharedSeasonCommit");
    const canonicalScoring=(async()=>{
      await seasonCommit;
      await prepare([
        ["ssjr-season-commit-protocol","js/sharedSeasonCommit.js","CareerModeSharedSeasonCommit"],
        ["ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js","CareerModeSparkSharedSeasonCommit"],
        ["ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js","CareerModeSharedCanonicalScoring"],
        ["ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js","CareerModeSparkSharedCanonicalScoring"]
      ]);
      return install("ssjr-production-canonical-scoring","js/productionSharedCanonicalScoring.js","CareerModeProductionSharedCanonicalScoring");
    })();
    const historyConvergence=(async()=>{
      await canonicalScoring;
      await prepare([
        ["ssjr-history-convergence-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],
        ["ssjr-history-convergence-provider","js/sparkSharedHistoryConvergence.js","CareerModeSparkSharedHistoryConvergence"]
      ]);
      return install("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js","CareerModeProductionSharedHistoryConvergence");
    })();
    const multiSeason=(async()=>{
      await historyConvergence;
      await prepare([
        ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js","CareerModeSharedMultiSeasonProgression"],
        ["ssjr-multi-season-provider","js/sparkSharedMultiSeasonProgression.js","CareerModeSparkSharedMultiSeasonProgression"]
      ]);
      return install("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js","CareerModeProductionSharedMultiSeasonProgression");
    })();
    const journeyReconnect=(async()=>{
      await multiSeason;
      await prepare([["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js","CareerModeSharedJourneyReconnect"]]);
      return install("ssjr-production-journey-reconnect","js/productionSharedJourneyReconnect.js","CareerModeProductionSharedJourneyReconnect");
    })();
    const journeyConflicts=(async()=>{
      await journeyReconnect;
      await prepare([["ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js","CareerModeSharedJourneyConflicts"]]);
      return install("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js","CareerModeProductionSharedJourneyConflicts");
    })();
    const localReconciliation=(async()=>{
      await journeyConflicts;await historyConvergence;
      await prepare([["ssjr-local-reconciliation-protocol","js/sharedLocalReconciliation.js","CareerModeSharedLocalReconciliation"]]);
      return install("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js","CareerModeProductionSharedLocalReconciliation");
    })();
    const finalReconciliation=(async()=>{
      await localReconciliation;await multiSeason;await historyConvergence;
      await prepare([["ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"]]);
      return install("ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js","CareerModeProductionSharedFinalReconciliation");
    })();
    const terminalClose=(async()=>{
      await finalReconciliation;
      await prepare([
        ["ssjr-terminal-close-protocol","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],
        ["ssjr-terminal-close-provider","js/sparkTerminalClose.js","CareerModeSparkTerminalClose"]
      ]);
      return install("ssjr-production-terminal-close","js/productionSharedTerminalClose.js","CareerModeProductionSharedTerminalClose");
    })();
    await Promise.all([
      load("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
      install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry"),
      install("ssjr-production-guard","js/productionSharedJourneyGuard.js","CareerModeProductionSharedJourneyGuard"),
      install("ssjr-production-career-start","js/productionSharedCareerStart.js","CareerModeProductionSharedCareerStart"),
      install("ssjr-production-season-results","js/productionSharedSeasonResults.js","CareerModeProductionSharedSeasonResults"),
      seasonCommit,canonicalScoring,historyConvergence,multiSeason,journeyReconnect,journeyConflicts,localReconciliation,finalReconciliation,terminalClose,
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
      if(recorder&&actorPanel){actorPanel.style.cssText="position:static;max-width:100%;max-height:none;overflow:visible;margin:12px 0 0;padding:12px;background:#111;color:#fff;border:1px solid #777;border-radius:8px;font:14px/1.4 system-ui";recorder.append(actorPanel);}
    }
    if(physicalEnabled)await install("ssjr-physical-journey-acceptance","js/ssjrPhysicalJourneyAcceptance.js","CareerModeSSJRPhysicalJourneyAcceptance");
  })().catch(error=>root.console?.warn?.("[Career Mode Showdown] Shared Journey bootstrap unavailable.",error));
})(typeof window!=="undefined"?window:globalThis);