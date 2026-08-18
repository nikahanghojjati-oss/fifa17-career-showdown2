# Cloud / Sync Readiness Phase 1F — Firebase Emulator and Security Rules Proof

Status: CURRENT BOUNDED CANDIDATE
Effective: 2026-08-18 ET
Production application: v1.4.0 / `1.4.0-r1` remains unchanged
Production Firebase runtime: NOT CONNECTED
Production Firestore data: NOT CREATED
Production Security Rules deployment: NOT AUTHORIZED
Cloud Functions / Blaze billing: NOT AUTHORIZED

## 1. Purpose

Phase 1F is the provider-specific proof layer after Phase 1E. It connects the selected Firebase provider only inside a deterministic development/emulator boundary and proves what Firebase Authentication context, Cloud Firestore Security Rules and Firestore transactions can safely enforce without changing the GitHub Pages application runtime.

This phase does not implement accounts, pairing, Connected Rivalry, Remote Joining, Private Cloud Backup or any public surface.

Phase 1F composes and preserves the already-protected Phase 1A through Phase 1E contracts. Provider behavior may not replace the project-owned revision, conflict, replay, tombstone, authorization, recovery or local Apply semantics.

## 2. Exact development provider configuration

The proof uses only the Firebase Local Emulator Suite with project ID:

`demo-career-mode-showdown-phase1f`

The `demo-` prefix is deliberate. Firebase recommends demo projects for emulator-only work where practical because they have no live resources; accidental calls to non-emulated products fail rather than reaching production data or incurring resource usage.

Repository configuration:

- `.firebaserc` fixes the demo project identity;
- `firebase.json` loads `firestore.rules`, binds the Firestore emulator to localhost port 8080, disables the Emulator UI and uses one project identity;
- `firestore.rules` is the deny-by-default application-client ruleset under test;
- `tests/firebase/cloud-sync-phase1f-emulator.cjs` is the emulator behavior proof.

No Firebase project credential, API secret, service account, Admin credential or production user data is required.

## 3. Toolchain pins

The exact CI proof toolchain is deliberately pinned:

- Firebase JavaScript SDK `12.17.1`;
- `@firebase/rules-unit-testing` `5.0.1`;
- Firebase CLI `15.27.0`;
- Java 21 via `actions/setup-java@v5`;
- repository Node 24 authority remains unchanged.

These packages are installed only for the CI proof with `--no-save --package-lock=false`. They are not added to `package.json`, `package-lock.json`, `index.html`, `js/optionalModules.js` or `service-worker.js` and therefore are not production application dependencies.

## 4. Persistent offline cache remains disabled

Firestore persistent offline cache remains disabled for Career Mode Showdown synchronization.

The web SDK default remains memory-only unless persistent local caching is explicitly configured. Phase 1F does not enable persistent Firestore cache anywhere. This preserves the project rule that provider reconnect behavior may not introduce silent last-write-wins authority over gameplay state.

Queued/offline mutation intent remains project-owned and must retain its original immutable `baseRevision` and payload as proven by Phase 1E.

## 5. Firebase Auth identity boundary

Production account UI/runtime is not implemented here, but the Security Rules proof uses the same principal boundary that future Firebase Auth must provide:

`request.auth.uid` is the authenticated `accountId`.

Security Rules never trust a client-supplied `accountId` field as identity proof.

`deviceId` and `installationId` remain revocable/diagnostic attribution metadata, not authentication.

The Rules Unit Testing library supplies authenticated and unauthenticated test contexts without production accounts.

## 6. Deny-by-default Security Rules boundary

Phase 1F intentionally grants no application-client create, update or delete authority to Firestore.

Every client write path is denied in `firestore.rules`.

Narrow direct `get` access is proven for the Phase 1D read model:

- account/profile-link/device/security-event records are self-only;
- rivalry and authoritative shared state are exact-get only for currently entitled authenticated accounts;
- private session exact-get requires current rivalry entitlement plus current session membership;
- idempotency exact-get requires current rivalry entitlement and the same authenticated actor recorded by the receipt;
- an open unexpired invite may be read only by an authenticated holder of the exact opaque capability path or its creator;
- invite collection listing remains denied;
- rivalry, state and idempotency collection listing remains denied;
- unauthenticated access remains denied;
- all unmatched documents are denied.

The raw invite capability remains only the opaque document path identifier. It is never duplicated into the invite document body.

## 7. Source-grounded provider security finding

Phase 1D requires an accepted shared-state mutation and its idempotency receipt to be one logical atomic operation. The current exact Phase 1D shared-state schema intentionally does not copy `idempotencyKeyHash` into the authoritative shared-state document.

That creates an important provider boundary: a Security Rule evaluating a direct shared-state write does not know which sibling `idempotency/{idempotencyKeyHash}` path must accompany that write. Firestore `getAfter()` can validate another document in an atomic operation only when the rule can identify the document path to inspect.

Therefore Phase 1F does not pretend that a client transaction helper is a security boundary. If client shared-state writes were allowed, a modified client could bypass the helper and omit the required idempotency receipt.

The safe Phase 1F decision is:

1. deny application-client remote writes;
2. prove narrow provider-enforced read authorization with Security Rules;
3. use `withSecurityRulesDisabled()` only inside the local emulator test as a test-only trusted mutation boundary;
4. exercise the complete revision/CAS/replay/tombstone/current-authority transaction semantics against real Firestore transaction retry behavior;
5. require a later explicit production mutation-boundary decision before any real remote write is enabled.

A later production candidate may propose either a trusted server mutation gateway or a separately reviewed schema/protocol change that makes every invariant enforceable. Phase 1F does not choose that boundary and does not authorize Cloud Functions, Admin SDK runtime, Blaze billing or server deployment.

## 8. Trusted emulator transaction proof

The emulator-only trusted mutation helper is not production source and is not loaded by the application. It exists solely to prove provider transaction semantics against the protected application contract.

Every first-seen proof mutation preserves this order:

1. receive trusted actor identity separately from the request body;
2. reject a client-supplied `accountId` field;
3. reread current account, registered device, rivalry governance and authoritative state;
4. require exactly two manager slots and current active entitlement;
5. require both required accounts to remain active;
6. check an existing idempotency receipt before stale-base comparison so an exact accepted replay remains non-mutating;
7. compare the immutable original client `baseRevision` with current provider authority;
8. reject stale state explicitly;
9. enforce tombstone versus explicit restore behavior;
10. perform exactly one logical state mutation and matching hashed idempotency receipt in one Firestore transaction;
11. advance exactly one monotonic revision;
12. return deterministic accepted, replayed, conflict or authorization results.

The raw idempotency key is SHA-256 hashed for its Firestore path and is never stored in the receipt body.

## 9. Provider transaction retry lock

Firestore can rerun a transaction callback when a document read by the transaction changes concurrently.

Phase 1F permanently proves that the original client request remains outside provider retry authority. The test injects a concurrent authoritative state change after the first transaction read, requires Firestore to retry the callback, and then proves:

- the original request's `baseRevision` remains unchanged;
- the retry rereads the newer authoritative revision;
- the stale original request returns explicit conflict;
- provider retry does not silently rebase the request;
- no extra logical mutation or revision is produced by the stale request.

## 10. Replay, tombstone and current-authority proof

The emulator proof permanently covers:

- first accepted mutation creates exactly the next revision;
- exact accepted idempotency replay returns the recorded result with no new write or revision increment;
- the same idempotency key with a changed request fingerprint fails explicitly;
- stale concurrent mutation returns explicit `STALE_BASE_REVISION` conflict;
- deletion writes a newer tombstone with `data: null` and `contentHash: null`;
- stale live state cannot resurrect a tombstone;
- ordinary `put` cannot implicitly restore a tombstone;
- explicit `restore` against the current tombstone revision creates a new live revision;
- a revoked device cannot mutate;
- disabling the required peer account freezes the still-active manager's shared mutation authority;
- retained/relinquished peer entitlement freezes shared mutation;
- rejected authorization cases leave provider state unchanged.

## 11. Local-only and recovery boundary

Phase 1F does not load any Firebase code into the Career Mode Showdown application shell.

Turning the future remote layer off therefore continues to leave the current local application fully usable. The following protected systems remain untouched:

- Candidate A non-mutating export;
- Candidate B read-only analysis;
- Candidate C as the only destructive import Apply authority;
- exact three-key canonical local storage: Save Library, Legacy and preferences;
- Candidate C strict raw snapshot, last-moment preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber and exact verification.

No Phase 1F provider module directly owns `localStorage`.

## 12. Privacy, deletion and provider-control limits

The emulator contains synthetic test data only.

No production Firestore region is selected and no production account/data retention claim is made. Provider-controlled production backups, logs, account deletion and regional behavior remain unproven until a production provider boundary is explicitly authorized and documented.

This prevents Phase 1F from claiming stronger deletion/privacy guarantees than the deployed provider can later prove.

## 13. Permanent exclusions

Phase 1F does not add or authorize:

- production Firebase SDK/runtime in GitHub Pages;
- production Firebase Auth accounts or account UI;
- production Firestore collections/data;
- production Security Rules deployment;
- Cloud Functions;
- Firebase Admin SDK runtime;
- Blaze billing;
- persistent Firestore offline cache;
- pairing product UX;
- Connected Rivalry runtime;
- Remote Joining runtime or UX;
- Private Cloud Backup;
- public profiles;
- public search/discovery;
- public invitation directories;
- matchmaking;
- community systems;
- public/global leaderboards or rankings.

## 14. Version boundary

Phase 1F is configuration, emulator-only development infrastructure, tests and authority documentation. It does not alter shipped application behavior or production runtime bytes.

Under `VERSIONING_POLICY.md`, production remains:

- application `v1.4.0 Product Deepening`;
- package `1.4.0`;
- runtime `1.4.0-r1`;
- previous known-good whole shell `1.3.0-r2`.

No visible version bump is consumed by this dormant provider proof.

## 15. Phase 1F completion gate

Phase 1F is complete only when one exact candidate proves all of the following:

1. Phase 1E is recorded DONE / MERGED / PROTECTED at PR #80 merge `cebd9c031657c9ee01ba68f1baaac7816c9748b9` from exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`;
2. Firebase emulator configuration uses only the fixed demo project;
3. Firestore Security Rules are deny-by-default;
4. unauthorized reads and every application-client write fail in the emulator;
5. exact authorized reads and private capability reads obey current Auth context and exact object scope;
6. broad list/discovery access fails;
7. provider transaction retry preserves the immutable original client `baseRevision`;
8. explicit conflicts, exact replay, mismatched replay, tombstones, anti-resurrection, current device/account/membership authority and two-owner mutation freeze remain intact;
9. raw invite/idempotency secrets are not stored unnecessarily;
10. production package/runtime identity and first-party shell bytes remain unchanged;
11. Candidate A/B/C and local-only recovery remain intact;
12. no privileged secret or production user data exists in the candidate;
13. all existing repository contracts remain green without timeout/performance/recovery weakening;
14. the new emulator proof passes on the exact PR head;
15. reviews/threads are clean and the candidate is mergeable.

After Phase 1F merges and live `main` is independently verified, reassess Work Environment Continuity before opening the distinct private account/authentication prerequisite. Do not begin account product UX merely because the emulator proof exists.

## Primary provider references used for this proof

- Firebase Local Emulator Suite installation/configuration: `https://firebase.google.com/docs/emulator-suite/install_and_configure`
- Connect the app to the Firestore Emulator / demo project guidance: `https://firebase.google.com/docs/emulator-suite/connect_firestore`
- Security Rules testing: `https://firebase.google.com/docs/rules/unit-tests`
- Firestore Security Rules conditions and atomic `getAfter()`: `https://firebase.google.com/docs/firestore/security/rules-conditions`
- Firestore transactions: `https://firebase.google.com/docs/firestore/manage-data/transactions`
- Firestore offline behavior: `https://firebase.google.com/docs/firestore/manage-data/enable-offline`
