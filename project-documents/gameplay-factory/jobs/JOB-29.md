# JOB-29 · G-13 part 2f: Season Results, Final Winner and Standings

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **codex** (Nik pastes the lead's box into the Codex app; the lead checks in a browser and merges) | job 24 merged | `gameplay/job-29-v10-results` | `gameplay/recovery-v1` | one Codex task |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `5e05a1f`): `season-results/`, `final-winner/` and `standings/`.
- App screens: `seasonEntry` and the season results / commit area, the final reconciliation / winner view, and Standings.

## Build

- **Skin only** on Season Results. Keep every id that `productionSharedSeasonResults.js` and `productionSharedSeasonCommit.js` use: the result fields, REVIEW / PUBLISH, `#sharedSeasonCommitAction`, `#sharedSeasonCommitStatus` (including the job 23 CHECK RESULTS warning text), and ACKNOWLEDGE. The 35-second review wait and the publish flow stay as they are.
- The **Final Winner** reveal shows the winner from the final reconciliation exactly. For ties, use league position, then league points (Nik's rule). Never compute a different winner in the view.
- **Standings** reads the existing scoring and standings data. No new numbers.
- The top bar is locked (`reason: season-entry`) while a result is unpublished.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-season-final-contracts.cjs`: every id above survives mount; the winner shown equals the reconciliation winner for the tiebreak fixtures; Standings rows equal the model; the clash warning text still reaches `#sharedSeasonCommitStatus`.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-29.md`, with the PR link and head SHA. The lead merges; you do not.
