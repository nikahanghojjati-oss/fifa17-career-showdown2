#!/usr/bin/env python3
"""P3 (Duet): batch 2 tickets for a material clubhouse: the 10 phone bands.

  python3 tools/material-clubhouses/mk_phones.py <key> [first] > section.md

Built from B7's mk_full.py phone() and Team V's Matte phone tickets (RUN_SHEET_MATTE HO-151..160): the 9:16 framing
lock with the counter edge at its measured height, square tunnel pillars, the Archive has no lamps, the Box window
lock, the Coaches wall row, and a materials-only strip as Image 2 for Club and Loading (HO-140, HO-160). Words are the
clubhouse's approved batch 1 wording, with Ruby's lessons (stone veins never gold or wavy, warm pools and reflections
on the counter). Image 2 is the room's own swatch from swatch.py.
"""
import sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
from mk_desktop import M

BR = "claude-duet/p3-ruby"
BLOB = f"https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/{BR}/project-documents/hc-art/material-clubhouses/src/"
RAW = f"https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/{BR}/project-documents/hc-art/material-clubhouses/src/"

X = {  # Ruby words that grew past batch 1's dictionary (R-6 to R-11 lessons)
 "RUBY": dict(
  light_rule="Ruby is deep oxblood leather and red Rosso Levanto marble at night: rich like dark red wine held to candlelight, deep and muted like aged oxblood leather and old dark wine, never bright crimson, never pink, never cherry, never orange.",
  stone="polished Rosso Levanto marble: deep wine-red stone with soft cloudy patches of darker and lighter red, crossed by only one or two faint thin veins of pale cream stone; the veins are stone, not gold, never wavy stripes, never zigzag cracks",
  counter="one solid slab of polished Rosso Levanto marble in the same deep wine red, with soft cloudy patches of darker and lighter red and a few long, calm veins of pale cream stone, holding a soft dim reflection of the lamps",
  sample="oxblood leather panels, red-black rosewood frames, Rosso Levanto marble",
  veins=("The marble veins are a few long, smooth, softly curving pale lines that flow gently across the stone like brush strokes, never jagged, broken or cracked like ice.",
         "The marble veins are a few long, smooth, softly curving lines of pale cream stone, never gold, never wavy stripes, never jagged, broken or cracked like ice.")),
}

FLOOR = {"HOME"}  # rooms whose image 1 shows a floor strip under the counter
# room: (image 1, keep sentence, counter edge % of the height or None, window?, men?, swatch, extra light)
R = {
 "HOME": ("IMG1_ENV_HOME_PHONE_HC_V3.png", "the window with the night stadium and pitch, the wall lamp on the pillar, the counter edge", 50, True, True, "HOME", ""),
 "BOARD": ("IMG1_ENV_BOARD_PHONE_HC_V3.png", "the wall lamp on the left, the wall panels and door, the counter edge", 52, False, True, "BOARD", ""),
 "OFFICE": ("IMG1_ENV_OFFICE_PHONE_HC_V3.png", "the dark window with the floodlight, the lamp at the right edge, the desk with the two blotters, the desk's front edge", 40, True, True, "OFFICE", ""),
 "HALL": ("IMG1_ENV_HALL_PHONE_HC_V3.png", "the stone pillars with their exact shape, the double door with its fanlight, the side table and lamp, the wall lamp at the right, the counter edge", 67, False, True, "HALL", ""),
 "ARCHIVE": ("IMG1_ENV_ARCHIVE_PHONE_HC_V3.png", "the vaulted corridor of arches, the two lit display niches, the counter edge", 50, False, True, "ARCHIVE", "nolamps"),
 "BOX": ("IMG1_ENV_BOX_PHONE_HC_V3.png", "the window with the night stadium and pitch, the counter rail", 58, True, True, "BOX", "box"),
 "COACHES": ("IMG1_ENV_COACHES_PHONE_HC_V3.png", "the shelf at the top left with the two old leather balls on it (keep both balls and the shelf), the small wall lamp on the wall pillar left of the men, the row along the wall exactly as in image 1, from left to right: a narrow window at the far left, the wall pillar with the lamp, the wide window behind the men, a plain door on the right, and a narrow window at the far right, each with its own frame and wall pillars between them; do not merge them into one window and do not move the door. The training pitch with its small goals and lights stays inside the windows. The counter rail", 39, True, True, "COACHES", ""),
 "TUNNEL": ("IMG1_ENV_TUNNEL_PHONE_HC_V3.png", "the tunnel receding to the pitch, the square pillars and handrails, the counter edge", 50, True, True, "TUNNEL", "tunnel"),
 "CLUB": ("IMG1_ENV_CLUB_PHONE_HC_V4.png", "the two wall lamps with their pleated shades and the hanging pennant banners below them, the wide window across the top with the floodlit stadium, the panelled wall below it, and the trophies and old leather balls along the bottom", None, True, False, "CLUB_MAT", "club"),
 "LOADING": ("IMG1_ENV_LOADING_PHONE_HC.png", None, None, True, False, "LOADING_MAT", "loading"),
}
SEATS = ()
NAMES = dict(HOME="Home lounge", BOARD="Board Room", OFFICE="Office", HALL="Hall", ARCHIVE="Archive", BOX="Directors' box",
             COACHES="Coaches' room", TUNNEL="Players' tunnel", CLUB="Club room", LOADING="Loading tunnel")


def prompt(key, rm):
    L, Y = M[key], X[key]
    img1, keep, edge, win, men, sw, extra = R[rm]
    mat = sw.endswith("_MAT")
    if mat:
        head = (f"Image 1 is the picture to edit. Image 2 is only a small sample of the finished materials and light of this clubhouse ({Y['sample']}); "
                "match its materials, colours and light, and copy nothing else from it: not its camera angle, not its layout, not its objects, not its framing. "
                f"The picture keeps the {'head-on tunnel view' if rm == 'LOADING' else 'layout'} of image 1.")
    else:
        head = ("Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; "
                "match its materials, colours and light exactly, and copy nothing else from it.")
    frame = ("Keep image 1 exactly the same in camera, framing and layout: do not zoom in, zoom out, crop or move the camera, and keep the same tall 9:16 shape. "
             "The output is exactly the same size and shape as image 1 (1179 by 2096 pixels), never narrower, wider or taller, and nothing in it moves or changes size.")
    if edge:
        frame += f" The counter edge stays exactly where it is, {edge}% of the way down the picture, with no extra panel rows above or below it."
    if extra == "box":
        frame += (" Positions stay where they are in image 1: a plain dark wall band fills the top 18% of the picture above the window; the window runs from 18% to about 52% of the height "
                  "and from 9% to 91% of the width; the stone below the rail fills the whole lower 42%; the two men's heads sit at about 30% of the height, at the same size. "
                  "The window must not grow upward to the top of the picture. This is the directors' box from image 1, not any other room: the big dark window with the night stadium "
                  "fills the wall behind the two men, with its one thin upright bar down the middle and the small floodlights above the stands. Add no arches, vaults, corridors, niches or shelves. "
                  "The stadium, crowd and seats inside the window stay exactly as they are, not redrawn.")
    if extra == "club":
        frame += " The wide window runs across the top down to 42% of the height, and the panelled wall fills the rest down to the trophies and balls along the bottom edge."
    frame += " Change only the materials and finish of the room itself."
    menl = "Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.\n\n" if men else ""
    if rm == "LOADING":
        keepl = ("The camera looks straight down the middle of the long tunnel, exactly as in image 1: the vanishing point stays in the centre, the open end of the tunnel "
                 "with the lit green pitch and the white goal stays in the middle at the same small size (about 33% to 57% of the height). Keep in the same places and at the same sizes: "
                 "the ceiling beams, the square pillars on both sides, the low handrails on both sides, the ribbed floor mat down the middle, the three steps up to the pitch. "
                 "Image 1 has no wall lamps, so add none: no bulkhead, cage or sconce lamps anywhere. The tunnel is empty of people.")
    else:
        keepl = f"Keep in the same places and at the same sizes: {keep}" + (", with the counter edge at exactly the same height" if edge and "counter" in keep and rm != "COACHES" else "")
        keepl += " stays at exactly the same height." if rm == "COACHES" else "."
        if edge:
            keepl += f" Everything below the counter edge is one plain, calm slab of the same polished Rosso Levanto marble as the counter."
        if edge and rm not in ("COACHES", "OFFICE"):  # the Office desk top is meant to show
            # R-13 try 1 (25 Nov): Astra added a deep reflective counter top with the men mirrored in it, and changed the picture's shape.
            keepl += " The counter edge is a thin rail seen straight on, exactly as in image 1: no counter top surface shows above or below it, nothing is mirrored in it, and the front of the counter starts right under the rail."
        if win:
            # R-12 try 1 (25 Nov): Astra filled the top half of two window panes with leather.
            keepl += " Every window pane stays clear glass from its bottom frame all the way up to its top frame, showing the night outside exactly as in image 1, with no leather or panel inside any window frame."
        if rm in FLOOR:
            # R-12 fix 2 (25 Nov): an edit let the counter slab swallow the floor strip at the bottom.
            keepl += " Below the counter slab, the thin strip of floor along the very bottom edge stays exactly where it is in image 1, in dark polished red stone."
        if not men:
            keepl += " The room is empty of people."
    room = (f"The room: {L['feel']}\n"
            f"Walls and panels: {L['wall']}. Pillars: {Y['stone']}. Frames: {L['frame']}."
            + ("" if rm in ("ARCHIVE", "LOADING") else f" Lamp metal: {L['metal']}; shades stay warm cream and lit.")
            + ("" if rm in ("CLUB", "LOADING") else f" Counter: {Y['counter']}."))
    if rm in ("TUNNEL", "LOADING"):
        room += f" Handrails: {L['handrail']}. Floor: {L['mat']}. The pillars keep their exact square shape, with flat faces and straight corners, never round columns."
    if rm == "HALL":
        room += " The pillars keep their exact shape and stay smooth and polished, with the veins running calmly down them."
    if rm in SEATS:  # Nik's seating rule; none of the 10 Wooden phone bands shows an armchair or sofa
        room += f" Any armchair or sofa keeps its exact shape, size, cushions and place and is reupholstered in {L['seat']}."
    room += f"\n\nEvery wall, door, frame, shelf, panel and pillar takes one of these materials ({L['materials']}); no light wood is left anywhere in the room."
    if extra == "nolamps":
        src = ("No wall lamps are visible in this room: light comes only from the lights inside the two display niches and a soft glow along the vault. Add no lamps, sconces or wall lights anywhere. "
               "Each niche throws a soft warm pool onto the leather and stone around it, with a soft warm reflection on the polished front of the counter")
    elif rm == "LOADING":
        src = ("Light comes only from the same soft overhead glow as image 1 and the floodlit pitch at the end of the tunnel. The pitch light throws a soft warm glow onto the marble, "
               "the leather and the floor near the tunnel end; where it meets the steps and the gold edge strips it fades smoothly, with no hot bright line and no white highlight")
    else:
        src = (f"Light comes only from the same warm lamps in the same places{' and the floodlit stadium glow through the window' if win else ''}. "
               "Each lamp throws a soft warm pool onto the leather and marble around it, with soft warm reflections on the polished front of the counter")
        if extra == "tunnel":
            src += "; where the pitch light meets the top step it is a gentle warm glow that fades smoothly, with no hot bright line and no white highlight"
    light = (f"Light: It is night. {Y['light_rule']} {src}, and the red falls off to wine near-black in the corners and toward the ceiling, so the room has depth and never looks flat."
             f"{L['men'] if men else ''} {L['sheen']}" + (" The two men stay lit exactly as they are now." if men else ""))
    lock = L["lock"].replace(*Y["veins"])
    if rm == "LOADING":
        lock = lock.replace("Lamp light warms only a small soft pool right around each lamp, and everywhere else stays deep red.",
                            "The pitch light only brightens the surfaces near the tunnel end, it never tints them brown or orange, and everywhere else stays deep red.")
    if rm == "LOADING":
        objs = "The far end stays a real night pitch: green grass, white goal, floodlit stands, exactly as they are."
    elif rm == "CLUB":
        objs = "The trophies, the old leather balls and the dark banners keep their identity and their own colours and are relit by the new room. The stadium in the window stays exactly as it is."
    else:
        objs = "Objects keep their identity and their own colours and are relit by the new room."
    people = "no people other than the two men" if men else "no people"
    fin = (f"Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, "
           f"no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, {people}.")
    return "\n\n".join([head, frame, menl.strip(), keepl, room, light, lock, objs, fin,
                        "Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available."]).replace("\n\n\n\n", "\n\n")


def main():
    key = sys.argv[1].upper(); L = M[key]
    first = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    out = [f"## Batch 2: the 10 phone bands ({key.title()} {first}-{first + 9})",
           "Image 2 for each ticket: that room's own people-free swatch, cut from its accepted desktop painting (swatch.py). Club and Loading take a small materials-only strip instead (Team V lessons HO-140 and HO-160). Start each in a NEW chat.",
           "Seating rule (Nik, 25 Nov 2026 07:36 UTC): armchairs and sofas take the clubhouse's own material and colour. None of the 10 Wooden phone bands shows one, so no phone ticket names them (naming them invites Astra to add one).", ""]
    for n, rm in enumerate(R):
        img1, *_rest = R[rm]; sw = R[rm][5]
        code = f"{key[0]}-{first + n}"
        out += [f"### {code} · {L['name']}: {NAMES[rm]}, phone",
                f"- Image 1: [{img1}]({BLOB}{img1}) ([raw]({RAW}{img1})), 1179x2096",
                f"- Image 2{' (materials-only strip)' if sw.endswith('_MAT') else ''}: [IMG2_REF_{sw}_{key}_SWATCH.png]({BLOB}IMG2_REF_{sw}_{key}_SWATCH.png) ([raw]({RAW}IMG2_REF_{sw}_{key}_SWATCH.png))",
                f"- Saves as `ENV_{rm}_PHONE_{key}_P1`", "", "```", prompt(key, rm), "```", "", "Tries:", ""]
    print("\n".join(out))


if __name__ == "__main__":
    main()
