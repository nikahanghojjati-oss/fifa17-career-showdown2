const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const reconciliationProof = read("OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md");
const providerProof = read("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md");
const providerAbuseProof = read("PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md");
const stage5aProof = read("STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md");
const stage5bProof = read("STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md");
const stage5cProof = read("STAGE5C_ZERO_BILLING_STANDARD_AUTH_SESSION_ADAPTER_PROOF_2026-09-01.md");
const stage5fProof = read("PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md");
const productionEnvironment = JSON.parse(read("firebase.production.environment.json"));
const historicalState = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const historicalNext = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
const provider = read("CLOUD_PROVIDER_DECISION_2026-08-17.md");
const privacy = read("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md");
const remoteContract = read("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md");
const phase1e = read("CLOUD_SYNC_READINESS_PHASE_1E.md");
const harness = read("js/cloudSyncTwoDeviceHarness.js");
const phase1eTest = read("tests/contracts/cloud-sync-two-device-harness-contracts.cjs");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const restore = read("js/restore.js");
const transaction = read("js/storageTransaction.js");
const storage = read("js/storage.js");
const productionR3 = bootstrap.runtime?.productionRuntimeRevision === "1.9.1-r3" && bootstrap.runtime?.productionStatus === "production-proven";

// Historical roadmap/provenance remains immutable even though current product authority has advanced far beyond it.
assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i);
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i);
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i);
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i);
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E CURRENT \/ 1F NEXT/i);
assert.match(roadmap, /Cloud Backup \| BLOCKED/i);
assert.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i);

// Current live cloud authority follows PR203/r3; PR187/r5 and PR194/r2 remain immutable consumed/rollback provenance.
assert.equal(productionR3,true,"Current runtime identity must be production-proven v1.9.1-r3.");
assert.equal(bootstrap.latestRuntimeMerge?.pullRequest,203,"Latest runtime merge must be PR #203.");
assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,"1.9.1-r3","Latest runtime merge must identify production r3.");
assert.equal(bootstrap.latestRuntimeMerge?.productionProofRecorded,true);
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203,"Current production runtime provenance must be anchored to PR #203.");
assert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,"1.9.1-r3","Current production runtime provenance must identify 1.9.1-r3.");
assert.equal(bootstrap.lastProductionProvenRuntime?.mergeSha,"65d88b1b413501b328bdf722bc6e8a0aa0d46ef2");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.pullRequest,187,"Historical PR187 provenance must remain explicit.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.runtimeRevision,"1.9.0-r5");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.rjrAfterEvidence,89);
assert.equal(bootstrap.previousProductionProvenRuntime?.runtimeRevision,"1.9.1-r2","Previous production-proven whole-shell rollback must remain r2 after r3 publication.");
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,100,"Live RJR authority may reach 100 only from accepted capability evidence, never Stage 5G/H/I process or automation credit.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,100,"Bootstrap must expose evidence-accepted fixed RJR100 after the physical and stable-release acceptance events.");
assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);

const stage5eLifecycleEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(stage5eLifecycleEvidence?.score,88);
assert.equal(stage5eLifecycleEvidence?.delta,1);
const r5ConvergenceEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-r5-one-paste-zero-manual-reattach-convergence");
assert.equal(r5ConvergenceEvidence?.score,89);
assert.equal(r5ConvergenceEvidence?.delta,1);
assert.equal(r5ConvergenceEvidence?.domainId,"devices-pairing-connected-rivalry-remote-join");
const stage5fEvidence=readiness.evidenceHistory?.filter(entry=>entry.score===90||entry.score===91)||[];
assert.equal(stage5fEvidence.length,2);
assert.ok(stage5fEvidence.every(entry=>entry.delta===1&&entry.domainId==="identity-auth-trust"));
assert.match(stage5fEvidence.map(entry=>entry.reason||"").join("\n"),/revoked-device/i);
assert.match(stage5fEvidence.map(entry=>entry.reason||"").join("\n"),/third account|third-account|non-participant|unrelated/i);
assert.match(stage5fProof,/PASS/i);
assert.match(stage5fProof,/91\/100/i);
assert.doesNotMatch(stage5fProof,/pair_[0-9a-f]{32,}/i);

const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
assert.equal(physicalAcceptance?.score,99);
assert.equal(physicalAcceptance?.delta,8);
assert.equal(physicalAcceptance?.domainId,"devices-pairing-connected-rivalry-remote-join");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(stableReleaseAcceptance?.score,100);
assert.equal(stableReleaseAcceptance?.delta,1);
assert.equal(stableReleaseAcceptance?.domainId,"real-device-hardening-release");
assert.equal(readiness.evidenceHistory?.at(-2)?.eventId,physicalAcceptance?.eventId);
assert.equal(readiness.evidenceHistory?.at(-1)?.eventId,stableReleaseAcceptance?.eventId);
assert.equal(readiness.domains.reduce((sum,domain)=>sum+domain.earned,0),100);

// Current live state/next-task files advance to PR203/r3 and RJR100 while retaining runtime/security/product locks.
assert.match(state,/RJR-1 COMPLETE\/FROZEN `100\/100`|RJR-1 100\/100|RJR100/i);
assert.match(state,/v1\.9\.1[\s\S]+1\.9\.1-r3/i);
assert.match(state,/PR #198/i);
assert.match(state,/Installable Offline App[\s\S]+v1\.3\.0 Recovery & Device Resilience/i);
assert.match(state,/final stable-release acceptance|final stable Remote Joining release acceptance/i);
assert.match(state,/Candidate C[\s\S]+sole destructive remote-to-local gameplay Apply authority/i);
assert.match(state,/careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences/i);
assert.match(state,/Billing is permanently forbidden|Billing must never be activated/i);
assert.match(state,/Firebase remains Spark/i);
assert.match(state,/Firestore browser persistence remains memory-only|Browser Firestore persistence remains memory-only|Firestore persistence remains memory-only/i);
assert.match(state,/Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i);
assert.match(state,/App Check enforcement remains OFF/i);
assert.match(state,/No public discovery[\s\S]+global leaderboards/i);
assert.match(state,/Shared Showdown Journey Readiness|SSJR-1/i);
assert.doesNotMatch(state,/Production rollback proof remains uncredited/i);

assert.match(next,/100\/100|RJR100/i);
assert.match(next,/PR #198/i);
assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(next,/Chromebook[\s\S]+iPhone|physical[\s\S]+cellular/i);
assert.match(next,/final stable release acceptance/i);
assert.match(next,/Candidate C remains the sole destructive remote-to-local gameplay Apply authority/i);
assert.match(next,/No public discovery[\s\S]+global leaderboards/i);
assert.match(next,/Billing must never be activated[\s\S]+Firebase remains Spark/i);
assert.match(next,/Shared Showdown Journey Readiness|SSJR-1/i);
assert.match(next,/Connected Rivalry[\s\S]+ACTIVE[\s\S]+(?:league|clubs)/i);
assert.doesNotMatch(next,/Production rollback proof remains uncredited/i);

// Zero-billing authorization is permanent and current, independent of historical candidate architecture.
assert.equal(bootstrap.ownerZeroBillingAuthorization?.allNonBillingRemoteJoiningDecisionsAuthorized,true);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain,"Spark");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.blazeMayBeEnabled,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudRunAllowed,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudFunctionsAllowed,false);
assert.equal(bootstrap.runtime?.appCheckEnforcement,false);
assert.equal(bootstrap.runtime?.firestorePersistence,"memory-only");
assert.match(bootstrap.runtime?.googleAuthPersistence||"",/browserSessionPersistence-popup-only-no-extra-scopes/i);

// Provider-authoritative and owner-production evidence remain independently protected.
assert.match(reconciliationProof,/Gate result[\s\S]+PASS/i);
assert.match(providerProof,/fifa17-career-showdown-prod[\s\S]+\(default\)[\s\S]+Today · 7:48 AM[\s\S]+firestore\.spark\.rules/i);
assert.match(providerAbuseProof,/PASS \/ PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED[\s\S]+firestoreWritesRequested[\s\S]+localStorageUnchanged/i);
assert.equal(productionEnvironment.projectId,"fifa17-career-showdown-prod");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSource,"firestore.spark.rules");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSourceBlobSha,"363af783d7e5436fdfaa3766d4aa413fc9952a08");

// Candidate-era proof remains valid research/provenance even where its billed path is no longer production-critical.
assert.match(stage5aProof,/candidate protocol and emulator boundary proven; production publication deliberately excluded[\s\S]+`firestore\.stage5a\.rules`[\s\S]+Production `firestore\.spark\.rules` is unchanged/i);
assert.match(stage5aProof,/collection or collection-group listing[\s\S]+terminal join\/resurrection denial[\s\S]+revoked-device[\s\S]+inactive-account[\s\S]+lost-rivalry-entitlement/i);
assert.match(stage5aProof,/device_id[\s\S]+device claim is missing or names a never-registered device/i);
assert.match(stage5aProof,/mutation naming another active registered device[\s\S]+does not match the caller's token claim/i);
assert.match(stage5aProof,/revoked-device client, exact-read and direct-write denial/i);
assert.match(stage5aProof,/Production currently has no implemented or proven issuer[\s\S]+must not be described or published as functional production session authority/i);
assert.match(stage5bProof,/(?=[\s\S]*non-extractable P-256)(?=[\s\S]*per-sign-in custom-token claims)(?=[\s\S]*Two simultaneous custom-auth sessions for the same)/i);
assert.match(stage5bProof,/Cloud Run[\s\S]+Spark[\s\S]+iam\.serviceAccounts\.signBlob[\s\S]+datastore\.entities\.update/i);
assert.match(stage5cProof,/(?=[\s\S]*request\.auth\.uid)(?=[\s\S]*account-owned[^\n]{0,100}mutation[^\n]{0,100}metadata)(?=[\s\S]*not authentication)(?=[\s\S]*exact[^\n]{0,100}capability)(?=[\s\S]*listing are denied)/i);
assert.match(stage5cProof,/(?=[\s\S]*production deployment mapping still selects `firestore\.spark\.rules`)(?=[\s\S]*no Cloud Billing account)(?=[\s\S]*Cloud Run)(?=[\s\S]*App Check enforcement change)/i);

// Immutable history files, not current routing pointers, preserve the early Cloud Readiness/candidate eras.
assert.match(historicalState,/formatVersion 2 is live|formatVersion 2 full multi-Save/i);
assert.match(historicalState,/explicit cross-Save\/historical manager identity linkage foundation/i);
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1A merge:[\s\S]+b1fafd9cba7e2c647b88445026f6c2d1134378b1/i);
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1B merge:[\s\S]+2dc61e24ef07a0a150a228865f954ab3b3941398/i);
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1C merge:[\s\S]+59957f8b0c29ce0cd480a0e9270a095160005599/i);
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1D merge:[\s\S]+fc2e8e8b921a435103a438a9239efbb890584d22/i);
assert.match(historicalState,/Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE/i);
assert.match(historicalState,/Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i);
assert.match(historicalState,/Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i);
assert.match(historicalState,/1\.4\.0-r2[\s\S]{0,220}production-proven runtime and immediate recovery target/i);
assert.match(historicalState,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i);

assert.match(historicalNext,/formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i);
assert.match(historicalNext,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i);
assert.match(historicalNext,/Current authorized prerequisite candidate[\s\S]+Cloud\/Sync Readiness Phase 1E/i);
assert.match(historicalNext,/Next prerequisite after Phase 1E merges[\s\S]+Cloud\/Sync Readiness Phase 1F/i);
assert.match(historicalNext,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(historicalNext,/Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i);
assert.match(historicalNext,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(historicalNext,/Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session capability[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i);

// Foundational sync/privacy/security invariants remain permanent.
for(const term of ["baseRevision","tombstone","compare-and-swap","deviceId","accountId"]){
  assert.ok(cloud.includes(term),`Cloud foundation lost required Remote Joining prerequisite term: ${term}`);
}
assert.match(cloud,/only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i);
assert.match(remotePriority,/next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i);
assert.match(provider,/Select Firebase as the primary provider candidate/i);
assert.match(provider,/Do not enable Firestore persistent offline cache/i);
assert.match(provider,/This is a provider decision, not an instruction to connect Firebase/i);
assert.match(privacy,/data minimization/i);
assert.match(privacy,/unshared Save Library Saves/i);
assert.match(privacy,/Tombstones must not retain deleted gameplay content/i);
assert.match(privacy,/Optional Private Cloud Backup remains a separate future opt-in product/i);
assert.match(remoteContract,/deny-by-default/i);
assert.match(remoteContract,/may never replace or refresh the original client's `baseRevision`/i);
assert.match(remoteContract,/One account deletes its account while the second remains[\s\S]+do not destroy shared gameplay data/i);
assert.match(phase1e,/recursively frozen/i);
assert.match(phase1e,/long-offline stale device cannot resurrect/i);
assert.match(phase1e,/rollback refuses to overwrite those newer bytes/i);
assert.match(phase1e,/Phase 1F remains blocked/i);
assert.doesNotMatch(harness,/\blocalStorage\b|\bfetch\s*\(|firebase|firestore/i);
assert.match(phase1eTest,/Object\.isFrozen\(a1\.intent\.content\)/);
assert.match(phase1eTest,/rollback-failed-critical[\s\S]+rollbackOwnershipConflicts/i);
assert.match(remoteRoadmap,/Phase 1A[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1B[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1C[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE[\s\S]+Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i);

assert.ok(!/\bfetch\s*\(/.test(restore),"Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction),"Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"),"Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"),"Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"),"Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write(`PASS Cloud/Sync authority: production-proven 1.9.1-r3 / PR203 runtime, r2 whole-shell rollback, historical PR187/r5 capability provenance, live fixed RJR${readiness.currentScore}, permanent zero-billing/provider/privacy/recovery locks, accepted Stage 5F production negatives and immutable historical Cloud Readiness provenance are protected.\n`);