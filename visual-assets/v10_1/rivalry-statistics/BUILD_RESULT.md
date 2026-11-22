# Rivalry Statistics · desktop build result

## Run
Serve the repository root and open `visual-assets/v10_1/rivalry-statistics/?frame=RV1`. Frames RV1–RV7 are fixture-only review states. `preview.html` switches between them.

## Built
The desktop screen keeps the approved 1672×941 Job-25 plate registered through the shared stage engine. The brush title uses `TITLE_RV_V1.webp`; club identity uses the original `getClubCrestSvg` system; the comparison panel contains only contract-recorded rows. Three measured lower panels show Head-to-Head, Season-by-Season and the four-item original Trophy Cabinet. Daniel stays left and Nik right. Corrected full-canvas manager cutouts create the depth sandwich over the panel edge with contact shadows and warm rim masks.

## Product-truth changes from the mockup
Real crests and trophies are replaced with project-owned art. Unrecorded mockup statistics are not exposed as rivalry aggregate rows. Transfer Signings is shown only when transfer history is available; unavailable transfer history displays `Unavailable`, never zero. Partial history shows coverage before subset totals. Loading/unavailable/empty states use explicit designed messages.

## Frames
- RV1 active, mid-way, transfers ready
- RV2 completed Showdown
- RV3 first season, nothing completed
- RV4 rivalry data ready, transfer history unavailable
- RV5 loading
- RV6 unavailable read
- RV7 partial read with visible coverage

## QA
All seven frames were exercised at 1366×768, 1440×900, 1920×1080 and 1366×640 with no page scroll, manager-order failures or console/page errors in the local review harness. The current branch's clean approved plate was inspected directly through the GitHub connector. A no-plate fallback mockup comparison cleared the fallback thresholds (SSIM 0.635, ΔE 7.0).

Because the connector cannot materialize the current binary plate into the local browser sandbox, the exact plate-relative H10 calculation is intentionally left for Claude to rerun after applying the binary zip; this file does not claim an exact plate-relative PASS.

The first overlay draft was rejected because it captured stale mockup UI pixels. The handoff uses corrected manager-only contours: Daniel alpha bbox [192,350,340,552], Nik [1229,497,1537,588]. Nik's cutout ends above the lower-panel boundary at y=594.

First-paint runtime uses WebP assets only; PNG overlay masters are review/source files and are not referenced by the page.

## Scorecard
| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 Mockup fidelity | 4 | measured title/panel geometry and clean registered plate; exact H10 rerun delegated to Claude after binary apply |
| 2 Characters out of menu | 4 | corrected registered overlays sit above panel/UI with rim/contact treatment |
| 3 Hands and contact | 4 | manager-only source-pixel contours; no panel/text contamination |
| 4 Lighting and grade | 4 | approved warm plate plus gold rim and dark glass |
| 5 Typography/title | 4 | supplied brush wordmark, Barlow UI, tabular hero numerals |
| 6 Panel craft | 4 | measured gold glass panels and original trophy art |
| 7 Information clarity/honesty | 5 | contract-only rows and explicit unavailable/partial states |
| 10 Polish/finish | 4 | no page-scroll/order/error failures in desktop harness |

## Handoff
The GitHub connector in this chat can write text but cannot push locally generated binary cutouts. `JOB-067.zip` contains the corrected PNG/WebP overlays, their intake report, the overlay diagnostic, QA report and the final DONE status for Claude to commit. Claude should rerun the exact plate-relative mockup gate after applying the zip.

## Phone (JOB-068, part 1 of 3)

Phone is `max-width: 900px`. The stage is `100svh - 56px - safe area`; the 56 px bottom bar is a `.nav-reserve` placeholder. All measures are inside that stage.

- Top: portrait stadium `ENV_RV_PHONE_V1.webp` (cover, 50% 36%) with Daniel (left -3%, top 1%, height 61%) and Nik (left 48%, height 63%) from `phonemap.json`. Both heads are fully visible. Daniel is left. Dark gradient from 36% down so the UI reads.
- Middle: eyebrow, brush title (`TITLE_RV_V1_PHONE.webp`), tagline, then the honest line "Current Showdown only. Career history is not yet available."
- Tabs: TOTALS · HEAD-TO-HEAD · SEASONS · TROPHIES (real `role=tab` buttons, arrow keys work). One panel at a time; desktop shows all four and hides the tabs.
- Bottom: one primary button, BACK TO SHOWDOWN HOME, 44 px.
- Preview data chip sits in the top-right corner, clear of both faces.

Height budget at 393 × 604 stage: art zone about 215, title 70, line 14, tabs 38, panel 189, button 44, gaps and padding about 34. On 360 × 640 the panel is 169 px; on 375 × 553 it falls to a 120 px floor and the button stays visible (rows scroll inside the panel).

First paint (phone): ENV 120 KB + heroes 110 KB + title 39 KB + CSS/JS about 20 KB = about 290 KB (cap 450 KB).

Desktop at 1366 × 768 is unchanged.

### Phone, part 2 and 3 (JOB-154, JOB-155)

- Showdown Points are the big score strip (30 px numbers on a soft gold band) at the top of the Totals tab, Daniel left, Nik right; the other six rows are the compact list.
- Controls: tabs and the BACK button are 44 px tall; the BACK button is pinned above the 56 px reserved bar; this screen has no inputs, so the keyboard case does not apply.

#### Height budget (stage = viewport − 56 px bar − safe area)

| Phone | Stage | Fixed (title 70, line 14, tabs 46, button 44, gaps 24, pad 12) | Panel | Art zone left | Page scroll |
| --- | ---: | ---: | ---: | ---: | --- |
| 393 × 660 | 604 | 210 | 191 | 203 | none |
| 360 × 640 | 584 | 210 | 171 | 203 | none |
| 375 × 553 | 497 | 210 | 120 (floor) | 167 | none; BACK visible, rows scroll inside the panel |

Measured in a real browser: scrollHeight equals the viewport at all three sizes. At 360 × 640 the last Totals row scrolls inside the panel. Bigger phones grow the panel.

## Fix round (JOBS 70, 159, 160)

Six review items applied on desktop from 901 px up: trophy art scales with the width (64 px on short laptops), a decorative caption sits under the Head-to-Head numerals (hidden on phone), the title spans about 31-70%, the lower panels, the Back row and the totals panel use the mockup spacing. The phone layout is unchanged.

## Motion · JOB-071 part 1

The standard shared entrance follows the screen hierarchy and does not add a screen-local timing system. `sdEnter(#stage-root)` owns the choreography; the layout is final before motion begins.

| Order | Shared timing | Element | Selector | `data-sd-enter` | Intent |
| ---: | --- | --- | --- | --- | --- |
| 1 | 0–400 ms | Full rivalry scene | `#stage-root` | `scene` | Fade from black and settle the complete stadium composition without layout shift. |
| 2 | 150–600 ms | Daniel, left | `.rv-cutout--daniel`, `.rv-rim--daniel`, `.rv-phoneHero--daniel` | `character-left` | Bring Daniel inward from the left; the desktop cutout and rim stay registered while the phone hero uses the same role. |
| 3 | 150–600 ms | Nik, right | `.rv-cutout--nik`, `.rv-rim--nik`, `.rv-phoneHero--nik` | `character-right` | Bring Nik inward from the right; the desktop cutout and rim stay registered while the phone hero uses the same role. |
| 4 | 250–700 ms | Rivalry Statistics brush title | `#statisticsScreenTitle` | `title` | Run the shared brush reveal and one metallic glint. |
| 5 | 400–900 ms | Rivalry totals hero | `#rvPanelTotals` | `panel` | First and most important data panel. |
| 6 | 460–960 ms | Head-to-Head | `#rvPanelHead` | `panel` | First supporting comparison panel. |
| 7 | 520–1020 ms | Season-by-Season | `#rvPanelSeasons` | `panel` | Second supporting history panel. |
| 8 | 580–1080 ms | Trophy Cabinet | `#rvPanelTrophies` | `panel` | Final supporting panel. |
| 9 | 760–1080 ms | Back to Showdown Home | `#rvBack` | `button` | Primary action enters last with the shared single payoff pulse. |

Reduced motion is inherited from the shared kit: either `prefers-reduced-motion: reduce` or the application preference collapses the entrance to a 150 ms fade and suppresses slides, scaling, wipe/glint and the button pulse. The shared cleanup ends by 1.2 s and no motion changes document flow.



## Motion · JOB-161 part 2

Part 2 adds the screen-specific payoff without changing Rivalry Statistics data, navigation or shared entrance timing. All values remain live DOM text from the fixture/model. The screen uses the shared motion kit for counting, leader completion flash, reveal and particles; the only local keyframes are the directional row deal and the 180 ms scoreboard slam. Motion is transform/opacity only. The shared reduced-motion preference suppresses the local travel/slam/burst and `sdReveal` collapses to the kit's 150 ms fade.

| Moment | Start | End | Duration / stagger | Selector | Motion / kit |
| --- | ---: | ---: | --- | --- | --- |
| Rivalry row deal | 0 ms | 500 ms | 260 ms each, 40 ms row stagger | `#rvRows .rv-row .rv-value.left/right` | Left values enter from −18 px, right values from +18 px using `cubic-bezier(.22,1,.36,1)`; opacity + transform only. |
| Row number count + leader flash | 0 ms | 740 ms | 500 ms count, same 40 ms stagger | `#rvRows .rv-value` | `sdCountUp`; the numeric leader receives `sd-count-leader`, so the shared `sd-count-leader-flash` fires once on completion. |
| Head-to-head reveal | 0 ms | 810 ms | shared 300 + 90 + 420 ms recipe | `.rv-headGrid` | `sdReveal` supplies anticipation, flash and settle from `motion.css`. |
| Head-to-head scoreboard slam | 390 ms | 570 ms | 180 ms | `.rv-headStat strong` | Scale 1.3 → 1.0 plus opacity using `cubic-bezier(.22,1,.36,1)`. |
| Head-to-head gold burst | 600 ms | 960 ms | 360 ms, 24 particles | `.rv-bottom--head .rv-motion-burst` | `sdBurst` at panel centre; particle count remains below the shared cap of 60. |

Constants live in `RV_MOTION` in `rivalry-statistics.js`: row duration/easing/stagger, count duration, head slam delay/duration/easing, reveal duration reference, and burst delay/duration/count. The local CSS reads those values through custom properties so the timing contract is visible in one place.

Claude intake evidence target: record desktop frame strips for row deal/count completion, the 390–570 ms head-to-head slam, the 600 ms burst onset and the settled ≤960 ms state under `evidence/motion/`; also capture reduced motion showing no travel, slam or particles.


## Motion · JOB-162 part 3 finish line

Part 3 closes the motion pass with interaction feedback, tab/toggle cross-fades and explicit reduced-motion coverage. The shared entrance, Job 161 signature payoff and Job 162 interaction layer overlap; the longest shared element settles at 1.08 s, inside the 1.2 s cap. At 0.60 s the scene and both managers are settled, the totals panel is already visible and interactive, and no motion rule disables pointer events, so the screen is usable while the remaining secondary panels finish.

| Element | Delay | Duration | Easing |
| --- | ---: | ---: | --- |
| Full scene settle | 0 ms | 400 ms | shared ease-out cubic |
| Daniel / Nik character entrances | 150 ms | 450 ms | shared character ease-out |
| Brush title reveal | 250 ms | 450 ms | shared title wipe easing |
| Totals panel rise | 400 ms | 500 ms | shared panel ease-out |
| Head-to-Head panel rise | 460 ms | 500 ms | shared panel ease-out |
| Season-by-Season panel rise | 520 ms | 500 ms | shared panel ease-out |
| Trophy Cabinet panel rise | 580 ms | 500 ms | shared panel ease-out |
| Back button payoff | 760 ms | 320 ms | shared button ease-out |
| Rivalry row values, rows 1–7 | 0–240 ms, 40 ms stagger | 260 ms each | cubic-bezier(.22,1,.36,1) |
| Rivalry number counts | 0–240 ms, same stagger | 500 ms each | shared easeOutCubic |
| Head-to-Head reveal | 0 ms | 810 ms | shared sdReveal keyframes |
| Head-to-Head score slam | 390 ms | 180 ms | cubic-bezier(.22,1,.36,1) |
| Head-to-Head gold burst | 600 ms | 360 ms | shared sdBurst physics |
| Control hover state | event driven | 100 ms | ease-out |
| Control press state | event driven | 80 ms | ease-out |
| Tab / toggle cross-fade | state change | 110 ms | ease-out |

No interaction transition exceeds 120 ms. Hover and press animate only opacity, colour, border colour, transform and filter on the small controls; the tab body cross-fade animates opacity only, so no document-flow property changes and there is no layout shift.

Reduced motion has both required paths. The system path is `@media (prefers-reduced-motion: reduce)`; the app path comes from `motion.js` through `html[data-motion-reduced="true"]` and the mounted `#statistics[data-sd-motion-reduced="true"]` dataset. In those states local travel, scaling, filter feedback and particles are removed; local state changes use a short opacity-only fade, while the shared kit keeps its own 150 ms reduced-motion fade.

Criterion 8 self-score: **5 / 5**. Evidence: staged shared entrance plus row deal, 500 ms counts, leader flash, head-to-head reveal/slam and restrained 24-particle payoff; 1.08 s maximum entrance, usable by 0.60 s; 80–110 ms control feedback; transform/opacity-only travel; and both reduced-motion paths collapsing to fades without layout shift.
