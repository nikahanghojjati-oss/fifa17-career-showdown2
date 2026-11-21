# Review PR #850 — JOB-1818

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/850  
Job: `project-documents/gameplay-factory/jobs/JOB-1818.md`  
Card: `project-documents/gameplay-factory/status/CARD-SWEEP-JOB-1782-1.md`  
Base: `gameplay/bug-list-1`  
Files reviewed: 4/4.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | **PASS** | PR body: “New browser-mode vm/Firestore-store regression failed on the base, exit 1: `playerOne must read identical reordered scores: SEASON_COMMIT_RESULTS_REVISION_MISMATCH`.” |
| B. Cause named with verified base quote | **FAIL** | PR **Cause** names `js/sparkSharedSeasonCommit.js` and describes `JSON.stringify`, but lacks a **base line number and verbatim original line**. Confirmed base `js/sparkSharedSeasonCommit.js:81`: `if(JSON.stringify(value.results)!==JSON.stringify(ready.results))scpFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");`. Add file:line and quote to body. |
| C. New test fails, then passes | **PASS** | New `tests/contracts/sweep-season-score-key-order-contracts.cjs:1-83` validates reorder for both managers, rival acknowledgement, and real-score drift rejection. PR Evidence lists failing base exit 1 and fixed “PASS Season score key order”. |
| D. Only allowed files | **PASS** | Four: card-approved `js/sparkSharedSeasonCommit.js`, new `tests/contracts/sweep-season-score-key-order-contracts.cjs`, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and additive registry entry in `tests/operations/pos20-control-plane.test.mjs` explicitly required by JOB-1818 step 4. |
| E. No forbidden change | **PASS** | One-line provider substitution at `js/sparkSharedSeasonCommit.js:81`, with new contract and additive registry entries only; no existing assertions changed and no forbidden screen, Rules, fixture, timer, sessionStorage or appearance edits. |
| F. Logic right | **PASS** | `scpCanonical` at `js/sparkSharedSeasonCommit.js:29` recursively sorts plain object keys; its use at line 81 ignores reordered scores on reload but still rejects `leaguePoints:100→99`. Both roles and rival acknowledgement tested; existing provider authority/season checks still gate solo/no-shared-journey and partner ahead/behind cases. No wrong-result input identified for the card's ordinary stored score objects; broader browser integration not proven. |
| G. Checks pasted and PASS | **FAIL** | Syntax `352 active source files, 0 failures`, operations `73 pass`, direct selected-contract runner `192/192`, startup `37484 compressed` are quoted; however PR's **Not done / unsure** says the required **`npm run -s test:contracts` wrapper exited 1** with an incomplete log. The direct runner PASS does not establish PASS for that named required check. |

**Verdict: NEEDS FIX**

Notes:
1. In PR #850's **Cause**, quote verified base `js/sparkSharedSeasonCommit.js:81` with its original insertion-order-sensitive comparison.
2. Run the mandated `npm run -s test:contracts` to a conclusive passing result and paste its last PASS line; if it still exits 1, retain the complete first failure and fix the check failure before claiming PASS.
3. The source change itself matches the card's one-line fix; no further code change is indicated by the inspected diff.
4. Review only; no PR comment, merge, or PR-branch push.
