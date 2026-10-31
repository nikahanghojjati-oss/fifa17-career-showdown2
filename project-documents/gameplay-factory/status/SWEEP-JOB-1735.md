# SWEEP-JOB-1735 · Transfer Challenge first-half audit

Source: `project-documents/gameplay-factory/status/JOB-1735.md` on `factory/gameplay-v1`.
Current game checked: `gameplay/bug-list-1`. The original report found **no confirmed player-facing bug**; the three risk areas below are rechecked, not new bug reports.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Two starts might create duplicate Transfer Windows. Original report found no duplicate-window issue. | `js/transferChallenge.js:355–365,404–437` -> `js/transferChallenge.js:364–374,413–446` | NOT A BUG | `if(challenge){ return challenge; }` (line 366); `if(challenge.status !== "not_started"){ return; }` (line 423). The same record is reused and cannot be started again. |
| The clock might freeze or ignore its real deadline after leaving the tab. Original report found no confirmed bug here. | `js/transferChallenge.js:368–475` -> `js/transferChallenge.js:377–383,449–485` | NOT A BUG | `const remainingSeconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;` (lines 479–482); `if(remainingSeconds <= 0){ finishTransferWindow(challenge, false); }` (line 484). It uses the saved deadline, not a count of timer ticks. The separate tab-return finding in JOB-1736 is checked in its own sweep. |
| Finishing a Transfer Window might advance the game even if saving fails. Original report found no confirmed issue. | `js/transferChallenge.js:489–529` -> `js/transferChallenge.js:509–538` | NOT A BUG | `if(!saveCurrentShowdown()){ restoreChallengeSnapshot(challenge, previous); currentShowdown.status = previousShowdownStatus; ... return false; }` (lines 522–533). An unsuccessful save restores the active Transfer Window. |

No additional confirmed gameplay findings, and no visual-only findings, were reported in JOB-1735.

Still open: 0
