# Emerald Clubhouse: colour study (P3, Duet as Team V + Team G, 26 Nov 2026)

Sheet: `COLOUR_STUDY.png` (palette, then today's Board Room and Home in Wooden, Platinum, Metallic Black, Graphite and Ruby).
Key `emerald`, look `EMERALD`, player name **Emerald Clubhouse**. Bar: HO-173 (leads/relay) applied to Emerald.
Built on Ruby's study and its 15 prompt lessons (`../ruby/RUN_SHEET_RUBY.md`, "Prompt lessons"); every lesson that is about
how Astra reads words, not about red, is written into the Emerald pilot prompts from the first try.

## The look in words
A private members' club at night built from real green stone and leather: **polished malachite** (a deep green stone
with a few broad, calm, softly curving bands of lighter and darker green), **bottle-green leather** upholstered wall
panels with stitched seams, **walnut** frames so dark they read near-black (never honey, tan or orange), and **satin
brass** used only as small quiet accents (lamp arms, the counter rail, handles, hairline inlays). Polished malachite may
hold soft, dim reflections of the lamps; nothing else shines.

## Palette (target values on the painted room, outside the men)
| Role | Hex | Material |
|---|---|---|
| Deepest recesses, ceiling, corners | #0B2E22 | green near-black |
| Main walls | #145A3C | bottle-green leather |
| Lit stone, wall right beside a lamp | #2E8B57 | malachite, lit |
| Frames, mouldings, sideboard | #241A12 | walnut, near-black |
| Malachite light bands | #5E9E74 | soft mid jade, few and broad (never pale mint) |
| Accents only | #A88A4E | satin brass, small |

## Light rule (written into EVERY Emerald prompt; confirm with Nik on the pilot)
Emerald is deep bottle-green leather and polished malachite at night: rich like a dark green glass bottle held to
candlelight, never mint, never lime, never teal. Each warm lamp throws a clearly bright pool around itself, where the
green turns a lighter, clearer jade (never yellow, olive or khaki), and the green falls off to near-black in the
corners. Satin brass appears only as small accents and never glints hard.

## Where warm lamp light and brass may show
- **Lamp light:** a clearly bright warm pool on the leather or stone right around each existing lamp (Board: the wall
  lamp at the left; Home: the table lamp on the sideboard, the wall lamp on the right pillar, plus the stadium glow
  through the window). Everywhere else the room stays deep green, never a warm yellow-olive wash over a whole wall.
- **Brass:** lamp arms and bases, the thin counter rail, door and window handles, hairline inlays in the mouldings.
  No brass wall, no brass panel, no brass pillar. The rail is a soft dim satin line, never a bright yellow line (Ruby lesson 8).
- **Reflections:** the counter and pillar malachite are polished and may show one soft dim reflection of the lamp and of
  the dark suits. No mirror floor, no chrome, no sparkle.

## Seating (Nik's decision, 25 Nov 2026 07:36 UTC, standing for every material clubhouse)
The Home lounge armchairs and sofa are reupholstered in the clubhouse's own material and colour (Emerald: deep
bottle-green leather like the walls, a touch lighter where lamp light falls so they read against the walls), keeping
their exact shape, size, cushions, seams and place. In Nik's words: "I actually think that having the color of the sofa
and chair to be matched with the overall color and theme of the clubhouse make it looks better." The plaid blankets,
ball, whisky, grey throw, rug and lamp shades keep their own colours.

## What Emerald must never be
- Mint, lime, teal or neon green (that is "pale" or out of the hue band in the numbers).
- Olive or khaki: warm lamp light over green drifts toward yellow-olive, so the prompts say the lit green turns a
  clearer jade, never yellow.
- Brown: none of Wooden's tan, honey or orange-brown wood may survive. Walnut is part of the look, so it is held to the
  thin frames and mouldings and must read near-black.
- Busy malachite: tight concentric rings, zebra stripes or contour-map lines read as AI pattern, the green cousin of
  Ruby's "cracked ice" veins. The bands are few, broad, smooth and unbroken.
- Metallic Black with a green tint, or Graphite gone green: side by side it must be unmistakably its own clubhouse.
- Flat: a code recolour of Wooden fails this study's spread and detail limits (tested 26 Nov: a luma-mapped recolour of
  Wooden Board and Home onto this palette passes every hue test but MISSES spread 13 vs 36 and 37 vs 68, and detail
  1.4 vs 2.5 and 1.7 vs 3.0, so it cannot pass).

## Numeric bar: `tools/material-clubhouses/emerald_check.py` (limits in `material_check.py` LOOKS["EMERALD"])
Measured outside the dilated hero mask at 1536x864, room pixels only for diff, mw and spread (Ruby calibration log,
25 Nov 07:45 and 08:20). Ruby is now a sibling too.
| Check | Limit | Why |
|---|---|---|
| vs silver / black / matte / ruby | mean diff >= 15 each | unmistakably a new clubhouse |
| mw (vs Wooden) | >= 12 | every big surface changed |
| hue | >= 0.50 of coloured pixels in 115-175 deg | it reads green (palette 146-159 deg); under 115 is lime/olive, over 175 is teal |
| brown | <= 0.20 in Wooden's 15-45 deg band | walnut is near-black and thin; Wooden today measures 0.65 (Home) and 0.98 (Board) |
| sat | median 0.35-0.90 | rich green, neither grey nor neon (palette 0.67-0.78) |
| pale | <= 0.03 of the room | "never mint": the light bands are mid jade (#5E9E74, sat 0.41), not pastel |
| gold | <= 0.04 of the room | brass accents stay small |
| luma | 14-60 | night |
| glint | <= max(3, min(8, 0.6 x Black)) per 10k px | polished malachite may reflect, never Black's stray hot spots |
| spread | >= max(Wooden, 0.75 x Black), room pixels | rich, not flat |
| detail | >= 1.05 x Wooden | readable leather grain, stitching, malachite bands |

These limits are **provisional**: I re-calibrate them on the pilot Nik approves, and write any change here with its reason.
Passing the numbers is necessary, never sufficient: the HO-173 eye check and Nik's OK on the board decide.

## League Roulette (standing check, Nik 26 Nov 2026 04:40 UTC)
League Roulette is the 3D roulette board, never the old flat wheel, in Emerald too. Every League shot, study and check
runs with 3D on and is proven on screen first (`#leagueWheel.lr3d-on`, `html.lr3d-room`, a WebGL canvas in
`#leagueWheel > .lr3dHost`); the board is never shrunk or moved. Full rule: `RUN_SHEET_EMERALD.md`, "Standing checks".

## Calibration log
- 2026-11-26, study: limits set as above. Nothing measured on an Emerald painting yet.
- 2026-11-26 07:30 UTC, E-3 Office try 1: brown 0.26 MISSED 0.20, but the room surfaces alone (kept objects boxed out) measure 0.07; the kept ball, cup, papers, blotters, olive tree and brass lamp are 36% of the coloured pixels and brown by identity (Ruby Office reads 0.21 the same way). Office alone gets brown_max 0.30; every other room stays at 0.20.
- 2026-11-26 14:30 UTC, E-4 Hall try 2: brown 0.275 MISSED 0.20. The kept runner rug is 27% of the brown pixels, and the double door's frame and centre stile measure rgb 38,25,14, the palette's near-black walnut (#241A12), which the 15-45 degree band counts as brown at any brightness. Wooden Hall reads 0.93, so a 0.30 limit still separates it. Hall alone gets brown_max 0.30. A luma floor on the brown test was tried and rejected: it lets Wooden Home through at 0.24.
