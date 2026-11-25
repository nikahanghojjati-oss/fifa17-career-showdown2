import os, sys
OUT = sys.argv[1]
RAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/"
ROOMS = {
 "BOARD": dict(name="Board Room", src="ENV_BOARD_PLATE_HC_V3_2X.webp", used="Season Results, Final Winner and other screens that use the Board Room",
  keep="Keep in the same places and at the same sizes: the wall lamp on the left with its pleated shade, the door on the right with its handle, the tall stone pillars at the far left and far right edges, the panel layout of the wall, and the thin rail along the top of the counter with the counter filling the lower quarter. The rail stays at exactly the same height.",
  rail="the thin rail along the top of the counter (about three quarters of the way down)",
  objs="The lamp shade and the door handle keep their shape; the room holds no other objects."),
 "HOME": dict(name="Home lounge", src="ENV_HOME_PLATE_HC_V3_2X.webp", used="Home",
  keep="Keep in the same places and at the same sizes: the lounge on the left (table lamp on the sideboard, folded plaid blankets, two brown leather armchairs, round table with the old leather ball in a bowl and the glass of whisky, the sofa with the grey throw, the rug), the big window across the middle and right with the night stadium, crowd, floodlights and green pitch exactly as they are, the wall lamp on the pillar at the right, and the counter along the bottom edge at exactly the same height.",
  rail="the counter edge along the bottom (about nine tenths of the way down)",
  objs="Objects keep their identity and their own colours (brown leather armchairs and sofa, plaid wool blankets, the old leather ball, the glass of whisky, the grey throw, the rug, the lamp shades) and are relit by the new room, each standing on the floor or table with a real soft contact shadow."),
}
LOOK = {
 "SILVER": dict(name="Silver Clubhouse", key="silver",
  BOARD="Repaint the wall panels as hand-laid silver leaf in visible square leaves with slight tone changes from leaf to leaf, set in satin nickel mouldings that keep the same panel layout. The door becomes the same door in silver leaf with a polished nickel handle. The pillars at the far edges become pale grey marble with soft darker grey veins. The lamp arm becomes polished nickel; the shade stays warm cream and lit. The rail becomes polished nickel and shows the lamp as one small sharp warm highlight. The counter becomes honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamp and of the dark suits.",
  HOME="Repaint the lounge walls and the panels as hand-laid silver leaf in visible square leaves with slight tone changes from leaf to leaf, set between satin nickel pilasters. The ceiling becomes deep graphite plaster. The pillars beside the window become pale grey marble with soft darker grey veins. The window frames and the lamp arm become polished nickel that mirrors the room; the lamp shades stay warm cream and lit. The sideboard gets a pale marble top and nickel edges. The floor becomes honed pale stone that holds soft reflections of the lamps and the furniture, with true contact shadows under the chairs, the table and the sofa. The counter becomes honed pale grey marble with soft dark veins.",
  light="It is night. Light comes only from the same warm lamps in the same places{' and the stadium glow through the window' if rm=='HOME' else ''}. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. Behind each man the wall sits at a calm middle grey so the black suits read crisply against it. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks.",
  feel="A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.",
  art="Silver = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); the mirror look comes from polished nickel and real reflections, not an evenly bright room (Nik 2026-11-24 pick 1)."),
 "BLACK": dict(name="Metallic Black Clubhouse", key="black",
  BOARD="Repaint the wall panels as gun-blued blackened steel with fine shadow gaps and machined chamfered edges, keeping the same panel layout; each chamfered edge catches a hairline of warm lamp light. The door becomes blackened steel with a polished gold handle. The pillars at the far edges become black chrome that shows the lamp as a tall soft warm reflection. The lamp arm becomes polished gold; the shade stays warm cream and lit. The rail becomes polished gold with one crisp warm highlight. The counter becomes mirror-polished black granite with dim true reflections of the lamp and of the two men.",
  HOME="Repaint the lounge walls and panels as gun-blued blackened steel with fine shadow gaps and machined chamfered edges, each edge catching a hairline of warm lamp light. The ceiling becomes deep black. The pillars beside the window become black chrome that shows the wall lamp as a tall soft warm reflection. The window frames become black chrome with a thin polished gold inner line. The lamp arm becomes polished gold; the shades stay warm cream and lit. The sideboard becomes blackened steel with a polished gold edge. The floor becomes mirror-polished black granite with dim true reflections of the lamps, the armchairs and the table. The counter becomes mirror-polished black granite.",
  light="It is night. Light comes only from the same warm lamps in the same places{' and the stadium glow through the window' if rm=='HOME' else ''}. Every large surface stays near true black, deep and clean. Highlights are few, small and sharp, and always the warm gold of the lamps: hairlines on edges and pinpoint reflections, never white, never blue, never a grey sheen over a whole surface. Behind each man a broad soft warm reflection lies on the steel so the black suits stand out from the wall.",
  feel="A vault of blackened steel and black chrome lit by brass lamps: real machined metal and real polished granite, handcrafted.",
  art="Metallic Black = small, sharp, warm GOLD highlights; every large surface stays near true black; clearly different from Premium Matte Black (Nik 2026-11-24 pick 2)."),
 "MATTE": dict(name="Premium Matte Black Clubhouse", key="matte",
  BOARD="Repaint the wall panels as upholstered charcoal wool felt and black suede with visible stitched seams, framed in black-stained open-pore oak mouldings that keep the same panel layout, with soft black limewash plaster above. The door becomes black-stained open-pore oak with an aged satin brass handle. The pillars at the far edges become honed black basalt. The lamp arm becomes aged satin brass; the shade stays warm cream and lit. The rail becomes aged satin brass with a soft dull sheen. The counter becomes honed basalt, fully matte, with soft contact shadows and no reflection.",
  HOME="Repaint the lounge walls and panels as upholstered charcoal wool felt and black suede with visible stitched seams, framed in black-stained open-pore oak, with soft black limewash plaster on the ceiling. The pillars beside the window become honed black basalt. The window frames become black-stained open-pore oak. The lamp arm becomes aged satin brass; the shades stay warm cream and lit. The sideboard becomes black-stained open-pore oak. The floor becomes dark charcoal wool carpet with soft contact shadows under the chairs, the table and the sofa. The counter becomes honed basalt, fully matte.",
  light="It is night. Light comes only from the same warm lamps in the same places and the stadium glow through the window, and spreads as a wide soft candle-warm wash with long gentle gradients across the walls. Every surface is matte: soft shading shows the form, and nothing glints anywhere. The walls are warm espresso charcoal, clearly lighter than the black suits, so both men read against them. Up close the weave of the felt, the pores of the oak and the stitching are visible.",
  feel="A private tailor's room in charcoal felt, suede and black oak: real textiles and real wood, handcrafted.",
  art="Premium Matte Black = charcoal felt/suede/black oak, no glint anywhere, warm charcoal walls lighter than the suits; must be unmistakably different from Metallic Black (Fable review section 2)."),
}
ORDER = [("SILVER","BOARD"),("SILVER","HOME"),("BLACK","BOARD"),("BLACK","HOME"),("MATTE","BOARD"),("MATTE","HOME")]
for i,(lk,rm) in enumerate(ORDER,1):
    L, R = LOOK[lk], ROOMS[rm]
    asset = f"ENV_{rm}_PLATE_{lk}_P1_2X"
    prompt = f"""Keep this image exactly the same in camera, framing and layout. Change only the materials and finish of the room itself.

Keep the two men exactly as they are: the same faces, hair, beards, suits, shirts, hands, pose, size and position. Do not touch them.

{R['keep']}

The room: {L['feel']}
{L[rm]}

Light: {L['light'] if rm=='HOME' else L['light'].replace(' and the stadium glow through the window','')} The two men stay lit exactly as they are now.

{R['objs']}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo around lamps or people, no noise grain and no streaks. No new objects, no text, no logos, no people other than the two men.

Same 16:9 framing as the original, nothing cropped or extended at any edge, largest size available."""
    md = f"""### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Ticket {i} of 6 in the premium clubhouse pilot (HO-098 to HO-103). Nik judges all 6 together, with the new UI, on one Team G board before the other 57 paintings are ordered. The full set must land in 3.0 (freeze Mon 30 Nov noon Boston).

### Why
Nik 2026-11-24 03:20 UTC: Silver, Metallic Black and Premium Matte Black "look very AI generated", the two blacks look alike, none look premium. Fable art review (gameplay/r100 `PREMIUM_CLUBHOUSES_ART_REVIEW.md`, page https://claude.ai/artifact/U9FjWYXx5uJzPt8uLHxVeD): a code recolour cannot reach premium; each room must be repainted as a same-composition edit of the Wooden plate. Nik said yes to the three picks on 2026-11-24 13:13 UTC.
Art direction for this one: {L['art']}

### What
- **Clubhouse:** {L['name']} (Settings key `{L['key']}`). **Room:** {R['name']} (used by {R['used']}).
- **Attach this one file only:** the Wooden 2X plate `visual-assets/v10_1/plates-hc/{R['src']}` (3072x1728), raw: {RAW}{R['src']} (convert to PNG first if ChatGPT refuses WebP). Never attach a previous try or the old {L['name']} recolour.
- **Save the result as:** `{asset}` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach the one file above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as the Wooden plate (overlay test: pillars, window or door, lamp and {R['rail']} line up); both men still in place at the same size; night, warm lamps in the same places; the look matches the art direction; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from the Wooden plate. Max 3 tries.

### Prompt
```
{prompt}
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-pilot/` on your branch: the raw Astra output (PNG, untouched) **and** `{asset}.webp` aligned to the Wooden plate and sized 3072x1728 (the 2X master), plus a line in `SHA256.json`.
- Do not composite the men back yourselves; Team G does it (below). Do not delete or replace any existing plate.

### Accept when
- Team V gate: framing aligned to the Wooden plate, rail/counter at the same height, the men in place, no AI tells (fog, glow halo, noise, streaks, repeating cells, melted edges), score /10 per the Astra skill.
- Nik OKs it on the Team G pilot board (rooms plus UI together).

### After DONE (Team G, B7 premium clubhouses thread)
Team G aligns the painting, lays the original Daniel and Nik pixels from the Wooden 2X plate back on top with the existing hero masks pulled in a few px (faces pixel-identical, hero-pixel contract unchanged), derives `_1920`, `_1X` and `_2X`, and puts it on the board for Nik. **Timing (Nik 2026-11-24 13:19 UTC: the full set lands in 3.0, the final release):** the pilot is due back today; as soon as Nik OKs the pilot, Team G sends the remaining 57 tickets (all three clubhouses, desktop first, then phone) and all of them must be DONE before the 3.0 freeze, Mon 30 Nov noon Boston. If the pilot needs a second round, only the failing rooms are redone.
"""
    open(os.path.join(OUT, f"{i}_{lk}_{rm}.md"), "w").write(md)
    print(i, lk, rm, asset, len(prompt))
