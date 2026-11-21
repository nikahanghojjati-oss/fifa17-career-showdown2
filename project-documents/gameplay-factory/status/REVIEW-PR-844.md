# Review PR 844 — JOB-1810 (Phone Trophy Room CAREER DETAILS)

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/844
Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`. Reviewed all 6 changed files (2 text diffs and 4 evidence PNGs).

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | PR body provides unchanged-r75 audit: `FAIL 393x660` and `FAIL 393x852: visible MORE label cannot open CAREER DETAILS`, with checkbox intercepting the click; desktop passes. |
| B. Cause named and verified on base | PASS | Base `js/careerScreensV10.js:764-765`: `.trophyPhoneMoreButton ... pointer-events:none;z-index:41` vs `.phoneMoreToggle ... pointer-events:auto!important;z-index:42!important`. The base `:777-783` already reveals existing rank and record content when checked. |
| C. New test fails then passes | PASS | Added `tests/browser/phone-trophy-room-data-audit.cjs`; PR body shows unchanged-base exit 1 with the two phone label timeouts and after-fix exit 0 with two ranks and five all-time records at 393x660 and 393x852. |
| D. Only permitted files | PASS | `js/careerScreensV10.js` (the allowed V10 glue), the required new browser audit, and four explicitly required before/after phone evidence PNGs under `project-documents/gameplay-factory/evidence/JOB-1810/`. No other changed files. |
| E. No forbidden change | PASS | Single existing named selector `#app #trophyRoom .trophyPhoneMoreButton` at `js/careerScreensV10.js:764` changes only `pointer-events:none→auto` and `z-index:41→43`; no forbidden file, existing-test edit, new online read, timer, sessionStorage, or visual dimension/colour/picture edit. |
| F. Logic is right | PASS | Base markup `js/careerScreensV10.js:1325` binds label `for="trophyPhoneMoreToggle"`; existing `:777-783` checked-state rules reveal sibling `#trophyRoomContent .careerRanks` and `.recordRibbon`. This input-independent hit-test change does not alter solo, reload, or partner-ahead/behind projections; the new audit verifies open/close/reopen with a completed two-player career and unchanged canonical storage. |
| G. Required checks pasted and PASS | FAIL | Syntax 354/354, contracts 191/191, ops 73/73, budget 16 checks, startup gate and screen-flash audit all report PASS, but the required `CE2PG_SEASONS=3` run reports `FAIL ce2pg-3-1: 446/469 checks, 23 problems` (exit 1). The 42/42 targeted Trophy Room history checks pass. |

**Verdict: NEEDS FIX**

Notes:
1. The phone MORE interaction defect and proposed one-selector fix are supported by unchanged-base source and the audit.
2. The full required CE2PG run is not green: 23 documented failures remain, largely in other Showdown screens (season tile, standings, rivalry, review-season, home routing, and Rules budget).
3. Before this PR can meet the r76 gate, the CE2PG failures must be resolved or explicitly dispositioned by release review; do not expand JOB-1810 into forbidden files.
4. No PR comment, PR-branch push, merge, or deployment performed.
