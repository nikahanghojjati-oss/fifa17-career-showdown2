const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");

const read = file => fs.readFileSync(file,"utf8");
const manifest = JSON.parse(read("firebase.production.environment.json"));
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseJson = JSON.parse(read("firebase.json"));
const historicalRulesSource = read("firestore.rules");
const strengthenedRulesSource = read("firestore.spark.rules");
const stage5cRulesSource = read("firestore.stage5c.rules");
const providerProof = read("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md");
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
assert.equal(Object.hasOwn(manifest.firebaseWebConfig,"apiKey"),false,"The provider-issued Firebase Web API key must remain outside committed production metadata and enter only through the controlled deployment artifact.");
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
assert.equal(manifest.firestore.providerVerified,true,"Provider-side Firestore existence and current Rules publication must remain verified by direct owner Firebase Console evidence.");
assert.match(manifest.firestore.providerVerificationEvidence,/2026-08-29[\s\S]+fifa17-career-showdown-prod[\s\S]+\(default\)[\s\S]+Rules tab[\s\S]+Today 7:48 AM/i);

assert.equal(firebaseRc.projects.default,"demo-career-mode-showdown-phase1f","Default Firebase alias must remain emulator-only.");
assert.equal(firebaseRc.projects.production,manifest.projectId,"Production alias must point to the owner-created production Firebase project.");
assert.equal(firebaseJson.firestore.rules,"firestore.rules","Historical root Firebase deployment configuration must remain on the Phase 1F/Stage 2 deny-all source; production strengthened Rules use the isolated production config.");

assert.equal(manifest.productionRuntime.applicationVersion,"1.4.0");
assert.equal(manifest.productionRuntime.runtimeRevision,"1.4.0-r2");
assert.equal(manifest.productionRuntime.status,"production-proven");
assert.equal(manifest.productionRuntime.knownGoodFallbackRuntime,"1.4.0-r1");
assert.equal(manifest.productionRuntime.proof.workflow,"Validate Stability Lane");
assert.equal(manifest.productionRuntime.proof.runNumber,1230);
assert.equal(manifest.productionRuntime.proof.runId,32439162225);
assert.equal(manifest.productionRuntime.proof.headSha,"3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516");
assert.equal(manifest.productionRuntime.proof.event,"push");
assert.equal(manifest.productionRuntime.proof.conclusion,"success");
assert.equal(manifest.productionRuntime.proof.deployedRuntimeByteVerification,true);
assert.equal(manifest.productionRuntime.proof.productionAppCheckTokenPath,true);
assert.equal(manifest.productionRuntime.proof.completeDeployedJourney,true);

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

assert.equal(manifest.activation.productionSecurityRules,"provider-verified-deployed","Production Firestore Rules must remain explicitly provider verified.");
assert.equal(manifest.activation.productionSecurityRulesSource,"firestore.spark.rules","Current provider authority must name the strengthened production Rules source path.");
assert.equal(manifest.activation.productionSecurityRulesSourceBlobSha,"2b7c0b166ae0aae7ab7a3ce84725b21091262484","Until Stage 5D provider publication is independently proven, durable provider authority must retain the last verified deployed Rules blob.");
assert.match(manifest.activation.productionSecurityRulesVerificationEvidence,/2026-08-29[\s\S]+Today 7:48 AM[\s\S]+activeDevice[\s\S]+activePairedRivalry[\s\S]+final allow read, write: if false/i);
assert.match(providerProof,/Status: PROVIDER-VERIFIED DEPLOYED/i,"Dedicated provider proof must preserve deployed provider status.");
assert.match(providerProof,/Today · 7:48 AM/i,"Dedicated provider proof must preserve the exact provider-published version timestamp.");
assert.match(providerProof,/2b7c0b166ae0aae7ab7a3ce84725b21091262484/i,"Dedicated provider proof must preserve the last independently verified provider blob regardless of later reviewed source promotion.");
const strengthenedGitBlobSha = crypto
  .createHash("sha1")
  .update(`blob ${Buffer.byteLength(strengthenedRulesSource,"utf8")}\0`)
  .update(strengthenedRulesSource)
  .digest("hex");
assert.equal(strengthenedRulesSource,stage5cRulesSource,"Stage 5D repository production source must reuse the exact already-emulator-proven Stage 5C Rules bytes.");
assert.equal(strengthenedGitBlobSha,"363af783d7e5436fdfaa3766d4aa413fc9952a08","The reviewed Stage 5D repository source must preserve exact Stage 5C blob lineage before provider publication.");
assert.notEqual(strengthenedGitBlobSha,manifest.activation.productionSecurityRulesSourceBlobSha,"Before independently verified Stage 5D provider publication, repository source and durable deployed-provider authority must remain intentionally distinct rather than fabricating activation.");
assert.match(strengthenedRulesSource,/rules_version\s*=\s*'2';/);
assert.match(strengthenedRulesSource,/function activeDevice\(deviceId\)/,"Strengthened reviewed Rules must retain registered-device authorization.");
assert.match(strengthenedRulesSource,/function activePairedRivalry\(rivalryId\)/,"Strengthened reviewed Rules must retain exact private pairing/rivalry authorization.");
assert.match(strengthenedRulesSource,/allow list, delete: if false;/,"Strengthened reviewed Rules must deny rivalry and session collection enumeration/direct delete where applicable.");
assert.match(strengthenedRulesSource,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/,"The strengthened final deny-all fallback must remain present.");

assert.match(historicalRulesSource,/rules_version\s*=\s*'2';/);
assert.match(historicalRulesSource,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const historicalAllowStatements = historicalRulesSource.match(/allow\s+[^:;]+:\s*if[\s\S]*?;/g) || [];
const historicalWriteAuthorityStatements = historicalAllowStatements.filter(statement=>{
  const permissions = ((statement.match(/^allow\s+([^:]+):/) || [])[1] || "")
    .split(",")
    .map(permission=>permission.trim());
  return permissions.some(permission=>["create","update","delete","write"].includes(permission));
});
assert.ok(historicalWriteAuthorityStatements.length >= 8,"Expected the protected historical Rules source to retain explicit application-client write denials.");
for(const statement of historicalWriteAuthorityStatements){
  assert.match(statement,/:\s*if\s+false\s*;/,`Every historical Stage 2 application-client write authority must remain deny-all: ${statement}`);
}

assert.equal(manifest.activation.appCheck,"production-runtime-proven","Production authority must distinguish completed runtime/token proof from earlier provider-registration-only status.");
assert.equal(manifest.activation.appCheckProvider,"recaptcha-enterprise");
assert.equal(manifest.activation.appCheckWebAppId,manifest.firebaseWebConfig.appId);
assert.equal(manifest.activation.appCheckProductionHost,"nikahanghojjati-oss.github.io");
assert.equal(manifest.activation.appCheckTokenTtlSeconds,3600);
assert.equal(manifest.activation.appCheckRiskThreshold,0.5);
assert.equal(manifest.activation.appCheckEnforcement,false,"App Check enforcement remains a separately reviewed hardening gate even after legitimate production traffic is proven.");
assert.equal(manifest.activation.appCheckRuntimeBootstrapConnected,true,"Permanent production proof must record the controlled Firebase App + App Check runtime connection.");
assert.equal(manifest.activation.appCheckLegitimateProductionTrafficProven,true,"Permanent production proof must record legitimate reCAPTCHA Enterprise App Check traffic.");
assert.match(manifest.activation.appCheckProviderVerificationEvidence,/2026-08-20[\s\S]+reCAPTCHA Enterprise[\s\S]+nikahanghojjati-oss\.github\.io[\s\S]+Registered[\s\S]+one-hour TTL[\s\S]+0\.5/i);
assert.match(manifest.activation.appCheckRuntimeVerificationEvidence,/Validate Stability Lane #1230[\s\S]+32439162225[\s\S]+3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516[\s\S]+real production[\s\S]+App Check token path[\s\S]+enforcement remained OFF/i);
assert.equal(manifest.activation.trustedRuntimeIam,"not-activated-yet","App Check proof must not be conflated with trusted runtime/IAM activation.");
assert.equal(manifest.activation.runtimeConnected,true,"Controlled production Firebase App + App Check runtime connection is now permanently proven.");

assert.equal(manifest.securityLocks.persistentFirestoreOfflineCache,false);
assert.equal(manifest.securityLocks.applicationClientFirestoreWrites,"deny-all","Historical Stage 2 activation metadata must remain immutable even though separately reviewed strengthened Rules grant narrow later-stage writes.");
assert.equal(manifest.securityLocks.trustedMutationGatewayAuthorizedFromBrowser,false);
assert.equal(manifest.securityLocks.webApiKeyClassification,"public-project-configuration");
assert.equal(manifest.securityLocks.webApiKeyIsAuthorizationSecret,false);
assert.equal(manifest.securityLocks.serviceAccountCredentialsAllowed,false);
assert.equal(manifest.securityLocks.clientAuthInitialized,false);
assert.equal(manifest.securityLocks.clientFirestoreInitialized,false);
assert.equal(manifest.securityLocks.clientStorageInitialized,false);
assert.equal(manifest.securityLocks.clientFunctionsInitialized,false);
assert.deepEqual(manifest.securityLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
],"Stage 2H least-privilege IAM authority must remain exactly the reviewed four permissions.");
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
assert.deepEqual(preflight.validate(compatibilityCandidate),{ok:true,errors:[]},"The provider-verified production Auth state must satisfy the locked historical Stage 2D production policy with localhost removed and the GitHub Pages host authorized.");
const unsafeLocalhostCandidate = {...compatibilityCandidate,authorizedDomains:[...manifest.activation.productionAuthorizedDomains,"localhost"]};
assert.ok(preflight.validate(unsafeLocalhostCandidate).errors.includes("LOCALHOST_AUTHORIZED_DOMAIN_FORBIDDEN"),"Any future reintroduction of localhost must fail the production preflight.");

const serialized = JSON.stringify(manifest);
for(const forbidden of ["private_key","privateKey","clientSecret","refreshToken","idToken","serviceAccountKey"]){
  assert.ok(!serialized.includes(forbidden),`Forbidden credential key ${forbidden} must not appear in production environment metadata.`);
}
assert.doesNotMatch(serialized,/AIza[0-9A-Za-z_-]{35}/,"Committed production metadata must not contain a Google API-key-shaped value.");

process.stdout.write("PASS production Firebase authority: Stage 5D reviewed firestore.spark.rules intentionally advances beyond the last provider-verified blob without fabricating deployment; historical root/demo isolation, App Check OFF, zero-billing-compatible authority and provider provenance remain protected.\n");