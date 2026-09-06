const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const readiness=json("REMOTE_JOINING_READINESS.json");
const ssjr=json("SHARED_SHOWDOWN_JOURNEY_READINESS.json");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const finalAcceptance=read("FINAL_RJR100_REMOTE_JOINING_ACCEPTANCE_2026-09-05.md");
const docs=[["00_CURRENT_HANDOFF",read("00_CURRENT_HANDOFF.md")],["NEXT_TASK",read("NEXT_TASK.md")],["PROJECT_STATE",read("PROJECT_STATE.md")],["00_DEVELOPER_START_HERE",read("00_DEVELOPER_START_HERE.md")]];
assert.match(read("00_HANDOFF_GOLDEN_RULE.md"),/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.equal(readiness.modelVersion,"RJR-1"); assert.equal(readiness.currentScore,100); assert.equal(readiness.denominator,100);
assert.equal(ssjr.currentScore,0); assert.equal(ssjr.denominator,100);
assert.match(finalAcceptance,/Chromebook[\s\S]+Home WiFi[\s\S]+iPhone[\s\S]+cellular/i);
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r2");
assert.equal(bootstrap.starter?.version,"1.4.47");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,199);
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"merged-postmerge-green");
assert.equal(bootstrap.currentPublicationCheckpoint?.finalSealedHead,"378931e7bec2a4e95fb31912d4879e294b63d79f");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"780abd7b779cda5acd722b75fd59ef1e82c71f97");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkSsjrCredit,0);
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.pullRequest,198);
assert.equal(bootstrap.historicalPr198PublicationCheckpoint?.mergeSha,"39ffe88d61dcda973df03a18e0266fcfe4cf5638");
assert.equal(bootstrap.remoteJoiningReadiness?.score,100);
assert.equal(bootstrap.sharedShowdownJourneyReadiness?.score,0);
for(const [name,text] of docs){
 assert.match(text,/RJR-1|RJR100/i,`${name} must expose RJR100 authority`); assert.match(text,/100\/100/); assert.match(text,/PR #199/i); assert.match(text,/PR #198/i);
 assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i); assert.match(text,/Billing must never be activated/i); assert.match(text,/Firebase remains Spark/i); assert.match(text,/App Check enforcement remains OFF/i); assert.match(text,/memory-only/i); assert.match(text,/browserSessionPersistence/i); assert.match(text,/Candidate C[\s\S]+sole destructive/i); assert.match(text,/Exactly two private managers|exactly two private managers/i); assert.match(text,/public discovery|No public discovery/i);
}
assert.match(read("NEXT_TASK.md"),/Connected Rivalry[\s\S]+ACTIVE[\s\S]+League Wheel/i);
assert.match(read("NEXT_TASK.md"),/does not stream|does not network/i);

// The handoff bootstrap describes the predecessor that a new environment must
// validate and consume. Once the successor owns WORK_ENVIRONMENT_STATUS.json,
// its fresh WEC must not inherit that predecessor's transition decision.
assert.equal(bootstrap.currentWec?.environmentId,"we-2026-09-05-pr199-postmerge-recovery-a47");
assert.equal(bootstrap.currentWec?.lifecycle,"transition-prepared");
assert.equal(bootstrap.currentWec?.finalDecision,"HANDOFF_NOW");
assert.equal(bootstrap.currentWec?.decisionInheritedFromPredecessor,false);
assert.notEqual(wec.environmentId,bootstrap.currentWec.environmentId,"A successor must own a fresh WEC ID after consuming the handoff.");
assert.equal(wec.repository?.predecessorEnvironmentId,bootstrap.currentWec.environmentId,"The fresh WEC must point to the exact inherited predecessor.");
assert.equal(wec.repository?.predecessorArchive,bootstrap.currentWec.archive,"The fresh WEC must point to the predecessor archive declared by the bootstrap.");
assert.equal(json(wec.repository.predecessorArchive).environmentId,wec.repository.predecessorEnvironmentId);
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false,"The successor must make its own WEC decision.");
assert.ok(["active","transition-prepared"].includes(wec.lifecycle),"Current successor WEC lifecycle must be valid for active work or a prepared transition.");
if(wec.lifecycle==="active"){
 assert.equal(wec.assessment?.decision,"CONTINUE","An active successor record checked into a working PR must own an explicit CONTINUE decision.");
 assert.ok(Number.isInteger(wec.signals?.handoffCompleteness)&&wec.signals.handoffCompleteness>=0&&wec.signals.handoffCompleteness<=100);
}else{
 assert.ok(["HANDOFF_AT_CHECKPOINT","HANDOFF_NOW"].includes(wec.assessment?.decision),"A transition-prepared successor must carry its own handoff decision.");
}
assert.equal(bootstrap.historicalPr191PublicationCheckpoint?.mergeSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(wec.signals?.unresolvedFailures,0);
assert.match(wec.continuity?.nextSafeAction||"",/provider|Rules/i);
process.stdout.write("PASS current authority: PR199 publication is complete, RJR100 remains frozen, SSJR-1.1 remains 0/100, the inherited transition is archived, and the fresh successor independently owns the Spark provider enforcement lane.\n");
