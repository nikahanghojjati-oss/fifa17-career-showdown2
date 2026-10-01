# Intake report · CLUB · PASS

Brief: `visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md` (R3.2). Script: `tools/intake_hlc.py`. Evidence: `evidence/intake_club.json`, `evidence/intake_club.jpg` (original | locked, 1X).

- Base SHA (`claude-cloud/transfer-tr2-plate-g`): `8fbda036c1d1f7910631964e982705d0f25290c0`
- Inputs ref: `claude-cloud/hlc-goals`
- Goal: `visual-assets/goals/GOAL_CLUB.jpg` 1536x864, sha256 `4c0e66168a23241a1e14c0c7756a54b49fc5729029a246c51171d2f967b680f6`
- Edit: `visual-assets/goals/plates-in/ENV_CLUB_PLATE_V1.png` 1672x941, sha256 `9ec5925145fe8136615406cf37828997eed5220056a4aac93f5d4f59a8502d46` (Lanczos-resized to 1536x864)
- Framing: method `lanczos_resize`, aligned-crop error 0.77 px (tolerance 4 px) -> PASS
- Plate sizes: 1X 1536x864, 2X 3072x1728

## Tone match (owner instruction, Nik 2026-10-01; added to the R3.2 method)

Zones failing the unchanged 1.15 gate are darkened toward their 12 px ring (24 px feather inside the zone edge) to ratio <= 1.10. Protected boxes, keep rects and pixels outside zones are never touched.

| Pass | Zone | Ratio before | Scale | Ratio after |
|---|---|---|---|---|
| 1 | `rect[552,306,980,388]` | 2.194 | 0.2934 | 1.1 |
| 1 | `rect[680,405,850,555]` | 2.8866 | 0.2277 | 1.0999 |
| 1 | `rect[140,598,1400,742]` | 1.3207 | 0.8026 | 1.1 |

## Gate counts

| Gate | Value | Pass |
|---|---|---|
| changed px outside remove zones | 0 | True |
| changed px in protected box `face_daniel` | 0 | True |
| changed px in protected box `face_nik` | 0 | True |
| changed px in protected box `pack_daniel` | 0 | True |
| changed px in protected box `pack_nik` | 0 | True |
| zone `rect[0,22,888,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,22,888,78]`: mean lum inside / 12 px ring | 40.11 / 45.77 = 0.8764 | True |
| zone `rect[1192,22,1398,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1192,22,1398,78]`: mean lum inside / 12 px ring | 35.53 / 49.02 = 0.7249 | True |
| zone `rect[1400,6,1528,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1400,6,1528,78]`: mean lum inside / 12 px ring | 70.11 / 71.8 = 0.9765 | True |
| zone `rect[458,92,1070,298]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[458,92,1070,298]`: mean lum inside / 12 px ring | 59.07 / 54.38 = 1.0863 | True |
| zone `rect[552,306,980,388]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[552,306,980,388]`: mean lum inside / 12 px ring | 31.76 / 28.88 = 1.1 | True |
| zone `rect[680,405,850,555]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[680,405,850,555]`: mean lum inside / 12 px ring | 48.4 / 44.0 = 1.0999 | True |
| zone `rect[556,572,980,628]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[556,572,980,628]`: mean lum inside / 12 px ring | 94.02 / 96.89 = 0.9703 | True |
| zone `rect[140,598,1400,742]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[140,598,1400,742]`: mean lum inside / 12 px ring | 63.08 / 57.35 = 1.1 | True |
| zone `rect[444,744,1086,806]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[444,744,1086,806]`: mean lum inside / 12 px ring | 42.41 / 38.48 = 1.1022 | True |
| zone `rect[0,812,1536,864]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,812,1536,864]`: mean lum inside / 12 px ring | 13.47 / 19.4 = 0.6941 | True |
| REF_GOAL_CLUB.jpg starts FF D8 FF | True | True |

## SHA-256

- `ENV_CLUB_PLATE_V1_1X.png` `24549db363c032ab37e8717649835cfe0f3f79a7778e0fd3ea84e1369f8ce76c`
- `ENV_CLUB_PLATE_V1_1X.webp` `398e74faeb18ab2df655122fa0f78e9737aad4c1eff1ba16d019a305f275c255`
- `ENV_CLUB_PLATE_V1_2X.png` `e46ac65feff4e80cab40d127c0f36e1ef53ac7c2cb31f6400b06c356caa62fc2`
- `ENV_CLUB_PLATE_V1_2X.webp` `fed849bbb2c9f239ae1561f57eb5b145e0e33a518fb7bfd0e424691c00cfd6ca`
- `REF_GOAL_CLUB.jpg` `4c0e66168a23241a1e14c0c7756a54b49fc5729029a246c51171d2f967b680f6`

REF_GOAL: byte copy of JPEG source; evidence/composition only, never shipped as product art.

Likeness is not judged: faces, hands and packs are original pixels by construction (hard restore).
