# HO-102 · Team G → Team V · Premium pilot 5/6: Premium Matte Black Board Room repaint

```ticket
{
 "id": "HO-102",
 "from": "G",
 "to": "V",
 "title": "Premium pilot 5/6: Premium Matte Black Board Room repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "WORKING",
 "steps": [],
 "evidence": ["claude/project-thread-ie3afv a665597ec project-documents/hc-art/ho-premium-pilot/ENV_BOARD_PLATE_MATTE_P1_2X.webp (+_RAW.png, SHA256.json)"],
 "log": [{"at": "2026-11-24T13:20:40Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T13:23:13Z", "by": "V", "status": "WORKING", "note": "Team V lead: prompts sent to Nik (fixed a template leak in the Light line: {'' if rm=='HOME' else ''} removed; Home gets ' and the stadium glow through the window'). Sources as PNG on claude/project-thread-ie3afv hc-art/ho-premium-pilot/src."}, {"at": "2026-11-24T15:28:41Z", "by": "V", "status": "DONE", "note": "Team V gate 9/10 (Nik rule: each at least 9). Aligned 3072x1728 to Wooden V3 2X (ORB affine, <1px). Men NOT composited (Team G does). Prompt lessons for the 57: Astra paints a fine swirl/crackle on wall materials; name a straight real texture (brushed grain, herringbone, slate); forbid extra lamps; ask clean crisp reflections without haze. Upgraded prompts in ho-premium-pilot/prompts/*_V2.txt. Also: your Light line had a template leak {'' if rm=='HOME' else ''}; fix the generator."}, {"at": "2026-11-25T01:12:35Z", "by": "G", "status": "RETURNED", "note": "REDO graphite (Nik 01:11 UTC 'Yes, graphite like my car'): new chat from the Wooden plate only, prompt in the REDO section; same asset name; HO-173 bar; top priority"}, {"at": "2026-11-25T01:14:16Z", "by": "V", "status": "WORKING", "note": "Graphite redo started 8:20 p.m. Eastern in Team V lead thread; one word change: felt -> fine herringbone wool flannel (pilot lesson: Astra turns felt into swirl/maze)"}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 5 of 6 in the premium clubhouse pilot (HO-098 to HO-103). Nik judges all 6 together, with the new UI, on one Team G board before the other 57 paintings are ordered. The full set must land in 3.0 (freeze Mon 30 Nov noon Boston).

### Why
Nik 2026-11-24 03:20 UTC: Silver, Metallic Black and Premium Matte Black "look very AI generated", the two blacks look alike, none look premium. Fable art review (gameplay/r100 `PREMIUM_CLUBHOUSES_ART_REVIEW.md`, page https://claude.ai/artifact/U9FjWYXx5uJzPt8uLHxVeD): a code recolour cannot reach premium; each room must be repainted as a same-composition edit of the Wooden plate. Nik said yes to the three picks on 2026-11-24 13:13 UTC.
Art direction for this one: Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; must be unmistakably different from Metallic Black (Fable review section 2).

### What
- **Clubhouse:** Premium Matte Black Clubhouse (Settings key `matte`). **Room:** Board Room (used by Season Results, Final Winner and other screens that use the Board Room).
- **Attach this one file only:** the Wooden 2X plate `visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp (convert to PNG first if ChatGPT refuses WebP). Never attach a previous try or the old Premium Matte Black Clubhouse recolour.
- **Save the result as:** `ENV_BOARD_PLATE_MATTE_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach the one file above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: pillars, window or door, lamp and the thin rail along the top of the counter (about three quarters of the way down) line up); both men still in place at the same size; night, warm lamps in the same places; the look matches the art direction; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Keep this image exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the wall lamp on the left with its pleated shade, the door on the right with its handle, the tall stone pillars at the far left and far right edges, the panel layout of the wall, and the thin rail along the top of the counter with the counter filling the lower quarter. The rail stays at exactly the same height.

The room: A private tailor's room in charcoal felt, suede and black oak: real textiles and real wood, handcrafted.
Repaint the wall panels as upholstered charcoal wool felt and black suede with visible stitched seams, framed in black-stained open-pore oak mouldings that keep the same panel layout, with soft black limewash plaster above. The door becomes black-stained open-pore oak with an aged satin brass handle. The pillars at the far edges become honed black basalt. The lamp arm becomes aged satin brass; the shade stays warm cream and lit. The rail becomes aged satin brass with a soft dull sheen. The counter becomes honed basalt, fully matte, with soft contact shadows and no reflection.

Light: It is night. Light comes only from the same warm lamps in the same places, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. The walls are warm espresso charcoal, clearly lighter than the black suits, so both men read against them. Up close the weave of the felt, the pores of the oak and the stitching are visible. The two men stay lit exactly as they are now.

The lamp shade and the door handle keep their shape; the room holds no other objects.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-pilot/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_BOARD_PLATE_MATTE_P1_2X.webp` aligned to the Wooden plate and sized 3072x1728 (the 2X master), plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it (below). Do not delete or replace any existing plate.

### Accept when
- Team V gate: framing aligned to the Wooden plate, rail/counter at the same height, the men in place, no AI tells (fog, glow halo, noise, streaks, repeating cells, melted edges), score /10 per the Astra skill.
- Nik OKs it on the Team G pilot board (rooms plus UI together).

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels from the Wooden 2X plate back on top with the existing hero masks pulled in a few px (faces pixel-identical, hero-pixel contract unchanged), derives `_1920`, `_1X` and `_2X`, and puts it on the board for Nik. **Timing (Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release):** the pilot is due back today; as soon as Nik OKs the pilot, Team G sends the remaining 57 tickets (all three clubhouses, desktop first, then phone) and all of them must be DONE before the 3.0 freeze, Mon 30 Nov noon Boston. If the pilot needs a second round, only the failing rooms are redone.

### REDO: graphite (Nik 2026-11-25 01:11 UTC: "Yes, graphite like my car")
Nik wants the Premium Matte Black Clubhouse to truly look premium (HO-173), and he picked the **graphite** direction from his own matte black car reference (`attachments/ho-premium-full/MATTE_COLOUR_STUDY.md`, d9b5a67). The first Board Room came back as a brown espresso room, close to a darkened Wooden room (Team G's numeric check: saturation 0.33, change from Wooden 7-9 of 255, flat). This redo replaces it. **Top priority.** Every other Matte ticket waits for Nik's OK on these two redos.

- **Route:** ChatGPT Work mode, **Astra 6, Extra High**. **Start a new chat from the Wooden plate** `visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp` (raw link above; convert to PNG if needed). **Attach that one file only.** Do not attach the car photos, because Astra would copy cars and logos. The finish is described in words below. Never attach the first try or any earlier result.
- **Target palette (from Nik's reference):** recesses #000001-#050606; main surfaces #0e0e10-#292928; lit walls #22252b-#403e3c (lighter than the suits); soft sheen #42474f-#878079; accents are satin titanium or brushed aluminium. No brown: surface saturation stays under about 0.12. The warm lamps stay warm.
- **Save as:** the same asset, `ENV_BOARD_PLATE_MATTE_P1_2X`. It replaces your first delivery in `project-documents/hc-art/ho-premium-pilot/`. Update its line in `SHA256.json`, then set HO-102 DONE again.
- **Check before saving:** the HO-173 premium bar (7 points; for point 2 read "neutral graphite velvet" where it says warm charcoal, and satin titanium where it says brass). Also put it next to the Metallic Black Board Room: at a glance one is polished black and gold, the other velvet graphite and titanium. No brown anywhere on the walls. Score /10 and send only 9/10 or better. Max 3 tries, each in a new chat from the Wooden plate. If 3 tries can't reach the bar, set BLOCKED with the best try and one line on what fails.
- **After DONE:** Team G runs `tools/clubhouse-themes/matte_check.py` (difference from Metallic Black, change from Wooden, glints, tonal spread, saturation, colour cast) and puts the room on the board next to Wooden, Platinum and Metallic Black for Nik. A FAIL comes back as a REDO.

```
Keep this image exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the wall lamp on the left with its pleated shade, the door on the right with its handle, the tall stone pillars at the far left and far right edges, the panel layout of the wall, and the thin rail along the top of the counter with the counter filling the lower quarter. The rail stays at exactly the same height.

The room: A private members' room finished in neutral graphite velvet: low-gloss surfaces and satin titanium details, handcrafted.
Repaint the wall panels as upholstered graphite wool felt with visible stitched seams, a neutral graphite with no brown, framed in thin satin graphite lacquer mouldings that keep the same panel layout, with soft near-black plaster above. The door becomes satin graphite lacquer with a brushed satin titanium handle. The pillars at the far edges become honed charcoal slate. The lamp arm becomes brushed satin titanium; the shade stays warm cream and lit. The rail becomes brushed satin titanium with a soft dull sheen. The counter becomes honed graphite slate, fully matte, with soft contact shadows and no reflection.

Light: It is night. Light comes only from the same warm lamps in the same places. The lamps cast warm pools of light, but every material itself stays a neutral graphite grey-black: never brown, never espresso, never a warm cast on the walls. The finish is velvet low gloss, like fine matte lacquer: where a surface turns toward a lamp it carries a broad, soft, pale-grey sheen that rolls across it in long gradients; nothing is mirror-like, and there is no sharp highlight and no glint anywhere. The tones are layered dark on dark: near-black in the recesses and corners, deep charcoal on the main surfaces, and lighter graphite on the lit walls. The lit walls are clearly lighter than the black suits, so both men read crisply against them. Up close the weave of the felt and the stitched seams are visible and sharp. The two men stay lit exactly as they are now.

The lamp shade and the door handle keep their shape; the room holds no other objects.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```
