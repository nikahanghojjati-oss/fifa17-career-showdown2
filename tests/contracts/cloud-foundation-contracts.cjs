const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const reconciliationProof = read("OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md");
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

assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must retain the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record Identity-Safe Career Analytics as shipped production truth.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow Analytics identity layer without authorizing broader Analytics 2.0.");
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E CURRENT \/ 1F NEXT/i, "Roadmap must preserve the historical Cloud Readiness progression.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain separately gated behind Cloud Readiness and its own remote-system prerequisites.");
assert.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must prioritize Remote Joining without skipping prerequisite authorization.");

// Current live authority has advanced through production-proven Stage 4 reconciliation,
// evidence-proven exact accepted-result replay, deterministic adverse-provider safety and
// deterministic App Check token-lifecycle safety. Immutable pre-r3 archives retain the original provenance.
assert.match(state, /CURRENT OVERRIDE — v1\.8\.1-r3 STAGE 4 RECONCILIATION PRODUCTION-PROVEN — EXACT REPLAY \+ DETERMINISTIC ADVERSE-NETWORK SAFETY PROVEN/i, "PROJECT_STATE must expose current reconciliation, exact-replay and deterministic adverse-network authority.");
assert.match(state, /Production runtime:\s*`1\.8\.1-r3`[\s\S]+Current runtime merge:\s*`beab9f31cb7f31bf4938f5b0df67394899ef12a0` \(PR #151\)/i, "PROJECT_STATE must identify the current deployed r3 runtime lineage.");
assert.match(state, /Previous known-good whole-shell recovery runtime:\s*`1\.8\.1-r1`/i, "PROJECT_STATE must preserve the known-good rollback generation.");
assert.match(state, new RegExp("Remote Joining readiness candidate:\\s*`" + readiness.currentScore + "\\/100` under fixed RJR-1", "i"), "PROJECT_STATE must track the live fixed RJR candidate rather than a stale literal.");
assert.match(state, /App Check enforcement (?:stays|remains) OFF/i, "PROJECT_STATE must preserve the App Check enforcement lock.");
assert.match(state, /Firebase (?:stays|remains) Spark \/ zero billing/i, "PROJECT_STATE must preserve zero-billing Firebase operation.");
assert.match(state, /Candidate C (?:remains )?the sole destructive remote-to-local Apply authority/i, "PROJECT_STATE must preserve Candidate C destructive Apply authority.");
assert.match(state, /Canonical local storage remains exactly `careerModeShowdown\.saveLibrary`, `careerModeShowdown\.legacyShowdowns`, and `careerModeShowdown\.preferences`/i, "PROJECT_STATE must preserve canonical storage authority.");
assert.match(state, /Stage 5[\s\S]{0,160}(?:still|remains) locked/i, "PROJECT_STATE must keep Stage 5 locked until remaining explicit pre-Stage-5 hardening is proven.");
assert.match(state, /remote-to-local reconciliation added exactly \+1:\s*78 → 79/i, "PROJECT_STATE must preserve conservative fixed-domain reconciliation credit.");
assert.match(state, /exact accepted-result idempotency replay added exactly \+1:\s*79 → 80/i, "PROJECT_STATE must preserve the single bounded replay capability credit.");
assert.match(state, /deterministic adverse-provider failure safety adds exactly \+1:\s*80 → 81/i, "PROJECT_STATE must preserve the single bounded adverse-provider capability credit.");
assert.match(state, /deterministic App Check token-lifecycle safety adds exactly \+1:\s*81 → 82/i, "PROJECT_STATE must preserve the single bounded token-lifecycle capability credit.");
assert.match(state, /Remaining explicitly uncredited capability includes authenticated third-account\/revoked-device production negatives[\s\S]+two-physical-network hardening[\s\S]+actual Remote Joining sessions/i, "PROJECT_STATE must distinguish proven deterministic token lifecycle from remaining Remote Joining hardening.");
assert.match(state, /token-lifecycle contract[\s\S]+PASSED[\s\S]+ac465bc781b038860f91620debb7ae7fc7a3e05d/i, "PROJECT_STATE must preserve the exact focused lifecycle proof checkpoint.");
assert.match(state, /Current bounded work[\s\S]+finish PR #160 publication/i, "PROJECT_STATE must route current work into publication of the already-proven r4 capability.");
assert.match(state, /Two-physical-network behavior remains separately uncredited/i, "PROJECT_STATE must not conflate deterministic provider/lifecycle proof with real two-network hardening.");
assert.equal(readiness.modelVersion, "RJR-1", "Cloud foundation must continue using the fixed RJR-1 model.");
assert.equal(readiness.currentScore, 82, "Cloud foundation must agree with the evidence-backed token-lifecycle RJR checkpoint.");
assert.match(reconciliationProof, /Gate result[\s\S]+PASS/i, "Current reconciliation authority must be backed by the canonical owner production proof.");

assert.match(historicalState, /formatVersion 2 is live|formatVersion 2 full multi-Save/i, "Archived PROJECT_STATE must preserve formatVersion 2 multi-Save portability production truth.");
assert.match(historicalState, /explicit cross-Save\/historical manager identity linkage foundation/i, "Archived PROJECT_STATE must preserve shipped local manager identity semantics.");
assert.match(historicalState, /Cloud\/Sync Readiness Phase 1A merge:[\s\S]+b1fafd9cba7e2c647b88445026f6c2d1134378b1/i, "Archived PROJECT_STATE must record the exact PR #76 Phase 1A merge.");
assert.match(historicalState, /Cloud\/Sync Readiness Phase 1B merge:[\s\S]+2dc61e24ef07a0a150a228865f954ab3b3941398/i, "Archived PROJECT_STATE must record the exact PR #77 Phase 1B merge.");
assert.match(historicalState, /Cloud\/Sync Readiness Phase 1C merge:[\s\S]+59957f8b0c29ce0cd480a0e9270a095160005599/i, "Archived PROJECT_STATE must record the exact PR #78 Phase 1C merge.");
assert.match(historicalState, /Cloud\/Sync Readiness Phase 1D merge:[\s\S]+fc2e8e8b921a435103a438a9239efbb890584d22/i, "Archived PROJECT_STATE must record the exact PR #79 Phase 1D merge.");
assert.match(historicalState, /Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE/i, "Archived PROJECT_STATE must retain historical Phase 1D-to-1E provenance.");
assert.match(historicalState, /Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i, "Archived PROJECT_STATE must retain historical Phase 1F blocked-next provenance.");
assert.match(historicalState, /Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i, "Archived PROJECT_STATE must retain historical v1.5.0 candidate truth.");
assert.match(historicalState, /1\.4\.0-r2[\s\S]{0,220}production-proven runtime and immediate recovery target/i, "Archived PROJECT_STATE must retain the historical v1.4.0-r2 recovery boundary.");
assert.match(historicalState, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "Archived PROJECT_STATE must preserve owner-prioritized Remote Joining historical direction.");

assert.match(next, /CURRENT OVERRIDE — STAGE 4 RECONCILIATION PRODUCTION-PROVEN/i, "NEXT_TASK must expose current reconciliation-proven authority.");
assert.match(next, /Production runtime remains `1\.8\.1-r3`[\s\S]+does not change production runtime bytes/i, "NEXT_TASK must preserve the unchanged current r3 production runtime boundary for the completed proof-only predecessor lane.");
assert.match(next, /Candidate C (?:as|remains) the sole destructive (?:local )?Apply authority|Candidate C remains the sole destructive Apply authority/i, "NEXT_TASK must preserve destructive restore / Candidate C authority.");
assert.match(next, /Public discovery, community, matchmaking and global rankings remain prohibited/i, "NEXT_TASK must retain the permanent public community/discovery prohibition.");
assert.match(next, /STAGE 5 STILL LOCKED|Stage 5 host\/join\/session orchestration remains locked/i, "NEXT_TASK must preserve the Stage 5 lock.");
assert.match(next, /exact accepted-result idempotency replay[\s\S]+evidence-proven/i, "NEXT_TASK must preserve exact replay as a closed evidence-backed boundary.");
assert.match(next, /deterministic adverse-provider[\s\S]+canonical local Save Library fixture remains byte-for-byte unchanged/i, "NEXT_TASK must preserve deterministic adverse-provider local-save safety as closed evidence.");
assert.match(next, /Production-negative authorization audit result[\s\S]+authenticated third-account[\s\S]+revoked registered-device[\s\S]+legitimate authenticated production identity\/device state/i, "NEXT_TASK must preserve the blocked production authorization dependency without synthetic proof.");
assert.match(next, /token-lifecycle hardening[\s\S]+token auto-refresh[\s\S]+expiry\/refresh transition[\s\S]+proven/i, "NEXT_TASK must preserve token lifecycle as an evidence-proven bounded capability.");
assert.match(next, /IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+Finish PR #160[\s\S]+publication/i, "NEXT_TASK must route the current bounded lane into PR #160 publication rather than repeating proof.");
assert.match(next, /Two-physical-network behavior remains separately uncredited/i, "NEXT_TASK must keep real two-network proof separately uncredited.");

assert.match(historicalNext, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "Archived NEXT_TASK must name the closed multi-Save PR #67 milestone.");
assert.match(historicalNext, /Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i, "Archived NEXT_TASK must identify the historical v1.5.0 / 1.5.0-r1 product candidate.");
assert.match(historicalNext, /Current authorized prerequisite candidate[\s\S]+Cloud\/Sync Readiness Phase 1E/i, "Archived NEXT_TASK must retain Phase 1E prerequisite provenance.");
assert.match(historicalNext, /Next prerequisite after Phase 1E merges[\s\S]+Cloud\/Sync Readiness Phase 1F/i, "Archived NEXT_TASK must retain the historical Phase 1E-to-1F progression.");
assert.match(historicalNext, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i, "Archived NEXT_TASK must retain the historical provider-runtime gate.");
assert.match(historicalNext, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i, "Archived NEXT_TASK must retain the permanent ELIMINATED public community lock.");
assert.match(historicalNext, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i, "Archived NEXT_TASK must preserve Private Remote Joining historical prioritization.");
assert.match(historicalNext, /Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session capability[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i, "Archived NEXT_TASK must preserve the ordered Remote Joining prerequisite chain.");

for(const term of ["baseRevision", "tombstone", "compare-and-swap", "deviceId", "accountId"]){
  assert.ok(cloud.includes(term), `Cloud foundation lost required Remote Joining prerequisite term: ${term}`);
}
assert.match(cloud, /only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i, "Cloud foundation must prohibit rushing Remote Joining before its prerequisite gates pass.");
assert.match(remotePriority, /next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i, "Owner amendment must preserve the long-term priority rule once the networked roadmap lane is opened.");

assert.match(provider, /Select Firebase as the primary provider candidate/i, "Provider decision must name Firebase as a candidate rather than silently adding a backend.");
assert.match(provider, /Do not enable Firestore persistent offline cache/i, "Provider decision must reject Firestore last-write-wins offline persistence.");
assert.match(provider, /This is a provider decision, not an instruction to connect Firebase/i, "Provider selection must retain its historical original boundary.");
assert.match(privacy, /data minimization/i, "Phase 1C must make remote data minimization an explicit product rule.");
assert.match(privacy, /unshared Save Library Saves/i, "Phase 1C must keep unshared Saves local-only by default.");
assert.match(privacy, /Tombstones must not retain deleted gameplay content/i, "Phase 1C tombstones must remain deletion authority, not backups.");
assert.match(privacy, /Optional Private Cloud Backup remains a separate future opt-in product/i, "Phase 1C must not conflate Remote Joining sync with Cloud Backup.");
assert.match(remoteContract, /deny-by-default/i, "Phase 1D must lock deny-by-default provider authorization before provider connection.");
assert.match(remoteContract, /may never replace or refresh the original client's `baseRevision`/i, "Phase 1D must preserve immutable client intent across provider retries.");
assert.match(remoteContract, /One account deletes its account while the second remains[\s\S]+do not destroy shared gameplay data/i, "Phase 1D must resolve two-owner account deletion without destroying the survivor's entitlement.");
assert.match(phase1e, /recursively frozen/i, "Phase 1E must protect the complete queued intent, not only its revision number.");
assert.match(phase1e, /long-offline stale device cannot resurrect/i, "Phase 1E must prove anti-resurrection after offline reconnect.");
assert.match(phase1e, /rollback refuses to overwrite those newer bytes/i, "Phase 1E local Apply proof must preserve Candidate C ownership-scoped rollback anti-clobber semantics.");
assert.match(phase1e, /Phase 1F remains blocked/i, "Historical Phase 1E authority must preserve its original provider-integration gate.");
assert.doesNotMatch(harness, /\blocalStorage\b|\bfetch\s*\(|firebase|firestore/i, "Phase 1E harness must remain provider/network/browser-storage neutral.");
assert.match(phase1eTest, /Object\.isFrozen\(a1\.intent\.content\)/, "Permanent Phase 1E tests must prove recursively immutable offline intent payloads.");
assert.match(phase1eTest, /rollback-failed-critical[\s\S]+rollbackOwnershipConflicts/i, "Permanent Phase 1E tests must prove rollback ownership loss cannot clobber newer local state.");
assert.match(remoteRoadmap, /Phase 1A[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1B[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1C[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE[\s\S]+Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i, "Detailed Remote Joining roadmap must preserve exact staged Cloud Readiness provenance.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write(`PASS Cloud/Sync authority: production-proven r3 reconciliation, evidence-proven exact replay, deterministic adverse-provider and token-lifecycle safety with RJR${readiness.currentScore} remain explicit while immutable pre-r3 archives protect early Cloud Readiness provenance, recovery/privacy locks and the ordered Remote Joining foundation.\n`);
