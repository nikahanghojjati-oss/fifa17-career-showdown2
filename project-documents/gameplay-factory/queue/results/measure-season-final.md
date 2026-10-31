# JOB-1585 — season-final measurements

Measured application commit `fae4d9c7c3b5e93697f000355f8fa9b87f04f893` from `gameplay/bug-list-1` with Chromium 149.0.7827.0. 437 screen-state/window measurements across 10 exact CSS-pixel viewports. Report only; no game file or existing audit changed.

Delivery combines the ten-size browser pass with a clean 360x640 repeat after refreshing the Terminal Close panel nodes. The repeat replaces that viewport in full; no states are counted twice.

## Most important five

1. **Terminal Close recovery controls:** outside the first screenful or an ancestor scrollport at 360x640, 844x390, 932x430, 1280x650. Example 360x640, Terminal-failed, `#sharedTerminalCloseAction`: top 559.8, bottom 603.8, window height 640; clipped by `#seasonEntry > div:nth-of-type(2)`.
2. **Publish/commit from Season Results review:** outside the first screenful or an ancestor scrollport at 360x640, 390x844, 844x390, 932x430, 768x1024. Example 360x640, Results-Daniel-review, `#confirmSeasonCompletion`: top 901.5, bottom 945.5, window height 640; clipped by `#app > main:nth-of-type(1)`.
3. **Touch controls below 44 px:** undersized hit areas at 932x430. Example 932x430, Results-Daniel-entry, `#p1LeaguePosition`: target=84x36; control=#p1LeaguePosition.
4. **Exit from Final Winner:** outside the first screenful or an ancestor scrollport at 360x640. Example 360x640, Final-playerOne-pending, `#seasonEntry .seasonEntryActions [data-smart-back]`: top 609, bottom 653, window height 640; clipped by `#seasonEntry > div:nth-of-type(2)`.
5. **Continue from legacy Season Summary:** outside the first screenful or an ancestor scrollport at 360x640, 390x844, 430x932, 844x390, 932x430, 1280x650, 1366x768. Example 360x640, Legacy-season-summary, `#nextSeasonAction`: top 980.13, bottom 1032.13, window height 640; clipped by `#app > main:nth-of-type(1)`.

## Method and coverage

- Reuses the real startup, controlled provider read/publish, private-manager entry, review fingerprint error and normal route opener from `tests/browser/shared-season-results-audit.cjs`. Loads the actual season/final binder and production Terminal Close adapter. History, final witness and career totals use the existing protocol builders, following `tests/browser/shared-final-reconciliation-audit.cjs`; Standings opens through its registered navigation route. The legacy summary uses its real renderer and normal route with a completed one-season fixture.
- Results: Daniel and Nik entry, review, changed-after-review error, privately published/waiting, and both-published/commit-waiting states; scoring sheet wherever its phone opener is displayed. Final Winner: Daniel win, Nik win and draw, each pending, failed-save presentation, closed and partial history; honours and history-coverage sheet wherever the responsive controls are displayed. Terminal Close: blocked, saving, rejected close, ambiguous network response/recovery and verified closed states, including the real Close and Retry buttons. Standings: This Showdown and Career, each ready, partial career coverage, empty, loading and unavailable. Its partial This Showdown case retains acknowledged ready rivalry data; the partial coverage applies to Career.
- These are controlled browser fixtures, not production account/device or network evidence. Final failed-save presentation is supplemented by the separately measured real Terminal Close failure/retry panel. The live Final Reconciliation proof panel is not measured: attempting to refresh that adapter while swapping synthetic snapshots wakes unrelated startup Terminal Close authority and fails the exact account guard. Its final visual instead uses protocol-built snapshots, as the existing audits do at provider boundaries. Completed local Season Summary is measured separately from the shared Season Results flow. Arbitrary historic saves, every numeric input combination, real Firebase authentication/network timing, commit/acknowledgement in-flight and canonical scoring progression are not claimed.
- Viewports are desktop-browser windows at DPR 1 with reduced motion, so landscape widths remain exact (no mobile viewport emulation or browser chrome). Touch checks run for 360, 390, 430, 768, 844 and 932 px widths. Visible labelled checkbox/radio hit areas are measured instead of only the drawn checkbox; visible labels for CSS-only tabs/sheets and disabled controls are included. Target below 44 means either dimension is strictly under 44 CSS px.
- Background interval polling is disabled in these static fixtures; explicit refresh calls and event/timeout-driven controls still use the actual adapters. Each measurement resets page and main screen scroll offsets to zero after fonts/images and entrance motion settle. The first-screenful check requires the entire primary action to fit both the window and every clipping/scrolling ancestor. This describes its initial position; content in an `auto`/`scroll` container may be reachable by scrolling. It does not prove permanence of a crop or absence of overlap. Standings has scope tabs and no primary CTA; coverage sheets have no button CTA, so those action rows are N/A.
- Horizontal scrollbar means document width exceeds client width and document overflow permits horizontal scrolling. The app normally sets overflow-x:hidden; a negative scrollbar result does not prove foreground content fits. Element-width checks allow 1 CSS px for fractional geometry. Text-width checks use scrollWidth > clientWidth on visible elements with direct text. Hidden ancestor content is excluded; deliberate 1 px clipped accessibility text and oversized decorative plate/dust/art are retained with explicit non-defect labels. Vertical text clipping, soft-keyboard occlusion and physical safe areas are not inferred from the width test.
- Captured 0 uncaught page errors. The measurement function rejects states containing application errors recorded by the reused fixture. Screenshots and machine-readable geometry are saved outside the repository under CMS_MEASURE_ARTIFACTS (a fresh temporary directory by default).

## Per-size coverage

| Size | States | Horizontal scrollbar states | Foreground oversized elements | Touch targets below 44 | Foreground text width flags | Primary actions outside first screenful |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 360x640 | 55 | 0 | 0 | 0 | 0 | 32 |
| 390x844 | 55 | 0 | 0 | 0 | 0 | 4 |
| 430x932 | 55 | 0 | 0 | 0 | 0 | 6 |
| 844x390 | 40 | 0 | 0 | 0 | 0 | 10 |
| 932x430 | 40 | 0 | 0 | 48 | 6 | 11 |
| 768x1024 | 40 | 0 | 0 | 0 | 0 | 4 |
| 1280x650 | 38 | 0 | 0 | 0 | 0 | 2 |
| 1366x768 | 38 | 0 | 0 | 0 | 0 | 1 |
| 1920x1080 | 38 | 0 | 0 | 0 | 0 | 2 |
| 2560x1080 | 38 | 0 | 0 | 0 | 0 | 2 |

Counts count observations, so the same control may recur across states. Each zero is a measured negative under this fixture, not a universal guarantee.

## Reachability and limitations

All requested viewports completed. Every state scheduled by this script was reached; no measured screen group was blocked. Controls hidden by a desktop layout are not additional phone-sheet/tab states at that size.

## Measurements

| Size | Screen | Problem/check | Selector | Measured value |
| --- | --- | --- | --- | --- |
| 360x640 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=540.45, bottom=584.45, window height=640 |
| 360x640 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 360x640 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=305.66, bottom=349.66, window height=640 |
| 360x640 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=901.5, bottom=945.5, window height=640; clipped by #app > main:nth-of-type(1) |
| 360x640 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=496.5, bottom=540.5, window height=640 |
| 360x640 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=574.5, bottom=618.5, window height=640 |
| 360x640 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 360x640 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=540.45, bottom=584.45, window height=640 |
| 360x640 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 360x640 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=305.66, bottom=349.66, window height=640 |
| 360x640 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=901.5, bottom=945.5, window height=640; clipped by #app > main:nth-of-type(1) |
| 360x640 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=496.5, bottom=540.5, window height=640 |
| 360x640 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=574.5, bottom=618.5, window height=640 |
| 360x640 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 360x640 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=575.08, bottom=619.08, window height=640 |
| 360x640 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerOne-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerOne-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerOne-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerOne-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-playerTwo-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-playerTwo-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-playerTwo-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-playerTwo-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Final-draw-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Final-draw-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 360x640 | Final-draw-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Terminal-blocked | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Terminal-saving | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Terminal-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | NO; top=559.8, bottom=603.8, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Terminal-recovery-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | NO; top=632.39, bottom=676.39, window height=640; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 360x640 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Terminal-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 360x640 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 360x640 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=609, bottom=653, window height=640; clipped by #seasonEntry > div:nth-of-type(2) |
| 360x640 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Showdown-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Career-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Showdown-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Career-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Showdown-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Career-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Showdown-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Career-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=hidden |
| 360x640 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1137.17, window=360, left=-388.58, right=748.59 |
| 360x640 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=446.38, window=360, left=-43.19, right=403.19 |
| 360x640 | Standings-Career-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 360x640 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 360x640 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 360x640 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=360/360; overflow-x=visible |
| 360x640 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 360x640 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 360x640 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 360x640 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=980.13, bottom=1032.13, window height=640; clipped by #app > main:nth-of-type(1) |
| 390x844 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=543.72, bottom=587.72, window height=844 |
| 390x844 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 390x844 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=309.92, bottom=353.92, window height=844 |
| 390x844 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=905.77, bottom=949.77, window height=844; clipped by #app > main:nth-of-type(1) |
| 390x844 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=701.77, bottom=745.77, window height=844 |
| 390x844 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=778.77, bottom=822.77, window height=844 |
| 390x844 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 390x844 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=543.72, bottom=587.72, window height=844 |
| 390x844 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 390x844 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=309.92, bottom=353.92, window height=844 |
| 390x844 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=905.77, bottom=949.77, window height=844; clipped by #app > main:nth-of-type(1) |
| 390x844 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=701.77, bottom=745.77, window height=844 |
| 390x844 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=778.77, bottom=822.77, window height=844 |
| 390x844 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 390x844 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=1026.34, bottom=1070.34, window height=844; clipped by #app > main:nth-of-type(1) |
| 390x844 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerOne-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerOne-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerOne-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerOne-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-playerTwo-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-playerTwo-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-playerTwo-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-playerTwo-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Final-draw-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Final-draw-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 390x844 | Final-draw-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Terminal-blocked | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Terminal-saving | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Terminal-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=676, bottom=720, window height=844 |
| 390x844 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Terminal-recovery-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=698.11, bottom=742.11, window height=844 |
| 390x844 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Terminal-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 390x844 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 390x844 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=740, bottom=784, window height=844 |
| 390x844 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Showdown-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Career-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Showdown-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Career-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Showdown-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Career-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Showdown-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Career-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=hidden |
| 390x844 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1499.64, window=390, left=-554.81, right=944.83 |
| 390x844 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=483.59, window=390, left=-46.8, right=436.8 |
| 390x844 | Standings-Career-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 390x844 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 390x844 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 390x844 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=390/390; overflow-x=visible |
| 390x844 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 390x844 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 390x844 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 390x844 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=957.13, bottom=1009.13, window height=844; clipped by #app > main:nth-of-type(1) |
| 430x932 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=544.58, bottom=588.58, window height=932 |
| 430x932 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 430x932 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=310.78, bottom=354.78, window height=932 |
| 430x932 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=865.19, bottom=909.19, window height=932 |
| 430x932 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | NO; top=937.19, bottom=981.19, window height=932; clipped by #app > main:nth-of-type(1) |
| 430x932 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=974.19, bottom=1018.19, window height=932; clipped by #app > main:nth-of-type(1) |
| 430x932 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 430x932 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=544.58, bottom=588.58, window height=932 |
| 430x932 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 430x932 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=310.78, bottom=354.78, window height=932 |
| 430x932 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=865.19, bottom=909.19, window height=932 |
| 430x932 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | NO; top=937.19, bottom=981.19, window height=932; clipped by #app > main:nth-of-type(1) |
| 430x932 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=974.19, bottom=1018.19, window height=932; clipped by #app > main:nth-of-type(1) |
| 430x932 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=592, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 430x932 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=1273.77, bottom=1317.77, window height=932; clipped by #app > main:nth-of-type(1) |
| 430x932 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerOne-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerOne-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerOne-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerOne-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-playerTwo-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-playerTwo-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-playerTwo-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-playerTwo-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-pending-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-pending-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-pending-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-pending-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-pending-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-failed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-failed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-failed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-failed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-failed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-closed-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-closed-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-closed-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-closed-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-closed-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-partial | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-partial-honours | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-partial-honours | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-partial-honours | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-partial-honours | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-partial-honours | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Final-draw-history-coverage | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Final-draw-history-coverage | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-history-coverage | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Final-draw-history-coverage | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 430x932 | Final-draw-history-coverage | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Terminal-blocked | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Terminal-saving | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Terminal-failed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=764, bottom=808, window height=932 |
| 430x932 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Terminal-recovery-pending | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=765, bottom=809, window height=932 |
| 430x932 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Terminal-closed | Any element wider than window | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 430x932 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=331, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 430x932 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=828, bottom=872, window height=932 |
| 430x932 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Showdown-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Career-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Showdown-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Career-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Showdown-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Career-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Showdown-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Career-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=hidden |
| 430x932 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1656, window=430, left=-613, right=1043 |
| 430x932 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=533.19, window=430, left=-51.59, right=481.59 |
| 430x932 | Standings-Career-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 430x932 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=160, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 430x932 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 430x932 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=430/430; overflow-x=visible |
| 430x932 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 430x932 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 430x932 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 430x932 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=957.13, bottom=1009.13, window height=932; clipped by #app > main:nth-of-type(1) |
| 844x390 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-entry | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | NO; top=362.58, bottom=406.58, window height=390; clipped by #app > main:nth-of-type(1) |
| 844x390 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-scoring-sheet | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 844x390 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=134.78, bottom=178.78, window height=390 |
| 844x390 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-review | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=596.19, bottom=640.19, window height=390; clipped by #app > main:nth-of-type(1) |
| 844x390 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-review-error | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=236.19, bottom=280.19, window height=390 |
| 844x390 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-waiting | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=325.19, bottom=369.19, window height=390 |
| 844x390 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Daniel-both-published | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 844x390 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-entry | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-entry | Primary action in first screenful | #completeSeason | NO; top=362.58, bottom=406.58, window height=390; clipped by #app > main:nth-of-type(1) |
| 844x390 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-scoring-sheet | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 844x390 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=134.78, bottom=178.78, window height=390 |
| 844x390 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-review | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=596.19, bottom=640.19, window height=390; clipped by #app > main:nth-of-type(1) |
| 844x390 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-review-error | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=236.19, bottom=280.19, window height=390 |
| 844x390 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-waiting | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=325.19, bottom=369.19, window height=390 |
| 844x390 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Results-Nik-both-published | Any element wider than window | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=966, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 844x390 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=325.19, bottom=369.19, window height=390 |
| 844x390 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 844x390 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 844x390 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 844x390 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 844x390 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=299, bottom=343, window height=390 |
| 844x390 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=324.5, bottom=368.5, window height=390; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 844x390 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=324.5, bottom=368.5, window height=390; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 844x390 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | NO; top=305.5, bottom=349.5, window height=390; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 844x390 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | NO; top=361.8, bottom=405.8, window height=390; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 844x390 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 844x390 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=540, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 844x390 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=324.5, bottom=368.5, window height=390; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 844x390 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Showdown-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Career-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Showdown-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Career-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Showdown-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Career-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Showdown-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Career-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=hidden |
| 844x390 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1046.53, window=844, left=-101.27, right=945.27 |
| 844x390 | Standings-Career-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 844x390 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=262, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 844x390 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 844x390 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=844/844; overflow-x=visible |
| 844x390 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 844x390 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 844x390 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 844x390 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=695.92, bottom=747.92, window height=390; clipped by #app > main:nth-of-type(1) |
| 932x430 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-entry | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #p1LeaguePosition | target=84x36; control=#p1LeaguePosition |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #p1LeaguePoints | target=84x36; control=#p1LeaguePoints |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #p1LeagueGoals | target=84x36; control=#p1LeagueGoals |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(1) | target=125.27x34; control=#p1DomesticCup |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(2) | target=125.27x34; control=#p1ChampionsLeague |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(3) | target=125.27x34; control=#p1TopScorer |
| 932x430 | Results-Daniel-entry | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(4) | target=125.27x34; control=#p1TopAssist |
| 932x430 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-entry | text width excess (visible overflow) | #daniel-entry-panel > label:nth-of-type(1) | scrollWidth=139, clientWidth=138, overflowX=visible, text=LEAGUE POSITION |
| 932x430 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=385.77, bottom=429.77, window height=430 |
| 932x430 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-scoring-sheet | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #p1LeaguePosition | target=84x36; control=#p1LeaguePosition |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #p1LeaguePoints | target=84x36; control=#p1LeaguePoints |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #p1LeagueGoals | target=84x36; control=#p1LeagueGoals |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(1) | target=125.27x34; control=#p1DomesticCup |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(2) | target=125.27x34; control=#p1ChampionsLeague |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(3) | target=125.27x34; control=#p1TopScorer |
| 932x430 | Results-Daniel-scoring-sheet | touch control below 44 px | #daniel-entry-panel > div:nth-of-type(2) > label:nth-of-type(4) | target=125.27x34; control=#p1TopAssist |
| 932x430 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-scoring-sheet | text width excess (visible overflow) | #scoring-panel > label:nth-of-type(1) | scrollWidth=48, clientWidth=42, overflowX=visible, text=CLOSE |
| 932x430 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 932x430 | Results-Daniel-scoring-sheet | text width excess (visible overflow) | #daniel-entry-panel > label:nth-of-type(1) | scrollWidth=139, clientWidth=138, overflowX=visible, text=LEAGUE POSITION |
| 932x430 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=186.78, bottom=230.78, window height=430 |
| 932x430 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-review | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=446.28, bottom=490.28, window height=430; clipped by #app > main:nth-of-type(1) |
| 932x430 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-review-error | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=318.78, bottom=362.78, window height=430 |
| 932x430 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-waiting | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=453.28, bottom=497.28, window height=430; clipped by #app > main:nth-of-type(1) |
| 932x430 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Daniel-both-published | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 932x430 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-entry | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-entry | touch control below 44 px | #p2LeaguePosition | target=84x36; control=#p2LeaguePosition |
| 932x430 | Results-Nik-entry | touch control below 44 px | #p2LeaguePoints | target=84x36; control=#p2LeaguePoints |
| 932x430 | Results-Nik-entry | touch control below 44 px | #p2LeagueGoals | target=84x36; control=#p2LeagueGoals |
| 932x430 | Results-Nik-entry | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(1) | target=125.27x34; control=#p2DomesticCup |
| 932x430 | Results-Nik-entry | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(2) | target=125.27x34; control=#p2ChampionsLeague |
| 932x430 | Results-Nik-entry | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(3) | target=125.27x34; control=#p2TopScorer |
| 932x430 | Results-Nik-entry | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(4) | target=125.27x34; control=#p2TopAssist |
| 932x430 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-entry | text width excess (visible overflow) | #nik-entry-panel > label:nth-of-type(1) | scrollWidth=139, clientWidth=138, overflowX=visible, text=LEAGUE POSITION |
| 932x430 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=385.77, bottom=429.77, window height=430 |
| 932x430 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-scoring-sheet | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #p2LeaguePosition | target=84x36; control=#p2LeaguePosition |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #p2LeaguePoints | target=84x36; control=#p2LeaguePoints |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #p2LeagueGoals | target=84x36; control=#p2LeagueGoals |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(1) | target=125.27x34; control=#p2DomesticCup |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(2) | target=125.27x34; control=#p2ChampionsLeague |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(3) | target=125.27x34; control=#p2TopScorer |
| 932x430 | Results-Nik-scoring-sheet | touch control below 44 px | #nik-entry-panel > div:nth-of-type(2) > label:nth-of-type(4) | target=125.27x34; control=#p2TopAssist |
| 932x430 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-scoring-sheet | text width excess (visible overflow) | #scoring-panel > label:nth-of-type(1) | scrollWidth=48, clientWidth=42, overflowX=visible, text=CLOSE |
| 932x430 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 932x430 | Results-Nik-scoring-sheet | text width excess (visible overflow) | #nik-entry-panel > label:nth-of-type(1) | scrollWidth=139, clientWidth=138, overflowX=visible, text=LEAGUE POSITION |
| 932x430 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=186.78, bottom=230.78, window height=430 |
| 932x430 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-review | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=446.28, bottom=490.28, window height=430; clipped by #app > main:nth-of-type(1) |
| 932x430 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-review-error | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=318.78, bottom=362.78, window height=430 |
| 932x430 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-waiting | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=453.28, bottom=497.28, window height=430; clipped by #app > main:nth-of-type(1) |
| 932x430 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Results-Nik-both-published | Any element wider than window | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1067, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 932x430 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=428.28, bottom=472.28, window height=430; clipped by #app > main:nth-of-type(1) |
| 932x430 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 932x430 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 932x430 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 932x430 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 932x430 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=352, bottom=396, window height=430 |
| 932x430 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=386.2, bottom=430.2, window height=430; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 932x430 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=371.91, bottom=415.91, window height=430; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 932x430 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | NO; top=372.2, bottom=416.2, window height=430; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 932x430 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | NO; top=410.5, bottom=454.5, window height=430; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 932x430 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 932x430 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=596, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 932x430 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | NO; top=386.2, bottom=430.2, window height=430; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 932x430 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Showdown-ready | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Showdown-ready | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Career-ready | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Career-ready | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Showdown-partial | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Showdown-partial | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Career-partial | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Career-partial | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Showdown-empty | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Showdown-empty | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Career-empty | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Career-empty | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Showdown-loading | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Showdown-loading | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Career-loading | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Career-loading | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Showdown-unavailable | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Showdown-unavailable | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=hidden |
| 932x430 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1155.66, window=932, left=-111.83, right=1043.83 |
| 932x430 | Standings-Career-unavailable | touch control below 44 px | #sdgViewShowdown | target=141.47x32; control=#sdgViewShowdown |
| 932x430 | Standings-Career-unavailable | touch control below 44 px | #sdgViewCareer | target=88.42x32; control=#sdgViewCareer |
| 932x430 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=289, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 932x430 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 932x430 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=932/932; overflow-x=visible |
| 932x430 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 932x430 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 932x430 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 932x430 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=739.73, bottom=791.73, window height=430; clipped by #app > main:nth-of-type(1) |
| 768x1024 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Results-Daniel-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 768x1024 | Results-Daniel-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=450.44, bottom=494.44, window height=1024 |
| 768x1024 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=1010.14, bottom=1054.14, window height=1024; clipped by #seasonReviewPanel |
| 768x1024 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | NO; top=863.14, bottom=907.14, window height=1024 |
| 768x1024 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 768x1024 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Results-Nik-scoring-sheet | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-scoring-sheet | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-scoring-sheet | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-scoring-sheet | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 768x1024 | Results-Nik-scoring-sheet | Primary action in first screenful | label.season-phone-sheet-close | YES; top=450.44, bottom=494.44, window height=1024 |
| 768x1024 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-review | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | NO; top=1010.14, bottom=1054.14, window height=1024; clipped by #seasonReviewPanel |
| 768x1024 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | NO; top=863.14, bottom=907.14, window height=1024 |
| 768x1024 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(1) | width=1735.11, window=768, left=-483.55, right=1251.56 |
| 768x1024 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=879, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 768x1024 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-draw-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 768x1024 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-draw-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 768x1024 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-draw-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 768x1024 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Final-draw-partial | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=132, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 768x1024 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Terminal-blocked | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Terminal-saving | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Terminal-failed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=870, bottom=914, window height=1024 |
| 768x1024 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=870, bottom=914, window height=1024 |
| 768x1024 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(1) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) | width=1734.19, window=768, left=-483.09, right=1251.09 |
| 768x1024 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Terminal-closed | Touch control below 44 px | #seasonEntry | NO; 0 detected |
| 768x1024 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=491, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 768x1024 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=933, bottom=977, window height=1024 |
| 768x1024 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Showdown-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Career-ready | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Showdown-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Career-partial | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Showdown-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Career-empty | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Showdown-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Career-loading | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=hidden |
| 768x1024 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(1) | width=1819.47, window=768, left=-525.73, right=1293.73 |
| 768x1024 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=952.31, window=768, left=-92.16, right=860.16 |
| 768x1024 | Standings-Career-unavailable | Touch control below 44 px | #standings | NO; 0 detected |
| 768x1024 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=238, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 768x1024 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 768x1024 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=768/768; overflow-x=visible |
| 768x1024 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 768x1024 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | NO; 0 detected |
| 768x1024 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 768x1024 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | YES; top=695.92, bottom=747.92, window height=1024 |
| 1280x650 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Daniel-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1280x650 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=559.19, bottom=603.19, window height=650 |
| 1280x650 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=439.3, bottom=483.3, window height=650 |
| 1280x650 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=465.8, bottom=509.8, window height=650 |
| 1280x650 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=598.19, bottom=642.19, window height=650 |
| 1280x650 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 1280x650 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Nik-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1280x650 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=559.19, bottom=603.19, window height=650 |
| 1280x650 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Nik-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=439.3, bottom=483.3, window height=650 |
| 1280x650 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=465.8, bottom=509.8, window height=650 |
| 1280x650 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=598.19, bottom=642.19, window height=650 |
| 1280x650 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1466, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1280x650 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=598.19, bottom=642.19, window height=650 |
| 1280x650 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-draw-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=138, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1280x650 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-draw-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=138, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1280x650 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-draw-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=138, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1280x650 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Final-draw-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=138, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1280x650 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Terminal-blocked | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Terminal-saving | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Terminal-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=516.3, bottom=560.3, window height=650 |
| 1280x650 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | NO; top=574.59, bottom=618.59, window height=650; clipped by #finalWinnerScreen > section:nth-of-type(3) |
| 1280x650 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Terminal-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1280x650 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=819, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1280x650 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=572, bottom=616, window height=650 |
| 1280x650 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Showdown-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Career-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Showdown-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Career-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Showdown-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Career-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Showdown-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Career-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=hidden |
| 1280x650 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1587.19, window=1280, left=-153.59, right=1433.59 |
| 1280x650 | Standings-Career-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1280x650 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=397, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1280x650 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1280x650 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1280/1280; overflow-x=visible |
| 1280x650 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 1280x650 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | N/A; desktop-size touch check not requested |
| 1280x650 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 1280x650 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=749.45, bottom=801.45, window height=650; clipped by #app > main:nth-of-type(1) |
| 1366x768 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Daniel-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1366x768 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=680.05, bottom=724.05, window height=768 |
| 1366x768 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=476.13, bottom=520.13, window height=768 |
| 1366x768 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | YES; top=502.63, bottom=546.63, window height=768 |
| 1366x768 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=710.77, bottom=754.77, window height=768 |
| 1366x768 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 1366x768 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Nik-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1366x768 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=680.05, bottom=724.05, window height=768 |
| 1366x768 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Nik-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=476.13, bottom=520.13, window height=768 |
| 1366x768 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | YES; top=502.63, bottom=546.63, window height=768 |
| 1366x768 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=710.77, bottom=754.77, window height=768 |
| 1366x768 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1564, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1366x768 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=710.77, bottom=754.77, window height=768 |
| 1366x768 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-draw-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=147, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1366x768 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-draw-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=147, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1366x768 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-draw-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=147, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1366x768 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Final-draw-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=147, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1366x768 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Terminal-blocked | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Terminal-saving | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Terminal-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=632, bottom=676, window height=768 |
| 1366x768 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=659.56, bottom=703.56, window height=768 |
| 1366x768 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Terminal-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1366x768 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=874, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1366x768 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=690, bottom=734, window height=768 |
| 1366x768 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Showdown-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Career-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Showdown-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Career-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Showdown-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Career-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Showdown-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Career-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=hidden |
| 1366x768 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=1693.81, window=1366, left=-163.91, right=1529.91 |
| 1366x768 | Standings-Career-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1366x768 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=424, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1366x768 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1366x768 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1366/1366; overflow-x=visible |
| 1366x768 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 1366x768 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | N/A; desktop-size touch check not requested |
| 1366x768 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 1366x768 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | NO; top=749.73, bottom=801.73, window height=768; clipped by #app > main:nth-of-type(1) |
| 1920x1080 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Daniel-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=957.5, bottom=1017.02, window height=1080 |
| 1920x1080 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Daniel-review | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=905.36, bottom=961.36, window height=1080 |
| 1920x1080 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | NO; top=1009.56, bottom=1065.56, window height=1080; clipped by #seasonReviewPanel |
| 1920x1080 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.7, bottom=1060.22, window height=1080 |
| 1920x1080 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 1920x1080 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Nik-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=957.5, bottom=1017.02, window height=1080 |
| 1920x1080 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Nik-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Nik-review | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=905.36, bottom=961.36, window height=1080 |
| 1920x1080 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Nik-review-error | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | NO; top=1009.56, bottom=1065.56, window height=1080; clipped by #seasonReviewPanel |
| 1920x1080 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Nik-waiting | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.7, bottom=1060.22, window height=1080 |
| 1920x1080 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 1920x1080 | Results-Nik-both-published | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 1920x1080 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.7, bottom=1060.22, window height=1080 |
| 1920x1080 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-draw-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1920x1080 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-draw-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1920x1080 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-draw-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1920x1080 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Final-draw-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 1920x1080 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Terminal-blocked | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Terminal-saving | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Terminal-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=936, bottom=980, window height=1080 |
| 1920x1080 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=936, bottom=980, window height=1080 |
| 1920x1080 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Terminal-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 1920x1080 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 1920x1080 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 1920x1080 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Showdown-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Career-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Showdown-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Career-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Showdown-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Career-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Showdown-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Career-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=hidden |
| 1920x1080 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=2380.78, window=1920, left=-230.39, right=2150.39 |
| 1920x1080 | Standings-Career-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 1920x1080 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 1920x1080 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 1920x1080 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=1920/1920; overflow-x=visible |
| 1920x1080 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 1920x1080 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | N/A; desktop-size touch check not requested |
| 1920x1080 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 1920x1080 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | YES; top=768.73, bottom=820.73, window height=1080 |
| 2560x1080 | Results-Daniel-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Daniel-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Daniel-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Daniel-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Daniel-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Daniel-entry | Primary action in first screenful | #completeSeason | YES; top=957.27, bottom=1017.27, window height=1080 |
| 2560x1080 | Results-Daniel-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Daniel-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Daniel-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Daniel-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Daniel-review | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Daniel-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=913.64, bottom=969.64, window height=1080 |
| 2560x1080 | Results-Daniel-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Daniel-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Daniel-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Daniel-review-error | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Daniel-review-error | Primary action in first screenful | #editSeasonResults | NO; top=1019.19, bottom=1075.19, window height=1080; clipped by #seasonReviewPanel |
| 2560x1080 | Results-Daniel-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Daniel-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Daniel-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Daniel-waiting | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Daniel-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.47, bottom=1060.47, window height=1080 |
| 2560x1080 | Results-Daniel-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Daniel-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Daniel-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Daniel-both-published | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Daniel-both-published | Primary action in first screenful | #confirmSeasonCompletion | ABSENT/HIDDEN in this state |
| 2560x1080 | Results-Nik-entry | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Nik-entry | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Nik-entry | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Nik-entry | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Nik-entry | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Nik-entry | Primary action in first screenful | #completeSeason | YES; top=957.27, bottom=1017.27, window height=1080 |
| 2560x1080 | Results-Nik-review | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Nik-review | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Nik-review | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Nik-review | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Nik-review | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Nik-review | Primary action in first screenful | #confirmSeasonCompletion | YES; top=913.64, bottom=969.64, window height=1080 |
| 2560x1080 | Results-Nik-review-error | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Nik-review-error | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Nik-review-error | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Nik-review-error | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Nik-review-error | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Nik-review-error | Primary action in first screenful | #editSeasonResults | NO; top=1019.19, bottom=1075.19, window height=1080; clipped by #seasonReviewPanel |
| 2560x1080 | Results-Nik-waiting | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Nik-waiting | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Nik-waiting | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Nik-waiting | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Nik-waiting | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Nik-waiting | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.47, bottom=1060.47, window height=1080 |
| 2560x1080 | Results-Nik-both-published | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Results-Nik-both-published | oversized decorative element | #stage-root > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Results-Nik-both-published | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Results-Nik-both-published | decorative/visually-hidden text width excess | #seasonEntryTitle | scrollWidth=1737, clientWidth=1, overflowX=hidden, text=SEASON 1 SHARED RESULTS |
| 2560x1080 | Results-Nik-both-published | decorative/visually-hidden text width excess | #scoring-rules-text | scrollWidth=930, clientWidth=1, overflowX=hidden, text=Champions League +5, league title +3, domestic cup +1. Performance bonus max +1; awar |
| 2560x1080 | Results-Nik-both-published | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=1000.47, bottom=1060.47, window height=1080 |
| 2560x1080 | Final-playerOne-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerOne-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerOne-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerOne-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerOne-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerOne-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerOne-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerOne-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerOne-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerOne-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerOne-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerOne-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerOne-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerOne-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerOne-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerOne-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerOne-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerOne-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerOne-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerOne-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerTwo-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerTwo-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerTwo-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerTwo-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerTwo-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerTwo-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerTwo-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerTwo-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerTwo-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerTwo-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerTwo-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerTwo-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerTwo-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerTwo-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerTwo-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-playerTwo-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-playerTwo-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-playerTwo-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-playerTwo-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-playerTwo-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-draw-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-draw-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-draw-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-draw-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-draw-pending | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 2560x1080 | Final-draw-pending | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-draw-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-draw-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-draw-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-draw-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-draw-failed | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 2560x1080 | Final-draw-failed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-draw-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-draw-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-draw-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-draw-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-draw-closed | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 2560x1080 | Final-draw-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Final-draw-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Final-draw-partial | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Final-draw-partial | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Final-draw-partial | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Final-draw-partial | decorative/visually-hidden text width excess | #resultText | scrollWidth=168, clientWidth=1, overflowX=hidden, text=The showdown finishes level |
| 2560x1080 | Final-draw-partial | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Terminal-blocked | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Terminal-blocked | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Terminal-blocked | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Terminal-blocked | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Terminal-blocked | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Terminal-saving | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Terminal-saving | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Terminal-saving | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Terminal-saving | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Terminal-saving | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Terminal-failed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Terminal-failed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Terminal-failed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Terminal-failed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Terminal-failed | Primary action in first screenful | #sharedTerminalCloseAction | YES; top=936, bottom=980, window height=1080 |
| 2560x1080 | Terminal-recovery-pending | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Terminal-recovery-pending | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Terminal-recovery-pending | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Terminal-recovery-pending | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Terminal-recovery-pending | Primary action in first screenful | #sharedTerminalCloseRetry | YES; top=936, bottom=980, window height=1080 |
| 2560x1080 | Terminal-closed | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Terminal-closed | oversized decorative element | #seasonEntry > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Terminal-closed | Touch control below 44 px | #seasonEntry | N/A; desktop-size touch check not requested |
| 2560x1080 | Terminal-closed | decorative/visually-hidden text width excess | #finalWinnerTitle > span:nth-of-type(1) | scrollWidth=971, clientWidth=1, overflowX=hidden, text=SHOWDOWN CHAMPION |
| 2560x1080 | Terminal-closed | Primary action in first screenful | #seasonEntry .seasonEntryActions [data-smart-back] | YES; top=994, bottom=1038, window height=1080 |
| 2560x1080 | Standings-Showdown-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Showdown-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Showdown-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Showdown-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Showdown-ready | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Career-ready | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Career-ready | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Career-ready | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Career-ready | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Career-ready | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Showdown-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Showdown-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Showdown-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Showdown-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Showdown-partial | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Career-partial | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Career-partial | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Career-partial | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Career-partial | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Career-partial | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Showdown-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Showdown-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Showdown-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Showdown-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Showdown-empty | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Career-empty | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Career-empty | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Career-empty | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Career-empty | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Career-empty | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Showdown-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Showdown-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Showdown-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Showdown-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Showdown-loading | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Career-loading | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Career-loading | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Career-loading | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Career-loading | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Career-loading | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Showdown-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Showdown-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Showdown-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Showdown-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Showdown-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Standings-Career-unavailable | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=hidden |
| 2560x1080 | Standings-Career-unavailable | oversized decorative element | #standings > div:nth-of-type(1) > div:nth-of-type(6) > div:nth-of-type(2) | width=3174.38, window=2560, left=-307.19, right=2867.19 |
| 2560x1080 | Standings-Career-unavailable | Touch control below 44 px | #standings | N/A; desktop-size touch check not requested |
| 2560x1080 | Standings-Career-unavailable | decorative/visually-hidden text width excess | #sdgHeading | scrollWidth=470, clientWidth=1, overflowX=hidden, text=STANDINGS |
| 2560x1080 | Standings-Career-unavailable | Primary action in first screenful | — | N/A; no primary button |
| 2560x1080 | Legacy-season-summary | Horizontal scrollbar | html / document.scrollingElement | NO; scroll/client width=2560/2560; overflow-x=visible |
| 2560x1080 | Legacy-season-summary | Any element wider than window | #seasonSummary | NO; 0 detected |
| 2560x1080 | Legacy-season-summary | Touch control below 44 px | #seasonSummary | N/A; desktop-size touch check not requested |
| 2560x1080 | Legacy-season-summary | Text scrollWidth > clientWidth | #seasonSummary | NO; 0 detected |
| 2560x1080 | Legacy-season-summary | Primary action in first screenful | #nextSeasonAction | YES; top=768.73, bottom=820.73, window height=1080 |

## Reproduce

From the repository root, install the existing locked dependencies if needed, then run:

```sh
node project-documents/gameplay-factory/queue/results/measure-season-final.cjs
```

The script starts the existing static server on 127.0.0.1:4173, uses the existing Chromium runtime helper, writes this report, and prints the external artifact directory. CMS_BASE_URL may select an already-running local server; CMS_MEASURE_ARTIFACTS chooses the screenshot/JSON directory. CMS_MEASURE_SIZE selects one of the listed exact sizes for diagnosis; CMS_MEASURE_SUMMARY_ONLY selects only the legacy summary. Use a full run for delivery. `--report-from <measurements.json>` regenerates Markdown from saved browser measurements without rerunning the browser.
