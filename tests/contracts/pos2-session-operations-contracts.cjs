const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const health = await import(pathToFileURL(path.resolve("scripts/pos2-session-health.mjs")));
  const checklist = await import(pathToFileURL(path.resolve("scripts/pos2-handoff-checklist.mjs")));
  const legacy = await import(pathToFileURL(path.resolve("scripts/session-handoff-proximity.mjs")));

  const observations = overrides => ({
    ...legacy.emptyObservations(),
    taskLanes: 1,
    elapsedMinutes: 15,
    ...overrides
  });
  const stateWith = (obs, signals = {}) => ({
    sessionHandoffProximity: { checkpoints: [{ observations: obs }] },
    signals: { usageWarning: false, usageRemainingPercent: null, ...signals }
  });

  const quiet = health.assessSessionHealth(stateWith(observations({})));
  assert.equal(quiet.model, "POS2-SESSION-HEALTH-1");
  assert.equal(quiet.status, "HEALTHY");
  assert.equal(typeof quiet.adaptiveDebugBudget, "number");
  assert.ok(!("score" in quiet), "POS v2 session health must not expose a replacement percentage score.");

  const focusedFailure = observations({ redCiFamilies: 1, ciDebugCycles: 2 });
  const focused = health.assessSessionHealth(stateWith(focusedFailure));
  assert.equal(focused.status, "HEALTHY");
  assert.ok(focused.remainingDebugAllowance > 0, "A bounded blocker must retain adaptive debug allowance.");

  const budget = legacy.computeDebugBudget(observations({ redCiFamilies: 1 }));
  const exhausted = health.assessSessionHealth(stateWith(observations({
    redCiFamilies: 1,
    ciDebugCycles: budget,
    unresolvedDebugLoops: budget
  })));
  assert.equal(exhausted.status, "HANDOFF_RECOMMENDED");
  assert.equal(exhausted.remainingDebugAllowance, 0);

  const usageStop = health.assessSessionHealth(stateWith(observations({}), { usageWarning: true }));
  assert.equal(usageStop.status, "HANDOFF_RECOMMENDED");
  assert.equal(health.assessSessionHealth({}).status, "CAUTION");

  const handoffState = {
    environmentId: "we-pos2-contract",
    recordedAt: "2026-09-07T23:55:00Z",
    repository: {
      startingMainSha: "a".repeat(40),
      workingBranch: "fix/example",
      activePullRequest: 215,
      currentHeadSha: "b".repeat(40)
    },
    continuity: {
      currentTask: "Finish the current bounded POS v2 cleanup.",
      lastSafeCheckpoint: "Exact head recorded with no atomic write in progress.",
      nextSafeAction: "Resume from the exact recorded head.",
      unfinishedWork: [],
      knownHazards: []
    },
    signals: { atomicOperation: false }
  };
  const ready = checklist.assessHandoffChecklist(handoffState);
  assert.equal(ready.model, "POS2-HANDOFF-CHECKLIST-1");
  assert.equal(ready.complete, true);
  assert.ok(!("score" in ready), "POS v2 handoff readiness is a checklist, not HTR percentage scoring.");
  assert.deepEqual(Object.keys(ready.checks), [
    "durableState",
    "authoritySnapshot",
    "openWorkClassified",
    "successorExecutionContract",
    "safeBoundarySnapshot"
  ]);

  const missingNext = structuredClone(handoffState);
  missingNext.continuity.nextSafeAction = "";
  const incomplete = checklist.assessHandoffChecklist(missingNext);
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.checks.successorExecutionContract, false);

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["work:health"], "node scripts/pos2-session-health.mjs");
  assert.equal(pkg.scripts["work:handoff-checklist"], "node scripts/pos2-handoff-checklist.mjs");

  process.stdout.write("PASS POS v2 session operations: ADB-backed health uses states instead of a percentage, explicit usage/debug exhaustion recommends handoff, and transfer readiness is a five-condition checklist.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
