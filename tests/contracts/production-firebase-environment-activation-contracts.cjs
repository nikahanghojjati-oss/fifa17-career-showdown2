const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");

const read = file => fs.readFileSync(file,"utf8");
const manifest = JSON.parse(read("firebase.production.environment.json"));
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseJson = JSON.parse(read("firebase.json"));
const rulesSource = read("firestore.rules");
const preflight = require("../../js/firebaseProductionPreflight.js");

assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.environment,"production");
assert.equal(manifest.projectId,"fifa17-career-showdown-prod");
assert.ok(!manifest.projectId.startsWith("demo-"));
assert.equal(manifest.firebaseWebConfig.projectId,manifest.projectId);
assert.equal(manifest.firebaseWebConfig.authDomain,`${manifest.projectId}.firebaseapp.com`);
for(const field of ["authDomain","projectId","appId","messagingSenderId"]){
  assert.equal(typeof manifest.firebaseWebConfig[field],"string",`${field} must be a string.`);
  assert.ok(manifest.firebaseWebConfig[field].trim(),`${field} must be non-empty.`);
}
assert.equal(Object.hasOwn(manifest.firebaseWebConfig,"apiKey"),false,"The provider-issued Firebase Web API key must not be stored in committed production metadata while the runtime remains disconnected.");
assert.equal(manifest.apiKeyManagement.committed,false);
assert.equal(manifest.apiKeyManagement.source,"firebase-console-or-controlled-deployment-injection");
assert.equal(manifest.apiKeyManagement.classification,"public-project-configuration");
assert.equal(manifest.apiKeyManagement.providerRestrictionsVerified,true,"Owner Google Cloud Console evidence must prove the Firebase Browser key API restrictions before runtime injection.");
assert.equal(manifest.apiKeyManagement.providerRestrictionCount,25);
assert.equal(manifest.apiKeyManagement.generativeLanguageApiAllowed,false,"The public Firebase Browser key must never allow Generative Language API.");
assert.match(manifest.apiKeyManagement.providerVerificationEvidence,/2026-08-19[\s\S]+25 selected APIs[\s\S]+does not contain Generative Language API/i);
assert.equal(manifest.firebaseWebConfig.storageBucket,"fifa17-career-showdown-prod.firebasestorage.app");
assert.equal(manifest.firestore.databaseId,"(default)");
assert.equal(manifest.firestore.location,"nam7");
assert.equal(manifest.firestore.locationDecisionRecorded,true);
assert.equal(manifest.firestore.startingRulesMode,"production");
assert.equal(manifest.firestore.ownerReportedCreated,true);
assert.equal(manifest.firestore.providerVerified,true,"Provider-side Firestore existence is verified by owner Firebase Console evidence showing the real database Data and Rules interfaces.");
assert.match(manifest.firestore.providerVerificationEvidence,/2026-08-19[\s\S]+\(default\)[\s\S]+Data view[\s\S]+Rules tab/i);

assert.equal(firebaseRc.projects.default,"demo-career-mode-showdown-phase1f","Default Firebase alias must remain emulator-only.");
assert.equal(firebaseRc.projects.production,manifest.projectId,"Production alias must point to the owner-created production Firebase project.");
assert.equal(firebaseJson.firestore.rules,"firestore.rules","Firebase deployment configuration must continue to use the canonical repository Firestore Rules source.");

assert.equal(manifest.activation.firebaseProject,"owner-created");
assert.equal(manifest.activation.webApp,"owner-registered");
assert.equal(manifest.activation.googleAuthProvider,"provider-verified-enabled","Google Authentication must remain provider-verified enabled before downstream Remote Joining prerequisites proceed.");
assert.match(manifest.activation.googleAuthProviderVerificationEvidence,/2026-08-19[\s\S]+Authentication[\s\S]+Sign-in method[\s\S]+Enabled/i);
assert.equal(manifest.activation.productionAuthorizedDomain,"provider-verified","The production GitHub Pages host and localhost removal must remain provider verified before downstream activation proceeds.");
assert.equal(manifest.activation.productionAuthorizedDomainHost,"nikahanghojjati-oss.github.io");
assert.deepEqual(manifest.activation.productionAuthorizedDomains,[
  "fifa17-career-showdown-prod.firebaseapp.com",
  "fifa17-career-showdown-prod.web.app",
  "nikahanghojjati-oss.github.io"
]);
assert.equal(manifest.activation.localhostAuthorizedDomainPresent,false,"Localhost must remain absent from the production Authorized domains list.");
assert.match(manifest.activation.productionAuthorizedDomainVerificationEvidence,/2026-08-19[\s\S]+20:20 ET[\s\S]+nikahanghojjati-oss\.github\.io[\s\S]+localhost removed[\s\S]+no localhost row/i);

assert.equal(manifest.activation.productionSecurityRules,"provider-verified-deployed","Production Firestore Rules must remain explicitly provider verified before App Check or runtime connection advances.");
assert.equal(manifest.activation.productionSecurityRulesSource,"firestore.rules");
assert.equal(manifest.activation.productionSecurityRulesSourceBlobSha,"0473750cb16b5b8eea234c0f8138c41de5ff3dfb");
assert.match(manifest.activation.productionSecurityRulesVerificationEvidence,/2026-08-19[\s\S]+20:51 ET[\s\S]+Database \(default\)[\s\S]+Rules tab[\s\S]+Published changes can take up to a minute to propagate[\s\S]+No sample data was created/i);
const gitBlobSha = crypto
  .createHash("sha1")
  .update(`blob ${Buffer.byteLength(rulesSource,"utf8")}\0`)
  .update(rulesSource)
  .digest("hex");
assert.equal(gitBlobSha,manifest.activation.productionSecurityRulesSourceBlobSha,"The canonical repository Rules source must remain byte-identical to the source blob that was provider-verified deployed.");
assert.match(rulesSource,/rules_version\s*=\s*'2';/);
assert.match(rulesSource,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/,"The final deny-all fallback must remain present.");
const writeAuthorityStatements = rulesSource.match(/allow\s+[^;]*(?:create|update|delete|write)[^;]*;/g) || [];
assert.ok(writeAuthorityStatements.length >= 8,"Expected the protected Rules source to contain the explicit application-client write denials.");
for(const statement of writeAuthorityStatements){
  assert.match(statement,/:\s*if\s+false\s*;/,`Every application-client write authority must remain deny-all: ${statement}`);
}

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

const compatibilityCandidate = {
  environment: manifest.environment,
  projectId: manifest.projectId,
  firebaseWebConfig: {
    ...manifest.firebaseWebConfig,
    apiKey: "public-web-config-injected-for-preflight-contract"
  },
  authorizedDomains: manifest.activation.productionAuthorizedDomains,
  auth: {
    provider: "google",
    providerClass: "GoogleAuthProvider",
    flow: "popup",
    userGestureRequired:true,
    redirectAuthorized:false,
    persistence:"browserSessionPersistence",
    extraOAuthScopes:[]
  },
  firestoreLocation:{decisionRecorded:manifest.firestore.locationDecisionRecorded,value:manifest.firestore.location},
  firestore:{persistentOfflineCache:manifest.securityLocks.persistentFirestoreOfflineCache,clientWrites:manifest.securityLocks.applicationClientFirestoreWrites,trustedMutationGatewayAuthorized:manifest.securityLocks.trustedMutationGatewayAuthorizedFromBrowser},
  security:{webApiKeyClassification:manifest.securityLocks.webApiKeyClassification,webApiKeyIsAuthorizationSecret:manifest.securityLocks.webApiKeyIsAuthorizationSecret},
  publicFeatures:{discovery:manifest.securityLocks.publicDiscovery,profiles:manifest.securityLocks.publicProfiles,matchmaking:manifest.securityLocks.publicMatchmaking,community:manifest.securityLocks.community,rankings:manifest.securityLocks.rankings}
};
assert.deepEqual(preflight.validate(compatibilityCandidate),{ok:true,errors:[]},"The provider-verified production Auth state must satisfy the locked Stage 2D production policy with localhost removed and the GitHub Pages host authorized.");
const unsafeLocalhostCandidate = {...compatibilityCandidate,authorizedDomains:[...manifest.activation.productionAuthorizedDomains,"localhost"]};
assert.ok(preflight.validate(unsafeLocalhostCandidate).errors.includes("LOCALHOST_AUTHORIZED_DOMAIN_FORBIDDEN"),"Any future reintroduction of localhost must fail the production preflight.");

const serialized = JSON.stringify(manifest);
for(const forbidden of ["private_key","privateKey","clientSecret","refreshToken","idToken","serviceAccountKey"]){
  assert.ok(!serialized.includes(forbidden),`Forbidden credential key ${forbidden} must not appear in production environment metadata.`);
}
assert.doesNotMatch(serialized,/AIza[0-9A-Za-z_-]{35}/,"Committed production metadata must not contain a Google API-key-shaped value.");

process.stdout.write("PASS production Firebase environment activation, provider-verified Firestore Rules, exact Rules blob lock, deny-all browser writes, verified Firestore/API restrictions/Google Auth/Authorized domains, localhost exclusion, API-key source separation, Stage 2D compatibility, and safe alias boundary\n");
