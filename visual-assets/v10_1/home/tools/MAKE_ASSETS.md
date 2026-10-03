# Home phone assets

Job 111 recipe. The approved source for both manager cut-outs is only `visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.png`. Do not use GOAL_HOME.jpg or a mockup as source pixels. Daniel stays left; Nik stays right; never mirror.

## Cut-outs

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/home/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_HOME_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/home/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_HOME_NIK_PHONE_V1 --rim
```

The polygons use 1X plate coordinates. Keep the traced jacket, shoulders, arms, hands and hair silhouette; do not add stadium glow or sparkles inside the contour.

## Required bottom fade

After `cutout.py` produces each PNG master, apply a linear alpha-only fade over the lower 18% of the plate to the cut-out and its rim. At 1X fade from y=772 at full existing alpha to y=941 at alpha 0. At 2X fade from y=1544 to y=1882. Preserve RGB and all alpha above the fade start. Export the final transparent runtime WebP at quality 85, approximately 1000 px tall, from the faded master.

The approved portrait background is already on the branch as `assets/ENV_HOME_PHONE_V1.webp` plus its PNG master; steps 2–4 need no new image generation.
