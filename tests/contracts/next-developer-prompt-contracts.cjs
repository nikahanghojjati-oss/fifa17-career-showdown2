const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");

const golden=fs.readFileSync("00_HANDOFF_GOLDEN_RULE.md","utf8");
const sle=fs.readFileSync("00_SLE_HANDOFF_PROTOCOL.md","utf8");
const bootstrapProtocol=fs.readFileSync("00_SESSION_BOOTSTRAP.md","utf8");
const bootstrap=JSON.parse(fs.readFileSync("SESSION_BOOTSTRAP.json","utf8"));

assert.match(golden,/Mandatory repository-first next-developer copy-paste prompt/i);
assert.match(golden,/live repository/i);
assert.match(golden,/START_NEXT_SESSION_/i);
assert.match(golden,/independently verify/i);
assert.match(golden,/fresh WEC/i);
assert.match(golden,/handoff as orientation/i);
assert.match(golden,/current source[\s\S]{0,120}live GitHub/i);
assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(golden,/must not substitute[\s\S]{0,180}SLE/i);
assert.match(golden,/recursive and permanent/i);

for(const [name,text] of [["SLE protocol",sle],["bootstrap protocol",bootstrapProtocol]]){
  assert.match(text,/repository-first next-developer prompt/i,`${name} must preserve repository-first owner delivery.`);
  assert.match(text,/work:next-prompt/i,`${name} must name the repository prompt generator.`);
  assert.match(text,/START_NEXT_SESSION_/i,`${name} must route the successor to the current starter.`);
}

const starter=fs.readFileSync(bootstrap.starter.canonical,"utf8");
const starterMirror=fs.readFileSync(bootstrap.starter.projectMirror,"utf8");
const handoff=fs.readFileSync(bootstrap.currentHandoff.canonical,"utf8");
const handoffMirror=fs.readFileSync(bootstrap.currentHandoff.projectMirror,"utf8");
assert.equal(starter,starterMirror,"Current starter and project mirror must remain byte-identical.");
assert.equal(handoff,handoffMirror,"Current full handoff and project mirror must remain byte-identical.");
for(const [name,text] of [["current starter",starter],["current full handoff",handoff]]){
  assert.match(text,/repository-first next-developer prompt/i,`${name} must recursively preserve the prompt standard.`);
  assert.match(text,/work:next-prompt/i,`${name} must route future closers to the prompt generator.`);
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must retain the immediate successor task contract.`);
  assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i,`${name} must require fresh WEC initialization.`);
  assert.match(text,/handoff as orientation|orientation/i,`${name} must keep handoff material non-authoritative.`);
}

const generated=spawnSync(process.execPath,["scripts/build-next-developer-prompt.mjs"],{encoding:"utf8"});
assert.equal(generated.status,0,generated.stderr||"Prompt generator must exit successfully.");
const prompt=generated.stdout.trim();
const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
assert.match(prompt,new RegExp(escapeRegExp(bootstrap.repository)));
assert.match(prompt,new RegExp(escapeRegExp(bootstrap.starter.canonical)));
assert.match(prompt,/Independently verify current `main`/i);
assert.match(prompt,/REMOTE_JOINING_READINESS\.json/);
assert.match(prompt,/NEXT_TASK\.md/);
assert.match(prompt,/closing WEC/i);
assert.match(prompt,/fresh WEC/i);
assert.match(prompt,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
assert.match(prompt,/Treat the handoff as orientation only/i);
assert.match(prompt,/live GitHub\/provider\/deployment evidence win/i);

process.stdout.write("PASS next-developer prompt: policy, SLE/bootstrap delivery, current mirrored artifacts, and generated repository-first successor prompt are recursively protected.\n");