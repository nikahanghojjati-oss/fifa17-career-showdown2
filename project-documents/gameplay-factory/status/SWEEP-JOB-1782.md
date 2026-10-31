# SWEEP-JOB-1782 · Shared Season Commit

Checked against `gameplay/bug-list-1` (release r75), 2026-10-13.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Season save/reload or acknowledgement can reject unchanged shared scores when the saved score maps have reordered keys. | `js/sparkSharedSeasonCommit.js:81` -> `js/sparkSharedSeasonCommit.js:81` | **STILL OPEN** | Current line 81 is still `if(JSON.stringify(value.results)!==JSON.stringify(ready.results))scpFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");`. Existing order-independent `scpCanonical(value)` at line 29 is not used for this comparison; the saved score map can match semantically but fail the string-order check. |

Still open: 1
