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
  signInWithEmailAndPassword,
  signOut
} = require("firebase/auth");
const {
  Timestamp,
  connectFirestoreEmulator,
  doc,
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

const PROJECT_ID = "demo-career-mode-showdown-phase1f";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1";
const FIRESTORE_EMULATOR_PORT = 8080;
const RULES = fs.readFileSync("firestore.rules", "utf8");
const now = () => Timestamp.fromMillis(1_700_200_000_000);
const hash = value => `sha256:${crypto.createHash("sha256").update(String(value)).digest("hex")}`;

function envelope(objectType, objectId, data, actorAccountId) {
  return {
    schemaVersion: 1,
    objectType,
    objectId,
    revision: 0,
    parentRevision: null,
    lifecycleState: "live",
    contentHash: hash(`${objectType}:${objectId}`),
    priorContentHash: null,
    updatedAt: now(),
    updatedByAccountId: actorAccountId,
    updatedByDeviceId: "stage2b-trusted-seed",
    data,
    tombstone: null
  };
}

function accountEnvelope(accountId, status = "active") {
  return envelope("account", accountId, {
    status,
    createdAt: now(),
    deletionRequestedAt: null
  }, accountId);
}

function rivalryEnvelope(rivalryId, accountA, accountB) {
  return envelope("rivalry", rivalryId, {
    connectionState: "active",
    connectionStateBeforeDeletion: null,
    managerSlots: [
      {
        slotId: "manager-1",
        accountId: accountA,
        profileId: "profile_stage2b_a",
        displayLabel: "Stage 2B Manager A",
        entitlementState: "active",
        deletionConsent: false
      },
      {
        slotId: "manager-2",
        accountId: accountB,
        profileId: "profile_stage2b_b",
        displayLabel: "Stage 2B Manager B",
        entitlementState: "active",
        deletionConsent: false
      }
    ],
    authorizedAccountIds: [accountA, accountB],
    createdByAccountId: accountA,
    createdAt: now()
  }, accountA);
}

function createEmulatorClient(name) {
  const app = initializeApp({
    apiKey: "stage2b-emulator-only",
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
  return `Bb2!${crypto.randomBytes(24).toString("base64url")}`;
}

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES }
  });
  const clients = [];
  const adminApp = initializeAdminApp({ projectId: PROJECT_ID }, "stage2b-auth-admin");
  const adminAuth = getAdminAuth(adminApp);
  const createdUids = [];

  try {
    await testEnv.clearFirestore();

    assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");

    const clientA = createEmulatorClient("stage2b-auth-a");
    const clientB = createEmulatorClient("stage2b-auth-b");
    clients.push(clientA, clientB);

    const emailA = `stage2b-a-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const emailB = `stage2b-b-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const passwordA = runtimeCredential();
    const passwordB = runtimeCredential();

    const createdA = await createUserWithEmailAndPassword(clientA.auth, emailA, passwordA);
    const createdB = await createUserWithEmailAndPassword(clientB.auth, emailB, passwordB);
    const accountIdA = createdA.user.uid;
    const accountIdB = createdB.user.uid;
    createdUids.push(accountIdA, accountIdB);

    assert.ok(accountIdA && accountIdB);
    assert.notEqual(accountIdA, accountIdB);

    const adminObservedA = await adminAuth.getUser(accountIdA);
    assert.equal(adminObservedA.uid, accountIdA, "Trusted Admin boundary must observe the same provider uid/accountId as Web Auth.");
    assert.equal(adminObservedA.disabled, false);

    await testEnv.withSecurityRulesDisabled(async context => {
      const trustedDb = context.firestore();
      await Promise.all([
        setDoc(doc(trustedDb, "accounts", accountIdA), accountEnvelope(accountIdA)),
        setDoc(doc(trustedDb, "accounts", accountIdB), accountEnvelope(accountIdB)),
        setDoc(doc(trustedDb, "rivalries", "rivalry_stage2b"), rivalryEnvelope("rivalry_stage2b", accountIdA, accountIdB))
      ]);
    });

    await assertSucceeds(getDocFromServer(doc(clientA.db, "rivalries", "rivalry_stage2b")));

    const disabledA = await adminAuth.updateUser(accountIdA, { disabled: true });
    assert.equal(disabledA.uid, accountIdA);
    assert.equal(disabledA.disabled, true, "Trusted provider lifecycle boundary must observe disabled state.");

    await signOut(clientA.auth);
    assert.equal(clientA.auth.currentUser, null);
    await assert.rejects(
      signInWithEmailAndPassword(clientA.auth, emailA, passwordA),
      error => Boolean(error && error.code === "auth/user-disabled"),
      "A disabled provider account must fail closed for a new Web Auth sign-in."
    );
    assert.equal(clientA.auth.currentUser, null, "Disabled sign-in failure must not fabricate an authenticated client principal.");

    const reenabledA = await adminAuth.updateUser(accountIdA, { disabled: false });
    assert.equal(reenabledA.uid, accountIdA);
    assert.equal(reenabledA.disabled, false);

    const signedBackInA = await signInWithEmailAndPassword(clientA.auth, emailA, passwordA);
    assert.equal(signedBackInA.user.uid, accountIdA, "Provider re-enable must retain the exact stable uid/accountId.");

    await testEnv.withSecurityRulesDisabled(async context => {
      const trustedDb = context.firestore();
      await setDoc(doc(trustedDb, "accounts", accountIdA), accountEnvelope(accountIdA, "disabled"));
    });

    assert.equal(clientA.auth.currentUser.uid, accountIdA, "Provider identity may remain authenticated while app authorization independently disables connected authority.");
    await assertSucceeds(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));
    await assertFails(getDocFromServer(doc(clientA.db, "rivalries", "rivalry_stage2b")));
    await assertFails(updateDoc(doc(clientA.db, "accounts", accountIdA), { "data.status": "active" }));

    await adminAuth.revokeRefreshTokens(accountIdA);
    const afterRevocation = await adminAuth.getUser(accountIdA);
    assert.equal(afterRevocation.uid, accountIdA, "Refresh-token revocation must not create a new provider identity.");
    assert.equal(afterRevocation.disabled, false, "Refresh-token revocation is distinct from provider account disablement.");

    await signOut(clientA.auth);
    const freshAfterRevocationA = await signInWithEmailAndPassword(clientA.auth, emailA, passwordA);
    assert.equal(freshAfterRevocationA.user.uid, accountIdA, "Fresh reauthentication after revocation must retain the same uid/accountId.");
    await assertFails(getDocFromServer(doc(clientA.db, "rivalries", "rivalry_stage2b")));

    await testEnv.withSecurityRulesDisabled(async context => {
      const trustedDb = context.firestore();
      await setDoc(doc(trustedDb, "accounts", accountIdA), accountEnvelope(accountIdA, "active"));
    });

    await assertSucceeds(getDocFromServer(doc(clientA.db, "rivalries", "rivalry_stage2b")));

    assert.equal(clientA.auth.currentUser.uid, accountIdA);
    assert.notEqual(accountIdA, "profile_stage2b_a");
    assert.notEqual(accountIdA, "device_stage2b_a");
    assert.notEqual(accountIdA, "rivalry_stage2b");

    process.stdout.write("PASS Stage 2B Firebase Auth provider lifecycle, revocation boundary and app-status authorization proof\n");
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
