const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path,"utf8");
const readJson=path=>JSON.parse(read(path));
const gitBlobSha=source=>crypto.createHash("sha1")
  .update(`blob ${Buffer.byteLength(source)}\0`)
  .update(source)
  .digest("hex");

const productionRules=read("firestore.spark.rules");
const provenStage5cRules=read("firestore.stage5c.rules");
const rootFirebase=readJson("firebase.json");
const productionFirebase=readJson("firebase.production.rules.json");
const productionEnvironment=readJson("firebase.production.environment.json");
const adapter=read("js/sparkStandardAuthPrivateSession.js");
const zeroBillingAuthorization=read("00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md");
const zeroBillingDecision=read("ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md");
const stage5dProof=read("STAGE5D_MINIMUM_PRODUCTION_SESSION_RULES_GATE_PROOF_2026-09-01.md");

assert.equal(productionRules,provenStage5cRules,
  "The Stage 5D production Rules source must be the exact already-emulator-proven Stage 5C Rules bytes.");
assert.equal(gitBlobSha(productionRules),"363af783d7e5436fdfaa3766d4aa413fc9952a08",
  "The reviewed minimum production session Rules source must preserve the exact Stage 5C blob lineage.");

for(const invariant of [
  /STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+registeredSessionDeviceMetadata[\s\S]+validOpenSessionCreate[\s\S]+validSessionJoin[\s\S]+validSessionUpdate[\s\S]+STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END/,
  /sessionWriteUsesRegisteredDeviceMetadata\(root\)[\s\S]+root\.updatedByAccountId == request\.auth\.uid[\s\S]+registeredSessionDeviceMetadata\(root\.updatedByDeviceId\)/,
  /match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/,
  /match \/\{document=\*\*\} \{[\s\S]+allow read, write: if false;/
]) assert.match(productionRules,invariant);

assert.doesNotMatch(productionRules,/request\.auth\.token\.device_|deviceCredentials/,
  "Production session Rules must use ordinary Firebase uid authority, not Stage 5B custom device claims.");
assert.doesNotMatch(productionRules,/allow list: if true|allow read, write: if true/,
  "The production Rules promotion must not introduce discovery or an allow-all escape hatch.");
assert.doesNotMatch(adapter,/\blocalStorage\b|\bindexedDB\b|\bcollection\s*\(|\bgetDocs\b/,
  "The dormant adapter must remain exact-path, memory-only and free of new browser storage authority.");

assert.equal(rootFirebase.firestore.rules,"firestore.rules",
  "The Phase 1F/emulator root config must remain isolated from production publication.");
assert.equal(productionFirebase.firestore.rules,"firestore.spark.rules",
  "The isolated production deployment config must target the promoted Rules source only.");
assert.equal(productionEnvironment.projectId,"fifa17-career-showdown-prod");
assert.equal(productionEnvironment.firestore.databaseId,"(default)");
assert.equal(productionEnvironment.activation.productionSecurityRulesSourceBlobSha,"2b7c0b166ae0aae7ab7a3ce84725b21091262484",
  "Until a new provider publication is independently proven, the manifest must continue to record the previously provider-proven deployed blob rather than fabricate activation.");

for(const runtimeOwner of ["index.html","js/app.js","js/productionFirebaseRuntime.js"]){
  assert.doesNotMatch(read(runtimeOwner),/sparkStandardAuthPrivateSession\.js/,
    `${runtimeOwner} must not directly bootstrap host/join runtime during ordinary startup.`);
}
const stage5eWorker=read("service-worker.js");
assert.match(stage5eWorker,/"js\/sparkStandardAuthPrivateSession\.js"/,
  "The separate Stage 5E runtime slice may precache the already-reviewed standard-auth adapter after Stage 5D provider publication without executing it during ordinary startup.");

assert.match(zeroBillingAuthorization,/billing must never be activated/i);
assert.match(zeroBillingAuthorization,/Firebase Spark/i);
assert.match(zeroBillingDecision,/Publish the minimum reviewed session Rules only after exact-head gates pass/i);
assert.match(zeroBillingDecision,/then add host\/join UX in a separate reviewed runtime slice/i);
assert.match(stage5dProof,/Codex remains the preferred final-head automated reviewer/i);
assert.match(stage5dProof,/purchasing credits or enabling paid review is forbidden/i);
assert.match(stage5dProof,/documented exact-head fallback review[\s\S]+audits the complete PR diff[\s\S]+all 14 exact-head workflow families[\s\S]+Java 21 Stage 5 emulator lane[\s\S]+zero valid unresolved review threads/i,
  "A paid code-review quota may not force billing or silently waive the mandatory review/thread gate.");
assert.match(stage5dProof,/A quota refusal by itself is never a passing review and never earns RJR credit/i);

process.stdout.write("PASS Stage 5D production session Rules: exact Stage 5C bytes promoted into the isolated production Rules source; standard Firebase uid authority, no listing, exactly-two-account lifecycle, mutation-only registered-device metadata, deny-by-default, zero-billing review fallback and runtime separation remain locked.\n");
