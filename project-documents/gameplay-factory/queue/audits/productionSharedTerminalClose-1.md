# JOB-1505 · productionSharedTerminalClose.js first half audit

Read: `js/productionSharedTerminalClose.js` lines 1 to 154 (the first half of 308 lines). Lines 173 and 218-240 were read only to confirm call sites and that `ptcClose` catches its own errors.

## Finding 1 · PROBABLE · an expired private session still counts as ACTIVE

- **File and line:** `js/productionSharedTerminalClose.js` lines 105-106 (`ptcRemoteActive`).
- **What the player sees:** the private session has lapsed, but the page still shows the close as ready. The automatic close runs with a dead session and fails, and the panel says "This Showdown could not be saved. Tap CLOSE SHARED SHOWDOWN to try again." The correct result is the BLOCKED panel ("Reconnect both players to this Showdown, then refresh"), so the player is sent to reconnect instead of retrying.
- **Why the code does it:**
  ```
  const expiry=Number(remote?.expiresAtEpochMs);
  ...&&Number.isFinite(expiry)&&(!exactSessionId||remote.sessionId===exactSessionId))?remote:null;
  ```
  `expiry` is read but only checked for `Number.isFinite`. It is never compared with the current time, so `ptcRemoteActive` never rejects an expired session. This function gates both the BLOCKED decision (line 165) and the close itself (line 22 and line 46 of `ptcClose`).
- **Smallest change:** add `&&expiry>Date.now()` to the condition at line 106.
- **Confidence limit:** PROBABLE. `remoteApi.getState()` may already change `sessionState` when the session expires. This job did not read the remote-joining module, so it did not confirm that.

## Finding 2 · PROBABLE · a dropped automatic attempt leaves "Saving…" with no close button and no retry

- **File and line:** `js/productionSharedTerminalClose.js` lines 21-22 (the `attempt` closure in `ptcScheduleAutomaticClose`) and lines 137-139 (`ptcRender`, the READY branch).
- **What the player sees:** the page shows "Saving this Showdown to your career…". The CLOSE button is hidden because `automaticCloseFailed` is false. Nothing is saving, and the single scheduled attempt has already returned.
- **Why the code does it:**
  ```
  if(!ptcStillCurrent(request,generation)||busy||closePromise||ptcCurrentState()?.phase!=="READY"||automaticAttempts.has(key)||!ptcRemoteActive(context,ptcCurrentState().intent.sessionId))return;
  ```
  When this guard fails for a transient reason (for example an in-progress manual close, or the remote session briefly not ACTIVE), the function returns without rescheduling and without publishing `automaticSaving:false`. The key is not in `automaticAttempts`, so the next `ptcScheduleAutomaticClose` call at line 173 can retry. The only trigger for that call is `ptcRefreshNow`, so the page stays on "Saving…" with no way to close until a refresh happens.
- **Smallest change:** in the guard, when only `busy`, `closePromise` or `!ptcRemoteActive` is the cause, call `root.setTimeout(attempt,HISTORY_POLL_MS)` and return (bounded by a poll counter). Alternatively, publish `automaticSaving:false` so the CLOSE button is shown.
- **Confidence limit:** PROBABLE. Whether a periodic refresh exists is in the second half of this file and the caller code, which this job did not read.

## Finding 3 · PROBABLE · the manual CLOSE button skips the history convergence wait

- **File and line:** `js/productionSharedTerminalClose.js` lines 120 (the close button click) and 218 (`ptcClose`). The wait is at lines 23-25.
- **What the player sees:** after an automatic attempt has failed, the player taps CLOSE SHARED SHOWDOWN before the Shared History has converged. The close runs at once and forgets the session, which clears Shared History. The Final Winner can then show the wrong season count or trophies.
- **Why the code does it:**
  ```
  // Close forgets the session, which clears Shared History, so the close waits (bounded) for the converged history...
  if(!ptcHistoryConverged(request.rivalryId)&&polls<HISTORY_WAIT_POLLS){polls++;root.setTimeout(attempt,HISTORY_POLL_MS);return;}
  ```
  This wait exists only in the automatic path. The button handler at line 120 calls `ptcClose()` directly, and `ptcClose` (line 218) has no `ptcHistoryConverged` check.
- **Smallest change:** in the button handler, wait for `ptcHistoryConverged(request.rivalryId)` for up to `HISTORY_WAIT_POLLS` polls before calling `ptcClose()`, using the same bounded loop.
- **Confidence limit:** PROBABLE, and narrow. The button is visible only after an automatic failure, so this matters only if history is still unconverged after the 15-second bound.

## Riskiest places checked

1. Lines 53 (`s.setup.revision===6`): a hard-coded revision in `ptcConfirmedSetupRivalry`. It is correct only if the authority always reports revision 6 at SHOWDOWN_CONFIRMED. Not confirmed in this job.
2. Lines 28-31 (`ptcClose(key).then`): no `.catch`, but `ptcClose` catches all errors inside its own `try` and publishes `automaticCloseFailed:true`, so no unhandled rejection was found.
3. Lines 155-160 (held `RECOVERY_PENDING` in `ptcRefreshNow`): an unmatched read keeps the held witness by design (H1017-1), so this is intended and not a bug.

No game file was edited. This job adds one audit file only.
