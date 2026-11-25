# B7 premium clubhouses: the other 57 painting tickets (HO-104..HO-160), held until Nik OKs the pilot (HO-098..HO-103).
# Usage: python3 mk_full.py OUTDIR [first_ho_number]. One ticket = one asset = one file. Edit the LOOK/ROOM text here, re-run.
import os, sys
OUT = sys.argv[1]; FIRST = int(sys.argv[2]) if len(sys.argv) > 2 else 104
RAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/"
REFRAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/"
PL = "visual-assets/v10_1/plates-hc/"

M = {  # material words per clubhouse, by role
 "SILVER": dict(
  wall="hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout",
  stone="pale grey marble with soft darker grey veins (light stone with dark veins, never dark stone with white cracks)",
  ceiling="deep graphite plaster", frame="polished nickel that mirrors the room",
  door="the same door in silver leaf with a polished nickel handle", metal="polished nickel",
  rail="polished nickel with one small sharp warm highlight",
  counter="honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamps and of the dark suits",
  floor="honed pale stone that holds soft reflections of the lamps, with true contact shadows",
  mat="a graphite ribbed rubber mat with polished nickel edge strips", handrail="polished nickel",
  case="satin nickel frames with pale marble shelves", shelf="pale marble with a polished nickel edge",
  slab="honed pale-to-middle grey marble with soft darker grey veins running in long gentle diagonals, neutral with a trace of warmth, never blue"),
 "BLACK": dict(
  wall="gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light",
  stone="black chrome that shows the lamps as tall soft warm reflections",
  ceiling="deep black", frame="black chrome with a thin polished gold inner line",
  door="blackened steel with a polished gold handle", metal="polished gold",
  rail="polished gold with one crisp warm highlight",
  counter="mirror-polished black granite with dim true reflections of the lamps and of the two men",
  floor="mirror-polished black granite with dim true reflections of the lamps",
  mat="a black ribbed rubber mat with blackened steel edge strips", handrail="black chrome with warm hairline highlights",
  case="blackened steel frames with polished gold edges and black glass shelves", shelf="blackened steel with a polished gold edge",
  slab="mirror-polished black granite, near true black, with a few very fine warm gold flecks and one faint soft warm reflection band; never grey, never blue"),
 "MATTE": dict(  # graphite (Nik 2026-11-25 01:11 UTC "Yes, graphite like my car"; MATTE_COLOUR_STUDY d9b5a67). Espresso wording: git history / regen/mk_full.espresso.py
  wall="upholstered graphite wool felt in a neutral graphite with no brown, with visible stitched seams, framed in thin satin graphite lacquer mouldings that keep the same panel layout",
  stone="honed charcoal slate", ceiling="soft near-black plaster", frame="satin graphite lacquer with a thin brushed titanium edge",
  door="satin graphite lacquer with a brushed satin titanium handle", metal="brushed satin titanium",
  rail="brushed satin titanium with a soft dull sheen",
  counter="one solid slab of honed graphite slate with a dry stone surface and a few faint pale mineral lines, fully matte, with no reflection",
  floor="neutral charcoal wool carpet with soft contact shadows", mat="a graphite ribbed rubber mat, fully matte",
  handrail="satin graphite lacquer with brushed satin titanium brackets", case="satin graphite lacquer frames with matte black linen backs",
  shelf="satin graphite lacquer with a thin brushed titanium edge",
  slab="honed graphite slate with a dry stone surface and a few faint pale mineral lines, a neutral graphite with no brown, fully matte, no shine and no reflection"),
}
LOOK = {
 "SILVER": dict(name="Silver Clubhouse", key="silver", feel="A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.",
  light="It is night. Light comes only from the same warm lamps in the same places{glow}. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners.{men} The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks.",
  men=" Behind each man the wall sits at a calm middle grey so the black suits read crisply against it.",
  art="Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1)."),
 "BLACK": dict(name="Metallic Black Clubhouse", key="black", feel="A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.",
  light="It is night. Light comes only from the same warm lamps in the same places{glow}. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface.{men} Reflections of the lamps in the floor and counter are dim, about a third as bright as the real lamps.",
  men=" Behind each man a broad soft warm reflection lies on the steel, clean and crisp-edged like a lamp seen in a black car door, with no glowing haze, so the black suits stand out from the wall.",
  art="Metallic Black = small, sharp, warm GOLD highlights; every large surface near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2)."),
 "MATTE": dict(name="Premium Matte Black Clubhouse", key="matte", feel="A private members' room in neutral graphite velvet: low-gloss upholstered felt, honed slate and satin titanium, handcrafted.",
  light="It is night. Light comes only from the same warm lamps in the same places{glow}. The lamps cast warm pools of light, but every material itself stays a neutral graphite grey-black: never brown, never espresso, never a warm cast on the walls. The finish is velvet low gloss, like fine matte lacquer: where a surface turns toward a lamp it carries a broad, soft, pale-grey sheen that rolls across it in long gradients; nothing is mirror-like, and there is no sharp highlight and no glint anywhere. The tones are layered dark on dark: near-black in the recesses and corners, deep charcoal on the main surfaces, lighter graphite on the lit walls.{men} Up close you see the weave of the felt, the stitched seams and the dry grain of the slate, all sharp.",
  men=" The lit walls are clearly lighter than the black suits, so both men read crisply against them.",
  art="Premium Matte Black = neutral graphite velvet (Nik picked graphite 2026-11-25 01:11 UTC from his matte-black reference, leads/relay attachments/ho-premium-full/MATTE_COLOUR_STUDY.md): layered black, charcoal and graphite, a broad soft sheen, satin titanium accents; no brown, no brass, no glint; unmistakably different from Metallic Black. The HO-173 premium bar applies."),
}
STADIUM = " and the floodlit stadium glow through the window"
# Rooms: src, size, men?, window?, keep, room (material sentence with {role} slots), objs, rail (overlay check)
D = {
 "OFFICE": dict(name="Office", src=PL+"ENV_OFFICE_PLATE_HC_V3_2X.webp", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the wide desk filling the lower half with its front edge at exactly the same height, the two leather desk blotters, the old leather ball, the coffee cup and saucer and the bundle of papers tied with string on the left, the table lamp with its pleated shade on the right, the olive tree in its pot behind, the wall panel at the far left, and the tall dark window behind with the night stadium and its floodlight.",
  room="The wall panel becomes {wall}. The window frames become {frame}. The lamp base and stem become {metal}; the shade stays warm cream and lit. The desk top becomes {counter}. The plant pot becomes {stone}.",
  objs="Objects keep their identity and their own colours (the old leather ball, the white cup, the paper bundle and string, the leather blotters, the olive tree) and are relit by the new room, each with a real soft contact shadow on the desk.",
  rail="the front edge of the desk"),
 "HALL": dict(name="Hall", src=PL+"ENV_HALL_PLATE_HC_V3_2X.webp", men=True, win=False,
  keep="Keep in the same places and at the same sizes: the staircase on the left with its railing and the leather bag on the steps, the stone pillars, the tall double door in the middle with its arched fanlight, the small side table beside the door with its table lamp and book, the patterned runner rug, the wall lamp with its pleated shade at the top right, and the counter strip along the bottom at exactly the same height.",
  room="The walls and pillars become {stone}, with wall panels in {wall}. The double door becomes {door}, and the fanlight frame becomes {frame}. The stair railing becomes {handrail}. The side table becomes {shelf}. The floor becomes {floor}. The lamp arms and bases become {metal}; the shades stay warm cream and lit. The counter strip becomes {counter}.",
  objs="Objects keep their identity and their own colours (the leather bag, the book, the runner rug with its pattern) and are relit by the new room, each with a real soft contact shadow.",
  rail="the counter strip along the bottom"),
 "ARCHIVE": dict(name="Archive", src=PL+"ENV_ARCHIVE_PLATE_HC_V3_2X.webp", men=True, win=False,
  keep="Keep in the same places and at the same sizes: the vaulted corridor of arches receding to the middle, the shelves along both sides, the two lit display niches on the left and right walls (an old ball in the left one, books in the right one), and the counter with its thin rail along the top edge, at exactly the same height, filling the lower part.",
  room="The arches and vault become {stone}, and the wall panels become {wall}. The shelves become {shelf}. The display niches become {case}, lit warm from inside. The corridor floor becomes {floor}. The rail along the counter becomes {rail}. The counter becomes {counter}.",
  objs="The old ball and the books in the niches keep their identity and their own colours and are relit by the niche light.",
  rail="the thin rail along the top of the counter"),
 "BOX": dict(name="Directors' box", src=PL+"ENV_BOX_PLATE_HC_V3_2X.webp", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the big three-pane window across the middle with the night stadium, the crowd, the small ceiling spots and the green pitch exactly as they are, the coat hooks on the left with the grey coat and the yellow and black striped scarf, the glass wall cabinet on the right with the decanter and glasses, and the thin rail along the top of the counter at exactly the same height.",
  room="The wall panels become {wall}. The window frames become {frame}. The wall cabinet becomes {case}. The coat hooks become {metal}. The rail becomes {rail}. The counter becomes {counter}.",
  objs="Objects keep their identity and their own colours (the grey coat, the yellow and black striped scarf, the amber decanter and the glasses) and are relit by the new room.",
  rail="the thin rail along the top of the counter"),
 "COACHES": dict(name="Coaches' room", src=PL+"ENV_COACHES_PLATE_HC_V3_2X.webp", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the long dark window across the middle with the floodlit pitch and the two goals, the shelf at the top left with three old leather balls, the display niche at the top right with the old boots, the small wall lamp on the left, the bundle of papers on the window sill, the door at the right, and the thin rail along the top of the counter at exactly the same height.",
  room="The wall panels become {wall}. The window frames become {frame}. The top shelf becomes {shelf}. The boot niche becomes {case}. The door becomes {door}. The lamp arm becomes {metal}; the shade stays warm cream and lit. The rail becomes {rail}. The counter becomes {counter}.",
  objs="Objects keep their identity and their own colours (the old leather balls, the old boots, the paper bundle) and are relit by the new room.",
  rail="the thin rail along the top of the counter"),
 "TUNNEL": dict(name="Players' tunnel", src=PL+"ENV_TUNNEL_PLATE_HC_V3_2X.webp", men=True, win=True,
  keep="Keep in the same places and at the same sizes: the tunnel receding to the steps and the floodlit pitch with the goal at the far end, the ribbed pillars and wall panels on both sides, the handrails, the caged bulkhead lamp on the right wall, the ribbed floor mat, and the counter strip along the bottom at exactly the same height.",
  room="The wall panels become {wall}, and the pillars become {stone}. The handrails become {handrail}. The bulkhead lamp cage becomes {metal}; its glass stays warm and lit. The floor becomes {mat}. The counter strip becomes {counter}.",
  objs="The far end stays a real night pitch: green grass, white goal, floodlit stands, exactly as they are.",
  rail="the counter strip along the bottom"),
 "CLUB": dict(name="Club room", src=PL+"ENV_CLUB_PLATE_HC_V3_2X.webp", men=False, win=True,
  keep="Keep in the same places and at the same sizes: the two wall lamps with pleated shades at the left and right, the two hanging pennant banners below them, the trophies and old leather balls on the low shelves at the lower left and right, the wide window across the top with the floodlit stadium, the two leather armchairs and the low table in the middle of the room, and the counter strip along the bottom at exactly the same height. The room is empty of people.",
  room="The wall panels and pillars become {wall}. The back wall below the window becomes {wall}. The window frames become {frame}. The low shelves become {shelf}. The banner rods and lamp arms become {metal}; the shades stay warm cream and lit. The floor becomes {floor}. The counter strip becomes {counter}.",
  objs="Objects keep their identity and their own colours (the gold trophies, the old leather balls, the leather armchairs, the dark banners) and are relit by the new room, each with a real soft contact shadow.",
  rail="the counter strip along the bottom"),
 "LOADING": dict(name="Loading tunnel (behind Reus)", src="assets/loading/ENV_LOADING_PLATE_HC_2X.webp", men=False, win=True, size="3840x2160",
  keep="Keep in the same places and at the same sizes: the tunnel receding to the steps and the floodlit pitch with the goal at the far end, the ribbed pillars and wall panels on both sides, the handrails, the caged bulkhead lamp on the right wall, the ribbed floor mat, and the counter strip along the bottom at exactly the same height. The tunnel is empty of people.",
  room="The wall panels become {wall}, and the pillars become {stone}. The handrails become {handrail}. The bulkhead lamp cage becomes {metal}; its glass stays warm and lit. The floor becomes {mat}. The counter strip becomes {counter}.",
  objs="The far end stays a real night pitch: green grass, white goal, floodlit stands, exactly as they are.",
  rail="the counter strip along the bottom"),
}
PHONE = {  # phone room bands: the Wooden phone plate is image 1
 "ARCHIVE": ("ENV_ARCHIVE_PHONE_HC_V3.webp", "the vaulted corridor of arches, the two lit display niches, the counter edge", "Archive"),
 "BOARD": ("ENV_BOARD_PHONE_HC_V3.webp", "the wall lamp on the left, the wall panels and door, the counter edge", "Board Room"),
 "BOX": ("ENV_BOX_PHONE_HC_V3.webp", "the window with the night stadium and pitch, the counter rail", "Directors' box"),
 "COACHES": ("ENV_COACHES_PHONE_HC_V3.webp", "the shelf with the old balls, the small wall lamp, the window with the pitch, the counter rail", "Coaches' room"),
 "HALL": ("ENV_HALL_PHONE_HC_V3.webp", "the stone pillars, the double door with its fanlight, the side table and lamp, the wall lamp at the right, the counter edge", "Hall"),
 "HOME": ("ENV_HOME_PHONE_HC_V3.webp", "the window with the night stadium and pitch, the wall lamp on the pillar, the counter edge", "Home lounge"),
 "OFFICE": ("ENV_OFFICE_PHONE_HC_V3.webp", "the dark window with the floodlight, the lamp at the right edge, the desk with the two blotters", "Office"),
 "TUNNEL": ("ENV_TUNNEL_PHONE_HC_V3.webp", "the tunnel receding to the pitch, the pillars and handrails, the counter edge", "Players' tunnel"),
 "CLUB": ("ENV_CLUB_PHONE_HC_V4.webp", "the two wall lamps, the window with the stadium, the panelled wall, the trophies and balls along the bottom", "Club room"),
 "LOADING": ("../../../assets/loading/ENV_LOADING_PHONE_HC.webp", "the tunnel receding to the pitch, the pillars and handrails, the bulkhead lamps", "Loading tunnel"),
}
SLAB = dict(src=PL+"ENV_SLAB_HC_V1_2X.webp")

def fill(s, lk): return s.format(**M[lk])
def light(lk, win, men):
    L = LOOK[lk]; return L["light"].format(glow=STADIUM if win else "", men=L["men"] if men else "")

def desktop(lk, rm):
    R, L = D[rm], LOOK[lk]
    men = "Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.\n\n" if R["men"] else ""
    lit = " The two men stay lit exactly as they are now." if R["men"] else ""
    nopeople = "no people other than the two men" if R["men"] else "no people"
    p = f"""Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

{men}{R['keep']}

The room: {L['feel']}
{fill(R['room'], lk)}

Light: {light(lk, R['win'], R['men'])}{lit}

{R['objs']}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps{' or people' if R['men'] else ''}, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, {nopeople}.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available."""
    return dict(asset=f"ENV_{rm}_PLATE_{lk}_P1_2X", room=R["name"], src=R["src"], size=R.get("size", "3072x1728"), prompt=p, check="overlay test: " + R["rail"] + " sits exactly where it was", attach2=f"REF_PILOT_{lk}.webp", ready=True, men=R["men"])

def slab(lk):
    p = f"""Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same size and framing. Repaint the whole surface as one new stone, seen straight on.

The stone: {M[lk]['slab']}.

It is a flat, seamless material surface: the pattern continues off every edge so it can tile, with no border, no vignette, no frame and no darker corners. Light is a soft, even, warm wash from above, very slightly brighter at the top. No objects, no reflections of objects, no text, no logos.

Real stone as a mason would finish it, with clean sharp detail and no noise grain, no streaks, no repeating cells.

Same 16:9 framing as the original, largest size available."""
    return dict(asset=f"ENV_SLAB_{lk}_P1_2X", room="Material slab (ENV_SLAB, TILE_SLAB, UI panel tile, lower slab of every phone plate)", src=SLAB["src"], size="3072x1728", prompt=p, check="the stone runs off every edge with no border or darker corners; Team G checks a 2x2 tile for seams", attach2=f"REF_PILOT_{lk}.webp", ready=True, men=False)

def phone(lk, rm):
    f, parts, nm = PHONE[rm]; L = LOOK[lk]
    src = (PL + f) if not f.startswith("../") else "assets/loading/ENV_LOADING_PHONE_HC.webp"
    men = rm not in ("CLUB", "LOADING")
    menl = "Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.\n\n" if men else ""
    win = rm in ("BOX", "COACHES", "HOME", "OFFICE", "TUNNEL", "CLUB", "LOADING")
    p = f"""Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

{menl}Keep in the same places and at the same sizes: {parts}{', with the counter edge at exactly the same height' if 'counter' in parts else ''}. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter.

The room: {L['feel']}
Walls and panels: {M[lk]['wall']}. Frames: {M[lk]['frame']}. Lamp metal: {M[lk]['metal']}; shades stay warm cream and lit. Counter: {M[lk]['counter']}.

Light: {light(lk, win, men)}{' The two men stay lit exactly as they are now.' if men else ''}

Objects keep their identity and their own colours and are relit by the new room.

Finish: real materials, handcrafted, clean sharp detail; clear air, no fog, no glow halo, no noise grain, no streaks, no swirl or crackle patterns. No new objects and no extra lamps anywhere, no text, no logos, {'no people other than the two men' if men else 'no people'}.

Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available."""
    return dict(asset=f"ENV_{rm}_PHONE_{lk}_P1", room=f"{nm}, phone band", src=src, size="1179x2096", prompt=p, check="overlay test: the counter edge and the room band sit exactly where they were", attach2=f"REF_{rm}_{lk}_SWATCH.webp", ready=rm in ("HOME", "BOARD"), men=men)

ORDER = []
for lk in ("SILVER", "BLACK", "MATTE"):
    ORDER += [("desk", lk, r) for r in ("OFFICE", "HALL", "ARCHIVE", "BOX", "COACHES", "TUNNEL", "CLUB", "LOADING")] + [("slab", lk, None)]
    ORDER += [("phone", lk, r) for r in ("HOME", "BOARD", "OFFICE", "HALL", "ARCHIVE", "BOX", "COACHES", "TUNNEL", "CLUB", "LOADING")]
assert len(ORDER) == 57
os.makedirs(OUT, exist_ok=True)
index = []
for n, (kind, lk, rm) in enumerate(ORDER):
    ho = f"HO-{FIRST + n:03d}"; L = LOOK[lk]
    t = desktop(lk, rm) if kind == "desk" else slab(lk) if kind == "slab" else phone(lk, rm)
    img1 = f"  1. Image 1, the Wooden plate `{t['src']}` ({t['size']}), raw: {RAW}{t['src']} (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old {L['name']} recolour."
    if t["ready"]:
        img2 = f"  2. Image 2, `{t['attach2']}`: a people-free reference Team G cut from the approved paintings of this clubhouse, raw: {REFRAW}{t['attach2']}"
    else:
        img2 = f"  2. Image 2, `{t['attach2']}`: a people-free swatch Team G cuts from the finished desktop painting of this room in this clubhouse and posts at {REFRAW}{t['attach2']}. **Do not start this ticket until it is there**; Team G posts it within the hour after the desktop ticket is DONE."
    att = "- **Attach exactly these two files, in this order:**\n" + img1 + "\n" + img2
    md = f"""# {ho} · {L['name']}, {t['room']}

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket {n + 1} of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: {L['art']} Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** {L['name']} (Settings key `{L['key']}`). **Room:** {t['room']}.
{att}
- **Save the result as:** `{t['asset']}` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate ({t['check']}){'; both men still in place at the same size' if t['men'] else ''}; night, warm lamps in the same places; the look matches the approved pilot of this clubhouse; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
{t['prompt']}
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/{L['key']}/` on your branch: the raw Astra output (PNG, untouched) **and** `{t['asset']}.webp` aligned to the Wooden plate at {t['size']}, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
"""
    fn = f"{ho}_{L['key']}_{(rm or 'slab').lower()}{'_phone' if kind == 'phone' else ''}.md"
    open(os.path.join(OUT, fn), "w").write(md)
    index.append(f"| {ho} | {L['name']} | {t['room']} | `{t['asset']}` |")
open(os.path.join(OUT, "INDEX.md"), "w").write("# Premium clubhouse full set: 57 tickets (held until Nik OKs the pilot)\n\n| Ticket | Clubhouse | Room | Asset |\n|---|---|---|---|\n" + "\n".join(index) + "\n")
print("wrote", len(index))
