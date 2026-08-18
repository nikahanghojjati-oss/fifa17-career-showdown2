# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-18 ET (Stage 2B complete / Stage 2C policy candidate)

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` and `REMOTE_JOINING_EXECUTION_ROADMAP.md` own dependency direction/status.

## Development continuity infrastructure

The repository Work Environment Continuity system remains active through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. Every fresh environment follows validate → archive/replace → assess before substantial work.

## Production authority

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Current feature release version: **v1.4.0**
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)
Cloud/Sync Readiness Phase 1E merge: `cebd9c031657c9ee01ba68f1baaac7816c9748b9` (PR #80; exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`)
Cloud/Sync Readiness Phase 1F merge: `231556d86a93535fa90e173577c1159de4f40be0` (PR #81; exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`)
Phase 1F / Stage 2A authority boundary merge: `87ea27a8dd28a041f973a3ba42312ff9e78ba74d` (PR #82; exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7`)
Private Account / Authentication Stage 2A merge: `e39c1b0689598ac922569ff839ca30a1d5dee5fa` (PR #83; exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78`)
Private Account / Authentication Stage 2B merge: `c4feadb69fb5e26eba19fa520afa0a09baf1de03` (PR #84; exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`)

Cloud/Sync Phases 1A through 1F and Private Account/Auth Stages 2A / 2B are completed non-production prerequisite work. Stage 2C is policy-only. They do not change the production shell, so production remains v1.4.0 / `1.4.0-r1`.

Production Firebase remains disconnected.

## Completed local dependency chain

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. explicit cross-Save/historical manager identity linkage foundation — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59. Identity-Safe Career Analytics is production-proven.
7. Local Profile display-label editing and `1.3.0-r2` whole-shell delivery — PR #61.
8. formatVersion 2 full multi-Save backup/import portability — PR #67.
9. Phase A documentation authority synchronization — PR #68.
10. Phase B first slice — Save Library / Local Profile Experience 2.0 — PR #70.
11. Phase C first slice — Showdown Home & Season Experience — PR #73.

All eleven local/product layers are shipped and production-proven.

## Cloud / Sync Readiness state

Phase 1A — deterministic revision model: **DONE / MERGED / PROTECTED** through PR #76.

Phase 1B — provider and operational decision: **DONE / MERGED / PROTECTED** through PR #77. Firebase Authentication + Cloud Firestore remains the selected primary future provider candidate. Firestore persistent offline cache remains disabled.

Phase 1C — private remote data inventory, privacy and retention policy: **DONE / MERGED / PROTECTED** through PR #78.

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED** through PR #79.

Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **DONE / MERGED / PROTECTED** through PR #80.

Phase 1F — Firebase Local Emulator / deny-by-default Firestore Security Rules proof: **DONE / MERGED / PROTECTED** through PR #81.

All 13 normal PR workflow families were independently verified successful on exact PR #81 head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` before squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

### Permanent Phase 1F security finding

The exact Phase 1D shared-state schema does not contain the idempotency-key hash needed for Firestore Security Rules to identify which sibling idempotency receipt must accompany a direct client state write.

Therefore every application-client Firestore write remains denied. The trusted `withSecurityRulesDisabled()` helper exists only inside emulator proof. A later trusted production mutation gateway or separately reviewed protocol/schema adjustment remains required before remote writes can be enabled.

Cloud Functions, Firebase Admin production runtime, service-account credentials and Blaze billing remain unauthorized. Production Firebase SDK/runtime, accounts, Firestore data and deployed Security Rules remain absent.

## Private Account / Authentication state

Cloud/Sync readiness is complete through the bounded Phase 1F proof. The current dependency lane is private account / authentication / authorization.

### Stage 2A — completed

Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Exact validated PR #83 head: `a4022d6f316622f73ead9aacde812b545b8dcf78`.
Squash merge / verified completion boundary: `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

Stage 2A proves provider `uid` → architecture `accountId`, wrong-account and unauthenticated denial, sign-out denial, fail-closed sign-in behavior, application-account lifecycle separation and continued denial of every application-client Firestore create/update/delete.

Do not repeat Stage 2A.

### Stage 2B — completed

Private Account / Authentication Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`.

Exact validated PR #84 head: `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`.
Squash merge / verified live-main completion boundary: `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

All 13 normal workflow families passed on that exact unchanged PR head; submitted reviews and inline review threads were empty.

Stage 2B proves provider disable/new-sign-in denial/re-enable with the exact same stable `uid` / architecture `accountId`, independent application-account fail-closed authorization, continued client-write denial, and test-only `revokeRefreshTokens(uid)` routing against the Authentication Emulator without deliberate raw bearer-token retrieval or persistence.

Stage 2B does not claim that the Authentication Emulator proves every production in-flight token invalidation timing or backend `checkRevoked` behavior. Final production session verification/revocation remains a later Stage 2 operational gate.

Do not repeat Stage 2B.

### Current Stage 2C candidate

Private Account / Authentication Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — is the CURRENT BOUNDED CANDIDATE.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`.

Stage 2C is policy-only. It selects the initial production authentication behavior before any Firebase production connection exists:

- Google federated sign-in through `GoogleAuthProvider` only;
- `signInWithPopup()` from an explicit user gesture on the current static GitHub Pages topology;
- no `signInWithRedirect()` until a separately reviewed auth-domain/hosting compatibility boundary is proven;
- explicit `browserSessionPersistence` instead of implicit durable local persistence;
- no extra Google OAuth scopes;
- no deliberate Google provider access-token retrieval or persistence;
- Firebase `uid` remains architecture `accountId`, separate from Local Profile and gameplay identity;
- application account status and rivalry entitlement remain separate authorization layers;
- every application-client Firestore write remains denied.

Production Firebase remains disconnected. No production project, real Firebase user, account UI, deployed Security Rules or production Firebase dependency is introduced by Stage 2C.

Firebase Admin remains test-only and absent from the production dependency graph, shell and Service Worker.

The full account/auth stage remains incomplete after Stage 2C. Later Stage 2 gates include production Firebase operational setup, safe application-account bootstrap/write lifecycle, trusted production token verification, account export/deletion cascade, abuse/rate controls, production Security Rules deployment and the trusted remote mutation-boundary decision.

Registered devices/private pairing remain blocked behind Stage 2. Connected Rivalry remains blocked behind pairing. Private Remote Joining remains blocked behind all prior gates.

## Identity-Safe Career Analytics state

`js/analytics.js` remains derived Analytics authority. Stable `profile_*` identity, not display-name equality, owns longitudinal aggregation. Same-name distinct profiles remain distinct; explicit reuse aggregates across Saves. unresolved historical roles remain excluded from identified longitudinal manager totals until explicitly mapped; identity-independent Showdown/Season totals remain complete.

Remote account identity is separate from Local Profile identity. A Firebase Auth `uid` never silently becomes a `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` or `sessionId`.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only destructive import Apply stage.

Candidate C must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority. Preserve last-moment preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery.

formatVersion 2 is live and complete multi-Save portability is production-proven.

Canonical public storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key. No future Auth/cloud/sync module may directly own `localStorage`.

## Installable Offline App and performance state

Whole-shell label remains exactly `1.4.0-r1`; immediate previous known-good is `1.3.0-r2`.

Locked ceilings remain eager raw <= `165000`, eager gzip <= `37500`, Reus startup portrait <= `95000`, combined first-party startup <= `260000`, normal loading minimum `2700 ms`, reduced-motion loading `220 ms`.

Never weaken tests, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Protected gameplay and product philosophy

Exactly two managers. Showdown lengths remain `1`, `3`, `5`, `10`. Both managers use the same selected league and different permanent clubs. Maximum Season score remains 11. Equal non-zero scores are Draws; only 0–0 uses league position and then league points.

Career Mode Showdown remains a private two-manager companion.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

The ordered path is:

completed local recovery / identity / portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C CURRENT
→ secure paired-device / private-session capability — Stage 3 blocked
→ Connected Rivalry synchronization and two-device proof — Stage 4 blocked
→ Private Remote Joining.

## Current authorization boundary

**No product candidate is currently authorized.**

The only current prerequisite is the Stage 2C policy and authority boundary. Production Firebase connection, account UI, real users, later Stage 2 operational gates, pairing, Connected Rivalry and Remote Joining remain unauthorized.

## Historical Phase 1E / Phase 1F / Stage 2A contract provenance

The following is intentionally historical provenance only and is not current authority:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED**.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **CURRENT BOUNDED CANDIDATE**.
Phase 1F — **NEXT AFTER PHASE 1E MERGES / BLOCKED**.
