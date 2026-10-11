# JOB-1503 · productionSharedShowdownPresentation.js first half audit

Read: `js/productionSharedShowdownPresentation.js` lines 1 to 150 (the first half of 300 lines).

## Finding 1 · PROBABLE · a failed automatic Career Start is never retried for the same setup

- **File and line:** `js/productionSharedShowdownPresentation.js` lines 126-131 (`ssjpMaybeAutoOpenCareerStart`), specifically line 129 (the key is set before the open) and line 130 (the failure is discarded).
- **What the player sees:** both players have revealed their clubs and the setup is confirmed. The first confirmer's Career Start opens on its own. If that open fails (for example a load error), nothing happens and no message is shown. Later polls and renders do not try again, because the key for this revision is already set. The player stays on the club screen until they act manually or reload the page.
- **Why the code does it:**
  ```
  const key=`${presentationContextKey}|${setup.revision}`;if(autoCareerStartKey===key)return false;autoCareerStartKey=key;
  void ssjpOpenCareerStart().catch(()=>{});return true;
  ```
  The guard marks the key as used before the attempt, and the `catch` discards the error, so the key is never cleared on failure.
- **Smallest change:** in the `catch`, reset the key (`autoCareerStartKey=""` when it still equals `key`) and show the existing status line with the error, so the next poll can retry and the player can see the failure.
- **Confidence limit:** PROBABLE, not SURE. `ssjpOpenCareerStart` is defined outside this half, so this job did not confirm whether it can fail in practice or whether a manual control covers the same action.

## Riskiest places checked (no other real bug found)

1. Lines 113-125 (`ssjpAutoForwardToClubs` and `ssjpDeferLeagueForward`): the forward waits for a visible tab and then runs the full delay (line 123), so the club packs do not start while the tab is hidden.
2. Lines 93 and 147 (`ssjpSetControl` and `ssjpRevealCard`): while a control is working it is disabled and shows "WORKING…" (line 93), and `revealedSummaryClubs |= ...` (line 147) sets the bit for the right club because the conditional binds before the assignment.
3. Lines 52-64 (`ssjpLater`, `ssjpAdoptState`): timers are cleared when the rivalry or save context changes (line 62), so a timer from one setup cannot fire on another.

No game file was edited. This job adds one audit file only.
