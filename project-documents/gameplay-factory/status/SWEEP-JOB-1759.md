# SWEEP-JOB-1759 · Save Library runtime first-half

Source: `JOB-1759.md` on `factory/gameplay-v1`. Verified the single SURE gameplay finding against `gameplay/bug-list-1` (today's release code).

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| An older asynchronous career-selection operation could overwrite a newer saved career made while the selection awaited season identity preparation, making the newer Save Library state disappear. | `js/saveLibraryRuntime.js:278–299,433–450` -> `js/saveLibraryRuntime.js:278–299,433–453` | FIXED | `const raw=runtimeAuthorityRawSnapshot();` (434); `await runtimePrimeSeasonIdentities(prepared);` (438); `if(runtimeAuthorityRawSnapshot().saveLibrary!==raw.saveLibrary)throw new Error("Save Library changed in another tab or operation. Reload before writing again.");` (440). This checks the latest authority snapshot against the original before committing the selected saved career (445), so the stale selection is rejected instead of writing its old snapshot. |

Still open: 0
