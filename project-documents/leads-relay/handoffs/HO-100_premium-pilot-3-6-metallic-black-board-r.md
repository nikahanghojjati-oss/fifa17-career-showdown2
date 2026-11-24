# HO-100 · Team G → Team V · Premium pilot 3/6: Metallic Black Board Room repaint

```ticket
{
 "id": "HO-100",
 "from": "G",
 "to": "V",
 "title": "Premium pilot 3/6: Metallic Black Board Room repaint",
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
Ticket 3 of 6 in the premium clubhouse pilot (HO-098 to HO-103). Nik judges all 6 together, with the new UI, on one Team G board before the other 57 paintings are ordered. The full set must land in 3.0 (freeze Mon 30 Nov noon Boston).

### Why
Nik 2026-11-24 03:20 UTC: Silver, Metallic Black and Premium Matte Black "look very AI generated", the two blacks look alike, none look premium. Fable art review (gameplay/r100 `PREMIUM_CLUBHOUSES_ART_REVIEW.md`, page https://claude.ai/artifact/U9FjWYXx5uJzPt8uLHxVeD): a code recolour cannot reach premium; each room must be repainted as a same-composition edit of the Wooden plate. Nik said yes to the three picks on 2026-11-24 13:13 UTC.
Art direction for this one: Metallic Black = small, sharp, warm GOLD highlights; every large surface stays near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2).

### What
- **Clubhouse:** Metallic Black Clubhouse (Settings key `black`). **Room:** Board Room (used by Season Results, Final Winner and other screens that use the Board Room).
- **Attach this one file only:** the Wooden 2X plate `visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp` (3072x1728), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp (convert to PNG first if ChatGPT refuses WebP). Never attach a previous try or the old Metallic Black Clubhouse recolour.
- **Save the result as:** `ENV_BOARD_PLATE_BLACK_P1_2X` (exactly one asset).

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

The room: A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.
Repaint the wall panels as gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light. The door becomes blackened steel with a polished gold handle. The pillars at the far edges become black chrome that shows the lamp as a tall soft warm reflection. The lamp arm becomes polished gold; the shade stays warm cream and lit. The rail becomes polished gold with one crisp warm highlight. The counter becomes mirror-polished black granite with dim true reflections of the lamp and of the two men.

Light: It is night. Light comes only from the same warm lamps in the same places{'' if rm=='HOME' else ''}. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface. Behind each man a broad soft warm reflection lies on the steel so the black suits stand out from the wall. The two men stay lit exactly as they are now.

The lamp shade and the door handle keep their shape; the room holds no other objects.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-pilot/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_BOARD_PLATE_BLACK_P1_2X.webp` aligned to the Wooden plate and sized 3072x1728 (the 2X master), plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it (below). Do not delete or replace any existing plate.

### Accept when
- Team V gate: framing aligned to the Wooden plate, rail/counter at the same height, the men in place, no AI tells (fog, glow halo, noise, streaks, repeating cells, melted edges), score /10 per the Astra skill.
- Nik OKs it on the Team G pilot board (rooms plus UI together).

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels from the Wooden 2X plate back on top with the existing hero masks pulled in a few px (faces pixel-identical, hero-pixel contract unchanged), derives `_1920`, `_1X` and `_2X`, and puts it on the board for Nik. **Timing (Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release):** the pilot is due back today; as soon as Nik OKs the pilot, Team G sends the remaining 57 tickets (all three clubhouses, desktop first, then phone) and all of them must be DONE before the 3.0 freeze, Mon 30 Nov noon Boston. If the pilot needs a second round, only the failing rooms are redone.
