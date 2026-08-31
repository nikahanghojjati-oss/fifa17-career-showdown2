# Stage 5B Device Credential Foundation Proof — 2026-08-31

Status: DORMANT CANDIDATE SOURCE + LOCAL CONTRACT/BROWSER/AUTH-AND-FIRESTORE-EMULATOR PROOF. NOT PRODUCTION-ACTIVATED. ZERO RJR CREDIT.

Production remains `v1.8.1 / 1.8.1-r5`. Fixed RJR remains `87/100`. Production `firestore.spark.rules`, deployment configuration, browser runtime loading, trusted-runtime routes, IAM, Firebase Auth provider configuration, App Check enforcement and billing are unchanged.

## Security conclusion

The Stage 5A `device_id` claim cannot safely come from `setCustomUserClaims(uid, ...)`. Firebase custom user claims are user-wide, propagate to existing and future sessions, and are replaced on later issue/refresh. Two browsers sharing one Firebase `uid` would therefore race over one global device value.

The smallest provider mechanism that survived source review and emulator proof is a Firebase custom token carrying per-sign-in additional claims. Two simultaneous custom-auth sessions for the same `uid` retained different `device_id` values across forced ID-token refresh, and custom-token claims continued to override a later conflicting user-wide claim.

That mechanism is safe only when token issuance is bound to proof of possession of a device key. A browser-supplied device ID, installation ID or public key is not device authentication.

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
- explicit revocation requires recent Google reauthentication and one atomic provider commit that terminally revokes both the registered-device state and credential state; candidate Rules recheck the active device document on every session operation, so already-issued Device B tokens are denied while Device A remains authorized.

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

## Owner decision required before production activation

The evidence-backed direct-Firestore path needs explicit authority for a bounded production change:

1. upgrade the Firebase project from Spark to Blaze so Cloud Run can be deployed;
2. activate the reviewed trusted runtime with a Stage 5B endpoint;
3. add only `iam.serviceAccounts.signBlob` and `datastore.entities.update` to the runtime boundary after separate least-privilege review;
4. authorize secondary Firebase custom authentication for device-bound session access without replacing the primary Google session;
5. implement and provider-prove the Firestore challenge/key adapter, including atomic key-fingerprint preconditions and atomic device-plus-credential revocation, before any Stage 5A session Rules publication.

If those changes are not authorized, Stage 5A must remain dormant and production Remote Joining cannot safely use a per-device `request.auth.token.device_id` boundary. Weakening the Rules to account-only access or treating a browser-supplied identifier as authentication is not an acceptable fallback.

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
