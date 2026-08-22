# Career Mode Showdown v1.6.0 — Registered Devices & Private Pairing

Status: PRODUCTION-PROVEN

Application version: `v1.6.0`
Runtime asset revision: `1.6.0-r1`
Release tag target: `v1.6.0`
Production runtime merge: `5d254cea6e4deebd2aac79effeda30dcc3048385` (PR #129)
Previous known-good runtime: `1.5.0-r2`
Production proof: `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`

## Scope

v1.6.0 completes the Registered Devices / Private Pairing prerequisite without enabling shared gameplay synchronization or Remote Joining sessions.

The release adds:

* a stable private installation and device identity stored in IndexedDB, separate from canonical Career Mode localStorage;
* authenticated self-device registration under `accounts/{accountId}/devices/{deviceId}`;
* irreversible device revocation for the registered identity;
* a cryptographically strong 256-bit private pairing capability with a 15-minute default lifetime and one-use redemption;
* exactly two manager slots bound to Firebase account identity plus stable Local Profile and Save Library identities;
* atomic private rivalry/invite creation and redemption through Cloud Firestore transactions;
* restrictive Firebase Spark Security Rules for only the Stage 3 device and pairing operations;
* deterministic client, Firestore Emulator, desktop Chromium and mobile Chromium proof;
* production provider Rules publication and live cross-account pairing proof.

## Production evidence

PR #129 was sealed on exact head `e3f462306e1d2b0822aaf54eb1f9dc9af62ed4f8` with all 14 permanent PR workflow families successful, no submitted reviews, no inline review threads, and mergeability true before publication/merge.

The exact reviewed Stage 3 Rules blob is `bf307c52262faf81a484e33cde272ac831fe60f0`. Owner Firebase Console screenshots prove a newly published Stage 3 Rules version in `fifa17-career-showdown-prod` / Firestore `(default)` and visibly cover the Stage 3 device/pairing authorization boundary.

Live-site screenshots prove `v1.6.0` / `1.6.0-r1`, a ready private account, registered browser device identity, real pairing-code creation, wrong-slot rejection without local-save mutation, and successful redemption by a distinct authenticated account using a distinct browser device identity. The paired state explicitly keeps gameplay sync and Remote Joining locked.

The two device identities were demonstrated with normal and incognito browser storage contexts on one physical Chromebook. This is valid for the application's IndexedDB-based device-identity model but is not claimed as two-physical-machine hardening proof.

## Local-first boundary

Local Career Mode remains authoritative. The canonical localStorage keys remain exactly Save Library, Legacy Showdowns and Preferences. Stage 3 device identity uses IndexedDB only and never becomes gameplay save authority.

Pairing does not upload shared gameplay payloads, create authoritative rivalry gameplay state, create Remote Joining sessions, or make Firebase a prerequisite for local Career Mode.

## Privacy and security boundary

Private pairing has no public discovery, public profile directory, public matchmaking, invitation directory, community feature, global leaderboard or ranking surface.

Display names are presentation only. Authorization comes from authenticated Firebase UID, registered device state, exact capability access and Firestore Security Rules.

App Check enforcement remains OFF. Firestore persistent offline cache remains disabled. Google authentication remains session-only. No additional Google OAuth scopes are requested.

## Provider and billing boundary

This release remains on Firebase Spark / zero billing. It does not authorize Blaze, Cloud Run, Cloud Functions, Firebase Storage or a billing account.

## Recovery

`1.5.0-r2` is the immediate previous known-good whole-shell recovery target for `1.6.0-r1`.

## Next milestone

Stage 4 Connected Rivalry is the next separate milestone. It must reuse the deterministic synchronization/recovery contracts and the Stage 3 exactly-two-owner entitlement while keeping Stage 5 actual Remote Joining session orchestration blocked until Stage 4 is independently proven.
