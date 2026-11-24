# HO-170 · Team G → Team V · Premium Club room sideways 3/3: Premium Matte Black Clubhouse, phone sideways

```ticket
{
 "id": "HO-170",
 "from": "G",
 "to": "V",
 "title": "Premium Club room sideways 3/3: Premium Matte Black Clubhouse, phone sideways",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T19:31:35Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T19:33:14Z", "by": "V", "status": "RECEIVED", "note": "Owned by Team V thread Finish premium clubhouse repaints"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Club room sideways set, ticket 3 of 3 (r100 lead 2026-11-24 19:30 UTC). The sideways phone Club room is its own picture, not a crop of the desktop Club room, so it needs its own painting in each premium clubhouse. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; unmistakably different from Metallic Black (Fable review section 2). Match the approved paintings of this clubhouse, above all the finished desktop Club room (HO-148). No people in this room.

### What
- **Clubhouse:** Premium Matte Black Clubhouse (Settings key `matte`). **Room:** Club room, phone sideways.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp` (2532x1170), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `REF_CLUB_MATTE_SWATCH.webp`: the swatch Team G cuts from the finished HO-148 Club room painting and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_CLUB_MATTE_SWATCH.webp (the same one the Club phone ticket uses). **Do not start this ticket until it is there**; Team G posts it within the hour after HO-148 is DONE.
- **Save the result as:** `ENV_CLUB_SIDEWAYS_MATTE_P1` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the counter strip and the window sit exactly where they were); no people; night, warm lamps in the same places; the look matches HO-148; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the two wall lamps with pleated shades along the top, the wide window on the left with the floodlit stadium, the two leather armchairs and the low table under the window, the tall wall panel on the right with the one hanging pennant banner, the gold trophy and the old leather ball on the low shelf at the lower right, and the counter strip along the bottom at exactly the same height.

The room: A private tailor's room in charcoal wool and black oak: real textiles and real wood, handcrafted.
The wall panels become upholstered charcoal wool flannel woven in a fine straight herringbone, the herringbone lines running neatly up and down each panel, with visible stitched seams, framed in black-stained open-pore oak with straight grain in mouldings that keep the same panel layout. The back wall below the window becomes upholstered charcoal wool flannel woven in a fine straight herringbone, the herringbone lines running neatly up and down each panel, with visible stitched seams, framed in black-stained open-pore oak with straight grain in mouldings that keep the same panel layout. The window frames become black-stained open-pore oak. The low shelf becomes black-stained open-pore oak. The banner rod and lamp arms become aged satin brass; the shades stay warm cream and lit. The floor becomes dark charcoal wool carpet with soft contact shadows. The counter strip becomes one solid slab of honed black slate with a dry stone surface like a slate blackboard and a few faint pale mineral lines, fully matte, with no reflection.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. Up close you see only the straight herringbone weave, the straight oak grain and the stitching.

Objects keep their identity and their own colours (the gold trophies, the old leather balls, the leather armchairs, the dark banners) and are relit by the new room, each with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same wide framing as image 1 (about 2.16:1), nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/matte/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_CLUB_SIDEWAYS_MATTE_P1.webp` aligned to image 1 at 2532x1170, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
The phone builder (Duet) turns it into `plates-hc/matte/ENV_CLUB_SIDEWAYS_HC_V4.webp`. No men, no mask. Then it goes on the board for Nik.
