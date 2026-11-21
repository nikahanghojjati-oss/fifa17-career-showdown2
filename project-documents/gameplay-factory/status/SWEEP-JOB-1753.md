# SWEEP-JOB-1753 · Gameplay follow-up

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Merge of a valid backup with malformed local history could report success but leave the history screen unable to load Showdown records (and still change active save/preferences). | `js/restore.js:56-63` -> `js/restore.js:56-64` | FIXED | `if(kind==="legacy"&&!Array.isArray(value))throw new Error("Legacy value is not an array.");` (60); `if(kind==="legacy"&&value.some(record=>!record\|\|typeof record!=="object"\|\|Array.isArray(record)))throw new Error("Legacy history contains an invalid record shape.");` (61). The added guard matches the history reader in `js/storage.js:51` and treats malformed history as corrupt before Merge writes. |

Still open: 0
