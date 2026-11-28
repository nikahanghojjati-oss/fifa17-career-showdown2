#!/usr/bin/env python3
"""P3 (Duet): batch 1 tickets for a material clubhouse: the 8 desktop rooms and the material slab.

  python3 tools/material-clubhouses/mk_desktop.py <key> > section.md

Built from B7's mk_full.py (r100-duet/p3/b7-kit, keep lists and room sentences copied as they are) plus Team V's
Matte lessons (round Hall pillars stay smooth, the Archive has no lamps, tunnel pillars stay square) and the
clubhouse's approved pilot wording (light rule, colour lock). Nik's seating rule (25 Nov 2026 07:36 UTC): armchairs
and sofas take the clubhouse's own material and colour. Image 2 is IMG2_REF_PILOT_<LOOK>.png, a people-free cut of
the two approved pilot paintings.
"""
import sys

import os
# Links point at a commit (env P3_REF, default the branch the Ruby set was made on), so they never move (Ruby lesson 3).
BR = os.environ.get("P3_REF", "claude-duet/p3-intake")
BLOB = f"https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/{BR}/project-documents/hc-art/material-clubhouses/src/"
RAW = f"https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/{BR}/project-documents/hc-art/material-clubhouses/src/"

M = {
 "RUBY": dict(
  name="Ruby Clubhouse",
  feel="A private members' club at night in red stone and leather: Rosso Levanto marble, oxblood leather, rosewood and antique gold, handcrafted.",
  wall="upholstered deep oxblood red leather with a fine natural grain and neat stitched seams, framed in thin polished rosewood mouldings so dark they read red-black, each with a hairline antique gold inlay, keeping the same panel layout",
  stone="polished Rosso Levanto marble: deep wine-red stone with a few long, calm, softly curving pale cream veins",
  frame="red-black rosewood with a thin antique gold inner line",
  door="the same oxblood leather panel in a red-black rosewood frame, with a small antique gold handle",
  metal="antique gold with a soft satin finish",
  rail="antique gold with a soft satin sheen and one small warm highlight",
  counter="one solid slab of polished Rosso Levanto marble in the same deep wine red with the same few long calm pale veins, holding a soft dim reflection of the lamps",
  floor="polished dark Rosso Levanto marble with soft dim reflections of the lamps and real contact shadows",
  mat="a ribbed rubber floor mat in deep wine near-black with thin antique gold edge strips",
  handrail="red-black rosewood with small antique gold brackets",
  case="red-black rosewood frames with a thin antique gold edge and Rosso Levanto marble shelves",
  shelf="red-black rosewood with a Rosso Levanto marble top and a thin antique gold edge",
  seat="the same deep oxblood red leather as the walls, with a fine natural grain and neat stitched seams, a touch lighter where the lamp light falls so they read clearly against the walls",
  materials="oxblood leather, Rosso Levanto marble, red-black rosewood or antique gold",
  light_rule="Ruby is deep oxblood leather and red Rosso Levanto marble at night: rich like dark red wine held to candlelight, never pink, never cherry, never orange.",
  pools="Each lamp casts a soft warm pool on the leather or stone around it, and the red falls off to wine near-black in the corners and toward the ceiling, so the room has depth and never looks flat.",
  men=" Behind each man the wall is a rich mid oxblood red, clearly lighter than the black suits, so both men read crisply against it.",
  sheen="The marble carries a soft polished sheen with dim reflections only; antique gold appears only as small accents with a soft glow, never a hard glint. Up close you see the grain of the leather, the stitched seams, the rosewood grain and the veins of the marble, all sharp.",
  lock="Colour lock: every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is deep ruby red, exactly the reds of image 2: oxblood (#6E1423) on the walls, Rosso Levanto red (#9B2335) where the stone is lit, wine near-black (#2A0A10) in the shadows, corners and ceiling, and rosewood so dark it reads red-black (#3A1416). The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor: no tan, honey, orange-brown, khaki or brown there, even near the lamps. Lamp light warms only a small soft pool right around each lamp, and everywhere else stays deep red. Gold is only the lamp metal, the rails, the handles and the hairline trims: no gold panels and no gold walls. The marble veins are a few long, smooth, softly curving pale lines that flow gently across the stone like brush strokes, never jagged, broken or cracked like ice. Between those few veins the stone is clean, even deep red, with no fine web of thin hairline lines anywhere.",
  slab="polished Rosso Levanto marble: a deep wine-red stone, oxblood (#6E1423) to lit red (#9B2335) with wine near-black (#2A0A10) in its deepest tones, with a few long, calm, softly curving pale cream veins (#D8C8B4) flowing in gentle diagonals like brush strokes",
  slab_lock="The stone stays a rich deep ruby red, exactly the red of the marble in image 2: the light only brightens it, it never tints it pink, cherry, orange or brown, and the veins stay few, long and calm, never jagged or cracked like ice."),
 "EMERALD": dict(grain="bands",
  name="Emerald Clubhouse",
  base="deep bottle green",
  fall="green falls off to near-black",
  feel="A private members' club at night in green stone and leather: polished malachite, bottle-green leather, dark walnut and satin brass, handcrafted.",
  wall="upholstered deep bottle-green leather with a slight cool blue lean that stays bottle green even where the lamp light falls on it (never olive, khaki or yellow-green), smooth satin-finish leather like the seat of a new club chair, an even, softly padded surface with no grain pattern visible at this distance (never crinkled, cracked, wrinkled or vein-like lines, even where the lamp light grazes it), with neat stitched seams, framed in thin polished walnut mouldings so dark they read near-black, each with a hairline satin brass inlay, keeping the same panel layout",
  stone="polished malachite: deep green stone with a few broad, calm, softly curving bands of lighter and darker green",
  frame="near-black walnut with a thin satin brass inner line",
  door="the same bottle-green leather panel in a near-black walnut frame, with a small satin brass handle",
  metal="satin brass with soft broad highlights",
  rail="a soft, dim satin brass line with no bright shine, never a bright yellow or white line",
  counter="one plain, calm solid slab of polished malachite in the same deep green with the same few broad calm bands, smooth and glassy, holding a soft dim reflection of the lamps",
  floor="polished dark malachite with soft dim reflections of the lamps and real contact shadows",
  mat="a ribbed rubber floor mat in green near-black with thin satin brass edge strips that stay a dim soft satin line",
  handrail="near-black walnut with small satin brass brackets",
  case="near-black walnut frames with a thin satin brass edge and polished malachite shelves; any light strip under a shelf and the trim around the recess is a dim, soft satin glow, never a bright line",
  shelf="near-black walnut with a polished malachite top and a thin satin brass edge",
  seat="the same deep bottle-green leather as the walls, with a fine natural grain and neat stitched seams, a touch lighter where the lamp light falls so they read clearly against the walls",
  materials="bottle-green leather, malachite, near-black walnut or satin brass",
  light_rule="Emerald is deep bottle-green leather and polished malachite at night: rich like a dark green glass bottle held to candlelight, never mint, never lime, never teal.",
  pools="The brightest spots are clearly bright: each lamp throws a wide, clearly bright warm pool onto the leather or stone around it, and the warm reflections on the polished stone are clearly bright, a soft, smooth cream-gold candlelight sheen on the green. Everything else keeps a deep, muted, aged green, falling off to green near-black only in the far corners and toward the ceiling, so the room has depth and never looks flat; the walls, the ceiling and the wall above any furniture read as a clearly readable rich bottle green, never near-black.",
  men=" Behind each man the wall is a clearly readable rich mid bottle green, clearly lighter than the black suits, so both men read crisply against it.",
  sheen="The malachite carries a soft polished sheen with dim reflections only; brass appears only as small accents in satin brass with soft broad highlights, never hot white sparkle points or glitter. Up close you see the smooth satin of the leather, the stitched seams, the walnut grain and the bands of the malachite, all sharp.",
  lock="Colour lock: every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is deep emerald green, exactly the greens of image 2: bottle green (#145A3C) on the walls, malachite green (#2E8B57) where the stone is lit, green near-black (#0B2E22) only in the deepest corners, and walnut so dark it reads near-black (#241A12). Every green is a touch muted and aged, a deep bottle green, never a vivid, neon or saturated green. Where the light is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki. The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor: no tan, honey, orange-brown, khaki or light brown there, even near the lamps; the only brown is the near-black walnut of the thin mouldings, frames and furniture. Brass is only the lamp metal, the rails, the handles and the hairline trims: no brass panels and no gold walls. The malachite bands are a few broad, smooth, softly curving bands of lighter and darker green that flow gently across the stone at different angles, each one continuous and unbroken with soft edges; the lighter bands are a soft mid jade (#5E9E74), never pale mint or white; never tight busy rings, zebra stripes, contour-map lines or a fine web of thin hairline lines. On any pillar or column the bands run straight up and down the full height of the pillar, parallel to its corners, like the grain of a tall stone column, never diagonal, slanted or spiral, and its reflections are a soft, broad, dim satin sheen, never a small hot white spot. The stone is smooth, glassy polished malachite with no fine scratches, crinkles or crumpled texture anywhere, even inside the lamp reflections.",
  slab="polished malachite: a deep green stone, bottle green (#145A3C) to lit malachite green (#2E8B57) with green near-black (#0B2E22) in its deepest tones, with a few broad, calm, softly curving bands of lighter mid jade (#5E9E74) and darker green flowing in gentle diagonals at different angles, each band smooth, continuous and unbroken with soft edges",
  slab_lock="The stone stays a rich deep emerald green, exactly the green of the malachite in image 2: the light only brightens it, it never tints it mint, lime, teal, olive or brown; the bands stay few, broad and calm, never tight busy rings, zebra stripes or contour-map lines, and the surface is smooth, glassy polished stone with no scratches or crinkles."),
 "LAPIS": dict(grain="soft cloud drifts",
  name="Lapis Clubhouse",
  subs=[("on the polished stone desk top around its base, with a dim soft reflection of the lit shade in the stone", "on the honed stone desk top around its base, with one soft, blurred warm glow in the stone"),
        (", polished and even all the way round", ", honed and even all the way round")],
  base="deep lapis blue",
  fall="blue falls off to ultramarine near-black",
  img2=("Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two "
        "finished rooms: the lapis-blue leather with its hand-tooled Persian pattern and flowered carpet borders, the honed lapis "
        "lazuli stone, the blue-black ebony and the satin gold. Match its materials, colours, finish and light exactly, and copy "
        "nothing else from it: none of its furniture, lamps, blankets, ball, carpet, fan of gold rays or layout."),
  feel="A private members' club at night in vivid lapis blue, handcrafted by master craftsmen in the spirit of a fine antique Persian carpet: honed lapis lazuli, hand-tooled lapis-blue leather, blue-black ebony and satin gold.",
  wall="the same rich lapis-blue leather as image 2, smooth satin-finish leather with neat hand-stitched seams, each panel framed in thin blue-black ebony with a hairline satin gold line, with the same narrow flowered Persian carpet border just inside its frame and its field filled with the same hand-tooled, embossed Persian vines, palmette flowers and leaves as image 2, in a brighter lapis blue pressed into the leather, rich and clearly readable, never pale silver, grey-white or gold, keeping the same panel layout",
  stone="honed lapis lazuli exactly like the stone in image 2: a deep vivid ultramarine with a few soft, broad, cloud-like drifts of brighter ultramarine and a sparse scattering of tiny crystal flakes, smooth with a soft satin finish: hard natural stone, never velvet, suede or fabric, with no streaks, brush marks or nap, and never grainy, sponged, crackled, starry or glassy",
  frame="blue-black ebony with a thin satin gold inner line",
  door="the same tooled lapis-blue leather panel in a blue-black ebony frame, with a small satin gold handle",
  metal="satin gold with soft broad highlights",
  rail="a soft, dim satin gold line with no bright shine, never a bright yellow or white line",
  counter="two calm, hand-cut book-matched slabs of honed lapis lazuli meeting at one fine straight joint, exactly like the counter in image 2: hard natural stone like a fine stone tabletop, a vivid ultramarine field with a few soft, broad, cloud-like drifts lying flat inside the stone and a sparse scattering of tiny crystal flakes, never velvet, suede or fabric, with no diagonal streaks, brush marks, nap, fibres, scribbled texture, gold specks or star-shaped sparkles; a soft warm wash of light falls along its top edge and the stone deepens gradually to deep lapis blue toward the bottom, so it has light and shade; lamps show in it only as soft, blurred warm glows and nothing is mirrored in it",
  floor="hard, honed deep lapis lazuli stone (never velvet, suede or carpet) with soft blurred warm glows under the lamps and real soft contact shadows",
  mat="a ribbed rubber floor mat in ultramarine near-black with thin satin gold edge strips that stay a dim soft satin line",
  handrail="blue-black ebony with small satin gold brackets",
  case="blue-black ebony frames with a thin satin gold edge and honed lapis lazuli shelves; any light strip under a shelf and the trim around the recess is a dim, soft satin glow, never a bright line",
  shelf="blue-black ebony with a honed lapis lazuli top and a thin satin gold edge",
  seat="the same rich lapis-blue leather as image 2, smooth satin-finish with neat hand-stitched seams, a touch brighter where the lamp light falls so they read clearly against the walls",
  materials="tooled lapis-blue leather, lapis lazuli, blue-black ebony or satin gold",
  light_rule="Lapis is vivid, lively ultramarine lapis lazuli and lapis-blue leather at night, like a film still: rich, saturated and jewel-bright, like a cut lapis gem held to candlelight, never a flat plastic blue, navy-grey, purple or teal.",
  pools="Each lamp throws a wide, clearly bright warm wash of lamplight onto the leather or stone around it, where the blue turns a brighter, clearer ultramarine, never grey, green or purple. Everything else keeps a vivid, saturated ultramarine, deepening to ultramarine near-black only in the far corners and toward the ceiling, so the room has depth and never looks flat; the walls and the wall above any furniture read as a clearly readable vivid ultramarine, never near-black.",
  men=" Behind each man the wall is a clearly readable vivid mid ultramarine, clearly lighter than the black suits, so both men read crisply against it.",
  sheen="The leather has a soft satin sheen; the lapis is honed with a soft satin finish, never glass or a mirror; gold appears only as small satin accents with soft broad highlights, never hot white sparkle points or glitter. Up close you see the tooled Persian pattern and stitched seams of the leather, the ebony mouldings and the drifts and tiny crystal flakes of the lapis, all sharp.",
  lock="Colour lock: every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is vivid lapis blue, exactly the blues of image 2: rich deep lapis blue (#1450AE) on the leather, vivid lapis blue (#165CC4) on the stone, brighter lapis blue (#1268E8) only where the lamps fall, deep lapis blue (#0D2A66) in the shadows and corners, and ebony so dark it reads blue-black (#12131A). Every blue is vivid and jewel-like, never navy-grey, purple or teal. The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor: no tan, honey, orange-brown, khaki or light brown there, even near the lamps. Gold is only the lamp metal, the rails, the handles and the hairline trims: no gold panels, no gold walls and no gold flecks in the stone. The lapis is a calm field of vivid blue with a few soft, broad drifts and a sparse scattering of tiny crystal flakes spaced well apart, each a tiny soft point of light, never a starry sky, a glitter field, white patches or a web of hairline veins or cracks. On any pillar or column the drifts run straight up and down, and the stone shows a fine straight joint where two book-matched slabs meet.",
  slab="honed lapis lazuli: a deep vivid ultramarine stone, rich deep lapis blue (#1450AE) to lit lapis blue (#1268E8) with deep lapis blue (#0D2A66) in its deepest tones, with a few soft, broad, cloud-like drifts of brighter ultramarine and a sparse scattering of tiny crystal flakes spaced well apart",
  slab_lock="The stone stays a rich, vivid lapis blue, exactly the blue of the lapis in image 2: the light only brightens it, it never tints it navy-grey, purple, teal or green; the drifts stay few, broad and calm, the flakes tiny and sparse, never a starry sky or glitter, and the surface is smooth honed stone with a soft satin finish, never grainy, scratched or glassy: hard natural stone like a fine stone tabletop, never velvet, suede or fabric, with no diagonal streaks, brush marks, nap, scribbled texture, gold specks or star-shaped sparkles."),
 "ROSEQUARTZ": dict(grain="soft misty milky clouds",
  # Modern palace (Nik's pick 27 Nov 2026 20:54 UTC; masters Board PALACE_T1E1 21:11, Home PALACE_T1E1 21:21 UTC).
  # Lessons from the palace pilot: first try came out evenly lit (Board) -> falloff wording from the start; thin white
  # branching lines and pressed-pattern velvet (Home) -> "no lines of any kind", "misty clouds like smoke", "no pattern
  # of any kind, no pressed or embossed pattern". Never "marble", "veins", "glossy", "polished", "mirror", "glow".
  name="Rose Quartz Clubhouse", code="RQ",
  sizelock=True,
  subs=[("on the polished stone desk top around its base, with a dim soft reflection of the lit shade in the stone", "on the honed rose quartz desk top around its base, where the stone turns a paler, milkier rose, with one soft, blurred warm patch of light in it"),
        (", polished and even all the way round, with the soft misty milky clouds running calmly down them", ", clad in tall rose quartz slabs with fine straight joints, honed and even all the way round, edged with slim plum-black fluted wood strips"),
        ("with the soft misty milky clouds running along the curve of each arch like the grain of a carved stone ring", "built of large hand-cut rose quartz blocks fitted along the curve of each arch with fine straight joints and one slim brushed rose gold line"),
        ("The walls become real rose quartz", "The walls become tall slabs of rose quartz set in matched pairs, separated by slim upright strips of plum-black fluted wood each edged with one slim recessed brushed rose gold line, real rose quartz"),
        ("and the pillars become real rose quartz", "and the pillars become tall columns clad in rose quartz slabs with fine straight joints, edged with slim plum-black fluted wood strips, real rose quartz"),
        ("on the leather or stone around it", "on the stone and velvet around it"),
        (" and the floodlit stadium glow through the window", " and the floodlit stadium light through the window"),
        # Office palace T1 (28 Nov): "a row of blocks like the counter" turned the flat desk top into a narrow strip over a
        # tall block front, and the lamp-lit stone went peach (hue 15). The desk keeps its own flat top.
        ("The desk top becomes a row of large hand-cut rose quartz blocks with fine straight joints and softly eased edges, exactly like the counter in image 2;", "The desk top becomes one wide, flat, level surface of two big hand-cut rose quartz slabs lying flat and meeting at one fine straight joint, seen from above exactly as the dark stone desk top in image 1: its flat top runs from behind the blotters all the way down to the bottom edge of the picture, with no front face, no step, no ledge and no upright blocks;"),
        ("Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail;", "Finish: real materials as a stonemason, an upholsterer and a cabinet maker would make them, brand new and immaculate, like a photograph of a real seven-star hotel lobby, never a render or an AI image, with clean sharp detail;")],
  base="calm dusty rose",
  fall="dusty rose deepens to deep plum",
  img2=("Image 1 is the picture to edit; keep every person in it exactly. Image 2 shows only "
        "the approved materials and light of this clubhouse, cut from two finished rooms: the big rose quartz slabs set in matched "
        "pairs, the plum-black fluted wood, the slim brushed rose gold lines, the plain dusty mauve-rose velvet seats and the rose "
        "quartz counter blocks. Match its materials, colours, finish and light exactly, and copy nothing else from it: none of its "
        "furniture, lamps, blankets, ball, rug or layout."),
  feel="The lobby of a real seven-star hotel at night in the modern palace style of the Aman and Bulgari hotels, calm, spare and monumental, built by master craftsmen: huge slabs of hand-cut rose quartz, plum-black fluted wood, slim brushed rose gold lines and plain dusty mauve-rose velvet.",
  wall="tall slabs of rose quartz exactly like the walls in image 2, set in matched pairs so the soft clouds of each pair meet in a gentle matching pattern at the joint, separated by slim upright strips of plum-black fluted wood (#1E0C1C) carved in fine vertical reeds, each edged with one slim recessed brushed rose gold line; any big plain wall area is a few very large, calm slabs with fine straight joints, keeping the same panel layout",
  stone="the same rose quartz as image 2, honed, calm and hand-cut, with fine straight joints where pieces meet",
  frame="plum-black wood with a slim brushed rose gold inner line",
  door="plum-black fluted wood carved in fine vertical reeds, with one slim brushed rose gold line and a small brushed rose gold handle",
  metal="brushed rose gold with soft broad highlights",
  rail="a soft, dim brushed rose gold line with no bright shine, never a bright yellow, copper-orange or white line",
  counter="a row of large hand-cut rose quartz blocks with fine straight joints and softly eased edges, exactly like the counter in image 2; a soft warm wash of light falls along its top edge and the stone deepens gradually toward the bottom, so it has light and shade; lamps show in it only as soft, blurred warm patches of light and nothing is reflected in it",
  floor="honed deep plum stone (never velvet, suede or carpet) with soft blurred warm patches of light under the lamps and real soft contact shadows",
  mat="a ribbed rubber floor mat in plum near-black with slim brushed rose gold edge strips that stay a dim soft satin line",
  handrail="plum-black wood with small brushed rose gold brackets",
  case="plum-black fluted wood frames with a slim brushed rose gold edge and honed rose quartz shelves; any light strip under a shelf and the trim around the recess is a dim, soft line of light, never a bright line",
  shelf="plum-black fluted wood with a honed rose quartz top and a slim brushed rose gold edge",
  seat="smooth dusty mauve-rose velvet (#7A4474) exactly like the seats in image 2, a fine short even pile in one plain solid colour with no pattern of any kind, no pressed or embossed pattern, with neat hand-stitched seams, a touch lighter where the lamp light falls so they read clearly against the walls",
  materials="rose quartz, plum-black fluted wood, plain dusty mauve-rose velvet or brushed rose gold",
  light_rule="Rose Quartz is a seven-star hotel lobby at night in calm rose quartz, plum-black fluted wood and slim rose gold, like a film still: calm and monumental, the stone like a hand-carved rose quartz bowl seen by candlelight, never candy pink, salmon, wine red, violet or grape.",
  pools="Each lamp throws a wide, clearly bright warm wash of lamplight onto the rose quartz around it, reaching across the nearest slabs and onto any seat beside it, where the stone turns a paler, milkier rose (#E0B5D0) that keeps its soft mauve lean, never peach, salmon or orange. Away from the lamps the rose quartz deepens gradually, step by step, to a richer, deeper dusty rose, and to deep plum (#4A2246) and plum near-black (#2A1230) only in the far corners and toward the top of the ceiling, so the room has real depth and never looks evenly lit or flat; the walls and the wall above any furniture read as a clearly readable dusty rose, never near-black.",
  men=" Behind each man the stone is a clearly readable mid dusty rose with a soft warm wash of lamplight, clearly lighter than the black suits, so both men read crisply against it.",
  sheen="The rose quartz is honed with a satin finish, the lamplight sinking a little way into it and coming back soft from within, never glassy and with nothing reflected in it; the velvet has a fine short pile; rose gold appears only as slim brushed lines and small accents with soft broad highlights, never hot white sparkle points or glitter. Up close you see the fine joints of the slabs, the reeds of the fluted wood and the misty clouds of the rose quartz, all sharp.",
  lock="The rose quartz, everywhere it appears: real rose quartz exactly like the stone in image 2, translucent and milky, like a hand-carved rose quartz bowl seen by candlelight, a calm dusty rose with a soft mauve lean, with only a few soft, broad, misty milky clouds drifting gently deep inside, soft-edged like smoke under the surface, honed with a satin finish: hard natural crystal, never glass, plastic, resin, painted plaster or fabric, brand new and flawless, with no lines of any kind, no cracks, no glitter and no specks. Colour lock: a calm dusty rose with a soft mauve lean (#BD7CA6) in the rose quartz, paler milky rose (#E0B5D0) only where lamp light falls on it and one step deeper (#A55E8C) away from it; plum-black wood (#1E0C1C) on the fluted strips, frames, mouldings and shelves; deep plum lacquered plaster (#4A2246) on any ceiling; dusty mauve-rose velvet (#7A4474) on the seating; brushed rose gold (#B76E79) on the slim lines and small metal accents. The stone is never salmon, coral, peach, orange or lilac, and never candy or pastel pink; the velvet is never wine red, crimson, magenta, violet or grape; the rose gold is never orange copper, brass or yellow gold. The warm brown wood and leather of image 1 must be gone completely from the room's walls, panels, pillars, frames, seating and floor: no tan, honey, orange-brown, khaki or light brown there, even near the lamps. Rose gold is only the lamp metal, the rails, the handles and the slim lines: no metal panels or walls. On any pillar or column the rose quartz is tall slabs with fine straight joints.",
  slab="real rose quartz crystal, like a hand-carved rose quartz bowl seen by candlelight: translucent and milky, a calm dusty rose with a soft mauve lean (#BD7CA6), paler milky rose (#E0B5D0) where the light is brightest and one step deeper (#A55E8C) in its deepest tones, with only a few soft, broad, misty milky clouds drifting gently deep inside, soft-edged like smoke under the surface",
  slab_lock="The stone stays a calm dusty rose with a soft mauve lean, exactly the rose quartz of image 2: the light only brightens it, it never tints it salmon, coral, peach, orange, lilac or candy pink; the clouds stay few, broad, soft and misty like smoke, with no lines of any kind, and the surface is honed crystal with a satin finish, brand new and flawless, never glassy, plastic, painted plaster or fabric, with no glitter, specks, streaks, cracks or scratches."),
}

STADIUM = " and the floodlit stadium glow through the window"
PL = "visual-assets/v10_1/plates-hc/"
# Keep lists and room sentences: B7's mk_full.py D, unchanged except the Team V lessons marked (V) and the seating rule (S).
D = [
 ("OFFICE", dict(name="Office", img1="IMG1_ENV_OFFICE_PLATE_HC_V3_2X.png", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the wide desk filling the lower half with its front edge at exactly the same height, the two leather desk blotters, the old leather ball, the coffee cup and saucer and the bundle of papers tied with string on the left, the table lamp with its pleated shade on the right, the olive tree in its pot behind, the wall panel at the far left, and the tall dark window behind with the night stadium and its floodlight.",
  room="The wall panel becomes {wall}. The window frames become {frame}. The lamp base and stem become {metal}; the shade stays warm cream and lit. The desk top becomes {counter}. The plant pot becomes {stone}.",
  lightx=" The table lamp casts a soft warm pool of light on the polished stone desk top around its base, with a dim soft reflection of the lit shade in the stone, fading back to {base} within a short distance (Ruby R-3 try 1: the desk stayed dark).",
  objs="All other objects keep their identity and their own colours (the old leather ball, the white cup, the paper bundle and string, the leather blotters, the olive tree) and are relit by the new room, each with a real soft contact shadow on the desk.")),
 ("HALL", dict(name="Hall", img1="IMG1_ENV_HALL_PLATE_HC_V3_2X.png", men=True, win=False,
  keep="Keep in the same places and at the same sizes: the staircase on the left with its railing and the leather bag on the steps, the stone pillars, the tall double door in the middle with its arched fanlight, the small side table beside the door with its table lamp and book, the patterned runner rug, the wall lamp with its pleated shade at the top right, and the counter strip along the bottom at exactly the same height.",
  room="The pillars keep their exact round shape and become smooth {stone}, polished and even all the way round, with the {grain} running calmly down them (V). The walls become {stone}, with wall panels in {wall}. The double door becomes {door}, and the fanlight frame becomes {frame}. The stair railing becomes {handrail}. The side table becomes {shelf}. The floor becomes {floor}. The lamp arms and bases become {metal}; the shades stay warm cream and lit. The counter strip becomes {counter}.",
  objs="All other objects keep their identity and their own colours (the leather bag, the book, the runner rug with its pattern) and are relit by the new room, each with a real soft contact shadow.")),
 ("ARCHIVE", dict(name="Archive", img1="IMG1_ENV_ARCHIVE_PLATE_HC_V3_2X.png", men=True, win=False, nolamps=True,
  keep="Keep in the same places and at the same sizes: the vaulted corridor of arches receding to the middle, the shelves along both sides, the two lit display niches on the left and right walls (an old ball in the left one, books in the right one), and the counter with its thin rail along the top edge, at exactly the same height, filling the lower part.",
  room="The arches and vault become solid, opaque {stone}, with the {grain} running along the curve of each arch like the grain of a carved stone ring, lit only by the warm light with one soft dim reflection, so each arch edge is no brighter than the lit walls beside it (never see-through, glassy, smoky or glowing from inside, and no bright rim lines) (V), and the wall panels become {wall}. The shelves become {shelf}. The display niches become {case}, lit warm from inside. The corridor floor becomes {floor}. The rail along the counter becomes {rail}. The counter becomes {counter}.",
  objs="The old ball and the books in the niches keep their identity and their own colours and are relit by the niche light.")),
 ("BOX", dict(name="Directors' box", img1="IMG1_ENV_BOX_PLATE_HC_V3_2X.png", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the big three-pane window across the middle with the night stadium, the crowd, the small ceiling spots and the green pitch exactly as they are, the coat hooks on the left with the grey coat and the yellow and black striped scarf, the glass wall cabinet on the right with the decanter and glasses, and the thin rail along the top of the counter at exactly the same height.",
  room="The wall panels become {wall}. The window frames become {frame}. The wall cabinet becomes {case}. The coat hooks become {metal}. The rail becomes {rail}. The counter becomes {counter}.",
  objs="All other objects keep their identity and their own colours (the grey coat, the yellow and black striped scarf, the amber decanter and the glasses) and are relit by the new room.")),
 ("COACHES", dict(name="Coaches' room", img1="IMG1_ENV_COACHES_PLATE_HC_V3_2X.png", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the long dark window across the middle with the floodlit pitch and the two goals, the shelf at the top left with three old leather balls, the display niche at the top right with the old boots, the small wall lamp on the left, the bundle of papers on the window sill, the door at the right, and the thin rail along the top of the counter at exactly the same height.",
  room="The wall panels become {wall}. The window frames become {frame}. The top shelf becomes {shelf}. The boot niche becomes {case}. The door becomes {door}. The lamp arm becomes {metal}; the shade stays warm cream and lit. The rail becomes {rail}. The counter becomes {counter}.",
  objs="All other objects keep their identity and their own colours (the old leather balls, the old boots, the paper bundle) and are relit by the new room.")),
 ("TUNNEL", dict(name="Players' tunnel", img1="IMG1_ENV_TUNNEL_PLATE_HC_V3_2X.png", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the tunnel receding to the steps and the floodlit pitch with the goal at the far end, the ribbed pillars and wall panels on both sides, the handrails, the caged bulkhead lamp on the right wall, the ribbed floor mat, and the counter strip along the bottom at exactly the same height.",
  room="The wall panels become {wall}, and the pillars become {stone}. The pillars keep their exact square shape, with flat faces and straight corners, never round columns (V). The handrails become {handrail}. The bulkhead lamp cage becomes {metal}; its glass stays warm and lit. The floor becomes {mat}. The counter strip becomes {counter}.",
  objs="The far end stays a real night pitch: green grass, white goal, floodlit stands, exactly as they are.")),
 ("CLUB", dict(name="Club room", img1="IMG1_ENV_CLUB_PLATE_HC_V3_2X.png", men=False, win=True,
  keep="Keep in the same places and at the same sizes: the two wall lamps with pleated shades at the left and right, the two hanging pennant banners below them, the trophies and old leather balls on the low shelves at the lower left and right, the wide window across the top with the floodlit stadium, the two leather armchairs and the low table in the middle of the room, and the counter strip along the bottom at exactly the same height. The room is empty of people.",
  room="The wall panels and pillars become {wall}. The back wall below the window becomes {wall}. The window frames become {frame}. The low shelves become {shelf}. The banner rods and lamp arms become {metal}; the shades stay warm cream and lit. The floor becomes {floor}. The counter strip becomes {counter}. The two armchairs keep exactly their shape, size, cushions, seams and place, and are reupholstered in {seat} (S).",
  objs="All other objects keep their identity and their own colours (the gold trophies, the old leather balls, the dark banners) and are relit by the new room, each with a real soft contact shadow.")),
 ("LOADING", dict(name="Loading tunnel (behind Reus)", img1="IMG1_ENV_LOADING_PLATE_HC_2X.png", men=False, win=True, size="3840x2160",
  keep="Keep in the same places and at the same sizes: the tunnel receding to the steps and the floodlit pitch with the goal at the far end, the ribbed pillars and wall panels on both sides, the handrails, the caged bulkhead lamp on the right wall, the ribbed floor mat, and the counter strip along the bottom at exactly the same height. The tunnel is empty of people.",
  room="The wall panels become {wall}, and the pillars become {stone}. The pillars keep their exact square shape, with flat faces and straight corners, never round columns (V). The handrails become {handrail}. The bulkhead lamp cage becomes {metal}; its glass stays warm and lit. The floor becomes {mat}. The counter strip becomes {counter}.",
  objs="The far end stays a real night pitch: green grass, white goal, floodlit stands, exactly as they are.")),
]

IMG2 = ("Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two "
        "finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it: none of its "
        "furniture, lamps, blankets, ball or layout.")


def strip_marks(s):
    return s.replace(" (V)", "").replace(" (S)", "")


def desktop(L, rm, R):
    men = ("Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. "
           "Do not touch them.\n\n") if R["men"] else ""
    if R.get("nolamps"):
        src = ("No wall lamps are visible in this room: light comes only from the lights inside the two display niches and soft warm "
               "light falling along the vault. Add no lamps, sconces or wall lights anywhere; the far end of the corridor stays plain. "
               f"Each niche casts a soft warm pool on the leather or stone around it, and the {L.get('fall', 'red falls off to wine near-black')} in "
               "the corners and toward the vault, so the room has depth and never looks flat.")
    else:
        src = f"Light comes only from the same warm lamps in the same places{STADIUM if R['win'] else ''}. {L['pools']}" + R.get("lightx", "").split(" (Ruby")[0].format(base=L.get("base", "deep wine red")) + ("." if R.get("lightx") else "")
    light = (f"Light: It is night. {L['light_rule']} {src}{L['men'] if R['men'] else ''} {L['sheen']}"
             + (" The two men stay lit exactly as they are now." if R["men"] else ""))
    people = "no people other than the two men" if R["men"] else "no people"
    return f"""{L.get('img2', IMG2)}

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

{men}{R['keep']}

The room: {L['feel']}
{strip_marks(R['room'].format(**{'grain': 'veins', **L}))}

Every wall, door, frame, shelf, panel and pillar takes one of these materials ({L['materials']}); no light wood is left anywhere in the room.

{light}

{L['lock']}

{R['objs']}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps{' or people' if R['men'] else ''}, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, {people}.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available."""


def slab(L):
    return f"""{L.get('img2', IMG2)}

Keep image 1 exactly the same size and framing. Repaint the whole surface as one new stone, seen straight on.

The stone: {L['slab']}.

It is a flat, seamless material surface: the pattern continues off every edge so it can tile, with no border, no vignette, no frame and no darker corners. Light is a soft, even, warm wash from above, very slightly brighter at the top. {L['slab_lock']} No objects, no reflections of objects, no text, no logos.

Real stone as a mason would finish it, with clean sharp detail and no noise grain, no streaks, no repeating cells.

Same 16:9 framing as the original, largest size available."""


def main():
    key = sys.argv[1].upper()
    L = M[key]
    short = key.title()
    first = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    out = [f"## Batch 1: the 8 desktop rooms and the material slab ({short} {first}-{first + 8})",
           "Image 2 for every ticket here: the people-free cut of the two approved pilot rooms.", ""]
    tickets = [(rm, R["name"], R["img1"], R.get("size", "3072x1728"), f"ENV_{rm}_PLATE_{key}_P1_2X", desktop(L, rm, R)) for rm, R in D]
    tickets.append(("SLAB", "Material slab", "IMG1_ENV_SLAB_HC_V1_2X.png", "3072x1728", f"ENV_SLAB_{key}_P1_2X", slab(L)))
    if L.get("sizelock"):  # Rose Quartz on: pixel-size framing lock in every room (playbook law 7)
        sz = lambda size: size.replace("x", " by ")
        tickets = [(rm, nm, i1, size, asset, p.replace(
            "Keep image 1 exactly the same in camera, framing and layout.",
            f"Keep image 1 exactly the same in camera, zoom, framing and layout, exactly {sz(size)} pixels, never narrower, wider or taller.").replace(
            "Keep image 1 exactly the same size and framing.",
            f"Keep image 1 exactly the same size and framing, exactly {sz(size)} pixels.").replace(
            "Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.",
            f"Same 16:9 framing as the original, exactly {sz(size)} pixels, nothing cropped or extended at any edge.").replace(
            "Same 16:9 framing as the original, largest size available.",
            f"Same 16:9 framing as the original, exactly {sz(size)} pixels."))
            for rm, nm, i1, size, asset, p in tickets]
    for a, b in L.get("subs", []):
        tickets = [(rm, nm, i1, sz, asset, p.replace(a, b)) for rm, nm, i1, sz, asset, p in tickets]
    for n, (rm, nm, img1, size, asset, p) in enumerate(tickets):
        code = f"{L.get('code', key[0])}-{first + n}"
        out += [f"### {code} · {L['name']}: {nm}",
                f"- Image 1: [{img1}]({BLOB}{img1}) ([raw]({RAW}{img1})), {size}",
                f"- Image 2: [IMG2_REF_PILOT_{key}.png]({BLOB}IMG2_REF_PILOT_{key}.png) ([raw]({RAW}IMG2_REF_PILOT_{key}.png))",
                f"- Saves as `{asset}`", "", "```", p, "```", "", "Tries:", ""]
    print("\n".join(out))


if __name__ == "__main__":
    main()
