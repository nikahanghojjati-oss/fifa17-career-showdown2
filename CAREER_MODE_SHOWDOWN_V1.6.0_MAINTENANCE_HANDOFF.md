# Career Mode Showdown v1.6.0-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / PR #129 / STAGE 3 SOURCE + PROVIDER VALIDATION / NOT PRODUCTION-PROVEN
Application version: `v1.6.0`
Runtime revision: `1.6.0-r1`
Previous known-good whole shell: `1.5.0-r2`
Starting live main: `9a4600cd121bb8230a0df3c4b673a7cc81e59dd2`
Branch: `agent/v1.6.0-registered-devices-private-pairing`
Pull request: #129

## Purpose

This bounded release candidate implements Stage 3 Registered Devices / Private Pairing, the next direct prerequisite toward private Remote Joining after the production-proven v1.5.0 Connected Account foundation.

The Stage 3 candidate introduces stable private installation/device identity, authenticated self-device registration and revocation, and private exactly-two-manager pairing bound to stable account/profile/save identity. It does not implement Connected Rivalry gameplay synchronization, Remote Joining session orchestration, public discovery, public matchmaking, public invite directories, global leaderboards or rankings.

## Candidate runtime boundary

The current production application remains `v1.5.0` / `1.5.0-r2` until the v1.6.0 candidate passes one exact-head source checkpoint, the genuinely new Stage 3 Firestore Rules boundary is published and verified, PR #129 is merged/deployed under standing owner authorization, and post-deployment proof succeeds.

`1.6.0-r1` keeps `1.5.0-r2` as the immediate previous known-good whole-shell recovery target. App Check enforcement remains OFF. Firebase remains optional to local startup. Authentication remains session-only Google popup sign-in and Firestore remains memory-only.

The Stage 3 private pairing module must not initialize Cloud Run, Cloud Functions, Firebase Storage, Blaze billing or broader IAM. The zero-billing Firebase Spark architecture remains mandatory.

## Stage 3 private identity and pairing contract

Private installation/device identity is generated locally and stored in IndexedDB rather than canonical localStorage. It does not fingerprint hardware and is not gameplay save authority. Clearing private device identity may create a new remote device identity but must not delete or rewrite local Career Mode saves.

Device documents are scoped to authenticated self-account paths at `accounts/{accountId}/devices/{deviceId}`. Device registration is idempotent for the same private local identity. Revocation is irreversible for that registered device identity.

Pairing uses a cryptographically strong 256-bit opaque capability, short-lived by default, one-use, private and non-enumerable. Initial pairing state exposes exactly two manager slots. Each occupied manager slot binds stable `accountId`, `profileId` and `saveId`; display labels are presentation-only and never authorize.

The exact reviewed production Rules candidate is `firestore.spark.rules`. Its Stage 3 additions permit only the required self-device and private pairing transactions. Shared authoritative gameplay state and Remote Joining session writes remain denied. List operations and public discovery remain denied.

## Local-first, recovery and installed-app locks

The Installable Offline App remains a protected production baseline. Local Career Mode, Save Library, Legacy history, Settings and recovery must continue to work while signed out, offline, popup-cancelled, Firestore-unavailable or pairing-unavailable.

The Service Worker must activate only a complete `1.6.0-r1` shell and preserve `1.5.0-r2` as the previous known-good whole-shell recovery target. A provider failure must never create a mixed-version runtime.

Canonical browser localStorage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is not canonical. Stage 3 IndexedDB private device identity does not add a fourth canonical gameplay-storage authority.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority and retains transaction-owned mutation, immutable confirmed intent, strict exact raw snapshot authority, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

Stage 3 must never bypass or replace those local recovery guarantees.

## Privacy and authorization boundary

Firebase `uid` remains the sole application `accountId` source. Local `profileId` and `saveId` provide stable manager/save identity. Display name, email and manager labels remain presentation-only.

The candidate must not deliberately persist raw Firebase ID tokens, refresh tokens, Google OAuth access tokens, App Check tokens or provider security logs in canonical Career Mode storage. Pairing capabilities are transient secrets and must not become durable local gameplay data.

Public community features, public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, global leaderboards and global rankings remain eliminated.

## Remote Joining dependency boundary

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

The ordered path remains:

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ Registered Devices / Private Pairing
→ Connected Rivalry
→ Private Remote Joining
→ two-real-device hardening / stable release.

PR #129 completes only the Stage 3 candidate. Connected Rivalry cannot begin until Stage 3 is fully source-proven, provider-proven, deployed and production-verified.

## Source-validation checkpoint

One immutable PR #129 head must prove:

1. complete repository contracts green;
2. every permanent pull-request workflow family green, including Validate Stage 3 Private Pairing and Stability Lane;
3. deterministic Stage 3 client contracts green;
4. desktop and mobile Chromium IndexedDB/local-first proof green;
5. Firestore Rules emulator proof green for create, redeem, expiry, replay denial, wrong account/scope, two-manager enforcement, device revocation and continued state/session denial;
6. submitted reviews clean;
7. inline review threads clean;
8. mergeability clean;
9. no production Stage 3 Rules publication before the source checkpoint is sealed.

Remote Joining readiness remains `63/100` during source-only validation because source code, documentation, CI and emulator proof alone do not equal real production pairing capability.

## Provider publication boundary

After the exact-head source checkpoint is clean, publish exactly the reviewed Stage 3 `firestore.spark.rules` to the existing free production Firebase project and verify the new device/pairing authorization boundary. This is a genuinely new Stage 3 Rules publication, not a repeat of the completed Stage 2 self-account setup.

No App Check enforcement change, billing upgrade, new Firebase project, new Web App, new Google provider setup, IAM activation, Storage, Cloud Functions or Cloud Run action belongs in this gate.

If repository credentials cannot publish production Firestore Rules directly, the owner may need to perform the single exact Firebase Console Rules publication after the source gates are sealed. Do not ask the owner to repeat any completed Stage 2 Firebase configuration.

## Merge, deployment and production proof

After provider proof and clean exact-head review gates, standing owner authorization permits PR #129 merge/deploy without repeated approval. Promotion to production-proven requires deployed `1.6.0-r1` shell verification plus real production registered-device/private-pairing evidence.

Only genuine fixed-domain production evidence may move `REMOTE_JOINING_READINESS.json`. Connected Rivalry remains blocked until Stage 3 production proof is recorded.

## Failure and rollback rule

If Stage 3 provider operations fail, local Career Mode Showdown remains usable and local saves remain authoritative. If `1.6.0-r1` is later proven defective, preserve local data and recover to the verified `1.5.0-r2` whole shell. Do not invent a partial mixed-version repair.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish PR #129 exact-head source validation without speculative changes. Correct only concrete failures while preserving zero billing, local-first behavior, strict authorization, recovery, privacy and the Remote Joining dependency order. Once all permanent workflows, reviews, threads and mergeability are clean on one immutable head, advance only to the exact Stage 3 production Firestore Rules publication/proof gate.

Handoff proximity must continue to be reported in every substantive owner-facing project response. Unknown usage must never be fabricated. WEC remains authoritative when stricter.
