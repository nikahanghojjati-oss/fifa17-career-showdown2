# Career Mode Showdown v1.6.0 — Registered Devices & Private Pairing

Status: RELEASE CANDIDATE

Application version: `v1.6.0`
Runtime asset revision: `1.6.0-r1`
Release tag: `v1.6.0`
Previous known-good runtime: `1.5.0-r2`

## Scope

v1.6.0 adds the next private Remote Joining prerequisite without enabling shared gameplay synchronization or Remote Joining sessions.

The release adds:

* a stable private installation and device identity stored in IndexedDB, separate from canonical Career Mode localStorage;
* authenticated self-device registration under `accounts/{accountId}/devices/{deviceId}`;
* irreversible device revocation for the registered identity;
* a cryptographically strong 256-bit private pairing capability with a 15-minute default lifetime and one-use redemption;
* exactly two manager slots bound to Firebase account identity plus stable Local Profile and Save Library identities;
* atomic private rivalry/invite creation and redemption through Cloud Firestore transactions;
* restrictive Firebase Spark Security Rules for only the Stage 3 device and pairing operations;
* deterministic client, Firestore Emulator, desktop Chromium and mobile Chromium proof.

## Local-first boundary

Local Career Mode remains authoritative. The canonical localStorage keys remain exactly Save Library, Legacy Showdowns and Preferences. Stage 3 device identity uses IndexedDB only and never becomes gameplay save authority.

Pairing does not upload shared gameplay payloads, create authoritative rivalry state, create Remote Joining sessions, or make Firebase a prerequisite for local Career Mode.

## Privacy and security boundary

Private pairing has no public discovery, public profile directory, public matchmaking, invitation directory, community feature, global leaderboard or ranking surface.

Display names are presentation only. Authorization comes from authenticated Firebase UID, registered device state, exact capability access and Firestore Security Rules.

App Check enforcement remains OFF. Firestore persistent offline cache remains disabled. Google authentication remains session-only. No additional Google OAuth scopes are requested.

## Provider and billing boundary

This release remains on Firebase Spark / zero billing. It does not authorize Blaze, Cloud Run, Cloud Functions, Firebase Storage or a billing account.

`firestore.spark.rules` is the reviewed Stage 3 source candidate. Production provider publication must not be treated as complete until exact-head source, emulator, browser/mobile, review/thread, deployment and real-device evidence gates are satisfied.

## Recovery

`1.5.0-r2` is the immediate previous known-good whole-shell recovery target for `1.6.0-r1`.

This document records the v1.6.0 release candidate. It is not production proof by itself.
