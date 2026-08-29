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
const applicationVersion = bootstrap.runtime?.applicationVersion || packageJson.version || "";

assert.match(golden,/Mandatory immediate-next-task handoff rule/i,"Golden handoff policy must permanently require an explicit immediate-next-task section.");
assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,"Golden handoff policy must name the required post-study immediate-task section.");
assert.match(golden,/bootstrap\/study[\s\S]+execution/i,"Golden handoff policy must distinguish repository study from the concrete execution task that follows it.");
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i,"Golden handoff policy must require enough specificity for a fresh developer to begin independently.");
assert.match(golden,/Do not substitute vague instructions/i,"Golden handoff policy must prohibit vague roadmap-only continuation language.");
assert.match(golden,/recursive and permanent/i,"Immediate-next-task handoff behavior must remain recursive across future developer sessions.");

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["00_CURRENT_HANDOFF.md",current],["IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md",active],["NEXT_TASK.md",next]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary.`);
}

assert.match(active,/FIRST ENGINEERING TASK: preserve the sealed production boundary/i,"Closed Analytics handoff must preserve its proven production boundary.");
assert.match(active,/PR #59 is no longer an implementation task[\s\S]+production-proven/i,"Closed Analytics handoff must distinguish completed production work from future implementation authorization.");
assert.match(active,/Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i,"Closed Analytics handoff must retain the final Trophy Room failure classification.");
assert.match(active,/a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1[\s\S]+All 13 normal pull-request workflow families passed/i,"Closed Analytics handoff must retain exact-head PR proof.");
assert.match(active,/c5c7d50cc3a2d9003e057d1813744c877323c068[\s\S]+deployed-site-smoke job `94855938131`/i,"Closed Analytics handoff must retain exact runtime merge and deployed proof.");

assert.ok(applicationVersion,"SESSION_BOOTSTRAP must expose the current application version.");
assert.ok(productionRuntime,"SESSION_BOOTSTRAP must expose the current production runtime revision.");
assert.equal(packageJson.version,applicationVersion,"package.json and SESSION_BOOTSTRAP must agree on the application version.");
assert.equal(readiness.modelVersion,"RJR-1","RJR authority must remain on the fixed model.");
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=85&&readiness.currentScore<=100,"The fixed RJR authority must preserve the production rollback checkpoint or later evidence.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,readiness.currentScore,"The SLE bootstrap must agree exactly with the live RJR ledger.");

assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #166[\s\S]+PRODUCTION ROLLBACK PROVEN[\s\S]+RJR85[\s\S]+PR #167 SLE TRANSITION/i,"NEXT_TASK must expose current PR #166 rollback / RJR85 / PR #167 transition authority.");
assert.match(next,new RegExp(`Status:[\\s\\S]+v${escapeRegex(applicationVersion)} \\/ ${escapeRegex(productionRuntime)}[\\s\\S]+STAGE 5 REMAINS LOCKED`,"i"),"NEXT_TASK must identify the current production runtime and Stage 5 lock.");
assert.match(next,/Production rollback workflow `33190961085` is fully successful/i,"NEXT_TASK must retain the exact production rollback proof run.");
assert.match(next,/Run `33190961085`[\s\S]+exact r4 live in production[\s\S]+restored exact r5[\s\S]+Production is back on r5/i,"NEXT_TASK must preserve both live rollback and exact restoration observations.");
assert.match(next,/RJR advances `84 → 85`[\s\S]+PR\/CI volume[\s\S]+merge[\s\S]+documentation[\s\S]+zero duplicate credit/i,"NEXT_TASK must preserve the single bounded rollback credit and forbid process credit.");
assert.match(next,new RegExp("RJR[\\s\\S]+"+readiness.currentScore+"\\/100","i"),"NEXT_TASK must report the score from the live fixed RJR ledger.");
assert.match(next,/Production-provider publication[\s\S]+firestore\.spark\.rules[\s\S]+separately unverified/i,"NEXT_TASK must keep repository/emulator Rules evidence separate from provider publication truth.");
assert.match(next,/Authenticated third-account\/revoked-device production negatives[\s\S]+two-network behavior[\s\S]+real-device Remote Joining token-lifecycle acceptance[\s\S]+production provider abuse acceptance[\s\S]+actual Stage 5 sessions[\s\S]+final stable release acceptance[\s\S]+uncredited/i,"NEXT_TASK must preserve all genuinely remaining uncredited capabilities after rollback proof.");
assert.doesNotMatch(next,/Production rollback proof remains uncredited/i,"NEXT_TASK must not regress the newly proven production rollback capability back to uncredited.");
assert.match(next,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"NEXT_TASK must preserve the offline recovery baseline while connected work advances.");
assert.match(next,/Exactly two private managers/i,"NEXT_TASK must preserve the exactly-two-manager product boundary.");
assert.match(next,/three canonical localStorage keys/i,"NEXT_TASK must preserve the exact canonical local storage boundary.");
assert.match(next,/Candidate A non-mutating[\s\S]+Candidate B read-only[\s\S]+Candidate C sole destructive Apply authority[\s\S]+transaction-owned rollback[\s\S]+strict exact raw snapshot/i,"NEXT_TASK must preserve Candidate A/B/C authority and rollback locks.");
assert.match(next,/Spark\/zero billing[\s\S]+memory-only Firestore[\s\S]+popup-only `browserSessionPersistence` Google Auth with no extra scopes[\s\S]+App Check enforcement OFF[\s\S]+trusted-runtime IAM unactivated\/unbroadened/i,"NEXT_TASK must preserve provider, persistence, Auth, App Check and IAM locks.");
assert.match(next,/no public discovery\/community\/matchmaking\/global rankings/i,"NEXT_TASK must preserve the private scope prohibition.");
assert.match(next,/Standing owner merge\/deploy authorization remains active after all mandatory gates pass/i,"NEXT_TASK must preserve standing publication authorization with gate conditions.");
assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+finish PR #167 only[\s\S]+mandatory publication gates[\s\S]+merge under standing authorization[\s\S]+production still exposes `1\.8\.1-r5`[\s\S]+Handoff proximity 100%/i,"NEXT_TASK must route the closing environment through exact-head PR #167 publication and stop.");
assert.match(next,/fresh successor[\s\S]+Validate\/archive predecessor WEC `we-2026-08-28-rjr-production-rollback-proof`[\s\S]+fresh unique WEC[\s\S]+smallest genuinely unblocked remaining RJR dependency/i,"NEXT_TASK must give the successor a concrete fresh-WEC continuation path.");
assert.match(next,/Do not repeat consumed[\s\S]+production-rollback proof/i,"NEXT_TASK must mark the new rollback proof as consumed and non-repeatable merely for confidence.");

assert.equal(bootstrap.latestRuntimeMerge?.pullRequest,166,"SESSION_BOOTSTRAP latest production proof provenance must point to PR #166.");
assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,productionRuntime,"SESSION_BOOTSTRAP runtime provenance must agree with deployed production runtime.");
assert.equal(bootstrap.latestRuntimeMerge?.rollbackRunId,33190961085,"SESSION_BOOTSTRAP must retain the exact rollback run id.");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,167,"SESSION_BOOTSTRAP must identify PR #167 as the current publication checkpoint.");
assert.equal(bootstrap.currentPublicationCheckpoint?.rjrAfterEvidence,readiness.currentScore,"SESSION_BOOTSTRAP publication checkpoint must preserve exact conservative RJR accounting.");
assert.equal(bootstrap.currentPublicationCheckpoint?.productionRollbackProven,true,"SESSION_BOOTSTRAP must retain successful rollback proof.");
assert.equal(bootstrap.currentPublicationCheckpoint?.productionRestorationProven,true,"SESSION_BOOTSTRAP must retain successful exact r5 restoration proof.");
assert.equal(bootstrap.currentPublicationCheckpoint?.productionProviderRulesPublicationProven,false,"SESSION_BOOTSTRAP must not fabricate production Firestore Rules publication.");
assert.equal(bootstrap.runtime?.candidateRuntimeRevision,undefined,"A sealed production transition must not retain a phantom candidate runtime.");
assert.equal(bootstrap.runtime?.productionRuntimeRevision,"1.8.1-r5","Production must remain on r5 after rollback proof.");
assert.match(bootstrap.starter?.version||"",/^\d+\.\d+\.\d+$/,"The repository SLE bootstrap starter must carry a semantic patch version.");
assert.equal(bootstrap.starter?.version,"1.4.26","The rollback/RJR85 transition must publish starter v1.4.26.");
assert.ok(bootstrap.starter?.canonical?.includes(`V${bootstrap.starter.version}_`),"The SLE bootstrap starter version must agree with its canonical versioned filename.");
assert.ok(bootstrap.starter?.projectMirror?.endsWith(bootstrap.starter.canonical),"The SLE bootstrap starter mirror must preserve the same versioned filename as the canonical starter.");
assert.equal(bootstrap.immediateNextTask?.mustStartAsRealProductWork,false,"The sealed current environment must not begin another substantive product milestone.");
assert.equal(bootstrap.immediateNextTask?.name,"fresh-wec-smallest-unblocked-rjr-dependency","The successor bootstrap must route to a fresh assessment rather than replaying the consumed rollback milestone.");
assert.match(bootstrap.immediateNextTask?.summary||"",/Closing environment publishes PR #167 and stops[\s\S]+Fresh successor[\s\S]+smallest genuinely unblocked remaining RJR dependency/i,"The successor capsule must preserve the closing publication gate and fresh dependency selection.");
assert.equal(bootstrap.transition?.contextTransitionRequired,true,"Transition-only bootstrap must require a context transition.");
assert.equal(bootstrap.transition?.handoffCompleteness,100,"Transition-only bootstrap must expose complete handoff packaging.");
assert.equal(bootstrap.transition?.continuationDecision,"HANDOFF_AT_CHECKPOINT","Sealed transition bootstrap must retain current environment HANDOFF_AT_CHECKPOINT without imposing it on the successor.");
assert.match(bootstrap.currentLane,/PR #166 production rollback proof is complete and consumed[\s\S]+RJR-1 is 85\/100[\s\S]+PR #167 is transition-only[\s\S]+stop/i,"Bootstrap current lane must preserve the completed rollback boundary and transition-only stop rule.");

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
assert.match(historicalNext,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i,"The dated owner amendment must lock the Remote Joining historical classification.");
assert.match(historicalNext,/Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i,"Archived NEXT_TASK must preserve the ordered Remote Joining prerequisite path.");
assert.match(remotePriority,/Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i,"The dated owner amendment must explicitly supersede only the former Remote Joining BLOCKED classification.");
assert.match(remotePriority,/PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,"The owner amendment must lock the historical Remote Joining classification.");
assert.match(start,/identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i,"Developer bootstrap must include PR #59 in the completed dependency chain.");
assert.match(start,/presentation-only Local Profile display-label editing — PR #61/i,"Developer bootstrap must include PR #61 in the completed dependency chain.");

console.log(`Handoff immediate-next-task contracts passed: PR #166 rollback proof / PR #167 SLE transition tracks production ${applicationVersion}/${productionRuntime}, fixed RJR ${readiness.currentScore}/100, preserves permanent locks and remaining nonclaims, and routes the current environment to a clean 100% handoff boundary.`);
