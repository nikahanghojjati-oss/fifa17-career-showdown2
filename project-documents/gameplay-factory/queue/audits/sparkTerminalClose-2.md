# sparkTerminalClose.js audit, second half (lines 30-58)

no findings

Riskiest places checked:
1. Line 43 and 51 (replay branch when the rivalry is already closed): the witness is compared with `sameWitness` and a missing `closedSessionRevision` fails closed. A repeated tap returns the stored result instead of closing twice.
2. Line 46 (season advance): `acceptedThroughSeason + 1` and the `managerTotals` sums are built from the prior progress, so a retried season is not added twice once the progress write commits.
3. Line 56 (`stcClose` loop): the step bound is `totalSeasons`, and a not-done loop after the last step fails with TERMINAL_CLOSE_PROGRESS_STALLED instead of hanging.
