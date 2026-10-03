# Club Assignment phone assets

Run the cut-out recipes after `phonemap.json` is committed. The source geometry is in 1X plate pixels; the tool reads the approved 2X Club plate and preserves full-canvas registration.

## Phone hero cut-outs

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/club/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_CLUB_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/club/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_CLUB_NIK_PHONE_V1 --rim
```

The polygons follow the whole visible figure in the approved Club plate, including the held pack area that lies inside each figure silhouette. Daniel remains left and Nik remains right. Do not mirror either cut-out. Review hair separately against the cut-out standard before runtime export; the final WebP target is about 1000 px tall at quality 85.

## Phone proof

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame
