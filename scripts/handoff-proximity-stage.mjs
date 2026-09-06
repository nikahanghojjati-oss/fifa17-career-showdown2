import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultStatePath = "WORK_ENVIRONMENT_STATUS.json";

export const stageScores = Object.freeze({
  "active-work": 45,
  "targeted-validation": 60,
  "terminal-validation-pending": 70,
  "terminal-validation-green": 80,
  "publication-gate-pending": 85,
  "publication-gate-green": 90,
  "review-merge-ready": 93,
  "merged-main-verified": 96,
  "post-publication-gate-pending": 97,
  "post-publication-green": 98,
  "handoff-package-sealed": 99,
  "handoff-ready": 100
});

function ensure(condition, message){
  if(!condition) throw new Error(message);
}

export function computeHandoffProximity(state, stage){
  ensure(state && typeof state === "object", "A WEC state object is required.");
  ensure(Object.hasOwn(stageScores, stage), `Unknown handoff proximity stage: ${stage}`);
  const signals = state.signals || {};
  let score = stageScores[stage];
  const caps = [];

  if(signals.atomicOperation === true){
    score = Math.min(score, 60);
    caps.push("atomic operation still in progress");
  }
  if(Number(signals.unresolvedFailures || 0) > 0){
    score = Math.min(score, 70);
    caps.push("unresolved failure remains");
  }
  if(Number(signals.unrecordedDecisions || 0) > 0){
    score = Math.min(score, 80);
    caps.push("material decision remains unrecorded");
  }
  if(Number(signals.handoffCompleteness ?? 0) < 90){
    score = Math.min(score, 85);
    caps.push("handoff record is not yet at least 90% complete");
  }

  if(stage === "handoff-package-sealed" || stage === "handoff-ready"){
    ensure(["transition-prepared", "closed"].includes(state.lifecycle), `${stage} requires a transition-prepared or closed WEC lifecycle.`);
    ensure(Number(signals.handoffCompleteness) === 100, `${stage} requires handoffCompleteness 100.`);
    ensure(Number(signals.unresolvedFailures || 0) === 0, `${stage} requires zero unresolved failures.`);
    ensure(Number(signals.unrecordedDecisions || 0) === 0, `${stage} requires zero unrecorded decisions.`);
    ensure(signals.atomicOperation === false, `${stage} requires atomicOperation false.`);
  }

  return {
    stage,
    score,
    nominalScore: stageScores[stage],
    capped: score !== stageScores[stage],
    capReasons: caps
  };
}

function parseArgs(argv){
  const args = { stage: null, statePath: defaultStatePath, json: false };
  for(let index = 0; index < argv.length; index += 1){
    const value = argv[index];
    if(value === "--stage") args.stage = argv[++index] || null;
    else if(value === "--state") args.statePath = argv[++index] || defaultStatePath;
    else if(value === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  ensure(args.stage, "Usage: node scripts/handoff-proximity-stage.mjs --stage <stage> [--state path] [--json]");
  return args;
}

function main(){
  const args = parseArgs(process.argv.slice(2));
  const state = JSON.parse(fs.readFileSync(path.resolve(repositoryRoot, args.statePath), "utf8"));
  const result = computeHandoffProximity(state, args.stage);
  if(args.json){
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(`Handoff proximity: ${result.score}%\n`);
  process.stdout.write(`Stage: ${result.stage}\n`);
  if(result.capped) process.stdout.write(`Cap reason: ${result.capReasons.join("; ")}\n`);
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  try{ main(); }
  catch(error){
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
