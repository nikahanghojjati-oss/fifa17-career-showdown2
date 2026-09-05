const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const readiness=json("REMOTE_JOINING_READINESS.json");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const finalAcceptance=read("FINAL_RJR100_REMOTE_JOINING_ACCEPTANCE_2026-09-05.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const current=read("00_CURRENT_HANDOFF.md");
const start=read("00_DEVELOPER_START_HERE.md");

assert.match(read("00_HANDOFF_GOLDEN_RULE.md"),/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(read("00_OWNER_EAGLE_EYE_GOLDEN_RULE.md"),/Owner's Eagle Eye/i);

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,100);
assert.equal(readiness.currentScore,readiness.domains.reduce((sum,d)=>sum+d.earned,0));
assert.deepEqual(readiness.domains.map(d=>[d.id,d.earned]),[
  ["deterministic-sync-recovery",20],
  ["identity-auth-trust",20],
  ["production-cloud-security",20],
  ["devices-pairing-connected-rivalry-remote-join",30],
  ["real-device-hardening-release",10]
]);
const history=readiness.evidenceHistory||[];
assert.equal(history.at(-2)?.eventId,"production-rjr-physical-two-device-two-network-acceptance");
assert.equal(history.at(-1)?.eventId,"production-rjr-final-stable-release-acceptance");
assert.match(finalAcceptance,/Chromebook[\s\S]+Home WiFi[\s\S]+iPhone[\s\S]+cellular/i);
assert.match(finalAcceptance,/ACTIVE[^\n]+revision 1/i);
assert.match(finalAcceptance,/CLOSED[^\n]+revision 2/i);
assert.match(finalAcceptance,/no resurrection/i);

assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r2");
assert.equal(bootstrap.runtime?.productionStatus,"production-proven");
assert.equal(bootstrap.runtime?.previousProductionRuntimeRevision,"1.9.1-r1");
assert.equal(bootstrap.starter?.version,"1.4.43","The previous completed SNS remains the packaged starter until the new SNS is genuinely generated at handoff 100.");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,198);
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"open");
assert.equal(bootstrap.currentPublicationCheckpoint?.runtimeChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.rulesChanged,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.providerMutationRequired,false);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkRjrCredit,0);
assert.equal(bootstrap.remoteJoiningReadiness?.score,100);
assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);
assert.equal(bootstrap.immediateNextTask?.name,"publish-pr198-rjr100-and-generate-sns");
assert.equal(bootstrap.transition?.handoffCompleteness,99);

for(const [name,text] of [["00_CURRENT_HANDOFF",current],["NEXT_TASK",next],["PROJECT_STATE",project],["00_DEVELOPER_START_HERE",start]]){
  assert.match(text,/RJR-1|RJR100/i,`${name} must expose RJR100 authority.`);
  assert.match(text,/100\/100/i);
  assert.match(text,/PR #198/i);
  assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i);
  assert.match(text,/Billing must never be activated/i);
  assert.match(text,/Firebase remains Spark/i);
  assert.match(text,/App Check enforcement remains OFF/i);
  assert.match(text,/memory-only/i);
  assert.match(text,/browserSessionPersistence/i);
  assert.match(text,/Candidate C[\s\S]+sole destructive/i);
  assert.match(text,/Exactly two private managers|exactly two private managers/i);
  assert.match(text,/public discovery|No public discovery/i);
}
assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(start,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(next,/Shared Showdown Journey Readiness|SSJR-1/i);
assert.match(start,/Shared Showdown Journey Readiness|SSJR-1/i);
assert.match(next,/League Wheel[\s\S]+after[\s\S]+Connected Rivalry|Connected Rivalry[\s\S]+ACTIVE[\s\S]+League Wheel/i);
assert.match(next,/does not stream|does not network/i);

// Historical packages are immutable provenance, not current execution authority.
for(const [p,pr,rjr] of [
  ["START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md",187,/89\/100|RJR89/i],
  ["SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md",187,/89\/100|RJR89/i],
  ["START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md",191,/91\/100|RJR91/i],
  ["SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md",191,/91\/100|RJR91/i],
  ["START_NEXT_SESSION_V1.4.43_PR196_RJR91_PHYSICAL_ACCEPTANCE_VALIDATOR.md",196,/91\/100|RJR91/i]
]){
  const t=read(p); assert.match(t,new RegExp(`PR #${pr}`,'i')); assert.match(t,rjr);
}
assert.equal(bootstrap.historicalPr191PublicationCheckpoint?.mergeSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");

const predecessor=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-05-physical-acceptance-evidence.json");
assert.equal(predecessor.lifecycle,"closed");
assert.equal(predecessor.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
assert.equal(wec.lifecycle,"active");
assert.notEqual(wec.environmentId,predecessor.environmentId);
assert.equal(wec.environmentId,bootstrap.currentWec?.environmentId);
assert.equal(wec.repository?.predecessorEnvironmentId,predecessor.environmentId);
assert.equal(wec.signals?.handoffCompleteness,99);
assert.equal(wec.signals?.unresolvedFailures,0);
assert.match(wec.continuity?.currentTask||"",/PR #198[\s\S]+100\/100/i);
assert.match(wec.continuity?.nextSafeAction||"",/expected-head[\s\S]+SNS/i);

process.stdout.write("PASS current authority: fixed RJR-1 is accepted at 100/100, production remains v1.9.1-r2, historical RJR89/RJR91 packages remain immutable, and the active WEC owns only PR198 publication/main verification/SNS before SSJR-1 begins.\n");
