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
