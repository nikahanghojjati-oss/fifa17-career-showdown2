# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-18 ET — Stage 2B verified complete / Stage 2C current

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering alone never authorizes implementation. The owner's 2026-08-17 instruction authorizes continued bounded prerequisite advancement toward Private Remote Joining, one dependency gate at a time.

## Work Environment Continuity

Every fresh development environment must follow `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and the repository validate → archive/replace → assess sequence before substantial work. A predecessor transition decision belongs only to that predecessor.

## Current production milestone

Application milestone: v1.4.0 — Product Deepening
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Feature release version: v1.4.0

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
Private Account / Authentication Stage 2A merge: `e39c1b0689598ac922569ff839ca30a1d5dee5fa` (PR #83; exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78`)
Private Account / Authentication Stage 2B merge: `c4feadb69fb5e26eba19fa520afa0a09baf1de03` (PR #84; exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`)

Phases 1A through 1F and Stages 2A / 2B are completed non-production prerequisite work. The current Stage 2C candidate is policy-only. None changes production application behavior, so `VERSIONING_POLICY.md` correctly keeps the visible application at v1.4.0 / `1.4.0-r1`.

Production Firebase remains disconnected.

## Closed production/product candidates

The following are closed and must not be reopened without new source-grounded authorization:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70; production-proven)
- Phase C first slice — Showdown Home & Season Experience deepening (PR #73; production-proven)
- Cloud/Sync Readiness Phase 1A deterministic revision/conflict/tombstone/idempotency model (PR #76)
- Cloud/Sync Readiness Phase 1B provider/operational decision (PR #77)
- Cloud/Sync Readiness Phase 1C private remote data inventory/privacy/retention boundary (PR #78)
- Cloud/Sync Readiness Phase 1D exact Firebase-compatible remote schema/API/authorization/replay/two-owner deletion contract (PR #79)
- Cloud/Sync Readiness Phase 1E deterministic provider-neutral two-device/offline/reconnect synchronization harness (PR #80)
- Cloud/Sync Readiness Phase 1F Firebase Local Emulator / deny-by-default Firestore Security Rules proof (PR #81)
- Private Account / Authentication Stage 2A Firebase Auth Emulator Identity Boundary (PR #83)
- Private Account / Authentication Stage 2B Provider Session Lifecycle & Revocation Boundary (PR #84)

Authorized product candidate: none.

No product candidate is currently authorized. No new user-facing production runtime feature is authorized at this boundary.

## Cloud/Sync completion boundary

Phase 1A — DONE / PR #76
Phase 1B — DONE / PR #77
Phase 1C — DONE / PR #78
Phase 1D — DONE / PR #79
Phase 1E — DONE / PR #80
Phase 1F — DONE / PR #81 / MERGED / PROTECTED

The Phase 1F security finding remains binding: every application-client Firestore write stays denied because the protected shared-state schema does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. Do not enable direct client writes merely because a transaction helper behaves correctly.

A trusted mutation gateway or separately reviewed protocol/schema adjustment is a later independent decision. Cloud Functions, Firebase Admin production runtime, service-account credentials and Blaze billing remain unauthorized.

No production Auth account, Firestore collection/data, deployed production Security Rules or persistent Firestore offline cache exists.

## Completed Private Account / Authentication Stage 2A

Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Exact validated PR #83 head: `a4022d6f316622f73ead9aacde812b545b8dcf78`
Squash merge: `e39c1b0689598ac922569ff839ca30a1d5dee5fa`

Do not repeat Stage 2A.

## Completed Private Account / Authentication Stage 2B

Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`.

Exact validated PR #84 head: `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`
Squash merge / verified live main: `c4feadb69fb5e26eba19fa520afa0a09baf1de03`

All 13 normal workflow families passed on that exact unchanged head. Submitted reviews and inline review threads were empty.

Stage 2B permanently proves stable provider `uid` / architecture `accountId`, trusted emulator-only provider disable/new-sign-in denial/re-enable, independent application-account authorization, continued client-write denial and emulator-routed refresh-token revocation without deliberate raw bearer-token persistence.

Stage 2B does not claim final production in-flight ID-token invalidation or backend `checkRevoked` proof.

Do not repeat Stage 2B.

## Current authorized prerequisite candidate

Private Account / Authentication Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`.

Status: CURRENT BOUNDED CANDIDATE / POLICY-ONLY / PRODUCTION FIREBASE DISCONNECTED.

Stage 2C authorizes only a source-grounded production authentication policy decision and permanent regression contracts. It does not authorize runtime Firebase connection or real account onboarding.

The Stage 2C policy is:

1. initial production sign-in provider: Google federated sign-in through `GoogleAuthProvider` only;
2. current GitHub Pages sign-in flow: `signInWithPopup()` from an explicit user gesture;
3. `signInWithRedirect()` remains blocked until a separately reviewed auth-domain/hosting compatibility boundary is proven;
4. initial production Auth persistence: explicit `browserSessionPersistence`, not implicit durable `browserLocalPersistence`;
5. no extra Google OAuth scopes;
6. no deliberate provider access-token retrieval or persistence for Career Mode Showdown;
7. Firebase `uid` remains architecture `accountId` and never auto-links Local Profile or gameplay identity;
8. application account status and rivalry entitlement remain separate authorization gates;
9. every application-client Firestore write remains denied;
10. production Firebase remains disconnected and production stays v1.4.0 / `1.4.0-r1`.

## Stage 2C does not authorize

Do not add or enable:

- a production Firebase project or web-app registration;
- production Auth provider configuration or authorized-domain changes;
- Firebase SDK/Auth runtime in the GitHub Pages shell;
- real production Firebase users;
- account/signup/login UI;
- production Firestore data or deployed production Security Rules;
- application-client Firestore writes;
- Cloud Functions, Admin production runtime, service-account credentials or Blaze billing;
- a production backend `checkRevoked` / trusted token-verification service;
- registered-device product UI;
- pairing/invite/session product UX;
- Connected Rivalry runtime;
- Private Remote Joining runtime/UX;
- Private Cloud Backup;
- public/community/ranking/discovery/matchmaking features.

The entire Private Account / Authentication / Authorization stage remains incomplete after Stage 2C. Later Stage 2 gates still include production project/operational setup, safe application-account bootstrap/write lifecycle, trusted production token-verification behavior, account export/deletion cascade, auth abuse/rate controls, production Security Rules deployment and trusted production mutation-boundary selection.

No later gate is automatically authorized by merging Stage 2C.

## Prioritized long-term Private Remote Joining path

Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

The dependency order remains:

Cloud / synchronization readiness
→ private account / authentication / authorization
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining

Current status:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C CURRENT
→ paired-device / private-session capability — Stage 3 BLOCKED
→ Connected Rivalry — Stage 4 BLOCKED
→ Private Remote Joining — final dependency-gated destination.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Remote Joining remains private. Do not introduce public discovery, public matchmaking, public profiles, invitation directories or rankings indirectly through Firebase or account work.

## Identity and two-owner locks

Exactly two manager slots remain authoritative. Display names are presentation only. Same visible names never establish identity. Explicit stable Local Profile reuse is required for longitudinal cross-Save identity. Unresolved historical roles remain unresolved until explicitly mapped.

Firebase Auth `uid` is architecture `accountId`. It is not `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` or `sessionId`.

A disabled account does not relinquish entitlement or consent to deletion. A surviving manager never receives accidental unrestricted sole shared mutation authority merely because the peer is disabled, retained, relinquished or unavailable.

## Recovery and canonical storage locks

Canonical browser storage remains exactly:

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

The repository protects 14 permanent workflow families and 27 protected multiline executable workflow blocks. Normal PRs generally exercise 13 workflow families; Release Integration Burn-In remains main/manual release authority.

Locked ceilings remain eager raw <= `165000`, eager gzip <= `37500`, Reus startup portrait <= `95000`, combined first-party startup <= `260000`, normal startup minimum `2700 ms`, reduced-motion startup `220 ms`.

Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Historical contract provenance — do not interpret as current authority

The following wording is intentionally retained because permanent contracts protect historical transitions. It is not the current implementation boundary.

Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`.
No product candidate is currently authorized.
Current authorized prerequisite candidate at the historical Phase 1E boundary: Cloud/Sync Readiness Phase 1E.
Next prerequisite after Phase 1E merges: Cloud/Sync Readiness Phase 1F.
Current authorized prerequisite candidate at the historical pre-PR #83 boundary: Private Account / Authentication Stage 2A.
Stage 2A status at that boundary: AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED.
Historical pre-PR #80 wording: Phase 1D — DONE / PR #79; Phase 1E — CURRENT BOUNDED CANDIDATE; Phase 1F — BLOCKED.
Historical pre-PR #81 wording: Phase 1E — DONE / PR #80; Phase 1F — CURRENT BOUNDED CANDIDATE.
Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.
Cloud/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.

Historical authority once said to "stop and wait for a further explicit owner instruction." The former clean-stop wording was satisfied by the owner's later 2026-08-17 instruction opening the dependency-ordered Remote Joining prerequisite lane. Do not revive that obsolete waiting loop.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Complete only Stage 2C:

1. preserve production v1.4.0 / `1.4.0-r1` and keep production Firebase disconnected;
2. preserve every application-client Firestore write denial, Candidate A/B/C, canonical local storage and two-owner governance;
3. permanently contract the Google-only initial provider, popup-only current static-host flow, explicit `browserSessionPersistence`, no-extra-scope and no-provider-token-storage policy;
4. keep production project creation, account UI, real users, trusted mutation infrastructure and production token verification blocked;
5. synchronize current authority to Stage 2B DONE / Stage 2C CURRENT;
6. run the complete repository validation and all normal workflow families on the exact unchanged Stage 2C PR head;
7. require clean submitted review and inline-thread state plus mergeability;
8. merge only under the standing expected-head rule after exact-head proof;
9. independently verify live `main`;
10. reassess Work Environment Continuity before selecting another distinct Stage 2 prerequisite.

Do not begin Stage 3. Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F, PR #82, Stage 2A / PR #83 or Stage 2B / PR #84. Do not rush Private Remote Joining.
