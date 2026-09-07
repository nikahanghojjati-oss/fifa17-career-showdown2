const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const guards = JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const productionEnvironment = JSON.parse(read("firebase.production.environment.json"));
const remoteContract = read("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md");
const privacy = read("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md");
const index = read("index.html");
const pkg = JSON.parse(read("package.json"));

const runtimeRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const runtimeVersion = (runtimeRevision?.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/) || [])[1];
assert.equal(runtimeVersion, pkg.version, "Published runtime revision must remain coherent with package version.");

assert.equal(guards.operatingSystem, "POS-2");
assert.equal(guards.provider.billingEnabled, false);
assert.equal(guards.provider.firebasePlan, "Spark");
assert.equal(guards.provider.cloudBillingAccountAllowed, false);
assert.equal(guards.provider.blazeAllowed, false);
assert.equal(guards.provider.cloudRunAllowed, false);
assert.equal(guards.provider.cloudFunctionsAllowed, false);
assert.equal(guards.provider.appCheckEnforcement, false);
assert.equal(guards.provider.firestoreBrowserPersistence, "memory-only");
assert.equal(guards.provider.googleAuthPersistence, "browserSessionPersistence-popup-only-no-extra-scopes");
assert.equal(guards.product.managerCount, 2);
assert.equal(guards.product.pairingAndExactActiveBeforeLeagueOrClubs, true);
assert.equal(guards.product.candidateCOnlyDestructiveRemoteToLocalApply, true);
assert.deepEqual(guards.product.canonicalLocalStorageKeys, [
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);
assert.equal(guards.privacy.publicDiscovery, false);
assert.equal(guards.privacy.publicMatchmaking, false);
assert.equal(guards.privacy.community, false);
assert.equal(guards.privacy.rankings, false);
assert.equal(guards.privacy.globalLeaderboards, false);

assert.equal(bootstrap.ownerZeroBillingAuthorization?.allNonBillingRemoteJoiningDecisionsAuthorized, true);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain, guards.provider.firebasePlan);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked, guards.provider.cloudBillingAccountAllowed);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.blazeMayBeEnabled, guards.provider.blazeAllowed);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudRunAllowed, guards.provider.cloudRunAllowed);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudFunctionsAllowed, guards.provider.cloudFunctionsAllowed);
assert.equal(bootstrap.liveRuntime?.billingRequired, false);
assert.equal(bootstrap.liveRuntime?.firebasePlan, guards.provider.firebasePlan);
assert.equal(bootstrap.liveRuntime?.appCheckEnforcement, guards.provider.appCheckEnforcement);
assert.equal(bootstrap.liveRuntime?.firestorePersistence, guards.provider.firestoreBrowserPersistence);
assert.equal(bootstrap.liveRuntime?.googleAuthPersistence, guards.provider.googleAuthPersistence);

assert.equal(productionEnvironment.projectId, "fifa17-career-showdown-prod");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSource, guards.provider.productionRulesSource);
assert.ok(productionEnvironment.activation?.productionSecurityRulesSourceBlobSha, "Production Rules source must remain pinned to a recorded blob.");
assert.equal(productionEnvironment.activation?.appCheckEnforcement, guards.provider.appCheckEnforcement);
assert.equal(productionEnvironment.securityLocks?.persistentFirestoreOfflineCache, false);
assert.equal(productionEnvironment.securityLocks?.publicDiscovery, guards.privacy.publicDiscovery);
assert.equal(productionEnvironment.securityLocks?.publicMatchmaking, guards.privacy.publicMatchmaking);
assert.equal(productionEnvironment.securityLocks?.community, guards.privacy.community);
assert.equal(productionEnvironment.securityLocks?.rankings, guards.privacy.rankings);

assert.match(remoteContract, /two-owner|two owner|both owners/i);
assert.match(remoteContract, /deny-by-default|deny by default/i);
assert.match(privacy, /local-only use must remain available/i);
assert.match(privacy, /no remote module may bypass local transaction authority/i);
assert.match(privacy, /No public lobby or discoverability index is allowed/i);

process.stdout.write("PASS Active cloud foundation: executable runtime/provider configuration matches POS-2 product guards without RJR score or NEXT_TASK wording dependencies.\n");
