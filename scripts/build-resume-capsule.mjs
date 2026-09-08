import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessTransition, signalsFromLegacyWec } from "./pos3-transition.mjs";

const firstNonEmpty = (...values) => values.find(value => typeof value === "string" && value.trim()) || "unknown";

export function buildResumeCapsule({ state, nextTask, transition, generatedAt = new Date().toISOString() }) {
  const repo = state?.repository || {};
  const continuity = state?.continuity || {};
  const recordedHead = firstNonEmpty(repo.currentHeadSha, repo.verifiedHeadSha, repo.liveHeadAtInitialization);
  const branch = firstNonEmpty(repo.workingBranch, repo.branch);
  const pr = repo.activePullRequest ?? "unknown";
  const unfinished = Array.isArray(continuity.unfinishedWork) && continuity.unfinishedWork.length
    ? continuity.unfinishedWork.map(item => `- ${item}`).join("\n")
    : "- none recorded";
  const heading = (String(nextTask || "").match(/^#\s+(.+)$/m) || [])[1] || firstNonEmpty(continuity.currentTask);

  return `# Career Mode Showdown Resume Capsule RCP-1

Generated: ${generatedAt}
Transfer decision: ${transition.status}

## Live authority rule

This capsule is orientation only. Before editing, independently resolve current main, PR #${pr}, exact live head/checks/reviews and current deployment authority. Never combine CI evidence across heads.

## Repository

Repository: ${firstNonEmpty(repo.name)}
Branch: ${branch}
Active PR: ${pr}
Recorded head: ${recordedHead}

## Current task

${heading}

## Last safe checkpoint

${firstNonEmpty(continuity.lastSafeCheckpoint)}

## Next action

${firstNonEmpty(continuity.nextSafeAction)}

## Unfinished/blocking work

${unfinished}

## Transfer reason

${transition.reason}

## Permanent authority

Read \`PROJECT_OPERATING_SYSTEM_V3.md\`, \`CURRENT_PRODUCT_GUARDS.json\` and \`NEXT_TASK.md\` first. Billing remains OFF and Firebase remains Spark. Do not load historical WEC/SNS/SLE archives unless the live blocker requires them.

## Packaging rule

RCP-1 is an external transfer artifact. Do not create a repository commit or continuity-only PR merely to publish this capsule.
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let statePath = "WORK_ENVIRONMENT_STATUS.json";
    let output = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--state" && args[i + 1]) statePath = args[++i];
      else if (args[i] === "--output" && args[i + 1]) output = args[++i];
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const state = JSON.parse(fs.readFileSync(path.resolve(statePath), "utf8"));
    const nextTask = fs.readFileSync("NEXT_TASK.md", "utf8");
    const transition = assessTransition(signalsFromLegacyWec(state));
    const capsule = buildResumeCapsule({ state, nextTask, transition });
    if (output) fs.writeFileSync(path.resolve(output), capsule, "utf8");
    else process.stdout.write(capsule);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
