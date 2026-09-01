const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path,"utf8");
const runtime=read("js/productionFirebaseRuntime.js");
const rivalry=read("js/sparkConnectedRivalry.js");
const rules=read("firestore.spark.rules");

assert.match(runtime,/FALLBACK_RUNTIME_REVISION="1\.8\.1-r5"/);
assert.match(runtime,/serverTimestamp:firestoreModule\.serverTimestamp/);
assert.match(runtime,/"memoryLocalCache","serverTimestamp","doc","runTransaction"/);
assert.match(runtime,/firestoreSdk:Object\.freeze\(\{Timestamp:sdk\.Timestamp,serverTimestamp:sdk\.serverTimestamp,doc:sdk\.doc,runTransaction:sdk\.runTransaction\}\)/);
assert.match(runtime,/persistentFirestoreCache:false/);
assert.match(runtime,/authPersistence:"browserSessionPersistence"/);
assert.match(runtime,/enforcementEnabled:false/);
assert.match(runtime,/billingRequired:false/);

assert.match(rivalry,/const stateUpdatedAt=typeof options\.firebaseSdk\.serverTimestamp==="function"/);
assert.match(rivalry,/\? options\.firebaseSdk\.serverTimestamp\(\)/);
assert.match(rivalry,/updatedAt:stateUpdatedAt/);
assert.match(rivalry,/createdAt:now/);
assert.match(rivalry,/remoteJoiningSessions:false/);
assert.match(rivalry,/canonicalStorageKeys:CR_CANONICAL_KEYS/);

assert.match(rules,/function validSharedStateMutationTiming\(before, after\)/);
assert.match(rules,/before\.revision < 2/);
assert.match(rules,/before\.revision == 2/);
assert.match(rules,/after\.updatedAt == request\.time/);
assert.match(rules,/request\.time >= before\.updatedAt \+ duration\.value\(2, 's'\)/);
assert.match(rules,/&& validSharedStateMutationTiming\(before, after\)/);
assert.match(rules,/match \/sessions\/\{sessionId\}[\s\S]*?allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]*?allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]*?allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]*?allow list, delete: if false;/);

for(const key of [
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
])assert.ok(rivalry.includes(`"${key}"`),`Canonical key missing: ${key}`);
assert.equal(rivalry.includes("activeShowdown"),false,"activeShowdown must not become canonical storage.");

process.stdout.write("PASS Stage 4 sustained mutation-frequency hardening contracts: r5 exposes Firestore server time, authoritative shared-state updates anchor to it, sustained revisions are bounded after the revision-3 warmup, and Stage 5D sessions remain exact-path/no-list/no-delete without changing Stage 4 runtime ownership.\n");
