const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const productionEnvironment = JSON.parse(read("firebase.production.environment.json"));
const remoteContract = read("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md");
const privacy = read("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md");
const next = read("NEXT_TASK.md");
const index = read("index.html");
const pkg = JSON.parse(read("package.json"));

const runtimeRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const runtimeVersion = (runtimeRevision?.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/) || [])[1];
assert.equal(runtimeVersion, pkg.version, "Published runtime revision must remain coherent with package version.");

assert.equal(bootstrap.ownerZeroBillingAuthorization?.allNonBillingRemoteJoiningDecisionsAuthorized, true);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain, "Spark");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked, false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.blazeMayBeEnabled, false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudRunAllowed, false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudFunctionsAllowed, false);
assert.equal(bootstrap.liveRuntime?.billingRequired, false);
assert.equal(bootstrap.liveRuntime?.firebasePlan, "Spark");
assert.equal(bootstrap.liveRuntime?.appCheckEnforcement, false);
assert.equal(bootstrap.liveRuntime?.firestorePersistence, "memory-only");
assert.equal(bootstrap.liveRuntime?.googleAuthPersistence, "browserSessionPersistence-popup-only-no-extra-scopes");

assert.equal(productionEnvironment.projectId, "fifa17-career-showdown-prod");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSource, "firestore.spark.rules");
assert.ok(productionEnvironment.activation?.productionSecurityRulesSourceBlobSha, "Production Rules source must remain pinned to a recorded blob.");

assert.equal(readiness.modelVersion, "RJR-1");
assert.equal(readiness.currentScore, 100);
assert.equal(readiness.remaining, 0);

assert.match(remoteContract, /two-owner|two owner|both owners/i);
assert.match(remoteContract, /deny-by-default|deny by default/i);
assert.match(privacy, /local-only use must remain available/i);
assert.match(privacy, /no remote module may bypass local transaction authority/i);
assert.match(privacy, /No public lobby or discoverability index is allowed/i);

assert.match(next, /Billing must never be activated[\s\S]+Firebase remains Spark/i);
assert.match(next, /App Check enforcement remains OFF/i);
assert.match(next, /Firestore browser persistence remains memory-only/i);
assert.match(next, /Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i);
assert.match(next, /Candidate C remains the sole destructive remote-to-local gameplay Apply authority/i);
assert.match(next, /Connected Rivalry[\s\S]+ACTIVE[\s\S]+(?:league|clubs)/i);
assert.match(next, /No public discovery[\s\S]+global leaderboards/i);

process.stdout.write("PASS Active cloud foundation: runtime coherence, zero billing, Spark, Rules pin, auth/privacy boundaries, two-owner authority and current product locks are protected without historical PR wording.\n");
