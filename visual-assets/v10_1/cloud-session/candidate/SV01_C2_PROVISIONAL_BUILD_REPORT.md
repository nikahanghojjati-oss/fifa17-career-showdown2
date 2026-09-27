# CLOUD-SV01-01 — SV01 V10.1 C2 Provisional Build Report

Status: `PROVISIONAL_ASTRA_REVIEW_PENDING`
Task: `visual-assets/v10_1/cloud-session/CLAUDE_CLOUD_SV01_PROVISIONAL_BUILD_TASK.md` (as of `adc13cf`, hard asset gate)
Branch: `claude-cloud/sv01-v10-1-c2-provisional-build` (production main not touched)
Executor: Claude Code Cloud Session
Date: 2026-09-27

## Candidate fingerprint

| File | SHA-256 |
|---|---|
| `candidate/SV01_C2_PROVISIONAL_CANDIDATE.html` | `f1a5a27dd65e83bf5cef946111cd9ee3e18bbc3585ca22514411fd1c45c7462b` |

The HTML references the three approved assets by relative path (`../assets/…`). They are unchanged, and their hashes are in `assets/SHA256_MANIFEST.json`. The QA run re-verifies them.

Open it from a repo checkout: `visual-assets/v10_1/cloud-session/candidate/SV01_C2_PROVISIONAL_CANDIDATE.html`.
States: `?state=nik-editable` (default, primary golden frame), `nik-one-row`, `daniel-editable`, `nik-locked`, `replay`, `error`, `busy`. Add `&harness=1` to show a state switcher.

## Asset gate

- The first attempt found no approved binaries in the repo. No placeholder candidate was written or committed.
- The owner package `SV01_CLOUD_SESSION_EXACT_ASSET_IMPORT.zip` was unpacked. All 6 files match `SHA256_MANIFEST.json` (bytes + SHA-256). They were committed unchanged under `visual-assets/v10_1/cloud-session/assets/` in commit `4c1f33a`.
- Implementation assets used: `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`, `POSE_TRANSFER_NIK_TACTICAL_V1.png`, `ENV_STADIUM_WARM_BASE_V1.webp`.
- Baseline evidence only: `sv01-v10-desktop-final.png`, `sv01-v10-mobile-final.png`, `SV01_V10_GOLDEN_FRAME_SELF_CONTAINED.html` (SHA `fee72b5a…`, matches the V10 build record).
- No image generation. No mirroring: computed `transform` is `none` on every character image. No asset was edited. Grading uses only CSS filters and overlays.

## Composition record (desktop 1366×768)

| Anchor | Contract | Result |
|---|---|---|
| Horizon | y 300–360 | **y 330** |
| Vanishing point | on horizon, x 455–910 | **(700, 330)**. Ceiling seams, console-top seams and display-foot sides converge on it |
| Manager eyes vs horizon | ±10 px | Daniel 330.0 / Nik 330.0. **Eye-line delta 0 px** |
| Crown-to-chin | 90–130 px | Daniel 124.1 / Nik 120.6 |
| Daniel/Nik head ratio | 1.00–1.10 | **1.029** |
| Architectural verticals | ±1° | **0°** (every mullion, pier and joint is an axis-aligned rect) |
| Stadium vs room horizon | ±8 px | **0 px** by construction (plate row 685 → y 330, see limitation L3) |
| Stadium vs room VP | ±16 px | **0 px** (plate centre x 768 → x 700) |
| Live display | right ~55%, x≈560→1320 | x 560–1320, y 72–628; **UI share 55.6%** |
| Nik tablet to display | ≥24 px | **39.3 px** |
| Character over hit areas | none | none (right-most character alpha x 522.3; first hit area x ≥ 594) |
| Console | top edge y≈600–660 | back edge y 604, front lip y 652, 3 px brushed-brass edge y 652–655 |
| Top bar | 56–64 px | 60 px |

Scales: Daniel ×0.286 at (−40, 232.8); Nik ×0.26 at (236, 242.9). The same geometry is used in every state (M5). The acting manager gets a +8% brightness lift in the shared colour-match filter. Nothing else changes between states.

Depth stack: P0 approved stadium plate, visible only through the glass. P1 glass wall with head transom (underside visible), low transom (top face visible) and two mullions with right-side reveals. P2 acoustic-panel wall and board-formed pier behind the display. P3 Daniel and Nik behind the console. P4 standing console. P5 camera-facing monitor with neck, VP-converging foot and contact shadow. P6 top bar.

Lighting: cool-neutral ambient on the room surfaces, plus a warm camera-right key pool on the wall and console top. On the characters, a soft-light overlay is cool from the left and warm from the right. The glass is directly behind both silhouettes. The zone behind the display is dark and low contrast.

## Mobile record (390×844)

| Contract | Result |
|---|---|
| Top bar 52–60 | 56 px |
| Continuous scene 150–200 directly below | y 56, 180 px, one crop, one horizon (y 148) |
| Both faces, heads ≥56 px | Daniel 78.1 / Nik 76.1 px |
| Daniel left / Nik right, names next to faces | "DANIEL" at x 12–53 (left of Daniel's head), "NIK" at x 292 (right of Nik's head) |
| Spatial cue | glass mullion plus head/low transoms, plus console top and brass edge at the foot of the scene |
| Live task within 300 px | title at y 251 |
| Form values ≥16 px | 16 px |
| No scenic tail | page ends 20 px below the action group |
| No sticky or fixed action | 0 fixed/sticky elements; LOCK MY GUESSES stays in normal flow |

## Source/state QA

The automated run is `tools/render-and-qa.cjs`, output in `evidence/qa-results.json`: **159 / 159 checks passed**.

- **Production copy/state ownership.** Copy and state logic mirror the `GUESS_ENTRY` branch of `pstcRender` in `js/productionSharedTransferChallenge.js`:
  - the three status strings;
  - the live and replay privacy strings;
  - the phase intro;
  - `LOCK MY GUESSES`, disabled while `busy`;
  - `CONTINUE REPLAY · GUESS ENTRY`;
  - `REFRESH SHARED CHALLENGE`, disabled when busy or in replay;
  - value placeholders (`Choose League or Nationality first` → `Search FIFA 17 league` / `Search nationality`);
  - element ids and aria-labels (`p1Guess1Type` … `"Guess 1 against Daniel type"`);
  - the 4-step phase navigator labels.
- **No product behavior changed.** `git diff adc13cf -- js css index.html data` is empty. The candidate makes no network, save or provider calls. The presentation controller only renders a view model it is given.
- **No rival-private data.** Each state renders only the acting manager's own card (`pstcGuessPrefix`). No rival guess or signing ids exist in the DOM. The device faces in the pose assets show no readable content. Neither gaze ends on the display.
- **No forbidden timer.** There is no `role=timer`, no clock text and no "MINUTES" copy in any state.
- **Daniel left of Nik.** Verified on desktop and mobile in all states.
- **No mirroring.** Verified by computed transform, and the exact asset sources are verified.
- **Live controls are semantic DOM.** `main` / `h1` / `ol` (with `aria-current`) / `role=status` / `form` / native `select` + `input` / `button`. Nothing sits under a perspective transform. The live-region error node is `#transferChallengeError`.
- **Busy state.** `LOCK MY GUESSES` and `REFRESH SHARED CHALLENGE` are disabled. `aria-busy` is set and a small spinner shows (static under reduced motion).
- **Error state.** Row 1 has type League and an empty value. The inline text is `TRANSFER_GUESSES_INVALID`, which matches what production shows: `pstcSetError(error.code || …)` renders the code, not the human message.
- **Highlight budget (R3/M6).** LOCK fill luminance is 172.3. The brightest stadium pixel (with characters hidden) is 124.1, p99 is 99.3. The brightest pixel within 48 px of the display edge is 47.5.
- **Squint test (R7).** Under an 8 px blur, the peak warm salience lands inside LOCK MY GUESSES (`evidence/desktop-squint-blur8.png`).
- **Still-frame test (R7).** In grayscale, the glass threshold, console edge and both managers stay separable planes (`evidence/desktop-still-grayscale.png`).
- **Fit.** Every desktop state fits inside the display face with ≥19 px of clearance.

## Evidence (all rendered in this Cloud Session, Chromium 1194 headless, DPR 1)

- `evidence/desktop-{nik-editable,nik-one-row,daniel-editable,nik-locked,replay,error,busy}.png` (1366×768)
- `evidence/mobile-{…same states…}.png` (390×844), plus `mobile-nik-editable-fullpage.png`
- `evidence/compare-desktop-baseline-vs-candidate.png`, `evidence/compare-mobile-baseline-vs-candidate.png` (exact 7/10 baseline next to the candidate at matching viewport)
- `evidence/desktop-squint-blur8.png`, `evidence/desktop-still-grayscale.png`
- `evidence/qa-results.json` (all measurements and per-evidence SHA-256)

Fonts: Barlow Condensed and Barlow from Google Fonts. Production already loads Barlow Condensed. The headless browser had no direct route to Google Fonts, so the font files were fetched through the session proxy with TLS verification intact and served to Chromium from a local cache. A normal browser loads them directly.

## Implementation notes and CSS/SVG fidelity limitations

- **L1: baked warm halo.** Both pose PNGs carry a baked warm rim/halo, strongest on Daniel's hair. Removing it would mean editing the asset, which is not allowed. One shared colour-match filter (`saturate .86 / brightness .95 / contrast 1.03`) and a cool-left soft-light overlay reduce it. It still counts against the warm budget, but the budget checks pass.
- **L2: baked key light.** The poses were lit before this camera existed. The camera-right warm key is approximated with an overlay, not relit.
- **L3: stadium plate geometry.**
  - The plate has only about 75 px of pitch, then a wet track and black/gold fabric in the lower corners. Shown behind the glass at full height, that would expose the fabric.
  - The fix is a low transom at y 398–408 with frosted, acid-etched lower glass beneath it: the same plate, blurred and darkened. The managers' bodies cover most of it.
  - The plate's own horizon and VP were placed by eye (pitch far edge at row 685, centre x 768). They are not photogrammetrically derived.
- **L4: pose constants measured by eye.** Eye, crown and chin rows come from a 50 px grid, about ±5 image px, which is about ±1.5 screen px. Head heights include hair volume.
- **L5: occlusion and crop.** Nik's sleeve overlaps the right corner of Daniel's clipboard. Nik is drawn in front because his face renders larger, so he reads nearer. Daniel's left shoulder is cropped by the frame edge.
- **L6: no combobox search.** The candidate does not load `js/transferSelector.js`. Typing a value without choosing a canonical option fails validation, as it does in production.
- **L7: product-truth items for Sol to confirm.**
  - (a) Production's `transferHero` still shows an inert `00:00` timer element and the `15 MINUTES · …` rules line during GUESS_ENTRY. The candidate omits both (task rule: no Guess Entry timer) and keeps the rule note.
  - (b) `REFRESH SHARED CHALLENGE` is placed in the display header, not after the timer actions.
  - (c) Validation errors show the code `TRANSFER_GUESSES_INVALID`. That is current production behavior, reproduced here, not changed.
- **L8: open composition items for RT-01.**
  - The console front face (y 655–768) is a large dark band.
  - On mobile, REFRESH sits under the title and pushes the phase rail down about 54 px.
  - The mobile rail label "01 Transfer Window" wraps to three lines.
- **L9: desktop scaling.** The stage is 1:1 at 1366×768. Other desktop sizes scale uniformly, never below 0.75. Widths of 760 px or less use the separate mobile composition.

## Exact changed-file list (branch, since `adc13cf`)

Commit `4c1f33a`, asset import (unchanged binaries):
- `visual-assets/v10_1/cloud-session/assets/ENV_STADIUM_WARM_BASE_V1.webp`
- `visual-assets/v10_1/cloud-session/assets/IMPORT_INSTRUCTIONS.md`
- `visual-assets/v10_1/cloud-session/assets/POSE_TRANSFER_DANIEL_FOCUSED_V1.png`
- `visual-assets/v10_1/cloud-session/assets/POSE_TRANSFER_NIK_TACTICAL_V1.png`
- `visual-assets/v10_1/cloud-session/assets/SHA256_MANIFEST.json`
- `visual-assets/v10_1/cloud-session/assets/SV01_V10_GOLDEN_FRAME_SELF_CONTAINED.html`
- `visual-assets/v10_1/cloud-session/assets/sv01-v10-desktop-final.png`
- `visual-assets/v10_1/cloud-session/assets/sv01-v10-mobile-final.png`

Candidate commit:
- `visual-assets/v10_1/cloud-session/candidate/SV01_C2_PROVISIONAL_CANDIDATE.html`
- `visual-assets/v10_1/cloud-session/candidate/SV01_C2_PROVISIONAL_BUILD_REPORT.md`
- `visual-assets/v10_1/cloud-session/candidate/CLAUDE_CLOUD-SV01-01_HANDOFF_TO_SOL_2026-09-27.md`
- `visual-assets/v10_1/cloud-session/candidate/tools/render-and-qa.cjs`
- `visual-assets/v10_1/cloud-session/candidate/evidence/*` (19 PNGs + `qa-results.json`)

No file outside `visual-assets/v10_1/cloud-session/` was modified. There is no merge to main and no PR.

## Reproduce

```
cd visual-assets/v10_1/cloud-session/candidate/tools
NODE_PATH=$(npm root -g) node render-and-qa.cjs [FONT_CACHE_DIR]
```
