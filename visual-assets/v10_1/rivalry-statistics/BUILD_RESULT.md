# Rivalry Statistics · desktop build result

## Run
Serve the repository root and open `visual-assets/v10_1/rivalry-statistics/?frame=RV1`. Frames RV1–RV7 are fixture-only review states. `preview.html` switches between them.

## Built
The desktop screen keeps the approved 1672×941 plate registered through the shared stage engine. The brush title uses `TITLE_RV_V1.webp`; club identity uses the original `getClubCrestSvg` system; the comparison panel contains only contract-recorded rows. Three measured lower panels show Head-to-Head, Season-by-Season and the four-item original Trophy Cabinet. Daniel stays left and Nik right. Full-canvas manager overlays create the depth sandwich over the panel edge with contact shadows and warm rim masks.

## Product-truth changes from the mockup
Real crests and trophies are replaced with project-owned art. Unrecorded league-points/goals/extra mockup rows are not exposed as rivalry aggregate rows. Transfer Signings is shown only when transfer history is available; unavailable transfer history displays `Unavailable`, never zero. Partial history shows coverage before subset totals. Loading/unavailable/empty states use explicit designed messages.

## Frames
- RV1 active, mid-way, transfers ready
- RV2 completed Showdown
- RV3 first season, nothing completed
- RV4 rivalry data ready, transfer history unavailable
- RV5 loading
- RV6 unavailable read
- RV7 partial read with visible coverage

## QA
All seven frames passed the desktop review harness at 1366×768, 1440×900, 1920×1080 and 1366×640: no scroll, correct manager order, controls in bounds and no console/page errors. `evidence/diff/scores.json` in the handoff records the local no-plate form of the shared mockup gate: PASS, SSIM 0.635, ΔE 7.0; protected face/hand boxes all exceed their thresholds. Current approved plate bytes remain the existing job-25 repo assets; no replacement plate ships in this job.

First-paint runtime uses WebP assets only; PNG overlay masters are review/source files and are not referenced by the page.

## Scorecard
| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 Mockup fidelity | 4 | measured title/panel geometry; protected likeness boxes pass |
| 2 Characters out of menu | 4 | registered overlays sit above panel/UI with rim/contact treatment |
| 3 Hands and contact | 4 | source-pixel hand/arm overlays; protected hand boxes pass |
| 4 Lighting and grade | 4 | approved warm plate plus gold rim and dark glass |
| 5 Typography/title | 4 | supplied brush wordmark, Barlow UI, tabular hero numerals |
| 6 Panel craft | 4 | measured gold glass panels and original trophy art |
| 7 Information clarity/honesty | 5 | contract-only rows and explicit unavailable/partial states |
| 10 Polish/finish | 4 | zero console/page errors and desktop no-scroll checks |

## Known gap / handoff
The GitHub connector in this chat can write text but not locally generated binary overlays. The `JOB-067.zip` handoff contains the WebP/PNG overlay assets and binary QA evidence for Claude to commit with the already-written text changes.
