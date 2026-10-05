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
  // JOB-24: Team V's screen loader and navigation bar, once the browser is idle (independent of the chain below).
  const v10=()=>load("v10-screens","js/v10Screens.js",()=>root.CareerModeV10Screens).then(()=>root.CareerModeV10Screens.install()).then(()=>load("v10-home-screens","js/homeScreensV10.js",()=>root.CareerModeHomeScreensV10)).then(()=>root.CareerModeHomeScreensV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Team V screens unavailable.",error));
  const resultsV10=()=>load("v10-season-final","js/seasonFinalV10.js",()=>root.CareerModeSeasonFinalV10).then(()=>root.CareerModeSeasonFinalV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Results visuals unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(()=>v10().then(resultsV10),{timeout:2500});else root.setTimeout?.(()=>v10().then(resultsV10),600);
  // JOB-26: Team V's skin for Start/Join, the League wheel and the Club packs, registered with that loader.
  const v10Setup=()=>load("v10-screens","js/v10Screens.js",()=>root.CareerModeV10Screens).then(()=>load("v10-setup","js/v10Setup.js",()=>root.CareerModeV10Setup)).then(()=>root.CareerModeV10Setup.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Team V setup skin unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Setup,{timeout:3000});else root.setTimeout?.(v10Setup,700);
  // JOB-27: Team V's Transfer War skin for the shared Transfer Challenge (registers with the loader above).
  const v10Transfer=()=>load("v10-transfer","js/transferScreenV10.js",()=>root.CareerModeTransferScreenV10).then(()=>root.CareerModeTransferScreenV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Transfer War visuals unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Transfer,{timeout:3000});else root.setTimeout?.(v10Transfer,700);
  // JOB-34: Team V's Club Assignment for the club reveal (registers with the loader above; owns clubWheelScreen).
  const v10Club=()=>load("v10-club","js/clubScreenV10.js",()=>root.CareerModeClubScreenV10).then(()=>root.CareerModeClubScreenV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Club Assignment visuals unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Club,{timeout:3000});else root.setTimeout?.(v10Club,700);
  (async()=>{
    const seasonResultsRoute=install("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js","CareerModeProductionSharedSeasonResultsRoute");
    const seasonCommit=install("ssjr-production-season-commit","js/productionSharedSeasonCommit.js","CareerModeProductionSharedSeasonCommit");
    const canonicalScoring=(async()=>{
      await seasonCommit;
      await prepare([
        ["ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog"],
        ["ssjr-shared-setup-protocol","js/sharedShowdownSetup.js","CareerModeSharedShowdownSetup"],
        ["ssjr-season-results-protocol","js/sharedSeasonResults.js","CareerModeSharedSeasonResults"],
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
        ["private-session","js/sparkPrivateSession.js","CareerModeSparkPrivateSession"],
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