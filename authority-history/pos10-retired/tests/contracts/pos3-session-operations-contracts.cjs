const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");

(async () => {
  const transition = await import(pathToFileURL(path.resolve("scripts/pos3-transition.mjs")));
  const capsule = await import(pathToFileURL(path.resolve("scripts/build-resume-capsule.mjs")));

  const signals = overrides => ({ ...transition.emptySignals(), ...overrides });

  const quiet = transition.assessTransition(signals({}));
  assert.equal(quiet.model, "TDS-1");
  assert.equal(quiet.status, "CONTINUE");
  assert.equal(quiet.reportToOwner, false);
  assert.equal(quiet.generateResumeCapsule, false);
  assert.equal(quiet.percentage, null);
  assert.ok(quiet.adaptiveDebugBudget >= 3 && quiet.adaptiveDebugBudget <= 18);

  const focused = transition.assessTransition(signals({
    unresolvedFailureFamilies: 1,
    failedCorrectionCycles: 2
  }));
  assert.equal(focused.status, "CONTINUE");
  assert.ok(focused.remainingDebugAllowance > 0);

  const checkpoint = transition.assessTransition(signals({
    unresolvedFailureFamilies: 1,
    contextDamageEvents: 1,
    failedCorrectionCycles: 1
  }));
  assert.equal(checkpoint.status, "CHECKPOINT_SOON");
  assert.equal(checkpoint.generateResumeCapsule, false);

  const usage = transition.assessTransition(signals({ usageWarning: true }));
  assert.equal(usage.status, "TRANSFER_NOW");
  assert.equal(usage.generateResumeCapsule, true);

  const atomicUsage = transition.assessTransition(signals({ usageWarning: true, atomicOperation: true }));
  assert.equal(atomicUsage.status, "FINISH_ATOMIC_THEN_TRANSFER");
  assert.equal(atomicUsage.generateResumeCapsule, false);

  const failingSignals = signals({ unresolvedFailureFamilies: 1, unresolvedStates: 1 });
  const budget = transition.computeDebugBudget(failingSignals);
  const exhausted = transition.assessTransition({ ...failingSignals, failedCorrectionCycles: budget });
  assert.equal(exhausted.status, "TRANSFER_NOW");
  assert.equal(exhausted.remainingDebugAllowance, 0);

  const broadBudget = transition.computeDebugBudget(signals({
    unresolvedFailureFamilies: 4,
    unresolvedStates: 4,
    contextDamageEvents: 3,
    hardStateReconstruction: true,
    taskLanes: 4
  }));
  assert.ok(broadBudget < quiet.adaptiveDebugBudget, "Broad reconstruction-damaged debugging must receive a smaller ADB-2 budget.");

  const source = fs.readFileSync("scripts/pos3-transition.mjs", "utf8");
  for (const retiredPressureInput of ["elapsedMinutes","messageToolEvents","longEvidenceReads","editedFiles","commits","deployments"]) {
    assert.doesNotMatch(source, new RegExp(`signals\\.${retiredPressureInput}`), `${retiredPressureInput} must not create POS3 transfer pressure.`);
  }

  const state = {
    repository: {
      name: "nikahanghojjati-oss/fifa17-career-showdown2",
      workingBranch: "fix/example",
      activePullRequest: 215,
      currentHeadSha: "a".repeat(40)
    },
    continuity: {
      currentTask: "Finish the current product correction.",
      lastSafeCheckpoint: "Targeted contract passed on the recorded head.",
      nextSafeAction: "Resolve the exact live head and run the focused validation.",
      unfinishedWork: ["One current product gate remains red."]
    }
  };
  const resume = capsule.buildResumeCapsule({
    state,
    nextTask: "# CURRENT TASK — EXAMPLE\n",
    transition: usage,
    generatedAt: "2026-09-08T00:00:00Z"
  });
  assert.match(resume, /Resume Capsule RCP-1/);
  assert.match(resume, /orientation only[\s\S]+independently resolve current main/i);
  assert.match(resume, /Recorded head: a{40}/);
  assert.match(resume, /One current product gate remains red/);
  assert.match(resume, /Do not create a repository commit or continuity-only PR merely to publish this capsule/i);
  assert.doesNotMatch(resume, /Handoff proximity:\s*\d+%/i);

  const legacyState = {
    signals: { usageWarning: false, usageRemainingPercent: null, atomicOperation: false },
    sessionHandoffProximity: {
      checkpoints: [{
        observations: {
          truncations: 1, recoveries: 0, compactions: 0, hardStateReconstruction: true,
          ciDebugCycles: 2, unresolvedDebugLoops: 1, redCiFamilies: 1, unresolvedStates: 1,
          taskLanes: 1, ownerRequestedWrap: false, nextSubstantialTaskRisksLoss: false
        }
      }]
    }
  };
  const adapted = transition.signalsFromLegacyWec(legacyState);
  assert.equal(adapted.contextDamageEvents, 1);
  assert.equal(adapted.hardStateReconstruction, true);
  assert.equal(adapted.failedCorrectionCycles, 2);
  assert.equal(transition.assessTransition(adapted).status, "CHECKPOINT_SOON");

  process.stdout.write("PASS POS v3 session operations: TDS-1 has no percentage, ADB-2 ignores healthy activity volume, real transfer triggers are categorical, and RCP-1 is external/non-mutating.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
