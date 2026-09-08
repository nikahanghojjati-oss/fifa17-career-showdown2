import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;

export function assessHandoffChecklist(state) {
  const repo = state?.repository || {};
  const continuity = state?.continuity || {};
  const exactHead = repo.liveHeadAtInitialization || repo.verifiedHeadSha || repo.currentHeadSha || null;
  const durableState = Boolean(state?.environmentId && state?.recordedAt && state?.repository && state?.continuity);
  const authoritySnapshot = Boolean(
    nonEmpty(repo.startingMainSha) &&
    (nonEmpty(repo.workingBranch) || nonEmpty(repo.branch)) &&
    (repo.activePullRequest !== undefined || nonEmpty(exactHead))
  );
  const openWorkClassified = Array.isArray(continuity.unfinishedWork) && Array.isArray(continuity.knownHazards);
  const successorExecutionContract = nonEmpty(continuity.currentTask) && nonEmpty(continuity.nextSafeAction);
  const safeBoundary = nonEmpty(continuity.lastSafeCheckpoint) && state?.signals?.atomicOperation === false;

  const checks = {
    durableState,
    authoritySnapshot,
    openWorkClassified,
    successorExecutionContract,
    safeBoundarySnapshot: safeBoundary
  };
  const complete = Object.values(checks).every(Boolean);
  return {
    model: "POS2-HANDOFF-CHECKLIST-1",
    complete,
    checks,
    note: complete
      ? "The five useful transfer conditions are present. Create one compact successor snapshot only if a real handoff is occurring."
      : "This is a checklist, not a score. Complete only the missing transfer facts if a real handoff is required."
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
    const result = assessHandoffChecklist(state);
    if (json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write(`POS-2 handoff checklist: ${result.complete ? "COMPLETE" : "INCOMPLETE"}\n`);
      for (const [name, value] of Object.entries(result.checks)) process.stdout.write(`${value ? "PASS" : "OPEN"} ${name}\n`);
      process.stdout.write(`${result.note}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
