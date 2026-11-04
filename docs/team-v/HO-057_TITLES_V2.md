# HO-057 · 4K page title wordmarks (V2)

Team V's README for HO-057 (commit 2b58eae0, visual-assets/v10_1/shared/wordmarks/v2/README.md), kept here because every text file under visual-assets/ must be in the service-worker shell. The build script and the two preview JPGs stay on Team V's branch.

Every brush-gold page title redrawn as a 3840 px transparent master, same words and
letter shapes as V1, no frame box. Each file sits **next to its V1 file**, so wiring is a path swap.

| Name | Folder (under visual-assets/v10_1/) | Replaces |
| --- | --- | --- |
| LEAGUE, NEW_SHOWDOWN, CONNECT_PLAYERS, FINAL_WINNER, RULE_BOOK, SETTINGS, STANDINGS, TRANSFER | shared/wordmarks/ | TITLE_<NAME>_V1.webp |
| CS | career-statistics/assets/ | TITLE_CS_V1.webp |
| LG | legacy/assets/ | TITLE_LG_V1.webp |
| RV / RV_PHONE | rivalry-statistics/assets/ | TITLE_RV_V1.webp / TITLE_RV_V1_PHONE.webp |
| SR / SR_PHONE | season-results/assets/ | TITLE_SR_V1.webp / TITLE_SR_PHONE_V1.webp |
| TR | trophy-room/assets/ | TITLE_TR_V1.webp |

Files: `TITLE_<NAME>_V2_{3840,1920,960,480}.webp` (60 files). Phone crops stay separate (RV_PHONE, SR_PHONE).
The new 960 file is lighter than every V1 file it replaces (52-104 KB vs 40-248 KB), so phones load the same or less.

Suggested wiring (Studio Small Axe):
```html
<img src="TITLE_LEAGUE_V2_1920.webp"
     srcset="TITLE_LEAGUE_V2_480.webp 480w, TITLE_LEAGUE_V2_960.webp 960w,
             TITLE_LEAGUE_V2_1920.webp 1920w, TITLE_LEAGUE_V2_3840.webp 3840w"
     sizes="(max-width: 900px) 92vw, 60vw" alt="League">
```
CSS backgrounds: `image-set(url(..._960.webp) 1x, url(..._1920.webp) 2x)`; add `_3840` where the title spans more than 960 css px.
Aspect ratios changed slightly (new margin for the contour/shadow); size by width, height auto.

Look: clean super-sampled brush edge, gold built from the V1 colours plus new brush-grain streaks,
bevel light from the top left, rim light on lit edges, soft inner shadow, thin dark-bronze contour and
soft contact shadow (the V1 look). No live data in any picture.

Not pictures, so not included: Club Assignment and Showdown Home titles (CSS text). Showdown Champion = FINAL_WINNER.
Optional SVG (item 4) not done: shapes are traced from V1 rasters, so the 3840 WebP is the sharp master.

Rebuild: `python3 build_titles_v2.py [--only NAME]` (numpy, scipy, opencv-python-headless, Pillow). Seeded, repeatable.
Previews: HO-057_BEFORE_AFTER_4K.jpg, HO-057_ALL_15_V2.jpg.

## Wiring note (Studio Small Axe, 2026-11-04)
In the game tree every `_V2_*.webp` is reframed to its V1 canvas ratio by `tools/frame_titles_v2.py`: only fully clear rows
above and below the lettering are trimmed (Season Results, whose lettering is taller than the V1 frame, gets clear columns
instead). So each screen keeps its V1 sizing rules and the letters land at the same size and place; the wiring is a path swap
plus `srcset` (480/960/1920/3840 w) on pictures and `image-set` (960 1x, 1920 2x) on the two CSS titles.
