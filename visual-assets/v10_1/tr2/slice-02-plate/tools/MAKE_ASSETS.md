# JOB-114 phone art asset recipe

Run from the repository root. This file is recipe-only: Claude creates the PNG/WebP cut-outs and proof; this project chat does not create binary outputs.

## Step 1 · Transfer War phone cut-outs

DEFAULT: JOB-114 names `assets/platemap.json`, but the branch's authoritative plate map is `visual-assets/v10_1/tr2/slice-02-plate/platemap.json`. The phone-specific map therefore lives at the job-named `assets/phonemap.json` and carries the same 1672 × 941 1X coordinate system.

DEFAULT: the job text shortens `--output` to `assets/...`; these repo-root commands use the full screen-local output path so they are directly runnable without changing directories.

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.png --source-scale 2 --map visual-assets/v10_1/tr2/slice-02-plate/assets/phonemap.json --key cutouts.daniel_phone --output visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.png --source-scale 2 --map visual-assets/v10_1/tr2/slice-02-plate/assets/phonemap.json --key cutouts.nik_phone --output visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_NIK_PHONE_V1 --rim
```

Claude tightens the generous contours to the real person before final export. Preserve original pixels, Daniel left, Nik right, and never mirror either figure.
