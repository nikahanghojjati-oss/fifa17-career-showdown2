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

## Build review preview

After the generated runtime WebPs exist, change into `visual-assets/v10_1/season-results` and build the self-contained Claude review file. Do not render or screenshot it in the worker chat.

python3 tools/build_preview.py

## JOB-119 / JOB-208 phone art (Claude, 2026-10-04 02:00 UTC)

```
python3 project-documents/factory/tools/plate_detext.py visual-assets/v10_1/season-results SR /tmp/clean_SR.png
python3 visual-assets/v10_1/shared/tools/cutout.py --plate /tmp/clean_SR.png --source-scale 2 --map visual-assets/v10_1/season-results/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_SR_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate /tmp/clean_SR.png --source-scale 2 --map visual-assets/v10_1/season-results/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_SR_NIK_PHONE_V1 --rim
python3 project-documents/factory/tools/phone_art.py visual-assets/v10_1/season-results SR /tmp/clean_SR.png
```

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame

The cutout.py lines are the job's recipe; phone_art.py runs the same cut with edge refine, writes the runtime WebPs (≤ 60 KB) and the proof. plate_detext.py first paints the baked name labels off the shoulders (boxes in phonemap.json > label_text_boxes). The two WebPs also carry a 16 % bottom alpha fade, because the plate cuts both figures flat at the grass line. 
