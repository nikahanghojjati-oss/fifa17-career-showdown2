const assert=require("node:assert/strict");
const fs=require("node:fs");

const spark=require("../../js/sparkAccountBootstrap.js");
const moduleSource=fs.readFileSync("js/sparkAccountBootstrap.js","utf8");
const candidateRules=fs.readFileSync("firestore.spark.rules","utf8");
const deployedRules=fs.readFileSync("firestore.rules","utf8");
const workflow=fs.readFileSync(".github/workflows/validate-static-app.yml","utf8");
const readiness=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));

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
assert.match(candidateRules,/root\.objectType == "account"/);
assert.match(candidateRules,/root\.objectId == accountId/);
assert.match(candidateRules,/root\.revision == 0/);
assert.match(candidateRules,/root\.updatedByAccountId == request\.auth\.uid/);
assert.match(candidateRules,/root\.contentHash\.matches\('\^sha256:\[0-9a-f\]\{64\}\$'\)/);
assert.match(candidateRules,/allow create: if validSelfAccountBootstrap\(accountId\);/);
assert.match(candidateRules,/allow list, update, delete: if false;/);
assert.match(candidateRules,/match \/devices\/\{deviceId\}[\s\S]+allow list, create, update, delete: if false;/);
assert.match(candidateRules,/match \/rivalries\/\{rivalryId\}[\s\S]+allow list, create, update, delete: if false;/);
assert.match(candidateRules,/match \/\{document=\*\*\}[\s\S]+allow read, write: if false;/);
assert.doesNotMatch(candidateRules,/allow\s+(?:write|update|delete)[^\n]*if\s+true/i);

assert.match(deployedRules,/match \/accounts\/\{accountId\}[\s\S]+allow list, create, update, delete: if false;/,"The provider-verified production rules must remain unchanged until the Spark candidate is fully proven and deliberately deployed.");
assert.match(workflow,/spark-account-bootstrap-emulator\.cjs/,"Permanent Static App validation must execute the Spark emulator proof.");
assert.equal(readiness.currentScore,61,"Selecting or implementing the free architecture must not inflate Remote Joining readiness before verified capability proof.");

process.stdout.write("PASS zero-billing Spark account-bootstrap candidate: no billing/Blaze/server runtime, self-create only, downstream writes denied, production rules untouched, RJR unchanged\n");
