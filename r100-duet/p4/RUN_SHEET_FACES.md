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

### F-2 option B result (Nik 27 Nov 19:30 UTC): rated very low by Nik, my score 4/10
Raw: inputs branch r100-duet/p4/inputs/F-2/raw/ENV_OFFICE_PLATE_HC_V4_2X_F2B_RAW.png. Framing held (crop route works). What went wrong: the head turned up toward the camera and lost the lean, copying Image 2's angle; heavy, half-shut eyelids; the half-smile became a lopsided smirk; thin cheek beard; frizzy hair with a bright rim. Lessons: Image 2 at another angle pulls its pose in (same as F-1). 'Eyes look down, open and relaxed' gives droopy lids: keep image 1's eyes instead. 'Faint half-smile' gives a smirk: ask for a closed, level, neutral mouth. 'No halo' alone still gave a hair rim: describe matte hair with soft dark edges. F-1's winner (E2) was words only and kept the eyes.

### F-2 option D: words only, eyes and hair kept as today; beard, brows and mouth fixed (smallest change, like F-1 E2). Hair gets its own later edit if needed.
New chat: ChatGPT Work mode, Astra 6, Extra High.
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png
- Image 2: none
Save as ENV_OFFICE_PLATE_HC_V4_2X_F2D_RAW.

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night.

Keep the framing of image 1 exactly: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera.
Keep the room behind him exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.
Keep the pose of his head exactly as in image 1: the same lean forward, the same turn and the same downward tilt, his face looking down toward the bottom left of the picture at the desk.
Keep his hair exactly as in image 1: the same curls, the same outline, the same colour.
Keep his eyes exactly as in image 1: the same eye shape, the same eyelids open the same amount, looking down at the desk.

Change only these three things:
- His beard: a full, short, dense dark beard and moustache, neatly trimmed, rising on both cheeks to just below the cheekbones. Every thin or bare patch on his cheeks, jaw and chin becomes dense beard. Along his jaw the beard reaches out to where the edge of his jaw is now, never further in.
- His eyebrows: the same thickness and colour as now, with the inner ends lowered and relaxed, so the frown is gone and the skin between his brows is smooth with no creases.
- His mouth: lips closed and relaxed, both corners level, a calm, neutral mouth.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```

### F-2 option E: words only, eyes kept; hair, beard, brows and mouth fixed in one go.
New chat: ChatGPT Work mode, Astra 6, Extra High.
- Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png
- Image 2: none
Save as ENV_OFFICE_PLATE_HC_V4_2X_F2E_RAW.

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night.

Keep the framing of image 1 exactly: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera.
Keep the room behind him exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.
Keep the pose of his head exactly as in image 1: the same lean forward, the same turn and the same downward tilt, his face looking down toward the bottom left of the picture at the desk.
Keep his eyes exactly as in image 1: the same eye shape, the same eyelids open the same amount, looking down at the desk.

Change only these four things:
- His hair: short, thick, dark hair swept up and back from his forehead, the sides short and lying flat and tidy, in place of the curls. The hair is matte with soft, dark edges against the window, with no frizz, no loose strands and no bright rim of light. On the top and at the back of his head the hair reaches out to where the outer edge of his curls is now.
- His beard: a full, short, dense dark beard and moustache, neatly trimmed, rising on both cheeks to just below the cheekbones. Every thin or bare patch on his cheeks, jaw and chin becomes dense beard. Along his jaw the beard reaches out to where the edge of his jaw is now, never further in.
- His eyebrows: the same thickness and colour as now, with the inner ends lowered and relaxed, so the frown is gone and the skin between his brows is smooth with no creases.
- His mouth: lips closed and relaxed, both corners level, a calm, neutral mouth.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than now.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```

### F-2 results 27 Nov: A 4/10 (Nik very low), C 0/10 (Nik), D 7/10 (Astra Max)
- A and B: head lifted toward the camera, droopy lids, smirk. C: describing a whole new face drew a stranger. D (keep face, eyes, hair; change beard, brows, mouth): pose, eyes and framing held, frown gone, fuller beard; curls with copper glints remain.

## Prompting study (27 Nov, for Nik)
Sources: OpenAI image prompting guide and GPT-6 Astra model page; ChatGPT "what's new" GPT-6.2; vendor guides (fal, SimpliGen, Atlas Cloud, TeraBox, GlobalGPT, Viralway). Vendor pages are unverified and disagree on details.
1. The chat model does not draw the picture. Astra or Sol writes the request; a separate image model (ChatGPT Images 2.6 / GPT-Image-2.6) draws it. No source shows that Astra vs Sol or the effort level changes face or pose fidelity. Keep Astra (it takes the edit words literally); Extra High or Max both fine, Max only adds wait.
2. Pixels outside the change are never guaranteed. OpenAI's own guide: if a part must stay identical, composite the approved edit into the original. That is our likeness lock, so keep doing it.
3. Point at the area, don't describe it: ChatGPT's image viewer has a select brush (open the picture, Select, paint the area, type the change). OpenAI's API does the same with markup on the first image only. Stop the brush a few pixels short of features you want kept.
4. Prompt shape: Change (one thing) / Keep exactly (face, expression, eyes, pose, camera angle, framing, light, room) / Constraints. Repeat the keep list every time.
5. Never re-describe the face. Name only the parts that change and say "keep his face exactly as in image 1". Re-describing features (C) or a reference at another angle (A, B) draws another man or copies that pose.
6. Image 1 is always the picture to edit; label every image by its role. Avoid an Image 2 for likeness unless it has the same head angle.
7. One kind of change per edit, each from the best picture so far in a new chat; never more than two edits deep.
8. Words to avoid: "relaxed eyes" (gives droopy lids), "half-smile" (gives a smirk), "no halo" alone (still gives a hair rim; describe matte hair with soft dark edges instead).

### F-2 option D-H1: hair only, with the select brush (D as the picture)
New chat: ChatGPT Work mode, Astra 6, Extra High or Max. Attach the D picture only. Open it, press Select, paint over the hair only (top, sides and back), stopping a few pixels above the forehead and clear of the ear. Paste the box. Save as ENV_OFFICE_PLATE_HC_V4_2X_F2DH1_RAW.

```
Change only his hair, inside the area I selected. Keep everything else in the picture exactly as it is.

Change: his hair becomes short, thick, dark hair swept up and back from his forehead, with the sides short and lying flat and tidy, in place of the curls. The hair is matte dark brown-black with soft, dark edges against the window. On the top and at the back of his head it reaches out to where the outer edge of the curls is now, never further in.

Keep exactly as they are: his face, forehead, hairline at the temples, eyebrows, eyes, ears, beard and expression; the lean, turn and downward tilt of his head; the framing and size of the picture; his suit, shirt and tie; the dark window and the olive leaves.

The hair has no copper or golden highlights, no frizz, no loose strands and no bright rim of light: the same low, warm office light as the rest of the picture.
A real photograph, real hair, no glow, no halo, no smoothing, no text. One square picture, the same size and framing.
```

### F-2 option D-H2: hair only, no brush (D as image 1)
Same chat set-up and same box, without the select step; replace "inside the area I selected" with "in image 1". Save as ENV_OFFICE_PLATE_HC_V4_2X_F2DH2_RAW.

### F-2 E result and Nik's rule (27 Nov 19:41-19:44 UTC)
- E (Sol 5.6 Extra High, from the source crop): 8.5/10 from me; fits the room, never-slimmer passes. Nik: D and E miss his likeness in the jaw, eyes and forehead (they keep today's face).
- Nik's rule: one picture in one go, no brush and no chained edits; any model; every prompt has a strict likeness lock on his eyes, lips and jaw.

## One-shot face prompt, the template (from every F-1 and F-2 try)
1. Image 1 = the square head crop of the plate: it gives pose, framing, light and room only.
2. Image 2 = the Home face: it gives who he is only. Say what NOT to copy from it (hand, camera angle, head turn, light, room).
3. Pose lock in geometry words: which way the head turns and tilts, which side of the face we see, where the eyes look; "do not turn his face toward the camera and do not lift his head". (A and B lifted the head.)
4. Likeness lock, one line per feature, each "image 2's ...": eyes (shape, size, iris, upper lids; opening from image 1), brows, nose, lips, jaw and cheeks, forehead and hairline, skin tone. (D and E kept today's face; C's description without a reference drew a stranger.)
5. Expression in plain shape words: lips closed and relaxed, corners level, no smile, no smirk; brows relaxed, no frown. Never "half-smile" (smirk) or "relaxed eyes" (droopy lids).
6. Hair and beard described, plus the never-slimmer outline rule.
7. Light, finish, one square picture at the largest size. "No halo" alone still gives a hair rim: describe matte hair with soft dark edges.

### F-2 option H: one shot, Image 2 = Home face
New chat (Astra 6 Max, or Sol 5.6 Extra High). Image 1: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/OFFICE_NIK_HEAD_CROP_1700_0_900.png  Image 2: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/HOME_NIK_FACE_ANCHOR.png  Save as ENV_OFFICE_PLATE_HC_V4_2X_F2H_RAW.

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night. Image 2 is the real man he must be, photographed from the front.
Image 1 gives only the pose, framing, light and room. Image 2 gives only who he is. Copy nothing else from image 2: not the hand at his chin, the camera angle, the turn of his head, the light or the room.

Pose and framing, exactly as in image 1: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera. He leans forward over the desk; his head is turned toward the left of the picture and tilted down, so his face is seen from above and from his left side, and his eyes look down at the desk at the bottom left. Do not turn his face toward the camera and do not lift his head.
Room, exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.

Likeness, exactly as in image 2, seen from image 1's angle. Each of these must be unmistakably the man in image 2:
- Eyes: image 2's eye shape and size and dark brown irises, with image 2's upper eyelids; open as much as in image 1, looking down at the desk.
- Eyebrows: image 2's very thick, dark, nearly straight eyebrows, sitting low and close above the eyes; relaxed, with smooth skin between them and no frown.
- Nose: image 2's nose.
- Lips: image 2's lips, the same width and fullness, with the full lower lip; closed and relaxed, both corners level, no smile and no smirk.
- Jaw and cheeks: image 2's broad, square, heavy jaw and full, rounded cheeks; his face as wide as in image 2.
- Forehead and hairline: image 2's tall, broad forehead and rounded hairline, going back a little at the temples.
- Skin tone: image 2's.

Hair and beard:
- Hair: short, thick, dark hair swept up and back from the forehead, the sides short and lying flat and tidy. Matte, with soft, dark edges against the window; no copper or golden highlights, no frizz, no bright rim of light. On the top and at the back of his head it reaches out to where the outer edge of the curls is in image 1.
- Beard: image 2's full, short, dense dark beard and moustache, covering his cheeks up to just below the cheekbones, with no thin or bare patches.
The outer edge of his head, hair, beard and ears stays where it is in image 1 or reaches further out, never further in. Wherever the new head is narrower, fill that space with his own hair, his beard or the shadow of his collar, never with the room.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than in image 1.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```

### F-2 option I: one shot, Image 2 = Home face, Image 3 = Legacy E2 head (side view of the same man)
New chat, same models. Image 1 and 2 as H; Image 3: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude-duet/p4-faces-inputs/r100-duet/p4/inputs/F-2/LEGACY_NIK_E2_HEAD.png  Save as ENV_OFFICE_PLATE_HC_V4_2X_F2I_RAW.

```
Image 1 is the picture to edit: a square close-up of a bearded man in a black suit, black shirt and black tie, leaning over a desk by a dark office window at night. Image 2 is the real man he must be, photographed from the front. Image 3 is the same real man with his head turned toward the left of the picture.
Image 1 gives only the pose, framing, light and room. Images 2 and 3 give only who he is; image 3 shows how his face looks from the side. Copy nothing else from images 2 and 3: not the hand at his chin, the camera angle, the turn or tilt of his head, the light or the room.

Pose and framing, exactly as in image 1: the same square picture, his head the same size and in the same place, the top of his hair the same distance from the top edge, his shoulders, black suit, black shirt and black tie exactly as they are. Do not zoom in, do not crop, do not move the camera. He leans forward over the desk; his head is turned toward the left of the picture and tilted down, so his face is seen from above and from his left side, and his eyes look down at the desk at the bottom left. Do not turn his face toward the camera and do not lift his head.
Room, exactly as in image 1: the dark window frames, the black night glass and the olive leaves at the right edge.

Likeness, exactly as in images 2 and 3, seen from image 1's angle. Each of these must be unmistakably the man in images 2 and 3:
- Eyes: image 2's eye shape and size and dark brown irises, with image 2's upper eyelids; open as much as in image 1, looking down at the desk.
- Eyebrows: image 2's very thick, dark, nearly straight eyebrows, sitting low and close above the eyes; relaxed, with smooth skin between them and no frown.
- Nose: image 2's nose.
- Lips: image 2's lips, the same width and fullness, with the full lower lip; closed and relaxed, both corners level, no smile and no smirk.
- Jaw and cheeks: image 2's broad, square, heavy jaw and full, rounded cheeks; his face as wide as in image 2.
- Forehead and hairline: image 2's tall, broad forehead and rounded hairline, going back a little at the temples.
- Skin tone: image 2's.

Hair and beard:
- Hair: short, thick, dark hair swept up and back from the forehead, the sides short and lying flat and tidy. Matte, with soft, dark edges against the window; no copper or golden highlights, no frizz, no bright rim of light. On the top and at the back of his head it reaches out to where the outer edge of the curls is in image 1.
- Beard: image 2's full, short, dense dark beard and moustache, covering his cheeks up to just below the cheekbones, with no thin or bare patches.
The outer edge of his head, hair, beard and ears stays where it is in image 1 or reaches further out, never further in. Wherever the new head is narrower, fill that space with his own hair, his beard or the shadow of his collar, never with the room.

Light: the same low, warm office light as image 1, from the same side; his face no brighter and no darker than in image 1.
Finish: a real photograph, real skin with fine pores, real hair and real beard hairs, no glow, no halo or outline around him, no smoothing, no text.
One picture, square, the same framing as image 1, the largest size available.
```
