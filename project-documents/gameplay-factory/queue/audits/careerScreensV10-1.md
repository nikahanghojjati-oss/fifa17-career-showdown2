# careerScreensV10-1 (JOB-1565): first-half audit of js/careerScreensV10.js

Result: no findings.

Riskiest places checked:
1. `v10CareerStatistics` (js/careerScreensV10.js lines 41-56): line 48 reads `model.managers[manager].showdowns` without a guard. A model missing a manager record would throw here, not return null, so the fallback at `toV10Frame` never runs. The seam is expected to always supply both managers, so this was not confirmed as reachable.
2. `toV10Frame` status mapping (lines 74-88): loading and unavailable frames carry no numbers, and a null frame from a builder becomes "unavailable", so the screen cannot show zeros in place of an error.
3. `v10Ranks` (lines 35-40): a level table ranks both managers first, as the comment says, and a manager missing from the standings gives a null rank that makes the frame unavailable.
