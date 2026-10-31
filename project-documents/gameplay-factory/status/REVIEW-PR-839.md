# Review PR 839 — JOB-1806 (BACK TO SHOWDOWN HOME routing)

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR body gives unchanged-base route `seasonEntry -> dashboard (expected mainMenu)` and four failing Home-button cases after visiting the dashboard. |
| B. Cause named and verified | PASS | PR quotes `js/screens.js:32-35` safe targets `["dashboard", "mainMenu"]`; those strings appear at the named lines on `gameplay/bug-list-1`. `js/screens.js:555-564` takes the most recent allowed history target first. |
| C. New test fails then passes | PASS | New `tests/browser/back-to-showdown-home-route-audit.cjs` reports FAIL for Season Results, Champion, Rivalry Statistics and Transfer Challenge on the base; the same four plus Career Statistics and plain BACK report PASS after the edit. |
| D. Only allowed files | PASS | Exactly `js/screens.js` (the routing code) and new `tests/browser/back-to-showdown-home-route-audit.cjs`; the job allows both and does not register a browser audit. |
| E. No forbidden change | PASS | Only three `SAFE_BACK_TARGETS` mappings changed in `js/screens.js:32-35`, with a new browser test; no existing test, visual resource, timer, storage API, or forbidden file changed. |
| F. Logic is right | FAIL | Restricting `transferChallenge`, `seasonEntry`, and `statistics` to `mainMenu` resolves the tested buttons across solo/shared, reload, and partner progress; however `js/screens.js:34` still gives `seasonSummary` `["dashboard", "mainMenu"]`, while `index.html` has a Season Summary button labeled `SHOWDOWN HOME`. Reproducible remaining input: visit dashboard, open Season Summary, press SHOWDOWN HOME; the smart-back loop can still choose dashboard. |
| G. Required checks pasted and PASS | FAIL | Syntax, contracts (191/191), ops (73), budget, startup, persistent-pair routing, and flash audit are PASS, but `tests/browser/stability-audit.cjs:180` still waits for dashboard after the Rivalry Statistics Home button and times out. Optional CE2PG was not completed (missing Firebase browser SDK). |

**Verdict: NEEDS FIX**

Notes:
- Resolve the Season Summary `SHOWDOWN HOME` route on the allowed routing surface if that button is intended to mean Home.
- The stability audit has a hard-coded dashboard expectation that contradicts this fix; update its expectation only through an explicitly authorized follow-on change, not by reversing the Home route.
- The optional full shared Showdown run remains unverified because the local Firebase browser SDK was missing.
- No PR comment, source-branch push, or merge performed.
