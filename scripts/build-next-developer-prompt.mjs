import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readBootstrap(){
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, "SESSION_BOOTSTRAP.json"), "utf8"));
}

function buildNextDeveloperPrompt(bootstrap = readBootstrap()){
  const repository = bootstrap.repository;
  const starter = bootstrap?.starter?.canonical;
  if(!repository || !starter){
    throw new Error("SESSION_BOOTSTRAP.json must define repository and starter.canonical.");
  }
  return [
    `Open the live repository \`${repository}\` and read \`${starter}\` first.`,
    "Follow its SLE/deep references as needed.",
    "Independently verify current `main`, relevant PR state, production/runtime/deployment state, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, and the closing WEC.",
    "Then initialize a fresh WEC and execute `IMMEDIATE NEXT TASK AFTER FULL STUDY`.",
    "Treat the handoff as orientation only; current source and live GitHub/provider/deployment evidence win."
  ].join(" ");
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  process.stdout.write(`${buildNextDeveloperPrompt()}\n`);
}

export { buildNextDeveloperPrompt, readBootstrap };
