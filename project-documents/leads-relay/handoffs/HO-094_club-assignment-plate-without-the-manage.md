# HO-094 · Team G → Team V · Club Assignment plate without the managers (desktop + phone)

```ticket
{
 "id": "HO-094",
 "from": "G",
 "to": "V",
 "title": "Club Assignment plate without the managers (desktop + phone)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn 1ed78b280 project-documents/hc-art/ho094/"],
 "log": [{"at": "2026-11-16T22:56:24Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-16T22:59:36Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: 2 Astra edit prompts posted (attach V2 PNG), Nik runs, lead locks outside zones + exports"}, {"at": "2026-11-16T23:22:57Z", "by": "V", "status": "DONE", "note": "New empty Club room in HC house look (Nik changed ticket from editing old V2 plate). ENV_CLUB_PLATE_HC_V3_1X/2X + ENV_CLUB_PHONE_HC_V3 webp, Nik OK 16 Nov"}],
 "from_session": "session_01GU43Q5bagqLyredN5q4Pwh",
 "sessions": {"G": "session_01GU43Q5bagqLyredN5q4Pwh", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"}
}
```

### Why
Nik, 2026-11-16 22:55 UTC (Team G lead thread), verbatim: "Maybe you can put the old background of club assignment in without the heroes / As long as all the items and elements of the background seems visible and in right place".
Club Assignment is now a 3D "spin and stop" screen (R94-02, ships in 2.7.0): two footballs spin in a framed 3D pitch in the middle of the page, with Home-style tiles below (manager boxes, STOP). The managers holding packs no longer fit. Team G wants the page background to be the existing Club plate with the managers and packs removed.

### Assets (two; one asset = one image ticket = one new chat)
1. **ENV_CLUB_PLATE_V3** (desktop): edit of `visual-assets/v10_1/plates-v2/ENV_CLUB_PLATE_V2_2X.webp` (the gold lounge with the floodlit stadium window). Deliver 1X 1536x864 and 2X 3072x1728 WebP + SHA256.
2. **ENV_CLUB_PHONE_V3** (phone): edit of `visual-assets/v10_1/plates-v2/ENV_CLUB_PHONE_V2.webp`. Deliver 1179x2096 WebP + SHA256.

### What changes (scene edit, no faces generated)
- Remove Daniel, Nik and both black packs completely. Repaint what was behind them as the same room: the side banners and shelves, the armchairs, the stadium window and its floodlights, the trophies, the black-and-gold marble table edge. Keep it continuous and in the right place.
- Remove the painted manager names and taglines on the side banners ("Daniel The Maestro", "Nik The Manager", "SKILL. VISION. MAGIC.", "TACTICS. DISCIPLINE. PROGRESS."): leave the banners as plain dark-and-gold cloth (Team G draws live text; no baked words). Decorative non-word marks may stay.
- Keep everything else exactly as it is: framing 16:9 (phone 9:16), warm gold lighting, the window, the marble table front.
- No people, no players, no readable text anywhere, no added objects.

### Accept when
- Nik OKs each image at a glance; no trace of a person, hand or pack; the room looks like nothing was ever there.
- Everything outside the removed areas matches V2 (likeness-lock style: restore original pixels outside the edited zones).
- Files exported at the sizes above with SHA256.json in hc-art/ho094/.

### After DONE
Team G (R94-02 build) wires ENV_CLUB_PLATE_V3 / ENV_CLUB_PHONE_V3 into the Club Assignment draw-mode page slot (falls back to marble until then). V2 plates and the pack frames CL1-CL6 stay for old-shape Setups; nothing is deleted.

### Added 2026-11-16 22:57 UTC (Nik): fit the 3D box at every size
Nik, verbatim: "The background show match the layout of our 3d screen box in all sizes". The page lays a framed 3D pitch box over the middle of the plate (desktop: about the middle 85% of width, from about 30% to 80% of height; phone portrait: a wide box in the upper middle; sideways phones: box on the left, tiles on the right). Compose the plate so its room details (banners, trophies, shelves, armchairs, window frame) sit AROUND that box and stay visible, and nothing important sits behind it. Team G will send a guide image with the box drawn on each size if V asks; Team G crops the plate per size (cover + focal point), so keep the side and top edges rich, the middle calm.
