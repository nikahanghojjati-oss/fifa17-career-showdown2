# NEXT TASK — Career Mode Showdown

## CURRENT SUCCESSOR AUTHORITY — TRUSTED MUTATION GATEWAY PREREQUISITE — 2026-08-19 ET

Current verified source, live GitHub, the owner’s Remote Joining priority / anti-sidequest instruction and later owner instructions override archived predecessor authority.

Status: CURRENT REMAINING STAGE 2 PREREQUISITE / TRUSTED MUTATION GATEWAY / DORMANT IMPLEMENTATION / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED / REMOTE JOINING PRIORITY ACTIVE.

Current branch: `agent/stage2-remaining-dependency-reconstruction`.
Current environment: `we-2026-08-19-stage2-remaining-dependency-reconstruction`.
Starting independently verified live main: `902058d56ec3f1b1fef4918f38568b54cf2dd7bb`.
Fresh WEC decision: `CONTINUE`.
Usage: unavailable and not estimated.
Authorized product candidate: none.

The predecessor PR #100 environment’s `HANDOFF_AT_CHECKPOINT` decision is not inherited. This successor initialized a fresh WEC identity and reset per-environment observations from verified live main before selecting this prerequisite.

## Exact predecessor authority preservation

The complete PR100-era `NEXT_TASK.md` is preserved byte-for-byte at:

`authority-history/NEXT_TASK_POST_PR100_REMOTE_JOINING_RESTART_FULL.md`

Exact archived blob SHA:

`cc2a855f9f421a99739fed0573669627d328e92e`

The older pre-PR98 archive remains:

`authority-history/NEXT_TASK_PRE_PR98_TRANSITION_FULL.md`

with protected blob SHA `2c5a16d191bf470f5463aaf7f71dcdb876d49837`.

Archived authority is provenance only and does not authorize current implementation.

## Verified live boundary

PR #100 `Close stale post-PR99 authority and resume Remote Joining path` is DONE / MERGED / PROVEN.

Exact PR #100 head: `c098b435908aa04a803f09f90fac2730bf1a4542`.
Squash merge / independently verified current starting live main: `902058d56ec3f1b1fef4918f38568b54cf2dd7bb`.
All 13 normal pull-request workflow families succeeded on the exact PR #100 head. Submitted reviews and inline review threads were empty.

PR #99 `Reconcile post-PR98 successor continuity` remains DONE / MERGED / PROVEN from exact head `fc9dcc9cb7d298beb8fc07f4ed8caf2470394da3` to merge `0f61225b267e8334467a6d868d36c7ce58dd54a0` and changed exactly five files.

The continuity/history-only lane is closed. Do not create another history-only, continuity-refinement, documentation-cleanup, workflow-beautification, naming or archival milestone unless a concrete failing permanent contract, contradictory implementation authority, unsafe publication/recovery state or security blocker objectively requires it.

## Current Remote Joining dependency state

Stage 1 — Cloud / Sync Readiness Phase 1A through 1F — DONE / MERGED / PROTECTED.

Stage 2 — Private Account / Authentication / Authorization — ACTIVE prerequisite lane.

Stages 2A through 2I — DONE / MERGED / PROVEN at their protected dormant boundaries.

Stage 2 is not yet proven complete because privileged shared mutation still lacks a production-safe provider-neutral execution boundary while every browser Firestore write remains denied.

Current selected remaining Stage 2 prerequisite:

Trusted Mutation Gateway Boundary.

Detailed authority:

`PRIVATE_ACCOUNT_AUTH_TRUSTED_MUTATION_GATEWAY.md`

Dormant implementation:

`js/trustedMutationGateway.js`

Permanent executable proof:

`tests/contracts/private-account-auth-trusted-mutation-gateway-contracts.cjs`

This prerequisite intentionally has no invented `Stage 2J` label. Requirement identity comes from the actual dependency gap, not roadmap numbering.

Stage 3 — Registered Devices / Private Pairing — remains BLOCKED until this prerequisite and every other actually required Stage 2 prerequisite are DONE / MERGED / PROVEN.

Stage 4 — Connected Rivalry — remains BLOCKED behind Stage 3.

Stage 5 — Private Remote Joining — remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Required dependency order remains:

Cloud / synchronization readiness
→ private account / authentication / authorization
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining

## Why this prerequisite is the smallest next dependency

Every application-client Firestore create/update/delete remains denied.

The Phase 1D / Phase 1F idempotency-receipt finding means the browser cannot safely become the authoritative shared-state writer merely by loosening Security Rules. A trusted transaction gateway or separately reviewed provider-enforceable redesign is required.

Stage 2H already selected the future trusted Cloud Run/service-identity/IAM topology, but its reviewed runtime role remains account-bootstrap-only. Stage 2I already proves App Check, revocation-aware Firebase Authentication, verified-UID account identity and operation-specific application authorization before an injected trusted operation.

The missing prerequisite is the shared mutation mechanism between those trust gates and future Stage 3 operation-specific device/pairing policy.

The Trusted Mutation Gateway proves only that mechanism. It grants no device, pairing, invite, rivalry, session or gameplay operation by itself.

## Protected trust order

For every future protected non-preflight browser mutation request preserve this order:

1. Stage 2H production-origin defense in depth.
2. Transient `X-Firebase-AppCheck` token.
3. Trusted Firebase Admin App Check verification.
4. Exact expected production Firebase Web App identity verification.
5. Exact production project audience verification.
6. Stage 2F revocation-aware `verifyIdToken(idToken, true)`.
7. Architecture `accountId` derived only from verified Firebase UID.
8. Route/operation-specific Career Mode Showdown authorization.
9. Trusted Mutation Gateway immutable-intent capture.
10. One provider transaction or equivalent atomic compare-and-mutate primitive.
11. Transaction-current application authorization against current operation state.
12. Exact replay/idempotency handling.
13. Immutable original `baseRevision` comparison.
14. Exactly one authorized next-revision mutation plus idempotency receipt in the same atomic commit.
15. Deterministic bounded response.

App Check grants no account, device, pairing, rivalry, session, gameplay or IAM authority.

## Permanent mutation invariants

The raw client idempotency key is never stored. A trusted SHA-256 adapter derives the idempotency-key hash and deterministic request fingerprint before the provider transaction.

The normalized operation, object identity, `deviceId`, optional `installationId`, original `baseRevision` and payload are captured outside provider retry callbacks and remain immutable for the logical request.

An exact accepted replay returns the original result with no mutation even if authoritative state later advanced.

Reuse of an idempotency key with a different request fingerprint returns `idempotency-conflict` with no mutation.

A first-seen stale `baseRevision` returns explicit `STALE_BASE_REVISION` conflict with no mutation and no full gameplay payload disclosure.

An accepted first-seen mutation must produce exactly `revision = baseRevision + 1`, `parentRevision = baseRevision`, verified actor attribution and reviewed device attribution. Mutation and idempotency receipt commit atomically or neither commits.

Provider commit/decision disagreement fails closed.

## Protected Stage 2H and production boundary

Stage 2H reviewed runtime permissions remain exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

Do not broaden them in this prerequisite. In particular, this prerequisite does not add update/delete/shared-state permissions. Future Stage 3 operations must justify exact additional provider methods and IAM permissions separately before any production role expansion.

Every application-client Firestore create/update/delete remains denied.

Production Firebase, Firebase Web App, Google provider/Authorized Domains, reCAPTCHA Enterprise, App Check enforcement, Cloud Run, service accounts, IAM bindings/custom roles, billing, production users/data/provider configuration and production Security Rules remain disconnected/unprovisioned.

Production application milestone remains `v1.4.0`; package remains `1.4.0`; Installable Offline App runtime remains `1.4.0-r1`; previous whole shell remains `1.3.0-r2`.

This dormant prerequisite receives no semantic application-version bump because shipped runtime behavior is unchanged.

## Storage, recovery, identity and private-product locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with exact raw snapshot, preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber protection, exact verification, corrupt-byte preservation and retry/idempotence guarantees intact.

Firebase Auth UID maps to architecture `accountId`. It remains distinct from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

Exactly two manager slots remain authoritative.

Public discovery, public profiles, public matchmaking, public invitation directories, community systems, global leaderboards and public rankings remain eliminated.

## Current authorized task

Implement and prove only the Trusted Mutation Gateway Boundary.

Required implementation proof:

1. Capture immutable intent outside provider retries.
2. Reject client-supplied account authority and transient credential forwarding.
3. Hash raw idempotency material only through a trusted SHA-256 adapter before the transaction.
4. Require transaction-current application authorization for first-seen mutation.
5. Return exact accepted replay without mutation.
6. Reject reused key with different fingerprint.
7. Return stale-base conflict without mutation or full payload disclosure.
8. Enforce exactly-next revision, parent revision, verified account attribution and exact request device attribution.
9. Own mutation plus immutable idempotency receipt in the same provider transaction decision.
10. Reject provider commit/decision mismatch.
11. Keep responses bounded and credential-free.
12. Keep Stage 2H IAM unchanged.
13. Keep browser Firestore writes denied.
14. Keep production resources disconnected.
15. Authorize zero Stage 3 device/pairing operations.
16. Register permanent contracts in the complete repository suite.
17. Require all 13 normal workflow families on one exact unchanged final PR head, clean reviews/threads and expected-head merge protection.

Do not begin Stage 3 device registration or pairing inside this prerequisite. Do not provision production cloud resources. Do not weaken existing Stage 2F/2H/2I, recovery, identity, storage or two-owner contracts to obtain green CI.

After this prerequisite is merged and independently verified, reassess the actual remaining Stage 2 dependency graph. If no further Stage 2 prerequisite remains, formally close Stage 2 and unlock Stage 3. If another real prerequisite remains, select only the smallest necessary blocker rather than inventing work.

## Historical compatibility references — non-authoritative

The following completed predecessor strings are retained only for migration of permanent tests while exact predecessor authority remains archived. They grant zero current implementation authority:

`CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE JOINING RESTART`

`Status: ONE BOUNDED POST-PR #99 AUTHORITY CLOSEOUT / NON-RUNTIME / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED / REMOTE JOINING PRIORITY ACTIVE`

`agent/post-pr99-remote-joining-restart`

Historical predecessor statement: `No later Stage 2 prerequisite is selected by this bounded post-PR #99 closeout`.

Historical predecessor statement: `This closure selects no new Stage 2 implementation prerequisite` belonged to Stage 2I completion, not to the current successor.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish the dormant Trusted Mutation Gateway implementation and permanent contracts, run one diagnostic exact-head PR gate, correct only objective source/coherence or implementation defects, freeze the final WEC seal as the last mutation, require all 13 normal workflow families on that exact head with clean reviews/threads, publish with expected-head protection, independently verify live main, then reassess whether Stage 2 can close and Stage 3 Registered Devices / Private Pairing can begin.