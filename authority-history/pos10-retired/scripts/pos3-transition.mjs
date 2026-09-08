import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "TDS-1";
export const debugBudgetModel = "ADB-2";

export function emptySignals() {
  return {
    contextDamageEvents: 0,
    hardStateReconstruction: false,
    failedCorrectionCycles: 0,
    unresolvedFailureFamilies: 0,
    unresolvedStates: 0,
    taskLanes: 1,
    usageWarning: false,
    ownerRequestsTransfer: false,
    nextSubstantialTaskRisksLoss: false,
    atomicOperation: false
  };
}

function ensureSignals(signals) {
  const required = emptySignals();
  if (!signals || typeof signals !== "object") throw new Error("TDS-1 signals are required.");
  for (const [key, value] of Object.entries(required)) {
    if (!(key in signals)) throw new Error(`Missing TDS-1 signal: ${key}`);
    if (typeof value === "boolean") {
      if (typeof signals[key] !== "boolean") throw new Error(`${key} must be boolean.`);
    } else if (!Number.isInteger(signals[key]) || signals[key] < 0) {
      throw new Error(`${key} must be a non-negative integer.`);
    }
  }
}

export function computeDebugBudget(signals) {
  ensureSignals(signals);
  let budget = 8;
  if (signals.unresolvedFailureFamilies <= 1) budget += 4;
  if (signals.unresolvedStates <= 1) budget += 2;
  if (signals.contextDamageEvents === 0) budget += 3;
  else if (signals.contextDamageEvents === 1) budget += 1;
  else if (signals.contextDamageEvents >= 3) budget -= 3;
  if (signals.taskLanes <= 1) budget += 2;
  else if (signals.taskLanes >= 3) budget -= 2;
  if (signals.hardStateReconstruction) budget -= 3;
  if (signals.unresolvedFailureFamilies >= 3) budget -= 2;
  if (signals.unresolvedStates >= 3) budget -= 2;
  return Math.max(3, Math.min(18, budget));
}

export function assessTransition(signals) {
  ensureSignals(signals);
  const budget = computeDebugBudget(signals);
  const activeFailure = signals.unresolvedFailureFamilies > 0 || signals.unresolvedStates > 0;
  const checkpointThreshold = Math.max(2, Math.ceil(budget * 0.65));
  const reconstructionThreshold = Math.max(2, Math.ceil(budget / 2));
  const hardReasons = [];

  if (signals.usageWarning) hardReasons.push("Owner reported a platform usage/remaining-capacity warning.");
  if (signals.ownerRequestsTransfer) hardReasons.push("Owner explicitly requested a session transfer.");
  if (signals.nextSubstantialTaskRisksLoss) hardReasons.push("Starting another substantial task risks losing unrecoverable session context.");
  if (activeFailure && signals.failedCorrectionCycles >= budget) {
    hardReasons.push(`ADB-2 budget ${budget} is exhausted while a failure remains unresolved.`);
  }
  if (
    signals.hardStateReconstruction &&
    signals.contextDamageEvents >= 2 &&
    activeFailure &&
    signals.failedCorrectionCycles >= reconstructionThreshold
  ) {
    hardReasons.push("Reconstructed context plus repeated unresolved debugging reached the degraded transfer threshold.");
  }

  if (hardReasons.length) {
    return {
      model,
      status: signals.atomicOperation ? "FINISH_ATOMIC_THEN_TRANSFER" : "TRANSFER_NOW",
      reason: hardReasons.join(" "),
      adaptiveDebugBudget: budget,
      failedCorrectionCycles: signals.failedCorrectionCycles,
      remainingDebugAllowance: Math.max(0, budget - signals.failedCorrectionCycles),
      reportToOwner: true,
      generateResumeCapsule: !signals.atomicOperation,
      percentage: null
    };
  }

  const checkpointReasons = [];
  if (signals.hardStateReconstruction) checkpointReasons.push("Hard session-state reconstruction occurred.");
  if (activeFailure && signals.contextDamageEvents >= 1) checkpointReasons.push("Debugging is continuing after context damage.");
  if (activeFailure && signals.failedCorrectionCycles >= checkpointThreshold) {
    checkpointReasons.push(`Debugging has used ${signals.failedCorrectionCycles}/${budget} ADB-2 attempts.`);
  }
  if (signals.unresolvedFailureFamilies >= 3) checkpointReasons.push("Multiple failure families are unresolved.");
  if (signals.taskLanes >= 3) checkpointReasons.push("Work has spread across multiple active task lanes.");

  if (checkpointReasons.length) {
    return {
      model,
      status: "CHECKPOINT_SOON",
      reason: checkpointReasons.join(" "),
      adaptiveDebugBudget: budget,
      failedCorrectionCycles: signals.failedCorrectionCycles,
      remainingDebugAllowance: Math.max(0, budget - signals.failedCorrectionCycles),
      reportToOwner: true,
      generateResumeCapsule: false,
      percentage: null
    };
  }

  return {
    model,
    status: "CONTINUE",
    reason: activeFailure
      ? `The blocker is bounded; ${Math.max(0, budget - signals.failedCorrectionCycles)} ADB-2 attempts remain.`
      : "No transfer condition is present.",
    adaptiveDebugBudget: budget,
    failedCorrectionCycles: signals.failedCorrectionCycles,
    remainingDebugAllowance: Math.max(0, budget - signals.failedCorrectionCycles),
    reportToOwner: false,
    generateResumeCapsule: false,
    percentage: null
  };
}

export function signalsFromLegacyWec(state) {
  const latest = state?.sessionHandoffProximity?.checkpoints?.at?.(-1)?.observations || {};
  const reportedRemaining = state?.signals?.usageRemainingPercent;
  return {
    contextDamageEvents: Number(latest.truncations || 0) + Number(latest.recoveries || 0) + Number(latest.compactions || 0),
    hardStateReconstruction: latest.hardStateReconstruction === true,
    failedCorrectionCycles: Math.max(
      Number(latest.ciDebugCycles || 0),
      Number(latest.unresolvedDebugLoops || 0),
      Number(state?.signals?.correctedFailures || 0)
    ),
    unresolvedFailureFamilies: Number(latest.redCiFamilies ?? state?.signals?.unresolvedFailures ?? 0),
    unresolvedStates: Number(latest.unresolvedStates ?? state?.signals?.unresolvedFailures ?? 0),
    taskLanes: Math.max(1, Number(latest.taskLanes || 1)),
    usageWarning: state?.signals?.usageWarning === true || (Number.isFinite(reportedRemaining) && reportedRemaining <= 10),
    ownerRequestsTransfer: latest.ownerRequestedWrap === true,
    nextSubstantialTaskRisksLoss: latest.nextSubstantialTaskRisksLoss === true,
    atomicOperation: state?.signals?.atomicOperation === true
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let signals;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--signals-json" && args[i + 1]) signals = JSON.parse(args[++i]);
      else if (args[i] === "--state" && args[i + 1]) {
        const state = JSON.parse(fs.readFileSync(path.resolve(args[++i]), "utf8"));
        signals = signalsFromLegacyWec(state);
      } else throw new Error(`Unknown argument: ${args[i]}`);
    }
    if (!signals) {
      const state = JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json", "utf8"));
      signals = signalsFromLegacyWec(state);
    }
    const result = assessTransition(signals);
    process.stdout.write(`Transfer decision: ${result.status}\nADB-2 budget: ${result.adaptiveDebugBudget}\nFailed correction cycles: ${result.failedCorrectionCycles}\nRemaining allowance: ${result.remainingDebugAllowance}\nReason: ${result.reason}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
