# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-18 ET (Private Auth Stage 2B PR #84 completion gate)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering alone never authorizes implementation. The owner's 2026-08-17 instruction authorizes continued bounded prerequisite advancement toward Private Remote Joining, one dependency gate at a time.

## Work Environment Continuity

Every fresh development environment must follow `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and the repository validate → archive/replace → assess sequence before substantial work. A predecessor `HANDOFF_AT_CHECKPOINT` decision belongs only to that predecessor.

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

Phases 1A through 1F, Stage 2A and the current Stage 2B candidate are deliberately non-production prerequisite work. They do not change production application behavior, so `VERSIONING_POLICY.md` correctly keeps the visible application at v1.4.0 / `1.4.0-r1`.

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
- Private Account / Authentication Stage 2A Firebase Auth Emulator Identity Boundary (PR #83)

Authorized product candidate: none.

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

## Completed Private Account / Authentication Stage 2A boundary

Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Exact validated PR #83 head:

`a4022d6f316622f73ead9aacde812b545b8dcf78`

Squash merge / verified live-main completion boundary:

`e39c1b0689598ac922569ff839ca30a1d5dee5fa`

Stage 2A permanently proves real Firebase Web Auth `uid` as architecture `accountId`, namespace separation, cross-service Firestore Security Rules authentication, self/private reads, wrong-account and unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, application-account lifecycle separation, provider identity over client-supplied identity and continued denial of every application-client Firestore create/update/delete.

All 13 normal workflow families passed on exact unchanged PR #83 head `a4022d6f316622f73ead9aacde812b545b8dcf78` before merge. Production application/package/runtime stayed v1.4.0 / `1.4.0-r1`, and production Firebase remained disconnected.

Do not repeat Stage 2A.

## Current authorized prerequisite completion candidate

Private Account / Authentication Stage 2B — Provider Session Lifecycle & Revocation Boundary / PR #84.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`.

Stage 2B is a bounded emulator/test-only candidate. It adds no production Firebase runtime or account UX. It uses test-only Firebase Admin user-management operations only against the existing Auth Emulator on `127.0.0.1:9099` under fixed project `demo-career-mode-showdown-phase1f`, while real Firebase Web Auth remains the synthetic client identity path and Firestore remains on `127.0.0.1:8080`.

The Stage 2B completion proof must establish:

1. the test-only trusted Admin boundary observes the same stable Firebase `uid` / architecture `accountId` as Web Auth;
2. provider disable causes a new client sign-in to fail closed;
3. provider re-enable restores sign-in for the exact same `uid`, without creating or transferring any Local Profile, Save, device, rivalry or manager identity;
4. application account lifecycle metadata remains a separate immediate authorization layer, so a provider-enabled/authenticated user with a disabled application account still cannot read private rivalry state;
5. provider re-enable alone does not rewrite application account status or restore connected entitlement;
6. a separately trusted emulator-only application status transition can restore the same existing entitlement while all application-client writes remain denied;
7. `revokeRefreshTokens(uid)` routes through the test-only Admin/Auth Emulator boundary without requesting, logging or persisting raw client bearer tokens;
8. refresh-token revocation is not overstated as proof of every production in-flight token invalidation timing detail or backend `checkRevoked` behavior;
9. Web Auth test persistence remains explicit in-memory persistence only and production Auth persistence remains unselected;
10. Firebase Admin remains absent from the production dependency graph, GitHub Pages shell and Service Worker;
11. production remains v1.4.0 / `1.4.0-r1` and production Firebase remains disconnected;
12. Candidate A/B/C, canonical local storage, two-owner governance and public/community/rankings prohibition remain protected;
13. Stage 3 registered devices/private pairing, Connected Rivalry and Private Remote Joining remain blocked.

Stage 2B is complete only after the exact final PR #84 head is fully green across all required normal workflow families, submitted-review and inline-thread state is clean, the head remains unchanged and mergeable, expected-head squash merge succeeds and live `main` is independently verified.

## Stage 2B does not authorize

Do not add or enable:

- production Firebase SDK/runtime in the GitHub Pages shell;
- real production Firebase accounts or account/signup/login UI;
- production Auth persistence selection;
- production Firestore data or deployed production Security Rules;
- application-client Firestore writes;
- Cloud Functions, Admin production runtime, service-account credentials or Blaze billing;
- production backend token verification/check-revoked behavior;
- registered-device product UI;
- pairing/invite/session product UX;
- Connected Rivalry runtime;
- Private Remote Joining runtime/UX;
- Private Cloud Backup;
- public/community/ranking/discovery/matchmaking features.

The entire Private Account / Authentication / Authorization stage is not complete after Stage 2B. Production Firebase project/operational setup, production sign-in UX/provider decision, production Auth persistence, final backend session verification/revocation behavior, safe application-account bootstrap/write lifecycle, account export/deletion cascade, authentication abuse/rate controls, production Security Rules deployment and the trusted production mutation-boundary decision remain later Stage 2 gates. No one of them is automatically authorized by merging PR #84.

Registered devices/private pairing remain Stage 3 and may not begin until Stage 2 is proven.

## Prioritized long-term Private Remote Joining path

Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

The ordered path remains:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B PR #84 completion gate
→ paired-device / private-session capability — Stage 3, blocked
→ Connected Rivalry synchronization — Stage 4, blocked
→ Private Remote Joining — final dependency-gated product destination.

Public community features and global leaderboard/rankings are ELIMINATED.

Remote Joining remains private. Do not introduce public discovery, public matchmaking, public profiles, invitation directories or rankings indirectly through Firebase or account work.

## Identity and two-owner locks

Exactly two manager slots remain authoritative. Display names are presentation only. Same visible names never establish identity. Explicit stable Local Profile reuse is required for longitudinal cross-Save identity. Unresolved historical roles remain unresolved until explicitly mapped.

Account identity does not transfer ownership. A disabled account does not relinquish entitlement or consent to deletion. A surviving manager never receives accidental unrestricted sole shared mutation authority merely because the peer is disabled, retained, relinquished or unavailable.

Firebase Auth `uid` is architecture `accountId`. It is not `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` or `sessionId`. Provider re-enable restores only the same provider identity and never infers ownership transfer.

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
Current authorized prerequisite candidate at the historical Phase 1E boundary: Cloud/Sync Readiness Phase 1E.
Next prerequisite after Phase 1E merges: Cloud/Sync Readiness Phase 1F.
Current authorized prerequisite candidate at the historical pre-PR #83 boundary: Private Account / Authentication Stage 2A.
Stage 2A status at that boundary: AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED.

Historical pre-PR #80 wording: Phase 1D — DONE / PR #79; Phase 1E — CURRENT BOUNDED CANDIDATE; Phase 1F — BLOCKED.
Historical pre-PR #81 wording: Phase 1E — DONE / PR #80; Phase 1F — CURRENT BOUNDED CANDIDATE.

Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.
Cloud/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.

## Historical clean-stop clarification

Historical authority once said to "stop and wait for a further explicit owner instruction." The former clean-stop wording was satisfied by the owner's later 2026-08-17 instruction opening the dependency-ordered Remote Joining prerequisite lane. Do not revive that obsolete waiting loop. The current Work Environment Continuity decision may still require a handoff between distinct milestones, but that is a context-quality boundary, not a request for repeated product permission.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only the Stage 2B / PR #84 completion boundary:

1. keep production v1.4.0 / `1.4.0-r1` and production Firebase disconnected;
2. preserve every application-client Firestore write denial, Candidate A/B/C and canonical local-only storage;
3. prove the Stage 2B provider disable/new-sign-in denial/re-enable stable-uid lifecycle and independent application-account authorization through the fixed local emulators;
4. exercise refresh-token revocation only through test-only Admin/Auth Emulator routing and do not request or persist raw bearer tokens;
5. preserve the explicit limitation that emulator revocation proof is not final production `checkRevoked` or in-flight token invalidation proof;
6. finish current authority/history/continuity synchronization;
7. require all normal workflow families to pass on the exact unchanged final PR #84 head;
8. require clean submitted review and inline-thread state plus mergeability;
9. squash merge with expected-head protection under the standing owner rule;
10. independently verify live `main`;
11. reassess Work Environment Continuity before beginning another distinct Stage 2 prerequisite.

Do not add any later Stage 2 behavior while sealing PR #84. Do not begin Stage 3. Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F, PR #82 or Stage 2A / PR #83. Do not rush Private Remote Joining.
