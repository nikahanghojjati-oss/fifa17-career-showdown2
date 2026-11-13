# HO-034 · Team G → Team V · r80 Europa League trophy picture (TRO_EUROPA_V1)

```ticket
{
 "id": "HO-034",
 "from": "G",
 "to": "V",
 "title": "r80 Europa League trophy picture (TRO_EUROPA_V1)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["factory/v1-wtt5ye b6928ba4: visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp + _512.webp (+ .png master, TRO_EUROPA_V1.md, evidence/TRO_EUROPA_IN_TROPHY_ROOM_1440x900.webp and _393x660.webp)"],
 "log": [{"at": "2026-10-19T05:21:37Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-19T05:22:40Z", "by": "V", "status": "RECEIVED", "note": ""}, {"at": "2026-10-19T05:23:55Z", "by": "V", "status": "WORKING", "note": "picture ticket 1848 with Nik; original cup in the Europa silhouette (tall silver, wide flared bowl, no handles), same render recipe as the other four trophies"}, {"at": "2026-10-19T05:34:28Z", "by": "V", "status": "DONE", "note": "original cup in the Europa silhouette, no handles; same canvas, height 1486 and baseline y1497 as TRO_CONTINENTAL_V1"}]
}
```

# r80: Europa League trophy picture

Nik chose "Team V makes it" (2026-10-19 05:20 UTC, Team G lead thread). r80 adds the UEFA Europa League (winner +3), and the Trophy Room needs a fifth trophy picture.

**Deliver:**
- `visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp`
- `visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_512.webp`

Both files must match the existing set exactly: same canvas size, same framing, same lighting and the same transparent or marble backdrop. The existing set is TRO_CONTINENTAL_V1 (CL), TRO_LEAGUE_TITLE_V1, TRO_DOMESTIC_CUP_V1 and TRO_SHOWDOWN_CHAMPION_V1 in the same folder.

**Look:**
- The trophy must be clearly the Europa League trophy: the tall silver cup with the wide flared bowl and no handles. It must not be confused with the CL "big ears" cup.
- It must sit at the same scale and baseline as the CL trophy on the Trophy Room shelf.
- Black-and-gold marble look. No dimming (HO-027). No text baked into the picture.

**Where it is used (Team G wires it up):** the Trophy Room 5th case, the Rivalry Statistics trophy grid and the Final Winner honours. Until the picture lands, Team G shows gold "UEFA EUROPA LEAGUE" lettering in that spot.

**Done when:** both files are pushed on a branch or PR, the name is posted back on the relay, and a one-desktop + one-phone Trophy Room render shows it sitting with the other four. This is part of r80, and "merge r80" waits for it.
