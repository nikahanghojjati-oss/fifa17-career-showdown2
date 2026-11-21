# REVIEW-PR-852 · JOB-1826 — Cheaper waiting

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/852  
Verdict: **WRONG FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR **Evidence**: unchanged-base Home idle = 10.0 game reads/min and 171 Rules lookups/min; new contract fails 14 baseline scenarios. |
| B. Cause named and verified | PASS | Unchanged base `js/productionSharedSeasonResults.js:201-207` limits the wait key to visible `seasonEntry` and `pssrFastTick` still calls `void pssrTick(true)`; corresponding `js/productionSharedSeasonCommit.js:193-203` does likewise. |
| C. Test fails then passes | PASS | New `tests/contracts/waiting-reads-contracts.cjs`; PR **Evidence** gives baseline `healthy wait read 30 documents; maximum 10`, then `PASS waiting reads contracts`. |
| D. Only allowed files | PASS | Changed-file inventory: 7 lazy `js/productionShared*.js` modules, the new waiting-reads test and the 2 specified registration files; no out-of-scope path. |
| E. No forbidden change | PASS | Six largest of 10 files inspected; remaining paths are small production guard edits listed in the PR. No protected path, timer creation/shortening, sessionStorage, or visual source appears in the changed-file inventory. |
| F. Logic is right | FAIL | `js/productionSharedSeasonCommit.js` adds `psscWaitHealthy()` for **either** current `seasonResults` or `seasonCommits` listener; other independent 15-second refresh owners are then suppressed by this one boolean. The PR's own Cause table says `pmspRefreshNow` reads Setup, session and rivalry documents **without a listener**. If a partner advances the shared season cursor, changes a session or closes the rivalry without updating that watched old-season Results/Commit record, the other manager's Home/Standings can remain stale indefinitely; the test replaces background wake functions with a synthetic probe and never simulates a remote cursor advance/reload with a healthy old listener. |
| G. Checks pasted and PASS | FAIL | Although targeted contracts and history audit PASS, the required ordinary CE2PG run is `FAIL ce2pg-3-1: 405/433 checks, 28 problem(s)` and meter is `FAIL job1826-after-i3: 431/460`; the meter timing binding failures also limit later idle-counter evidence. |

Notes:
1. The immediate idle-read improvement is promising but does not justify suppressing refreshes whose authority is **not** covered by the watched listener.
2. Restrict suppression to the exact document(s) already observed, or add an authority-specific listener/backup for shared cursor, setup, session, rivalry and terminal changes.
3. Add a real partner-ahead/behind test, old-season listener after reload/navigation, and a remote shared-cursor move with the watched Results/Commit document unchanged.
4. Rerun the three-screen idle meter and multi-season CE2PG after the correction; clearly separate unrelated pre-existing CE2PG failures.
