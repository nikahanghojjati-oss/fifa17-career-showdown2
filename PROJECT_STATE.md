# PROJECT STATE — Career Mode Showdown

## Current override — PR #126 Connected Account Settings hotfix

Current verified source and live GitHub override historical prose below. The deployed site is visibly serving application `v1.5.0` / runtime `1.5.0-r1` from merged PR #125, as confirmed by the owner's production installed-app screenshots. That runtime exposes a real defect: Save Library & Settings can open without the Connected Account panel when the optional Settings module wins a startup race against the deferred production Firebase runtime.

Active release candidate — **NOT production**: **v1.5.0 — Private Connected Account Foundation runtime hotfix**.
Active hotfix candidate Installable Offline App runtime: `1.5.0-r2`.
Immediate previous whole-shell recovery runtime: `1.5.0-r1`.
Current hotfix PR: #126 `Fix Connected Account Settings mount race` on `agent/v1.5.1-connected-account-settings-fix`, based on merged PR #125 main `7fb403a802f944c94b0f1e474a78a31863c16b97`.

PR #126 is intentionally narrow: make Connected Account mounting recover when the production Firebase runtime loads after Settings is already open, protect that exact race with a mobile browser regression audit, preserve the existing Spark rules/Auth/App Check/local-first boundaries, and obtain post-deployment Connected Account proof before Stage 3 Registered Devices / Private Pairing. RJR remains `61/100` until genuine production evidence closes a fixed RJR-1 capability gap.

The repository Work Environment Continuity system remains mandatory through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and the repository continuity scripts. Every fresh environment must validate inherited state, initialize its own fresh WEC record and obey its own assessment before substantial work; predecessor transition decisions are historical only.

## Historical pre-PR126 authority retained for executable compatibility

The following preserved text describes the immediately preceding PR #125 release-candidate boundary. It is historical where it conflicts with the current override above.

## Current production boundary

Application milestone: **v1.4.0 — Product Deepening**
Current production application version: `v1.4.0`
Current production Installable Offline App runtime: `1.4.0-r2`
Known-good fallback/recovery runtime: `1.4.0-r1`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Active release candidate — **NOT production**: **v1.5.0 — Private Connected Account Foundation**.
Candidate Installable Offline App runtime: `1.5.0-r1`.
Candidate PR: #125 `Ship Spark private connected account runtime` on `agent/spark-production-account-runtime`, based on live main `82413e36cd70bb10e332cb2aaa137ad350f2d241` from merged PR #124 `Add zero-billing Spark account bootstrap foundation`.
`1.4.0-r2` remains the production-proven runtime and immediate recovery target until PR #125 passes exact-head source gates, the exact reviewed Spark Firestore Rules are published, the candidate is merged/deployed, and post-deployment proof succeeds.

The production App Check runtime/deployment chain through PRs #115, #116, #117, #118 and #119 is DONE / MERGED / PROVEN. PR #115 introduced the reviewed production Firebase App + App Check runtime boundary; PRs #116 through #119 completed deployment and permanent production proof without adding browser Auth, Firestore, Storage or Functions authority. Permanent post-merge production proof is `Validate Stability Lane` #1230 / run `32439162225`, a successful push run on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`.

All three permanent Stability Lane jobs succeeded: `stability-contracts`, `chromium-stability` and `deployed-site-smoke`. The deployed smoke verified every intended `1.4.0-r2` runtime byte, runtime error provenance, a real reCAPTCHA Enterprise App Check token path, Home, Save Library, manager identity linkage, identity-safe Career Analytics, football visuals, Candidate A backup, Candidate B import analysis, Candidate C atomic restore/recovery, the install/offline boundary and the complete deployed journey.

PR #121 `Make SLE handoff packaging permanent` is merged at live main `ab48ecec7f9560378f79eee30150d39a90834c35`. It changed development-process/successor-loading infrastructure only and did not change website runtime behavior, Firebase enforcement, IAM, storage or Remote Joining implementation.

PR #124 `Add zero-billing Spark account bootstrap foundation` is merged at live main `82413e36cd70bb10e332cb2aaa137ad350f2d241`. It added the separate reviewed `firestore.spark.rules` candidate plus the strict Firebase-uid self-account revision-0 bootstrap boundary while leaving production Firestore Rules and production browser Auth/Firestore initialization unchanged.

The owner's canonical SLE definition is **SLE = Smart Lean Efficient**.

PR #125 is the currently authorized bounded product candidate. It is not production-proven and must not be described as deployed before the publication and post-deployment proof gates complete.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Stage 3 Registered Devices / Private Pairing remains blocked until genuine Stage 2 production/account/operational prerequisites are DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Public community features and global leaderboard/rankings are **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## Current production security truth

The currently deployed production browser intentionally initializes only Firebase App and Firebase App Check.

Production App Check uses reCAPTCHA Enterprise. Legitimate production token traffic and the controlled runtime connection are proven. App Check enforcement remains OFF.

The currently deployed `1.4.0-r2` browser does not initialize Firebase Authentication, Firestore, Storage or Functions. Every application-client Firestore create/update/delete remains deny-all under the currently published production rules. No browser trusted mutation authority exists.

PR #125 changes only the candidate boundary: after an explicit Connected Account action it may lazily initialize Firebase Authentication plus Cloud Firestore with memory-only client cache. Google `signInWithPopup()` plus explicit `browserSessionPersistence` is the only sign-in flow. The candidate requests no additional Google OAuth scopes, does not extract provider credentials, initializes no Storage or Functions client, and grants no trusted mutation authority.

The only proposed new browser Firestore write is an authenticated Firebase user creating the strict revision-0 `accounts/{request.auth.uid}` envelope allowed by the exact reviewed `firestore.spark.rules`. Account update/delete/list operations and every device, invitation, rivalry, session, idempotency and gameplay mutation remain denied. This write is not production-authorized until those exact rules are published and proven.

App Check is attestation only. It is not authentication, authorization, device identity, pairing authority, rivalry/session entitlement, gameplay authority or IAM authority.

Stage 2H least-privilege IAM remains exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Those permissions remain a reviewed trusted-runtime boundary, not evidence that a production trusted runtime/IAM activation has been completed. PR #125 does not activate that paid/trusted runtime path.

## Current Remote Joining dependency state

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Stage 1 Cloud / Sync Readiness Phase 1A through 1F is DONE / MERGED / PROTECTED.

Cloud/Sync Readiness Phase 1F is DONE / MERGED / PROTECTED through PR #81.

Private Account / Authentication / Authorization Stages 2A through 2I are DONE / MERGED / PROVEN at their reviewed prerequisite boundaries. The later trusted gateway/account-deletion/connected-data-export prerequisite contracts are completed at their protected boundaries. The production App Check client/runtime proof is complete. PR #124 additionally completed the zero-billing Spark self-account bootstrap foundation in source/emulator proof, without production activation.

Stage 2 as a whole remains incomplete because the production private-account activation/proof represented by PR #125 is not yet published/proven and later launch hardening remains unproven. App Check enforcement is a separately reviewed later hardening gate and must not be enabled merely because production token traffic is proven.

Stage 3 Registered Devices / Private Pairing remains blocked until the remaining genuine Stage 2 production/account/operational boundary is DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Machine-readable Remote Joining readiness authority is `REMOTE_JOINING_READINESS.json` using fixed model `RJR-1`. The current reconciled score is `61/100`, including only a +2 production-cloud-security delta for the two previously proven capabilities: controlled production runtime connection and legitimate App Check token traffic. No points are awarded merely for PR #124, PR #125 source work, green CI, documentation, WEC, SLE, App Check enforcement, unproven account activation, pairing, Connected Rivalry or actual Remote Joining.

## Protected local product and recovery truth

The Installable Offline App remains local-first even while production App Check initializes in the background. The PR #125 candidate must also preserve local-first startup: Firebase/Auth/Firestore failure must never block local Career Mode Showdown startup, canonical Save access or local recovery.

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

## Current release candidate

The active bounded lane is PR #125 `Ship Spark private connected account runtime`, targeting `v1.5.0` / `1.5.0-r1` under the owner's permanent zero-billing architecture.

The candidate reuses the proven production Firebase App + App Check connection, keeps App Check enforcement OFF, and adds optional/lazy Google Authentication plus memory-only Firestore only when the Connected Account Settings surface is requested. It reuses the PR #124 strict self-account bootstrap so Firebase `uid` is the only application `accountId` source.

The candidate must not broaden into registered-device writes, pairing/invites, rivalry/session mutations, Connected Rivalry, actual Remote Joining UX, Cloud Run, Cloud Functions, Storage, Blaze/billing, additional Google scopes, redirect sign-in or provider-token storage.

Publication order is locked: exact-head source/CI proof → publish the exact reviewed zero-billing `firestore.spark.rules` to the existing production Firebase project → verify the rules boundary → merge/deploy under standing owner authorization → post-deployment production proof. Until that sequence completes, `1.4.0-r2` remains production authority and RJR remains `61/100`.

## Historical contract provenance retained for executable compatibility

The following labels are historical only and do not override current source. They remain because permanent contracts use them to prove that earlier dependency ordering was not erased:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED**.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **CURRENT BOUNDED CANDIDATE**.
Phase 1F — ***NEXT AFTER PHASE 1E MERGES / BLOCKED***.

At that historical boundary the active sequence was Phase 1D → Phase 1E → Phase 1F. Current source has since completed those prerequisites; these words are provenance, not current implementation authorization.

Historical PR #115 source boundary: PR #115 `Connect production App Check runtime safely` is DONE / MERGED AS SOURCE. Its reviewed production boundary initializes Firebase App + App Check only and grants no browser trusted mutation authority.

Historical PR #116 transition: PR #116 `Add controlled GitHub Pages App Check deployment` became the current direct Remote Joining prerequisite at the PR #115 closeout. Current source has since completed and proven PR #116 and the follow-up #117 through #119 production proof chain.

Historical shipped chain retained: Local Profile display-label editing, Identity-Safe Career Analytics, formatVersion 2 full multi-Save portability, Phase B Save Library / Local Profile Experience 2.0 first slice, and Phase C Showdown Home & Season Experience first slice.

Historical PR #115 implementation authority is retained only as provenance: the production App Check runtime candidate on `agent/production-app-check-runtime` was once the direct Remote Joining prerequisite. Current source has since completed and proven the full PR #115 through PR #119 production runtime/deployment chain.

Historical post-PR121 reconciliation lane: production-authority/RJR reconciliation after the proven `1.4.0-r2` production boundary was a non-runtime candidate that updated stale authority statements, preserved `1.4.0-r1` as fallback/recovery knowledge, recorded the fixed-model RJR capability delta, and corrected canonical SLE terminology to Smart Lean Efficient. That lane is closed and does not override PR #125.
