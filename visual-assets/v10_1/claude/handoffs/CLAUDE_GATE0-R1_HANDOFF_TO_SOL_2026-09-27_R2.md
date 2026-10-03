Recipient: GPT-5.6 Sol (program coordinator / product-truth guard / repo steward)
Surface: ChatGPT, the current Sol coordinator conversation
Model: GPT-5.6 Sol
Effort: coordinator default
Branch: visual/cinematic-system-v10 @ 90816acd1447df17706c5f9d23b7b85e6b19b83a
Role: record the Gate 0 verdict, image-tool routing change, and reduced pose scope
Input authority: Lead Visual Producer (Claude) under VPD-03 §B; Nik's 2026-09-27 report on likeness drift
Expected output: decision table filled; V10_STATE / V10_NEXT updated
Return to: Nik
Stop condition: do not issue CP1 build brief yet. Claude issues it after Window-pose regeneration.

# CLAUDE -> SOL HANDOFF - GATE0-R1 (R2)

Status summary:
- War-room plate: APPROVE WITH INTAKE FIXES.
- Alternative round boardroom: REJECT for Transfer / park as later reference.
- Three newly generated poses: REJECT for likeness.
- Guess Entry Daniel/Nik: reuse approved V1 poses.
- Only two Window poses require regeneration.
- Likeness generation method: ChatGPT image edit from the approved V1 pose, one fresh chat per image, no key-art or second-face reference in the likeness edit.
- CP1 remains held until Claude returns the final brief after Window-pose review.

Approved plate intake fixes:
1. remove/inpaint top-right watermark-like hexagon/logo mark;
2. upscale ×2 to 3344×1882 or at least 3072×1728;
3. save as ENV_TR2_WARROOM_PLATE_V1.png and record SHA-256.

Approved Guess Entry reuse:
- POSE_TRANSFER_DANIEL_FOCUSED_V1
- POSE_TRANSFER_NIK_TACTICAL_V1
- no mirroring.

Window blockers:
- POSE_TR2_DANIEL_WINDOW_PITCH_V1
- POSE_TR2_NIK_WINDOW_POINT_V1

CP1 implementation note:
- use a screen-aligned dark scrim under DOM panels where the glowing tactics board competes with live UI;
- intake trims/decontaminates the yellow edge fringe on reused V1 poses.

Next producer review:
Fresh Claude Project chat, Opus 5.5, High.
Instruction: "Gate 0 R2 review".
Attach the final Window poses, the Daniel tries, indicate which route Nik thinks best preserves Daniel, and optionally 2–3 recent well-lit front-facing Daniel photos.
Claude returns final Window-pose verdicts, intake manifest and final CP1 CLOUD_BUILD_BRIEF.
