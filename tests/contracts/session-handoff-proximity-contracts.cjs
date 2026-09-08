const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const m = await import(pathToFileURL(path.resolve("scripts/session-handoff-proximity.mjs")));
  const { assessState } = await import(pathToFileURL(path.resolve("scripts/work-environment-continuity.mjs")));
  const at = "2026-09-07T15:00:00Z";
  const fresh = () => ({ environmentId: "test-current", sessionHandoffProximity: m.initializeSession("test-current", at) });
  const add = (s, o) => m.recordSessionCheckpoint(s, o, "Observed scenario", at);
  const result = s => m.computeSessionHandoffProximity(s);
  const score = s => result(s).score;

  assert.deepEqual(m.weights, { context: 0.45, workload: 0.25, continuity: 0.20, ageBreadth: 0.10 });
  assert.equal(m.debugBudgetModel, "ADB-1");
  assert.equal(score(fresh()), 0);

  const caughtUp = add(fresh(), { messageToolEvents: 12, longEvidenceReads: 2, boundedReads: 8, elapsedMinutes: 8, taskLanes: 1, unmergedBranches: 1, redCiFamilies: 1 });
  assert.ok(score(caughtUp) > 0 && score(caughtUp) < 20, "Ordinary bounded catch-up must start low.");
  assert.notEqual(score(caughtUp) % 20, 0, "Session pressure must not reuse fixed HTR stages.");
  const cleared = add(caughtUp, { redCiFamilies: 0, unmergedBranches: 0 });
  assert.equal(score(cleared), score(caughtUp), "Clearing CI cannot lower accumulated session pressure.");

  for (const observations of [{ truncations: 2 }, { recoveries: 1, compactions: 1 }]) assert.ok(score(add(fresh(), observations)) >= 70);
  assert.ok(score(add(fresh(), { hardStateReconstruction: true })) >= 80);

  const narrowFocused = add(fresh(), { ciDebugCycles: 3, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(result(narrowFocused).latest.debugBudget >= 15, "A focused single-blocker session should receive a substantial adaptive debug budget.");
  assert.ok(score(narrowFocused) < 95, "Three clean correction cycles must not automatically force a transfer.");

  const maxBudget = m.computeDebugBudget({ ...m.emptyObservations(), redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(maxBudget <= 20 && maxBudget >= 15, "Adaptive budget must stay within the 2..20 owner-authorized range.");

  const budgetReached = add(fresh(), { ciDebugCycles: maxBudget, unresolvedDebugLoops: maxBudget, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(score(budgetReached) >= 95, "Reaching the environment-specific adaptive budget must trip the full-SNS circuit breaker.");

  const multiFamilyEarly = add(fresh(), { ciDebugCycles: 2, redCiFamilies: 2, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(score(multiFamilyEarly) < 85, "Two failed cycles alone must not force handoff preparation in a healthy focused session.");

  const multiBudget = result(multiFamilyEarly).latest.debugBudget;
  const multiPrepare = Math.ceil(multiBudget * 0.6);
  const multiFamilyLate = add(fresh(), { ciDebugCycles: multiPrepare, redCiFamilies: 2, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(score(multiFamilyLate) >= 85, "Repeated multi-family validation should prepare transfer only after the adaptive threshold is reached.");

  const damagedSeed = add(fresh(), { redCiFamilies: 1, truncations: 2, taskLanes: 1, elapsedMinutes: 60 });
  const damagedThreshold = result(damagedSeed).latest.contextDegradedBudget;
  const damagedSpiral = add(fresh(), { ciDebugCycles: damagedThreshold, redCiFamilies: 1, truncations: 2, taskLanes: 1, elapsedMinutes: 60 });
  assert.ok(score(damagedSpiral) >= 95, "Context damage must reduce the safe debug budget and still protect quality.");

  assert.ok(score(add(fresh(), { ownerRequestedWrap: true })) >= 95);
  assert.ok(score(add(fresh(), { nextSubstantialTaskRisksLoss: true })) >= 95);
  assert.equal(score(add(fresh(), { messageToolEvents: 999, editedFiles: 999, unresolvedStates: 999, elapsedMinutes: 999 })), 99, "Workload alone never certifies a handoff.");
  assert.throws(() => add(caughtUp, { boundedReads: 0 }), /must not decrease/);
  assert.throws(() => add(fresh(), { hiddenTokenPercentage: 90 }), /Unknown or missing/);
  assert.throws(() => score({ ...caughtUp, environmentId: "next-session" }), /must not be inherited/);

  const successor = { environmentId: "next-session", sessionHandoffProximity: m.initializeSession("next-session", at) };
  assert.equal(score(successor), 0, "A real successor resets, including after a high-pressure predecessor.");

  const htr = { model: "HTR-1", earnedPillars: ["durable-state", "authority-snapshot", "open-work-classified", "successor-execution-contract"] };
  assert.equal(score({ ...fresh(), handoffTransferReadiness: htr }), 0, "HTR80 must not contaminate a fresh session.");

  const incomplete = fresh();
  incomplete.sessionHandoffProximity.successorPackage = { generated: true, verified: true, verification: "preflight passes" };
  assert.throws(() => score(incomplete), /HTR-1/);

  const sealed = { ...incomplete, lifecycle: "transition-prepared", signals: { handoffCompleteness: 100, atomicOperation: false, unrecordedDecisions: 0 }, handoffTransferReadiness: { ...htr, earnedPillars: [...htr.earnedPillars, "sealed-transfer-package"] } };
  assert.equal(score(sealed), 100);
  assert.throws(() => add(sealed, { commits: 1 }), /stop this session/);
  sealed.signals.atomicOperation = true;
  assert.throws(() => score(sealed), /atomicOperation false/);

  assert.deepEqual([0,49,50,69,70,84,85,94,95,99,100].map(m.operatingBand), ["NORMAL_WORK","NORMAL_WORK","VTLS_AFTER_MAJOR_MILESTONES","VTLS_AFTER_MAJOR_MILESTONES","BOUNDED_TASKS_VTLS_EACH_CHANGE","BOUNDED_TASKS_VTLS_EACH_CHANGE","FINISH_ATOMIC_TASK_PREPARE_FULL_SNS","FINISH_ATOMIC_TASK_PREPARE_FULL_SNS","GENERATE_FULL_SNS_NOW","GENERATE_FULL_SNS_NOW","HANDOFF_COMPLETE_STOP"]);

  const current = JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json", "utf8"));
  const repo = { missingContinuityFiles: [], dirty: false, changedFiles: [] };
  const wrapping = add({ ...current, environmentId: "test-current", sessionHandoffProximity: fresh().sessionHandoffProximity }, { ownerRequestedWrap: true });
  assert.equal(assessState(wrapping, repo).decision, "HANDOFF_NOW", "Owner wrap floor must still trigger WEC stop.");
  wrapping.signals.atomicOperation = true;
  assert.equal(assessState(wrapping, repo).decision, "FINISH_SAFE_BOUNDARY");

  const productiveDebug = add({ ...current, environmentId: "test-current", lifecycle: "active", sessionHandoffProximity: fresh().sessionHandoffProximity }, { ciDebugCycles: 3, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.notEqual(assessState(productiveDebug, repo).decision, "HANDOFF_NOW", "Three clean debug cycles with one red family must remain eligible to continue.");

  const exhaustedDebug = add({ ...current, environmentId: "test-current", lifecycle: "active", sessionHandoffProximity: fresh().sessionHandoffProximity }, { ciDebugCycles: maxBudget, unresolvedDebugLoops: maxBudget, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.equal(assessState(exhaustedDebug, repo).decision, "HANDOFF_NOW", "The adaptive budget must still force a safe transfer when genuinely exhausted.");

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["work:proximity"], "node scripts/session-handoff-proximity.mjs");
  assert.equal(pkg.scripts["work:transfer-readiness"], "node scripts/handoff-proximity-stage.mjs");
  for (const file of ["AGENTS.md", "00_WORK_ENVIRONMENT_CONTINUITY.md", "00_HANDOFF_GOLDEN_RULE.md", "scripts/build-next-developer-prompt.mjs"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /00_SESSION_HANDOFF_PROXIMITY_V2\.md/);
    assert.match(source, /(?:reset[\s\S]{0,60}0%|0%[\s\S]{0,80}reset)/i);
    assert.match(source, /HTR-1[\s\S]{0,100}separate|separate[\s\S]{0,100}HTR-1/i);
  }
  assert.ok(m.computeSessionHandoffProximity(fresh()).vtlsIndependentOfProximity);
  process.stdout.write("PASS Session Handoff Proximity v2 + ADB-1: zero reset, observable weights, adaptive 2..20 debug budget, context-sensitive circuit breaker, risk floors, bands, WEC stop priority, verified package and HTR separation.\n");
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
