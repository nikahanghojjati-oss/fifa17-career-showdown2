# v1.7.0-r2 — Stage 4 shell coherence hotfix — release candidate

Candidate runtime: `1.7.0-r2`
Previous known-good runtime: `1.6.0-r1`
Status: bounded Stage 4 runtime-maintenance candidate; not production-proven.

- assigns a fresh immutable runtime/public asset namespace after changed Stage 4 bytes reused `1.7.0-r1`;
- makes the static Home local-data tile match the intentional `LOCAL / SAVE LIBRARY` bootstrap state;
- keeps the release footer exactly `v1.7.0 · Connected Rivalry` and adds a delayed browser assertion that rejects post-startup identity mutation;
- keeps `1.6.0-r1` as the known-good whole-shell recovery target;
- changes no Firestore Rules, authorization semantics, canonical local storage, Candidate C authority, billing, App Check enforcement or Stage 5 lock;
- RJR-1 remains 69 pending genuine Connected Rivalry production proof.

# Career Mode Showdown Changelog

Last updated: 2026-08-21 ET

## v1.7.0 — Connected Rivalry — release candidate

Candidate runtime: `1.7.0-r1`
Previous known-good runtime: `1.6.0-r1`
Status: Stage 4 source candidate; not production-proven.

Candidate scope:

- direct exact-rivalry attachment with no listing, public discovery, matchmaking or lobby surface;
- private IndexedDB rivalry-pointer continuity that never becomes gameplay or authorization authority;
- deterministic publication projection for the explicitly connected local Save;
- authoritative reads without destructive remote-to-local Apply;
- immutable client `baseRevision` compare-and-swap and exactly-next monotonic revision advancement;
- atomic SHA-256 idempotency receipts with exact replay returning the accepted result without another mutation/revision increment;
- explicit reused-key and stale-base conflict handling with no silent rebase or last-writer-wins fallback;
- shared-state mutation restricted to the active exactly-two-manager rivalry with both accounts and the writer device active;
- tombstone anti-resurrection;
- Stage 4 deterministic client contracts and Firestore emulator proof added to the existing permanent validation topology;
- Firebase Spark / zero billing, memory-only Firestore, session-only Google authentication and App Check enforcement OFF preserved;
- Stage 5 Remote Joining session writes and orchestration remain blocked.

Production promotion requires one exact candidate head with all permanent workflow families green, clean reviews/threads/mergeability, publication and verification of the exact reviewed Stage 4 `firestore.spark.rules`, merge/deploy under standing owner authorization, and real production Connected Rivalry proof. RJR-1 remains `69/100` until genuine production capability evidence closes a fixed-domain gap.

## v1.6.0 — Registered Devices & Private Pairing — production

Current production runtime: `1.6.0-r1` — production-proven.
Previous runtime/recovery target at that release: `1.5.0-r2`.
Status: merged, deployed, and production-proven; this is the immediate known-good whole-shell recovery target for the v1.7.0 candidate.

The v1.6.0 line added stable private installation/device identity in IndexedDB, authenticated self-device registration and irreversible revocation, a 256-bit short-lived one-use private pairing capability, and exactly two manager slots bound to stable `accountId`, `profileId`, and `saveId` identity.

The production Stage 3 boundary remains Firebase Spark with memory-only Firestore, session-only Google authentication, zero billing and App Check enforcement OFF. Production proof established the registered-device/private-pairing path without crediting Connected Rivalry, actual Remote Joining sessions or two-physical-machine hardening.

## v1.5.0 — Private Connected Account Foundation — production

Runtime progression: `1.5.0-r1` → `1.5.0-r2`.
Production runtime at that milestone: `1.5.0-r2` — production-proven.
Previous runtime/recovery knowledge: `1.5.0-r1`.
Status: merged, deployed, and production-proven.

The v1.5.0 line established the optional private Connected Account foundation on the zero-billing Firebase Spark path. It preserves local-first startup, Google `signInWithPopup()` with `browserSessionPersistence`, memory-only Firestore, Firebase `uid` as the sole application `accountId`, no additional OAuth scopes, no provider-token storage, no Storage/Functions/Cloud Run/Blaze, and App Check enforcement OFF.

`1.5.0-r2` fixed the Connected Account Settings mount race and completed production proof of the real Google sign-in / self-account bootstrap path.

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

Includes formatVersion 2 multi-Save portability, identity-safe Analytics, Local Profile display labels, and resilience hardening.

## Earlier releases

See historical `RELEASE_V*.md` records for v1.2.0 and earlier. Public community / global leaderboard features remain permanently ELIMINATED. Private Remote Joining remains dependency-gated behind the ordered private account → Registered Devices / Private Pairing → Connected Rivalry prerequisites.
