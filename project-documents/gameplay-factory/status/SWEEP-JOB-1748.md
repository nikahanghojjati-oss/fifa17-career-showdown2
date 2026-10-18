# SWEEP-JOB-1748 · Import Analysis (lines 1–470)

Source: `project-documents/gameplay-factory/status/JOB-1748.md` on `factory/gameplay-v1`.
Current gameplay file checked on `gameplay/bug-list-1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A current-schema career backup could accept invalid manager scores (`null`, `""`, `"0"`, `false`) and offer to restore wrong season totals. | `js/importAnalysis.js:201-203,224` -> `js/importAnalysis.js:201-203,224` | FIXED | Current line 202: `return typeof value === "number" && Number.isFinite(value);` Current line 224: `if(!isPlainImportObject(showdown.score) \|\| !isFiniteNumber(showdown.score.playerOne) \|\| !isFiniteNumber(showdown.score.playerTwo)){ errors.push("Showdown score is invalid."); }` The old `Number.isFinite(Number(value))` coercion has been removed. |

Still open: 0
