Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, hosted Cloud session
Model: **Opus 5.5 · Medium**. Sonnet 5 is not permitted in this project. If Opus 5.5 is not offered, STOP and tell Nik; do not substitute.
Branch: continue on `claude-cloud/transfer-tr2-slice-01` from `646e227aa71cd5d712c791e6436ece103a2e2dfd`
Role: apply exact deltas and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik)

# CLOUD REVISE BRIEF · CP1R · Transfer War static key frames

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-27
Product-truth sign-off: `signed / 2026-09-27 · GPT-5.6 Sol`

```
TASK_ID: CLOUD-TR2-01-CP1R
STOP_BUDGET: 30 min wall-clock / $6 credit (Nik watches the credit meter; you watch `date`)
PRIORITY_ORDER: M1 > M2 > M3 > M4 > R2 > R1 > R3 > R5 > R4 > evidence
SCOPE: only the deltas below, under visual-assets/v10_1/tr2/slice-01/. main, production files, PRs and merges are untouched, as in CP1.
```

## Cost rules (binding)
1. Record the start time with `date` at the start. Commit and push after M1–M4 are done (checkpoint commit), then again at the end.
2. At **24 min** (80%): stop adding scope. Finish the item in hand, capture the evidence listed for the completed items, commit, write the result, and list the unfinished items as `NOT DONE`. At **30 min**: stop.
3. No new installs beyond `npm ci` (existing lockfile) and `pip install -r tools/requirements.txt --break-system-packages`. No ML models, torch or upscalers. Do not run `playwright install`.
4. Do not re-run the plate intake or re-verify hashes of files you don't touch. Re-run only the pose functions this brief names.
5. If any item fails its gate twice, mark it `BLOCKED` with the measured values and move on. No third attempt.
6. Capture only the evidence listed at the end.

## MUST (in order)

**M1 · Guess panel fits and is never clipped (F2/F3, desktop)**
1. Spacing only; no font, control or copy changes:
   - `.guess-viewer-panel` padding `14px 20px 14px`;
   - `.guess-viewer-panel .phase-intro` margin-top `6px`;
   - `.guess-heading` margin `6px 0 2px`;
   - `.guess-viewer-panel .rule-note` margin-bottom `8px`;
   - `.scouting-slot` height `52px`;
   - `.scouting-slots` gap `6px`, margin-bottom `10px`;
   - panel `top` `324px` on both sides (nameplates follow at top − 34).
   - Gate: panel bottom ≤ 756 at 1366×768. If it is still over, lower `top` in 2 px steps to no less than 318.
2. Desktop frames: `.scene-stage { height: max(100vh, 768px); }`. Remove vertical `overflow:hidden` from `html`, `body`, `#stage-root` and `.scene-stage`, and keep `overflow-x:hidden`. Scene-fit and camera math must read the stage box, not `window.innerHeight`.
3. Add hard-fail assertions to `tools/render-and-qa.cjs`:
   - (a) F2 and F3 at 1366×768: every descendant of `.guess-viewer-panel` has bottom ≤ 756, and `document.scrollingElement.scrollHeight ≤ 768`.
   - (b) F2 at 1366×640: after `scrollIntoView()` on `#completeTransferChallenge`, `document.elementFromPoint` at its centre returns it.
   - (c) F2 at 1366×768: inject the text `QA ERROR LINE` into `#transferChallengeError` at runtime only (never in fixtures or captured frames). It must pass the same reachability test.

**M2 · Mobile control height.** Add `.mobile-layout .slot-fields select, .mobile-layout .slot-fields input { flex: 0 0 auto; height: 48px; min-height: 48px; }`. Assert height ≥ 48 CSS px at 390×844 and 360×780, and ≥ 44 on desktop.

**M3 · 360 px top bar.**
- `.mobile-layout .top-bar { height:auto; min-height:48px; padding:4px 12px; column-gap:8px; row-gap:6px; }`.
- `@media (max-width:380px) { .mobile-layout .ghost-chip { padding:6px 10px; letter-spacing:.02em; font-size:12px; } }`.
- Strings stay verbatim. Assert no bounding-box intersection among the top-bar chips, the title and the rail items at 360×780 and 390×844.

**M4 · Sign text behind the managers.**
1. Move the sign-face text element into the camera container between L1 (cues) and L2 (poses). Keep the id `transferTimerDisplay`. F1 keeps `role="timer"` and `aria-live="off"`.
2. F2/F3: fit `WINDOW CLOSED` to ≤ 80% of the measured sign-face width, **and** keep its text box ≥ 12 px clear of both hair silhouettes at 1366×768. Measure the silhouettes from the pose alpha as rendered. Keep the 70% dim and no digits.
3. F1: the clock is unchanged. Assert its box is ≥ 8 px from both head silhouettes.

## SHOULD (after M1–M4)

**R2 · Nik skin.** Export WebP (q ≥ 90, alpha) and AVIF (alpha) from `assets/derived/POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png`. Point F1/F4 at them. In the manifest, set the candidate's role to shipping and keep the non-denoised intake for provenance.

**R1 · Guess-pose hair rim (files 2 and 3 only; derived copies only; ONE pass).**
- Region: the hair band only, rows from the POSEMAP `crown_y` down to `min(eye_left.y, eye_right.y) − 20`.
- Pixels: those 0–8 px inside the alpha edge.
- Operation: L\* × 0.80 at the edge, rising linearly to × 1.00 at 8 px; then reduce the b\* excess over the local interior mean by 60%.
- Outputs: re-export WebP/AVIF, update the manifest, and record the halo ratio before and after.
- Do not tune; the producer judges.

**R3 · Rail scrim (desktop).**
- Add an L4 scrim: x 0–300, y 56–280, black 55%, feathered 32 px.
- Measure rail contrast with the existing brightest-pixel method: active/done ≥ 4.5, upcoming ≥ 3.0.
- If upcoming fails, raise `.phase-rail li` opacity from .55 in steps to at most .70.

**R5 · Sealed Dossier (desktop F2/F3).**
- frame: 2 px `linear-gradient(#8A6A2E, #C99B45, #8A6A2E)` at 100%;
- lock glyph: 28 px, brass at 95%;
- seal emblem: 56 px, brass fill at 85% with a darker emboss stroke;
- slot plates: 3 identical, 1 px brass outline at 45%, fill `rgba(255,255,255,.04)`;
- shadow: `box-shadow: 0 18px 24px -8px rgba(0,0,0,.7)` plus a 6 px-tall soft ellipse shadow at the base;
- **remove** the inner `DANIEL · SEALED` / `NIK · SEALED` text on desktop only. The nameplate `SEALED` chip and the mobile F5 bar stay.

**R4 · F1 mottos.** Add a backing strip continuous with each nameplate: the nameplate's width, black 70%, feathered 12 px. Motto colour: brass at 90%. They stay `aria-hidden`.

## Evidence (only these; PNG; overwrite in `evidence/raw/` with the same names)
- F1 1366×768 DPR 1 and DPR 2; F2 and F3 1366×768 DPR 1 and DPR 2; F2 1366×640 DPR 1, full-page capture.
- F4 390×844 DPR 1; F5 390×844 DPR 1 and DPR 2, full page; F5 360×780 DPR 1, full page.
- `E3R_guess_hair.jpg`: files 2 and 3 hair at 2×, before and after R1, on #3C3C3C and on the plate under CUE-PRIVATE; halo ratios printed.
- `E8_F2_blur8px.png` re-rendered.
- `render_qa_report.json` with the new assertions, all PASS or reported.

## Return (`CLOUD_BUILD_RESULT_CP1R.md`, also pasted as the final message)
1. Model and effort that ran.
2. Start and end time, and elapsed minutes.
3. Head SHA.
4. Each item M1–R5: DONE / NOT DONE / BLOCKED, with the measured gate values (panel bottom; control heights; intersections; sign text box vs silhouettes; halo ratios; rail contrast).
5. Changed files.
6. Evidence paths.
7. A statement that `main` and production files are untouched.

Stop after this. No motion, no Stage Engine, no PR, no merge.