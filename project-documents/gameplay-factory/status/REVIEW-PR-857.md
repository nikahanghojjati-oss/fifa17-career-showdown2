# REVIEW-PR-857 · JOB-1818
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/857
Reviewed head: `f9db71a7f99fbc713e948685818e5e6dbb241e87`
Unchanged base: `2f3865feca484223ac7d267d83a9c4828bad3078`
Job and card: `JOB-1818.md`, `CARD-HUNT-A08-1.md` on `factory/gameplay-v1`.
Scope: all 3 changed files reviewed; TEST ONLY draft.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | Body identifies the unchanged base and reports the new contract exiting 1: 14 tests, 8 pass, 6 fail, with shared credit, null reference and summary failures in Node/browser VM. |
| B. Cause named | FAIL | Body names both cause files but includes no line numbers or quoted base lines. Verified `js/sharedCareerAnalytics.js:140`: `if(biggestShowdownWin===null||margin>biggestShowdownWin.margin)biggestShowdownWin=win;`; `js/careerScreenSeam.js:75` concatenates `csNames[win.manager]+" by "+csNumber(win.margin)`. |
| C. Test fails then passes | FAIL | New `tests/contracts/sweep-biggest-showdown-tie-contracts.cjs:50-59` asserts shared credit, null single reference and “Shared · 1” in both history orders; body explicitly reports six failures after the change. Passing-after evidence is intentionally absent in this authorized TEST ONLY handoff. |
| D. Only allowed files | PASS | Changed files are the card's named new contract plus `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and `tests/operations/pos20-control-plane.test.mjs`, expressly required by JOB-1818 step 4. No runtime files changed. |
| E. No forbidden change | PASS | Existing operations test receives only the required registration constant/list append; prior entries/assertions remain intact. No forbidden path, online timer/poll, sessionStorage or look edits. |
| F. Logic is right | FAIL | No runtime fix is claimed or present. Two completed Showdowns, Daniel and Nik each winning by 1, still yield sole Daniel credit; reversing history yields Nik. Base analytics line 140 keeps the first equal-margin winner and seam line 75 prints it. Solo/reload/partner progression behavior is untouched; the new Node/VM checks correctly expose the history-order problem. |
| G. Checks pasted | FAIL | Body reports syntax 0 failures, operations 73/73 and presentation 159100 raw / 37484 compressed bytes, but contracts explicitly exit 1 in 1/192 contracts because the new regression remains red. |

**Verdict: NEEDS FIX**

Notes:
- Valid TEST ONLY delivery under JOB-1818 step 3: the card's complete fix spans two runtime files; do not expand this worker's scope to fix them.
- This draft is a failing-test handoff, not a merge-ready gameplay fix; later authorized integration must fix both paths and show the regression and full contracts passing.
- Add the verified cause line numbers and base-code quotes to the PR body.
- Controls cover a single winner, a uniquely larger win, equal maximum margins and the already-shared Trophy Room record.
- Review is by source and pasted output; no checks rerun.
