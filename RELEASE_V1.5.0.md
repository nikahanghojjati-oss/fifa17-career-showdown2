# Career Mode Showdown v1.5.0 — Private Connected Account Foundation

Status: RELEASE CANDIDATE

Application version: `v1.5.0`
Runtime asset revision: `1.5.0-r1`
Release tag: `v1.5.0`
Previous known-good runtime: `1.4.0-r2`

## Scope

This release candidate introduces the first production-facing private connected-account workflow while preserving the local-first Career Mode experience.

The connected path uses only Firebase services available on the project's zero-billing Spark architecture:

- Firebase Authentication with Google federated sign-in only;
- `signInWithPopup()` from an explicit user action;
- explicit `browserSessionPersistence` before sign-in;
- Cloud Firestore with memory-only client cache;
- the existing production Firebase App + App Check runtime, with App Check enforcement remaining OFF;
- a strict authenticated self-account revision-0 bootstrap at `accounts/{request.auth.uid}`.

No billing account, Blaze upgrade, Cloud Run service or Cloud Functions runtime is required or authorized.

## Product boundary

The Connected Account panel is optional and appears through Settings. Local saves and all existing local gameplay remain usable while signed out, offline or when Firebase is unavailable.

Successful sign-in establishes only Firebase `uid` as application `accountId`. Google display name/email remain presentation data and do not claim Local Profiles, Saves, manager slots, devices, rivalries or sessions.

The initial browser write boundary is deliberately narrow: a signed-in user may create only their own strict initial account document. Account updates/deletes, registered-device writes, pairing/invites, rivalry-state writes, session writes, idempotency writes and all other remote mutation remain blocked.

Private Remote Joining is not included in v1.5.0. Registered Devices / Private Pairing and Connected Rivalry remain later dependency-gated milestones.

## Privacy and provider constraints

The application requests no additional Google OAuth scopes, does not use redirect sign-in, does not extract provider OAuth credentials and does not deliberately persist raw Firebase ID tokens, refresh tokens or provider access tokens in Career Mode storage.

Canonical Career Mode browser storage remains exactly the existing Save Library, Legacy Showdowns and Preferences keys.

## Recovery

`1.4.0-r2` remains the immediate previous known-good whole-shell recovery target until `1.5.0-r1` has completed exact-head validation, free Firestore rules publication, production site deployment and post-deployment proof.

This file records a candidate only. It must not be interpreted as stable production proof before those gates complete.
