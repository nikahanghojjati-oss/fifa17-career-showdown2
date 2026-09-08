const assert=require("node:assert/strict");
const fs=require("node:fs");

const spark=require("../../js/sparkAccountBootstrap.js");
const moduleSource=fs.readFileSync("js/sparkAccountBootstrap.js","utf8");
const candidateRules=fs.readFileSync("firestore.spark.rules","utf8");
const deployedRules=fs.readFileSync("firestore.rules","utf8");
const guards=JSON.parse(fs.readFileSync("CURRENT_PRODUCT_GUARDS.json","utf8"));

// Product-only authority: preserve the zero-billing Spark account bootstrap and
// operation-scoped Rules behavior. Process/routing ownership belongs to operations tests.
assert.equal(guards.provider.billingEnabled,false);
assert.equal(guards.provider.firebasePlan,"Spark");
assert.equal(guards.provider.blazeAllowed,false);
assert.equal(guards.provider.cloudRunAllowed,false);
assert.equal(guards.provider.cloudFunctionsAllowed,false);
assert.equal(guards.provider.productionRulesSource,"firestore.spark.rules");
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

assert.match(candidateRules,/function validSelfAccountBootstrap\(accountId\)/);
assert.match(candidateRules,/request\.auth\.uid == accountId/);
assert.match(candidateRules,/validCreateEnvelope\(root, "account", accountId\)/);
assert.match(candidateRules,/function validEnvelopeShape\(root, objectType, objectId\)[\s\S]+root\.objectType == objectType[\s\S]+root\.objectId == objectId/);
assert.match(candidateRules,/function validCreateEnvelope\(root, objectType, objectId\)[\s\S]+root\.revision == 0[\s\S]+root\.parentRevision == null[\s\S]+root\.priorContentHash == null/);
assert.match(candidateRules,/root\.updatedByAccountId == request\.auth\.uid/);
assert.match(candidateRules,/function validHash\(value\)[\s\S]+sha256:\[0-9a-f\]\{64\}/);
assert.match(candidateRules,/allow create: if validSelfAccountBootstrap\(accountId\);/);
assert.match(candidateRules,/match \/accounts\/\{accountId\}[\s\S]+allow list, update, delete: if false;/);

assert.match(candidateRules,/match \/devices\/\{deviceId\}[\s\S]+allow create: if validDeviceCreate\(accountId, deviceId\);[\s\S]+allow update: if validDeviceRevoke\(accountId, deviceId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/rivalries\/\{rivalryId\}[\s\S]+allow create: if validInitialRivalryCreate\(rivalryId\);[\s\S]+allow update: if validRivalryRedeem\(rivalryId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/state\/authoritative[\s\S]+allow create: if validSharedStateCreate\(rivalryId\);[\s\S]+allow update: if validSharedStateUpdate\(rivalryId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/);
assert.match(candidateRules,/match \/\{document=\*\*\}[\s\S]+allow read, write: if false;/);
assert.doesNotMatch(candidateRules,/allow\s+(?:write|update|delete)[^\n]*if\s+true/i);

assert.match(deployedRules,/match \/accounts\/\{accountId\}[\s\S]+allow list, create, update, delete: if false;/,"The repository's historical deny-all root rules file remains distinct from the isolated production Rules source.");

process.stdout.write("PASS current zero-billing Spark account bootstrap and operation-scoped Rules product authority without process-routing coupling.\n");
