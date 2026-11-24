# HO-168 · Team G → Team V · Premium Club room sideways 1/3: Platinum Clubhouse, phone sideways

```ticket
{
 "id": "HO-168",
 "from": "G",
 "to": "V",
 "title": "Premium Club room sideways 1/3: Platinum Clubhouse, phone sideways",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-24T19:31:35Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q6fCkcGKdHhAqsFt2E",
 "sessions": {"G": "session_01GU43Q6fCkcGKdHhAqsFt2E"}
}
```

### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Club room sideways set, ticket 1 of 3 (r100 lead 2026-11-24 19:30 UTC). The sideways phone Club room is its own picture, not a crop of the desktop Club room, so it needs its own painting in each premium clubhouse. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: Platinum (key silver) = platinum lounge at night lit by the same warm lamps (bright near lamps, pewter/graphite corners); mirror look from polished nickel and real reflections (Nik 2026-11-24 pick 1). Match the approved paintings of this clubhouse, above all the finished desktop Club room (HO-110). No people in this room.

### What
- **Clubhouse:** Platinum Clubhouse (Settings key `silver`). **Room:** Club room, phone sideways.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp` (2532x1170), raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/r100/visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `REF_CLUB_SILVER_SWATCH.webp`: the swatch Team G cuts from the finished HO-110 Club room painting and posts at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/leads/relay/project-documents/leads-relay/attachments/ho-premium-full/REF_CLUB_SILVER_SWATCH.webp (the same one the Club phone ticket uses). **Do not start this ticket until it is there**; Team G posts it within the hour after HO-110 is DONE.
- **Save the result as:** `ENV_CLUB_SIDEWAYS_SILVER_P1` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the counter strip and the window sit exactly where they were); no people; night, warm lamps in the same places; the look matches HO-110; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the two wall lamps with pleated shades along the top, the wide window on the left with the floodlit stadium, the two leather armchairs and the low table under the window, the tall wall panel on the right with the one hanging pennant banner, the gold trophy and the old leather ball on the low shelf at the lower right, and the counter strip along the bottom at exactly the same height.

The room: A platinum members' lounge at night: real metal leaf, real polished nickel, real stone, handcrafted.
The wall panels become hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout. The back wall below the window becomes hand-laid square silver leaves, each a thin sheet of real beaten metal with a fine straight brushed grain running in one direction, so the lamp light slides across it as a soft even gradient; the leaves differ only by slight tone, set in satin nickel mouldings that keep the same panel layout. The window frames become polished nickel that mirrors the room. The low shelf becomes pale marble with a polished nickel edge. The banner rod and lamp arms become polished nickel; the shades stay warm cream and lit. The floor becomes honed pale stone that holds soft reflections of the lamps, with true contact shadows. The counter strip becomes honed pale grey marble with soft dark veins, holding a soft dim reflection of the lamps.

Light: It is night. Light comes only from the same warm lamps in the same places and the floodlit stadium glow through the window. The silver near each lamp glows warm champagne and falls away to cool pewter and graphite in the corners and toward the ceiling, so the room has depth and darker corners. The colour is neutral silver with a trace of warmth, never blue. Stone is light with dark veins, never dark stone with white cracks.

Objects keep their identity and their own colours (the gold trophies, the old leather balls, the leather armchairs, the dark banners) and are relit by the new room, each with a real soft contact shadow.

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same wide framing as image 1 (about 2.16:1), nothing cropped or extended at any edge, largest size available.
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/silver/` on your branch: the raw Astra output (PNG, untouched) **and** `ENV_CLUB_SIDEWAYS_SILVER_P1.webp` aligned to image 1 at 2532x1170, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
The phone builder (Duet) turns it into `plates-hc/silver/ENV_CLUB_SIDEWAYS_HC_V4.webp`. No men, no mask. Then it goes on the board for Nik.
