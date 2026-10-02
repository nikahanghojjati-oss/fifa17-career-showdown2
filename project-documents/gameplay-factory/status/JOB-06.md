# Status · JOB-06 · Start/Join view model + nav.locked

State: BLOCKED
Step: 0 of 7
Updated: 2026-10-02 19:27 UTC
Chat: Sol chat
Code branch: gameplay/job-06-start-join-model
Head commit: 4491e36378446b3a06ff2d28aa861bb892d87357
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37054023600

## Notes
- Step 1 blocked before Job 6 code changes: `js/sharedCareerAnalytics.js` exists and the recovery head's Gameplay contracts job passes Product contracts + Operations audit, but Validate Gameplay Fast fails in the existing `tests/firebase/two-manager-journey-emulator.cjs` test.
- Failure at `tests/firebase/two-manager-journey-emulator.cjs:220`: actual `permission-denied`, expected `SEASON_RESULTS_STALE_BASE_REVISION`.

## Self-check

## Blocked question
The current `gameplay/recovery-v1` baseline at `4491e36378446b3a06ff2d28aa861bb892d87357` has a failing existing two-manager journey emulator test. Should Job 6 wait for the recovery baseline to be green before continuing?
