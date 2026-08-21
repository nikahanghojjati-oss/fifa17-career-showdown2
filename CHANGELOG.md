# Career Mode Showdown Changelog

Last updated: 2026-08-21 ET

## v1.5.0 — Private Connected Account Foundation — release candidate

Candidate runtime: `1.5.0-r1`
Previous known-good production runtime: `1.4.0-r2`
Status: PR #125 source candidate; not production-proven.

Candidate scope:

- optional/lazy Google Firebase Authentication from the Connected Account Settings surface;
- `signInWithPopup()` only, with explicit `browserSessionPersistence` before sign-in;
- Cloud Firestore initialized with memory-only client cache only when connected-account services are explicitly requested;
- Firebase `uid` remains the sole application `accountId` source;
- reuses the PR #124 zero-billing strict self-account revision-0 bootstrap;
- no billing, Blaze, Cloud Run, Cloud Functions, Firebase Storage, redirect sign-in, additional Google OAuth scopes or provider-token extraction;
- downstream devices, pairing/invites, rivalry/session state, idempotency and gameplay mutations remain blocked;
- App Check enforcement remains OFF and local/offline Career Mode remains independent of Firebase availability.

This entry is candidate history only. Production promotion requires exact-head source gates, publication and verification of the exact reviewed `firestore.spark.rules`, merge/deploy under standing owner authorization, and post-deployment proof.

## v1.4.0 — Product Deepening — production

Runtime progression: `1.4.0-r1` → `1.4.0-r2`.
Current production runtime: `1.4.0-r2` — production-proven.
Previous runtime/recovery knowledge: `1.4.0-r1`.
Status: merged, deployed, and production-proven; visible production shell remains v1.4.0 until the v1.5.0 candidate completes publication proof.

`1.4.0-r2` completed the controlled production Firebase App + App Check connection while keeping local startup independent, browser Auth/Firestore/Storage/Functions uninitialized at that production milestone, application-client Firestore mutations deny-all, and App Check enforcement OFF. Permanent post-deployment proof is `Validate Stability Lane` #1230 / run `32439162225` on exact production head `3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516`, including legitimate production reCAPTCHA Enterprise App Check token traffic and the complete deployed journey.

The v1.4.0 application milestone formalized:

- Phase B / Save Library Experience 2.0 first slice (PR #70) — richer cards, clearer Local Profiles, local sort, 44px touch targets.
- Phase C / Showdown Home & Season Experience first slice (PR #73) — series lead/trail chip, contextual primary action (`VIEW COMPLETED SHOWDOWN`), last completed season summary, styles injected from `js/showdownUI.js`.

The v1.4.0 line restored visible public version progression (footer + `app-asset-revision` + Service Worker shell) without changing scoring, canonical storage keys, multi-Save portability, or identity semantics.

## v1.3.0 — Recovery & Device Resilience Hardening — production

Runtime progression: `1.3.0-r1` → `1.3.0-r2` (Local Profile display-label editing whole shell).

Includes formatVersion 2 multi-Save portability (PR #67), identity-safe Analytics, Local Profile display labels, and resilience hardening.

## Earlier releases

See historical `RELEASE_V*.md` records for v1.2.0 and earlier. Public community / global leaderboard features remain permanently ELIMINATED. Private Remote Joining remains BLOCKED until dependency order is ready.
