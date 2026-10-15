# REVIEW-PR-858 · JOB-1818
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/858
Reviewed head: `66e6e0fb1a8233939aed8f1c555f10181e475caa`
Unchanged base: `2f3865feca484223ac7d267d83a9c4828bad3078`
Job and card: `JOB-1818.md`, `CARD-HUNT-A08-2.md` on `factory/gameplay-v1`.
Scope: all 3 changed files inspected; TEST ONLY draft.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR body identifies unchanged `gameplay/bug-list-1` base and shows `node tests/contracts/sweep-career-table-level-rank-contracts.cjs` exiting 1: `2 failed; 5 passed`; Node and browser VM report `2. Nik (level)` rather than `1. Nik (level)`. |
| B. Cause named | FAIL | Body names `csTrophySections` but gives neither file:line nor quoted base lines. Verified base `js/careerScreenSeam.js:85`: `label:(index+1)+". "+csNames[row.manager]+(row.level?" (level)":"")`. |
| C. Test fails then passes | FAIL | New `tests/contracts/sweep-career-table-level-rank-contracts.cjs:60-65` checks tied managers in Node and VM; PR remains TEST ONLY with two intentional failures and no after-fix PASS. |
| D. Only allowed files | PASS | Changes limited to new `tests/contracts/sweep-career-table-level-rank-contracts.cjs` and the exact two registrations required by JOB-1818 step 4: `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and `tests/operations/pos20-control-plane.test.mjs`. |
| E. No forbidden change | PASS | Existing operations test changes only the mandated registration constant/last list entry; no existing assertion was changed, no forbidden gameplay/visual/system path edited, no new online timer/poll or sessionStorage. |
| F. Logic is right | FAIL | No runtime fix: `js/careerScreenSeam.js:85` still prints position 2 for a second tied manager. `js/sharedCareerAnalytics.js:101-102` already marks both level, while `js/careerScreensV10.js:35-40` already assigns both #1. Tied 12-point, one-win managers remain wrong in fallback view; solo, reload and partner-position handling were not changed. |
| G. Checks pasted | FAIL | Body quotes syntax 352/0, operations 73/73 and presentation 159100 raw / 37484 compressed, but full `test:contracts` is not green: new regression fails and three existing browser contracts initially lacked `tar-fs`; targeted reruns after `npm ci` pass, not a complete green rerun. |

**Verdict: NEEDS FIX**

Notes:
- Authorized TEST ONLY handoff, not a ready-to-merge gameplay correction.
- Fix fallback `csTrophySections` to print rank 1 for level managers; preserve untied ordering and active Team V ranks.
- Existing seam contract `tests/contracts/career-screen-seam-contracts.cjs:125-127` expects the wrong second rank; update under separately authorized scope, not by overriding JOB-1818's existing-test ban.
- Add cause file:line and actual base quote to the PR body, and show red-before/green-after plus a clean full suite after the fix.
- Findings use source and pasted checks; tests were not rerun in this review.
