# P4 run sheet: hero faces

Nik's pick (2026-11-26 04:32 UTC): all 12 board items, board order. One ticket per asset per option; each option in its own new chat (ChatGPT Work mode, Astra 6, Extra High). Inputs live on branch `claude-duet/p4-faces-inputs` (never merged); SHA-256 in each input folder.

## F-1 Legacy and Trophy Room, Nik (desktop master)
Source: `visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp` (Wooden, 3072x1728) as PNG. Image 2 = Nik's face from the Home anchor `ENV_HOME_PLATE_HC_V3_2X`. Result saves as `ENV_ARCHIVE_PLATE_HC_V4_2X` (RAW kept untouched as `..._F1<option>_RAW.png`). On return: align.py, likeness lock in Nik's hero zone (~6 px feather), never-slimmer mask check, score vs Home (pass 9/10).

### F-1 option A: Face shape only, words only (no Image 2): leaner cheeks and firmer jaw inside the same head and beard outline.
| Status | try 1 in 04:49 UTC (raw on claude-duet/p4-faces-inputs, sha 348ef68f): 5/10. Outline unchanged (never-slimmer pass), but the face is barely slimmer and the skin came back smoother and brighter. Fix 1 sent (same chat): visible cheek hollows, narrower jaw filled with his own beard, same skin brightness. |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-1/ENV_ARCHIVE_PLATE_HC_V3_2X.png
- Image 2: none
- Saves as: `ENV_ARCHIVE_PLATE_HC_V4_2X` (option A)

```
Image 1 is the picture to edit. Edit only the face of the bearded man on the right. Everything else in image 1 stays exactly as it is.

Keep the camera, framing and layout of image 1 exactly: the same 16:9 frame, the bronze counter rail at 56% of the height, nothing cropped, nothing moved.
Keep the man on the left exactly as he is: his face, curly black hair, light beard, dark pinstripe suit, open white shirt, the hand at his chin and his pose.
Keep the archive room exactly: the stone arches down the corridor, the glass display cases, the framed case with the old football on the left, the case with the rolled scroll on the right, the dark marble walls, the bronze rail and the black stone counter.

Change only the right man's face, inside his present head outline: make it leaner and firmer, like a fit man in his thirties. Less fleshy cheeks with a visible cheekbone, a firmer jaw angle under the beard, no puffiness under the eyes, no double chin. Keep his full, short, dark beard covering the same area as now, so the edge of his head and beard stays exactly where it is. Keep his short dark hair swept up, his dark brown eyes, his thick dark eyebrows, his nose, his skin tone, his calm half-smile and his gaze toward the left of the picture.
Keep his black suit, black shirt, black tie, shoulders, neck and body exactly as they are, the same size and in the same place.

Light: the same low, warm archive light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
Same framing as image 1, nothing cropped, the largest size available.
```

### F-1 option B: Face and beard matched to the Home face (Image 2); his hair and head outline kept.
| Status | not run |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-1/ENV_ARCHIVE_PLATE_HC_V3_2X.png
- Image 2: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-1/HOME_NIK_FACE_ANCHOR.png
- Saves as: `ENV_ARCHIVE_PLATE_HC_V4_2X` (option B)

```
Image 1 is the picture to edit. Image 2 is a close-up of the same bearded man who stands on the right of image 1; it only shows what his face looks like. Copy nothing else from image 2: not the hand, the pose, the light or the room.

Keep the camera, framing and layout of image 1 exactly: the same 16:9 frame, the bronze counter rail at 56% of the height, nothing cropped, nothing moved.
Keep the man on the left exactly as he is: his face, curly black hair, light beard, dark pinstripe suit, open white shirt, the hand at his chin and his pose.
Keep the archive room exactly: the stone arches down the corridor, the glass display cases, the framed case with the old football on the left, the case with the rolled scroll on the right, the dark marble walls, the bronze rail and the black stone counter.

Change only the right man's face and beard so they match image 2: the same face shape, cheeks, jaw, eyes, eyebrows, nose and mouth, and the same full, short, neatly trimmed dark beard. Keep his head turned the way it is now in image 1, his gaze toward the left of the picture and a calm half-smile. Keep his short dark hair exactly as it is in image 1. The edge of his head, beard, ears and neck stays where it is now or reaches very slightly further out, never further in.
Keep his black suit, black shirt, black tie, shoulders, neck and body exactly as they are, the same size and in the same place.

Light: the same low, warm archive light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
Same framing as image 1, nothing cropped, the largest size available.
```

### F-1 option C: Whole head (face, beard and hair) redrawn as the Home Nik (Image 2), same size or slightly bigger, freed space filled with hair, beard or collar shadow.
| Status | not run |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-1/ENV_ARCHIVE_PLATE_HC_V3_2X.png
- Image 2: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-1/HOME_NIK_FACE_ANCHOR.png
- Saves as: `ENV_ARCHIVE_PLATE_HC_V4_2X` (option C)

```
Image 1 is the picture to edit. Image 2 is a close-up of the same bearded man who stands on the right of image 1; it only shows what his head looks like. Copy nothing else from image 2: not the hand, the pose, the light or the room.

Keep the camera, framing and layout of image 1 exactly: the same 16:9 frame, the bronze counter rail at 56% of the height, nothing cropped, nothing moved.
Keep the man on the left exactly as he is: his face, curly black hair, light beard, dark pinstripe suit, open white shirt, the hand at his chin and his pose.
Keep the archive room exactly: the stone arches down the corridor, the glass display cases, the framed case with the old football on the left, the case with the rolled scroll on the right, the dark marble walls, the bronze rail and the black stone counter.

Change only the right man's head so it is the man in image 2: his face shape, eyes, eyebrows, nose and mouth, his full, short, neatly trimmed dark beard, and his short dark hair swept up at the front with neat, shorter sides. Keep his head turned the way it is now in image 1, looking toward the left of the picture, with a calm half-smile. Draw his head the same size as now or very slightly bigger, never smaller, in the same place on his neck. Wherever the new head is narrower than the old one, fill that space with his own hair, his beard or the shadow of his collar, never with the room behind him.
Keep his black suit, black shirt, black tie, shoulders, neck and body exactly as they are, the same size and in the same place.

Light: the same low, warm archive light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
Same framing as image 1, nothing cropped, the largest size available.
```
