# Career Statistics independent review · part 1 of 4

## Verdict

Pending parts 2 to 4 (jobs 147, 148 and 149).

## Scorecard

Pending parts 2 to 4. No criterion is scored in this setup/measurement carry pass.

## Hard gates

Pending parts 2 to 4. Part 1 only records Claude-measured evidence; an absent measurement is not treated as a failure.

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

Pending parts 2 to 4.
