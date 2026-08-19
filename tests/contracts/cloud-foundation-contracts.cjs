const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
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
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E CURRENT \/ 1F NEXT/i, "Roadmap must advance the active Cloud Readiness lane through merged Phase 1D, current Phase 1E and blocked-next Phase 1F while keeping provider runtime gated.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain separately gated behind Cloud Readiness and its own remote-system prerequisites.");
assert.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must prioritize Remote Joining without skipping prerequisite authorization.");

assert.match(state, /formatVersion 2 is live|formatVersion 2 full multi-Save/i, "PROJECT_STATE must record formatVersion 2 multi-Save portability as live production truth.");
assert.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must distinguish shipped local manager identity semantics from future cloud identity.");
assert.match(state, /Cloud\/Sync Readiness Phase 1A merge:[\s\S]+b1fafd9cba7e2c647b88445026f6c2d1134378b1/i, "PROJECT_STATE must record the exact PR #76 Phase 1A merge.");
assert.match(state, /Cloud\/Sync Readiness Phase 1B merge:[\s\S]+2dc61e24ef07a0a150a228865f954ab3b3941398/i, "PROJECT_STATE must record the exact PR #77 Phase 1B merge.");
assert.match(state, /Cloud\/Sync Readiness Phase 1C merge:[\s\S]+59957f8b0c29ce0cd480a0e9270a095160005599/i, "PROJECT_STATE must record the exact PR #78 Phase 1C merge.");
assert.match(state, /Cloud\/Sync Readiness Phase 1D merge:[\s\S]+fc2e8e8b921a435103a438a9239efbb890584d22/i, "PROJECT_STATE must record the exact PR #79 Phase 1D merge.");
assert.match(state, /Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE/i, "PROJECT_STATE must close Phase 1D and identify Phase 1E as the active deterministic harness candidate.");
assert.match(state, /Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i, "PROJECT_STATE must keep Phase 1F blocked until Phase 1E is merged and proven.");
assert.match(state, /No product candidate is currently authorized/i, "PROJECT_STATE must keep production runtime gated while architecture prerequisites advance.");
assert.match(state, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "PROJECT_STATE must preserve the owner-prioritized Remote Joining direction without current runtime authorization.");

assert.match(next, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "NEXT_TASK must name the closed multi-Save (PR #67) milestone.");
assert.match(next, /Authorized product candidate:\*\* none|Authorized product candidate:\s*none/i, "NEXT_TASK must keep user-facing runtime product work gated.");
assert.match(next, /Current authorized prerequisite candidate[\s\S]+Cloud\/Sync Readiness Phase 1E/i, "NEXT_TASK must keep Phase 1E as the bounded current deterministic prerequisite.");
assert.match(next, /Next prerequisite after Phase 1E merges[\s\S]+Cloud\/Sync Readiness Phase 1F/i, "NEXT_TASK must advance exactly to Phase 1F only after Phase 1E proves clean.");
assert.match(next, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i, "NEXT_TASK must keep provider/network production runtime outside the current authorization boundary.");
assert.match(next, /strict exact raw snapshot authority|Candidate C remains the sole destructive/i, "NEXT_TASK must preserve destructive restore / Candidate C snapshot authority while cloud prerequisites advance.");
assert.match(next, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i, "NEXT_TASK must retain the permanent ELIMINATED public community lock.");
assert.match(next, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i, "NEXT_TASK must preserve Private Remote Joining as prioritized long-term while still dependency-gated and not runtime-authorized.");
assert.match(next, /Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session capability[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i, "NEXT_TASK must preserve the ordered Remote Joining prerequisite chain independently of where the priority classification is rendered.");

for(const term of ["baseRevision", "tombstone", "compare-and-swap", "deviceId", "accountId"]){
  assert.ok(cloud.includes(term), `Cloud foundation lost required Remote Joining prerequisite term: ${term}`);
}
assert.match(cloud, /only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i, "Cloud foundation must prohibit rushing Remote Joining before its prerequisite gates pass.");
assert.match(remotePriority, /next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i, "Owner amendment must preserve the long-term priority rule once the networked roadmap lane is opened.");

assert.match(provider, /Select Firebase as the primary provider candidate/i, "Provider decision must name Firebase as a candidate rather than silently adding a backend.");
assert.match(provider, /Do not enable Firestore persistent offline cache/i, "Provider decision must reject Firestore last-write-wins offline persistence.");
assert.match(provider, /This is a provider decision, not an instruction to connect Firebase/i, "Provider selection must not authorize provider runtime.");
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
assert.match(phase1e, /Phase 1F remains blocked/i, "Phase 1E authority must keep provider integration blocked until the deterministic harness gate is complete.");
assert.doesNotMatch(harness, /\blocalStorage\b|\bfetch\s*\(|firebase|firestore/i, "Phase 1E harness must remain provider/network/browser-storage neutral.");
assert.match(phase1eTest, /Object\.isFrozen\(a1\.intent\.content\)/, "Permanent Phase 1E tests must prove recursively immutable offline intent payloads.");
assert.match(phase1eTest, /rollback-failed-critical[\s\S]+rollbackOwnershipConflicts/i, "Permanent Phase 1E tests must prove rollback ownership loss cannot clobber newer local state.");
assert.match(remoteRoadmap, /Phase 1A[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1B[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1C[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1D[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1E[\s\S]+CURRENT BOUNDED CANDIDATE[\s\S]+Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i, "Detailed Remote Joining roadmap must reflect exact staged Cloud Readiness progression through completed Phase 1D, current Phase 1E and blocked-next Phase 1F.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS Cloud/Sync Readiness authority: Phases 1A/1B/1C/1D proven, Phase 1E current deterministic harness, Phase 1F blocked-next, provider runtime gated, recovery/privacy and Remote Joining dependency locks preserved\n");
