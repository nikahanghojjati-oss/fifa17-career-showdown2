# SWEEP-JOB-1749 · Import analysis audit

Current gameplay branch: `gameplay/bug-list-1`. Original report: `JOB-1749.md`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A finished analysis of backup A could appear beneath backup B or after Clear Preview; a delayed error could reference a cleared filename. | `js/importAnalysis.js:896-920` -> `js/importAnalysis.js:896-925` | **FIXED** | `const analyzedFile = selectedImportFile;` (898); `const analysis = await analyzeCareerModeBackupFile(analyzedFile);` (905); `if(selectedImportFile !== analyzedFile){ return; }` (906 and again 913 in error handler). The error uses `analyzedFile.name` (915), avoiding the cleared current selection. |

Still open: 0
