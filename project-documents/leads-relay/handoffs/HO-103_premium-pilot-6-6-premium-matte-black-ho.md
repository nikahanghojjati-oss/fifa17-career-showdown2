# HO-103 · Team G → Team V · Premium pilot 6/6: Premium Matte Black Home repaint

```ticket
{
 "id": "HO-103",
 "from": "G",
 "to": "V",
 "title": "Premium pilot 6/6: Premium Matte Black Home repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T13:20:40Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 6 of 6 in the premium clubhouse pilot (HO-098 to HO-103). Nik judges all 6 together, with the new UI, on one Team G board before the other 57 paintings are ordered. The full set must land in 3.0 (freeze Mon 30 Nov noon Boston).

### Why
Nik 2026-11-24 03:20 UTC: Silver, Metallic Black and Premium Matte Black "look very AI generated", the two blacks look alike, none look premium. Fable art review (gameplay/r100 `PREMIUM_CLUBHOUSES_ART_REVIEW.md`, page https://claude.ai/artifact/U9FjWYXx5uJzPt8uLHxVeD): a code recolour cannot reach premium; each room must be repainted as a same-composition edit of the Wooden plate. Nik said yes to the three picks on 2026-11-24 13:13 UTC.
Art direction for this one: Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; must be unmistakably different from Metallic Black (Fable review section 2).

### What
- **Clubhouse:** Premium Matte Black Clubhouse (Settings key `matte`). **Room:** Home lounge (used by Home).
- **Attach this one file only:** the Wooden 2X plate `visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp (convert to PNG first if ChatGPT refuses WebP). Never attach a previous try or the old Premium Matte Black Clubhouse recolour.
- **Save the result as:** `ENV_HOME_PLATE_MATTE_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach the one file above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: pillars, window or door, lamp and the counter edge along the bottom (about nine tenths of the way down) line up); both men still in place at the same size; night, warm lamps in the same places; the look matches the art direction; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
Keep this image exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

Keep in the same places and at the same sizes: the lounge on the left (table lamp on the sideboard, folded plaid blankets, two brown leather armchairs, round table with the old leather ball in a bowl and the glass of whisky, the sofa with the grey throw, the rug), the big window across the middle and right with the night stadium, crowd, floodlights and green pitch exactly as they are, the wall lamp on the pillar at the right, and the counter along the bottom edge at exactly the same height.

The room: A private tailor's room in charcoal felt, suede and black oak: real textiles and real wood, handcrafted.
Repaint the lounge walls and panels as upholstered charcoal wool felt and black suede with visible stitched seams, framed in black-stained open-pore oak, with soft black limewash plaster on the ceiling. The pillars beside the window become honed black basalt. The window frames become black-stained open-pore oak. The lamp arm becomes aged satin brass; the shades stay warm cream and lit. The sideboard becomes black-stained open-pore oak. The floor becomes dark charcoal wool carpet with soft contact shadows under the chairs, the table and the sofa. The counter becomes honed basalt, fully matte.

Light: It is night. Light comes only from the same warm lamps in the same places and the stadium glow through the window, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. The walls are warm espresso charcoal, clearly lighter than the black suits, so both men read against them. Up close the weave of the felt, the pores of the oak and the stitching are visible. The two men stay lit exactly as they are now.

Objects keep their identity and their own colours (brown leather armchairs and sofa, plaid wool blankets, the old leather ball, the glass of whisky, the grey throw, the rug, the lamp shades) and are relit by the new room, each standing on the floor or table with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-pilot/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_HOME_PLATE_MATTE_P1_2X.webp` aligned to the Wooden plate and sized 3072x1728 (the 2X master), plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it (below). Do not delete or replace any existing plate.

### Accept when
- Team V gate: framing aligned to the Wooden plate, rail/counter at the same height, the men in place, no AI tells (fog, glow halo, noise, streaks, repeating cells, melted edges), score /10 per the Astra skill.
- Nik OKs it on the Team G pilot board (rooms plus UI together).

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels from the Wooden 2X plate back on top with the existing hero masks pulled in a few px (faces pixel-identical, hero-pixel contract unchanged), derives `_1920`, `_1X` and `_2X`, and puts it on the board for Nik. **Timing (Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release):** the pilot is due back today; as soon as Nik OKs the pilot, Team G sends the remaining 57 tickets (all three clubhouses, desktop first, then phone) and all of them must be DONE before the 3.0 freeze, Mon 30 Nov noon Boston. If the pilot needs a second round, only the failing rooms are redone.
