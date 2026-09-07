const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const read=p=>fs.readFileSync(p,"utf8"),root=JSON.parse(read("SESSION_BOOTSTRAP.json")),checked=read("NEXT_CHAT_HANDOFF_PROMPT.md").trim();
assert.equal(root.starter?.canonical,"START_NEXT_SESSION_V1.4.56_PR215_R6_RELEASE_CANDIDATE_PUBLICATION_NEXT.md","Historical root starter remains immutable.");
const override=root.currentSuccessorOverride;
assert.ok(override?.capsule,"Default prompt authority must expose a current versioned capsule.");
const current=JSON.parse(read(override.capsule));
assert.equal(current.starter?.canonical,override.starter);
assert.equal(current.currentHandoff?.canonical,override.deepHandoff);
const starter=read(current.starter.canonical),handoff=read(current.currentHandoff.canonical);
assert.equal(starter,read(current.starter.projectMirror)); assert.equal(handoff,read(current.currentHandoff.projectMirror));
for(const text of [starter,handoff]){
 assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i); assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i); assert.match(text,/orientation/i);
 assert.match(text,/PR #215/i); assert.match(text,/1\.9\.1-r5/i); assert.match(text,/1\.9\.1-r6/i); assert.match(text,/0\/100|SSJR0/i); assert.match(text,/two legitimate private manager|production-two-account|production two-account/i);
 assert.match(text,/pairing[\s\S]+ACTIVE/i); assert.match(text,/record:ssjr-production-shared-setup/i); assert.match(text,/validate:ssjr-production-shared-setup/i);
}
const generated=spawnSync(process.execPath,["scripts/build-next-developer-prompt.mjs"],{encoding:"utf8"});
assert.equal(generated.status,0,generated.stderr); const prompt=generated.stdout.trim();
for(const text of [prompt,checked]){
 assert.match(text,new RegExp(current.starter.canonical.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
 assert.match(text,/SHARED_SHOWDOWN_JOURNEY_READINESS\.json/); assert.match(text,/REMOTE_JOINING_READINESS\.json/); assert.match(text,/NEXT_TASK\.md/); assert.match(text,/fresh WEC/i); assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/); assert.match(text,/Treat the handoff as orientation only/i); assert.match(text,/current `main`/i); assert.match(text,/production\/runtime\/deployment state/i); assert.match(text,/closing WEC/i); assert.match(text,/fix\/pr214-postmerge-dual-screen-contract/i);
}
assert.equal(checked,prompt,"Checked owner-facing prompt must exactly match the current override-aware generator output.");
assert.doesNotMatch(checked,/START_NEXT_SESSION_V1\.4\.57_/,"Checked prompt must not retain the stale V1.4.57 route.");
process.stdout.write("PASS next-developer prompt: immutable V1.4.56 root provenance remains intact while default generation and the checked owner-facing prompt follow the additive current successor capsule exactly.\n");
