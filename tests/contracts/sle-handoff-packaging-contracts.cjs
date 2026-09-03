const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const golden=read("00_HANDOFF_GOLDEN_RULE.md");
const protocol=read("00_SLE_HANDOFF_PROTOCOL.md");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const graph=json("SESSION_CONTEXT_GRAPH.json");
const model=json("SESSION_CONTEXT_MODEL.json");
const learning=json("SESSION_CONTEXT_LEARNING.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const current=read("00_CURRENT_HANDOFF.md");
const developer=read("00_DEVELOPER_START_HERE.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const rolling=read("project-documents/START_NEXT_SESSION.md");
const prompt=read("NEXT_CHAT_HANDOFF_PROMPT.md");

assert.match(protocol,/Smart Lean Efficient/i);
assert.match(protocol,/mandatory/i);
assert.match(protocol,/recursive/i);
assert.match(protocol,/starter/i);
assert.match(protocol,/full handoff/i);
assert.match(golden,/SLE/i);
assert.match(golden,/Handoff proximity:?\s*100%|Handoff proximity reaches `100%`/i);

assert.equal(bootstrap.starter?.version,"1.4.37");
assert.equal(bootstrap.starter?.checkpoint,"PR187-R5-OWNER-ACCEPTED-RJR89");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
assert.equal(bootstrap.successorPackage?.status,"rjr89-pr187-r5-owner-accepted-package");
assert.equal(bootstrap.successorPackage?.productionMergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(bootstrap.successorPackage?.pagesRunId,33738921948);
assert.equal(bootstrap.successorPackage?.stabilityRunId,33738921850);
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5");
assert.equal(bootstrap.remoteJoiningReadiness?.score,89);
assert.equal(readiness.currentScore,89);

const starter=read(bootstrap.starter.canonical);
const starterMirror=read(bootstrap.starter.projectMirror);
const handoff=read(bootstrap.currentHandoff.canonical);
const handoffMirror=read(bootstrap.currentHandoff.projectMirror);
assert.equal(starter,starterMirror,"Current starter and mirror must be byte-identical.");
assert.equal(handoff,handoffMirror,"Current SLE handoff and mirror must be byte-identical.");

for(const [name,text] of [["starter",starter],["handoff",handoff]]){
  assert.match(text,/SLE = Smart Lean Efficient/i,`${name} must preserve SLE terminology.`);
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must preserve immediate successor routing.`);
  assert.match(text,/fresh unique successor WEC|fresh unique WEC|fresh WEC/i,`${name} must require a fresh successor WEC.`);
  assert.match(text,/v1\.9\.0[\s\S]+1\.9\.0-r5/i,`${name} must preserve current production identity.`);
  assert.match(text,/89\/100|RJR89/i,`${name} must preserve fixed RJR89.`);
  assert.match(text,/PR #187/i,`${name} must preserve PR187 lineage.`);
  assert.match(text,/277f1b55dc362ee84d285445b99172b9fbed8509/i,`${name} must preserve runtime merge checkpoint.`);
  assert.match(text,/33738921948/i,`${name} must preserve Pages proof.`);
  assert.match(text,/33738921850/i,`${name} must preserve Stability proof.`);
  assert.match(text,/Billing must never be activated|billing[\s\S]+permanently forbidden/i,`${name} must preserve zero-billing lock.`);
  assert.match(text,/Firebase[\s\S]+Spark/i);
  assert.match(text,/App Check enforcement remains OFF/i);
  assert.match(text,/memory-only/i);
  assert.match(text,/browserSessionPersistence/i);
  assert.match(text,/Candidate C[\s\S]+sole destructive/i);
  assert.match(text,/exactly two private managers/i);
  assert.match(text,/public discovery|No public discovery/i);
  assert.doesNotMatch(text,/pair_[0-9a-f]{32,}/i,`${name} must not retain a full private pairing capability.`);
}

assert.match(starter,/Handoff proximity: X%/);
assert.match(starter,/Remote Joining readiness: ~Y%/);
assert.match(starter,/Estimated focused sessions to genuine RJR100: ~N–M/);
assert.match(starter,/Sidequest check:/);
assert.match(handoff,/Handoff proximity/i);
assert.match(handoff,/Remote Joining readiness/i);
assert.match(handoff,/Sidequest check/i);

assert.match(rolling,/START_NEXT_SESSION_V1\.4\.37_PR187_R5_OWNER_ACCEPTED_RJR89\.md/);
assert.match(rolling,/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03\.md/);
assert.match(rolling,/89\/100/);
assert.match(rolling,/1\.9\.0-r5/);

for(const [name,text] of [["current",current],["developer",developer],["next",next],["project",project],["prompt",prompt]]){
  assert.match(text,/START_NEXT_SESSION_V1\.4\.37_PR187_R5_OWNER_ACCEPTED_RJR89\.md|PR #187/i,`${name} must point at current PR187/v1.4.37 authority.`);
  assert.match(text,/89\/100|RJR89/i,`${name} must expose current fixed RJR89.`);
}
assert.match(current,/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03\.md/);
assert.match(prompt,/fresh unique WEC|fresh WEC/i);
assert.match(prompt,/smallest genuinely uncredited/i);

const rjrNode=graph.nodes.find(n=>n.id==="rjr1-ledger");
const r5Node=graph.nodes.find(n=>n.id==="stage5e-r5-production-proof");
const closeNode=graph.nodes.find(n=>n.id==="closing-current-wec");
const successorNode=graph.nodes.find(n=>n.id==="successor-selection");
assert.equal(rjrNode?.recordedScore,89);
assert.equal(r5Node?.runtimeRevision,"1.9.0-r5");
assert.equal(r5Node?.rjrDelta,1);
assert.equal(r5Node?.zeroManualVerifyReattachProven,true);
assert.equal(closeNode?.handoffProximity,100);
assert.equal(closeNode?.rjrScore,89);
assert.match(successorNode?.state||"",/fresh-wec-required/i);

assert.equal(model.latestCheckpoint?.rjrScore,89);
assert.equal(model.latestCheckpoint?.runtimeRevision,"1.9.0-r5");
assert.equal(model.latestCheckpoint?.closeoutPullRequest,187);
assert.equal(model.latestCheckpoint?.productionPagesRunId,33738921948);
assert.equal(model.latestCheckpoint?.productionStabilityRunId,33738921850);
assert.equal(learning.latestLesson?.rjrScore,89);
assert.equal(learning.latestLesson?.closeoutPullRequest,187);
assert.equal(learning.latestLesson?.runtimeRevision,"1.9.0-r5");

assert.equal(wec.lifecycle,"closed");
assert.equal(wec.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.handoffCompleteness,100);
assert.equal(wec.signals?.unrecordedDecisions,0);
assert.equal(wec.signals?.atomicOperation,false);
assert.ok(fs.existsSync("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5e-r4-production-convergence-acceptance.json"));
assert.equal(read("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5e-r4-production-convergence-acceptance.json"),read("WORK_ENVIRONMENT_STATUS.json"),"Closed WEC archive must remain exact.");

assert.match(next,/authenticated third-account \/ revoked-device production negatives/i);
assert.match(next,/two-device\/two-network reconnect\/adverse-network hardening/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/Do not repeat consumed r5 one-paste convergence/i);
assert.match(project,/Installable Offline App/i);
assert.match(next,/Installable Offline App/i);

process.stdout.write("PASS SLE v1.4.37 package: mirrored PR187 r5 owner-accepted RJR89 starter/handoff, current pointers, context model and closed WEC are coherent.\n");
