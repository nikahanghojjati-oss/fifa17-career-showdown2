const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const status = JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json", "utf8"));
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const moduleUrl = pathToFileURL(path.resolve("scripts/work-environment-continuity.mjs")).href;
  const proximityUrl = pathToFileURL(path.resolve("scripts/session-handoff-proximity.mjs")).href;
  const {
    assessState,
    decisions,
    parseGitStatusPaths,
    requiredContinuityFiles,
    validateState,
    withOverrides
  } = await import(moduleUrl);
  const { initializeSession, recordSessionCheckpoint, computeDebugBudget, emptyObservations } = await import(proximityUrl);

  for (const file of requiredContinuityFiles) {
    assert.ok(fs.existsSync(file), `Continuity runtime is missing ${file}.`);
  }
  assert.equal(pkg.scripts["work:assess"], "node scripts/work-environment-continuity.mjs assess");
  assert.equal(pkg.scripts["work:handoff"], "node scripts/work-environment-continuity.mjs handoff");
  assert.equal(pkg.scripts["work:continuity:validate"], "node scripts/work-environment-continuity.mjs validate");
  assert.equal(pkg.scripts["work:proximity"], "node scripts/session-handoff-proximity.mjs");

  assert.doesNotThrow(() => validateState(structuredClone(status)));
  assert.deepEqual(parseGitStatusPaths(" M 00_CURRENT_HANDOFF.md\n?? AGENTS.md\n"), ["00_CURRENT_HANDOFF.md", "AGENTS.md"]);

  const cleanRepository = {
    branch: "agent/continuity-runtime-contract",
    head: "a".repeat(40),
    originMain: "b".repeat(40),
    behindOriginMain: 0,
    aheadOfOriginMain: 1,
    dirty: false,
    changedFiles: [],
    missingContinuityFiles: []
  };

  const quiet = structuredClone(status);
  quiet.lifecycle = "active";
  quiet.sessionHandoffProximity = initializeSession(quiet.environmentId, quiet.recordedAt);
  Object.assign(quiet.signals, {
    contextComplexity: "low",
    projectComplexity: "low",
    compactionCount: 0,
    majorPhasesCompleted: 0,
    largeEvidenceEvents: 0,
    toolRoutingErrors: 0,
    correctedFailures: 0,
    repeatedMistakes: 0,
    staleFactCorrections: 0,
    unresolvedFailures: 0,
    newMilestoneNext: false,
    usageRemainingPercent: null,
    usageSource: "unavailable",
    usageWarning: false,
    handoffCompleteness: 100,
    unrecordedDecisions: 0,
    atomicOperation: false
  });

  const quietAssessment = assessState(quiet, cleanRepository);
  assert.equal(quietAssessment.decision, decisions.CONTINUE);
  assert.equal(quietAssessment.scores.quotaRisk, null);

  const lowUsage = withOverrides(quiet, { usageRemainingPercent: 8, usageSource: "cli-status" });
  assert.equal(assessState(lowUsage, cleanRepository).decision, decisions.HANDOFF_NOW);

  const explicitWarning = withOverrides(quiet, { usageWarning: true });
  assert.equal(assessState(explicitWarning, cleanRepository).decision, decisions.HANDOFF_NOW);

  const productive = structuredClone(quiet);
  productive.sessionHandoffProximity = recordSessionCheckpoint(
    productive,
    { ciDebugCycles: 3, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 },
    "Focused productive debug scenario",
    productive.recordedAt
  ).sessionHandoffProximity;
  assert.notEqual(assessState(productive, cleanRepository).decision, decisions.HANDOFF_NOW, "Three clean debug cycles must not force a transfer.");

  const adaptiveBudget = computeDebugBudget({ ...emptyObservations(), redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 });
  assert.ok(adaptiveBudget >= 15 && adaptiveBudget <= 20);
  const exhausted = structuredClone(quiet);
  exhausted.sessionHandoffProximity = recordSessionCheckpoint(
    exhausted,
    { ciDebugCycles: adaptiveBudget, unresolvedDebugLoops: adaptiveBudget, redCiFamilies: 1, taskLanes: 1, elapsedMinutes: 30 },
    "Adaptive budget exhausted",
    exhausted.recordedAt
  ).sessionHandoffProximity;
  assert.equal(assessState(exhausted, cleanRepository).decision, decisions.HANDOFF_NOW);

  const wrapping = structuredClone(quiet);
  wrapping.sessionHandoffProximity = recordSessionCheckpoint(
    wrapping,
    { ownerRequestedWrap: true },
    "Owner requested wrap",
    wrapping.recordedAt
  ).sessionHandoffProximity;
  assert.equal(assessState(wrapping, cleanRepository).decision, decisions.HANDOFF_NOW);
  wrapping.signals.atomicOperation = true;
  assert.equal(assessState(wrapping, { ...cleanRepository, dirty: true }).decision, decisions.FINISH_SAFE_BOUNDARY);

  process.stdout.write("PASS Work Environment Continuity runtime: schema validation, honest usage, atomic safety, adaptive ADB-1 integration and concrete stop/continue decisions are protected without blocking on historical prose.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
