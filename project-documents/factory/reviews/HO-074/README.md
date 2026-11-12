# HO-074 lighting pass (Team V, 11 Nov 2026)

Rule: one lamp logic per room. Every highlight on the two managers comes from a lamp you can point at, in that lamp's colour; the side of the head away from the lamp has no rim. Faces, hair shape, poses, clothes and rooms are untouched (only hair-rim pixels change).

## 1. Rooms relit (V3 files in visual-assets/v10_1/plates-hc/)

How: code relight, no new AI picture. A person matte (u2net human seg) + face boxes find each head; on the side facing away from the lamp, thin hair highlights are pulled back to the hair's own dark value. On the lamp side they stay (scaled by distance to the lamp). Box room highlights are recoloured to the cool white of the floodlights. Faces are masked out. Tool: project-documents/factory/tools/hc/relight/ (lamps.json holds the lamp per room).

| Room | Lamp | Daniel | Nik |
|---|---|---|---|
| Tunnel | caged wall lamp, right wall, warm | weak rim, right side only | rim right side only |
| Box | floodlights behind the glass, above, cool white | soft cool rim from above | soft cool rim from above |
| Office | brass table lamp, far right, warm | weak rim, right side | rim right side |
| Board room | shaded wall lamp, left, warm | rim left side | faint rim left side |
| Archive | lit display cases, one each side | rim left (his case) | rim right (his case) |
| Home | wall lamp right of Nik; lounge table lamp far left | faint rim left | rim right side |
| Squad room (HO-069, added 12 Nov) | desktop: wall lamp left of Daniel, lit boot case above Nik; phone: wall lamp just left of Daniel | rim left side | desktop soft rim from above; phone faint left rim (cut-out halo also removed on the far side) |
| Start hall (HO-069) | console table lamp right of Daniel; wall lamp right of Nik | rim right side | rim right side |

Before/after: RELIGHT_DESKTOP_BEFORE_AFTER.jpg, RELIGHT_PHONE_BEFORE_AFTER.jpg (left = today, right = relit).

Files (WebP q90; 1X and 590W are downscales of the relit 2X / phone):

| File | Size | Weight |
|---|---|---|
| ENV_TUNNEL_PLATE_HC_V3_2X.webp | 3072x1728 | 322 KB |
| ENV_TUNNEL_PLATE_HC_V3_1X.webp | 1536x864 | 130 KB |
| ENV_TUNNEL_PHONE_HC_V3.webp | 1179x2096 | 104 KB |
| ENV_TUNNEL_PHONE_HC_V3_590W.webp | 590x1049 | 34 KB |
| ENV_BOX_PLATE_HC_V3_2X.webp | 3072x1728 | 262 KB |
| ENV_BOX_PLATE_HC_V3_1X.webp | 1536x864 | 109 KB |
| ENV_BOX_PHONE_HC_V3.webp | 1179x2096 | 113 KB |
| ENV_BOX_PHONE_HC_V3_590W.webp | 590x1049 | 40 KB |
| ENV_BOX_PHONE_HC_V3_TALL.webp | 1179x2620 | 126 KB |
| ENV_OFFICE_PLATE_HC_V3_2X.webp | 3072x1728 | 312 KB |
| ENV_OFFICE_PLATE_HC_V3_1X.webp | 1536x864 | 131 KB |
| ENV_OFFICE_PHONE_HC_V3.webp | 1179x2096 | 111 KB |
| ENV_OFFICE_PHONE_HC_V3_590W.webp | 590x1049 | 36 KB |
| ENV_BOARD_PLATE_HC_V3_2X.webp | 3072x1728 | 278 KB |
| ENV_BOARD_PLATE_HC_V3_1X.webp | 1536x864 | 110 KB |
| ENV_BOARD_PHONE_HC_V3.webp | 1179x2096 | 116 KB |
| ENV_BOARD_PHONE_HC_V3_590W.webp | 590x1049 | 37 KB |
| ENV_ARCHIVE_PLATE_HC_V3_2X.webp | 3072x1728 | 232 KB |
| ENV_ARCHIVE_PLATE_HC_V3_1X.webp | 1536x864 | 92 KB |
| ENV_ARCHIVE_PHONE_HC_V3.webp | 1179x2096 | 87 KB |
| ENV_ARCHIVE_PHONE_HC_V3_590W.webp | 590x1049 | 30 KB |
| ENV_HOME_PLATE_HC_V3_2X.webp | 3072x1728 | 295 KB |
| ENV_HOME_PLATE_HC_V3_1X.webp | 1536x864 | 123 KB |
| ENV_HOME_PHONE_HC_V3.webp | 1179x2096 | 137 KB |
| ENV_HOME_PHONE_HC_V3_590W.webp | 590x1049 | 48 KB |
| ENV_HALL_PLATE_HC_V3_2X.webp | 3072x1728 | 341 KB |
| ENV_HALL_PLATE_HC_V3_1X.webp | 1536x864 | 140 KB |
| ENV_HALL_PHONE_HC_V3.webp | 1179x2096 | 129 KB |
| ENV_HALL_PHONE_HC_V3_590W.webp | 590x1049 | 44 KB |
| ENV_HALL_PHONE_HC_V3_TALL.webp | 1179x2620 | 151 KB || ENV_BOX_PHONE_HC_V3_TALL_590W.webp | 590x1311 | 45 KB |

Added 12 Nov:

| ENV_COACHES_PLATE_HC_V3_2X.webp | 3072x1728 | 220 KB |
| ENV_COACHES_PLATE_HC_V3_1X.webp | 1536x864 | 79 KB |
| ENV_COACHES_PHONE_HC_V3.webp | 1179x2096 | 72 KB |
| ENV_COACHES_PHONE_HC_V3_590W.webp | 590x1049 | 25 KB |
| ENV_COACHES_PHONE_HC_V3_TALL.webp | 1179x2620 | 81 KB |

Wiring for Team G: swap each `_HC_V2` name for `_HC_V3` (same sizes, same lip lines as rooms_v2_set.json). Hall V3 replaces the HO-069 hall files.

## 2. League wheel rim

visual-assets/v10_1/shared/art/wheel/WHEEL_RIM_V2.webp: 1600x1600 alpha, brushed brass in the counter-rail colour, satin, lit from above, 12 flat screws, no mirror hotspots. Same canvas and ring as V1 (inner 610, outer 776 of 1600, measured as V1's median ring), drawn as a true circle on the canvas centre. Drawn in code: tools/hc/relight/brass_rim.py. Sheet: WHEEL_RIM_V1_VS_V2.jpg.
Team G: point css/v10Setup.css (2 places, lines ~468 and ~1370) at WHEEL_RIM_V2 and update the two contract hashes. Pointer and hub are still code gradients; to match, use brass stops #D6B07A / #A57E4E / #5C4128 (light / mid / dark) instead of #FFF1B8 / #F2C45B / #7A5A22.

## 3. Glows removed

- visual-assets/v10_1/tr2/slice-02-plate/plate.css: 35 gold glow terms removed (outer gold box-shadows, gold text-shadows, gold drop-shadows, var(--sd-shadow-glow) uses, and the warm side rims on the phone heroes). Inset edges and dark contact shadows stay; gold text gets a 1px dark contact shadow instead. Pin updated in tests/contracts/v10-transfer-contracts.cjs.
- visual-assets/v10_1/shared/showdown-type.css: the gold drop-shadow on .sd-title removed; the dark 3px contact shadow stays.
- Tool: tools/hc/relight/deglow.py (rule: outer, warm-coloured shadow = glow).

Noted, not changed (Team G's call): `--sd-shadow-glow` is still defined as a gold glow in shared/showdown-tokens.css for other users; plate.css line ~32 draws the short-desktop side gaps with `blur(18px) brightness(.45)` (a dim filter under the NO DIM FILTERS rule).
