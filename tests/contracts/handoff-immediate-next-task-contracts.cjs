const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const readiness=json("REMOTE_JOINING_READINESS.json");
const ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const docs=[["00_CURRENT_HANDOFF",read("00_CURRENT_HANDOFF.md")],["NEXT_TASK",read("NEXT_TASK.md")],["PROJECT_STATE",read("PROJECT_STATE.md")],["00_DEVELOPER_START_HERE",read("00_DEVELOPER_START_HERE.md")]];
assert.equal(readiness.modelVersion,"RJR-1"); assert.equal(readiness.currentScore,100); assert.equal(readiness.denominator,100);
assert.equal(ssjr.currentScore,0); assert.equal(ssjr.denominator,100);
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1"); assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r3");
assert.equal(bootstrap.starter?.version,"1.4.55");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,210);
assert.match(bootstrap.currentPublicationCheckpoint?.state,/postmerge-green.*observer.*proven/i);
assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHead,"c863e1c2506bf34ff9521ed22bd989c221b437a6");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactTree,"85b9350bd7ac6f708b5bc7d303ad23d354fa1ac0");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"a1b4a34f8a2abcc4e361c4239da684ace9a4a40a");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeStabilityRunId,34060301345);
assert.equal(bootstrap.currentPublicationCheckpoint?.pagesRunId,34060301380);
assert.equal(bootstrap.currentPublicationCheckpoint?.reviewThreadsResolved,1);
assert.equal(bootstrap.currentPublicationCheckpoint?.runtimeChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.rulesChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.productionTwoAccountEvidence,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkSsjrCredit,0);
assert.equal(bootstrap.currentPublicationCheckpoint?.observerDeployed,true);
assert.equal(bootstrap.historicalPr209PublicationCheckpoint?.pullRequest,209);
assert.equal(bootstrap.historicalPr207PublicationCheckpoint?.pullRequest,207);
assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.pullRequest,205);
assert.equal(bootstrap.historicalPr203PublicationCheckpoint?.pullRequest,203);
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100);
assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0);
assert.equal(bootstrap.sharedShowdownJourneyReadiness?.estimatedFocusedSessionsToGenuine100,"5-10");
for(const [name,text] of docs){
 assert.match(text,/RJR-1|RJR100/i,`${name} must expose RJR100 authority`);
 assert.match(text,/100\/100/); assert.match(text,/PR #210/i); assert.match(text,/PR #209/i); assert.match(text,/PR #207/i); assert.match(text,/PR #205/i); assert.match(text,/PR #203/i);
 assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r3/i);
 assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i); assert.match(text,/Spark/i);
 assert.match(text,/production.two.account|two legitimate private manager/i);
}
const closingId=bootstrap.currentWec?.environmentId;
const closingArchive=bootstrap.currentWec?.archive||bootstrap.currentWec?.plannedArchive;
assert.equal(closingId,"we-2026-09-06-pr211-recovery-private-setup-a54");
assert.equal(wec.signals?.unresolvedFailures,0);
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
function assertDescendsFromSealedClosingEnvironment(current){
 const seen=new Set([current.environmentId]);
 let node=current;
 let reached=false;
 for(let hops=0;hops<12;hops+=1){
  if(node.environmentId===closingId){reached=true;break;}
  const predecessorId=node.repository?.predecessorEnvironmentId;
  const archive=node.repository?.predecessorArchive;
  assert.ok(predecessorId&&archive,"Fresh successor continuity must name its direct predecessor environment and archive.");
  assert.match(archive,/^WORK_ENVIRONMENT_ARCHIVE\/[A-Za-z0-9._-]+\.json$/,"Successor predecessor archive must remain repository-owned.");
  assert.ok(!seen.has(predecessorId),"Successor lineage must not contain cycles.");
  const archivePath=path.join(process.cwd(),archive);
  assert.ok(fs.existsSync(archivePath),"Successor predecessor archive must exist.");
  const predecessor=json(archivePath);
  assert.equal(predecessor.environmentId,predecessorId,"Archived predecessor environment must match predecessorEnvironmentId.");
  seen.add(predecessorId);
  node=predecessor;
 }
 assert.equal(reached,true,"Fresh successor continuity must descend through the archived chain from the sealed predecessor environment.");
 const sealed=json(closingArchive);
 assert.equal(sealed.environmentId,closingId,"Bootstrap closing archive must preserve the sealed a54 environment.");
 assert.equal(sealed.lifecycle,"transition-prepared","Bootstrap closing archive must preserve transition-prepared a54 truth.");
 assert.equal(sealed.signals?.handoffCompleteness,100,"Bootstrap closing archive must preserve a54 HTR100.");
 assert.equal(sealed.assessment?.decision,"HANDOFF_AT_CHECKPOINT","Bootstrap closing archive must preserve the sealed a54 decision.");
}
if(wec.lifecycle==="active" && wec.environmentId!==closingId){
 assertDescendsFromSealedClosingEnvironment(wec);
 assert.equal(wec.assessment?.decision,"CONTINUE");
}else if(wec.lifecycle==="active"){
 assert.equal(wec.environmentId,closingId);
 assert.equal(wec.assessment?.decision,"CONTINUE");
 assert.match(wec.continuity?.nextSafeAction||"",/PR209|PR210|two-account|two account|evidence/i);
}else{
 assert.equal(wec.environmentId,closingId);
 assert.equal(wec.lifecycle,"transition-prepared");
 assert.equal(wec.signals?.handoffCompleteness,100);
 assert.equal(wec.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
 const archived=json(closingArchive);
 assert.equal(archived.environmentId,wec.environmentId);
 assert.equal(archived.lifecycle,"transition-prepared");
 assert.equal(archived.signals?.handoffCompleteness,100);
 assert.equal(archived.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
}
const next=read("NEXT_TASK.md");
assert.match(next,/Connected Rivalry[\s\S]+ACTIVE[\s\S]+league/i);
assert.match(next,/two legitimate private manager|production-two-account|production two-account/i);
assert.match(next,/record:ssjr-production-shared-setup/i);
assert.match(next,/validate:ssjr-production-shared-setup/i);
assert.match(next,/Do not begin transfer\/results\/scoring|Do not start transfer\/results\/scoring/i);
process.stdout.write("PASS current authority: PR210/PR209 observer deployment is post-merge green, PR207 recorder and PR205 validator remain strict authorities, PR203 remains r3 runtime authority, RJR100 is frozen, SSJR-1.1 remains 0/100, sealed a54 remains bootstrap root authority, and fresh active successor WECs may descend through the repository-owned archived chain.\n");