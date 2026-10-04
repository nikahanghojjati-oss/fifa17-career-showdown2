# Rivalry Statistics · asset recipes

## JOB-117 / JOB-207 phone art (Claude, 2026-10-04 02:00 UTC)

```
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/rivalry-statistics/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_RV_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/rivalry-statistics/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_RV_NIK_PHONE_V1 --rim
python3 project-documents/factory/tools/phone_art.py visual-assets/v10_1/rivalry-statistics RV visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png
```

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame

The cutout.py lines are the job's recipe; phone_art.py runs the same cut with edge refine, writes the runtime WebPs (≤ 60 KB) and the proof. 
