# SWEEP-JOB-1751 · Transfer Challenge countdown on blocked navigation

Current gameplay branch: `gameplay/bug-list-1`. Original report: `JOB-1751.md`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| When a showdown save fails on leaving Transfer Challenge, the screen remains open but the countdown stops updating even though the deadline keeps moving. | `js/screens.js:342-353` -> `js/screens.js:343-352` | **FIXED** | `if(flushed === false){ return false; }` (345-347) now precedes `if(currentScreen === "transferChallenge" && typeof window.stopTransferTimerLoop === "function"){` (350) and `window.stopTransferTimerLoop();` (351). Failed saves exit without stopping the timer. The transfer draft's own failed save also returns earlier (at 333-339). |

Still open: 0
