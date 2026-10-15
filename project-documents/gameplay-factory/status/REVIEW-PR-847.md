# Review PR 847 — JOB-1811

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/847
Verdict: **NEEDS FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | **PASS** | The PR body shows the unchanged-r75 VM contract failing: `live previous-season history must not suppress the completed read; 0 !== 1`. Baseline CE2PG did not reach final cells. |
| B. Cause named | **PASS** | The cited base `js/seasonFinalV10.js:1868` really reads `sfConverged=(history,rivalryId)=>...history.rivalryId===rivalryId&&history.projection`; `:1887` prefers that N−1 History. |
| C. New test fails then passes | **PASS** | New `tests/contracts/final-cells-late-data-contracts.cjs`; PR body reports unchanged-base exit 1 and corrected-source `PASS final-cells-late-data-contracts`. |
| D. Only allowed files | **PASS** | Five: `js/seasonFinalV10.js`, `tests/contracts/final-cells-late-data-contracts.cjs`, `project-documents/gameplay-factory/analysis/JOB-1811.md`, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, `tests/operations/pos20-control-plane.test.mjs`; all are fix, analysis, test, or specifically required test registration. |
| E. No forbidden change | **PASS** | Source diff changes only the History selector/comment; registration in the existing ops test is the job-required append, with no assertion removal. No forbidden file, visual change, online timer, shortened delay or sessionStorage change. |
| F. Logic is right | **FAIL** | `js/seasonFinalV10.js:1869,1888` now checks `closedHistoryBound(p,closed.terminalWitness)`, but base `:17–20` does **not** compare `acceptedRevisionKey` or `managerRecords.totalPoints` to the terminal witness. A full, self-consistent same-rivalry History with N accepted seasons but an older/different last-season revision still suppresses `sfClosedHistory`; `finalFrame` can reject mismatched totals or render wrong final-season details if totals coincide. N−1, reload, and solo/non-closed routing are otherwise handled. |
| G. Checks pasted and PASS | **FAIL** | Syntax, contracts, ops, budgets, startup, both required targeted browser audits are pasted as PASS; all four required post-fix CE2PG runs exit 1 (`405/433`, `404/433`, `425/451`, `518/557`). The 32 scoped final-data checks pass but the full checks are not green. |

Notes:
- Bind preferred live/retained History to the terminal witness's exact accepted revision and canonical totals before suppressing the completed reader; add a mismatched-but-valid complete-History regression case.
- The documented baseline CE2PG attempts stopped in private-session at season 0, so the before/after Champion frequency cannot be established from those journeys.
- Resolve or explicitly gate the four failing CE2PG checks with the owner of the independent r76 gameplay/Rules failures before readiness; do not alter forbidden Rules or other screen files in this PR.
- No PR comment, branch push, or merge performed.
