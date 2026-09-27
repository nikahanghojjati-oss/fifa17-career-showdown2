# V10 NEXT

## Immediate action — regenerate only the two Window poses

### Daniel Window pose

Recipient: ChatGPT image generation
Surface: fresh ChatGPT image-generation chat
Model: image generation
Effort: n/a
Branch: none
Role: edit approved Daniel V1 pose into the producer's Window pose
Input authority: Claude's IMAGE_TICKET_1_OF_2_DANIEL_WINDOW.md
Attach: ONLY POSE_TRANSFER_DANIEL_FOCUSED_V1 plus, optionally, recent Daniel face photos if Nik chooses
Do NOT attach: Transfer War key art, Nik image, other generated faces
Expected output: POSE_TR2_DANIEL_WINDOW_PITCH_V1
Return to: Nik
Stop condition: one compliant Daniel Window pose; retry in a fresh chat if likeness drifts

### Nik Window pose

Recipient: ChatGPT image generation
Surface: separate fresh ChatGPT image-generation chat
Model: image generation
Effort: n/a
Branch: none
Role: edit approved Nik V1 pose into the producer's Window pose
Input authority: Claude's IMAGE_TICKET_2_OF_2_NIK_WINDOW.md
Attach: ONLY POSE_TRANSFER_NIK_TACTICAL_V1
Do NOT attach: Transfer War key art, Daniel image, other generated faces
Expected output: POSE_TR2_NIK_WINDOW_POINT_V1
Return to: Nik
Stop condition: one compliant Nik Window pose; retry in a fresh chat if likeness drifts

## After both final Window poses exist

Recipient: Claude Opus 5.5
Surface: Claude Chat Project — Claude Career Mode Showdown
Model: Opus 5.5
Effort: High
Branch context: visual/cinematic-system-v10
Role: Gate 0 R2 visual producer review
Instruction: Gate 0 R2 review
Attach:
- final Daniel Window pose;
- final Nik Window pose;
- Daniel failed tries / alternatives that Claude asked to inspect;
- indicate which Daniel route Nik thinks best preserves likeness;
- optionally 2–3 recent, well-lit, front-facing Daniel photos.
Expected output:
- APPROVE / REGENERATE for both Window poses;
- final asset intake manifest;
- final CP1 CLOUD_BUILD_BRIEF.
Return to: GPT-5.6 Sol
Stop condition: no implementation in Claude Chat.

## Then, and only then

Sol:
- product-truth-signs the final CP1 brief;
- creates claude-cloud/transfer-tr2-slice-01;
- issues the exact Cloud routing card.

No CP1 branch or Cloud session before that.
