# Intake report · HOME · PASS

Brief: `visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md` (R3.2). Script: `tools/intake_hlc.py`. Evidence: `evidence/intake_home.json`, `evidence/intake_home.jpg` (original | locked, 1X).

- Base SHA (`claude-cloud/transfer-tr2-plate-g`): `8fbda036c1d1f7910631964e982705d0f25290c0`
- Inputs ref: `claude-cloud/hlc-goals`
- Goal: `visual-assets/goals/GOAL_HOME.png` 1672x941, sha256 `9272f8921535b07841033781d024f1bf3f20647846cc89146878c999a4ca67f6`
- Edit: `visual-assets/goals/plates-in/ENV_HOME_PLATE_V1.png` 1672x941, sha256 `45e0b49b7e8fb79f4673eeca0c92b0fc20e4b84b18413887543dbdd096f9fe4a` (Lanczos-resized to 1672x941)
- Framing: method `lanczos_resize`, aligned-crop error 0.63 px (tolerance 4 px) -> PASS
- Plate sizes: 1X 1672x941, 2X 3344x1882

## Tone match (owner instruction, Nik 2026-10-01; added to the R3.2 method)

Zones failing the unchanged 1.15 gate are darkened toward their 12 px ring (24 px feather inside the zone edge) to ratio <= 1.10. Protected boxes, keep rects and pixels outside zones are never touched.

| Pass | Zone | Ratio before | Scale | Ratio after |
|---|---|---|---|---|
| 1 | `rect[30,684,1640,866]` | 1.2632 | 0.8533 | 1.1 |

## Gate counts

| Gate | Value | Pass |
|---|---|---|
| changed px outside remove zones | 0 | True |
| changed px in protected box `face_daniel` | 0 | True |
| changed px in protected box `face_nik` | 0 | True |
| changed px in protected box `hand_daniel` | 0 | True |
| changed px in protected box `hand_nik` | 0 | True |
| zone `rect[0,22,968,84]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,22,968,84]`: mean lum inside / 12 px ring | 55.66 / 57.59 = 0.9666 | True |
| zone `rect[1305,22,1520,88]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1305,22,1520,88]`: mean lum inside / 12 px ring | 48.39 / 55.87 = 0.8661 | True |
| zone `rect[1522,4,1662,84]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1522,4,1662,84]`: mean lum inside / 12 px ring | 49.27 / 82.28 = 0.5988 | True |
| zone `rect[40,118,605,398]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[40,118,605,398]`: mean lum inside / 12 px ring | 54.4 / 61.54 = 0.8841 | True |
| zone `rect[140,398,530,540]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[140,398,530,540]`: mean lum inside / 12 px ring | 67.21 / 74.5 = 0.9022 | True |
| zone `rect[35,535,530,678]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[35,535,530,678]`: mean lum inside / 12 px ring | 65.9 / 63.88 = 1.0316 | True |
| zone `rect[1068,492,1636,662]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[1068,492,1636,662]`: mean lum inside / 12 px ring | 23.27 / 29.44 = 0.7906 | True |
| zone `rect[30,684,1640,866]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[30,684,1640,866]`: mean lum inside / 12 px ring | 41.54 / 37.76 = 1.1 | True |
| zone `rect[0,876,1672,941]`: guide-colour px within ±6 px of border | 0 | True |
| zone `rect[0,876,1672,941]`: mean lum inside / 12 px ring | 13.98 / 38.23 = 0.3656 | True |
| REF_GOAL_HOME.jpg starts FF D8 FF | True | True |

## SHA-256

- `ENV_HOME_PLATE_V1_1X.png` `9cf0239ea765cb4dfdaef63b2a9e1cc258a153e4bce882aef3a4dc73e456479b`
- `ENV_HOME_PLATE_V1_1X.webp` `1e2aca74e00117e14b0f190b01b986111f4385fecd1fb31d226a8160b33ccd04`
- `ENV_HOME_PLATE_V1_2X.png` `ca48638f2201c6cdce4b1e79575cd6c2b2d142e7a3cfddbeb3bf160ed96a7512`
- `ENV_HOME_PLATE_V1_2X.webp` `d633341e8bbf843c4255dd302960b7205f43d71b55cd81754bbffbafcc853323`
- `REF_GOAL_HOME.jpg` `48b7157cd01496e5fa248764048afffce09878b52503da09e3402944bd712819`

REF_GOAL: PNG converted to real JPEG (q95, 4:4:4); evidence/composition only, never shipped as product art.

## Wordmark

- source 2081x755 sha256 `87b4cdb6d829b73a08457fc3f677ec7af7017a0e2f92b898a8a03df298ed9620`; fully transparent 38.5 % -> PASS
- trimmed to content + 8 px, clipped to the source canvas: box [0, 0, 2078, 755], size 2078x755
- `LOGO_CM17_WORDMARK_V1.png` `814d2e61f80b61dc6a98626fc939cdcaff7a995f27924b41e7d207251276e669`
- `LOGO_CM17_WORDMARK_V1.webp` `8d32911a86f2aae8b884d3b99f99ca78f3c09b0c8581dcfbfeafdfe0aec961d7`
- Spelling confirmed correct by Nik and Claude (2026-10-01).

Likeness is not judged: faces, hands and packs are original pixels by construction (hard restore).

## JOB-031 source seam repair (2026-10-02)

- Restored the pre-JOB-031 plate, then repaired only D2/D3/D5/D6/D7 edge bands. Each edge uses the 12 px outside ring as the target; RGB mean and local variance are matched per edge position, smoothed tangentially, and feathered 28 px into the generated side.
- D1 and D4 were runtime broad-blur/darken artifacts, so they are fixed by retiring those runtime mends rather than repainting broad source rectangles.
- Protected face/hand pixels and every 1X pixel outside the remove-zone union are byte-identical to the pre-JOB-031 plate.

### Current plate SHA-256

- `ENV_HOME_PLATE_V1_1X.png` `fc0d10ccfa994517844ee4e690c20315a44a97b0733e4491a9a37c92035360d3`
- `ENV_HOME_PLATE_V1_1X.webp` `3c35391805507bf8910f36f98147cd8383e4944eeb999021661d6d7030d30c39`
- `ENV_HOME_PLATE_V1_2X.png` `ebba497bf337f7eb9fbf625a5cde3c68b633c3c8df695723b877ba2e91bec34f`
- `ENV_HOME_PLATE_V1_2X.webp` `aed61ed9d6e10cbaead7251539e188101bc1371d83639b2ab6953dae875274f9`

