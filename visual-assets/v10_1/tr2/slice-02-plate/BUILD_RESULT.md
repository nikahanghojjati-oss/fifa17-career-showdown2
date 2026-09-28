# TW-PLATE-G: Guess Entry desktop on the locked plate

Method: "paint the stage, place the live text" (Sol TW-RESET R2, S1–S7). Built by Claude (Opus 5.5), 2026-09-28.

## Run
```
cd visual-assets/v10_1/tr2/slice-02-plate
python3 -m http.server 8765
# open http://127.0.0.1:8765/index.html?frame=G2   (Nik viewing)
#      http://127.0.0.1:8765/index.html?frame=G3   (Daniel viewing)
#      ...?frame=S0 plate only, &grid=1 plate map overlay
NODE_PATH=$(npm root -g) node tools/render-qa.cjs http://127.0.0.1:8765/ evidence
```

## Plate
1. Source: `assets/src/ENV_TR2_PLATE_G_EDIT_V1.png`, Nik's ChatGPT edit. **Nik accepted its likeness (2026-09-28)**, so it is the likeness authority, and the restore against the 1536×864 original is retired for this plate.
2. Cleanup (`tools/lock_and_clean.py`) changes pixels only inside two approved edit zones:
   - sign screen: the baked `05:27` timer is removed; the "TRANSFER WINDOW" header is kept;
   - tall standing card: an AI face becomes empty dark glass.
   Lock proof: **0 px changed outside the zones**. The script reproduces the committed 1672 plate byte-for-byte.
3. DPR2: Lanczos ×2 plus edge-aware light sharpening (3344×1882). No model upscaler could run in the build session (package registries were blocked; OpenCV 4.13 can't load EDSR/FSRCNN). It can be swapped later; re-record the SHA.
4. SHA-256 values: see `../ASSET_LEDGER.md` and `platemap.json`.

## Live layer (DOM only, no CSS frames)
| Plate element | Live content |
| --- | --- |
| Sign screen | `WINDOW CLOSED` (#transferTimerDisplay) + `GUESS ENTRY` (#transferPhaseStatus, role=status) |
| Viewer's panel (A = Nik, under his finger; B = Daniel) | title bar: heading + PRIVATE. Body: 3 guess columns (type select, value input disabled until a type is chosen), privacy note, LOCK GUESSES |
| Rival panel | title bar: rival name + SEALED. Body: constant frost + CM17 seal (identical markup for both viewers, never reads rival data) |
| Rules card C | rule note |
| Painted script name of the viewer | YOU chip (the name itself is sr-only text) |
| Footer HUD bar | HOME · title · phase rail (Guesses active) · REFRESH |

All in-world sizes are plate px × k (k = world width / 1672). The camera is cover-fit, with a vertical bias that keeps the sign, both panels and the footer in view down to 1366×640.

## QA (evidence/qa_report.json; 9 shots)
- Strings: all match the approved S2 deck. `#transferPhaseIntro` is absent (S2: removed).
- Fit: 0 overflows and 0 clipped text in any panel, sign or card at 1366×768, 1366×640, 1440×900, 1920×1080 and @2x.
- Privacy: the sealed panel has 0 focusable elements. Only the viewer's own prefix IDs exist (G2 p1*, G3 p2*). Frost markup is identical G2↔G3 and unchanged by typing.
- Interaction: the type select enables the value input with a League/Nationality placeholder; clearing it re-disables the input, empties the value and restores `Pick a type first`.
- Tab order: guess 1–3 type → LOCK → HOME → REFRESH (= visual order, top to bottom).
- Layout: no page scroll; the footer clears the panels; the sign is in view (1366×640 offY = 44).
- Control sizes at 1366×768: controls 31 px, LOCK 33 px, control font 13.1 px, smallest text 12 px. At 1920×1080: 44/46 px.

## Known limits (see handoff)
- Desktop controls are 31 px at 1366 (the painted panel is 152 plate px tall). Mobile recomposition keeps the 44 px / 16 px rules.
- The sign board is tilted ~7°. The live sign text is screen-aligned per the fixed rule, so there is a slight mismatch.
- At 1366×640 the top ~14 px of the painted "TRANSFER" brush title is cropped.
- `guessHeadingDanielViewer` / `privacyNoteDanielViewer` mirror the approved Nik-viewer strings.
