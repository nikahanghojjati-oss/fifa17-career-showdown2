# clubAssignment.js audit, first half (lines 1-238)

## 1. PROBABLE: a throw during the final reveal stage can lock Confirm and the club draw (lines 163-169, 319-330)

What the player sees: if the reveal throws on the last stage, the Confirm button does nothing and the draw stays locked. The sequence never reaches the point where the flag is cleared, so the screen does not recover without a restart.

Why: `scheduleClubRevealStage` clears the in-progress flag only after the render call returns:
`renderClubRevealStage(stage); if(stage === "confirmation"){ clubAssignmentInProgress = false; }`
If `renderClubRevealStage("confirmation")` throws, the flag stays true. `continueToShowdownHome` (second half, line 439) and `assignClubs` (line 380) both return early on that flag. The throw can come from `applyClubRevealCard`, which reads `identity.primary` from `window.getClubIdentity(name)` (lines 163-168) with no null check. Whether `getClubIdentity` can return nothing for a club name is in another file, which this audit did not read, so this is conditional.

Smallest change: clear `clubAssignmentInProgress` before the render call, or wrap the render in try/finally so the flag is always reset. Also guard `identity` before reading `.primary`.

## 2. Riskiest places checked

1. Lines 96-102 (`isClubAssignmentOperationCurrent`): a timer from a cancelled or older operation is ignored, so a late stage cannot change a newer showdown's screen.
2. Lines 74-82 (`initializeClubAssignment`): the reveal and confirm buttons are bound once, guarded by a dataset flag, so a re-init does not double-bind them.
3. Lines 210-226 (`setRevealControls`): the back button is disabled whenever `allowBack` is false, so the player cannot leave during the reveal.
