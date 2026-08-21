const assert=require("node:assert/strict");
const fs=require("node:fs");

const spark=require("../../js/sparkAccountBootstrap.js");
const moduleSource=fs.readFileSync("js/sparkAccountBootstrap.js","utf8");
const candidateRules=fs.readFileSync("firestore.spark.rules","utf8");
const deployedRules=fs.readFileSync("firestore.rules","utf8");
const workflow=fs.readFileSync(".github/workflows/validate-static-app.yml","utf8");
const readiness=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));

// Preserve the original zero-billing account-bootstrap module contract.
assert.equal(spark.contractVersion,1);
assert.equal(spark.providerMode,"firebase-spark-client");
assert.equal(spark.billingRequired,false);
assert.equal(spark.blazeRequired,false);
assert.equal(spark.cloudRunRequired,false);
assert.equal(spark.cloudFunctionsRequired,false);
assert.equal(spark.accountPath,"accounts/{uid}");
assert.equal(spark.writeScope,"self-account-create-only");
assert.equal(spark.storesSensitiveProfileData,false);
assert.equal(spark.productionActivated,false);
assert.equal(spark.remoteJoiningReadinessCredit,false);
assert.equal(typeof spark.bootstrap,"function");
assert.match(moduleSource,/runTransaction/);
assert.match(moduleSource,/transaction\.get/);
assert.match(moduleSource,/transaction\.set/);
assert.match(moduleSource,/accounts/);
assert.match(moduleSource,/SHA-256/);
assert.doesNotMatch(moduleSource,/firebase-admin|firebase-functions|Cloud Run|serviceAccount|private_key/i);
assert.doesNotMatch(moduleSource,/email\s*:|displayName\s*:|refreshToken|idToken|accessToken/i,"Spark account bootstrap must not persist profile or credential material.");

// Stage 3 may extend the separately reviewed Spark Rules candidate, but the original
// strict self-account create remains intact and semantic envelope validation may be
// factored into helpers rather than duplicated inline.
assert.match(candidateRules,/function validSelfAccountBootstrap\(accountId\)/);
assert.match(candidateRules,/request\.auth\.uid == accountId/);
assert.match(candidateRules,/validCreateEnvelope\(root, "account", accountId\)/);
assert.match(candidateRules,/function validEnvelopeShape\(root, objectType, objectId\)[\s\S]+root\.objectType == objectType[\s\S]+root\.objectId == objectId/);
assert.match(candidateRules,/function validCreateEnvelope\(root, objectType, objectId\)[\s\S]+root\.revision == 0[\s\S]+root\.parentRevision == null[\s\S]+root\.priorContentHash == null/);
assert.match(candidateRules,/root\.updatedByAccountId == request\.auth\.uid/);
assert.match(candidateRules,/function validHash\(value\)[\s\S]+sha256:\[0-9a-f\]\{64\}/);
assert.match(candidateRules,/allow create: if validSelfAccountBootstrap\(accountId\);/);
assert.match(candidateRules,/match \/accounts\/\{accountId\}[\s\S]+allow list, update, delete: if false;/);

// New Stage 3 writes must remain operation-specific. No broad write grant, shared
// gameplay state, session mutation, list access, or catch-all escape is allowed.
assert.match(candidateRules,/match \/devices\/\{deviceId\}[\s\S]+allow create: if validDeviceCreate\(accountId, deviceId\);[\s\S]+allow update: if validDeviceRevoke\(accountId, deviceId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/rivalries\/\{rivalryId\}[\s\S]+allow create: if validInitialRivalryCreate\(rivalryId\);[\s\S]+allow update: if validRivalryRedeem\(rivalryId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/state\/authoritative[\s\S]+allow list, create, update, delete: if false;/);
assert.match(candidateRules,/match \/sessions\/\{sessionId\}[\s\S]+allow list, create, update, delete: if false;/);
assert.match(candidateRules,/match \/\{document=\*\*\}[\s\S]+allow read, write: if false;/);
assert.doesNotMatch(candidateRules,/allow\s+(?:write|update|delete)[^\n]*if\s+true/i);

assert.match(deployedRules,/match \/accounts\/\{accountId\}[\s\S]+allow list, create, update, delete: if false;/,"The repository's historical deny-all production rules file remains distinct until an explicitly validated provider publication changes production.");
assert.match(workflow,/spark-account-bootstrap-emulator\.cjs/,"Permanent Static App validation must execute the Spark account bootstrap emulator proof.");
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=61&&readiness.currentScore<=100,"RJR must remain on the fixed RJR-1 denominator and may rise only with verified capability evidence.");
assert.ok(readiness.evidenceHistory.some(event=>event.eventId==="production-app-check-runtime-proof"&&event.score===61),"The historical 61-point pre-Spark-production baseline must remain preserved.");
if(readiness.currentScore>61){
  assert.ok(readiness.evidenceHistory.some(event=>event.score===readiness.currentScore&&event.delta>0),"Any post-61 RJR movement must be backed by an explicit positive evidence event.");
}

process.stdout.write("PASS zero-billing Spark account bootstrap remains strict while Stage 3 adds only exact registered-device/private-pairing Rules and keeps downstream gameplay/session writes denied.\n");
