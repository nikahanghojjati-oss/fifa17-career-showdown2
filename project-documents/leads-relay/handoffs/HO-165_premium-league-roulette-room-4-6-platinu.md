# HO-165 · Team G → Team V · Premium League Roulette room 4/6: Platinum Clubhouse, desktop, no men

```ticket
{
 "id": "HO-165",
 "from": "G",
 "to": "V",
 "title": "Premium League Roulette room 4/6: Platinum Clubhouse, desktop, no men",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T19:15:49Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
League Roulette set, ticket 4 of 6 (r100 lead 2026-11-24 19:13 UTC): the men-free room HO-097 made for League Roulette, now painted in each premium clubhouse so no recoloured room ships next to painted ones. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Platinum (key silver) = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1). Match the approved paintings of this clubhouse, above all the finished Directors' box (HO-107), which is the same room. No men in this picture at all, so no likeness risk.

### What
- **Clubhouse:** Platinum Clubhouse (Settings key `silver`). **Room:** League Roulette room without the men, desktop.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden men-free desktop room `ENV_BOX_PLATE_EMPTY_HC_V4_2X.webp` (3072x1728, Team V's own HO-097 output), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/claude/project-thread-ie3afv/project-documents/hc-art/ho097/ENV_BOX_PLATE_EMPTY_HC_V4_2X.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `REF_BOX_SILVER_SWATCH.webp`: the people-free swatch Team G cut from the finished HO-107 Directors' box painting, raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_BOX_SILVER_SWATCH.webp
- **Save the result as:** `ENV_BOX_PLATE_EMPTY_SILVER_P1_2X` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the thin rail along the top of the counter and the window sit exactly where they were); no person or trace of a person anywhere; calm middle; night, warm lamps in the same places; the look matches HO-107; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the big three-pane window across the middle with the night stadium, the crowd, the small ceiling spots and the green pitch exactly as they are, the coat hooks on the left with the grey coat and the yellow and black striped scarf, the glass wall cabinet on the right with the decanter and glasses, and the thin rail along the top of the counter at exactly the same height. The middle of the picture stays calm and uncluttered: a large roulette board will sit there.

The room: A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.
The wall panels become hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout. The window frames become polished nickel that mirrors the room. The wall cabinet becomes satin nickel frames with pale marble shelves. The coat hooks become polished nickel. The rail becomes polished nickel with one small sharp warm highlight. The counter becomes honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamps.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks.

Objects keep their identity and their own colours (the grey coat, the yellow and black striped scarf, the amber decanter and the glasses) and are relit by the new room.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same 16:9 framing as image 1, nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/silver/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_BOX_PLATE_EMPTY_SILVER_P1_2X.webp` aligned to image 1 at 3072x1728, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
B7 lays the Wooden V4 men (placed apart, HO-097 part 2) back on it for ENV_BOX_PLATE_HC_V4 (1920, 1X, 2X); the phone builder (Duet) derives ENV_BOX_SIDEWAYS_HC_V4 from it. Faces stay pixel-identical to Wooden. Then it goes on the board for Nik.
