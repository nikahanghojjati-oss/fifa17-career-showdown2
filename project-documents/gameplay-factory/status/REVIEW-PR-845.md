# REVIEW PR #845 — JOB-1821
**Verdict: NEEDS FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR Before/Evidence: unchanged r75 shows `Season 1 of 5` instead of `Season 3 of 5`; inherited PR #843 startup: `37569 gzip` over budget. |
| B. Cause named and verified | PASS | r75 `js/menuExperience.js:181`: `const currentRound = Number(saved.currentRound) || 1;`; r75 `js/showdownUI.js:350-355` interpolates `currentShowdown.currentRound`. Both exist on base. |
| C. New test fails, then passes | PASS | Added `tests/contracts/shared-season-chip-contracts.cjs` (87 lines); PR says base 3/5 fail, corrected branch 5/5 pass. |
| D. Only allowed files | PASS | Seven changed; six biggest reviewed. `js/showdownUI.js`, `js/menuExperience.js`, permitted startup-comment/dead-code removals in `css/app.css` and `js/showdown.js`, new contract and two registration files fall within JOB-1821's instructions. |
| E. No forbidden change | PASS | No protected path changed. Selected patches show label logic, an explanatory CSS-comment deletion, unused initializers and registry additions; no existing assertion, visual rule, timer or online poll changed. |
| F. Logic is right | PASS | `js/showdownUI.js:9`: shared mode alone calls `resolveSeason`; menu falls back to local round/1. Contract exercises solo, missing module, repeated refresh and save immutability; PR reports 20/20 focused CE2PG checks after reload and both managers' ahead/behind cursor progression. |
| G. Checks pasted and PASS | FAIL | Syntax, contracts, ops, budgets, browser convergence and six startup checks report PASS; required CE2PG 3-season run explicitly reports `FAIL ce2pg-3-1: 408/433 checks, 25 problem(s)`. |

**Notes**
- Startup gzip is 37,397 (under JOB-1821's 37,400 target); the specific season-chip checks are green.
- Seven files changed, so only the six largest patches were examined; `js/showdown.js` is the seventh (one-line deletion, listed by the PR).
- Required complete CE2PG remains red: Standings, Rivalry, Champion, Trophy Room and Firestore Rules failures are enumerated in the PR.
- Needs the outstanding gameplay failures resolved and a passing required CE2PG run before READY FOR CLAUDE; do not change protected tests or merge this PR to bypass them.
