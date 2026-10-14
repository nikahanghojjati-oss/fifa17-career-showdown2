# Review — PR 843 (JOB-1805)

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/843  
Base: `gameplay/bug-list-1` · Reviewed 5/5 changed files · Verdict: **NEEDS FIX**

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | **PASS** | PR **Before/Evidence** names base `2f3865f`; old tile actual “Nik vs Daniel · Season 1 of 5” versus expected “Season 3 of 5”. |
| B. Cause named and verified | **FAIL** | `js/menuExperience.js:181` quote `const currentRound = Number(saved.currentRound) || 1;` matches base; however PR claims header chip at `js/showdownUI.js:355` (blank on base), actually :356, and does not quote the offending Showdown UI source lines. Correct the citation and quote base :352/:356. |
| C. New test fails then passes | **PASS** | New `tests/contracts/shared-season-chip-contracts.cjs:1-87`; PR reports 3 failing cases on base, then 5/5 passing after. |
| D. Only allowed files | **PASS** | Diff includes `js/menuExperience.js`, `js/showdownUI.js`, new shared-season-chip test, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and registration-only `tests/operations/pos20-control-plane.test.mjs`: all explicitly allowed. |
| E. No forbidden change | **PASS** | Only 2 renderer changes and the permitted new test/registration; no protected file edited, no timer, poll, storage, styling, picture, or existing-test assertion change. |
| F. Logic right | **FAIL** | `js/menuExperience.js:181-183` falls back to stale saved round if the progression module is not yet loaded on reload. `js/productionSharedMultiSeasonProgression.js:168-180` can later resume authoritative season and emits `career-mode-shared-season-cursor-change`, but `js/menuExperience.js` has no listener; `js/screens.js:369-371` refreshes tile only on another Home entry. Example: reload on Home at local 1, then regain verified shared season 3 while staying on Home: tile remains “Season 1 of 5”. Solo fallback is correct; partner-ahead/behind cursor logic is delegated to verified `resolveSeason` (:46-49). |
| G. Checks pasted | **FAIL** | PR body pastes syntax PASS (352/0), ops PASS (73/73), but `npm run -s test:contracts` FAIL (186/192); six startup gzip budget contracts fail at 37,569 bytes versus 37,500 / 37,495 limits. |

**Verdict: NEEDS FIX**

Notes:
1. Reduce startup gzip footprint without weakening limits or touching forbidden files; rerun and paste all three green checks.
2. Repaint Home tile/chip when verified shared cursor resumes while Home is already open; extend new contract to cover this reload/late-authority case and partner-ahead/behind cases.
3. Correct PR body Showdown UI cause quote/line reference from :355 to :356.
4. `js/menuExperience.js` grows +230 source bytes per PR, while total startup gzip increases +85; no browser verification was provided.
5. No changes were made to the PR branch and nothing was merged.
