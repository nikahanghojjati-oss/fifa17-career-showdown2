#!/usr/bin/env python3
"""mk_lapis_lr.py: Lapis L-22 (League Roulette room without the men, phone upright), built from the accepted Lapis L-17
Directors' box phone prompt with the same edits Emerald made from E-17 to E-22 (no men, middle kept calm for the 3D board,
Image 2 as a materials-only sample, plain leather strip under the window). Prints the prompt.
Usage: python3 tools/material-clubhouses/mk_lapis_lr.py phone"""
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


if __name__ == "__main__":
    print({"phone": lr_phone}[sys.argv[1]]())
