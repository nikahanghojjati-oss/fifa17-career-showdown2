# Career Mode Showdown v1.8.1 — Pairing Identity UX Hardening

Status: RELEASED — PRODUCTION DEPLOYED AND BYTE-PROVEN

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r1`
Release tag: `v1.8.1`
Previous known-good runtime: `1.8.0-r1`
Release PR: `#138`
Final PR head/tree: `e3a053bc6cca4aec5f82f3d25536c5eb1ae48e26` / `a86d8de18b9df768c782cc0a4338a9123fc05860`
Expected-head squash merge: `ca0cb6ce8628c5f993669c08ff33e8f64c634870`
Pages run: `32793956319`
Remote Joining readiness baseline: `78/100` under fixed model `RJR-1`

## Scope

This backward-compatible production patch fixes the manager-selection and error-guidance defects witnessed during real two-device private pairing:

- selected Player One/Player Two identity is keyed to stable manager role, `profileId` and `saveId`, never a transient option index;
- selection survives busy, success and failure rerenders;
- changing the selected manager does not erase an already pasted pairing capability;
- denied, consumed, expired or otherwise opaque pairing outcomes use one safe non-enumerating message with a fresh-code / Connected-Rivalry recovery path;
- successful pairing copy points at the already-shipped explicit Connected Rivalry actions while keeping Remote Joining locked;
- deterministic contracts and a rendered mobile-browser regression prove Player Two persistence through both successful creation and denied redemption.

## Safety and recovery

This release changes no Firestore Rules and did not require a Rules republish. Production blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f` remains authoritative. Firebase stays Spark / zero billing, App Check enforcement stays OFF, Firestore stays memory-only and Google authentication stays popup-only `browserSessionPersistence` without extra scopes.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate C remains the sole destructive local Apply authority with immutable intent, verified backup, strict exact raw snapshot guards, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification. The Installable Offline App and local recovery routes remain available without Firebase.

Exactly two private managers remain the only model. No public discovery, community, matchmaking, invitation directory, leaderboard, ranking, Stage 5 session document, presence or lobby behavior is added.

## Promotion evidence and deployed limitation

All 69 contract suites, focused rendered-browser evidence and all 14 permanent final-head pull-request workflow families passed. The sole review thread was corrected and resolved, mergeability was clean, the expected-head merge completed, Pages succeeded and two independent verifiers proved all 89 public runtime files match `1.8.1-r1` byte-for-byte.

Fourteen of fifteen main-push workflows succeeded. Stability contracts, Chromium Stability, deployed byte identity and runtime-error provenance passed. Stability run `32793956255` failed only when deployed-site-smoke job `97641884789` reached the production App Check token step and reCAPTCHA Enterprise returned the known redacted `403 initial-throttle` with a 24-hour retry window. The app failed closed to local mode and later smoke steps were skipped. Do not rerun that headless proof, add a debug provider, change provider configuration, enable enforcement or republish unchanged Rules.

Source, tests, CI, review, merge and deployment do not increase RJR-1. The recorded move from 77 to 78 comes only from separate owner-proven Chromebook/iPhone physical-device evidence. The immediate production acceptance check is one non-mutating Player Two syntactically valid but practically nonexistent-code submission that must preserve the selector and show privacy-safe guidance without local or remote mutation. On a concrete runtime regression, preserve local data and use `1.8.0-r1` only as the previous whole-shell recovery reference; never mix runtime generations.
