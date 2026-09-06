const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const moduleUrl = pathToFileURL(path.resolve("scripts/handoff-proximity-stage.mjs")).href;
  const { computeHandoffProximity, model, orderedPillars, pillarScores } = await import(moduleUrl);

  assert.equal(model, "HTR-1");
  assert.deepEqual(orderedPillars, [
    "durable-state",
    "authority-snapshot",
    "open-work-classified",
    "successor-execution-contract",
    "sealed-transfer-package"
  ]);
  assert.ok(orderedPillars.every(pillar => pillarScores[pillar] === 20));

  const state = {
    lifecycle: "active",
    signals: {
      handoffCompleteness: 80,
      unresolvedFailures: 3,
      unrecordedDecisions: 0,
      atomicOperation: false
    },
    handoffTransferReadiness: {
      model: "HTR-1",
      earnedPillars: [
        "durable-state",
        "authority-snapshot",
        "open-work-classified",
        "successor-execution-contract"
      ]
    }
  };

  const eighty = computeHandoffProximity(state);
  assert.equal(eighty.score, 80);
  assert.equal(eighty.ready, false);
  assert.deepEqual(eighty.remainingPillars, ["sealed-transfer-package"]);

  const moreFailures = structuredClone(state);
  moreFailures.signals.unresolvedFailures = 99;
  assert.equal(
    computeHandoffProximity(moreFailures).score,
    80,
    "A newly discovered but already classified technical failure must not erase established transfer readiness."
  );

  const incomplete = structuredClone(state);
  incomplete.handoffTransferReadiness.earnedPillars = ["durable-state", "authority-snapshot"];
  assert.equal(computeHandoffProximity(incomplete).score, 40);

  const invalidSeal = structuredClone(state);
  invalidSeal.handoffTransferReadiness.earnedPillars.push("sealed-transfer-package");
  assert.throws(() => computeHandoffProximity(invalidSeal), /transition-prepared or closed/);

  const sealed = structuredClone(invalidSeal);
  sealed.lifecycle = "transition-prepared";
  sealed.signals.handoffCompleteness = 100;
  assert.equal(computeHandoffProximity(sealed).score, 100);
  assert.equal(computeHandoffProximity(sealed).ready, true);

  const duplicate = structuredClone(state);
  duplicate.handoffTransferReadiness.earnedPillars.push("durable-state");
  assert.throws(() => computeHandoffProximity(duplicate), /duplicates/);

  const policy = fs.readFileSync("00_HANDOFF_PROXIMITY_STAGE_GATES.md", "utf8");
  assert.match(policy, /five repository-verifiable transfer pillars worth exactly 20 points each/i);
  assert.match(policy, /Within one handoff cycle, Handoff proximity is monotonic/i);
  assert.match(policy, /open PR or known failing check may be handed off at 100/i);
  assert.match(policy, /fresh environment can resume immediately and safely from durable repository authority/i);
  assert.match(policy, /It does not mean the current PR is merged, all tests are green, the product is complete, or SSJR is 100/i);
  assert.match(policy, /At 100%[\s\S]+SNS[\s\S]+stop before beginning another substantial milestone/i);
  assert.match(policy, /derived exclusively from durable repository transfer evidence/i);
  assert.doesNotMatch(policy, /dashboard|cli \/status|remaining percentage/i);

  const buildFirst = fs.readFileSync("00_BUILD_FIRST_PRODUCT_POLICY.md", "utf8");
  assert.match(buildFirst, /atomic multi-file tree commit/i);
  assert.match(buildFirst, /Do not open the publication PR early/i);
  assert.match(buildFirst, /75% actual product implementation/i);

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["work:proximity"], "node scripts/handoff-proximity-stage.mjs");
  assert.equal(pkg.scripts["test:handoff-preflight"], "node tests/support/run-handoff-preflight.cjs");

  process.stdout.write("PASS HTR-1 Handoff proximity: five append-only repository transfer pillars produce a deterministic monotonic 0/20/40/60/80/100 score and 100 means safe successor recoverability.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
