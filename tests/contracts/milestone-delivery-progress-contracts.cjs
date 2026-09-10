const assert = require("node:assert/strict");
const fs = require("node:fs");
const clone = value => JSON.parse(JSON.stringify(value));
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const read = file => fs.readFileSync(file, "utf8");

(async () => {
  const { assessMilestoneDelivery } = await import("../../scripts/assess-milestone-delivery-progress.mjs");
  const trackerModel = readJson("MILESTONE_DELIVERY_PROGRESS_MODEL.json");
  const ledger = readJson("MILESTONE_DELIVERY_PROGRESS.json");
  const ssjrModel = readJson("SHARED_SHOWDOWN_JOURNEY_MODEL.json");
  const ssjrReadiness = readJson("SHARED_SHOWDOWN_JOURNEY_READINESS.json");
  const authority = read("00_MILESTONE_DELIVERY_PROGRESS.md");

  const result = assessMilestoneDelivery(trackerModel, ledger, ssjrModel);
  assert.equal(result.trackerId, "MDP-1");
  assert.equal(result.milestoneModel, "SSJR-1.1");
  assert.equal(result.score, ledger.currentScore, "The deterministic assessor must reproduce the stored MDP score exactly.");
  assert.equal(result.formattedScore, ledger.formattedScore, "The deterministic assessor must reproduce the stored formatted MDP score exactly.");
  assert.equal(result.score, 91, "r16 Local Reconciliation earns product integration only after exact publication-head validation, expected-head merge, coherent Pages deployment, main POS20 validation and two-pass release burn-in.");
  assert.equal(result.formattedScore, "91.00/100");
  assert.equal(result.featureCount, 20);
  assert.equal(result.fullyLifecycleDelivered, 16);
  assert.equal(result.preIntegrationComplete, 0);
  assert.equal(result.designDefinedOnly, 4);

  assert.equal(ledger.basis.mainSha, "613e031c648d8d5cdb4e260e74cd93f895f49872");
  assert.equal(ledger.basis.branch, "main");
  assert.equal(ledger.basis.integrationMergeSha, "613e031c648d8d5cdb4e260e74cd93f895f49872");
  assert.equal(ledger.basis.candidateHead, "faf14a43069bc55754c1a8ad84dd9ae3ca4aef31");
  assert.match(ledger.basis.candidateValidation, /POS20 run #397 exact-head green/);
  assert.equal(ledger.basis.productionRuntimeRevision, "1.9.1-r16");
  assert.match(ledger.basis.pagesDeployment, /GitHub Pages run #122 success/i);
  assert.match(ledger.basis.firestoreRulesDeployment, /No new Firestore Rules deployment required/i);
  assert.match(ledger.basis.note, /POS20 run #399 passed/i);
  assert.match(ledger.basis.note, /Release Integration Burn-In run #379 passed both/i);

  assert.equal(ssjrReadiness.currentScore, 0, "MDP delivery progress must not award SSJR credit.");
  assert.equal(ssjrReadiness.deliveryProgressTracker.trackerId, "MDP-1");
  assert.equal(ssjrReadiness.deliveryProgressTracker.currentScore, ledger.currentScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.formattedScore, ledger.formattedScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.doesNotGrantSSJRCredit, true);
  assert.equal(ssjrReadiness.deliveryProgressTracker.reportingReplacesFocusedSessionEstimate, true);
  assert.equal(Object.prototype.hasOwnProperty.call(ssjrReadiness, "planningEstimate"), false);

  const r12Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-history-convergence-r12-production");
  assert.ok(r12Candidate, "SSJR readiness must preserve truthful zero-credit r12 production evidence.");
  assert.equal(r12Candidate.credit, 0);
  assert.deepEqual(r12Candidate.relatedCapabilityIds, ["history-convergence"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r12Candidate.layers.includes(layer), `r12 candidate evidence missing ${layer}`);
  assert.ok(r12Candidate.missingLayers.includes("production-two-account"));
  for (const expected of ["PR #235 exact candidate head f6801366","POS20 run #279 exact-head green","PR #235 merge 637804a9","GitHub Pages run #113 success","POS20 run #284 main green","Release Integration Burn-In run #370 success"]) assert.ok(r12Candidate.references.some(ref => ref.includes(expected)), `r12 evidence missing ${expected}`);
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("history-convergence"), true, "History Convergence remains uncredited in SSJR until production-two-account evidence is accepted.");

  const r13Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-multi-season-r13-production");
  assert.ok(r13Candidate, "SSJR readiness must preserve truthful zero-credit r13 production evidence.");
  assert.equal(r13Candidate.credit, 0);
  assert.deepEqual(r13Candidate.relatedCapabilityIds, ["multi-season"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r13Candidate.layers.includes(layer), `r13 candidate evidence missing ${layer}`);
  assert.ok(r13Candidate.missingLayers.includes("production-two-account"));
  for (const expected of ["PR #240 exact candidate head 96dcf910","POS20 run #343 exact-head green","PR #240 merge cfe6f801","GitHub Pages run #115 success","POS20 run #350 main green","Release Integration Burn-In run #372 success"]) assert.ok(r13Candidate.references.some(ref => ref.includes(expected)), `r13 evidence missing ${expected}`);
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("multi-season"), true, "Multi Season remains uncredited in SSJR until production-two-account evidence is accepted.");

  const r14Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-journey-reconnect-r14-production");
  assert.ok(r14Candidate, "SSJR readiness must preserve truthful zero-credit r14 production evidence.");
  assert.equal(r14Candidate.credit, 0);
  assert.deepEqual(r14Candidate.relatedCapabilityIds, ["journey-reconnect"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r14Candidate.layers.includes(layer), `r14 candidate evidence missing ${layer}`);
  assert.ok(r14Candidate.missingLayers.includes("production-two-account"));
  for (const expected of ["PR #242 exact candidate head 4ca8651","POS20 run #371 exact-head green","PR #242 merge 97c28b1","GitHub Pages run #117 success","POS20 run #372 main green","Release Integration Burn-In run #374 success"]) assert.ok(r14Candidate.references.some(ref => ref.includes(expected)), `r14 evidence missing ${expected}`);
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("journey-reconnect"), true, "Journey Reconnect remains uncredited in SSJR until production-two-account evidence is accepted.");

  const r15Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-journey-conflicts-r15-production");
  assert.ok(r15Candidate, "SSJR readiness must preserve truthful zero-credit r15 production evidence.");
  assert.equal(r15Candidate.credit, 0);
  assert.deepEqual(r15Candidate.relatedCapabilityIds, ["journey-conflicts"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r15Candidate.layers.includes(layer), `r15 candidate evidence missing ${layer}`);
  assert.ok(r15Candidate.missingLayers.includes("production-two-account"));
  for (const expected of ["PR #244 exact candidate head f63f6efc","POS20 run #387 exact-head green","PR #244 merge 4d202126","GitHub Pages run #119 success","POS20 run #388 main green","Release Integration Burn-In run #376 success"]) assert.ok(r15Candidate.references.some(ref => ref.includes(expected)), `r15 evidence missing ${expected}`);
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("journey-conflicts"), true, "Journey Conflicts remains uncredited in SSJR until production-two-account evidence is accepted.");

  const r16Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-local-reconciliation-r16-production");
  assert.ok(r16Candidate, "SSJR readiness must preserve truthful zero-credit r16 production evidence.");
  assert.equal(r16Candidate.credit, 0);
  assert.deepEqual(r16Candidate.relatedCapabilityIds, ["local-reconciliation"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r16Candidate.layers.includes(layer), `r16 candidate evidence missing ${layer}`);
  assert.ok(r16Candidate.missingLayers.includes("production-two-account"));
  for (const expected of ["PR #246 exact publication head faf14a43","POS20 run #397 exact-head green","PR #246 merge 613e031c","GitHub Pages run #122 success","POS20 run #399 main green","Release Integration Burn-In run #379 success"]) assert.ok(r16Candidate.references.some(ref => ref.includes(expected)), `r16 evidence missing ${expected}`);
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("local-reconciliation"), true, "Local Reconciliation remains uncredited in SSJR until production-two-account evidence is accepted.");

  const modelCapabilities = ssjrModel.domains.flatMap(domain => domain.capabilities.map(capability => ({id: capability.id, weight: capability.weight})));
  const ledgerCapabilities = ledger.capabilities.map(capability => ({id: capability.id, weight: capability.milestoneWeight}));
  assert.deepEqual(ledgerCapabilities, modelCapabilities, "MDP-1 must reuse the exact frozen SSJR capability IDs and weights.");
  assert.equal(trackerModel.lifecycleStages.reduce((sum, stage) => sum + stage.weight, 0), 100);
  assert.equal(trackerModel.separationFromReadiness.doesNotReplaceSSJR, true);
  assert.equal(trackerModel.separationFromReadiness.doesNotGrantSSJRCredit, true);
  assert.equal(trackerModel.scoringRules.regressionCanReduceScore, true);
  assert.equal(trackerModel.scoringRules.candidateWorkCannotEarnProductIntegration, true);

  const integrated = new Set([
    "entry-binding","entry-before-draw","setup-league","setup-clubs","setup-length","setup-confirmation",
    "career-start","transfer-challenge","results-publication","season-commit","canonical-scoring","history-convergence","multi-season","journey-reconnect","journey-conflicts","local-reconciliation"
  ]);
  for (const feature of ledger.capabilities) {
    if (integrated.has(feature.id)) {
      assert.equal(feature.lifecyclePercent, 100, `${feature.id} must be fully lifecycle-delivered.`);
      assert.equal(feature.status, "integrated");
      for (const stage of trackerModel.lifecycleStages) assert.equal(feature.stages[stage.id], "complete", `${feature.id} ${stage.id}`);
    } else {
      assert.equal(feature.lifecyclePercent, 10, `${feature.id} must remain design-only until its own implementation lifecycle is proven.`);
      assert.equal(feature.status, "design_defined");
      assert.equal(feature.stages.design, "complete");
      for (const stage of trackerModel.lifecycleStages.filter(stage => stage.id !== "design")) assert.equal(feature.stages[stage.id], "not_started", `${feature.id} ${stage.id}`);
    }
  }

  const historyConvergence = ledger.capabilities.find(capability => capability.id === "history-convergence");
  assert.equal(historyConvergence.weightedContribution, 5);
  for (const ref of ["js/sharedHistoryConvergence.js","js/sparkSharedHistoryConvergence.js","js/productionSharedHistoryConvergence.js","tests/contracts/shared-history-convergence-production-contracts.cjs","tests/browser/shared-history-convergence-audit.cjs","tests/browser/settings-offline-save-library-editor-audit.cjs"]) assert.ok(historyConvergence.evidenceRefs.includes(ref), `History Convergence evidence missing ${ref}`);
  for (const expected of ["PR #235 exact candidate head f6801366","POS20 run #279 exact-head green","PR #235 merge 637804a9","GitHub Pages run #113 success","POS20 run #284 main green","Release Integration Burn-In run #370 success"]) assert.ok(historyConvergence.evidenceRefs.some(ref => ref.includes(expected)), `History Convergence integration evidence missing ${expected}`);

  const multiSeasonIntegrated = ledger.capabilities.find(capability => capability.id === "multi-season");
  assert.equal(multiSeasonIntegrated.weightedContribution, 8);
  for (const ref of ["js/sharedMultiSeasonProgression.js","js/sparkSharedMultiSeasonProgression.js","js/productionSharedMultiSeasonProgression.js","tests/contracts/shared-multi-season-progression-production-contracts.cjs","tests/browser/shared-multi-season-progression-audit.cjs"]) assert.ok(multiSeasonIntegrated.evidenceRefs.includes(ref), `Multi Season evidence missing ${ref}`);
  for (const expected of ["PR #240 exact candidate head 96dcf910","POS20 run #343 exact-head green","PR #240 merge cfe6f801","GitHub Pages run #115 success","POS20 run #350 main green","Release Integration Burn-In run #372 success"]) assert.ok(multiSeasonIntegrated.evidenceRefs.some(ref => ref.includes(expected)), `Multi Season integration evidence missing ${expected}`);

  const journeyReconnectIntegrated = ledger.capabilities.find(capability => capability.id === "journey-reconnect");
  assert.equal(journeyReconnectIntegrated.weightedContribution, 5);
  for (const ref of ["js/sharedJourneyReconnect.js","js/productionSharedJourneyReconnect.js","service-worker.js","tests/contracts/shared-journey-reconnect-production-contracts.cjs","tests/browser/shared-journey-reconnect-audit.cjs"]) assert.ok(journeyReconnectIntegrated.evidenceRefs.includes(ref), `Journey Reconnect evidence missing ${ref}`);
  for (const expected of ["PR #242 exact candidate head 4ca8651","POS20 run #371 exact-head green","PR #242 merge 97c28b1","GitHub Pages run #117 success","POS20 run #372 main green","Release Integration Burn-In run #374 success"]) assert.ok(journeyReconnectIntegrated.evidenceRefs.some(ref => ref.includes(expected)), `Journey Reconnect integration evidence missing ${expected}`);

  const journeyConflictsIntegrated = ledger.capabilities.find(capability => capability.id === "journey-conflicts");
  assert.equal(journeyConflictsIntegrated.weightedContribution, 5);
  for (const ref of ["js/sharedJourneyConflicts.js","js/productionSharedJourneyConflicts.js","service-worker.js","tests/contracts/shared-journey-conflicts-production-contracts.cjs","tests/browser/shared-journey-conflicts-audit.cjs"]) assert.ok(journeyConflictsIntegrated.evidenceRefs.includes(ref), `Journey Conflicts evidence missing ${ref}`);
  for (const expected of ["PR #244 exact candidate head f63f6efc","POS20 run #387 exact-head green","PR #244 merge 4d202126","GitHub Pages run #119 success","POS20 run #388 main green","Release Integration Burn-In run #376 success"]) assert.ok(journeyConflictsIntegrated.evidenceRefs.some(ref => ref.includes(expected)), `Journey Conflicts integration evidence missing ${expected}`);

  const localReconciliationIntegrated = ledger.capabilities.find(capability => capability.id === "local-reconciliation");
  assert.equal(localReconciliationIntegrated.weightedContribution, 5);
  for (const ref of ["js/sharedLocalReconciliation.js","js/productionSharedLocalReconciliation.js","js/sparkConnectedRivalry.js","service-worker.js","tests/contracts/shared-local-reconciliation-production-contracts.cjs","tests/browser/shared-local-reconciliation-audit.cjs"]) assert.ok(localReconciliationIntegrated.evidenceRefs.includes(ref), `Local Reconciliation evidence missing ${ref}`);
  for (const expected of ["PR #246 exact publication head faf14a43","POS20 run #397 exact-head green","PR #246 merge 613e031c","GitHub Pages run #122 success","POS20 run #399 main green","Release Integration Burn-In run #379 success"]) assert.ok(localReconciliationIntegrated.evidenceRefs.some(ref => ref.includes(expected)), `Local Reconciliation integration evidence missing ${expected}`);

  assert.equal(ledger.scoreCheck.fullyIntegratedWeight, 90);
  assert.equal(ledger.scoreCheck.remainingDesignWeight, 10);
  assert.equal(ledger.scoreCheck.remainingDesignContribution, 1);
  assert.equal(ledger.scoreCheck.calculatedScore, 91);
  assert.equal(Object.prototype.hasOwnProperty.call(ledger.scoreCheck, "preIntegrationWeight"), false);

  const scoreDrift = clone(ledger); scoreDrift.currentScore = 99;
  assert.throws(() => assessMilestoneDelivery(trackerModel, scoreDrift, ssjrModel), /stored milestone score/i);
  const weightDrift = clone(ledger); weightDrift.capabilities[0].milestoneWeight += 1;
  assert.throws(() => assessMilestoneDelivery(trackerModel, weightDrift, ssjrModel), /weight drift/i);
  const outOfOrder = clone(ledger); const finalReconciliation = outOfOrder.capabilities.find(capability => capability.id === "final-reconciliation"); finalReconciliation.stages["automated-test"] = "complete";
  assert.throws(() => assessMilestoneDelivery(trackerModel, outOfOrder, ssjrModel), /cannot complete automated-test after an earlier lifecycle stage is incomplete/i);
  const inventedPartial = clone(ledger); inventedPartial.capabilities.find(capability => capability.id === "journey-conflicts").lifecyclePercent = 25;
  assert.throws(() => assessMilestoneDelivery(trackerModel, inventedPartial, ssjrModel), /stored lifecyclePercent must be derived/i);

  assert.match(authority, /Milestone Delivery Progress: NN\.NN\/100/);
  assert.match(authority, /does not replace SSJR readiness/i);
  assert.match(authority, /Reusable predecessor code[\s\S]+does not complete an implementation stage/i);
  assert.match(authority, /proven regression invalidates[\s\S]+MDP can decrease/i);

  process.stdout.write(`PASS MDP-1 exact SSJR denominator, six-stage lifecycle, current ${result.formattedScore} r16 integrated ledger, anti-inflation rules, regression guard and strict SSJR separation\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
