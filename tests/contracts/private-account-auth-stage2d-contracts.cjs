const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file,"utf8");
const preflight = require("../../js/firebaseProductionPreflight.js");
const stage2d = read("PRIVATE_ACCOUNT_AUTH_STAGE_2D.md");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const firebaseRc = JSON.parse(read(".firebaserc"));
const rules = read("firestore.rules");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

const clone = value => JSON.parse(JSON.stringify(value));
const expectError = (mutate,code) => {
  const candidate = clone(preflight.createSyntheticReadyFixture());
  mutate(candidate);
  const result = preflight.validate(candidate);
  assert.equal(result.ok,false,`${code} fixture must fail closed.`);
  assert.ok(result.errors.includes(code),`${code} must be reported; got ${result.errors.join(", ")}`);
};

assert.equal(preflight.stage,"2D");
assert.equal(preflight.contractVersion,1);
assert.equal(preflight.productionRuntimeConnected,false);
assert.equal(preflight.emulatorProjectId,"demo-career-mode-showdown-phase1f");
assert.equal(preflight.productionHost,"nikahanghojjati-oss.github.io");

const ready = preflight.createSyntheticReadyFixture();
assert.deepEqual(preflight.validate(ready),{ok:true,errors:[]},"Fully specified synthetic production-like metadata must pass the Stage 2D guardrail.");
assert.match(ready.firestoreLocation.value,/synthetic/i,"Passing fixture must not pretend to select the real production Firestore location.");

expectError(candidate=>{candidate.environment="staging";},"ENVIRONMENT_NOT_PRODUCTION");
expectError(candidate=>{candidate.projectId="";candidate.firebaseWebConfig.projectId="";},"PROJECT_ID_MISSING");
expectError(candidate=>{candidate.projectId="demo-career-mode-showdown-phase1f";candidate.firebaseWebConfig.projectId=candidate.projectId;},"DEMO_PROJECT_FORBIDDEN");
expectError(candidate=>{candidate.projectId="demo-future-prod";candidate.firebaseWebConfig.projectId=candidate.projectId;},"DEMO_PROJECT_FORBIDDEN");
expectError(candidate=>{candidate.firebaseWebConfig.projectId="different-project";},"WEB_CONFIG_PROJECT_MISMATCH");
expectError(candidate=>{candidate.firebaseWebConfig.authDomain="unrelated-project.firebaseapp.com";},"AUTH_DOMAIN_PROJECT_MISMATCH");
for(const field of preflight.requiredWebConfigFields){ expectError(candidate=>{candidate.firebaseWebConfig[field]="";},`WEB_CONFIG_${field.toUpperCase()}_MISSING`); }
expectError(candidate=>{candidate.authorizedDomains=[];},"PRODUCTION_AUTHORIZED_DOMAIN_MISSING");
expectError(candidate=>{candidate.authorizedDomains.push("localhost");},"LOCALHOST_AUTHORIZED_DOMAIN_FORBIDDEN");
expectError(candidate=>{candidate.auth.provider="email";},"AUTH_PROVIDER_POLICY_MISMATCH");
expectError(candidate=>{candidate.auth.flow="redirect";},"AUTH_FLOW_POLICY_MISMATCH");
expectError(candidate=>{candidate.auth.redirectAuthorized=true;},"AUTH_REDIRECT_NOT_AUTHORIZED");
expectError(candidate=>{candidate.auth.persistence="browserLocalPersistence";},"AUTH_PERSISTENCE_POLICY_MISMATCH");
expectError(candidate=>{candidate.auth.extraOAuthScopes=["calendar.readonly"];},"EXTRA_OAUTH_SCOPES_NOT_AUTHORIZED");
expectError(candidate=>{candidate.firestoreLocation.decisionRecorded=false;candidate.firestoreLocation.value="";},"FIRESTORE_LOCATION_DECISION_REQUIRED");
expectError(candidate=>{candidate.firestore.persistentOfflineCache=true;},"FIRESTORE_PERSISTENT_CACHE_FORBIDDEN");
expectError(candidate=>{candidate.firestore.clientWrites="allow";},"CLIENT_FIRESTORE_WRITES_MUST_BE_DENIED");
expectError(candidate=>{candidate.firestore.trustedMutationGatewayAuthorized=true;},"TRUSTED_MUTATION_GATEWAY_NOT_AUTHORIZED");
expectError(candidate=>{candidate.security.webApiKeyClassification="secret";},"WEB_API_KEY_CLASSIFICATION_INVALID");
expectError(candidate=>{candidate.security.webApiKeyIsAuthorizationSecret=true;},"WEB_API_KEY_MUST_NOT_BE_SECURITY_BOUNDARY");
expectError(candidate=>{candidate.privateKey="forbidden";},"CREDENTIAL_MATERIAL_FORBIDDEN");
expectError(candidate=>{candidate.nested={serviceAccount:{project_id:"forbidden"}};},"CREDENTIAL_MATERIAL_FORBIDDEN");
for(const key of ["discovery","profiles","matchmaking","community","rankings"]){ expectError(candidate=>{candidate.publicFeatures[key]=true;},`PUBLIC_${key.toUpperCase()}_FORBIDDEN`); }

assert.match(stage2d,/Production Firebase Environment & Configuration Preflight/i);
assert.match(stage2d,/CURRENT \/ IMPLEMENTATION-AUTHORIZED \/ NON-RUNTIME \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(stage2d,/Stage 2D is a readiness validator, not production provisioning/i);
assert.match(stage2d,/separate Firebase projects/i);
assert.match(stage2d,/default `<projectId>\.firebaseapp\.com` identity/i);
assert.match(stage2d,/custom Auth domain requires a separately reviewed/i);
assert.match(stage2d,/API key[\s\S]+not an authorization secret/i);
assert.match(stage2d,/Firestore location[\s\S]+cannot later be changed/i);
assert.match(stage2d,/Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(stage2d,/Firebase Admin remains emulator\/test-only/i);
assert.match(stage2d,/Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2d,/Stage 3 Registered Devices \/ Private Pairing[\s\S]+remain blocked/i);

assert.match(historicalNext,/Current authorized prerequisite candidate:[\s\S]{0,180}Stage 2D/i);
assert.match(historicalNext,/AUTHORIZED CURRENT PREREQUISITE \/ IMPLEMENTATION-AUTHORIZED \/ NON-RUNTIME \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(historicalNext,/PR #87[\s\S]{0,520}DONE \/ MERGED \/ PROVEN/i);
assert.match(historicalNext,/2415c156161b6244c75e49917bad28efed957adf/);
assert.match(historicalNext,/0accb827fa91f86fdd28e63590bd4843267546ae/);
assert.match(preR3Next,/CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Immutable pre-r3 NEXT_TASK must preserve the PR #125 Connected Account runtime authority.");
assert.match(preR3Next,/Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PRODUCTION APP CHECK RUNTIME INTEGRATION/i,"Immutable pre-r3 NEXT_TASK must preserve prior App Check-runtime provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3Next,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Immutable pre-r3 NEXT_TASK must preserve the bounded v1.5.0/r1 candidate provenance.");
assert.match(preR3Next,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(preR3Next,/Connected Rivalry and actual Private Remote Joining remain downstream/i);
assert.match(preR3Next,/Private Remote Joining remains PRIORITIZED LONG-TERM/i);
assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #171 MERGED[\s\S]+RJR87[\s\S]+STAGE 5A/i,"Live NEXT_TASK must identify the current PR #171 closure / RJR87 / Stage 5A activation authority.");
assert.match(next,/App Check enforcement remains OFF/i,"Live transition authority must keep App Check enforcement off.");
assert.match(next,/STAGE 5A IS AUTHORIZED NEXT[\s\S]+runtime implementation has not started/i,"Live transition authority must keep Stage 5 locked until the explicit remaining gates close.");

assert.equal(firebaseRc.projects.default,"demo-career-mode-showdown-phase1f","Repository Firebase default must remain emulator-only during the historical Stage 2D proof.");
assert.match(firebaseRc.projects.default,/^demo-/);
assert.match(rules,/allow list, create, update, delete:\s*if false/g);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules,/allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2D dormant preflight stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index,/firebaseProductionPreflight|firebase\/auth|firebase\/firestore|firebase-admin/i,"Production shell must not directly load the dormant Stage 2D preflight or Auth/Firestore/Admin runtime; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional,/firebaseProductionPreflight|firebase\/auth|firebase\/firestore|firebase-admin/i,"Production optional modules must not load the dormant Stage 2D preflight or Auth/Firestore/Admin runtime.");
assert.doesNotMatch(worker,/firebaseProductionPreflight|firebase-auth|firebase\/auth|firebase-firestore|firebase\/firestore|firebase-admin/i,"Service Worker must not cache Stage 2D/Auth/Firestore/Admin runtime even when later reviewed Firebase runtime assets are shell-cached indirectly.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies||{},"firebase"),false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies||{},"firebase"),false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies||{},"firebase-admin"),false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies||{},"firebase-admin"),false);
assert.doesNotMatch(lock.slice(0,1800),/"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2D preflight with historical selection authority preserved and current PR #171 closure / RJR87 / Stage 5A activation authority explicit\n");
