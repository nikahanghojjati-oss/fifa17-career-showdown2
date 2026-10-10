# Audit: js/productionSharedMultiSeasonProgression.js, second half (lines 78-153)

Job 1520 · Queue item 0108 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · lines 108-113 and 129-131 · after a reload mid-journey the Continue button can get stuck

What the player sees: the player reloads during season 3 of 5 (two seasons accepted). The review panel shows "SEASON 1 IS ACCEPTED · SHARED HISTORY REVIEW MUST BE VISIBLE BEFORE ADVANCING" with "WAITING FOR SHARED HISTORY REVIEW" disabled. The button never becomes CONTINUE TO SEASON 2, so the journey cannot advance from this screen.

Why: this is the consequence of the cursor reset in productionSharedMultiSeasonProgression-1.md (Finding 1, SURE). With the cursor at 1, `pmspHistoryWitnessed` requires the history to be converged through season 1, and `pmspCanContinue` requires that witness before the cursor can move on. The history for two accepted seasons reports `throughSeason` 2, so the witness never matches and the cursor never advances:
```
return Boolean(season&&history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&Number(history.throughSeason)===season&&...
```
Smallest change: fix the cursor seeding in the first half (seed `exposedSeason` from the authoritative `state.activeSeason` on the first read for a rivalry). No change to the witness rule is needed.

## Finding 2 · PROBABLE · line 149 · a wake during a refresh is dropped, so the state can lag up to 15 s

What the player sees: the history convergence, setup, or connected-account event happens while a progression refresh is in flight. The screen keeps the older state until the next 15 s poll.

Why: `pmspWake` returns while `busy` and does not remember the event. This is the same pattern as productionSharedJourneyReconnect-2.md, Finding 1:
```
function pmspWake(){if(busy||!pmspSharedMarker()||root.document?.visibilityState==="hidden")return;void pmspRefresh();}
```
Smallest change: add a `wakeQueued` flag. Set it when `pmspWake` returns because `busy` is true, and in the `.finally` of `pmspRefresh` (line 140), call `pmspWake()` once more if the flag is set.

## Riskiest places checked (no other finding)

- Lines 141-144: double tap on CONTINUE. The second tap only succeeds if the history witness matches the new cursor, which would need `throughSeason` to equal both the old and the new season, so one tap advances one season.
- Line 138: `MULTI_SEASON_CURSOR_AHEAD_OF_AUTHORITY` cannot fire through the normal path, because the cursor only advances after the witness check.
- Line 140: `refreshPromise` reuse is keyed on `contextKey`, which is only set after a successful read. This is the same pattern as productionSharedSeasonResults-1.md, Finding 1 (duplicate reads while a first read is pending).
