# JOB-1506 · productionSharedTerminalClose.js second half audit

Read: `js/productionSharedTerminalClose.js` lines 155 to 308 (the second half). Lines 1-154 were read in JOB-1505 and are not repeated here.

## Result: no findings

No real player-facing bug was found in the second half. Each refresh, close and retry path re-checks the exact request and state generation after every `await`, and a second tap while a close or retry is running returns the existing `closePromise`, so a double tap cannot close twice.

## Riskiest places checked

1. Lines 177-178 (`ptcRefresh`): the `finally` sets `busy=false` even when a close or retry started after the refresh began and is still running. The effect is limited: `ptcClose` (line 219) and `ptcRetry` (line 241) return the in-flight `closePromise`, so no second close is sent. The only visible effect is that the RECOVERY_PENDING CLOSE button (line 134, `ui.close.disabled=busy`) can be enabled while a retry is in flight. Smallest possible change: `busy=Boolean(closePromise);` in that `finally`.
2. Lines 186-187 (`ptcSessionRecoveryOwnsFailure`): this function compares `expiry` with `Date.now()` correctly. This is the same check that `ptcRemoteActive` (lines 105-106 of the first half, see JOB-1505 Finding 1) is missing, so the two functions disagree about an expired session. Cross-reference only.
3. Lines 243 and 257 (`ptcRetry`): the retry publishes `{...current,automaticSaving:true}` and keeps `automaticCloseFailed:true` from the held state, so the CLOSE button and the "Saving…" line can show together during the retry. The button is disabled while `busy` is true, and the click routes to `ptcRetry`, which returns the in-flight promise. No wrong action results.

No game file was edited. This job adds one audit file only.
