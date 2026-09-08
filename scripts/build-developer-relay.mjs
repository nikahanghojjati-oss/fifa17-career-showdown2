import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model="DRF-1";
export const filename="DEVELOPER_RELAY_POS5.md";
export const maxBytes=8192;
const text=v=>typeof v==="string"&&v.trim()?v.trim():"unknown";
const oneLine=v=>text(v).replace(/[\r\n]+/g," ");

export function buildDeveloperRelay(input){
  const unresolved=Array.isArray(input.unresolvedFailureClasses)&&input.unresolvedFailureClasses.length
    ? input.unresolvedFailureClasses.map(oneLine).join(", ") : "none recorded";
  const body=`# Developer Relay File DRF-1\n\nModel: POS-5 / DRF-1\nGenerated: ${input.generatedAt||new Date().toISOString()}\nRelay reason: ${oneLine(input.relayReason)}\n\n## Live verification first\nThis file is orientation only. Resolve live main, active PR/branch, exact head, checks, reviews/threads, provider/deployment authority before editing. Never combine CI evidence across heads.\n\n## Repository\nRepository: ${oneLine(input.repository)}\nBranch: ${oneLine(input.branch)}\nActive PR: ${input.pr??"unknown"}\nRecorded head: ${oneLine(input.head)}\n\n## Current work\nLane: ${oneLine(input.lane)}\nAtomic work unit: ${oneLine(input.atomicWorkUnit)}\nLast safe checkpoint: ${oneLine(input.lastSafeCheckpoint)}\nValidation summary: ${oneLine(input.validationSummary)}\nUnresolved failure classes: ${unresolved}\n\n## Exact next action\n${oneLine(input.nextAction)}\n\n## Permanent locks\nRead CURRENT_PRODUCT_GUARDS.json as machine authority. Billing remains permanently OFF and Firebase remains Spark. Pairing + exact ACTIVE precedes league/club authority. Candidate C remains sole destructive remote-to-local Apply authority.\n\n## Startup\nRead PROJECT_OPERATING_SYSTEM_V5.md, CURRENT_PRODUCT_GUARDS.json and NEXT_TASK.md after live verification. Load older POS/handoff/WEC/SNS/SLE/RJR provenance only if the live blocker actually requires it.\n\n## Packaging\nThis file is external. Do not commit it and do not open a continuity-only PR to publish it.\n`;
  if(Buffer.byteLength(body,"utf8")>maxBytes)throw new Error(`DRF-1 exceeds ${maxBytes} byte cap.`);
  return body;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const arg=process.argv[2];
    if(!arg)throw new Error("Usage: node scripts/build-developer-relay.mjs <relay-input.json> [output-path]");
    const input=JSON.parse(fs.readFileSync(path.resolve(arg),"utf8"));
    const output=process.argv[3]?path.resolve(process.argv[3]):path.resolve(filename);
    fs.writeFileSync(output,buildDeveloperRelay(input));
    process.stdout.write(`${output}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
