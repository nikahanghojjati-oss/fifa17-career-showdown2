const assert = require("node:assert/strict");
const fs = require("node:fs");

const cloud = fs.readFileSync("CLOUD_STORAGE_FOUNDATION.md", "utf8");
const roadmap = fs.readFileSync("POST_V1_ROADMAP_EXECUTION.md", "utf8");
const state = fs.readFileSync("PROJECT_STATE.md", "utf8");
const next = fs.readFileSync("NEXT_TASK.md", "utf8");
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
assert.match(cloud, /v1\.3\.0 Recovery & Device Resilience Hardening[\s\S]+Local Profiles\/Save Library[\s\S]+Cloud Readiness[\s\S]+opt-in Cloud Backup/i, "Cloud implementation must remain behind resilience and the completed stable local identity/Save Library dependency.");
assert.match(cloud, /Local Profiles\/Save Library is a completed production dependency milestone/i, "Cloud foundation must acknowledge that Local Profiles/Save Library is already shipped.");
assert.match(cloud, /does not authorize[^\n]+cloud UI in the current local-first product/i, "The cloud contract must remain non-authorizing after the local dependency shipped.");
assert.match(cloud, /Historical roadmap versions[^\n]+planning references only/i, "Historical cloud version numbers must remain non-authoritative.");
assert.match(cloud, /It is no longer future work[^\n]+next structural direction/i, "Cloud foundation must explicitly retire its stale pre-Save-Library current-facing narration.");
assert.ok(!/Local Profiles\/Save Library must follow before Cloud Readiness/i.test(cloud), "Cloud foundation must not describe the shipped Save Library milestone as still pending.");
assert.ok(!/Local Profiles\/Save Library remains the next approved structural direction after v1\.3/i.test(cloud), "Cloud foundation must not revive the obsolete next-feature description.");

assert.match(roadmap, /Current milestone — v1\.3\.0 Recovery & Device Resilience Hardening[\s\S]+Local Profiles and Save Library — completed dependency milestone, feature version unassigned[\s\S]+Cloud Readiness[\s\S]+Cloud Backup/i, "Repository roadmap must keep resilience, completed local identity/Save Library, Cloud Readiness and Cloud Backup in semantic dependency order without inventing release version numbers.");
assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must record shipped explicit historical mapping while retaining unresolved identity as a valid state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must record the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| AUTHORIZED \/ IN PROGRESS/i, "Roadmap must reflect the owner's narrow Analytics authorization without implying the candidate is already production-proven.");
assert.match(roadmap, /Cloud Readiness \| FUTURE \/ NOT AUTHORIZED/i, "Authorizing local Analytics must not silently authorize Cloud Readiness.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain blocked behind Cloud Readiness and remote-system prerequisites.");
assert.match(state, /Career-level aggregation is not yet identity-authoritative across all Saves\/history/i, "PROJECT_STATE must continue to record production Analytics truth until the branch candidate is merged and proven.");
assert.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must distinguish shipped local manager identity semantics from future cloud identity.");
assert.match(next, /Current owner-authorized candidate/i, "NEXT_TASK must record the owner's explicit Analytics authorization.");
assert.match(next, /identity-safe longitudinal Career Analytics correction/i, "NEXT_TASK must keep the current Analytics correction narrowly bounded from cloud work.");
assert.match(next, /Do not expand this candidate into cloud storage/i, "The active Analytics task must keep cloud runtime out of scope.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS future cloud contract preserves shipped local identity, unresolved-history honesty and cloud security/revision boundaries while the separately authorized local Career Analytics candidate remains in progress\n");
