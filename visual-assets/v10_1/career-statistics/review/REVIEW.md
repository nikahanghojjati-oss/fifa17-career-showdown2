# Career Statistics independent review · part 1 of 4

## Verdict

FAIL

Static score 35 / 45 = 3.9 average (criteria 1-7, 9, 10); the pass line is 4.2. No criterion is below 3. H1-H4 pass by reading. H5-H11 are NOT MEASURED (Claude measures), so the hard-gate requirement is also open. The fix list below lifts the weakest criteria (6, 1, 5).

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | Panels sit within about 1-3 points of the mockup's boxes (tiles 24.2-75.7% vs 24.8-75.2%, table 21.5-57.7% vs 21.9-58.4%), but the side banners, footer strip and WIN % column are missing. |
| 2 · Characters stand out | 4 | Daniel's crossed-arms cut-out sits on its own layer with a rim and contact shadow; Claude's face score on the plate is 0.94 (JOB-062). |
| 3 · Hands and contact | 4 | The crossed arms overlap the table edge correctly via `armCutout` over the panels; Nik's chin-on-fist hand comes from the plate and was not measured separately. |
| 4 · Lighting and grade | 4 | Dark glass panels with warm gold edges and soft inset highlights; no flat grey cover boxes in `career-statistics.css`. |
| 5 · Typography and title | 4 | Gold brush title `TITLE_CS_V1.webp` with hidden `CAREER STATISTICS`; the tagline uses a middle dot where the mockup has a full stop. |
| 6 · Panel craft | 3 | Headline tiles show small D / N pairs instead of the mockup's one big number, comparison blue is duller than the mockup's, and leader cards lack the chevron. |
| 7 · Information clarity and honesty | 4 | Ready, partial, empty, loading and unavailable states are all designed with contract copy; only the always-visible Rivalry button departs from TRUTH.md. |
| 9 · Phone composition | 4 | Separate portrait composition with tabs TABLE / COMPARE / LEADERS and hero cut-outs; H5 is still unmeasured so it cannot score 5. |
| 10 · Polish and finish | 4 | WebP assets, fixture-driven text, no placeholders; console and failed-request counts are not fully recorded. |

Total 35 / 45 = 3.9 average.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | `renderTable` fixes the order Daniel then Nik; all frames have `managerOrder` Daniel, Nik; the cut-out layer has Daniel on the left. |
| H2 · Rights-safe assets | PASS | `index.html` loads only Showdown-owned plate, title, hero and trophy WebP assets; no real crests, league logos, EA/FIFA art or player photos. |
| H3 · No live/private data baked into images | PASS | Numbers, names and states are DOM text from `fixtures.json`; the images are static art. |
| H4 · Product truth | PASS | Dropped fields stay dropped and states follow the contract; the always-visible Rivalry button is a listed fix item, not an invented control. |
| H5 · Phone fit | NOT MEASURED (Claude measures) | See Evidence H5: no scroll or button-rectangle values recorded for 393x660, 360x640, 375x553. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures) | No contrast ratio recorded. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | Nothing recorded. |
| H8 · Keyboard / focus | NOT MEASURED (Claude measures) | Nothing recorded. |
| H9 · Console / requests | PARTIAL (Claude measures) | Intake render of CS1, CS3, CS4 showed no errors; failed-request count not recorded. |
| H10 · Mockup diff | NOT MEASURED (Claude measures) | Face score 0.94 recorded; other boxes, SSIM and Delta E not measured. |
| H11 · First-paint weight / WebP | NOT MEASURED (Claude measures) | No byte counts recorded. |

## Evidence

### H5 · Phone fit / scroll

- Desktop real-server states CS1, CS3 and CS4: Claude reported no scroll after intake fixes. Source: `project-documents/factory/status/JOB-062.md`, Claude intake note.
- 393 × 660: Claude reported the phone composition good, but no `scrollHeight <= innerHeight` value or primary-button rectangle is recorded. NOT MEASURED (Claude measures). Source: `project-documents/factory/status/JOB-063.md`, Claude check.
- 360 × 640: NOT MEASURED (Claude measures). Source checked: `project-documents/factory/status/JOB-063.md`.
- 375 × 553: Claude reported the phone composition good, but no primary-button rectangle is recorded. NOT MEASURED (Claude measures). Source: `project-documents/factory/status/JOB-063.md`, Claude check.

### H6 · Input size and text contrast

- Text contrast ratio: NOT MEASURED (Claude measures). Source checked: `project-documents/factory/status/JOB-062.md` and `project-documents/factory/status/JOB-063.md`.
- No Claude-recorded numeric contrast result exists in the named evidence inputs.

### H7 · Reduced motion

- NOT MEASURED (Claude measures). Source checked: `project-documents/factory/status/JOB-062.md` and `project-documents/factory/status/JOB-063.md`.

### H8 · Keyboard and focus

- NOT MEASURED (Claude measures). Source checked: `project-documents/factory/status/JOB-062.md` and `project-documents/factory/status/JOB-063.md`.

### H9 · Console errors / failed requests

- Claude's real-server intake render of CS1, CS3 and CS4 reported no errors after the stage URL and preview-chip fixes. Source: `project-documents/factory/status/JOB-062.md`, Claude intake note.
- Failed-request count was not separately recorded. NOT MEASURED (Claude measures).

### H10 · Mockup-diff gate

- Face score: 0.94 as recorded by Claude. Source: `project-documents/factory/status/JOB-062.md`, Claude check.
- Other protected-box score: NOT MEASURED (Claude measures).
- SSIM: NOT MEASURED (Claude measures).
- Delta E: NOT MEASURED (Claude measures).
- Root `visual-assets/v10_1/career-statistics/evidence/scores.json` does not exist in the branch at this review step, so no additional Claude measurement was copied.

### H11 · First-paint weight

- Desktop first-paint bytes: NOT MEASURED (Claude measures).
- Phone first-paint bytes: NOT MEASURED (Claude measures).
- Root `visual-assets/v10_1/career-statistics/evidence/QA_SUMMARY.md` does not exist in the branch at this review step, so no additional Claude network measurement was copied.

### Mockup differences

Mockup measured at 1672x941 from `MOCKUP_CAREER_STATISTICS.png`; code values are the CSS percentages in `career-statistics.css`. Product truth (`TRUTH.md`, `fixtures.json`) wins where words differ.

- Top bar · mockup: CM 17 logo, HOME CAREER STANDINGS STATS RULES ABOUT, search/settings/profile icons, plus a breadcrumb row (CAREER HUB > CAREER STATISTICS | TROPHY ROOM | TRANSFERS | HISTORY); code: `.topChrome` 52px with CM 17, HOME CAREER STANDINGS STATS RULES and a settings glyph; no breadcrumb row, no ABOUT, no search or profile icons (nav is the agreed 5 tabs, so this is truth, not a defect).
- Title block · mockup: crown above the eyebrow (y~14%), eyebrow y~17%, brush title y~19-24% spanning x~32-68%, tagline y~27%; code: `.titleBlock` x 29.9-69.7%, y 11.9-27.7%, no crown mark, tagline `TWO MANAGERS · ONE LEGACY` (mockup uses a full stop between the phrases).
- Headline tiles · mockup: four tiles x 24.8-75.2%, y 29.2-40.4%, icons star / football / bars / trophy, one big gold number each (12 / 60 / 142 / 18); code: `.headlineTiles` x 24.22-75.66%, y 28.48-41.13%, same four icons, but a D / N pair (`headlinePair`) or "Together" caption replaces the single number, so the numbers are smaller than the mockup's.
- Career table panel · mockup: x 21.9-58.4%, y 42.3-62.4%, columns # MANAGER SHOWDOWNS SEASONS POINTS TROPHIES WIN %, crown on the leader and a club crest on the second row; code: x 21.53-57.71%, y 41.45-62.17%, columns # Manager Showdowns "Season W-D-L" Points Trophies (no WIN % column, crown glyph only, no crest).
- Manager comparison panel · mockup: x 59.1-80.1%, y 42.3-65.0%, six rows (league wins, cup wins, European wins, goals scored, clean sheets, biggest win) with blue Daniel value left and gold Nik value right and a split bar; code: x 58.31-78.94%, y 41.45-64.83%, rows LEAGUE TITLES, DOMESTIC CUPS, CHAMPIONS LEAGUE WINS, Season Wins, Average League Points, Average League Goals (words follow truth); split bar present, blue #2c7399 versus the mockup's brighter blue.
- Career leaders panel · mockup: x 15.4-84.7%, y 66.2-82.5%, four cards (top scorer, top assists, most clean sheets, most trophies) each with an icon, a small portrait, name, value and a chevron; code: `.leadersPanel` x 14.95-84.33%, y 65.36-81.83%, `.leaderGrid` four columns, cards 94px tall with a 44x62 portrait crop, labels from `leaderLabels` (MOST SEASON WINS, MOST TROPHIES, ...), no leading icon and no chevron on the card.
- Action buttons · mockup: three buttons x 16.3-83.7%, y 84.0-89.4%, centre button solid gold with a trophy; code: `.actionRow` x 15.55-84.33%, y 82.57-90.54%, grid 1fr 1.08fr 1fr, centre OPEN TROPHY ROOM solid gold with the trophy webp, left icon bars, right icon house; position and look match, the row is about 2.6 points taller.
- Managers' areas · mockup: Daniel large cut-out on the left (x 4-30%), Nik on the right (x 72-98%), script captions "Daniel / SKILL. VISION. MAGIC." and "Nik / TACTICS. DISCIPLINE. PROGRESS."; code: `.managerDaniel` x 11.36-23.62%, y 10.1-36.1% and `.managerNik` x 74.16-87.62% are marker boxes only, Daniel's crossed-arms cut-out is on the plate layer (`armCutout`), Nik comes from the plate, and the script name captions are not present. Daniel is left, Nik right.
- Side banners and props · mockup: gold banners "FOOTBALL BRINGS US TOGETHER" (left) and "DIFFERENT MANAGERS SAME PASSION" (right), a CM17 ball and a "RIVALS BUILD LEGACIES" plinth at the bottom left; code: the ENV_CS plate carries the stadium but these banner words and the ball are not DOM text (decorative brand text is allowed, so this is a polish gap only).
- Footer strip · mockup: bottom bar with CM 17 | CAREER MODE SHOWDOWN 17, centre crown and "FOOTBALL BRINGS US TOGETHER.", right "TWO MANAGERS. ONE LEGACY."; code: no footer strip on desktop (phone has the 56px bottom bar instead).
- Preview chip and state panels · mockup: none; code: `.previewChip` (top 8.2%) and `.statePanel` / `.partialBanner` for loading, partial and unavailable, required by `DATA_CONTRACT_V1`.

### Code audit

- PASS · Manager order · `career-statistics.js::renderTable` loops `["daniel","nik"]` and `fixtures.json rankingRules.careerTable.presentationOrder`; every frame (CS1-CS6) has `managerOrder` Daniel then Nik; row order never flips, only the `#` rank cell changes.
- PASS · Ids and routes · `index.html`: `#careerStatistics`, `#careerStatisticsScreenTitle` (h1, tabindex -1, route-focus target), `#careerStatisticsContent`, `#careerStatisticsRivalryButton`, `#careerStatisticsTrophyButton` and a `.backButton` all exist as in TRUTH.md.
- PASS · Button words · `index.html` and `applyStrings`: CURRENT RIVALRY STATISTICS, OPEN TROPHY ROOM, BACK TO MAIN MENU match the live strings.
- PASS · Dropped fields stay dropped · `fixtures.json strings.comparisonRows` and `renderComparison`: no Showdown Win Rate, Transfer Signings, Signings Released, clean sheets, European wins or biggest single-match win; no identity-link notice.
- PASS · Headline tiles labelled · `renderHeadline`: tile 1 shows a combined number captioned "Together"; tiles 2-4 show a D / N pair, so no unlabelled sum appears.
- PASS · Honest states · `renderState`: ready and partial show the three panels, partial adds a banner with the exact "{READABLE} of {INDEXED} Showdowns readable" line; empty, loading and unavailable hide the panels and show contract heading/body copy; unavailable shows no zeroes.
- PASS · Interim label · `setPreview`: shows `fixtures.json strings.previewLabel` (the "Preview data" chip); frames carry the exact interim label where used.
- PASS · Ranking rule · `rankRows`: wins, then trophies, then career points, as in `rankingRules.careerTable`; CS6 uses `expectedCareerTableRows` for the tie case.
- NOTE · Leaders · `renderLeaders`: only four of the seven `leaderLabels` render (MOST SEASON WINS, MOST TROPHIES, MOST CAREER POINTS, BEST SEASON SCORE); tied values show "Daniel + Nik" with Daniel's portrait. Truth allows these, but names "Daniel" and "Nik" are hard-coded in `leader()` rather than from fixtures.
- NOTE · Rivalry button · `index.html`: the button is always visible; TRUTH.md says it is hidden when there is no current Showdown. No frame field controls it yet.
- NOTE · Back label · `applyStrings`: Back text is fixed in `index.html`, not read from `fixtures.json strings.buttons.back`.
- N/A · Input font size · no `input` text fields; the three radio inputs for phone tabs are visually hidden and have `aria-label`s.

## Fix list

1. `visual-assets/v10_1/career-statistics/career-statistics.css` selector `.headlinePair b`: raise the number size from `clamp(27px,2.55vw,45px)` to `clamp(34px,3.2vw,56px)` so the D / N numbers read as heroes; target: each number at least 75% of `.headlineNumber` height with no wrap at 1366 wide.
2. `visual-assets/v10_1/career-statistics/career-statistics.css` selector `.compareTrack .danielBar`: change `background` from `#2c7399` to `#3da5e0` (the mockup's brighter blue); target: Daniel bar reads clearly blue on the dark panel.
3. `visual-assets/v10_1/career-statistics/index.html` line with class `sd-tagline`: change the text `TWO MANAGERS · ONE LEGACY` to `TWO MANAGERS. ONE LEGACY.`; target: matches the mockup tagline.
4. `visual-assets/v10_1/career-statistics/career-statistics.css` selector `.leaderCard` (add `.leaderCard { position: relative; }` and `.leaderCard::after`): add a gold chevron `content: "›"`, `position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #ffd34d; font-size: 18px`; target: chevron on the right of every leader card, not overlapping the value.
5. `visual-assets/v10_1/career-statistics/career-statistics.css` selector `.actionRow`: change `top: 82.57%; height: 7.97%` to `top: 83.6%; height: 6.4%` (desktop only, above the 900px rules); target: row spans about 83.6-90.0%, closer to the mockup's 84.0-89.4%, with text still on one line.
6. `visual-assets/v10_1/career-statistics/career-statistics.js` function `applyStrings`: also read `fx.strings.buttons.back` into the `.backButton .actionLabel`; target: Back text comes from fixtures, still `BACK TO MAIN MENU`.

Parts: items 1-3 are job 65, items 4-6 are job 150, job 151 has no items.
