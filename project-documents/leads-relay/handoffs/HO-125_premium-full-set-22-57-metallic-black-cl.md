# HO-125 · Team G → Team V · Premium full set 22/57: Metallic Black Clubhouse, Archive repaint

```ticket
{
 "id": "HO-125",
 "from": "G",
 "to": "V",
 "title": "Premium full set 22/57: Metallic Black Clubhouse, Archive repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-ie3afv 690adaa73 project-documents/hc-art/ho-premium-full/black/ENV_ARCHIVE_PLATE_BLACK_P1_2X.webp"],
 "log": [{"at": "2026-11-24T15:56:47Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T15:59:59Z", "by": "V", "status": "WORKING", "note": "Team V lead: on Nik's run sheet (claude/project-thread-ie3afv project-documents/hc-art/ho-premium-full/RUN_SHEET_*.md); gate 9/10."}, {"at": "2026-11-24T22:19:46Z", "by": "V", "status": "DONE", "note": "Metallic Black Archive, first try, 9/10, satin counter"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q4Pzep7ADdjW9oEDst"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 22 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Metallic Black = small, sharp, warm GOLD highlights; every large surface near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Metallic Black Clubhouse (Settings key `black`). **Room:** Archive.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Metallic Black Clubhouse recolour.
  2. Image 2, `REF_PILOT_BLACK.webp`: a people-free reference Team G cut from the approved paintings of this clubhouse, raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_PILOT_BLACK.webp
- **Save the result as:** `ENV_ARCHIVE_PLATE_BLACK_P1_2X` (exactly one asset).

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

The room: A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.
The arches and vault become black chrome that shows the lamps as tall soft warm reflections, and the wall panels become gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light. The shelves become blackened steel with a polished gold edge. The display niches become blackened steel frames with polished gold edges and black glass shelves, lit warm from inside. The corridor floor becomes mirror-polished black granite with dim true reflections of the lamps. The rail along the counter becomes polished gold with one crisp warm highlight. The counter becomes mirror-polished black granite with dim true reflections of the lamps and of the two men.

Light: It is night. Light comes only from the same warm lamps in the same places. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface. Behind each man a broad soft warm reflection lies on the steel, clean and crisp-edged like a lamp seen in a black car door, with no glowing haze, so the black suits stand out from the wall. Reflections of the lamps in the floor and counter are dim, about a third as bright as the real lamps. The two men stay lit exactly as they are now.

The old ball and the books in the niches keep their identity and their own colours and are relit by the niche light.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/black/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_ARCHIVE_PLATE_BLACK_P1_2X.webp` aligned to the Wooden plate at 3072x1728, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
