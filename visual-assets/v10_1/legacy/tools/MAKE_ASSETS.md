# JOB-072 · Legacy depth assets

Run from the repository root after the approved Legacy plate is present.

## Daniel foreground

python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/legacy/assets/platemap.json --key cutouts.daniel_foreground --output visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1 --rim

## Nik foreground

python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/legacy/assets/platemap.json --key cutouts.nik_foreground --output visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1 --rim

## Runtime exports and review

Export every generated 1X/2X foreground and rim PNG master to the matching transparent WebP filename referenced by index.html, quality 92. Keep the PNGs as masters.

Inspect both archive-edge silhouettes at 100%, 200% and 400%. Reject any background wedge over the panel, matte fringe, cut hand or visible artificial closure. Daniel stays LEFT and Nik stays RIGHT.

From visual-assets/v10_1/legacy, build the review page after the WebPs exist. The following command must remain the last line of this file.


## JOB-073 phone part 1

Phone art is already an approved JOB-118 intake, so this job does not regenerate or alter it. The responsive build references these committed WebPs through `<picture>`:

- `assets/ENV_LG_PHONE_V1.webp` — 206,320 B
- `assets/OVL_LG_DANIEL_PHONE_V1.webp` — 54,334 B, Daniel LEFT
- `assets/OVL_LG_NIK_PHONE_V1.webp` — 54,664 B, Nik RIGHT
- `assets/TITLE_LG_V1.webp` — 93,800 B

Approved phone art plus the brush title is 409,118 B, below the 450 KB phone H11 cap. Keep PNG masters out of runtime markup. The hero placement authority is `assets/phonemap.json`: Daniel `left:-6%; top:4%; height:49%`, Nik `left:47%; top:3%; height:50%`, background `object-position:50% 36%`.

The phone cut-outs already include the JOB-118 bottom alpha fade. Do not cut or mirror them again; the CSS adds only a soft black contact shadow and subtle warm rim.

python3 tools/build_preview.py
