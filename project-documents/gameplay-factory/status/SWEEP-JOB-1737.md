# SWEEP-JOB-1737 · Statistics audit

Compared `JOB-1737.md` on `factory/gameplay-v1` with `gameplay/bug-list-1` (`js/statistics.js`). The original audit established **no SURE gameplay finding**; these are its three risk checks, not new confirmed bugs.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Season winner caption might say Draw when the managers tie, even though the winner is decided by season tiebreaks | `js/statistics.js:468-471` -> `js/statistics.js:468-471` | NOT A BUG — the caption reads the already-calculated season winner; no incorrect caption was established | ``if(row.winner === "playerOne"){ return `${analytics.playerOne.name} won`; }``; ``if(row.winner === "playerTwo"){ return `${analytics.playerTwo.name} won`; }``; `return "Draw";` |
| Rivalry totals might count a Season twice | `js/statistics.js:532-547` -> `js/statistics.js:532-547` | NOT A BUG — one Season is one row, while manager-owned points and trophies are summed across the two managers | ``createAnalyticsStat("SEASONS COMPLETED", analytics.seasonRows.length, `of ${analytics.showdown.totalRounds}`)``; `createAnalyticsStat("TROPHIES WON", one.totalTrophies + two.totalTrophies)` |
| Career/rivalry counts might be stale after visiting again | `js/statistics.js:135-156,365-390,551-573` -> `js/statistics.js:135-156,365-390,551-573` | NOT A BUG (no established broken behavior) — cached rendering is keyed to saved career revision or current Showdown identity, update time, state and Season count; a saved game update without any key change plus a stale screen reproduction would establish a bug | `currentShowdown.updatedAt || ""`; `Array.isArray(currentShowdown.rounds) ? currentShowdown.rounds.length : 0`; `const nextKey = getCareerStatisticsRenderKey();` |

The report found zero confirmed player-facing bugs; no visual-only findings. No code changed, and no tests were executed.

Still open: 0
