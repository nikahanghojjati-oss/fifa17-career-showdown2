# Job 37 · League hands measurement

Reference: `project-documents/factory/mockups/GOAL_LEAGUE.jpg` (1536 × 864) and Job 1 League baseline / current League geometry.

## Goal measurement

Measured on the actual goal image. Circle detection was checked against the visible gold rim and a 100 × 110 fingertip crop.

| Measure | Pixels | % of frame |
| --- | ---: | ---: |
| Wheel centre | (762.6, 495.0) | (49.65% W, 57.29% H) |
| Main wheel radius | 233.3 px | 27.00% H |
| Main wheel diameter | 466.6 px | 54.00% H |
| Visible gold rim band | about 10 px | 1.16% H |
| Daniel fingertip contact point | about (532.5, 457.0) | (34.67% W, 52.89% H) |

At the fingertip y-coordinate, the detected wheel edge is x ≈ 532.5 px: the finger visually lands on the rim, not beside it. The finger is above the wheel/rim layer.

## Current build / baseline measurement

The 1366 × 768 baseline is plate-registered from the 1536 × 864 League plate. Current `league.js` uses `SLOT = { cx: 762, cy: 496, r: 240 }`; at 1366 × 768 the cover scale is 1366/1536 = 0.88932.

| Measure | 1366 × 768 baseline | % of frame |
| --- | ---: | ---: |
| Wheel centre | about (677.6, 441.0) | (49.61% W, 57.42% H) |
| Wheel radius | about 213.4 px | 27.79% H |
| Vector rim stroke | about 16.0 px on screen | 2.08% H |
| Daniel fingertip | about (473.5, 406.4) | (34.66% W, 52.92% H) |
| Fingertip overlap into circle | about 6–7 px | too deep vs 2–4 px target |

The normal desktop build is close in centre registration, but the current logical radius is larger than the measured goal and the vector rim is visually flatter/darker than the goal. The important failure is the short-laptop layout: `BUILD_RESULT.md` records wheel scale 0.838 at 1366 × 640 (0.824 in note frames), which moves the rim away from Daniel's plate-registered finger so the finger points beside the wheel instead of contacting it.

## Job 37 placement target

Use the plate-registered fingertip as the invariant contact anchor. At every desktop size, solve wheel placement so the circle edge at the fingertip y-coordinate sits 2–4 CSS px behind the fingertip, with the finger/cut-out above the rim. Keep the goal centre/radius as the preferred 16:9 composition, but on short desktop sizes move the wheel centre as needed rather than allowing the rim to detach from the hand.
