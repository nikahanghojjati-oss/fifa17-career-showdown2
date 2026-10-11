# JOB-1493 · persistentNikDanielPair.js first half audit

Read: `js/persistentNikDanielPair.js` lines 1 to 162 (the first half of 323 lines).

## Finding 1 · PROBABLE · a committed Showdown close can still report "not closed"

- **File and line:** `js/persistentNikDanielPair.js` lines 131-158 (`pairAbandonCurrentShowdown`). The refresh at line 155 sits inside the same `try` as the transaction.
- **What the player sees:** the player closes the current Showdown. The online close commits, but if the refresh that follows (`pairInitialize({force:true})`) throws, the panel shows "The current Showdown connection was not closed." even though the close went through. A second tap then returns `already-closed` at line 148 and recovers, so this is a misleading message, not a stuck state. Local data is kept on the error path, so nothing is deleted by mistake.
- **Why the code does it:**
  ```
  await pairInitialize({force:true});
  return result;
  }catch(error){
    pairSetState({status:"error",busy:false,message:"The current Showdown connection was not closed. "...});
  ```
  The catch cannot tell a failed close from a failed refresh after a successful close.
- **Smallest change:** move `await pairInitialize({force:true});` out of the `try` (after the `catch`), or wrap it in its own `try` that only logs, so that once `result` is set the caller always gets `result`.
- **Confidence limit:** PROBABLE, not SURE. Whether `pairInitialize` can throw depends on its body, which is in the second half and not read by this job.

## Riskiest places checked (no other real bug found)

1. Lines 51 and 55-58 (waiting poll key): the Nik-side suppression at line 51 and the 3-minute fast window that restarts when the key changes behave as written. Neither leaves a poll stuck.
2. Lines 107 and 120 (career index append and pair link write): the page seal at 500 entries and the closed-rivalry checks keep the head and page counts consistent with the read path at line 108.
3. Lines 121 (retry): the retry also runs on definitive errors such as an identity mismatch. The transaction only writes on success, so the retry is harmless but wasteful.

No game file was edited. This job adds one audit file only.
