# HO-068 · Team V → Team G · HC V2 rooms: board, tunnel, box, office, archive, slab, trophies

```ticket
{
 "id": "HO-068",
 "from": "V",
 "to": "G",
 "title": "HC V2 rooms: board, tunnel, box, office, archive, slab, trophies",
 "kind": "design",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "WORKING",
 "steps": [],
 "evidence": ["claude/project-thread-kxgun9 @ 537234745 - trophies re-cut"],
 "log": [{"at": "2026-11-09T06:03:13Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-11-09T06:03:51Z", "by": "G", "status": "RECEIVED", "note": "Lead got it; W9 (Home art thread) wires the rooms on gameplay/r90 in batches, preview back to V."}, {"at": "2026-11-09T06:12:02Z", "by": "G", "status": "WORKING", "note": "Rooms being wired. Two asks on trophies (TRO V1 stays live until answered): (1) TRO_HC_2/3/4 have cut-out leftovers from neighbour cups, both 512 and 256: HC_2 handle fragment right edge (256px: x191-202 y202-231), HC_3 16px speck top-left, HC_4 handle fragment left edge (x50-65 y201-234). Please send cleaned files (HO-064: G does not edit trophy art). (2) Which cup is which? G's guess: HC_1 Showdown Champion, HC_2 Domestic Cup, HC_3 League Title, HC_4 Champions League, HC_5 Europa League. Confirm or correct."}, {"at": "2026-11-09T06:13:29Z", "by": "V", "status": "WORKING", "note": "V answers: (1) TRO_HC_1-5 re-cut, each file holds only its own cup (one alpha part each), 512 + 256, same names, claude/project-thread-kxgun9 @ 537234745 project-documents/hc-art/trophies/. (2) Mapping by the V1 shapes: HC_1 SHOWDOWN_CHAMPION, HC_2 LEAGUE_TITLE (round-bellied two-handled), HC_3 DOMESTIC_CUP (lidded bowl), HC_4 CONTINENTAL / Champions League (tall cup, big handles), HC_5 EUROPA (flute). So HC_2 and HC_3 are swapped from your guess."}],
 "from_session": "session_01GU43Q55MWFc5kxaqRPspjd",
 "sessions": {"V": "session_01GU43Q55MWFc5kxaqRPspjd", "G": "session_01GU43Q5aWwvAxHbnmJQquBz"}
}
```

## What
The rest of the handcrafted V2 rooms (HO-061 art), ready to wire for 2.x after Home (HO-067). Nik picked every picture on 8-9 Nov 2026 (Eastern) in the Team V thread.

## Files (branch claude/project-thread-kxgun9 @ 687598df6, folder project-documents/hc-art/)
- board/ - Season Results, Final Winner, Career Statistics
- tunnel/ - Connect Players, Standings, Rivalry Statistics
- box/ - League, Club Assignment (+ ENV_BOX_PHONE_HC_V2_TALL 1179x2620 for 9:20 phones)
- office/ - Transfer War
- archive/ - Trophy Room, Legacy
- slab/ - Settings, Rule Book (reading surface, no managers)
- trophies/ - TRO_HC_1..5 at 512x768 and 256x384 (1 Showdown, 2 two-handled, 3 lidded bowl, 4 tall cup, 5 flute); TRO V1 stays as rollback
Each room: ENV_<ROOM>_PLATE_HC_V2_1X/2X.webp (1536x864 / 3072x1728) and ENV_<ROOM>_PHONE_HC_V2(.webp, _590W.webp). All within your caps. Lip lines and sizes: hc-art/rooms_v2_set.json and hc-art/ROOMS_V2_README.md.

## Notes
- Men cut lines differ per room (archive desktop 479/864, office desktop 525, board 641, box 652, tunnel 798). Use rooms_v2_set.json, not one shared lipY.
- Board phone: the cup stands on the lip at 1098/2096, never lower.
- No dim layers, scrims or slogans on these screens (no-dim rule); managers always stay; Daniel LEFT.
- Props (wheel, packs, cups) stand on the lip with a small soft contact shadow, no glow.

## Done when
Wired behind the existing quality levels, preview link back to Team V for Nik's OK (desktop + phone).
