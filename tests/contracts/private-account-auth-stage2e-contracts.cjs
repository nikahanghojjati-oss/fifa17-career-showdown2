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
const state = read("PROJECT_STATE.md");
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
  const plan = bootstrap.planTrustedAccountBootstrap({
    providerPrincipal: { uid },
    documentAccountId: uid,
    existingAccount: existing
  });
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
assert.match(stage2e, /CURRENT \/ IMPLEMENTATION-AUTHORIZED \/ EMULATOR-TEST-ONLY \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(stage2e, /Stage 2D[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(stage2e, /f019c6c6c39385fcb1f76f3de240fd73bb972e49/);
assert.match(stage2e, /0fd0ac3651a4b8c78957242b645e095a3c151c9d/);
assert.match(stage2e, /missing `accounts\/\{uid\}`[\s\S]+exactly one initial create plan/i);
assert.match(stage2e, /disabled[\s\S]+deletion-pending[\s\S]+no-write/i);
assert.match(stage2e, /A conflict is not repaired by overwrite/i);
assert.match(stage2e, /Every application-client Firestore create, update and delete remains denied/i);
assert.match(stage2e, /Firebase Admin user-management APIs are elevated operations intended for secure server environments/i);
assert.match(stage2e, /server client libraries bypass Firestore Security Rules and rely on IAM/i);
assert.match(stage2e, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2e, /Registered Devices \/ Private Pairing[\s\S]+BLOCKED/i);
assert.match(stage2e, /Public profiles[\s\S]+global rankings/i);

assert.match(stage2d, /Stage 2D is a readiness validator, not production provisioning/i);

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

for (const [name, text] of [
  ["NEXT_TASK.md", next],
  ["PROJECT_STATE.md", state],
  ["POST_V1_ROADMAP_EXECUTION.md", roadmap],
  ["REMOTE_JOINING_EXECUTION_ROADMAP.md", remoteRoadmap],
  ["00_CURRENT_HANDOFF.md", currentHandoff],
  ["00_DEVELOPER_START_HERE.md", start]
]) {
  assert.match(text, /Stage 2D[\s\S]{0,900}DONE \/ MERGED \/ PROVEN/i, `${name} must identify Stage 2D as complete.`);
  assert.match(text, /f019c6c6c39385fcb1f76f3de240fd73bb972e49/i, `${name} must retain Stage 2D exact validated head.`);
  assert.match(text, /0fd0ac3651a4b8c78957242b645e095a3c151c9d/i, `${name} must retain Stage 2D squash-merge boundary.`);
  assert.match(text, /Stage 2E[\s\S]{0,900}(CURRENT|current)/i, `${name} must identify Stage 2E as current.`);
  assert.match(text, /production Firebase[\s\S]{0,260}(disconnected|NOT CONNECTED)/i, `${name} must keep production Firebase disconnected.`);
}

assert.equal(pkg.version, "1.4.0", "Stage 2E dormant proof must not bump production application version.");
assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index, /trustedAccountBootstrap|private-account-auth-stage2e|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(optional, /trustedAccountBootstrap|private-account-auth-stage2e|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(worker, /trustedAccountBootstrap|private-account-auth-stage2e|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.doesNotMatch(lock.slice(0, 1800), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2E trusted application-account bootstrap and production-isolation contracts\n");
