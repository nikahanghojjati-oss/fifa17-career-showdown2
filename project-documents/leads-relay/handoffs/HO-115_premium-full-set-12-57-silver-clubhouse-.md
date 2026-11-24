# HO-115 · Team G → Team V · Premium full set 12/57: Silver Clubhouse, Office, phone band repaint

```ticket
{
 "id": "HO-115",
 "from": "G",
 "to": "V",
 "title": "Premium full set 12/57: Silver Clubhouse, Office, phone band repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T15:56:46Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 12 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Silver Clubhouse (Settings key `silver`). **Room:** Office, phone band.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V3.webp` (1179x2096), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V3.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Silver Clubhouse recolour.
  2. Image 2, `REF_OFFICE_SILVER_SWATCH.webp`: a people-free swatch Team G cuts from the finished desktop painting of this room in this clubhouse and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_OFFICE_SILVER_SWATCH.webp. **Do not start this ticket until it is there**; Team G posts it within the hour after the desktop ticket is DONE.
- **Save the result as:** `ENV_OFFICE_PHONE_SILVER_P1` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: the counter edge and the room band sit exactly where they were); both men still in place at the same size; night, warm lamps in the same places; the look matches the approved pilot of this clubhouse; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the dark window with the floodlight, the lamp at the right edge, the desk with the two blotters. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter.

The room: A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.
Walls and panels: hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout. Frames: polished nickel that mirrors the room. Lamp metal: polished nickel; shades stay warm cream and lit. Counter: honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamps and of the dark suits.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. Behind each man the wall sits at a calm middle grey so the black suits read crisply against it. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks. The two men stay lit exactly as they are now.

Objects keep their identity and their own colours and are relit by the new room.

Finish: real materials, handcrafted, clean sharp detail; clear air, no fog, no glow halo, no noise grain, no streaks, no swirl or crackle patterns. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/silver/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_OFFICE_PHONE_SILVER_P1.webp` aligned to the Wooden plate at 1179x2096, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
