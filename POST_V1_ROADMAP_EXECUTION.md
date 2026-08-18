# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-18 ET (PR #89 complete / Stage 2F current)
Status: current dependency/status authority for post-v1 direction. `NEXT_TASK.md` remains the sole primary implementation-authorization authority.

## 1. Current production authority

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

Production Firebase remains disconnected.

Every application-client Firestore create/update/delete remains denied.

## 2. Permanent inherited rules

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture/recovery integrity: canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the sole destructive import Apply authority with exact raw snapshots/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks and exact verification.

Continuity integrity: every substantive owner-facing project response visibly includes `Handoff proximity: X%`; at 100% automatically generate the complete successor handoff and stop after the current safe checkpoint. Unknown usage is never fabricated and a stricter WEC decision overrides the displayed percentage.

Product philosophy lock: Career Mode Showdown is a private two-manager companion. Public community, discovery, matchmaking, public profiles and global leaderboard/rankings are ELIMINATED. Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

## 3. Completed dependency chain

Local recovery / identity / portability / Product Deepening through v1.4.0: DONE / PRODUCTION-PROVEN.

Cloud / Sync Readiness:

Phase 1A — PR #76 — DONE / MERGED / PROTECTED
Phase 1B — PR #77 — DONE / MERGED / PROTECTED
Phase 1C — PR #78 — DONE / MERGED / PROTECTED
Phase 1D — PR #79 — DONE / MERGED / PROTECTED
Phase 1E — PR #80 — DONE / MERGED / PROTECTED
Phase 1F — PR #81 — DONE / MERGED / PROTECTED

Private Account / Authentication / Authorization:

Stage 2A — PR #83 — DONE / MERGED / PROVEN
Stage 2B — PR #84 — DONE / MERGED / PROVEN
Stage 2C — PR #85 — DONE / MERGED / PROVEN
Handoff Proximity governance — PR #86 — DONE / MERGED / PROTECTED
Post-PR #86 reconciliation — PR #87 — DONE / MERGED / PROVEN
Stage 2D — PR #88 — DONE / MERGED / PROVEN
Stage 2E — PR #89 — DONE / MERGED / PROVEN
Stage 2F — CURRENT / IMPLEMENTATION-AUTHORIZED / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF

Do not repeat any completed stage.

## 4. Stage 2D completion boundary

Stage 2D — Production Firebase Environment & Configuration Preflight — is DONE / MERGED / PROVEN / NON-RUNTIME.

Exact validated head: `f019c6c6c39385fcb1f76f3de240fd73bb972e49`.
Squash merge: `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

Stage 2D is a readiness validator, not production provisioning.

## 5. Stage 2E completion boundary

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary — is DONE / MERGED / PROVEN.

Exact validated head: `f7d462b3d8252b2912f34a1589e457c03e977bd3`.
Squash merge / independently verified live-main boundary: `0cb56c22f82facdb248c8c68ec59064c5612c543`.

All 13 normal workflow families passed on that exact unchanged head. Submitted reviews and inline review threads were empty.

Stage 2E permanently protects trusted Firebase `uid` → architecture `accountId`, exact missing-account bootstrap planning, idempotent no-write for valid active/disabled/deletion-pending existing accounts, fail-closed identity/schema conflicts, browser account-write denial and production isolation.

Do not repeat Stage 2E.

## 6. Current Stage 2F boundary

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — is the only current bounded prerequisite.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

It is selected before production provisioning, trusted writes, IAM/service identity or a mutation gateway because every later privileged operation must first authenticate the caller from a provider-issued Firebase ID token and derive `accountId` from verified Firebase `uid`, never from request-body identity.

The dormant verifier contract requires:

1. a non-empty transient Firebase ID token at a future trusted-server boundary;
2. an injected trusted verifier invoked as `verifyIdToken(idToken, true)`;
3. architecture `accountId` derived only from the verified UID;
4. fail-closed invalid, expired, revoked, disabled, unavailable and unknown verification outcomes;
5. no raw token or arbitrary provider diagnostic reflected from the decision result;
6. successful provider authentication explicitly not granting application authorization;
7. emulator-only wiring proof without treating emulator behavior as production signing, IAM, rate-limit or complete revocation-timing proof.

Stage 2F creates no production backend, project, user, Firebase connection, IAM identity or trusted write authority.

## 7. Permanent provider and security boundaries

Stage 2C remains authoritative for future client Auth policy: Google `GoogleAuthProvider`, explicit-user-gesture `signInWithPopup()` on the current GitHub Pages topology, explicit `browserSessionPersistence`, no extra Google OAuth scopes, no deliberate provider access-token persistence, and no redirect until a separately reviewed hosting/auth-domain boundary exists.

Firebase Auth `uid` is architecture `accountId` and remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

Provider authentication is separate from application authorization.

The Phase 1F remote-write finding remains binding: the shared-state schema does not expose the sibling idempotency-receipt key needed for provider-enforceable direct client state mutation. Every application-client Firestore write remains denied.

Privileged Firestore server clients bypass Firestore Security Rules and rely on IAM. Production Admin/service credentials remain forbidden from browser code and repository source.

## 8. Remaining Stage 2 concerns

The following remain concerns, not a pre-authorized execution order:

actual production Firebase environment/project provisioning
production Web App configuration
Google provider / authorized-domain operational setup
trusted application-account write execution
IAM/service identity boundary
production Security Rules deployment
account export
provider-aware deletion cascade
abuse/rate controls
provider outage/recovery behavior
trusted production mutation gateway/protocol decision
production operational validation of token/revocation behavior

Do not bundle them into one PR and do not provision live privileged infrastructure simply because it appears in this list.

## 9. Remote Joining dependency order

Cloud / Sync Readiness — DONE through Phase 1F
→ Private Account / Authentication / Authorization — CURRENT Stage 2 lane; 2A DONE; 2B DONE; 2C DONE; 2D DONE; 2E DONE; 2F CURRENT
→ Registered Devices / Private Pairing — Stage 3 BLOCKED until whole Stage 2 is proven
→ Connected Rivalry — Stage 4 BLOCKED until Stage 3 and earlier prerequisites are proven
→ Private Remote Joining — Stage 5 FINAL DEPENDENCY-GATED PRODUCT DESTINATION
→ hardening / stable release.

Stability and dependency order take priority over speed.

## 10. Versioning

`VERSIONING_POLICY.md` remains authoritative. Dormant architecture/contracts/emulator/policy prerequisites do not receive a cosmetic application version bump. As soon as connected prerequisite code changes shipped production behavior, classify it as PATCH/MINOR/MAJOR from actual scope.

Current production remains v1.4.0 / `1.4.0-r1`.

## 11. Historical provenance

The following literals are retained as historical contract provenance only. They describe the earlier Cloud Readiness transition and do not override the completed Phase 1A–1F chain or current Stage 2F authority above.

Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED
Cross-Save manager/profile linkage semantics | DONE
Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN
Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE
Cloud Readiness | PHASE 1A DONE / 1B DONE / 1C DONE / 1D DONE / 1E CURRENT / 1F NEXT
Cloud Backup | BLOCKED
Private Remote Joining | PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET AUTHORIZED

Earlier roadmap text may also contain phrases such as `Phase 1E — CURRENT BOUNDED CANDIDATE`, `Stage 2D CURRENT`, or `Stage 2E CURRENT`. Those are historical transition boundaries only and do not override verified PR #89 completion or `NEXT_TASK.md`.
