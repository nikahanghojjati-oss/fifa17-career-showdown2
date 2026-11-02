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

## Phone proof

Use `phone_frame` in `assets/phonemap.json` as the single composition authority. Cover the 393 × 660 frame with the portrait background, place Daniel's alpha-bbox on the left and Nik's on the right at the recorded percentages, preserve their unmirrored pixels, then apply the recorded dark bottom gradient above any lower UI.

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame


## Job 33 runtime handoff

The phone Home now references both runtime cut-outs through picture elements. The files are not on the branch yet. The two existing commands in the Cut-outs section above are therefore the Job 33 missing-asset DEFAULT and Claude must run them before browser intake.

Keep the lower-18% alpha fade and WebP quality-85 export rules above. Runtime placement is not guessed: phonemap.json phone_frame remains authoritative at 393 x 660. Daniel stays left with alpha-bbox centre x 31%, top 0.5%, height 58%. Nik stays right with alpha-bbox centre x 68%, top -0.5%, height 61%. Do not mirror either manager.

Job 33 first-paint phone hero bundle budget is the Job 111 intake budget: 132,124-byte portrait background plus two cut-outs capped at 60,000 bytes each, for at most 252,124 bytes. This is below the 450 KB Job 33 ceiling. PNG masters and PHONE_PROOF.png are never runtime-loaded.
