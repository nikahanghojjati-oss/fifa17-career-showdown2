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
assert.match(cloud, /does not authorize[^\n]+cloud UI in the current local-first product/i, "The cloud contract must remain non-authorizing after the local dependencies shipped.");
assert.match(cloud, /Historical roadmap versions[^\n]+planning references only/i, "Historical cloud version numbers must remain non-authoritative.");
assert.match(cloud, /It is no longer future work[^\n]+next structural direction/i, "Cloud foundation must explicitly retire its stale pre-Save-Library current-facing narration.");
assert.ok(!/Local Profiles\/Save Library must follow before Cloud Readiness/i.test(cloud), "Cloud foundation must not describe the shipped Save Library milestone as still pending.");
assert.ok(!/Local Profiles\/Save Library remains the next approved structural direction after v1\.3/i.test(cloud), "Cloud foundation must not revive the obsolete next-feature description.");

assert.match(roadmap, /Current milestone — v1\.3\.0 Recovery & Device Resilience Hardening[\s\S]+Local Profiles and Save Library — completed dependency milestone, feature version unassigned[\s\S]+Cloud Readiness[\s\S]+Cloud Backup/i, "Repository roadmap must keep resilience, completed local identity/Save Library, Cloud Readiness and Cloud Backup in semantic dependency order without inventing release version numbers.");
assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must retain unresolved historical identity as a valid shipped state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must retain the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record Identity-Safe Career Analytics as shipped production truth.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow Analytics identity layer without authorizing broader Analytics 2.0.");
assert.match(roadmap, /Cloud Readiness \| FUTURE \/ NOT AUTHORIZED/i, "Completing local Analytics must not silently authorize Cloud Readiness.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain blocked behind Cloud Readiness and remote-system prerequisites.");

assert.match(state, /Identity-Safe Career Analytics is therefore merged, deployed, exact-byte verified and technically production-proven/i, "PROJECT_STATE must record the proven local Analytics layer before any future cloud work.");
assert.match(state, /unresolved historical manager roles remaining explicit and never guessed from name similarity/i, "PROJECT_STATE must preserve unresolved-history honesty after Analytics promotion.");
assert.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must distinguish shipped local manager identity semantics from future cloud identity.");
assert.match(next, /No new substantial runtime product candidate is authorized/i, "NEXT_TASK must close the production-proven label candidate without turning completion into implicit Cloud authorization.");
assert.match(next, /Cloud Readiness[\s\S]+None of the future areas above is implementation-authorized/i, "NEXT_TASK must keep Cloud Readiness and later network work outside the current authorization boundary.");
assert.match(next, /strict exact raw snapshot authority/i, "NEXT_TASK must preserve destructive restore snapshot authority while cloud remains future work.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS future cloud contract preserves shipped local identity, production-proven display-label editing, unresolved-history honesty, recovery authority and cloud security/revision boundaries at a clean stop\n");
