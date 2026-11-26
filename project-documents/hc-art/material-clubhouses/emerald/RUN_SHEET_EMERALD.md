# Run sheet: Emerald Clubhouse

For Nik on the iPhone. One new chat per ticket: **ChatGPT Work mode, Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Attach Image 1 (tap the raw link, save the PNG, attach it), paste the prompt box exactly, and if ChatGPT offers a rewrite reply `No, use my prompt exactly.`
Send me each picture in the Duet thread, in the order of this sheet. Pass mark: 9/10 for every picture (Nik: "try until reach 9 always").
Look: polished malachite, bottle-green leather, walnut, satin brass, at night. Study: [COLOUR_STUDY.md](COLOUR_STUDY.md).
**Seating rule (Nik, 25 Nov 2026 07:36 UTC, every material clubhouse):** the lounge armchairs and sofa take the clubhouse's own colour and material (Emerald: bottle-green leather), keeping their shape, size, cushions, seams and place. Every other object (plaid blankets, ball, whisky, throw, rug, lamp shades) keeps its own colour.
Image 1 links are pinned to commit `0aa05806`, so they never move.

## Standing checks for every clubhouse (Emerald, and every clubhouse after it)

- **League Roulette is the 3D roulette board, never the old flat wheel** (Nik, 26 Nov 2026 04:40 UTC: "Make sure that the league roulette uses the roulette board we have, not the old wheel in all clubhouses you build"; desk rule in DUET_P4_MAILBOX A-2). The flat wheel is only the backup for a device with no 3D at all.
  - Every League Roulette board shot, study and check runs with 3D on (SwiftShader: drop `--disable-webgl`, `--in-process-gpu` and `--single-process`, add `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`).
  - Before each shot, prove the board is on screen: `#leagueWheel.lr3d-on`, `html.lr3d-room`, and a WebGL canvas in `#leagueWheel > .lr3dHost`. If any is missing the browser fell back to the wheel: throw the shot away, fix the browser, shoot again.
  - The clubhouse's own-art contract proves it at every quality tier on desktop, 2x desktop, upright and sideways phone: board on screen, flat wheel and pointer hidden, the board's marble is the clubhouse's own tile, the room behind it is the clubhouse's own box (tests/contracts/p3-ruby-own-art-contracts.cjs is the pattern; Emerald gets its own p3-emerald-own-art-contracts.cjs).
  - Never shrink or move the board. If a fix seems to need it, give Nik 2-3 options to pick from.

## Ruby's lessons, written into the Emerald pilot from the first try
The full list with scores is in [RUN_SHEET_RUBY.md](../ruby/RUN_SHEET_RUBY.md), "Prompt lessons". Carried over as they are, with Emerald's words:
1. **Colour too vivid** (Ruby lesson 1): "Every green is a touch muted and aged, a deep bottle green, never a vivid, neon or saturated green. Where the light is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki." Olive is green's version of Ruby's orange drift under warm lamps.
2. **Flat light** (2): the brightest spots are named and "clearly bright"; everything else keeps a deep, muted green.
3. **Window panes** (4): every pane stays clear glass from its bottom frame to its top frame; no door in Home.
4. **Edits that break other things** (5): "one plain, calm solid slab" for the counter; one change per edit, at most two edits per chat.
5. **Mirrored counter top** (6): the counter edge is a thin rail seen straight on.
6. **Stone pattern** (7, 11): malachite bands are few, broad, smooth, continuous and unbroken; never busy rings, zebra stripes, contour lines or a hairline web; smooth glassy polish, no scratches or crinkles.
7. **Hot yellow rail** (8): the rail is a soft dim satin brass line, never a bright yellow or white line.
8. **Reads as Metallic Black** (9): the walls are a clearly readable rich bottle green, never near-black except in the far corners.
9. **Sparkle points** (13): satin brass with soft broad highlights, never hot white sparkle points or glitter.
10. **Pale bands** (new for Emerald): the light malachite bands are named as mid jade (#5E9E74) so they don't come back as pale mint, which fails the "pale" check.

## Pilot (2 pictures). Nik OKs both on the board before any other Emerald prompt is written.
The pilot has no Image 2: no Emerald room is approved yet, so the materials are described in words only.

### E-1 · Emerald pilot 1/2: Board Room

- Image 1: [ENV_BOARD_PLATE_HC_V3_2X.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0aa05806fb302c8cffa40e4413d7c632fa8cb98a/project-documents/hc-art/material-clubhouses/src/IMG1_ENV_BOARD_PLATE_HC_V3_2X.png) ([raw](https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/0aa05806fb302c8cffa40e4413d7c632fa8cb98a/project-documents/hc-art/material-clubhouses/src/IMG1_ENV_BOARD_PLATE_HC_V3_2X.png))
- Image 2: none for the pilot
- Saves as `ENV_BOARD_PLATE_EMERALD_P1_2X`

```
Image 1 is the picture to edit. Use only image 1.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the wall lamp on the left with its pleated shade, the door on the right with its handle, the tall stone pillars at the far left and far right edges, the panel layout of the wall, and the thin rail along the top of the counter with the counter filling the lower quarter. The rail stays at exactly the same height, about three quarters of the way down the picture. The counter edge is a thin rail seen straight on, exactly as in image 1: no counter top surface shows above or below it, nothing is mirrored in it, and the front of the counter starts right under the rail.

The room: A private members' club at night in green stone and leather: polished malachite, bottle-green leather, dark walnut and satin brass, handcrafted.
The wall panels become upholstered deep bottle-green leather with a fine natural grain and neat stitched seams, keeping the same panel layout, framed in thin polished walnut mouldings so dark they read near-black, each with a hairline satin brass inlay. The door becomes the same bottle-green leather panel in a near-black walnut frame, with a small satin brass handle. The pillars at the far edges become polished malachite: deep green stone with a few broad, calm, softly curving bands of lighter and darker green. The lamp arm becomes satin brass; the shade stays warm cream and lit. The rail becomes a soft, dim satin brass line with no bright shine, never a bright yellow or white line. The counter becomes one plain, calm solid slab of polished malachite in the same deep green with the same few broad calm bands, holding a soft dim reflection of the lamp and of the dark suits.

Every door, frame, panel and moulding takes one of these materials (bottle-green leather, malachite, near-black walnut or satin brass); no light wood is left anywhere in the room.

Light: It is night. Emerald is deep bottle-green leather and polished malachite at night: rich like a dark green glass bottle held to candlelight, never mint, never lime, never teal. Light comes only from the same warm wall lamp in the same place. The brightest spots are clearly bright: the lamp throws a wide, clearly bright warm pool onto the leather around it, and the warm reflection on the polished counter is large and clearly bright, a soft cream-gold candlelight sheen on the green stone. Everything else keeps a deep, muted, aged green, falling off to green near-black in the far corners and toward the ceiling, so the room has depth and never looks flat. Behind each man the wall is a clearly readable rich mid bottle green, clearly lighter than the black suits, so both men read crisply against it; the walls are never near-black except in the far corners. The malachite carries a soft polished sheen with dim reflections only; brass appears only as small accents in satin brass with soft broad highlights, never hot white sparkle points or glitter. Up close you see the grain of the leather, the stitched seams, the walnut grain and the bands of the malachite, all sharp. The two men stay lit exactly as they are now.

Colour lock: every wall, panel, pillar, frame and the counter is deep emerald green: bottle green (#145A3C) on the walls, malachite green (#2E8B57) where the stone is lit, green near-black (#0B2E22) in the shadows and corners, and walnut so dark it reads near-black (#241A12). Every green is a touch muted and aged, a deep bottle green, never a vivid, neon or saturated green. Where the light is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki. The warm brown wood of image 1 must be gone completely: no tan, honey, orange-brown, khaki or light brown anywhere in the room, even near the lamp; the only brown is the near-black walnut of the thin mouldings and frames. Brass is only the lamp arm, the rail, the door handle and the hairline inlays: no brass panels and no gold walls. The malachite bands are a few broad, smooth, softly curving bands of lighter and darker green that flow gently across the stone at different angles, each one continuous and unbroken with soft edges; the lighter bands are a soft mid jade (#5E9E74), never pale mint or white; never tight busy rings, zebra stripes, contour-map lines or a fine web of thin hairline lines. The stone is smooth, glassy polished malachite with no fine scratches or crinkles.

The lamp shade and the door handle keep their shape; the room holds no other objects.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around the lamp or the people, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

Tries:
- Try 1 (26 Nov 12:09 a.m. Boston) **8.5/10, one fix.** Align: scale 0.9990, shift 0.3 px, men unchanged (mean diff 4.9). Bottle-green leather walls with grain and stitched seams, near-black walnut mouldings with brass hairlines, malachite pillars and counter, brass only on the lamp, rail and handle, clear lamp pool. emerald_check PASS (hue 0.74, brown 0.15, sat 0.71, luma 34, spread 69, detail 3.9, vs Black 18.4). Miss: inside the lamp's reflection the counter turns crinkled and crumpled like foil (Ruby lesson 11's AI texture). Raw kept as ENV_BOARD_PLATE_EMERALD_P1_2X_T1_RAW.png.
- Fix 1 (same chat):

```
Keep this image exactly the same. Change only the counter: it becomes smooth, glassy polished malachite everywhere, including inside the warm lamp reflection. The reflection is one soft, smooth, blurred cream-gold glow on glassy stone, with no crinkled, crumpled, wrinkled or scratchy texture anywhere on the counter. The counter keeps its exact colour, its few broad calm green bands, its brightness, its reflection's size and its place; the rail, the walls, the pillars, the lamp and the two men stay exactly as they are.
```
- Fix 1 (26 Nov 12:12 a.m. Boston) **9/10, accepted.** Align: scale 0.9990, shift 0.5 px, men unchanged (mean diff 5.7). The counter is smooth glassy malachite with one soft cream-gold lamp reflection and broad calm bands, no crinkles. The edit also redrew the wall panels closer to Image 1 (the lower panel row and the door frame are back). emerald_check PASS (hue 0.74, brown 0.15, sat 0.68, luma 33, glint 1.1, spread 72, detail 3.4, vs Black 18.8). Small notes, not worth a redo: the lamp's pool on the wall is a little smaller than on try 1, and the counter bands read a touch silky. Side by side: [ENV_BOARD_PLATE_EMERALD_P1_2X.cmp.jpg](ENV_BOARD_PLATE_EMERALD_P1_2X.cmp.jpg).

### E-2 · Emerald pilot 2/2: Home

- Image 1: [ENV_HOME_PLATE_HC_V3_2X.png](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0aa05806fb302c8cffa40e4413d7c632fa8cb98a/project-documents/hc-art/material-clubhouses/src/IMG1_ENV_HOME_PLATE_HC_V3_2X.png) ([raw](https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/0aa05806fb302c8cffa40e4413d7c632fa8cb98a/project-documents/hc-art/material-clubhouses/src/IMG1_ENV_HOME_PLATE_HC_V3_2X.png))
- Image 2: none for the pilot
- Saves as `ENV_HOME_PLATE_EMERALD_P1_2X`

```
Image 1 is the picture to edit. Use only image 1.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the lounge on the left (the table lamp on the sideboard, the folded plaid blankets, the two leather armchairs, the round table with the old leather ball in a bowl and the glass of whisky, the sofa with the grey throw, the rug), the big window exactly as it is: three tall panes of clear glass with the same sizes and edges as in image 1 (two wide panes across the middle behind the men, and one more pane at the far right edge beyond the lamp pillar), each pane running from its top frame, about one eighth of the way down the picture, all the way down to the counter, and showing the night sky, the floodlit stands, the crowd, the floodlights and the green pitch exactly as in image 1; the narrow pillar between the window panes with the wall lamp on it at the right, and the counter along the bottom edge at exactly the same height, about nine tenths of the way down the picture.

The room: A private members' club at night in green stone and leather: polished malachite, bottle-green leather, dark walnut and satin brass, handcrafted.
The lounge walls and panels become upholstered deep bottle-green leather with a fine natural grain and neat stitched seams, set between thin polished walnut pilasters so dark they read near-black. The ceiling becomes deep green lacquered plaster, almost black. The pillars beside the window become polished malachite: deep green stone with a few broad, calm, softly curving bands of lighter and darker green. The window frames become near-black walnut with a thin satin brass inner line. The lamp arms and bases become satin brass; the shades stay warm cream and lit. The sideboard becomes near-black walnut with a polished malachite top and a thin satin brass edge. The floor around the rug becomes polished dark malachite with soft dim reflections of the lamps and real contact shadows under the chairs, the table and the sofa. The counter becomes one plain, calm solid slab of polished malachite in the same deep green with the same few broad calm bands. The two armchairs and the sofa keep exactly their shape, size, cushions, seams and place, and are reupholstered in the same deep bottle-green leather as the walls, with a fine natural grain and neat stitched seams, a touch lighter where the lamp light falls so they read clearly against the walls.

Every window pane stays clear glass from its bottom frame all the way up to its top frame, showing the stadium: no leather, panel, wall or door is placed over any part of the glass or inside any window frame, and there is no door anywhere in this room. Only the thin window frames change material.

Every wall, frame, panel and pillar takes one of these materials (bottle-green leather, malachite, near-black walnut or satin brass); no light wood is left anywhere in the room.

Light: It is night. Emerald is deep bottle-green leather and polished malachite at night: rich like a dark green glass bottle held to candlelight, never mint, never lime, never teal. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window. The brightest spots are clearly bright: each lamp throws a wide, clearly bright warm pool onto the leather or stone around it, and the warm reflections of the lamps on the polished floor and counter are clearly bright, a soft cream-gold candlelight sheen on the green stone. Everything else keeps a deep, muted, aged green, falling off to green near-black in the far corners and toward the ceiling, so the room has depth and never looks flat; the walls read as a clearly readable rich bottle green, never near-black except in the far corners. The malachite carries a soft polished sheen with dim reflections only; brass appears only as small accents in satin brass with soft broad highlights, never hot white sparkle points or glitter. Up close you see the grain of the leather, the stitched seams, the walnut grain and the bands of the malachite, all sharp. The two men stay lit exactly as they are now.

Colour lock: every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is deep emerald green: bottle green (#145A3C) on the walls, malachite green (#2E8B57) where the stone is lit, green near-black (#0B2E22) in the shadows, corners and ceiling, and walnut so dark it reads near-black (#241A12). Every green is a touch muted and aged, a deep bottle green, never a vivid, neon or saturated green. Where the light is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki. The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor: no tan, honey, orange-brown, khaki or light brown there, even near the lamps; the only brown is the near-black walnut of the thin pilasters, frames and sideboard. Brass is only the lamp arms, the window's inner line, the sideboard edge and the hairline trims: no brass panels and no gold walls. The malachite bands are a few broad, smooth, softly curving bands of lighter and darker green that flow gently across the stone at different angles, each one continuous and unbroken with soft edges; the lighter bands are a soft mid jade (#5E9E74), never pale mint or white; never tight busy rings, zebra stripes, contour-map lines or a fine web of thin hairline lines. The stone is smooth, glassy polished malachite with no fine scratches or crinkles.

All other objects keep their identity and their own colours, exactly as in image 1 (the plaid wool blankets, the old leather ball, the glass of whisky, the grey throw, the rug, the lamp shades) and are relit by the new room, each standing on the floor or table with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

Tries:
- Try 1 (26 Nov 12:11 a.m. Boston) **8.5/10, one fix.** Align: scale 1.0010, shift 0.2 px, men unchanged (mean diff 4.5). All window panes clear glass full height with the stadium as in Image 1, no door, malachite pillars and counter with broad calm bands, near-black walnut sideboard with a malachite top, and the armchairs and sofa in bottle-green leather (seating rule) with the plaid, ball, whisky, throw and rug in their own colours. emerald_check PASS but thin: vs Black 15.8 and hue 0.52 against limits of 15 and 0.50. Miss: the big wall above the lounge and the ceiling are near-black, so the room reads close to Metallic Black (Ruby lesson 9). Raw kept as ENV_HOME_PLATE_EMERALD_P1_2X_T1_RAW.png.
- Fix 1 (same chat):

```
Keep this image exactly the same. Change only the walls and the ceiling: the big wall above and behind the lounge, the lounge wall panels and the ceiling become a clearly readable rich bottle green (#145A3C), a little lighter than now, instead of near-black, falling off to green near-black only in the far top corners. Keep their leather grain and seams. The window and the stadium, the malachite pillars, the counter, the lamps and their pools, the armchairs, the sofa, every object and the two men stay exactly as they are.
```

