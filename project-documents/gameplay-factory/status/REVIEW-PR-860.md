# REVIEW-PR-860 · JOB-1818 Career Statistics and Trophy Room keep old online totals

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/860  
Verdict: **NEEDS FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR body: base contract exits 1; mounted `careerStatistics` and `trophyRoom` fail `cache publication must invalidate the mounted frame (3 -> 4)`. |
| B. Cause named | FAIL | PR Cause has no `file:line` or quoted base source. Actual base `js/careerScreensV10.js:1431-1436` subscribes to `"career-mode-online-identity-change"` but not `"career-mode-online-career-model-change"` (the card quotes it; PR body does not). |
| C. Test fails then passes | PASS | New `tests/contracts/sweep-online-career-live-refresh-contracts.cjs:50-102`; body gives base failure and `PASS online career live refresh contracts: 7 checks.` after. |
| D. Only allowed files | PASS | Four files: `js/careerScreensV10.js`, the new card-named contract, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and the required `tests/operations/pos20-control-plane.test.mjs` registration. |
| E. No forbidden change | PASS | Diff only adds six lazy screen-binder lines, new assertions and append-only test registrations; no existing assertions, startup, visuals, timers, storage or banned paths edited. |
| F. Logic is right | PASS | `js/careerScreensV10.js:1437-1442` updates mounted shared-model frames without a second provider read; guards solo/supplied-model and unrelated-account routes; identity reload retained, and fresh installs attach the listener. |
| G. Checks pasted | PASS | Body shows syntax `0 failures`, contracts `192/192`, ops `73 pass`, and startup `37484 compressed` (the initial missing dependency was installed and contracts subsequently passed). |

Notes:
- Update **Cause** in the PR body with the actual base `js/careerScreensV10.js:1431-1436` and a 1–5-line verbatim quotation; card reference alone does not satisfy B.
- The 3-to-4 title update is covered for both mounted screens and a mixed supplied/shared display.
- No screen pixels or live two-manager emulator journey were verified; the targeted VM contract is the required test for this card.
