# Rivalry Statistics · desktop build result

## Run
Serve the repository root and open `visual-assets/v10_1/rivalry-statistics/?frame=RV1`. Frames RV1–RV7 are fixture-only review states. `preview.html` switches between them.

## Built
The desktop screen keeps the approved 1672×941 Job-25 plate registered through the shared stage engine. The brush title uses `TITLE_RV_V1.webp`; club identity uses the original `getClubCrestSvg` system; the comparison panel contains only contract-recorded rows. Three measured lower panels show Head-to-Head, Season-by-Season and the four-item original Trophy Cabinet. Daniel stays left and Nik right. Corrected full-canvas manager cutouts create the depth sandwich over the panel edge with contact shadows and warm rim masks.

## Product-truth changes from the mockup
Real crests and trophies are replaced with project-owned art. Unrecorded mockup statistics are not exposed as rivalry aggregate rows. Transfer Signings is shown only when transfer history is available; unavailable transfer history displays `Unavailable`, never zero. Partial history shows coverage before subset totals. Loading/unavailable/empty states use explicit designed messages.

## Frames
- RV1 active, mid-way, transfers ready
- RV2 completed Showdown
- RV3 first season, nothing completed
- RV4 rivalry data ready, transfer history unavailable
- RV5 loading
- RV6 unavailable read
- RV7 partial read with visible coverage

## QA
All seven frames were exercised at 1366×768, 1440×900, 1920×1080 and 1366×640 with no page scroll, manager-order failures or console/page errors in the local review harness. The current branch's clean approved plate was inspected directly through the GitHub connector. A no-plate fallback mockup comparison cleared the fallback thresholds (SSIM 0.635, ΔE 7.0).

Because the connector cannot materialize the current binary plate into the local browser sandbox, the exact plate-relative H10 calculation is intentionally left for Claude to rerun after applying the binary zip; this file does not claim an exact plate-relative PASS.

The first overlay draft was rejected because it captured stale mockup UI pixels. The handoff uses corrected manager-only contours: Daniel alpha bbox [192,350,340,552], Nik [1229,497,1537,588]. Nik's cutout ends above the lower-panel boundary at y=594.

First-paint runtime uses WebP assets only; PNG overlay masters are review/source files and are not referenced by the page.

## Scorecard
| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 Mockup fidelity | 4 | measured title/panel geometry and clean registered plate; exact H10 rerun delegated to Claude after binary apply |
| 2 Characters out of menu | 4 | corrected registered overlays sit above panel/UI with rim/contact treatment |
| 3 Hands and contact | 4 | manager-only source-pixel contours; no panel/text contamination |
| 4 Lighting and grade | 4 | approved warm plate plus gold rim and dark glass |
| 5 Typography/title | 4 | supplied brush wordmark, Barlow UI, tabular hero numerals |
| 6 Panel craft | 4 | measured gold glass panels and original trophy art |
| 7 Information clarity/honesty | 5 | contract-only rows and explicit unavailable/partial states |
| 10 Polish/finish | 4 | no page-scroll/order/error failures in desktop harness |

## Handoff
The GitHub connector in this chat can write text but cannot push locally generated binary cutouts. `JOB-067.zip` contains the corrected PNG/WebP overlays, their intake report, the overlay diagnostic, QA report and the final DONE status for Claude to commit. Claude should rerun the exact plate-relative mockup gate after applying the zip.
