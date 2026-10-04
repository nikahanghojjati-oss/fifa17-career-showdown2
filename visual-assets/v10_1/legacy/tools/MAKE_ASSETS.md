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

python3 tools/build_preview.py
