# League phone art asset recipe

Factory job 112. Claude runs these recipes after the worker-authored maps are committed. Do not mirror either manager.

## Phone character cut-outs

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/league/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_LEAGUE_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/league/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_LEAGUE_NIK_PHONE_V1 --rim
```

Use the PNG masters from the cut-out tool to make the runtime transparent WebP files at quality 85, targeting about 1000 px character height. Keep Daniel left and Nik right; preserve the source pixels and soft hair edges.

## Phone composition proof

Use `assets/phonemap.json > phone_frame` as the composition authority. Background is cover-fit; character placement percentages apply to each cut-out's transparent-trimmed alpha bounds so the visible figure heights match the map.

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame
