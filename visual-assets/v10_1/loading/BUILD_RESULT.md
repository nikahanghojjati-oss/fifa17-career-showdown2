# Loading · BUILD_RESULT

Job: JOB-054 · Loading: new look and Reus credit  
Result: PASS

## What was built

- A fixture-driven Loading preview in `visual-assets/v10_1/loading/` using the shared Showdown tokens, type system and stage layers.
- The binding OWNER-4 image remains `assets/marco-reus-2015-cc-by.webp`; no replacement Reus image and no added ball.
- The Home `CAREER MODE SHOWDOWN 17` brush lockup is reused as a loading-specific optimized WebP at 720 × 262 so the Loading first-paint budget stays below the phone limit.
- The loading status remains live DOM text with a gold progress rail and transform-only glint. Reduced motion removes the glint and shared atmosphere animation.
- The exact accessible credit is visible at 12 px with keyboard-focusable links:
  `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`.

## Frames checked

Factory QA rendered `LD1`, `LD2` and `LD6_UNAVAILABLE` at all nine factory viewports:

- 1366 × 768
- 1440 × 900
- 1920 × 1080
- 1366 × 640
- 393 × 660 @3x
- 360 × 640
- 375 × 553
- 390 × 844
- 430 × 932

The shared `factory-qa.cjs` reports H1, H5 and FIXTURE_STRINGS as raw failures on Loading because that generic tool assumes two manager markers, a primary action, and globally-visible fixture strings. Loading intentionally has no Daniel/Nik markers, no primary action, and only renders the active status string. Loading-specific assertions therefore treat those three checks as not applicable and verify the applicable behavior directly.

## QA result

- PASS · No page/body/stage scroll at all nine viewports.
- PASS · Credit is exact, 12 px, fully inside every viewport, not aria-hidden, and the two links receive keyboard focus in the required order.
- PASS · Reus source decodes as 900 × 1520 at every viewport; phone uses `object-position: 50% 0%` so the face is protected and lower figure is sacrificed first on short screens.
- PASS · Desktop reserves the top 52 px by starting the athlete frame below that strip; final 1366 × 768 evidence keeps faces and titles out of the reserved strip.
- PASS · Identity and status blocks stay inside every tested viewport; the smallest measured gap between them is 43.61 px.
- PASS · Reduced-motion factory gate H7 has zero running animations in every tested run.
- PASS · No console errors, failed requests, out-of-bounds controls or sub-16 px inputs in the factory runs.
- PASS · Credit contrast is 9.59:1 against the protected near-black credit floor.
- PASS · Phone first-paint resource weight is 324,795 bytes, below the 460,800-byte (450 KB) limit.

Evidence:
- `evidence/factory_qa_report.json`
- `evidence/FACTORY_QA_SUMMARY.md`
- `evidence/loading_metrics.json`
- `evidence/LD1_1366x768.webp`
- `evidence/LD1_393x660.webp`
- `evidence/LD1_375x553.webp`

## Production replacement

This preview is the visual replacement specification for the existing root `index.html #loadingScreen` startup markup and the Loading-only selectors in `css/app.css` from `#loadingScreen` through `.startupPhotoCredit`. Production integration must preserve the current startup lifecycle IDs/classes used by `js/app.js` and browser tests, including `#loadingScreen`, `#startupAthlete`, `#loadingText`, `.is-ready`, `.is-exiting` and `.hidden`.

This factory job does not modify `main`.
