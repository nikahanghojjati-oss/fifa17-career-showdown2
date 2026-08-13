# Career Mode Showdown v1.3.0 — Recovery & Device Resilience Hardening

Status: PRODUCTION PROVEN
Application version: `v1.3.0`
Runtime asset revision: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Release tag: `v1.3.0`
Release date: 2026-08-13 ET
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

## Release purpose

v1.3.0 hardens the existing local-first Installable Offline App after the v1.2 PWA transition. It does not change gameplay, scoring, the proven application shell, navigation ownership, the three-key canonical persistence model, accepted football photography, the protected r2 loading composition or the Settings-only install/update hierarchy.

## Shipped resilience work

- Candidate A blocked-read export fails closed.
- Candidate B remains strictly read-only analysis.
- Candidate C requires strict exact raw snapshot authority before destructive Apply and otherwise performs no mutation.
- Candidate C retains freshness rechecks, complete in-memory planning, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification and critical recovery on uncertainty.
- PWA offline/reconnect rendering preserves the real pre-offline external-media state.
- Existing Service Worker registration is reused and updated.
- Update reload intent is armed before waiting-worker activation messaging.
- `CMS_ACTIVATE_UPDATE` verifies the whole shell, awaits successful `skipWaiting()`, then emits `CMS_ACTIVATION_ACCEPTED`; failure cannot be preceded by a success acknowledgement.
- Whole-shell cache recovery remains coherent across current `1.3.0-r1` and previous `1.2.0-r2` runtimes.
- PWA lifecycle proof preserves exact raw bytes for all three canonical localStorage keys.

## Protected architecture and product model

`js/screens.js` remains sole navigation/history/Smart Back authority. `js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. Candidate C remains the only import stage allowed to mutate canonical state.

Exactly three canonical localStorage keys remain legal. Service Worker/Cache Storage remains application-byte authority only.

Exactly two managers, Showdown lengths 1/3/5/10, same selected league, different permanent clubs, existing scoring, the 11-point maximum and 0–0-only tiebreak rules remain unchanged.

## Whole-shell relationship

Current production shell: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`

The predecessor is deliberately r2 because it was the immediate technically production-proven runtime before v1.3.

## Production evidence

Frozen candidate: `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f`
Pages: `31755135819`
Stability: `31755136265`
deployed-site-smoke: `94629478166`
Release Integration Burn-In: `31755136240` — 2/2

See `V1.3.0_PRODUCTION_PROOF.md` for the full public-boundary seal.

Owner visual acceptance remains separate from automated technical production proof.
