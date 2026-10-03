# Factory QA summary

Screen: visual-assets/v10_1/home
Frames: HM2
Generated: 2026-10-02T23:55:58.432Z

| Frame | Viewport | Result | Failing gates |
| --- | --- | --- | --- |
| HM2 | 1366x768 | PASS | none |
| HM2 | 1440x900 | PASS | none |
| HM2 | 1920x1080 | PASS | none |
| HM2 | 1366x640 | PASS | none |
| HM2 | 393x660@3x | FAIL | H5, CONTROL_BOUNDS |
| HM2 | 360x640 | FAIL | H5, CONTROL_BOUNDS |
| HM2 | 375x553 | FAIL | CONTROL_BOUNDS |
| HM2 | 390x844 | FAIL | H5 |
| HM2 | 430x932 | FAIL | H5 |

## Gate rollup

| Gate | Result | Runs | Details |
| --- | --- | --- | --- |
| H1 | PASS | 9/9 pass | all checks passed |
| H5 | FAIL | 5/9 pass | {"noScroll":false,"primary":{"id":"continueCareer","label":"CAREERCONTINUE CAREERDaniel vs Nik · Season 2 of 3","rect":{"left":12,"top":426.015625,"right":193.5,"bottom":557.03125,"width":181.5,"height":131.015625},"visibleInViewport":true},"rule":"no page/stage scroll and primary visible"} |
| H6 | PASS | 9/9 pass | all checks passed |
| H7 | PASS | 9/9 pass | all checks passed |
| CONTROL_BOUNDS | FAIL | 6/9 pass | [{"tag":"button","id":"settingsButton","label":"SETTINGSSETTINGSAccount, device and preferences","rect":{"left":12,"top":645.03125,"right":99.75,"bottom":717.03125,"width":87.75,"height":72},"fullyInsideViewport":false}] |
| CONSOLE | PASS | 9/9 pass | all checks passed |
| REQUESTS | PASS | 9/9 pass | all checks passed |
| FIXTURE_STRINGS | PASS | 9/9 pass | all checks passed |
