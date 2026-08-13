# Career Mode Showdown v1.3.0 Maintenance Handoff

Last updated: 2026-08-13 ET
Status: RELEASE CANDIDATE
Application version: `v1.3.0`
Candidate runtime: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production authority until promotion: v1.2.0 Installable Offline App / `1.2.0-r2`
Active development PR: #40 / `agent/v13-r2-hardening`

## Milestone

Current milestone — v1.3.0 — Recovery & Device Resilience Hardening.

This release hardens the existing local-first Installable Offline App. It does not introduce Local Manager Profiles, Save Library registries, cloud state, accounts, synchronization, new canonical storage keys, gameplay changes, scoring changes, framework migration or broad UI redesign.

## Candidate resilience state

The historically identified release blockers are closed in current candidate source:

1. Service Worker update activation verifies the current whole-shell cache, awaits `self.skipWaiting()`, and only after successful resolution emits `CMS_ACTIVATION_ACCEPTED`. Failure emits rejection only.
2. Candidate C Apply requires `captureCareerModeRawRestoreSnapshot()`. Missing or failed strict snapshot authority returns `snapshot-unavailable` and performs no destructive planning or transaction.

Earlier v1.3 hardening also preserves Candidate A blocked-read fail-closed export behavior, Candidate B read-only analysis, PWA reconnect-state restoration, reload intent ordering, reuse of an existing Service Worker registration, Settings focus preservation, correct CI artifact semantics, whole-shell offline fallback and exact localStorage byte preservation through PWA lifecycle transitions.

## Persistence and recovery authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine.

Candidate C remains the only import stage allowed to mutate canonical state. It requires immutable confirmed intent, strict exact raw snapshot authority, exact preconditions, freshness recheck, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation, transaction-owned rollback, anti-clobber ownership, deterministic outcomes, post-write verification, byte-for-byte rollback verification and critical recovery whenever ownership cannot be conclusively established.

Cache Storage stores application bytes only. The Service Worker and PWA layer are not user-data authorities and must not parse, normalize or rewrite canonical localStorage state.

## Installable Offline App authority

Candidate current whole shell: `1.3.0-r1`
Candidate previous known-good whole shell: `1.2.0-r2`

Preserve complete verified cache population, explicit update activation, safe activation boundaries, Candidate C busy/recovery gating, whole-runtime cache selection, previous-known-good fallback, corruption detection, fail-closed behavior when both candidate and previous shell are unusable, cleanup only inside this app's cache namespaces, unrelated-cache preservation, worker-owned connectivity probing and lazy PWA loading.

Do not assemble a runtime from individually available files from different revisions.

## Protected r2 product presentation

The r2 iOS installed/standalone loading composition remains protected. Its root correction was viewport-height behavior, not a bad Marco Reus image. Preserve the bounded mobile top band, independent subject-safe image box, width-owned composition and opacity/filter-only animation.

Install and update presentation remains Settings-only. Do not restore floating/global install bars, sticky rails, persistent install banners or reserved layout space for global install status.

The current FIFA 17-inspired tile shell, subject-safe football photography, gameplay routes and accepted visual architecture remain unchanged by the v1.3 identity freeze.

## Product locks

Exactly two managers. Showdown lengths remain 1, 3, 5 or 10. Both managers use different permanent clubs from the same selected league. Maximum Season score remains 11. Equal non-zero scores are Draws. Only 0–0 invokes league-position then league-points tiebreakers.

`js/screens.js` remains sole navigation/history/Smart Back authority. `js/scoring.js` remains scoring authority. `js/analytics.js` remains analytics authority.

## Candidate proof boundary

The identity freeze is mechanical and preserves the proven production DOM. It must not be treated as release proof by itself.

All 13 normal PR workflow families must pass together on the exact frozen candidate head. Performance ceilings remain unchanged. Release Integration Burn-In remains main/manual release-only.

Until merge, successful Pages deployment, exact deployed-byte/provenance verification, deployed Stability/public journey and required Burn-In are complete, production remains v1.2.0 / `1.2.0-r2` and README/CHANGELOG production truth must remain unchanged.

Owner visual acceptance is separate from technical CI and must never be inferred from automated green checks.
