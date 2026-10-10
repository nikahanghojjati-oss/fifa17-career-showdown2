# JOB-1501 · saveLibraryUI.js first half audit

Read: `js/saveLibraryUI.js` lines 1 to 370 (the first half of 727 lines, read through the start of the Local Profiles block).

## Finding 1 · PROBABLE · the progress bar is full during the last season, before the Showdown is complete

- **File and line:** `js/saveLibraryUI.js` line 88 (`saveLibraryUIProgressRatio`), used by the bar at lines 223-227 and by the sort order.
- **What the player sees:** a Showdown that is in its last season (for example "Season 3 of 3", status "IN PROGRESS") shows a full progress bar. The bar reaches 100% only when the Showdown completes, so the progress bar and the status chip disagree until the final result is in. A Showdown in Season 1 of 3 shows about one third of the bar already filled.
- **Why the code does it:**
  ```
  const current=Math.max(0,Number(showdown&&showdown.currentRound)||0);
  const total=Math.max(1,Number(showdown&&showdown.totalRounds)||1);
  return Math.min(1,Math.max(0,current/total));
  ```
  `currentRound` is the season in progress (the label at line 80 reads "Season ${current} of ${total}"), but the ratio counts it as already finished.
- **Smallest change:** for a Showdown that is not completed, use `Math.max(0,current-1)/total`, so the bar counts finished seasons only. Keep `1` for a completed Showdown (line 85).
- **Confidence limit:** PROBABLE, not SURE. It depends on `currentRound` meaning the season in progress. The label at line 80 and the validator in `js/importAnalysis.js` (round numbers are 1-based and start at 1) both point that way, but this job did not read the code that advances `currentRound`.

## Finding 2 · PROBABLE · the NOT STARTED label cannot appear

- **File and line:** `js/saveLibraryUI.js` lines 93-94 (`saveLibraryUIStatusLabel`).
- **What the player sees:** a Showdown that has been created but not started should show "NOT STARTED". Because the check is `current<=0`, every valid Showdown shows "IN PROGRESS" instead, including one that has just been created and has not begun its first season.
- **Why the code does it:**
  ```
  const current=Number(showdown&&showdown.currentRound)||0;
  if(current<=0)return "NOT STARTED";
  ```
  The import validator in `js/importAnalysis.js` rejects any `currentRound` below 1 (the check `currentRound < 1`) and the migration clamps it to at least 1. A valid record therefore always reaches "IN PROGRESS", and the branch at line 94 is never taken.
- **Smallest change:** decide what a new Showdown should show. If "NOT STARTED" is intended for a new Showdown that has not begun its first season, add an explicit check on the Showdown's own state (for example `status==="Created"` with no season started) instead of `currentRound<=0`.
- **Confidence limit:** PROBABLE. Whether a new Showdown should read "NOT STARTED" is a product decision. The dead branch is a code fact.

## Riskiest places checked (no other real bug found)

1. Lines 36-56 (`saveLibraryUIState`): a state with both a Save Library and an active singleton returns "blocked" (line 41), and a runtime that is not ready also blocks (line 50), so the panel never offers an action on stale authority.
2. Lines 152-173 (`saveLibraryUISwitch`): the busy guard (line 153) and the disabled button (line 160) stop a double tap from switching twice, and the button is re-enabled only if it is still connected (line 171).
3. Lines 175-198 (`saveLibraryUIDelete`): the confirmation runs first (line 178), and the busy flag is set only after confirmation (line 185), so a cancelled confirmation changes nothing.

No game file was edited. This job adds one audit file only.
