# HO-071 · One handcrafted title family (V3 "Honours Board")

Nik picked option A on 11 Nov 2026 (2:36 p.m. Eastern). Every title in one family: gold-leaf sign-writing
like a club honours board. Matte gold leaf, a small solid dark shade down-right (painted, hard edged), letters only on alpha.
No shine, no bevel, no glow, no sparkle, no crown, no kicker, no box/plate/ribbon. Built in code, no AI pictures.

Font: **Cormorant SC Bold**, SIL Open Font License 1.1 (free for web, embedding and self-hosting).
`shared/fonts/CormorantSC-Bold-latin.woff2` (20 KB) + `shared/fonts/OFL_CormorantSC.txt`.

## Option 1 (recommended by Team G): live text
```css
@font-face { font-family: "Showdown Honours"; font-weight: 700; font-display: swap;
  src: url("/visual-assets/v10_1/shared/fonts/CormorantSC-Bold-latin.woff2") format("woff2"); }
.hc-title { font-family: "Showdown Honours", Georgia, serif; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em; font-variant-numeric: lining-nums;
  color: #C4A05C;                         /* matte gold leaf */
  text-shadow: .045em .045em 0 #30120E;   /* sign-writer's shade: 0 blur, never a glow */
  font-size: clamp(22px, 3.4vw, 64px); line-height: 1; margin: 0; }
```
No gold glow, halo or bloom anywhere (HO-074, PR #1404 removed it from .sd-title): titles are gold lettering lit by the room, not light sources. The pictures bake none either.
The cap height of Cormorant SC Bold is about 0.63 em. Use one font-size for every page title so all of them share
cap height, stroke and baseline. The pictures add only the leaf grain, which is invisible below ~40 px caps.

## Option 2: pictures (same slots, new V3 names next to the V2 files)
`TITLE_<NAME>_V3_{3840,1920,960,480}.webp`. **All files of one step have the same HEIGHT** (3840→300 px,
1920→150, 960→76, 480→38). Cap = half the file height, baseline at 70 %. Width depends on the words.
So size them by **height** (`height: Xpx; width: auto; max-width: 100%`), not by width: two titles at the same
height always share cap height, stroke and baseline. Long titles shrink on phones through max-width.

| NAME | Words | Folder (under visual-assets/v10_1/) |
|---|---|---|
| CONNECT_PLAYERS, NEW_SHOWDOWN, LEAGUE (Select League), RULE_BOOK, SETTINGS, STANDINGS, TRANSFER (Transfer War), FINAL_WINNER (Showdown Champion) | | shared/wordmarks/ |
| CS Career Statistics · LG Legacy · RV + RV_PHONE Rivalry Statistics · SR + SR_PHONE Season Results · TR Trophy Room | | their bundle assets/ |
| CLUB_ASSIGNMENT (new, replaces Kaushan text) | Club Assignment | shared/wordmarks/ |
| PRIME_PACK, CHAMBER_MEN, ROSTER_ROULETTE (Russian Roster Roulette), SPECIAL_PLAYER, GAZETTE (Touchline Gazette), SQUAD (Squad Management), START, HISTORY | screens in flight | shared/wordmarks/ |

Extra marks:
- `shared/wordmarks/MARK_VS_V3_{1040,520,260}.webp` (replaces the Kaushan "VS"; or live text "VS" with the CSS above).
- `home/assets/LOGO_CM17_WORDMARK_V3_{2080,1040,640}.webp`: Nik's pick 12 Nov ("2 Big 17"): big SHOWDOWN with a tall 17
  beside it, small spaced CAREER MODE above with a thin gold rule. No crown. Wide mark (about 6.5:1): 1040 = full size,
  640 for phones, 2080 for 2x screens. Built by `home_logo.py` (L2). Preview: `HO071_HOME_LOGO_PICK.jpg` (bottom row).

Sizes: every V3 file is lighter than the V2 file of the same step it replaces (largest V3 file 105 KB; checked 60 pairs).
Previews: `HO071_ALL_V3.jpg` (all 24 at the 1920 step, half size, on the HC slab) and `HO071_HOME_VS_V3.jpg`.

Rebuild: `python3 -I build_titles_v3.py --fonts <dir with CormorantSC-Bold.ttf> --out <repo root> [--only NAME]`
(Pillow with raqm + numpy). Seeded, repeatable. The TTF is the OFL static Bold from Google Fonts.
Words for a new screen: add one line to `SLOT`.
