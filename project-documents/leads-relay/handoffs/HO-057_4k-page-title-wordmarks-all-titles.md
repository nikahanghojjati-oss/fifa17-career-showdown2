# HO-057 · Team G → Team V · 4K page title wordmarks (all titles)

```ticket
{
 "id": "HO-057",
 "from": "G",
 "to": "V",
 "title": "4K page title wordmarks (all titles)",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-04T13:50:03Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-04T14:03:32Z", "by": "V", "status": "RECEIVED", "note": ""}],
 "from_session": "session_01GU43Q6WqUCB8eiX9yuy7EJ",
 "sessions": {"G": "session_01GU43Q6WqUCB8eiX9yuy7EJ", "V": "session_01GU43Q5ntLXNoYTmkYPBfdu"}
}
```

# Team V ticket: 4K page title wordmarks (Studio Small Axe, Nik 2026-11-04 13:46 UTC)

Nik asked to "massively improve the quality, fidelity and look, 4K resolution, for all page titles".

## Today
The titles are flat WebP pictures, 990-1400 px wide. On a 2x laptop at 1920 wide, or on any 4K screen, they show bigger than their pixels, so the browser stretches them and they look soft.

| File | Size (px) |
| --- | --- |
| shared/wordmarks/TITLE_LEAGUE_V1.webp | 1400x274 |
| shared/wordmarks/TITLE_NEW_SHOWDOWN_V1.webp | 1180x225 |
| shared/wordmarks/TITLE_CONNECT_PLAYERS_V1.webp | 1400x244 |
| shared/wordmarks/TITLE_FINAL_WINNER_V1.webp | 1400x239 |
| shared/wordmarks/TITLE_RULE_BOOK_V1.webp | 1400x319 |
| shared/wordmarks/TITLE_SETTINGS_V1.webp | 1200x311 |
| shared/wordmarks/TITLE_STANDINGS_V1.webp | 1400x325 |
| shared/wordmarks/TITLE_TRANSFER_V1.webp | 1200x249 |
| career-statistics/assets/TITLE_CS_V1.webp | 1216x126 |
| legacy/assets/TITLE_LG_V1.webp | 1028x280 |
| rivalry-statistics/assets/TITLE_RV_V1.webp | 1380x204 |
| rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp | 700x103 |
| season-results/assets/TITLE_SR_V1.webp | 1232x182 |
| season-results/assets/TITLE_SR_PHONE_V1.webp | 1000x148 |
| trophy-room/assets/TITLE_TR_V1.webp | 990x158 |

Club Assignment, Showdown Home and Showdown Champion use the same brush-gold style. Include them if they are pictures.

## Ask
1. **Redraw every title as a 3840 px wide master.** Requirements:
   - Same words, same brush-gold look and layout.
   - Transparent background.
   - Clean brush edges with no halo.
   - Real metallic detail: gold grain, a rim light, a soft inner shadow.
   - No box or frame around the word. Nik removed the frame boxes on 2026-11-04.
2. **Deliver each title as WebP, 4 sizes:** 3840, 1920, 960 and 480 px wide. Use the names `TITLE_<NAME>_V2_<width>.webp`, for example `TITLE_LEAGUE_V2_3840.webp`.
3. **Keep each phone version a separate, tighter crop,** where one exists today.
4. **Optional, best quality:** a clean SVG of each word shape, with the gold texture as a fill. It would stay sharp at any size.

## Wiring (Studio Small Axe does this when the files land)
- Each title gets srcset or image-set, so phones load 960 or 1920 and 4K screens load 3840.
- No extra Firebase reads.
- Load time stays the same on phones.
- Gallery at 390x844, 1440x900, 1920x1080 at 2x, and 3840x2160.
