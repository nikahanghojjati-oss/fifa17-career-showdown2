const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const bootstrap=json("SESSION_BOOTSTRAP.json"),readiness=json("REMOTE_JOINING_READINESS.json"),ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json"),wec=json("WORK_ENVIRONMENT_STATUS.json");
assert.match(read("00_SLE_HANDOFF_PROTOCOL.md"),/Smart Lean Efficient/i);
assert.equal(bootstrap.starter?.version,"1.4.53");
assert.equal(bootstrap.starter?.checkpoint,"PR208-VERIFIED-USAGE-GUARD-PRIVATE-BROWSER-NEXT");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.53_PR208_VERIFIED_USAGE_GUARD_PRIVATE_BROWSER_NEXT.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR208_VERIFIED_USAGE_GUARD_PRIVATE_BROWSER_NEXT_SLE_2026-09-06.md");
for(const [canonical,mirror] of [[bootstrap.starter.canonical,bootstrap.starter.projectMirror],[bootstrap.currentHandoff.canonical,bootstrap.currentHandoff.projectMirror]]){const text=read(canonical);assert.equal(text,read(mirror));assert.match(text,/PR #207/i);assert.match(text,/PR #205/i);assert.match(text,/PR #203/i);assert.match(text,/SSJR-1\.1/i);assert.match(text,/0\/100/);assert.match(text,/100\/100/);assert.match(text,/Smart Lean Efficient/);assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/);assert.match(text,/production-two-account|production two-account/i);assert.match(text,/pairing[\s\S]+ACTIVE/i);assert.match(text,/record:ssjr-production-shared-setup/i);assert.match(text,/validate:ssjr-production-shared-setup/i);assert.match(text,/Estimated focused sessions to genuine SSJR100/);assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i);assert.match(text,/Spark/i);}
assert.equal(readiness.currentScore,100);assert.equal(ssjr.currentScore,0);assert.equal(bootstrap.remoteJoiningReadiness?.score,100);assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0);assert.equal(bootstrap.sharedShowdownJourneyReadiness?.estimatedFocusedSessionsToGenuine100,"5-10");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,207);assert.match(bootstrap.currentPublicationCheckpoint?.state,/postmerge-green.*evidence-recorder-proven/i);assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHead,"c6bf6b2cb0d492f2da727b8591e8fb7f118e3db6");assert.equal(bootstrap.currentPublicationCheckpoint?.exactTree,"eed8b9c21bcb814a36d96ff43af93bf129a3766c");assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"791b5f9ad48e8d6d5623fd7271300f7266cfae1e");assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeStabilityRunId,34041920689);assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeStabilityRunAttempt,2);assert.equal(bootstrap.currentPublicationCheckpoint?.reviewThreadsResolved,0);assert.equal(bootstrap.currentPublicationCheckpoint?.runtimeChanged,false);assert.equal(bootstrap.currentPublicationCheckpoint?.rulesChanged,false);assert.equal(bootstrap.currentPublicationCheckpoint?.productionTwoAccountEvidence,false);assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkSsjrCredit,0);assert.equal(bootstrap.currentPublicationCheckpoint?.evidenceRecorderPublished,true);
assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.pullRequest,205);assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.evidenceValidatorPublished,true);assert.equal(bootstrap.historicalPr205PublicationCheckpoint?.finalSealedHead,"55d1bcb5f88bb8dcd598090acbcee59887932a97");
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203);assert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,"1.9.1-r3");assert.equal(bootstrap.historicalPr203PublicationCheckpoint?.rulesProductionEnabled,true);assert.equal(bootstrap.historicalPr203PublicationCheckpoint?.productionRuleset,"73b4435e-85a8-49f9-92ef-8ffe3ce0f91c");
for(const p of ["00_CURRENT_HANDOFF.md","NEXT_TASK.md","PROJECT_STATE.md","00_DEVELOPER_START_HERE.md"]){const text=read(p);assert.match(text,/100\/100/i);assert.match(text,/PR #207/i);assert.match(text,/PR #205/i);assert.match(text,/PR #203/i);assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r3/i);assert.match(text,/Billing must never be activated|Billing must remain permanently OFF/i);assert.match(text,/Spark/i);}
const archived=json(bootstrap.currentWec.archive);assert.equal(archived.lifecycle,"transition-prepared");assert.equal(archived.signals.handoffCompleteness,100);assert.equal(archived.environmentId,"we-2026-09-06-ssjr-production-browser-usage-guard-a52");assert.equal(archived.assessment.decision,"HANDOFF_NOW");assert.equal(archived.assessment.decisionInheritedFromPredecessor,false);assert.match(archived.assessment.reason,/PR207/i);
if(wec.lifecycle==="active"){
  assert.notEqual(wec.environmentId,archived.environmentId,"active successor must have a unique environment id");
  assert.equal(wec.repository?.predecessorEnvironmentId,archived.environmentId,"active successor must descend from the sealed SLE bootstrap WEC");
  assert.equal(wec.repository?.predecessorArchive,bootstrap.currentWec.archive,"active successor must point to the exact sealed SLE bootstrap archive");
  assert.equal(wec.assessment?.decision,"CONTINUE");
  assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
  assert.equal(wec.signals?.unresolvedFailures,0);
  assert.match(wec.continuity?.currentTask||"",/production-two-account|production two-account|PR207|PR205/i);
  assert.match(wec.continuity?.nextSafeAction||"",/production-two-account|production two-account|PR207|PR205|evidence/i);
}else{
  assert.equal(wec.environmentId,archived.environmentId);
  assert.equal(wec.lifecycle,"transition-prepared");
  assert.equal(wec.signals?.handoffCompleteness,100);
  assert.equal(wec.assessment?.decision,"HANDOFF_NOW");
  assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
  assert.equal(wec.signals?.unresolvedFailures,0);
}
const prod=(ssjr.candidateEvidence||[]).find(x=>x.id==="ssjr1-spark-provider-enforcement-pr203-production");assert.ok(prod);assert.equal(prod.credit,0);assert.ok(prod.missingLayers.includes("production-two-account"));assert.equal(ssjr.planningEstimate?.focusedSessionsToSSJR100?.minimum,5);assert.equal(ssjr.planningEstimate?.focusedSessionsToSSJR100?.maximum,10);
process.stdout.write("PASS SLE packaging: mirrored v1.4.52 PR207 recorder package, sealed a52 WEC or strict active successor, PR205 validator, PR203 r3 production authority, frozen RJR100/SSJR0 and genuine production-two-account successor task are protected.\n");
