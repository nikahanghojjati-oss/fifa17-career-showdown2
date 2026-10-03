# Season Results generated assets

Run from repository root. Do not hand-edit the generated overlays.

## Character depth overlays

Daniel remains LEFT and Nik remains RIGHT. These use the approved 2X plate and 1X polygon coordinates from `assets/platemap.json`.

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/season-results/assets/platemap.json \
  --key cutouts.daniel_hand_and_forearm \
  --output visual-assets/v10_1/season-results/assets/OVL_SR_DANIEL_HAND_V1 \
  --rim

python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/season-results/assets/platemap.json \
  --key cutouts.nik_hand_and_forearm \
  --output visual-assets/v10_1/season-results/assets/OVL_SR_NIK_HAND_V1 \
  --rim
```

The shared tool produces transparent PNG masters at 1X and 2X plus matching rim masks. Convert those eight PNGs to transparent runtime WebP without changing dimensions or registration:

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

root = Path("visual-assets/v10_1/season-results/assets")
stems = [
    "OVL_SR_DANIEL_HAND_V1_1X",
    "OVL_SR_DANIEL_HAND_V1_2X",
    "OVL_SR_DANIEL_HAND_V1_RIM_1X",
    "OVL_SR_DANIEL_HAND_V1_RIM_2X",
    "OVL_SR_NIK_HAND_V1_1X",
    "OVL_SR_NIK_HAND_V1_2X",
    "OVL_SR_NIK_HAND_V1_RIM_1X",
    "OVL_SR_NIK_HAND_V1_RIM_2X",
]
for stem in stems:
    src = root / f"{stem}.png"
    dst = root / f"{stem}.webp"
    with Image.open(src) as im:
        im.save(dst, "WEBP", lossless=True, method=6)
        print(dst, im.size)
PY
```

Expected runtime files:

```text
assets/OVL_SR_DANIEL_HAND_V1_1X.webp
assets/OVL_SR_DANIEL_HAND_V1_2X.webp
assets/OVL_SR_DANIEL_HAND_V1_RIM_1X.webp
assets/OVL_SR_DANIEL_HAND_V1_RIM_2X.webp
assets/OVL_SR_NIK_HAND_V1_1X.webp
assets/OVL_SR_NIK_HAND_V1_2X.webp
assets/OVL_SR_NIK_HAND_V1_RIM_1X.webp
assets/OVL_SR_NIK_HAND_V1_RIM_2X.webp
```

The full-canvas overlays stay registered at (0,0). Do not crop or add placement offsets. CSS supplies the contact shadows and directional rim tint.
