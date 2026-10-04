# Career Mode Showdown v1.9.1 — Runtime r51

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r51`  
Previous known-good runtime: `1.9.1-r50`

## What changed

r51 lets **one longer game prove the whole SSJR score**. Nik asked for this on 2026-09-29.

### Why

Under SSJR-2.0, the most a single run could prove was 82/100.
- The Physical Journey recorder (`js/ssjrPhysicalJourneyAcceptance.js`) recorded each stage only once.
- The validator accepted only one-season plans.

Multi-season play, and everything that depends on it, could therefore never be proven: final reconciliation, terminal close, the full physical journey and the stable release, worth 18 points.

### Recorder

- Each season's Transfer, Results, Commit, Scoring and Shared History milestones are recorded once per season.
- The completed season plan is recorded as `showdown-complete`, taken from the Multi-Season progression authority.
- The panel shows a `SEASONS n/N` row. `READY TO EXPORT` requires every season of the plan.
- The recorder is still acceptance-only and sanitized. It makes no network request and never writes.

### Validator

`scripts/validate-ssjr-physical-journey-evidence.mjs` accepts any confirmed 1, 3, 5 or 10 season plan. It requires:
- every season's milestones, in order, on both devices, with no season outside the plan;
- Final Reconciliation on the last season, after its Shared History;
- for multi-season plans, the completed plan;
- the same plan on both devices.

One-season runs remain valid.

### SSJR-2.1

- SSJR-2.1 replaces SSJR-2.0. The only change is how multi-season is proven: one validated run of at least 2 confirmed seasons, with `showdown-complete` on both devices.
- Capabilities, weights, dependencies, evidence layers and permanent locks are unchanged.
- SSJR-2.0 is preserved byte-identical at `authority-history/SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2_0.json`.
- Owner authority: `authority-history/OWNER_SSJR21_ONE_LONGER_RUN_AUTHORIZATION_2026-09-29.md`.
- With SSJR-2.1:
  - a validated 3-season run with Nik's stable-release acceptance proves 100/100, or 98 without that acceptance;
  - a one-season run still proves 82.

### Tests

- `tests/contracts/ssjr-physical-journey-acceptance-contracts.cjs` covers:
  - a valid 3-season pair;
  - rejection of a missing season, a missing completed plan, a final reconciliation on the wrong season, out-of-order seasons, a season outside the plan, mismatched plans and unsupported plan lengths.
- `tests/contracts/ssjr2-physical-run-credit-contracts.cjs` checks the model lineage and the 82, 98 and 100 outcomes.
- `tests/browser/ssjr-physical-journey-acceptance-audit.cjs` drives the real recorder through 3 seasons. It checks that each season is recorded exactly once, then validates the export.

## What did not change

- Gameplay, Firestore Rules, provider authority, the scoring formula and canonical local storage behaviour are unchanged.
- Private Remote Joining and paired manager authority are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r51, and r50 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment.
