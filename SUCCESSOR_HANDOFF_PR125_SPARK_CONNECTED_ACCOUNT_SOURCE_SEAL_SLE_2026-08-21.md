# FIFA 17 Career Mode Showdown — PR #125 Spark Connected Account Source Seal — SLE Successor Handoff

SLE = Smart Lean Efficient.

This file is the complete deep-reference successor handoff for the Work Environment transition after the PR #125 source-validation checkpoint. Treat it as orientation, never as implementation authority. Current source, live GitHub, current Firebase/provider state, later owner instructions, security/recovery authority and the successor's own freshly initialized WEC always win.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Closing environment: `we-2026-08-21-spark-production-account-runtime`
Closing branch: `agent/spark-production-account-runtime`
Current PR: #125 `Ship Spark private connected account runtime`
Live main at final source seal: `82413e36cd70bb10e332cb2aaa137ad350f2d241` from merged PR #124
Exact PR #125 source-validation head: `d83a33066b271d7d89bf932f1066d9e1369b3f6d`

## Transition decision

The closing environment's deterministic WEC decision is `HANDOFF_AT_CHECKPOINT`. That decision applies only to the closing environment. The source-validation checkpoint is complete, so the closing environment must stop before production Firestore Rules publication, merge/deploy or another substantial milestone.

A successor MUST NOT inherit this transition decision as its own. It must independently verify live state, archive/recognize predecessor closure as required, initialize a fresh unique WEC record with reset per-environment counters, set its own starting-main SHA, assess its own environment, and obey its own result before substantial work.

Usage allowance is unavailable and must remain `null` / `unavailable` unless an approved source reports it. Never fabricate usage.

## Current production truth

Current production application: `v1.4.0 — Product Deepening`.
Current production Installable Offline App runtime: `1.4.0-r2`.
Known pre-r2 fallback knowledge: `1.4.0-r1`.
PR #125 candidate rollback/recovery target: `1.4.0-r2`.

The production Firebase App Check chain through PRs #115–#119 is DONE / MERGED / PROVEN. Permanent production proof is `Validate Stability Lane` #1230, run ID `32439162225`, on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`. Its `stability-contracts`, `chromium-stability` and `deployed-site-smoke` jobs succeeded.

That deployed proof verified every intended `1.4.0-r2` runtime byte, runtime error provenance, legitimate production reCAPTCHA Enterprise App Check token traffic, Home, Save Library, manager identity, Identity-Safe Career Analytics, football visuals, Candidate A backup, Candidate B import analysis, Candidate C atomic restore/recovery, install/offline behavior and the complete deployed journey.

Legitimate production App Check token traffic is proven. App Check enforcement remains `OFF`.

The currently deployed `1.4.0-r2` browser intentionally initializes only Firebase App and Firebase App Check. Browser Firebase Authentication, Firestore, Storage and Functions remain uninitialized in deployed production. Every application-client Firestore create/update/delete remains `deny-all` under the currently published production rules.

## PR #125 candidate truth — source validated, NOT production

Candidate application/runtime: `v1.5.0 / 1.5.0-r1`.
Release status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN.

PR #125 is the first production-facing private Connected Account candidate on the permanent zero-billing architecture. Its reviewed boundary:

- reuses the proven production Firebase App + App Check runtime;
- lazily initializes Firebase Authentication and Cloud Firestore only after explicit Connected Account demand;
- uses Google `signInWithPopup()` only;
- sets explicit `browserSessionPersistence` before sign-in;
- uses memory-only Firestore client cache;
- uses Firebase `uid` as the sole application `accountId` source;
- reuses the PR #124 strict revision-0 self-account bootstrap;
- requests no additional Google OAuth scopes;
- does not extract provider OAuth credentials or deliberately store raw Firebase ID/refresh/provider tokens in Career Mode storage;
- initializes no Storage or Functions client;
- introduces no billing account, Blaze upgrade, Cloud Run runtime, Cloud Functions runtime or trusted backend credential path;
- preserves local-first startup, local Saves and recovery when signed out, offline, popup-cancelled or Firebase-unavailable.

The exact reviewed rules candidate is `firestore.spark.rules`. It permits only an authenticated user creating their own strict revision-0 `accounts/{request.auth.uid}` envelope. Account list/update/delete plus devices, profile-link writes, security-event writes, invites, rivalry state, sessions, idempotency and gameplay mutations remain denied.

Those Spark rules are NOT yet published to production. The PR #125 candidate is therefore NOT production-proven.

## Exact-head source validation seal

Exact immutable source-validation head: `d83a33066b271d7d89bf932f1066d9e1369b3f6d`.

All 13 normal pull-request workflow families succeeded on that exact unchanged head. Important exact-head runs include:

- `Validate Static App` #1567 / run `32502859032`: SUCCESS. JavaScript syntax, dynamic release architecture, complete repository contracts including Candidate C, Firebase emulator coverage and permanent 27-block workflow topology all succeeded.
- `Validate Stability Lane` #1321 / run `32502858761`: `stability-contracts` SUCCESS, trusted runtime activation container build SUCCESS, Firebase Admin import smoke SUCCESS, `chromium-stability` SUCCESS. `deployed-site-smoke` was correctly skipped for the pull-request candidate and is not production proof.
- `Validate Candidate C Atomic Restore` #955 / run `32502858786`: restore contracts SUCCESS, authoritative browser restore/recovery audit SUCCESS, evidence upload SUCCESS.
- `Validate Candidate B Import Analysis`: SUCCESS.
- Home Bootstrap, Statistics, League Confirmation, Season Review, Transfer Workstream, Settings Workstream, V1 Visual Immersion, Licensed Football Visuals and Final Polish: SUCCESS on the same head.

At the source seal, PR #125 was open, non-draft and mergeable. Submitted reviews: zero. Inline review threads: zero.

Do not treat these PR source results as deployed production proof.

## Why many contract files changed

The v1.5 candidate exposed a long-lived defect in permanent contracts: several historical Cloud/Sync, Stage 2, trusted-runtime, gateway, deletion, export and release-authority tests froze old `v1.4.0`, old WEC IDs, old branches, or old 'no product candidate' wording as if those historical checkpoints had to remain current forever.

This environment migrated those contracts so they preserve immutable historical/security evidence while separately validating current PR #125 / v1.5 candidate truth. Runtime/security behavior was not broadened merely to make tests pass.

Key corrections included:

- historical Cloud/Sync Phase 1C–1F release freezes made version-neutral;
- Private Account/Auth Stages 2A–2I historical proof separated from current authority;
- production App Check runtime contract made aware of the separately reviewed lazy Spark Auth + memory-only Firestore path;
- trusted runtime activation, shared mutation gateway, account deletion and connected-data export historical release freezes removed without weakening their security boundaries;
- release-authority coherence made dynamic for candidate-vs-production truth;
- required `CAREER_MODE_SHOWDOWN_V1.5.0_MAINTENANCE_HANDOFF.md` added as RELEASE CANDIDATE, not production proof;
- SLE/release regex ordering repaired where tests assumed `v1.5.0` had to appear before `NOT production` even though source truth said `NOT production` first.

Do not reintroduce those stale current-vs-historical assertions.

## Remote Joining readiness

Machine-readable authority: `REMOTE_JOINING_READINESS.json`.
Model: `RJR-1` fixed 100-point denominator.
Current score: `61/100`.

The existing +2 production-cloud-security delta is ONLY for two already proven production capabilities: controlled production Firebase App + App Check runtime connection and legitimate production App Check token traffic.

PR #124 source/emulator work, PR #125 source work, green CI, documentation, SLE/WEC quality, unpublished Spark Rules, unproven production account activation, pairing, Connected Rivalry and actual Remote Joining do not earn readiness points by themselves.

Do not change RJR until genuine new production evidence closes a fixed RJR-1 capability gap.

## Permanent security, privacy, storage and recovery locks

Private Remote Joining is `PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED`.

Dependency order remains:

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Stage 3 Registered Devices / Private Pairing remains blocked. Connected Rivalry and actual Remote Joining remain downstream.

Public community features and global leaderboard/rankings are ELIMINATED. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

Production App Check enforcement remains OFF. App Check is attestation only; it grants no account identity, application authorization, device identity, pairing authority, rivalry/session entitlement, gameplay authority, shared mutation authority or IAM authority.

Stage 2H reviewed IAM remains EXACTLY:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

That trusted-runtime IAM remains unactivated and must not be broadened or activated as part of the PR #125 Spark publication lane.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot authority, transaction-owned mutation, immutable confirmed intent, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

## Standing owner publication authorization

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` remains the root authority, with provenance under `authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md`.

The owner has standing authorization for validated current and future project PRs to merge/deploy without another repeated approval prompt, but ONLY after every required test and current mandatory publication gate passes on the intended immutable head. A later explicit owner instruction can revoke or narrow this.

For PR #125 the missing mandatory publication gate is production publication and verification of the exact reviewed `firestore.spark.rules`. Source CI being green does not bypass it.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

The fresh successor must do this in order:

1. Use the newest `START_NEXT_SESSION_V1.4.1_PR125.md` as the owner entrypoint, retrieve `SESSION_BOOTSTRAP.json`, verify live GitHub and initialize a fresh successor WEC. Do not inherit this predecessor's `HANDOFF_AT_CHECKPOINT` decision.
2. Independently verify live `main`, open PR #125, its exact current head, changed files, all 13 workflow families, reviews, inline review threads and mergeability. If PR #125 changed from the sealed head, revalidate the new head before publication.
3. Publish EXACTLY the reviewed `firestore.spark.rules` to the existing production Firebase project using a supported Firebase route. Do not hand-edit the rules. If the connected environment cannot directly operate Firebase Console/provider state, guide the owner through the exact provider-supported publication action and require observable proof.
4. Verify the published production Rules boundary: authenticated self-account revision-0 create at `accounts/{request.auth.uid}` is the only newly permitted application-client write; all downstream/private-joining mutation surfaces remain denied.
5. After Rules proof, re-freeze PR #125 head/reviews/threads/mergeability and required workflows. Only then use standing owner authorization to merge/deploy without asking for another redundant approval.
6. Obtain post-deployment production proof for `v1.5.0 / 1.5.0-r1`: source/deployed runtime identity, local-first behavior, Connected Account flow, Google popup/session persistence, memory-only Firestore, strict self-account bootstrap, denied downstream writes, recovery/offline invariants and production App Check state.
7. Only after genuine production proof may `1.5.0-r1` be promoted from RELEASE CANDIDATE to production-proven and RJR be reconsidered from fixed-model evidence.
8. Reassess the fresh WEC before beginning another separate prerequisite. If it permits continuation, select only the smallest remaining dependency-gated Stage 2 prerequisite justified by the new production evidence.

Do NOT enable App Check enforcement merely because token traffic is proven. Do NOT activate/broaden paid trusted Cloud Run/IAM. Do NOT begin Registered Devices, pairing, Connected Rivalry or actual Remote Joining UX in this publication lane.

## Continuity and history hazard

`WORK_ENVIRONMENT_HISTORY.md` is append-only. The connected GitHub route available to this closing environment exposes no safe append primitive for that large file. Earlier missing PR #122–#124 archival transition entries were therefore explicitly deferred rather than risking a destructive full-file rewrite. Preserve this known gap and repair it only through a route that can append safely or through a separately verified complete-file operation. Do not rewrite/truncate history for cosmetic completeness.

## Mandatory owner-facing progress format

Every substantive project response must end with exactly these seven lines, in this order:

`Handoff proximity: X%`
`Remote Joining readiness: Y/100`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

Unknown usage must never be fabricated.

At `Handoff proximity: 100%`, complete the current safe bounded checkpoint, perform complete SLE packaging and stop before another substantial milestone. WEC can require an earlier stop.

## Mandatory recursive SLE rule

SLE = Smart Lean Efficient.

Every successor must carry this rule forward. At every future handoff boundary, a plain chat-only prompt is NOT a complete handoff. The closing environment must create a root `SUCCESSOR_HANDOFF_..._SLE_...md`, a byte-identical project mirror, a new versioned root `START_NEXT_SESSION_...md`, a byte-identical session-start mirror, refresh `SESSION_BOOTSTRAP.json` and materially changed progressive-context pointers, validate the package, make the transition-prepared WEC seal the last intended branch mutation when required, give the owner the newest starter, and stop before the next substantial milestone.

Current source and the fresh successor's own live verification always win.