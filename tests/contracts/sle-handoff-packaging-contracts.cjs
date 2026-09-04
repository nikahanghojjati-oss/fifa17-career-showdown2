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
const predecessorWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5f-authenticated-negatives.json");
const current=read("00_CURRENT_HANDOFF.md");
const developer=read("00_DEVELOPER_START_HERE.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const rolling=read("project-documents/START_NEXT_SESSION.md");
const prompt=read("NEXT_CHAT_HANDOFF_PROMPT.md");
const historicalStarter=read("START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const historicalHandoff=read("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
const historicalStarterMirror=read("project-documents/session-starts/START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const historicalHandoffMirror=read("project-documents/handoffs/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");

assert.match(protocol,/Smart Lean Efficient/i);
assert.match(protocol,/mandatory/i);
assert.match(protocol,/recursive/i);
assert.match(protocol,/starter/i);
assert.match(protocol,/full handoff/i);
assert.match(golden,/SLE/i);
assert.match(golden,/Handoff proximity:?\s*100%|Handoff proximity reaches `100%`/i);
assert.match(eagle,/Owner's Eagle Eye/i);
assert.match(eagle,/Every future SLE\/SNS successor package|Every future SLE\/SNS|Every future SLE/i);

// The predecessor reached Handoff proximity 100 on a separate branch while PR191 stayed open.
// SESSION_BOOTSTRAP and the mirrored package must now describe that completed PR191/RJR91 handoff.
assert.equal(bootstrap.starter?.version,"1.4.39");
assert.equal(bootstrap.starter?.checkpoint,"PR191-OPEN-RJR91-STAGE5G-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.39_PR191_RJR91_STAGE5G_HANDOFF.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR191_RJR91_STAGE5G_PENDING_SLE_2026-09-04.md");
assert.equal(bootstrap.currentHandoff?.status,"current-pr191-open-rjr91-stage5g-next");
assert.equal(bootstrap.successorPackage?.compactStarter,bootstrap.starter.canonical);
assert.equal(bootstrap.successorPackage?.fullHandoff,bootstrap.currentHandoff.canonical);
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,191);
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"open");
assert.equal(bootstrap.currentPublicationCheckpoint?.lastExactHeadBeforeHandoffPackaging,"4a63137b918b3d4b6d3d93916e67b72e85848c39");
assert.equal(bootstrap.currentPublicationCheckpoint?.lastPublishedRepairHeadBeforeContinuityCheckpoint,"f397c88fda5f63da4688f894778b9360bf2e1a02");
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationStatus,"repair-published-final-continuity-head-awaiting-workflows");
assert.equal(bootstrap.currentPublicationCheckpoint?.baseSha,"7c140a1593bfc84fcf3b42e6eec3eb50c9a262e4");
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkRjrCredit,0);
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5");
assert.equal(bootstrap.remoteJoiningReadiness?.score,91,"Bootstrap must expose the readiness score that was true when the current SNS was sealed.");

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
  assert.match(text,/91\/100|RJR91/i,`${name} must preserve the RJR91 value that was true at its seal boundary.`);
  assert.match(text,/PR #191/i,`${name} must preserve PR191 publication lineage.`);
  assert.match(text,/7c140a1593bfc84fcf3b42e6eec3eb50c9a262e4/i,`${name} must preserve the live-main checkpoint.`);
  assert.match(text,/4a63137b918b3d4b6d3d93916e67b72e85848c39/i,`${name} must preserve the last exact PR head before separate handoff packaging.`);
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

assert.equal(historicalStarter,historicalStarterMirror,"Historical PR187 starter mirrors must remain byte-identical.");
assert.equal(historicalHandoff,historicalHandoffMirror,"Historical PR187 handoff mirrors must remain byte-identical.");
for(const text of [historicalStarter,historicalHandoff]){
  assert.match(text,/PR #187/i);
  assert.match(text,/89\/100|RJR89/i);
  assert.match(text,/277f1b55dc362ee84d285445b99172b9fbed8509/i);
  assert.match(text,/33738921948/i);
  assert.match(text,/33738921850/i);
}

assert.match(starter,/Handoff proximity: X%/);
assert.match(starter,/Remote Joining readiness: ~Y%/);
assert.match(starter,/Estimated focused sessions to genuine RJR100: ~N–M/);
assert.match(starter,/Sidequest check:/);
assert.match(handoff,/Handoff proximity/i);
assert.match(handoff,/Remote Joining readiness/i);
assert.match(handoff,/Sidequest check/i);

// Rolling pointers and the owner convenience prompt must identify the newly completed PR191 SNS.
assert.match(rolling,/START_NEXT_SESSION_V1\.4\.39_PR191_RJR91_STAGE5G_HANDOFF\.md/);
assert.match(rolling,/SUCCESSOR_HANDOFF_PR191_RJR91_STAGE5G_PENDING_SLE_2026-09-04\.md/);
assert.match(rolling,/91\/100/);
assert.match(rolling,/1\.9\.0-r5/);
assert.match(current,/START_NEXT_SESSION_V1\.4\.39_PR191_RJR91_STAGE5G_HANDOFF\.md/);
assert.match(current,/SUCCESSOR_HANDOFF_PR191_RJR91_STAGE5G_PENDING_SLE_2026-09-04\.md/);
assert.match(current,/PR #191[\s\S]+91\/100|RJR91/i);
assert.match(prompt,/START_NEXT_SESSION_V1\.4\.39_PR191_RJR91_STAGE5G_HANDOFF\.md/);
assert.match(prompt,/91\/100|RJR91/i);
assert.match(prompt,/fresh unique WEC|fresh WEC/i);
assert.match(prompt,/finish PR #191 exact-head gates/i);

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

// Progressive context graph/model/learning must match the completed PR191/RJR91 SNS while retaining r5 history.
const rjrNode=graph.nodes.find(n=>n.id==="rjr1-ledger");
const r5Node=graph.nodes.find(n=>n.id==="stage5e-r5-production-proof");
const closeNode=graph.nodes.find(n=>n.id==="closing-current-wec");
const successorNode=graph.nodes.find(n=>n.id==="successor-selection");
const stage5fNode=graph.nodes.find(n=>n.id==="stage5f-production-authenticated-negatives");
assert.equal(rjrNode?.recordedScore,91);
assert.equal(r5Node?.runtimeRevision,"1.9.0-r5");
assert.equal(r5Node?.rjrDelta,1);
assert.equal(r5Node?.zeroManualVerifyReattachProven,true);
assert.equal(stage5fNode?.rjrScoreAfterProof,91);
assert.equal(stage5fNode?.rjrDelta,2);
assert.equal(stage5fNode?.publicationWorkRjrCredit,0);
assert.equal(closeNode?.handoffProximity,100);
assert.equal(closeNode?.rjrScore,91);
assert.equal(closeNode?.environmentId,"we-2026-09-03-stage5f-authenticated-negatives");
assert.equal(closeNode?.finalDecision,"HANDOFF_NOW");
assert.match(successorNode?.state||"",/fresh-wec-required-finish-pr191/i);
assert.equal(model.latestCheckpoint?.rjrScore,91);
assert.equal(model.latestCheckpoint?.runtimeRevision,"1.9.0-r5");
assert.equal(model.latestCheckpoint?.publicationPullRequest,191);
assert.equal(model.latestCheckpoint?.publicationState,"open");
assert.equal(model.latestCheckpoint?.lastRuntimePullRequest,187);
assert.equal(model.latestCheckpoint?.runtimeProductionPagesRunId,33738921948);
assert.equal(model.latestCheckpoint?.runtimeProductionStabilityRunId,33738921850);
assert.equal(learning.latestLesson?.rjrScore,91);
assert.equal(learning.latestLesson?.publicationPullRequest,191);
assert.equal(learning.latestLesson?.publicationState,"open");
assert.equal(learning.latestLesson?.runtimeRevision,"1.9.0-r5");

assert.ok(fs.existsSync("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5f-authenticated-negatives.json"));
assert.equal(predecessorWec.lifecycle,"closed");
assert.equal(predecessorWec.assessment?.decision,"HANDOFF_NOW");
assert.equal(predecessorWec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(predecessorWec.signals?.handoffCompleteness,100);
assert.equal(predecessorWec.signals?.unrecordedDecisions,0);
assert.equal(predecessorWec.signals?.atomicOperation,false);
assert.equal(wec.environmentId,"we-2026-09-04-pr191-publication-stage5g");
assert.equal(wec.lifecycle,"active");
assert.equal(wec.repository?.predecessorEnvironmentId,predecessorWec.environmentId);
assert.equal(wec.assessment?.decision,"CONTINUE");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.handoffCompleteness,100);
assert.equal(wec.signals?.unrecordedDecisions,0);
assert.equal(wec.signals?.atomicOperation,false);
assert.match(wec.continuity?.currentTask||"",/PR #191[\s\S]+publication[\s\S]+Stage 5G/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/Fixed RJR-1 is 91\/100/i);

process.stdout.write("PASS SLE packaging transition: current PR191/RJR91 mirrored SNS, rolling pointers, context graph/model/learning, closed Stage 5F WEC, fresh PR191 publication WEC and immutable PR187/r5 provenance remain coherent.\n");
