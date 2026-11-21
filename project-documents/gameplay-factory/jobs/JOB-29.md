# JOB-29 · G-13 part 2f: Season Results, Final Winner and Standings

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **work** (Sol Work mode, High; run every step without stopping. Moved from Codex 2026-10-04: Codex could not open its PR) | job 24: start from branch `gameplay/job-24-v10-foundation` (PR #349) now; the PR goes into recovery and becomes clean once 24 merges | `gameplay/job-29-v10-results` | `gameplay/recovery-v1` | one Work mode run |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `5e05a1f`): `season-results/`, `final-winner/` and `standings/`.
- App screens: `seasonEntry` and the season results / commit area, the final reconciliation / winner view, and Standings.

## Build

- **Skin only** on Season Results. Keep every id that `productionSharedSeasonResults.js` and `productionSharedSeasonCommit.js` use: the result fields, REVIEW / PUBLISH, `#sharedSeasonCommitAction`, `#sharedSeasonCommitStatus` (including the job 23 CHECK RESULTS warning text), and ACKNOWLEDGE. The 35-second review wait and the publish flow stay as they are.
- The **Final Winner** reveal shows `reconciliation.winner` exactly. Equal Showdown totals are a **DRAW** (Team V's draw state). Nik's league-position-then-league-points rule breaks ties **inside one season only**, and canonical scoring already applies it; the final view never adds a tiebreak. Never compute a different winner in the view. (Lead fix 2026-10-04 22:50 UTC, after the worker's correct BLOCKED question.)
- **Standings** reads the existing scoring and standings data. No new numbers.
- The top bar is locked (`reason: season-entry`) while a result is unpublished.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-season-final-contracts.cjs`: every id above survives mount; the winner shown equals `reconciliation.winner` for a playerOne win, a playerTwo win and a draw (equal totals); Standings rows equal the model; the clash warning text still reaches `#sharedSeasonCommitStatus`.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-29.md`, with the PR link and head SHA. The lead merges; you do not.
