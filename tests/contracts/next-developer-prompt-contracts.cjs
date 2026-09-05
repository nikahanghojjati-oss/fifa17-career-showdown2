const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const read=p=>fs.readFileSync(p,"utf8");
const bootstrap=JSON.parse(read("SESSION_BOOTSTRAP.json"));
const checkedPrompt=read("NEXT_CHAT_HANDOFF_PROMPT.md").trim();
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.47_PR199_POSTMERGE_GREEN_SSJR_PROVIDER_NEXT.md");
const starter=read(bootstrap.starter.canonical), handoff=read(bootstrap.currentHandoff.canonical);
assert.equal(starter,read(bootstrap.starter.projectMirror)); assert.equal(handoff,read(bootstrap.currentHandoff.projectMirror));
for(const [name,text] of [["current starter",starter],["current full handoff",handoff]]){ assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i); assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i); assert.match(text,/orientation/i); assert.match(text,/PR #199/i); assert.match(text,/1\.9\.1-r2/i); assert.match(text,/0\/100|SSJR0/i); assert.match(text,/two physical devices|two-physical-device/i); assert.match(text,/independent network|two-independent-network/i); }
const generated=spawnSync(process.execPath,["scripts/build-next-developer-prompt.mjs"],{encoding:"utf8"}); assert.equal(generated.status,0,generated.stderr||"Prompt generator must exit successfully."); const prompt=generated.stdout.trim();
assert.match(prompt,/SHARED_SHOWDOWN_JOURNEY_READINESS\.json/); assert.match(prompt,/fresh WEC/i); assert.match(prompt,/IMMEDIATE NEXT TASK AFTER FULL STUDY/); assert.match(prompt,/Treat the handoff as orientation only/i);
assert.match(checkedPrompt,/START_NEXT_SESSION_V1\.4\.47_PR199_POSTMERGE_GREEN_SSJR_PROVIDER_NEXT\.md/); assert.match(checkedPrompt,/PR #199/i); assert.match(checkedPrompt,/final exact head/i); assert.match(checkedPrompt,/all 15 workflow families/i); assert.match(checkedPrompt,/v1\.9\.1 \/ 1\.9\.1-r2/i); assert.match(checkedPrompt,/0\/100|SSJR0/i); assert.match(checkedPrompt,/fresh WEC/i); assert.match(checkedPrompt,/two physical devices|two-physical-device/i); assert.match(checkedPrompt,/independent network|two-independent-network/i); assert.match(checkedPrompt,/Billing must remain permanently OFF|Billing must never be activated/i); assert.match(checkedPrompt,/Firebase[\s\S]+Spark/i); assert.match(checkedPrompt,/Estimated focused sessions to genuine SSJR100/); assert.match(checkedPrompt,/pairing[\s\S]+before[\s\S]+league/i);
process.stdout.write("PASS next-developer prompt: v1.4.47 mirrored PR199 post-merge package routes a fresh WEC to Spark provider enforcement.\n");
