# Intake report · LEAGUE · PASS

Brief: `visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md` (R3.2). Script: `tools/intake_hlc.py`. Evidence: `evidence/intake_league.json`, `evidence/intake_league.jpg` (original | locked, 1X).

- Base SHA (`claude-cloud/transfer-tr2-plate-g`): `8fbda036c1d1f7910631964e982705d0f25290c0`
- Inputs ref: `claude-cloud/hlc-goals`
- Goal: `visual-assets/goals/GOAL_LEAGUE_LOGOS_BLURRED.jpg` 1536x864, sha256 `0f5efc36a02343050a06efee4b38f24725da0cca8dccfaffe9951da99aa2b6fa`
- Edit: `visual-assets/goals/plates-in/ENV_LEAGUE_PLATE_V1.png` 1672x941, sha256 `016fdc50b70f7cd8712b2a0bceca6124bc82371d15edaea58595a27aa9f13901` (Lanczos-resized to 1536x864)
- Framing: method `lanczos_resize`, aligned-crop error 0.68 px (tolerance 4 px) -> PASS
- Plate sizes: 1X 1536x864, 2X 3072x1728

## Tone match (owner instruction, Nik 2026-10-01; added to the R3.2 method)

Zones failing the unchanged 1.15 gate are darkened toward their 12 px ring (24 px feather inside the zone edge) to ratio <= 1.10. Protected boxes, keep rects and pixels outside zones are never touched.

| Pass | Zone | Ratio before | Scale | Ratio after |
|---|---|---|---|---|
| 1 | `rect[470,88,1062,246]` | 1.2474 | 0.85 | 1.0995 |
| 1 | `rect[36,642,290,774]` | 1.2146 | 0.8836 | 1.1 |
| 1 | `rect[498,740,1014,808]` | 1.2714 | 0.7921 | 1.1 |
| 1 | `circle[762,496,250]` | 1.8467 | 0.5572 | 1.1 |
| 2 | `rect[498,740,1014,808]` | 1.1576 | 0.9199 | 1.1 |

## Gate counts

| Gate | Value | Pass |
|---|---|---|
| changed px outside remove zones | 0 | True |
| changed px in protected box `face_daniel` | 0 | True |
| changed px in protected box `face_nik` | 0 | True |
| changed px in protected box `hand_daniel` | 0 | True |
| changed px in protected box `hand_nik` | 0 | True |
| changed px in keep rect `[440, 425, 560, 480]` | 0 | True |
| zone `rect[0,22,888,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,22,888,78]`: mean lum inside / 12 px ring | 48.38 / 43.43 = 1.114 | True |
| zone `rect[1192,22,1398,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1192,22,1398,78]`: mean lum inside / 12 px ring | 37.62 / 47.56 = 0.791 | True |
| zone `rect[1400,6,1528,78]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1400,6,1528,78]`: mean lum inside / 12 px ring | 73.63 / 75.02 = 0.9815 | True |
| zone `rect[470,88,1062,246]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[470,88,1062,246]`: mean lum inside / 12 px ring | 56.65 / 50.67 = 1.1182 | True |
| zone `rect[36,642,290,774]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[36,642,290,774]`: mean lum inside / 12 px ring | 35.62 / 32.38 = 1.1 | True |
| zone `rect[1248,642,1502,774]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1248,642,1502,774]`: mean lum inside / 12 px ring | 23.71 / 25.29 = 0.9375 | True |
| zone `rect[498,740,1014,808]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[498,740,1014,808]`: mean lum inside / 12 px ring | 72.49 / 65.9 = 1.1 | True |
| zone `rect[0,812,1536,864]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,812,1536,864]`: mean lum inside / 12 px ring | 30.81 / 31.65 = 0.9735 | True |
| zone `circle[762,496,250]`: guide-colour px within ±6 px of border | 0 | True |
| zone `circle[762,496,250]`: mean lum inside / 12 px ring | 90.17 / 81.63 = 1.1047 | True |
| REF_GOAL_LEAGUE.jpg starts FF D8 FF | True | True |

## SHA-256

- `ENV_LEAGUE_PLATE_V1_1X.png` `50b33f7fba1f0836edf88d513cd5cc38429c24bfc814ed9dbe42474f77065163`
- `ENV_LEAGUE_PLATE_V1_1X.webp` `d9fd67a604ed9e2a1e9dd202826c664aed22061fa53b127a6a6b8cd50060fae9`
- `ENV_LEAGUE_PLATE_V1_2X.png` `25a71a8ad91ba27a3a6127e23f0eda4c628fccf75f7e906817f0f3710e66581f`
- `ENV_LEAGUE_PLATE_V1_2X.webp` `fcb07fa4c01b07ef86b238d07d7584e476ba3e780bb76ac561cb0167661057b4`
- `REF_GOAL_LEAGUE.jpg` `0f5efc36a02343050a06efee4b38f24725da0cca8dccfaffe9951da99aa2b6fa`

REF_GOAL: byte copy of JPEG source; evidence/composition only, never shipped as product art.

Likeness is not judged: faces, hands and packs are original pixels by construction (hard restore).
