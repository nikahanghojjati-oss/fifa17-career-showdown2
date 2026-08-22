# NEXT TASK — Career Mode Showdown

## CURRENT OVERRIDE — v1.6.0 STAGE 3 REGISTERED DEVICES / PRIVATE PAIRING — 2026-08-21 ET

Current verified source and live GitHub override historical authority below.

Status: CURRENT BOUNDED STAGE 3 RELEASE CANDIDATE / v1.6.0 / 1.6.0-r1 / NOT PRODUCTION-PROVEN / ZERO BILLING / APP CHECK ENFORCEMENT OFF / SHARED GAMEPLAY AND REMOTE JOINING STILL LOCKED.

Current branch: `agent/v1.6.0-registered-devices-private-pairing`.
Current PR: #129 `v1.6.0 Stage 3: Registered Devices / Private Pairing`.
Starting independently verified live main: `9a4600cd121bb8230a0df3c4b673a7cc81e59dd2` from merged transition PR #128.
Current environment: `we-2026-08-21-v160-stage3-private-pairing`.
Authorized release candidate: `v1.6.0 — Registered Devices & Private Pairing` / Installable Offline App runtime `1.6.0-r1`.
Immediate whole-shell rollback/recovery runtime: `1.5.0-r2`.
Remote Joining readiness: `63/100` under fixed model `RJR-1`; do not award new points until genuine production capability proof exists.
Usage: unavailable and not estimated.

Stage 2 private Connected Account production proof through PRs #125, #126 and #127 is DONE / MERGED / PROVEN. Private Account / Authentication / Authorization Stages 2A through 2I remain DONE / MERGED / PROVEN at their protected prerequisite boundaries. Do not repeat completed Firebase provider setup, the earlier Spark self-account rules publication, reinstall, Google sign-in, or self-account bootstrap proof.

Current Stage 3 implementation already includes:

1. stable 128-bit private device and installation identity persisted only in IndexedDB;
2. authenticated self-device registration and irreversible revocation at the exact private account/device path;
3. 256-bit private pairing capabilities with a 15-minute default expiry and one-use semantics;
4. exactly two manager slots bound to authenticated Firebase account identity plus stable Local Profile `profileId` and Save Library `saveId`;
5. atomic private rivalry/invite creation and redemption through Firestore transactions;
6. restrictive `firestore.spark.rules` permitting only the exact Stage 3 device/pairing operations while keeping shared authoritative gameplay state and sessions write-denied;
7. deterministic Stage 3 client contracts;
8. successful desktop Chromium and mobile Chromium IndexedDB persistence/reload/offline/localStorage-isolation proof;
9. successful Firestore emulator proof including successful two-manager redemption, third-account denial, list denial, terminal invite privacy, device revocation and no shared gameplay/session write authority;
10. coherent `v1.6.0 / 1.6.0-r1` release candidate identity with `1.5.0-r2` as rollback.

Immediate engineering task:

1. finish exact-head full CI on PR #129 after release/current-authority reconciliation;
2. keep submitted reviews and inline review threads clean and verify mergeability on that exact head;
3. keep App Check enforcement OFF, Firebase Spark / zero billing, `browserSessionPersistence`, memory-only Firestore and no additional Google scopes;
4. keep canonical browser localStorage exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical;
5. do not implement Stage 4 Connected Rivalry shared gameplay synchronization or Stage 5 Remote Joining sessions inside PR #129;
6. after exact-head source gates are clean, publish exactly the reviewed Stage 3 `firestore.spark.rules` to the existing free production Firebase project; do not broaden provider authority;
7. verify the production Rules boundary, then merge/deploy under standing owner authorization if every required gate is green;
8. obtain real-device production proof for registered-device creation and exactly-two-manager one-use private pairing before calling Stage 3 production-proven or increasing RJR;
9. reassess the fresh WEC at the clean Stage 3 checkpoint before beginning Stage 4.

Stage 2H reviewed IAM remains exactly `firebaseauth.users.get`, `datastore.databases.get`, `datastore.entities.get`, and `datastore.entities.create`; it remains unactivated. No Blaze, Cloud Run, Cloud Functions, Firebase Storage, billing account, provider-token storage, redirect sign-in or trusted browser mutation backend is authorized.

Public community features and global leaderboard/rankings are ELIMINATED. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with the protected recovery and transaction rules.

## Historical pre-Stage3 authority retained for executable compatibility

Everything below is provenance only where it conflicts with the current Stage 3 override above.

## CURRENT OVERRIDE — PR #126 CONNECTED ACCOUNT SETTINGS HOTFIX — 2026-08-21 ET

Current verified source and live GitHub override historical authority below.

Status: CURRENT BOUNDED RUNTIME HOTFIX CANDIDATE / v1.5.0 / 1.5.0-r2 / NOT PRODUCTION-PROVEN / ZERO BILLING / APP CHECK ENFORCEMENT OFF / NO NEW DOWNSTREAM REMOTE AUTHORITY.

Current branch: `agent/v1.5.1-connected-account-settings-fix`.
Current PR: #126 `Fix Connected Account Settings mount race`.
Starting main: `7fb403a802f944c94b0f1e474a78a31863c16b97` from merged PR #125.
Authorized product candidate: `v1.5.0 — Private Connected Account Foundation` / runtime `1.5.0-r2`.
Immediate whole-shell rollback/recovery runtime: `1.5.0-r1`.
Remote Joining readiness: `61/100` until production capability proof justifies movement.

The owner-provided installed-app screenshots prove `v1.5.0 / 1.5.0-r1` is reaching production while the Connected Account panel is absent from Save Library & Settings. Source investigation identified a timing race: the production Firebase runtime is deliberately deferred, while Settings is itself lazily created. The r1 bridge depended on catching the original `#settingsButton` click; if Settings opened before that bridge existed, the click was lost and the Connected Account panel never mounted.

PR #126 must do only the following:

1. make Connected Account mounting recover when the Firebase runtime arrives after Settings is already open;
2. observe the Settings overlay lifecycle rather than relying on one click timing;
3. preserve lazy Auth/Firestore initialization, Google popup, `browserSessionPersistence`, memory-only Firestore, Firebase UID identity and the already-published Spark self-account revision-0 boundary;
4. preserve local/offline Save Library, Legacy and recovery behavior;
5. preserve App Check enforcement OFF and zero billing;
6. prove the exact timing regression with a mobile browser audit that opens Settings before delayed Firebase runtime installation and requires the Connected Account panel to appear;
7. pass exact-head CI/reviews/threads/mergeability, then merge/deploy under standing owner authorization;
8. obtain post-deployment Connected Account proof before unlocking Registered Devices / Private Pairing.

No Firebase Console change, Firestore Rules change, App Check change, IAM activation, Cloud Run, Cloud Functions, Storage, billing, pairing, Connected Rivalry or Remote Joining implementation belongs in this hotfix.

The smallest next owner-only interaction after successful deployment is real Google sign-in; no repeated Firebase configuration is authorized.

## Historical PR #125 authority retained for executable compatibility

The following text describes the immediately preceding candidate and remains historical where it conflicts with the PR #126 override above.

## CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME — 2026-08-21 ET

Current verified source, live GitHub, the owner's Remote Joining priority / anti-sidequest direction, zero-billing constraint, and later owner instructions override historical provenance below.

Status: CURRENT BOUNDED PRODUCT CANDIDATE / v1.5.0 / 1.5.0-r1 / NOT PRODUCTION-PROVEN / ZERO BILLING / APP CHECK ENFORCEMENT OFF / DOWNSTREAM REMOTE MUTATIONS BLOCKED.

Current branch: `agent/spark-production-account-runtime`.
Current PR: #125 `Ship Spark private connected account runtime`.
Current environment: `we-2026-08-21-spark-production-account-runtime`.
Starting independently verified live main: `82413e36cd70bb10e332cb2aaa137ad350f2d241` from merged PR #124 `Add zero-billing Spark account bootstrap foundation`.
Usage: unavailable and not estimated.
Authorized product candidate: `v1.5.0 — Private Connected Account Foundation` / runtime `1.5.0-r1`.

Current production application version: `v1.4.0`.
Current production Installable Offline App runtime: `1.4.0-r2`.
Immediate candidate rollback/recovery runtime: `1.4.0-r2`.
Previously recorded pre-r2 fallback knowledge: `1.4.0-r1`.
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening.

PR #121 `Make SLE handoff packaging permanent` is DONE / MERGED at `ab48ecec7f9560378f79eee30150d39a90834c35`. It changed development-process/successor-loading infrastructure only.

The production Firebase App Check runtime/deployment chain through PRs #115, #116, #117, #118 and #119 is DONE / MERGED / PROVEN. Permanent post-merge production proof is `Validate Stability Lane` #1230 / run `32439162225`, successful on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`.

That permanent deployed proof verifies every intended `1.4.0-r2` runtime byte, runtime error provenance, a real reCAPTCHA Enterprise App Check token path, Home, Save Library, manager identity linkage, identity-safe Career Analytics, football visuals, Candidate A backup, Candidate B import analysis, Candidate C atomic restore/recovery, install/offline boundary and the complete deployed journey.

PR #124 `Add zero-billing Spark account bootstrap foundation` is DONE / MERGED at `82413e36cd70bb10e332cb2aaa137ad350f2d241`. It added a separate reviewed `firestore.spark.rules` candidate and a strict Firebase-uid revision-0 self-account bootstrap with emulator proof. It did not publish those rules or initialize production browser Auth/Firestore.

The owner's canonical terminology is:

`SLE = Smart Lean Efficient`

## Current bounded engineering task

Complete PR #125 as the first production-facing private connected-account release candidate without crossing the zero-billing or Remote Joining dependency boundaries.

Required outcomes:

1. keep deployed production truth at `v1.4.0` / `1.4.0-r2` until actual deployment proof succeeds;
2. complete coherent candidate identity `v1.5.0` / `1.5.0-r1` with `1.4.0-r2` as immediate whole-shell recovery target;
3. reuse the proven production Firebase App + App Check runtime and keep App Check enforcement OFF;
4. initialize Firebase Authentication and Cloud Firestore only lazily after explicit Connected Account demand, never as a local-startup dependency;
5. use Google `signInWithPopup()` only, with explicit `browserSessionPersistence` before sign-in;
6. use memory-only Firestore client cache and request no additional Google OAuth scopes;
7. use Firebase `uid` as the sole application `accountId` source and reuse the PR #124 self-account revision-0 bootstrap;
8. permit no candidate browser write beyond the authenticated user's own strict initial `accounts/{request.auth.uid}` document under the exact reviewed Spark rules;
9. keep account list/update/delete, devices, profile-link writes, security-event writes, invites, rivalry state, sessions, idempotency and gameplay mutations denied;
10. preserve local Career Mode, canonical Saves and recovery while signed out, offline, popup-cancelled or Firebase-unavailable;
11. do not introduce billing, Blaze, Cloud Run, Cloud Functions, Firebase Storage or a new trusted backend credential path;
12. keep Stage 2H's historical reviewed IAM list unchanged and unactivated;
13. keep RJR at `61/100` until genuine production activation/proof closes a fixed-model capability gap;
14. run all relevant repository contracts and normal publication gates on one exact immutable candidate head;
15. require clean submitted reviews, clean inline review threads and mergeability on that same head;
16. only after source gates are clean, publish the exact reviewed `firestore.spark.rules` to the existing free production Firebase project and verify the boundary;
17. after rules proof, merge/deploy under standing owner authorization and obtain post-deployment production proof before calling `1.5.0-r1` production-proven;
18. reassess fresh WEC before beginning the next separate prerequisite.

After the exact-head source gates and exact Spark Rules verification are clean, publish under standing owner authorization. After publication and production proof, reassess the fresh WEC before any separate milestone.

Permanent validation topology remains 14 permanent workflow families total, including the 13 normal pull-request workflow families plus the Stability Lane, with 27 protected workflow blocks in the normal topology contract.

## Security, recovery and product locks

Production App Check provider: reCAPTCHA Enterprise.
Production App Check enforcement: OFF.
Production debug App Check: prohibited.

The currently deployed `1.4.0-r2` browser intentionally initializes only Firebase App and Firebase App Check. Its currently published application-client Firestore create/update/delete boundary remains deny-all.

The PR #125 candidate may lazily initialize Auth + Firestore only for the optional Connected Account path. Firestore persistence must remain memory-only. Google popup is the only provider flow. No redirect sign-in, additional scopes, provider credential extraction, raw token storage, Storage client or Functions client is authorized.

The exact reviewed production-activation rules candidate is `firestore.spark.rules`. It permits exactly one new write shape: authenticated self-account revision-0 create at `accounts/{request.auth.uid}`. All downstream private-joining mutation surfaces remain denied.

App Check remains application attestation only. It grants no account identity, application authorization, device identity, pairing authority, rivalry/session authority, gameplay authority, shared mutation authority or IAM authority.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot authority, transaction-owned mutation, immutable confirmed intent, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

Stage 2H's reviewed account-bootstrap runtime custom-role permissions remain exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Do not broaden or activate them inside PR #125.

## Remote Joining dependency order

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Stage 1 Cloud / Sync Readiness Phase 1A through 1F is DONE / MERGED / PROTECTED.

Private Account / Authentication / Authorization Stages 2A through 2I are DONE / MERGED / PROVEN at their protected prerequisite boundaries. The production App Check browser/runtime proof is complete. PR #124 completed the zero-billing self-account bootstrap foundation in source/emulator proof. PR #125 is the current production-facing account-runtime candidate.

Stage 2 as a whole remains incomplete because PR #125 production rules/runtime activation and post-deployment account proof are not yet complete, and later launch hardening remains unproven. App Check enforcement is a separately reviewed later hardening gate and must not be enabled merely because production token traffic is proven.

Stage 3 Registered Devices / Private Pairing remains blocked until the remaining genuine Stage 2 production/account/operational lane is DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Public community features and global leaderboard/rankings are **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## Closed product-dependency evidence retained by current authority

Local Profiles / Save Library remains a completed production dependency milestone.
Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70) — CLOSED / PRODUCTION-PROVEN at `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`.
Phase C first slice — Showdown Home & Season Experience deepening (PR #73) — CLOSED / PRODUCTION-PROVEN at `dec1d3ba8182c3f62019974dd1704c7c9124def6`.
formatVersion 2 full multi-Save backup/import portability (PR #67) — CLOSED / PRODUCTION-PROVEN at `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`.

The already shipped local chain remains: Local Profile display-label editing → Identity-Safe Career Analytics → formatVersion 2 full multi-Save portability. These are protected dependencies, not reopened work.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only PR #125 `v1.5.0 / 1.5.0-r1` source validation first. Do not publish production Firestore Rules until the exact candidate source head is clean.

Once source gates are clean, publish exactly the reviewed `firestore.spark.rules` boundary to the existing free Firebase project, verify that self-account create is the only newly permitted application-client write, then merge/deploy under standing owner authorization. Obtain production proof before promoting `1.5.0-r1` from RELEASE CANDIDATE to production-proven or changing RJR.

After the candidate is fully published, run the fresh WEC assessment before beginning another milestone. If WEC permits continuation, choose the smallest remaining dependency-gated Stage 2 prerequisite justified by the new production proof. Stage 3 pairing, Connected Rivalry and Remote Joining UX remain blocked until the account/runtime production boundary is genuinely proven.

## Historical production and contract provenance

The following statements are retained only for executable compatibility and historical provenance. They do not override the current authority above.

Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PRODUCTION APP CHECK RUNTIME INTEGRATION.
Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PR #115 PRODUCTION APP CHECK DEPLOYMENT PROOF VIA PR #116 — 2026-08-20 ET.
Historical branch: `agent/pr115-production-deployment-proof`.
Historical PR #116 title: `Add controlled GitHub Pages App Check deployment`.
Historical starting main: `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`.
Historical pre-r2 authority: Current production Installable Offline App runtime: `1.4.0-r1`. Immediate previous known-good whole shell: `1.3.0-r2`.
Historical candidate runtime revision: `1.4.0-r2`.
Historical completion rule: the PR #115 / PR #116 production proof could not be classified complete until deployed `1.4.0-r2`, legitimate production App Check token traffic, local/offline operation and deny-all browser write boundaries were proven.

Historical Stage 1 wording retained for contract provenance:
Stage 1 Cloud / Sync Readiness Phase 1A through 1F remains DONE / MERGED / PROTECTED in current source.
At the earlier Phase 1D closeout, the Current authorized prerequisite candidate was Cloud/Sync Readiness Phase 1E.
The Next prerequisite after Phase 1E merges was Cloud/Sync Readiness Phase 1F.
At that historical boundary the Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED wording prevented premature provider connection. Current source has since advanced through those prerequisite boundaries.

Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY. That gateway is completed and is not the current task.

Historical post-PR121 reconciliation status: CURRENT BOUNDED RJR PREREQUISITE RECONCILIATION / NON-RUNTIME / PRODUCTION 1.4.0-r2 PROVEN / APP CHECK ENFORCEMENT OFF / BROWSER FIRESTORE WRITES DENY-ALL.
Historical reconciliation branch: `agent/post-pr121-production-rjr-reconciliation`.
Historical reconciliation environment: `we-2026-08-20-post-pr121-production-rjr-reconciliation`.
Historical reconciliation starting main: `ab48ecec7f9560378f79eee30150d39a90834c35`.
Historical reconciliation Fresh Work Environment Continuity (WEC) decision: `CONTINUE` at initialization.
Historical reconciliation authorized product candidate: none.
Historical reconciliation application version: `v1.4.0`.
Historical reconciliation current production Installable Offline App runtime: `1.4.0-r2`.
Historical reconciliation known-good fallback/recovery runtime: `1.4.0-r1`.
Historical reconciliation required every application-client Firestore create/update/delete to remain deny-all and browser Firebase Authentication, Firestore, Storage and Functions uninitialized. Those statements describe that completed non-runtime lane and do not prohibit the separately reviewed PR #125 candidate boundary.

The former clean-stop wording was satisfied by later explicit owner authorization and subsequent proven prerequisite work. Do not revive that obsolete wait-for-instruction boundary as current implementation authority.

No historical wording authorizes Stage 3, Connected Rivalry or Remote Joining UX inside PR #125.
