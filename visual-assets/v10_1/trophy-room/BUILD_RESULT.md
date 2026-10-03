# Trophy Room desktop build result · JOB-057

## Run

Serve the repository root and open:

`visual-assets/v10_1/trophy-room/index.html?frame=TR1`

The review switcher is `visual-assets/v10_1/trophy-room/preview.html`. Rebuild it with:

`python3 visual-assets/v10_1/trophy-room/tools/build_preview.py`

## Frames

The build renders every authoritative fixture frame from `fixtures.json`:

- **TR1** — ready history, both managers have trophies, ALL category.
- **TR2** — empty career; all four trophy families remain visible, dark, and say `Not won yet`.
- **TR3** — partial provider history; readable values remain visible with the exact coverage warning and `AVAILABLE RECORDS`.
- **TR4** — ready history with `LEAGUE TITLES` selected.
- **TR5** — unavailable provider history; no invented numeric trophy values.
- **TR6** — loading provider history; stable designed shell with no invented zeroes.
- **TR7** — ready history with Nik leading; Daniel remains left/first and rank communicates the lead.

## What changed from the mockup

The visual ceremony stays faithful to the supplied mockup: night stadium plate, Daniel left, Nik right, brush `TROPHY ROOM` title, centered hero trophy/plinth, gold-edged shelf and centered Back control.

Product truth intentionally replaces the mockup where required:

- Real competition trophies and logos were replaced by the four approved original assets: Showdown Champion, League Title, Domestic Cup and Champions League.
- The mockup's competition-specific/special cards were replaced by the exact recorded categories: `ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE`.
- Counts, manager names, ranks, state copy and record values are live DOM text from fixtures; nothing changeable is baked into imagery.
- Unsupported ABOUT/SPECIAL destinations and unrecorded legacy stats were dropped.
- The original plate's manager pixels remain authoritative; `platemap.json` explicitly has no cutout polygons because no arm or hand crosses the shelf panel edge.

## Desktop QA

Evidence is committed under `visual-assets/v10_1/trophy-room/evidence/`.

- Factory QA: **28/28 desktop frame × viewport runs PASS** for TR1–TR7 at 1366×768, 1440×900, 1920×1080 and 1366×640.
- H1 manager order, H5 no-scroll/primary visibility, H6 inputs, H7 reduced motion, control bounds, console, requests and fixture-string gates all pass on desktop.
- Keyboard: all five category tabs and BACK are reachable by Tab and show a 3 px visible focus ring.
- First paint: **855,932 bytes**, below the 900 KB desktop limit.
- Runtime imagery is WebP; PNG masters are not requested by the screen.
- Mockup-diff: **PASS**. Build SSIM 0.512 vs plate 0.527; mean ΔE 12.1 vs plate 13.5; Daniel face 0.976, Nik face 0.982, Daniel hand 0.979, Nik hand 0.972.
- Primary evidence: `evidence/FINAL_TR1_1920.png`, `evidence/diff/scores.json`, `evidence/diff/side_by_side.jpg`, `evidence/diff/heatmap.jpg`, `evidence/desktop_gate.json`, `evidence/desktop_metrics.json`.

## Own scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | **5/5** | `FINAL_TR1_1920.png` preserves the mockup camera/manager positions, and the required mockup-diff gate passes with SSIM/ΔE inside the plate-relative limits. |
| 2. Characters stand out of the menu | **4/5** | Daniel and Nik remain the approved plate pixels with faces unobscured; shelf/hero UI sits between the scene and foreground reading without fabricated character edits. |
| 3. Hands and contact | **5/5** | Protected-hand SSIM is 0.979/0.972 and the authoritative platemap confirms no hand crosses a panel edge, so no seam-prone synthetic cutout was introduced. |
| 4. Lighting and grade | **4/5** | The plate keeps its warm gold stadium grade; hero art adds only a soft gold spotlight, rim/glow, reflection and grounded plinth shadow. |
| 5. Typography and title treatment | **5/5** | The approved `TITLE_TR_V1.webp` brush wordmark is used with hidden semantic text; UI uses shared Barlow/Barlow Condensed and tabular numeric styling. |
| 6. Panel craft | **4/5** | Shelf, tabs and plinth use black/gold glass/metal craft, original trophy art and measured mockup geometry without cover-up panels. |
| 7. Information clarity and honesty | **5/5** | Daniel is always left, Nik right; ready/empty/partial/loading/unavailable states are explicit and failed reads never appear as zero trophies. |
| 10. Polish and finish | **5/5** | Desktop QA has zero console/request errors, WebP runtime assets, crisp original trophy art, reduced-motion support and consistent shared kit styling. |

Every required JOB-057 score is at least 4.

## Hard gates for this desktop job

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 Daniel left / Nik right | **PASS** | 28/28 desktop runs; protected manager markers remain left/right. |
| H2 rights-safe art | **PASS** | Only approved original Trophy Room plate/title and four original trophy assets are requested; no real crests, league logos, trophies or player art. |
| H3 no live/private data baked into images | **PASS** | All names, counts, ranks, records, state copy and categories are fixture-driven DOM text. |
| H4 product truth | **PASS** | Exact four trophy families, five categories, five-state history model and Daniel-first identity order match `TRUTH.md` / fixtures. |
| H6 input/font safety | **PASS** | No failing desktop H6 result; no undersized visible form input exists. |
| H8 keyboard/focus | **PASS** | Five category tabs + BACK all reachable and each has a 3 px focus ring. |
| H9 console/requests | **PASS** | All 28 desktop runs have zero console errors and zero failed requests. |
| H10 mockup diff | **PASS** | All face/hand, SSIM and ΔE thresholds pass in `evidence/diff/scores.json`. |
| H11 desktop page weight | **PASS** | 855,932 bytes ≤ 900 KB. |

## Known gap / next owner

Phone is intentionally not accepted by JOB-057. The shared full-matrix harness records phone `CONTROL_BOUNDS` failures from the horizontally scrolling category strip. **JOB-058 · Trophy Room: phone** owns the 393×660/360×640 recomposition, phone art and phone-specific acceptance. No desktop gate is left open.
