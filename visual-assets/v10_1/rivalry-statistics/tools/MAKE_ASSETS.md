# Rivalry Statistics · asset recipes

## JOB-117 / JOB-207 phone art (Claude, 2026-10-04 02:00 UTC)

```
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/rivalry-statistics/assets/phonemap.json --key cutouts.daniel_phone --output assets/OVL_RV_DANIEL_PHONE_V1 --rim
python3 visual-assets/v10_1/shared/tools/cutout.py --plate visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png --source-scale 2 --map visual-assets/v10_1/rivalry-statistics/assets/phonemap.json --key cutouts.nik_phone --output assets/OVL_RV_NIK_PHONE_V1 --rim
python3 project-documents/factory/tools/phone_art.py visual-assets/v10_1/rivalry-statistics RV visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.png
```

# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame

The cutout.py lines are the job's recipe; phone_art.py runs the same cut with edge refine, writes the runtime WebPs (≤ 60 KB) and the proof. 

## JOB-068 phone title (Claude, 2026-10-04)

Phone-sized brush title so first paint stays small (700 px wide, 39 KB instead of 251 KB):

```
python3 -c "from PIL import Image; im=Image.open('visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1.png').convert('RGBA'); w=700; im.resize((w,round(im.height*w/im.width)),Image.LANCZOS).save('visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp',quality=82,method=6)"
```
