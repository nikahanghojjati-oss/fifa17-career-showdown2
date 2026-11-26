# HO-112 · Team G → Team V · Premium full set 9/57: Silver Clubhouse, Material slab (ENV_SLAB, TILE_SLAB, UI panel tile, lower slab of every phone plate) repaint

```ticket
{
 "id": "HO-112",
 "from": "G",
 "to": "V",
 "title": "Premium full set 9/57: Silver Clubhouse, Material slab (ENV_SLAB, TILE_SLAB, UI panel tile, lower slab of every phone plate) repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-ie3afv 633f18be7 project-documents/hc-art/ho-premium-full/silver/ENV_SLAB_SILVER_P1_2X.webp"],
 "log": [{"at": "2026-11-24T15:56:46Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T15:59:58Z", "by": "V", "status": "WORKING", "note": "Team V lead: on Nik's run sheet (claude/project-thread-ie3afv project-documents/hc-art/ho-premium-full/RUN_SHEET_*.md); gate 9/10."}, {"at": "2026-11-24T19:26:00Z", "by": "V", "status": "DONE", "note": "Platinum material slab, try1 + neutral grey/even light edit, 9/10; resized (not aligned: whole surface repainted) to 3072x1728"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q4Pzep7ADdjW9oEDst"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 9 of 57 in the premium clubhouse full set (after the pilot HO-098 to HO-103). Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release. **All 57 DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1). Nik approved the six pilot paintings (2026-11-24 15:54 UTC, "Yes, order the rest"); they are the standard to match. Team V's pilot lessons are built into the prompt: straight real textures only (brushed grain, herringbone, slate), no extra lamps, clean crisp reflections without haze.

### What
- **Clubhouse:** Silver Clubhouse (Settings key `silver`). **Room:** Material slab (ENV_SLAB, TILE_SLAB, UI panel tile, lower slab of every phone plate).
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old Silver Clubhouse recolour.
  2. Image 2, `REF_PILOT_SILVER.webp`: a people-free reference Team G cut from the approved paintings of this clubhouse, raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_PILOT_SILVER.webp
- **Save the result as:** `ENV_SLAB_SILVER_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (the stone runs off every edge with no border or darker corners; Team G checks a 2x2 tile for seams); night, warm lamps in the same places; the look matches the approved pilot of this clubhouse; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the approved materials and light of this clubhouse, cut from two finished rooms; match its materials, colours, finish and light exactly, and copy nothing else from it.

Keep image 1 exactly the same size and framing. Repaint the whole surface as one new stone, seen straight on.

The stone: honed pale-to-middle grey marble with soft darker grey veins running in long gentle diagonals, neutral with a trace of warmth, never blue.

It is a flat, seamless material surface: the pattern continues off every edge so it can tile, with no border, no vignette, no frame and no darker corners. Light is a soft, even, warm wash from above, very slightly brighter at the top. No objects, no reflections of objects, no text, no logos.

Real stone as a mason would finish it, with clean sharp detail and no noise grain, no streaks, no repeating cells.

Same 16:9 framing as the original, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/silver/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_SLAB_SILVER_P1_2X.webp` aligned to the Wooden plate at 3072x1728, plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it. Do not delete or replace any existing plate.

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels back with the existing hero masks pulled in a few px (faces pixel-identical), derives every size the game uses (`_1920`, `_1X`, `_2X`, `_590W`, TALL, SIDEWAYS), cuts the phone swatch for the matching phone ticket, and puts it on the board for Nik.
