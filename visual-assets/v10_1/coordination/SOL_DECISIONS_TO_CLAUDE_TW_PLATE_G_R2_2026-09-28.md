# SOL -> CLAUDE DECISIONS — TW-PLATE-G / NEXT BUILD
Date: 2026-09-28
Authority: GPT-5.6 Sol
Input reviewed: `CLAUDE_TW-PLATE-G_HANDOFF_TO_SOL_2026-09-28_R2.md`
Current Claude branch head to continue from: `claude-cloud/transfer-tr2-plate-g @ 03003c2`
Prior R1 commit retained for history: `f2125a5`

## Sol verdict

TW-PLATE-G R2 is accepted as the current visual/build baseline for this slice.

Plate G stays locked.
The Guess Entry desktop treatment is accepted.
Claude may now build F1 Transfer Window on the same plate, then perform the mobile recomposition.
No new image generation is authorized or needed for this next step.
Do not touch `main`.
Do not write directly to `visual/cinematic-system-v10`.
Continue on the Claude feature branch and return a handoff to Sol before any merge request.

## Decisions TWG-S1 through TWG-S11

| ID | Sol decision | Required action |
| --- | --- | --- |
| TWG-S1 | APPROVE, with wording tightened. | Record that an owner-accepted edited image becomes the likeness authority for that locked plate. Pixel restoration against an earlier source is only required when the edited result has not been owner-accepted or when the owner explicitly asks to restore likeness. Add this rule to the likeness workflow and state record. |
| TWG-S2 | APPROVE. | Adopt the asset-ledger rule. Every approved image used by the visual system must have a repo path plus SHA-256 in the ledger. Once an asset is present and verified in the ledger, do not ask Nik to upload it again unless the hash is missing, the file is corrupt, or Nik explicitly supplies a replacement. |
| TWG-S3 | ACCEPT, corrected to the R2 head. | Record `claude-cloud/transfer-tr2-plate-g @ 03003c2` as the current accepted Claude working head. `f2125a5` remains the R1 history point. No merge is authorized by this decision. |
| TWG-S4 | APPROVE. | Keep the Daniel-viewer mirrors exactly as proposed: `Guess Nik's signings` and `Hidden from Nik until you both lock.` Preserve viewer-relative privacy behavior. |
| TWG-S5 | APPROVE the cinematic chrome placement. | Keep `GUESS ENTRY` on the in-world sign and keep HOME, season/title, phase rail, and REFRESH in the bottom HUD. The screen may use the visual-first tab order already tested, provided focus is visible, all controls remain keyboard reachable, and no product action is removed or duplicated. Do not reintroduce a large top header that competes with the painted title. |
| TWG-S6 | APPROVE as a desktop exception for this plate. | The 31 px desktop controls at 1366×768 are accepted because the owner look passed readability and ease of use. Do not reduce them further. Keep the 44 px minimum interaction target for mobile. If later owner testing says desktop is too small, fix the painted panel height rather than floating controls outside the registered glass. |
| TWG-S7 | APPROVE a narrow rule exception: tilt the read-only sign text to the board. | Rotate only the live read-only sign content to visually match the painted sign, approximately 7.5°. This exception applies to environmental signage only. Do not rotate form fields, buttons, or interactive text. The goal is to make the sign feel physically embedded rather than screen-stamped. |
| TWG-S8 | ACCEPT FOR NOW. | Keep the Lanczos plus sharpening DPR2 asset and current SHA. A future model upscale is optional refinement, not a blocker. If replaced later, record the new file and hash as a new ledger entry rather than silently overwriting evidence. |
| TWG-S9 | APPROVE. | Keep the decorative notebook slogan and faint illegible sheet lines. They are permitted as non-functional world dressing. They must never contain player names, ratings, transfer values, formation data, faces, or other gameplay information. |
| TWG-S10 | APPROVE. This unblocks F1 Transfer Window. | During F1, the non-viewer/rival panel shows the same constant sealed frost treatment used in Guess Entry, with no live rival data. The viewer's own panel shows `Ends early only if you both agree.` and the existing `END EARLY` action. The sign shows the live transfer timer and `WINDOW OPEN · BUILD YOUR SQUAD`. The rules card shows `15 MIN · 3 SIGNINGS · 3 GUESSES` plus the existing rule note. Do not invent new behavior: wire `END EARLY` only to the existing shared agreement/end-window behavior already present in the product. |
| TWG-S11 | DO NOT make the cropped title the preferred composition. Allow it only as a short-viewport fallback. | At 1366×640, first try a small world-scale or vertical framing adjustment that preserves the sign, both panels, footer, and the full painted `TRANSFER` brush title. If preserving all of those is impossible without breaking panel registration, the existing approximately 14 px top crop is acceptable only for this short-height fallback. Do not re-edit Plate G solely to fix this crop. |

## F1 Transfer Window visual contract

Build F1 on the exact locked Plate G visual system, not as a new card layout.

The screen should read as one cinematic environment with live UI embedded into the painted surfaces.

Viewer panel:
`Ends early only if you both agree.`
Existing `END EARLY` control only.
No guess-entry fields during F1.

Rival panel:
Constant sealed frost.
No rival form controls.
No live rival signing data.
No variable clue based on rival state.

Sign:
Live transfer timer.
`WINDOW OPEN · BUILD YOUR SQUAD`
Apply the approved read-only environmental rotation so the live sign content tracks the painted sign angle.

Rules card:
`15 MIN · 3 SIGNINGS · 3 GUESSES`
Existing rule note beneath or adjacent if it fits the painted surface.

Bottom HUD:
Retain the current cinematic chrome system.
The phase rail should mark Window as active in F1.
Do not add a second competing page header.

Privacy:
The opponent surface must remain visually constant across opponent states except for the fixed SEALED treatment.
No hidden rival state may leak through text length, control presence, glow intensity, animation, loading state, or panel geometry.

## Mobile recomposition after F1

After desktop F1 passes, build the mobile treatment from the same visual language.

Requirements:

1. Preserve the same product actions and privacy model.
2. Minimum 44 px mobile interaction targets.
3. Keep Nik and Daniel as the scene anchors rather than collapsing the screen into generic stacked cards.
4. Recompose the plate for portrait rather than merely shrinking desktop.
5. Keep live controls registered to an intentional glass surface.
6. Avoid covering faces, hands, fingertip contact, or the core Transfer War staging.
7. Keep the bottom navigation/HUD usable without page-scroll confusion.
8. Re-run mobile fit, clipping, privacy, focus, and input-size QA.
9. Do not generate a new plate or new character images unless Sol explicitly reopens image generation.

If a portrait crop cannot preserve both managers plus a usable live panel at acceptable size, return that as a visual blocker with evidence before generating or replacing any art.

## State/documentation actions

On the Claude feature branch, update the appropriate coordination/state documentation to capture:

1. The owner-accepted-edit likeness authority rule from TWG-S1.
2. The asset-ledger / never-request-the-same-approved-asset-twice rule from TWG-S2.
3. Current accepted working head `03003c2`.
4. The narrow environmental-sign rotation exception from TWG-S7.
5. F1 rival-panel privacy treatment from TWG-S10.

Do not modify unrelated source-of-truth documents simply to normalize historical wording. Limit edits to the minimum durable state needed for this slice.

## Acceptance gates before returning to Sol

Claude should return only after all of the following are true:

1. F1 desktop opens in browser and uses the locked Plate G.
2. Viewer and rival states are both rendered and evidenced.
3. Rival panel remains constant sealed frost.
4. Timer/sign treatment is physically integrated and rotated with the sign.
5. END EARLY is wired only to existing behavior.
6. No clipping or page-scroll regression at the previously tested desktop sizes.
7. Short-height 1366×640 behavior is documented, including whether the title crop remains.
8. Mobile recomposition is implemented or a precise blocker is evidenced.
9. 44 px mobile targets are verified.
10. No new image generation was used.
11. QA report and screenshots are committed on the feature branch.
12. Claude returns the new branch commit SHA, changed-file list, QA result, screenshots/evidence paths, and any remaining taste questions to Sol.

## Instruction to Claude

Continue from `claude-cloud/transfer-tr2-plate-g @ 03003c2`.

Implement the decisions above in this order:

1. Record the durable S1/S2/S7/S10 state.
2. Build F1 Transfer Window on the same locked Plate G.
3. Run desktop QA.
4. Recompose for mobile without generating new art.
5. Run mobile QA.
6. Commit the work to the Claude feature branch.
7. Return a compact Claude -> Sol handoff with exact commit SHA, evidence paths, QA results, and only genuinely unresolved questions.

Do not touch `main`.
Do not merge.
Do not ask Nik to re-upload any approved asset already in the ledger.
Do not redesign product behavior.
Do not return to generic boxes/cards.
Keep the presentation cinematic and surface-registered.
