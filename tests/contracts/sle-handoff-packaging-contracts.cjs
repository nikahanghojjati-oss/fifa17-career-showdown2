const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8"),json=p=>JSON.parse(read(p));
const bootstrap=json("SESSION_BOOTSTRAP.json"),readiness=json("REMOTE_JOINING_READINESS.json"),ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json"),wec=json("WORK_ENVIRONMENT_STATUS.json");
assert.match(read("00_SLE_HANDOFF_PROTOCOL.md"),/Smart Lean Efficient/i);
assert.equal(bootstrap.starter?.version,"1.4.54");
assert.equal(bootstrap.starter?.checkpoint,"PR210-POSTMERGE-GREEN-SSJR-PRIVATE-TWO-ACCOUNT-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.54_PR210_POSTMERGE_GREEN_SSJR_PRIVATE_TWO_ACCOUNT_NEXT.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR210_POSTMERGE_GREEN_SSJR_PRIVATE_TWO_ACCOUNT_NEXT_SLE_2026-09-06.md");
for(const [canonical,mirror] of [[bootstrap.starter.canonical,bootstrap.starter.projectMirror],[bootstrap.currentHandoff.canonical,bootstrap.currentHandoff.projectMirror]]){
 const text=read(canonical); assert.equal(text,read(mirror)); assert.match(text,/PR #210/i); assert.match(text,/PR #209/i); assert.match(text,/PR #207/i); assert.match(text,/PR #205/i); assert.match(text,/PR #203/i);
 assert.match(text,/SSJR-1\.1/i); assert.match(text,/0\/100/); assert.match(text,/100\/100/); assert.match(text,/Smart Lean Efficient/); assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
 assert.match(text,/two legitimate private manager|production-two-account|production two-account/i); assert.match(text,/pairing[\s\S]+ACTIVE/i);
 assert.match(text,/record:ssjr-production-shared-setup/i); assert.match(text,/validate:ssjr-production-shared-setup/i); assert.match(text,/Estimated focused sessions to genuine SSJR100/);
 assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i); assert.match(text,/Spark/i);
}
assert.equal(readiness.currentScore,100); assert.equal(ssjr.currentScore,0);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100); assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0);
assert.equal(bootstrap.sharedShowdownJourneyReadiness?.estimatedFocusedSessionsToGenuine100,"5-10");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,210);
assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHead,"c863e1c2506bf34ff9521ed22bd989c221b437a6");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"a1b4a34f8a2abcc4e361c4239da684ace9a4a40a");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeStabilityRunId,34060301345);
assert.equal(bootstrap.currentPublicationCheckpoint?.pagesRunId,34060301380);
assert.equal(bootstrap.currentPublicationCheckpoint?.reviewThreadsResolved,1);
assert.equal(bootstrap.currentPublicationCheckpoint?.runtimeChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.productionTwoAccountEvidence,false);
assert.equal(bootstrap.historicalPr209PublicationCheckpoint?.pullRequest,209);
assert.equal(bootstrap.historicalPr207PublicationCheckpoint?.pullRequest,207);
assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.pullRequest,205);
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203);
assert.equal(wec.environmentId,"we-2026-09-06-ssjr-production-storage-observation-a53");
assert.equal(wec.signals?.unresolvedFailures,0);
if(wec.lifecycle==="active"){
 assert.equal(wec.assessment?.decision,"CONTINUE");
}else{
 assert.equal(wec.lifecycle,"transition-prepared"); assert.equal(wec.signals?.handoffCompleteness,100); assert.equal(wec.assessment?.decision,"HANDOFF_NOW");
 const archivePath=bootstrap.currentWec.archive||bootstrap.currentWec.plannedArchive; const archived=json(archivePath);
 assert.equal(archived.environmentId,wec.environmentId); assert.equal(archived.lifecycle,"transition-prepared"); assert.equal(archived.signals?.handoffCompleteness,100);
}
process.stdout.write("PASS SLE packaging: mirrored v1.4.54 PR210/PR209 observer package preserves PR207 recorder, PR205 validator, PR203 r3 production authority, frozen RJR100/SSJR0, a53 WEC, and genuine private two-account successor task without billing.\n");