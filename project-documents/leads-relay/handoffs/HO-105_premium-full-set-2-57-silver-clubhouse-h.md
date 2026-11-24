# HO-105 · Team G → Team V · Premium full set 2/57: Silver Clubhouse, Hall repaint

```ticket
{
 "id": "HO-105",
 "from": "G",
 "to": "V",
 "title": "Premium full set 2/57: Silver Clubhouse, Hall repaint",
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
Ticket 2 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Silver Clubhouse (Settings key `silver`). **Room:** Hall.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_HALL_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_HALL_PLATE_HC_V3_2X.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Silver Clubhouse recolour.
  2. Image 2, `REF_PILOT_SILVER.webp`: a people-free reference Team G cut from the approved paintings of this clubhouse, raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_PILOT_SILVER.webp
- **Save the result as:** `ENV_HALL_PLATE_SILVER_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: the counter strip along the bottom sits exactly where it was); both men still in place at the same size; night, warm lamps in the same places; the look matches the approved pilot of this clubhouse; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the staircase on the left with its railing and the leather bag on the steps, the stone pillars, the tall double door in the middle with its arched fanlight, the small side table beside the door with its table lamp and book, the patterned runner rug, the wall lamp with its pleated shade at the top right, and the counter strip along the bottom at exactly the same height.

The room: A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.
The walls and pillars become pale grey marble with soft darker grey veins (light stone with dark veins, never dark stone with white cracks), with wall panels in hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout. The double door becomes the same door in silver leaf with a polished nickel handle, and the fanlight frame becomes polished nickel that mirrors the room. The stair railing becomes polished nickel. The side table becomes pale marble with a polished nickel edge. The floor becomes honed pale stone that holds soft reflections of the lamps, with true contact shadows. The lamp arms and bases become polished nickel; the shades stay warm cream and lit. The counter strip becomes honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamps and of the dark suits.

Light: It is night. Light comes only from the same warm lamps in the same places. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. Behind each man the wall sits at a calm middle grey so the black suits read crisply against it. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks. The two men stay lit exactly as they are now.

Objects keep their identity and their own colours (the leather bag, the book, the runner rug with its pattern) and are relit by the new room, each with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/silver/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_HALL_PLATE_SILVER_P1_2X.webp` aligned to the Wooden plate at 3072x1728, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
