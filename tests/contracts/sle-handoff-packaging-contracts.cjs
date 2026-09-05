const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const bootstrap=json("SESSION_BOOTSTRAP.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");

assert.match(read("00_SLE_HANDOFF_PROTOCOL.md"),/Smart Lean Efficient/i);
assert.match(read("00_HANDOFF_GOLDEN_RULE.md"),/Handoff proximity:?\s*100%|Handoff proximity reaches `100%`/i);
assert.match(read("00_OWNER_EAGLE_EYE_GOLDEN_RULE.md"),/Owner's Eagle Eye/i);

// The completed v1.4.43 PR196 package stays byte-stable until the new SNS is actually generated.
assert.equal(bootstrap.starter?.version,"1.4.43");
assert.equal(bootstrap.starter?.checkpoint,"PR196-CORRECTED-VALIDATOR-SEALED-RJR91-PUBLICATION-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.43_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR_SLE_2026-09-05.md");
const starter=read(bootstrap.starter.canonical);
const starterMirror=read(bootstrap.starter.projectMirror);
const handoff=read(bootstrap.currentHandoff.canonical);
const handoffMirror=read(bootstrap.currentHandoff.projectMirror);
assert.equal(starter,starterMirror,"Completed v1.4.43 starter mirror must remain byte-identical.");
assert.equal(handoff,handoffMirror,"Completed PR196 SLE mirror must remain byte-identical.");
assert.match(starter,/PR #196/i); assert.match(starter,/91\/100|RJR91/i);
assert.match(handoff,/PR #196/i); assert.match(handoff,/91\/100|RJR91/i);

// Current live authority has advanced independently of the last completed SNS package.
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,100);
assert.equal(readiness.currentScore,readiness.domains.reduce((sum,d)=>sum+d.earned,0));
assert.deepEqual(readiness.domains.map(d=>d.earned),[20,20,20,30,10]);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100);
assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.pullRequest,198);
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.state,"merged");
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.baseSha,"264237056896d2b9d84f69c908da5b14e2b8e97d");
assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHead,null);
assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHeadMustBeFetchedLive,true);
assert.equal(bootstrap.currentPublicationCheckpoint?.runtimeChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.rulesChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.providerMutationRequired,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkRjrCredit,0);
assert.equal(bootstrap.immediateNextTask?.name,"ssjr1-authoritative-setup-foundation");
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r2");
assert.equal(bootstrap.runtime?.productionStatus,"production-proven");
assert.equal(bootstrap.runtime?.previousProductionRuntimeRevision,"1.9.1-r1");

for(const p of ["00_CURRENT_HANDOFF.md","NEXT_TASK.md","PROJECT_STATE.md","00_DEVELOPER_START_HERE.md"]){
  const text=read(p);
  assert.match(text,/100\/100/i,`${p} must expose accepted RJR100.`);
  assert.match(text,/PR #198/i);
  assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i);
  assert.match(text,/Billing must never be activated/i);
  assert.match(text,/Firebase remains Spark/i);
}
assert.match(read("NEXT_TASK.md"),/Shared Showdown Journey Readiness|SSJR-1/i);
assert.match(read("00_DEVELOPER_START_HERE.md"),/Shared Showdown Journey Readiness|SSJR-1/i);
assert.match(read("FINAL_RJR100_REMOTE_JOINING_ACCEPTANCE_2026-09-05.md"),/RJR-1 100\/100/i);

const predecessor=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-05-physical-acceptance-evidence.json");
assert.equal(predecessor.lifecycle,"closed");
assert.equal(predecessor.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
assert.equal(wec.lifecycle,"active");
assert.notEqual(wec.environmentId,predecessor.environmentId);
assert.equal(wec.environmentId,bootstrap.currentWec?.environmentId);
assert.equal(wec.repository?.predecessorEnvironmentId,"we-2026-09-05-pr196-publication-physical-acceptance-e9072");
assert.equal(json(wec.repository.predecessorArchive).environmentId,wec.repository.predecessorEnvironmentId);
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.mergeSha,"39ffe88d61dcda973df03a18e0266fcfe4cf5638");
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.exactFinalHead,"165b21a1e9a269fae87efa06ebd1df89cfc48e04");
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,json("SHARED_SHOWDOWN_JOURNEY_READINESS.json").currentScore);
assert.equal(wec.signals?.handoffCompleteness,bootstrap.transition?.handoffCompleteness);
assert.ok(bootstrap.transition?.handoffCompleteness >= 0 && bootstrap.transition?.handoffCompleteness <= 100);
assert.equal(bootstrap.transition?.continuationDecision,wec.assessment?.decision);

// Old RJR89/RJR91 packages remain immutable historical provenance.
for(const [p,marker] of [
 ["START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md",/89\/100|RJR89/i],
 ["SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md",/89\/100|RJR89/i],
 ["START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md",/91\/100|RJR91/i],
 ["SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md",/91\/100|RJR91/i]
]) assert.match(read(p),marker);

process.stdout.write("PASS SLE packaging: the completed v1.4.43 PR196 package remains immutable while current authority advances past merged RJR100/PR198 into fixed SSJR-1; a new SNS is not claimed before clean Handoff proximity 100%.\n");
