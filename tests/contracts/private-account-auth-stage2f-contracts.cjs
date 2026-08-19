const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const trustedAuth = require("../../js/trustedRequestAuthentication.js");
const trustedAuthSource = read("js/trustedRequestAuthentication.js");
const stage2e = read("PRIVATE_ACCOUNT_AUTH_STAGE_2E.md");
const stage2f = read("PRIVATE_ACCOUNT_AUTH_STAGE_2F.md");
const stage2g = read("PRIVATE_ACCOUNT_AUTH_STAGE_2G.md");
const emulatorTest = read("tests/firebase/private-account-auth-stage2f-token-verification-emulator.cjs");
const workflow = read(".github/workflows/validate-static-app.yml");
const rules = read("firestore.rules");
const next = read("NEXT_TASK.md");
const archivedNext = read("authority-history/NEXT_TASK_POST_PR100_REMOTE_JOINING_RESTART_FULL.md");
const state = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const start = read("00_DEVELOPER_START_HERE.md");
const history = read("WORK_ENVIRONMENT_HISTORY.md");
const status = JSON.parse(read("WORK_ENVIRONMENT_STATUS.json"));
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

assert.equal(trustedAuth.contractVersion, 1);
assert.equal(trustedAuth.stage, "2F");
assert.equal(trustedAuth.productionRuntimeConnected, false);
assert.equal(trustedAuth.verificationBoundary, "trusted-server-adapter-required");
assert.equal(trustedAuth.revocationCheckRequired, true);
assert.equal(trustedAuth.applicationAuthorizationSeparate, true);
assert.match(trustedAuth.providerIdentitySource, /Firebase Auth uid[\s\S]+verifyIdToken\(idToken, true\)/i);

(async () => {
  const verifiedUid = "firebase_uid_stage2f_verified";
  const calls = [];
  const accepted = await trustedAuth.verifyTrustedRequestPrincipal({
    idToken: "transient-stage2f-token",
    accountId: "client_spoofed_account",
    email: "client-controlled@example.test",
    verifyIdToken: async (...args) => {
      calls.push(args);
      return { uid: verifiedUid, sub: verifiedUid, email: "provider-presentation-only@example.test" };
    }
  });

  assert.equal(accepted.ok, true);
  assert.equal(accepted.action, "authenticated");
  assert.equal(accepted.accountId, verifiedUid);
  assert.equal(accepted.providerPrincipal.uid, verifiedUid);
  assert.equal(accepted.revocationChecked, true);
  assert.equal(accepted.applicationAuthorizationGranted, false);
  assert.deepEqual(calls, [["transient-stage2f-token", true]], "Trusted verifier must receive the transient ID token with checkRevoked=true.");
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(Object.isFrozen(accepted.providerPrincipal), true);
  assert.equal(Object.prototype.hasOwnProperty.call(accepted, "idToken"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(accepted, "token"), false);
  assert.equal(JSON.stringify(accepted).includes("transient-stage2f-token"), false);
  assert.notEqual(accepted.accountId, "client_spoofed_account");

  assert.equal((await trustedAuth.verifyTrustedRequestPrincipal(null)).code, "INVALID_TRUSTED_REQUEST_INPUT");
  assert.equal((await trustedAuth.verifyTrustedRequestPrincipal({ idToken: "", verifyIdToken: async () => ({ uid: verifiedUid }) })).code, "UNAUTHENTICATED_PROVIDER");
  assert.equal((await trustedAuth.verifyTrustedRequestPrincipal({ idToken: "token" })).code, "TRUSTED_VERIFIER_UNAVAILABLE");
  assert.equal((await trustedAuth.verifyTrustedRequestPrincipal({ idToken: "token", verifyIdToken: async () => ({}) })).code, "VERIFIED_PROVIDER_IDENTITY_INVALID");
  assert.equal((await trustedAuth.verifyTrustedRequestPrincipal({ idToken: "token", verifyIdToken: async () => ({ uid: verifiedUid, sub: "different_uid" }) })).code, "VERIFIED_PROVIDER_IDENTITY_INVALID");

  const expectedErrors = {
    "auth/id-token-revoked": "PROVIDER_TOKEN_REVOKED",
    "auth/user-disabled": "PROVIDER_ACCOUNT_DISABLED",
    "auth/id-token-expired": "PROVIDER_TOKEN_EXPIRED",
    "auth/user-not-found": "PROVIDER_ACCOUNT_UNAVAILABLE",
    "auth/invalid-id-token": "INVALID_PROVIDER_TOKEN",
    "auth/argument-error": "INVALID_PROVIDER_TOKEN"
  };
  assert.deepEqual(trustedAuth.errorCodes, expectedErrors);

  for (const [providerCode, expectedCode] of Object.entries(expectedErrors)) {
    const secretMessage = `must-not-reflect-${providerCode}`;
    const rejected = await trustedAuth.verifyTrustedRequestPrincipal({
      idToken: "must-not-reflect-token",
      verifyIdToken: async () => {
        const error = new Error(secretMessage);
        error.code = providerCode;
        throw error;
      }
    });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.action, "reject");
    assert.equal(rejected.code, expectedCode);
    assert.equal(JSON.stringify(rejected).includes(secretMessage), false, `${providerCode} provider detail must not be reflected.`);
    assert.equal(JSON.stringify(rejected).includes("must-not-reflect-token"), false, `${providerCode} raw token must not be reflected.`);
  }

  const unknownFailure = await trustedAuth.verifyTrustedRequestPrincipal({
    idToken: "unknown-failure-token",
    verifyIdToken: async () => {
      const error = new Error("sensitive provider diagnostic");
      error.code = "auth/internal-error";
      throw error;
    }
  });
  assert.equal(unknownFailure.code, "TRUSTED_PROVIDER_VERIFICATION_FAILED");
  assert.equal(JSON.stringify(unknownFailure).includes("sensitive provider diagnostic"), false);

  assert.doesNotMatch(trustedAuthSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(trustedAuthSource, /firebase\/|firebase-admin|serviceAccount|private_key|privateKey|console\.|JSON\.stringify\(idToken/i);
  assert.match(trustedAuthSource, /verifyIdToken\(idToken,true\)/);
  assert.match(trustedAuthSource, /applicationAuthorizationGranted:false/);
  assert.doesNotMatch(trustedAuthSource, /input\.(?:accountId|email|displayName|profileId|saveId|deviceId)/);

  assert.match(stage2e, /Trusted Application Account Bootstrap & Lifecycle Boundary/i);
  assert.match(stage2e, /DONE \/ MERGED \/ PROVEN/i);
  assert.match(stage2e, /f7d462b3d8252b2912f34a1589e457c03e977bd3/);
  assert.match(stage2e, /0cb56c22f82facdb248c8c68ec59064c5612c543/);
  assert.match(stage2e, /do not repeat Stage 2E/i);

  assert.match(stage2f, /Trusted Request Authentication & ID Token Revocation Boundary/i);
  assert.match(stage2f, /(?:CURRENT \/ IMPLEMENTATION-AUTHORIZED \/ TRUSTED-VERIFIER-CONTRACT|DONE \/ MERGED \/ PROVEN)/i);
  assert.match(stage2f, /verifyIdToken\(idToken, true\)/);
  assert.match(stage2f, /ordinary Admin SDK `verifyIdToken\(idToken\)`[\s\S]+does not by itself check revocation/i);
  assert.match(stage2f, /client-supplied `accountId`[\s\S]+zero authentication or authorization authority/i);
  assert.match(stage2f, /application authorization has not yet been granted/i);
  assert.match(stage2f, /Authentication Emulator[\s\S]+unsigned test tokens/i);
  assert.match(stage2f, /not production proof[\s\S]+revocation timing/i);
  assert.match(stage2f, /server client libraries bypass Firestore Security Rules and use IAM/i);
  assert.match(stage2f, /Every application-client Firestore create\/update\/delete remains denied/i);
  assert.match(stage2f, /Registered Devices \/ Private Pairing[\s\S]+BLOCKED/i);
  assert.match(stage2f, /Public profiles[\s\S]+global rankings/i);

  assert.match(stage2g, /Trusted Account Bootstrap Execution Boundary/i);
  assert.match(stage2g, /Stage 2F[\s\S]+DONE \/ MERGED \/ PROVEN/i);
  assert.match(stage2g, /1b0178979ea421b3bf27dd7675ad973aa7bfad8c/);
  assert.match(stage2g, /a27147695607537a1cd1543efb84e6583929a696/);
  assert.match(stage2g, /runAtomicAccountBootstrap/);
  assert.match(stage2g, /updatedByDeviceId` is exactly `null`/i);

  assert.match(emulatorTest, /FIREBASE_AUTH_EMULATOR_HOST\s*=\s*"127\.0\.0\.1:9099"/);
  assert.match(emulatorTest, /inMemoryPersistence/);
  assert.match(emulatorTest, /getIdToken\(true\)/);
  assert.match(emulatorTest, /verifyIdToken\(idToken, checkRevoked\)/);
  assert.match(emulatorTest, /checkRevoked:\s*true/);
  assert.match(emulatorTest, /client_spoofed_account_id/);
  assert.match(emulatorTest, /PROVIDER_ACCOUNT_DISABLED/);
  assert.match(emulatorTest, /revokeRefreshTokens/);
  assert.match(emulatorTest, /PROVIDER_TOKEN_REVOKED/);
  assert.match(emulatorTest, /applicationAuthorizationGranted/);
  assert.doesNotMatch(emulatorTest, /localStorage|sessionStorage|indexedDB|writeFile|appendFile|console\.log|console\.error/);
  assert.doesNotMatch(emulatorTest, /credential\s*:|cert\(|serviceAccount|private_key|privateKey/);

  assert.match(workflow, /private-account-auth-stage2f-token-verification-emulator\.cjs/);
  assert.match(workflow, /private-account-auth-stage2g-bootstrap-execution-emulator\.cjs/);
  assert.match(workflow, /--only auth,firestore/);
  assert.match(workflow, /firebase-admin@14\.2\.0/);
  assert.match(workflow, /timeout-minutes:\s*7/);

  assert.match(rules, /match \/accounts\/\{accountId\}[\s\S]+allow get: if signedIn\(\) && request\.auth\.uid == accountId;[\s\S]+allow list, create, update, delete:\s*if false/);
  assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

  assert.match(status.environmentId, /^we-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/, "Current WEC environment must use a valid fresh environment identifier.");
  assert.match(status.repository.startingMainSha, /^[0-9a-f]{40}$/, "Current WEC starting main must be an exact verified commit SHA, not a hard-coded historical environment boundary.");
  assert.equal(typeof status.continuity.currentTask, "string");
  assert.ok(status.continuity.currentTask.trim().length > 0, "Current WEC task must remain explicit without pinning every successor to the historical Stage 2G task.");
  assert.match(history, /Closure addendum — `we-2026-08-18-stage2f-token-verification`/);
  assert.match(history, /PR #90[\s\S]+1b0178979ea421b3bf27dd7675ad973aa7bfad8c[\s\S]+a27147695607537a1cd1543efb84e6583929a696/);

  assert.match(archivedNext, /Stage 2E[\s\S]{0,1000}DONE \/ MERGED \/ PROVEN/i, "Archived authority must retain Stage 2E completion provenance.");
  assert.match(next, /Stages 2A through 2I[\s\S]{0,160}DONE \/ MERGED \/ PROVEN/i, "Current authority must keep the completed Stage 2 lane status explicit.");
  assert.match(next, /Stage 2F[\s\S]{0,260}verifyIdToken\(idToken, true\)/i, "Current authority must preserve the live Stage 2F revocation-aware trust boundary.");
  assert.match(next, /production Firebase[\s\S]{0,500}(disconnected|DISCONNECTED|unprovisioned)/i);

  for (const [name, text] of [
    ["PROJECT_STATE.md", state],
    ["POST_V1_ROADMAP_EXECUTION.md", roadmap],
    ["REMOTE_JOINING_EXECUTION_ROADMAP.md", remoteRoadmap],
    ["00_CURRENT_HANDOFF.md", currentHandoff],
    ["00_DEVELOPER_START_HERE.md", start]
  ]) {
    assert.match(text, /Stage 2E[\s\S]{0,1000}DONE \/ MERGED \/ PROVEN/i, `${name} must reconcile Stage 2E as complete.`);
    assert.match(text, /Stage 2F[\s\S]{0,1200}(?:CURRENT|implementation-authorized|trusted request|DONE \/ MERGED \/ PROVEN)/i, `${name} must preserve the Stage 2F boundary while Stage 2G is synchronized.`);
    assert.match(text, /v1\.4\.0/i, `${name} must preserve the current production application version.`);
    assert.match(text, /1\.4\.0-r1/i, `${name} must preserve the current production runtime revision.`);
    assert.match(text, /production Firebase[\s\S]{0,700}(disconnected|NOT CONNECTED)/i, `${name} must preserve production Firebase isolation.`);
    assert.match(text, /Private Remote Joining[\s\S]{0,900}(?:DEPENDENCY-GATED|NOT YET IMPLEMENTATION-AUTHORIZED|blocked)/i, `${name} must preserve the gated Private Remote Joining boundary.`);
  }

  assert.equal(pkg.version, "1.4.0", "Stage 2F/2G dormant proof must not bump production application version.");
  assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
  assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
  assert.doesNotMatch(index, /trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase\/auth|firebase\/firestore/i);
  assert.doesNotMatch(optional, /trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase\/auth|firebase\/firestore/i);
  assert.doesNotMatch(worker, /trustedRequestAuthentication|trustedAccountBootstrapExecution|private-account-auth-stage2f|private-account-auth-stage2g|firebase-admin|firebase\/auth|firebase\/firestore/i);
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
  assert.doesNotMatch(lock.slice(0, 1800), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

  process.stdout.write("PASS Private Account/Auth Stage 2F trusted request authentication remains protected with archived Stage 2E provenance and current gateway trust authority\n");
})().catch(error => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exit(1);
});