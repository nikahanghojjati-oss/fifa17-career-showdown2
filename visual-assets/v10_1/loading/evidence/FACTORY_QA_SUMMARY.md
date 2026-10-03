# Factory QA summary

Screen: visual-assets/v10_1/loading
Frames: LD1, LD2, LD6_UNAVAILABLE
Generated: 2026-10-03T11:36:24.797Z

| Frame | Viewport | Result | Failing gates |
| --- | --- | --- | --- |
| LD1 | 1366x768 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 1440x900 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 1920x1080 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 1366x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 393x660@3x | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 360x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 375x553 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 390x844 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD1 | 430x932 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 1366x768 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 1440x900 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 1920x1080 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 1366x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 393x660@3x | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 360x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 375x553 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 390x844 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD2 | 430x932 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 1366x768 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 1440x900 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 1920x1080 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 1366x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 393x660@3x | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 360x640 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 375x553 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 390x844 | FAIL | H1, H5, FIXTURE_STRINGS |
| LD6_UNAVAILABLE | 430x932 | FAIL | H1, H5, FIXTURE_STRINGS |

## Gate rollup

| Gate | Result | Runs | Details |
| --- | --- | --- | --- |
| H1 | FAIL | 0/27 pass | {"pass":false,"daniel":[],"nik":[],"rule":"data-manager=\"daniel\" must be left of data-manager=\"nik\""} |
| H5 | FAIL | 0/27 pass | {"noScroll":true,"primary":null,"rule":"no page/stage scroll and primary visible"} |
| H6 | PASS | 27/27 pass | all checks passed |
| H7 | PASS | 27/27 pass | all checks passed |
| CONTROL_BOUNDS | PASS | 27/27 pass | all checks passed |
| CONSOLE | PASS | 27/27 pass | all checks passed |
| REQUESTS | PASS | 27/27 pass | all checks passed |
| FIXTURE_STRINGS | FAIL | 0/27 pass | ["CM","Getting Career Mode Showdown ready.","new","Nothing is ready to open yet.","Some startup data is still loading. Continuing with what is available.","Career Mode Showdown cannot finish loading right now. Try again.","Career Mode Showdown is ready.","Current Showdown only. Career history is not yet available.","loading","Preview data","GETTING CAREER MO |
