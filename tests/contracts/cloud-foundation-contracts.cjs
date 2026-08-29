const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const reconciliationProof = read("OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md");
const providerProof = read("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md");
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
const productionR5 = bootstrap.runtime?.productionRuntimeRevision === "1.8.1-r5" && !bootstrap.runtime?.candidateRuntimeRevision;

assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must retain the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record Identity-Safe Career Analytics as shipped production truth.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow Analytics identity layer without authorizing broader Analytics 2.0.");
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E CURRENT \/ 1F NEXT/i, "Roadmap must preserve the historical Cloud Readiness progression.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain separately gated behind Cloud Readiness and its own remote-system prerequisites.");
assert.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must preserve historical Remote Joining prerequisite ordering.");

// Current cloud authority is provider-proven strengthened Rules / RJR86 while preserving the exact rollback history.
assert.equal(productionR5,true,"Current authority must remain on production v1.8.1-r5 after rollback restoration.");
assert.match(state,/CURRENT OVERRIDE[\s\S]+PR #171[\s\S]+PROVIDER-PROVEN RULES[\s\S]+RJR86[\s\S]+PROVIDER ABUSE ACCEPTANCE/i,"PROJECT_STATE must expose current PR171/provider-proven/RJR86 authority.");
assert.match(state,/Status:[\s\S]+PRODUCTION-PROVEN[\s\S]+v1\.8\.1 \/ 1\.8\.1-r5[\s\S]+Stage 5 remains locked/i,"PROJECT_STATE must identify restored r5 production truth and bounded Stage 5 lock.");
assert.match(state,/Immediate known-good rollback runtime:\s*`1\.8\.1-r4`/i,"PROJECT_STATE must retain r4 as the proven rollback runtime.");
assert.match(state,/Rollback proof workflow:\s*`33190961085` — SUCCESS \/ consumed/i,"PROJECT_STATE must retain the exact successful rollback workflow.");
assert.match(state,/PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29\.md/i,"PROJECT_STATE must point at direct provider Rules proof.");
assert.match(state,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"PROJECT_STATE must preserve the offline recovery baseline.");
assert.match(state,/Production-provider publication[\s\S]+firestore\.spark\.rules[\s\S]+directly verified/i,"PROJECT_STATE must record strengthened Rules as provider-authoritatively verified.");
assert.match(state,/Remote Joining readiness:\s*`86\/100` under fixed RJR-1/i,"PROJECT_STATE must track the fixed RJR86 ledger.");
assert.equal(readiness.currentScore,86,"Cloud foundation must track the provider-proven RJR86 checkpoint.");
assert.equal(readiness.modelVersion,"RJR-1","Cloud foundation must continue using the fixed RJR-1 model.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,readiness.currentScore,"Bootstrap and fixed RJR ledger must agree.");
assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,171,"Bootstrap must identify PR171 as the current cloud-security publication checkpoint.");
assert.equal(bootstrap.currentPublicationCheckpoint?.productionProviderRulesPublicationProven,true,"Bootstrap must record direct provider Rules publication proof.");
assert.equal(bootstrap.currentPublicationCheckpoint?.providerAbuseProductionAcceptanceProven,false,"Provider-abuse acceptance must remain uncredited until real production evidence exists.");
assert.match(state,/Exactly one new capability[\s\S]+production-cloud-security[\s\S]+19\/20 → 20\/20[\s\S]+85 → 86/i,"PROJECT_STATE must preserve conservative provider-publication accounting.");
assert.match(state,/PR #169[\s\S]+PR #171[\s\S]+CI[\s\S]+documentation[\s\S]+zero duplicate credit/i,"PROJECT_STATE must forbid duplicate process credit.");
assert.match(state,/Still uncredited include[\s\S]+third-account\/revoked-device production negatives[\s\S]+production provider abuse acceptance[\s\S]+two-network Remote Joining behavior[\s\S]+actual Stage 5 Remote Joining sessions[\s\S]+final stable release acceptance/i,"PROJECT_STATE must preserve remaining genuine gaps after provider publication.");
assert.doesNotMatch(state,/Production rollback proof remains uncredited/i,"PROJECT_STATE must not regress production rollback back to an uncredited gap.");
assert.match(state,/Current bounded work[\s\S]+PR #171[\s\S]+PROBE ENUMERATION DENIAL[\s\S]+zero writes/i,"PROJECT_STATE must expose the bounded provider-abuse acceptance candidate.");
assert.match(state,/fresh successor[\s\S]+fresh unique WEC[\s\S]+PROBE ENUMERATION DENIAL[\s\S]+Stage 5/i,"PROJECT_STATE must preserve fresh-successor provider-abuse execution and Stage 5 reassessment.");
assert.match(state,/Candidate C sole destructive remote-to-local Apply authority/i,"PROJECT_STATE must preserve Candidate C destructive Apply authority.");
assert.match(state,/Canonical browser storage remains exactly `careerModeShowdown\.saveLibrary`, `careerModeShowdown\.legacyShowdowns`, `careerModeShowdown\.preferences`/i,"PROJECT_STATE must preserve canonical storage authority.");
assert.match(state,/Firebase remains Spark \/ zero billing/i,"PROJECT_STATE must preserve zero-billing Firebase operation.");
assert.match(state,/Firestore remains memory-only/i,"PROJECT_STATE must preserve memory-only Firestore.");
assert.match(state,/Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i,"PROJECT_STATE must preserve popup-only browser-session Auth.");
assert.match(state,/App Check enforcement remains OFF/i,"PROJECT_STATE must preserve the App Check enforcement lock.");
assert.match(state,/Trusted-runtime IAM remains unactivated\/unbroadened/i,"PROJECT_STATE must preserve the trusted-runtime IAM lock.");
assert.match(state,/Public discovery\/community\/matchmaking\/global rankings remain prohibited/i,"PROJECT_STATE must preserve the private-only product scope.");
assert.match(state,/Consumed owner\/device[\s\S]+production rollback\/restoration proof must not be rerun merely for confidence/i,"PROJECT_STATE must preserve consumed proof discipline.");
assert.match(reconciliationProof,/Gate result[\s\S]+PASS/i,"Current reconciliation authority must remain backed by canonical owner production proof.");
assert.match(providerProof,/fifa17-career-showdown-prod[\s\S]+\(default\)[\s\S]+Today · 7:48 AM[\s\S]+firestore\.spark\.rules/i,"Direct provider proof must identify the exact production project/database/version/source boundary.");
assert.equal(productionEnvironment.projectId,"fifa17-career-showdown-prod","Production environment must remain pinned to the real production Firebase project.");
assert.equal(productionEnvironment.firestore?.rulesSource,"firestore.spark.rules","Production environment must record the provider-verified strengthened Rules source.");

assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #171[\s\S]+PROVIDER RULES PROVEN[\s\S]+RJR86[\s\S]+PROVIDER ABUSE ACCEPTANCE/i,"NEXT_TASK must expose current provider-Rules/RJR86/PR171 authority.");
assert.match(next,/Status:[\s\S]+v1\.8\.1 \/ 1\.8\.1-r5[\s\S]+STAGE 5 REMAINS LOCKED/i,"NEXT_TASK must expose restored r5 and the bounded Stage 5 lock.");
assert.match(next,/Production rollback proof:[\s\S]+33190961085[\s\S]+SUCCESS \/ CONSUMED/i,"NEXT_TASK must retain exact rollback workflow provenance.");
assert.match(next,/Production-provider publication[\s\S]+firestore\.spark\.rules[\s\S]+provider-verified/i,"NEXT_TASK must record provider-live strengthened Rules truth.");
assert.match(next,/85 → 86[\s\S]+production-cloud-security[\s\S]+19\/20 → 20\/20/i,"NEXT_TASK must preserve the single bounded provider-publication readiness credit.");
assert.match(next,/Implementation, tests, merge and deployment alone do not prove production provider abuse acceptance/i,"NEXT_TASK must separate deployed acceptance tooling from real provider evidence.");
assert.match(next,/Authenticated third-account and revoked registered-device production negatives remain separately uncredited/i,"NEXT_TASK must preserve state-dependent negatives as uncredited.");
assert.doesNotMatch(next,/Production rollback proof remains uncredited/i,"NEXT_TASK must not regress the rollback proof to uncredited.");
assert.match(next,/Candidate C remains the sole destructive remote-to-local Apply authority/i,"NEXT_TASK must preserve destructive restore authority.");
assert.match(next,/No public discovery\/community\/matchmaking\/global rankings/i,"NEXT_TASK must retain the permanent public community/discovery prohibition.");
assert.match(next,/Do not repeat consumed[\s\S]+production-rollback proof/i,"NEXT_TASK must preserve consumed rollback and earlier proof as non-repeatable merely for confidence.");
assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+Work Environment Continuity[\s\S]+finish PR #171 only[\s\S]+all 14 permanent workflow families[\s\S]+merge\/deploy under standing authorization/i,"NEXT_TASK must route the closing environment through PR171 publication only.");
assert.match(next,/fresh WEC assessment[\s\S]+PROBE ENUMERATION DENIAL[\s\S]+Stage 5/i,"NEXT_TASK must preserve fresh-successor provider-abuse acceptance and immediate Stage 5 reassessment.");

// Immutable history remains the authority for early Cloud Readiness and candidate eras.
assert.match(historicalState,/formatVersion 2 is live|formatVersion 2 full multi-Save/i,"Archived PROJECT_STATE must preserve formatVersion 2 multi-Save portability production truth.");
assert.match(historicalState,/explicit cross-Save\/historical manager identity linkage foundation/i,"Archived PROJECT_STATE must preserve shipped local manager identity semantics.");
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1A merge:[\s\S]+b1fafd9cba7e2c647b88445026f6c2d1134378b1/i,"Archived PROJECT_STATE must record the exact PR #76 Phase 1A merge.");
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1B merge:[\s\S]+2dc61e24ef07a0a150a228865f954ab3b3941398/i,"Archived PROJECT_STATE must record the exact PR #77 Phase 1B merge.");
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1C merge:[\s\S]+59957f8b0c29ce0cd480a0e9270a095160005599/i,"Archived PROJECT_STATE must record the exact PR #78 Phase 1C merge.");
assert.match(historicalState,/Cloud\/Sync Readiness Phase 1D merge:[\s\S]+fc2e8e8b921a435103a438a9239efbb890584d22/i,"Archived PROJECT_STATE must record the exact PR #79 Phase 1D merge.");
assert.match(historicalState,/Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE/i,"Archived PROJECT_STATE must retain historical Phase 1D-to-1E provenance.");
assert.match(historicalState,/Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i,"Archived PROJECT_STATE must retain historical Phase 1F blocked-next provenance.");
assert.match(historicalState,/Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i,"Archived PROJECT_STATE must retain historical v1.5.0 candidate truth.");
assert.match(historicalState,/1\.4\.0-r2[\s\S]{0,220}production-proven runtime and immediate recovery target/i,"Archived PROJECT_STATE must retain the historical v1.4.0-r2 recovery boundary.");
assert.match(historicalState,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,"Archived PROJECT_STATE must preserve owner-prioritized Remote Joining historical direction.");

assert.match(historicalNext,/formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i,"Archived NEXT_TASK must name the closed multi-Save PR #67 milestone.");
assert.match(historicalNext,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Archived NEXT_TASK must identify the historical v1.5.0 / 1.5.0-r1 product candidate.");
assert.match(historicalNext,/Current authorized prerequisite candidate[\s\S]+Cloud\/Sync Readiness Phase 1E/i,"Archived NEXT_TASK must retain Phase 1E prerequisite provenance.");
assert.match(historicalNext,/Next prerequisite after Phase 1E merges[\s\S]+Cloud\/Sync Readiness Phase 1F/i,"Archived NEXT_TASK must retain the historical Phase 1E-to-1F progression.");
assert.match(historicalNext,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Archived NEXT_TASK must retain the historical provider-runtime gate.");
assert.match(historicalNext,/Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i,"Archived NEXT_TASK must retain the permanent ELIMINATED public community lock.");
assert.match(historicalNext,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i,"Archived NEXT_TASK must preserve Private Remote Joining historical prioritization.");
assert.match(historicalNext,/Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session capability[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i,"Archived NEXT_TASK must preserve the ordered Remote Joining prerequisite chain.");

for(const term of ["baseRevision","tombstone","compare-and-swap","deviceId","accountId"]){
  assert.ok(cloud.includes(term),`Cloud foundation lost required Remote Joining prerequisite term: ${term}`);
}
assert.match(cloud,/only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i,"Cloud foundation must prohibit rushing Remote Joining before its prerequisite gates pass.");
assert.match(remotePriority,/next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i,"Owner amendment must preserve the long-term priority rule once the networked roadmap lane is opened.");
assert.match(provider,/Select Firebase as the primary provider candidate/i,"Provider decision must name Firebase as a candidate rather than silently adding a backend.");
assert.match(provider,/Do not enable Firestore persistent offline cache/i,"Provider decision must reject Firestore last-write-wins offline persistence.");
assert.match(provider,/This is a provider decision, not an instruction to connect Firebase/i,"Provider selection must retain its historical original boundary.");
assert.match(privacy,/data minimization/i,"Phase 1C must make remote data minimization an explicit product rule.");
assert.match(privacy,/unshared Save Library Saves/i,"Phase 1C must keep unshared Saves local-only by default.");
assert.match(privacy,/Tombstones must not retain deleted gameplay content/i,"Phase 1C tombstones must remain deletion authority, not backups.");
assert.match(privacy,/Optional Private Cloud Backup remains a separate future opt-in product/i,"Phase 1C must not conflate Remote Joining sync with Cloud Backup.");
assert.match(remoteContract,/deny-by-default/i,"Phase 1D must lock deny-by-default provider authorization before provider connection.");
assert.match(remoteContract,/may never replace or refresh the original client's `baseRevision`/i,"Phase 1D must preserve immutable client intent across provider retries.");
assert.match(remoteContract,/One account deletes its account while the second remains[\s\S]+do not destroy shared gameplay data/i,"Phase 1D must resolve two-owner account deletion without destroying the survivor's entitlement.");
assert.match(phase1e,/recursively frozen/i,"Phase 1E must protect the complete queued intent, not only its revision number.");
assert.match(phase1e,/long-offline stale device cannot resurrect/i,"Phase 1E must prove anti-resurrection after offline reconnect.");
assert.match(phase1e,/rollback refuses to overwrite those newer bytes/i,"Phase 1E local Apply proof must preserve Candidate C ownership-scoped rollback anti-clobber semantics.");
assert.match(phase1e,/Phase 1F remains blocked/i,"Historical Phase 1E authority must preserve its original provider-integration gate.");
assert.doesNotMatch(harness,/\blocalStorage\b|\bfetch\s*\(|firebase|firestore/i,"Phase 1E harness must remain provider/network/browser-storage neutral.");
assert.match(phase1eTest,/Object\.isFrozen\(a1\.intent\.content\)/,"Permanent Phase 1E tests must prove recursively immutable offline intent payloads.");
assert.match(phase1eTest,/rollback-failed-critical[\s\S]+rollbackOwnershipConflicts/i,"Permanent Phase 1E tests must prove rollback ownership loss cannot clobber newer local state.");
assert.match(remoteRoadmap,/Phase 1A[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1B[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1C[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE[\s\S]+Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i,"Detailed Remote Joining roadmap must preserve exact staged Cloud Readiness provenance.");

assert.ok(!/\bfetch\s*\(/.test(restore),"Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction),"Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"),"Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"),"Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"),"Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write(`PASS Cloud/Sync authority: production-proven r5, provider-verified strengthened Firestore Rules, fixed RJR${readiness.currentScore}, provider-abuse evidence gating, immutable historical Cloud Readiness provenance and recovery/privacy locks remain protected.\n`);