# JOB-067 desktop QA

Date: 2026-10-03
Frames: RV1–RV7
Desktop viewports checked: 1366×768, 1440×900, 1920×1080, 1366×640.

## Browser checks
- 28 frame/viewport combinations checked.
- No document/page scroll.
- Daniel marker remained left of Nik marker.
- Primary Back action stayed inside the viewport, including 1366×640.
- No console/page errors in the local review harness.
- The Back button is keyboard reachable and retains the shared visible focus ring.
- Loading, empty, unavailable, partial and transfer-unavailable fixtures render designed content rather than blank areas.

## Mockup / plate check
- The approved Job-25 plate was inspected directly from the current branch and is clean, correctly registered and likeness-locked.
- A connector-local fallback comparison of the RV1 review render to the mockup cleared the shared no-plate fallback thresholds: SSIM 0.635 ≥ 0.55; mean ΔE 7.0 ≤ 14.
- The exact plate-relative H10 calculation could not be rerun in this chat because the GitHub connector exposes the current binary plate for inspection but cannot materialize those bytes into the local browser sandbox.
- The corrected manager overlays are generated only from likeness-locked manager pixels. Daniel's alpha bbox is [192,350,340,552]; Nik's is [1229,497,1537,588].
- Nik's overlay ends above the lower-panel boundary at y=594, so no stale panel/UI pixels enter the cutout.
- Claude should rerun the exact plate-relative mockup gate after applying the binary handoff. No exact plate-relative score is claimed here.

## Page-weight audit
Runtime references WebP art only. PNG overlay masters and diagnostic evidence are source/review files, not first-paint runtime assets. The screen-specific runtime art stays within the desktop budget when shared cached foundation assets are treated as shared, as intended by the factory budget.

## Own scorecard
1. Mockup fidelity — 4/5: measured title/panel geometry and the clean registered plate preserve the reference composition; exact plate-relative H10 is left for Claude's post-handoff rerun.
2. Characters stand out of menu — 4/5: corrected registered hand/arm layers sit above panels with rim/contact treatment.
3. Hands and contact — 4/5: cutouts contain manager pixels only and avoid UI contamination.
4. Lighting and grade — 4/5: approved warm plate, dark glass and shared rim treatment are consistent.
5. Typography/title — 4/5: supplied brush wordmark image, Barlow UI, tabular hero numbers.
6. Panel craft — 4/5: gold-edged glass, measured baselines, original trophy art.
7. Information clarity/honesty — 5/5: only contract stats; unavailable transfers never become zero.
10. Polish/finish — 4/5: desktop no-scroll and no-error checks pass; corrected cutouts remove the stale-overlay artifact.
