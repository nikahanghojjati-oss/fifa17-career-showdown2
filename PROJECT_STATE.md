# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-18 ET (Stage 2A PR #83 implementation candidate)

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

Cloud/Sync Phases 1A through 1F and Stage 2A are non-production prerequisite work. They do not change the production shell, so production remains v1.4.0 / `1.4.0-r1`.

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

`CLOUD_SYNC_READINESS_PHASE_1F.md`, `.firebaserc`, `firebase.json`, `firestore.rules`, `tests/firebase/cloud-sync-phase1f-emulator.cjs` and `tests/contracts/cloud-sync-phase1f-contracts.cjs` establish the fixed demo-project provider proof. All 13 normal PR workflow families were independently verified successful on exact PR #81 head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` before squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

### Permanent Phase 1F security finding

The exact Phase 1D shared-state schema does not contain the idempotency-key hash needed for Firestore Security Rules to identify which sibling idempotency receipt must accompany a direct client state write.

Therefore every application-client Firestore write remains denied. The trusted `withSecurityRulesDisabled()` helper exists only inside emulator proof. A later trusted production mutation gateway or separately reviewed protocol/schema adjustment remains required before remote writes can be enabled.

Cloud Functions, Firebase Admin production runtime, service-account credentials and Blaze billing remain unauthorized. Production Firebase SDK/runtime, accounts, Firestore data and deployed Security Rules remain absent.

## Private Account / Authentication state

Cloud/Sync readiness is complete through the bounded Phase 1F proof. The current dependency lane is private account / authentication / authorization.

Stage 2A — **Firebase Auth Emulator Identity Boundary** — is now an implemented bounded candidate in PR #83. It remains emulator/test-only and is not a production account feature.

PR #83 adds the Authentication Emulator on `127.0.0.1:9099` beside Firestore on `127.0.0.1:8080` under fixed demo project `demo-career-mode-showdown-phase1f`. `tests/firebase/private-account-auth-stage2a-emulator.cjs` uses real Firebase Web Auth sessions with explicit in-memory persistence and proves `uid` → architecture `accountId` through the existing Firestore Security Rules.

The corrected technical head `1420d8ffec9e689f1b3973021517713c446c85a0` passed the full 37-file repository contract suite, Phase 1F emulator proof, Stage 2A real Auth/Firestore emulator proof and protected 13-workflow / 27-executable-block topology. The proof covers distinct stable synthetic `uid` principals, self/private reads, wrong-account and unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, application-account lifecycle separation and provider identity over client-supplied identity. Every application-client Firestore create/update/delete remains denied.

Stage 2A reaches DONE only after the exact final PR #83 head is fully green, review/thread state is clean, expected-head squash merge succeeds and live `main` is independently verified.

Stage 2A does not complete the entire account/auth stage. Production provider project selection, account UX, production Auth persistence, provider-level disable/revocation, account export/deletion, safe app account bootstrap/write lifecycle, rate/abuse controls and the trusted remote mutation-boundary decision remain later Stage 2 gates. No later Stage 2 prerequisite is automatically authorized by merging PR #83.

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

Locked ceilings remain:

- eager raw <= `165000` bytes
- eager gzip <= `37500` bytes
- Reus startup portrait <= `95000` bytes
- combined first-party startup <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Never weaken tests, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Protected gameplay and product philosophy

Exactly two managers. Showdown lengths remain `1`, `3`, `5`, `10`. Both managers use the same selected league and different permanent clubs. Maximum Season score remains 11. Equal non-zero scores are Draws; only 0–0 uses league position and then league points.

Career Mode Showdown remains a private two-manager companion.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

The ordered path is:

completed local recovery / identity / portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A PR #83 completion gate
→ secure paired-device / private-session capability — Stage 3 blocked
→ Connected Rivalry synchronization and two-device proof — Stage 4 blocked
→ Private Remote Joining.

## Current authorization boundary

**No product candidate is currently authorized.**

The only current prerequisite work is completion of the Stage 2A PR #83 validation/merge gate. Production account UI/runtime, later Stage 2 prerequisites, pairing, Connected Rivalry and Remote Joining remain unauthorized.

If PR #83 is already merged when this file is read, do not repeat Stage 2A. Independently verify the merge, initialize/reassess Work Environment Continuity and select the next smallest Stage 2 prerequisite from current source before implementation.

## Historical Phase 1E / Phase 1F / Stage 2A contract provenance

The following is intentionally historical provenance only and is not current authority:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED**.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **CURRENT BOUNDED CANDIDATE**.
Phase 1F — **NEXT AFTER PHASE 1E MERGES / BLOCKED**.
Stage 2A — `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`.

Current authority is the completed Phase 1F / PR #83 Stage 2A completion boundary stated above.
