# Cloud / Sync Readiness Phase 1F — Firebase Emulator and Security Rules Proof

Status: DONE / MERGED / PROTECTED through PR #81
Exact validated PR head: `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`
Squash merge / live-main completion boundary: `231556d86a93535fa90e173577c1159de4f40be0`
Production application: v1.4.0 / `1.4.0-r1` remains unchanged
Production Firebase runtime: NOT CONNECTED
Production Firestore data: NOT CREATED
Production Security Rules deployment: NOT AUTHORIZED
Cloud Functions / Blaze billing: NOT AUTHORIZED

## Purpose and completed boundary

Phase 1F is the completed provider-specific proof layer after Phase 1E. It connects Firebase only inside a deterministic development/emulator boundary and proves what Firebase Authentication context, Cloud Firestore Security Rules and Firestore transactions can safely enforce without changing the GitHub Pages application runtime.

Phase 1F did not implement accounts, pairing, Connected Rivalry, Remote Joining, Private Cloud Backup or any public surface.

## Exact development provider configuration

The proof uses only the Firebase Local Emulator Suite with project ID:

`demo-career-mode-showdown-phase1f`

The `demo-` prefix is deliberate. There is no live Firebase resource attached to this proof project.

Repository configuration remains:

- `.firebaserc` fixes the demo project identity;
- `firebase.json` loads `firestore.rules`, binds Firestore to localhost port 8080, disables the Emulator UI and uses one project identity;
- `firestore.rules` is the deny-by-default client ruleset;
- `tests/firebase/cloud-sync-phase1f-emulator.cjs` is the real provider transaction/Security Rules proof.

No production Firebase project credential, API secret, service account, Admin credential or production user data is required.

## Toolchain pins

The exact CI proof toolchain remains:

- Firebase JavaScript SDK `12.17.1`;
- `@firebase/rules-unit-testing` `5.0.1`;
- Firebase CLI `15.27.0`;
- Java 21 via `actions/setup-java@v5`;
- repository Node 24 authority.

These packages are installed only for CI proof with `--no-save --package-lock=false`. They are absent from the production package dependency graph and application shell.

## Persistent offline cache remains disabled

Firestore persistent offline cache remains disabled for Career Mode Showdown synchronization.

Queued/offline mutation intent remains project-owned and retains its original immutable `baseRevision` and payload as proven by Phase 1E. Provider reconnect behavior may not introduce silent last-write-wins gameplay authority.

## Firebase Auth identity boundary

Phase 1F did not implement production account UI/runtime, but its Security Rules proof established the future principal boundary:

`request.auth.uid` is the authenticated `accountId`.

Security Rules never trust a client-supplied `accountId` field as identity proof. `deviceId` and `installationId` remain attribution/revocation metadata, not authentication.

## Deny-by-default Security Rules boundary

Phase 1F permanently grants no application-client create, update or delete authority to Firestore.

Every application-client write path remains denied in `firestore.rules`.

Narrow direct `get` access is proven for self-scoped account/profile-link/device/security metadata and currently entitled private rivalry/state/session/idempotency objects. Private invite exact-capability access remains narrow. Invite, rivalry, state and idempotency listing remains denied. Unauthenticated and unmatched access remains denied.

The raw invite capability remains only the opaque exact document path identifier and is never duplicated into the invite document body, logs, analytics or public directories.

## Source-grounded provider security finding

Phase 1D requires an accepted shared-state mutation and its idempotency receipt to be one logical atomic operation. The exact Phase 1D shared-state schema does not copy `idempotencyKeyHash` into the authoritative shared-state document.

A Security Rule evaluating a direct shared-state write does not know which sibling `idempotency/{idempotencyKeyHash}` path must accompany that write. Firestore `getAfter()` can validate another document in an atomic operation only when the rule can identify the exact document path to inspect.

Therefore Phase 1F does not pretend that a client transaction helper is a security boundary. A modified client could otherwise bypass the helper and omit the required replay receipt.

The permanent Phase 1F decision is:

1. deny application-client remote writes;
2. prove narrow provider-enforced read authorization with Security Rules;
3. use `withSecurityRulesDisabled()` only inside the local emulator test as a test-only trusted mutation boundary;
4. exercise revision/CAS/replay/tombstone/current-authority semantics against real Firestore transaction retry behavior;
5. require a later explicit production mutation-boundary decision before real remote writes are enabled.

A future production candidate may propose either a trusted server mutation gateway or a separately reviewed schema/protocol change that makes every invariant provider-enforceable. Phase 1F does not authorize Cloud Functions, Admin SDK runtime, Blaze billing or server deployment.

## Trusted emulator transaction proof

The emulator-only trusted helper is not production source and is not loaded by the application.

Every first-seen proof mutation:

1. receives trusted actor identity separately from the request body;
2. rejects a client-supplied `accountId` field;
3. rereads current account, device, rivalry governance and authoritative state;
4. requires exactly two manager slots and current entitlement;
5. requires both required accounts active;
6. checks existing idempotency receipt before stale-base comparison so exact accepted replay remains non-mutating;
7. compares the immutable original client `baseRevision`;
8. rejects stale state explicitly;
9. enforces tombstone versus explicit restore behavior;
10. creates exactly one logical mutation and matching hashed idempotency receipt in one Firestore transaction;
11. advances exactly one revision;
12. returns deterministic accepted/replayed/conflict/authorization results.

The raw idempotency key is SHA-256 hashed for its Firestore path and is never stored in the receipt body.

## Provider transaction retry lock

Firestore may rerun a transaction callback when a read document changes concurrently.

Phase 1F permanently proves that the original client request remains outside provider retry authority. The original `baseRevision` remains unchanged across retry; the retry rereads newer provider authority; stale original intent returns explicit `STALE_BASE_REVISION`; provider retry never silently rebases client intent; and the stale retry creates no extra logical mutation.

## Replay, tombstone and current-authority proof

The real emulator proof permanently covers:

- first accepted mutation creates exactly the next revision;
- exact accepted idempotency replay is non-mutating;
- reused key with changed request fingerprint fails explicitly;
- stale concurrent mutation returns explicit conflict;
- deletion creates a newer tombstone with `data: null` and `contentHash: null`;
- stale live state cannot resurrect a tombstone;
- ordinary put cannot implicitly restore a tombstone;
- explicit restore targets the current tombstone revision and creates a newer live revision;
- revoked device and disabled account authority is denied;
- required-peer account/entitlement loss freezes shared mutation;
- rejected authorization leaves provider state unchanged.

## Local-only and recovery boundary

Phase 1F loads no Firebase code into the Career Mode Showdown production shell.

Candidate A non-mutating export, Candidate B read-only analysis and Candidate C as the only destructive import Apply authority remain untouched.

Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber and exact verification.

Canonical local storage remains exactly Save Library, Legacy and preferences. No Phase 1F provider module directly owns `localStorage`.

## Privacy and provider-control limits

The emulator contains synthetic test data only. No production Firestore region is selected and no production account/data-retention guarantee is claimed from emulator proof alone.

Provider-controlled production backups/logs/account deletion/regional behavior remain future provider-operation proof.

## Permanent exclusions

Phase 1F did not add or authorize:

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
- public profiles/search/discovery/invitation directories/matchmaking/community systems;
- public/global leaderboards or rankings.

## Version boundary

Phase 1F is configuration, emulator-only infrastructure, tests and authority documentation. It did not alter shipped application behavior or production runtime bytes.

Under `VERSIONING_POLICY.md`, production remains:

- application `v1.4.0 Product Deepening`;
- package `1.4.0`;
- runtime `1.4.0-r1`;
- previous known-good whole shell `1.3.0-r2`.

## Completion proof

Phase 1F completed through PR #81 from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`, squash merged to live `main` as `231556d86a93535fa90e173577c1159de4f40be0` on 2026-08-18 UTC.

The successor independently re-fetched PR #81 and independently verified all 13 normal pull-request workflow families successful on the exact unchanged head. Production source remains v1.4.0 / `1.4.0-r1` and production Firebase remains disconnected.

Historical pre-merge status wording that called Phase 1F the current bounded candidate is provenance only and is superseded by the completed PR #81 boundary above.

## Exact next dependency

The next dependency lane is private account / authentication / authorization.

`NEXT_TASK.md` authorizes only **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**, defined in `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Stage 2A must prove real Firebase Authentication Emulator `uid` identity through the existing Firestore Security Rules while remaining emulator/test-only. It must not broaden into production accounts, pairing, Connected Rivalry, Remote Joining, Cloud Functions/Admin/Blaze or application-client Firestore writes.
