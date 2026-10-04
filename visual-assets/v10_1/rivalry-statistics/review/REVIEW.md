# Rivalry Statistics independent review

## Verdict

FAIL

Static score 37 / 9 criteria = 4.1 average; the pass line is 4.2. No criterion is below 3. H1-H4 pass by reading. H5, H6, H7, H8, H10 and H11 are not fully measured (Claude measures), so the hard-gate requirement is open too. The fix list lifts the weakest criteria (1, 6).

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | Title, comparison box, three lower panels and Back sit within about 1 point of the mockup boxes (comparison 27.6-72.3% x, 26.4-63.8% y vs 28.1-71.9%, 26.8-63.1%); the head-to-head caption, side banners, footer strip and nav breadcrumb are missing or plate-only. |
| 2 · Characters stand out | 4 | Daniel's pointing hand and Nik's crossed arms are separate overlay layers made from the committed platemap with rim light (JOB-067 notes). |
| 3 · Hands and contact | 4 | The pointing hand sits above the left edge of the Rivalry Totals panel; contact shadow present, exact overlap not measured. |
| 4 · Lighting and grade | 4 | Warm plate, dark gold-edged glass and soft scrims, no flat grey cover boxes. |
| 5 · Typography and title | 4 | Brush title image with hidden `RIVALRY STATISTICS`, Barlow Condensed uppercase labels, tabular numerals; tagline uses a bullet like the mockup. |
| 6 · Panel craft | 4 | Seven-row totals, season table with winner crest and four original trophies; the trophies are 84 px against the mockup's much larger cabinet art, and rows are tight. |
| 7 · Information clarity and honesty | 5 | Only contract stats; unavailable transfers never become zero; loading, empty, unavailable, partial and transfer-unavailable states are designed. |
| 9 · Phone composition | 4 | Separate portrait composition with TOTALS / HEAD-TO-HEAD / SEASONS / TROPHIES tabs; the cut-through row at 393x660 was sent back and fixed in jobs 154-155; H5 not recorded so no 5. |
| 10 · Polish and finish | 4 | 28 desktop frame/viewport checks with no scroll or errors; exact plate-relative mockup diff still unrun. |

Total 37 / 45 = 4.1 average.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | `index.html` rvCrestDaniel / rvClubDaniel come before Nik; every table puts Daniel first; QA_SUMMARY: Daniel marker stays left of Nik. |
| H2 · Rights-safe assets | PASS | Showdown-owned plate, title, overlays and trophy WebP; crests come from `getClubCrestSvg` (original code-drawn crests). |
| H3 · No live/private data baked into images | PASS | All numbers, names and states are DOM text from `fixtures.json`. |
| H4 · Product truth | PASS | Rows are the seven contract rows; transfers show Unavailable instead of 0; no invented stats. |
| H5 · Phone fit | NOT MEASURED (Claude measures) | JOB-068 notes record no page scroll at 393x660, 360x640, 375x553 by arithmetic; the 360x640 Totals row scrolls inside its panel. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures) | No contrast ratio recorded. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | Nothing recorded. |
| H8 · Keyboard / focus | PARTIAL (Claude measures) | QA_SUMMARY: Back is keyboard reachable with the shared focus ring; tabs have roving tabindex. |
| H9 · Console / requests | PASS (Claude measures) | QA_SUMMARY: no console errors in 28 frame/viewport checks; Claude's real-server renders of RV1, RV2, RV4 had no errors. |
| H10 · Mockup diff | NOT MEASURED (Claude measures) | Only a no-plate fallback: SSIM 0.635, mean Delta E 7.0; the exact plate-relative score is not recorded. |
| H11 · First-paint weight / WebP | NOT MEASURED (Claude measures) | QA_SUMMARY says runtime art is WebP only; no byte count. |

## Evidence

### Claude measurements

- Source `project-documents/factory/status/JOB-067.md`: real-server renders RV1, RV2, RV4 with no scroll and no errors; fixes for the loading panel, preview chip and lower panels recorded (Claude, 2026-10-03).
- Source `project-documents/factory/status/JOB-068.md`: phone no scroll at 393x660, 360x640, 375x553; Claude's note sent the TOTALS table back for a cut row.
- Source `visual-assets/v10_1/rivalry-statistics/evidence/QA_SUMMARY.md`: H9 clean, H10 fallback only, H11 no number. No `scores.json` exists.

### Mockup differences

Mockup measured at 1672x941 from `MOCKUP_RIVALRY_STATISTICS.png`; code values from `rivalry-statistics.css`.

- Title block · mockup: eyebrow y~12%, brush title y 14-21%, x 31-70%, tagline y~24%; code: `.rv-titleBlock` left 29%, width 42.5%, top 9.1%, so it sits slightly wider and higher.
- Rivalry totals panel · mockup: x 28.1-71.9%, y 26.8-63.1%, club header with crests, seven rows (Showdown Points, Seasons Completed, Trophies Won, League Points, League Goals, Transfer Signings, Season Wins); code: `.rv-comparison` x 27.6-72.3%, y 26.4-63.8%, rows Showdown Points, Season Wins, Total Trophies, Champions Leagues, League Titles, Domestic Cups, Transfer Signings (words follow TRUTH.md; the mockup's league points and goals are not contract fields).
- Head-to-head panel · mockup: x 2.7-33.5%, y 63.5-87.4%, three big numerals DANIEL WINS / NIK WINS / DRAWS and the caption "EVERY SEASON WRITES A NEW CHAPTER."; code: `.rv-bottom` top 63.1%, height 24.9%, same three stats, no caption.
- Season-by-season panel · mockup: x 34-66%, five-row table with a winner crest column; code: table with SEASON, DANIEL, NIK, WINNER headers and winner crest or Draw mark; matches.
- Trophy cabinet panel · mockup: x 66.5-97.4%, large Showdown trophy plus three smaller (league, domestic cup, continental) with labels; code: four trophy images at 84 px with label and count, all the same size; the Showdown trophy is not larger than the others.
- Back button · mockup: x 40.1-59.9%, y 88.9-94.3%, house icon and chevron; code: `.rv-actions` left 39.8%, top 88.2%, width 20.5%, height 7%; no house icon or chevron.
- Managers' areas · mockup: Daniel large pointing at the viewer on the left, Nik arms crossed on the right, script captions "Daniel / SKILL. VISION. MAGIC." and "Nik / TACTICS. DISCIPLINE. PROGRESS."; code: same poses from the plate and overlays; Daniel left, Nik right; script captions come from the plate.
- Side banners, footer strip, top nav breadcrumb · mockup: banners left and right, footer "CM 17 | CAREER MODE SHOWDOWN 17" and "RIVALS BUILD LEGACIES."; code: banners are plate art, no footer strip, top bar is the shared five-tab chrome.

### Code audit

- PASS · Manager order · `rivalry-statistics.js::rows, head, seasons`: Daniel value first in every row, header, table and cabinet.
- PASS · Ids and routes · `index.html` #statistics, #statisticsScreenTitle, #rvBack with `.backButton`.
- PASS · Back label · `fixtures.json strings.back` is BACK TO SHOWDOWN HOME and the button shows it.
- PASS · Transfers honest · `rivalry-statistics.js::value`: Transfer Signings shows Unavailable, never 0, when the fixture has no value.
- PASS · Honest states · `fixtures.json` RV3 empty, RV5 loading, RV6 unavailable, RV7 partial; `rvState` panel shows contract copy and hides the three panels.
- PASS · Tabs accessible · `index.html` rvTab*: role tab, aria-selected, aria-controls, roving tabindex.
- PASS · Phone targets · `rivalry-statistics.css` phone block: tabs and Back 44 px (JOB-154).
- PASS · No PNG master loaded · runtime art paths are `.webp`.
- NOTE · Script is compressed one-line functions; behaviour reads correctly but is hard to maintain (no change asked).
- NOTE · Fallback fixtures are embedded in `rivalry-statistics.js` (`fallback`) with the RV1 loading frame; used only if fetch fails.
- N/A · Input font size · no text inputs.

## Fix list

1. `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css` selector `.rv-trophy img` (desktop rule): change `height: 84px` to `height: clamp(72px, 8vw, 112px)`; target: trophies read as cabinet art at 1366 and 1920 without pushing labels out of the panel.
2. `visual-assets/v10_1/rivalry-statistics/index.html` after `#rvHeadBody`: add `<p class="rv-headCaption sd-tagline">EVERY SEASON WRITES A NEW CHAPTER.</p>` (mockup decorative copy); target: caption under the three numerals, one line, hidden on phone.
3. `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css` selector `.rv-titleBlock`: change `left: 29%` to `left: 30.2%` and `width: 42.5%` to `40%`; target: title spans about 31-70% as in the mockup.
4. `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css` selector `.rv-bottom`: change `top: 63.1%; height: 24.9%` to `top: 63.5%; height: 24.4%`; target: lower panels span 63.5-87.9%.
5. `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css` selector `.rv-actions`: change `top: 88.2%; height: 7%` to `top: 88.9%; height: 5.8%`; target: Back row at the mockup's 88.9-94.7%, text on one line.
6. `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css` selector `.rv-comparison`: change `top: 26.4%; height: 37.4%` to `top: 26.8%; height: 36.4%`; target: totals panel ends at 63.2%, rows still fill the panel.
