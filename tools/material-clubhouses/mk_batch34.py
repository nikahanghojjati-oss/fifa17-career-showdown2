#!/usr/bin/env python3
"""mk_batch34.py: Emerald batch 3 (League Roulette phone and desktop, Club sideways) and batch 4 (sign-in lounge desktop and
phone) tickets, built from the accepted Ruby R-22..R-26 prompts with every Ruby material, light and colour line swapped for
the Emerald ones, and with Ruby lessons 11-15 and Emerald lessons 11-12 in from the first try.
Usage: P3_REF=<sha> python3 tools/material-clubhouses/mk_batch34.py > tickets.md"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import mk_phones as mp

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
RUBY = os.path.join(ROOT, "project-documents/hc-art/material-clubhouses/ruby/RUN_SHEET_RUBY.md")
REF = os.environ.get("P3_REF", "4dc992c67f05cefee86a4bc7a18c7213a9dd7279")
L = mp.M["EMERALD"]
JADE = "a soft muted jade (#4F8A66)"

FEEL = "The room: " + L["feel"]
WALL = L["wall"]
FRAME = L["frame"]
METAL = L["metal"]
COUNTER = ("one plain, calm solid slab of crisp, real cut and polished malachite in the same deep, muted green with a few broad calm bands, "
           "and inside each band a few fine crisp growth lines that follow its curve, sharp in focus like a close photograph of a polished stone "
           "table top, never blurred, smoky or misty, holding a soft dim cream-gold reflection of the light, never yellow or olive; the stone is a "
           "touch greyed, its darks near #0B2E22 and its lighter bands " + JADE + ", never a vivid or saturated green")
STONE = ("polished malachite: smooth, glassy, deep muted green stone with a few broad, calm bands of lighter and darker green, its lighter bands "
         + JADE + ", each band continuous with soft edges, never a web of thin lines")
SEAT = ("the same deep bottle-green leather as the walls, in the same smooth satin finish with no grain pattern visible at this distance "
        "(never crinkled or cracked) and neat stitched seams, a touch lighter where the light falls so they read clearly against the wall behind them")
MATS = "(bottle-green leather, malachite, near-black walnut or satin brass)"
LIGHT_RULE = ("Emerald is deep bottle-green leather and polished malachite at night: rich like a dark green glass bottle held to candlelight, "
              "muted and aged, never mint, never lime, never teal.")
REST = ("Everything else keeps a deep, muted, aged green, and the walls read as a clearly readable rich bottle green, never near-black. "
        "Where the light is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki. Every green in the room is a touch "
        "muted and aged, a slightly greyed deep bottle green like an old glass bottle, never a vivid, neon or saturated green. " + L["sheen"])
LOCK = L["lock"].replace("a soft mid jade (#5E9E74)", JADE)
BANDS = LOCK[LOCK.index("The malachite bands are"):]
LOCK_HEAD = ("Colour lock: every wall, panel, pillar, shelf, the ceiling and the floor stone is deep emerald green: bottle green (#145A3C) on the walls, "
             "malachite green (#2E8B57) where the stone is lit, green near-black (#0B2E22) only in the deepest corners, and walnut so dark it reads "
             "near-black (#241A12). Every green is a touch muted and aged, a deep bottle green, never a vivid, neon or saturated green. Where the light "
             "is brightest the green turns a lighter, clearer jade, never yellow, olive or khaki.")
SIGNIN_LOCK = (LOCK_HEAD + " The black marble, the black walls and the glowing gold panels of {img} must be gone completely from the room itself: "
               "no black stone, no grey, no brown and no gold surfaces on the walls, pillars, shelves, ceiling or floor; the only near-black is the "
               "walnut of the thin mouldings, frames and shelves. Brass is only the lamp metal, the table rims and legs, the hairline trims and the "
               "thin light lines: no brass panels and no gold walls. " + BANDS +
               " All gold, on the trophies, balls, crowns, cup, lamp and table rims, is satin gold with soft broad highlights, never hot white sparkle "
               "points or glitter; the thin light lines under the shelves and the trim around any recess are a dim soft satin glow, never a bright line.")


def ruby_prompts():
    s = open(RUBY).read()
    out = {}
    for n in range(22, 27):
        i = s.index(f"### R-{n} ")
        j = s.index("### R-%d " % (n + 1)) if n < 26 else len(s)
        sec = s[i:j]
        out[n] = sec.split("```")[1].strip("\n")
    return out


def sub(t, a, b):
    assert a in t, (a[:60], t[:80])
    return t.replace(a, b)


def light(p):
    p = sub(p, "Ruby is deep oxblood leather and red Rosso Levanto marble at night: rich like dark red wine held to candlelight, deep and muted like aged oxblood leather and old dark wine, never bright crimson, never pink, never cherry, never orange.", LIGHT_RULE)
    p = sub(p, "the red falls off to wine near-black in the corners and toward the ceiling", "the green falls off to green near-black only in the far corners and toward the ceiling")
    p = p.replace("on the red stone", "on the green stone").replace("sheen on the red.", "sheen on the green.").replace("the leather and the rosewood around them", "the leather and the walnut around them")
    k = p.index("Everything else keeps a deep, muted, aged red")
    return p[:k] + REST


def convert(n, t):
    paras = t.split("\n\n")
    out = []
    img = "the attached picture" if n == 26 else "image 1"
    for p in paras:
        if p.startswith("Image 1 is the picture to edit. Image 2 is only a small sample"):
            p = sub(p, "(oxblood leather panels, red-black rosewood frames, Rosso Levanto marble)", "(bottle-green leather panels, near-black walnut frames, polished malachite)")
        elif p.startswith("The room:"):
            p = sub(p, "The room: A private members' club at night in red stone and leather: Rosso Levanto marble, oxblood leather, rosewood and antique gold, handcrafted.", FEEL)
            p = p.replace("upholstered deep oxblood red leather with a fine natural grain and neat stitched seams, framed in thin polished rosewood mouldings so dark they read red-black, each with a hairline antique gold inlay, keeping the same panel layout", WALL)
            p = p.replace("red-black rosewood with a thin antique gold inner line", FRAME)
            p = p.replace("The rail becomes antique gold with a soft dim satin sheen, a quiet line, never a bright yellow or white line.", "The rail becomes " + L["rail"] + ".")
            p = p.replace("Counter: one solid slab of polished Rosso Levanto marble in the same deep wine red, with soft cloudy patches of darker and lighter red and a few long, calm veins of pale cream stone, holding a soft dim reflection of the light.", "Counter: " + COUNTER + ".")
            p = p.replace("The counter becomes one solid slab of polished Rosso Levanto marble in the same deep wine red, with soft cloudy patches of darker and lighter red and a few long, calm veins of pale cream stone, holding a soft dim reflection of the light.", "The counter becomes " + COUNTER + ".")
            p = p.replace("The counter strip becomes one solid slab of polished Rosso Levanto marble in the same deep wine red, with soft cloudy patches of darker and lighter red and a few long, calm veins of pale cream stone, holding a soft dim reflection of the light.", "The counter strip becomes " + COUNTER + ".")
            p = p.replace("The wall cabinet becomes red-black rosewood frames with a thin antique gold edge and Rosso Levanto marble shelves.", "The wall cabinet becomes " + L["case"] + ".")
            p = p.replace("The coat hooks become antique gold with a soft satin finish.", "The coat hooks become " + METAL + ".")
            p = p.replace("The low shelf becomes red-black rosewood with a Rosso Levanto marble top and a thin antique gold edge.", "The low shelf becomes " + L["shelf"] + ".")
            p = p.replace("The banner rod and lamp arms become antique gold with a soft satin finish; the shades stay warm cream and lit.", "The banner rod and lamp arms become " + METAL + "; the shades stay warm cream and lit.")
            p = p.replace("The floor becomes smooth, glassy polished Rosso Levanto marble in the same deep wine red, with soft cloudy patches of darker and lighter red and a few long, continuous pale cream veins, with no fine web of crackle lines anywhere, holding soft dim reflections of the lamps and real contact shadows.",
                          "The floor becomes smooth, glassy " + STONE + ", with no fine web of crackle lines anywhere, holding soft dim reflections of the lamps and real contact shadows.")
            p = p.replace("are reupholstered in the same deep oxblood red leather as the walls, with a fine natural grain and neat stitched seams, a touch lighter where the light falls so they read clearly against the wall behind them.", "are reupholstered in " + SEAT + ".")
            # sign-in lounge
            p = p.replace("The dark stone pillar and every stone table top become polished Rosso Levanto marble: smooth, glassy, deep wine-red stone with soft cloudy patches of darker and lighter red and only a few long, continuous pale cream veins with soft edges, never a web of thin lines.",
                          "The dark stone pillar and every stone table top become " + STONE + "; on the pillar the bands run straight up and down its full height.")
            p = p.replace("The shelving becomes red-black rosewood with a fine straight grain and a hand-rubbed satin finish.", "The shelving becomes near-black walnut with a fine straight grain and a hand-rubbed satin finish.")
            p = p.replace("The gold light strips along the shelves, walls and pillars become thin antique gold lines lit softly warm, a quiet satin glow, never a bright yellow or white line and never a glowing gold panel.",
                          "The gold light strips along the shelves, walls and pillars become thin satin brass lines lit softly warm, a dim soft satin glow, never a bright yellow or white line and never a glowing gold panel.")
            p = p.replace("The table rims, table legs, plant pots' bands and lamp metal become antique gold with a soft satin finish.", "The table rims, table legs, plant pots' bands and lamp metal become " + METAL + ".")
            p = p.replace("The floor becomes large tiles of polished Rosso Levanto marble: smooth, glassy, deep wine-red stone with soft cloudy patches of darker and lighter red and only a few long, continuous pale cream veins with soft edges, never a web of thin lines, laid in straight even rows,",
                          "The floor becomes large tiles of " + STONE + ", the bands flowing across the tiles without stopping at a tile edge, laid in straight even rows,")
            p = p.replace("The ceiling becomes a red-black rosewood coffered ceiling with straight even beams.", "The ceiling becomes a near-black walnut coffered ceiling with straight even beams.")
            p = p.replace("The sofa and the armchair become deep oxblood red leather with a fine natural grain, real tufting, real seams and soft natural creases, a touch lighter where the light falls so they read clearly against the wall behind them.",
                          "The sofa and the armchair become deep bottle-green leather in a smooth satin finish, with real tufting, real seams and soft natural creases, a touch lighter where the light falls so they read clearly against the wall behind them.")
            p = p.replace("The soft rug becomes a deep wine-red wool rug.", "The soft rug becomes a deep bottle-green wool rug.")
            p = p.replace("The crown emblem panel becomes oxblood leather with the crown in antique gold.", "The crown emblem panel becomes bottle-green leather with the crown in satin brass.")
            p = p.replace("The tall recess behind the plant becomes oxblood leather panels framed in red-black rosewood, lit softly from its thin antique gold light lines;",
                          "The tall recess behind the plant becomes bottle-green leather panels framed in near-black walnut, lit softly from its thin satin brass light lines, a dim soft satin glow;")
            assert not re.search(r"oxblood|rosewood|Rosso|antique gold|wine", p), (n, re.findall(r".{40}(?:oxblood|rosewood|Rosso|antique gold|wine).{40}", p))
        elif p.startswith("Every wall, door, frame"):
            p = sub(p, "(oxblood leather, Rosso Levanto marble, red-black rosewood or antique gold)", MATS)
        elif p.startswith("Light:"):
            p = light(p)
        elif p.startswith("Colour lock:"):
            p = SIGNIN_LOCK.format(img=img) if n in (25, 26) else LOCK
        else:
            p = p.replace("polished Rosso Levanto marble", "polished malachite").replace("Rosso Levanto marble", "malachite")
        assert not re.search(r"oxblood|rosewood|Rosso|Ruby|antique gold|cream vein|wine", p), (n, p[:120], re.findall(r".{30}(?:oxblood|rosewood|Rosso|Ruby|antique gold|cream vein|wine).{30}", p))
        out.append(p)
    return "\n\n".join(out)


def link(name, ref=REF):
    base = "project-documents/hc-art/material-clubhouses/src/" + name
    return (f"[{name}](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/{ref}/{base}) "
            f"([raw](https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/{ref}/{base}))")


TICKETS = [
    (22, "League Roulette room without the men, phone upright", "IMG1_ENV_BOX_PHONE_HC_V4.png", "1179x2096", "IMG2_REF_BOX_EMERALD_SWATCH.png", "materials-only patch, as E-17", "ENV_BOX_PHONE_V4_EMERALD_P1", "LR_PHONE"),
    (23, "League Roulette room without the men, desktop", "IMG1_ENV_BOX_PLATE_EMPTY_HC_V4_2X.png", "3072x1728", "IMG2_REF_PILOT_EMERALD.png", "the approved pilot materials, as E-6", "ENV_BOX_PLATE_EMPTY_EMERALD_P1_2X", "LR"),
    (24, "Club room, phone sideways", "IMG1_ENV_CLUB_SIDEWAYS_HC_V4.png", "2532x1170", "IMG2_REF_PILOT_EMERALD.png", "the approved pilot materials, as E-9", "ENV_CLUB_SIDEWAYS_EMERALD_P1", "CLUBSIDE"),
    (25, "Sign-in lounge, desktop", "IMG1_ENV_SETTINGS_PLATE_V2_2X.png", "3072x1728", "IMG2_REF_PILOT_EMERALD.png", "the approved pilot materials", "ENV_SIGNIN_PLATE_EMERALD_P1_2X", "SIGNIN"),
    (26, "Sign-in lounge, phone upright", "IMG1_ENV_SETTINGS_PHONE_V2.png", "1179x2096", None, "none: Image 1 alone (Ruby lesson 14)", "ENV_SIGNIN_PHONE_EMERALD_P1", "SIGNIN_PHONE"),
]


def main():
    R = ruby_prompts()
    print("## Batch 3: League Roulette and Club sideways (Emerald 22-24)")
    print("Built by tools/material-clubhouses/mk_batch34.py from the accepted Ruby R-22..R-24 prompts with every Ruby material, light and colour line swapped for Emerald's, Ruby lessons 11-15 and Emerald lessons 11-12 in. Each in a brand-new chat. No men in any of them. The League Roulette room is the background of the 3D roulette board (Nik, 26 Nov): the board is drawn by the game over this room, never the old flat wheel.\n")
    for n, title, i1, size, i2, i2note, save, chk in TICKETS:
        if n == 25:
            print("## Batch 4: Sign-in lounge (Emerald 25-26)\n")
        print(f"### E-{n} · Emerald Clubhouse: {title}")
        print(f"- Image 1: {link(i1)}, {size}")
        print(f"- Image 2 ({i2note}): {link(i2)}" if i2 else f"- Image 2: {i2note}")
        print(f"- Saves as `{save}`")
        print(f"- Check: `emerald_check.py {chk}`")
        print("- Brand-new chat.\n")
        print("```")
        print(convert(n, R[n]))
        print("```\n")
        print("Tries:\n")


if __name__ == "__main__":
    main()
