# CLUB-V1 · Club Assignment on the Club plate · BUILD RESULT

Brief: `visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md` (R3.4) on `claude-cloud/hlc-goals`, launched by `visual-assets/goals/CC-003_club-build.md`.
Method: "paint the stage, place the live text". Built by Claude (Opus 5.5, effort High). Role: build and evidence only, no self-approval.

| | |
| --- | --- |
| Start / end | 2026-10-01 21:51:22 UTC / 22:34 UTC (43 min of the 60 min STOP_BUDGET) |
| Branch | `claude-cloud/club-v1` |
| Base (C1b) | `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (intake commit `53d6b5a`) |
| Crest merge | `ACCEPTED_CREST_SHA=f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` merged with `--no-edit` as `7a1e24f`; `window.getClubCrestSvg` present |
| SOURCE_DRIFT | none: `origin/main` = `2de237391e17c7de2c6deb606b102b68ee640212` = the approved anchor |
| Head SHA | the final `visual: CLUB-V1` commit on `claude-cloud/club-v1` (reported in the reply; a file cannot contain its own commit SHA) |

## Run
```
# from the repo root (so the shared ../ paths resolve)
python3 -m http.server 8765
# open http://127.0.0.1:8765/visual-assets/v10_1/club/index.html?frame=CL1
#   frames CL1..CL6 · &grid=1 platemap + hand polygons · &t=0..1 pack-rip timeline (CL3-CL6)
#   &play=1 plays the 1.5 s rip · &rm=1 forces the reduced-motion crossfade · ?frame=S0 plate only
cd visual-assets/v10_1/club
NODE_PATH=$(npm root -g) node tools/render-qa.cjs http://127.0.0.1:8765/visual-assets/v10_1/club/ evidence
python3 tools/zone_evidence.py          # intake-zone cover side-by-sides
python3 tools/build_preview.py <commit> # preview.html (single file, plate 1X as data URI)
python3 tools/build_fixtures.py         # fixtures.json from origin/main (asserts every string exists on main)
python3 tools/make_hand_masks.py        # assets/handmap.json (hand polygons) from the plate
```
Phone layout: any portrait viewport up to 760 px wide (same URL).

## Frames
CL1 ready · CL2 opening · CL3 manager-one · CL4 manager-two · CL5 versus · CL6 confirmation. Strings and controls are ported from `js/clubAssignment.js` on main (`renderReadyAssignmentState`, `renderClubRevealStage`, `renderClubConfirmationState`, `populateClubConfirmation`, `setRevealControls`, `applyClubRevealCard`).

## Item status (PRIORITY_ORDER)
| Item | Status |
| --- | --- |
| K0 source check + crest merge | DONE (no drift; crest SHA merged; `fixtures.json` built from main by `tools/build_fixtures.py`) |
| K1 desktop CL1 ready | DONE |
| K2 desktop CL6 confirmation | DONE (matchup row kept on desktop; lock note 2 lines) |
| K3 pack-open treatment + OWNER-3 rip | DONE (CL3-CL6, desktop + phone; QA below) |
| checkpoint commit + push | DONE (`53f3265`) |
| K4 phone CL1 + CL6 | DONE (all four phone viewports) |
| K5 frames CL2, CL4, CL5 | DONE (CL2 static gold edge pulse on both packs) |
| G gates | DONE: G1-G7, G9-G12 pass at every frame and viewport; **G8 BLOCKED at 1366x640 only** (header band over the faces, see Known limits) |
| C9 deliverables | DONE |

## Plate mapping (C4b)
One function, `plateToScreen(x, y)` in `club.js`, drives the world layer, covers, reveal, hand overlays, `&grid=1` and every QA box.
- Desktop: `k = max(W/1536, H/864)`, `offX = (W − 1536k)/2`. Vertical bias: `offY = min(64 − 65k, H − 28 − 814k − 2)`, clamped to `[H − 864k − 28, 56]`. The faces clear the 56 px header by 8 px and the buttons stay above the 28 px footer. The plate may slide under the header or footer chrome but never leaves a visible gap.
- Phone band: its own transform, written in `computeTransform()`. In CL1–CL4 the slot is filled with `k = max(w/1536, h/864, min(w/1030, h/554))`, centred on plate x 768 and on y between 50 and 604, so both faces stay whole and any extra height shows more stadium. In CL5/CL6, or when the band is too short to keep both faces whole, the window is plate `[262, 384, 1278, 604]` (pack bodies) at `k = w/1016`. That keeps the faces and top hands fully out of frame. The band slot is capped at 0.82 × viewport width.

## Intake zones: what the UI hides (owner request: VS and League-confirmed zones)
Evidence: `evidence/ZONES_CL1_1366x768_side_by_side.jpg` and `ZONES_CL6_…` (left: plate with zones in magenta; right: built frame, still-visible zone-edge segments in red). Per-viewport segments are in `qa_report.json → shots[].zones`.

Covers are `aria-hidden` dark-glass SVG shapes registered through `plateToScreen`. They are recomputed per viewport so they stay at least 8 screen px clear of faces, hands and packs.
- **VS zone `[680,405,850,555]`** (darkest, ratio 2.89 → 1.10): fully hidden by the VS medallion `[622,399,890,562]`. The medallion also hides the leftover VS brush streaks either side (x 637–680 and 851–887). No residual.
- **Rail zone `[552,306,980,388]`** (ratio 2.19 → 1.10): hidden by the banner's lower step `[560..985, …394]`, except the **left edge at x 552, y 326–388**. That edge is within 8 px of `pack_daniel` (x ≤ 550), so it cannot be covered. It is a faint darker sliver beside Daniel's pack (luminance step 5.9).
- **Title / LEAGUE CONFIRMED zone `[458,92,1070,298]`**: hidden by the banner `[465..1030, 86..325]`, except:
  - the **left edge at x 458, y 92–298** (208 plate px), 3 px from `face_daniel` (x ≤ 455). It shows as a faint darker strip beside Daniel's hair (step 11.6).
  - the **x 1031–1040 strip** beside `face_nik`, ending at the face-box seam at x 1040 (step 15.1).
  - Both are within the 8 px face clearance, so the UI may not cover them.
- **Panel-tab zone `[556,572,980,628]`**: covered by the raised panel tab, except its top corners. Those are y 572, x 556–602 and x 920–980, plus the 34–36 px of the side edges above y 606. They sit inside the side-hand clearances, so the tab steps around the hands. Perceptually they read as the stadium ad-board line, not a seam.
- **Bottom-panel zone `[140,598,1400,742]`**: the bottom edge (the only visible one, step 18) is covered. The top edge and the x 1400 edge stay uncovered in the pack and hand clearances, but their steps are 1.2 and 2.0, so they are invisible.
- **Buttons `[444,744,1086,806]` and footer `[0,812,1536,864]`**: covered by the dock and footer apron.
- **Header zones** (nav bar, icons, script): covered by the header and its shadow apron. The exception is the nav-bar bottom edge at y 78, x 250–464, above Daniel's head (step 3.2, faint). The apron skips the face columns.
- **Phone**: the same covers apply, but the phone has no header over plate y 22–78. At 390×844 and 430×932 CL1–CL4, the nav-bar and header-icon zone edges show in the band's sky (steps 1.8–6.9, faint). In CL5/CL6 and at 375×553 the band shows the pack bodies only, so those edges are out of frame.

## Pack rip geometry (OWNER-3, plate px)
- Hands: `platemap.json` has **no hand boxes**. `tools/make_hand_masks.py` traces the four gripping hands from the plate (skin hue, close, fill, +3 px) into clip-path polygons in `assets/handmap.json`. Their bounding boxes act as the hand protected boxes for G8 (open question for Sol). The boxes are: `hand_daniel_top [224,284,396,376]`, `hand_daniel_side [514,448,584,572]`, `hand_nik_top [1114,282,1286,376]`, `hand_nik_side [940,458,1014,586]`.
- Each side has a `.reveal` container sized to its pack box with `overflow:hidden`, so nothing can leave the pack box. Layers, bottom to top:
  - darken 35 % (pack-body polygon);
  - the opened interior (a jagged hole lit from inside);
  - the torn foil edge (zig-zag, 10 plate px peak to peak);
  - the gold burst (14 SVG rays plus a glow, `mix-blend-mode: screen`, 0.70 max opacity, settling at 0.42);
  - the crest (`getClubCrestSvg`, 140 plate px ≈ 55 % of the pack width, 1 px gold rim plus glow), centred on the pack's crown shield;
  - the top strip: a duplicate plate layer clipped to the strip polygon, which tugs, snaps, flips forward and falls away.
- The hands are restored above everything as duplicate plate layers (the same 1X/2X plate image, same size and origin) clipped to the traced polygons. No new raster.
- Timeline: 1.5 s, Web Animations on `transform` and `opacity` only. The strip tugs from 0 to 24 %, snaps and flips from 24 to 68 %. The hole opens at 14–26 %, the burst peaks at 34 %, and the crest rises from the opening from 28 % to a peak at 62 % (plate y 400), then settles into the shield at 84–100 %. `prefers-reduced-motion` (or `&rm=1`) gives a 0.6 s opacity crossfade to the same end state.

## QA (evidence/qa_report.json · 54 frame shots + grid/plate-only + OWNER-3 strips)
| Gate | Result |
| --- | --- |
| G1 strings | 0 missing / 0 extra in all 54 shots |
| G2 ids/aria | all 24 product ids exactly once; `aria-live=polite` on status and confirmation; rail and doors `aria-hidden` |
| G3 no scroll | pass (including 360×640 and 375×553 CL6) |
| G4 primary | pass, including 375×553 and 1366×640 (CL2–CL5 exempt) |
| G5 clipping | 0 |
| G6 sizes | pass (phone controls ≥ 44 px, text ≥ 12 px, lock note 14 px) |
| G7 contrast | pass; lowest ratio 4.28 is the large `CLUB ASSIGNMENT` title at 1366×640 (needs 3); lowest normal text 5.16 (`SEALED`) |
| G8 faces/hands | pass everywhere except **1366×640**. At 1366×768: smallest face clearance 16.5 px; smallest hand clearance 33.8 px (CL1–CL4) and 8.9 px (CL5/CL6, confirmation box beside the side hands). (b) reveal containment error ≤ 0.02 px with `overflow:hidden`. (c) 0 live text, control or panel inside a pack box |
| G9 imagery | only `ENV_CLUB_PLATE_V1_{1X,2X}.webp` plus inline SVG and fonts; the G9 forbidden-asset grep over this folder = 0 hits (see note) |
| G10 sides | all player-one centres < player-two; plate SHA-256 at load = intake (1X webp `398e74fa…`, 2X webp `fed849bb…`) |
| G11 tab order | = visual order (SIGN IN, then OPEN SHOWDOWN PACKS, BACK / CONFIRM) |
| G12 clean run | 0 console errors, 0 failed requests |
| G13 chrome | header box 0,0,1366×56; footer 0,740,1366×28; styles in the report |

OWNER-3 QA (`qa_report.json → owner3`, 1366×768 and 390×844, CL3–CL6). Each frame has a strip `evidence/RIP_<frame>_<vp>_strip.jpg` at 0/25/50/75/100 %.
1. Containment: every reveal layer sits inside the pack box (`overflow:hidden`, rect error ≤ 0.02 px).
2. Overlap regions: daniel top `[290,335,396,376]`, daniel side `[514,448,550,572]`, nik top `[1114,335,1250,376]`, nik side `[995,458,1014,586]`.
3. The overlap is fully covered by the overlay: the clip polygons match `handmap.json`, and the overlays are painted after every reveal layer.
4. Registration error: 0 px.
5. Reveal pixels above a hand: 0 changed px at every t. The check compares the frame against the same page with the reveal hidden, inside the hand polygons eroded by 1.5 px; pixels checked per frame are listed in the report.
6. Live text, controls or panels in hand boxes: 0 (G8).
7. Face clearance: as G8.
8. Reduced motion: end-state difference in the pack boxes is ≤ 59 of 103 500 px (antialiasing of the transformed crest vs the untransformed one). Evidence in `RIP_*_reduced_motion_{mid,end}.jpg`.

## Known limits
1. **1366×640 G8 BLOCKED (structural).** The plate needs 646 px between the title and the buttons, and the viewport has 556 px between header and footer. The bias keeps the primary button visible (G4 passes), so the 56 px header bar and its controls sit over the top of both faces. Measured: face tops 98.8 px (Daniel) and 112.1 px (Nik) above the header bottom; SIGN IN and `No Active Showdown` overlap `face_nik`; the brand overlaps `face_daniel` (2.1 px). Options for Sol: accept it at this short viewport, letterbox the plate under a compact header, or scale the title block out of the plate region.
2. The hand protected boxes come from this build's tracing, not the intake platemap (see Pack rip geometry).
3. Intake-zone edges that cannot be covered without breaking face or pack clearance are listed above.
4. At 375×553 the band shows the pack bodies only in every frame. Both faces are fully out of frame, because a 72–100 px band cannot hold them whole at the plate's minimum scale (K4: whole or out, never cut).
5. CL6 at 375×553 visually hides the duplicate matchup row (K2 allowance). It stays in the DOM. Desktop and the other phone viewports show it.
6. G9 grep note: the forbidden-asset grep is a raw byte match, and one evidence JPEG's compressed bytes happened to contain that 4-letter sequence. Evidence JPEGs are re-encoded until the grep over this folder returns 0 hits; no file references that asset.
7. The h2 uses a synthetic italic: the shared fonts folder ships Barlow Condensed 700 upright only.
8. Static checkpoint (C4): frames render at end states. The rip motion runs only with `&play=1` or is driven by `&t=` for evidence.
