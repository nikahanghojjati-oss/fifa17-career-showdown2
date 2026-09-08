const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const readJson = file => JSON.parse(read(file));
const guards = readJson("CURRENT_PRODUCT_GUARDS.json");
const productionEnvironment = readJson("firebase.production.environment.json");
const firebaseRc = readJson(".firebaserc");
const rootFirebase = readJson("firebase.json");
const productionFirebase = readJson("firebase.production.rules.json");
const rules = read("firestore.spark.rules");
const deploymentWorkflow = read(".github/workflows/deploy-firestore-rules-zero-billing.yml");
const remoteContract = read("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md");
const privacy = read("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md");
const index = read("index.html");
const pkg = readJson("package.json");

const runtimeRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const runtimeVersion = (runtimeRevision?.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/) || [])[1];
assert.equal(runtimeVersion, pkg.version, "Published runtime revision must remain coherent with package version.");

// POS-2 permanent provider/product/privacy authority.
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
for (const key of ["publicDiscovery","publicListing","publicLobby","publicMatchmaking","community","rankings","globalLeaderboards"]) {
  assert.equal(guards.privacy[key], false, `${key} must remain disabled.`);
}

// Current production Firebase project/config is explicit and separate from the historical demo root.
assert.equal(productionEnvironment.environment, "production");
assert.equal(productionEnvironment.projectId, "fifa17-career-showdown-prod");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSource, guards.provider.productionRulesSource);
assert.equal(productionEnvironment.activation?.appCheckEnforcement, guards.provider.appCheckEnforcement);
assert.equal(productionEnvironment.securityLocks?.persistentFirestoreOfflineCache, false);
assert.equal(productionEnvironment.securityLocks?.publicDiscovery, guards.privacy.publicDiscovery);
assert.equal(productionEnvironment.securityLocks?.publicMatchmaking, guards.privacy.publicMatchmaking);
assert.equal(productionEnvironment.securityLocks?.community, guards.privacy.community);
assert.equal(productionEnvironment.securityLocks?.rankings, guards.privacy.rankings);
assert.equal(Object.hasOwn(productionEnvironment.firebaseWebConfig || {}, "apiKey"), false, "Committed production metadata must not contain the browser API key.");
const serializedEnvironment = JSON.stringify(productionEnvironment);
for (const forbidden of ["private_key","privateKey","clientSecret","refreshToken","idToken","serviceAccountKey"]) {
  assert.ok(!serializedEnvironment.includes(forbidden), `Committed production metadata must not contain ${forbidden}.`);
}
assert.doesNotMatch(serializedEnvironment, /AIza[0-9A-Za-z_-]{35}/, "Committed production metadata must not contain a Google API-key-shaped value.");

assert.match(firebaseRc.projects.default, /^demo-/, "Default Firebase alias must remain emulator/demo-only.");
assert.equal(firebaseRc.projects.production, productionEnvironment.projectId);
assert.equal(rootFirebase.firestore.rules, "firestore.rules", "Historical/demo root config must remain separate from production publication.");
assert.deepEqual(Object.keys(productionFirebase).sort(), ["$schema","firestore"]);
assert.deepEqual(Object.keys(productionFirebase.firestore).sort(), ["rules"], "Production Rules config must not co-deploy indexes or unrelated Firebase resources.");
assert.equal(productionFirebase.firestore.rules, guards.provider.productionRulesSource);

// The current reviewed Spark Rules source keeps exact-path private authority and fail-closed defaults.
assert.match(rules, /rules_version\s*=\s*'2';/);
assert.match(rules, /function signedIn\(\)/);
assert.match(rules, /function activeDevice\(deviceId\)/);
assert.match(rules, /function currentlyEntitled\(rivalryId\)/);
assert.match(rules, /function activePairedRivalry\(rivalryId\)/);
assert.match(rules, /request\.auth\.uid in rivalry\.data\.data\.authorizedAccountIds/);
assert.match(rules, /match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

// Current deployment authority is executable and path-scoped; old prose guides/run IDs are provenance only.
assert.match(deploymentWorkflow, /name:\s*Deploy Firebase Firestore Rules - Zero Billing/);
assert.match(deploymentWorkflow, /push:[\s\S]+branches:[\s\S]+- main[\s\S]+paths:/);
assert.match(deploymentWorkflow, /FIREBASE_PROJECT_ID:\s*fifa17-career-showdown-prod/);
assert.match(deploymentWorkflow, /FIREBASE_CONFIG_FILE:\s*firebase\.production\.rules\.json/);
assert.match(deploymentWorkflow, /FIREBASE_RULES_BASE_FILE:\s*firestore\.spark\.rules/);
assert.match(deploymentWorkflow, /FIREBASE_RULES_FILE:\s*firestore\.spark\.generated\.rules/);
assert.match(deploymentWorkflow, /build-production-firestore-rules\.mjs/);
assert.match(deploymentWorkflow, /shared-showdown-setup-production-provider-emulator\.cjs/);
assert.match(deploymentWorkflow, /publish-firestore-rules-zero-billing\.mjs/);
assert.match(deploymentWorkflow, /cancel-in-progress:\s*false/);
assert.doesNotMatch(deploymentWorkflow, /gcloud run deploy|firebase deploy --only functions|billing accounts|blaze plan/i);

assert.match(remoteContract, /two-owner|two owner|both owners/i);
assert.match(remoteContract, /deny-by-default|deny by default/i);
assert.match(privacy, /local-only use must remain available/i);
assert.match(privacy, /no remote module may bypass local transaction authority/i);
assert.match(privacy, /No public lobby or discoverability index is allowed/i);

process.stdout.write("PASS POS-2 active cloud foundation: current Spark project/config/Rules/deployment authority and permanent product/privacy locks are protected without historical run IDs, RJR scoring, WEC or old deployment-guide narration.\n");
