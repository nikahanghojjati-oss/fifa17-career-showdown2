const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const start = read("00_DEVELOPER_START_HERE.md");
const current = read("00_CURRENT_HANDOFF.md");
const active = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const next = read("NEXT_TASK.md");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const packageJson = JSON.parse(read("package.json"));
const reconciliationProof = read("OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md");
const historicalNext = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const standingAuth = read("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const productionRuntime = bootstrap.runtime?.productionRuntimeRevision || "";
const candidateRuntime = bootstrap.runtime?.candidateRuntimeRevision || "";
const applicationVersion = bootstrap.runtime?.applicationVersion || packageJson.version || "";

assert.match(golden,/Mandatory immediate-next-task handoff rule/i,"Golden handoff policy must permanently require an explicit immediate-next-task section.");
assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,"Golden handoff policy must name the required post-study immediate-task section.");
assert.match(golden,/bootstrap\/study[\s\S]+execution/i,"Golden handoff policy must distinguish repository study from the concrete execution task that follows it.");
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i,"Golden handoff policy must require enough specificity for a fresh developer to begin independently.");
assert.match(golden,/Do not substitute vague instructions/i,"Golden handoff policy must prohibit vague roadmap-only continuation language.");
assert.match(golden,/recursive and permanent/i,"Immediate-next-task handoff behavior must remain recursive across future developer sessions.");

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["00_CURRENT_HANDOFF.md",current],["IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md",active],["NEXT_TASK.md",next]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary after the Analytics promotion.`);
}

assert.match(active,/FIRST ENGINEERING TASK: preserve the sealed production boundary/i,"Closed Analytics handoff must advance its first engineering task from PR validation to preserving the proven production boundary.");
assert.match(active,/PR #59 is no longer an implementation task[\s\S]+production-proven/i,"Closed Analytics handoff must distinguish completed production work from future implementation authorization.");
assert.match(active,/Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i,"Closed Analytics handoff must retain the final Trophy Room failure classification rather than erasing the validation history.");
assert.match(active,/a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1[\s\S]+All 13 normal pull-request workflow families passed/i,"Closed Analytics handoff must retain exact-head PR proof.");
assert.match(active,/c5c7d50cc3a2d9003e057d1813744c877323c068[\s\S]+deployed-site-smoke job `94855938131`/i,"Closed Analytics handoff must retain exact runtime merge and deployed proof.");

assert.ok(applicationVersion,"SESSION_BOOTSTRAP must expose the current application version.");
assert.ok(productionRuntime,"SESSION_BOOTSTRAP must expose the current production runtime revision.");
assert.ok(candidateRuntime,"SESSION_BOOTSTRAP must expose the current candidate runtime revision during runtime publication.");
assert.equal(packageJson.version,applicationVersion,"package.json and SESSION_BOOTSTRAP must agree on the application version.");
assert.equal(readiness.modelVersion,"RJR-1","RJR authority must remain on the fixed model.");
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=82&&readiness.currentScore<=100,"The fixed RJR authority must not regress below the evidence-proven token-lifecycle checkpoint.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,readiness.currentScore,"The SLE bootstrap must agree exactly with the live RJR ledger.");

assert.match(next,/CURRENT OVERRIDE[\s\S]+SUSTAINED MUTATION-FREQUENCY HARDENING[\s\S]+PR #163/i,"NEXT_TASK must expose the current PR #163 sustained mutation-frequency authority rather than a stale predecessor heading.");
assert.match(next,new RegExp(`Status:[\\s\\S]+v${escapeRegex(applicationVersion)} \\/ ${escapeRegex(productionRuntime)}[\\s\\S]+v${escapeRegex(applicationVersion)} \\/ ${escapeRegex(candidateRuntime)}[\\s\\S]+STAGE 5 REMAINS LOCKED`,"i"),"NEXT_TASK must distinguish deployed production runtime, candidate runtime and the Stage 5 lock.");
assert.match(next,new RegExp("RJR[\\s\\S]+"+readiness.currentScore+"\\/100","i"),"NEXT_TASK must report the score from the live fixed RJR ledger rather than a stale literal.");
assert.match(next,/PR #163 proof head[\s\S]+Validate Stage 3 Private Pairing[\s\S]+stage4-mutation-rate-limit-contracts\.cjs[\s\S]+stage4-mutation-rate-limit-emulator\.cjs/i,"NEXT_TASK must preserve the exact permanent capability-proof provenance for sustained mutation-frequency hardening.");
assert.match(next,/at least two seconds[\s\S]+Firestore server time[\s\S]+denied mutation[\s\S]+no authoritative revision[\s\S]+idempotency receipt[\s\S]+canonical local Save Library[\s\S]+Exact accepted-result replay/i,"NEXT_TASK must preserve the bounded server-time rate-limit proof and its no-side-effect/replay invariants.");
assert.match(next,/exactly \+1[\s\S]+83 → 84/i,"NEXT_TASK must preserve the single bounded readiness credit for sustained mutation-frequency hardening.");
assert.match(next,/Runtime packaging[\s\S]+CI volume[\s\S]+PR publication[\s\S]+merge[\s\S]+deployment[\s\S]+provider publication[\s\S]+documentation[\s\S]+zero duplicate/i,"NEXT_TASK must forbid duplicate readiness credit for publication mechanics.");
assert.match(next,/Production-provider publication[\s\S]+firestore\.spark\.rules[\s\S]+separately unverified/i,"NEXT_TASK must keep repository/emulator Rules evidence separate from provider publication truth.");
assert.match(next,/structural abuse resistance remains closed and protected/i,"NEXT_TASK must preserve the prior structural-abuse capability as closed rather than repeat it.");
assert.match(next,/Exact accepted-result replay[\s\S]+deterministic adverse-provider[\s\S]+App Check token-lifecycle[\s\S]+production remote-to-local reconciliation[\s\S]+consumed proof/i,"NEXT_TASK must preserve prior evidence as consumed and non-repeatable.");
assert.match(next,/Authenticated third-account[\s\S]+revoked registered-device[\s\S]+legitimate authenticated production identity\/device state/i,"NEXT_TASK must retain the real blocked production authorization dependency without fabricating proof.");
assert.match(next,/Two-physical-network behavior remains separately uncredited/i,"NEXT_TASK must distinguish deterministic proof from real two-network hardening.");
assert.match(next,/Remote Joining specific real-device token-lifecycle acceptance remains uncredited/i,"NEXT_TASK must preserve the separate real-device lifecycle gap.");
assert.match(next,/Production abuse acceptance remains uncredited/i,"NEXT_TASK must not inflate deterministic rate-limit evidence into production abuse acceptance.");
assert.match(next,/Production rollback proof remains uncredited/i,"NEXT_TASK must preserve the production rollback gap.");
assert.match(next,/Actual Remote Joining sessions remain Stage-5-gated/i,"NEXT_TASK must preserve the actual session gate.");
assert.match(next,/Final stable Remote Joining release acceptance remains uncredited/i,"NEXT_TASK must preserve final release acceptance as uncredited.");
assert.match(next,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"NEXT_TASK must preserve the offline recovery baseline while connected work advances.");
assert.match(next,/Canonical browser storage remains exactly[\s\S]+careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences[\s\S]+activeShowdown is non-canonical/i,"NEXT_TASK must preserve the exact canonical local storage boundary.");
assert.match(next,/Candidate A remains non-mutating[\s\S]+Candidate B remains read-only[\s\S]+Candidate C remains the sole destructive Apply authority[\s\S]+rollback remains transaction-owned[\s\S]+strict exact raw snapshot/i,"NEXT_TASK must preserve Candidate A/B/C authority and rollback locks.");
assert.match(next,/Firebase remains Spark \/ zero billing[\s\S]+Firestore remains memory-only[\s\S]+Google Auth remains popup-only `browserSessionPersistence` with no extra scopes[\s\S]+App Check enforcement remains OFF[\s\S]+Trusted-runtime IAM remains unactivated\/unbroadened/i,"NEXT_TASK must preserve provider, persistence, Auth, App Check and IAM locks.");
assert.match(next,/Exactly two private managers remain required[\s\S]+Public discovery, community, matchmaking and global rankings remain prohibited/i,"NEXT_TASK must preserve private exactly-two-owner product scope.");
assert.match(next,/after all required tests[\s\S]+merge and deploy without repeatedly asking for approval/i,"NEXT_TASK must preserve standing owner publication authorization with gate conditions.");

assert.equal(bootstrap.latestRuntimeMerge?.pullRequest,160,"SESSION_BOOTSTRAP must retain PR #160 as current deployed runtime provenance until r5 is merged and verified.");
assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,productionRuntime,"SESSION_BOOTSTRAP runtime provenance must agree with the deployed production runtime.");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,163,"SESSION_BOOTSTRAP must point at the active PR #163 publication checkpoint.");
assert.equal(bootstrap.currentPublicationCheckpoint?.candidateRuntimeRevision,candidateRuntime,"SESSION_BOOTSTRAP publication checkpoint must agree with the r5 candidate runtime.");
assert.equal(bootstrap.currentPublicationCheckpoint?.rjrAfterEvidence,readiness.currentScore,"SESSION_BOOTSTRAP publication checkpoint must preserve exact conservative RJR accounting.");
assert.equal(bootstrap.currentPublicationCheckpoint?.stage3PrivatePairingProofGreen,true,"SESSION_BOOTSTRAP must retain the permanent Stage 3/4 capability-proof pass.");
assert.equal(bootstrap.currentPublicationCheckpoint?.productionProviderRulesPublicationProven,false,"SESSION_BOOTSTRAP must not fabricate production Firestore Rules publication.");
assert.match(bootstrap.starter?.version||"",/^\d+\.\d+\.\d+$/,"The repository SLE bootstrap starter must carry a semantic patch version.");
assert.ok(bootstrap.starter?.canonical?.includes(`V${bootstrap.starter.version}_`),"The SLE bootstrap starter version must agree with its canonical versioned filename.");
assert.ok(bootstrap.starter?.projectMirror?.endsWith(bootstrap.starter.canonical),"The SLE bootstrap starter mirror must preserve the same versioned filename as the canonical starter.");

if(bootstrap.immediateNextTask?.mustStartAsRealProductWork===true){
  assert.equal(bootstrap.immediateNextTask.name,"pr163-r5-rjr84-publication-and-sle-seal","Active successor bootstrap must keep the bounded PR #163 publication + SLE seal task until publication completes.");
  assert.match(bootstrap.currentLane,/PR #163[\s\S]+1\.8\.1-r5[\s\S]+RJR-1 exactly 83 to 84/i,"Active successor bootstrap must expose the current r5/RJR84 publication lane.");
  assert.match(bootstrap.currentLane,/14-family publication/i,"Active successor bootstrap must preserve the exact-head workflow requirement.");
  assert.equal(bootstrap.transition?.continuationDecision,"CONTINUE","Active successor bootstrap must retain its independently assessed continuation decision until reassessed.");
  assert.ok(bootstrap.transition?.handoffCompleteness<100,"Active product publication must not falsely claim a complete handoff package.");
  assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+Finish PR #163 publication only[\s\S]+14 permanent workflow families[\s\S]+Expected-head squash merge[\s\S]+deployed `v1\.8\.1 \/ 1\.8\.1-r5`[\s\S]+recursive SLE handoff package[\s\S]+Handoff proximity 100%/i,"NEXT_TASK must route the active successor through exact-head PR #163 publication and then the mandatory SLE seal rather than another product milestone.");
}else{
  assert.match(bootstrap.immediateNextTask?.name||"",/sle-publication/i,"A transition-only bootstrap task must be recursive SLE publication.");
  assert.equal(bootstrap.transition?.contextTransitionRequired,true,"Transition-only bootstrap must require a context transition.");
  assert.equal(bootstrap.transition?.handoffCompleteness,100,"Transition-only bootstrap must expose complete handoff packaging.");
  assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+SLE[\s\S]+publish/i,"Transition NEXT_TASK must route into recursive SLE publication.");
}

assert.match(reconciliationProof,/Gate result[\s\S]+PASS/i,"Canonical owner evidence must record the Stage 4 reconciliation gate as passed.");
assert.match(reconciliationProof,/sha256:22bc1bea2833533a978ddfb0a6092b8279d40109234606da762d14cc359ccf3d/i,"Canonical owner evidence must retain the exact reviewed remote gameplay hash.");

assert.match(historicalNext,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Archived NEXT_TASK must preserve v1.5.0 / 1.5.0-r1 bounded product-candidate history.");
assert.match(historicalNext,/Historical reconciliation authorized product candidate:\s*none/i,"Archived NEXT_TASK must retain the earlier no-product-candidate reconciliation state as provenance.");
assert.match(historicalNext,/Phase C first slice[\s\S]{0,160}(PR #73|production-proven|closed)/i,"Archived NEXT_TASK must name Phase C first slice (PR #73) as closed / production-proven.");
assert.match(historicalNext,/Phase B first slice — Save Library \/ Local Profile Experience 2\.0 \(PR #70/i,"Archived NEXT_TASK must name Phase B first slice (PR #70) as closed / production-proven.");
assert.match(historicalNext,/65b6c9db0a070b6e5e992a39dffeee23df0c6f08/i,"Archived NEXT_TASK must record the live main feature-merge SHA for PR #70.");
assert.match(historicalNext,/dec1d3ba8182c3f62019974dd1704c7c9124def6/i,"Archived NEXT_TASK must record the Phase C first-slice PR #73 production merge.");
assert.match(historicalNext,/formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i,"Archived NEXT_TASK must preserve formatVersion 2 multi-Save portability history.");
assert.match(historicalNext,/Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i,"Archived NEXT_TASK must preserve the completed local dependency chain.");
assert.match(historicalNext,/publish under standing owner authorization[\s\S]+reassess the fresh WEC/i,"Archived NEXT_TASK must retain standing publication authority and fresh-WEC continuation history.");
assert.match(historicalNext,/After the candidate is fully published[\s\S]+If WEC permits continuation[\s\S]+smallest remaining dependency-gated Stage 2 prerequisite/i,"Archived NEXT_TASK must preserve the historical post-publication dependency ordering.");
assert.match(standingAuth,/standing[\s\S]+merge[\s\S]+deploy/i,"Standing owner authorization must remain the publication authority for validated current and future project PRs.");
assert.match(historicalNext,/Current production application version:\s*`v1\.4\.0`/i,"Archived NEXT_TASK must preserve v1.4.0 production history for the v1.5.0 candidate era.");
assert.match(historicalNext,/Current production Installable Offline App runtime: `1\.4\.0-r2`/i,"Archived NEXT_TASK must preserve the historical production runtime 1.4.0-r2.");
assert.match(historicalNext,/Immediate candidate rollback\/recovery runtime: `1\.4\.0-r2`/i,"Archived NEXT_TASK must preserve the v1.5.0-r1 candidate's immediate recovery target.");
assert.match(historicalNext,/Previously recorded pre-r2 fallback knowledge: `1\.4\.0-r1`/i,"Archived NEXT_TASK must preserve older 1.4.0-r1 fallback knowledge.");
assert.match(historicalNext,/Public community features and global leaderboard\/rankings are (?:\*\*)?ELIMINATED(?:\*\*)?/i,"Archived NEXT_TASK must retain the permanent ELIMINATED public community / global leaderboard lock.");
assert.match(historicalNext,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i,"The dated owner amendment must lock the new Remote Joining classification.");
assert.match(historicalNext,/Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i,"Archived NEXT_TASK must preserve the ordered Remote Joining prerequisite path.");
assert.match(remotePriority,/Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i,"The dated owner amendment must explicitly supersede only the former Remote Joining BLOCKED classification.");
assert.match(remotePriority,/PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,"The owner amendment must lock the new Remote Joining classification.");
assert.match(start,/identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i,"Developer bootstrap must include PR #59 in the completed dependency chain.");
assert.match(start,/presentation-only Local Profile display-label editing — PR #61/i,"Developer bootstrap must include PR #61 in the completed dependency chain.");

console.log(`Handoff immediate-next-task contracts passed: live PR #163 authority tracks production ${applicationVersion}/${productionRuntime}, candidate ${applicationVersion}/${candidateRuntime}, fixed RJR ${readiness.currentScore}/100, preserves all permanent locks and consumed proof, and routes publication directly into the recursive SLE seal.`);