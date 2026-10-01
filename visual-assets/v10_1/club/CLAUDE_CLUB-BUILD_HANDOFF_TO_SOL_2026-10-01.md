# CLUB-V1 build · handoff to GPT-5.6 Sol

From: Claude (Opus 5.5, Claude Code Cloud implementation worker) · 2026-10-01
Brief: `CLOUD_BRIEF_CLUB_V1_R3.md` R3.4 (on `claude-cloud/hlc-goals`), launched by `CC-003_club-build.md`.
Branch `claude-cloud/club-v1`. Base `8fbda03`. Crest `ACCEPTED_CREST_SHA f1cfff4` merged as `7a1e24f`. `SOURCE_DRIFT`: none.
Role: build and evidence only. No taste authority, no self-approval. Details and the run guide are in `BUILD_RESULT.md`.

## What was built
- **Prototype**: a static page (`index.html`, `club.css`, `club.js`, `fixtures.json`) for frames CL1–CL6 on the Club plate, desktop and phone. It keeps main's `#clubWheelScreen` DOM, ids, aria and strings. `fixtures.json` is generated from `origin/main` by `tools/build_fixtures.py`, which asserts every string exists on main.
- **Painted packs as doors**: each `.clubPackStage` is a transparent shell placed exactly over `pack_daniel` / `pack_nik`. Door text is visually hidden.
- **Intake-zone covers**: `aria-hidden` dark-glass shapes registered through `plateToScreen`, each keeping ≥ 8 px off faces, hands and packs:
  - a title/rail banner;
  - the VS medallion;
  - the bottom panel with a raised tab;
  - the button dock;
  - the footer apron;
  - a header shadow.
- **K3 + OWNER-3 pack rip**: the top strip tugs, tears along a jagged edge, flips and falls away. Gold light spills from the opening and the original crest rises from it, then settles on the pack's crown shield.
  - Both hands are restored on top as exact plate pixels: duplicate plate layers clipped to traced hand polygons. No new raster.
  - Timing: 1.5 s, `transform` and `opacity` only. Reduced motion gets an opacity crossfade.
  - The same crest fills the panel shield slot.
- **Evidence**: 54 frame shots (6 frames × 9 viewports), grid and plate-only shots, OWNER-3 frame strips, reduced-motion evidence, intake-zone side-by-sides, and `preview.html` (a single file).

## Gate results
| Gate | Result |
| --- | --- |
| G1 strings | PASS (0 missing / 0 extra, 54/54) |
| G2 ids/aria | PASS |
| G3 no scroll | PASS |
| G4 primary | PASS (375×553 and 1366×640 included) |
| G5 clipping | PASS |
| G6 sizes | PASS |
| G7 contrast | PASS (lowest normal text 5.16; large title 4.28 vs 3) |
| G8 faces/hands | PASS except **1366×640 BLOCKED**: the header bar sits over both faces. Pack containment error ≤ 0.02 px; 0 live UI in pack boxes |
| G9 imagery | PASS |
| G10 sides + plate SHA | PASS |
| G11 tab order | PASS |
| G12 clean run | PASS |
| G13 chrome | reported |
| OWNER-3 (8 checks) | PASS: registration 0 px; 0 reveal px above hands at 0/25/50/75/100 % on CL3–CL6 (desktop + phone); reduced-motion end state matches (≤ 59 antialias px of 103 500) |

## Goal image vs product: what I did
1. The goal's nav tabs and search, settings and profile icons are omitted (C6). The header shows the `CM 17` badge, brand, `SIGN IN` and `#seasonIndicator`.
2. The goal's title block has no league name. The product's `#clubAssignmentLeague` (`Premier League`, 26 px gold) is kept under the eyebrow.
3. The goal's status reads `TWO SEALED CLUB PACKS READY`. Main's CL1 string is `LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY`, so `LEAGUE CONFIRMED` appears twice (eyebrow plus status). Product wins.
4. The goal shows the panel title `CLUBS LOCKED · SHOWDOWN` and "Once revealed, these clubs are permanent…" in the ready state. Not shown in CL1. In CL5/CL6 the product confirmation appears instead: `CLUBS LOCKED` plus `Daniel vs Nik` on the tab, the meta under it, the matchup, and main's lock note text.
5. The goal's face cards read `DANIEL CLUB / TO BE REVEALED`. The product strings are used: index `01`/`02`, the manager, `CAREER DRAW · ASSIGNED CLUB`, `?`/club, `SEALED`/`REVEALED`.
6. The goal's footer `CM 17 | CAREER MODE SHOWDOWN 17` is replaced by the product footer `Career Mode Showdown` / `v1.9.1`, plus the decorative slogan and crown.
7. **Design deviation, needed to hide the intake zones.** The goal's title and rail float over open stadium. Here they sit on a dark-glass banner, because the intake left darkened rectangles and visible zone edges there. The VS likewise sits on a dark medallion instead of floating, and the medallion also hides the leftover VS brush streaks.
8. The goal's panel tab exists in every frame here as an empty plinth under the VS (it covers the tab zone). Its text appears only in CL5/CL6.
9. The goal has no "opening" state. CL2–CL4's disabled `DRAW LOCKED...` uses a dark-glass style with light text so it passes contrast. The gold style is reserved for enabled primaries.
10. Phone: the brand text is visually hidden (still in the DOM); the `CM 17` badge stays.

## Open questions for Sol
1. **1366×640 (G8 BLOCKED):** the composition needs 646 px from title to buttons, and the viewport has 556 px between the chrome. Which do you prefer: (a) accept the header bar over the hair and forehead at this short size, (b) letterbox the plate under a compact header, or (c) take the title block out of plate registration at short heights?
2. **Hand protected boxes**: `platemap.json` has none. I traced them (`assets/handmap.json`, `tools/make_hand_masks.py`), and their bounding boxes act as the G8 hand boxes. Do you accept these, or should intake publish hand boxes?
3. **Intake-zone residue that can't be covered within clearance** (full list in `BUILD_RESULT.md`): the title-zone left edge at x 458 beside Daniel's face; the x 1031–1040 strip beside Nik's face; the rail-zone left edge at x 552 beside Daniel's pack; the panel-tab top corners beside the side hands. Would you accept them, or should intake retouch those strips?
4. **375×553**: the band shows the packs only (faces out of frame) in every frame, and CL6 visually hides the duplicate matchup row (K2 allowance). Acceptable?
5. **`#seasonIndicator` fixture**: `No Active Showdown` (main's indicator while no showdown is saved). Confirm that's right during club assignment.
6. **Title italic**: synthetic, because only upright Barlow Condensed 700 is in the shared fonts.

## What Nik should look at
- `preview.html`, frames CL3 and CL4 (pack rip end states), then `index.html?frame=CL3&play=1` served locally to watch the 1.5 s rip.
- `evidence/RIP_CL3_1366x768_strip.jpg` and `RIP_CL4_…` (0/25/50/75/100 %): is the rip convincing, and do the hands read as holding the pack while the top tears off?
- `evidence/ZONES_CL1_1366x768_side_by_side.jpg`: the intake rectangles vs the built frame.
- `evidence/CL1_390x844.jpg` and `CL6_360x640.jpg` for phone.
