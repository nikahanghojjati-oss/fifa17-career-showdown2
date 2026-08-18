# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-18 ET (Private Auth Stage 2A PR #83 completion gate)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering alone never authorizes implementation. The owner's 2026-08-17 instruction authorizes continued bounded prerequisite advancement toward Private Remote Joining, one dependency gate at a time.

## Work Environment Continuity

Every fresh development environment must follow `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and the repository validate → archive/replace → assess sequence before substantial work. A predecessor `HANDOFF_AT_CHECKPOINT` decision belongs only to that predecessor.

## Current production milestone

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Feature release version: **v1.4.0**

Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 full multi-Save backup/import portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)
Cloud/Sync Readiness Phase 1E merge: `cebd9c031657c9ee01ba68f1baaac7816c9748b9` (PR #80; exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`)
Cloud/Sync Readiness Phase 1F merge: `231556d86a93535fa90e173577c1159de4f40be0` (PR #81; exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`)
Phase 1F / Stage 2A authority synchronization merge: `87ea27a8dd28a041f973a3ba42312ff9e78ba74d` (PR #82; exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7`)

Phases 1A through 1F and Stage 2A are deliberately non-production prerequisite work. They do not change production application behavior, so `VERSIONING_POLICY.md` correctly keeps the visible application at v1.4.0 / `1.4.0-r1`.

Completed Local Profiles / Save Library dependency chain remains shipped and protected beneath the connected prerequisite lane.

## Closed production/product candidates

The following are closed and must not be reopened without new source-grounded authorization:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70)
- Phase C first slice — Showdown Home & Season Experience deepening (PR #73)
- Cloud/Sync Readiness Phase 1A deterministic revision/conflict/tombstone/idempotency model (PR #76)
- Cloud/Sync Readiness Phase 1B provider/operational decision (PR #77)
- Cloud/Sync Readiness Phase 1C private remote data inventory/privacy/retention boundary (PR #78)
- Cloud/Sync Readiness Phase 1D exact Firebase-compatible remote schema/API/authorization/replay/two-owner deletion contract (PR #79)
- Cloud/Sync Readiness Phase 1E deterministic provider-neutral two-device/offline/reconnect synchronization harness (PR #80)
- Cloud/Sync Readiness Phase 1F Firebase Local Emulator / deny-by-default Firestore Security Rules proof (PR #81)

**Authorized product candidate:** none.

No product candidate is currently authorized. No new user-facing production runtime feature is authorized at this boundary.

## Cloud/Sync completion boundary

- Phase 1A deterministic revision model — DONE / PR #76
- Phase 1B provider and operational decision — DONE / PR #77
- Phase 1C privacy, retention and remote data inventory — DONE / PR #78
- Phase 1D remote schema and API/authorization contract — DONE / PR #79
- Phase 1E deterministic two-device/offline sync harness — DONE / PR #80
- Phase 1F provider emulator / Security Rules proof — DONE / PR #81 / MERGED / PROTECTED

Phase 1F's permanent security finding remains binding: every application-client Firestore write stays denied because the protected shared-state schema does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. Do not enable direct client shared-state writes merely because a transaction helper behaves correctly.

A trusted mutation gateway or separately reviewed protocol/schema adjustment is a later independent decision. Cloud Functions, Firebase Admin production runtime, service-account credentials and Blaze billing remain unauthorized.

Production Firebase remains disconnected. No production Auth account, Firestore collection/data, deployed Security Rules or persistent Firestore offline cache exists.

## Current authorized prerequisite completion candidate

**Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary / PR #83.**

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Stage 2A is implemented as a bounded emulator/test-only candidate. PR #83 adds Auth Emulator port `9099` to the same fixed `demo-career-mode-showdown-phase1f` project as Firestore port `8080`, then exercises real Firebase Web Auth sessions through the existing Firestore Security Rules.

The proof establishes:

1. Auth and Firestore use the same fixed demo project;
2. two synthetic authenticated users receive distinct stable Firebase `uid` principals;
3. Firebase `uid` is architecture `accountId` and remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and display labels;
4. a real Auth Emulator session reaches Firestore Security Rules as the authenticated principal;
5. exact self/private reads succeed only where existing rules authorize them;
6. wrong-account and unauthenticated reads fail;
7. sign-out removes authenticated access for later client operations;
8. an authenticated provider principal with non-active application account metadata cannot gain connected rivalry authority;
9. client-supplied `accountId` never overrides provider identity;
10. every application-client Firestore create/update/delete remains denied;
11. raw passwords, ID tokens and refresh tokens are not persisted into application Firestore data, canonical local storage, repository fixtures, logs or URLs;
12. Auth state uses in-memory persistence only;
13. failed synthetic sign-in leaves no fabricated authenticated application state and a returning synthetic account retains the same `uid`;
14. local-only Save Library and Candidate A/B/C recovery remain available;
15. production application/package/runtime remains v1.4.0 / `1.4.0-r1`;
16. public discovery, public profiles, matchmaking, community systems and global rankings remain eliminated.

The corrected technical head `1420d8ffec9e689f1b3973021517713c446c85a0` passed the full 37-file repository contract suite, Phase 1F emulator proof, real Stage 2A Auth/Firestore emulator proof and 13-workflow / 27-executable-block topology. The first validation head was rejected because a newly added static contract matcher expected the wrong source spelling for the disabled-account transition; the contract was corrected without weakening behavior.

Stage 2A is complete only after the exact final PR #83 head is fully green, review/thread state is clean, the head is unchanged and mergeable, expected-head squash merge succeeds and live `main` is independently verified.

If PR #83 is already merged when this file is read, Stage 2A is complete. Do not repeat it. Initialize/reassess Work Environment Continuity and select one next smallest Stage 2 prerequisite from current source before implementation.

## Stage 2A does not authorize

Do not add or enable:

- production Firebase SDK/runtime in the GitHub Pages shell;
- real production Firebase accounts or account/signup/login UI;
- production Firestore data or deployed production Security Rules;
- application-client Firestore writes;
- Cloud Functions, Admin production runtime, service-account credentials or Blaze billing;
- registered-device product UI;
- pairing/invite/session product UX;
- Connected Rivalry runtime;
- Private Remote Joining runtime/UX;
- Private Cloud Backup;
- public/community/ranking/discovery/matchmaking features.

Production provider-level account disable/revocation/token-refresh guarantees, production Auth persistence, account export/deletion cascade, safe account bootstrap/write lifecycle, authentication abuse/rate controls and the production remote mutation boundary remain later Stage 2 gates. No one of them is automatically implementation-authorized by merging PR #83. Registered devices/private pairing remain Stage 3 and may not begin until Stage 2 is proven.

## Prioritized long-term Private Remote Joining path

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

The ordered path remains:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A PR #83 completion gate
→ paired-device / private-session capability — Stage 3, blocked
→ Connected Rivalry synchronization — Stage 4, blocked
→ Private Remote Joining — final dependency-gated product destination.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Remote Joining remains private. Do not introduce public discovery, public matchmaking, public profiles, invitation directories or rankings indirectly through Firebase or account work.

## Identity and two-owner locks

Exactly two manager slots remain authoritative. Display names are presentation only. Same visible names never establish identity. Explicit stable Local Profile reuse is required for longitudinal cross-Save identity. Unresolved historical roles remain unresolved until explicitly mapped.

Account identity does not transfer ownership. A disabled account does not relinquish entitlement or consent to deletion. A surviving manager never receives accidental unrestricted sole shared mutation authority merely because the peer is disabled, retained, relinquished or unavailable.

## Recovery and canonical storage locks

Canonical public browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Never restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply stage.

Candidate C must continue to use strict exact raw snapshot authority through `captureCareerModeRawRestoreSnapshot()`, exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

No future Auth/cloud/sync module may directly own canonical `localStorage`.

## Gameplay locks

Exactly two managers. Same selected league. Different permanent clubs. Showdown lengths 1 / 3 / 5 / 10. Maximum Season score 11. Equal non-zero scores are Draws. Only 0–0 uses league position and then league points.

Scoring remains Champions League +5, Domestic League +3, Main Domestic Cup +1, 100 League Points and/or 100 League Goals combined maximum +1, Top Scorer and/or Top Assist combined maximum +1.

## Performance and validation locks

The repository protects 14 permanent workflow families and 27 protected multiline executable workflow blocks. Normal PRs generally exercise 13 workflow families; Release Integration Burn In remains main/manual release authority.

Locked ceilings remain eager raw <= `165000`, eager gzip <= `37500`, Reus startup portrait <= `95000`, combined first-party startup <= `260000`, normal startup minimum `2700 ms`, reduced-motion startup `220 ms`.

Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Historical Phase 1E / Phase 1F / Stage 2A contract provenance

The following wording is intentionally retained only as historical provenance for permanent contracts. It is not current implementation authority.

Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`.
No product candidate is currently authorized.
Current authorized prerequisite candidate at the historical pre-PR #83 boundary: Private Account / Authentication Stage 2A.
Stage 2A status at that boundary: AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED.

Historical pre-PR #80 wording: Phase 1D — DONE / PR #79; Phase 1E — CURRENT BOUNDED CANDIDATE; Phase 1F — BLOCKED.
Historical pre-PR #81 wording: Phase 1E — DONE / PR #80; Phase 1F — CURRENT BOUNDED CANDIDATE.

Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.
Cloud/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.

## Historical clean-stop clarification

Historical authority once said to "stop and wait for a further explicit owner instruction." The former clean-stop wording was satisfied by the owner's later 2026-08-17 instruction opening the dependency-ordered Remote Joining prerequisite lane. Do not revive that obsolete waiting loop. The current Work Environment Continuity decision may still require a handoff between distinct milestones, but that is a context-quality boundary, not a request for repeated product permission.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### If PR #83 is not yet merged

Finish only the Stage 2A publication boundary:

1. keep production v1.4.0 / `1.4.0-r1` and production Firebase disconnected;
2. preserve all client Firestore write denial, Candidate A/B/C and canonical local-only storage;
3. finish current authority/history/continuity synchronization;
4. require all normal workflow families to pass on the exact unchanged final PR #83 head;
5. require clean submitted review and inline-thread state plus mergeability;
6. squash merge with expected-head protection under the standing owner rule;
7. independently verify live `main`.

Do not add any later Stage 2 behavior while sealing PR #83.

### If PR #83 is already merged

Do not repeat Stage 2A. Independently verify live `main`, archive/reconcile the completed PR #83 facts, initialize/reassess a fresh Work Environment Continuity environment and select only the next smallest remaining Stage 2 prerequisite from current source. Registered devices/pairing remain Stage 3 and are still blocked. Connected Rivalry and Remote Joining remain blocked.

Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F or PR #82. Do not rush Private Remote Joining.
