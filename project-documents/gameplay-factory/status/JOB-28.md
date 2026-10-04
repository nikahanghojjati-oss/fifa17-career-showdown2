# Status · JOB-28 · G-13 part 2e: Rivalry Statistics and Legacy (History)

State: IN PROGRESS
Step: 2 of 5
Updated: 2026-10-04 22:29 UTC
Chat: Sol Work mode
Code branch: gameplay/job-28-v10-history
Head commit: eeaada665d231d6d7a11960862fc8c27e65a5184
PR: none yet
CI run: pending on tests-first head

## Notes
- Step 1: Read RULES, handbook, COMMON, pinned 5e05a1f sources, screen truth/build notes, NAV_CONTRACT and data contract. Starting from job 24 as expressly allowed.
- Step 2: Saved 10 numbered contract checks before implementation; expected MODULE_NOT_FOUND failure. Registered in supplemental registry and operations audit.
- DEFAULT: Actual application Rivalry route is statistics (semantic screen rivalryStatistics). Stage reads dataset.src1x/src2x, so retain working data-src1x/data-src2x names from pinned sources.
- DEFAULT: READY means available to start; owner/job instructions require the whole job without Continue.

## Self-check
- Tests first: node tests/contracts/v10-rivalry-legacy-contracts.cjs failed MODULE_NOT_FOUND for js/rivalryLegacyV10.js (not yet implemented).

## Model gaps
- Current rivalry transfer summaries unavailable from the career model; show Unavailable, never zero.

## Blocked question
