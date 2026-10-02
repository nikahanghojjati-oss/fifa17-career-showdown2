# Job 1 baseline · four built screens

Source branch: `factory/v1-wtt5ye`  
Pinned visual source: `a485975c191e4cd6a0732d06e4f541184bd0098c`  
Capture date: 2026-10-02 UTC

This baseline is a review snapshot, not a visual rewrite. No product visual source files were changed.

## Capture matrix

Every listed frame has these four fresh PNG captures:

- `1366x768` at DPR 1
- `1920x1080` at DPR 1
- `393x660` at DPR 3, producing 1179x1980 physical pixels
- `360x640` at DPR 1

Total: 112 screenshots. Raw browser error evidence is in `console-check.json`. Native QA and mockup-diff results are summarized in `qa-summary.json`.

### Home

Frames: `HM1`, `HM2`, `HM3`  
Files: `home/<FRAME>_1366x768.png`, `home/<FRAME>_1920x1080.png`, `home/<FRAME>_393x660.png`, `home/<FRAME>_360x640.png`  
Main comparison frame: `HM1`  
Comparison: `home/COMPARE.png`

Console check: 3/3 states clean. Zero console errors, page errors, failed requests, or navigation failures.

Native render QA: 33/33 shots pass, 0 fail.

Mockup diff on `HM1_1920x1080.png`: PASS.

| Measure | Build | Plate reference | Gate |
| --- | ---: | ---: | --- |
| SSIM | 0.497 | 0.583 | PASS |
| Mean ΔE | 13.2 | 11.4 | PASS |
| Daniel face | 0.988 | 0.995 | PASS |
| Nik face | 0.991 | 0.995 | PASS |
| Daniel hand | 0.988 | 0.996 | PASS |
| Nik hand | 0.987 | 0.995 | PASS |

Five biggest visible gaps to `GOAL_HOME.jpg`:

1. The goal has a six-item top navigation (`HOME`, `CAREER`, `STANDINGS`, `STATS`, `RULES`, `ABOUT`) plus search/settings/profile controls across the top band. The build replaces that entire band with the CM17 lockup at left and `SIGN IN` / `No Active Showdown` at right, so nearly the full top ~50 px is compositionally different.
2. The goal's `PREPARING CAREER MODE SHOWDOWN` progress strip and local-save line occupy the left hero area below the wordmark. HM1 has no equivalent strip; that zone is open stadium/portrait space.
3. The build's `RIVALRY HEADQUARTERS` content stack and tile row sit roughly 20–25 px lower than the goal, moving the dense interactive region toward the bottom rail.
4. The goal audio card uses album art, waveform, and two large controls. The build uses a track selector with four track chips plus play/mute/status copy. The footprint is similar, but the internal hierarchy and visual density are substantially different.
5. The goal's tile set is image-heavy (`CONTINUE CAREER`, `NEW SHOWDOWN`, `HISTORY LEGACY`, `DATA STATISTICS`, `RULES RULE BOOK`, `LOCAL SAVE LIBRARY`) with a bright active first tile. HM1 uses the current six-tile product set (`CONTINUE CAREER`, `START A SHOWDOWN`, `LEGACY`, `STATISTICS`, `RULE BOOK`, `SETTINGS`), and the unavailable Continue tile is muted rather than bright yellow.

### Select League

Frames: `L1`, `L2`, `L3`, `L4`  
Files: `league/<FRAME>_1366x768.png`, `league/<FRAME>_1920x1080.png`, `league/<FRAME>_393x660.png`, `league/<FRAME>_360x640.png`  
Main comparison frame: `L1`  
Comparison: `league/COMPARE.png`

Console check: 4/4 states clean. Zero console errors, page errors, failed requests, or navigation failures.

Native render QA: 41/41 shots pass, 0 fail.

Mockup diff on `L1_1920x1080.png`: PASS.

| Measure | Build | Plate reference | Gate |
| --- | ---: | ---: | --- |
| SSIM | 0.679 | 0.764 | PASS |
| Mean ΔE | 8.6 | 7.6 | PASS |
| Daniel face | 0.992 | 0.997 | PASS |
| Nik face | 0.994 | 0.996 | PASS |
| Daniel hand | 0.809 | 0.982 | PASS |
| Nik hand | 0.994 | 0.996 | PASS |

Five biggest visible gaps to `GOAL_LEAGUE.jpg`:

1. The goal again carries the full FIFA-style top navigation and utility icons; the build uses the simplified full-width identity/session header. The mismatch spans almost the entire top ~50 px band.
2. The goal's brush-script `SELECT LEAGUE` title is roughly 370–390 px wide at 1366×768, while the build's condensed block title is roughly 290–310 px wide, about one fifth narrower and materially less brush-like.
3. The goal wheel interior is a soft blurred gold placeholder with no readable league labels. L1 renders five sharp wedges, five labels/icons, a center crown, and a selected Premier League wedge. The wheel's placement is close, but almost the whole ~330 px disc surface differs.
4. The build adds a thick dark outer bezel and high-contrast spoke system around the wheel. The goal reads as a continuous gold rim and blurred gold face, so the central object is substantially darker and more segmented in the build.
5. The two bottom corner slogan panels use different material language: the goal has solid dark rectangular plates with full gold edge accents, while the build uses more transparent fields with broken corner brackets. Position is similar, but border construction and opacity do not match.

### Club Assignment

Frames: `CL1`, `CL2`, `CL3`, `CL4`, `CL5`, `CL6`  
Files: `club/<FRAME>_1366x768.png`, `club/<FRAME>_1920x1080.png`, `club/<FRAME>_393x660.png`, `club/<FRAME>_360x640.png`  
Main comparison frame: `CL1`  
Comparison: `club/COMPARE.png`

Console check: 6/6 states clean. Zero console errors, page errors, failed requests, or navigation failures.

Native render QA: 60/60 shots pass, 0 fail.

Mockup diff on `CL1_1920x1080.png`: FAIL.

| Measure | Build | Plate reference | Gate |
| --- | ---: | ---: | --- |
| SSIM | 0.277 | 0.716 | FAIL |
| Mean ΔE | 14.7 | 8.8 | PASS |
| Daniel face | 0.150 | 0.997 | FAIL |
| Nik face | 0.239 | 0.985 | FAIL |
| Daniel pack | 0.203 | 0.996 | FAIL |
| Nik pack | 0.225 | 0.996 | FAIL |

Five biggest visible gaps to `GOAL_CLUB.jpg`:

1. Protected-region registration is the largest objective miss: Daniel face 0.150, Nik face 0.239, Daniel pack 0.203, and Nik pack 0.225, all far below the required face 0.90 / other-box 0.75 thresholds. This is the dominant H10 failure.
2. The goal's large brush-script `CLUB ASSIGNMENT` title is roughly 370–390 px wide and floats directly over the stadium. The build uses a smaller condensed title, roughly 300–320 px wide, inside a dark panel.
3. The build introduces an approximately 390×160 px opaque/dark center title-and-status plate. The goal has no enclosing box in that area, so the build removes a large amount of stadium depth and changes the center-of-screen hierarchy.
4. The goal presents `RIVALRY` + a free-standing brush `VS` in open space. The build puts `VS` inside a framed dark card roughly 240–260 px wide, turning an open cinematic focal point into a boxed component.
5. The goal's lower matchup plate is headed `CLUBS LOCKED SHOWDOWN` and uses larger reveal cards around a centered VS divider. CL1 uses career-draw labels, smaller shield placeholders, and a flatter black bar without that headline. This changes both information hierarchy and silhouette across most of the lower third.

### Transfer War

Frames: `F1`, `F1D`, `F1R`, `F1DR`, `G2`, `G3`, `F3`, `F3D`, `F3L`, `F3DL`, `F4`, `F4D`, `F4E`, `F4DE`, `S0`  
Files: `transfer/<FRAME>_1366x768.png`, `transfer/<FRAME>_1920x1080.png`, `transfer/<FRAME>_393x660.png`, `transfer/<FRAME>_360x640.png`  
Main comparison frame: `F1`  
Comparison: `transfer/COMPARE.png`

Console check: 15/15 states clean. Zero console errors, page errors, failed requests, or navigation failures.

Native render QA: 84/84 shots pass, 0 fail. Sealed-panel constancy and verdict-authority checks also pass.

The Job 1 mockup-diff gate is not specified for Transfer; it is run only for Home, League and Club.

Five biggest visible gaps to `GOAL_TRANSFER_PLATE_G.png`:

1. The goal's top `TRANSFER WINDOW` sign is a clean plate with empty body space. F1 fills it with the live `11:42`, `WINDOW OPEN`, and `BUILD YOUR SQUAD` state. This is a functional DOM overlay, not a plate-geometry change.
2. The large left glass plate is empty in the goal. F1 adds the Daniel header, `SEALED` badge, striped privacy fill, and center CM17 mark across the same plate.
3. The center glass plate is empty in the goal. F1 adds the Nik header, the two-line early-end instruction, and the `END EARLY` control.
4. The small right glass plate is empty in the goal. F1 fills it with the `15 MIN / 3 SIGNINGS / 3 GUESSES` rules block and explanatory copy.
5. F1 adds live chrome that has no counterpart in the plate goal: the bottom season/stage navigation, `HOME`, `REFRESH`, and the small `YOU` badge beside Nik. The underlying manager placement and glass-plate geometry remain visually close; most of the visible difference is intentional live UI.

## Overall baseline result

- Browser health: PASS. 28/28 states clean.
- Capture completeness: PASS. 112/112 requested screenshots.
- Native screen QA: PASS. 218/218 QA shots across the four screen harnesses.
- Mockup gate: Home PASS, League PASS, Club FAIL. Transfer not requested for this gate.
- Daniel remains on the left and Nik on the right in all inspected main frames.
- This job did not add real club crests, league logos, trophies, players, names/numbers baked into generated images, or live-data imagery.
