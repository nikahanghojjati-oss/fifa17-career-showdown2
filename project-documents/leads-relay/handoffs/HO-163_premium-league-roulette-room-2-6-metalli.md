# HO-163 · Team G → Team V · Premium League Roulette room 2/6: Metallic Black Clubhouse, phone upright, no men

```ticket
{
 "id": "HO-163",
 "from": "G",
 "to": "V",
 "title": "Premium League Roulette room 2/6: Metallic Black Clubhouse, phone upright, no men",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "WORKING",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T19:15:49Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T19:17:29Z", "by": "V", "status": "RECEIVED", "note": ""}, {"at": "2026-11-24T22:31:13Z", "by": "V", "status": "WORKING", "note": "swatch in; prompt in RUN_SHEET_BLACK.md (aff797334)"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q4Pzep7ADdjW9oEDst"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
League Roulette set, ticket 2 of 6 (r100 lead 2026-11-24 19:13 UTC): the men-free room HO-097 made for League Roulette, now painted in each premium clubhouse so no recoloured room ships next to painted ones. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Metallic Black = small, sharp, warm GOLD highlights; every large surface near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2). Match the approved paintings of this clubhouse, above all the finished Directors' box (HO-126), which is the same room. No men in this picture at all, so no likeness risk.

### What
- **Clubhouse:** Metallic Black Clubhouse (Settings key `black`). **Room:** League Roulette room without the men, phone upright.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden men-free phone room `visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp` (1179x2096, from HO-097), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `REF_BOX_BLACK_SWATCH.webp`: the people-free swatch Team G cuts from the finished HO-126 Directors' box painting and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_BOX_BLACK_SWATCH.webp. **Do not start this ticket until it is there**; Team G posts it within the hour after HO-126 is DONE.
- **Save the result as:** `ENV_BOX_PHONE_V4_BLACK_P1` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the counter edge and the window sit exactly where they were); no person or trace of a person anywhere; calm middle; night, warm lamps in the same places; the look matches HO-126; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the window with the night stadium, the crowd and the green pitch exactly as they are, the window frames, the counter rail, with the counter edge at exactly the same height. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter. The middle of the picture stays calm and uncluttered: a large roulette board will sit there.

The room: A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.
Walls and panels: gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light. Frames: black chrome with a thin polished gold inner line. Lamp metal: polished gold; shades stay warm cream and lit. The rail becomes polished gold with one crisp warm highlight. Counter: mirror-polished black granite with dim true reflections of the lamps.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface. Reflections of the lamps in the floor and counter are dim, about a third as bright as the real lamps.

Objects keep their identity and their own colours and are relit by the new room.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/black/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_BOX_PHONE_V4_BLACK_P1.webp` aligned to image 1 at 1179x2096, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
The phone builder (Duet) turns it into ENV_BOX_PHONE_HC_V4 (+590W) and builds the TALL version in code, as HO-097 did. Faces stay pixel-identical to Wooden. Then it goes on the board for Nik.
