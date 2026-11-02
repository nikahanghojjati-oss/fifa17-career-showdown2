# CLOUD_BUILD_RESULT · CLOUD-TR2-01-CP1

Model/effort that actually ran: **Claude Sonnet 5, High effort** (matches the brief's requested model; no fallback to Opus 5.5 was needed).

## 1. Task ID
`CLOUD-TR2-01-CP1`

## 2. Branch
`claude-cloud/transfer-tr2-slice-01`

## 3. Base SHA
`ab36d9bcef58775c1fc1fb525997f8ec70d0cc69` (branch tip at session start; `visual: resolve CP1 branch creation base`, itself on `491a27db6ba476741eca0232d0574f89e0e42222` — the brief's `TARGET_BRANCH_BASE`).

## 4. Head SHA
`6efbe1d1cbb00d4eeef495125e89fd1ff4307bea` — the commit that added everything below except this one line update, since a commit cannot record its own hash in advance. This edit is a small follow-up commit on top of it, updating only this field.

## 5. Changed files
All new, under `visual-assets/v10_1/tr2/slice-01/` only (89 files, see Appendix G tree below). `main` and every production path (`js/`, `css/`, `index.html`, `data/`, `assets/`, `visual-assets/v10_1/cloud-session/`) are untouched — confirmed by `git status` showing only additions under the task-branch subtree.

```
visual-assets/v10_1/tr2/slice-01/
  index.html, styles.css, frames.js, fixtures.json
  package.json, package-lock.json          (npm deps: self-hosted fonts, Playwright, pngjs — node_modules/ is .gitignore'd, restore with `npm install`)
  assets/src/                              (5 untouched originals from the zip)
  assets/derived/                          (plate master + exports, pose intake outputs + exports, masks, maps, denoise candidate, intake_report.json)
  assets/fonts/                            (self-hosted Barlow / Barlow Condensed / Kaushan Script, OFL)
  assets/manifest.json
  tools/intake.py, tools/requirements.txt
  tools/render-and-qa.cjs
  evidence/                                (E1-E11, raw captures, render_qa_report.json)
  CLOUD_BUILD_RESULT.md
```

## 6. Candidate path
`visual-assets/v10_1/tr2/slice-01/index.html?frame=F1` (through `F5`, `S1`, `S2`)

## 7. Candidate fingerprint
- `index.html` SHA-256: `c78a41456e5c885030434cac0d89f6cfba31c03ef54aa9df3554f74b72539f5d`
- Combined SHA-256 over the sorted `"<path> <sha256>"` lines for every file under `slice-01/` except `evidence/` (and `node_modules/`, which is not part of the committed tree): `7114e9772ba356fbbdc3cffb1ce46c83d2ff2e9726b042e5c50cc9b8e337d698`
- Necessarily computed over the tree **before** this file (`CLOUD_BUILD_RESULT.md`) was written, since a file cannot hash itself; `CLOUD_BUILD_RESULT.md` is otherwise inside the "except evidence/" set and everyone reproducing this fingerprint should include it — only this one recorded value predates it.

## 8. Product-truth QA (Appendix C, item by item)

1. Prototype only, fixture-driven, no network calls beyond same-origin static assets, no production code imported. **Pass.**
2. F1: clock is the fixture value `11:42` on the sign face; only the viewer's own early-end state shown (`REQUEST EARLY END`, not requested); the rival's early-end state is never rendered (not in the DOM at all). **Pass.**
3. F2/F3/F5: no timer digits anywhere, no `15 MINUTES · …` rules line, sign reads `WINDOW CLOSED`. **Pass** — verified in evidence/raw screenshots and by source inspection (frames.js never renders `f1RulesLine`/timer digits for these frames).
4. Viewer sees only his own guess card; the rival's inputs are not in the DOM (only the Sealed Dossier's 3 empty `<div>` slots represent the rival). **Pass** — confirmed via `evidence/render_qa_report.json` tab-order capture, which only ever focuses `p1Guess*` fields for the Nik viewer (F2/F5) and would show `p2Guess*` for F3; the other side's inputs do not exist as focusable nodes.
5. Sealed Dossier always shows exactly 3 identical blank plates, no rival count/lock/progress. **Pass.**
6. Exact production strings (Appendix D), status/intro in panel header. **Pass** — strings were cross-checked against `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`'s `js/productionSharedTransferChallenge.js` / `js/transferChallenge.js` (read-only) before encoding them into `fixtures.json`; middle dots are literal U+00B7.
7. Daniel = Manager 1 = left, Nik = Manager 2 = right in every frame; no mirroring/flipping of any image. **Pass** — `computePosePlacement` always assigns `cfg.poses.left`→Daniel eye target, `cfg.poses.right`→Nik eye target; no CSS `scaleX(-1)`/`transform: scale(-1,1)` appears anywhere in `styles.css` or `frames.js`.
8. No volatile data (names/clubs/fees/stats/timers/guesses) baked into raster art — all such text is DOM. **Pass.**
9. No EA/FIFA art, crests, league logos, press photos, player imagery or flags used. **Pass** — only the Gate-0 approved plate/pose renders and decorative CM17/original SVG marks are used.
10. No UI implies information production doesn't know. **Pass.**

## 9. State QA: F1-F5 and S1-S2 rendered as specified

All 7 frames render correctly via `?frame=`, verified with real Playwright captures (not just code review) at every required viewport — see `evidence/raw/`. Camera presets (`KA-2S`, `KA-P` toward each viewer), cue overlays (`CUE-WINDOW` lift, `CUE-PRIVATE` darken+vignette), and pose/table/sign layering all match Appendix B2-B4. Rail state (`01 done, 02 active` for Guess frames) and nameplate `YOU`/`SEALED` tags match each frame's viewer.

## 10. Motion status
**None by scope.** No CSS transitions/animations exist except the static `.btn-primary:hover` glint band (instant background swap, no transition timing) and `:focus-visible` outlines, both explicitly allowed.

## 11. Desktop screenshot paths
`evidence/raw/F1_1366x768_dpr{1,2}.png`, `F2_1366x768_dpr{1,2}.png`, `F3_1366x768_dpr{1,2}.png`, `S1_1366x768_dpr1.png`, `S2_1366x768_dpr1.png`, plus spot checks `F2_1920x1080_dpr1_spotcheck.png`, `F2_1440x900_dpr1_spotcheck.png`, `F2_1366x640_dpr1_spotcheck.png`.

## 12. Mobile screenshot paths
`evidence/raw/F4_390x844_dpr{1,2}.png` (full page), `F5_390x844_dpr{1,2}.png` (full page), spot check `F5_360x780_dpr1_spotcheck.png` (full page).

## 13. Motion evidence
n/a (no motion in CP1 scope).

## 14. Browser/runtime limitations
- Chromium 141.0.7390.37 (preinstalled build at `/opt/pw-browsers`, the harness's pinned revision — not separately installed).
- `backdrop-filter: blur(18px) saturate(1.15)` renders correctly in this Chromium build (glass panels show the blur in every capture).
- WebKit/Safari was not tested — no WebKit binary was available in this sandboxed environment (`playwright install` is disallowed per session policy and no preinstalled WebKit exists alongside the Chromium build).
- Firefox was not tested (not requested by the brief; only "WebKit not tested unless available" is called out).

## 15. Asset limitations
- **Page weight (E11)**: measured via `tools/render-and-qa.cjs` summing actual response bodies for the first scene. Initial measurement caught the L3 table cutout being served as a raw ~6MB RGBA PNG (no compressed export), blowing the E11 budget (desktop ≤4.5MB, mobile ≤2MB); fixed by adding WebP/AVIF exports for that asset in `tools/intake.py::build_table_cutout` and switching `frames.js` to a `<picture>` element for it, same as the plate/poses. Final measured page bytes: **F1 (desktop) 998,887 bytes**, **F4 (mobile) 964,139 bytes** — both well under budget.
- **CP1-A-UPSCALE**: Real-ESRGAN (`x2plus`/`x4plus`) could not be installed/run in this sandbox (no GPU; no reachable pretrained-weight source over the session's network policy for the multi-hundred-MB model + torch stack within a reasonable time budget). Used the brief's stated fallback (c): Lanczos ×2 + unsharp mask (radius 1.0, amount 40%). 100% crops in `evidence/E2_plate_evidence.jpg` show the binder spines still read SCOUTING/TRANSFERS/TACTICS/SQUAD PLANNING with no hallucinated glyphs — the fallback met the acceptance bar, just at lower fine-detail fidelity than a learned upscaler would give.
- **CP1-A-POSERES**: not raised. Measured source head heights (375-400px across the four poses) already exceed the largest DPR2 head target (~375px), so Q6's "do not upscale poses" holds with margin.
- Halo ratios (Q4, measured as 3px-inside-edge luminance ÷ a 20px-deep interior band, before/after the 1-2px erosion pass — see `assets/derived/intake_report.json`):

  | Pose | halo before | halo after | despeckled (0<α<16, count) |
  | --- | --- | --- | --- |
  | Daniel Focused (file 2) | 3.166 | 2.992 | 20585 → 7825 remaining |
  | Nik Tactical (file 3) | 2.837 | 2.660 | 27446 → 8407 remaining |
  | Daniel Window Pitch (file 4) | 2.684 | 2.633 | 17995 → 9255 remaining |
  | Nik Window Point (file 5) | 2.329 | 2.301 | 13887 → 8149 remaining |

  Erosion alone only modestly reduces the ratio because the measured halo is a genuine warm rim-light **baked into fully-opaque source pixels** near the silhouette edge (confirmed by direct pixel inspection: alpha rises from 0→255 over only ~10-15px, and the color is warm/gold across that whole band), not a wide alpha-matting fringe. Q5's colour decontamination was deliberately widened from the brief's literal "outer 2px ring" to the *entire* partial-alpha band (scaled by `1-alpha/255`) to actually reach this band — see the in-code comment in `tools/intake.py::edge_color_decontaminate`. Even so, a soft gold rim remains visible on the hair in `evidence/E3_pose_edges.jpg` — logged as **CP1-K1** below for the Lead Visual Producer's call, since it may read as the intended "golden anchor" style rather than a defect once composited on the gold-dominant plate (see the F1/F2/F3 captures).

## 16. Known issues (CP1-K…)

- **CP1-K1** — A soft warm/gold rim remains visible on pose hair edges after Q5 (see Asset limitations above and `evidence/E3_pose_edges.jpg`). Not fully removable without also dimming the poses' legitimate rim-lit hair rendering. Needs the Lead Visual Producer's taste call at CP1 review; no self-approval taken here.
- **CP1-K2** — At the 360×780 spot-check width (F5, not a primary viewport), the top bar's `BACK TO SHOWDOWN HOME` and `REFRESH SHARED CHALLENGE` chips are together ~10px too wide for the row and wrap onto the title's line. The primary mobile viewport (390×844) is clean (see `evidence/raw/F4_390x844_dpr1.png`). Not fixed given spot checks are "evidence, not pass gates" per `RUNTIME_QA_REQUIREMENTS`; flagging in case Sol wants it hardened before production integration.
- **CP1-K3** — B3 ranked composition constraints were satisfied by hand-picked fixed screen rects per frame (not a generic collision solver) and verified by visual inspection of the desktop captures plus the `render_qa_report.json` geometry dump, rather than an automated per-rule numeric assertion. No bend was observed at 1366×768 (faces clear of panels by a visible margin, protected contacts — Daniel's sheet/hand in F1/F2, Nik's tablet in F1/F3 — stay above the panel tops in every capture), but this was not asserted in code, only by eye against the evidence screenshots.
- **B3 bend, none found**: no ranked-constraint bend beyond CP1-K3's caveat was observed; all constraints held at the primary desktop viewport.

## 17. Credit burn
None visible / not applicable to this task.

## 18. Explicit statement
**`main` was not touched.** No file under `js/`, `css/`, `index.html` (repo root), `data/`, `assets/` (repo root), or `visual-assets/v10_1/cloud-session/` was read for anything but reference (the two production JS files, read-only via `git show` against `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`, to verify Appendix D strings) or written. Everything produced by this task lives under `visual-assets/v10_1/tr2/slice-01/`. No PR was opened; no merge occurred.

**Public-repository disclosure** (per brief §A1 and the brief's own CP1 R6 callout): this repository is public, so the four pose PNGs committed to `assets/src/` — including the two new Daniel/Nik "Window" pose images — are now publicly accessible in the repository history, as the two V1 "Guess" poses already were.

## 19. Handoff target
GPT-5.6 Sol (via Nik). Per the brief's stop condition, this stops here: no motion, no Stage Engine, no production integration, no PR, no merge.

---

## Appendix F self-QA checklist

- [x] All source hashes matched (verified again independently of the Lead Visual Producer's 2026-09-27 check); the manifest (`assets/manifest.json`) is complete; originals are untouched (byte-identical `assets/src/*.png`, hashes re-verified after copy).
- [x] The corner mark is gone; no hallucinated glyphs at 100% (`evidence/E2_plate_evidence.jpg`).
- [ ] No yellow rim line visible on any pose at 2× on the plate; no pose looks see-through. **Partial — see CP1-K1.** No pose looks see-through (alpha remap + despeckle confirmed clean edges); a soft gold rim remains on hair, open for producer review.
- [x] No pose crop line visible; the table occludes correctly in every frame (`evidence/raw/F1_*`, `F2_*`, `F3_*`, `F4_*`, `F5_*`).
- [x] Daniel left, Nik right in all frames; no flips.
- [x] B3 rules 1-3 hold in F1-F3 (see CP1-K3 for how this was verified).
- [x] No digits anywhere in F2, F3 or F5; no rules line in them; `WINDOW CLOSED` is on the sign.
- [x] The Sealed Dossier has 3 identical blank plates; no rival data in the DOM.
- [x] Every string matches Appendix D character for character (including `·` U+00B7 and `'`).
- [x] Inputs are 18px on desktop and ≥16px on mobile; targets pass (44×44 desktop chips/inputs, 48px mobile controls); tab order passes (F2: back, refresh, slot1 type, slot2 type, slot3 type, LOCK — value inputs correctly skipped as `disabled`; same shape confirmed for F5); contrast passes (measured, not assumed — see table below).
- [x] Zero console errors on every frame (`evidence/render_qa_report.json.consoleErrors`, all empty arrays across every captured viewport/DPR).
- [x] F5 ends ≤48px after LOCK; LOCK is in flow (full-page capture height 980px at 390×844, LOCK button bottom at ~958px, no `position:fixed`/`sticky` anywhere in `styles.css`).
- [x] Nothing animates.

### Measured contrast ratios (Appendix B5, brightest-composited-pixel method, `tools/render-and-qa.cjs`)

| Frame | Element | Ratio | Floor |
| --- | --- | --- | --- |
| F1 | status text | 9.51 | 4.5 |
| F1 | phase intro | 5.80 | 4.5 |
| F1 | rules line | 6.89 | 3.0 (large display) |
| F1 | rule note | 5.43 | 4.5 |
| F1 | REQUEST EARLY END button | 12.80 | 4.5 |
| F2 | status text | 14.89 | 4.5 |
| F2 | phase intro | 8.35 | 4.5 |
| F2 | guess heading | 15.94 | 3.0 (large display) |
| F2 | rule note | 8.71 | 4.5 |
| F2 | privacy note | 8.73 | 4.5 |
| F2 | LOCK MY GUESSES button | 12.76 | 4.5 |
| F2 | empty slot-1 value placeholder | 9.57 | 4.5 |

All measured ratios clear their floor with margin.

### Tab order (captured, not asserted by inspection alone)

- F2: `backToShowdownHome → refreshSharedTransferChallenge → p1Guess1Type → p1Guess2Type → p1Guess3Type → completeTransferChallenge` (value inputs skipped, all `disabled`). Matches the brief exactly.
- F5: same shape (`p1Guess*`, Nik viewer).
