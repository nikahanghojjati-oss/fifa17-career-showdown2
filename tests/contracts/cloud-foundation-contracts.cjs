const assert = require("node:assert/strict");
const fs = require("node:fs");

const cloud = fs.readFileSync("CLOUD_STORAGE_FOUNDATION.md", "utf8");
const roadmap = fs.readFileSync("POST_V1_ROADMAP_EXECUTION.md", "utf8");
const restore = fs.readFileSync("js/restore.js", "utf8");
const transaction = fs.readFileSync("js/storageTransaction.js", "utf8");
const storage = fs.readFileSync("js/storage.js", "utf8");

const requiredCloudTerms = [
    "accountId", "profileId", "saveId", "deviceId", "installationId",
    "baseRevision", "parentRevision", "contentHash", "compare-and-swap",
    "silent last-write-wins", "tombstone", "anti-resurrection",
    "local-first", "opt-in", "HTTPS/TLS", "least-privilege",
    "idempotency", "rate limiting", "authorization", "localStorage"
];
for(const term of requiredCloudTerms){
    assert.ok(cloud.toLowerCase().includes(term.toLowerCase()), `Cloud foundation must explicitly define ${term}.`);
}
assert.match(cloud, /SHA-256[^\n]+integrity[^\n]+not authentication/i, "Backup SHA-256 must not be confused with remote authentication.");
assert.match(cloud, /No future cloud module may call localStorage directly/i, "Future cloud writes must stay behind canonical persistence authority.");
assert.match(cloud, /Cloud Readiness[\s\S]+Cloud Backup Beta/i, "Cloud implementation must retain readiness before backup beta.");
assert.match(cloud, /v1\.2\.0[^\n]+production-proven[\s\S]+v1\.3\.0[^\n]+Recovery[^\n]+Device Resilience Hardening/i, "Cloud foundation must recognize the current local production and maintenance boundary.");

function position(source, expression, label){
    const match = source.match(expression);
    assert.ok(match, `Roadmap is missing ${label}.`);
    return match.index;
}
const offlineIndex = position(roadmap, /v1\.2\.0[^\n]+Installable Offline App/i, "v1.2 Installable Offline App");
const hardeningIndex = position(roadmap, /v1\.3\.0[^\n]+Recovery[^\n]+Device Resilience Hardening/i, "v1.3 Recovery & Device Resilience Hardening");
const profilesIndex = position(roadmap, /Local Profiles and Save Library[^\n]+future feature milestone/i, "future Local Profiles and Save Library milestone");
const cloudReadinessIndex = position(roadmap, /Cloud Readiness:/i, "Cloud Readiness");
const cloudBackupIndex = position(roadmap, /Cloud Backup Beta:/i, "Cloud Backup Beta");
assert.ok(offlineIndex < hardeningIndex, "Recovery/device hardening must follow the proven offline application.");
assert.ok(hardeningIndex < profilesIndex, "Stable local profile/save identity must not begin before v1.3 recovery hardening.");
assert.ok(profilesIndex < cloudReadinessIndex, "Local profile/save identity must remain ahead of Cloud Readiness.");
assert.ok(cloudReadinessIndex < cloudBackupIndex, "Cloud Readiness must remain ahead of Cloud Backup Beta.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS  future cloud identity/security foundation and semantic local-first dependency order contracts\n");
