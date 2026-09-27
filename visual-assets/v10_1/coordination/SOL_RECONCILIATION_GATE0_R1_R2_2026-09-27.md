# SOL RECONCILIATION — GATE0-R1 / R2 FINAL

Date: 2026-09-27  
Coordinator: GPT-5.6 Sol  
Production main: f077b9c5be5e4d5bf5ef17b2d219983dbf142962  
Visual branch intake head: 724bb7fa621d49c1101102e49e0c4d883763c948  
SOURCE_DRIFT: NO

## Decision table

| ID | Sol decision | Coordinator note |
| --- | --- | --- |
| G0-M1 | ACCEPT | Reject the three Round-1 generic-face poses. Likeness failure is decisive and has no product-truth cost. |
| G0-M2 | ACCEPT | `ENV_TR2_WARROOM_PLATE_V1` remains approved pending CP1 intake cleanup/upscale/hash. |
| G0-M3 | ACCEPT | Reuse approved V1 Daniel/Nik poses for Guess Entry; no mirroring. |
| G0-M4 | SUPERSEDED | Replaced by the proven written standard `LIKENESS_IMAGE_WORKFLOW_V1.md`. |
| G0-R1 | ACCEPT | Round boardroom remains reference only, not a Transfer asset. |
| G0-R2 | ACCEPT | CP1 handles tactics-board competition with a screen-aligned DOM scrim; no regeneration for this issue. |
| G0-R3 | ACCEPT | Cloud intake trims/decontaminates the V1 yellow edge fringe before compositing. |
| G0R2-M1 | ACCEPT | Approve `POSE_TR2_DANIEL_WINDOW_PITCH_V1`. |
| G0R2-M2 | ACCEPT | Approve `POSE_TR2_NIK_WINDOW_POINT_V1`. |
| G0R2-M3 | ACCEPT | `LIKENESS_IMAGE_WORKFLOW_V1.md` is now the standard for all Daniel/Nik likeness work. |
| G0R2-R1 | ACCEPT | CP1 intake remaps alpha 248–254 to 255 before compositing. |
| G0R2-R2 | ACCEPT | CP1 intake erodes 1–2 px and decontaminates warm rim fringe. |
| G0R2-R3 | ACCEPT | Judge Nik's skin crackle at CP1 display size; if visible, apply light skin-only denoise. No regeneration. |
| G0R2-R4 | ACCEPT | Window/Guess pose similarity is accepted; state separation comes from staging and DOM. |

## Product-truth result

No conflicts found.

The Gate 0 R2 changes affect presentation assets, image intake and composition only. No phase, timer, privacy, lock, verdict, authority or gameplay behavior changes.

## Gate 0 final asset state

All five Transfer Gate 0 assets are approved:

- `ENV_TR2_WARROOM_PLATE_V1` — approved after intake fixes.
- `POSE_TRANSFER_DANIEL_FOCUSED_V1` — Guess Entry Daniel, approved reuse.
- `POSE_TRANSFER_NIK_TACTICAL_V1` — Guess Entry Nik, approved reuse.
- `POSE_TR2_DANIEL_WINDOW_PITCH_V1` — Window Daniel, approved; CP1 intake applies alpha/fringe cleanup.
- `POSE_TR2_NIK_WINDOW_POINT_V1` — Window Nik, approved; CP1 intake applies alpha/fringe cleanup and display-size skin check.

Gate 0 blockers: NONE.

## Likeness-generation standard

Canonical repo standard:
`visual-assets/v10_1/coordination/LIKENESS_IMAGE_WORKFLOW_V1.md`

Golden anchors remain:
- Daniel: `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`
- Nik: `POSE_TRANSFER_NIK_TACTICAL_V1.png`

The new Window poses are approved assets, not golden anchors.

## CP1 state

CP1 is UNBLOCKED from Gate 0.

Do NOT create `claude-cloud/transfer-tr2-slice-01` yet.

The remaining prerequisite is Claude's final CP1 `CLOUD_BUILD_BRIEF` with the intake manifest. Once that brief returns, Sol will product-truth-sign it, record the base SHA, and create the CP1 Cloud branch.

## Owner taste note

Daniel's Window expression reads more challenging than smoothly persuasive. Claude recommends keeping it because it suits Transfer War. This is non-blocking; Nik may still veto on taste.

## Next return path

Nik -> fresh Claude Project chat:
- Opus 5.5
- High
- task label: `CP1 brief`
- paste this Sol reconciliation if useful
- no image attachments required; approved asset IDs and hashes are already recorded in the Gate 0 R2 handoff

Claude -> Sol:
- final CP1 `CLOUD_BUILD_BRIEF`
- intake manifest

Then Sol:
- product-truth-signs the brief
- records the exact base SHA
- creates `claude-cloud/transfer-tr2-slice-01`
- issues the exact Cloud routing card
