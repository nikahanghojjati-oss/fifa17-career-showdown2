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
  assert.equal(result.score, 70.3, "r12 History Convergence earns product integration only after exact corrected-head validation, expected-head merge, coherent Pages deployment, main POS20 validation and release burn-in.");
  assert.equal(result.formattedScore, "70.30/100");
  assert.equal(result.featureCount, 20);
  assert.equal(result.fullyLifecycleDelivered, 12);
  assert.equal(result.preIntegrationComplete, 0);
  assert.equal(result.designDefinedOnly, 8);

  assert.equal(ledger.basis.mainSha, "637804a9d0e18a88c7a7bb3c79b93d5af2f92062");
  assert.equal(ledger.basis.branch, "main");
  assert.equal(ledger.basis.integrationMergeSha, "637804a9d0e18a88c7a7bb3c79b93d5af2f92062");
  assert.equal(ledger.basis.candidateHead, "f6801366afe5444640f8a1f80270da1b64449e82");
  assert.match(ledger.basis.candidateValidation, /POS20 run #279 exact-head green/);
  assert.equal(ledger.basis.productionRuntimeRevision, "1.9.1-r12");
  assert.match(ledger.basis.pagesDeployment, /GitHub Pages run #113 success/i);
  assert.match(ledger.basis.firestoreRulesDeployment, /No new Firestore Rules deployment required/i);
  assert.match(ledger.basis.note, /POS20 run #284 passed/i);
  assert.match(ledger.basis.note, /Release Integration Burn-In run #370 passed both/i);

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
    "career-start","transfer-challenge","results-publication","season-commit","canonical-scoring","history-convergence"
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

  assert.equal(ledger.scoreCheck.fullyIntegratedWeight, 67);
  assert.equal(ledger.scoreCheck.remainingDesignWeight, 33);
  assert.equal(ledger.scoreCheck.remainingDesignContribution, 3.3);
  assert.equal(ledger.scoreCheck.calculatedScore, 70.3);
  assert.equal(Object.prototype.hasOwnProperty.call(ledger.scoreCheck, "preIntegrationWeight"), false);

  const scoreDrift = clone(ledger); scoreDrift.currentScore = 99;
  assert.throws(() => assessMilestoneDelivery(trackerModel, scoreDrift, ssjrModel), /stored milestone score/i);
  const weightDrift = clone(ledger); weightDrift.capabilities[0].milestoneWeight += 1;
  assert.throws(() => assessMilestoneDelivery(trackerModel, weightDrift, ssjrModel), /weight drift/i);
  const outOfOrder = clone(ledger); const multiSeason = outOfOrder.capabilities.find(capability => capability.id === "multi-season"); multiSeason.stages["automated-test"] = "complete";
  assert.throws(() => assessMilestoneDelivery(trackerModel, outOfOrder, ssjrModel), /cannot complete automated-test after an earlier lifecycle stage is incomplete/i);
  const inventedPartial = clone(ledger); inventedPartial.capabilities.find(capability => capability.id === "multi-season").lifecyclePercent = 25;
  assert.throws(() => assessMilestoneDelivery(trackerModel, inventedPartial, ssjrModel), /stored lifecyclePercent must be derived/i);

  assert.match(authority, /Milestone Delivery Progress: NN\.NN\/100/);
  assert.match(authority, /does not replace SSJR readiness/i);
  assert.match(authority, /Reusable predecessor code[\s\S]+does not complete an implementation stage/i);
  assert.match(authority, /proven regression invalidates[\s\S]+MDP can decrease/i);

  process.stdout.write(`PASS MDP-1 exact SSJR denominator, six-stage lifecycle, current ${result.formattedScore} r12 integrated ledger, anti-inflation rules, regression guard and strict SSJR separation\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
