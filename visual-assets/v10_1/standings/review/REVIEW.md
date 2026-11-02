# Standings independent review

## Verdict

FAIL

Static score 38 / 45 = 4.2 average (criteria 1-7, 9, 10): on the pass line, no criterion below 3, H1-H4 pass by reading. The verdict is FAIL only because the hard gates H5-H11 are still NOT MEASURED or partial (Claude measures); every hard gate must be PASS for a PASS verdict. The fix list holds small polish items for the measured defects found on a real render.

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | No Standings mockup exists (TRUTH.md); the screen reuses the Rivalry plate safe zones (title 485..1195 x 86..246, panel from x 462..1210) and the same title and panel language. |
| 2 · Characters stand out | 4 | Daniel's pointing hand and Nik's crossed arms come from the shared Rivalry plate, left and right of the board with no faces covered. |
| 3 · Hands and contact | 4 | The hand sits at the board's left edge with the plate's own contact; no UI crosses it (render at 1366x768). |
| 4 · Lighting and grade | 4 | Warm plate, dark board with a soft gradient and gold edge; no flat grey cover box beyond the board itself. |
| 5 · Typography and title | 5 | Large gold brush STANDINGS wordmark with hidden real text, spaced eyebrow and tagline, tabular numerals. |
| 6 · Panel craft | 4 | One board with a segmented This Showdown / Career toggle, club crests, a big 9 : 8 score and seven evenly spaced rows; the rows are text-only with no trophy art. |
| 7 · Information clarity and honesty | 5 | The leader line ("Daniel leads"), season progress, designed loading, empty, unavailable, partial and interim states; no invented stats. |
| 9 · Phone composition | 4 | Heroes in the top band, board below with an internal scroll only in the longest states, 44 px toggle; bar reserve kept (JOB-127). |
| 10 · Polish and finish | 4 | Clean renders at 1366x768 and 393x660 with no scroll or errors; the preview chip crowds the crown and the phone chip sits on Nik's arm. |

Total 38 / 45 = 4.2 average.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | Daniel is the left column and the top-first row on phone; JOB-127 checked Daniel x < Nik x on every frame and size. |
| H2 · Rights-safe assets | PASS | Showdown plate and title, crests are original code-drawn ones. |
| H3 · No live/private data baked into images | PASS | All values are DOM text from `fixtures.json`. |
| H4 · Product truth | PASS | Rows are the contract fields (score, season wins, draws, losses, Champions Leagues, League Titles, Domestic Cups, Total Trophies); no invented stats. |
| H5 · Phone fit | PASS by arithmetic (Claude measures) | JOB-127: scrollHeight equals the viewport at 393x660, 360x640, 375x553 on all nine frames; the board scrolls inside itself only in the longest states. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures) | Toggle is 44 px on phone; no contrast ratio recorded. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | Motion is a later part. |
| H8 · Keyboard / focus | PARTIAL (Claude measures) | `standings.js` handles ArrowLeft/ArrowRight on the tabs; no focus-ring measurement. |
| H9 · Console / requests | PASS (Claude measures) | Real-server renders in this review: no console errors. |
| H10 · Mockup diff | N/A | No Standings mockup; the gate applies only to protected regions shared with Rivalry. |
| H11 · First-paint weight / WebP | NOT MEASURED (Claude measures) | No network measurement. |

## Evidence

### Claude measurements

- `project-documents/factory/status/JOB-127.md`: Claude check 02:32 UTC, checked with 204; H5 by arithmetic on nine frames at three phone sizes.
- `project-documents/factory/status/JOB-200.md`: title moved to the same top position as Rivalry and the board shifted down.
- No `evidence/QA_SUMMARY.md` or `scores.json` exists for this screen.

### Mockup differences

Reference scope: TRUTH.md says no Standings mockup exists, so the Rivalry Statistics mockup (`MOCKUP_RIVALRY_STATISTICS.png`) is the system reference; differences are descriptive.

- Title block · reference: eyebrow y~12%, brush title y 14-21%, tagline y~24%; code: `.sdg-header` left 29%, top 9.1%, width 42% (same as Rivalry), brush STANDINGS.
- Board · reference (Rivalry totals): x 28.1-71.9%, y 26.8-63.1%; code: `.sdg-board` x 27.63-72.37%, y 34.8-88.8%, a taller board because it holds the toggle, score and seven rows.
- Toggle · reference: none; code: THIS SHOWDOWN / CAREER segmented tabs at the board top, required by TRUTH.md.
- Score block · reference: club crests with names left and right, numbers in rows; code: crest, name and club for each manager around a large gold 9 : 8 and a "Daniel leads" line.
- Rows · reference: icon in the middle column; code: text labels only (no icons), seven rows.
- Preview chip · reference: none; code: `.sdg-preview` top -4.4vh, centred over the crown at desktop; right of the board's top edge on phone.
- Managers' areas · reference: Daniel pointing left, Nik arms crossed right, script captions; code: same plate; Daniel left, Nik right.
- Footer, back button · reference: Back button below the panels; code: none (Standings is a hub tab; the phone bottom bar is reserved).

### Code audit

- PASS · Manager order · `standings.js` and `index.html`: Daniel first in every row and frame; Nik never swaps sides.
- PASS · Honest states · `fixtures.json` SD1-SD9 cover this-showdown and career views, loading, empty, unavailable, partial and interim.
- PASS · Fixture-driven words · `fixtures.json strings` holds labels, templates and the leader line.
- PASS · Accessible tabs · `index.html` role tablist, role tab, aria-selected, aria-live status; arrow keys in `standings.js`.
- PASS · Phone touch targets · `standings.css` phone block: toggle buttons 44 px.
- PASS · No PNG master and no live data in images.
- NOTE · Navigation lock · TRUTH.md asks the screen to respect "Finish this step first"; the code has no lock state. The lock belongs to the shared top bar (nav.locked), so no change here, but the integration job must confirm it.
- NOTE · No `data-sd-enter` attributes yet; motion is a later part.
- N/A · No text inputs.

## Fix list

1. `visual-assets/v10_1/standings/standings.css` selector `.sdg-preview` (desktop rule): change `top: -4.4vh` to `top: -6.2vh`; target: the chip clears the crown by at least 6 px at 1366x768 and 1366x640.
2. `visual-assets/v10_1/standings/standings.css` selector `.sdg-preview` inside the phone media block: change `right: 0; bottom: calc(100% + 4px)` to `left: 12px; bottom: calc(100% + 4px)`; target: the chip sits over Daniel's side, not Nik's arm, and stays inside the viewport.
3. `visual-assets/v10_1/standings/standings.css` selector `.sdg-board` row separators (the rule that draws the row lines): raise label size to `clamp(12px, .95vw, 15px)` for the row labels; target: row labels at least 12 px at 1366x768 and 11 px on phone (currently about 11-12 px).
