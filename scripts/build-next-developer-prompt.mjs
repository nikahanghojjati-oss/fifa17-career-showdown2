import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath){
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
}

function readBootstrap(){
  return readJson("SESSION_BOOTSTRAP.json");
}

function resolvePromptBootstrap(bootstrap = readBootstrap()){
  const capsule = bootstrap?.currentSuccessorOverride?.capsule;
  if(!capsule) return bootstrap;
  const current = readJson(capsule);
  if(!current?.repository || !current?.starter?.canonical){
    throw new Error(`${capsule} must define repository and starter.canonical.`);
  }
  return current;
}

function buildNextDeveloperPrompt(bootstrap = readBootstrap()){
  const effective = resolvePromptBootstrap(bootstrap);
  const repository = effective.repository;
  const starter = effective?.starter?.canonical;
  if(!repository || !starter){
    throw new Error("Bootstrap authority must define repository and starter.canonical.");
  }
  return [
    `Open the live repository \`${repository}\` and read \`${starter}\` first.`,
    ...(effective.successorPackage?.handoffBranch ? [`If that starter is not on main, fetch the live handoff branch \`${effective.successorPackage.handoffBranch}\`.`] : []),
    "Follow its SLE/deep references as needed, including `00_SESSION_HANDOFF_PROXIMITY_V2.md` for session pressure and `00_HANDOFF_PROXIMITY_STAGE_GATES.md` for separate HTR-1 transfer readiness.",
    "Independently verify current `main`, relevant PR state, production/runtime/deployment state, `REMOTE_JOINING_READINESS.json`, `SHARED_SHOWDOWN_JOURNEY_READINESS.json`, `NEXT_TASK.md`, and the closing WEC.",
    "Validate/archive the inherited WEC, then initialize a fresh WEC with a unique ID without inheriting its transition decision and execute `IMMEDIATE NEXT TASK AFTER FULL STUDY`.",
    "Treat the handoff as orientation only; current source and live GitHub/provider/deployment evidence win.",
    "Billing must remain permanently OFF and Firebase must remain Spark. Reset Session handoff proximity to 0% for the new session, then use monotonic observable proxies and v2 risk floors. Generate a tiny VTLS SNS after every substantial task at any percentage; never use HTR-1 as session pressure."
  ].join(" ");
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  process.stdout.write(`${buildNextDeveloperPrompt()}\n`);
}

export { buildNextDeveloperPrompt, readBootstrap, resolvePromptBootstrap };
