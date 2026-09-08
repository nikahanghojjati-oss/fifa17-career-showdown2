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
const historicalClosingId="we-2026-09-07-pr214-mdp1-a58";
const historicalArchive=bootstrap.closingWec?.plannedArchive||bootstrap.closingWec?.archive;
assert.equal(bootstrap.closingWec?.environmentId,historicalClosingId);
assert.ok(historicalArchive&&fs.existsSync(path.join(process.cwd(),historicalArchive)),"Historical closing a58 archive must remain durable.");
const historicalSealed=json(historicalArchive); assert.equal(historicalSealed.environmentId,historicalClosingId); assert.equal(historicalSealed.lifecycle,"transition-prepared"); assert.equal(historicalSealed.signals?.handoffCompleteness,100);

const currentOverride=bootstrap.currentSuccessorOverride;
assert.ok(currentOverride?.capsule,"Current successor override must be additive to historical root provenance.");
const currentCapsule=json(currentOverride.capsule);
assert.equal(currentOverride.starter,currentCapsule.starter?.canonical);
assert.equal(currentOverride.deepHandoff,currentCapsule.currentHandoff?.canonical);
for(const [canonical,mirror] of [[currentCapsule.starter.canonical,currentCapsule.starter.projectMirror],[currentCapsule.currentHandoff.canonical,currentCapsule.currentHandoff.projectMirror]]){
 const text=read(canonical); assert.equal(text,read(mirror));
 assert.match(text,/PR #215/i); assert.match(text,/SSJR-1\.1/i); assert.match(text,/0\/100/); assert.match(text,/100\/100/);
 assert.match(text,/Smart Lean Efficient/); assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/); assert.match(text,/pairing[\s\S]+ACTIVE/i);
 assert.match(text,/Billing must remain permanently OFF/i); assert.match(text,/Spark/i);
}
const closingId=currentCapsule.closingEnvironmentId;
const closingArchive=currentCapsule.closingArchive;
assert.ok(closingId&&closingArchive&&fs.existsSync(path.join(process.cwd(),closingArchive)),"Current capsule closing archive must remain durable.");
const sealed=json(closingArchive); assert.equal(sealed.environmentId,closingId); assert.equal(sealed.lifecycle,"transition-prepared"); assert.equal(sealed.signals?.handoffCompleteness,100);
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
if(wec.lifecycle==="active"){
 assert.notEqual(wec.environmentId,closingId,"Fresh successor package execution must use a unique environment ID.");
 assert.equal(wec.repository?.predecessorEnvironmentId,closingId);
 assert.equal(wec.repository?.predecessorArchive,closingArchive);
 assert.ok(["CONTINUE","PREPARE_HANDOFF"].includes(wec.assessment?.decision));
 assert.match(wec.continuity?.currentTask||"",/release-candidate|publish|converge/i);
 assert.equal(wec.sessionHandoffProximity?.environmentId,wec.environmentId);
 assert.equal(wec.sessionHandoffProximity?.checkpoints?.[0]?.note,"New session: reset to 0%.");
}else{
 assert.equal(wec.environmentId,closingId,"Sealed current status must match the current capsule closing environment.");
 assert.equal(wec.lifecycle,"transition-prepared"); assert.equal(wec.signals?.handoffCompleteness,100);
 assert.ok(["HANDOFF_AT_CHECKPOINT","HANDOFF_NOW"].includes(wec.assessment?.decision),"Sealed lifecycle must preserve the independently derived handoff decision.");
}
process.stdout.write("PASS SLE packaging: immutable V1.4.56/a58 historical provenance is distinct from additive current capsule authority; current mirrored package, closing WEC, fresh ancestry, literal zero reset, RJR100/SSJR0/MDP39 and zero-billing locks remain coherent.\n");
