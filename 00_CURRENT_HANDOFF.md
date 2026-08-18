# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns implementation authorization unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. `00_WORK_ENVIRONMENT_CONTINUITY.md` owns the development-environment assessment protocol. Release and frozen proof documents remain evidence for the release/candidate they name.

## Current source boundary

Verified live `main` at Phase 1E start:

`fc2e8e8b921a435103a438a9239efbb890584d22`

This is PR #79, Cloud/Sync Readiness Phase 1D exact remote contract.

PR #79 exact validated head:

`2e3c9560590fb934e684fbae44138f16194da6bd`

At successor startup all 13 normal exact-head PR workflow families were independently verified successful, submitted reviews were empty and inline review threads were empty.

Production application remains:

`v1.4.0 — Product Deepening`

Production Installable Offline App runtime remains:

`1.4.0-r1`

Immediate previous known-good whole shell remains:

`1.3.0-r2`

Phase 1A, 1B, 1C and 1D are closed, merged and protected non-runtime Cloud/Sync prerequisites. They did not require a visible application version bump.

## Current authorized prerequisite candidate

Cloud/Sync Readiness Phase 1E — deterministic two-device and offline/reconnect synchronization harness.

Active branch:

`agent/cloud-sync-phase-1e-two-device-harness`

Exact branch base:

`fc2e8e8b921a435103a438a9239efbb890584d22`

Detailed authority:

`CLOUD_SYNC_READINESS_PHASE_1E.md`

Dormant implementation:

`js/cloudSyncTwoDeviceHarness.js`

Permanent proof:

`tests/contracts/cloud-sync-two-device-harness-contracts.cjs`

The harness composes rather than rewrites the Phase 1A revision/CAS/replay/tombstone kernel. It adds deterministic two-device observation, recursively immutable offline intent, current account/device/rivalry authorization, reconnect behavior, provider-style retry proof and an in-memory Candidate C-grade local transaction boundary.

It is not loaded by the production shell and contains no Firebase, Firestore, production network call, credential or direct `localStorage` ownership.

## Phase 1E protected behavior

The bounded candidate permanently proves:

1. two devices begin from one authoritative revision;
2. one accepted mutation advances authority exactly once;
3. the other device's stale original `baseRevision` receives explicit conflict;
4. exact accepted replay is non-mutating;
5. reused idempotency key with a different fingerprint fails explicitly;
6. deletion creates a tombstone and long-offline stale state cannot resurrect it;
7. restore is a separate explicit mutation from the current tombstone revision;
8. queued intent and payload are recursively immutable;
9. reconnect refreshes device observation without rebasing queued intent;
10. provider-style retry rereads authority but preserves the original client base;
11. revoked devices cannot mutate;
12. disabled actors cannot mutate;
13. a required peer account becoming disabled freezes shared mutation for the still-active manager rather than granting accidental sole write authority;
14. revoked/read-only relationship or changed rivalry membership invalidates stale cached mutation assumptions;
15. malformed or unsupported payloads fail before authoritative mutation;
16. local Apply protects the entire reviewed canonical three-key snapshot, including keys not changed by the candidate;
17. precondition/write/rollback/ownership failure cannot clobber newer local bytes;
18. remote disable preserves local-only Save Library operation and Candidate A/B/C authority;
19. repeated equivalent runs end in deterministic identical state;
20. Phase 1E remains provider-neutral and dormant.

## Source-review corrections retained

Initial branch source correctly established the main Phase 1E model, but review found two real safety gaps before PR publication.

First, actor-only authorization checks meant the still-active manager could continue mutating shared state while the required peer account was disabled or its entitlement was no longer active. That contradicts the Phase 1D two-owner governance rule that shared mutation freezes in those states. The harness now checks the complete two-owner mutation authority before every mutation.

Second, the first local Apply proof passed only the candidate's changed keys to `runCareerModeRawStorageTransaction()`. That allowed an unmodified canonical key to change after preview without participating in the last-moment precondition guard. The harness now submits all three reviewed canonical keys, preserving candidate values for changed keys and reviewed expected bytes for unchanged keys, with `guardRequestedBeforeEachWrite:true` and explicit canonical order.

The local preview is also recursively frozen and malformed initial account/device/membership authority now fails closed rather than silently becoming active.

Source hardening checkpoint:

`05f38791f0f087019b794b3d0a134139962a0d82`

Permanent-test hardening checkpoint:

`c84ad45782f87990a22c5d6efb132f042be5a360`

Developer-bootstrap synchronization checkpoint:

`fddeab1e7f706c37400fe4c4f001cb02e79e1b32`

These are branch checkpoints only. The exact PR head must be re-fetched after the final continuity/handoff freeze and all CI evidence must belong to that exact unchanged head.

## Provider and Remote Joining boundary

Firebase Authentication plus Cloud Firestore remains the selected primary future provider candidate. Phase 1E does not connect it.

Firestore persistent offline cache remains prohibited. Project-owned immutable `baseRevision`, explicit conflicts, idempotency/replay and tombstone semantics remain authoritative. Provider transaction retries may reread provider state but may never silently refresh client intent to a new base.

Phase 1F — Firebase provider connection, Firebase Local Emulator Suite and deny-by-default Security Rules proof — is the exact next prerequisite only after Phase 1E is fully validated, merged and independently verified.

Private account/auth runtime, registered-device runtime, secure private pairing, Connected Rivalry runtime and Private Remote Joining remain later dependency-gated stages.

Public community, public discovery, public matchmaking, public profiles, global leaderboard and global rankings remain eliminated.

## Recovery and storage locks

Canonical post-cutover storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains read-only analysis.

Candidate C remains the only destructive import Apply stage and permanently keeps `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification, corrupt-byte preservation, retry/idempotence and critical recovery.

No future sync or cloud module may directly own `localStorage`.

## Versioning boundary

`VERSIONING_POLICY.md` remains permanent authority.

Phase 1E is dormant infrastructure/test/authority work and therefore keeps production at v1.4.0 / `1.4.0-r1`.

If a future prerequisite changes production runtime behavior, it must receive the appropriate PATCH, MINOR or MAJOR application version; an `rN` suffix may never hide a required semantic version bump.

## Work Environment Continuity

Current environment:

`we-2026-08-17-phase1e-two-device-harness`

The inherited Phase 1D record was validated and archived before the successor initialized fresh observations. Usage percentage remains unknown because no product dashboard/CLI usage value is available; it must not be estimated.

Direct shell networking in this environment cannot resolve GitHub, so connector-backed source writes plus GitHub-hosted CI are the proof path. A failed local GitHub network route is never treated as a project test failure.

Before final publication, update `WORK_ENVIRONMENT_STATUS.json` with the actual current compaction/evidence/failure counters and run/reconstruct the deterministic continuity assessment from source. After the Phase 1E merge, reassess before beginning Phase 1F.

## Protected historical evidence anchors

The rolling handoff intentionally retains these source-grounded historical findings because permanent release contracts protect them.

A direct profile-ID key swap is not sufficiently correct by itself; Identity-Safe Career Analytics also had to preserve unresolved historical roles, identity-independent historical totals/records, Local Profile display labels as presentation only, read-only inactive-runtime profile presentation and coherent derived-cache invalidation.

Failure 7 — offscreen Trophy cabinet rendered-text assertion: the PR #59 validation history established that the exact cabinet used `content-visibility:auto`; the corrected audit proved Analytics/Trophy revision equality and raw DOM text before requiring rendered text after scrolling the stable-profile cabinet into view. Production CSS was not weakened merely to satisfy Playwright.

Other historical release and PR evidence remains frozen in the dedicated release/proof/handoff files and repository history rather than being treated as current implementation authority.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

If this file is read before Phase 1E merges:

1. independently fetch live `main`, the active Phase 1E branch, open PRs, tags/releases and current CI;
2. validate the inherited continuity record and initialize fresh observations before assessing a successor environment;
3. confirm Phase 1D remains merged at PR #79 and do not reimplement it;
4. inspect the Phase 1E harness, permanent test, Phase 1A revision model, Phase 1D contract and Candidate C transaction/recovery authority;
5. preserve peer-account/membership shared-mutation freeze and the full reviewed three-key local Apply guard;
6. synchronize remaining continuity evidence without introducing Firebase or production runtime loading;
7. run the exact Phase 1E contract through the complete permanent repository suite and normal PR workflows;
8. fix real failures at source without weakening valid tests, recovery guarantees, timeouts or performance ceilings;
9. once exact-head CI is fully green, review state is clean, the head is unchanged and the PR is mergeable, squash merge without another owner approval;
10. independently verify live `main`, then reassess continuity before Phase 1F.

If Phase 1E is already merged when this file is read, do not repeat it. Reconstruct the exact merge/CI state, archive the predecessor continuity record, initialize the successor and follow `NEXT_TASK.md` for the next dependency gate.
