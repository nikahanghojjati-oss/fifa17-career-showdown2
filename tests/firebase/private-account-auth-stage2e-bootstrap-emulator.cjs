const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const { initializeApp, deleteApp } = require("firebase/app");
const {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut
} = require("firebase/auth");
const {
  Timestamp,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  setDoc,
  terminate,
  updateDoc
} = require("firebase/firestore");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");
const {
  initializeApp: initializeAdminApp,
  deleteApp: deleteAdminApp
} = require("firebase-admin/app");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");
const bootstrap = require("../../js/trustedAccountBootstrap.js");

const PROJECT_ID = "demo-career-mode-showdown-phase1f";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1";
const FIRESTORE_EMULATOR_PORT = 8080;
const RULES = fs.readFileSync("firestore.rules", "utf8");
const now = () => Timestamp.fromMillis(1_700_300_000_000);
const hash = value => `sha256:${crypto.createHash("sha256").update(String(value)).digest("hex")}`;

function accountEnvelope(accountId, status = "active", deletionRequestedAt = null) {
  return {
    schemaVersion: 1,
    objectType: "account",
    objectId: accountId,
    revision: 0,
    parentRevision: null,
    lifecycleState: "live",
    contentHash: hash(`account:${accountId}`),
    priorContentHash: null,
    updatedAt: now(),
    updatedByAccountId: accountId,
    updatedByDeviceId: "stage2e-trusted-bootstrap",
    data: {
      status,
      createdAt: now(),
      deletionRequestedAt
    },
    tombstone: null
  };
}

function createEmulatorClient(name) {
  const app = initializeApp({
    apiKey: "stage2e-emulator-only",
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    projectId: PROJECT_ID
  }, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  return { app, auth, db };
}

function runtimeCredential() {
  return `Ee5!${crypto.randomBytes(24).toString("base64url")}`;
}

async function trustedRead(testEnv, accountId) {
  return testEnv.withSecurityRulesDisabled(async context => {
    const snapshot = await getDoc(doc(context.firestore(), "accounts", accountId));
    return snapshot.exists() ? snapshot.data() : null;
  });
}

async function applyTrustedBootstrap(testEnv, providerUid) {
  const existingAccount = await trustedRead(testEnv, providerUid);
  const plan = bootstrap.planTrustedAccountBootstrap({
    providerPrincipal: { uid: providerUid },
    documentAccountId: providerUid,
    existingAccount
  });
  if (!plan.ok || plan.action !== "create") return plan;

  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(
      doc(context.firestore(), "accounts", providerUid),
      accountEnvelope(providerUid, plan.initialData.status, plan.initialData.deletionRequestedAt)
    );
  });
  return plan;
}

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES }
  });
  const clients = [];
  const adminApp = initializeAdminApp({ projectId: PROJECT_ID }, "stage2e-auth-admin");
  const adminAuth = getAdminAuth(adminApp);
  const createdUids = [];

  try {
    await testEnv.clearFirestore();

    assert.equal(bootstrap.stage, "2E");
    assert.equal(bootstrap.productionRuntimeConnected, false);
    assert.equal(bootstrap.trustedWriteBoundary, "emulator-test-only");

    const clientA = createEmulatorClient("stage2e-auth-a");
    const clientB = createEmulatorClient("stage2e-auth-b");
    clients.push(clientA, clientB);

    const emailA = `stage2e-a-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const emailB = `stage2e-b-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const passwordA = runtimeCredential();
    const passwordB = runtimeCredential();

    const createdA = await createUserWithEmailAndPassword(clientA.auth, emailA, passwordA);
    const createdB = await createUserWithEmailAndPassword(clientB.auth, emailB, passwordB);
    createdUids.push(createdA.user.uid, createdB.user.uid);

    const adminObservedA = await adminAuth.getUser(createdA.user.uid);
    const adminObservedB = await adminAuth.getUser(createdB.user.uid);
    const accountIdA = adminObservedA.uid;
    const accountIdB = adminObservedB.uid;

    assert.equal(accountIdA, createdA.user.uid, "Trusted provider boundary must observe the same Firebase uid/accountId as Web Auth.");
    assert.equal(accountIdB, createdB.user.uid, "Trusted provider boundary must observe the same second Firebase uid/accountId as Web Auth.");
    assert.notEqual(accountIdA, accountIdB);

    const missingPlan = bootstrap.planTrustedAccountBootstrap({
      providerPrincipal: { uid: accountIdA },
      documentAccountId: accountIdA,
      existingAccount: null
    });
    assert.equal(missingPlan.ok, true);
    assert.equal(missingPlan.action, "create");
    assert.equal(missingPlan.accountId, accountIdA);
    assert.equal(missingPlan.initialData.status, "active");
    assert.equal(missingPlan.initialData.deletionRequestedAt, null);
    assert.deepEqual(missingPlan.serverTimestampFields, ["createdAt", "updatedAt"]);

    await assertFails(setDoc(doc(clientB.db, "accounts", accountIdB), accountEnvelope(accountIdB)));
    assert.equal(await trustedRead(testEnv, accountIdB), null, "Client-side bootstrap attempt must not create application account metadata.");

    const firstBootstrap = await applyTrustedBootstrap(testEnv, accountIdA);
    assert.equal(firstBootstrap.action, "create");
    const firstStored = await trustedRead(testEnv, accountIdA);
    assert.equal(firstStored.objectId, accountIdA);
    assert.equal(firstStored.data.status, "active");
    assert.equal(firstStored.revision, 0);

    await assertSucceeds(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));
    await assertFails(getDocFromServer(doc(clientB.db, "accounts", accountIdA)));
    await assertFails(updateDoc(doc(clientA.db, "accounts", accountIdA), { "data.status": "disabled" }));
    await assertFails(deleteDoc(doc(clientA.db, "accounts", accountIdA)));

    const repeatedBootstrap = await applyTrustedBootstrap(testEnv, accountIdA);
    assert.equal(repeatedBootstrap.action, "existing", "Repeated bootstrap for the same provider uid must be a no-write decision.");
    assert.equal(repeatedBootstrap.preserveExisting, true);
    const afterRepeat = await trustedRead(testEnv, accountIdA);
    assert.equal(afterRepeat.revision, firstStored.revision, "Idempotent bootstrap must not advance revision.");
    assert.equal(afterRepeat.data.status, firstStored.data.status, "Idempotent bootstrap must not rewrite lifecycle state.");
    assert.equal(afterRepeat.data.createdAt.toMillis(), firstStored.data.createdAt.toMillis(), "Idempotent bootstrap must preserve account creation time.");
    assert.equal(afterRepeat.updatedAt.toMillis(), firstStored.updatedAt.toMillis(), "Idempotent bootstrap must not rewrite provider metadata.");

    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), "accounts", accountIdA), { "data.status": "disabled" });
    });
    const disabledBootstrap = await applyTrustedBootstrap(testEnv, accountIdA);
    assert.equal(disabledBootstrap.action, "existing");
    assert.equal(disabledBootstrap.status, "disabled", "Bootstrap must not reactivate a disabled application account.");
    assert.equal((await trustedRead(testEnv, accountIdA)).data.status, "disabled");

    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), "accounts", accountIdA), {
        "data.status": "deletion-pending",
        "data.deletionRequestedAt": now()
      });
    });
    const deletionPendingBootstrap = await applyTrustedBootstrap(testEnv, accountIdA);
    assert.equal(deletionPendingBootstrap.action, "existing");
    assert.equal(deletionPendingBootstrap.status, "deletion-pending", "Bootstrap must preserve deletion-pending rather than restoring active state.");

    await testEnv.withSecurityRulesDisabled(async context => {
      await updateDoc(doc(context.firestore(), "accounts", accountIdA), { objectId: "conflicting_account_id" });
    });
    const conflictPlan = bootstrap.planTrustedAccountBootstrap({
      providerPrincipal: { uid: accountIdA },
      documentAccountId: accountIdA,
      existingAccount: await trustedRead(testEnv, accountIdA)
    });
    assert.equal(conflictPlan.ok, false);
    assert.equal(conflictPlan.code, "ACCOUNT_DOCUMENT_IDENTITY_CONFLICT");
    assert.equal((await trustedRead(testEnv, accountIdA)).objectId, "conflicting_account_id", "Rejected bootstrap must not overwrite conflicting stored identity.");

    const wrongPathPlan = bootstrap.planTrustedAccountBootstrap({
      providerPrincipal: { uid: accountIdA },
      documentAccountId: accountIdB,
      existingAccount: null
    });
    assert.equal(wrongPathPlan.code, "ACCOUNT_PATH_IDENTITY_MISMATCH");

    const unauthenticatedPlan = bootstrap.planTrustedAccountBootstrap({
      providerPrincipal: {},
      documentAccountId: accountIdA,
      existingAccount: null
    });
    assert.equal(unauthenticatedPlan.code, "UNAUTHENTICATED_PROVIDER");

    const secondBootstrap = await applyTrustedBootstrap(testEnv, accountIdB);
    assert.equal(secondBootstrap.action, "create");
    await assertSucceeds(getDocFromServer(doc(clientB.db, "accounts", accountIdB)));

    for (const localIdentity of [
      "profile_stage2e_a",
      "save_stage2e",
      "season_stage2e",
      "device_stage2e_a",
      "installation_stage2e_a",
      "rivalry_stage2e",
      "session_stage2e"
    ]) {
      assert.notEqual(accountIdA, localIdentity, `Trusted Firebase uid/accountId must remain separate from ${localIdentity}.`);
    }

    process.stdout.write("PASS Stage 2E trusted application-account bootstrap, idempotency and client-write denial proof\n");
  } finally {
    for (const client of clients) {
      try {
        await signOut(client.auth);
      } catch (_) {}
      try {
        await terminate(client.db);
      } catch (_) {}
      try {
        await deleteApp(client.app);
      } catch (_) {}
    }
    for (const uid of createdUids) {
      try {
        await adminAuth.deleteUser(uid);
      } catch (_) {}
    }
    try {
      await deleteAdminApp(adminApp);
    } catch (_) {}
    try {
      await testEnv.clearFirestore();
    } catch (_) {}
    await testEnv.cleanup();
  }
})().catch(error => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exit(1);
});
