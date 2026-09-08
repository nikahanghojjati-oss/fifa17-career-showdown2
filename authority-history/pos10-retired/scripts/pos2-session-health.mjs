import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeDebugBudget, scoreObservations } from "./session-handoff-proximity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function assessSessionHealth(state) {
  const session = state?.sessionHandoffProximity;
  const latest = session?.checkpoints?.at?.(-1)?.observations;
  if (!latest) {
    return {
      model: "POS2-SESSION-HEALTH-1",
      status: "CAUTION",
      reason: "No current session observation ledger is available. Continue only after reconstructing the exact live boundary.",
      adaptiveDebugBudget: null,
      debugCycles: null,
      remainingDebugAllowance: null
    };
  }

  const scored = scoreObservations(latest);
  const budget = computeDebugBudget(latest);
  const activeFailure = latest.redCiFamilies > 0 || latest.unresolvedStates > 0 || latest.unresolvedDebugLoops > 0;
  const contextDamage = latest.truncations + latest.recoveries + latest.compactions;
  const failedCycles = Math.max(latest.ciDebugCycles, latest.unresolvedDebugLoops);
  const remaining = Math.max(0, budget - failedCycles);
  const explicitUsageStop = state?.signals?.usageWarning === true ||
    (Number.isFinite(state?.signals?.usageRemainingPercent) && state.signals.usageRemainingPercent <= 10);
  const explicitWrap = latest.ownerRequestedWrap || latest.nextSubstantialTaskRisksLoss;
  const budgetExhausted = activeFailure && failedCycles >= budget;
  const contextExhausted = activeFailure && contextDamage >= 2 && failedCycles >= scored.contextDegradedBudget;

  if (explicitUsageStop || explicitWrap || budgetExhausted || contextExhausted) {
    return {
      model: "POS2-SESSION-HEALTH-1",
      status: "HANDOFF_RECOMMENDED",
      reason: explicitUsageStop
        ? "Explicit usage warning/low reported allowance."
        : explicitWrap
          ? "Owner wrap or next substantial task risks loss."
          : budgetExhausted
            ? `ADB-1 adaptive debug budget ${budget} is exhausted with unresolved failure.`
            : `Context damage reduced the safe debug allowance; ${failedCycles} failed cycles reached the degraded threshold ${scored.contextDegradedBudget}.`,
      adaptiveDebugBudget: budget,
      debugCycles: failedCycles,
      remainingDebugAllowance: remaining,
      contextDamageEvents: contextDamage,
      activeFailure
    };
  }

  const cautionThreshold = Math.max(2, Math.ceil(budget * 0.6));
  if (latest.hardStateReconstruction || contextDamage >= 2 || (activeFailure && failedCycles >= cautionThreshold)) {
    return {
      model: "POS2-SESSION-HEALTH-1",
      status: "CAUTION",
      reason: latest.hardStateReconstruction
        ? "Hard state reconstruction occurred in this environment."
        : contextDamage >= 2
          ? "Repeated context damage observed; keep work bounded."
          : `Unresolved debugging has used ${failedCycles}/${budget} adaptive attempts.`,
      adaptiveDebugBudget: budget,
      debugCycles: failedCycles,
      remainingDebugAllowance: remaining,
      contextDamageEvents: contextDamage,
      activeFailure
    };
  }

  return {
    model: "POS2-SESSION-HEALTH-1",
    status: "HEALTHY",
    reason: activeFailure
      ? `The blocker remains bounded and ADB-1 has ${remaining} adaptive attempts available.`
      : "No session-health condition currently requires a transfer.",
    adaptiveDebugBudget: budget,
    debugCycles: failedCycles,
    remainingDebugAllowance: remaining,
    contextDamageEvents: contextDamage,
    activeFailure
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let statePath = "WORK_ENVIRONMENT_STATUS.json";
    let json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--json") json = true;
      else if (args[i] === "--state" && args[i + 1]) statePath = args[++i];
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const state = JSON.parse(fs.readFileSync(path.resolve(root, statePath), "utf8"));
    const result = assessSessionHealth(state);
    process.stdout.write(json
      ? `${JSON.stringify(result, null, 2)}\n`
      : `Session health: ${result.status}\nADB-1 budget: ${result.adaptiveDebugBudget ?? "unknown"}\nFailed debug cycles: ${result.debugCycles ?? "unknown"}\nRemaining adaptive allowance: ${result.remainingDebugAllowance ?? "unknown"}\nReason: ${result.reason}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
