const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const read=p=>fs.readFileSync(p,"utf8"),bootstrap=JSON.parse(read("SESSION_BOOTSTRAP.json")),checked=read("NEXT_CHAT_HANDOFF_PROMPT.md").trim();
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.55_PR211_RECOVERY_PRIVATE_TWO_ACCOUNT_NEXT.md");
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
for(const text of [prompt,checked]){
 assert.match(text,/START_NEXT_SESSION_V1\.4\.55_PR211_RECOVERY_PRIVATE_TWO_ACCOUNT_NEXT\.md/);
 assert.match(text,/SHARED_SHOWDOWN_JOURNEY_READINESS\.json/);
 assert.match(text,/REMOTE_JOINING_READINESS\.json/);
 assert.match(text,/NEXT_TASK\.md/);
 assert.match(text,/fresh WEC/i);
 assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
 assert.match(text,/Treat the handoff as orientation only/i);
 assert.match(text,/current `main`/i);
 assert.match(text,/production\/runtime\/deployment state/i);
 assert.match(text,/closing WEC/i);
}
assert.equal(checked,prompt,"Checked owner-facing prompt must exactly match the current generator output.");
process.stdout.write("PASS next-developer prompt: compact v1.4.55 repository-first SNS matches its generator and routes a fresh WEC through current live authority to the detailed PR210 successor package.\n");