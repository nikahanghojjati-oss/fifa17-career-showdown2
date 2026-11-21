# SWEEP-JOB-1754 · Gameplay follow-up

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A stale Save Library restore could reject without writing but invalidate Save Library authority, leaving Continue unable to load the previous saved Showdown until reactivation. | `js/restore.js:338-350` -> `js/restore.js:344-362` | FIXED | `if(saveLibraryMode&&transaction&&(transaction.ok===true\|\|transaction.rollbackVerified===false)&&window.CareerModeSaveLibraryRuntime&&typeof window.CareerModeSaveLibraryRuntime.invalidateAuthority==="function")window.CareerModeSaveLibraryRuntime.invalidateAuthority();` (349); the early `transaction.failurePhase==="precondition"` return (350-359) now follows this guarded invalidation. `js/storageTransaction.js:57-61` yields `stale-precondition` without writing and `js/saveLibraryRuntime.js:178-181` confirms invalidation clears authority. |

Still open: 0
