# Start / Join asset recipe

Run from the repository root. These commands reuse the approved Start / Join plate pixels; they do not generate new character art.

## Daniel pointing-hand depth overlay

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/start-join/assets/ENV_SJ_PLATE_V1_2X.png \
  --source-scale 2 \
  --map visual-assets/v10_1/start-join/assets/platemap.json \
  --key cutouts.daniel_pointing_hand \
  --output visual-assets/v10_1/start-join/assets/OVL_SJ_DANIEL_HAND_V1 \
  --rim
```

The shared cutout tool writes registered PNG masters at 1X and 2X plus rim masks. Export transparent lossless WebP runtime layers without changing canvas size or registration:

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

assets = Path("visual-assets/v10_1/start-join/assets")
stems = [
    "OVL_SJ_DANIEL_HAND_V1_1X",
    "OVL_SJ_DANIEL_HAND_V1_2X",
    "OVL_SJ_DANIEL_HAND_V1_RIM_1X",
    "OVL_SJ_DANIEL_HAND_V1_RIM_2X",
]
for stem in stems:
    src = assets / f"{stem}.png"
    dst = assets / f"{stem}.webp"
    with Image.open(src) as im:
        im.save(dst, "WEBP", lossless=True, method=6, exact=True)
    print(dst)
PY
```

Expected runtime files referenced by the Start / Join build:

```text
assets/OVL_SJ_DANIEL_HAND_V1_1X.webp
assets/OVL_SJ_DANIEL_HAND_V1_2X.webp
assets/OVL_SJ_DANIEL_HAND_V1_RIM_1X.webp
assets/OVL_SJ_DANIEL_HAND_V1_RIM_2X.webp
```

Registration rule: every overlay is a full 1672 × 941 logical canvas at 1X, or 3344 × 1882 at 2X, and must remain at scene origin (0,0). Do not add a placement offset, mirror, rotate, or independently scale Daniel.

## Claude intake finish

Ticket 124 remains the authority for the missing CONNECT PLAYERS brush wordmark. Do not use the existing TITLE_SJ_V1.webp because it spells PRIVATE REMOTE JOINING. After the correct wordmark is committed, replace the TODO-WORDMARK display-font fallback in index.html without changing the hidden semantic title.

After the four Daniel hand/rim WebPs above and the correct wordmark are present, build the single-file review page from the Start / Join folder:

cd visual-assets/v10_1/start-join
python3 tools/build_preview.py

## JOB-120 / JOB-209 phone art (Claude, 2026-10-04 02:00 UTC)

```
python3 project-documents/factory/tools/plate_detext.py visual-assets/v10_1/start-join SJ /tmp/clean_SJ.png
python3 visual-assets/v10_1/shared/tools/cutout.py --plate /tmp/clean_SJ.png --source-scale 2 --map visual-assets/v10_1/start-join/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_SJ_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate /tmp/clean_SJ.png --source-scale 2 --map visual-assets/v10_1/start-join/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_SJ_NIK_PHONE_V1 --rim
python3 project-documents/factory/tools/phone_art.py visual-assets/v10_1/start-join SJ /tmp/clean_SJ.png
```

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame

The cutout.py lines are the job's recipe; phone_art.py runs the same cut with edge refine, writes the runtime WebPs (≤ 60 KB) and the proof. plate_detext.py first paints the baked name labels off the shoulders (boxes in phonemap.json > label_text_boxes). 

## JOB-088 phone

No new files: the phone page uses `ENV_SJ_PHONE_V1.webp`, `OVL_SJ_DANIEL_PHONE_V1.webp` and `OVL_SJ_NIK_PHONE_V1.webp` from JOB-120 / JOB-209. The title is still the display-font fallback (TODO-WORDMARK, ticket 124).
