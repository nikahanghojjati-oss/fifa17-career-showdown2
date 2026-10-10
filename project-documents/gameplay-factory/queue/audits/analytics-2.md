# analytics.js audit, second half (lines 261-521)

## 1. PROBABLE: career leader records name every manager as a holder at zero (lines 421-431, used at lines 457-462)

What the player sees: when every manager is at 0 for a record (for example "MOST SHOWDOWN WINS" after only draws, or "MOST TROPHIES" with no trophies yet), the record shows 0 with both manager names as holders, instead of an empty "No completed record yet" state.

Why: `findManagerLeaders` returns `value: bestValue` even when it is 0, and lists every tie at 0 as a holder:
`return { value: bestValue, holders: managers.filter(manager => (Number(manager[field]) || 0) === bestValue) };`
Consumers that check only `value === null` (the same pattern as `createCareerLeaderCard` in js/statistics.js, lines 275-283) therefore show two holders for a zero record.

Smallest change: return `{ value: null, holders: [] }` when `bestValue <= 0`, so the empty state shows for zero records too. Confirm the consumers' empty-state check before shipping, since the consumer code was not read in this audit.

## 2. Riskiest place checked: `buildRivalryManagerStats` (lines 483-488)

Showdown wins and draws are counted only when `showdown.status === "Completed"`. A live rivalry therefore shows 0 wins, not a partial result. This looked correct.

## 3. Riskiest place checked: `getCompletedShowdownsForAnalytics` and the cache key (lines 87-115, 375-381)

The active completed copy overrides the archived copy by id, and the cache key includes the active identity signature. A completed showdown whose score changed without an `updatedAt` change would be read from the stale cache, but no such write path was found in this half.
