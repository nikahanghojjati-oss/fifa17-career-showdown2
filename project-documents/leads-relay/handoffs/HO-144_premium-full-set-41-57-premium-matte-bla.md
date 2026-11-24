# HO-144 · Team G → Team V · Premium full set 41/57: Premium Matte Black Clubhouse, Archive repaint

```ticket
{
 "id": "HO-144",
 "from": "G",
 "to": "V",
 "title": "Premium full set 41/57: Premium Matte Black Clubhouse, Archive repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "WORKING",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T15:56:48Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T15:59:59Z", "by": "V", "status": "WORKING", "note": "Team V lead: on Nik's run sheet (claude/project-thread-ie3afv project-documents/hc-art/ho-premium-full/RUN_SHEET_*.md); gate 9/10."}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 41 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; unmistakably different from Metallic Black (Fable review section 2). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Premium Matte Black Clubhouse (Settings key `matte`). **Room:** Archive.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Premium Matte Black Clubhouse recolour.
  2. Image 2, `REF_PILOT_MATTE.webp`: a people-free reference Team G cut from the approved paintings of this clubhouse, raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_PILOT_MATTE.webp
- **Save the result as:** `ENV_ARCHIVE_PLATE_MATTE_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: the thin rail along the top of the counter sits exactly where it was); both men still in place at the same size; night, warm lamps in the same places; the look matches the approved pilot of this clubhouse; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the vaulted corridor of arches receding to the middle, the shelves along both sides, the two lit display niches on the left and right walls (an old ball in the left one, books in the right one), and the counter with its thin rail along the top edge, at exactly the same height, filling the lower part.

The room: A private tailor's room in charcoal wool and black oak: real textiles and real wood, handcrafted.
The arches and vault become honed black basalt, and the wall panels become upholstered charcoal wool flannel woven in a fine straight herringbone, the herringbone lines running neatly up and down each panel, with visible stitched seams, framed in black-stained open-pore oak with straight grain in mouldings that keep the same panel layout. The shelves become black-stained open-pore oak. The display niches become black-stained oak frames with matte black linen backs, lit warm from inside. The corridor floor becomes dark charcoal wool carpet with soft contact shadows. The rail along the counter becomes aged satin brass with a soft dull sheen. The counter becomes one solid slab of honed black slate with a dry stone surface like a slate blackboard and a few faint pale mineral lines, fully matte, with no reflection.

Light: It is night. Light comes only from the same warm lamps in the same places, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. The walls are warm espresso charcoal, clearly lighter than the black suits, so both men read against them. Up close you see only the straight herringbone weave, the straight oak grain and the stitching. The two men stay lit exactly as they are now.

The old ball and the books in the niches keep their identity and their own colours and are relit by the niche light.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/matte/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_ARCHIVE_PLATE_MATTE_P1_2X.webp` aligned to the Wooden plate at 3072x1728, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
