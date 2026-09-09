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
  assert.equal(result.score, 55.9, "r9 earns product-integration only after merge plus coherent Pages and Spark Rules production proof.");
  assert.equal(result.formattedScore, "55.90/100");
  assert.equal(result.featureCount, 20);
  assert.equal(result.fullyLifecycleDelivered, 9);
  assert.equal(result.preIntegrationComplete, 0);
  assert.equal(result.designDefinedOnly, 11);
  assert.equal(result.featureCount, ledger.summary.featureCount);
  assert.equal(result.fullyLifecycleDelivered, ledger.summary.fullyLifecycleDelivered);
  assert.equal(result.preIntegrationComplete, ledger.summary.preIntegrationComplete);
  assert.equal(result.designDefinedOnly, ledger.summary.designDefinedOnly);

  assert.equal(ledger.basis.mainSha, "d56b5179be76d05b98a801a4de7c0f4a42262b4f");
  assert.equal(ledger.basis.integrationMergeSha, "d56b5179be76d05b98a801a4de7c0f4a42262b4f");
  assert.equal(ledger.basis.candidateHead, "97473947d8309125e2e03462da88f5891cd8acc5");
  assert.equal(ledger.basis.candidateValidation, "POS20 run #186");
  assert.equal(ledger.basis.productionRuntimeRevision, "1.9.1-r9");
  assert.match(ledger.basis.pagesDeployment, /run #106 success/i);
  assert.match(ledger.basis.firestoreRulesDeployment, /run #7 success/i);

  assert.equal(ssjrReadiness.currentScore, 0, "MDP delivery progress must not award SSJR credit.");
  assert.equal(ssjrReadiness.deliveryProgressTracker.trackerId, "MDP-1");
  assert.equal(ssjrReadiness.deliveryProgressTracker.currentScore, ledger.currentScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.formattedScore, ledger.formattedScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.doesNotGrantSSJRCredit, true);
  assert.equal(ssjrReadiness.deliveryProgressTracker.reportingReplacesFocusedSessionEstimate, true);
  assert.equal(Object.prototype.hasOwnProperty.call(ssjrReadiness, "planningEstimate"), false);

  const modelCapabilities = ssjrModel.domains.flatMap(domain => domain.capabilities.map(capability => ({id: capability.id, weight: capability.weight})));
  const ledgerCapabilities = ledger.capabilities.map(capability => ({id: capability.id, weight: capability.milestoneWeight}));
  assert.deepEqual(ledgerCapabilities, modelCapabilities, "MDP-1 must reuse the exact frozen SSJR capability IDs and weights.");
  assert.equal(trackerModel.lifecycleStages.reduce((sum, stage) => sum + stage.weight, 0), 100);
  assert.equal(trackerModel.separationFromReadiness.doesNotReplaceSSJR, true);
  assert.equal(trackerModel.separationFromReadiness.doesNotGrantSSJRCredit, true);
  assert.equal(trackerModel.scoringRules.regressionCanReduceScore, true);
  assert.equal(trackerModel.scoringRules.candidateWorkCannotEarnProductIntegration, true);

  const integrated = new Set([
    "entry-binding",
    "entry-before-draw",
    "setup-league",
    "setup-clubs",
    "setup-length",
    "setup-confirmation",
    "career-start",
    "transfer-challenge",
    "results-publication"
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
      for (const stage of trackerModel.lifecycleStages.filter(stage => stage.id !== "design")) {
        assert.equal(feature.stages[stage.id], "not_started", `${feature.id} ${stage.id}`);
      }
    }
  }

  const results = ledger.capabilities.find(capability => capability.id === "results-publication");
  assert.equal(results.weightedContribution, 6);
  assert.ok(results.evidenceRefs.includes("tests/browser/shared-season-results-audit.cjs"));
  assert.ok(results.evidenceRefs.some(ref => ref.includes("POS20 run #186 exact head 97473947")));
  assert.ok(results.evidenceRefs.some(ref => ref.includes("PR #228 merge d56b5179")));
  assert.ok(results.evidenceRefs.some(ref => ref.includes("GitHub Pages run #106 success")));
  assert.ok(results.evidenceRefs.some(ref => ref.includes("Zero Billing run #7 success")));

  assert.equal(ledger.scoreCheck.fullyIntegratedWeight, 51);
  assert.equal(ledger.scoreCheck.remainingDesignWeight, 49);
  assert.equal(ledger.scoreCheck.remainingDesignContribution, 4.9);
  assert.equal(ledger.scoreCheck.calculatedScore, 55.9);

  const scoreDrift = clone(ledger);
  scoreDrift.currentScore = 99;
  assert.throws(() => assessMilestoneDelivery(trackerModel, scoreDrift, ssjrModel), /stored milestone score/i);

  const weightDrift = clone(ledger);
  weightDrift.capabilities[0].milestoneWeight += 1;
  assert.throws(() => assessMilestoneDelivery(trackerModel, weightDrift, ssjrModel), /weight drift/i);

  const outOfOrder = clone(ledger);
  const seasonCommit = outOfOrder.capabilities.find(capability => capability.id === "season-commit");
  seasonCommit.stages["automated-test"] = "complete";
  assert.throws(() => assessMilestoneDelivery(trackerModel, outOfOrder, ssjrModel), /cannot complete automated-test after an earlier lifecycle stage is incomplete/i);

  const inventedPartial = clone(ledger);
  inventedPartial.capabilities.find(capability => capability.id === "season-commit").lifecyclePercent = 25;
  assert.throws(() => assessMilestoneDelivery(trackerModel, inventedPartial, ssjrModel), /stored lifecyclePercent must be derived/i);

  assert.match(authority, /Milestone Delivery Progress: NN\.NN\/100/);
  assert.match(authority, /does not replace SSJR readiness/i);
  assert.match(authority, /Reusable predecessor code[\s\S]+does not complete an implementation stage/i);
  assert.match(authority, /proven regression invalidates[\s\S]+MDP can decrease/i);
  assert.match(authority, /Current baseline — 39\.00\/100/i);
  assert.match(authority, /Total MDP-1: 39\.00 \/ 100/i);
  assert.match(authority, /41\.50\/100/);

  process.stdout.write(`PASS MDP-1 exact SSJR denominator, six-stage lifecycle, current ${result.formattedScore} r9 integrated ledger, anti-inflation rules, regression guard and strict SSJR separation\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
