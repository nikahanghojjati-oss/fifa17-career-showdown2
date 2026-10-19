# Career Statistics phone asset recipe

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/career-statistics/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_CS_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/career-statistics/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_CS_NIK_PHONE_V1 --rim
```

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame

## JOB-063 phone runtime contract

The two cut-out commands above are also the build dependency for the phone composition. If either runtime WebP is absent, Claude runs those commands before browser intake.

- Background: `ENV_CS_PHONE_V1.webp`, cover at `50% 36%`.
- Daniel: `OVL_CS_DANIEL_PHONE_V1.webp`, left `-3%`, top `1%`, height `61%`.
- Nik: `OVL_CS_NIK_PHONE_V1.webp`, left `48%`, top `0%`, height `62%`.
- Hero zone bottom: `55%`; darkening gradient begins at `48%`.
- Planned phone art: background 142,870 bytes + two cut-outs capped at 60,000 bytes each = 262,870 bytes.
- With `TITLE_CS_V1.webp` (77,696 bytes) and the shared Showdown Champion button art (43,896 bytes), planned image first paint is at most 384,462 bytes, leaving 76,338 bytes under the 450 KB image budget before Claude's network-level H11 measurement.
