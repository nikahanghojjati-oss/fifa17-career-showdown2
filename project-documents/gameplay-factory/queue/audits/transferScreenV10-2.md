# transferScreenV10-2 (JOB-1570): second-half audit of js/transferScreenV10.js

Result: no findings.

Riskiest places checked:
1. Card class swaps (js/transferScreenV10.js lines 231-237) and their restore (lines 184-188): the production card class is moved to the Team V block only while its fields are there, and the original class string is put back on teardown, so the replay's one-visible-card rule is not broken.
2. `tfMount` failure path (lines 281-303): any exception during mount runs `tfTeardown` and leaves production's own screen as it was rendered, so a failed skin cannot leave an empty Transfer Challenge.
3. The ResizeObserver re-frame (line 296): it sends the resize on the next animation frame and never inside the observer callback, which matches the comment about the "ResizeObserver loop" error. No loop was found.
