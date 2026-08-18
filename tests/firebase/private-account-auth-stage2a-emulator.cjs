const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser
} = require("firebase/auth");
const {
  Timestamp,
  connectFirestoreEmulator,
  deleteDoc,
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

const PROJECT_ID = "demo-career-mode-showdown-phase1f";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1";
const FIRESTORE_EMULATOR_PORT = 8080;
const RULES = fs.readFileSync("firestore.rules", "utf8");
const now = () => Timestamp.fromMillis(1_700_100_000_000);
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
    updatedByDeviceId: "stage2a-trusted-seed",
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
        profileId: "profile_stage2a_a",
        displayLabel: "Stage 2A Manager A",
        entitlementState: "active",
        deletionConsent: false
      },
      {
        slotId: "manager-2",
        accountId: accountB,
        profileId: "profile_stage2a_b",
        displayLabel: "Stage 2A Manager B",
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
    apiKey: "stage2a-emulator-only",
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
  return `Aa1!${crypto.randomBytes(24).toString("base64url")}`;
}

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES }
  });
  const clients = [];

  try {
    await testEnv.clearFirestore();

    const clientA = createEmulatorClient("stage2a-auth-a");
    const clientB = createEmulatorClient("stage2a-auth-b");
    const anonymousClient = createEmulatorClient("stage2a-auth-anonymous");
    clients.push(clientA, clientB, anonymousClient);

    const emailA = `stage2a-a-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const emailB = `stage2a-b-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const passwordA = runtimeCredential();
    const passwordB = runtimeCredential();

    const createdA = await createUserWithEmailAndPassword(clientA.auth, emailA, passwordA);
    const createdB = await createUserWithEmailAndPassword(clientB.auth, emailB, passwordB);
    const accountIdA = createdA.user.uid;
    const accountIdB = createdB.user.uid;

    assert.ok(accountIdA && accountIdB, "Authentication Emulator must issue non-empty Firebase uid principals.");
    assert.notEqual(accountIdA, accountIdB, "Distinct synthetic users must receive distinct Firebase uid values.");
    assert.equal(clientA.auth.currentUser.uid, accountIdA);
    assert.equal(clientB.auth.currentUser.uid, accountIdB);

    for (const localIdentity of [
      "profile_stage2a_a",
      "save_stage2a",
      "season_stage2a",
      "device_stage2a_a",
      "installation_stage2a_a",
      "rivalry_stage2a",
      "session_stage2a",
      "Stage 2A Manager A"
    ]) {
      assert.notEqual(accountIdA, localIdentity, `Firebase uid/accountId must remain separate from ${localIdentity}.`);
    }

    await testEnv.withSecurityRulesDisabled(async context => {
      const trustedDb = context.firestore();
      await Promise.all([
        setDoc(doc(trustedDb, "accounts", accountIdA), accountEnvelope(accountIdA)),
        setDoc(doc(trustedDb, "accounts", accountIdB), accountEnvelope(accountIdB)),
        setDoc(doc(trustedDb, "rivalries", "rivalry_stage2a"), rivalryEnvelope("rivalry_stage2a", accountIdA, accountIdB))
      ]);
    });

    await assertSucceeds(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));
    await assertSucceeds(getDocFromServer(doc(clientB.db, "accounts", accountIdB)));
    await assertFails(getDocFromServer(doc(clientA.db, "accounts", accountIdB)));
    await assertFails(getDocFromServer(doc(clientB.db, "accounts", accountIdA)));
    await assertFails(getDocFromServer(doc(anonymousClient.db, "accounts", accountIdA)));

    await assertSucceeds(getDocFromServer(doc(clientA.db, "rivalries", "rivalry_stage2a")));
    await assertSucceeds(getDocFromServer(doc(clientB.db, "rivalries", "rivalry_stage2a")));
    await assertFails(getDocFromServer(doc(anonymousClient.db, "rivalries", "rivalry_stage2a")));

    const clientSuppliedIdentity = { accountId: accountIdA };
    assert.equal(clientB.auth.currentUser.uid, accountIdB, "Provider-authenticated uid must remain authoritative over client data.");
    await assertFails(getDocFromServer(doc(clientB.db, "accounts", clientSuppliedIdentity.accountId)));

    await assertFails(setDoc(
      doc(clientA.db, "accounts", accountIdA, "devices", "device_stage2a_forged"),
      envelope("device", "device_stage2a_forged", {
        deviceId: "device_stage2a_forged",
        installationId: "installation_stage2a_forged",
        displayLabel: null,
        state: "active",
        registeredAt: now(),
        lastSeenAt: null,
        revokedAt: null
      }, accountIdA)
    ));
    await assertFails(updateDoc(doc(clientA.db, "accounts", accountIdA), { "data.status": "disabled" }));
    await assertFails(deleteDoc(doc(clientA.db, "accounts", accountIdA)));
    await assertFails(setDoc(
      doc(clientA.db, "rivalries", "rivalry_stage2a", "state", "authoritative"),
      envelope("sharedState", "rivalry_stage2a", { payload: { forged: true } }, accountIdA)
    ));

    await testEnv.withSecurityRulesDisabled(async context => {
      const trustedDb = context.firestore();
      await setDoc(doc(trustedDb, "accounts", accountIdB), accountEnvelope(accountIdB, "disabled"));
    });
    assert.equal(clientB.auth.currentUser.uid, accountIdB, "Provider session remains valid while app authorization metadata can independently deny connected authority.");
    await assertSucceeds(getDocFromServer(doc(clientB.db, "accounts", accountIdB)));
    await assertFails(getDocFromServer(doc(clientB.db, "rivalries", "rivalry_stage2a")));

    await signOut(clientA.auth);
    assert.equal(clientA.auth.currentUser, null, "Signing out must clear the client Auth principal.");
    await assertFails(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));

    const wrongPassword = runtimeCredential();
    await assert.rejects(signInWithEmailAndPassword(clientA.auth, emailA, wrongPassword));
    assert.equal(clientA.auth.currentUser, null, "Failed sign-in must not fabricate authenticated application state.");

    const signedBackInA = await signInWithEmailAndPassword(clientA.auth, emailA, passwordA);
    assert.equal(signedBackInA.user.uid, accountIdA, "The same synthetic Auth account must retain its stable Firebase uid.");
    await assertSucceeds(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));

    await deleteUser(clientA.auth.currentUser);
    assert.equal(clientA.auth.currentUser, null, "Deleting the synthetic provider account must clear the current Auth principal.");
    await assertFails(getDocFromServer(doc(clientA.db, "accounts", accountIdA)));

    await deleteUser(clientB.auth.currentUser);
    assert.equal(clientB.auth.currentUser, null, "Synthetic provider account cleanup must leave no authenticated principal.");

    process.stdout.write("PASS Stage 2A Firebase Auth Emulator uid/accountId and Firestore Security Rules identity proof\n");
  } finally {
    for (const client of clients) {
      try {
        await terminate(client.db);
      } catch (_) {}
      try {
        await deleteApp(client.app);
      } catch (_) {}
    }
    try {
      await testEnv.clearFirestore();
    } catch (_) {}
    await testEnv.cleanup();
  }
})().catch(error => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exit(1);
});
