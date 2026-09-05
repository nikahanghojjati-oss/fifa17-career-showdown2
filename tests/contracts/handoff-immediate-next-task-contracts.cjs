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
const predecessorWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-03-stage5f-authenticated-negatives.json");
const closingWec=json("WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-pr191-publication-stage5g.json");
const pkg=json("package.json");
const r5Acceptance=read("PRODUCTION_R5_ONE_PASTE_AUTOMATIC_CONVERGENCE_ACCEPTANCE_2026-09-03.md");
const stage5fAcceptance=read("PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md");
const zeroBilling=read("00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md");
const standing=read("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const historicalStarter=read("START_NEXT_SESSION_V1.4.37_PR187_R5_OWNER_ACCEPTED_RJR89.md");
const historicalSle=read("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md");
const currentStarter=read("START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md");
const currentSle=read("SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md");

assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(golden,/bootstrap\/study[\s\S]+execution/i);
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i);
assert.match(golden,/Do not substitute vague instructions/i);
assert.match(golden,/recursive and permanent/i);

assert.match(eagle,/Owner's Eagle Eye/i);
assert.match(eagle,/highest operating principles|golden rule/i);
for(const phrase of ["RJR points remaining","concrete tasks remaining","major stages remaining","genuinely new evidence bundles remaining","owner action is required now","Handoff proximity: X%"]){assert.ok(eagle.includes(phrase),`Owner's Eagle Eye must preserve ${phrase}.`);}
assert.match(eagle,/Automate every evidence step/i);
assert.match(eagle,/Ask the owner[\s\S]+only when/i);

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["NEXT_TASK.md",next]]){assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary.`);}
assert.match(start,/live `main`[\s\S]+current WEC/i);
assert.match(start,/Stage 5I[\s\S]+physical|physical[\s\S]+Remote Joining acceptance/i);
assert.match(next,/predecessor Work Environment Continuity record[\s\S]+already closed and archived[\s\S]+Current active environment:[\s\S]+we-2026-09-04-stage5g-reconnect-recovery/i,"NEXT_TASK must distinguish immutable PR191 closure from the same active WEC now executing Stage 5I.");
assert.match(next,/Do not initialize another successor WEC while this environment remains active and coherent/i);

assert.equal(pkg.version,"1.9.1","Current source package must remain application v1.9.1 while Stage 5I advances only the runtime revision.");
assert.match(project,/v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+NOT PRODUCTION-PROVEN/i,"PROJECT_STATE must identify r2 as the current candidate.");
assert.match(project,/Production remains independently verified[\s\S]+v1\.9\.1[\s\S]+1\.9\.1-r1/i,"PROJECT_STATE must retain r1 as current production truth until r2 is proven live.");
assert.match(next,/Authorized release candidate:[\s\S]+v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+Production remains independently proven[\s\S]+1\.9\.1-r1/i,"NEXT_TASK must expose the r2 candidate and unchanged r1 production identity together.");
assert.match(start,/CURRENT PRODUCTION[\s\S]+v1\.9\.1-r1/i);

// Sealed PR191 bootstrap and handoff packages remain immutable historical provenance.
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.0");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5");
assert.equal(bootstrap.starter?.canonical,"START_NEXT_SESSION_V1.4.40_PR191_MERGED_RJR91_STAGE5G_AUTOMATION.md");
assert.equal(bootstrap.currentHandoff?.canonical,"SUCCESSOR_HANDOFF_PR191_MERGED_RJR91_STAGE5G_AUTOMATION_SLE_2026-09-04.md");
assert.equal(bootstrap.currentPublicationCheckpoint?.state,"merged");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactFinalHead,"72f7031797592a3866f7c62da07fa42959cb30fb");
assert.equal(bootstrap.currentPublicationCheckpoint?.mergeSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(bootstrap.currentPublicationCheckpoint?.exactHeadWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.postMergeWorkflowFamiliesSuccessful,15);
assert.equal(bootstrap.currentPublicationCheckpoint?.deployedRuntimeFilesVerified,99);
assert.match(current,/PR #191[\s\S]+RJR91/i);
assert.match(currentStarter,/PR #191[\s\S]+91\/100|RJR91/i);
assert.match(currentSle,/PR #191[\s\S]+91\/100|RJR91/i);
assert.match(historicalStarter,/PR #187/i);assert.match(historicalStarter,/89\/100|RJR89/i);
assert.match(historicalSle,/PR #187/i);assert.match(historicalSle,/89\/100|RJR89/i);

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
assert.equal(stage5fEvents.length,2,"RJR 89 -> 91 must be represented by exactly two append-only evidence events.");
assert.deepEqual(stage5fEvents.map(e=>e.delta),[1,1]);
assert.ok(stage5fEvents.every(e=>e.domainId==="identity-auth-trust"));
assert.match(stage5fEvents.map(e=>e.reason||"").join("\n"),/revoked-device/i);
assert.match(stage5fEvents.map(e=>e.reason||"").join("\n"),/third account|third-account|non-participant|unrelated/i);

assert.match(r5Acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);
assert.match(r5Acceptance,/one paste/i);
assert.doesNotMatch(r5Acceptance,/pair_[0-9a-f]{32,}/i);
assert.match(stage5fAcceptance,/PASS/i);assert.match(stage5fAcceptance,/revoked-device/i);assert.match(stage5fAcceptance,/third-account|third account/i);assert.match(stage5fAcceptance,/permission-denied/i);assert.match(stage5fAcceptance,/91\/100/i);
assert.doesNotMatch(stage5fAcceptance,/pair_[0-9a-f]{32,}/i);

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
assert.match(standing,/merge[\s\S]+deploy/i);
assert.match(zeroBilling,/billing must never be activated/i);

assert.match(next,/Remote Joining-specific two-device\/two-network reconnect\/adverse-network hardening/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/do not repeat generic Connected Rivalry adverse-network proof/i);
assert.match(next,/genuine two-physical-device\/two-network production acceptance/i);
assert.match(next,/Do not award RJR for source, CI, PR, merge, deployment, documentation, WEC/i);

assert.equal(predecessorWec.environmentId,"we-2026-09-03-stage5f-authenticated-negatives");
assert.equal(predecessorWec.lifecycle,"closed");
assert.equal(predecessorWec.assessment?.decision,"HANDOFF_NOW");
assert.equal(predecessorWec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(closingWec.environmentId,"we-2026-09-04-pr191-publication-stage5g");
assert.equal(closingWec.lifecycle,"closed");
assert.equal(closingWec.repository?.predecessorEnvironmentId,predecessorWec.environmentId);
assert.equal(closingWec.assessment?.decision,"HANDOFF_NOW");
assert.equal(closingWec.assessment?.decisionInheritedFromPredecessor,false);
assert.match(closingWec.continuity?.currentTask||"",/PR #191[\s\S]+complete[\s\S]+Stage 5G/i);
assert.match((closingWec.continuity?.evidenceNotes||[]).join("\n"),/Fixed RJR-1 is 91\/100/i);

assert.equal(wec.environmentId,"we-2026-09-04-stage5g-reconnect-recovery");
assert.equal(wec.lifecycle,"active");
assert.equal(wec.repository?.startingMainSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(wec.repository?.predecessorEnvironmentId,closingWec.environmentId);
assert.equal(wec.repository?.predecessorArchive,"WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-pr191-publication-stage5g.json");
assert.equal(wec.assessment?.decision,"CONTINUE");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.compactionCount,1);
assert.equal(wec.signals?.majorPhasesCompleted,3);
assert.match(wec.repository?.workingBranch||"",/stage5i\/physical-acceptance-recorder/);
assert.match(wec.continuity?.currentTask||"",/Stage 5I[\s\S]+1\.9\.1-r2[\s\S]+physical Remote Joining acceptance recorder/i);
assert.match((wec.continuity?.knownHazards||[]).join("\n"),/Billing is permanently forbidden/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/PR193 Stage 5H[\s\S]+offline\/online/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/two browser contexts are not two physical devices/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/163072 raw \/ 37499 compressed/i);

process.stdout.write("PASS current immediate-next-task authority: immutable PR187/PR191 provenance remains sealed, production is v1.9.1-r1 at fixed RJR91, and active PR194/Stage5I carries the privacy-safe v1.9.1-r2 physical-acceptance recorder candidate under zero-billing locks.\n");
