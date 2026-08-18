# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization.

## Current production boundary

Application: **v1.4.0 — Product Deepening**
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge / verified live-main boundary `231556d86a93535fa90e173577c1159de4f40be0`.

Phase 1F is DONE / MERGED / PROTECTED. Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing was created.

Every application-client Firestore write remains denied. The protected Phase 1D shared-state schema still does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. A trusted mutation gateway or separately reviewed schema/protocol change remains a later independent production-write gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Current PR #82 checkpoint

PR #82: `Seal Phase 1F and authorize Private Auth Stage 2A boundary`.
Branch: `agent/private-auth-stage2a-emulator-identity`.
Base: live main `231556d86a93535fa90e173577c1159de4f40be0`.
Pre-seal exact candidate: `fc63c07051c69b69a97c464f11274d8f5a9a70dc`.
First status-seal candidate: `30c96dd23238d11984e1af04ce18ff82d0ea1bd2` — rejected by exact-head CI because this handoff rewrite omitted the protected literal `IMMEDIATE NEXT TASK AFTER FULL STUDY` boundary.

The pre-seal candidate changed only continuity/authority documentation plus a permanent Stage 2A boundary contract and contract-suite registration. It did not change `index.html`, production application JavaScript, `service-worker.js`, `package.json` or `package-lock.json`.

All 13 normal workflow families completed `success` on pre-seal head `fc63c07051c69b69a97c464f11274d8f5a9a70dc`. The first final-seal head `30c96dd23238d11984e1af04ce18ff82d0ea1bd2` correctly failed Static App and Stability on the same mandatory-handoff compatibility assertion and is permanently ineligible for merge.

This correction restores the required handoff boundary without altering production behavior. After the correction addendum and final `WORK_ENVIRONMENT_STATUS.json` reseal, all 13 normal workflow families must run again from scratch on the resulting exact unchanged head before PR #82 can merge.

## Stage 2A next prerequisite

`NEXT_TASK.md` authorizes only **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**.

Detailed design: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Stage 2A is emulator/test-only. A fresh successor may implement it only after initializing and assessing its own Work Environment Continuity record.

The proof must use the existing fixed demo project `demo-career-mode-showdown-phase1f`, add the Authentication Emulator on localhost port `9099`, preserve Firestore Emulator port `8080`, and prove real Firebase Auth `uid` → architecture `accountId` identity through cross-service Firestore Security Rules.

It must prove distinct synthetic principals, wrong-account denial, unauthenticated denial, sign-out loss of later authenticated access, application-account lifecycle separation, provider identity over client-supplied identity, in-memory-only test Auth persistence, no persisted raw passwords/ID tokens/refresh tokens and continued denial of every client Firestore write.

Synthetic email/password users are permitted only as deterministic emulator test data. Stage 2A does not select production sign-in UX or browser persistence.

Do not add production Firebase, production signup/login UI, registered-device/pairing UX, Connected Rivalry, Remote Joining, Cloud Functions/Admin/Blaze or public/community/ranking features during Stage 2A.

## Corrections made while proving PR #82

The published authority candidates exposed documentation/contract coherence defects. They were fixed at source without weakening any protected behavior:

1. restored the literal Work Environment Continuity routing requirement in the developer bootstrap;
2. restored the protected GitHub CLI bootstrap and checksum-verification guidance;
3. preserved historical Phase 1E / Phase 1F roadmap phrases only inside clearly labeled provenance sections so permanent historical contracts remain truthful without becoming current authority;
4. corrected new Stage 2A contract wording so deny-all Firestore semantics were matched exactly rather than by brittle phrasing;
5. corrected the Phase 1F deny-all matcher to accept the exact protected wording;
6. corrected the Phase 1F idempotency-finding matcher to protect the actual `idempotencyKeyHash` sibling-receipt finding;
7. restored the shipped Installable Offline App baseline wording;
8. restored the completed Local Profiles / Save Library dependency-chain wording;
9. restored this handoff's mandatory `IMMEDIATE NEXT TASK AFTER FULL STUDY` boundary after the first status seal exposed its omission.

No runtime defect, timeout increase, performance-ceiling increase, Candidate C weakening or direct-client-write relaxation was used to obtain green CI.

## Work Environment Continuity final assessment

Environment: `we-2026-08-18-private-auth-stage2a-boundary`.
Starting verified main: `231556d86a93535fa90e173577c1159de4f40be0`.
Usage remaining percentage: unavailable and never estimated.

Final recorded signals before the corrected status reseal:

- context complexity: high;
- project complexity: very-high;
- compaction count: 5;
- major phases completed: 3;
- large evidence events: 19;
- tool-routing errors: 4;
- corrected failures: 9;
- repeated mistakes: 0;
- stale-fact corrections: 0;
- unresolved failures: 0;
- new milestone next: true;
- handoff completeness: 99;
- unrecorded decisions: 0;
- atomic operation: false.

Reconstructed exactly from the current repository formula because local GitHub DNS prevents a truthful local checkout/npm-wrapper claim:

- context pressure: `98/100`;
- quality risk: `60/100`;
- next-task separation: `80/100`;
- handoff readiness: `99/100`;
- continuation risk: `80.4/100`;
- transition cost: `14.0/100`;
- transition advantage: `66.4`.

Decision: `HANDOFF_AT_CHECKPOINT`.

The decision is driven by high observable context pressure plus the distinct Stage 2A implementation milestone. It is not caused by an unresolved runtime or product failure.

## Tooling boundary

Direct shell DNS cannot resolve GitHub in this environment. Connector-backed GitHub source/write access and GitHub-hosted CI are the verified source/proof path. Transient connector routing/log-availability issues were classified as environment tooling, not project failures.

The repository-owned GitHub CLI bootstrap remains protected for environments where local routing permits it. Never copy connector credentials into local config.

## Permanent product and recovery locks

Private Remote Joining remains **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane
→ paired-device / private-session capability — blocked Stage 3
→ Connected Rivalry — blocked Stage 4
→ Private Remote Joining — final destination.

Public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

Exactly two managers remain authoritative. Same selected league, different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero score is a Draw; only 0–0 uses league position then league points.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Auth/cloud/sync module may directly own canonical `localStorage`.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

A fresh successor must independently verify live main, PR #82, branches, releases/tags and CI; validate/archive this environment's transition-prepared record before replacing it; initialize a new environment ID and reset observations; verify production remains v1.4.0 / `1.4.0-r1`; confirm production Firebase remains disconnected and all client Firestore writes remain denied; read `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md` and current Firebase primary Auth Emulator/Auth persistence/Security Rules documentation; then implement only Stage 2A if the successor's own continuity assessment permits.

Do not repeat Phase 1F. Do not ask the owner to reconstruct prior chats. Do not jump to pairing, Connected Rivalry or Remote Joining.
