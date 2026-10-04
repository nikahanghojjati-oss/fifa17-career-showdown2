# JOB-28 · G-13 part 2e: Rivalry Statistics and Legacy (History)

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **codex** (Nik pastes the lead's box into the Codex app; the lead checks in a browser and merges) | job 24 merged | `gameplay/job-28-v10-history` | `gameplay/recovery-v1` | one Codex task |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `bde2172`): `rivalry-statistics/` and `legacy/`.
- App screens: `rivalryStatistics` and `legacy` (History).

## Build

- Same pattern as job 13: a pure `toV10Frame(model, screen)` mapping from the real career model (`js/sharedCareerAnalytics.js`, closed and active Showdown adapters) through `js/careerScreenSeam.js` statuses, registered through job 24's `js/v10Screens.js`.
- Un-hide `#rivalryStatisticsButton` and `#legacyButton` by removing them from the containment selector in `js/onlinePlayerIdentity.js`. After that the containment list hides no Statistics buttons.
- History shows closed Showdowns only, with no backfill. A missing field means unavailable, never zero.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-rivalry-legacy-contracts.cjs`: the mapping for each data-contract-v1 fixture (empty, loading, unavailable, partial, finished-three-seasons, multi-showdown-career, tiebreak-finish); Daniel first; no numbers in loading or unavailable; containment updated; no `fixtures.json` in production code.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-28.md`, with the PR link and head SHA. The lead merges; you do not.
