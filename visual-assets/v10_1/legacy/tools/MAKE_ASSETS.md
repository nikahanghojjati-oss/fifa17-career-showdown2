# JOB-072 · Legacy depth assets

Run from the repository root after the approved Legacy plate is present. These commands only derive registered overlays from the existing plate; they do not generate or repaint people.

## Daniel foreground

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/legacy/assets/platemap.json \
  --key cutouts.daniel_foreground \
  --output visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1 \
  --rim
```

## Nik foreground

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/legacy/assets/platemap.json \
  --key cutouts.nik_foreground \
  --output visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1 \
  --rim
```

## Runtime WebP exports

Keep the PNG outputs as lossless masters and make transparent runtime WebPs:

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

assets = Path("visual-assets/v10_1/legacy/assets")
stems = [
    "OVL_LG_DANIEL_FOREGROUND_V1_1X",
    "OVL_LG_DANIEL_FOREGROUND_V1_2X",
    "OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X",
    "OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X",
    "OVL_LG_NIK_FOREGROUND_V1_1X",
    "OVL_LG_NIK_FOREGROUND_V1_2X",
    "OVL_LG_NIK_FOREGROUND_V1_RIM_1X",
    "OVL_LG_NIK_FOREGROUND_V1_RIM_2X",
]
for stem in stems:
    src = assets / f"{stem}.png"
    dst = assets / f"{stem}.webp"
    with Image.open(src) as im:
        im.save(dst, "WEBP", quality=92, method=6, exact=True)
    print(dst)
PY
```

Claude: inspect the archive-edge silhouettes at 100%, 200% and 400%. Reject any background wedge over the panel, matte fringe, cut hand, or visible artificial closure. Daniel stays LEFT and Nik RIGHT.
