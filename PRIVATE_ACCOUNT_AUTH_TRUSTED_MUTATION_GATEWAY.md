# Private Account / Authentication / Authorization — Trusted Mutation Gateway Boundary

Status: CURRENT SELECTED REMAINING STAGE 2 PREREQUISITE / IMPLEMENTATION IN PROGRESS / PRODUCTION DORMANT / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-19 ET

Starting verified live-main boundary: `902058d56ec3f1b1fef4918f38568b54cf2dd7bb` after PR #100.

This prerequisite is intentionally descriptive: there is no invented `Stage 2J` label. Current source proves Stages 2A through 2I complete, but Stage 2 as a whole remains incomplete. The smallest remaining blocker before Stage 3 Registered Devices / Private Pairing is a trusted shared-mutation execution boundary that preserves the Phase 1D/1F revision, authorization and replay model while browser Firestore writes remain denied.

## Why this prerequisite is required

Every application-client Firestore create, update and delete remains denied. That invariant is intentional because the Phase 1D authoritative shared-state schema and sibling idempotency receipt cannot be safely enforced by a modified browser client through the current Security Rules contract.

Stage 2H already selected a dedicated same-project Google Cloud Run HTTPS service, dedicated user-managed service identity, Application Default Credentials and least-privilege IAM as the future trusted execution topology. Stage 2I already proves App Check, revocation-aware Firebase Authentication, verified-UID account identity and operation-specific application authorization before an injected trusted operation executes.

However, Stage 2H's exact four-permission IAM role is deliberately limited to account bootstrap and Stage 2I grants no shared-mutation authority. Stage 3 cannot safely register/revoke devices or redeem pairing capabilities until there is a provider-neutral trusted mutation gateway contract that can later host those exact operations without weakening browser Security Rules or silently broadening IAM.

This boundary therefore proves the mutation mechanism only. It does not authorize any Stage 3 device, invite, pairing, rivalry, session or gameplay operation and does not broaden the production IAM role.

## Permanent composition order

A future state-changing request must preserve these distinct gates:

1. Stage 2H production-origin defense in depth.
2. Stage 2I transient App Check verification for the exact expected production Web App and project.
3. Stage 2F revocation-aware `verifyIdToken(idToken, true)`.
4. Architecture `accountId` derived only from verified Firebase UID.
5. Route/operation-level Career Mode Showdown authorization.
6. Trusted Mutation Gateway immutable-intent validation.
7. One trusted provider transaction or equivalent atomic compare-and-mutate primitive.
8. Transaction-current application authorization against the authoritative account/device/rivalry/session state required by the exact operation.
9. Exact accepted-replay / idempotency check.
10. Immutable original `baseRevision` comparison.
11. Exactly one operation-specific logical mutation at exactly the next monotonic revision.
12. Idempotency receipt creation in the same atomic transaction.
13. Deterministic bounded response.

A coarse operation authorization before the transaction never substitutes for transaction-current authorization. Cached membership, display labels, client-supplied account identity and stale device/session state grant no authority.

## Immutable request intent

The gateway accepts only a provider-authenticated actor plus an operation-specific request envelope containing:

```text
operation
objectType
objectId
deviceId
installationId | null
baseRevision
idempotencyKey
payload | null
```

The request must not contain a trusted `accountId`, authoritative `revision`, `authorizedAccountIds`, entitlement state or provider credential.

The gateway captures and deep-freezes the normalized logical intent before entering the provider transaction. Provider retries may reread authoritative state but may never refresh, replace or auto-rebase the original `baseRevision`, idempotency key, object identity, device attribution, operation or payload.

## Trusted hashing boundary

The raw idempotency key is transient request material. It is never stored in Firestore, logs, analytics, diagnostics or returned to the client.

Before the transaction, a trusted SHA-256 adapter computes:

```text
idempotencyKeyHash = sha256(raw idempotency key)
requestFingerprint = sha256(deterministic canonical JSON of immutable logical intent excluding raw idempotency key)
```

Only the hashes enter the transaction adapter and stored idempotency receipt.

## Transaction-current authorization

The provider transaction adapter must expose the authoritative object state and the exact current authorization context required by the operation. The gateway invokes a separately injected transaction-current application authorizer before any first-seen logical mutation may commit.

The authorizer must fail closed when any required account is disabled/deletion-pending, the registered device is revoked or absent when required, rivalry entitlement is stale/revoked, a session is expired/revoked/closed, a capability is invalid, or another operation-specific condition is no longer true.

The gateway itself does not invent Stage 3 authorization policy. Future device/pairing operations must supply their own reviewed policy after Stage 3 is formally unlocked.

## Exact replay and conflict behavior

For an existing idempotency receipt:

- same `idempotencyKeyHash` plus same `requestFingerprint` returns the recorded accepted result as `replayed` and performs no mutation;
- same key hash with a different fingerprint returns `idempotency-conflict` and performs no mutation.

For a first-seen receipt:

- transaction-current authorization must succeed;
- authoritative object revision must equal the immutable original `baseRevision`;
- mismatch returns explicit `STALE_BASE_REVISION` conflict and performs no mutation;
- the operation planner may produce exactly one next-revision mutation plus one immutable idempotency receipt;
- both must commit atomically or neither commits.

An exact accepted replay remains replayable even if the authoritative object later advanced. Replay returns the original accepted result and never creates a new revision.

## Mutation result invariants

Every accepted first-seen mutation must prove:

```text
next revision = baseRevision + 1
parentRevision = baseRevision
updatedByAccountId = verified actor accountId
updatedByDeviceId = exact reviewed request deviceId when the operation requires registered-device attribution
```

Operation planners cannot silently change object identity, actor identity, base revision or idempotency authority. Tombstone/restore behavior remains governed by the Phase 1D contract and must be explicitly authorized by the future operation-specific planner.

## Deterministic response boundary

The gateway may return only bounded synchronization authority:

```text
status: accepted | replayed | conflict | forbidden | invalid-request | idempotency-conflict
objectType
objectId
revision
parentRevision
contentHash | null
tombstone
idempotencyKeyHash
```

Conflict responses include only the authoritative revision/hash/tombstone metadata required by the Phase 1D contract. They do not disclose the full remote gameplay payload.

Raw App Check tokens, Firebase ID tokens, raw idempotency keys, provider stack traces and arbitrary provider diagnostics are never reflected.

## Provider transaction contract

The injected provider adapter owns the actual Firestore transaction or equivalent atomic primitive. It must supply current authoritative state and current authorization context to the gateway callback, then atomically apply only the callback's reviewed mutation and idempotency receipt decision.

A separate trusted read followed by an unconditional write is forbidden.

The adapter result must state whether a commit occurred and return the exact decision produced by the gateway. Any mismatch between gateway decision and commit state fails closed.

## Production and IAM boundary

This prerequisite does not provision or connect:

- production Firebase project or Web App;
- Google provider / Authorized Domains;
- App Check / reCAPTCHA Enterprise;
- Cloud Run service;
- service account;
- custom role or IAM binding;
- production Firestore data or Security Rules;
- billing;
- production users;
- device registration;
- pairing/invite runtime;
- Connected Rivalry;
- Private Remote Joining.

The Stage 2H runtime permission set remains exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

No update/delete/shared-state permission is added by this prerequisite. Future Stage 3 operations must justify their exact additional provider methods and IAM permissions separately before any production role expansion.

## Storage, recovery, identity and product locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with exact snapshot, precondition, transaction, rollback, anti-clobber, verification and corrupt-byte-preservation guarantees.

Firebase UID / architecture `accountId` remains distinct from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

Exactly two manager slots remain authoritative. Public discovery, public profiles, public matchmaking, public invitation directories, community systems, global leaderboards and public rankings remain eliminated.

## Exit gate

This prerequisite is complete only when dormant executable source and permanent contracts prove:

- immutable intent captured outside provider retries;
- no client-supplied account authority;
- trusted hashing of idempotency material;
- transaction-current application authorization before first-seen mutation;
- exact replay and idempotency-conflict behavior;
- stale-base conflict without mutation;
- exactly-next-revision accepted mutation;
- atomic mutation plus idempotency receipt ownership;
- commit/decision mismatch rejection;
- bounded credential-free responses;
- browser Firestore write denial unchanged;
- Stage 2H IAM unchanged;
- production resources remain disconnected;
- no Stage 3 operation is pre-authorized.

Only after this boundary is DONE / MERGED / PROVEN may current source reassess whether any other Stage 2 prerequisite remains before Stage 3 Registered Devices / Private Pairing can unlock.
