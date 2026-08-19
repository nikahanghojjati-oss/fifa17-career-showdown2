const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file,"utf8");
const manifest = JSON.parse(read("firebase.production.environment.json"));
const firebaseRc = JSON.parse(read(".firebaserc"));

assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.environment,"production");
assert.equal(manifest.projectId,"fifa17-career-showdown-prod");
assert.ok(!manifest.projectId.startsWith("demo-"));
assert.equal(manifest.firebaseWebConfig.projectId,manifest.projectId);
assert.equal(manifest.firebaseWebConfig.authDomain,`${manifest.projectId}.firebaseapp.com`);
for(const field of ["apiKey","authDomain","projectId","appId","messagingSenderId"]){
  assert.equal(typeof manifest.firebaseWebConfig[field],"string",`${field} must be a string.`);
  assert.ok(manifest.firebaseWebConfig[field].trim(),`${field} must be non-empty.`);
}
assert.equal(manifest.firebaseWebConfig.storageBucket,"fifa17-career-showdown-prod.firebasestorage.app");
assert.equal(manifest.firestore.databaseId,"(default)");
assert.equal(manifest.firestore.location,"nam7");
assert.equal(manifest.firestore.locationDecisionRecorded,true);
assert.equal(manifest.firestore.startingRulesMode,"production");
assert.equal(manifest.firestore.ownerReportedCreated,true);
assert.equal(manifest.firestore.providerVerified,false,"Provider-side database existence must remain unverified until the console Data view or authenticated provider tooling proves it.");

assert.equal(firebaseRc.projects.default,"demo-career-mode-showdown-phase1f","Default Firebase alias must remain emulator-only.");
assert.equal(firebaseRc.projects.production,manifest.projectId,"Production alias must point to the owner-created production Firebase project.");

assert.equal(manifest.activation.firebaseProject,"owner-created");
assert.equal(manifest.activation.webApp,"owner-registered");
assert.equal(manifest.activation.googleAuthProvider,"not-enabled-yet");
assert.equal(manifest.activation.productionAuthorizedDomain,"not-verified-yet");
assert.equal(manifest.activation.productionSecurityRules,"not-deployed-yet");
assert.equal(manifest.activation.appCheck,"not-enabled-yet");
assert.equal(manifest.activation.trustedRuntimeIam,"not-activated-yet");
assert.equal(manifest.activation.runtimeConnected,false);

assert.equal(manifest.securityLocks.persistentFirestoreOfflineCache,false);
assert.equal(manifest.securityLocks.applicationClientFirestoreWrites,"deny-all");
assert.equal(manifest.securityLocks.trustedMutationGatewayAuthorizedFromBrowser,false);
assert.equal(manifest.securityLocks.webApiKeyClassification,"public-project-configuration");
assert.equal(manifest.securityLocks.webApiKeyIsAuthorizationSecret,false);
assert.equal(manifest.securityLocks.serviceAccountCredentialsAllowed,false);
for(const key of ["publicDiscovery","publicProfiles","publicMatchmaking","community","rankings"]){
  assert.equal(manifest.securityLocks[key],false,`${key} must remain disabled.`);
}

const serialized = JSON.stringify(manifest);
for(const forbidden of ["private_key","privateKey","clientSecret","refreshToken","idToken","serviceAccountKey"]){
  assert.ok(!serialized.includes(forbidden),`Forbidden credential key ${forbidden} must not appear in production environment metadata.`);
}

process.stdout.write("PASS production Firebase environment activation metadata and safe alias boundary\n");
