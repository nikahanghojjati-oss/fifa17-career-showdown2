const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));

const golden=read("00_HANDOFF_GOLDEN_RULE.md");
const eagle=read("00_OWNER_EAGLE_EYE_GOLDEN_RULE.md");
const start=read("00_DEVELOPER_START_HERE.md");
const current=read("00_CURRENT_HANDOFF.md");
const next=read("NEXT_TASK.md");
const project=read("PROJECT_STATE.md");
const bootstrap=json("SESSION_BOOTSTRAP.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const wec=json("WORK_ENVIRONMENT_STATUS.json");
const priorClosingWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-pr191-publication-stage5g.json");
const closingWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-stage5g-reconnect-recovery.json");
const pkg=json("package.json");
const r5Acceptance=read("PRODUCTION_R5_ONE_PASTE_AUTOMATIC_CONVERGENCE_ACCEPTANCE_2026-09-03.md");
const stage5fAcceptance=read("PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md");
const zeroBilling=read("00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md");
const standing=read("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const historicalStarter=read("START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const historicalSle=read("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
const historicalPr191Starter=read("START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md");
const historicalPr191Sle=read("SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md");
const currentStarter=read(bootstrap.starter.canonical);
const currentSle=read(bootstrap.currentHandoff.canonical);

assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(golden,/bootstrap\/study[\s\S]+execution/i);
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i);
assert.match(golden,/Do not substitute vague instructions/i);
assert.match(golden,/recursive and permanent/i);

assert.match(eagle,/Owner's Eagle Eye/i);
for(const phrase of ["RJR points remaining","concrete tasks remaining","major stages remaining","genuinely new evidence bundles remaining","owner action is required now","Handoff proximity: X%"]){assert.ok(eagle.includes(phrase),`Owner's Eagle Eye must preserve ${phrase}.`);}
assert.match(eagle,/Automate every evidence step/i);
assert.match(eagle,/Ask the owner[\s\S]+only when/i);

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["NEXT_TASK.md",next]]){assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary.`);}
assert.match(start,/live `main`[\s\S]+current WEC/i);
assert.match(start,/Stage 5I[\s\S]+physical|physical[\s\S]+Remote Joining acceptance/i);

assert.equal(pkg.version,"1.9.1");
assert.match(project,/v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+PRODUCTION-PROVEN/i);
assert.match(next,/Production is independently proven[\s\S]+v1\.9\.1[\s\S]+1\.9\.1-r2/i);
assert.match(next,/previous known-good whole-shell recovery target[\s\S]+1\.9\.1-r1/i);
assert.match(next,/every current permanent workflow family green on the same exact reviewed PR head/i);
assert.match(current,/PR #194[\s\S]+RJR91/i);

assert.equal(bootstrap.runtime?.applicationVersion,"1.9.1");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.1-r2");
assert.equal(bootstrap.runtime?.productionStatus,"production-proven");
assert.equal(bootstrap.runtime?.previousProductionRuntimeRevision,"1.9.1-r1");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.41_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR194_R2_PRODUCTION_RJR91_PHYSICAL_ACCEPTANCE_SLE_2026-09-05.md");
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"merged");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactFinalHead,"42f91df5ec1d5a576f0907836fa03f5994d7646b");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"11bb681527a9b78884baf0c384350c90493dc9bd");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.releaseIntegrationRunId,33947112248);
assert.equal(bootstrap.currentPublicationCheckpoint?.stabilityRunId,33947112190);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedSiteSmokeJobId,101255587827);
assert.equal(bootstrap.currentPublicationCheckpoint?.publicationWorkRjrCredit,0);
assert.equal(bootstrap.immediateNextTask?.name,"physical-two-device-two-independent-network-remote-joining-acceptance");

for(const [name,text] of [["current starter",currentStarter],["current SLE",currentSle]]){
  assert.match(text,/PR #194/i,`${name} must expose PR194.`);
  assert.match(text,/v1\.9\.1[\s\S]+1\.9\.1-r2/i);
  assert.match(text,/91\/100|RJR91/i);
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
  assert.match(text,/two physical devices|two-physical-device/i);
  assert.match(text,/independent network|two-independent-network/i);
  assert.match(text,/fresh (?:unique )?(?:successor )?WEC/i);
}

// Immutable historical packages remain intact and are not rewritten as current authority.
assert.match(historicalStarter,/PR #187/i);assert.match(historicalStarter,/89\/100|RJR89/i);
assert.match(historicalSle,/PR #187/i);assert.match(historicalSle,/89\/100|RJR89/i);
assert.match(historicalPr191Starter,/PR #191/i);assert.match(historicalPr191Starter,/91\/100|RJR91/i);
assert.match(historicalPr191Sle,/PR #191/i);assert.match(historicalPr191Sle,/91\/100|RJR91/i);
assert.equal(bootstrap.historicalPr191PublicationCheckpoint?.mergeSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,91);
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,readiness.domains.reduce((sum,domain)=>sum+domain.earned,0));
const domain=id=>readiness.domains.find(item=>item.id===id);
assert.equal(domain("deterministic-sync-recovery")?.earned,20);
assert.equal(domain("identity-auth-trust")?.earned,20);
assert.equal(domain("production-cloud-security")?.earned,20);
assert.equal(domain("devices-pairing-connected-rivalry-remote-join")?.earned,22);
assert.equal(domain("real-device-hardening-release")?.earned,9);

const history=readiness.evidenceHistory||[];
const r5=history.find(e=>e.eventId==="production-r5-one-paste-zero-manual-reattach-convergence");
assert.equal(r5?.score,89);assert.equal(r5?.delta,1);
const stage5fEvents=history.filter(e=>e.score===90||e.score===91);
assert.equal(stage5fEvents.length,2);assert.deepEqual(stage5fEvents.map(e=>e.delta),[1,1]);assert.ok(stage5fEvents.every(e=>e.domainId==="identity-auth-trust"));

assert.match(r5Acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);assert.match(r5Acceptance,/one paste/i);assert.doesNotMatch(r5Acceptance,/pair_[0-9a-f]{32,}/i);
assert.match(stage5fAcceptance,/PASS/i);assert.match(stage5fAcceptance,/revoked-device/i);assert.match(stage5fAcceptance,/third-account|third account/i);assert.match(stage5fAcceptance,/permission-denied/i);assert.match(stage5fAcceptance,/91\/100/i);assert.doesNotMatch(stage5fAcceptance,/pair_[0-9a-f]{32,}/i);

for(const [name,text] of [["NEXT_TASK",next],["PROJECT_STATE",project],["DEVELOPER_START",start]]){
  assert.match(text,/91\/100|RJR91/i,`${name} must expose current fixed RJR91.`);
  assert.match(text,/Billing must never be activated|Billing is permanently forbidden|billing[\s\S]+permanently forbidden/i);
  assert.match(text,/Firebase[\s\S]+Spark/i);
  assert.match(text,/App Check enforcement remains OFF/i);
  assert.match(text,/memory-only/i);
  assert.match(text,/browserSessionPersistence/i);
  assert.match(text,/Candidate C[\s\S]+sole destructive/i);
  assert.match(text,/Exactly two private managers|exactly two private managers/i);
  assert.match(text,/public discovery|No public discovery/i);
}
assert.match(next,/Installable Offline App[\s\S]+v1\.3\.0 Recovery & Device Resilience/i);
assert.match(next,/Candidate A remains non-mutating[\s\S]+Candidate B remains read-only[\s\S]+Candidate C remains the sole destructive remote-to-local gameplay Apply authority[\s\S]+transaction-owned strict exact raw-snapshot rollback/i);
assert.match(standing,/merge[\s\S]+deploy/i);assert.match(zeroBilling,/billing must never be activated/i);

assert.match(next,/genuine production Remote Joining acceptance[\s\S]+two physical devices[\s\S]+two independent networks/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/Do not assume RJR100|Do not assume[\s\S]+RJR100/i);
assert.match(next,/Do not award RJR|zero credit/i);

assert.equal(priorClosingWec.environmentId,"we-2026-09-04-pr191-publication-stage5g");assert.equal(priorClosingWec.lifecycle,"closed");assert.equal(priorClosingWec.assessment?.decision,"HANDOFF_NOW");
assert.equal(closingWec.environmentId,"we-2026-09-04-stage5g-reconnect-recovery");assert.equal(closingWec.lifecycle,"closed");assert.equal(closingWec.repository?.predecessorEnvironmentId,priorClosingWec.environmentId);assert.equal(closingWec.assessment?.decision,"HANDOFF_NOW");assert.equal(closingWec.assessment?.decisionInheritedFromPredecessor,false);assert.equal(closingWec.signals?.handoffCompleteness,100);assert.equal(closingWec.signals?.unrecordedDecisions,0);assert.equal(closingWec.signals?.atomicOperation,false);
if(wec.environmentId===closingWec.environmentId)assert.deepEqual(wec,closingWec,"A closing WEC status must equal its final archive.");
else{
  assert.match(wec.environmentId,/^we-\d{4}-\d{2}-\d{2}-.+/);assert.equal(wec.lifecycle,"active");assert.equal(wec.repository?.predecessorEnvironmentId,closingWec.environmentId);assert.equal(wec.repository?.predecessorArchive,"WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-stage5g-reconnect-recovery.json");assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);assert.match(wec.continuity?.currentTask||"",/physical[\s\S]+acceptance[\s\S]+evidence|acceptance[\s\S]+physical/i);
}
assert.match(closingWec.continuity?.lastSafeCheckpoint||"",/PR #194[\s\S]+1\.9\.1\/1\.9\.1-r2[\s\S]+91\/100/i);
assert.match(closingWec.continuity?.nextSafeAction||"",/fresh successor[\s\S]+two-physical-device\/two-independent-network/i);

process.stdout.write("PASS current immediate-next-task authority: immutable PR187/PR191 provenance remains sealed, production is v1.9.1-r2 at fixed RJR91, the closing WEC is HANDOFF_NOW, and the fresh successor is routed only to genuine physical Remote Joining acceptance under zero-billing locks.\n");
