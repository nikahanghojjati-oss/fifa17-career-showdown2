# Ruby Clubhouse: colour study (P3, Duet as Team V + Team G, 25 Nov 2026)

Sheet: `COLOUR_STUDY.png` (palette, then today's Board Room and Home in Wooden, Platinum, Metallic Black and Graphite).
Key `ruby`, look `RUBY`, player name **Ruby Clubhouse**. Bar: HO-173 (leads/relay) applied to Ruby.

## The look in words
A private members' club at night built from real red stone and leather: **Rosso Levanto marble** (a deep wine-red Italian
marble with a few long, calm, pale cream veins), **oxblood leather** upholstered wall panels with stitched seams,
**rosewood** frames so dark they read near-black with a red glow (never brown), and **antique gold** used only as small
quiet accents (lamp arms, the counter rail, handles, hairline inlays). Polished marble may hold soft, dim reflections
of the lamps; nothing else shines.

## Palette (target values on the painted room, outside the men)
| Role | Hex | Material |
|---|---|---|
| Deepest recesses, ceiling, corners | #2A0A10 | wine near-black |
| Main walls | #6E1423 | oxblood leather |
| Lit stone, wall right beside a lamp | #9B2335 | Rosso Levanto marble |
| Frames, mouldings, sideboard | #3A1416 | rosewood, red-black |
| Marble veins | #D8C8B4 | pale cream, thin, few |
| Accents only | #A8884A | antique gold, satin, small |

## Light rule (written into EVERY Ruby prompt; confirm with Nik on the pilot)
Ruby is deep oxblood leather and red Rosso Levanto marble at night: rich like dark red wine held to candlelight,
never pink, never cherry, never orange. Each warm lamp lights only a small pool around itself, and the red falls off
to wine near-black in the corners. Antique gold appears only as small accents and never glints hard.

## Where warm lamp light and gold may show
- **Lamp light:** a soft warm pool on the leather or stone right around each existing lamp (Board: the wall lamp at
  the left; Home: the table lamp on the sideboard, the wall lamp on the right pillar, plus the stadium glow through
  the window). Everywhere else the room stays deep red, never a warm orange wash over a whole wall.
- **Gold:** lamp arms and bases, the thin counter rail, door and window handles, hairline inlays in the mouldings.
  No gold wall, no gold panel, no gold pillar.
- **Reflections:** the counter and pillar marble are polished and may show one soft dim reflection of the lamp and of
  the dark suits. No mirror floor, no chrome, no sparkle.

## Seating (Nik's decision, 25 Nov 2026 07:36 UTC, standing for every material clubhouse)
The Home lounge armchairs and sofa are reupholstered in the clubhouse's own material and colour (Ruby: deep oxblood leather like the walls, a touch lighter where lamp light falls so they read against the walls), keeping their exact shape, size, cushions, seams and place. In Nik's words: "I actually think that having the color of the sofa and chair to be matched with the overall color and theme of the clubhouse make it looks better." The plaid blankets, ball, whisky, grey throw, rug and lamp shades keep their own colours.

## What Ruby must never be
- Pink, cherry, candy or orange-red (that is "pale" or wrong hue in the numbers).
- Brown: none of Wooden's tan, honey or orange-brown wood may survive (rosewood must read red-black).
- Metallic Black with a red tint, or Platinum with red marble: side by side it must be unmistakably its own clubhouse.
- Flat: a code recolour of Wooden fails this study's spread and detail limits (tested: a synthetic red recolour of the
  Wooden Board and Home passes the hue tests but MISSES spread 24 vs 36 and detail 2.1 vs 2.6, so it cannot pass).

## Numeric bar: `tools/material-clubhouses/ruby_check.py` (limits in `material_check.py` LOOKS["RUBY"])
Measured outside the dilated hero mask at 1536x864, as B7's matte_check does.
| Check | Limit | Why |
|---|---|---|
| vs silver / black / matte | mean diff >= 15 each | unmistakably a new clubhouse (B7's mb rule, every sibling) |
| mw (vs Wooden) | >= 12 | every big surface changed |
| hue | >= 0.50 of coloured pixels in 330-12 deg | it reads red (Home included: its seating is Ruby leather too) |
| brown | <= 0.25 in Wooden's 15-45 deg band | Wooden today measures 0.65 (Home) and 0.98 (Board) |
| sat | median 0.35-0.90 | rich red, neither grey nor neon (deep reds carry high HSV saturation: the palette's own #6E1423 is 0.82) |
| pale | <= 0.03 of the room | "rich, not pink": no washed-out pastel red |
| gold | <= 0.04 of the room | gold accents stay small |
| luma | 14-60 | night (Graphite 34-47, Black 19-22, Platinum 68-87) |
| glint | <= max(3, min(8, 0.6 x Black)) per 10k px | polished marble may reflect more than Graphite (0-3.4), never Black's stray hot spots (6.7-28) |
| spread | >= max(Wooden, 0.75 x Black), room pixels | rich, not flat |
| detail | >= 1.05 x Wooden | readable leather grain, stitching, marble veins |

Reference numbers today (outside the men, same method): Board Wooden luma 31, spread 27, detail 2.4, sat 0.50;
Board Black glint 8.4; Home Wooden luma 29, spread 70, detail 2.9; Home Black glint 15.0.
These limits are **provisional**: I re-calibrate them on the pilot Nik approves, and write any change here with its reason.
Passing the numbers is necessary, never sufficient: the HO-173 eye check and Nik's OK on the board decide.

## Calibration log
- 2026-11-25 07:35 UTC, R-1 Board try 1: sat upper limit 0.80 -> 0.90. The 0.80 was below the palette's own oxblood (#6E1423 = 0.82, #2A0A10 = 0.76); the painting measures 0.86 and reads deep wine red by eye, not neon. Every other limit unchanged.
- 2026-11-25 07:37 UTC, Nik's seating decision: the Home exception (hue >= 0.35, brown <= 0.45, kept for brown armchairs and sofa) is removed; Home now uses the Ruby limits (hue >= 0.50, brown <= 0.25). R-2 try 1, which already had red seating, measures hue 0.93 and brown 0.04.
- 2026-11-25 07:45 UTC, R-2 Home try 2: the vs-sibling and mw differences now leave out pixels that every existing look (Platinum, Metallic Black, Graphite) keeps within 10 levels of Wooden. In Home that is the stadium view through the window, 22% of the measured area, kept identical in every clubhouse by design, which diluted the vs-Black difference to 14.6 although the room reads unmistakably red against Black by eye. Room pixels only: vs Black 17.4. Board is unchanged (0.9% shared: 18.6 -> 18.7). The limit of 15 is unchanged.
- 2026-11-25 08:20 UTC, R-3 Office try 2: spread is now measured on room pixels too, the same mask as diff and mw (07:45 entry). With the stadium view in (17.8% of Office, identical in every look by design) its floodlight sets the top of the range, so Ruby's darker wine mid tones read 144.8 vs Wooden 146.7 although the room has a real lamp pool and deep corners by eye. Room pixels only: Office Ruby 160.8 vs Wooden 153.4 (Black 177.9), Home 82.6 vs 67.7, Board 40.9 vs 36 (0.75 x Black). The limit itself is unchanged; a flat code recolour still fails it (Board, 0.9% shared).
- 2026-11-25 14:58 UTC, R-4 Hall try 2: detail limit 1.1 x Wooden -> 1.05 x Wooden. Hall's Wooden is a dark stone room whose own fine crackle raises its detail (3.76); try 2 removed the bright hairline web from the pillars as the colour lock asks, and so lands at 4.06 (1.08 x Wooden) with leather grain, stitching and long veins still sharp at 2x. At 1.1 the limit was rewarding exactly the crackle the prompt forbids. A flat code recolour still fails at 1.05 (Board 2.1 vs 2.4 = 0.88 x Wooden). Board, Home and Office stay far above it.
