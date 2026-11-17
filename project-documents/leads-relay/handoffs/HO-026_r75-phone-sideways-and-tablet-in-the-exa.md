# HO-026 · Team G → Team V · r75: phone, sideways and tablet in the exact desktop marble look (no glass)

```ticket
{
 "id": "HO-026",
 "from": "G",
 "to": "V",
 "title": "r75: phone, sideways and tablet in the exact desktop marble look (no glass)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": "1800",
 "status": "DONE",
 "steps": [],
 "evidence": ["factory/v1-wtt5ye@7eb67d35c"],
 "log": [{"at": "2026-10-12T21:55:07Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-12T21:56:19Z", "by": "V", "status": "RECEIVED", "note": "Cutouts: re-cut (V3) from the new marble phone plates so the light matches, faces checked against NEXT_*. Plan: per screen, a GPT ticket redraws the approved PHONE_<SCREEN> layout in the NEXT_<SCREEN> marble look (= PHONE_<SCREEN>_MARBLE mockup), then the 1610P cyan-box method makes the plate. First 3 samples: Home, Season Results, Final Winner."}, {"at": "2026-10-12T21:58:49Z", "by": "V", "status": "WORKING", "note": "Tickets for the 3 sample marble phone mockups are ready for Nik (factory/v1-wtt5ye 0fa01a28b, tickets/TICKET-1799_*)."}, {"at": "2026-10-12T23:35:45Z", "by": "V", "status": "WORKING", "note": "Samples 1799: Home approved; Season Results and Final Winner with Nik. Ticket 1800 (13 more phone marble mockups incl. Loading and Trophy Room single) ready 12 Oct 7:40 p.m. Eastern. Loading marble keeps the Marco Reus photo and credit (OWNER-4), only the look changes."}, {"at": "2026-10-13T02:11:20Z", "by": "V", "status": "WORKING", "note": "Portrait phone plates DONE 12 Oct 10:12 p.m. Eastern (factory/v1-wtt5ye 7eb67d35c): all 15 visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp (1179x2096, 9:16, draw cover + centred). Managers full length (PRODUCT_TRUTH §10; no fade masks), approved heads locked and matched to bodies (<1 px), faces clear of every game box. Face-safe zones plates-v2/PHONE_FACE_ZONES.json + check tools/phone_plates/live_facecheck.cjs (faces covered or faded/clipped/dimmed managers = exit 1). Loading = empty tunnel; layer the real Reus photo + credit. Settings: one plate for both parts. Trophy Room single uses ENV_TROPHY_ROOM_PHONE_V2. Contact sheet project-documents/factory/reviews/PHONE_PLATES_ALL_15.png. Next from V: sideways, tablet, platemap phone zones, V3 cutouts."}, {"at": "2026-10-13T02:17:55Z", "by": "V", "status": "DONE", "note": "Team V part done: 15 portrait phone plates (7eb67d35c); sideways + tablet reuse them (G agreed 13 Oct 02:17 UTC); no V3 cutouts (G drops OVL_*_PHONE on new plates); V_ADOPTION line added (factory/gameplay-v1 f0c80edfa). Remaining is Team G wiring in r76 with live_facecheck."}]
}
```

# Ticket for the Team V lead: phone, sideways and tablet in the desktop marble look (r75)

From the Team G lead, 2026-10-12. Owner decision (Nik, 2026-10-12 20:34 UTC, refined 21:52 UTC): r75 rebuilds every phone screen in the same premium marble look as desktop. No old stadium-night look may stay on phone. Old phone assets that cause flashing get cleaned out.

## Where things stand today

- Desktop is marble: `NEXT_*.png` and `visual-assets/v10_1/plates-v2/ENV_<KEY>_PLATE_V2_{1X,2X}.webp` (14 keys, live in r73 and r74).
- Phone, sideways and tablet are still stadium-night. Portrait uses `ENV_*_PHONE_V1.webp` (1179x2096) plus cutouts `OVL_*_PHONE_V1/V2`. Sideways and tablet fall back to the desktop stadium plates `ENV_*_PLATE_V1`.
- All 14 `PHONE_*.png` mockups on `factory/v1-wtt5ye` are stadium-night. No marble phone, sideways or tablet picture exists.
- Plates-v2 cannot be cropped for portrait phone. They are 1536x864 with both managers about 1000 px apart, and words and name tags are baked in. A crop shows one manager, or squeezes both into a 221 px strip.

## Decided: exactly the desktop look on phone, no glass (Nik, 2026-10-12 21:52 UTC)

- Phone, sideways and tablet use exactly the same premium black-and-gold marble as the desktop plates-v2 and NEXT_* pictures. There is one unified look, and no glassy variant.
- Add nothing new to the look: no glass panels, no new effects, no separate brighter tone. Desktop stays exactly as it is.
- The reason is that one look means no style swap when a Chromebook window or tablet crosses sizes, and no second art set to cache. Both are what cause old-design flashes.
- Phone still needs its own plates, because the desktop plates can't be cropped to portrait. They are the same marble and the same managers, just framed for the phone.

## Please decide first (one line back is enough)

1. Managers: should the current transparent phone cutouts be kept and re-lit, or re-cut from the NEXT_* faces?

## Please produce

A. Pictures to approve (Nik approves them; then Team G builds to match):
- 14 portrait phone mockups `PHONE_<SCREEN>_MARBLE` at 393x660 aspect, for: Home, Connect Players, Select League, Club, Transfer, Season Results, Standings, Final Winner, Rivalry, Legacy, Trophy Room, Career Stats, Rule Book and Settings. Also Loading and Trophy Room single.
- Sideways (844x390) mockups for the same 14 screens. None exist today.
- Tablet portrait (768x1024) mockups, or a one-line confirmation that tablet uses the phone composition scaled.

B. Art for the code, one marble family, with no words baked in:
- 14 portrait plates `ENV_<KEY>_PHONE_V2` (1179x2096 WebP). Standings, Final Winner, Rule Book and Settings get their own plate instead of borrowing another screen's. Leave room for props: the trophy pedestal (Trophy Room, Final Winner), the wheel plinth (Select League), the pack surface (Club) and the desk (Transfer).
- 14 sideways plates `ENV_<KEY>_SIDE_V2` (about 2:1, 1X and 2X), with the managers on the left and the right 55% calm for the game's panels.
- Manager cutouts re-lit for marble, `OVL_<KEY>_{DANIEL,NIK}_PHONE_V3`, for the 12 screens with managers. Alternatively, confirm the current cutouts are fine.
- A marble loading plate `ENV_LOADING_PHONE_V2` to replace the stadium blur and the old player photo on the startup splash.
- Updated `platemap.json` phone zones for the new plates.
- New file names only (V2 and V3). Never overwrite V1 files: old cached files must not come back after a rollback.

C. A note in `V_ADOPTION.md` saying which adopted phone, sideways and tablet studies are re-approved in marble.

## Order that helps Team G most

1. The manager-cutout decision and 3 sample portrait mockups (Home, Season Results, Final Winner).
2. The remaining portrait mockups and plates.
3. Sideways, then tablet.

Team G starts wiring as soon as each screen's plate lands. It browser-checks every screen at 393x660, 360x640, 844x390, 932x430 and 768x1024, plus the no-flash frame test, before r75 ships.
