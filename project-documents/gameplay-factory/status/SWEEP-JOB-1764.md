# SWEEP-JOB-1764 · Shared Transfer Challenge start retry audit

Checked source audit `JOB-1764.md` against `gameplay/bug-list-1` (current code). No code was changed.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| After START SHARED 15-MINUTE WINDOW was rejected, a refreshed `NOT_STARTED` state could falsely count as a successful start, leaving the manager on the unstarted window without the allowed retry. | `js/productionSharedTransferChallenge.js:124` -> `js/productionSharedTransferChallenge.js:124` (retry caller remains at `:144-151`) | **FIXED** | Old: `if(method==="startWindow")return true;`<br>Now: `if(method==="startWindow")return state.phase!=="NOT_STARTED";`<br>Retry: `if(attempt>0&&pstcOutcomeShown(method,current)){...return true;}` followed by the existing provider call when the refreshed window is still not started. |

`tests/contracts/chat-audit-shared-transfer-challenge-contracts.cjs:14-17` additionally checks `NOT_STARTED` is false and `WINDOW_OPEN` / `GUESS_ENTRY` are true; test was read, not run.

Still open: 0
