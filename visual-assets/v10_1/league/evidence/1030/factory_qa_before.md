# Factory QA summary

Screen: .
Frames: L1, L2, L3, L4
Generated: 2026-10-06T04:58:40.065Z

| Frame | Viewport | Result | Failing gates |
| --- | --- | --- | --- |
| L1 | 1366x768 | FAIL | FIXTURE_STRINGS |
| L1 | 1440x900 | FAIL | FIXTURE_STRINGS |
| L1 | 1920x1080 | FAIL | FIXTURE_STRINGS |
| L1 | 1366x640 | FAIL | H5, FIXTURE_STRINGS |
| L1 | 393x660@3x | FAIL | H5, FIXTURE_STRINGS |
| L1 | 360x640 | FAIL | H5, FIXTURE_STRINGS |
| L1 | 375x553 | FAIL | FIXTURE_STRINGS |
| L1 | 390x844 | FAIL | H5, FIXTURE_STRINGS |
| L1 | 430x932 | FAIL | H5, FIXTURE_STRINGS |
| L2 | 1366x768 | FAIL | FIXTURE_STRINGS |
| L2 | 1440x900 | FAIL | FIXTURE_STRINGS |
| L2 | 1920x1080 | FAIL | FIXTURE_STRINGS |
| L2 | 1366x640 | FAIL | H5, FIXTURE_STRINGS |
| L2 | 393x660@3x | FAIL | H5, FIXTURE_STRINGS |
| L2 | 360x640 | FAIL | H5, FIXTURE_STRINGS |
| L2 | 375x553 | FAIL | FIXTURE_STRINGS |
| L2 | 390x844 | FAIL | H5, FIXTURE_STRINGS |
| L2 | 430x932 | FAIL | H5, FIXTURE_STRINGS |
| L3 | 1366x768 | FAIL | FIXTURE_STRINGS |
| L3 | 1440x900 | FAIL | FIXTURE_STRINGS |
| L3 | 1920x1080 | FAIL | FIXTURE_STRINGS |
| L3 | 1366x640 | FAIL | H5, FIXTURE_STRINGS |
| L3 | 393x660@3x | FAIL | H5, FIXTURE_STRINGS |
| L3 | 360x640 | FAIL | H5, FIXTURE_STRINGS |
| L3 | 375x553 | FAIL | FIXTURE_STRINGS |
| L3 | 390x844 | FAIL | H5, FIXTURE_STRINGS |
| L3 | 430x932 | FAIL | H5, FIXTURE_STRINGS |
| L4 | 1366x768 | FAIL | FIXTURE_STRINGS |
| L4 | 1440x900 | FAIL | FIXTURE_STRINGS |
| L4 | 1920x1080 | FAIL | FIXTURE_STRINGS |
| L4 | 1366x640 | FAIL | H5, FIXTURE_STRINGS |
| L4 | 393x660@3x | FAIL | H5, FIXTURE_STRINGS |
| L4 | 360x640 | FAIL | H5, FIXTURE_STRINGS |
| L4 | 375x553 | FAIL | FIXTURE_STRINGS |
| L4 | 390x844 | FAIL | H5, FIXTURE_STRINGS |
| L4 | 430x932 | FAIL | H5, FIXTURE_STRINGS |

## Gate rollup

| Gate | Result | Runs | Details |
| --- | --- | --- | --- |
| H1 | PASS | 36/36 pass | all checks passed |
| H5 | FAIL | 16/36 pass | {"noScroll":false,"primary":{"id":"spinLeague","label":"SPIN WHEEL","rect":{"left":420.5,"top":577.6869506835938,"right":705.5,"bottom":635.6869506835938,"width":285,"height":58},"visibleInViewport":true},"rule":"no page/stage scroll and primary visible"} |
| H6 | PASS | 36/36 pass | all checks passed |
| H7 | PASS | 36/36 pass | all checks passed |
| CONTROL_BOUNDS | PASS | 36/36 pass | all checks passed |
| CONSOLE | PASS | 36/36 pass | all checks passed |
| REQUESTS | PASS | 36/36 pass | all checks passed |
| FIXTURE_STRINGS | FAIL | 0/36 pass | ["More Than A Game"] |
