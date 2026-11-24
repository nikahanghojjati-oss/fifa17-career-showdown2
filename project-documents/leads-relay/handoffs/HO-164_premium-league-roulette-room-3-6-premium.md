# HO-164 · Team G → Team V · Premium League Roulette room 3/6: Premium Matte Black Clubhouse, phone upright, no men

```ticket
{
 "id": "HO-164",
 "from": "G",
 "to": "V",
 "title": "Premium League Roulette room 3/6: Premium Matte Black Clubhouse, phone upright, no men",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T19:15:49Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T19:17:29Z", "by": "V", "status": "RECEIVED", "note": ""}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
League Roulette set, ticket 3 of 6 (r100 lead 2026-11-24 19:13 UTC): the men-free room HO-097 made for League Roulette, now painted in each premium clubhouse so no recoloured room ships next to painted ones. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; unmistakably different from Metallic Black (Fable review section 2). Match the approved paintings of this clubhouse, above all the finished Directors' box (HO-145), which is the same room. No men in this picture at all, so no likeness risk.

### What
- **Clubhouse:** Premium Matte Black Clubhouse (Settings key `matte`). **Room:** League Roulette room without the men, phone upright.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden men-free phone room `visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp` (1179x2096, from HO-097), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `REF_BOX_MATTE_SWATCH.webp`: the people-free swatch Team G cuts from the finished HO-145 Directors' box painting and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_BOX_MATTE_SWATCH.webp. **Do not start this ticket until it is there**; Team G posts it within the hour after HO-145 is DONE.
- **Save the result as:** `ENV_BOX_PHONE_V4_MATTE_P1` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the counter edge and the window sit exactly where they were); no person or trace of a person anywhere; calm middle; night, warm lamps in the same places; the look matches HO-145; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the window with the night stadium, the crowd and the green pitch exactly as they are, the window frames, the counter rail, with the counter edge at exactly the same height. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter. The middle of the picture stays calm and uncluttered: a large roulette board will sit there.

The room: A private tailor's room in charcoal wool and black oak: real textiles and real wood, handcrafted.
Walls and panels: upholstered charcoal wool flannel woven in a fine straight herringbone, the herringbone lines running neatly up and down each panel, with visible stitched seams, framed in black-stained open-pore oak with straight grain in mouldings that keep the same panel layout. Frames: black-stained open-pore oak. Lamp metal: aged satin brass; shades stay warm cream and lit. The rail becomes aged satin brass with a soft dull sheen. Counter: one solid slab of honed black slate with a dry stone surface like a slate blackboard and a few faint pale mineral lines, fully matte, with no reflection.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. Up close you see only the straight herringbone weave, the straight oak grain and the stitching.

Objects keep their identity and their own colours and are relit by the new room.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/matte/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_BOX_PHONE_V4_MATTE_P1.webp` aligned to image 1 at 1179x2096, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
The phone builder (Duet) turns it into ENV_BOX_PHONE_HC_V4 (+590W) and builds the TALL version in code, as HO-097 did. Faces stay pixel-identical to Wooden. Then it goes on the board for Nik.
