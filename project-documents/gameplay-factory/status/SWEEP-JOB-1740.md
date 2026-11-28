# SWEEP-JOB-1740 · Showdown Home audit

Compared `JOB-1740.md` on `factory/gameplay-v1` against the current `js/showdownUI.js` on `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| After loading an incomplete saved Season whose latest result lacks one manager, Showdown Home can fail to open while showing the two managers' latest league finishes | `js/showdownUI.js:353,368-369` -> `js/showdownUI.js:353-354,369-370` | FIXED — the latest Season is usable only when results exist for both managers; otherwise both finishes show the existing fallback | `const latestCompletedRound = latestRound && latestRound.playerOne && latestRound.playerTwo ? latestRound : null;` (line 354); ``setDashboardTextIfChanged(ui.lastPositionOne, latestCompletedRound ? `Last league finish: ${latestCompletedRound.playerOne.leaguePosition}` : "No season completed");`` (line 369); ``setDashboardTextIfChanged(ui.lastPositionTwo, latestCompletedRound ? `Last league finish: ${latestCompletedRound.playerTwo.leaguePosition}` : "No season completed");`` (line 370) |

The other files cited under coverage reviewed were not separate confirmed bugs. No visual-only findings. No code changed, and no tests were executed.

Still open: 0
