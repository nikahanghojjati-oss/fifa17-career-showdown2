# SWEEP-JOB-1736 · Transfer Challenge second-half audit

Source: `project-documents/gameplay-factory/status/JOB-1736.md` on `factory/gameplay-v1`.
Current game checked: `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| After the game tab is hidden and its Transfer Window timer stops, returning to the same tab used to leave the timer frozen; an expired window would not enter Guess Entry until another navigation or refresh. | `js/transferChallenge.js:307–319,464–468` -> `js/transferChallenge.js:300–307,449–455,465–484` | FIXED | Today's initializer installs a single tab-return listener: `document.addEventListener("visibilitychange", () => {` (line 302); `if(challenge && challenge.status === "active"){ startTransferTimerLoop(); }` (line 305). The restarted loop immediately calls `updateTransferTimer();` (line 452); expiry calls `if(remainingSeconds <= 0){ finishTransferWindow(challenge, false); }` (line 484), moving the game into Guess Entry through its existing saving path. |

The previously quoted hidden-tab stop remains in today's timer (lines 465–469), but the missing tab-return restart is now present. The report's additional paths for failed saves, guesses, signings and verdicts did not identify another confirmed bug. No visual-only findings.

Still open: 0
