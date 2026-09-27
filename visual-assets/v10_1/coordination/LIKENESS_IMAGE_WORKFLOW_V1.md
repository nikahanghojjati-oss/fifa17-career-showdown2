# LIKENESS IMAGE WORKFLOW V1
Career Mode Showdown · how to make new images of Daniel and Nik that still look like them

| Field | Value |
| --- | --- |
| Status | **STANDARD** from 2026-09-27. Use it for every image that shows Daniel's or Nik's face. |
| Proven by | Gate 0 R2: `POSE_TR2_DANIEL_WINDOW_PITCH_V1` and `POSE_TR2_NIK_WINDOW_POINT_V1`, both first-try likeness passes |
| Tool | ChatGPT image generation (the model Nik reports as GPT Image 2.5) |
| Owner | Claude (Lead Visual Producer) writes the tickets; Nik runs them |
| Repo home (Sol to commit) | `visual-assets/v10_1/coordination/LIKENESS_IMAGE_WORKFLOW_V1.md` |
| Project home | `claude/workflows/LIKENESS_IMAGE_WORKFLOW_V1.md` |

## Why round 1 failed and round 2 worked

| Round 1 (failed: generic faces) | Round 2 (passed: both faces right) |
| --- | --- |
| Chats started **inside** a ChatGPT project, which can pull in the project's other files and images | Plain **New chat** from the left sidebar, **outside** any ChatGPT project |
| Key art with two other faces attached as a reference | **One** image attached: an approved image of that one person |
| Asked for a new picture; ChatGPT rewrote the prompt into its own text description of the man | Asked for an **edit** of the attached photo; prompt pasted verbatim, no rewrites |
| Several images from one chat | **One image per chat** |

The biggest single factor was the first row: leaving the ChatGPT project. Any extra face the model can see pulls identity toward a generic average.

## Part A · For Nik: running a likeness ticket

1. **Open a plain New chat** at the top of ChatGPT's left sidebar. Never inside a ChatGPT project (including "Showdown visual").
2. **Attach one file only:** the anchor image the ticket names. Nothing else: no key art, no second person, no ticket file.
3. **Paste the prompt from the ticket's grey box exactly.** If ChatGPT offers to rewrite or "improve" it, reply: `No, use my prompt exactly.`
4. **Check at a glance**, with the result beside the anchor: is that him?
   - **Yes:** download it and save it under the name the ticket gives.
   - **No:** close the chat, open a **new** one, and start again from step 1. Stop after 3 tries and tell Claude.
5. **Collage or two faces mixed?** Close the chat and start a new one. Never try to correct it in the same chat.
6. **One image per chat.** For the next image, open another new chat.

## Part B · Anchor rules (which image to attach)

- **Golden anchors** are the approved likeness images. Always edit from a golden anchor, never from the last try or from an edit of an edit. Each hop away from the anchor adds drift.
- **Current golden anchors:**

| Person | Golden anchor | Wardrobe it carries |
| --- | --- | --- |
| Daniel (Manager 1, always left) | `POSE_TRANSFER_DANIEL_FOCUSED_V1.png` | charcoal pinstripe suit, open white shirt |
| Nik (Manager 2, always right) | `POSE_TRANSFER_NIK_TACTICAL_V1.png` | dark suit, black shirt, black tie, wristwatch |

- Both V1 files live on branch `claude-cloud/sv01-v10-1-c2-provisional-build` in `visual-assets/v10_1/cloud-session/assets/`.
- A newly approved image can become a golden anchor too, but only when Claude says so in a gate verdict. The Gate 0 R2 Window poses are **approved assets, not anchors**. Keep using the V1 files as anchors until Claude promotes another.
- Pick the anchor whose wardrobe and lighting are closest to what the new image needs.
- **Change one kind of thing per edit.** Pose and expression in one edit is fine. If a future screen needs a different outfit, change the outfit in its own edit from the golden anchor, get that approved, and only then use it for pose edits.

## Part C · For Claude: writing a likeness ticket

Every likeness ticket follows this template. One ticket = one person = one file.

**Ticket file layout**
1. Title: `IMAGE TICKET <n> of <total> · <Person>, <pose name>`.
2. A "Read this first" box: this ticket is for Nik; don't upload it to ChatGPT; start from a plain New chat outside any ChatGPT project.
3. **Where**, **Attach this one file only** (the golden anchor by exact filename), **Save the result as** (the asset ID).
4. The six steps from Part A, shortened.
5. The prompt in one fenced code block, nothing else inside it.

**Prompt rules**
- Open with: `Edit this photo of this man. Do not change who he is: keep his face, <hair>, <beard>, skin tone, build, <wardrobe> exactly as they are. Change only his pose and expression:`
- List every kept identity and wardrobe trait by name.
- Pose as short bullets. Describe hands and gaze by **image-left / image-right**, never "his left". The rival is always on the far side: Daniel looks and gestures toward image-right, Nik toward image-left.
- Always include: `both hands fully visible, five fingers each.`
- Framing: `Waist-up, cropped at mid-thigh, head about one quarter of the image height, a little space above the hair.`
- Light: `Same warm golden lighting as the original, with no glow or outline around the body.`
- Output: `Portrait 2:3, the largest size available. Transparent background. No text anywhere.`
- Props that could carry data (tablets, papers, clipboards) are **blank** or turned away. Never ask for names, numbers, stats or timers in an image.
- No other person, no key art, no scene description beyond the pose.

## Part D · Gate check (Claude, on return)

Review each returned image against its golden anchor, side by side, before anything else:
1. **Likeness:** same person at a glance (face shape, hair type and colour, beard, skin tone, build).
2. **Wardrobe** matches the anchor.
3. **Pose** matches the ticket, including image-left/right and side rules (Daniel left, Nik right, never mirrored).
4. **Hands:** five fingers, no fused or extra fingers.
5. **No baked data:** no readable text, numbers or screens.
6. **Canvas:** at least 1024×1536 portrait with a real alpha channel.
7. **Intake notes:** interior alpha below 255 (remap 248–254 → 255), warm edge fringe (erode 1–2 px and decontaminate), skin texture artefacts at 1:1 (judge at display size).

## Part E · Paste-ready line for the Claude Project instructions (optional)

Under "Model and effort routing", after the "Images" row, Nik can add:

> Likeness images (Daniel, Nik) follow `claude/workflows/LIKENESS_IMAGE_WORKFLOW_V1.md`: plain new ChatGPT chat outside any ChatGPT project, one golden anchor attached, edit prompt pasted verbatim, one image per chat.
