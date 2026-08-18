const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
const provider = read("CLOUD_PROVIDER_DECISION_2026-08-17.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const restore = read("js/restore.js");
const transaction = read("js/storageTransaction.js");
const storage = read("js/storage.js");

assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must retain the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record Identity-Safe Career Analytics as shipped production truth.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow Analytics identity layer without authorizing broader Analytics 2.0.");
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B PROVIDER DECISION COMPLETE \/ 1C NEXT/i, "Roadmap must advance Cloud Readiness through the proven deterministic model and bounded provider decision without authorizing runtime.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain separately gated behind Cloud Readiness and its own remote-system prerequisites.");
assert.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must prioritize Remote Joining without skipping prerequisite authorization.");

assert.match(state, /formatVersion 2 is live|formatVersion 2 full multi-Save/i, "PROJECT_STATE must record formatVersion 2 multi-Save portability as live production truth.");
assert.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must distinguish shipped local manager identity semantics from future cloud identity.");
assert.match(state, /Cloud\/Sync Readiness Phase 1A merge:[\s\S]+b1fafd9cba7e2c647b88445026f6c2d1134378b1/i, "PROJECT_STATE must record the exact PR #76 Phase 1A merge.");
assert.match(state, /No product candidate is currently authorized/i, "PROJECT_STATE must keep production runtime gated while architecture prerequisites advance.");
assert.match(state, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "PROJECT_STATE must preserve the owner-prioritized Remote Joining direction without current runtime authorization.");

assert.match(next, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "NEXT_TASK must name the closed multi-Save (PR #67) milestone.");
assert.match(next, /Authorized product candidate:\*\* none|Authorized product candidate:\s*none/i, "NEXT_TASK must keep user-facing runtime product work gated.");
assert.match(next, /Cloud\/Sync Readiness Phase 1C[\s\S]+private remote data inventory, privacy and retention policy/i, "NEXT_TASK must authorize exactly the next architecture prerequisite after the provider decision.");
assert.match(next, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i, "NEXT_TASK must keep provider/network runtime outside the current authorization boundary.");
assert.match(next, /strict exact raw snapshot authority|Candidate C remains the sole destructive/i, "NEXT_TASK must preserve destructive restore / Candidate C snapshot authority while cloud prerequisites advance.");
assert.match(next, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i, "NEXT_TASK must retain the permanent ELIMINATED public community lock.");
assert.match(next, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+Cloud \/ synchronization readiness[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i, "NEXT_TASK must preserve the prioritized Remote Joining prerequisite chain.");

for(const term of ["baseRevision", "tombstone", "compare-and-swap", "deviceId", "accountId"]){
  assert.ok(cloud.includes(term), `Cloud foundation lost required Remote Joining prerequisite term: ${term}`);
}
assert.match(cloud, /only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i, "Cloud foundation must prohibit rushing Remote Joining before its prerequisite gates pass.");
assert.match(remotePriority, /next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i, "Owner amendment must preserve the long-term priority rule once the networked roadmap lane is opened.");

assert.match(provider, /Select Firebase as the primary provider candidate/i, "Provider decision must name Firebase as a candidate rather than silently adding a backend.");
assert.match(provider, /Do not enable Firestore persistent offline cache/i, "Provider decision must reject Firestore last-write-wins offline persistence.");
assert.match(provider, /This is a provider decision, not an instruction to connect Firebase/i, "Provider selection must not authorize provider runtime.");
assert.match(remoteRoadmap, /Phase 1A[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+Phase 1B[\s\S]+DECISION COMPLETE[\s\S]+Phase 1C[\s\S]+AUTHORIZED NEXT PREREQUISITE/i, "Detailed Remote Joining roadmap must reflect the exact staged Cloud Readiness progression.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS Cloud/Sync Readiness authority: Phase 1A proven, Phase 1B provider decision bounded, Phase 1C next, runtime gated, recovery and Remote Joining dependency locks preserved\n");
