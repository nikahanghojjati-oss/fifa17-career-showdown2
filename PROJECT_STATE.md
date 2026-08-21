# PROJECT STATE — Career Mode Showdown

Current verified source and live GitHub override historical prose. `PROJECT_STATE.md` is the primary owner of current deployed product state; `NEXT_TASK.md` owns the current implementation authorization boundary.

The repository Work Environment Continuity system remains mandatory through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and the repository continuity scripts. Every fresh environment must validate inherited state, initialize its own fresh WEC record and obey its own assessment before substantial work; predecessor transition decisions are historical only.

## Current production boundary

Application milestone: **v1.4.0 — Product Deepening**
Current production application version: `v1.4.0`
Current production Installable Offline App runtime: `1.4.0-r2`
Known-good fallback/recovery runtime: `1.4.0-r1`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The production App Check runtime/deployment chain through PRs #115, #116, #117, #118 and #119 is DONE / MERGED / PROVEN. PR #115 introduced the reviewed production Firebase App + App Check runtime boundary; PRs #116 through #119 completed deployment and permanent production proof without adding browser Auth, Firestore, Storage or Functions authority. Permanent post-merge production proof is `Validate Stability Lane` #1230 / run `32439162225`, a successful push run on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`.

All three permanent Stability Lane jobs succeeded: `stability-contracts`, `chromium-stability` and `deployed-site-smoke`. The deployed smoke verified every intended `1.4.0-r2` runtime byte, runtime error provenance, a real reCAPTCHA Enterprise App Check token path, Home, Save Library, manager identity linkage, identity-safe Career Analytics, football visuals, Candidate A backup, Candidate B import analysis, Candidate C atomic restore/recovery, the install/offline boundary and the complete deployed journey.

PR #121 `Make SLE handoff packaging permanent` is merged at live main `ab48ecec7f9560378f79eee30150d39a90834c35`. It changed development-process/successor-loading infrastructure only and did not change website runtime behavior, Firebase enforcement, IAM, storage or Remote Joining implementation.

The owner's canonical SLE definition is **SLE = Smart Lean Efficient**.

No product candidate is currently authorized. The active work is infrastructure/authority prerequisite work, not a user-facing product-feature authorization.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Stage 3 Registered Devices / Private Pairing remains blocked until genuine Stage 2 production/account/operational prerequisites are DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Public community features and global leaderboard/rankings are **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## Current production security truth

The production browser intentionally initializes only Firebase App and Firebase App Check.

Production App Check uses reCAPTCHA Enterprise. Legitimate production token traffic and the controlled runtime connection are proven. App Check enforcement remains OFF.

No browser Firebase Authentication, Firestore, Storage or Functions client service is initialized. Every application-client Firestore create/update/delete remains deny-all. No browser trusted mutation authority exists.

App Check is attestation only. It is not authentication, authorization, device identity, pairing authority, rivalry/session entitlement, gameplay authority or IAM authority.

Stage 2H least-privilege IAM remains exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Those permissions are still a reviewed trusted-runtime boundary, not evidence that the production trusted runtime/IAM activation has been completed.

## Current Remote Joining dependency state

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Stage 1 Cloud / Sync Readiness Phase 1A through 1F is DONE / MERGED / PROTECTED.

Cloud/Sync Readiness Phase 1F is DONE / MERGED / PROTECTED through PR #81.

Private Account / Authentication / Authorization Stages 2A through 2I are DONE / MERGED / PROVEN. Stage 2 private account/authentication/authorization dormant boundaries are completed at their proven boundaries. Private Account / Authentication Stage 2A remains a completed emulator-only identity-boundary prerequisite and is not revived by the current reconciliation. The later trusted gateway/account-deletion/connected-data-export prerequisite contracts are completed at their protected boundaries. The production App Check client/runtime proof is now also complete.

Stage 2 as a whole remains incomplete because trusted production runtime/IAM activation and later launch hardening remain unproven. App Check enforcement is a separately reviewed later hardening gate and must not be enabled merely because production token traffic is proven.

Stage 3 Registered Devices / Private Pairing remains blocked until the remaining genuine Stage 2 production/account/operational boundary is DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Machine-readable Remote Joining readiness authority is `REMOTE_JOINING_READINESS.json` using fixed model `RJR-1`. The current reconciled score is `61/100`, including only a +2 production-cloud-security delta for the two newly proven capabilities: controlled production runtime connection and legitimate App Check token traffic. No points were awarded for PR count, green CI by itself, documentation, WEC, SLE, enforcement, trusted-runtime IAM, pairing, Connected Rivalry or actual Remote Joining.

## Protected local product and recovery truth

The Installable Offline App remains local-first even while production App Check initializes in the background. Firebase/App Check failure must never block local Career Mode Showdown startup, canonical Save access or local recovery.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

`activeShowdown` is not canonical.

formatVersion 2 full multi-Save backup/import portability remains production-proven.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive Apply authority with strict exact raw snapshot authority, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks and exact post-mutation verification.

Local Profiles / Save Library is a completed production dependency milestone. The explicit cross-Save/historical manager identity linkage foundation remains shipped. Identity-Safe Career Analytics is production-proven; unresolved historical roles remain excluded from identified longitudinal manager totals.

Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6`

Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1`
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398`
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599`
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`

## Current reconciliation candidate

The active bounded successor lane is production-authority/RJR reconciliation after the proven `1.4.0-r2` production boundary. It updates stale authority statements, preserves `1.4.0-r1` as fallback/recovery knowledge, records the fixed-model RJR capability delta, and corrects canonical SLE terminology to Smart Lean Efficient.

This candidate is non-runtime. It must not reopen App Check proof work, enable App Check enforcement, broaden IAM, initialize additional Firebase browser services, change canonical storage/recovery authority, begin Stage 3 pairing, Connected Rivalry or Remote Joining UX.

After this candidate is fully validated and published, the fresh WEC assessment decides whether the environment may continue. If continuation is allowed, the smallest remaining dependency-gated prerequisite is the production trusted runtime/IAM activation proof using the already-reviewed Stage 2H four-permission boundary and the existing Stage 2F/2I trust order. That later milestone remains separate from this reconciliation candidate.

## Historical contract provenance retained for executable compatibility

The following labels are historical only and do not override current source. They remain because permanent contracts use them to prove that earlier dependency ordering was not erased:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED**.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **CURRENT BOUNDED CANDIDATE**.
Phase 1F — ***NEXT AFTER PHASE 1E MERGES / BLOCKED***.

At that historical boundary the active sequence was Phase 1D → Phase 1E → Phase 1F. Current source has since completed those prerequisites; these words are provenance, not current implementation authorization.

Historical shipped chain retained: Local Profile display-label editing, Identity-Safe Career Analytics, formatVersion 2 full multi-Save portability, Phase B Save Library / Local Profile Experience 2.0 first slice, and Phase C Showdown Home & Season Experience first slice.

Historical PR #115 implementation authority is retained only as provenance: the production App Check runtime candidate on `agent/production-app-check-runtime` was once the direct Remote Joining prerequisite. Current source has since completed and proven the full PR #115 through PR #119 production runtime/deployment chain.
