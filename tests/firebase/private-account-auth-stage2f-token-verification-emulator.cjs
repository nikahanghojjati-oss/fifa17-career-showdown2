const assert = require("node:assert/strict");
const crypto = require("node:crypto");

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
  initializeApp: initializeAdminApp,
  deleteApp: deleteAdminApp
} = require("firebase-admin/app");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");
const trustedRequestAuth = require("../../js/trustedRequestAuthentication.js");

const PROJECT_ID = "demo-career-mode-showdown-phase1f";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";

function stage2fRuntimeCredential(){
  return `Ff2!${crypto.randomBytes(24).toString("base64url")}`;
}

function createStage2fEmulatorClient(name){
  const app = initializeApp({
    apiKey: "stage2f-emulator-only",
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    projectId: PROJECT_ID
  }, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  return { app, auth };
}

(async () => {
  const client = createStage2fEmulatorClient("stage2f-auth-client");
  const adminApp = initializeAdminApp({ projectId: PROJECT_ID }, "stage2f-auth-admin");
  const adminAuth = getAdminAuth(adminApp);
  let createdUid = null;

  try {
    assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
    assert.equal(trustedRequestAuth.stage, "2F");
    assert.equal(trustedRequestAuth.revocationCheckRequired, true);

    const email = `stage2f-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const password = stage2fRuntimeCredential();
    const created = await createUserWithEmailAndPassword(client.auth, email, password);
    createdUid = created.user.uid;
    assert.ok(createdUid);

    const transientIdToken = await created.user.getIdToken(true);
    assert.equal(typeof transientIdToken, "string");
    assert.ok(transientIdToken.length > 20);

    const verificationCalls = [];
    const emulatorVerifier = async (idToken, checkRevoked) => {
      verificationCalls.push({ sameToken: idToken === transientIdToken, checkRevoked });
      return adminAuth.verifyIdToken(idToken, checkRevoked);
    };

    const accepted = await trustedRequestAuth.verifyTrustedRequestPrincipal({
      idToken: transientIdToken,
      accountId: "client_spoofed_account_id",
      email: "client-controlled@example.test",
      verifyIdToken: emulatorVerifier
    });

    assert.equal(accepted.ok, true);
    assert.equal(accepted.action, "authenticated");
    assert.equal(accepted.accountId, createdUid, "Trusted request identity must come from the verified Firebase uid.");
    assert.equal(accepted.providerPrincipal.uid, createdUid);
    assert.equal(accepted.revocationChecked, true);
    assert.equal(accepted.applicationAuthorizationGranted, false, "Provider authentication must not imply application authorization.");
    assert.deepEqual(verificationCalls, [{ sameToken: true, checkRevoked: true }], "Trusted adapter must call verifyIdToken with revocation checking explicitly enabled.");
    assert.equal(Object.prototype.hasOwnProperty.call(accepted, "idToken"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(accepted, "token"), false);
    assert.equal(JSON.stringify(accepted).includes(transientIdToken), false, "Trusted principal result must never reflect the raw ID token.");

    const adminObserved = await adminAuth.getUser(createdUid);
    assert.equal(adminObserved.uid, createdUid);
    assert.equal(adminObserved.disabled, false);

    await adminAuth.updateUser(createdUid, { disabled: true });
    const disabledResult = await trustedRequestAuth.verifyTrustedRequestPrincipal({
      idToken: transientIdToken,
      verifyIdToken: (idToken, checkRevoked) => adminAuth.verifyIdToken(idToken, checkRevoked)
    });
    assert.equal(disabledResult.ok, false);
    assert.equal(disabledResult.code, "PROVIDER_ACCOUNT_DISABLED", "Revocation-aware trusted verification must fail closed for a disabled provider account.");

    await adminAuth.updateUser(createdUid, { disabled: false });
    await signOut(client.auth);
    const signedBackIn = await signInWithEmailAndPassword(client.auth, email, password);
    assert.equal(signedBackIn.user.uid, createdUid);
    const freshIdToken = await signedBackIn.user.getIdToken(true);

    const restored = await trustedRequestAuth.verifyTrustedRequestPrincipal({
      idToken: freshIdToken,
      verifyIdToken: (idToken, checkRevoked) => adminAuth.verifyIdToken(idToken, checkRevoked)
    });
    assert.equal(restored.ok, true);
    assert.equal(restored.accountId, createdUid);

    await new Promise(resolve => setTimeout(resolve, 1100));
    await adminAuth.revokeRefreshTokens(createdUid);
    const revokedResult = await trustedRequestAuth.verifyTrustedRequestPrincipal({
      idToken: freshIdToken,
      verifyIdToken: (idToken, checkRevoked) => adminAuth.verifyIdToken(idToken, checkRevoked)
    });
    assert.equal(revokedResult.ok, false);
    assert.equal(revokedResult.code, "PROVIDER_TOKEN_REVOKED", "Revocation-aware emulator wiring must reject the already-issued token after test-only refresh-token revocation.");

    assert.equal(client.auth.currentUser.uid, createdUid, "Provider-side trusted revocation proof must not fabricate a different uid/accountId.");
    assert.notEqual(createdUid, "client_spoofed_account_id");
    assert.notEqual(createdUid, "profile_stage2f_fixture");
    assert.notEqual(createdUid, "device_stage2f_fixture");
    assert.notEqual(createdUid, "rivalry_stage2f_fixture");

    process.stdout.write("PASS Stage 2F trusted Firebase ID-token verification and revocation-aware Auth Emulator wiring proof\n");
  } finally {
    try {
      await signOut(client.auth);
    } catch (_) {}
    try {
      await deleteApp(client.app);
    } catch (_) {}
    if(createdUid){
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (_) {}
    }
    try {
      await deleteAdminApp(adminApp);
    } catch (_) {}
  }
})().catch(error => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exit(1);
});
