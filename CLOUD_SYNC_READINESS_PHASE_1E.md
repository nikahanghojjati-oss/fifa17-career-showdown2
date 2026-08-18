# Cloud / Sync Readiness Phase 1E — Deterministic Two-Device and Offline/Reconnect Harness

Status: current bounded prerequisite implementation for the prioritized Private Remote Joining path
Runtime status: dormant provider-neutral source and permanent tests only
Production identity: v1.4.0 / `1.4.0-r1`
Provider connection: not authorized in Phase 1E

## Purpose

Phase 1E proves synchronization behavior before Firebase, the Firebase Emulator Suite, Security Rules, account UI, pairing runtime, Connected Rivalry runtime or Remote Joining runtime is allowed to exist.

The implementation is `js/cloudSyncTwoDeviceHarness.js`. It composes the protected Phase 1A revision/CAS/idempotency/tombstone kernel with deterministic simulated account, device and rivalry authority plus the protected raw storage transaction engine used by Candidate C-grade local Apply behavior.

The harness is deliberately not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`. It contains no production network call, backend SDK, credential, `localStorage` ownership or provider dependency.

## Identity boundary

The harness represents exactly two authenticated account identities and exactly two registered device identities. Those identities remain distinct from `profileId`, `saveId`, `seasonId`, `rivalryId`, `sessionId` and display labels.

Phase 1A predates the two-owner rivalry contract and exposes an account-scoped revision kernel. Phase 1E reuses that kernel with one fixed non-user internal sentinel only as a dormant compatibility scope. The sentinel is never a simulated authenticated principal, is not derived from any product identity, is removed from public harness authority snapshots and must never become a provider field or authorization source.

The actual simulated actor `accountId` comes only from the current registered device/account relationship held by the harness. Mutation authorization rechecks current account state, current device state, current rivalry membership and current relationship state before the Phase 1A mutation kernel is called.

The authorization gate is intentionally two-owner aware. Shared rivalry mutation is frozen if either currently required manager account is not active or if either manager's membership is no longer active. A still-active manager never acquires accidental sole mutation authority because the peer is disabled, retained, relinquished or otherwise outside the active two-owner mutation state. Read/retention rights remain a separate concern governed by the Phase 1D contract.

Malformed account/device/membership authority fails harness creation closed rather than being normalized into accidental active authority.

## Immutable intent rule

A device creates an intent from the exact authoritative revision it has observed.

The resulting intent is recursively frozen. The following cannot be silently changed by reconnect or provider-style retry:

- operation;
- device identity;
- target object identity;
- original `baseRevision`;
- idempotency key;
- content hash;
- payload.

Reconnect may refresh the device's current observation. It never mutates a previously queued intent. A stale queued intent therefore conflicts explicitly after another accepted mutation instead of being silently rebased.

## Deterministic two-device proof

Permanent contracts prove all of the following:

1. two independent devices start from one authoritative revision;
2. Device A can perform one accepted mutation;
3. Device B writing from the same now-stale original base receives an explicit conflict;
4. exact accepted idempotency replay is non-mutating and does not increment revision;
5. the same idempotency key with a different request fingerprint returns explicit idempotency conflict;
6. deletion creates a newer authoritative tombstone;
7. a long-offline stale device cannot resurrect that tombstone;
8. restoration is a separate explicit mutation against the current tombstone revision;
9. an interrupted request retains the same original `baseRevision` when retried;
10. a provider-style retry rereads authority but never rebases client intent;
11. offline mutation intent retains the base observed when the intent was created;
12. reconnect rechecks current account/device/rivalry authority and refreshes observation separately from queued intent;
13. repeated equivalent executions produce an identical deterministic final state;
14. a revoked device cannot mutate afterward;
15. a disabled account cannot mutate and relationship revocation remains authoritative;
16. a rivalry membership change invalidates stale cached membership assumptions;
17. the still-active manager also cannot mutate while the other required manager account is disabled or while either required membership is not active;
18. malformed or unsupported payloads are rejected before authoritative mutation;
19. local canonical state changing after remote/local preview but before Apply is detected as a stale precondition;
20. movement in any reviewed canonical key is detected even when that key was not changed by the candidate;
21. precondition, write, rollback or ownership failure cannot clobber newer local state the transaction no longer owns;
22. disabling the remote/cloud path preserves local-only Save Library use;
23. Candidate A export remains available and non-mutating;
24. Candidate B analysis remains read-only;
25. Candidate C remains the exclusive destructive import Apply authority;
26. canonical local storage remains the permanent three-key model: Save Library, Legacy and preferences;
27. no proof path requires production Firebase, production network access or remote credentials.

The original owner-required 25-point matrix remains fully covered; points 17 and 20 above make the two source-review hardening requirements explicit rather than weakening or replacing any original requirement.

## Local Apply boundary

The harness never calls `localStorage`.

For deterministic local Apply proof it gives each simulated device an in-memory raw representation of only the permanent canonical keys:

- `saveLibrary`;
- `legacyShowdowns`;
- `preferences`.

A preview captures exact expected raw values for the full canonical three-key review set and is recursively frozen. Candidate input may intentionally change only a subset, but Apply still sends all three reviewed keys through `runCareerModeRawStorageTransaction()`: candidate values for changed keys and the exact reviewed values for unchanged keys. The transaction uses explicit canonical ordering plus `guardRequestedBeforeEachWrite:true`.

This means a key that was reviewed but not changed by the candidate cannot move between preview and Apply unnoticed.

Tests prove:

- movement in any reviewed canonical key after preview is rejected before candidate bytes can overwrite it;
- if a write fails after an earlier transaction-owned write and another actor changes that earlier key, rollback refuses to overwrite those newer bytes and returns the existing critical ownership-failure state.

This is proof of the future remote-to-local transaction boundary. It does not authorize any remote download to mutate production browser storage.

## Cloud disable / local fallback

`remoteEnabled = false` prevents remote mutation in the harness while explicitly preserving these local contracts:

- Save Library local-only operation remains usable;
- Candidate A export remains available/non-mutating;
- Candidate B remains read-only;
- Candidate C remains the only destructive import Apply authority;
- no remote success is fabricated.

## Payload boundary

The harness accepts only deterministic plain-object payloads carrying an explicitly supported positive `payloadFormatVersion` and a valid `sha256:` content-hash shape for put/restore operations.

Unsupported future payload versions and malformed payload/hash shapes fail before authoritative state is changed.

The hash is synchronization integrity metadata only. Phase 1E does not present a client-provided hash as authentication, authorization, encryption or proof of provider origin.

## Provider retry boundary

`simulateProviderRetry()` models the security-relevant behavior of a provider transaction retry without implementing any provider.

The first attempt reads current authority and compares the original base. If the base is already stale, the intent conflicts immediately. If another accepted mutation occurs after that read but before retry, the retry rereads the newer authority and submits the exact original frozen request. The result is an explicit stale conflict.

A future Firebase transaction may reproduce this transport behavior, but Phase 1F must prove it in the Emulator. Phase 1F may never replace the original base with the newly read Firestore revision.

## Production/runtime boundary

Phase 1E must remain absent from the production shell.

It may not add or enable:

- Firebase client SDK imports;
- Firebase project configuration or credentials;
- Firebase Authentication runtime;
- production Firestore data;
- deployed Firestore Security Rules;
- persistent Firestore offline cache;
- Cloud Functions or Blaze billing;
- account UI;
- pairing/invite runtime;
- Connected Rivalry runtime;
- Remote Joining UI or transport;
- Cloud Backup;
- public discovery, public profiles, public matchmaking, community surfaces, leaderboards or global rankings.

Because the Phase 1E implementation is dormant infrastructure/test code and does not change shipped application behavior, `VERSIONING_POLICY.md` keeps production at v1.4.0 / `1.4.0-r1`.

## Validation authority

Permanent proof is `tests/contracts/cloud-sync-two-device-harness-contracts.cjs`, explicitly wired into `tests/support/run-contract-suite.cjs`.

The contract proves the harness is not production-loaded, contains no provider/network/browser-persistence dependency, rejects malformed authority, freezes complete offline intent, freezes mutation when the required two-owner state is not active, guards the full reviewed three-key local snapshot and preserves Candidate C rollback ownership.

No timeout, performance ceiling, Candidate C recovery guarantee or existing contract may be weakened to obtain green.

## Exit gate and exact next dependency

Phase 1E is complete only when:

1. the deterministic two-device/offline/reconnect contract passes as part of the permanent repository suite;
2. all existing Cloud/Sync and Candidate C protections still pass;
3. production source remains v1.4.0 / `1.4.0-r1` with the harness absent from the shell;
4. all required normal PR workflow families are successful on the exact unchanged PR head;
5. submitted reviews and inline review threads are clean;
6. the PR is mergeable and the expected-head squash merge succeeds;
7. live `main` is independently verified afterward.

Only after that exact gate may the project advance to Phase 1F: Firebase provider connection plus Firebase Local Emulator Suite and deny-by-default Security Rules proof.

Phase 1F remains blocked while Phase 1E is unmerged or unproven. Private account runtime, registered devices, secure pairing, Connected Rivalry and Private Remote Joining remain later dependency-gated stages.
