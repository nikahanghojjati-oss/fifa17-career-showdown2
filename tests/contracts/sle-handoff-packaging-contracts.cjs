const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const golden=read("00_HANDOFF_GOLDEN_RULE.md");
const eagle=read("00_OWNER_EAGLE_EYE_GOLDEN_RULE.md");
const protocol=read("00_SLE_HANDOFF_PROTOCOL.md");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const graph=json("SESSION_CONTEXT_GRAPH.json");
const model=json("SESSION_CONTEXT_MODEL.json");
const learning=json("SESSION_CONTEXT_LEARNING.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const predecessorWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5e-r4-production-convergence-acceptance.json");
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
assert.match(eagle,/Owner's Eagle Eye/i);
assert.match(eagle,/Every future SLE\/SNS successor package|Every future SLE\/SNS|Every future SLE/i);

// The repository has not reached the current environment's Handoff-proximity-100 boundary yet.
// Therefore SESSION_BOOTSTRAP and the mirrored starter/handoff still describe the last *completed*
// PR187/RJR89 successor package. They are historical orientation, not the current execution ledger.
assert.equal(bootstrap.starter?.version,"1.4.37");
assert.equal(bootstrap.starter?.checkpoint,"PR187-R5-OWNER-ACCEPTED-RJR89");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
assert.equal(bootstrap.successorPackage?.status,"rjr89-pr187-r5-owner-accepted-package");
assert.equal(bootstrap.successorPackage?.productionMergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(bootstrap.successorPackage?.pagesRunId,33738921948);
assert.equal(bootstrap.successorPackage?.stabilityRunId,33738921850);
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5");
assert.equal(bootstrap.remoteJoiningReadiness?.score,89,"Bootstrap keeps the readiness score that was true when the last completed SNS was sealed.");

// Live fixed RJR authority is independent from that historical package and has advanced on new evidence.
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,91);
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,readiness.domains.reduce((sum,domain)=>sum+domain.earned,0));
const domain=id=>readiness.domains.find(domain=>domain.id===id);
assert.deepEqual(readiness.domains.map(domain=>[domain.id,domain.earned]),[
  ["deterministic-sync-recovery",20],
  ["identity-auth-trust",20],
  ["production-cloud-security",20],
  ["devices-pairing-connected-rivalry-remote-join",22],
  ["real-device-hardening-release",9]
]);
assert.equal(domain("identity-auth-trust")?.weight,20);

const starter=read(bootstrap.starter.canonical);
const starterMirror=read(bootstrap.starter.projectMirror);
const handoff=read(bootstrap.currentHandoff.canonical);
const handoffMirror=read(bootstrap.currentHandoff.projectMirror);
assert.equal(starter,starterMirror,"Last completed starter and mirror must remain byte-identical.");
assert.equal(handoff,handoffMirror,"Last completed SLE handoff and mirror must remain byte-identical.");

for(const [name,text] of [["last completed starter",starter],["last completed handoff",handoff]]){
  assert.match(text,/SLE = Smart Lean Efficient/i,`${name} must preserve SLE terminology.`);
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must preserve the historical immediate successor routing that was sealed with it.`);
  assert.match(text,/fresh unique successor WEC|fresh unique WEC|fresh WEC/i,`${name} must preserve fresh successor WEC ownership.`);
  assert.match(text,/v1\.9\.0[\s\S]+1\.9\.0-r5/i,`${name} must preserve the production identity it sealed.`);
  assert.match(text,/89\/100|RJR89/i,`${name} must preserve the RJR89 value that was true at its seal boundary.`);
  assert.match(text,/PR #187/i,`${name} must preserve PR187 lineage.`);
  assert.match(text,/277f1b55dc362ee84d285445b99172b9fbed8509/i,`${name} must preserve its runtime merge checkpoint.`);
  assert.match(text,/33738921948/i,`${name} must preserve its Pages proof.`);
  assert.match(text,/33738921850/i,`${name} must preserve its Stability proof.`);
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

// Historical rolling pointers remain on the last completed package until the current environment seals a new SNS.
assert.match(rolling,/START_NEXT_SESSION_V1\.4\.37_PR187_R5_OWNER_ACCEPTED_RJR89\.md/);
assert.match(rolling,/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03\.md/);
assert.match(rolling,/89\/100/);
assert.match(rolling,/1\.9\.0-r5/);
assert.match(current,/START_NEXT_SESSION_V1\.4\.37_PR187_R5_OWNER_ACCEPTED_RJR89\.md/);
assert.match(current,/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03\.md/);
assert.match(current,/PR #187[\s\S]+89\/100|RJR89/i);
assert.match(prompt,/START_NEXT_SESSION_V1\.4\.37_PR187_R5_OWNER_ACCEPTED_RJR89\.md/);
assert.match(prompt,/89\/100|RJR89/i);
assert.match(prompt,/fresh unique WEC|fresh WEC/i);
assert.match(prompt,/smallest genuinely uncredited/i);

// Current execution authority, unlike those historical pointers, must expose the newly accepted Stage 5F evidence and RJR91.
for(const [name,text] of [["developer",developer],["next",next],["project",project]]){
  assert.match(text,/91\/100|RJR91/i,`${name} must expose live fixed RJR91.`);
  assert.match(text,/Stage 5F/i,`${name} must preserve the accepted Stage 5F boundary.`);
  assert.match(text,/Stage 5G|Remote Joining-specific/i,`${name} must route to the current Stage 5G lane.`);
  assert.match(text,/Work Environment Continuity/i,`${name} must keep live authority inside WEC.`);
  assert.match(text,/Billing must never be activated|Billing is permanently forbidden|billing[\s\S]+permanently forbidden/i);
  assert.match(text,/Firebase[\s\S]+Spark/i);
}
assert.match(developer,/00_OWNER_EAGLE_EYE_GOLDEN_RULE\.md/);
assert.match(developer,/reconnect\/adverse-network hardening/i);
assert.match(next,/two-device\/two-network reconnect\/adverse-network hardening/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/do not repeat generic Connected Rivalry adverse-network proof/i);
assert.match(next,/Do not award RJR for source, CI, PR, merge, deployment, documentation, WEC/i);
assert.match(project,/Stage 5G[\s\S]+reconnect and adverse-network hardening/i);
assert.match(project,/Installable Offline App/i);
assert.match(next,/Installable Offline App/i);

// Progressive context graph/model/learning are snapshots of the last completed SLE package until the next SNS refresh.
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

assert.ok(fs.existsSync("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5e-r4-production-convergence-acceptance.json"));
assert.equal(predecessorWec.lifecycle,"closed");
assert.equal(predecessorWec.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
assert.equal(predecessorWec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(predecessorWec.signals?.handoffCompleteness,100);
assert.equal(predecessorWec.signals?.unrecordedDecisions,0);
assert.equal(predecessorWec.signals?.atomicOperation,false);
assert.equal(wec.environmentId,"we-2026-09-03-stage5f-authenticated-negatives");
assert.equal(wec.lifecycle,"active");
assert.equal(wec.repository?.predecessorEnvironmentId,predecessorWec.environmentId);
assert.equal(wec.assessment?.decision,"CONTINUE");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.handoffCompleteness,100);
assert.equal(wec.signals?.unrecordedDecisions,0);
assert.equal(wec.signals?.atomicOperation,false);
assert.match(wec.continuity?.currentTask||"",/reconnect|adverse-network|Stage 5G/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/Fixed RJR-1 is 91\/100/i);

process.stdout.write("PASS SLE packaging transition: PR187/RJR89 remains the last completed mirrored successor package while live fixed RJR91, Stage 5F acceptance, Owner's Eagle Eye and the active Stage 5G WEC correctly supersede it for current execution until the next Handoff-proximity-100 SNS is sealed.\n");