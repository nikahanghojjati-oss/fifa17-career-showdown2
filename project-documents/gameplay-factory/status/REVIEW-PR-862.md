# Review PR #862 — JOB-1828 · Phone free-limit notice

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/862
Target: `gameplay/bug-list-1`; job-required predecessor: PR #842, commit `148a3fd1b177af643fefab9917b0dd6c9704bc45`.
Reviewed all **6** changed files in the PR diff. Direct comparison from the mandated JOB-1812 starting commit to this head changes exactly **3**: `js/homeScreensV10.js`, `css/homeV10.css`, and the new `tests/browser/free-limit-notice-layout-audit.cjs`.

| Check | Result | Evidence |
| --- | --- | --- |
| **A. Reproduced first** | **PASS** | PR Evidence gives unchanged JOB-1812 head `148a3fd` and audit `Before: 10 sizes; 10 failed; exit 1`; 393×852 failure includes `TRACKS centre hits appRuntimeNotice` and notice visible on Connect Players. |
| **B. Cause named** | **PASS** | Verified in JOB-1812 base: `js/homeScreensV10.js:134–136` has `if(root.getActiveScreenName?.()==="mainMenu")root.showAppNotice?.(message,"error",0);`; `css/app.css:199` has `#appRuntimeNotice{position:fixed;right:16px;bottom:45px;z-index:50;`; `js/connectPlayersScreenV10.js:164–168` routes to Home then opens the inert-backed layer. |
| **C. Test fails then passes** | **PASS** | New `tests/browser/free-limit-notice-layout-audit.cjs:1–121` covers ten sizes, hit targets, return/resume and notice visibility; PR body quotes `Before: 10 sizes; 10 failed` and `After: 10 sizes; 0 failed`. |
| **D. Only allowed files** | **PASS** | PR target diff has six paths: the three direct-job paths above plus `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, `tests/contracts/free-limit-home-message-contracts.cjs`, `tests/operations/pos20-control-plane.test.mjs`. A GitHub comparison `148a3fd...cf1ace2` confirms the latter three are inherited **unchanged** from the explicitly required JOB-1812 start, not newly changed by JOB-1828. |
| **E. No forbidden change** | **PASS** | Direct job delta changes only the named `#appRuntimeNotice[data-home-quota]` CSS selector (`css/homeV10.css:7`), `js/homeScreensV10.js:133–145,177–182` and a new browser audit; no direct edit to existing tests, startup/no-flash protections or forbidden paths, and no timer, interval, polling or storage added. Existing-test registration in the target diff belongs to PR #842. |
| **F. Logic is right** | **CAN'T TELL** | `js/homeScreensV10.js:133–145` gates quota placement by active Home and absence of inert, moves the existing notice into Home, removes it when inactive or resumed, and restores unrelated notices to body; shared/solo and partner ahead/behind do not affect that decision. The audit navigates away/back but has **no hard reload** or two-manager case, so persisted quota state after reload is unverified. |
| **G. Checks pasted** | **FAIL** | PR body includes PASS syntax, 192/192 contracts, 73 ops, budget, shared-history, layout, and `37,484` compressed startup; however standalone `reus-gate-startup-contracts.cjs:136` raises `AssertionError`, and CE2PG ends `FAIL ce2pg-3-1: 405/433 checks, 28 problem(s)`. Both are required checks. |

**Verdict: NEEDS FIX**

Notes (maximum five):
1. Resolve or explicitly route the failed Reus Gate frame assertion and 28 CE2PG failures before sign-off; their failures remain red even if outside this notice-only patch.
2. Add hard-reload coverage for the active free-limit notice; the current audit only checks screen leave/re-enter.
3. The job requires actual 393×852 before/after screenshots **in the PR body**, but it links only local `test-results/` paths and reports an upload authorization failure.
4. Keep PR #842 as an explicit dependency: target-branch diffs include its contract and registration files, but the JOB-1828 direct delta obeys the allowed-file scope.
5. Do not merge until the required checks and visual evidence are reviewed by Claude; this review did not rerun the browser suite.
