# Review PR #849 — JOB-1818

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/849  
Job: `project-documents/gameplay-factory/jobs/JOB-1818.md`  
Card: `project-documents/gameplay-factory/status/CARD-SWEEP-JOB-1780-1.md`  
Base: `gameplay/bug-list-1`  
Files reviewed: 4/4.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | **PASS** | PR body: “Before (exit 1): all eight at/after-expiry read/publish requests across both roles returned `ok:true`”; failing assertion names a read at expiry. |
| B. Cause named with verified base quote | **FAIL** | The cause paragraph gives the function and `js/sparkSharedSeasonResults.js`, but **no base file:line or exact quoted base line**. Confirmed base `js/sparkSharedSeasonResults.js:63` ends the guard with `!Number.isFinite(expires))`, with no `now>=expires`. Add that location and original quote to the PR body. |
| C. New test fails, then passes | **PASS** | New `tests/contracts/sweep-expired-season-results-contracts.cjs:65-105` covers both managers, reads/publishes and document non-mutation. PR evidence states baseline exit 1, fixed exit 0: “PASS Expired Season Results session”. |
| D. Only allowed files | **PASS** | Four files: `js/sparkSharedSeasonResults.js` (card's sole source file); new `tests/contracts/sweep-expired-season-results-contracts.cjs`; `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`; and additive test registration in `tests/operations/pos20-control-plane.test.mjs`, as JOB-1818 step 4 requires. No others. |
| E. No forbidden change | **PASS** | Provider diff is one added condition at `js/sparkSharedSeasonResults.js:63`; registry adds a constant/list entry only; no existing assertions replaced, protected files, polling, sessionStorage or appearance changes. |
| F. Logic right | **PASS** | `js/sparkSharedSeasonResults.js:63` now checks `now>=expires` before shared Results read/publish: valid session at `expires-1` works, reload at/after expiry denies, both roles use the same guard. Solo/no-shared-session path does not acquire authority; partner ahead/behind does not bypass expiry. No wrong-result input identified in the card's scope; no browser journey claimed. |
| G. Checks pasted and PASS | **PASS** | PR Evidence includes syntax `352 active source files, 0 failures`, contracts `192/192`, operations `73 pass / 0 fail`, startup `37484 compressed` (below 37495), and new test PASS. |

**Verdict: NEEDS FIX**

Notes:
1. Amend **Cause** in PR #849 with verified base `js/sparkSharedSeasonResults.js:60-64` and the exact former `if(...||!Number.isFinite(expires))` line (or a sufficient exact excerpt).
2. The fix and regression logic are otherwise consistent with the assigned expired-session card; do not change source or tests merely to satisfy this documentation requirement.
3. Review only; no PR comment, merge, or PR-branch push.
