# JOB-031 · Home edge/seam defects before fix

Evidence source: Step 1 renders of HM1-HM3 at 1366×768 and 1920×1080, with `mends=0` and runtime mends on. Pixel boxes below are CSS-pixel boxes in the rendered viewport; all 400% crops are in this folder.

## Protected-detail audit

- **Daniel face:** no halo, seam, colour fringe or likeness change visible in any HM1-HM3 crop at either desktop size.
- **Nik face:** no halo, seam, colour fringe or likeness change visible in any HM1-HM3 crop at either desktop size.
- **Daniel pointing hand:** no halo, seam, colour fringe or geometry defect visible in any HM1-HM3 crop at either desktop size.
- Therefore Job 31 needs **plate/seam repair only**. No face or hand cut-out is recut.

## Visible defects

| ID | Defect | 1366×768 pixel box | 1920×1080 pixel box | Evidence |
| --- | --- | --- | --- | --- |
| D1 | **Soft tone/texture patch** from the broad left-column `.areaMend`: crowd detail becomes visibly smeared and locally lower-variance compared with `mends=0`. | x 17–497, y 81–571 | x 26–698, y 115–801 | `*_03_area_left-column_zones_3-5_x4.jpg` |
| D2 | **Soft vertical seam / blur halo** on the right edges of remove zones 4–5 beside Daniel's sleeve; the runtime strips trade the hard seam for a conspicuous blurred column. | x 419–447, y 316–563 | x 591–626, y 446–789 | `*_27_zone4_right_x4.jpg`, `*_31_zone5_right_x4.jpg` |
| D3 | **Soft horizontal seam / blur patch** where zones 4 and 5 meet around plate y≈535–540; crowd texture smears across the strip. | x 20–442, y 423–455 | x 29–620, y 597–638 | `*_25_zone4_bottom_x4.jpg`, `*_28_zone5_top_x4.jpg` |
| D4 | **Dark soft patch** from the top-right `.areaMend` over the old navigation-removal zones. The `brightness(.72)` pass is visibly darker than the surrounding stadium and removes texture. | x 1070–1366, y 0–89 | x 1505–1920, y 0–123 | `*_04_area_top-right_zones_1-2_x4.jpg` |
| D5 | **Top-right lower/right seam and colour/tone fringe** around zones 1–2. The lower edge remains a brightness step; at the far-right edge the bright stadium light meets a darker repaired patch abruptly. | lower: x 1060–1366, y 55–86; right: x 1344–1366, y 0–78 | lower: x 1491–1920, y 79–119; right: x 1891–1920, y 0–107 | `*_12_zone1_bottom_x4.jpg`, `*_17_zone2_bottom_x4.jpg`, `*_19_zone2_right_x4.jpg` |
| D6 | **Faint horizontal source seam / texture-softening strip** at the bottom of zone 0 above Daniel's hair/face area. The strip is trimmed around protected pixels, so likeness is intact, but the band remains detectable at 400%. | x 0–800, y 55–82 | x 0–1122, y 79–114 | `*_06/_07/_08_zone0_bottom_x4.jpg` |
| D7 | **Subtle source tone line** at the top of zone 3, most visible at 1920×1080 near the right end of the wordmark/left-column stadium. | x 24–503, y 83–110 | x 35–706, y 118–153 | `*_20_zone3_top_x4.jpg` |

## Not defects in the final UI

Zone 6 seam strips sit under the soundtrack card, and zones 7–8 sit under the opaque dock/footer treatment in HM1-HM3; their 400% diagnostic crops were inspected but they do not present a visible final-UI seam. They remain covered by the existing UI and are not broadened or repainted.

## Fix direction for Step 3

Fix D1–D7 **in the plate source**. Use the 12 px ring immediately outside each affected repair edge as the colour/tonal target, match local mean and variance in a feathered strip, and preserve protected face/hand pixels byte-for-byte. Once the plate carries the transition, remove the broad runtime area darkening/blur and keep only any narrowly-scoped mend that still measures necessary.
