# Career Mode Showdown Changelog

Last updated: 2026-08-21 ET

## v1.6.0 — Registered Devices & Private Pairing — release candidate

Candidate runtime: `1.6.0-r1`
Previous known-good runtime: `1.5.0-r2`
Status: PR #129 source candidate; not production-proven.

Candidate scope:

- stable private installation/device identity in IndexedDB without adding canonical localStorage authority;
- authenticated self-device registration and irreversible revocation;
- 256-bit short-lived one-use private pairing capability;
- exactly two manager slots bound to stable `accountId`, `profileId`, and `saveId` identity;
- Firebase Spark Firestore transactions and restrictive Security Rules limited to Stage 3 device/pairing operations;
- deterministic client contracts, desktop/mobile Chromium IndexedDB proof, and Firestore Rules emulator proof;
- memory-only Firestore, session-only Google authentication, zero billing, and App Check enforcement OFF preserved;
- shared gameplay state, Connected Rivalry synchronization, Remote Joining sessions, public discovery, matchmaking, invite directories, leaderboards and rankings remain blocked.

Production promotion requires one exact candidate head with all normal workflow families green, clean reviews/threads/mergeability, publication and verification of the exact reviewed Stage 3 `firestore.spark.rules`, merge/deploy under standing owner authorization, and post-deployment proof.

## v1.5.0 — Private Connected Account Foundation — production

Runtime progression: `1.5.0-r1` → `1.5.0-r2`.
Current production runtime: `1.5.0-r2` — production-proven.
Previous runtime/recovery knowledge: `1.5.0-r1`.
Status: merged, deployed, and production-proven; this is the immediate known-good whole-shell recovery target for the v1.6.0 candidate.

The v1.5.0 line established the optional private Connected Account foundation on the zero-billing Firebase Spark path. It preserves local-first startup, Google `signInWithPopup()` with `browserSessionPersistence`, memory-only Firestore, Firebase `uid` as the sole application `accountId`, no additional OAuth scopes, no provider-token storage, no Storage/Functions/Cloud Run/Blaze, and App Check enforcement OFF.

`1.5.0-r2` fixed the Connected Account Settings mount race and completed production proof of the real Google sign-in / self-account bootstrap path. Registered Devices / Private Pairing remained blocked until that production boundary was proven.

## v1.4.0 — Product Deepening — production

Runtime progression: `1.4.0-r1` → `1.4.0-r2`.
Production runtime at that milestone: `1.4.0-r2` — production-proven.
Previous runtime/recovery knowledge: `1.4.0-r1`.
Status: merged, deployed, and production-proven.

`1.4.0-r2` completed the controlled production Firebase App + App Check connection while keeping local startup independent, browser Auth/Firestore/Storage/Functions uninitialized at that production milestone, application-client Firestore mutations deny-all, and App Check enforcement OFF. Permanent post-deployment proof is `Validate Stability Lane` #1230 / run `32439162225` on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`, including legitimate production reCAPTCHA Enterprise App Check token traffic and the complete deployed journey.

The v1.4.0 application milestone formalized:

- Phase B / Save Library Experience 2.0 first slice (PR #70) — richer cards, clearer Local Profiles, local sort, 44px touch targets.
- Phase C / Showdown Home & Season Experience first slice (PR #73) — series lead/trail chip, contextual primary action (`VIEW COMPLETED SHOWDOWN`), last completed season summary, styles injected from `js/showdownUI.js`.

The v1.4.0 line restored visible public version progression without changing scoring, canonical storage keys, multi-Save portability, or identity semantics.

## v1.3.0 — Recovery & Device Resilience Hardening — production

Runtime progression: `1.3.0-r1` → `1.3.0-r2` (Local Profile display-label editing whole shell).

Includes formatVersion 2 multi-Save portability (PR #67), identity-safe Analytics, Local Profile display labels, and resilience hardening.

## Earlier releases

See historical `RELEASE_V*.md` records for v1.2.0 and earlier. Public community / global leaderboard features remain permanently ELIMINATED. Private Remote Joining remains dependency-gated behind the ordered private account → Registered Devices / Private Pairing → Connected Rivalry prerequisites.
