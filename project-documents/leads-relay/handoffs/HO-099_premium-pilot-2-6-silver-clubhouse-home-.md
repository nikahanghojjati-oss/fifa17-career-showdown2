# HO-099 · Team G → Team V · Premium pilot 2/6: Silver Clubhouse Home repaint

```ticket
{
 "id": "HO-099",
 "from": "G",
 "to": "V",
 "title": "Premium pilot 2/6: Silver Clubhouse Home repaint",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-ie3afv a665597ec project-documents/hc-art/ho-premium-pilot/ENV_HOME_PLATE_SILVER_P1_2X.webp (+_RAW.png, SHA256.json)"],
 "log": [{"at": "2026-11-24T13:20:40Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-24T13:23:13Z", "by": "V", "status": "WORKING", "note": "Team V lead: prompts sent to Nik (fixed a template leak in the Light line: {'' if rm=='HOME' else ''} removed; Home gets ' and the stadium glow through the window'). Sources as PNG on claude/project-thread-ie3afv hc-art/ho-premium-pilot/src."}, {"at": "2026-11-24T15:28:41Z", "by": "V", "status": "DONE", "note": "Team V gate 9/10 (Nik rule: each at least 9). Aligned 3072x1728 to Wooden V3 2X (ORB affine, <1px). Men NOT composited (Team G does). Prompt lessons for the 57: Astra paints a fine swirl/crackle on wall materials; name a straight real texture (brushed grain, herringbone, slate); forbid extra lamps; ask clean crisp reflections without haze. Upgraded prompts in ho-premium-pilot/prompts/*_V2.txt. Also: your Light line had a template leak {'' if rm=='HOME' else ''}; fix the generator."}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E", "V": "session_01GU43Q53Fzq53MAmD6ztZ5f"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket 2 of 6 in the premium clubhouse pilot (HO-098 to HO-103). Nik judges all 6 together, with the new UI, on one Team G board before the other 57 paintings are ordered. The full set must land in 3.0 (freeze Mon 30 Nov noon Boston).

### Why
Nik 2026-11-24 03:20 UTC: Silver, Metallic Black and Premium Matte Black "look very AI generated", the two blacks look alike, none look premium. Fable art review (gameplay/r100 `PREMIUM_CLUBHOUSES_ART_REVIEW.md`, page https://claude.ai/artifact/U9FjWYXx5uJzPt8uLHxVeD): a code recolour cannot reach premium; each room must be repainted as a same-composition edit of the Wooden plate. Nik said yes to the three picks on 2026-11-24 13:13 UTC.
Art direction for this one: Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); the mirror look comes from polished nickel and real reflections, not an evenly bright room (Nik 2026-11-24 pick 1).

### What
- **Clubhouse:** Silver Clubhouse (Settings key `silver`). **Room:** Home lounge (used by Home).
- **Attach this one file only:** the Wooden 2X plate `visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp (convert to PNG first if ChatGPT refuses WebP). Never attach a previous try or the old Silver Clubhouse recolour.
- **Save the result as:** `ENV_HOME_PLATE_SILVER_P1_2X` (exactly one asset).

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

The room: A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.
Repaint the lounge walls and the panels as hand-laid silver leaf in visible square leaves with slight tone changes from leaf to leaf, set between satin nickel pilasters. The ceiling becomes deep graphite plaster. The pillars beside the window become pale grey marble with soft darker grey veins. The window frames and the lamp arm become polished nickel that mirrors the room; the lamp shades stay warm cream and lit. The sideboard gets a pale marble top and nickel edges. The floor becomes honed pale stone that holds soft reflections of the lamps and the furniture, with true contact shadows under the chairs, the table and the sofa. The counter becomes honed pale grey marble with soft dark veins.

Light: It is night. Light comes only from the same warm lamps in the same places{' and the stadium glow through the window' if rm=='HOME' else ''}. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. Behind each man the wall sits at a calm middle grey so the black suits read crisply against it. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks. The two men stay lit exactly as they are now.

Objects keep their identity and their own colours (brown leather armchairs and sofa, plaid wool blankets, the old leather ball, the glass of whisky, the grey throw, the rug, the lamp shades) and are relit by the new room, each standing on the floor or table with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-pilot/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_HOME_PLATE_SILVER_P1_2X.webp` aligned to the Wooden plate and sized 3072x1728 (the 2X master), plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it (below). Do not delete or replace any existing plate.

### Accept when
- Team V gate: framing aligned to the Wooden plate, rail/counter at the same height, the men in place, no AI tells (fog, glow halo, noise, streaks, repeating cells, melted edges), score /10 per the Astra skill.
- Nik OKs it on the Team G pilot board (rooms plus UI together).

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels from the Wooden 2X plate back on top with the existing hero masks pulled in a few px (faces pixel-identical, hero-pixel contract unchanged), derives `_1920`, `_1X` and `_2X`, and puts it on the board for Nik. **Timing (Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release):** the pilot is due back today; as soon as Nik OKs the pilot, Team G sends the remaining 57 tickets (all three clubhouses, desktop first, then phone) and all of them must be DONE before the 3.0 freeze, Mon 30 Nov noon Boston. If the pilot needs a second round, only the failing rooms are redone.
