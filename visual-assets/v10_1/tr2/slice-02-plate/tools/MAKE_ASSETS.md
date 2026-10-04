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

## Step 5 · 393 × 660 phone proof

Use `assets/phonemap.json > phone_frame` as the composition authority: portrait background cover, Daniel left at 14% x / 56% frame height, Nik right at 84% x / 52% frame height, both faces fully clear, and the lower scrim beginning at 34% frame height and reaching 96% opacity by 54%.

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame


## JOB-050 step 3 · Runtime consumption contract

The cut-out commands above are also the JOB-050 fallback recipe if either runtime WebP is absent when Claude intakes the screen. No additional binary is produced by the worker chat.

CSS consumes `assets/phonemap.json > phone_frame` exactly:

- background: cover, 50% x / 43% y, hero zone through 55% of the frame
- Daniel: left, center x 14%, top 1.5%, height 56%
- Nik: right, center x 84%, top 1.5%, height 52%
- lower scrim: begins at 34%, reaches 96% opacity by 54%, and sits below both hero layers
- neither hero is mirrored; both heads remain fully visible
- the `--rim` cut-out recipe supplies the edge light; CSS adds only a soft contact shadow

Phone first-paint art budget uses the intake caps: `233,908 + 61,440 + 61,440 = 356,788 bytes` (348.43 KiB), below both the 350 KiB JOB-114 intake cap and JOB-050's 450 KB ceiling.
