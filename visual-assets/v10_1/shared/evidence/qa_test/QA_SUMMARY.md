# Factory QA summary

Screen: `visual-assets/v10_1/home`
Frame: `HM2`

Worker smoke: all shared gates except H1 pass at all nine viewports. H1 intentionally fails because current Home predates the required `data-manager="daniel"` and `data-manager="nik"` markers.

Canonical Home parity: the existing Home harness reports no HTML, body, or stage scroll at all nine required HM2 viewports, matching the shared H5 no-scroll rule (with 375x553 additionally requiring the primary action in view).

| Gate | Result | Detail |
| --- | --- | --- |
| H1 | FAIL | Home has no manager-side marker elements yet; the new gate correctly detects that contract gap. |
| H5 | PASS | No-scroll/primary-action behavior matches canonical Home evidence at the required viewports. |
| H6 | PASS | No visible input/select/textarea below 16 px in the worker smoke run. |
| H7 | PASS | Reduced-motion rerun found zero running animations after 300 ms at all nine viewports. |
| CONTROL_BOUNDS | PASS | Every visible button/link/input remained inside the viewport in the worker smoke run. |
| CONSOLE | PASS | No console/page errors. |
| REQUESTS | PASS | No failed requests in the inline smoke run. |
| FIXTURE_STRINGS | PASS | All HM2-relevant fixture strings were present after the selector/template filtering rules. |

Compare sheet: `HM2_compare.png` was generated from `GOAL_HOME.jpg` and the 1366x768 HM2 smoke screenshot with same-height side-by-side panels, a 50% overlay, and four 4x face/hand crop pairs.
