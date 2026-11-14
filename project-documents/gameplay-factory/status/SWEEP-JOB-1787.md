# SWEEP-JOB-1787 · Storage audit

Source: `status/JOB-1787.md` on `factory/gameplay-v1`. Checked against current `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A failed transfer draft save short-circuited a pending career save when the page closed, potentially losing career progress. | `js/storage.js:41` -> `js/storage.js:41` | FIXED | Current: `const currentFlushed=flushScheduledCurrentShowdownSave();return transferFlushed!==false&&currentFlushed!==false;` The career save is now attempted independently before combining results. |

Still open: 0
