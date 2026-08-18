# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-18 ET (PR #89 complete / Stage 2F trusted request authentication current)

This file owns current deployed product state. `NEXT_TASK.md` is the sole primary implementation-authorization authority. Current verified source, live GitHub state and later owner instructions override historical wording.

## Development continuity infrastructure

The repository Work Environment Continuity system remains active through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. Every fresh environment follows validate → archive/replace → assess before substantial work.

Every substantive owner-facing project response visibly includes `Handoff proximity: X%`. At 100%, generate the complete successor handoff automatically, finish only the current safe bounded checkpoint and stop before another substantial milestone. Never fabricate unavailable usage. A stricter WEC decision overrides a lower displayed percentage.

## Production authority

Application milestone: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Production Firebase remains disconnected.

No production Firebase project, Firebase Web App, real production Auth user, production Firestore gameplay data, deployed production Security Rules, Firebase Admin production runtime, service-account credential, Cloud Function, trusted production mutation gateway or Blaze billing exists.

Every application-client Firestore create/update/delete remains denied. Persistent Firestore offline cache remains disabled.

## Completed connected dependency chain

Cloud / Sync Readiness Phase 1A through Phase 1F: DONE / MERGED / PROTECTED through PRs #76–#81.

Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary: DONE / MERGED / PROVEN through PR #83, exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78`, merge `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

Stage 2B — Provider Session Lifecycle & Revocation Boundary: DONE / MERGED / PROVEN through PR #84, exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`, merge `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary: DONE / MERGED / PROVEN through PR #85, exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`, merge `22566e1409cf53d728b38d0b5a19de478ae6761b`.

PR #86 — Handoff Proximity governance synchronization: DONE / MERGED / PROTECTED, exact validated head `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`, merge `1794f1f86968781b898d000360d1fb56234fb92f`.

PR #87 — post-PR #86 authority reconciliation: DONE / MERGED / PROVEN, exact validated head `2415c156161b6244c75e49917bad28efed957adf`, merge `0accb827fa91f86fdd28e63590bd4843267546ae`.

Stage 2D — Production Firebase Environment & Configuration Preflight: DONE / MERGED / PROVEN / NON-RUNTIME through PR #88, exact validated head `f019c6c6c39385fcb1f76f3de240fd73bb972e49`, merge `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary: DONE / MERGED / PROVEN through PR #89, exact validated head `f7d462b3d8252b2912f34a1589e457c03e977bd3`, squash merge / independently verified live-main boundary `0cb56c22f82facdb248c8c68ec59064c5612c543`.

All 13 normal workflow families passed on the exact unchanged PR #89 head; submitted reviews and inline review threads were empty.

Do not repeat Stages 2A through 2E, PR #86 or PR #87.

## Current Private Account / Authentication boundary

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — is CURRENT / IMPLEMENTATION-AUTHORIZED / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF / PRODUCTION FIREBASE DISCONNECTED.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

The dormant Stage 2F boundary requires a future trusted verifier to authenticate the transient Firebase ID token with revocation checking explicitly enabled, derive architecture `accountId` only from the verified Firebase `uid`, reject invalid/expired/revoked/disabled/unavailable/unknown verification failures, and explicitly keep application authorization separate.

Stage 2F does not create a production backend, production Firebase project, production IAM/service identity or production trusted write executor.

Firebase Admin and privileged Firestore server clients remain test/emulator-only in this repository. Firestore server clients bypass Firestore Security Rules and rely on IAM, so any future production trusted execution boundary requires separately reviewed least-privilege service identity and operation authorization.

## Permanent identity and authorization locks

Firebase Auth `uid` is architecture `accountId`.

It is not `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` or `inviteId`.

Display names, email addresses, club labels and Local Profile labels are presentation only and have zero authentication or authorization authority.

Provider authentication is not application authorization. Application account status, device state, rivalry entitlement, private-session membership and operation-specific authority remain separate checks.

## Permanent Phase 1F remote-write finding

The protected shared-state schema does not expose the idempotency-key hash needed for Firestore Security Rules to identify the matching sibling replay receipt for a direct client state write.

Therefore every application-client Firestore write remains denied. A modified browser client can bypass helper logic. A later trusted mutation gateway or separately reviewed provider-enforceable protocol/schema change remains required before remote mutation can ship.

## Recovery/import and canonical storage locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Never restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C remains the sole destructive import Apply authority and keeps strict exact raw snapshots/preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery.

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Product and gameplay locks

Exactly two managers.

Both managers use the same selected league and different permanent clubs.

Showdown lengths remain `1`, `3`, `5`, `10` seasons.

Scoring remains Champions League +5, Domestic League +3, Main Domestic Cup +1, the 100 League Points / 100 League Goals pair maximum +1 total, and the Top Scorer / Top Assist pair maximum +1 total. Maximum Season score remains 11.

Equal non-zero scores are Draws. Only 0–0 uses league position then league points as the tiebreaker.

Career Mode Showdown remains a private two-manager companion.

Public community features, public discovery, public matchmaking, public profiles and global leaderboard/rankings are ELIMINATED.

## Private Remote Joining direction

Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Required order:

completed local recovery / identity / portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ Private Account / Authentication / Authorization — CURRENT Stage 2 lane; 2A DONE; 2B DONE; 2C DONE; 2D DONE; 2E DONE; 2F CURRENT
→ Registered Devices / Private Pairing — Stage 3 BLOCKED
→ Connected Rivalry — Stage 4 BLOCKED
→ Private Remote Joining — Stage 5 final dependency-gated destination
→ hardening / stable release.

No later stage may be pulled forward merely to show visible progress.

## Version and performance state

Stage 2F is dormant prerequisite code, documentation, permanent contracts and emulator/test proof only. It changes no shipped production application behavior, so `VERSIONING_POLICY.md` keeps production at v1.4.0 / `1.4.0-r1`.

Locked ceilings remain eager raw <= `165000`, eager gzip <= `37500`, Reus startup portrait <= `95000`, combined first-party startup <= `260000`, normal loading minimum `2700 ms`, reduced-motion loading `220 ms`.

Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## Current authorization boundary

No product candidate is currently authorized.

The only current bounded prerequisite is Stage 2F Trusted Request Authentication & ID Token Revocation Boundary.

Production Firebase provisioning, real provider/domain configuration, a deployed trusted server, production IAM/service identity, trusted account-write execution, production Security Rules deployment, account export/deletion, registered devices, pairing, Connected Rivalry and Private Remote Joining remain later independently reviewed gates.

After Stage 2F exact-head validation and merge, independently verify live `main` and reassess WEC before selecting any distinct later Stage 2 milestone.

## Historical provenance

The following literals are preserved as historical contract provenance only and do not override the current completed Phase 1A–1F / Stage 2F state above.

formatVersion 2 full multi-Save backup/import portability is live production truth.
explicit cross-Save/historical manager identity linkage foundation is shipped local identity authority.
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1`.
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398`.
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599`.
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`.
Phase 1D — DONE / MERGED / PROTECTED. Phase 1E — CURRENT BOUNDED CANDIDATE.
Phase 1F — NEXT AFTER PHASE 1E MERGES / BLOCKED.

Historical source may contain earlier phrases such as `Phase 1E — CURRENT BOUNDED CANDIDATE`, `Phase 1F — NEXT AFTER PHASE 1E MERGES / BLOCKED`, or `Stage 2A — AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. Those phrases describe completed transitions and are not current authority.
