# SWEEP-JOB-1760 · Save Library runtime second half

Source: `JOB-1760.md` on `factory/gameplay-v1`. Re-read `js/saveLibraryRuntime.js` on `gameplay/bug-list-1`; the one SURE finding duplicates the older-snapshot save-switch race reported by JOB-1759.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Switching saved careers could replace a successful newer save with the older snapshot, making newer progress disappear on Continue. | `js/saveLibraryRuntime.js:432–452` -> `js/saveLibraryRuntime.js:433–453` | FIXED | `const raw=runtimeAuthorityRawSnapshot();` (434); `await runtimePrimeSeasonIdentities(prepared);` (438); `if(runtimeAuthorityRawSnapshot().saveLibrary!==raw.saveLibrary)throw new Error("Save Library changed in another tab or operation. Reload before writing again.");` (440). Before `runtimeCommitLibrary(next)` (445), stale saved-career snapshots now reject instead of overwriting newer progress. |

The report's adjacent method reviews did not identify additional SURE gameplay findings. No code changed by this sweep.

Still open: 0
