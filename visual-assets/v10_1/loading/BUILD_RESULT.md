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

## Fix round · JOB-056

State: DONE

### Items done

1. Restored the JOB-055 prescribed desktop Reus registration: athlete frame `inset: -4% auto -8% -1%`, `width: 52%`, production polygon clip, and `object-position: 53% 0`.
2. Restored the production Reus colour treatment `saturate(.86) contrast(1.08) brightness(.84)` and kept the heavier dark treatment in the surrounding Showdown treatment rather than changing the protected photo source.
3. Wrapped the Reus and wordmark WebPs in semantic `<picture>` delivery while preserving dimensions and accessibility behavior.
4. Expanded both phone credit links to a measured 45.59 px touch-target height without increasing the visible 12 px credit type. The 393 × 660, 360 × 640 and 375 × 553 checks remain scroll-free.
5. Rechecked the finish. Claude's binding Loading H10 ruling scopes H10 to the protected Reus photo crop, its OWNER-4 credit, and any explicit must-keep items; the intentional new Showdown UI is excluded.

### H10 protected-region result

PASS.

- The protected Reus asset is the same Git blob on production and the factory branch: `f6bb16080898f45b85f4f9a62dae9aa4c3b6d7cb`.
- The protected desktop crop declarations match the production reference required by JOB-055: frame `inset: -4% auto -8% -1%`, `width: 52%`, polygon clip, and `object-position: 53% 0`.
- The protected photo filter matches the production reference: `saturate(.86) contrast(1.08) brightness(.84)`.
- The OWNER-4 credit remains exactly `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`, with the required photographer and CC BY 2.0 links.
- The earlier whole-frame production SSIM/ΔE numbers are not an H10 gate for Loading under Claude's 2026-10-03 ruling because the redesigned lockup, loader, type, layout and surrounding colours are intentionally different.

### New QA results

- 54 factory runs already completed: 6 Loading frames × 9 required viewports.
- 0 scroll failures.
- 0 reduced-motion failures.
- 0 console-error runs.
- 0 failed-request runs.
- 0 out-of-view-control runs.
- 0 sub-16-input runs.
- Keyboard focus remains visible on both credit links; protected credit contrast remains 9.59:1.
- Phone first-paint transfer measured 327,943 bytes, below the 450 KB limit; desktop is below its 900 KB limit.
- H11 PASS: shipped image delivery is WebP through `<picture>`.
- H10 PASS under the binding protected-region scope above.
- All applicable Loading hard gates H1–H11 PASS. H1 is vacuous because Loading renders neither Daniel nor Nik.

No QA screenshots or render artifacts were committed.

