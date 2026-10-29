# Craft guide: how to build a Showdown screen that feels like FIFA 17

Read this once per chat before any build, polish or review job. It is the lesson. QUALITY_BAR.md is the exam.

## 1. How a Showdown screen is made (the proven pattern)

Home, League, Club and Transfer were built this way and passed. Copy the pattern exactly; open one of them and read it before you start.

```
visual-assets/v10_1/<screen>/
  index.html          the screen. ?frame=XX picks a state; &grid=1 shows the plate map
  <screen>.css        styles (imports ../shared/*.css once the kit exists)
  <screen>.js         renders the frame from fixtures.json
  fixtures.json       every string, id and preview value (from TRUTH.md); nothing hard-coded in JS
  TRUTH.md            what the real product shows (written by the truth job)
  assets/
    ENV_<SCREEN>_PLATE_V1_1X.webp / _2X.webp   background plate with both managers
    OVL_<SCREEN>_<PART>_V1_2X.png               cut-out overlays (character on top of UI)
    platemap.json     zones: safe UI zones, protected boxes (faces, hands), focal points
    intake_report.md  sizes, SHA-256, how the plate was made
  tools/
    render-qa.cjs     Playwright: screenshots + measured gates → evidence/qa_report.json
    build_preview.py  single-file preview.html for Nik
  evidence/           screenshots and qa_report.json
  review/             review reports
  BUILD_RESULT.md     what was built, how to run it, frames, gate results
```

Run it from the repo root: `python3 -m http.server 8765`, then open `http://127.0.0.1:8765/visual-assets/v10_1/<screen>/index.html?frame=<F>`.

Reference builds to study:
- `visual-assets/v10_1/home/` (plate + tiles + phone band)
- `visual-assets/v10_1/league/` (finger overlay on the wheel: `OVL_DANIEL_FINGER_V1_2X.png`, `tools/make_finger_overlay.py`)
- `visual-assets/v10_1/club/` (hand masks: `tools/make_hand_masks.py`, `assets/handmap.json`)
- `visual-assets/v10_1/tr2/slice-02-plate/` (Transfer War, the first plate build; fonts live in `assets/fonts/`)

## 1b. Five rules from the mockup-fidelity research (read `research/MOCKUP_FIDELITY_REPORT.md`)

1. **Desktop = mockup registration.** At 16:9 the plate is drawn exactly where the mockup has it (`cover`, centred, no extra zoom, no shift). Club broke this (faces scored 0.15–0.24) and that alone made it look unlike the mockup.
2. **Fully clean plates**, so UI floats on the scene. Panels only where the mockup has panels.
3. **Titles are brush wordmark images** made from the mockup's own lettering, with real text hidden for screen readers. Live text uses the fonts.
4. **Mockup objects become art assets** (tile objects, wheel rim, trophies, packs, frames): original transparent WebP, never flat boxes.
5. **Phone is its own composition**: Daniel and Nik as large cut-outs in the top ~55 % over a portrait stadium, controls in the bottom ~45 %.

Weight budget: first paint ≤ 450 KB on phone, ≤ 900 KB on desktop. Serve WebP with `<picture>` and a phone source; the phone loads the ~1179 px portrait art, never the desktop 2X plate; never ship PNG masters.
Safari notes: use `svh`/`dvh` for the visible height; `backdrop-filter` needs `-webkit-` and is costly on large areas; keep each decoded image under about 16 megapixels; no `background-attachment: fixed`; measure only after fonts have loaded.

## 2. The depth sandwich (how characters "stand out of the menu")

A flat background photo with panels on top always looks cheap, because the panel sits in front of the person. In FIFA 17 the person is in front. Build every character screen as five layers:

| z | Layer | What it is |
| --- | --- | --- |
| 0 | Plate | the full scene with stadium and both managers (`ENV_*_PLATE`) |
| 1 | Atmosphere | slow light flares, drifting gold dust, vignette (CSS/canvas, subtle) |
| 2 | UI panels | the DOM: title, panels, tables, buttons |
| 3 | Character cut-outs | the parts of Nik and Daniel that should be **in front** of the UI: shoulder, arm, hand, sometimes the whole figure. Cut from the same plate pixels, so they line up perfectly |
| 4 | Light and grade | rim-light pass on the cut-out edges, contact shadow, top glare, film grain at 2–3 % |

Rules:
- A cut-out is only needed where UI overlaps the person. If no panel touches a character, no cut-out is needed for that character.
- Cut-out edges: erode 1–2 px into the figure, feather 1 px, and decontaminate the fringe (remove stadium colour from semi-transparent edge pixels). Hair: keep the soft edge; never a hard outline.
- Registration must be exact: the cut-out is positioned with the same transform as the plate (same `object-fit`, same focal point). Use one container that holds both and scales together.
- Contact shadow: where a sleeve rests over a panel edge, draw a soft dark shadow on the **panel** (layer 2), 6–14 px blur, 35–50 % black, offset away from the light.
- Rim light: a duplicate of the cut-out mask with a warm gold `drop-shadow` or a masked gradient on the edge facing the stadium lights, 1–3 px, 40–60 % opacity. Subtle. If you can see it as a line, it is too strong.
- Hands: if a hand touches a UI object (wheel, card, trophy), the fingertips go on layer 3 and the object on layer 2, plus a 2–4 px shadow under the fingertip on the object. Study `league/assets/OVL_DANIEL_FINGER_V1_2X.png`.

Tool: `visual-assets/v10_1/shared/tools/cutout.py` (factory job 14) turns a plate plus a polygon from `platemap.json` into a cut-out PNG with clean edges. Until it exists, copy the approach from `league/tools/make_finger_overlay.py`.

## 3. Plates (background scenes)

Each character screen gets one plate made from its mockup: the same scene with every piece of UI, text that is data, navigation bar, and real logos removed, and the empty space painted as stadium and dark atmosphere. The managers stay exactly as in the mockup (their faces are Nik-approved).

How a plate job works (jobs 23–29):
1. Draw a **guide image**: the mockup with cyan rectangles over everything to remove (panels, nav bar, title, buttons, footer bar, real logos). Faces and hands are never inside a rectangle. Save the zones as JSON.
2. Ask ChatGPT image generation for an **edit** of the guide image: "Remove everything inside the cyan rectangles and repaint it as the stadium behind, matching light and perspective. Keep everything outside the rectangles exactly as it is. Remove the cyan lines. Same 16:9 framing, largest size. No text, no logos, no people added."
3. **Likeness lock** (always): resize the edit to the mockup's exact size, then keep the edited pixels only inside the zones (6 px feather) and the original mockup pixels everywhere else. This guarantees the faces are Nik's approved ones, unchanged.
4. Upscale ×2 with Lanczos for the `_2X` file, export WebP (quality 88) and PNG, write SHA-256 into `intake_report.md`.
5. Write `platemap.json`: `faces` (protected boxes), `hands`, `safe_ui` zones, `focal` point for phone crops, and the polygons for cut-outs.

If a generated edit adds a person, text, a logo or changes a face inside a zone: reject it and run the edit again in a **new** chat (max 3 tries). Never edit an edit.

## 4. The Showdown look (tokens)

Shared tokens live in `visual-assets/v10_1/shared/showdown-tokens.css` (job 12). Until then, these are the values:

- Black: `#07080a` (page), `#0d0f13` (panel base), panel glass `rgba(10,11,14,0.78)` with `backdrop-filter: blur(6px)` only on desktop.
- Gold: `#f5c518` (primary button fill), `#ffd34d` (highlight), `#d4a017` (edge), `#8a6a12` (deep). Metallic title gradient: `linear-gradient(180deg,#fff3b0 0%,#ffd34d 35%,#d4a017 70%,#8a6a12 100%)`.
- Text: `#f4f1ea` (primary), `#b9b3a4` (secondary). Never pure white on gold.
- Edge: 1 px `#d4a017` at 70 % + inner 1 px `rgba(255,211,77,0.15)`; corner cut 10–14 px on the top-left and bottom-right.
- Fonts: Kaushan Script (titles), Barlow Condensed 600/700 (labels, numbers), Barlow 400/600 (body). Files: `visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/`.
- Eyebrow: `CAREER MODE SHOWDOWN 17`, Barlow Condensed 600, letter-spacing 0.5em, crown icon centred above.

## 5. Motion recipes (pack-rip grade)

Use the shared motion kit (job 16) once it exists. The feel to copy is the FIFA Ultimate Team pack opening: anticipation, a reveal, a payoff.

- **Scene in (0–400 ms):** plate fades from black and scales 1.04 → 1.00 (ease-out cubic). Light flare drifts across once.
- **Characters (150–600 ms):** cut-outs slide 24 px in from their outer side with opacity 0 → 1, plus a gold rim-light sweep top to bottom.
- **Title (250–700 ms):** brush wipe left to right with `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`, then one metallic glint.
- **Panels (400–900 ms):** rise 16 px with fade, 60 ms stagger, primary button last with a single gold pulse.
- **Numbers:** count up over 500 ms with tabular figures; the leader's number flashes gold once.
- **Reveal moments** (winner, trophy unlock, club reveal): 300 ms anticipation (dim + slight zoom), flash, burst of gold particles (≤ 40, canvas), settle with a slow shine. This is the pack rip.
- Reduced motion: replace everything with a 150 ms fade. Check both `prefers-reduced-motion` and the app setting (`settings.js` motion preference).

## 6. Phone composition patterns

Desktop is wide: managers on the sides, panels in the middle. A phone is tall and narrow, so recompose (each screen has a phone art job that makes the pieces):
- **Heroes on top** (about 55 % of 660 px): the portrait stadium `ENV_<X>_PHONE_V1` with Daniel (left) and Nik (right) as large cut-outs `OVL_<X>_*_PHONE_V1`, heads fully visible, slightly overlapping the UI below; the brush title between or above them. Positions come from `phonemap.json`.
- **Content** in the middle: tabs (Daniel / Nik toggle, or section tabs) or a sideways swipe row (Trophy shelf, Legacy cards). Never a long scrolling list.
- **Primary action** pinned at the bottom inside the safe area (`env(safe-area-inset-bottom)`).
- Rare extras go behind a "More" or "How it works" pop-up.
- Check 393 × 660 (target), 360 × 640, 375 × 553, 390 × 844, 430 × 932, at DPR 3 for 393.

## 7. Evidence and screenshots

Every build ends with screenshots made by `tools/render-qa.cjs` (Playwright). If your chat cannot run a browser, say so in the status file and the review job will be routed to a chat that can. Minimum shot set per frame: 1366 × 768, 1920 × 1080, 1366 × 640, 393 × 660 (DPR 3), 360 × 640, 375 × 553.

Make a **compare sheet** for review: mockup left, build right, same size, plus a 50 % overlay. Tool: `visual-assets/v10_1/shared/tools/compare_sheet.py` (job 17).

## 8. Common failures (do not do these)

- Panel drawn over a face or a hand.
- Character cut-out with a light halo or a dark line around it.
- Upscaled 1x plate on a DPR 3 phone (blurry). Always serve `_2X` on DPR ≥ 2.
- Gold everywhere: gold is for edges, numbers that matter, and one primary button. The rest is black glass.
- All panels the same size and weight. Hierarchy: one hero, then supporting.
- Text in images. All words that change are DOM.
- Copying a real logo "just for the preview". Never.
- Invented stats or buttons that do nothing.
