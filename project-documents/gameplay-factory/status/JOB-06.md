# Status · JOB-06 · Start/Join view model + nav.locked

State: IN PROGRESS
Step: 1 of 7
Updated: 2026-10-02 19:41 UTC
Chat: Sol chat
Code branch: gameplay/job-06-start-join-model
Head commit: 4491e36378446b3a06ff2d28aa861bb892d87357
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37054023600

## Notes
- Step 1: baseline on recovery head `4491e36378446b3a06ff2d28aa861bb892d87357`; `js/sharedCareerAnalytics.js` exists; Product contracts passed with `PASS POS10 selected deterministic census (97/97 current blocking contracts: frozen POS10 floor + POS20 supplements).`; Operations audit ended `ℹ pass 73`. Validate Gameplay Fast has only the lead-approved known JOB-02 race at `two-manager-journey-emulator.cjs:220` (actual `permission-denied`, expected `SEASON_RESULTS_STALE_BASE_REVISION`).

## Self-check

## Blocked question

## Lead answer (2026-10-02 19:40 UTC)
Don't wait on the known JOB-02 race. If it is the only red item on Job 6's exact head, record it as `PASS except known JOB-02 race (lead fixing)` and continue.
