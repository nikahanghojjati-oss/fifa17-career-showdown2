# SWEEP-JOB-1766 · Shared season progression audit

Compared `JOB-1766.md` against current `gameplay/bug-list-1` (r75). Gameplay findings only.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Two overlapping Showdown refreshes could let an older accepted-season count and older shared points replace the newer view. | `js/productionSharedMultiSeasonProgression.js:143` (old refresh; view at 141) -> `js/productionSharedMultiSeasonProgression.js:153` (refresh; view at 141) | **FIXED** | Current line 153: `if(refreshPromise&&contextKey===request.key)return refreshPromise;contextKey=request.key;busy=true;const current=pmspRefreshNow(request)`. The Showdown key is assigned **before** starting the first read, so repeated refreshes share the pending promise. Current line 141 remains `view=result;contextKey=request.key;`, after that guard. |

Still open: 0
