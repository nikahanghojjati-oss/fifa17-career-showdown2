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
  assert.equal(result.score, 65.8, "r11 Canonical Scoring earns product integration only after exact candidate validation, merge, coherent Pages deployment and exact-main regression proof.");
  assert.equal(result.formattedScore, "65.80/100");
  assert.equal(result.featureCount, 20);
  assert.equal(result.fullyLifecycleDelivered, 11);
  assert.equal(result.preIntegrationComplete, 0);
  assert.equal(result.designDefinedOnly, 9);
  assert.equal(result.featureCount, ledger.summary.featureCount);
  assert.equal(result.fullyLifecycleDelivered, ledger.summary.fullyLifecycleDelivered);
  assert.equal(result.preIntegrationComplete, ledger.summary.preIntegrationComplete);
  assert.equal(result.designDefinedOnly, ledger.summary.designDefinedOnly);

  assert.equal(ledger.basis.mainSha, "be5289cdbfcc8285ab8ddd33cd9fe9f1b3b7198e");
  assert.equal(ledger.basis.branch, "main");
  assert.equal(ledger.basis.integrationMergeSha, "be5289cdbfcc8285ab8ddd33cd9fe9f1b3b7198e");
  assert.equal(ledger.basis.candidateHead, "364b931d31eca652a4e37faf7c4bc4691b7f06f5");
  assert.match(ledger.basis.candidateValidation, /POS20 run #255 exact-head green/);
  assert.match(ledger.basis.postMergeValidation, /POS20 run #256 exact-main green/);
  assert.equal(ledger.basis.productionRuntimeRevision, "1.9.1-r11");
  assert.match(ledger.basis.pagesDeployment, /GitHub Pages run #110 success/i);
  assert.match(ledger.basis.firestoreRulesDeployment, /No r11 Rules change required/i);

  assert.equal(ssjrReadiness.currentScore, 0, "MDP delivery progress must not award SSJR credit.");
  assert.equal(ssjrReadiness.deliveryProgressTracker.trackerId, "MDP-1");
  assert.equal(ssjrReadiness.deliveryProgressTracker.currentScore, ledger.currentScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.formattedScore, ledger.formattedScore);
  assert.equal(ssjrReadiness.deliveryProgressTracker.doesNotGrantSSJRCredit, true);
  assert.equal(ssjrReadiness.deliveryProgressTracker.reportingReplacesFocusedSessionEstimate, true);
  assert.equal(Object.prototype.hasOwnProperty.call(ssjrReadiness, "planningEstimate"), false);

  const r10Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-season-commit-r10-candidate");
  assert.ok(r10Candidate, "SSJR readiness must preserve the truthful zero-credit r10 production evidence record.");
  assert.equal(r10Candidate.credit, 0);
  assert.deepEqual(r10Candidate.relatedCapabilityIds, ["season-commit"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r10Candidate.layers.includes(layer), `r10 candidate evidence missing ${layer}`);
  assert.ok(r10Candidate.missingLayers.includes("production-two-account"));
  assert.ok(r10Candidate.references.some(ref => ref.includes("PR #230 merge 72925be0")));
  assert.ok(r10Candidate.references.some(ref => ref.includes("GitHub Pages run #108 success")));

  const r11Candidate = ssjrReadiness.candidateEvidence.find(item => item.id === "ssjr1-canonical-scoring-r11-candidate");
  assert.ok(r11Candidate, "SSJR readiness must record r11 automated/deployed evidence without inflating SSJR.");
  assert.equal(r11Candidate.credit, 0);
  assert.deepEqual(r11Candidate.relatedCapabilityIds, ["canonical-scoring"]);
  for (const layer of ["deterministic-behavior","provider-enforcement","isolated-browser-protocol","deployed-runtime"]) assert.ok(r11Candidate.layers.includes(layer), `r11 candidate evidence missing ${layer}`);
  assert.ok(r11Candidate.missingLayers.includes("production-two-account"));
  assert.ok(r11Candidate.references.some(ref => ref.includes("POS20 run #255 exact-head green")));
  assert.ok(r11Candidate.references.some(ref => ref.includes("PR #232 merge be5289cd")));
  assert.ok(r11Candidate.references.some(ref => ref.includes("GitHub Pages run #110 success")));
  assert.ok(r11Candidate.references.some(ref => ref.includes("POS20 run #256 exact-main green")));
  assert.equal(ssjrReadiness.remainingCapabilityIds.includes("canonical-scoring"), true, "Canonical Scoring remains uncredited in SSJR until production-two-account evidence is accepted.");

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
    "results-publication",
    "season-commit",
    "canonical-scoring"
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
  assert.ok(results.evidenceRefs.some(ref => ref.includes("PR #228 merge d56b5179")));

  const seasonCommit = ledger.capabilities.find(capability => capability.id === "season-commit");
  assert.equal(seasonCommit.weightedContribution, 4);
  for (const ref of ["js/sharedSeasonCommit.js","js/sparkSharedSeasonCommit.js","js/productionSharedSeasonCommit.js","firestore.season-commit-production.fragment.rules","tests/contracts/shared-season-commit-production-contracts.cjs","tests/browser/shared-season-commit-audit.cjs"]) assert.ok(seasonCommit.evidenceRefs.includes(ref), `Season Commit evidence missing ${ref}`);
  assert.ok(seasonCommit.evidenceRefs.some(ref => ref.includes("POS20 run #215 exact head 754d6123")));
  assert.ok(seasonCommit.evidenceRefs.some(ref => ref.includes("PR #230 merge 72925be0")));

  const canonicalScoring = ledger.capabilities.find(capability => capability.id === "canonical-scoring");
  assert.equal(canonicalScoring.weightedContribution, 7);
  for (const ref of ["js/sharedCanonicalScoring.js","js/sparkSharedCanonicalScoring.js","js/productionSharedCanonicalScoring.js","tests/contracts/shared-canonical-scoring-contracts.cjs","tests/contracts/shared-canonical-scoring-provider-contracts.cjs","tests/contracts/shared-canonical-scoring-production-contracts.cjs","tests/browser/shared-canonical-scoring-audit.cjs","RELEASE_V1.9.1_R11.md"]) assert.ok(canonicalScoring.evidenceRefs.includes(ref), `Canonical Scoring evidence missing ${ref}`);
  assert.ok(canonicalScoring.evidenceRefs.some(ref => ref.includes("POS20 run #255 exact head 364b931d")));
  assert.ok(canonicalScoring.evidenceRefs.some(ref => ref.includes("PR #232 merge be5289cd")));
  assert.ok(canonicalScoring.evidenceRefs.some(ref => ref.includes("GitHub Pages run #110 success")));
  assert.ok(canonicalScoring.evidenceRefs.some(ref => ref.includes("POS20 run #256 exact main be5289cd")));

  assert.equal(ledger.scoreCheck.fullyIntegratedWeight, 62);
  assert.equal(ledger.scoreCheck.remainingDesignWeight, 38);
  assert.equal(ledger.scoreCheck.remainingDesignContribution, 3.8);
  assert.equal(ledger.scoreCheck.calculatedScore, 65.8);
  assert.equal(Object.prototype.hasOwnProperty.call(ledger.scoreCheck, "preIntegrationWeight"), false);

  const scoreDrift = clone(ledger);
  scoreDrift.currentScore = 99;
  assert.throws(() => assessMilestoneDelivery(trackerModel, scoreDrift, ssjrModel), /stored milestone score/i);

  const weightDrift = clone(ledger);
  weightDrift.capabilities[0].milestoneWeight += 1;
  assert.throws(() => assessMilestoneDelivery(trackerModel, weightDrift, ssjrModel), /weight drift/i);

  const outOfOrder = clone(ledger);
  const historyConvergence = outOfOrder.capabilities.find(capability => capability.id === "history-convergence");
  historyConvergence.stages["automated-test"] = "complete";
  assert.throws(() => assessMilestoneDelivery(trackerModel, outOfOrder, ssjrModel), /cannot complete automated-test after an earlier lifecycle stage is incomplete/i);

  const inventedPartial = clone(ledger);
  inventedPartial.capabilities.find(capability => capability.id === "history-convergence").lifecyclePercent = 25;
  assert.throws(() => assessMilestoneDelivery(trackerModel, inventedPartial, ssjrModel), /stored lifecyclePercent must be derived/i);

  assert.match(authority, /Milestone Delivery Progress: NN\.NN\/100/);
  assert.match(authority, /does not replace SSJR readiness/i);
  assert.match(authority, /Reusable predecessor code[\s\S]+does not complete an implementation stage/i);
  assert.match(authority, /proven regression invalidates[\s\S]+MDP can decrease/i);
  assert.match(authority, /Current baseline — 39\.00\/100/i);

  process.stdout.write(`PASS MDP-1 exact SSJR denominator, six-stage lifecycle, current ${result.formattedScore} r11 integrated ledger, anti-inflation rules, regression guard and strict SSJR separation\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
