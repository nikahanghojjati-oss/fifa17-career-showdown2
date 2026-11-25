# B7: sign-in / error-screen lounge repainted by hand per clubhouse (Nik 2026-11-25 05:57 UTC: "matches the colouring of each
# team ... looks very AI generated in the ceiling and also in the marble and also on the wall ... should look handcrafted").
# 8 Astra assets: Wooden, Platinum, Metallic Black, Premium Matte Black x (desktop 16:9, phone 9:16). No men in the picture.
# Usage: python3 mk_signin.py OUTDIR  -> one brief .md per ticket + index.json (title per brief)
import os, sys, json
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
RAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/"
REFRAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/"
LOOKS = {
 "WOODEN": dict(name="Wooden Clubhouse (the default look, no Settings key)", folder="wooden", ref="REF_PILOT_WOODEN.webp",
   feel="A private members' lounge in the Wooden clubhouse at night: real dark walnut, real black marble and real aged brass, handcrafted.",
   walls="The wall panels, the pillar faces and the shelving become dark walnut with a fine straight grain and a hand-rubbed satin finish, in the same panel layout, with thin aged-brass inlay lines where the gold light strips are now",
   stone="black marble with fine, soft, natural grey-gold veins",
   metal="aged brass with a soft satin glow",
   floor="large polished black marble tiles with fine natural grey-gold veins, laid in straight even rows, holding soft true reflections of the lamps",
   ceiling="a dark walnut coffered ceiling with straight even beams",
   sofa="deep brown leather",
   light="It is night. Light comes from the warm lamps, the warm shelf lights and the city through the windows. The walnut glows warm and deep near the lamps and falls to dark brown-black in the corners; brass catches soft warm highlights; the marble floor holds calm, true reflections.",
   extra=""),
 "SILVER": dict(name="Platinum Clubhouse (Settings key `silver`)", folder="silver", ref="REF_PILOT_SILVER.webp",
   feel="A platinum members' lounge at night: real metal leaf, real polished nickel, real pale stone, handcrafted.",
   walls="The wall panels, the pillar faces and the shelving become hand-laid silver leaf with a fine straight brushed grain, set in polished nickel mouldings, in the same panel layout; the gold light strips become thin polished nickel strips lit warm",
   stone="pale grey marble with soft darker grey veins (light stone with dark veins, never dark stone with white cracks)",
   metal="polished nickel that mirrors the room",
   floor="large polished pale grey marble tiles with soft darker grey veins, laid in straight even rows, holding clear true reflections of the lamps",
   ceiling="a deep graphite plaster ceiling with clean straight recessed coves",
   sofa="deep charcoal leather",
   light="It is night. Light comes from the warm lamps, the warm shelf lights and the city through the windows: bright and mirror-like near the lamps, pewter and graphite in the corners, never blue.",
   extra=""),
 "BLACK": dict(name="Metallic Black Clubhouse (Settings key `black`)", folder="black", ref="REF_PILOT_BLACK.webp",
   feel="A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.",
   walls="The wall panels, the pillar faces and the shelving become gun-blued blackened steel with fine shadow gaps and machined chamfered edges, in the same panel layout; the gold light strips stay as thin polished gold lines",
   stone="black granite, near true black, with a few very fine warm gold flecks",
   metal="polished gold",
   floor="large mirror-polished black granite tiles laid in straight even rows, near true black, with dim true reflections of the lamps",
   ceiling="a deep black ceiling with clean straight recessed coves",
   sofa="black leather",
   light="It is night. Light comes from the warm lamps, the warm shelf lights and the city through the windows. Every large surface stays near true black; only small, sharp, warm gold highlights and true reflections show where the light falls.",
   extra=""),
 "MATTE": dict(name="Premium Matte Black Clubhouse (Settings key `matte`)", folder="matte", ref="REF_PILOT_MATTE.webp",
   feel="A private members' lounge in neutral graphite velvet: low-gloss fine herringbone wool flannel, honed slate and satin titanium, handcrafted.",
   walls="The wall panels and the pillar faces become upholstered fine herringbone wool flannel in a neutral graphite with no brown, with visible stitched seams, framed in thin satin graphite lacquer mouldings, in the same panel layout; the shelving becomes satin graphite lacquer; the gold light strips become thin brushed satin titanium lines lit softly warm",
   stone="flat honed charcoal slate with a few faint straight pale mineral lines",
   metal="brushed satin titanium with a dull, even sheen",
   floor="large honed graphite slate tiles laid in straight even rows, with a soft low sheen that holds broad, gentle reflections of the lamps (never mirror-sharp)",
   ceiling="a soft near-black plaster ceiling with clean straight recessed coves",
   sofa="deep graphite leather with a soft low sheen",
   light="It is night. Light comes from the warm lamps, the warm shelf lights and the city through the windows. The lamps cast warm pools of light, but every material itself stays a neutral graphite grey-black: never brown, never espresso, never a warm cast over a whole wall. The finish is velvet low gloss: broad soft pale-grey sheens, no sharp highlight and no glint anywhere. Tones are layered dark on dark.",
   extra="\n\nColour lock: the walls, panels, flannel, slate and trims are a cool neutral charcoal grey, the grey of a dark grey wool suit, exactly the grey of image 2; all surfaces are neutral graphite and none of image 1's gold or brown survives on the room itself. The herringbone is a regular herringbone, fine, tight and low-contrast, seen only up close: neat, perfectly regular rows of tiny straight V shapes, never a bold zigzag, maze or squiggle. Every slate surface is flat honed slate, dry like a honed blackboard: no crinkle, crackle, ripple or crumpled-foil texture anywhere."),
}
KINDS = {
 "desk": dict(label="desktop", asset="ENV_SIGNIN_PLATE_{lk}_P1_2X", size="3072x1728", src="visual-assets/v10_1/plates-v2/ENV_SETTINGS_PLATE_V2_2X.webp",
   keep="the tall shelves on the left with the gold trophies, gold balls and books, the dark stone pillar beside them, the potted plant in its tall pot, the floor lamp, the tall windows with the night city skyline, the panel with the crown emblem between the windows, the second potted plant, the long tufted leather sofa with its cushions, the round coffee table with the small gold crown and the gold cup, the round side table in the front right with the books and the gold crown, the armchair in the front right, the soft dark rug and the tiled floor",
   frame="Same 16:9 framing as image 1, nothing cropped or extended at any edge, largest size available."),
 "phone": dict(label="phone upright", asset="ENV_SIGNIN_PHONE_{lk}_P1", size="1179x2096", src="visual-assets/v10_1/plates-v2/ENV_SETTINGS_PHONE_V2.webp",
   keep="the tall shelves on the left with the gold trophies and books, the dark stone pillar beside them, the potted plants, the tall windows with the night city skyline, the tufted leather sofa, the round coffee tables with their small objects, the soft dark rug and the tiled floor",
   frame="Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available."),
}
index = []; n = 0
for kind in ("desk", "phone"):
    for lk in ("WOODEN", "SILVER", "BLACK", "MATTE"):
        n += 1; K = KINDS[kind]; L = LOOKS[lk]; asset = K["asset"].format(lk=lk)
        p = f"""Image 1 is the picture to edit. Image 2 shows only the approved materials, colours and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing, layout and view. There are no people in this room; keep it empty of people. Keep in the same places and at the same sizes: {K['keep']}. The middle of the picture stays calm: a small sign-in card will sit there.

Repaint the room by hand as a real built room. {L['feel']}
{L['walls']}. The stone pillar and the stone table tops become {L['stone']}. All trims, light strips, table legs and lamp metal become {L['metal']}. The floor becomes {L['floor']}. The ceiling becomes {L['ceiling']}. The sofa and armchair become {L['sofa']}, with real tufting, real seams and soft natural creases.

Fix what looks machine-made in image 1: the ceiling is one clean, solid, straight surface with no melted, broken or repeating shapes; every wall and pillar is solid and continuous, with straight edges and no breaks, seams that do not line up, or flickering lines; every marble or stone vein is a natural, continuous mineral vein that flows across the stone, never lightning-bolt cracks, never veins that stop or jump at a tile edge; the shelves are straight and level; reflections are true mirror images of what is above them.

Light: {L['light']}{L['extra']}

Objects keep their identity and their own colours (the gold trophies and gold crowns, the books, the plants, the city lights) and are relit by the room, each with a real soft contact shadow.

Finish: real materials as a set builder and a stonemason would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no bloom around lights, no noise grain, no streaks and no swirl or crackle patterns. No new objects, no extra lamps, no text, no logos and no people.

{K['frame']}"""
        title = f"Sign-in lounge {n}/8: {L['name'].split(' (')[0]}, {K['label']}"
        md = f"""### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Nik 2026-11-25 05:57 UTC on the sign-in screen: he likes the view, the background, the furniture and the reflective marble, but it must match each clubhouse's colours, and the ceiling, the marble and the walls look AI-made (breaks); it must look handcrafted. This lounge is also the background of every error screen. Ticket {n} of 8 (4 clubhouses x desktop and phone). Same deadline as the full set: DONE before the 3.0 freeze. No men in this picture, so no likeness risk.

### What
- **Clubhouse:** {L['name']}. **Picture:** sign-in lounge, {K['label']}.
- **Attach exactly these two files, in this order:**
  1. Image 1, the current sign-in lounge `{K['src']}` ({K['size']}), raw: {RAW}{K['src']} (convert to PNG if ChatGPT refuses WebP). Never attach a previous try.
  2. Image 2, `{L['ref']}`: the people-free reference Team G cut from this clubhouse's approved Home and Board Room, raw: {REFRAW}{L['ref']}
- **Save the result as:** `{asset}` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same view and layout as image 1 (overlay test: windows, sofa and shelves sit where they were); clean straight ceiling; solid unbroken walls; natural continuous marble veins; the colours match image 2; no person, text, logo, fog, halo or new object.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
{p}
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/{L['folder']}/` on your branch: the raw Astra output (PNG, untouched) **and** `{asset}.webp` aligned to image 1 at {K['size']}, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G checks it (HO-173 bar; matte_check for Matte), derives the sizes the game uses and puts the sign-in lounge of the picked clubhouse behind the sign-in and error screens. It goes on the board for Nik next to the old lounge.
"""
        fn = os.path.join(OUT, f"signin_{n}_{lk}_{kind}.md"); open(fn, "w").write(md)
        index.append({"file": fn, "title": title})
json.dump(index, open(os.path.join(OUT, "index.json"), "w"), indent=1)
print(len(index), "briefs")
