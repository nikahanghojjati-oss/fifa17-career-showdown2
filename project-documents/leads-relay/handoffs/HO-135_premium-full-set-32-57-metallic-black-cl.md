# HO-135 · Team G → Team V · Premium full set 32/57: Metallic Black Clubhouse, Hall, phone band repaint

```ticket
{
 "id": "HO-135",
 "from": "G",
 "to": "V",
 "title": "Premium full set 32/57: Metallic Black Clubhouse, Hall, phone band repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-ie3afv e05ff2e3c project-documents/hc-art/ho-premium-full/black/ENV_HALL_PHONE_BLACK_P1.webp"],
 "log": [{"at": "2026-11-24T15:56:47Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T22:31:13Z", "by": "V", "status": "WORKING", "note": "swatch in; prompt in RUN_SHEET_BLACK.md (aff797334)"}, {"at": "2026-11-24T22:39:00Z", "by": "V", "status": "DONE", "note": "Metallic Black Hall phone band, first try, 9/10, aligned 1179x2096"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q4Pzep7ADdjW9oEDst"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 32 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Metallic Black = small, sharp, warm GOLD highlights; every large surface near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Metallic Black Clubhouse (Settings key `black`). **Room:** Hall, phone band.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_HALL_PHONE_HC_V3.webp` (1179x2096), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_HALL_PHONE_HC_V3.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Metallic Black Clubhouse recolour.
  2. Image 2, `REF_HALL_BLACK_SWATCH.webp`: a people-free swatch Team G cuts from the finished desktop painting of this room in this clubhouse and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_HALL_BLACK_SWATCH.webp. **Do not start this ticket until it is there**; Team G posts it within the hour after the desktop ticket is DONE.
- **Save the result as:** `ENV_HALL_PHONE_BLACK_P1` (exactly one asset).

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

Keep in the same places and at the same sizes: the stone pillars, the double door with its fanlight, the side table and lamp, the wall lamp at the right, the counter edge, with the counter edge at exactly the same height. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter.

The room: A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.
Walls and panels: gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light. Frames: black chrome with a thin polished gold inner line. Lamp metal: polished gold; shades stay warm cream and lit. Counter: mirror-polished black granite with dim true reflections of the lamps and of the two men.

Light: It is night. Light comes only from the same warm lamps in the same places. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface. Behind each man a broad soft warm reflection lies on the steel, clean and crisp-edged like a lamp seen in a black car door, with no glowing haze, so the black suits stand out from the wall. Reflections of the lamps in the floor and counter are dim, about a third as bright as the real lamps. The two men stay lit exactly as they are now.

Objects keep their identity and their own colours and are relit by the new room.

Finish: real materials, handcrafted, clean sharp detail; clear air, no fog, no glow halo, no noise grain, no streaks, no swirl or crackle patterns. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/black/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_HALL_PHONE_BLACK_P1.webp` aligned to the Wooden plate at 1179x2096, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
