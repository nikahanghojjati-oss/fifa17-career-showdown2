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

BR = "claude-duet/p3-intake"
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
  lock="Colour lock: every wall, panel, pillar, frame, the ceiling, the floor stone and the counter is deep ruby red, exactly the reds of image 2: oxblood (#6E1423) on the walls, Rosso Levanto red (#9B2335) where the stone is lit, wine near-black (#2A0A10) in the shadows, corners and ceiling, and rosewood so dark it reads red-black (#3A1416). The warm brown wood of image 1 must be gone completely from the room's walls, panels, pillars, frames and floor: no tan, honey, orange-brown, khaki or brown there, even near the lamps. Lamp light warms only a small soft pool right around each lamp, and everywhere else stays deep red. Gold is only the lamp metal, the rails, the handles and the hairline trims: no gold panels and no gold walls. The marble veins are a few long, smooth, softly curving pale lines that flow gently across the stone like brush strokes, never jagged, broken or cracked like ice.",
  slab="polished Rosso Levanto marble: a deep wine-red stone, oxblood (#6E1423) to lit red (#9B2335) with wine near-black (#2A0A10) in its deepest tones, with a few long, calm, softly curving pale cream veins (#D8C8B4) flowing in gentle diagonals like brush strokes",
  slab_lock="The stone stays a rich deep ruby red, exactly the red of the marble in image 2: the light only brightens it, it never tints it pink, cherry, orange or brown, and the veins stay few, long and calm, never jagged or cracked like ice."),
}

STADIUM = " and the floodlit stadium glow through the window"
PL = "visual-assets/v10_1/plates-hc/"
# Keep lists and room sentences: B7's mk_full.py D, unchanged except the Team V lessons marked (V) and the seating rule (S).
D = [
 ("OFFICE", dict(name="Office", img1="IMG1_ENV_OFFICE_PLATE_HC_V3_2X.png", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the wide desk filling the lower half with its front edge at exactly the same height, the two leather desk blotters, the old leather ball, the coffee cup and saucer and the bundle of papers tied with string on the left, the table lamp with its pleated shade on the right, the olive tree in its pot behind, the wall panel at the far left, and the tall dark window behind with the night stadium and its floodlight.",
  room="The wall panel becomes {wall}. The window frames become {frame}. The lamp base and stem become {metal}; the shade stays warm cream and lit. The desk top becomes {counter}. The plant pot becomes {stone}.",
  lightx=" The table lamp casts a soft warm pool of light on the polished marble desk top around its base, with a dim soft reflection of the lit shade in the stone, fading back to deep wine red within a short distance (Ruby R-3 try 1: the desk stayed dark).",
  objs="All other objects keep their identity and their own colours (the old leather ball, the white cup, the paper bundle and string, the leather blotters, the olive tree) and are relit by the new room, each with a real soft contact shadow on the desk.")),
 ("HALL", dict(name="Hall", img1="IMG1_ENV_HALL_PLATE_HC_V3_2X.png", men=True, win=False,
  keep="Keep in the same places and at the same sizes: the staircase on the left with its railing and the leather bag on the steps, the stone pillars, the tall double door in the middle with its arched fanlight, the small side table beside the door with its table lamp and book, the patterned runner rug, the wall lamp with its pleated shade at the top right, and the counter strip along the bottom at exactly the same height.",
  room="The pillars keep their exact round shape and become smooth {stone}, polished and even all the way round, with the veins running calmly down them (V). The walls become {stone}, with wall panels in {wall}. The double door becomes {door}, and the fanlight frame becomes {frame}. The stair railing becomes {handrail}. The side table becomes {shelf}. The floor becomes {floor}. The lamp arms and bases become {metal}; the shades stay warm cream and lit. The counter strip becomes {counter}.",
  objs="All other objects keep their identity and their own colours (the leather bag, the book, the runner rug with its pattern) and are relit by the new room, each with a real soft contact shadow.")),
 ("ARCHIVE", dict(name="Archive", img1="IMG1_ENV_ARCHIVE_PLATE_HC_V3_2X.png", men=True, win=False, nolamps=True,
  keep="Keep in the same places and at the same sizes: the vaulted corridor of arches receding to the middle, the shelves along both sides, the two lit display niches on the left and right walls (an old ball in the left one, books in the right one), and the counter with its thin rail along the top edge, at exactly the same height, filling the lower part.",
  room="The arches and vault become {stone}, and the wall panels become {wall}. The shelves become {shelf}. The display niches become {case}, lit warm from inside. The corridor floor becomes {floor}. The rail along the counter becomes {rail}. The counter becomes {counter}.",
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
        src = ("No wall lamps are visible in this room: light comes only from the lights inside the two display niches and a soft "
               "glow along the vault. Add no lamps, sconces or wall lights anywhere; the far end of the corridor stays plain. "
               "Each niche casts a soft warm pool on the leather or stone around it, and the red falls off to wine near-black in "
               "the corners and toward the vault, so the room has depth and never looks flat.")
    else:
        src = f"Light comes only from the same warm lamps in the same places{STADIUM if R['win'] else ''}. {L['pools']}" + R.get("lightx", "").split(" (Ruby")[0] + ("." if R.get("lightx") else "")
    light = (f"Light: It is night. {L['light_rule']} {src}{L['men'] if R['men'] else ''} {L['sheen']}"
             + (" The two men stay lit exactly as they are now." if R["men"] else ""))
    people = "no people other than the two men" if R["men"] else "no people"
    return f"""{IMG2}

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

{men}{R['keep']}

The room: {L['feel']}
{strip_marks(R['room'].format(**L))}

Every wall, door, frame, shelf, panel and pillar takes one of these materials ({L['materials']}); no light wood is left anywhere in the room.

{light}

{L['lock']}

{R['objs']}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps{' or people' if R['men'] else ''}, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, {people}.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available."""


def slab(L):
    return f"""{IMG2}

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
    for n, (rm, nm, img1, size, asset, p) in enumerate(tickets):
        code = f"{key[0]}-{first + n}"
        out += [f"### {code} · {L['name']}: {nm}",
                f"- Image 1: [{img1}]({BLOB}{img1}) ([raw]({RAW}{img1})), {size}",
                f"- Image 2: [IMG2_REF_PILOT_{key}.png]({BLOB}IMG2_REF_PILOT_{key}.png) ([raw]({RAW}IMG2_REF_PILOT_{key}.png))",
                f"- Saves as `{asset}`", "", "```", p, "```", "", "Tries:", ""]
    print("\n".join(out))


if __name__ == "__main__":
    main()
