# Club Assignment phone assets

Run these commands from the repository root. Geometry comes from `assets/phonemap.json` in 1X plate pixels. Runtime art is WebP only; PNG files below are build masters and must never be loaded by `index.html`.

## Phone hero cut-outs

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/club/assets/phonemap.json --key cutouts.daniel_phone --output visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_PHONE_MASTER --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/club/assets/phonemap.json --key cutouts.nik_phone --output visual-assets/v10_1/club/assets/OVL_CLUB_NIK_PHONE_MASTER --rim
```

Crop each 2X master to its alpha bounding box and export the runtime transparent WebP. Preserve aspect ratio and never mirror.

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

root = Path("visual-assets/v10_1/club/assets")
for stem in ("DANIEL", "NIK"):
    src = root / f"OVL_CLUB_{stem}_PHONE_MASTER_2X.png"
    dst = root / f"OVL_CLUB_{stem}_PHONE_V1.webp"
    with Image.open(src).convert("RGBA") as im:
        box = im.getbbox()
        if not box:
            raise SystemExit(f"empty cut-out: {src}")
        crop = im.crop(box)
        crop.save(dst, "WEBP", quality=85, method=6, exact=True)
        print(dst, dst.stat().st_size, crop.size)
PY
```

Each runtime hero WebP must be ≤54,000 bytes. If one exceeds the cap, lower only that file's WebP quality enough to fit; do not resize, blur, mirror or alter the approved plate pixels. Inspect hair, beard, suit, fingers and the held pack at 400% against black, warm glass and neutral light backgrounds. The cut-out polygons include the held pack area inside each manager silhouette.

## Runtime phone composition

The screen references these files directly:

```text
visual-assets/v10_1/club/assets/ENV_CLUB_PHONE_V1.webp
visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_PHONE_V1.webp
visual-assets/v10_1/club/assets/OVL_CLUB_NIK_PHONE_V1.webp
```

Use `phonemap.json > phone_frame` without improvising: background cover at 50% 45%; Daniel left at 31% frame centre, 3% top, 56% frame height; Nik right at 69%, 2% top, 57% height. The bottom scene scrim begins at 52%. Runtime hard cap is 348,506 bytes: 240,506-byte background plus two heroes capped at 54,000 bytes each.

## Phone proof

Claude composites `PHONE_PROOF.png` at 393 × 660, rendered at 3×, from the same `phone_frame` geometry. The proof is QA-only and must not be referenced by runtime HTML.
