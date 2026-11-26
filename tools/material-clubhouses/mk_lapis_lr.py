#!/usr/bin/env python3
"""mk_lapis_lr.py: Lapis L-22 (League Roulette room without the men, phone upright), built from the accepted Lapis L-17
Directors' box phone prompt with the same edits Emerald made from E-17 to E-22 (no men, middle kept calm for the 3D board,
Image 2 as a materials-only sample, plain leather strip under the window). Prints the prompt.
Also L-23 (desktop) from E-23's layout with L-6's materials.
Usage: python3 tools/material-clubhouses/mk_lapis_lr.py phone|desktop"""
import os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
SHEET = os.path.join(ROOT, "project-documents/hc-art/material-clubhouses/lapis/RUN_SHEET_LAPIS.md")


def prompt(tag):
    s = open(SHEET).read()
    i = s.index("### " + tag + " ")
    return s[i:].split("```")[1].strip("\n")


def sub(t, a, b):
    assert t.count(a) == 1, (t.count(a), a[:70])
    return t.replace(a, b)


def lr_phone():
    p = prompt("L-17")
    p = sub(p, "Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.",
            "Image 2 is only a small sample of the finished materials and light of this clubhouse (hand-tooled Persian lapis-blue leather panels with flowered carpet borders, "
            "blue-black ebony frames, honed lapis lazuli, satin gold); match its materials, colours and light, and copy nothing else from it: not its camera angle, not its "
            "layout, not its objects, not its framing. The picture keeps the layout of image 1.")
    p = sub(p, "a plain dark wall band fills the top 18%", "a plain leather wall band fills the top 18%")
    p = sub(p, "from 9% to 91% of the width; the stone below the rail fills the whole lower 42%; the two men's heads sit at about 30% of the height, at the same size.",
            "from 9% to 91% of the width; a plain leather wall strip runs from 52% down to the counter edge at 58%; the stone below the rail fills the whole lower 42%.")
    p = sub(p, "the big dark window with the night stadium fills the wall behind the two men, with", "the big dark window with the night stadium, with")
    p = sub(p, "Add no arches, vaults, corridors, niches or shelves. The stadium, crowd and seats inside",
            "Add no arches, vaults, corridors, niches, shelves or furniture. The stadium, crowd, seats and pitch inside")
    p = sub(p, "Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.",
            "There are no people in this room; keep it empty of people. The middle of the picture stays calm and uncluttered: a large roulette board will sit there.")
    p = sub(p, "the window with the night stadium and pitch, the counter rail, with", "the window with the night stadium and pitch, its frames and its one upright bar, and the counter rail, with")
    p = sub(p, "lights a clear warm edge on the leather around the window frame and along the satin gold rail,", "lights a clear warm edge on the leather around the window frame,")
    p = sub(p, "and the walls behind the men read as", "and the walls read as")
    p = sub(p, " Behind each man the wall is a clearly readable vivid mid ultramarine, clearly lighter than the black suits, so both men read crisply against it.", "")
    p = sub(p, " The two men stay lit exactly as they are now.", "")
    p = sub(p, "Objects keep their identity and their own colours and are relit by the new room.", "The stadium in the window stays exactly as it is.")
    p = sub(p, "no people other than the two men.", "no people.")
    for w in ("men", "man", "suits"):
        assert f" {w} " not in p and f" {w}." not in p and f" {w}," not in p, w
    return p


EMERALD = os.path.join(ROOT, "project-documents/hc-art/material-clubhouses/emerald/RUN_SHEET_EMERALD.md")


def eprompt(tag):
    s = open(EMERALD).read()
    i = s.index("### " + tag + " ")
    return s[i:].split("```")[1].strip("\n").split("\n\n")


def lr_desktop():
    """L-23: E-23's layout paragraphs (no men, window, wall band, rail at 76%, middle calm) with the Lapis material, light and
    colour paragraphs of the accepted L-6 desktop box and the L-13 counter lesson from L-22."""
    e, l6, l22 = eprompt("E-23"), prompt("L-6").split("\n\n"), lr_phone().split("\n\n")
    assert len(e) == 11 and e[2].startswith("There are no people") and e[7].startswith("Colour lock")
    p0 = ("Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms: the "
          "lapis-blue leather with its hand-tooled Persian pattern and flowered carpet borders, the honed lapis lazuli stone, the blue-black ebony and "
          "the satin gold. Match its materials, colours, finish and light, and copy nothing else from it: none of its furniture, lamps, blankets, ball, "
          "carpet, fan of gold rays, layout, camera angle or shape. The picture keeps the layout and the shape of image 1.")
    p3 = sub(e[3], "one plain, calm slab of polished malachite", "one plain, calm slab of honed lapis lazuli")
    room = [x for x in l6 if x.startswith("The room:")][0]
    room = sub(room, "The wall panels become", "The wall panels and the band below the window become")
    counter = [x for x in l22 if x.startswith("The room:")][0]
    counter = counter[counter.index("Counter: ") + len("Counter: "):]
    k = room.index("The counter becomes ")
    room = room[:k] + "The counter becomes " + counter
    mats = [x for x in l6 if x.startswith("Every wall, door")][0]
    light = [x for x in l22 if x.startswith("Light:")][0].replace("the window frame,", "the window frames,")
    lock = [x for x in l6 if x.startswith("Colour lock:")][0]
    out = [p0, e[1], e[2], p3, room, mats, light, lock, e[8], e[9], e[10]]
    t = "\n\n".join(out)
    import re
    assert not re.search(r"malachite|walnut|brass|bottle|green near|Emerald| men |suits", t), re.findall(r".{30}(?:malachite|walnut|brass|bottle|Emerald| men |suits).{30}", t)
    return t


def club_sideways():
    """L-24: E-24's layout paragraphs (wide 2.16:1 club room, no people) with L-9's accepted Lapis materials and colour lock,
    the L-22 counter (L-13 lesson) and E-24's fix lessons built into the light (walls clearly readable, wide lamp pools)."""
    e, l9, l22 = eprompt("E-24"), prompt("L-9").split("\n\n"), lr_phone().split("\n\n")
    assert len(e) == 11 and e[2].startswith("There are no people") and e[6].startswith("Light:")
    p0 = sub(lr_desktop().split("\n\n")[0], "carpet, fan of gold rays, layout, camera angle or shape", "carpet, fan of gold rays, layout, camera angle or shape")
    room9 = [x for x in l9 if x.startswith("The room:")][0]
    feel, rest = room9.split("\n", 1)
    k = rest.index(" The back wall below the window becomes")
    wall = rest[:k].replace("The wall panels and pillars become", "The wall panels, the top band, the back wall below the window and the tall panel on the right become")
    counter = [x for x in l22 if x.startswith("The room:")][0]
    counter = counter[counter.index("Counter: ") + len("Counter: "):]
    chairs = rest[rest.index("The two armchairs keep"):]
    room = (feel + "\n" + wall + " The window frames become blue-black ebony with a thin satin gold inner line. The low shelf becomes blue-black ebony "
            "with a honed lapis lazuli top and a thin satin gold edge. The banner rod and lamp arms become satin gold with soft broad highlights; the "
            "shades stay warm cream and lit. The floor becomes hard, honed deep lapis lazuli stone (never velvet, suede or carpet) with soft blurred warm "
            "glows under the lamps and real soft contact shadows. The counter strip becomes " + counter + " " + chairs)
    mats = [x for x in l9 if x.startswith("Every wall, door")][0]
    light = ("Light: It is night. Lapis is vivid, lively ultramarine lapis lazuli and lapis-blue leather at night, like a film still: rich, saturated "
             "and jewel-bright, like a cut lapis gem held to candlelight, never a flat plastic blue, navy-grey, purple or teal. Light comes only from the "
             "two warm wall lamps in the same places and the floodlit stadium glow through the window. Each lamp throws a wide, clearly bright warm "
             "cream-gold pool onto the leather wall around and below it, spreading softly about a third of the way down the wall, the window glow lights "
             "the two armchairs and the floor in front of them softly, and the trophy catches a soft warm glint; the blue falls off to ultramarine "
             "near-black only in the far corners and toward the ceiling, so the room has depth and never looks flat. Everything else keeps a vivid, "
             "saturated ultramarine, and the walls read as a clearly readable vivid mid ultramarine, never near-black, so the armchairs and the pennant "
             "read clearly against them. Where the light is brightest the blue turns a brighter, clearer ultramarine, never grey, green or purple. Every "
             "blue in the room is rich and jewel-like, never navy-grey, purple or teal, and the hand-tooled Persian vines and palmettes and the flowered "
             "borders on the leather stay rich and clearly readable. The leather has a soft satin sheen; the lapis is honed with a soft satin finish, "
             "never glass or a mirror; gold appears only as small satin accents with soft broad highlights, never hot white sparkle points or glitter. Up "
             "close you see the tooled Persian pattern and stitched seams of the leather, the ebony mouldings and the drifts and tiny crystal flakes of "
             "the lapis, all sharp.")
    lock = [x for x in l9 if x.startswith("Colour lock:")][0]
    out = [p0, e[1], e[2], e[3], room, mats, light, lock, e[8], e[9], e[10]]
    t = "\n\n".join(out)
    import re
    assert not re.search(r"malachite|walnut|brass|bottle|green near|Emerald| men |suits", t), re.findall(r".{30}(?:malachite|walnut|brass|bottle|Emerald| men |suits).{30}", t)
    return t


def _lapis_parts():
    """The accepted Lapis wording, cut from L-22 (room line, leather, pillar stone, light opening and blues, colour lock)."""
    ps = prompt("L-22").split("\n\n")
    room = [p for p in ps if p.startswith("The room:")][0]
    head, walls = room.split("\n", 1)
    leather = walls.split("Walls and panels: ", 1)[1].split(" Pillars: ")[0]
    pillar = walls.split(" Pillars: ", 1)[1].split(" Frames: ")[0]
    light = [p for p in ps if p.startswith("Light:")][0]
    lock = [p for p in ps if p.startswith("Colour lock:")][0]
    every = [p for p in ps if p.startswith("Every wall, door")][0]
    return head, leather, pillar, light, lock, every


def _signin(e, one_image):
    """L-25/L-26: Emerald's sign-in lounge layout paragraphs (E-25 / E-26 try 2, with its edge lock) and the Lapis materials,
    with Emerald's sign-in fixes built in: shelf backs in the wall leather, dim light strips and recess lines."""
    head, leather, pillar, light, lock, every = _lapis_parts()
    ps = list(e)
    if not one_image:
        ps[0] = ps[0].replace("blankets, ball, layout", "blankets, ball, carpet, fan of gold rays, layout")
        assert "fan of gold rays" in ps[0]
    ref = "the attached picture" if one_image else "image 1"
    stone = "honed lapis lazuli exactly like the stone in image 2" if not one_image else "honed lapis lazuli"
    if one_image:
        leather = leather.replace("the same rich lapis-blue leather as image 2", "a rich lapis-blue leather (#1450AE)")
        leather = leather.replace("the same narrow flowered Persian carpet border", "a narrow flowered Persian carpet border")
        leather = leather.replace("the same hand-tooled, embossed Persian vines, palmette flowers and leaves as image 2", "hand-tooled, embossed Persian vines, palmette flowers and leaves")
        pillar = pillar.replace("honed lapis lazuli exactly like the stone in image 2", "honed lapis lazuli")
    assert "image 2" not in (leather + pillar) or not one_image
    leather, pillar = leather.rstrip("."), pillar.rstrip(".")
    leather_obj = "the same rich lapis-blue leather as the walls"
    flake = ("a deep vivid ultramarine with a few soft, broad, cloud-like drifts of brighter ultramarine and a sparse scattering of tiny "
             "crystal flakes, smooth with a soft satin finish, hard natural stone, never velvet, suede or fabric")
    room = (head + "\nThe wall panels and the back walls become " + leather + ". The dark stone pillar becomes " + pillar +
            ". Every stone table top becomes " + stone + ": " + flake + ". The shelving becomes blue-black ebony (#12131A) with a thin satin gold edge. "
            "The back wall inside the shelves, behind the trophies and books, is the same lapis-blue leather as the walls, never warm brown, amber or orange. "
            "The gold light strips along the shelves, walls and pillars" + (", and the thin light lines along the top of the tall recess and down its left edge," if one_image else "") +
            " become thin satin gold lines lit softly warm, a dim soft satin glow at about half their present brightness, never a bright yellow or white line and never a glowing gold panel. "
            "The table rims, table legs, plant pots' bands and lamp metal become satin gold with soft broad highlights, dim and never shining white. "
            "The floor becomes large tiles of honed lapis lazuli: " + flake + ", the drifts flowing across the tiles without stopping at a tile edge, laid in straight even rows, "
            "showing the lamps only as soft, blurred warm glows and real soft contact shadows, never a mirror and never bright streaks. "
            "The ceiling becomes a blue-black ebony coffered ceiling with straight even beams and lapis-blue leather panels between them. "
            "The sofa" + ("" if one_image else " and the armchair") + " become " + leather_obj + ", smooth satin finish with real tufting, real seams and soft natural creases, "
            "a touch brighter where the light falls so they read clearly against the wall behind them, never olive, teal or grey. "
            "The soft rug becomes a deep lapis-blue hand-knotted Persian wool rug with a calm flowered border, soft and matte"
            + ("" if one_image else ". The crown emblem panel becomes lapis-blue leather with the crown in satin gold") + ".")
    if one_image:
        room = room.replace("The sofa become", "The sofa becomes")
        room = room.replace("so they read clearly against the wall behind them", "so it reads clearly against the wall behind it")
    ps[4] = room
    ps[5] = every
    ps[6] = ps[6].replace("reflections on the floor are true, soft mirror images of what is above them.",
                          "the honed stone floor shows the lamps only as soft, blurred warm glows, never mirror images or streaks.")
    lt = light.split("Image 1 has no lamps in this room")[0]
    assert lt != light
    lt += ("Light comes only from the floor lamp, the soft warm shelf lights and the city through the windows. The shelf lights and the floor lamp "
           "throw soft warm pools onto the leather and the ebony around them, the window glow lights the sofa softly, and the blue falls off to "
           "ultramarine near-black only in the far corners and toward the ceiling, so the room has depth and never looks flat. The brightest spots are "
           "clearly bright: the floor lamp lights a wide, clearly bright warm pool, a soft cream-gold candlelight sheen on the blue, while the shelf lights "
           "stay a dim, soft satin glow. Everything else keeps a vivid, saturated ultramarine, and the walls read as a clearly readable vivid mid "
           "ultramarine, never near-black, so the sofa, the plants and the gold trophies read clearly against them. ")
    lt += "Where the light is brightest" + light.split("Where the light is brightest", 1)[1]
    ps[7] = lt
    lk = lock.replace("every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is vivid lapis blue",
                      "every wall, panel, pillar, shelf back, the ceiling, the floor stone, the stone table tops, the sofa" + ("" if one_image else ", the armchair") + " and the rug are vivid lapis blue")
    lk = lk.replace("The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor",
                    "The black marble, the black walls and the glowing gold panels of " + ref + " must be gone completely from the room itself, and no warm brown is left on the walls, panels, pillars, shelves, ceiling or floor")
    lk = lk.replace("Gold is only the lamp metal, the rails, the handles and the hairline trims",
                    "Gold is only the lamp metal, the table rims and legs, the thin dim light lines and the hairline trims, besides the gold trophies, balls and crowns")
    lk = lk.replace("no gold flecks in the stone.", "no gold flecks in the stone; every thin gold line, frame edge and trim stays a dim soft satin gold, never a bright shining line.")  # L-24 lesson
    assert "never a bright shining line" in lk
    if one_image:
        lk = lk.replace("exactly the blues of image 2: ", "in these blues: ")
    ps[8] = lk
    p = "\n\n".join(ps)
    assert p.count("Light comes only from") == 1 and "no lamps" not in p
    assert ".." not in p
    for w in ("malachite", "walnut", "brass", "bottle", "emerald", "Emerald", "jade"):
        assert w not in p, w
    if one_image:
        assert "image 2" not in p and "image 1" not in p
    return p


def signin_desktop():
    return _signin(eprompt("E-25"), one_image=False)


def signin_phone():
    s = open(EMERALD).read()
    i = s.index("### E-26 ")
    t2 = s[i:].split("Try 2 prompt:", 1)[1].split("```")[1].strip("\n").split("\n\n")
    return _signin(t2, one_image=True)


if __name__ == "__main__":
    print({"phone": lr_phone, "desktop": lr_desktop, "sideways": club_sideways, "signin": signin_desktop, "signin_phone": signin_phone}[sys.argv[1]]())
