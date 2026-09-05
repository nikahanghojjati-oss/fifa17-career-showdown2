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
for(const phrase of ["RJR points remaining","concrete tasks remaining","major stages remaining","genuinely new evidence bundles remaining","owner action is required now","Handoff proximity: X%"]){
  assert.ok(eagle.includes(phrase),`Owner's Eagle Eye must preserve ${phrase}.`);
}
assert.match(eagle,/Automate every evidence step/i);
assert.match(eagle,/Ask the owner[\s\S]+only when/i);

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["NEXT_TASK.md",next]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary.`);
}
assert.match(start,/live `main`[\s\S]+current WEC/i);
assert.match(start,/Stage 5G[\s\S]+reconnect\/adverse-network hardening/i);
assert.match(next,/predecessor Work Environment Continuity record[\s\S]+already closed and archived[\s\S]+Current active environment:[\s\S]+we-2026-09-04-stage5g-reconnect-recovery/i,"NEXT_TASK must distinguish immutable PR191 closure from the active Stage 5G WEC.");
assert.match(next,/Do not initialize another successor WEC while this environment remains active and coherent/i,"NEXT_TASK must not restart the WEC loop during active Stage 5G execution.");

assert.equal(pkg.version,"1.9.1","Current source package must identify the active v1.9.1 Stage 5G release candidate.");
assert.match(project,/v1\.9\.1[\s\S]+1\.9\.1-r1[\s\S]+NOT PRODUCTION-PROVEN/i,"PROJECT_STATE must distinguish the current candidate from production.");
assert.match(next,/Authorized release candidate:[\s\S]+v1\.9\.1[\s\S]+1\.9\.1-r1[\s\S]+Production remains[\s\S]+1\.9\.0-r5/i,"NEXT_TASK must expose current candidate and unchanged production identity together.");
assert.equal(bootstrap.runtime?.applicationVersion,"1.9.0","The sealed PR191 bootstrap must retain its historical application version.");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.9.0-r5","The sealed PR191 bootstrap must retain its historical production runtime.");
// SESSION_BOOTSTRAP/00_CURRENT_HANDOFF identify the merged/deployed PR191/RJR91 handoff package.
// The earlier PR187/RJR89 package and closed PR191 publication WEC remain immutable provenance.
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
assert.match(historicalStarter,/PR #187/i);
assert.match(historicalStarter,/89\/100|RJR89/i);
assert.match(historicalSle,/PR #187/i);
assert.match(historicalSle,/89\/100|RJR89/i);

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
assert.equal(r5?.score,89); assert.equal(r5?.delta,1);
const stage5fEvents=history.filter(e=>e.score===90||e.score===91);
assert.equal(stage5fEvents.length,2,"RJR 89 -> 91 must be represented by exactly two append-only evidence events.");
assert.deepEqual(stage5fEvents.map(e=>e.delta),[1,1]);
assert.ok(stage5fEvents.every(e=>e.domainId==="identity-auth-trust"));
assert.match(stage5fEvents.map(e=>e.reason||"").join("\n"),/revoked-device/i);
assert.match(stage5fEvents.map(e=>e.reason||"").join("\n"),/third account|third-account|non-participant|unrelated/i);

assert.match(r5Acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);
assert.match(r5Acceptance,/one paste/i);
assert.doesNotMatch(r5Acceptance,/pair_[0-9a-f]{32,}/i,"Durable acceptance evidence must not retain a full private capability.");
assert.match(stage5fAcceptance,/PASS/i);
assert.match(stage5fAcceptance,/revoked-device/i);
assert.match(stage5fAcceptance,/third-account|third account/i);
assert.match(stage5fAcceptance,/permission-denied/i);
assert.match(stage5fAcceptance,/91\/100/i);
assert.doesNotMatch(stage5fAcceptance,/pair_[0-9a-f]{32,}/i,"Stage 5F durable evidence must not retain a full private capability.");

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

assert.match(next,/Remote Joining-specific[\s\S]+two-device\/two-network reconnect\/adverse-network hardening/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/do not repeat generic Connected Rivalry adverse-network proof/i);
assert.match(next,/genuine two-physical-device\/two-network behavior/i);
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
assert.match(closingWec.continuity?.currentTask||"",/PR #191[\s\S]+complete[\s\S]+Stage 5G/i,"Archived publication WEC must prove PR191 publication complete and stop before Stage 5G.");
assert.match((closingWec.continuity?.evidenceNotes||[]).join("\n"),/Fixed RJR-1 is 91\/100/i,"Archived publication WEC must record the fixed RJR91 boundary.");

assert.equal(wec.environmentId,"we-2026-09-04-stage5g-reconnect-recovery");
assert.equal(wec.lifecycle,"active");
assert.equal(wec.repository?.startingMainSha,"7ca132a607cbf4fd78710b14526b4bec849ac2d2");
assert.equal(wec.repository?.predecessorEnvironmentId,closingWec.environmentId);
assert.equal(wec.repository?.predecessorArchive,"WORK_ENVIRONMENT_ARCHIVE/we-2026-09-04-pr191-publication-stage5g.json");
assert.equal(wec.assessment?.decision,"CONTINUE");
assert.equal(wec.assessment?.decisionInheritedFromPredecessor,false);
assert.equal(wec.signals?.compactionCount,0);
assert.equal(wec.signals?.majorPhasesCompleted,0);
assert.match(wec.continuity?.currentTask||"",/Stage 5G[\s\S]+same-capability[\s\S]+Host[\s\S]+Join[\s\S]+Close/i);
assert.match((wec.continuity?.knownHazards||[]).join("\n"),/Billing is permanently forbidden/i);
assert.match((wec.continuity?.evidenceNotes||[]).join("\n"),/local candidate commit 2452b03 was never published/i);

process.stdout.write("PASS current immediate-next-task authority: current v1.9.1-r1 PR192 candidate is distinct from immutable PR191/v1.9.0-r5 production provenance while the fresh reset WEC executes Stage 5G same-capability reconnect with zero-billing locks intact.\n");