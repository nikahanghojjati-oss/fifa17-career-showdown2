# Career Mode Showdown v1.3.0 Maintenance Handoff

Last updated: 2026-08-13 ET
Status: PRODUCTION PROVEN
Application version: `v1.3.0`
Production runtime: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

## Milestone

Current milestone — v1.3.0 — Recovery & Device Resilience Hardening.

The implementation and technical release proof are closed. Do not reopen v1.3 work without new reproducible evidence. No Local Manager Profiles, Save Library registry, cloud state, accounts, synchronization, QR pairing, new canonical storage keys, gameplay/scoring changes, framework migration or broad UI redesign shipped in this release.

## Recovery authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine.

Candidate C is the only import stage allowed to mutate canonical state. It requires immutable confirmed intent, strict exact raw snapshot authority, exact preconditions, freshness rechecks, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation and rollback, anti-clobber ownership, deterministic outcomes, post-write verification, byte-for-byte rollback verification and critical recovery whenever ownership cannot be conclusively established.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Cache Storage and the Service Worker store application bytes only and are never user-data authorities.

## Installable Offline App authority

Current whole shell: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`

Preserve complete verified cache population, explicit safe-boundary update activation, Candidate C busy/recovery gating, whole-runtime cache selection, previous-known-good fallback, corruption detection, fail-closed behavior when no coherent shell is usable, cleanup only inside this app's cache namespaces, unrelated-cache preservation, worker-owned connectivity probing and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the candidate shell, await successful `skipWaiting()`, and only then acknowledge activation acceptance.

## Protected presentation

The r2 iOS installed-app loading correction remains protected: bounded mobile top band, independent subject-safe Marco Reus image box, width-owned composition and opacity/filter-only animation. The root problem was viewport-height behavior, not the image asset.

Install/update presentation remains Settings-only. Do not restore floating install banners, global install rails, sticky installation UI or layout reservation for global install state.

## Product and performance locks

Exactly two managers. Showdown lengths remain 1, 3, 5 or 10. Both managers use different permanent clubs from the same selected league. Maximum Season score remains 11. Equal non-zero scores remain Draws. Only 0–0 invokes league-position then league-points tiebreakers.

`js/screens.js`, `js/scoring.js` and `js/analytics.js` retain their established authorities.

Performance ceilings remain: eager raw <=165,000 bytes; eager gzip <=37,500 bytes; Reus startup portrait <=95,000 bytes; combined first-party startup <=260,000 bytes; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

## Technical release evidence

The frozen candidate `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f` passed two full 13/13 normal PR generations. PR #42 merged at `094401b649954656e27e4a92d027e9532e84ccbf`. Pages `31755135819`, Stability `31755136265`, deployed-site-smoke `94629478166` and Burn-In `31755136240` all passed. Burn-In completed 2/2 stateful journeys.

Owner visual acceptance remains separate from technical CI.

## Branch warnings

PR #37 / `agent/v13-hardening` remains untrusted historical work. Do not merge its alternate shell, stale release records or lockfile. PR #40 is the detailed v1.3 salvage/audit record. PR #42 is the release path.
