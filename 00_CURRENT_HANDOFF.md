# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET

Treat this file as current orientation, never as implementation authority. Current source, live GitHub state, current CI, deployed behavior and later owner instructions override historical statements. `NEXT_TASK.md` is the sole primary implementation-authorization authority.

## Repository

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Current verified production boundary

Latest verified live main before the current Stage 2F branch:

`0cb56c22f82facdb248c8c68ec59064c5612c543`

This is the squash merge of PR #89 `Private Auth Stage 2E trusted account bootstrap`.

PR #89 exact validated head:

`f7d462b3d8252b2912f34a1589e457c03e977bd3`

All 13 normal workflow families passed on that unchanged exact head. Submitted reviews and inline review threads were empty.

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Runtime: `1.4.0-r1`
Previous whole-shell recovery target: `1.3.0-r2`
Production Firebase: DISCONNECTED
Application-client Firestore writes: DENIED

## Work Environment Continuity

Every fresh environment must validate the predecessor, archive predecessor final facts, initialize a NEW environment ID, reset per-environment observations, record current source truth and only then assess its own continuation state.

Never assess a predecessor HANDOFF/PREPARE_HANDOFF decision as if it were the successor's own current decision.

Every substantive owner-facing project response must visibly include:

`Handoff proximity: X%`

At 100% finish only the current safe bounded checkpoint, automatically generate the complete successor handoff and stop before another substantial milestone. Never fabricate unavailable usage. A stricter WEC transition decision overrides a lower displayed percentage. Preserve this rule recursively in every future handoff.

## Completed dependency state

Cloud / Sync Readiness Phase 1A through 1F: DONE / MERGED / PROTECTED.

Private Account / Authentication / Authorization:

Stage 2A — DONE / MERGED / PROVEN — PR #83
Stage 2B — DONE / MERGED / PROVEN — PR #84
Stage 2C — DONE / MERGED / PROVEN — PR #85
Handoff Proximity governance — DONE / MERGED / PROTECTED — PR #86
Post-PR #86 reconciliation — DONE / MERGED / PROVEN — PR #87
Stage 2D — DONE / MERGED / PROVEN — PR #88
Stage 2E — DONE / MERGED / PROVEN — PR #89
Stage 2F — CURRENT / IMPLEMENTATION-AUTHORIZED / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF

Do not repeat Stages 2A through 2E.

## Stage 2E completion truth

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary — is DONE / MERGED / PROVEN.

Exact validated head: `f7d462b3d8252b2912f34a1589e457c03e977bd3`.
Squash merge/live-main boundary: `0cb56c22f82facdb248c8c68ec59064c5612c543`.

It protects trusted Firebase Auth UID → architecture `accountId`, exact missing-account bootstrap planning, idempotent no-write handling for valid active/disabled/deletion-pending accounts, conflict rejection and browser account-write denial.

Do not treat any branch-frozen historical `Stage 2E CURRENT` wording as current authority.

## Current Stage 2F mission

Current authorized prerequisite: Private Account / Authentication Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

The current branch is:

`agent/private-auth-stage2f-token-verification`

Fresh environment ID:

`we-2026-08-18-stage2f-token-verification`

Stage 2F is intentionally narrower than building a backend or provisioning Firebase.

It adds only a dormant fail-closed trusted request-principal decision boundary and a real Authentication Emulator/Admin wiring proof. The future trusted adapter must call `verifyIdToken(idToken, true)`, derive `accountId` only from verified Firebase `uid`, reject invalid/expired/revoked/disabled/unavailable/unknown provider verification outcomes and explicitly keep application authorization separate.

Raw ID tokens must remain transient. They may not be logged, persisted, reflected into results or committed to fixtures.

The Authentication Emulator proves wiring/identity behavior only. It is not production proof of token signing, IAM, rate limits or every production revocation-propagation timing detail.

## Production boundary remains closed

Stage 2F does NOT authorize:

production Firebase project/Web App provisioning
real production users
production Google provider/Authorized Domains changes
production Firebase SDK/Auth/Firestore in the GitHub Pages shell
production Firestore data or deployed Security Rules
Firebase Admin production runtime
service-account credentials
Cloud Functions/Cloud Run
Blaze billing
production IAM/service identity
trusted production account-write execution
trusted production mutation gateway
account UI
registered devices
pairing/invites
Connected Rivalry
Remote Joining
public community/discovery/matchmaking/profiles/global rankings

Privileged Firestore server clients bypass Firestore Security Rules and rely on IAM. No future server-side privileged write may ship without its own bounded IAM/service-identity and operation-authorization review.

## Local product/recovery locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Candidate A remains non-mutating export.
Candidate B remains read-only import analysis.
Candidate C remains the sole destructive import Apply authority with strict raw snapshots/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks and exact verification.

No Auth/cloud/sync module may directly own canonical localStorage.

Firebase UID/accountId remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

## Gameplay locks

Exactly two managers.
Same selected league.
Different permanent clubs.
Showdown lengths 1 / 3 / 5 / 10 seasons.
Maximum Season score 11.
Equal non-zero scores are Draws.
Only 0–0 uses league position then league points.

## Long-term path

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Cloud / Sync Readiness — DONE
→ Private Account / Authentication / Authorization — CURRENT Stage 2 lane; 2A–2E DONE; 2F CURRENT
→ Registered Devices / Private Pairing — Stage 3 BLOCKED
→ Connected Rivalry — Stage 4 BLOCKED
→ Private Remote Joining — Stage 5 final destination
→ hardening / stable release.

Public community features and global leaderboard/rankings remain ELIMINATED.

## Publication gate

For Stage 2F:

1. preserve production v1.4.0 / `1.4.0-r1` and Firebase disconnection;
2. reconcile Stage 2E DONE authority;
3. keep Stage 2F production-dormant;
4. run the complete repository contract suite and emulator proof;
5. require all 13 normal workflow families to pass on one exact unchanged final PR head;
6. check submitted reviews and inline review threads immediately before merge;
7. require mergeability and exact head identity;
8. squash merge with expected-head protection;
9. independently verify live `main` afterward;
10. reassess WEC before beginning any separate next Stage 2 milestone.

Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only Private Account / Authentication Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary. Preserve every production/recovery/security lock above, require trusted revocation-aware token verification, complete one exact-head PR publication gate and reassess WEC before any later Stage 2 milestone.
