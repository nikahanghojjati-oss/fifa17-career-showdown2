import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "TD-1";
export const loopLimiter = "DLL-1";
export const states = Object.freeze(["CONTINUE", "TRANSFER"]);

export function emptySignals() {
  return {
    ownerRequestsTransfer: false,
    usageWarning: false,
    nextAtomicOperationRisksLoss: false,
    environmentCannotSafelyContinue: false,
    contextMateriallyDegraded: false,
    sameHypothesisFailedCorrections: 0,
    newEvidenceSinceLastCorrection: true,
    atomicOperation: false,
    recoveryBeaconFresh: true
  };
}

function validate(s) {
  const base = emptySignals();
  if (!s || typeof s !== "object") throw new Error("TD-1 signals required.");
  for (const [key, value] of Object.entries(base)) {
    if (!(key in s)) throw new Error(`Missing TD-1 signal: ${key}`);
    if (typeof value === "boolean" && typeof s[key] !== "boolean") throw new Error(`${key} must be boolean.`);
    if (typeof value === "number" && (!Number.isInteger(s[key]) || s[key] < 0)) throw new Error(`${key} must be a non-negative integer.`);
  }
}

export function assessTransition(s) {
  validate(s);
  const reasons = [];
  if (s.ownerRequestsTransfer) reasons.push("Owner requested transfer.");
  if (s.usageWarning) reasons.push("Owner reported a platform usage/capacity warning.");
  if (s.nextAtomicOperationRisksLoss) reasons.push("The next atomic operation risks unrecoverable context loss.");
  if (s.environmentCannotSafelyContinue) reasons.push("The environment cannot safely complete the next atomic operation.");
  if (s.contextMateriallyDegraded && s.sameHypothesisFailedCorrections >= 2 && !s.newEvidenceSinceLastCorrection) {
    reasons.push("DLL-1 requires reframe while context is materially degraded.");
  }
  const status = reasons.length ? "TRANSFER" : "CONTINUE";
  return {
    model,
    status,
    reason: reasons.join(" ") || "No transfer trigger is present.",
    finishOrAbortAtomicFirst: status === "TRANSFER" && s.atomicOperation,
    recoveryBeaconDue: status === "TRANSFER" || !s.recoveryBeaconFresh,
    generateDeveloperRelayFile: status === "TRANSFER",
    percentage: null
  };
}

export function canCorrectSameHypothesis({ failedCorrections, newEvidence }) {
  if (!Number.isInteger(failedCorrections) || failedCorrections < 0) throw new Error("failedCorrections must be a non-negative integer.");
  if (typeof newEvidence !== "boolean") throw new Error("newEvidence must be boolean.");
  if (failedCorrections < 2) return { allowed: true, action: "CORRECT" };
  if (newEvidence) return { allowed: true, action: "REFRAME_WITH_NEW_EVIDENCE" };
  return { allowed: false, action: "REFRAME" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let signals = emptySignals();
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--signals-json" && args[i + 1]) signals = { ...signals, ...JSON.parse(args[++i]) };
      else if (args[i] === "--signals-file" && args[i + 1]) signals = { ...signals, ...JSON.parse(fs.readFileSync(path.resolve(args[++i]), "utf8")) };
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const result = assessTransition(signals);
    process.stdout.write(`Transition signal: ${result.status}\nReason: ${result.reason}\nRecovery beacon due: ${result.recoveryBeaconDue}\nGenerate DRF-1: ${result.generateDeveloperRelayFile}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
