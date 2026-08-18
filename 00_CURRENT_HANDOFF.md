# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization.

## Current production boundary

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

PR #82 synchronized the completed Phase 1F boundary and authorized Stage 2A from exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7` to squash merge `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

PR #83 completed Stage 2A from exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78` to squash merge `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

PR #84 completed Stage 2B from exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f` to squash merge / independently verified live main `c4feadb69fb5e26eba19fa520afa0a09baf1de03`. All 13 normal workflow families were successful on that exact unchanged head; submitted reviews and inline review threads were empty.

Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing exists.

Every application-client Firestore write remains denied. The protected Phase 1D shared-state schema still does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. A trusted mutation gateway or separately reviewed schema/protocol change remains a later independent production-write gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Completed Stage 2A / Stage 2B checkpoints

Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Stage 2B proves trusted emulator-only provider disable/new-sign-in denial/re-enable with the same stable Firebase `uid` / architecture `accountId`, independent application-account fail-closed authorization, continued denial of every application-client Firestore write and test-only `revokeRefreshTokens(uid)` routing without deliberate raw bearer-token retrieval or persistence.

The Authentication Emulator proof does not establish every production in-flight ID-token invalidation timing detail or backend `checkRevoked` behavior. Final trusted production token verification remains a later Stage 2 gate.

Do not repeat Stage 2A or Stage 2B.

## Current Stage 2C checkpoint

Current branch: `agent/private-auth-stage2c-production-auth-policy`.
Fresh environment: `we-2026-08-18-private-auth-stage2c-production-auth-policy`.
Starting verified live main: `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

The successor independently verified PR #84 merge/head/CI/review state, reconciled the predecessor's final publication and one post-seal context compaction into append-only history, then initialized a fresh Work Environment Continuity record before assessment. The predecessor `FINISH_SAFE_BOUNDARY` decision was not inherited.

Fresh assessment: `CONTINUE`. Usage percentage remains unavailable and was not estimated.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — is the CURRENT BOUNDED CANDIDATE.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`.

The selected policy is:

1. initial production authentication provider: Google federated sign-in through `GoogleAuthProvider` only;
2. current static GitHub Pages flow: `signInWithPopup()` from an explicit user gesture;
3. `signInWithRedirect()` remains blocked until a separately reviewed same-origin/auth-domain hosting compatibility boundary is proven;
4. initial production Auth persistence: explicit `browserSessionPersistence`, not implicit durable `browserLocalPersistence`;
5. no extra Google OAuth scopes;
6. no deliberate Google provider access-token retrieval or persistence;
7. Firebase `uid` remains architecture `accountId`, never Local Profile or gameplay identity;
8. application account status and rivalry entitlement remain separate authorization gates;
9. every application-client Firestore create/update/delete remains denied;
10. production Firebase remains disconnected and production stays v1.4.0 / `1.4.0-r1`.

Stage 2C is policy-only. It creates no production Firebase project, real Firebase user, account UI, production Firestore data, deployed Security Rules, Admin production runtime, Cloud Function, service credential or paid infrastructure.

## Why Stage 2C precedes production connection

Current Firebase documentation makes three boundaries relevant before real account onboarding: Web Auth otherwise defaults to durable local persistence, redirect sign-in requires extra hosting/domain handling on browsers that block third-party storage, and final revoked-token checking is a trusted verification concern rather than something a static client can prove by itself.

The project therefore fixes provider/popup/persistence policy first and keeps production connection off until a later separately reviewed operational gate.

## Permanent product and recovery locks

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C CURRENT
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

## Historical Analytics evidence retained for provenance

A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent Showdown and Season totals.

Failure 7 in historical PR #59 validation was a transient/offscreen rendered-text assertion issue rather than a product data-corruption finding. The offscreen Trophy cabinet rendered-text assertion evidence remains preserved so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

Historical Stage 2A status before PR #83 began was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. It is historical provenance only.

## Tooling boundary

Direct shell DNS to GitHub remains unavailable in this environment. Connector-backed GitHub source/write access and GitHub-hosted CI are therefore the verified source/proof path. The repository-owned GitHub CLI bootstrap remains protected for environments where routing permits it. Never copy connector credentials into local configuration.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Complete only the Stage 2C policy publication boundary: keep production Firebase disconnected, retain the Google-popup/session-persistence policy and all security/recovery locks, finish authority synchronization, run the complete exact-head normal CI gate, verify clean submitted reviews and inline threads plus mergeability, then use expected-head squash merge only if the unchanged exact head is fully green.

After verified Stage 2C merge, independently verify live `main` and reassess Work Environment Continuity before selecting another distinct Stage 2 prerequisite.

Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining automatically. Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F, PR #82, Stage 2A / PR #83 or Stage 2B / PR #84. Do not rush Private Remote Joining.
