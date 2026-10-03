# Final Winner · MAKE_ASSETS

JOB-082 Step 8 is recipe-only. Do not hand-edit or mirror either manager. Run from the repository root after reviewing the committed polygons in `visual-assets/v10_1/trophy-room/assets/platemap.json`.

The source is the approved 2X Trophy Room plate. Both cutout outputs are full-canvas registered overlays. The shared tool also emits neutral rim masks.

```sh
mkdir -p visual-assets/v10_1/final-winner/assets

python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/trophy-room/assets/platemap.json \
  --key cutouts.final_winner_daniel_near_arm \
  --output visual-assets/v10_1/final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1 \
  --rim

python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/trophy-room/assets/platemap.json \
  --key cutouts.final_winner_nik_near_arm \
  --output visual-assets/v10_1/final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1 \
  --rim
```

Convert the generated straight-alpha PNG masters to lossless runtime WebP without resizing or changing registration:

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

root = Path("visual-assets/v10_1/final-winner/assets")
stems = (
    "OVL_FW_DANIEL_NEAR_ARM_V1_1X",
    "OVL_FW_DANIEL_NEAR_ARM_V1_2X",
    "OVL_FW_DANIEL_NEAR_ARM_V1_RIM_1X",
    "OVL_FW_DANIEL_NEAR_ARM_V1_RIM_2X",
    "OVL_FW_NIK_NEAR_ARM_V1_1X",
    "OVL_FW_NIK_NEAR_ARM_V1_2X",
    "OVL_FW_NIK_NEAR_ARM_V1_RIM_1X",
    "OVL_FW_NIK_NEAR_ARM_V1_RIM_2X",
)
for stem in stems:
    src = root / f"{stem}.png"
    dst = root / f"{stem}.webp"
    with Image.open(src) as image:
        image.save(dst, "WEBP", lossless=True, method=6)
        print(dst)
PY
```

Claude intake checks before accepting the assets:

- Daniel remains left and Nik remains right; no transform or mirroring.
- Every PNG/WebP is full canvas: 1672×941 for 1X and 3344×1882 for 2X.
- Generated alpha follows the actual arm/hand silhouette; protected boxes are not used as masks.
- Inspect skin, jacket edge and artificial closing edges at 100%, 200% and 400% over black, warm glass and neutral light.
- Reject matte rings, colour speckle, jagged fingertips, registration seams, or any cutout edge that crosses opaque UI.
- Keep rim light directional and subtle; it must not look like a full outline.
- The Final Winner hero trophy remains below the cutout layer and above the stadium/atmosphere.

After those checks pass, change into `visual-assets/v10_1/final-winner`. The preview builder inlines the finished WebPs, shared CSS/JS, fixture data and screen code into `preview.html`. Run this as the final recipe command:

python3 tools/build_preview.py