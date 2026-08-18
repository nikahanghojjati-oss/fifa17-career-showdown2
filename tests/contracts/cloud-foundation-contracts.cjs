const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const restore = read("js/restore.js");
const transaction = read("js/storageTransaction.js");
const storage = read("js/storage.js");

assert.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
assert.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must retain the production-proven cross-Save manager identity prerequisite.");
assert.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record Identity-Safe Career Analytics as shipped production truth.");
assert.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow Analytics identity layer without authorizing broader Analytics 2.0.");
assert.match(roadmap, /Cloud Readiness \| FUTURE \/ NOT AUTHORIZED/i, "Completing local Analytics must not silently authorize Cloud Readiness.");
assert.match(roadmap, /Cloud Backup \| BLOCKED/i, "Cloud Backup must remain blocked behind Cloud Readiness and remote-system prerequisites.");

assert.match(state, /formatVersion 2 is live|formatVersion 2 full multi-Save/i, "PROJECT_STATE must record formatVersion 2 multi-Save portability as live production truth.");
assert.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must distinguish shipped local manager identity semantics from future cloud identity.");
assert.match(state, /No product candidate is currently authorized|formatVersion 2 is live|Phase C first slice/i, "PROJECT_STATE must retain multi-Save closed state and Phase C seal.");

assert.match(next, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "NEXT_TASK must name the closed multi-Save (PR #67) milestone.");
assert.match(next, /No product candidate is currently authorized|Authorized product candidate:\s*none/i, "NEXT_TASK must hold clean stop after Phase C seal while keeping multi-Save closed.");
assert.match(next, /Cloud Readiness[\s\S]+(None of the future areas above is implementation-authorized|still BLOCKED|Out of scope for this authorization|Out of scope until a later explicit owner instruction)/i, "NEXT_TASK must keep Cloud Readiness and later network work outside the current authorization boundary.");
assert.match(next, /strict exact raw snapshot authority|Candidate C remains the only destructive/i, "NEXT_TASK must preserve destructive restore / Candidate C snapshot authority while cloud remains future work.");
assert.match(next, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i, "NEXT_TASK must retain the permanent ELIMINATED public community lock.");

assert.ok(!/\bfetch\s*\(/.test(restore), "Candidate C restore remains network-free.");
assert.ok(!/\blocalStorage\b/.test(transaction), "Transaction state machine must remain storage-backend agnostic.");
assert.ok(storage.includes("applyCareerModeRawStorageTransaction"), "Canonical local transaction authority must remain in js/storage.js.");
assert.ok(transaction.includes("preconditionMismatches"), "Future revision-safe sync depends on permanent local precondition semantics.");
assert.ok(transaction.includes("rollbackOwnershipConflicts"), "Future revision-safe sync depends on permanent rollback ownership semantics.");

process.stdout.write("PASS future cloud contract preserves shipped local identity, recovery authority, closed multi-Save (PR #67), closed Phase C first slice, visible v1.4.0 seal and cloud security/revision boundaries\n");
