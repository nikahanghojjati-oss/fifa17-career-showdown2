# PROJECT STATE — Career Mode Showdown

Current verified source and live GitHub override historical prose. `PROJECT_STATE.md` is the primary owner of current deployed product state; `NEXT_TASK.md` owns the current implementation authorization boundary.

The repository Work Environment Continuity system remains mandatory through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and the repository continuity scripts. Every fresh environment must validate inherited state, initialize its own fresh WEC record and obey its own assessment before substantial work; predecessor transition decisions are historical only.

## Current production and candidate boundary

Application milestone: ***v1.4.0 — Product Deepening***
Current production application version: `v1.4.0`
Current production Installable Offline App runtime: `1.4.0-r1`
Current candidate runtime: `1.4.0-r2`
Immediate previous known-good whole shell for the candidate: `1.4.0-r1`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

PR #114 is DONE / MERGED / PROVEN at live main `7944b87a20cf793c659077d7518c4446f178e32c`. Production Firebase App Check is provider-registered with reCAPTCHA Enterprise, one-hour TTL and 0.5 risk threshold; enforcement remains OFF.

PR #115 on `agent/production-app-check-runtime` is the current direct Remote Joining prerequisite candidate. It connects only Firebase App + App Check to the shipped production-origin client through controlled public runtime configuration. It must remain local-first, obtain legitimate App Check token traffic for monitoring, initialize no Firestore/Auth/Storage/Functions client service, grant no trusted mutation authority, and preserve every application-client Firestore create/update/delete as deny-all.

No product candidate is currently authorized. PR #115 is infrastructure/prerequisite runtime work, not a user-facing product-feature authorization.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Stage 3 Registered Devices / Private Pairing remains blocked until genuine Stage 2 production/account/operational prerequisites are DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Public community features and global leaderboard/rankings are **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## Protected local product and recovery truth

The Installable Offline App remains local-first even while optional production App Check initializes in the background. Firebase/App Check failure must never block local Career Mode Showdown startup, canonical Save access or local recovery.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

formatVersion 2 is live and formatVersion 2 full multi-Save backup/import portability remains production-proven.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive Apply authority with strict exact raw snapshot authority, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks and exact post-mutation verification.

Local Profiles / Save Library is a completed production dependency milestone. The explicit cross-Save/historical manager identity linkage foundation remains shipped. Identity-Safe Career Analytics is production-proven; unresolved historical roles remain excluded from identified longitudinal manager totals.

Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6`

## Cloud and Remote Joining dependency truth

Cloud / synchronization readiness
→ private account / authentication / authorization
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Stage 1 Cloud / Sync Readiness Phase 1A through 1F is completed in current source. Stage 2 private account/authentication/authorization dormant boundaries and later trusted gateway, account deletion and connected-data export prerequisites are completed at their proven boundaries, while remaining production operational activation is still incomplete.

Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1`
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398`
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599`
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`

Production Security Rules remain provider-verified deployed. Browser writes remain deny-all. Stage 2H least-privilege account-bootstrap runtime permissions remain exactly `firebaseauth.users.get`, `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.create`; PR #115 does not broaden IAM.

## Historical contract provenance retained for executable compatibility

The following labels are historical only and do not override current source. They remain here because permanent contracts use them to prove that earlier dependency ordering was not erased:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: ***DONE / MERGED / PROTECTED***.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: ***CURRENT BOUNDED CANDIDATE***.
Phase 1F — ***NEXT AFTER PHASE 1E MERGES / BLOCKED***.

At that historical boundary the active sequence was Phase 1D → Phase 1E → Phase 1F. Current source has since completed those prerequisites; these words are provenance, not current implementation authorization.

Historical shipped chain retained: Local Profile display-label editing, Identity-Safe Career Analytics, formatVersion 2 full multi-Save portability, Phase B Save Library / Local Profile Experience 2.0 first slice, and Phase C Showdown Home & Season Experience first slice.

## Current completion condition

`1.4.0-r2` is not production-proven until PR #115 reaches one immutable exact head with all normal workflow families green, clean reviews and threads, clean mergeability, expected-head squash merge, deployment verification, controlled public configuration delivery and legitimate production App Check traffic observed while enforcement remains OFF. Until then `1.4.0-r1` remains the production and rollback authority.
