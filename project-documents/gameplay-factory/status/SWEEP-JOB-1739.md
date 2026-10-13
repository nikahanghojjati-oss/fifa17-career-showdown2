# SWEEP-JOB-1739 · Season winner scoring

Compared `JOB-1739.md` on `factory/gameplay-v1` against the current `js/scoring.js` on `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| When two managers have equal Showdown scores, saved numeric-text league positions and league points can be compared alphabetically, wrongly awarding the Season to position "10" over "2" or "99" points over "100" | `js/scoring.js:50-62` -> `js/scoring.js:50-62` | FIXED — all four position/point tiebreak comparisons now convert both sides to numbers | `if(Number(playerOne.leaguePosition) < Number(playerTwo.leaguePosition)){` (line 50); `if(Number(playerTwo.leaguePosition) < Number(playerOne.leaguePosition)){` (line 54); `if(Number(playerOne.leaguePoints) > Number(playerTwo.leaguePoints)){` (line 58); `if(Number(playerTwo.leaguePoints) > Number(playerOne.leaguePoints)){` (line 62) |

No visual-only findings. No code changed, and no tests were executed.

Still open: 0
