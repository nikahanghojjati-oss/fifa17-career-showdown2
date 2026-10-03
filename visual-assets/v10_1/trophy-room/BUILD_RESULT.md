# Trophy Room desktop build result · JOB-057

State: desktop build complete.

## Run

From the repository root:

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/visual-assets/v10_1/trophy-room/preview.html`, or load a specific fixture with `index.html?frame=TR1`.

## Frames

- **TR1** — ready history, both managers have trophies, ALL selected.
- **TR2** — empty new career; all four trophy families stay visible, dark, and say `Not won yet`.
- **TR3** — partial provider history with visible 2-of-3 coverage and `AVAILABLE RECORDS`.
- **TR4** — ready history with `LEAGUE TITLES` selected.
- **TR5** — career history unavailable; no numeric history is invented.
- **TR6** — provider history loading; no fake zeroes are shown.
- **TR7** — Nik leads by the contract ranking, while Daniel remains first/left and Nik second/right.

Every fixture is reachable with `?frame=TRN` and the preview strip.

## Mockup reconciliation

The build keeps the mockup's night-stadium ceremony, the approved brush `TROPHY ROOM` title, Daniel on the left, Nik on the right, the central hero trophy/plinth, gold-edged shelf, category strip and centred Back action.

Product truth overrides the mockup where required:

- Replaced real/competition-specific cups with the four original factory trophies: Showdown Champion, League Title, Domestic Cup and Continental/Champions League.
- Uses exactly `ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE`.
- Dropped ABOUT, SPECIAL, Super Cup and unsupported competition-specific cards/stats.
- Counts, manager names, ranks, records and state messages are live DOM text from fixtures; no live/private values are baked into images.
- Each trophy card keeps Daniel's count on the left and Nik's on the right. Zero-win families remain present and say exactly `Not won yet`.
- Ready history uses `ALL-TIME RECORDS`; partial history uses `AVAILABLE RECORDS` and coverage.
- The platemap authoritatively declares no arm/hand crossing a panel edge, so no artificial character cutout was fabricated.

## Desktop QA

Factory browser QA ran all seven frames at all four required desktop targets: **28/28 PASS** at 1366×768, 1440×900, 1920×1080 and 1366×640. Desktop H1/H5/H6/H7, control bounds, fixture strings, console and request gates all pass.

The 1920×1080 contract audit passes Daniel-left/Nik-right ordering, exact five tabs, exact four trophy families, no forbidden mockup competition strings, no page scroll, keyboard traversal through all tabs and Back, visible 3 px focus rings, zero console errors and zero failed requests.

First-paint resource total is **855,932 bytes**, below the **900 KB** desktop budget.

Mockup-diff gate:

| Metric | Build | Plate baseline | Result |
| --- | ---: | ---: | --- |
| SSIM | 0.512 | 0.527 | PASS |
| Coarse SSIM | 0.502 | 0.521 | diagnostic |
| Mean ΔE | 12.1 | 13.5 | PASS |
| Daniel face SSIM | 0.976 | 0.996 | PASS |
| Nik face SSIM | 0.982 | 0.996 | PASS |
| Daniel hand SSIM | 0.979 | 0.996 | PASS |
| Nik hand SSIM | 0.972 | 0.989 | PASS |

All protected-box, SSIM and ΔE gates pass. Evidence is under `visual-assets/v10_1/trophy-room/evidence/`.

## Own QUALITY_BAR scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 5/5 | The plate stays registered to the mockup; protected faces/hands are 0.972–0.982 SSIM and the full mockup-diff gate passes against a 0.527 plate SSIM baseline. |
| 2. Characters stand out of the menu | 4/5 | Daniel and Nik retain the approved plate pixels with shelf/title/hero staged between and below them; the authoritative map requires no overlap cutout, so no seam-producing fake extraction was added. |
| 3. Hands and contact | 5/5 | Both protected hand boxes remain almost identical to the approved plate (0.979 Daniel, 0.972 Nik) and no live panel crosses them. |
| 4. Lighting and grade | 4/5 | The approved warm stadium grade remains untouched; the hero adds a restrained spotlight, gold rim/glow, plinth reflection and grounded shadow without recolouring faces. |
| 5. Typography and title treatment | 5/5 | The approved transparent brush wordmark image is used with hidden semantic title text; supporting type uses the shared condensed/body system and tabular hero numbers. |
| 6. Panel craft | 4/5 | The shelf uses gold-edged dark glass, real original trophy art, equal card rhythm, overlap tab bar and one restrained secondary Back action; no placeholder icons or cover panels remain. |
| 7. Information clarity and honesty | 5/5 | Four trophy families, manager order, rankings, five record families and loading/empty/partial/unavailable/ready states all follow the contract without invented data. |
| 10. Polish and finish | 5/5 | 28/28 desktop QA runs pass, there are no console/request errors, keyboard focus is visible, and first paint stays below budget. |

Average across criteria 1–7 and 10: **4.63 / 5**.

## Known gaps / later work

- This is the **desktop** build job. The current provisional phone shelf intentionally fails the shared `CONTROL_BOUNDS` check for the last category tab; phone composition is not claimed complete by JOB-057.
- The screen reserves the shared navigation spaces. Final shared top/bottom navigation integration belongs to the navigation factory work (including job 125), not this desktop screen build.
- Motion choreography is not scored here; motion/final review jobs own the full entrance treatment.

## Files

Core build: `index.html`, `trophy-room.css`, `trophy-room.js`, `tools/build_preview.py`, `preview.html`, and `evidence/`. Existing approved plate/title/trophy assets are consumed unchanged.
