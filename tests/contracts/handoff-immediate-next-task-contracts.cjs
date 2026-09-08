const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(p,"utf8"),json=p=>JSON.parse(read(p));
const readiness=json("REMOTE_JOINING_READINESS.json"),ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json"),bootstrap=json("SESSION_BOOTSTRAP.json"),wec=json("WORK_ENVIRONMENT_STATUS.json");
const docs=[["00_CURRENT_HANDOFF",read("00_CURRENT_HANDOFF.md")],["NEXT_TASK",read("NEXT_TASK.md")],["PROJECT_STATE",read("PROJECT_STATE.md")],["00_DEVELOPER_START_HERE",read("00_DEVELOPER_START_HERE.md")]];
assert.equal(readiness.modelVersion,"RJR-1"); assert.equal(readiness.currentScore,100); assert.equal(ssjr.currentScore,0);
assert.equal(bootstrap.starter?.version,"1.4.56","V1.4.56 SESSION_BOOTSTRAP remains immutable historical package provenance"); assert.equal(bootstrap.liveBoundary?.activePullRequest,215); assert.equal(bootstrap.liveBoundary?.mainSha,"420d0dd21480c660d4fe139ba011eca1ccb987a9");
assert.equal(bootstrap.liveRuntime?.productionRuntimeRevision,"1.9.1-r5"); assert.equal(bootstrap.liveRuntime?.releaseCandidateRuntimeRevision,"1.9.1-r6");
assert.equal(bootstrap.livePublicationCheckpoint?.pullRequest,215); assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,210,"PR210 remains immutable historical bootstrap provenance");
assert.equal(bootstrap.historicalPr209PublicationCheckpoint?.pullRequest,209); assert.equal(bootstrap.historicalPr207PublicationCheckpoint?.pullRequest,207); assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.pullRequest,205); assert.equal(bootstrap.historicalPr203PublicationCheckpoint?.pullRequest,203); assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100); assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0); assert.equal(bootstrap.milestoneDeliveryProgress?.score,39);
for(const [name,text] of docs){
 assert.match(text,/RJR-1|RJR100/i,`${name} must expose RJR100 authority`); assert.match(text,/100\/100/); assert.match(text,/PR #215/i); assert.match(text,/PR #203/i); assert.match(text,/v1\.9\.1/i); assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i); assert.match(text,/Spark/i); assert.match(text,/production.two.account|two legitimate private manager|SSJR-1/i);
}
assert.equal(bootstrap.closingWec?.environmentId,"we-2026-09-07-pr214-mdp1-a58","V1.4.56 bootstrap closing a58 remains immutable historical provenance");
const currentOverride=bootstrap.currentSuccessorOverride;
assert.ok(currentOverride?.capsule,"Current successor override must route through a versioned capsule.");
const currentCapsule=json(currentOverride.capsule);
assert.equal(currentOverride.starter,currentCapsule.starter?.canonical);
assert.equal(currentOverride.deepHandoff,currentCapsule.currentHandoff?.canonical);
const currentStarter=currentCapsule.starter.canonical;
assert.ok(fs.existsSync(path.join(process.cwd(),currentStarter)),"Current versioned successor starter must remain durable.");
const currentStarterText=read(currentStarter);
assert.match(currentStarterText,/anti-spiral|circuit breaker/i);
assert.match(currentStarterText,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
const closingId=currentCapsule.closingEnvironmentId;
const closingArchive=currentCapsule.closingArchive;
assert.ok(closingId&&closingArchive,"Current capsule must name its closing environment and archive.");
assert.ok(fs.existsSync(path.join(process.cwd(),closingArchive)),"Current closing archive must remain durable.");
const sealed=json(closingArchive);
assert.equal(sealed.environmentId,closingId);
assert.equal(sealed.lifecycle,"transition-prepared");
assert.equal(sealed.signals?.handoffCompleteness,100);
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
if(wec.lifecycle==="active"){
 assert.notEqual(wec.environmentId,closingId,"A fresh active successor must not reuse the sealed closing environment ID.");
 assert.equal(wec.repository?.predecessorEnvironmentId,closingId,"Fresh successor must descend from the current capsule closing environment.");
 assert.equal(wec.repository?.predecessorArchive,closingArchive,"Fresh successor must point to the current capsule closing archive.");
 assert.ok(["CONTINUE","PREPARE_HANDOFF"].includes(wec.assessment?.decision));
 assert.match(wec.continuity?.currentTask||"",/release-candidate|publish|converge/i);
 assert.equal(wec.sessionHandoffProximity?.environmentId,wec.environmentId);
 assert.equal(wec.sessionHandoffProximity?.checkpoints?.[0]?.note,"New session: reset to 0%.");
}else{
 assert.equal(wec.environmentId,closingId,"A sealed current WEC must be the closing environment routed by the current capsule.");
 assert.equal(wec.lifecycle,"transition-prepared"); assert.equal(wec.signals?.handoffCompleteness,100);
 assert.ok(["HANDOFF_AT_CHECKPOINT","HANDOFF_NOW"].includes(wec.assessment?.decision),"A sealed WEC must record its independently derived handoff decision.");
}
const next=read("NEXT_TASK.md"); assert.match(next,/Connected Rivalry[\s\S]+ACTIVE[\s\S]+league/i); assert.match(next,/two legitimate private manager|production-two-account|production two-account/i); assert.match(next,/record:ssjr-production-shared-setup/i); assert.match(next,/validate:ssjr-production-shared-setup/i); assert.match(next,/Do not begin transfer\/results\/scoring|Do not start transfer\/results\/scoring/i); assert.match(next,/release-candidate|publish|converge/i);
process.stdout.write("PASS current authority: immutable V1.4.56/a58 and PR210/209/207/205/203 history stay fixed while current successor routing follows the versioned override capsule, its sealed closing WEC, fresh zero-reset ancestry and independently derived lifecycle decision.\n");
