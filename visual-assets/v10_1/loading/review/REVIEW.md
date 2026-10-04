# Loading · Independent Review · JOB-055

Verdict: FAIL

Static score: 3.56 / 5.00 over criteria 1–7, 9 and 10. The static pass line is 4.20, no criterion below 3, and every hard gate PASS. This build misses the score line, has criteria 1 and 2 below 3, and fails H10 and H11.

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 2/5 | At 1366×768 and 1920×1080 the build keeps the Home brush lockup language but substantially moves the Loading reference scene: Reus changes from the production left-side full-figure crop to a much larger centre-left torso/face crop, and H10 fails every threshold. |
| 2. Characters stand out of the menu | 2/5 | Reus is a dark full-bleed background layer with the title crossing his torso rather than a foreground figure reading in front of the UI; the face is also noticeably softer from desktop enlargement. |
| 3. Hands and contact | 4/5 | The visible anatomy comes from the unmodified licensed photo and no UI slices through a visible hand, but the desktop cover crop removes most of the full-figure hand read present in the production reference. |
| 4. Lighting and grade | 3/5 | The black/gold hierarchy is coherent, but the face is over-dark and the green stadium/photo tones remain visually detached from the warm gold title and rail. |
| 5. Typography and title treatment | 4/5 | The Home brush wordmark, letter-spaced eyebrow, condensed status type and small support line are crisp and consistent with the Showdown identity. |
| 6. Panel craft | 4/5 | The splash wisely stays panel-light and the progress rail is clean and restrained, but the character/UI depth integration is limited because the photo remains entirely behind the interface. |
| 7. Information clarity and honesty | 5/5 | The startup state is understandable immediately, no gameplay data is invented, and the required credit is exact, visible and linked accessibly. |
| 9. Phone composition | 3/5 | 393×660, 360×640 and 375×553 all fit without scrolling and the portrait crop is cinematic, but the two credit links are only 14px high and miss the 44×44 touch-target bar. |
| 10. Polish and finish | 3/5 | There are no console errors, request failures or reduced-motion regressions, but the 900px source is visibly softened when stretched across desktop and H11's required `<picture>` delivery is absent. |

Average: (2 + 2 + 4 + 3 + 4 + 4 + 5 + 3 + 3) / 9 = 3.56.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | Loading renders neither Daniel nor Nik, so there is no order or mirroring violation. |
| H2 · Rights | PASS | The sole real-player image is the explicit Loading-only Marco Reus exception. The visible credit is exactly `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`, with the required photographer and licence links. |
| H3 · No data baked into images | PASS | The only visual images are the licensed Reus photo and decorative Career Mode Showdown wordmark; no live/private names, scores, fees, stats, timers, codes or guesses are baked in. |
| H4 · Product truth | PASS | Loading has no gameplay controls or recorded stats; it renders only startup status/support copy and the binding rights credit. |
| H5 · Phone fit | PASS | Independent QA measured zero horizontal/vertical scroll at 393×660 and 360×640. Loading has no primary action, so the 375×553 primary-action clause is not applicable. |
| H6 · Input size / contrast | PASS | There are no inputs. The credit measured 9.59:1 against the protected near-black floor; shared primary/secondary text tokens also clear 4.5:1 on that floor. |
| H7 · Reduced motion | PASS | 54 factory QA runs reported zero reduced-motion failures; the independent 393×660 DPR-3 check found zero running animations after settling. |
| H8 · Keyboard | PASS | The only two controls are the credit links. Tab reaches Tim Reckmann then CC BY 2.0, and both show a visible 2px focus outline. |
| H9 · Console / requests | PASS | Across 54 runs there were 0 console-error runs and 0 failed-request runs. |
| H10 · Mockup diff | FAIL | Using current production Loading as the Loading reference/plate baseline: build SSIM 0.366 vs required ≥0.850, ΔE 23.3 vs required ≤6.0, Reus face 0.380 vs ≥0.900, hand boxes 0.346 and 0.345 vs ≥0.750. Registration/scene movement is the first failure. |
| H11 · Page weight / image delivery | FAIL | First-paint transfer measured 327,427 bytes, below 450 KB phone and 900 KB desktop, and the shipped visuals are WebP; however both Reus and the wordmark are plain `<img>` WebPs rather than WebP sources delivered through `<picture>`. |

## QA and comparison evidence

The independent run exercised all six Loading frames at all nine factory viewports: 54 runs total, with 0 scroll failures, 0 reduced-motion failures, 0 console-error runs, 0 failed-request runs, 0 out-of-viewport controls and 0 sub-16px input failures.

The required visual comparisons and H10 outputs were generated in the review sandbox from the committed branch: GOAL_HOME vs build at 1366×768 with 4× face/hand boxes, current production Loading vs build at 1366×768 with 4× Reus face/hand boxes, the 1920×1080 H10 side-by-side, heatmap and scores, plus the 393×660/375×553 phone captures. Per WORKER_HANDBOOK §7.2, screenshots, QA renders, heatmaps and side-by-side files are not committed or sent; their measured results are recorded above. Independent Actions run: 37124765020.

H10 numeric output:

```json
{
  "build": {
    "ssim": 0.366,
    "ssim_coarse": 0.235,
    "dE_mean": 23.3,
    "boxes": {
      "face_reus": 0.380,
      "hand_left": 0.346,
      "hand_right": 0.345
    }
  },
  "plate": {
    "ssim": 1.0,
    "ssim_coarse": 1.0,
    "dE_mean": 0.0
  },
  "gate": {
    "faces_ge_0.90": false,
    "other_boxes_ge_0.75": false,
    "ssim": false,
    "dE": false,
    "PASS": false
  }
}
```

## Fix list

1. Registration first — `visual-assets/v10_1/loading/loading.css`, selectors `.startupAthleteFrame` and `#startupAthlete`: restore the desktop Reus geometry to the current production reference before any further styling: `.startupAthleteFrame { inset: -4% auto -8% -1%; width: 52%; clip-path: polygon(0 0,88% 0,100% 100%,0 100%); }` and `#startupAthlete { object-position: 53% 0; }`. Keep the new Showdown UI on top, but do not enlarge or recenter the player. Target after rerun: face SSIM ≥0.90, each hand box ≥0.75 and no protected-box displacement visible in the 50% overlay.

2. Protected-photo colour — `visual-assets/v10_1/loading/loading.css`, `#startupAthlete` and `.startupAthleteFrame::after`: stop the heavy full-frame dark/sepia treatment from changing the reference face/kit region. Start from the production photo filter `saturate(.86) contrast(1.08) brightness(.84)` and move the black/gold mood into the right-side UI/scrim instead of across Reus. Target after rerun: overall ΔE ≤6.0 relative to the reference/plate and overall SSIM ≥0.850 while the UI remains legible.

3. H11 image delivery — `visual-assets/v10_1/loading/index.html`, `#startupAthlete` and `.loadingWordmark img`: wrap both images in semantic `<picture>` elements with `<source type="image/webp" ...>` using the existing WebP assets and preserve the existing dimensions/alt/accessibility behavior. Target: H11 PASS with phone first paint ≤450 KB and desktop ≤900 KB and no PNG master loaded.

4. Phone touch targets — `visual-assets/v10_1/loading/loading.css`, phone rule for `.startupPhotoCredit a`: enlarge each credit-link hit area to at least 44×44 px without increasing the visible 12px credit type, for example with inline-block vertical padding balanced by negative block margin. Target: measured anchor rect height ≥44px for both links at 393×660, 360×640 and 375×553, with zero page scroll and the full credit still inside the viewport.

5. Recheck finish — rerun all six frames × nine viewports, H10 at 1920×1080 and the 200%/400% zoom audit after fixes. Target: every H1–H11 gate PASS, criteria 1 and 2 ≥3, no criterion below 3, and static average ≥4.20.
