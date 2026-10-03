# Trophy Room phone asset recipes

Run from the repository root. These recipes reuse only the approved Trophy Room plate pixels; Daniel stays left and Nik stays right. The polygons are intentionally a little generous so `shared/tools/refine_cutout.py` can tighten the real silhouette without cutting into hair, hands or suits. Claude creates the PNG masters, rim masks and runtime WebP exports; workers do not commit generated binaries.

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/trophy-room/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_TR_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/trophy-room/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_TR_NIK_PHONE_V1 --rim
```

After edge refinement, export each runtime transparent WebP at about 1000 px tall, quality 85. Keep the lossless PNG masters and the rim outputs for Claude's proof/intake check.
