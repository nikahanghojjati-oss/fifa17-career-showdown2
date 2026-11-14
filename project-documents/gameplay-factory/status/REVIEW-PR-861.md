# REVIEW-PR-861 · JOB-1827 Waiting continuity outside the watched document

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/861  
Verdict: **NEEDS FIX**

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR body: `JOB-1826: 60 failing scenarios`, including `FAIL mainMenu/progression/results/live: partner progression update missed r75 deadline 3000 ms (actual null)`; r75 control passes. |
| B. Cause named | FAIL | Body correctly quotes `psscWaitHealthy()` at `js/productionSharedSeasonCommit.js:194` on the JOB-1826 head, but that line is **not on this PR's target base**, `gameplay/bug-list-1`; the quote describes the stacked parent, not target-base code. |
| C. Test fails then passes | PASS | New `tests/contracts/waiting-continuity-contracts.cjs`; body reports 60 failures on unchanged JOB-1826 and `PASS waiting continuity contracts` after the fix, including reloaded VM cases. |
| D. Only allowed files | FAIL | 12 changed files; the extra `tests/contracts/waiting-reads-contracts.cjs` comes from the stacked JOB-1826 parent and is not the JOB-1827 new test or a permitted registration file. |
| E. No forbidden change | PASS | Changed-file names show no banned startup/visual/Rules/fixture/script paths; `waiting-reads-contracts.cjs` is added rather than an existing test loosened, and control-plane changes append registrations. No new online polling timer is shown in the six reviewed patches. |
| F. Logic is right | CAN'T TELL | `js/productionSharedSeasonCommit.js:196-247` adds coverage for root, setup, session and season commits and fails open to existing refresh on unconfirmed listeners; tests use fixture screens and fake Firestore. Solo/no shared journey and a real partner ahead/behind across reload are not demonstrated in the failed browser journey. A transient setup without a valid `totalSeasons` silently omits season-commit listeners at `psscWaitContext` and needs proof of fallback. |
| G. Checks pasted | FAIL | Final contract census `192/193` (unchanged `season-entry-no-flash-contracts.cjs:115` failed), while CE2PG 3/5-season runs and the i3 meter exited before gameplay on missing `firebase/firebase-app.js`; other pasted syntax, ops, budget, startup and History checks passed. |

Notes:
- The PR has 12 files: reviewed the six largest patches only (`waiting-continuity-contracts.cjs`, `waiting-reads-contracts.cjs`, `productionSharedSeasonCommit.js`, `pos20-control-plane.test.mjs`, `productionSharedSeasonResults.js`, `productionSharedCanonicalScoring.js`).
- Split/integrate the JOB-1826 parent so the target-base diff contains only JOB-1827's permitted files and its cause can be checked against the correct base.
- Restore a clean passing final contract census without changing the protected no-flash test.
- Supply successful CE2PG 3/5-season and i3 meter evidence (or documented out-of-scope dependency blocker); the current zero-read claim is VM-only.
- Do not merge until real shared Showdown season advancement, reconnection and online budget are validated.
