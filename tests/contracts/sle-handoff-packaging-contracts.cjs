const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const bootstrap=json("SESSION_BOOTSTRAP.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
assert.match(read("00_SLE_HANDOFF_PROTOCOL.md"),/Smart Lean Efficient/i);
assert.equal(bootstrap.starter?.version,"1.4.47");
assert.equal(bootstrap.starter?.checkpoint,"PR199-POSTMERGE-GREEN-SSJR-PROVIDER-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.47_PR199_POSTMERGE_GREEN_SSJR_PROVIDER_NEXT.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR199_POSTMERGE_GREEN_SSJR_PROVIDER_NEXT_SLE_2026-09-05.md");
for(const [canonical,mirror] of [[bootstrap.starter.canonical,bootstrap.starter.projectMirror],[bootstrap.currentHandoff.canonical,bootstrap.currentHandoff.projectMirror]]){
 const text=read(canonical); assert.equal(text,read(mirror)); assert.match(text,/PR #199/i); assert.match(text,/SSJR-1/i); assert.match(text,/0\/100/); assert.match(text,/100\/100/); assert.match(text,/Smart Lean Efficient/); assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/); assert.match(text,/pairing[\s\S]+before[\s\S]+league/i); assert.match(text,/Estimated focused sessions to genuine SSJR100/); assert.match(text,/provider[\s\S]+Rules/i); assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i);
}
assert.equal(readiness.currentScore,100); assert.equal(ssjr.currentScore,0); assert.equal(bootstrap.remoteJoiningReadiness?.score,100); assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0);
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"merged-postmerge-green"); assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHeadMustBeFetchedLive,false); assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15); assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
for(const p of ["00_CURRENT_HANDOFF.md","NEXT_TASK.md","PROJECT_STATE.md","00_DEVELOPER_START_HERE.md"]){ const text=read(p); assert.match(text,/100\/100/i); assert.match(text,/PR #199/i); assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i); assert.match(text,/Billing must never be activated/i); assert.match(text,/Firebase remains Spark/i); }
assert.equal(wec.lifecycle,"transition-prepared"); assert.deepEqual(wec,json(bootstrap.currentWec.archive)); assert.equal(wec.signals.handoffCompleteness,100); assert.equal(wec.environmentId,bootstrap.currentWec.environmentId); assert.equal(wec.repository.startingMainSha,"780abd7b779cda5acd722b75fd59ef1e82c71f97"); assert.equal(wec.repository.predecessorEnvironmentId,"we-2026-09-05-ssjr-setup-foundation-28cf84"); assert.equal(json(wec.repository.predecessorArchive).environmentId,wec.repository.predecessorEnvironmentId); assert.equal(bootstrap.transition.continuationDecision,wec.assessment.decision);
process.stdout.write("PASS SLE packaging: mirrored v1.4.47 PR199 post-merge package, frozen RJR100/SSJR0, recovery WEC and recursive provider milestone.\n");
