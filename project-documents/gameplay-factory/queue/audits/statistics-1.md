# statistics.js audit, first half (lines 1-317)

## 1. PROBABLE: career leader cards name every manager as a leader at zero (lines 258-265, used at lines 300-301)

What the player sees: when neither manager has a season win (or an average season score above zero) yet, the cards "MOST SEASON WINS" and "BEST AVG SEASON SCORE" show "0" with both manager names as leaders, instead of "No completed record yet".

Why: `getManagerFieldLeader` returns `value: bestValue` even when it is 0, and it lists every manager who ties at 0 as a holder:
`return { value: bestValue, holders: managers.filter(manager => (Number(manager[field]) || 0) === bestValue) };`
`createCareerLeaderCard` only shows the empty text when `record.value === null` (line 275).

Smallest change: in `getManagerFieldLeader`, return `{ value: null, holders: [] }` when `bestValue <= 0`. Keep the holder list for positive values. Confirm with the Team G lead that a 0 leader should not be shown.

## 2. Riskiest places checked

1. Lines 110-112 (rivalry button click): the handler does nothing when `currentShowdown` is empty. The second half hides the button in that case (lines 384 and 427), so this path is not reachable from the screen.
2. Lines 33-42 (`openCareerScreensV10`): when the seam is still loading, the old screen is kept hidden and `settle` runs on failure. A failed load should not leave a blank screen; this looked correct.
3. Lines 212-216 (`createComparisonRow`): an empty string is read as 0 by `Number`, so an empty value can mark a leader. The current callers always pass a number or a formatted string, so no visible case was found.
