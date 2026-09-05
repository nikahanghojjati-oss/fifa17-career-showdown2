const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const read=p=>fs.readFileSync(p,"utf8");

const golden=read("00_HANDOFF_GOLDEN_RULE.md");
const sle=read("00_SLE_HANDOFF_PROTOCOL.md");
const bootstrapProtocol=read("00_SESSION_BOOTSTRAP.md");
const bootstrap=JSON.parse(read("SESSION_BOOTSTRAP.json"));
const checkedPrompt=read("NEXT_CHAT_HANDOFF_PROMPT.md").trim();

assert.match(golden,/Mandatory repository-first next-developer copy-paste prompt/i);
assert.match(golden,/live repository/i);assert.match(golden,/START_NEXT_SESSION_/i);assert.match(golden,/independently verify/i);assert.match(golden,/fresh WEC/i);assert.match(golden,/handoff as orientation/i);assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);assert.match(golden,/recursive and permanent/i);
for(const [name,text] of [["SLE protocol",sle],["bootstrap protocol",bootstrapProtocol]]){
  assert.match(text,/repository-first next-developer prompt/i,`${name} must preserve repository-first owner delivery.`);
  assert.match(text,/work:next-prompt/i);assert.match(text,/START_NEXT_SESSION_/i);
}

assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.46_PR199_SSJR1_SETUP_FOUNDATION.md");
const starter=read(bootstrap.starter.canonical);
const starterMirror=read(bootstrap.starter.projectMirror);
const handoff=read(bootstrap.currentHandoff.canonical);
const handoffMirror=read(bootstrap.currentHandoff.projectMirror);
assert.equal(starter,starterMirror);assert.equal(handoff,handoffMirror);
for(const [name,text] of [["current starter",starter],["current full handoff",handoff]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must retain immediate successor routing.`);
  assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i);
  assert.match(text,/orientation/i);
  assert.match(text,/PR #199/i);
  assert.match(text,/1\.9\.1-r2/i);
  assert.match(text,/0\/100|SSJR0/i);
  assert.match(text,/two physical devices|two-physical-device/i);
  assert.match(text,/independent network|two-independent-network/i);
}

const generated=spawnSync(process.execPath,["scripts/build-next-developer-prompt.mjs"],{encoding:"utf8"});
assert.equal(generated.status,0,generated.stderr||"Prompt generator must exit successfully.");
const prompt=generated.stdout.trim();
const esc=v=>String(v).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
assert.match(prompt,new RegExp(esc(bootstrap.repository)));
assert.match(prompt,new RegExp(esc(bootstrap.starter.canonical)));
assert.match(prompt,/Independently verify current `main`/i);
assert.match(prompt,/REMOTE_JOINING_READINESS\.json/);assert.match(prompt,/NEXT_TASK\.md/);assert.match(prompt,/closing WEC/i);assert.match(prompt,/fresh WEC/i);assert.match(prompt,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);assert.match(prompt,/Treat the handoff as orientation only/i);assert.match(prompt,/live GitHub\/provider\/deployment evidence win/i);

assert.match(checkedPrompt,new RegExp(esc(bootstrap.repository)));
assert.match(checkedPrompt,new RegExp(esc(bootstrap.starter.canonical)));
assert.match(checkedPrompt,/PR #199/i);
assert.match(checkedPrompt,/final exact head\/tree\/state|final exact head/i);
assert.match(checkedPrompt,/all 15 workflow families/i);
assert.match(checkedPrompt,/v1\.9\.1 \/ 1\.9\.1-r2/i);
assert.match(checkedPrompt,/0\/100|SSJR0/i);
assert.match(checkedPrompt,/fresh WEC/i);
assert.match(checkedPrompt,/two-physical-device|physical/i);
assert.match(checkedPrompt,/Billing must remain permanently OFF|Billing must never be activated/i);
assert.match(checkedPrompt,/Firebase[\s\S]+Spark/i);

assert.match(prompt,/SHARED_SHOWDOWN_JOURNEY_READINESS\.json/);
assert.match(checkedPrompt,/Estimated focused sessions to genuine SSJR100/);
assert.match(checkedPrompt,/pairing[\s\S]+before[\s\S]+league/i);
process.stdout.write("PASS next-developer prompt: v1.4.46 mirrored PR199 SSJR package and generated/current prompts route fresh WEC to provider enforcement after verified publication.\n");
