# Phone art intake · Career Statistics · JOB-116

Purpose: record the Career Statistics phone-art runtime budget and Claude-generated proof inputs.

## Runtime weight budget

| File | Status | Size / budget | Encoding |
| --- | --- | ---: | --- |
| `ENV_CS_PHONE_V1.webp` | Measured by Claude | 142,870 bytes | WebP, quality 80, 1179 × 2096 |
| `OVL_CS_DANIEL_PHONE_V1.webp` | Budget until MAKE_ASSETS.md runs | ≤ 60,000 bytes | WebP, quality 85 |
| `OVL_CS_NIK_PHONE_V1.webp` | Budget until MAKE_ASSETS.md runs | ≤ 60,000 bytes | WebP, quality 85 |

Maximum planned runtime total: 262,870 bytes.

Factory cap: 350,000 bytes.

Planned headroom: 87,130 bytes.

DEFAULT: each phone cut-out is capped at 60 KB at quality 85, as specified by JOB-116 step 6. The QA proof is not a runtime payload and is excluded from the 350 KB runtime total.

## Proof artifact

| File | Status | Size |
| --- | --- | ---: |
| `PHONE_PROOF.png` | Claude composites from `phonemap.json > phone_frame` after MAKE_ASSETS.md runs | Fill after generation |

## SHA-256 intake

Claude fills these after the asset recipe runs:

- `ENV_CS_PHONE_V1.webp`: SHA-256: ________________________________
- `OVL_CS_DANIEL_PHONE_V1.webp`: SHA-256: ________________________________
- `OVL_CS_NIK_PHONE_V1.webp`: SHA-256: ________________________________
- `PHONE_PROOF.png`: SHA-256: ________________________________

## Composition source

`phonemap.json` is the authority for the 393 × 660 phone proof: Daniel remains left, Nik remains right, both hero heads stay inside the upper 55% zone, and the bottom stadium area is darkened for live UI.
