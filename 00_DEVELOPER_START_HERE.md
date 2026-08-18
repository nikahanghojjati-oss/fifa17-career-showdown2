# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-18 ET — PR #89 complete / Stage 2F current

Use this as startup orientation only. Current source, live GitHub state, deployed behavior, CI and later owner instructions override every historical record. `NEXT_TASK.md` is the sole primary implementation-authorization authority.

## Mandatory Work Environment Continuity startup sequence

1. Verify live `main`, recent commits, open PRs, active branches, tags/releases when the connector supports them, current CI, package/runtime identity and deployed site.
2. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `00_CURRENT_HANDOFF.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `VERSIONING_POLICY.md`, `POST_V1_ROADMAP_EXECUTION.md` and `REMOTE_JOINING_EXECUTION_ROADMAP.md`.
3. Validate the predecessor status as predecessor history.
4. Archive predecessor final facts when required.
5. Initialize a NEW work-environment ID.
6. Reset all per-environment observations and counters.
7. Record current source truth, selected task and hazards.
8. Only then run the successor environment's own WEC assessment.
9. Obey that successor assessment.

Never inherit or assess a predecessor HANDOFF/PREPARE_HANDOFF decision as the successor's own decision.

The repository-owned GitHub CLI bootstrap remains available through `npm run work:gh:bootstrap` when the environment supports it. Its rootless install path requires checksum verification before exposing a downloaded launcher; connected GitHub remains connector-first and connector credentials must never be extracted, copied or repurposed.

## Mandatory Handoff Proximity rule

Every substantive owner-facing project response must visibly include:

`Handoff proximity: X%`

Never fabricate unavailable account/model usage.

At 100% finish only the current safe bounded checkpoint, automatically generate the complete successor handoff, recursively preserve this rule and stop before beginning another substantial milestone. A stricter WEC transition decision overrides a lower displayed percentage.

## Current verified boundary

Verified live main before the current Stage 2F branch:

`0cb56c22f82facdb248c8c68ec59064c5612c543`

PR #89 `Private Auth Stage 2E trusted account bootstrap` is MERGED.

Exact validated PR #89 head:

`f7d462b3d8252b2912f34a1589e457c03e977bd3`

All 13 normal workflow families passed on that exact unchanged head. Submitted reviews and inline review threads were empty.

Production application: v1.4.0
Package: `1.4.0`
Runtime: `1.4.0-r1`
Production Firebase: disconnected
Application-client Firestore create/update/delete: denied

## Completed prerequisite chain

Historical shipped product dependencies remain protected, including:

identity-safe longitudinal Career Analytics / Trophy Room correction — PR #59
presentation-only Local Profile display-label editing — PR #61
formatVersion 2 full multi-Save backup/import portability — PR #67
Save Library / Local Profile Experience 2.0 — PR #70
Showdown Home & Season Experience first slice — PR #73

Cloud / Sync Readiness Phase 1A through Phase 1F: DONE / MERGED / PROTECTED.

Private Account / Authentication:

Stage 2A — DONE / MERGED / PROVEN — PR #83
Stage 2B — DONE / MERGED / PROVEN — PR #84
Stage 2C — DONE / MERGED / PROVEN — PR #85
Handoff Proximity governance — DONE / MERGED / PROTECTED — PR #86
Post-PR #86 reconciliation — DONE / MERGED / PROVEN — PR #87
Stage 2D — DONE / MERGED / PROVEN — PR #88
Stage 2E — DONE / MERGED / PROVEN — PR #89
Stage 2F — CURRENT / IMPLEMENTATION-AUTHORIZED / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF

Do not repeat Stage 2A through Stage 2E.

## Current authorized task

Private Account / Authentication Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary.

Read completely:

`PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`
`PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`
`PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`
`PRIVATE_ACCOUNT_AUTH_STAGE_2D.md`
`PRIVATE_ACCOUNT_AUTH_STAGE_2E.md`
`PRIVATE_ACCOUNT_AUTH_STAGE_2F.md`
`REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md`
`firestore.rules`
`tests/contracts/private-account-auth-stage2f-contracts.cjs`
`tests/firebase/private-account-auth-stage2f-token-verification-emulator.cjs`
`.github/workflows/validate-static-app.yml`

Stage 2F is production-dormant. It requires a future trusted verifier to call `verifyIdToken(idToken, true)`, derive architecture `accountId` only from the verified Firebase UID and fail closed on invalid/expired/revoked/disabled/unavailable/unknown provider verification outcomes.

A verified provider principal does not by itself grant application authorization.

The Authentication Emulator proof is wiring proof only. Do not claim that unsigned emulator test tokens prove production signing, IAM, rate-limit or every production revocation-propagation behavior.

## Production boundary remains closed

Do not create or enable during Stage 2F:

a production Firebase project or Web App
real production users
production Google provider/Authorized Domains changes
Firebase/Auth/Firestore/Admin runtime in the GitHub Pages shell
production Firestore gameplay data
production deployed Security Rules
Firebase Admin production runtime
service-account credentials or private keys
Cloud Functions / Cloud Run
Blaze billing
production IAM/service identity
trusted production account-write execution
a trusted production mutation gateway
account/signup/login UI
registered-device runtime
pairing/invite/session runtime
Connected Rivalry
Private Remote Joining
public community/discovery/matchmaking/profiles/global rankings

Firestore server clients bypass Firestore Security Rules and rely on IAM. Never place privileged production Admin/service credentials in browser code or repository source.

## Recovery and storage locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.
Candidate B remains read-only import analysis.
Candidate C remains the sole destructive import Apply authority with strict exact raw snapshots/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks, exact verification, corrupt-byte preservation and critical recovery.

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Identity and gameplay locks

Firebase Auth UID equals architecture `accountId` and is separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

Exactly two managers. Same selected league. Different permanent clubs. Showdown lengths 1/3/5/10. Maximum Season score 11. Equal non-zero scores are Draws. Only 0–0 uses league position then league points.

## Remote Joining dependency lock

Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Cloud / Sync Readiness — DONE
→ Private Account / Authentication / Authorization — CURRENT Stage 2 lane; 2A–2E DONE; 2F CURRENT
→ Registered Devices / Private Pairing — Stage 3 BLOCKED
→ Connected Rivalry — Stage 4 BLOCKED
→ Private Remote Joining — Stage 5 final destination
→ hardening / stable release.

Public community features and global leaderboard/rankings remain ELIMINATED.

## Validation discipline

Never weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

Before publication require all 13 normal workflow families on one exact unchanged final PR head, clean submitted reviews and inline review threads, mergeability, expected-head protection and independent live-main verification after merge.

After the safe Stage 2F boundary, reassess WEC before any separate Stage 2 prerequisite.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only the current Stage 2F Trusted Request Authentication & ID Token Revocation Boundary on `agent/private-auth-stage2f-token-verification`. Preserve production v1.4.0 / `1.4.0-r1`, keep production Firebase disconnected, retain direct application-client Firestore write denial, require the trusted `verifyIdToken(idToken, true)` boundary, complete exact-head validation and publication, then reassess WEC before any separate Stage 2 prerequisite.
