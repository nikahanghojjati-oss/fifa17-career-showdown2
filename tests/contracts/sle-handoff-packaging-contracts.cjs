const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(p,"utf8"),json=p=>JSON.parse(read(p));
const bootstrap=json("SESSION_BOOTSTRAP.json"),readiness=json("REMOTE_JOINING_READINESS.json"),ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json"),wec=json("WORK_ENVIRONMENT_STATUS.json");
assert.match(read("00_SLE_HANDOFF_PROTOCOL.md"),/Smart Lean Efficient/i);
assert.equal(bootstrap.starter?.version,"1.4.56");
assert.equal(bootstrap.starter?.checkpoint,"PR215-R6-RELEASE-CANDIDATE-PUBLICATION-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.56_PR215_R6_RELEASE_CANDIDATE_PUBLICATION_NEXT.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR215_R6_RELEASE_CANDIDATE_PUBLICATION_SLE_2026-09-07.md");
for(const [canonical,mirror] of [[bootstrap.starter.canonical,bootstrap.starter.projectMirror],[bootstrap.currentHandoff.canonical,bootstrap.currentHandoff.projectMirror]]){
 const text=read(canonical); assert.equal(text,read(mirror));
 assert.match(text,/PR #215/i); assert.match(text,/PR #214/i); assert.match(text,/PR #210/i); assert.match(text,/PR #209/i); assert.match(text,/PR #207/i); assert.match(text,/PR #205/i); assert.match(text,/PR #203/i);
 assert.match(text,/SSJR-1\.1/i); assert.match(text,/0\/100/); assert.match(text,/100\/100/); assert.match(text,/Smart Lean Efficient/); assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);
 assert.match(text,/two legitimate private manager|production-two-account|production two-account/i); assert.match(text,/pairing[\s\S]+ACTIVE/i);
 assert.match(text,/record:ssjr-production-shared-setup/i); assert.match(text,/validate:ssjr-production-shared-setup/i); assert.match(text,/Estimated focused sessions to genuine SSJR100/);
 assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i); assert.match(text,/Spark/i);
}
assert.equal(readiness.currentScore,100); assert.equal(ssjr.currentScore,0);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100); assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0); assert.equal(bootstrap.milestoneDeliveryProgress?.score,39);
assert.equal(bootstrap.liveBoundary?.activePullRequest,215); assert.equal(bootstrap.liveBoundary?.mainSha,"420d0dd21480c660d4fe139ba011eca1ccb987a9");
assert.equal(bootstrap.liveRuntime?.productionRuntimeRevision,"1.9.1-r5"); assert.equal(bootstrap.liveRuntime?.releaseCandidateRuntimeRevision,"1.9.1-r6");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,210,"Historical PR210 bootstrap root provenance must remain immutable.");
assert.equal(bootstrap.currentWec?.environmentId,"we-2026-09-06-pr211-recovery-private-setup-a54","Historical a54 bootstrap root provenance must remain immutable.");
const closingId="we-2026-09-07-pr214-mdp1-a58";
const archive=bootstrap.closingWec?.plannedArchive||bootstrap.closingWec?.archive;
assert.equal(bootstrap.closingWec?.environmentId,closingId);
assert.ok(archive&&fs.existsSync(path.join(process.cwd(),archive)),"Closing a58 archive must remain durable.");
const sealed=json(archive); assert.equal(sealed.environmentId,closingId); assert.equal(sealed.lifecycle,"transition-prepared"); assert.equal(sealed.signals?.handoffCompleteness,100);
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
if(wec.lifecycle==="active"){
 assert.notEqual(wec.environmentId,closingId,"Fresh successor package execution must use a unique environment ID.");
 assert.equal(wec.repository?.predecessorEnvironmentId,closingId);
 assert.equal(wec.repository?.predecessorArchive,archive);
 assert.ok(["CONTINUE","PREPARE_HANDOFF"].includes(wec.assessment?.decision));
 assert.match(wec.continuity?.currentTask||"",/release-candidate|publish|converge/i);
 assert.equal(wec.sessionHandoffProximity?.environmentId,wec.environmentId);
 assert.equal(wec.sessionHandoffProximity?.checkpoints?.[0]?.note,"New session: reset to 0%.");
}else{
 assert.equal(wec.environmentId,closingId); assert.equal(wec.lifecycle,"transition-prepared"); assert.equal(wec.signals?.handoffCompleteness,100); assert.equal(wec.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
}
process.stdout.write("PASS SLE packaging: mirrored v1.4.56 PR215 r6 package preserves immutable closing a58 provenance while permitting a fresh active successor WEC, plus PR210/209/207/205/203 history, r5 production/r6 candidate truth, RJR100/SSJR0/MDP39 and zero-billing/dual-full-screen locks.\n");
