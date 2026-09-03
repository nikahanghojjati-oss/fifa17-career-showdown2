const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const golden=read("00_HANDOFF_GOLDEN_RULE.md");
const start=read("00_DEVELOPER_START_HERE.md");
const current=read("00_CURRENT_HANDOFF.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const pkg=json("package.json");
const acceptance=read("PRODUCTION_R5_ONE_PASTE_AUTOMATIC_CONVERGENCE_ACCEPTANCE_2026-09-03.md");
const zeroBilling=read("00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md");
const standing=read("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const starter=read("START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const sle=read("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");

assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(golden,/bootstrap\/study[\s\S]+execution/i);
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i);
assert.match(golden,/Do not substitute vague instructions/i);
assert.match(golden,/recursive and permanent/i);

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["00_CURRENT_HANDOFF.md",current],["NEXT_TASK.md",next],["START_NEXT_SESSION",starter],["SLE",sle]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary.`);
  assert.match(text,/fresh unique WEC|fresh WEC/i,`${name} must require fresh successor WEC ownership.`);
}

assert.equal(pkg.version,"1.9.0");
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.0");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5");
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,187);
assert.equal(bootstrap.lastProductionProvenRuntime?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,187);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeRunsSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.pagesRunId,33738921948);
assert.equal(bootstrap.currentPublicationCheckpoint?.stabilityRunId,33738921850);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedRuntimeFilesVerified,97);
assert.equal(bootstrap.currentPublicationCheckpoint?.ownerProductionAcceptanceProven,true);
assert.equal(bootstrap.currentPublicationCheckpoint?.zeroManualVerifyReattachProven,true);

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,89);
assert.equal(readiness.denominator,100);
assert.equal(bootstrap.remoteJoiningReadiness?.score,89);
const r3=readiness.evidenceHistory?.find(e=>e.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(r3?.score,88); assert.equal(r3?.delta,1);
const r5=readiness.evidenceHistory?.find(e=>e.eventId==="production-r5-one-paste-zero-manual-reattach-convergence");
assert.equal(r5?.score,89); assert.equal(r5?.delta,1); assert.equal(r5?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.match(r5?.reason||"",/ONE PASTE CONFIRMED[\s\S]+zero manual[\s\S]+Exactly \+1/i);

assert.match(acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);
assert.match(acceptance,/one paste/i);
assert.match(acceptance,/zero manual Verify\/Reattach/i);
assert.match(acceptance,/89\/100/i);
assert.match(acceptance,/97 runtime files/i);
assert.doesNotMatch(acceptance,/pair_[0-9a-f]{32,}/i,"Durable acceptance evidence must not retain a full private capability.");

for(const text of [next,project,current,starter,sle]){
  assert.match(text,/89\/100|RJR89/i);
  assert.match(text,/Billing must never be activated|billing[\s\S]+permanently forbidden/i);
  assert.match(text,/Firebase[\s\S]+Spark/i);
  assert.match(text,/App Check enforcement remains OFF/i);
  assert.match(text,/memory-only/i);
  assert.match(text,/browserSessionPersistence/i);
  assert.match(text,/Candidate C[\s\S]+sole destructive/i);
  assert.match(text,/Exactly two private managers|exactly two private managers/i);
  assert.match(text,/public discovery|No public discovery/i);
}
assert.match(next,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i);
assert.match(project,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i);
assert.match(next,/three canonical localStorage keys/i);
assert.match(next,/Candidate A remains non-mutating[\s\S]+Candidate B remains read-only[\s\S]+Candidate C remains the sole destructive remote-to-local Apply authority[\s\S]+transaction-owned rollback[\s\S]+strict exact raw snapshot/i);
assert.match(next,/No public discovery\/community\/matchmaking\/global rankings/i);
assert.match(next,/Standing owner merge\/deploy authorization remains active after all mandatory tests[\s\S]+gates pass/i);
assert.match(standing,/merge[\s\S]+deploy/i);
assert.match(zeroBilling,/billing must never be activated/i);

assert.match(next,/authenticated third-account \/ revoked-device production negatives/i);
assert.match(next,/two-device\/two-network reconnect\/adverse-network hardening/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/Do not repeat consumed r5 one-paste convergence[\s\S]+r3 provider-live Host\/Join lifecycle/i);
assert.equal(bootstrap.immediateNextTask?.name,"select-smallest-uncredited-rjr89-gap-after-fresh-wec");
assert.equal(bootstrap.immediateNextTask?.mustStartAsRealProductWork,true);
assert.match(bootstrap.immediateNextTask?.summary||"",/PR #187[\s\S]+RJR89[\s\S]+fresh unique WEC[\s\S]+third-account\/revoked-device/i);

assert.match(starter,/Required owner-facing RJR progress status block/i,"SNS must make the owner-facing reporting contract explicitly RJR-specific.");
for(const field of ["Handoff proximity:","Remote Joining readiness:","Estimated focused sessions to genuine RJR100:","Current lane:","Concrete dependency completed:","Next unlock:","Blocker:","Sidequest check:"]){
  assert.ok(starter.includes(field),`SNS must preserve reporting field ${field}`);
}
assert.match(starter,/Handoff proximity[\s\S]+WEC\/session transition readiness only[\s\S]+not RJR/i,"SNS must separate handoff proximity from readiness.");
assert.match(starter,/Remote Joining readiness[\s\S]+RJR delta from newly proven capability evidence[\s\S]+RJR impact: \+0/i,"SNS must require an explicit capability-only RJR delta or +0.");
assert.match(starter,/Current lane[\s\S]+exact uncredited fixed RJR domain\/capability/i,"SNS must require the active lane to map to a fixed RJR gap.");
assert.match(starter,/Concrete dependency completed[\s\S]+fixed domain earned-before[^\n]+earned-after[\s\S]+total RJR before[^\n]+after/i,"SNS must require before-to-after domain and total RJR accounting.");
assert.match(starter,/Next unlock[\s\S]+next uncredited capability[\s\S]+concrete proof\/evidence required/i,"SNS must require the next unlock to name qualifying evidence.");
assert.match(starter,/Generic phrases[\s\S]+continue toward RJR100[\s\S]+not sufficient/i,"SNS must reject vague RJR progress reporting.");
assert.match(starter,/source completion, CI volume, deployment mechanics, or documentation volume[\s\S]+Remote Joining readiness/i,"SNS must forbid process-volume readiness inflation.");

assert.equal(wec.environmentId,"we-2026-09-03-stage5e-r4-production-convergence-acceptance");
assert.equal(wec.lifecycle,"closed");
assert.equal(wec.assessment?.decision,"HANDOFF_AT_CHECKPOINT");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.handoffCompleteness,100);
assert.match(next,/never inherit predecessor `HANDOFF_AT_CHECKPOINT`/i);

process.stdout.write("PASS current immediate-next-task authority: PR187 r5 owner accepted, fixed RJR89, fresh successor WEC, smallest uncredited gap next, and explicit capability-only RJR reporting.\n");
