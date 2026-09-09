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
  assert.equal(result.score, ledger.currentScore, "The deterministic assessor must reproduce the current stored MDP score exactly.");
  assert.equal(result.formattedScore, ledger.formattedScore, "The deterministic assessor must reproduce the current stored formatted MDP score exactly.");
  assert.equal(result.featureCount, ledger.summary.featureCount);
  assert.equal(result.fullyLifecycleDelivered, ledger.summary.fullyLifecycleDelivered);
  assert.equal(result.preIntegrationComplete, ledger.summary.preIntegrationComplete);
  assert.equal(result.designDefinedOnly, ledger.summary.designDefinedOnly);
  assert.equal(result.score, 55.3, "The exact r9 candidate earns only completed pre-integration lifecycle stages.");
  assert.equal(result.formattedScore, "55.30/100");
  assert.equal(result.featureCount, 20);
  assert.equal(result.fullyLifecycleDelivered, 8);
  assert.equal(result.preIntegrationComplete, 1);
  assert.equal(result.designDefinedOnly, 11);

  assert.equal(ledger.basis.candidateHead, "97473947d8309125e2e03462da88f5891cd8acc5");
  assert.equal(ledger.basis.candidateValidation, "POS20 run #186");
  assert.equal(ledger.basis.productionRuntimeRevision, "1.9.1-r8", "Unmerged candidate work must not rewrite deployed production authority.");
  assert.equal(ledger.basis.candidateRuntimeRevision, "1.9.1-r9");
  assert.equal(ledger.capabilities.find(capability => capability.id === "results-publication").stages["product-integration"], "in_progress");

  assert.equal(ssjrReadiness.currentScore, 0, "MDP delivery progress must not award SSJR credit.");
  assert.equal(ssjrReadiness.deliveryProgressTracker.trackerId, "MDP-1");
  assert.equal(ssjrReadiness.deliveryProgressTracker.currentScore, ledger.currentScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.formattedScore, ledger.formattedScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.doesNotGrantSSJRCredit, true);
  assert.equal(ssjrReadiness.deliveryProgressTracker.reportingReplacesFocusedSessionEstimate, true);
  assert.equal(Object.prototype.hasOwnProperty.call(ssjrReadiness, "planningEstimate"), false, "The visible focused-session forecast must be replaced by MDP-1.");

  const modelCapabilities = ssjrModel.domains.flatMap(domain => domain.capabilities.map(capability => ({id: capability.id, weight: capability.weight})));
  const ledgerCapabilities = ledger.capabilities.map(capability => ({id: capability.id, weight: capability.milestoneWeight}));
  assert.deepEqual(ledgerCapabilities, modelCapabilities, "MDP-1 must reuse the exact frozen SSJR capability IDs and weights for this milestone.");
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
    "transfer-challenge"
  ]);
  for (const feature of ledger.capabilities) {
    if (integrated.has(feature.id)) {
      assert.equal(feature.lifecyclePercent, 100, `${feature.id} must remain fully lifecycle-delivered.`);
      for (const stage of trackerModel.lifecycleStages) assert.equal(feature.stages[stage.id], "complete", `${feature.id} ${stage.id}`);
      assert.equal(feature.status, "integrated");
    } else if (feature.id === "results-publication") {
      assert.equal(feature.lifecyclePercent, 90, "Shared Season Results must stop at pre-integration maturity on the unmerged r9 candidate.");
      assert.equal(feature.weightedContribution, 5.4);
      assert.equal(feature.status, "pre_integration_complete");
      for (const stage of ["design","implementation","automated-test","defect-resolution","regression-retest"]) assert.equal(feature.stages[stage], "complete", `results-publication ${stage}`);
      assert.equal(feature.stages["product-integration"], "in_progress");
      assert.ok(feature.evidenceRefs.some(ref => ref.includes("POS20 run #186 exact head 97473947")), "r9 MDP credit must identify the exact validated candidate.");
      assert.ok(feature.evidenceRefs.includes("tests/browser/shared-season-results-audit.cjs"), "r9 MDP credit must retain the two-context browser proof.");
    } else {
      assert.equal(feature.lifecyclePercent, 10, `${feature.id} must remain design-only until its own milestone-specific implementation lifecycle is recorded.`);
      assert.equal(feature.stages.design, "complete");
      for (const stage of trackerModel.lifecycleStages.filter(stage => stage.id !== "design")) assert.equal(feature.stages[stage.id], "not_started", `${feature.id} ${stage.id}`);
    }
  }

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
  assert.match(authority, /Current baseline — 39\.00\/100/i, "The authority document must preserve the dated original MDP reconstruction as historical provenance.");
  assert.match(authority, /Total MDP-1: 39\.00 \/ 100/i);
  assert.match(authority, /41\.50\/100/);

  process.stdout.write(`PASS MDP-1 exact SSJR feature denominator, six-stage engineering lifecycle, current ${result.formattedScore} r9 pre-integration ledger, historical 39.00 reconstruction provenance, anti-inflation rules and strict separation from SSJR evidence credit\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
