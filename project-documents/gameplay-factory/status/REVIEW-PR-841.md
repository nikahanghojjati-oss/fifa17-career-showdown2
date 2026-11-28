# Review PR #841 — JOB-1808
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/841
Base checked: `gameplay/bug-list-1` (r75). Changed files: 5; all five reviewed.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR Evidence on unchanged base: `Committed seasons: 2 / 5; cached History: 1 / 5`, `status:"loading"`, `Loading standings.`, and `Standings rows: 0`. |
| B. Cause named | PASS | Confirmed base `js/sharedActiveShowdownAdapter.js:33-35` rejects lagging cached History without recovery; base `js/sparkSharedMultiSeasonProgression.js:101` returns `state,dashboard` but drops the already-read `history`. |
| C. Test fails then passes | PASS | New `tests/contracts/standings-this-showdown-midway-contracts.cjs:47`: base assertion `0 !== 7`; fixed run reports 7 rows, correct scores, and active HEAD-TO-HEAD tab for both managers with lagging/missing History. |
| D. Only allowed files | PASS | Changed `js/sharedActiveShowdownAdapter.js`, `js/sparkSharedMultiSeasonProgression.js`, named new contract, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and required `tests/operations/pos20-control-plane.test.mjs` registration only. |
| E. No forbidden change | PASS | No forbidden sources/visuals/no-flash files, timers, Firestore polling, sessionStorage, or existing assertion changes; the existing operations test edit is only the expressly required contract registration. |
| F. Logic is right | FAIL | Standings fallback is appropriately bounded by accepted-seasons/revision/club checks, but publishing `multi.projection` into the shared adapter also changes `careerInput()` (`projection:COUNTED.includes(classification)?p:null`): PR admits eight *midway Career Statistics/Trophy Room* CE2PG failures where completed-only views now expose active-season counters/trophies. Solo/no-proof path and reload use existing fallback; partner timing remains bounded by latest progression snapshot. |
| G. Checks pasted | FAIL | Syntax, 192/192 contracts, 73/73 ops, budget, Reus, History Convergence and Multi Season browser audits show PASS, but required CE2PG 3-season run reports `FAIL ce2pg-3-1: 404/433 checks, 29 problem(s)`. |

**Verdict: NEEDS FIX**

## Notes
- Keep the verified in-progress projection available to THIS SHOWDOWN without changing completed-only Career Statistics and Trophy Room behavior; add a midway regression assertion for those consumers.
- Retest CE2PG; the eight newly disclosed midway career/trophy failures must be resolved or independently justified against the job's required semantics, not categorized as unrelated.
- Four midway Standings visits did pass with zero `Loading standings.` and correct seven-row scores; closed totals remained correct.
- No PR comment, branch mutation, merge, or gameplay source change was made by this review.
