# Career Mode Showdown — Private Remote Joining Execution Roadmap

Last updated: 2026-08-18 ET — Stage 2E merged / Stage 2F current

Status: long-term dependency-order authority. `NEXT_TASK.md` remains the sole current implementation-authorization authority.

## Destination

Private Remote Joining is the prioritized long-term product destination.

It remains DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

The owner prioritizes infrastructure prerequisites, stability, dependency correctness and complete testing over speed.

Public community features, public discovery, public matchmaking, public profiles, public invitation directories and global leaderboard/rankings remain ELIMINATED.

## Current production identity

Current production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Immediate previous known-good whole shell remains `1.3.0-r2`.

Production Firebase remains disconnected.

Every application-client Firestore create/update/delete remains denied.

## Required dependency order

Stage 1 — Cloud / Sync Readiness
DONE through Phase 1F.

→ Stage 2 — Private Account / Authentication / Authorization
ACTIVE prerequisite lane.

2A Firebase Auth Emulator Identity Boundary — DONE / MERGED / PROVEN — PR #83
2B Provider Session Lifecycle & Revocation Boundary — DONE / MERGED / PROVEN — PR #84
2C Production Authentication Policy & Static-Hosting Compatibility Boundary — DONE / MERGED / PROVEN — PR #85
Handoff Proximity governance — DONE / MERGED / PROTECTED — PR #86
Post-PR #86 authority reconciliation — DONE / MERGED / PROVEN — PR #87
2D Production Firebase Environment & Configuration Preflight — DONE / MERGED / PROVEN — PR #88
2E Trusted Application Account Bootstrap & Lifecycle Boundary — DONE / MERGED / PROVEN — PR #89
2F Trusted Request Authentication & ID Token Revocation Boundary — CURRENT / IMPLEMENTATION-AUTHORIZED / PRODUCTION FIREBASE DISCONNECTED

→ Stage 3 — Registered Devices / Private Pairing
BLOCKED until whole Stage 2 is proven.

→ Stage 4 — Connected Rivalry
BLOCKED until Stage 3 and all earlier prerequisites are proven.

→ Stage 5 — Private Remote Joining
FINAL DEPENDENCY-GATED PRODUCT DESTINATION.

→ hardening / stable release.

Do not skip stages.

## Stage 1 protected foundation

Cloud / Sync Readiness Phase 1A through 1F is DONE / MERGED / PROTECTED.

Permanent outcomes include deterministic revision semantics, immutable baseRevision, CAS/stale conflict behavior, idempotency/replay protection, tombstones, offline/reconnect determinism, device attribution, remote-data minimization, private remote boundaries, two-owner authorization, Firebase-compatible remote schema/API contracts, deny-by-default Firestore Security Rules and real Local Emulator proof.

Production Firebase remained disconnected throughout Stage 1.

## Stage 2 completed boundaries

Stage 2A proves Firebase Auth provider UID → architecture `accountId`, cross-service Firestore Security Rules identity, wrong-account/unauthenticated/sign-out denial and continued direct client-write denial.

Stage 2B proves provider disable/new-sign-in failure, re-enable with the same stable UID, independent application-account authorization and emulator-routed refresh-token revocation. It deliberately does not claim complete production in-flight token-revocation timing or final trusted `checkRevoked` behavior.

Stage 2C selects the future client authentication policy: Google `GoogleAuthProvider`, explicit-user-gesture `signInWithPopup()` on current GitHub Pages, explicit `browserSessionPersistence`, no extra Google OAuth scopes, no deliberate provider access-token persistence, and no redirect until a separately reviewed hosting/auth-domain boundary exists.

Stage 2D is a readiness validator, not production provisioning. Exact validated head `f019c6c6c39385fcb1f76f3de240fd73bb972e49`; squash merge `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

Stage 2E is DONE / MERGED / PROVEN. Exact validated PR #89 head `f7d462b3d8252b2912f34a1589e457c03e977bd3`; squash merge / independently verified live-main boundary `0cb56c22f82facdb248c8c68ec59064c5612c543`.

Stage 2E protects trusted UID-only application-account bootstrap, exact missing-account create planning, idempotent no-write behavior for valid active/disabled/deletion-pending accounts, identity/schema conflict rejection and browser account-write denial.

Do not repeat Stage 2E.

## Current Stage 2F prerequisite

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — is the smallest current trust prerequisite before live provisioning or privileged production writes.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

A future privileged request must not trust a body-supplied `accountId`. Stage 2F requires a future trusted server adapter to verify the transient Firebase ID token with revocation checking enabled and derive architecture `accountId` from the verified Firebase `uid` only.

The dormant decision boundary explicitly requires `verifyIdToken(idToken, true)` and fails closed for invalid, expired, revoked, disabled, unavailable, malformed or unknown verifier outcomes.

Successful provider authentication does not grant application authorization. Current application account status, device registration, pairing/invite entitlement, rivalry/session membership and operation-specific authority remain separate later checks.

The real Authentication Emulator proof is wiring proof only. Emulator-issued test tokens are not production cryptographic/IAM/rate-limit/revocation-propagation proof.

Stage 2F creates no production backend, no live Firebase project, no production IAM/service identity and no trusted write execution.

## Permanent remote-write security boundary

Every application-client Firestore write remains denied.

The Phase 1D/1F schema does not expose the sibling idempotency receipt key needed for Security Rules to enforce the exact replay contract on a modified browser client. A trusted mutation gateway or separately reviewed provider-enforceable protocol/schema change remains a later gate.

Privileged Firestore server libraries bypass Firestore Security Rules and rely on IAM. Production Admin/service credentials must never exist in browser code or repository source.

## Stage 2 remaining concerns

Remaining concerns are not a pre-authorized execution order:

actual production Firebase project/environment provisioning
production Web App configuration
Google provider and Authorized Domains operational setup
trusted application-account write execution
least-privilege IAM/service identity
production Security Rules deployment
account export
provider-aware deletion cascade
abuse/rate controls
provider outage/recovery behavior
trusted production mutation gateway/protocol decision
production operational verification of token/revocation behavior

Select one smallest safe prerequisite at a time after current source study and WEC assessment.

## Stage 3 Registered Devices / Private Pairing — blocked

Stage 3 may not start until all Stage 2 identity/authentication/authorization prerequisites are proven.

Future Stage 3 work must preserve distinct stable `deviceId` and `installationId`, account/device lifecycle separation, private invite capability, exactly two authorized owners, revocation and replay resistance, no public discovery and local-first fallback.

## Stage 4 Connected Rivalry — blocked

Stage 4 may not start until Stage 3 is proven.

Future Connected Rivalry must preserve immutable-base revision/conflict semantics, idempotency, tombstones, two-owner governance, deterministic reconnect behavior and current local recovery protections.

## Stage 5 Private Remote Joining — blocked

Private Remote Joining must remain private. It may not quietly introduce public matchmaking, public profiles, global rankings or open session discovery.

Its eventual release scope must be classified under `VERSIONING_POLICY.md` from actual shipped behavior. Roadmap position does not pre-assign a version number.

## Permanent local/product locks

Exactly two managers; same selected league; different permanent clubs; 1/3/5/10 seasons; maximum season score 11; equal non-zero scores Draw; only 0–0 uses league position then league points.

Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks and exact verification.

Firebase `uid` / architecture `accountId` remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

## Validation rule

Every bounded prerequisite requires permanent contracts and the full applicable CI gate. Before publication require all 13 normal workflow families to pass on one exact unchanged final PR head, check submitted reviews and inline review threads immediately before merge, merge with expected-head protection and independently verify live `main` afterward.

Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## Historical Cloud Readiness provenance

The following completed-transition wording is intentionally retained because permanent Cloud Foundation and Stage 2A boundary contracts protect it. It is historical only and does not override the current Stage 2F lane above.

Phase 1A — DONE / MERGED / PROTECTED
Phase 1B — DONE / MERGED / PROTECTED
Phase 1C — DONE / MERGED / PROTECTED
Phase 1D — DONE / MERGED / PROTECTED
Phase 1E — CURRENT BOUNDED CANDIDATE
Phase 1F — NEXT AFTER PHASE 1E MERGES / BLOCKED
Stage 1 — Cloud / Sync Readiness — DONE / MERGED / PROTECTED through Phase 1F.
Stage 2A — Firebase Auth Emulator Identity Boundary — AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED.
Stage 3 — Registered Devices / Private Pairing — BLOCKED until Stage 2 is proven.
