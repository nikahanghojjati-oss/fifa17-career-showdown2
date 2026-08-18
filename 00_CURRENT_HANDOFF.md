# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. It is not a substitute for `PROJECT_STATE.md` or `NEXT_TASK.md`. Current verified source and later owner instructions always override historical notes below.

## Current verified boundary

Production application: **v1.4.0 — Product Deepening**
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

Latest completed prerequisite: Cloud/Sync Readiness Phase 1F Firebase Local Emulator / deny-by-default Security Rules proof.

PR #81 exact validated head: `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`
PR #81 squash merge / independently verified main boundary: `231556d86a93535fa90e173577c1159de4f40be0`

All 13 normal PR workflow families on the exact PR #81 head were independently re-read as completed `success` before the post-merge authority checkpoint began.

## Phase 1F result

Phase 1F is DONE / MERGED / PROTECTED.

It uses only fixed demo project `demo-career-mode-showdown-phase1f`, Firestore Emulator on localhost, deny-by-default `firestore.rules`, real Firestore transaction retry behavior and synthetic data.

Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing was created.

Every application-client Firestore write remains denied.

Critical security finding: the Phase 1D authoritative shared-state schema does not expose the idempotency-key hash required for Security Rules to identify the matching sibling idempotency receipt. Therefore a direct client shared-state write cannot prove every replay invariant merely because a client transaction helper does the right thing. A trusted mutation gateway or separately reviewed protocol/schema change remains a later gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, stale-conflict, idempotency/replay, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Current next prerequisite

`NEXT_TASK.md` now authorizes only **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**.

Detailed design: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Stage 2A is emulator/test-only and must prove real Firebase Auth `uid` → architecture `accountId` identity through cross-service Firestore Security Rules under the same fixed demo project.

Required proof includes distinct synthetic authenticated users, wrong-account and unauthenticated denial, sign-out removing later authenticated access, app-account lifecycle status remaining a separate authorization layer, client-supplied account identity never overriding provider identity, in-memory-only test Auth persistence, no persisted raw credentials/tokens and continued denial of all client Firestore writes.

Do not add production Firebase, signup/login UI, registered-device/pairing UX, Connected Rivalry, Remote Joining, Cloud Functions/Admin/Blaze or public/community/ranking features during Stage 2A.

## Work Environment Continuity boundary

Successor environment: `we-2026-08-18-private-auth-stage2a-boundary`.
Starting verified main: `231556d86a93535fa90e173577c1159de4f40be0`.

The fresh environment observed one compaction during source reconstruction and recorded the next substantial task as a distinct Stage 2A milestone. With unavailable usage left unestimated, the repository formula reconstructed from current source gives:

- context pressure `57/100`;
- quality risk `12/100`;
- next-task separation `80/100`;
- handoff readiness `96/100` at initialization;
- continuation risk `44.4/100`;
- transition cost `15.3/100`;
- transition advantage `29.1`.

Decision: `HANDOFF_AT_CHECKPOINT`.

This decision is not caused by unresolved project failures. It means this environment must finish only the Phase 1F authority / Stage 2A scope checkpoint, validate/publish it, then hand off before beginning Stage 2A implementation.

Direct shell DNS cannot resolve GitHub in this environment. Connector-backed GitHub source/write access and GitHub-hosted CI are the proof path. Do not falsely claim local npm/gh execution.

## Permanent product locks

Private Remote Joining remains **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane
→ paired-device / private-session capability — blocked
→ Connected Rivalry — blocked
→ Private Remote Joining — final destination.

Public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

Exactly two managers remain authoritative. Same selected league, different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero score is a Draw; only 0–0 uses league position then league points.

## Recovery / local authority

Candidate A remains non-mutating export.
Candidate B remains read-only analysis.
Candidate C remains the sole destructive import Apply authority.

Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Historical Analytics evidence retained for provenance

The closed PR #59 identity work remains production-proven history. A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent totals.

Failure 7 in that historical validation was a transient/offscreen Trophy cabinet rendered-text assertion issue rather than a product data-corruption finding. This evidence is retained so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

A fresh successor must:

1. independently verify current main, PRs, branches, releases/tags and CI;
2. validate/archive this environment's transition-prepared record before creating its own fresh environment record;
3. read `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `CLOUD_SYNC_READINESS_PHASE_1F.md`, `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md` and current Firebase primary Auth Emulator/Auth persistence/Security Rules documentation;
4. confirm production remains v1.4.0 / `1.4.0-r1`, production Firebase remains disconnected and every application-client Firestore write remains denied;
5. only if its own fresh continuity assessment permits, implement the exact Stage 2A Auth Emulator identity proof;
6. run complete appropriate validation, publish one bounded PR and merge only after exact-head CI, clean review/thread state, unchanged head and mergeability are proven;
7. independently verify main after merge and reassess before selecting the next Stage 2 prerequisite.

Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F. Do not jump to pairing or Remote Joining.
