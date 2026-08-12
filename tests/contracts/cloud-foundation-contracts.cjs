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
assert.match(cloud, /v1\.8\.0 Cloud Readiness[\s\S]+v1\.9\.0 Cloud Backup Beta/i, "Cloud implementation must retain the approved dependency order.");
assert.match(cloud, /next legal substantive milestone remains v1\.2\.0 Installable Offline App/i, "The cloud contract must not authorize a roadmap jump from maintenance.");

assert.match(roadmap, /v1\.2\.0 Installable Offline App[\s\S]+v1\.3\.0 Local Profiles and Save Library[\s\S]+v1\.8\.0 Cloud Readiness[\s\S]+v1\.9\.0 Cloud Backup Beta/i, "Repository roadmap must keep local recovery/offline/identity ahead of cloud beta.");
assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS  future cloud identity, revision, conflict, tombstone, privacy and security foundation contracts\n");
