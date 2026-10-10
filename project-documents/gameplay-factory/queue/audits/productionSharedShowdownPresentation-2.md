# JOB-1504 · productionSharedShowdownPresentation.js second half audit

Read: `js/productionSharedShowdownPresentation.js` lines 151 to 300 (the second half), plus lines 126-131 to confirm one gate.

## Finding 1 · PROBABLE · a failed Career Start from a tap shows no failure message

- **File and line:** `js/productionSharedShowdownPresentation.js` lines 254 and 257 (`ssjpDecideControl`, branch `continueClubAssignment`), with the missing `try` in lines 241-261.
- **What the player sees:** the player taps the final confirm or "CONTINUE TO CAREER START". If Career Start fails to load or `openPanel` throws, the tap does nothing visible. There is no "THAT TAP DID NOT GO THROUGH" line, because the error skips the `tapFailure` branch at line 278 and the promise rejects. The button is re-rendered as enabled, so the player can only try again without knowing why it failed.
- **Why the code does it:**
  ```
  if(confirmed&&state?.setup?.phase==="SHOWDOWN_CONFIRMED"&&state?.ready===true)await ssjpOpenCareerStart();
  return confirmed?"done":"failed";
  ```
  and at line 257, `return await ssjpOpenCareerStart()?"done":"stale";`. `ssjpOpenCareerStart` (lines 221-235) throws `"Career Start is unavailable."` (line 227) and does not catch, and `ssjpDecideControl` has no `try`.
- **Smallest change:** in `ssjpDecideControl`, wrap the `ssjpOpenCareerStart()` calls at lines 254 and 257 in a `try/catch` that returns `"failed"` (and sets `lastMutationCode` to a readable code such as `CAREER_START_UNAVAILABLE`), so `ssjpHandleControlClickNow` at lines 277-278 shows the tap failure message.
- **Confidence limit:** PROBABLE. The caller of `handleControlClick` lives outside this file, so this job did not confirm whether the rejection is caught and shown elsewhere.

## Gate checked and found correct (not a finding)

- Lines 126-131 (`ssjpMaybeAutoOpenCareerStart`): line 127 returns early unless `clubRevealComplete` is true, so the automatic Career Start cannot open over an unfinished pack reveal. The tap path also waits for reveals at line 251.

## Riskiest places checked (no other real bug found)

1. Lines 210 and 212 (`ssjpMutate` and `ssjpAwaitIdle`): `busy` is cleared in `finally` before the last re-render, and `mutationPromise` is cleared only when it still matches, so a stale promise cannot block a later mutation.
2. Lines 151 and 179 (season choice buttons): the buttons are hidden at line 179 and never shown again, so `ssjpChooseSeason` at line 220 is unreachable from the UI. This matches the rule that the season comes from Daniel's original choice, so it is not a bug.
3. Lines 273-278 (`ssjpHandleControlClickNow`): a first `"stale"` result returns silently only when the state signature did not change. Otherwise the tap re-reads authority and retries once, which is the intended one-tap behaviour.

No game file was edited. This job adds one audit file only.
