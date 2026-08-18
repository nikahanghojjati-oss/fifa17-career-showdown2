# Private Account / Authentication Stage 2G — Trusted Account Bootstrap Execution Boundary

Status: CURRENT / IMPLEMENTATION-AUTHORIZED / EMULATOR-PROOF-ONLY / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-18 ET

Starting live-main boundary: `a27147695607537a1cd1543efb84e6583929a696` after Stage 2F PR #90.

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

## Purpose

Stage 2F is DONE / MERGED / PROVEN through PR #90. It verifies a transient Firebase ID token through an injected trusted verifier using the equivalent of `verifyIdToken(idToken, true)`, derives architecture `accountId` only from the verified Firebase `uid`, fails closed for invalid or unavailable verification and deliberately grants no general application authorization.

Stage 2E is DONE / MERGED / PROVEN through PR #89. It defines the trusted same-UID application account bootstrap decision, but its emulator helper demonstrates the trusted read and trusted write separately. That is not sufficient as a future production execution protocol because a concurrent create or conflicting document could appear between the read and write.

Stage 2G closes only that execution gap. It composes Stage 2F authentication with Stage 2E bootstrap planning and requires one injected trusted atomic account transaction adapter. It does not choose a production server runtime, deploy Firebase, select IAM/service identity, add account UI or grant shared gameplay mutation authority.

## Inherited completed Stage 2F boundary

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — is DONE / MERGED / PROVEN through PR #90.

Exact validated PR #90 head:

`1b0178979ea421b3bf27dd7675ad973aa7bfad8c`

Squash merge / independently verified live-main completion boundary:

`a27147695607537a1cd1543efb84e6583929a696`

All 13 normal pull-request workflow families succeeded on the exact unchanged PR #90 head before merge. Submitted reviews and inline review threads were empty.

Do not repeat Stage 2F.

## Exact Stage 2G execution model

The dormant implementation is `js/trustedAccountBootstrapExecution.js`.

Its public decision entry point is `executeTrustedAccountBootstrap(input)`.

The only client-originated authentication material accepted by this boundary is the transient Firebase ID token. Client-supplied `accountId`, email, display name, profile identity, device identity, rivalry identity or session identity has zero authentication authority.

Execution is ordered exactly:

1. Validate bounded input structure.
2. Pass the transient ID token only to the Stage 2F trusted verifier boundary.
3. Require revocation-aware trusted verification through `verifyIdToken(idToken, true)`.
4. Derive `accountId` only from the verified Firebase `uid`.
5. Require an injected trusted `runAtomicAccountBootstrap` adapter.
6. Give that adapter only the verified `accountId`, exact `accounts/{accountId}` path, immutable initial-create specification and Stage 2E decision callback. The raw ID token is not passed to the transaction adapter.
7. The trusted adapter must read the authoritative account document inside the same atomic transaction that would create it.
8. The Stage 2E decision callback evaluates the exact account state observed inside that transaction.
9. A missing account may commit exactly one revision-0 create.
10. A valid existing active, disabled or deletion-pending account must commit no write.
11. A malformed, conflicting or wrong-identity account must commit no write and fail closed.
12. A provider-verification failure, unavailable adapter, transaction failure, invalid transaction result or commit/decision mismatch fails closed.
13. Return only a bounded result. Never reflect the raw ID token or arbitrary provider/transaction diagnostics.

The injected transaction adapter is a trusted-server contract, not a browser extension point. Stage 2G does not authorize production code to accept an arbitrary transaction function from an untrusted request.

## Atomicity is mandatory

A separate trusted read followed by an unconditional write is forbidden as a production execution pattern.

The account observation and conditional create must occur in one provider transaction or equivalent atomic compare-and-create primitive.

If two bootstrap requests race from the same authenticated account, at most one initial account create may commit. A transaction retry that observes the now-existing valid account must return the existing/no-write outcome. It must not reset revision, overwrite creation metadata, reactivate a disabled account or cancel deletion-pending state.

If a conflicting or malformed account appears before commit, bootstrap fails closed rather than repairing it by overwrite.

## Narrow application authorization

Successful provider authentication does not grant general application authorization.

Stage 2G grants only the narrow authority already defined by the Phase 1D account matrix: `self-bootstrap-only` for a missing `accounts/{accountId}` document where `accountId` is the verified provider UID.

A successful Stage 2G result reports `applicationAuthorizationGranted: "account-bootstrap-only"`.

It does not authorize:

- account lifecycle updates after bootstrap;
- account deletion;
- profile linkage;
- device registration or revocation;
- invite creation or redemption;
- rivalry creation or mutation;
- Connected Rivalry shared-state writes;
- private-session creation or joining;
- Remote Joining gameplay operations.

Those remain separately gated.

## Revision-0 device attribution deadlock and narrow resolution

Phase 1D defined `updatedByDeviceId` as registered-device attribution. Stage 3 defines Registered Devices / Private Pairing, but Stage 3 is blocked until Stage 2 account/authentication/authorization is complete. The initial application account must therefore exist before a registered application device can truthfully exist.

Stage 2G resolves only this bootstrap dependency cycle:

- for the one revision-0 `accounts/{accountId}` self-bootstrap create, `updatedByDeviceId` is exactly `null`;
- `updatedByAccountId` is the verified Firebase UID / architecture `accountId`;
- `null` here means no registered application device exists yet; it is never an authentication substitute or a wildcard device identity;
- Stage 2G grants no device registration authority;
- after device registration exists, any later operation that requires device attribution must use a real currently authorized registered `deviceId` under its own reviewed authorization contract.

This is a narrow successor clarification of the Phase 1D common-envelope wording, not permission to omit device attribution from ordinary later remote mutations.

## Initial-create specification

The trusted transaction receives an immutable initial-create specification containing the fixed bootstrap authority:

- `schemaVersion: 1`;
- `objectType: "account"`;
- `objectId` equal to verified `accountId`;
- `revision: 0`;
- `parentRevision: null`;
- `lifecycleState: "live"`;
- `priorContentHash: null`;
- `updatedByAccountId` equal to verified `accountId`;
- `updatedByDeviceId: null` only under the revision-0 bootstrap exception above;
- `data.status: "active"`;
- `data.deletionRequestedAt: null`;
- `tombstone: null`;
- `data.createdAt` and `updatedAt` supplied by the trusted provider/server timestamp authority;
- a valid Phase 1D canonical live-data `contentHash` supplied by the trusted materialization adapter after timestamp materialization.

Stage 2G does not accept those fixed identity/lifecycle values from the client request body.

## Trusted adapter result contract

The injected atomic adapter returns a bounded transaction result containing:

- boolean `committed`;
- the final Stage 2E bootstrap `decision` made from the account state observed inside the transaction.

The execution boundary validates the relationship between the final decision and commit result:

- `create` requires `committed: true`;
- `existing` requires `committed: false`;
- any reject decision requires `committed: false`;
- account identity and document path must exactly match the verified provider identity.

A mismatch fails closed with a bounded Stage 2G error and grants no additional authority.

## Emulator proof requirements

Permanent emulator proof is `tests/firebase/private-account-auth-stage2g-bootstrap-execution-emulator.cjs`.

It must use only the fixed local Firebase emulators and test-only Admin SDK installation already used by prior proof stages.

The proof must demonstrate at minimum:

1. Real Authentication Emulator ID token wiring reaches Stage 2F revocation-aware verification.
2. Client-supplied account identity cannot redirect the trusted account path.
3. The raw ID token is not passed to the trusted transaction adapter or returned in the result.
4. The Admin/Firestore emulator transaction reads and conditionally creates `accounts/{uid}` atomically.
5. One missing account bootstrap creates exactly one revision-0 live account.
6. The initial create uses verified `updatedByAccountId` and exact `updatedByDeviceId: null` bootstrap attribution.
7. Repeated bootstrap returns existing/no-write and preserves revision, timestamps and lifecycle.
8. Disabled and deletion-pending accounts remain unchanged and are never reactivated.
9. Concurrent same-UID bootstrap attempts result in at most one committed create and a deterministic final single account document.
10. A conflicting existing identity fails closed and is not overwritten.
11. Transaction adapter failure fails closed without provider diagnostics or token reflection.
12. Invalid transaction-result or decision/commit mismatch fails closed.
13. Browser clients still cannot create, update or delete application account metadata.
14. No production Firebase project, production credentials or production network endpoint is needed.
15. Production application/runtime files do not load Stage 2G or Firebase/Admin dependencies.

## Firestore Security Rules and IAM boundary

Every application-client Firestore create, update and delete remains denied.

Stage 2G does not weaken `firestore.rules` and does not use a browser client as the trusted write executor.

Firebase documentation states that server client libraries bypass Firestore Security Rules and are secured through IAM. Therefore the emulator/Admin transaction in Stage 2G proves the required trusted execution semantics only. It does not select or authorize a production service identity, IAM role, Cloud Functions, Cloud Run or any other production hosting boundary.

Production least-privilege IAM/service identity remains a separately reviewed later Stage 2 prerequisite.

## Shared-state remote-write lock remains unchanged

Stage 2G is account bootstrap only.

The Phase 1D/1F shared-state finding remains binding: the protected shared-state schema does not expose the sibling idempotency receipt key needed for Firestore Security Rules to fully enforce the replay/idempotency contract against a modified browser client.

Therefore Stage 2G must not be generalized into direct browser rivalry/shared-state mutation authority. Every application-client Firestore create/update/delete remains denied.

A future trusted production mutation gateway or separately reviewed provider-enforceable protocol/schema change remains necessary before production shared remote writes may ship.

## Production isolation

Stage 2G does not add or authorize:

- Firebase or Firebase Admin in production `package.json`;
- Firebase/Auth/Firestore imports in the GitHub Pages shell;
- Stage 2G code in `index.html`, `js/optionalModules.js` or `service-worker.js`;
- a real Firebase production project or web app;
- production users;
- production Google provider / Authorized Domains activation;
- a production Firestore database or Security Rules deployment;
- a production Admin SDK runtime;
- production service-account/private-key credentials;
- a production IAM/service identity;
- Cloud Functions or Cloud Run;
- Blaze billing;
- production account UI;
- device registration;
- pairing or invite runtime;
- Connected Rivalry runtime;
- Private Remote Joining runtime;
- public discovery, public profiles, public matchmaking, community systems or global rankings.

## Local recovery and storage locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C remains the sole destructive import Apply authority with strict raw snapshots, exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery.

No Stage 2G/Auth/cloud module may directly own canonical `localStorage`.

## Version boundary

Stage 2G is dormant source, emulator/test proof and authority documentation only. It is not loaded by the production application and changes no shipped runtime behavior.

Under `VERSIONING_POLICY.md`, no semantic application version bump is appropriate for this bounded prerequisite. Production remains v1.4.0 / `1.4.0-r1`.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 remains incomplete during Stage 2G.

Production Firebase provisioning, production Web App/provider/Authorized Domains operational setup, least-privilege IAM/service identity, deployed production Security Rules, account export, provider-aware deletion cascade, abuse/rate controls, provider outage/recovery behavior, production operational validation and the separately reviewed trusted shared-mutation gateway remain later Stage 2 concerns. Their listing is not automatic implementation order.

Registered Devices / Private Pairing remains Stage 3 and BLOCKED until the whole Stage 2 lane is proven.

Connected Rivalry remains Stage 4 and BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Completion gate

Stage 2G may be classified DONE / MERGED / PROVEN only after:

- permanent Stage 2G static contracts pass;
- the real Auth/Firestore Emulator trusted atomic bootstrap execution proof passes;
- every application-client Firestore write remains denied;
- production runtime isolation is proven;
- current-facing authority is synchronized without erasing protected historical provenance;
- all 13 normal pull-request workflow families succeed on one exact unchanged final head;
- submitted reviews and inline review threads are clean;
- mergeability and exact-head identity are verified;
- the bounded PR is squash merged with expected-head protection;
- live `main` is independently verified after merge.

Do not begin Stage 3 or any separate later Stage 2 prerequisite inside the Stage 2G publication boundary.
