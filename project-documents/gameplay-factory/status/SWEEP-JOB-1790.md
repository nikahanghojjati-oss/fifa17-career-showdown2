# SWEEP-JOB-1790 — Diagnostics second-half audit

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| In-game asset integrity check falsely accepts a version such as `1.9.1-r720` when `1.9.1-r72` is expected, hiding stale scripts or styles | `js/diagnostics.js:251-254,343-350` -> `js/diagnostics.js:240-242,257,353` | FIXED | Today's `gameplay/bug-list-1` code has `const match = /[?&]v=([^&#]*)/.exec(String(value || ""));` and `return Boolean(match) && match[1] === expected;` (lines 241–242). The stylesheet check calls `hasExactAssetRevision(href, expected)` (257), and local assets use `if(!hasExactAssetRevision(value, expected)){` (353). |

Still open: 0
