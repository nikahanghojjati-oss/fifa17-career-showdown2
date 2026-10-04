# Career Mode Showdown v1.9.1 — Runtime r52

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r52`  
Previous known-good runtime: `1.9.1-r51`

## What changed

r52 ships the Team G gameplay recovery (`gameplay/recovery-v1`) so Daniel and Nik can play a full shared Showdown on production. Nik asked for a one-season test run on 2026-10-04.

### Gameplay fixes

- Scoring, history, multi-season progression, Terminal Close and Final Reconciliation now find the rivalry after a season commit (the save marker never carried `rivalryId`), so the journey no longer stalls after season 1.
- Simultaneous Shared Season Results publish retries once on a stale base revision instead of showing an error.
- Concurrent season acknowledgements: a late acknowledgement superseded by the rival's is retried as stale instead of failing with permission-denied.
- Final Reconciliation reads and publishes the Connected Rivalry snapshot; Terminal Close keeps working after Shared Setup goes not-ready, and post-close refreshers stay quiet.
- A pair code Nik types survives the pair-panel re-render.
- Reload mid-Showdown: both managers land on Home with CONTINUE CAREER; after a fresh private session they resume at the provider's active season. A closed Showdown no longer reopens GET READY.
- Career index (append-only, own account) is written with every new pairing; Rules ship in relaxed mode (`cmsCareerIndexEnforced()` is false).
- Completed-only reads for closed Showdowns and the career data seam are included but have no new visible screens (the visual package is not part of this release).

### Proof

- Validate Gameplay Fast on the recovery head: gameplay contracts, the composed-Rules emulator matrices (setup, transfer, lifecycle 1/3, Terminal Close, pair, career index, completed read, closed adapter, transfer history, season-commit race), the composed production Rules regression and the two-manager 3-season browser journey (35 checks, real reload resume).
- Validate POS20 on the exact release head.

## What did not change

- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r52, and r51 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment.
