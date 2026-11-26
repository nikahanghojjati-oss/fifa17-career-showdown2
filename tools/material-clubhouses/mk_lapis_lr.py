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


if __name__ == "__main__":
    print({"phone": lr_phone, "desktop": lr_desktop}[sys.argv[1]]())
