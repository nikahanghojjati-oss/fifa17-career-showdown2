import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultStatePath = "WORK_ENVIRONMENT_STATUS.json";

export const model = "HTR-1";
export const pillarScores = Object.freeze({
  "durable-state": 20,
  "authority-snapshot": 20,
  "open-work-classified": 20,
  "successor-execution-contract": 20,
  "sealed-transfer-package": 20
});
export const orderedPillars = Object.freeze(Object.keys(pillarScores));

function ensure(condition, message){
  if(!condition) throw new Error(message);
}

export function computeHandoffProximity(state){
  ensure(state && typeof state === "object", "A WEC state object is required.");
  const transfer = state.handoffTransferReadiness || {};
  ensure(transfer.model === model, `handoffTransferReadiness.model must be ${model}.`);
  ensure(Array.isArray(transfer.earnedPillars), "handoffTransferReadiness.earnedPillars must be an array.");

  const earned = [...new Set(transfer.earnedPillars)];
  ensure(earned.length === transfer.earnedPillars.length, "earnedPillars must not contain duplicates.");
  for(const pillar of earned) ensure(Object.hasOwn(pillarScores, pillar), `Unknown HTR-1 pillar: ${pillar}`);

  const score = earned.reduce((sum, pillar) => sum + pillarScores[pillar], 0);
  ensure([0,20,40,60,80,100].includes(score), `Invalid HTR-1 score: ${score}`);

  const sealed = earned.includes("sealed-transfer-package");
  if(sealed){
    const signals = state.signals || {};
    ensure(earned.length === orderedPillars.length, "sealed-transfer-package may be earned only after all four predecessor pillars.");
    ensure(["transition-prepared", "closed"].includes(state.lifecycle), "sealed-transfer-package requires a transition-prepared or closed WEC lifecycle.");
    ensure(Number(signals.handoffCompleteness) === 100, "sealed-transfer-package requires handoffCompleteness 100.");
    ensure(Number(signals.unrecordedDecisions || 0) === 0, "sealed-transfer-package requires zero unrecorded decisions.");
    ensure(signals.atomicOperation === false, "sealed-transfer-package requires atomicOperation false.");
  }

  return {
    model,
    score,
    earnedPillars: earned,
    remainingPillars: orderedPillars.filter(pillar => !earned.includes(pillar)),
    ready: score === 100
  };
}

function parseArgs(argv){
  const args = { statePath: defaultStatePath, json: false };
  for(let index = 0; index < argv.length; index += 1){
    const value = argv[index];
    if(value === "--state") args.statePath = argv[++index] || defaultStatePath;
    else if(value === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

function main(){
  const args = parseArgs(process.argv.slice(2));
  const state = JSON.parse(fs.readFileSync(path.resolve(repositoryRoot, args.statePath), "utf8"));
  const result = computeHandoffProximity(state);
  if(args.json){
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(`Handoff proximity: ${result.score}%\n`);
  process.stdout.write(`Model: ${result.model}\n`);
  process.stdout.write(`Earned pillars: ${result.earnedPillars.join(", ") || "none"}\n`);
  if(result.remainingPillars.length) process.stdout.write(`Remaining pillars: ${result.remainingPillars.join(", ")}\n`);
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  try{ main(); }
  catch(error){
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
