# Standings · build result (JOB-127, part 1 of 6)

## Run
Serve the repository root and open `visual-assets/v10_1/standings/?frame=SD1`. Frames SD1 to SD9 come from `fixtures.json` (SD1 This Showdown ready, SD2 Career ready, SD3 first season, SD4 interim, SD5 loading, SD6 unavailable, SD7 partial, SD8 new career, SD9 level).

## Built so far
- Page shell with the shared tokens, type, ui, stage and motion kit; `standings.js` reads `?frame=` (default SD1) and writes every string and value from `fixtures.json` into plain DOM.
- Stage: the Rivalry plate through the shared stage engine (`ENV_RV_PLATE_V1_1X.webp`, `_2X.webp` on dense screens), atmosphere on, `data-manager` markers for Daniel (left) and Nik (right).
- Layout: brush title STANDINGS, a This Showdown / Career toggle, one scoreboard (Daniel left, Nik right, points large, leader line beneath) and the seven count rows. The toggle only changes the projection (no gameplay, no extra reads).
- Leader rules follow TRUTH.md: This Showdown = higher score; Career = career points, then season wins, else "Level"; partial history shows no leader; loading and unavailable show no numbers.
- All five states have copy: loading, empty (first season zeros, no active Showdown, new career), partial (coverage line and "Available history"), unavailable, ready. The interim sentence shows in SD4.
- Phone (max-width 900 px): Rivalry phone art on top, the board below, 56 px bar reserved as `.nav-reserve`. Club names are hidden on phone (crest plus name remain); the rows scroll inside the board only in the longest states.

## Not yet (later parts)
Depth cut-outs over the board edge, motion, review and fix rounds.

## QA
Rendered at 1366 × 768, 1366 × 640, 393 × 660, 360 × 640 and 375 × 553: no page scroll and no script errors on SD1, SD2, SD3, SD4, SD6, SD7, SD9. Daniel is left and Nik right in every frame.

## Phone (JOB-203, JOB-204)

Phone is `max-width: 900px`: Rivalry phone art on top (positions from `phonemap.json`: Daniel left -3% / top 1% / height 61%, Nik left 48% / height 63%), the brush title, the toggle (44 px), the scoreboard and seven rows below, the 56 px bar reserved as `.nav-reserve`. Club names are hidden on phone (crest and name stay). In the longest states the board scrolls inside itself.

### Height budget (stage = viewport − 56 px bar − safe area)

| Phone | Stage | Header | Board | Gaps and padding | Art zone left | Page scroll |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 393 × 660 | 604 | 78 | 290 | 18 | 218 | none |
| 360 × 640 | 584 | 78 | 270 | 18 | 218 | none; last row scrolls in the board |
| 375 × 553 | 497 | 78 | 220 (floor) | 18 | 181 | none; toggle and scoreboard visible |

Measured in a real browser on SD1 to SD9: no page scroll at all three sizes, Daniel left in every frame.

### Check by reading (criteria 1-7, 9, 10: aim 4 or more)

Every number and name is live DOM text from fixtures.json; Daniel is first and left in the markup and on screen. First paint by file size: phone about 425 KB (ENV 120 + heroes 110 + title 120 + kit and code 75), desktop about 440 KB at 1x (plate 244 + title 120 + kit and code 75), under the 450 KB and 900 KB caps. Claude re-scores the visual criteria at intake.

## Fix round and intake fix (04 Oct)

- Preview tag moved clear of the heads (desktop top -6.2vh, phone left 12px); row labels 12-15px desktop, 11px phone.
- Shared top nav mounted with STANDINGS active; desktop header and board moved below the 52px bar (short desktops: smaller wordmark, tagline hidden).
- Phone head-to-head table now ends on a whole 18px row at every height (rows height snapped with `round(down, ...)`, 36px minimum) with a gold bottom fade while more rows wait. At 375x553 two rows show, at 393x660 all seven.

## Motion

`data-sd-enter` on scene, both phone heroes, title block and board; `sdEnter` runs after the first render.
