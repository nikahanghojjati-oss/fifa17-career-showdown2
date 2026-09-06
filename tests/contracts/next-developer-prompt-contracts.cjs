const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const read=p=>fs.readFileSync(p,"utf8"),bootstrap=JSON.parse(read("SESSION_BOOTSTRAP.json")),checked=read("NEXT_CHAT_HANDOFF_PROMPT.md").trim();
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.54_PR210_POSTMERGE_GREEN_SSJR_PRIVATE_TWO_ACCOUNT_NEXT.md");
const starter=read(bootstrap.starter.canonical),handoff=read(bootstrap.currentHandoff.canonical);
assert.equal(starter,read(bootstrap.starter.projectMirror)); assert.equal(handoff,read(bootstrap.currentHandoff.projectMirror));
for(const text of [starter,handoff]){
 assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i); assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i); assert.match(text,/orientation/i);
 assert.match(text,/PR #210/i); assert.match(text,/PR #209/i); assert.match(text,/PR #207/i); assert.match(text,/PR #205/i); assert.match(text,/PR #203/i);
 assert.match(text,/1\.9\.1-r3/i); assert.match(text,/0\/100|SSJR0/i); assert.match(text,/two legitimate private manager|production-two-account|production two-account/i);
 assert.match(text,/pairing[\s\S]+ACTIVE/i); assert.match(text,/record:ssjr-production-shared-setup/i); assert.match(text,/validate:ssjr-production-shared-setup/i);
}
const generated=spawnSync(process.execPath,["scripts/build-next-developer-prompt.mjs"],{encoding:"utf8"});
assert.equal(generated.status,0,generated.stderr); const prompt=generated.stdout.trim();
assert.match(prompt,/SHARED_SHOWDOWN_JOURNEY_READINESS\.json/); assert.match(prompt,/fresh (?:unique )?WEC/i); assert.match(prompt,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
assert.match(prompt,/Treat the handoff as orientation only/i); assert.match(prompt,/START_NEXT_SESSION_V1\.4\.54_PR210_POSTMERGE_GREEN_SSJR_PRIVATE_TWO_ACCOUNT_NEXT\.md/);
assert.match(checked,/START_NEXT_SESSION_V1\.4\.54_PR210_POSTMERGE_GREEN_SSJR_PRIVATE_TWO_ACCOUNT_NEXT\.md/);
assert.match(checked,/PR #210/i); assert.match(checked,/PR #209/i); assert.match(checked,/PR #207/i); assert.match(checked,/PR #205/i); assert.match(checked,/PR #203/i);
assert.match(checked,/15\/15|all 15/i); assert.match(checked,/v1\.9\.1 \/ 1\.9\.1-r3/i); assert.match(checked,/0\/100|SSJR0/i); assert.match(checked,/fresh (?:unique )?WEC/i);
assert.match(checked,/Billing must remain permanently OFF|Billing must never be activated/i); assert.match(checked,/Firebase[\s\S]+Spark/i);
assert.match(checked,/Estimated focused sessions to genuine SSJR100/i); assert.match(checked,/two legitimate private manager|production-two-account|production two-account/i); assert.match(checked,/~5–10|5-10/);
process.stdout.write("PASS next-developer prompt: v1.4.54 mirrored PR210/PR209 observer package preserves PR207 recorder, PR205 validator and PR203 r3 production authority and routes fresh WEC to genuine private two-account Shared Setup evidence without billing.\n");