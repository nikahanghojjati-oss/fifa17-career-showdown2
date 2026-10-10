# Audit: js/productionSharedSeasonCommit.js, second half (lines 77-152)

Job 1512 · Queue item 0092 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · line 133 · a failed follow-up read after a successful commit shows a failure

What the player sees: the commit or acknowledge went through on the server, but if the read that follows it fails (a brief network drop is enough), the page shows the error from the catch block (line 139) and the button still offers the action. Only a retry, which runs a fresh read first and then sees the state as satisfied, shows the true state.

Why: the follow-up read is awaited inside the same try block as the write, so its exception is handled as if the write had failed, and `pendingErrorKind` is set:
```
if(result&&result.ok===true){await psscRefreshNow(request);return true;}
...
}catch(error){if(psscContextMatches(request)){pendingErrorKind=kind;psscSetError(error.message||error.code||"Shared Season Commit failed.");
```
Smallest change: on line 133 treat the refresh as best effort, for example `if(result&&result.ok===true){try{await psscRefreshNow(request);}catch(_error){psscRefresh().catch(()=>{});}return true;}`, so a successful write returns true and the read error is shown by the read path (line 116) instead.

## Same pattern in the results file (job 1510, productionSharedSeasonResults.js)

Line 140 has the same shape, `await pssrRefreshNow(request);return true;` inside the publish try block, so a failed read after a successful publish shows the publish error and re-opens the entry form. That finding was missed in the second-half audit (audits/productionSharedSeasonResults-2.md) and is corrected there.

## Riskiest places checked (no other finding)

- Lines 103 and 115: the late-read guard. A timed-out read bumps `readGeneration`, so its late result is discarded (line 103). Verified; the first-half riskiest note is closed.
- Lines 122 and 143: double tap and tick. `busy` is set synchronously before the first await in `psscMutate`, and `psscTick` returns while busy.
- Lines 129-136: the stale-base retry runs once, and a second stale result throws (line 135) rather than returning false silently.
