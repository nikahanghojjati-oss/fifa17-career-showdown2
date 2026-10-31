# REVIEW PR #846 — JOB-1809
**Verdict: NEEDS FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR Evidence shows new contract run on unchanged r75: `mid-Showdown daniel: status=loading`, followed by `'loading' !== 'ready'`; starting JOB-1808 branch also fails after close (`'empty' !== 'ready'`). |
| B. Cause named and verified | PASS | r75 `js/careerScreensV10.js:1337`: `!root.currentShowdown` (but `js/showdown.js:1` has `let currentShowdown=null`); r75 `js/statistics.js:623`: `if(!suppliesModel && !currentShowdown){ return; }`; r75 `js/rivalryLegacyV10.js:252-255` returns only `active.rivalry`. |
| C. New test fails, then passes | PASS | New `tests/contracts/rivalry-statistics-load-contracts.cjs` (78 lines) fails on unchanged base and on inherited #841, then reports PASS for both managers, 2-season live and 3-season closed states; targeted Chromium 8/8. |
| D. Only allowed files | PASS | Nine changed; six biggest reviewed. JOB-1809 explicitly starts from JOB-1808 (#841); inherited `js/sharedActiveShowdownAdapter.js`, `js/sparkSharedMultiSeasonProgression.js`, and `tests/contracts/standings-this-showdown-midway-contracts.cjs` come from that starting work. Own changes use permitted JS, new contract and registration files. |
| E. No forbidden change | PASS | Changed-file inventory has no prohibited paths; reviewed patches only add a read-only completed-career path, the isolated live adapter inheritance and test registrations. Existing test assertions, frozen visuals, new online timers/polls and sessionStorage are absent in reviewed changes. |
| F. Logic is right | FAIL | Solo counterexample: Career Statistics eligibility described in PR uses `currentShowdown` without a `sharedJourney.mode` check; a solo local Showdown can expose CURRENT RIVALRY STATISTICS, but `js/rivalryLegacyV10.js:208-213` requires a connected online account or returns `UNAVAILABLE`. The new contract has no solo/no-shared-journey case. Shared 2-season/closed snapshots pass, but solo routing remains incorrect. |
| G. Checks pasted and PASS | FAIL | Syntax, contracts, ops, budgets, startup gzip and history browser audit report PASS, but CE2PG exits 1 before gameplay: `ENOENT ... node_modules/firebase/firebase-app.js`; no full 3-season Rivalry Statistics proof. |

**Notes**
- PR #846 changes nine files; six largest were reviewed, and three inherited files rely on still-unmerged PR #841.
- Fix solo eligibility or provide a functioning solo Rivalry Statistics source so the visible button cannot open unavailable shared records.
- Re-run and paste a passing CE2PG 3-season output once its local Firebase SDK bundle is available; current 8/8 browser checks use controlled snapshots, not the full shared Showdown.
- Leave frozen screens and all protected checks untouched; PR must not merge before prerequisites are verified.
