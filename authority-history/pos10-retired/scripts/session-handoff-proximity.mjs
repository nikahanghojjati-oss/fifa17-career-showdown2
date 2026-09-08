import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeHandoffProximity as computeTransferReadiness } from "./handoff-proximity-stage.mjs";

export const model = "SHP-2";
export const debugBudgetModel = "ADB-1";
export const weights = Object.freeze({ context: 0.45, workload: 0.25, continuity: 0.20, ageBreadth: 0.10 });
export const cumulativeFields = Object.freeze([
  "messageToolEvents", "longEvidenceReads", "truncations", "recoveries", "compactions",
  "boundedReads", "editedFiles", "commits", "ciDebugCycles", "deployments", "elapsedMinutes", "taskLanes"
]);
const riskFields = ["unmergedBranches", "redCiFamilies", "inFlightDeployments", "unresolvedStates", "unresolvedDebugLoops"];
const flagFields = ["ownerTestPending", "hardStateReconstruction", "ownerRequestedWrap", "nextSubstantialTaskRisksLoss"];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const clamp = n => Math.min(100, Math.max(0, n));

export function emptyObservations() {
  return Object.fromEntries([...cumulativeFields, ...riskFields].map(k => [k, 0]).concat(flagFields.map(k => [k, false])));
}

export function initializeSession(environmentId, startedAt) {
  ensure(typeof environmentId === "string" && environmentId.length > 0, "Unique environmentId required.");
  ensure(Number.isFinite(Date.parse(startedAt)), "Valid startedAt required.");
  return { model, environmentId, startedAt, checkpoints: [{ at: startedAt, note: "New session: reset to 0%.", observations: emptyObservations() }], successorPackage: { generated: false, verified: false, verification: null } };
}

function validateObservations(o) {
  ensure(o && typeof o === "object", "Observations required.");
  ensure(Object.keys(o).length === Object.keys(emptyObservations()).length, "Unknown or missing observation field.");
  for (const k of [...cumulativeFields, ...riskFields]) ensure(Number.isInteger(o[k]) && o[k] >= 0, `${k} must be a non-negative integer.`);
  for (const k of flagFields) ensure(typeof o[k] === "boolean", `${k} must be boolean.`);
}

export function computeDebugBudget(o) {
  validateObservations(o);
  const contextDamageEvents = o.truncations + o.recoveries + o.compactions;
  let budget = 6;

  // A focused, low-damage session with a narrow blocker can safely iterate longer.
  if (o.redCiFamilies <= 1) budget += 3;
  if (o.unresolvedStates <= 1) budget += 2;
  if (contextDamageEvents === 0) budget += 4;
  else if (contextDamageEvents === 1) budget += 2;
  else if (contextDamageEvents >= 4) budget -= 3;
  if (o.taskLanes <= 1) budget += 2;
  if (o.elapsedMinutes <= 90) budget += 2;
  else if (o.elapsedMinutes >= 150) budget -= 2;

  // Broad or reconstruction-heavy debugging should transfer sooner.
  if (o.hardStateReconstruction) budget -= 2;
  if (o.redCiFamilies >= 4) budget -= 2;
  if (o.unresolvedStates >= 4) budget -= 2;

  return Math.min(20, Math.max(2, budget));
}

export function scoreObservations(o) {
  validateObservations(o);
  const components = {
    context: clamp(o.messageToolEvents * 0.4 + o.longEvidenceReads * 3 + o.truncations * 8 + o.recoveries * 10 + o.compactions * 15),
    workload: clamp(o.boundedReads * 0.35 + o.editedFiles * 0.8 + o.commits * 4 + o.ciDebugCycles * 8 + o.deployments * 8),
    continuity: clamp(o.unmergedBranches * 15 + o.redCiFamilies * 12 + o.inFlightDeployments * 20 + Number(o.ownerTestPending) * 10 + o.unresolvedStates * 8),
    ageBreadth: clamp(o.elapsedMinutes * 70 / 180 + Math.max(0, o.taskLanes - 1) * 10)
  };
  const weighted = Math.round(Object.entries(weights).reduce((sum, [k, w]) => sum + components[k] * w, 0));
  let floor = 0;
  const reasons = [];
  const contextDamageEvents = o.truncations + o.recoveries + o.compactions;
  const activeFailure = o.redCiFamilies > 0 || o.unresolvedStates > 0;
  const debugBudget = computeDebugBudget(o);
  const contextDegradedBudget = Math.max(2, Math.ceil(debugBudget / 2));
  const prepareBudget = Math.max(2, Math.ceil(debugBudget * 0.6));
  const reachedAdaptiveBudget =
    o.unresolvedDebugLoops >= debugBudget ||
    (o.ciDebugCycles >= debugBudget && activeFailure);
  const contextAmplifiedDebugSpiral =
    o.ciDebugCycles >= contextDegradedBudget &&
    contextDamageEvents >= 2 &&
    activeFailure;
  const multiFamilyRepeatRisk =
    o.ciDebugCycles >= prepareBudget &&
    o.redCiFamilies >= 2;

  if (contextDamageEvents >= 2) { floor = Math.max(floor, 70); reasons.push("Repeated truncation/interruption/recovery."); }
  if (o.hardStateReconstruction) { floor = Math.max(floor, 80); reasons.push("Hard state reconstruction."); }
  if (multiFamilyRepeatRisk) {
    floor = Math.max(floor, 85);
    reasons.push(`Adaptive debug budget ${debugBudget}: repeated validation still has multiple red CI families; finish only the current atomic correction and prepare transfer state.`);
  }
  if (reachedAdaptiveBudget || contextAmplifiedDebugSpiral) {
    floor = Math.max(floor, 95);
    reasons.push(`Debug-spiral circuit breaker ADB-1: adaptive budget ${debugBudget} reached, or context damage reduced the safe budget to ${contextDegradedBudget}; full SNS at the first safe checkpoint.`);
  }
  if (o.ownerRequestedWrap || o.nextSubstantialTaskRisksLoss) { floor = Math.max(floor, 95); reasons.push("Owner requested transition or another substantial task risks loss."); }
  return { score: Math.min(99, Math.max(weighted, floor)), weighted, floor, components, reasons, debugBudgetModel, debugBudget, contextDegradedBudget, prepareBudget };
}

export function operatingBand(score) {
  if (score === 100) return "HANDOFF_COMPLETE_STOP";
  if (score >= 95) return "GENERATE_FULL_SNS_NOW";
  if (score >= 85) return "FINISH_ATOMIC_TASK_PREPARE_FULL_SNS";
  if (score >= 70) return "BOUNDED_TASKS_VTLS_EACH_CHANGE";
  if (score >= 50) return "VTLS_AFTER_MAJOR_MILESTONES";
  return "NORMAL_WORK";
}

export function computeSessionHandoffProximity(state) {
  const session = state.sessionHandoffProximity;
  ensure(session?.model === model, "Session Handoff Proximity v2 (SHP-2) is required; HTR-1 cannot supply it.");
  ensure(session.environmentId === state.environmentId, "Predecessor session percentage must not be inherited.");
  ensure(Number.isFinite(Date.parse(session.startedAt)), "Valid session startedAt required.");
  ensure(Array.isArray(session.checkpoints) && session.checkpoints.length > 0, "Session checkpoint ledger required.");
  const initial = session.checkpoints[0].observations;
  validateObservations(initial);
  ensure(Object.entries(emptyObservations()).every(([key, value]) => initial[key] === value), "A new session must begin with zero observations, not predecessor state.");
  let score = 0, previous = null, latest;
  for (const checkpoint of session.checkpoints) {
    ensure(typeof checkpoint.note === "string" && checkpoint.note.trim(), "Checkpoint evidence note required.");
    ensure(Number.isFinite(Date.parse(checkpoint.at)) && Date.parse(checkpoint.at) >= Date.parse(previous?.at || session.startedAt), "Checkpoint timestamps must be chronological.");
    latest = scoreObservations(checkpoint.observations);
    if (previous) for (const k of cumulativeFields) ensure(checkpoint.observations[k] >= previous.observations[k], `Cumulative ${k} must not decrease within a session.`);
    score = Math.max(score, latest.score);
    previous = checkpoint;
  }
  const pack = session.successorPackage;
  ensure(pack && typeof pack.generated === "boolean" && typeof pack.verified === "boolean", "Successor package state required.");
  if (pack.verified) {
    ensure(pack.generated && typeof pack.verification === "string" && pack.verification.trim(), "100 requires generated package and explicit successful verification evidence.");
    ensure(computeTransferReadiness(state).ready, "100 requires the sealed HTR-1 transfer package.");
    score = 100;
  }
  return { model, score, band: operatingBand(score), latest, proxyNotice: "Observable workload/context-risk proxies; not exact context-window usage or account allowance.", vtlsIndependentOfProximity: true };
}

export function recordSessionCheckpoint(state, observations, note, at) {
  computeSessionHandoffProximity(state);
  const copy = structuredClone(state);
  ensure(!copy.sessionHandoffProximity.successorPackage.verified, "Handoff complete: stop this session.");
  const previous = copy.sessionHandoffProximity.checkpoints.at(-1).observations;
  copy.sessionHandoffProximity.checkpoints.push({ at, note, observations: { ...previous, ...observations } });
  computeSessionHandoffProximity(copy);
  return copy;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let statePath = "WORK_ENVIRONMENT_STATUS.json", json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--json") json = true;
      else if (args[i] === "--state" && args[i + 1]) statePath = args[++i];
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const result = computeSessionHandoffProximity(JSON.parse(fs.readFileSync(path.resolve(root, statePath), "utf8")));
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : `Session handoff proximity: ${result.score}%\nModel: ${model}\nAdaptive debug budget: ${result.latest?.debugBudget ?? "n/a"}/20 (${debugBudgetModel})\nBand: ${result.band}\n${result.proxyNotice}\n`);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
