# Career Mode Showdown v1.5.0-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / PR #125 / SOURCE VALIDATION IN PROGRESS / NOT PRODUCTION-PROVEN
Application version: `v1.5.0`
Runtime revision: `1.5.0-r1`
Previous known-good whole shell: `1.4.0-r2`
Starting live main: `82413e36cd70bb10e332cb2aaa137ad350f2d241`
Branch: `agent/spark-production-account-runtime`
Pull request: #125

## Purpose

This bounded candidate introduces the first production-facing Private Connected Account foundation on the owner's zero-billing Spark architecture while preserving the local-first Career Mode Showdown product. It is a prerequisite toward Private Remote Joining, not Remote Joining itself.

The candidate does not implement Registered Devices, Private Pairing, Connected Rivalry, Remote Joining sessions, shared gameplay mutation, trusted Cloud Run activation, Cloud Functions, Firebase Storage, Blaze billing, or broader IAM.

## Candidate runtime boundary

The current deployed production application remains `v1.4.0` / `1.4.0-r2` until the v1.5 candidate passes source validation, the exact reviewed Spark Firestore Rules are separately published and verified, the candidate is merged/deployed, and post-deployment proof succeeds.

`1.5.0-r1` reuses the already proven production Firebase App + App Check boundary. App Check enforcement remains OFF. Firebase Authentication and Cloud Firestore are lazy optional Connected Account dependencies and must not block local application startup.

Connected Account uses Google federated sign-in through explicit `signInWithPopup()` only. `browserSessionPersistence` is set before sign-in. No additional Google OAuth scopes are requested and provider OAuth credentials are not extracted into Career Mode application state.

Firestore client persistence is memory-only. The reviewed production activation candidate is `firestore.spark.rules`. It permits exactly one new application-client write shape when separately published: an authenticated user may create only the strict revision-0 initial document at `accounts/{request.auth.uid}`. Account list/update/delete, device writes, profile-link writes, security-event writes, invites, rivalry state, sessions, idempotency records, gameplay mutation and every other downstream remote write remain denied.

The Stage 2H historical trusted-runtime IAM permission set remains unchanged and unactivated:

- `firebaseauth.users.get`
- `datastore.databases.get`
- `datastore.entities.get`
- `datastore.entities.create`

No broader IAM permission is authorized by this candidate.

## Local-first, recovery and installed-app locks

The Installable Offline App remains a protected production baseline. Local Career Mode, Save Library, Legacy history, Settings and recovery must continue to work while signed out, offline, popup-cancelled, or Firebase-unavailable.

Runtime `1.5.0-r1` uses production-proven `1.4.0-r2` as the immediate previous known-good whole-shell recovery target. The Service Worker must never activate an incomplete candidate shell, and recovery must not create a mixed-version runtime.

Canonical browser storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Candidate A remains a non-mutating export surface. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority and retains transaction-owned mutation, immutable confirmed intent, strict exact raw snapshot authority, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior, and exact recovery verification.

The connected-account candidate must never bypass or replace those local recovery guarantees.

## Privacy and identity boundary

Firebase `uid` is the sole application `accountId` source. Google display name and email are presentation-only provider data and do not claim Local Profiles, Saves, manager slots, devices, rivalries, sessions, or shared gameplay authority.

The candidate must not deliberately persist raw Firebase ID tokens, refresh tokens, Google OAuth access tokens, App Check tokens, private device secrets, invite capabilities, or provider security logs in Career Mode canonical storage.

Public community features, public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, global leaderboards and global rankings remain eliminated.

## Remote Joining dependency boundary

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

The dependency order remains:

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

PR #125 does not authorize Stage 3 Registered Devices / Private Pairing. Connected Rivalry and actual Remote Joining UX remain downstream.

## Source-validation checkpoint

This maintenance handoff does not claim PR #125 source validation is complete. The current environment must finish one immutable exact-head source checkpoint before any production Firestore Rules publication.

Source checkpoint requirements:

1. one immutable PR #125 candidate head;
2. complete repository contracts green on that exact source head;
3. all 13 normal pull-request workflow families green on that same exact source head;
4. Stability Lane source/browser gates green as applicable on that same head;
5. clean submitted reviews and clean inline review threads;
6. mergeability clean on the same head;
7. production rules remain unpublished during this source-validation checkpoint;
8. RJR remains `61/100` because source validation alone closes no fixed RJR-1 production capability gap.

## Publication boundary after successor handoff

The corrected current WEC decision is `HANDOFF_AT_CHECKPOINT`. Therefore this environment must stop after the PR #125 source-validation checkpoint is sealed and the complete SLE successor package is prepared.

A successor may then, after independently revalidating source and WEC authority, perform the separately gated production step: publish exactly the reviewed `firestore.spark.rules` to the existing free Firebase project, prove that self-account revision-0 create is the only newly permitted application-client write, and only then continue merge/deploy under standing owner authorization.

No production-rule publication, PR #125 merge/deploy, v1.5 production promotion, RJR increase, App Check enforcement, trusted-runtime IAM activation, pairing, Connected Rivalry, or Remote Joining UX is authorized merely by this maintenance handoff.

## Failure and rollback rule

If Firebase configuration, App Check, Google popup authentication, memory-only Firestore initialization, or account bootstrap is unavailable, local Career Mode Showdown remains usable. Provider availability must never become a prerequisite for opening local Saves or playing the tracker.

If the `1.5.0-r1` whole shell is proven defective after later publication, preserve local data and recover to the verified `1.4.0-r2` whole shell. Do not invent a partial mixed-version repair.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only PR #125 exact-head source validation. Correct only concrete source/contract failures without weakening security, recovery, privacy, performance, zero-billing or Remote Joining dependency gates. Once the source checkpoint is genuinely green, freeze exact-head workflow/review/thread/mergeability evidence, complete the mandatory Smart Lean Efficient successor handoff, set Handoff proximity to 100%, and stop before production Firestore Rules publication or another substantial milestone.

Handoff proximity must continue to be reported in every substantive owner-facing project response. Unknown usage must never be fabricated. WEC remains authoritative when stricter.