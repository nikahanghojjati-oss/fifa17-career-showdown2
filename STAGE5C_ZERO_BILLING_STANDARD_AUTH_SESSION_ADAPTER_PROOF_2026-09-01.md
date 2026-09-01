# Stage 5C Zero-Billing Standard-Auth Session Adapter Proof — 2026-09-01

## Result

The bounded `stage5c-zero-billing-standard-auth-session-adapter` candidate is source-, deterministic-contract-, and Auth-plus-Firestore-emulator-proven.

It removes Stage 5B custom device claims from the production critical path without deleting that research. The candidate uses the existing standard Firebase authenticated `uid` as account identity, preserves the exact private-session lifecycle, and treats a registered device ID only as account-owned mutation attribution/revocation metadata.

Production remains unchanged. This proof does not publish `firestore.stage5c.rules`, load the adapter in the application, expose host/join UX, create a production session, change Auth/provider/IAM/App Check configuration, or earn Remote Joining readiness credit.

## Implemented boundary

- `js/sparkStandardAuthPrivateSession.js` adapts the existing Stage 5 session protocol to standard Firebase UID authority.
- `js/sparkPrivateSession.js` retains provider-device-credential behavior by default and exposes one explicit `standard-auth-device-metadata` mode for the Stage 5C adapter.
- `firestore.stage5c.rules` is an isolated candidate. It differs from provider-proven production Rules only inside the marked session functions and session match.
- `tests/contracts/stage5c-zero-billing-standard-auth-session-contracts.cjs` owns deterministic protocol, isolation, local-first/quota and zero-billing assertions.
- `tests/firebase/stage5c-zero-billing-standard-auth-session-emulator.cjs` owns the real standard-Auth-token plus Firestore Rules proof.
- `.github/workflows/validate-stage3-private-pairing.yml` permanently runs the Stage 5C deterministic and Java 21 Auth-plus-Firestore emulator gates after Stage 5A and Stage 5B.

## Identity and device truth

The provider identity boundary is `request.auth.uid` from an ordinary Firebase ID token. The Auth Emulator users carry no `device_id`, `device_credential_version`, or `device_key_sha256` custom claims.

The existing production sign-in policy remains popup-only Google Authentication with `browserSessionPersistence` and no extra scopes. The emulator uses its ordinary password test provider only to generate standard Firebase ID tokens; that is test machinery and is not a production provider-policy change.

Registered device IDs are not authentication and are not provider-bound physical-browser proof. The client rechecks its selected exact active account-owned registered-device document before every operation. Candidate Rules require writes to name an exact active device under the authenticated account. Because an untrusted browser cannot attach a provider-verifiable device ID to an exact `get`, the Rules read boundary is instead the standard authenticated UID, both currently active rivalry accounts, and possession of the exact 256-bit session capability. This limitation is explicit rather than disguised.

## Proven positive lifecycle

The deterministic and emulator proofs establish:

1. a currently entitled account with active account/device metadata opens an exact `session_[64 hex]` capability;
2. the stored open authority has revision 0, one host member, bounded expiry and exact account/device mutation attribution;
3. only the other currently entitled rivalry account joins `open -> active`;
4. membership becomes exactly the two rivalry accounts at revision 1;
5. an active member may close, while only the host may revoke;
6. a current member may record expiry only after the provider-time boundary;
7. exact same-target terminal retries are idempotent and perform no new write;
8. closed, revoked or expired sessions cannot be resurrected.

## Proven negative and recovery boundary

The real Auth-plus-Firestore emulator proves:

- missing authentication is denied;
- an authenticated third/wrong account is denied exact get and join;
- inactive application-account authority is denied;
- missing or revoked device metadata denies client operations and denies direct session mutations;
- the exact read remains account/capability-authorized rather than falsely claiming browser-device authentication;
- session collection and collection-group listing are denied;
- stale revision/parent/hash CAS updates are denied without mutation;
- session delete is denied;
- host-only expiry becomes terminal and a never-joined peer has no later exact-get/join authority;
- closed authority cannot be rewritten to active.

The deterministic quota fixture injects Firestore `resource-exhausted`. The adapter returns the bounded provider failure, leaves every remote fixture unchanged, and leaves the exact three canonical local-storage fixtures byte-for-byte unchanged. No automatic upgrade or billing path exists.

## Production exclusions

The production deployment mapping still selects `firestore.spark.rules`, whose provider-proven Git blob remains `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. Root Firebase configuration also remains unchanged. `index.html`, `js/app.js`, `js/productionFirebaseRuntime.js`, and `service-worker.js` do not load the Stage 5C adapter.

There is no Cloud Billing account, Blaze upgrade, payment method, Cloud Run, custom-token issuer, new IAM binding, persistent Firestore cache, App Check enforcement change, new OAuth scope, public discovery/listing/community/matchmaking/ranking surface, local Save mutation, new localStorage key, Candidate C authority change, or protected-rivalry mutation.

## Readiness accounting

Fixed RJR-1 remains exactly `87/100` with domain vector `20/20`, `18/20`, `20/20`, `20/30`, `9/10`.

The adapter, candidate Rules, deterministic tests, emulators, workflow, review, merge, documentation and deployment mechanics receive zero capability credit. Production-live playable host/join evidence is required before RJR can move.

## Next distinct gates

After this candidate passes exact-head workflows, final-head review, thread and expected-head merge gates, the next product work remains separate:

1. minimum production session Rules review/publication;
2. separately reviewed runtime loading and host/join UX while preserving local-first play;
3. provider-live two-account/two-device/two-network acceptance and Remote Joining-specific reconnect/adverse-network hardening;
4. evidence-backed RJR reassessment and stable release acceptance.

Every gate remains zero-billing. Quota exhaustion fails safely; it never authorizes an upgrade or charge.
