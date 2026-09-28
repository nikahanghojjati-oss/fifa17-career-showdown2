Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, hosted Cloud session
Model: Sonnet 5 (if Sonnet 5 is not in the picker: Opus 5.5 at Medium; record which ran)
Effort: High
Branch: `claude-cloud/transfer-tr2-slice-01` (Sol creates it from `visual/cinematic-system-v10` at the SHA in TARGET_BRANCH_BASE)
Role: implement this frozen brief and produce evidence. No taste authority. No self-approval.
Input authority: this brief (self-contained); `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962` (read-only, for strings and IDs only); the uploaded zip `TR2_CP1_ASSETS.zip`
Expected output: CP1 static key frames and the intake pipeline, committed to the task branch, plus `CLOUD_BUILD_RESULT.md`
Return to: GPT-5.6 Sol (via Nik)
Stop condition: stop after Checkpoint 1. No motion, no transitions, no Stage Engine, no production integration, no PR, no merge.

# CLOUD_BUILD_BRIEF · CP1 · Transfer War static key frames

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-27
Product-truth sign-off: `signed / 2026-09-27 · GPT-5.6 Sol`

```
TASK_ID: CLOUD-TR2-01-CP1
VISUAL_PACKAGE_ID: VPP-TRANSFER-V1 + V1.1 delta (VPD-02 Part 2) + VPD-03 + GATE0-R2. Everything CP1 needs is restated in this brief.
TARGET_BRANCH_BASE: visual/cinematic-system-v10 @ PENDING_BRANCH_CREATION_SHA
IMPLEMENTATION_SCOPE:
  Step 1: asset intake (Appendix A): verify, clean, upscale the plate, derive masks and maps, write the manifest.
  Step 2: build a static, fixture-driven prototype page at visual-assets/v10_1/tr2/slice-01/ that renders five frames (F1–F5, Appendix B) plus two plate-only cue stills.
  Step 3: render the evidence (Appendix E), run self-QA (Appendix F), commit, write CLOUD_BUILD_RESULT.md, stop.
DO_NOT_TOUCH: main; production js/, css/, index.html, data/, assets/; visual-assets/v10_1/cloud-session/; any asset registry JSON; the approved source binaries (derive copies only; never overwrite an original). No image generation of any kind. No AI inpainting that invents content beyond the corner-mark patch. No PR. No merge.
PRODUCT_TRUTH: Appendix C. Exact production strings are in Appendix D; do not paraphrase them.
ASSETS_REQUIRED: the five Gate 0 files (Appendix A table). The Lead Visual Producer assembled `TR2_CP1_ASSETS.zip` (SHA-256 `1e38367cfc4a170b47ae133bd7aa838b4b1b3b061703d70ec7fe8b5a059b2454`, 7 entries: the folder `TR2_CP1_ASSETS/`, the five PNGs and `ZIP_MANIFEST.txt`) and verified all five PNG hashes on 2026-09-27. Verify every hash again anyway. No key-art reference is used in CP1.
ASSET_HASHES_OR_IDS: Appendix A (SHA-256 of the source files as uploaded). Fail closed: if any required file is missing or its hash mismatches, build nothing and return a CLOUD_BUILD_RESULT stating which file failed.
NEW_ASSET_TICKETS: none. If an asset cannot meet a rule, record a stable issue ID (CP1-A-*) with the exact incompatibility. Do not work around it with generated art.
PRIMARY_VIEWPORTS: 1366×768 (DPR 1 and 2); 390×844 (DPR 2, plus DPR 1). Spot checks: F2 at 1920×1080, 1440×900 and 1366×640; F5 at 360×780.
PHASES_STATES_INCLUDED: F1 WINDOW_OPEN live (Nik viewer); F2 GUESS_ENTRY editable-empty (Nik viewer); F3 GUESS_ENTRY editable-empty (Daniel viewer), desktop only; F4 = F1 on mobile; F5 = F2 on mobile. Plate-only cue stills: CUE-WINDOW and CUE-PRIVATE.
MOTION_TICKETS_INCLUDED: NONE. Static frames only. No CSS transitions or animations in the shipped CSS, except hover and focus styles on controls.
UI_TICKETS_INCLUDED: Appendix B §B4: tokens, type, top bar, phase rail, lockup, Window brief panel, Guess viewer panel, scouting slots, primary and secondary buttons, nameplates, Sealed Dossier, hanging-sign display, panel scrims.
RESPONSIVE_REQUIREMENTS: Appendix B §B2–B3 (stage model, camera presets, ranked composition constraints, mobile rules).
ACCESSIBILITY_REQUIREMENTS: Appendix B §B5.
RUNTIME_QA_REQUIREMENTS: Playwright with the preinstalled Chromium (do not run `playwright install`). Zero console errors on every frame. Tab-order check on F2 and F5. Contrast measured on the composited frame (Appendix B §B5). Record layout measurements as evidence, not as pass gates.
EVIDENCE_REQUIRED: Appendix E.
FILES_EXPECTED: Appendix G.
FINGERPRINT_REQUIRED: SHA-256 of index.html, plus one combined SHA-256 over the sorted list of "<path> <sha256>" lines for every file under visual-assets/v10_1/tr2/slice-01/ except evidence/.
STOP_CONDITION: after the Checkpoint 1 evidence: commit to the task branch, push, write CLOUD_BUILD_RESULT.md, stop. main untouched.
RETURN_SCHEMA: Appendix H.
```

---

## Appendix A · Intake manifest

### A1. Source files (from `TR2_CP1_ASSETS.zip`, uploaded by Nik)

| # | File | Role | Source SHA-256 (must match) | Source facts |
| --- | --- | --- | --- | --- |
| 1 | `ENV_TR2_WARROOM_PLATE_V1.png` | War-room plate, every frame | `224a674659c853834d48e92411ffec5325b3c70c6e34f1d4e779a820128b15bb` | 1672×941 RGB, no alpha |
| 2 | `POSE_TRANSFER_DANIEL_FOCUSED_V1.png` | Guess Entry, Daniel (left). Golden anchor: never modify the original | `8c9cde1e4ef118d57ca9b1b6dacc7429bb70494e5f8ebce853ed7f46036b2c49` | 1122×1402 RGBA |
| 3 | `POSE_TRANSFER_NIK_TACTICAL_V1.png` | Guess Entry, Nik (right). Golden anchor: never modify the original | `92c40b1290b06945122ba442bb0368c8025cc20b39e494c3d69926396b8488f5` | 1122×1402 RGBA |
| 4 | `POSE_TR2_DANIEL_WINDOW_PITCH_V1.png` | Window, Daniel (left) | `e606f640fcc0fceb57991c585e59d0366dc955dd83ebba1b14cddb5d9b397d2e` | 1024×1536 RGBA, alpha 0–254 |
| 5 | `POSE_TR2_NIK_WINDOW_POINT_V1.png` | Window, Nik (right) | `ea7d465e70488045a1ebdaf431ecd6db205a89c5b2439a32f942f1c08e6c77ac` | 1024×1536 RGBA, alpha 0–254 |

- If files 2 or 3 are missing from the zip, fetch them from branch `claude-cloud/sv01-v10-1-c2-provisional-build`, path `visual-assets/v10_1/cloud-session/assets/`, with git (sparse checkout). Then verify the hash as above.
- Files 1, 4 and 5 exist only in Nik's zip. If any is missing, fail closed.
- Commit the untouched originals to `assets/src/` on the task branch. Note in the result that the repository is public, so these images become publicly visible, as the V1 poses already are.

### A2. Plate operations (file 1), in order

| Step | Operation | Parameters | Output / check |
| --- | --- | --- | --- |
| P1 | Verify SHA-256 | — | fail closed on mismatch |
| P2 | Remove the corner mark | Region x 1560–1660, y 14–51 in native pixels (the mark sits at about x 1570–1650, y 20–45). Use classical inpainting (OpenCV Telea or Navier-Stokes) or a clone patch from the adjacent ceiling/glass texture. Do this before upscaling. | 4× crop before and after (E2). No trace of the hexagon or its characters. |
| P3 | Upscale ×2 to 3344×1882 | Open-source upscaler, in this order of preference: (a) Real-ESRGAN `RealESRGAN_x2plus`; (b) Real-ESRGAN `x4plus`, then Lanczos down to 3344×1882; (c) any other open-source super-resolution model. If none installs, use Lanczos ×2 plus unsharp mask (radius 1.0, amount ≤ 40%) and log issue **CP1-A-UPSCALE**. | 100% crops (E2) of the binder spines, the CM17 mug, the hanging sign, the crowd and the tactics surface. **No hallucinated letters or glyphs.** The binder spines must still read SCOUTING / TRANSFERS / TACTICS / SQUAD PLANNING, or be blank. |
| P4 | Save the master | `assets/derived/ENV_TR2_WARROOM_PLATE_V1_MASTER.png` (3344×1882) | record SHA-256 |
| P5 | Export page images | AVIF and WebP at 3344 and 1672 wide (AVIF quality about 60, WebP about 82; raise them if banding shows in the sky or bokeh); `<picture>` with srcset | record bytes and SHA-256 |
| P6 | Plate map | `assets/derived/ENV_TR2_WARROOM_PLATEMAP_V1.json` in normalised (u,v), **measured on the plate**: hanging-sign body rect and **sign-face rect**; table far-edge polyline across both standing spots; left and right standing-spot columns; glass/stadium region polygon; tactics glow-surface polygon; binder and prop areas; horizon estimate | overlay render (E5) |
| P7 | Table cutout | `ENV_TR2_WARROOM_TABLEMASK_V1.png`: alpha cutout of the table and everything in front of the far edge, **from the same master plate** (polygon plus 1–2 px edge refine). Layered above the poses, so their lower crop hides behind the table. | no visible pose crop line in any frame |
| P8 | Cue masks | `LIGHTRIG_GLASS`, `LIGHTRIG_TACTICS`, `LIGHTRIG_SIGNFACE`: greyscale, feathered 12–24 px (at master scale), same size as the master or half size | used by CUE-WINDOW / CUE-PRIVATE |
| P9 (optional) | Blurred plate | `ENV_TR2_PLATE_BLUR_V1`: 18 px Gaussian, 50% size. Only if you need a `backdrop-filter` fallback. | — |

### A3. Pose operations (files 2–5), in order

Apply the same pipeline to all four poses. Write outputs to `assets/derived/<ID>_INTAKE.png` and never modify the originals.

| Step | Operation | Parameters |
| --- | --- | --- |
| Q1 | Verify SHA-256 | fail closed |
| Q2 | **Alpha remap** | Set every alpha value in 248–254 to 255. Reason: all four poses have semi-transparent interiors. Measured on files 2 and 3: about 60% of pixels at 252–253, 0.02% at 255. Files 4 and 5 were measured at about 55% at 253 and 6–10% at 252 (Gate 0 R2). Composited as-is, the bodies are about 1% see-through. |
| Q3 | Despeckle | Set alpha to 0 where alpha < 16 **and** the pixel is more than 4 px from the alpha ≥ 128 body mask. Files 2 and 3 carry 8,777 and 13,789 such faint speck pixels in the background. Report the before and after counts for all four files. |
| Q4 | Edge erosion | Erode the partial-alpha edge by 1 px (3×3 minimum filter on alpha where alpha < 255 after Q2). Measure the **halo ratio**: mean luminance of a 3 px band inside the silhouette edge on the side **away** from the key light, divided by the interior mean luminance of a 20 px band further in. If the ratio is still > 1.5 on the hair or shoulders, erode 2 px in that region only. Record the ratio before and after, per pose. |
| Q5 | Edge colour decontamination | For edge pixels (0 < alpha < 255, plus a 2 px ring inside the edge), pull RGB toward the colour of the nearest fully opaque pixel at least 4 px deep, weighted by (1 − alpha/255). Then, in the outer 2 px ring, cut warm/yellow chroma (Lab b*) that exceeds the local interior mean by about 50%. Record the parameters. Goal: no yellow or gold rim line when the pose sits on the plate. The warm **directional** key light on faces and suits stays; only the edge glow goes. |
| Q6 | No resize | Poses are **not upscaled** in CP1. Source head heights are about 430 px (files 2, 3; estimate) and about 384 px (files 4, 5; estimate). Both cover the largest desktop DPR 2 head (about 375 px). If any frame renders a pose at more than 1.0 source pixel per device pixel, log issue **CP1-A-POSERES** and do not upscale. |
| Q7 | Export | Lossless PNG master, plus WebP (alpha, quality ≥ 90) and AVIF (alpha) for the page. Record the SHA-256 of each. |
| Q8 | Pose map | `assets/derived/POSEMAP_V1.json`, per pose, in source pixels: crown y, chin y, head height, both eye centres, the protected contact points (Appendix B §B3), and the bottom crop line. Estimates by inspection are fine; mark them `"estimate": true` (±6 px). |

### A4. Nik skin check (file 5 only; producer decision at CP1 review)

- Build F1 and F4 with the **Q-pipeline output, without denoise**.
- Also produce a candidate `POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png`:
  - Q-pipeline output plus a light skin-only denoise;
  - OpenCV `fastNlMeansDenoisingColored` with h = 3, hColor = 3, template 7, search 21;
  - applied only inside a feathered (8 px) mask covering the forehead, cheeks and nose;
  - the mask **excludes** eyes, brows, lashes, lips, beard, hair and ears;
  - blended at 60%. Record the mask polygon.
- **Do not ship the candidate in the frames.** Claude decides at the CP1 review from evidence E4.

### A5. Manifest

Write `assets/manifest.json`, one entry per file (sources, intake outputs, page exports, masks, maps). Fields: asset ID, role, path, width, height, mode, SHA-256, `derived_from` (source SHA-256), operations applied with parameters, tool and version, date. The manifest is the single truth for hashes in the result.

---

## Appendix B · Frames, stage and composition

### B1. Frames

"Viewer" means the manager whose device renders the page. Daniel is **always left**, Nik **always right**. No mirroring or flipping of any image, ever.

| Frame | Viewport | Viewer | Phase / state | Camera | Cue | Poses (left / right) |
| --- | --- | --- | --- | --- | --- | --- |
| **F1** Window | 1366×768 | Nik | `WINDOW_OPEN`, live, own early end **not** requested; clock fixture `11:42` | `KA-2S` | CUE-WINDOW | file 4 / file 5 |
| **F2** Guess | 1366×768 | Nik | `GUESS_ENTRY`, editable, all three slots empty, not busy, no error, not locked | `KA-P` toward Nik | CUE-PRIVATE | file 2 / file 3 |
| **F3** Guess, mirror | 1366×768 | Daniel | same as F2 with roles swapped | `KA-P` toward Daniel | CUE-PRIVATE | file 2 / file 3 |
| **F4** Window, mobile | 390×844 | Nik | as F1 | mobile strip | CUE-WINDOW | file 4 / file 5 |
| **F5** Guess, mobile | 390×844 | Nik | as F2 | mobile strip | CUE-PRIVATE | file 2 / file 3 |
| **S1** / **S2** | 1366×768 | — | plate only, no poses, no UI | `KA-2S` | CUE-WINDOW / CUE-PRIVATE | none |

The page selects a frame with `?frame=F1` … `?frame=S2`; `fixtures.json` holds the state for each. Include no dev controls inside the rendered canvas.

**Fixture identity data** (clearly fixture values; Sol may replace the club names with the live showdown's clubs):
- `managers.playerOne = "Daniel"`, `managers.playerTwo = "Nik"`;
- `clubs.playerOne = "Juventus"`, `clubs.playerTwo = "Borussia Dortmund"`;
- `seasonNumber = 1`.

### B2. Stage model

- **Stage:** one 16:9 container, cover-fitted to the viewport, in normalised plate coordinates (u,v). A camera preset is a CSS transform (scale plus focus point) on the stage. Static in CP1, but set it through CSS custom properties so CP2 can animate it.
- **Layer stack**, bottom to top:
  - L0 plate;
  - L1 cue overlays;
  - L2 poses;
  - L3 table cutout;
  - L4 panel scrims (screen-aligned);
  - L5 world-anchored DOM (sign-face text, nameplates, Sealed Dossier, Window brief panel);
  - L6 HUD glass (Guess viewer panel, rail, lockup);
  - L7 top bar.
- Mark the scene layers L0–L3 `aria-hidden="true"`.
- **Camera presets** (the plate is 16:9, so at 1366×768 and ×1.00, u maps to u×1366 px and v to v×768 px):

  | Preset | Scale | Focus (u,v) | Target head height, crown to chin |
  | --- | --- | --- | --- |
  | `KA-2S` | ×1.00 | (0.50, 0.50) | 150–170 px |
  | `KA-P`, Nik viewer | ×1.10 | (0.545, 0.50) | F1 head × 1.10 (±3%) |
  | `KA-P`, Daniel viewer | ×1.10 | (0.455, 0.50) | F1 head × 1.10 (±3%) |

- **Pose placement:**
  - Each manager stands in his measured standing-spot column behind the table's far edge. The L3 table cutout hides the crop line.
  - Eye-point targets from the key art: Daniel (0.33, 0.21), Nik (0.68, 0.24), each ±0.03. Where the plate's standing spots disagree, the standing spots win. Record the actual values.
  - Daniel's and Nik's head heights are within 6% of each other in every frame.
  - **Continuity:** a manager's head height and eye point in F2/F3 equal his F1 values after the camera transform, ±3%. The Guess poses (files 2, 3) have different canvases from the Window poses (4, 5), so scale each pose by its **measured head height**, not by canvas size.
  - A per-pose CSS grade is allowed to match the plate light at the standing spot: brightness 0.90–1.05, a small warm/cool shift. Record the values. No glow, drop shadow, outline or halo may be added.

### B3. Ranked composition constraints (desktop)

When constraints collide, the higher rank wins. Report every constraint you bent and by how much.

1. **No UI covers a face.** Keep ≥ 8 px clearance from the face box: hairline to chin, ear to ear.
2. **Every live control and all production copy for the frame is visible without scrolling at 1366×768.**
3. **Protected contacts stay visible above any panel or dossier**, ≥ 12 px clear:
   - file 4, Daniel: the open, palm-up hand gesturing toward Nik, and the blank sheet;
   - file 5, Nik: the index finger touching the tablet, and the tablet's top edge;
   - file 2, Daniel: the pen-to-chin hand (the clipboard may be partly covered by his own panel in F3);
   - file 3, Nik: the stylus hand and stylus tip (the tablet's lower half may be covered by his own panel in F2).
4. **Head-height targets** (B2). You may drop to 140 px (KA-2S) or 155 px (KA-P) to satisfy 1–3.
5. **Target zones** (starting points, not law):
   - F1 Window brief panel: centred, 480–520 px wide, top y ≥ 430, bottom ≤ 748.
   - F2 Nik's panel: x about 700–1320, top about 330.
   - F2 Daniel's Sealed Dossier: about 340–380 × 220–250 px on the left half, top y ≥ 430.
   - F3 mirrors F2: Daniel's panel x about 46–666; Nik's dossier on the right half.
   - The vertical rail sits in the left column, x 24–260.
   - Each panel has a screen-aligned dark scrim beneath it (L4): black at 60–75%, feathered 24–40 px, following the panel footprint. This stops the glowing tactics surface competing with the form (Gate 0 finding G0-R2).

**Privacy gaze rule (F3):** the rival Nik (file 3) looks down and toward image-left. In F3 his eyeline must land on **his own Sealed Dossier or the table in front of him, never on Daniel's live panel**. Keep Daniel's panel's right edge left of Nik's eyeline projection (expected at about x ≤ 650) and place Nik's dossier in that eyeline. Evidence: E7.

### B4. UI components and tokens

All live text is semantic DOM, screen-aligned (no skew, no perspective on text), in Barlow and Barlow Condensed (OFL; self-host via `@fontsource/barlow` and `@fontsource/barlow-condensed`).

**Tokens:**

| Token | Value |
| --- | --- |
| `--twr-black` | `#07090C` |
| `--graphite` / `--graphite-raised` | `#151A20` / `#222932` |
| `--glass-tint` | `rgba(10,12,16,.74)` (minimum `.66` only where contrast still passes), over `backdrop-filter: blur(18px) saturate(1.15)` |
| `--brass` | `#C99B45` |
| `--gold-active` / `--gold-press` | `#F2C45B` / `#D9A93E` |
| `--warm-white` / `--muted` | `#F4EFE5` / `#B9B4A8` |
| `--error` | `#E88F7E` |
| `--focus-ring` | `#F4EFE5`, 2 px, 3 px offset |

The world is gold-dominant. The gold primary button must still be the most saturated gold at its own location. The plate's gold light never out-shouts it.

**Type:**

| Role | Desktop | Mobile |
| --- | --- | --- |
| Sign-face clock | fitted to about 70% of the sign-face height, tabular digits, Condensed 700 | 56–60 px (min 52) |
| Status line | Condensed 600, 15–16 px, uppercase | 14–15 px |
| Panel heading | Condensed 700, 24–28 px | 21–24 px |
| Input values | 18 px | ≥ 16 px (never less) |
| Labels / slot numerals | 13 px / 26–30 px | 13 px / 24 px |
| Notes, intro, privacy, rule note | Barlow 14–16 px, sentence case | 14–15 px |

Letter-spacing 0.04–0.08 em on uppercase utility labels only.

**Components:**

1. **Top bar (56 px):**
   - a black-to-transparent gradient over the scene;
   - left: ghost chip `‹ BACK TO SHOWDOWN HOME`;
   - next to it, left-aligned: the title `SEASON 1 SHARED TRANSFER CHALLENGE` (Condensed, 15 px);
   - right: ghost utility `REFRESH SHARED CHALLENGE`.
   - **Keep the top-centre clear for the hanging sign**; do not centre the title.
2. **Lockup "TRANSFER WAR":**
   - SVG artwork made from an OFL brush font converted to outlines (Kaushan Script via `@fontsource/kaushan-script` or `opentype.js`; another OFL brush face is acceptable; record its licence);
   - gold fill with a thin dark stroke; `aria-hidden`; top-left under the top bar, ≤ 340 px wide.
   - F1/F4: full size. F2/F3/F5: a compact 28–32 px mark above the rail, or omitted if it crowds.
3. **Phase rail:**
   - production navigator markup (`#transferPhaseNavigator`, steps `01 Transfer Window`, `02 Guess Entry`, `03 Signing Entry`, `04 Verdicts`), uppercased by CSS only;
   - desktop: vertical list in the left column;
   - done: brass tick plus brass text. Active: 3 px gold bar plus warm-white text. Upcoming: muted at 55%.
   - F1: 01 active. F2/F3/F5: 01 done, 02 active.
   - Mobile: a compact horizontal rail under the top bar.
4. **Hanging-sign display (L5):**
   - DOM text mapped onto the measured sign-face rect, aligned within 2 px at `KA-2S`;
   - warm-white Condensed 700, a 2 px LED scanline texture, static bloom `text-shadow: 0 0 18px rgba(242,196,91,.35)`;
   - F1: `11:42` (element `role="timer"` `aria-live="off"`);
   - F2/F3: `WINDOW CLOSED`, dimmed to about 70%, with **no digits**;
   - The sign stays where the plate has it (no lift in CP1).
   - Mobile F4: the clock may be a screen-space plate centred on the sign's x and larger than the sign face, with ≥ 8 px clearance from both faces.
5. **Window brief panel (F1/F4):** glass material, 2 px brass side rails, one 12 px chamfer at top-right. Order:
   - status line with a live-dot glyph;
   - phase intro;
   - rules line;
   - rule note;
   - `REQUEST EARLY END` (secondary: raised graphite, 1 px brass border, warm-white text, 52 px tall).
   - Status and intro are production copy (Appendix D) and sit in the panel header.
6. **Guess viewer panel (F2/F3/F5):** same material. Order:
   - header: lock glyph, then status line, plus a `PRIVATE` chip at right;
   - phase intro;
   - heading (for example `Nik guesses Daniel's signings`);
   - rule note as helper text;
   - three scouting slots;
   - desktop action row: privacy note on the left (14 px, up to 3 lines), `LOCK MY GUESSES` on the right;
   - empty error line (`#transferChallengeError`, reserved, zero height when empty).
   - **Vertical budget at 1366×768:** header 20 + intro 20 + heading 32 + rule note 38 + slots (3×56 + 2×8) + action row 56 + gaps and padding ≤ 90. That is about 440 px; adjust the gaps before the type.
7. **Scouting slot (56–64 px):**
   - numeral plate `01`/`02`/`03` (brass outline, empty state);
   - the **native `<select>`**, restyled (≥ 44 px tall, custom caret), options `Guess type` / `League` / `Nationality`;
   - the value `<input>`, disabled, placeholder `Choose League or Nationality first`.
   - Use the production IDs and aria-labels for the viewer's own card (Appendix D).
   - Desktop: select and input side by side. Mobile: stacked, each full width, 48 px.
8. **Primary button (gold bar):**
   - 52–56 px tall, ≥ 240 px wide on desktop, full width on mobile;
   - vertical gradient `#F6D06E` → `#E8B84D`; text `#120E06`, Condensed 700, 18–20 px; 12 px chamfer.
   - States to style (only default and focus are rendered in CP1): hover (one static 30° glint band; no animation in CP1), focus-visible (ring), pressed, disabled.
9. **Nameplates (world-anchored):**
   - `MANAGER 1 · DANIEL` plus club, and `MANAGER 2 · NIK` plus club, bound to the fixture names;
   - opaque backing;
   - the viewer's plate carries a gold `YOU` tag; in F2/F3/F5 the rival's plate carries a `SEALED` chip;
   - no counts or progress anywhere.
   - F1: on the table surface, flanking the brief panel. F2/F3: the viewer's plate attaches to his panel's top edge on the outer side; the rival's attaches to the dossier's top edge. Rule B3-1 and B3-3 still apply.
10. **Mottos (F1/F4 only, decor, `aria-hidden`):**
    - `Skill. Vision. Magic.` under Daniel's nameplate;
    - `Tactics. Discipline. Progress.` under Nik's;
    - Barlow italic 13 px, brass at 80%.
11. **Sealed Dossier (the rival's; F2/F3 desktop):**
    - a frosted glass slab standing on the rival's half of the table, about 360×240;
    - brushed-brass frame;
    - a brass lock at top centre;
    - an original SVG wax-seal emblem (a CM17 monogram is allowed);
    - **always exactly three blank slot plates of identical size**, whatever the rival's real state;
    - no text other than its nameplate. It must read as a physical object on the table, with a soft contact shadow on the table surface.
    - Mobile F5: a compact bar under the scene strip: lock glyph plus `DANIEL · SEALED`.
12. **Cues:**
    - **CUE-WINDOW:** the plate as graded, with the glass region lifted about +8%.
    - **CUE-PRIVATE:**
      - glass/stadium region multiplied down to about 55–60% luminance;
      - tactics glow surface down to about 45%;
      - warm table practicals kept;
      - a slightly stronger vignette.
    - Both stay gold-dominant. Implement both as L1 overlays through the P8 masks (opacity and blend modes). Do not re-grade the plate file.

### B5. Accessibility floor (CP1)

- **Contrast:** ≥ 4.5:1 for body, notes and inputs; ≥ 3:1 for large display text. Measure against the **brightest composited pixels behind each text block** in the rendered frame. Raise the glass tint or scrim until it passes.
- **Focus:** the visible focus ring is independent of any glint. Tab order equals visual order. In F2 the order is: back, refresh, slot 1 type, slot 1 value (disabled, so skipped), slot 2 type, slot 3 type, LOCK.
- **Targets:** ≥ 44×44 on desktop and ≥ 48 px tall on mobile.
- **Screen readers:** the scene and all decor are `aria-hidden`. The status is `role="status"`; the timer is `role="timer"` with `aria-live="off"`.
- **Zoom:** at 200% text zoom, F2 reflows with no clipped text (page scroll is fine).

### B6. Mobile (390×844)

- **Scene strip:** a plate crop in which both managers show head heights **≥ 64 px**, Daniel left and Nik right. Re-anchor a pose layer only if a face would be cut.
- **F4:**
  - strip 330–360 px, with the clock between the heads;
  - below it: nameplates row (YOU on Nik), mottos, the brief panel (the action is full width), rules line and rule note.
- **F5:**
  - strip 170–190 px, CUE-PRIVATE; the sign may crop;
  - then the rival bar `DANIEL · SEALED`;
  - then the full-width viewer panel (slots stacked, privacy note, `LOCK MY GUESSES` full width **in flow**, never fixed or sticky);
  - the page ends ≤ 48 px after the LOCK button.
- **Top bar:** back chip left, refresh right, both verbatim at 12–13 px. The title moves under the rail at 12 px.
- **Controls:** 48 px tall; input values ≥ 16 px.
- **360×780 spot check (F5):** everything stacks; heads ≥ 52 px.

---

## Appendix C · Product truth (binding)

1. Prototype only: fixture-driven, no network calls, no production code imported or modified.
2. **F1 Window:**
   - the clock is a fixture value shown on the sign face;
   - only the **viewer's own** early-end state is shown (here: not requested → button `REQUEST EARLY END`);
   - never show, count or imply the rival's early-end request.
3. **F2/F3/F5 Guess:**
   - **no timer digits anywhere** (not `00:00`, not a countdown);
   - no rules line `15 MINUTES · …`;
   - the sign reads `WINDOW CLOSED`.
4. The viewer sees **only his own** guess card. The rival's card and inputs are not in the DOM.
5. The Sealed Dossier always shows three blank plates. It never shows or implies the rival's count, lock state or progress.
6. Use exact production strings (Appendix D); do not paraphrase. The status line and phase intro sit in the panel header (a presentation move only).
7. Daniel = Manager 1 = left; Nik = Manager 2 = right, in every frame and viewport. No mirroring.
8. Nothing volatile is baked into raster art: no names, clubs, fees, stats, timers or guesses. Decorative text is allowed (CM17, binder spines, TRANSFER WAR, mottos).
9. No EA/FIFA art, crests, league logos, press photos or player images. CP1 has no player imagery and no flags.
10. No UI element states or implies anything production does not know (no "rival is typing", no "3/3", no confirmations).

---

## Appendix D · Production strings and IDs

Source: `main@f077b9c`, `js/productionSharedTransferChallenge.js` (`pstcRender`, `pstcRenderProgress`, `pstcSyncGuessValue`), `js/transferChallenge.js` (`ensureTransferPhaseLayout`), `index.html#transferChallenge`.

| Use | Exact string |
| --- | --- |
| Title | `SEASON 1 SHARED TRANSFER CHALLENGE` |
| Back | `BACK TO SHOWDOWN HOME` |
| Refresh | `REFRESH SHARED CHALLENGE` |
| Rail | `01` `Transfer Window` · `02` `Guess Entry` · `03` `Signing Entry` · `04` `Verdicts` (container `aria-label="Transfer Challenge progress"`) |
| F1 status | `TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD` |
| F1 intro | `Shared Transfer Window · both managers see the same clock and may jointly end it early.` |
| F1 action | `REQUEST EARLY END` |
| F1 rules line | `15 MINUTES · MAX 3 SIGNINGS EACH · 3 OPPONENT GUESSES` |
| Rule note (F1, and Guess helper) | `A guess is either a league or nationality. Any signing matching a correct guess must be released before the season begins.` |
| Guess status | `GUESS ENTRY · YOUR RIVAL CANNOT SEE THESE BEFORE COMPLETION` |
| Guess intro | `Private Guess Entry · enter only your guesses; your rival cannot read them yet.` |
| Guess heading, Nik viewer | `Nik guesses Daniel's signings` (id `guessAgainstOneHeading`) |
| Guess heading, Daniel viewer | `Daniel guesses Nik's signings` (id `guessAgainstTwoHeading`) |
| Privacy note | `Shared privacy: enter only your guesses. Your rival cannot read them until both managers complete the challenge.` |
| Select options | `Guess type` (value "") · `League` · `Nationality` |
| Value placeholder, type empty | `Choose League or Nationality first` (input disabled) |
| Primary | `LOCK MY GUESSES` (id `completeTransferChallenge`) |
| Sign labels (presentation, PT-09) | `WINDOW CLOSED` |
| Presentation tags (PT-09) | `YOU`, `SEALED`, `PRIVATE`, `MANAGER 1 · DANIEL`, `MANAGER 2 · NIK` |

**IDs:**
- The Nik viewer's own guess fields are `p1Guess1Type`…`p1Guess3Type` and `p1Guess1Value`…`p1Guess3Value`, aria-labels `Guess N against Daniel type` / `Guess N against Daniel value`.
- The Daniel viewer's are `p2Guess*`, aria-labels `Guess N against Nik …`.
- Other IDs: status `transferPhaseStatus` (`role="status"`, `aria-live="polite"`); timer `transferTimerDisplay`; error `transferChallengeError`; early end `endTransferTimer`; privacy `transferGuessPrivacyNote`; intro `transferPhaseIntro`.

---

## Appendix E · Evidence (commit under `visual-assets/v10_1/tr2/slice-01/evidence/`)

Keep evidence compact: PNG for frames and JPEG q90 for contact sheets.

| ID | Evidence |
| --- | --- |
| E1 | Intake contact sheet: the 5 sources and their intake outputs, each labelled with ID, size and SHA-256 (the first 12 characters on the sheet; full hashes in the manifest) |
| E2 | Plate: corner-mark region before and after at 4×; upscale 100% crops (binders, CM17 mug, sign, crowd, tactics surface) |
| E3 | Poses: for each of the 4, 2× crops of hair and shoulder edges before and after intake, on #3C3C3C grey, on white, and on the plate at its standing spot; a table of halo ratios and despeckle counts |
| E4 | Nik skin: file 5 face at F1 display size, DPR 1 and DPR 2, original next to the denoise candidate; plus a 1:1 source crop of each |
| E5 | Plate-map overlay: sign and sign-face rects, far-edge polyline, standing columns, glass and tactics polygons, eye points, on the master plate |
| E6 | S1 and S2 cue stills, side by side |
| E7 | F3 with Nik's eyeline drawn (from eye centre along the gaze direction), plus Daniel's panel rect |
| F1–F5 | Each frame at every primary viewport and DPR listed. F5 as a full-page capture. |
| E8 | F1 and F2: grayscale version and 8 px blur (squint) version |
| E9 | F2 with keyboard focus on slot 1 type (focus-ring check) |
| E10 | Spot checks: F2 at 1920×1080, 1440×900 and 1366×640; F5 at 360×780 |
| E11 | `measurements.json`: per frame, head heights, eye points, face boxes, panel, dossier and nameplate rects, clearances for B3 rules 1 and 3, font sizes, contrast ratio per text block (with the backdrop sample used), page bytes for the first scene (desktop ≤ 4.5 MB, mobile ≤ 2 MB compressed) |

---

## Appendix F · Self-QA before returning (Sonnet checklist)

Tick each item in the result. Any "no" becomes a known issue with an ID.

- [ ] All source hashes matched; the manifest is complete; originals are untouched.
- [ ] The corner mark is gone; no hallucinated glyphs at 100%.
- [ ] No yellow rim line visible on any pose at 2× on the plate; no pose looks see-through.
- [ ] No pose crop line visible; the table occludes correctly in every frame.
- [ ] Daniel left, Nik right in all frames; no flips.
- [ ] B3 rules 1–3 hold in F1–F3, or each bend is reported.
- [ ] No digits anywhere in F2, F3 or F5; no rules line in them; `WINDOW CLOSED` is on the sign.
- [ ] The Sealed Dossier has 3 identical blank plates; no rival data in the DOM.
- [ ] Every string matches Appendix D character for character (including `·` U+00B7 and `'`).
- [ ] Inputs are 18 px on desktop and ≥ 16 px on mobile; targets pass; tab order passes; contrast passes.
- [ ] Zero console errors on every frame.
- [ ] F5 ends ≤ 48 px after LOCK; LOCK is in flow.
- [ ] Nothing animates.

---

## Appendix G · Files expected (task branch)

```
visual-assets/v10_1/tr2/slice-01/
  index.html            (frames via ?frame=F1..F5|S1|S2)
  styles.css
  frames.js             (fixture loader + static scene state only; no animation code)
  fixtures.json
  assets/src/           (the untouched originals from the zip)
  assets/derived/       (intake outputs, page exports, masks, PLATEMAP, POSEMAP, denoise candidate)
  assets/manifest.json
  tools/intake.py       (reproducible A2–A4 pipeline; requirements pinned in tools/requirements.txt)
  tools/render-and-qa.cjs (Playwright capture + measurements + checks)
  evidence/
  CLOUD_BUILD_RESULT.md
```

Structure the DOM by layer (B2), so the CP2 Stage Engine can drive the camera, cues and poses without restructuring.

---

## Appendix H · Return (CLOUD_BUILD_RESULT.md, also pasted as the final message)

1. Task ID
2. Branch
3. Base SHA
4. Head SHA
5. Changed files
6. Candidate path (`visual-assets/v10_1/tr2/slice-01/index.html?frame=…`)
7. Candidate fingerprint (both hashes)
8. Product-truth QA: Appendix C, item by item
9. State QA: F1–F5 and S1–S2 rendered as specified
10. Motion status: "none by scope"
11. Desktop screenshot paths
12. Mobile screenshot paths
13. Motion evidence: n/a
14. Browser/runtime limitations: Chromium version; `backdrop-filter` support; WebKit not tested unless available
15. Asset limitations: CP1-A-* issues, the upscaler actually used, halo ratios before and after
16. Known issues with stable IDs (CP1-K1…), including every B3 bend
17. Credit burn, if visible
18. An explicit statement that `main` and the production files were not touched
19. Handoff target: GPT-5.6 Sol

Also record the model and effort that actually ran. No self-approval of visual quality: the verdict belongs to the Lead Visual Producer.