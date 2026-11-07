# SWEEP-JOB-1771 — Save Library Foundation

Source: `JOB-1771.md` on `factory/gameplay-v1`; checked current gameplay on `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A previously saved career with an object-valued `rounds` field could silently lose its prior Seasons when Save Library migration substituted an empty list. | `js/saveLibraryFoundation.js:83` -> `js/saveLibraryFoundation.js:83-86` | FIXED | Current lines 83–85: `if(showdown.rounds != null && !Array.isArray(showdown.rounds)){` / `throw new Error("Season 1 is not a valid record.");` / `}`. The guard rejects malformed present Season records before the old empty-list fallback at line 86. Missing/null rounds remain allowed. |

Still open: 0
