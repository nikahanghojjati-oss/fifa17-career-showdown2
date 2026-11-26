# P4 run sheet: hero faces

Nik's pick (2026-11-26 04:32 UTC): all 12 board items, board order. One ticket per asset per option; each option in its own new chat (ChatGPT Work mode, Astra 6, Extra High). Inputs live on branch `claude-duet/p4-faces-inputs` (never merged); SHA-256 in each input folder.

## F-1 Legacy and Trophy Room, Nik (desktop master)
Source: `visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp` (Wooden, 3072x1728) as PNG. Image 2 = Nik's face from the Home anchor `ENV_HOME_PLATE_HC_V3_2X`. Result saves as `ENV_ARCHIVE_PLATE_HC_V4_2X` (RAW kept untouched as `..._F1<option>_RAW.png`). On return: align.py, likeness lock in Nik's hero zone (~6 px feather), never-slimmer mask check, score vs Home (pass 9/10).

### F-1 option A: Face shape only, words only (no Image 2): leaner cheeks and firmer jaw inside the same head and beard outline.
| Status | try 1 in 04:49 UTC (raw on claude-duet/p4-faces-inputs, sha 348ef68f): 5/10. Outline unchanged (never-slimmer pass), but the face is barely slimmer and the skin came back smoother and brighter. Fix 1 sent (same chat): visible cheek hollows, narrower jaw filled with his own beard, same skin brightness. Fix 1 (04:59 UTC) came back as a 1254x1254 head crop, face still wide and lumpy; Nik: "a looks horribol". **Option A dropped.** |
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
| Status | try 1 in 04:54 UTC (raw on claude-duet/p4-faces-inputs, sha 56483981, only 1672x941): 5/10. Eyes a little closer to Home, but the face is as round as before; the whole picture was redrawn (Daniel too, the lock restores him). Fix 1 sent (same chat): cheeks and jaw as narrow as image 2, freed space filled with his own beard. |
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

## F-2 Transfer War, Nik (desktop master, then phone)
Source: `visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V3_2X.webp` (Wooden, 3072x1728). Today: curly hair, frown, thin patchy beard, narrow face. Route (F-1 lesson): Image 1 = square head crop `OFFICE_NIK_HEAD_CROP_1700_0_900.png` (box 1700,0,2600,900 of the V3 2X), so Astra keeps the framing. Result saves as `ENV_OFFICE_PLATE_HC_V4_2X_F2<option>_RAW`. On return: scale to 900, fit.py to the crop, likeness lock in the hero mask (~6 px feather), paste at (1700,0), never_slimmer.py, score vs Home (pass 9/10). The phone plate (ENV_OFFICE_PHONE_HC_V3) has its own drawing of the men (head up, looking left), so it gets its own ticket from the winning prompt.

### F-2 option A: Whole head as the Home Nik (Image 2 = Home face anchor, frontal).
| Status | sent to Nik 2026-11-26 21:40 UTC |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png
- Image 2: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/HOME_NIK_FACE_ANCHOR.png
- Saves as: `ENV_OFFICE_PLATE_HC_V4_2X_F2A_RAW`

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night. Image 2 is a close-up of the same man, looking straight at the camera; use it only for what his head looks like. Copy nothing else from image 2: not the hand at his chin, the pose, the camera angle, the light or the room.

Keep the framing of image 1 exactly: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera.
Keep the room behind him exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.
Keep the turn and tilt of his head exactly as in image 1: he leans forward and looks down toward the bottom left of the picture, at the desk in front of him.
Draw the man from image 2 seen from this same angle.

Change only his head so it is the man in image 2:
- His face: image 2's broad face with full cheeks, and image 2's eyes, eyebrows, nose and mouth.
- His beard: image 2's full, short, dense dark beard and moustache, covering his cheeks up to just below the cheekbones.
- His hair: short, thick, dark hair swept up at the front and lying smooth and tidy at the sides, in place of the curls. On the top and at the back of his head the hair reaches out to where the outer edge of his curls is now in image 1.
- His expression: calm and focused. His eyes look down at the desk, open and relaxed; both eyebrows are level and relaxed, with no frown and no creases between the brows; his mouth is relaxed with a faint, confident half-smile.
The outer edge of his head, hair, beard and ears stays where it is now or reaches slightly further out, never further in. Wherever the new head is narrower than the old one, fill that space with his own hair, his beard or the shadow of his collar, never with the room.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```

### F-2 option B: Whole head as the Legacy Nik E2 (Image 2 = the shipped Legacy head, already turned toward the left; Nik OK'd that face).
| Status | sent to Nik 2026-11-26 21:40 UTC |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png
- Image 2: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/LEGACY_NIK_E2_HEAD.png
- Saves as: `ENV_OFFICE_PLATE_HC_V4_2X_F2B_RAW`

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night. Image 2 is a close-up of the same man, with his head turned toward the left of the picture; use it only for what his head looks like. Copy nothing else from image 2: not the pose, the light or the room.

Keep the framing of image 1 exactly: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera.
Keep the room behind him exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.
Keep the turn and tilt of his head exactly as in image 1: he leans forward and looks down toward the bottom left of the picture, at the desk in front of him.
Draw the man from image 2 seen from this same angle.

Change only his head so it is the man in image 2:
- His face: image 2's broad face with full cheeks and a firm jaw, and image 2's eyes, eyebrows, nose and mouth.
- His beard: image 2's full, short, dense dark beard and moustache, covering his cheeks up to just below the cheekbones.
- His hair: short, thick, dark hair swept up at the front and lying smooth and tidy at the sides, in place of the curls. On the top and at the back of his head the hair reaches out to where the outer edge of his curls is now in image 1.
- His expression: calm and focused. His eyes look down at the desk, open and relaxed; both eyebrows are level and relaxed, with no frown and no creases between the brows; his mouth is relaxed with a faint, confident half-smile.
The outer edge of his head, hair, beard and ears stays where it is now or reaches slightly further out, never further in. Wherever the new head is narrower than the old one, fill that space with his own hair, his beard or the shadow of his collar, never with the room.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```

### F-2 option C: Words only: hair, beard, broad face and calm expression described, no Image 2.
| Status | sent to Nik 2026-11-26 21:40 UTC |
|---|---|
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png
- Image 2: none
- Saves as: `ENV_OFFICE_PLATE_HC_V4_2X_F2C_RAW`

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night.

Keep the framing of image 1 exactly: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera.
Keep the room behind him exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.
Keep the turn and tilt of his head exactly as in image 1: he leans forward and looks down toward the bottom left of the picture, at the desk in front of him.

Change only his head, so he looks like a strong man in his thirties with a broad face:
- His face: a broad face with full cheeks and a wide, firm jaw; dark brown eyes under thick, straight, dark eyebrows; a straight nose; full lips.
- His beard: a full, short, dense dark beard and moustache, neatly trimmed, covering his cheeks up to just below the cheekbones and filling out along his jaw and chin, so no thin or patchy beard shows.
- His hair: short, thick, dark hair swept up at the front and lying smooth and tidy at the sides, in place of the curls. On the top and at the back of his head the hair reaches out to where the outer edge of his curls is now in image 1.
- His expression: calm and focused. His eyes look down at the desk, open and relaxed; both eyebrows are level and relaxed, with no frown and no creases between the brows; his mouth is relaxed with a faint, confident half-smile.
The outer edge of his head, hair, beard and ears stays where it is now or reaches slightly further out, never further in. Wherever the new head is narrower than the old one, fill that space with his own hair, his beard or the shadow of his collar, never with the room.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```
