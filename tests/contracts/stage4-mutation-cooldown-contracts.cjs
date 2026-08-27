const assert=require("node:assert/strict");
const fs=require("node:fs");

const runtime=fs.readFileSync("js/productionFirebaseRuntime.js","utf8");
const rivalry=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
const rules=fs.readFileSync("firestore.spark.rules","utf8");
const emulator=fs.readFileSync("tests/firebase/stage4-mutation-cooldown-emulator.cjs","utf8");
const workflow=fs.readFileSync(".github/workflows/validate-stage3-private-pairing.yml","utf8");

assert.match(runtime,/serverTimestamp:firestoreModule\.serverTimestamp/i,"Production Firebase runtime must expose Firestore serverTimestamp to Connected Rivalry.");
assert.match(runtime,/firestoreSdk:Object\.freeze\(\{Timestamp:sdk\.Timestamp,serverTimestamp:sdk\.serverTimestamp,doc:sdk\.doc,runTransaction:sdk\.runTransaction\}\)/i,"Connected browser services must preserve the bounded Firestore SDK surface while adding only serverTimestamp.");
assert.match(runtime,/persistentFirestoreCache:false/i,"Mutation hardening must not activate persistent Firestore cache.");
assert.match(runtime,/billingRequired:false/i,"Mutation hardening must remain Firebase Spark/zero-billing compatible.");

assert.match(rivalry,/stateUpdatedAt=typeof options\.firebaseSdk\.serverTimestamp==="function"[\s\S]+options\.firebaseSdk\.serverTimestamp\(\)/i,"Authoritative shared-state writes must use Firestore server time when the production SDK provides it.");
assert.match(rivalry,/updatedAt:stateUpdatedAt/i,"Server-owned mutation time must be stored on the authoritative shared-state envelope.");
assert.match(rivalry,/if\(receiptSnapshot\.exists\(\)\)[\s\S]+status:"replayed"[\s\S]+const stateExists=stateSnapshot\.exists\(\)/i,"Exact accepted-result replay must remain resolved before any new shared-state mutation write or cooldown gate.");

assert.match(rules,/validSharedStateCreate\(rivalryId\)[\s\S]+after\.updatedAt == request\.time/i,"Initial authoritative shared-state creation must anchor updatedAt to provider request time.");
assert.match(rules,/validSharedStateUpdate\(rivalryId\)[\s\S]+after\.updatedAt == request\.time[\s\S]+request\.time >= before\.updatedAt \+ duration\.value\(2, 's'\)/i,"Distinct authoritative revisions must be separated by at least two seconds of provider-owned time.");
assert.match(rules,/activePairedRivalry\(rivalryId\)[\s\S]+authorizedAccountIds\.size\(\) == 2/i,"Cooldown hardening must remain within the exactly-two-owner private rivalry boundary.");

assert.match(emulator,/tooFastPeer[\s\S]+permission-denied/i,"Permanent emulator proof must deny an immediate distinct peer mutation.");
assert.match(emulator,/replayDuringCooldown[\s\S]+status,"replayed"/i,"Permanent emulator proof must keep exact replay available during cooldown.");
assert.match(emulator,/wait\(COOLDOWN_WAIT_MS\)[\s\S]+acceptedAfterCooldown[\s\S]+revision,1/i,"Permanent emulator proof must accept exactly one monotonic revision after the cooldown expires.");
assert.match(emulator,/tooFastReturn[\s\S]+permission-denied/i,"Alternating entitled owners must not bypass the rivalry-wide cooldown.");
assert.match(emulator,/allocate no idempotency receipt|allocate no receipt/i,"Denied cooldown writes must allocate no idempotency receipt.");
assert.match(emulator,/must not alter canonical local saves|must not mutate canonical local saves/i,"Denied cooldown writes must leave canonical local saves unchanged.");
assert.match(workflow,/stage4-mutation-cooldown-contracts\.cjs/i,"Permanent Stage 3/4 workflow must execute mutation cooldown source contracts.");
assert.match(workflow,/stage4-mutation-cooldown-emulator\.cjs/i,"Permanent Stage 3/4 workflow must execute mutation cooldown Firestore emulator proof.");

process.stdout.write("PASS Stage 4 mutation cooldown contract: provider-owned authoritative timestamps enforce bounded rivalry-wide write frequency while exact replay, two-owner authority, Spark billing and canonical local storage remain unchanged\n");
