const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const bootstrap = require("../../js/trustedAccountBootstrap.js");
const bootstrapSource = read("js/trustedAccountBootstrap.js");
const stage2d = read("PRIVATE_ACCOUNT_AUTH_STAGE_2D.md");
const stage2e = read("PRIVATE_ACCOUNT_AUTH_STAGE_2E.md");
const emulatorTest = read("tests/firebase/private-account-auth-stage2e-bootstrap-emulator.cjs");
const workflow = read(".github/workflows/validate-static-app.yml");
const rules = read("firestore.rules");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const state = read("PROJECT_STATE.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const preR3State = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const start = read("00_DEVELOPER_START_HERE.md");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

const accountFixture = (uid, status = "active") => ({
  schemaVersion: 1,
  objectType: "account",
  objectId: uid,
  revision: 3,
  parentRevision: 2,
  lifecycleState: "live",
  contentHash: "sha256:fixture",
  priorContentHash: null,
  updatedAt: { fixture: true },
  updatedByAccountId: uid,
  updatedByDeviceId: "device_fixture",
  data: {
    status,
    createdAt: { fixture: true },
    deletionRequestedAt: status === "deletion-pending" ? { fixture: true } : null
  },
  tombstone: null
});

assert.equal(bootstrap.contractVersion, 1);
assert.equal(bootstrap.stage, "2E");
assert.equal(bootstrap.productionRuntimeConnected, false);
assert.equal(bootstrap.trustedWriteBoundary, "emulator-test-only");
assert.equal(bootstrap.accountPath, "accounts/{accountId}");
assert.deepEqual(bootstrap.allowedAccountStatuses, ["active", "disabled", "deletion-pending"]);
assert.deepEqual(bootstrap.accountDataFields, ["createdAt", "deletionRequestedAt", "status"]);

const uid = "firebase_uid_stage2e_fixture";
const createPlan = bootstrap.planTrustedAccountBootstrap({
  providerPrincipal: { uid },
  documentAccountId: uid,
  existingAccount: null
});
assert.equal(createPlan.ok, true);
assert.equal(createPlan.action, "create");
assert.equal(createPlan.accountId, uid);
assert.equal(createPlan.documentPath, `accounts/${uid}`);
assert.equal(createPlan.revision, 0);
assert.equal(createPlan.lifecycleState, "live");
assert.deepEqual(createPlan.initialData, { status: "active", deletionRequestedAt: null });
assert.deepEqual(createPlan.serverTimestampFields, ["createdAt", "updatedAt"]);
assert.equal(createPlan.preserveExisting, false);
assert.equal(Object.isFrozen(createPlan), true);
assert.equal(Object.isFrozen(createPlan.initialData), true);

for (const status of bootstrap.allowedAccountStatuses) {
  const existing = accountFixture(uid, status);
  const plan = bootstrap.planTrustedAccountBootstrap({ providerPrincipal: { uid }, documentAccountId: uid, existingAccount: existing });
  assert.equal(plan.ok, true, `${status} same-uid account must be accepted as existing.`);
  assert.equal(plan.action, "existing");
  assert.equal(plan.status, status);
  assert.equal(plan.revision, existing.revision);
  assert.equal(plan.preserveExisting, true, `${status} bootstrap must be no-write/idempotent.`);
}

assert.equal(bootstrap.planTrustedAccountBootstrap(null).code, "INVALID_BOOTSTRAP_INPUT");
assert.equal(bootstrap.planTrustedAccountBootstrap({ providerPrincipal: {}, documentAccountId: uid, existingAccount: null }).code, "UNAUTHENTICATED_PROVIDER");
assert.equal(bootstrap.planTrustedAccountBootstrap({ providerPrincipal: { uid }, documentAccountId: "different_uid", existingAccount: null }).code, "ACCOUNT_PATH_IDENTITY_MISMATCH");

const identityConflict = accountFixture(uid);
identityConflict.objectId = "different_uid";
assert.equal(bootstrap.planTrustedAccountBootstrap({ providerPrincipal: { uid }, documentAccountId: uid, existingAccount: identityConflict }).code, "ACCOUNT_DOCUMENT_IDENTITY_CONFLICT");

for (const mutate of [
  account => { account.schemaVersion = 2; },
  account => { account.objectType = "profile"; },
  account => { account.revision = -1; },
  account => { account.lifecycleState = "tombstoned"; },
  account => { account.tombstone = {}; },
  account => { account.data.status = "reactivated"; },
  account => { account.data.email = "must-not-be-stored@example.test"; }
]) {
  const malformed = accountFixture(uid);
  mutate(malformed);
  const plan = bootstrap.planTrustedAccountBootstrap({ providerPrincipal: { uid }, documentAccountId: uid, existingAccount: malformed });
  assert.equal(plan.ok, false);
  assert.match(plan.code, /^ACCOUNT_DOCUMENT_(?:IDENTITY|SCHEMA)_CONFLICT$/);
}

assert.doesNotMatch(bootstrapSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/i);
assert.doesNotMatch(bootstrapSource, /firebase\/|firebase-admin|serviceAccount|private_key|refreshToken|idToken|getIdToken/i);
assert.match(bootstrapSource, /providerPrincipal\.uid/);
assert.doesNotMatch(bootstrapSource, /providerPrincipal\.(?:email|displayName|photoURL)/);

assert.match(stage2e, /Trusted Application Account Bootstrap & Lifecycle Boundary/i);
assert.match(stage2e, /DONE \/ MERGED \/ PROVEN \/ EMULATOR-TEST-ONLY \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(stage2e, /Stage 2D[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(stage2e, /f019c6c6c39385fcb1f76f3de240fd73bb972e49/);
assert.match(stage2e, /0fd0ac3651a4b8c78957242b645e095a3c151c9d/);
assert.match(stage2e, /f7d462b3d8252b2912f34a1589e457c03e977bd3/);
assert.match(stage2e, /0cb56c22f82facdb248c8c68ec59064c5612c543/);
assert.match(stage2e, /missing `accounts\/\{uid\}`[\s\S]+exactly one initial create plan/i);
assert.match(stage2e, /disabled[\s\S]+deletion-pending[\s\S]+no-write/i);
assert.match(stage2e, /A conflict is not repaired by overwrite/i);
assert.match(stage2e, /Every application-client Firestore create, update and delete remains denied/i);
assert.match(stage2e, /Firebase Admin user-management APIs are elevated operations intended for secure server environments/i);
assert.match(stage2e, /server client libraries bypass Firestore Security Rules and rely on IAM/i);
assert.match(stage2e, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2e, /Stage 2F[\s\S]+Trusted Request Authentication & ID Token Revocation Boundary/i);
assert.match(stage2e, /Registered Devices \/ Private Pairing[\s\S]+BLOCKED/i);
assert.match(stage2e, /public profiles[\s\S]+global rankings/i);
assert.match(stage2e, /Do not repeat Stage 2E/i);

assert.match(stage2d, /DONE \/ MERGED \/ PROVEN \/ NON-RUNTIME \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(stage2d, /Stage 2D is a readiness validator, not production provisioning/i);
assert.match(stage2d, /f019c6c6c39385fcb1f76f3de240fd73bb972e49/);
assert.match(stage2d, /0fd0ac3651a4b8c78957242b645e095a3c151c9d/);

assert.match(emulatorTest, /FIREBASE_AUTH_EMULATOR_HOST\s*=\s*"127\.0\.0\.1:9099"/);
assert.match(emulatorTest, /getAdminAuth\(adminApp\)/);
assert.match(emulatorTest, /adminAuth\.getUser\(createdA\.user\.uid\)/);
assert.match(emulatorTest, /planTrustedAccountBootstrap/);
assert.match(emulatorTest, /Client-side bootstrap attempt must not create application account metadata/);
assert.match(emulatorTest, /Repeated bootstrap for the same provider uid must be a no-write decision/);
assert.match(emulatorTest, /Bootstrap must not reactivate a disabled application account/);
assert.match(emulatorTest, /Bootstrap must preserve deletion-pending rather than restoring active state/);
assert.match(emulatorTest, /ACCOUNT_DOCUMENT_IDENTITY_CONFLICT/);
assert.match(emulatorTest, /ACCOUNT_PATH_IDENTITY_MISMATCH/);
assert.match(emulatorTest, /UNAUTHENTICATED_PROVIDER/);
assert.match(emulatorTest, /assertFails\(setDoc/);
assert.match(emulatorTest, /assertFails\(updateDoc/);
assert.match(emulatorTest, /assertFails\(deleteDoc/);
assert.doesNotMatch(emulatorTest, /getIdToken|getIdTokenResult|refreshToken/);
assert.doesNotMatch(emulatorTest, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(emulatorTest, /credential\s*:|cert\(|serviceAccount|private_key|privateKey/);

assert.match(workflow, /private-account-auth-stage2e-bootstrap-emulator\.cjs/);
assert.match(workflow, /--only auth,firestore/);
assert.match(workflow, /firebase-admin@14\.2\.0/);

assert.match(rules, /match \/accounts\/\{accountId\}[\s\S]+allow get: if signedIn\(\) && request\.auth\.uid == accountId;[\s\S]+allow list, create, update, delete:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

assert.match(historicalNext, /Stage 2E[\s\S]{0,1000}DONE \/ MERGED \/ PROVEN/i);
assert.match(historicalNext, /f7d462b3d8252b2912f34a1589e457c03e977bd3/i);
assert.match(historicalNext, /0cb56c22f82facdb248c8c68ec59064c5612c543/i);
assert.match(historicalNext, /Stage 2F[\s\S]{0,1000}DONE \/ MERGED \/ PROVEN/i);
assert.match(historicalNext, /Current authorized prerequisite candidate:[\s\S]{0,320}Stage 2G/i);
assert.match(historicalNext, /Stage 2G[\s\S]{0,900}CURRENT \/ IMPLEMENTATION-AUTHORIZED/i);
assert.match(preR3Next,/CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Immutable pre-r3 authority must preserve the PR #125 runtime milestone.");
assert.match(preR3Next,/Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PRODUCTION APP CHECK RUNTIME INTEGRATION/i,"Immutable pre-r3 authority must retain former App Check-runtime provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3Next,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i);
assert.match(preR3Next,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);

// Current authority is allowed to advance beyond the historical Stage 2E/2F/2G handoff.
assert.match(next,/^# CURRENT OVERRIDE — PR #171 MERGED[\s\S]+RJR87[\s\S]+STAGE 5A/im,"Live NEXT_TASK must identify current PR #171 closure / RJR87 / Stage 5A activation authority.");
assert.match(next,/App Check enforcement remains OFF/i,"Live authority must keep App Check enforcement off.");
assert.match(next,/Strengthened Rules provider proof[\s\S]+firestore\.spark\.rules/i,"Live authority must record direct provider verification of the strengthened production Rules.");
assert.match(next,/STAGE 5A IS AUTHORIZED NEXT[\s\S]+runtime implementation has not started/i,"Live authority must preserve the Stage 5 lock.");

// Long-lived roadmap documents preserve the historical Stage 2E -> 2G sequence.
const archivalSources = [
  ["POST_V1_ROADMAP_EXECUTION.md", roadmap],
  ["REMOTE_JOINING_EXECUTION_ROADMAP.md", remoteRoadmap]
];
for (const [name, text] of archivalSources) {
  assert.match(text, /Stage 2E[\s\S]{0,1600}DONE \/ MERGED \/ PROVEN/i, `${name} must classify Stage 2E as complete.`);
  assert.match(text, /Stage 2F[\s\S]{0,1600}DONE \/ MERGED \/ PROVEN/i, `${name} must classify Stage 2F as complete.`);
  assert.match(text, /Stage 2G[\s\S]{0,1800}(?:CURRENT|IMPLEMENTATION-AUTHORIZED|Trusted Account Bootstrap Execution Boundary)/i, `${name} must preserve the bounded Stage 2G successor.`);
  assert.match(text, /v1\.4\.0/i, `${name} must preserve the application version at that historical boundary.`);
  assert.match(text, /1\.4\.0-r1/i, `${name} must preserve the runtime revision at that historical boundary.`);
  assert.match(text, /production Firebase[\s\S]{0,900}(disconnected|NOT CONNECTED)/i, `${name} must preserve historical production Firebase isolation.`);
  assert.match(text, /Private Remote Joining[\s\S]{0,1200}(?:DEPENDENCY-GATED|NOT YET IMPLEMENTATION-AUTHORIZED|blocked)/i, `${name} must preserve the gated Private Remote Joining boundary.`);
}
assert.match(currentHandoff,/PR #172[\s\S]+1\.8\.1-r5[\s\S]+87\/100/i,"Rolling handoff must expose current PR #172/r5/RJR87 authority.");
assert.match(start,/PR #172[\s\S]+1\.8\.1-r5[\s\S]+87\/100/i,"Developer start must expose current PR #172/r5/RJR87 authority.");
assert.match(preR3State,/PR #115[\s\S]+production App Check runtime/i);
assert.match(preR3State,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Immutable pre-r3 PROJECT_STATE must preserve the completed Stage 2A-through-2I prerequisite boundary.");
assert.match(preR3State,/Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i);
assert.match(preR3State,/Private Remote Joining[\s\S]+DEPENDENCY-GATED/i);
assert.match(state,/CURRENT OVERRIDE[\s\S]+PR #171 MERGED[\s\S]+PRODUCTION PROVIDER-ABUSE PASS[\s\S]+RJR87[\s\S]+STAGE 5A/i,"Live PROJECT_STATE must identify current PR #171 closure / RJR87 / provider-abuse authority.");
assert.match(state,/Production runtime:\s*`1\.8\.1-r5`[\s\S]+Immediate known-good rollback runtime:\s*`1\.8\.1-r4`/i,"Live PROJECT_STATE must identify production r5 and r4 rollback recovery.");
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,87);
assert.match(state,new RegExp("Remote Joining readiness:\\s*`"+readiness.currentScore+"\\/100` under fixed RJR-1","i"),"Live PROJECT_STATE must carry the current fixed-RJR authority without a superseded literal.");

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2E/2F/2G proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /trustedAccountBootstrap|trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2e|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(optional, /trustedAccountBootstrap|trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2e|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(worker, /trustedAccountBootstrap|trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2e|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase-auth|firebase\/auth|firebase-firestore|firebase\/firestore/i);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.doesNotMatch(lock.slice(0, 1800), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2E trusted application-account bootstrap with immutable historical Stage 2F/2G transition preserved and current PR #171 closure / RJR87 / Stage 5A activation authority explicit\n");
