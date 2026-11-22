# Standings · asset recipes

JOB-127 makes no new image files. Standings reuses finished art:

- Desktop plate: `visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp` and `_2X.webp`, drawn through the stage engine (cover, centred, no zoom, no shift).
- Phone art: `ENV_RV_PHONE_V1.webp`, `OVL_RV_DANIEL_PHONE_V1.webp`, `OVL_RV_NIK_PHONE_V1.webp` from the same folder.
- Brush title: `visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V1.webp` (job 124).

Later parts (depth cut-outs over the board edge) will add recipes here.

Review page: `python3 visual-assets/v10_1/standings/tools/build_preview.py` writes `preview.html` with buttons SD1 to SD9.

## JOB-202: depth sandwich

no cut-outs needed. The board sits between the managers: Daniel's pointing hand ends at about x 285 of 1366 and the board starts at 377; Nik's arms start at about x 1040 and the board ends at 989. Nothing overlaps, so there is no polygon in platemap.json.

## JOB-203 / JOB-204: phone and preview

No new files. Phone art is the Rivalry phone WebP set (see above). `tools/build_preview.py` (SD1 to SD9 buttons) writes `preview.html`; Claude runs it.
