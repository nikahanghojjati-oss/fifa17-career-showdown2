# statistics.js audit, second half (lines 318-634)

## 1. PROBABLE: rivalry statistics keep the previous showdown's content when analytics is null (lines 581-582)

What the player sees: if `buildRivalryAnalytics(currentShowdown)` returns null, the rivalry screen opens with the content from the previous render still on screen, which can belong to an earlier showdown. The "No active showdown" message is not shown either.

Why: the null path returns before `content.replaceChildren(...)` and before `rivalryStatisticsRenderKey` is set:
`const analytics = buildRivalryAnalytics(currentShowdown);`
`if(!analytics){ return; }`
The cache key on line 567 is not updated, so the next call repeats the same path. The return value of `buildRivalryAnalytics` is defined in another file and was not read for this audit, so confirm when it returns null.

Smallest change: on the null path, clear the content the same way as the no-showdown path (lines 573-577): replace the children with an `analyticsEmpty` message such as "Rivalry statistics are not available yet." and set `rivalryStatisticsRenderKey = null`.

## 2. PROBABLE: the rivalry render key does not include the league or club shown in the header (lines 567-570, 592, 598)

What the player sees: after the league or a club is changed on the current showdown, the header can keep the old league or club name until the key changes.

Why: `getRivalryStatisticsRenderKey` (first half, lines 135-143) uses only id, updatedAt, status and rounds length. The header reads `selectedLeague` (line 592) and `clubs` (line 598), which are not in the key. The cache check on line 568 returns early when the key matches.

Smallest change: add `currentShowdown.selectedLeague?.id || ""` and the two club names to the key array. Confirm that picking a league or club also bumps `updatedAt`; if it does, this finding is not reachable.

## 3. Riskiest places checked

1. Lines 382-385 and 426-427: the career rivalry button is hidden with `!currentShowdown` on both the cached and the fresh render path. This is the fix for the do-nothing click handler in the first half.
2. Lines 369-370 and 555-556: when the screen seam is still loading, the render returns early and reruns through the loader callback. No blank screen was found.
