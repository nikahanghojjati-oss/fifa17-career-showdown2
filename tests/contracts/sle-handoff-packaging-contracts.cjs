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

// Current SSJR package is complete; historical packages remain immutable below.
assert.equal(bootstrap.starter?.version,"1.4.46");
assert.equal(bootstrap.starter?.checkpoint,"PR199-SSJR1-SETUP-FOUNDATION-SEALED");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.46_PR199_SSJR1_SETUP_FOUNDATION.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR199_SSJR1_SETUP_FOUNDATION_SLE_2026-09-05.md");
for(const [canonical,mirror] of [[bootstrap.starter.canonical,bootstrap.starter.projectMirror],[bootstrap.currentHandoff.canonical,bootstrap.currentHandoff.projectMirror]]){
  const text=read(canonical);assert.equal(text,read(mirror));
  assert.match(text,/PR #199/i);assert.match(text,/SSJR-1/i);assert.match(text,/0\/100/);assert.match(text,/100\/100/);
  assert.match(text,/Smart Lean Efficient/);assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
  assert.match(text,/pairing[\s\S]+before[\s\S]+league/i);
  assert.match(text,/Estimated focused sessions to genuine SSJR100/);
  assert.match(text,/provider[\s\S]+Rules/);assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i);
}
assert.equal(read("START_NEXT_SESSION_V1.4.43_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR.md"),read("project-documents/session-starts/START_NEXT_SESSION_V1.4.43_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR.md"));
assert.equal(read("SUCCESSOR_HANDOFF_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR_SLE_2026-09-05.md"),read("project-documents/handoffs/SUCCESSOR_HANDOFF_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR_SLE_2026-09-05.md"));

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
assert.equal(bootstrap.immediateNextTask?.name,"ssjr1-provider-enforcement-after-foundation-publication");
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
assert.equal(wec.lifecycle,"transition-prepared");
assert.deepEqual(wec,json(bootstrap.currentWec.archive));
assert.equal(wec.signals.handoffCompleteness,100);
assert.equal(bootstrap.currentPublicationCheckpoint.pullRequest,199);
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

process.stdout.write("PASS SLE packaging: mirrored v1.4.46 PR199 package, frozen RJR100/SSJR0, live publication routing, archived WEC and recursive paired-first provider milestone.\n");
