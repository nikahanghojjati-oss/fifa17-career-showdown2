# HO-084 · Team G → Team V · Pilot: 5 image-made crests + 1 master shirt

```ticket
{
 "id": "HO-084",
 "from": "G",
 "to": "V",
 "title": "Pilot: 5 image-made crests + 1 master shirt",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn 5ebf12399 project-documents/hc-art/ho084/"],
 "log": [{"at": "2026-11-15T21:42:35Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-15T21:43:22Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: 6 Astra prompts posted (no club names in prompts), Nik runs, lead cuts/exports/SHA"}, {"at": "2026-11-15T22:02:58Z", "by": "V", "status": "DONE", "note": "Nik OK 15 Nov 5:02 p.m. Eastern. 5 embroidered crests CREST_IMG_{BARCELONA,WESTHAM,METZ,CHELSEA,TORINO}_V1_{1024,256,64}.png (5:6, 4% margin, alpha) + KIT_MASTER_SHIRT_V1_1536.png (1152x1536 neutral grey) + _SHADING_1536 layer; SHA256.json. Notes: Chelsea lion looks ahead (not regardant), modern balls; Torino bull lean. No letters."}],
 "from_session": "session_01GU43Q6ycny5YqAKEeZjFWZ",
 "sessions": {"G": "session_01GU43Q6ycny5YqAKEeZjFWZ", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"},
 "parts": ["HO-085", "HO-086", "HO-087", "HO-088", "HO-089", "HO-090", "HO-091", "HO-092", "HO-093"]
}
```

### Why (Nik, 2026-11-15 21:38-21:41 UTC)
Nik judged the hand-coded SVG crest batch 1 (gallery https://claude.ai/artifact/Go4qTS8YN8ERckqsEQJK24) as only about a 5-10% gain. He wants up to an 80% gain. Team G's view is that drawing crests in code has a ceiling, so Nik picked a **pilot of 5 image-made crests** on a card. He also asked whether image generation can lift the kits. G proposed **one master shirt** that the game tints and patterns per club, and that is added to this pilot as asset 6.

### Rules (all 6 assets)
- **One asset = one ticket = one new ChatGPT chat** (Nik's rule zero). Nik runs them, so give him six short copy boxes.
- Fresh drawings of **public heraldry** and the real **outline** only. Never trace, copy, or attach the club's real artwork.
- **Never:** club names, letters, initials, monograms, years, mottos, city names, maker or sponsor logos, or title stars.
- **Look:** a premium, hand-made **embroidered badge**: real thread texture, satin-stitch fills, a raised stitched rim in the edge colour, and one stitch line inside it. Calm natural light. No gloss, chrome, bevel, drop shadow or "AI" sheen. This is the CREST-V4 cloth-patch idea Nik approved on 7 Nov, now rendered as real stitching rather than flat colour.
- It must read as the same club at 28 px and look hand-crafted at 256 px.
- **Deliver:** transparent PNG, 1024 px tall, 5:6 canvas (the game slot is 120x144), crest centred with about 4% margin; plus 256 px and 64 px exports. Record the SHA-256.

### Assets 1-5: crests
Full per-club notes (outline, charges, colours, never-lists) are in project file `gameplay/r94/threads/R94_01_CREST_PILOT_PICKS.md`, copied below.
1. `CREST_IMG_BARCELONA_V1`: the pot outline, St George cross plus four red pales on gold, an EMPTY white waist band, blue and garnet stripes, a gold old football.
2. `CREST_IMG_WESTHAM_V1`: a heater shield, claret field, sky-blue inner border, two crossed gold riveting hammers. No castle.
3. `CREST_IMG_METZ_V1`: a heater shield, grenat field, a white winged Graoully dragon facing left, a gold Cross of Lorraine.
4. `CREST_IMG_CHELSEA_V1`: a ringed roundel, royal-blue disc, a gold lion rampant regardant with a staff, two red Tudor roses and two small footballs. The ring carries dots, never text.
5. `CREST_IMG_TORINO_V1`: a flat-top shield with a pointed base, granata field, a gold bull rampant facing left.

### Asset 6: master shirt
`KIT_MASTER_SHIRT_V1`: one realistic **plain white** football shirt, front view, flat-lay or invisible-mannequin, with a crew or V collar typical of 2016-17.
- Real fabric folds, seams, collar rib and sleeve cuffs, in soft even studio light.
- **No** crest, badge, maker logo, sponsor, number, name or pattern.
- Transparent background, 1536 px tall, shirt centred.
- The game will multiply club colours onto it and draw stripes or hoops in code, so the shading must stay neutral grey, never coloured. If it's easy, also export a separate shading-only (luminance) layer.

### Accept when
- Nik judges each asset beside the SVG batch 1 version and says it is clearly better.
- No letters or real artwork anywhere.
- Real alpha, the exact sizes above, SHA-256 recorded.
- Then Team G wires the images in (image crest with the SVG as fallback; shirt tint plus pattern) on the r94 branch.

### Copied picks file
# R94-01 · Image crest pilot: 5 picks + heraldry notes (for the Team V ticket)

Picked by the R94-01 thread 2026-11-15 21:45 UTC on the lead's brief (Barcelona, West Ham, one dragon, one lion, +1).
Fallback if the pilot is dropped: hand-drawn SVG batch 1 on `claude-gameplay/r94-crests-svg-batch1` (5f319ad).

## Rules for all 5 (house line, Nik 2026-10-27, unchanged)
- Our own fresh drawing of public heraldry and the real OUTLINE only. Never trace or copy the club's artwork.
- NEVER: club names, letters, initials, monograms, years, mottos, city names, maker or sponsor logos, stars meaning titles unless public heraldry.
- Look: flat cloth-patch, the CREST-V4 finish Nik approved on 7 Nov: an embroidered rim in the club's edge colour, one stitch line inside it, flat colour fields. No gloss, no bevel, no 3D, no drop shadow, no gradients, no "AI" sheen.
- Must read as the same club at 28 px (lists, boards) and look hand-made at 256 px (Club Assignment).
- Deliver: transparent PNG, 1024 px tall, canvas 5:6 (the game's crest slot is 120 x 144), crest centred with ~4% margin; plus 256 and 64 px exports.

## 1. Barcelona (lion-free control: outline + flags)
- Outline: the "pot" shape: two raised pointed top corners, the top edge dipping to a small centre point, sides narrowing to a waist at a horizontal band, then a full rounded lower bowl ending in a soft point.
- Upper left: red St George's cross on white. Upper right: the Catalan flag, four red pales on gold (both public).
- Band across the waist: plain white (the real one has letters: leave it EMPTY).
- Lower bowl: vertical blue and garnet stripes, an old leather football in gold-orange at the centre.
- Colours: garnet #A50044, blue #004D98, gold #EDBB00, red #DB0030, white. Rim: gold.

## 2. West Ham United (objects: the hammers)
- Outline: heater shield (2016 crest: no castle).
- Claret field with a sky-blue border inside the rim.
- Two crossed riveting hammers in gold, heads up and outward, handles crossing just below the middle; slim heads with one flat striking face, collared necks, slightly swelling handles.
- Colours: claret #7A263A, sky blue #1BB1E7, gold #F3D459. Rim: gold.
- Never: the castle, any lettering.

## 3. Metz (the dragon)
- Theme: the Graoully, the dragon of Metz legend (public folklore), with the Cross of Lorraine (public).
- Outline: heater shield.
- Maroon (grenat) field; a white or silver dragon, winged, coiled tail, facing the viewer's left; a small Cross of Lorraine (two bars) in gold beside or above it.
- Colours: grenat #7A1B2C, white, gold #D2A943. Rim: gold.
- Never: letters, the year 1932, any city name.

## 4. Chelsea (the lion)
- Outline: ringed roundel.
- Royal-blue disc; the ring band in blue with a gold edge, small white dots in place of the lettering.
- Centre: a heraldic lion rampant regardant (standing, looking back over its shoulder) holding a staff in its forepaws, in gold.
- At the base: two red Tudor roses (public) and two small footballs, set either side.
- Colours: royal blue #034694, gold #DBA111, red #EE242C, white. Rim: gold.
- Never: the club name or any text in the ring.

## 5. Torino (a second animal: the bull)
- Theme: the bull rampant of Turin's civic arms (public heraldry).
- Outline: shield with a flat top and pointed base.
- Granata field; a gold bull rampant facing the viewer's left: horns in a lyre, heavy neck, cloven hooves, tail with a tuft.
- Colours: granata #881F19, gold #D5B334. Rim: gold.
- Never: the word TORINO, the year, any letters.

## Why these 5
Two Nik named (Barcelona outline, West Ham hammers), one dragon (only Metz among the 98 has a real dragon theme), the most-used charge (the lion: Chelsea, Middlesbrough, Leverkusen, Lyon, Ingolstadt all lean on it), and the crest that came out weakest in the SVG batch (Torino's bull).
