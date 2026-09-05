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
const archivedWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-stage5g-reconnect-recovery.json");
const current=read("00_CURRENT_HANDOFF.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const rolling=read("project-documents/START_NEXT_SESSION.md");
const prompt=read("NEXT_CHAT_HANDOFF_PROMPT.md");

assert.match(protocol,/Smart Lean Efficient/i);
assert.match(protocol,/mandatory/i);
assert.match(protocol,/recursive/i);
assert.match(golden,/Handoff proximity:?\s*100%|Handoff proximity reaches `100%`/i);
assert.match(eagle,/Owner's Eagle Eye/i);

assert.equal(bootstrap.starter?.version,"1.4.41");
assert.equal(bootstrap.starter?.checkpoint,"PR194-R2-PRODUCTION-RJR91-PHYSICAL-ACCEPTANCE-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.41_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE_SLE_2026-09-05.md");
assert.equal(bootstrap.currentHandoff?.status,"current-pr194-r2-production-rjr91-physical-acceptance-next");
assert.equal(bootstrap.successorPackage?.compactStarter,bootstrap.starter.canonical);
assert.equal(bootstrap.successorPackage?.fullHandoff,bootstrap.currentHandoff.canonical);
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,194);
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"merged");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactFinalHead,"42f91df5ec1d5a576f0907836fa03f5994d7646b");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"11bb681527a9b78884baf0c384350c90493dc9bd");
assert.equal(bootstrap.currentPublicationCheckpoint?.expectedHeadProtectionUsed,true);
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.unresolvedReviewThreadsAtMerge,0);
assert.equal(bootstrap.currentPublicationCheckpoint?.releaseIntegrationRunId,33947112248);
assert.equal(bootstrap.currentPublicationCheckpoint?.stabilityRunId,33947112190);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedSiteSmokeJobId,101255587827);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedEveryRuntimeByteProven,true);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedCompleteJourneyProven,true);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkRjrCredit,0);
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r2");
assert.equal(bootstrap.runtime?.productionStatus,"production-proven");
assert.equal(bootstrap.runtime?.previousProductionRuntimeRevision,"1.9.1-r1");
assert.equal(bootstrap.remoteJoiningReadiness?.score,91);
assert.equal(bootstrap.immediateNextTask?.name,"physical-two-device-two-independent-network-remote-joining-acceptance");

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,91);
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,readiness.domains.reduce((sum,domain)=>sum+domain.earned,0));
assert.deepEqual(readiness.domains.map(domain=>[domain.id,domain.earned]),[
  ["deterministic-sync-recovery",20],["identity-auth-trust",20],["production-cloud-security",20],["devices-pairing-connected-rivalry-remote-join",22],["real-device-hardening-release",9]
]);

const starter=read(bootstrap.starter.canonical);
const starterMirror=read(bootstrap.starter.projectMirror);
const handoff=read(bootstrap.currentHandoff.canonical);
const handoffMirror=read(bootstrap.currentHandoff.projectMirror);
assert.equal(starter,starterMirror,"Current starter and mirror must be byte-identical.");
assert.equal(handoff,handoffMirror,"Current SLE handoff and mirror must be byte-identical.");
for(const [name,text] of [["starter",starter],["handoff",handoff]]){
  assert.match(text,/SLE = Smart Lean Efficient/i,`${name} must preserve SLE terminology.`);
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
  assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i);
  assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i);
  assert.match(text,/91\/100|RJR91/i);
  assert.match(text,/PR #194/i);
  assert.match(text,/42f91df5ec1d5a576f0907836fa03f5994d7646b/i);
  assert.match(text,/11bb681527a9b78884baf0c384350c90493dc9bd/i);
  assert.match(text,/33947112248/i);assert.match(text,/33947112190/i);assert.match(text,/101255587827/i);
  assert.match(text,/two physical devices|two-physical-device/i);
  assert.match(text,/independent network|two-independent-network/i);
  assert.match(text,/Billing must never be activated|billing[\s\S]+permanently forbidden/i);
  assert.match(text,/Firebase[\s\S]+Spark/i);assert.match(text,/App Check enforcement remains(?: \*\*)?OFF(?:\*\*)?/i);assert.match(text,/memory-only/i);assert.match(text,/browserSessionPersistence/i);
  assert.match(text,/Candidate C[\s\S]+sole destructive/i);assert.match(text,/exactly two private managers/i);assert.match(text,/public discovery|No public discovery/i);
  assert.doesNotMatch(text,/pair_[0-9a-f]{32,}/i);
}

const historicalPr187Starter=read("START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const historicalPr187Handoff=read("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
const historicalPr191Starter=read("START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md");
const historicalPr191Handoff=read("SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md");
for(const text of [historicalPr187Starter,historicalPr187Handoff]){assert.match(text,/PR #187/i);assert.match(text,/89\/100|RJR89/i);assert.match(text,/277f1b55dc362ee84d285445b99172b9fbed8509/i);}
for(const text of [historicalPr191Starter,historicalPr191Handoff]){assert.match(text,/PR #191/i);assert.match(text,/91\/100|RJR91/i);assert.match(text,/7ca132a607cbf4fd78710b14526b4bec849ac2d2/i);assert.match(text,/72f7031797592a3866f7c62da07fa42959cb30fb/i);}
assert.equal(historicalPr187Starter,read("project-documents/session-starts/START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md"));
assert.equal(historicalPr187Handoff,read("project-documents/handoffs/SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md"));
assert.equal(historicalPr191Starter,read("project-documents/session-starts/START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md"));
assert.equal(historicalPr191Handoff,read("project-documents/handoffs/SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md"));

for(const text of [current,rolling,prompt,next,project]){assert.match(text,/PR #194|PR194/i);assert.match(text,/1\.9\.1-r2/i);assert.match(text,/91\/100|RJR91/i);assert.match(text,/physical/i);}
assert.match(current,/START_NEXT_SESSION_V1\.4\.41_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE\.md/);
assert.match(rolling,/START_NEXT_SESSION_V1\.4\.41_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE\.md/);
assert.match(prompt,/START_NEXT_SESSION_V1\.4\.41_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE\.md/);
assert.match(next,/final stable Remote Joining release acceptance/i);assert.match(project,/production-proven/i);

const closeNode=graph.nodes.find(n=>n.id==="closing-current-wec");
const successorNode=graph.nodes.find(n=>n.id==="successor-selection");
const hardeningNode=graph.nodes.find(n=>n.id==="stage5g-h-i-network-hardening");
assert.equal(closeNode?.environmentId,"we-2026-09-04-stage5g-reconnect-recovery");assert.equal(closeNode?.finalDecision,"HANDOFF_NOW");assert.equal(closeNode?.handoffProximity,100);assert.equal(closeNode?.mergeSha,"11bb681527a9b78884baf0c384350c90493dc9bd");
assert.equal(hardeningNode?.runtimeRevision,"1.9.1-r2");assert.equal(hardeningNode?.rjrCredit,0);assert.match(successorNode?.state||"",/physical-two-device-two-independent-network-acceptance/i);
assert.equal(model.latestCheckpoint?.rjrScore,91);assert.equal(model.latestCheckpoint?.runtimeRevision,"1.9.1-r2");assert.equal(model.latestCheckpoint?.publicationPullRequest,194);assert.equal(model.latestCheckpoint?.publicationMergeSha,"11bb681527a9b78884baf0c384350c90493dc9bd");
assert.equal(learning.latestLesson?.rjrScore,91);assert.equal(learning.latestLesson?.publicationPullRequest,194);assert.equal(learning.latestLesson?.runtimeRevision,"1.9.1-r2");assert.equal(learning.latestLesson?.next,"physical-two-device-two-independent-network-remote-joining-acceptance");

assert.equal(wec.environmentId,"we-2026-09-04-stage5g-reconnect-recovery");assert.equal(wec.lifecycle,"closed");assert.equal(wec.assessment?.decision,"HANDOFF_NOW");assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);assert.equal(wec.signals?.handoffCompleteness,100);assert.equal(wec.signals?.unrecordedDecisions,0);assert.equal(wec.signals?.atomicOperation,false);
assert.deepEqual(wec,archivedWec,"Closed WEC status and archive must be semantic equivalents.");
assert.match(wec.continuity?.nextSafeAction||"",/fresh successor[\s\S]+two-physical-device\/two-independent-network/i);

process.stdout.write("PASS SLE packaging: v1.4.41 mirrored PR194/r2 production package preserves RJR91, closes WEC, keeps historical PR187/PR191 provenance, and routes only to genuine physical Remote Joining acceptance under zero billing.\n");
