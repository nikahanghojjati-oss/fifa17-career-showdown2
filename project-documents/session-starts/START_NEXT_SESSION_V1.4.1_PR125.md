# START NEXT SESSION — SLE v1.4.1 — PR #125 Source Seal

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / nikahanghojjati-oss.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

SLE = Smart Lean Efficient. SLE is mandatory at every future handoff boundary. A plain chat-only handoff is not complete.

## Fast startup

Use the connected GitHub tool first. Retrieve `SESSION_BOOTSTRAP.json`, then verify live `main`, PR #125, its exact head/state, changed files, current workflows, reviews, inline review threads and mergeability. Read only the smallest current task packet first; expand to the full SLE handoff when evidence requires it.

Do not inherit the predecessor WEC decision. Validate the predecessor closure, initialize a fresh unique successor WEC with reset per-environment counters and the newly observed starting-main SHA, then run the successor's own WEC assessment before substantial work. Unknown usage remains `null` / `unavailable`; never estimate it.

Complete deep-reference handoff:
`SUCCESSOR_HANDOFF_PR125_SPARK_CONNECTED_ACCOUNT_SOURCE_SEAL_SLE_2026-08-21.md`

## Verified predecessor boundary

Closing environment: `we-2026-08-21-spark-production-account-runtime`.
Closing WEC decision: `HANDOFF_AT_CHECKPOINT` after completing the bounded source-validation checkpoint. This is historical for the successor and must not be inherited as the successor's own decision.

Live main at source seal: `82413e36cd70bb10e332cb2aaa137ad350f2d241` from merged PR #124.
PR #125: `Ship Spark private connected account runtime`.
Source-validation exact head: `d83a33066b271d7d89bf932f1066d9e1369b3f6d`.

All 13 normal pull-request workflow families passed on that exact unchanged source-validation head. PR #125 was open, non-draft and mergeable with zero submitted reviews and zero inline review threads.

Important exact-head proof:
- Validate Static App #1567 / run `32502859032`: SUCCESS, including complete repository contracts and permanent 27-block topology.
- Validate Stability Lane #1321 / run `32502858761`: `stability-contracts` SUCCESS and `chromium-stability` SUCCESS; trusted runtime container/import smoke also succeeded. PR `deployed-site-smoke` was correctly skipped and is not production proof.
- Candidate C Atomic Restore #955 / run `32502858786`: contracts, authoritative browser audit and evidence upload SUCCESS.

The handoff-packaging commits created after this source seal are process-only SLE transition mutations. They do not make PR #125 production-proven. Reverify the current head and applicable workflows before provider publication.

## Current production truth

Current production application: `v1.4.0`.
Current production runtime: `1.4.0-r2`.
PR #125 candidate: `v1.5.0 / 1.5.0-r1` — RELEASE CANDIDATE / NOT PRODUCTION-PROVEN.
Candidate immediate whole-shell recovery target: `1.4.0-r2`.
Older fallback knowledge: `1.4.0-r1`.

Production App Check runtime/deployment is DONE / MERGED / PROVEN through PRs #115–#119. Permanent production proof is Validate Stability Lane #1230, run ID `32439162225`, on production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`.

Production runtime: `1.4.0-r2` has legitimate reCAPTCHA Enterprise App Check token traffic proven. App Check enforcement remains `OFF`.

The currently deployed browser initializes Firebase App + App Check only. Production browser Auth, Firestore, Storage and Functions remain uninitialized. Currently published production application-client Firestore create/update/delete remains deny-all.

## PR #125 candidate boundary

The candidate is zero-billing and local-first. It may lazily initialize Firebase Authentication plus memory-only Firestore only after explicit Connected Account demand. Google `signInWithPopup()` plus explicit `browserSessionPersistence` is the only provider path. Firebase `uid` is the sole application `accountId` source.

The exact reviewed activation candidate is `firestore.spark.rules`. It permits only authenticated self-account revision-0 create at `accounts/{request.auth.uid}`. Account list/update/delete and every device, profile-link, security-event, invite, rivalry, session, idempotency and gameplay mutation remain denied.

Do not add billing/Blaze, Cloud Run, Cloud Functions, Storage, extra OAuth scopes, provider credential extraction, redirect sign-in or trusted browser mutation authority.

## Remote Joining locks

Remote Joining readiness: read `REMOTE_JOINING_READINESS.json`; current fixed-model score is `61/100`. Do not award points for source work, CI, handoff quality or unpublished provider state.

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Stage 3 Registered Devices / Private Pairing remains blocked. Connected Rivalry and actual Remote Joining remain downstream. Public community/global leaderboards/rankings remain eliminated.

Stage 2H reviewed IAM remains exactly:
`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Do not broaden or activate that trusted/paid runtime path inside PR #125.

Canonical storage remains only `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is not canonical. Candidate A non-mutating export, Candidate B read-only analysis, Candidate C sole destructive Apply authority remain protected.

## Standing publication authorization

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` remains active. Standing merge/deploy authorization is conditional on every required test and current mandatory publication gate passing. Do not ask the owner for another redundant merge approval after those gates pass. Later explicit owner instructions can override.

The source-validation gate is complete, but the production Spark Rules publication gate is NOT complete.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Verify live main and PR #125 current head/state/reviews/threads/mergeability/workflows and initialize a fresh successor WEC.
2. If PR #125 changed from `d83a33066b271d7d89bf932f1066d9e1369b3f6d` because of SLE-only transition packaging, classify the delta and run the applicable exact-head source/continuity gates before provider publication. Do not reopen already solved historical-contract work without a concrete failure.
3. Publish EXACTLY the reviewed `firestore.spark.rules` to the existing free production Firebase project. Do not hand-edit the rules.
4. Verify that strict authenticated self-account revision-0 create is the only newly allowed application-client write and every downstream Remote Joining mutation remains denied.
5. Re-freeze exact PR head, workflows, reviews, threads and mergeability after Rules proof.
6. Under standing owner authorization, merge/deploy only after all required gates pass.
7. Obtain post-deployment production proof for `v1.5.0 / 1.5.0-r1` before calling it production-proven or changing RJR.
8. Reassess the fresh WEC before any separate next milestone.

Do not enable App Check enforcement. Do not activate paid trusted runtime/IAM. Do not begin pairing, Connected Rivalry or actual Remote Joining UX in this lane.

## Owner progress rule

Every substantive owner-facing project response must end with exactly seven lines in this order: Handoff proximity; Remote Joining readiness; Current lane; Concrete dependency completed; Next unlock; Blocker; Sidequest check.

At Handoff proximity 100%, finish only the safe current checkpoint, complete SLE packaging with root + byte-identical project mirrors, refresh the bootstrap/current pointers and final WEC seal, give the owner the newest starter, and stop before the next substantial milestone.