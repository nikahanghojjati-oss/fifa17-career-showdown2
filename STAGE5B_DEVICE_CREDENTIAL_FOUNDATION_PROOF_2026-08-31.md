# Stage 5B Device Credential Foundation Proof — 2026-08-31

Status: DORMANT CANDIDATE SOURCE + LOCAL CONTRACT/BROWSER/AUTH-AND-FIRESTORE-EMULATOR PROOF. NOT PRODUCTION-ACTIVATED. ZERO RJR CREDIT.

Production remains `v1.8.1 / 1.8.1-r5`. Fixed RJR remains `87/100`. Production `firestore.spark.rules`, deployment configuration, browser runtime loading, trusted-runtime routes, IAM, Firebase Auth provider configuration, App Check enforcement and billing are unchanged.

## Security conclusion

The Stage 5A `device_id` claim cannot safely come from `setCustomUserClaims(uid, ...)`. Firebase custom user claims are user-wide, propagate to existing and future sessions, and are replaced on later issue/refresh. Two browsers sharing one Firebase `uid` would therefore race over one global device value.

The smallest provider mechanism that survived source review and emulator proof is a Firebase custom token carrying per-sign-in additional claims. Two simultaneous custom-auth sessions for the same `uid` retained different `device_id` values across forced ID-token refresh, and custom-token claims continued to override a later conflicting user-wide claim.

That mechanism is safe only when token issuance is bound to proof of possession of a device key. A browser-supplied device ID, installation ID or public key is not device authentication.

## Recovered Codex archive review

The owner supplied outage-recovery ZIP SHA-256 `dcf93bbcd6df82c83e64a947babe50fa7349ef35c44be2daaa8ebe5b92d2477e`. Its Git bundle SHA-256 `051f7dd58e884e66402c0f70f0c43ce48d2b48b44274165a17704b24f81944da` verified and exposed candidate commit `4847fa20d11531b697906eabac580da73f385d8e` from the same `c005f69c` starting main.

The archive's compact/deep v1.4.32 SLE naming and mirrored-package structure are useful and are incorporated into the current transition. Its product implementation is not imported because independent review found four security/compatibility defects:

- it writes one user-wide custom-claim map per Firebase UID, so two simultaneous device sessions race over one `device_id` value;
- it accepts an active browser-supplied device identifier without proof of possession of a device-bound key;
- its claim-clearing revocation leaves already-issued ID tokens usable while the registered-device document remains active;
- its `dev_` plus 64-hex identifier is incompatible with the repository's established `device_` plus 32-hex registered-device contract.

The stronger PR #174 candidate instead uses per-sign-in custom-token claims, non-extractable P-256 proof, exact repository device IDs and atomic registered-device-plus-credential revocation. No archive code was copied over the newer verified implementation.

## Dormant candidate protocol

`js/sparkDeviceCredential.js` provides a browser-only cryptographic boundary that is not loaded by production:

- one ECDSA P-256 private key generated non-extractable by Web Crypto;
- private key persistence in a dedicated IndexedDB database, never `localStorage` and never canonical Save storage;
- export of only the normalized public JWK;
- SHA-256 public-key fingerprinting;
- exact signed proof over account ID, device ID, public-key fingerprint, one-use challenge ID, 256-bit nonce, purpose and expiry;
- fail-closed detection of stored-key/device conflicts;
- validation of `custom` provider, `device_id`, credential version and an exact match between the provider device-key fingerprint claim and the local credential fingerprint.

`js/trustedDeviceCredentialIssuance.js` provides a provider-neutral trusted candidate that is also not routed by production:

- current Google provider principal required at both challenge and completion;
- Google reauthentication no older than five minutes required for first enrollment;
- an already-enrolled device may refresh only by signing a fresh two-minute challenge with the same private key;
- active account, active device and credential state rechecked before challenge and before commit;
- public-key fingerprint and JWK equality checked at both boundaries;
- ECDSA proof verified before the provider commit;
- provider commit required to atomically consume the challenge and conditionally enroll/refresh against unchanged account state, device state, credential state, public-key fingerprint and exact challenge expiry;
- replay, expiry, tampering, mismatched key, inactive account, revoked device and revoked credential fail closed;
- custom token minting occurs only after successful atomic commit;
- exact additional claims are `device_id`, `device_credential_version` and `device_key_sha256`;
- a custom-token session is forbidden from bootstrapping or refreshing its own device privilege.
- explicit revocation requires recent Google reauthentication and one atomic provider commit that terminally revokes both the registered-device state and credential state; corrected candidate Rules recheck the active device plus active credential document, version and exact key fingerprint on every session operation, so already-issued Device B tokens are denied while Device A remains authorized.

No custom token is created by repository source in production. No service-account key is committed, exported or allowed in the browser.

## Automated evidence

`tests/contracts/stage5b-device-credential-contracts.cjs` proves actual P-256 signing plus deterministic protocol behavior: initial enrollment, old-Google-session key refresh, one-use challenge consumption, exact two-minute challenge integrity, tamper denial, wrong-key denial, concurrent active-key-rotation denial, stale-initial-auth denial, non-Google denial, expiry denial, atomic device-plus-credential revocation, idempotent terminal revocation, exact local/provider fingerprint matching, exact claims and absence of activation wiring.

`tests/browser/stage5b-device-credential-audit.cjs` proves in headless Chromium that the private key is non-extractable, survives reload and offline access through IndexedDB, signs a verifiable challenge, never mutates `localStorage`, and cannot be reused under a different device ID.

`tests/firebase/stage5b-device-credential-emulator.cjs` uses real Firebase Auth and Firestore emulators. It proves:

- two custom tokens for the same `uid` carry distinct Device A and Device B claims;
- both claims survive forced Firebase ID-token refresh;
- later conflicting user-wide claims do not replace the per-sign-in custom-token claims;
- both active device credentials can perform exact Stage 5A session reads;
- missing and never-registered/forged claims fail closed;
- a token naming an active registered device but carrying the wrong `device_key_sha256` is denied directly by candidate Rules;
- a token naming an active registered device but carrying the wrong `device_credential_version` is denied directly by candidate Rules;
- a write whose `updatedByDeviceId` does not equal the token claim is denied;
- revoking Device B's registered-device document denies Device B's already-issued token while Device A remains authorized.

The non-extractable Web Crypto key is an origin-bound proof-of-possession mechanism, not hardware attestation. It reduces portable key theft but does not make an actively compromised browser origin or same-origin script safe. Production activation therefore still requires the existing trusted request/auth/App Check review path and may not describe this candidate as device attestation.

The permanent Stage 3/4/5 workflow installs pinned `firebase@12.17.1`, `@firebase/rules-unit-testing@5.0.1` and `firebase-admin@14.2.0`, runs the Stage 5B contract and browser proofs, then uses pinned `firebase-tools@15.28.1` with Java 21 for the combined Auth/Firestore proof. The local container supplied Java 17, so local execution used `firebase-tools@14.12.1` with the same application SDK/Admin/Rules packages; the final pull-request gate must independently prove the pinned Java 21 lane.

## Provider facts and production blocker

Firebase documents that:

- custom user claims are set on a user and propagate to existing and future sessions: <https://firebase.google.com/docs/auth/admin/custom-claims>;
- custom-token additional claims become Security Rules claims, and a client signed in with a custom token remains signed in until invalidation or sign-out: <https://firebase.google.com/docs/auth/admin/create-custom-tokens>;
- managed-environment custom-token signing requires `iam.serviceAccounts.signBlob`: <https://firebase.google.com/docs/auth/admin/create-custom-tokens>;
- Cloud Run is not available to Firebase projects on Spark: <https://firebase.google.com/docs/projects/billing/firebase-pricing-plans>.

The current production runtime role contains exactly:

1. `firebaseauth.users.get`
2. `datastore.databases.get`
3. `datastore.entities.get`
4. `datastore.entities.create`

A one-use production issuer on the selected Cloud Run target additionally needs at least:

- `iam.serviceAccounts.signBlob` to mint Firebase custom tokens without an exported private key;
- `datastore.entities.update` to atomically consume a persisted one-use challenge.

Production activation also introduces Firebase custom authentication, while the reviewed Stage 2C policy currently allows Google federated sign-in only and explicitly excludes custom authentication. Custom authentication can remain a separate secondary Auth instance so the primary Google session is not replaced, but that is still a provider-policy change requiring explicit owner authority.

Therefore no safe production issuer can be activated while all three current locks remain simultaneously true:

1. Firebase Spark / no linked billing account;
2. trusted runtime unactivated and IAM unbroadened;
3. Google provider only / no custom authentication.

## Review correction and controlling owner decision

Codex review of pre-seal head `f4689e6b0440e0490875afe74c75b2a218f3dbc6` found one valid P2: local `verifyCredentialClaims` rejected the wrong key fingerprint, but candidate Rules accepted any active `device_id` without comparing `device_key_sha256` or `device_credential_version` to credential authority.

The correction loads the exact `accounts/{uid}/deviceCredentials/{deviceId}` authority document and requires active state, version `1` and exact key-fingerprint equality. The emulator now sends direct Firestore reads with a missing claim, forged device, wrong key and wrong version so browser-helper checks cannot mask a Rules defect.

The owner then authorized every remaining IAM, provider, authentication-policy, Security Rules, runtime, deployment, testing, evidence and gate choice except billing. Billing must never be activated. No Cloud Billing account, Blaze upgrade or service requiring billing is allowed even when it offers a free usage tier.

That decision permanently excludes Cloud Run from the production critical path. Stage 5B remains preserved as correct dormant research but will not block a genuinely free Remote Joining release. The selected successor route is defined by `ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md`: existing Google Authentication plus exact-path Firestore Rules on Spark, with device IDs treated honestly as account-owned metadata rather than cryptographically provider-bound identity.

This architecture decision and P2 correction earn zero RJR credit. Production remains unchanged until separately reviewed provider-live Rules and runtime slices pass all gates.

## Explicit non-changes

- no production Rules publication;
- no production session document;
- no production custom token;
- no production custom-auth sign-in;
- no production runtime route or deployment;
- no IAM or billing change;
- no Auth persistence or Google OAuth scope change;
- no App Check enforcement change;
- no runtime host/join UI;
- no `localStorage` key or canonical Save mutation;
- no Candidate C action;
- no protected historical rivalry access;
- no discovery, listing, lobby, matchmaking, community, profile, ranking or leaderboard feature;
- no RJR score movement.
