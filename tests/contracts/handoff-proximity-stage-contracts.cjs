const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const moduleUrl = pathToFileURL(path.resolve("scripts/handoff-proximity-stage.mjs")).href;
  const { computeHandoffProximity, stageScores } = await import(moduleUrl);

  const base = {
    lifecycle: "active",
    signals: {
      handoffCompleteness: 100,
      unresolvedFailures: 0,
      unrecordedDecisions: 0,
      atomicOperation: false
    }
  };

  assert.equal(stageScores["terminal-validation-pending"], 70);
  assert.equal(stageScores["handoff-package-sealed"], 99);
  assert.equal(stageScores["handoff-ready"], 100);
  assert.equal(computeHandoffProximity(base, "active-work").score, 45);
  assert.equal(computeHandoffProximity(base, "publication-gate-pending").score, 85);

  const failing = structuredClone(base);
  failing.signals.unresolvedFailures = 1;
  assert.equal(computeHandoffProximity(failing, "post-publication-green").score, 70, "Unresolved failures must prevent a misleading high-90s proximity.");

  const atomic = structuredClone(base);
  atomic.signals.atomicOperation = true;
  assert.equal(computeHandoffProximity(atomic, "publication-gate-green").score, 60, "Atomic work must cap proximity before the high end.");

  const incomplete = structuredClone(base);
  incomplete.signals.handoffCompleteness = 80;
  assert.equal(computeHandoffProximity(incomplete, "post-publication-green").score, 85, "Incomplete handoff recording must cap proximity.");

  assert.throws(() => computeHandoffProximity(base, "handoff-package-sealed"), /transition-prepared or closed/);
  const sealed = structuredClone(base);
  sealed.lifecycle = "transition-prepared";
  assert.equal(computeHandoffProximity(sealed, "handoff-package-sealed").score, 99);
  assert.equal(computeHandoffProximity(sealed, "handoff-ready").score, 100);

  const policy = fs.readFileSync("00_HANDOFF_PROXIMITY_STAGE_GATES.md", "utf8");
  assert.match(policy, /99%[\s\S]+handoff package/i);
  assert.match(policy, /100%[\s\S]+SNS/i);
  assert.match(policy, /must not hover at 99%/i);
  assert.match(policy, /test:handoff-preflight/i);

  const buildFirst = fs.readFileSync("00_BUILD_FIRST_PRODUCT_POLICY.md", "utf8");
  assert.match(buildFirst, /atomic multi-file tree commit/i);
  assert.match(buildFirst, /Do not open the publication PR early/i);
  assert.match(buildFirst, /75% actual product implementation/i);

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["work:proximity"], "node scripts/handoff-proximity-stage.mjs");
  assert.equal(pkg.scripts["test:handoff-preflight"], "node tests/support/run-handoff-preflight.cjs");

  process.stdout.write("PASS stage-gated Handoff proximity: high-90s require bounded publication/handoff evidence and 100 is reserved for immediate SNS-ready clean stop.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
