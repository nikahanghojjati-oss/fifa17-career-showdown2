# REVIEW-PR-854 · JOB-1816 — r76 integration (do not merge)

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/854  
Verdict: **NEEDS FIX** (diagnostic draft; **do not merge**)

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR **Before** records unchanged r75 base `2f3865…` contract failure at `season-entry-no-flash-contracts.cjs:115`, `decoded before the reveal`; baseline CE2PG figures are also compared in **Evidence**. |
| B. Cause named and verified | CAN'T TELL | The PR quotes a **retained merged** `js/seasonFinalV10.js:1894` line `return {final:finalSeasonReview?{status:"unavailable"}:finalFrame(...)};`, plus route-audit expectations, but does not establish that this quote exists at the claimed location on the unchanged base. |
| C. Test fails then passes | FAIL | PR **After** explicitly says `No independent product fix or new test was written in this integration-only job`; no new integrated regression shows base FAIL → integration PASS. |
| D. Only allowed files | PASS | 120 changed paths (more than six): merged r76 source/test-registration/evidence files and `test-results/r76-integration/` reports/logs; consistent with JOB-1816's merges-plus-reports-only scope, with no standalone fix file. |
| E. No forbidden change | CAN'T TELL | No `index.html`, service worker, Rules, scripts, `.github/` or visual-assets files in the 120-path inventory. Only six biggest changed files could be reviewed (checks JSON; 3 CE2PG JSON reports; 1806/1807 contract logs); source changes inherited from nine PRs need separate scope inspection. |
| F. Logic is right | FAIL | `test-results/r76-integration/ce2pg-3-1.json`, `ce2pg-5-2.json`, `ce2pg-10-3.json` each report only 76/82 checks and fatal `locator.click: Timeout 30000ms exceeded`, stopping at season 1. Partner-ahead/behind, reload across later seasons, close and fresh-context correctness remain unproven; six first-season excursions fail. |
| G. Checks pasted and PASS | FAIL | PR reports `29/31` browser audits, six startup-size contract failures (`startup gzip 37569 must stay <= 37495`), and all three CE2PG runs failed; not all required checks show PASS. |

Notes:
1. Respect the explicit **DO NOT MERGE** label; this draft correctly surfaces unresolved r76 integration failures rather than providing a releasable fix.
2. Resolve JOB-1805 startup-size overflow and JOB-1811 non-additive `js/seasonFinalV10.js` conflict before another integrated run.
3. Investigate the two browser timeouts and six first-season excursion mismatches without loosening existing assertions; the base no-flash failure requires separate disposition.
4. CE2PG runs must reach all 3/5/10 seasons and terminal/reload checks before asserting integrated solo/shared, partner-ahead/behind or history correctness.
5. Read/write per-season measurement is unavailable in both this PR and JOB-1802 baseline; do not interpret missing counters as zero.
