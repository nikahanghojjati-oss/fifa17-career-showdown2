import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessTransition, signalsFromLegacyWec } from "./pos4-transition.mjs";
const first=(...v)=>v.find(x=>typeof x==="string"&&x.trim())||"unknown";
export function buildResumeCapsule({state,nextTask,transition,generatedAt=new Date().toISOString()}){
  const r=state?.repository||{},c=state?.continuity||{};
  const unfinished=Array.isArray(c.unfinishedWork)&&c.unfinishedWork.length?c.unfinishedWork.map(x=>`- ${x}`).join("\n"):"- none recorded";
  const heading=(String(nextTask||"").match(/^#\s+(.+)$/m)||[])[1]||first(c.currentTask);
  return `# Career Mode Showdown Resume Capsule RCP-2\n\nGenerated: ${generatedAt}\nTransfer decision: ${transition.status}\n\n## Authority rule\nThis capsule and RB-1 are orientation only. Independently resolve live main, PR, exact head/checks/reviews and deployment before editing. Never combine CI across heads.\n\n## Repository\nRepository: ${first(r.name)}\nBranch: ${first(r.workingBranch,r.branch)}\nActive PR: ${r.activePullRequest??"unknown"}\nRecorded head: ${first(r.currentHeadSha,r.verifiedHeadSha,r.liveHeadAtInitialization)}\n\n## Current lane\n${heading}\n\n## Last safe checkpoint\n${first(c.lastSafeCheckpoint)}\n\n## Exact next action\n${first(c.nextSafeAction)}\n\n## Unfinished work\n${unfinished}\n\n## Transfer reason\n${transition.reason}\n\n## Permanent authority\nRead PROJECT_OPERATING_SYSTEM_V4.md, CURRENT_PRODUCT_GUARDS.json and NEXT_TASK.md first. Billing remains OFF and Firebase remains Spark. Load historical handoff/WEC/RJR material only if the live blocker requires it.\n\n## Packaging rule\nRCP-2 is external. Do not commit it or open a continuity-only PR merely to publish it.\n`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const state=JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json","utf8"));const next=fs.readFileSync("NEXT_TASK.md","utf8");process.stdout.write(buildResumeCapsule({state,nextTask:next,transition:assessTransition(signalsFromLegacyWec(state))}));}catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
