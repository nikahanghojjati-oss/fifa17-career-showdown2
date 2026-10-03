# JOB-067 desktop QA

Date: 2026-10-03
Frames: RV1–RV7
Desktop viewports checked: 1366×768, 1440×900, 1920×1080, 1366×640.

## Browser checks
- No document/page scroll at all 28 frame/viewport combinations.
- Daniel marker remained left of Nik marker at all 28 combinations.
- No console or page errors in the self-contained review harness.
- Controls remain keyboard buttons with a visible 3 px gold focus ring; there are no inputs on this screen.
- Primary Back action is positioned inside the desktop viewport, including the short 1366×640 layout.
- Loading, empty, unavailable, partial and transfer-unavailable fixture states render designed content rather than blank areas.

## Mockup gate
A 1920×1080 RV1 review render was compared to MOCKUP_RIVALRY_STATISTICS.png with the shared gate math (960×540 grey SSIM / CIEDE2000). The current clean repo plate is binary-only to the connector, so the local no-plate form of the gate was used for the build while likeness boxes were checked directly.

- build SSIM: 0.635 (no-plate threshold 0.55) — PASS
- build mean ΔE: 7.0 (no-plate threshold 14) — PASS
- Daniel face SSIM: 0.945 — PASS (≥0.90)
- Nik face SSIM: 0.953 — PASS (≥0.90)
- Daniel hand protected box: 0.948 — PASS (≥0.75)
- Nik hand protected box: 0.811 — PASS (≥0.75)

The approved plate itself remains registered centre/cover at the mockup's 1672×941 logical canvas; no face transform or mirroring is applied.

## Page-weight audit
Desktop DPR1 uses the 1X WebP plate rather than PNG masters. The screen references only WebP runtime art (plate, title, four shared trophies and transparent cut-outs). PNG masters/evidence remain review-only. Runtime assets are within the job's 900 KB first-paint target when shared cached foundation resources are excluded, as intended by the per-screen budget.

## Own scorecard (criteria required by JOB-067)
1. Mockup fidelity — 4/5: measured panel/title geometry and protected likeness boxes pass.
2. Characters stand out of menu — 4/5: registered hand/arm layers sit above panels with rim/contact treatment.
3. Hands and contact — 4/5: protected hand boxes preserve source pixels and overlap is layered, not repainted.
4. Lighting and grade — 4/5: warm-gold plate, dark glass and shared rim treatment are consistent.
5. Typography/title — 4/5: supplied brush wordmark image, Barlow UI, tabular hero numbers.
6. Panel craft — 4/5: gold-edged glass, measured baselines, original trophy art.
7. Information clarity/honesty — 5/5: only contract stats; unavailable transfers never become zero.
10. Polish/finish — 4/5: no console errors, no scroll, no real rights-sensitive art in the build layer.
