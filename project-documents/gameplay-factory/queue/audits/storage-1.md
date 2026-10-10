# storage-1 (JOB-1555): first-half audit of js/storage.js

## Finding 1 (PROBABLE): a pending showdown draft is skipped when the transfer draft flush fails on hide or unload
- File and line: js/storage.js line 41, `flushPendingApplicationWrites`.
- What the player sees: after a failed transfer draft save, a pending showdown edit made in the last 420 ms before the tab is hidden or closed is never written. It is lost with no notice.
- Why: the `&&` short-circuits, so `flushScheduledCurrentShowdownSave()` never runs when `transferFlushed === false`.
  `return transferFlushed!==false&&flushScheduledCurrentShowdownSave()!==false;`
- Smallest change: call both flushes unconditionally, then combine the results:
  `const currentFlushed=flushScheduledCurrentShowdownSave();return transferFlushed!==false&&currentFlushed!==false;`

## Finding 2 (PROBABLE): saveCurrentShowdown drops a pending draft silently when the save runtime is not ready
- File and line: js/storage.js lines 37-38, `cancelScheduledCurrentShowdownSave` and `saveCurrentShowdown`.
- What the player sees: an edit that was queued by `scheduleCurrentShowdownSave` is discarded with no notice when the runtime is not ready, because the timer is cancelled first.
- Why: `function saveCurrentShowdown(){cancelScheduledCurrentShowdownSave();return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.saveCurrentShowdown());}`
  The cancel runs before the readiness check, and a false result does not call `reportStorageError`.
- Smallest change: check `isReady()` first and return false without cancelling, or call `reportStorageError("Unable to save the current showdown", ...)` on a false result so the player is told.

Riskiest places also checked: `loadSavedShowdown` / `readSaveLibraryActive` fallback (lines 44-45) and the preference cache (lines 25-26), both of which fall back to defaults correctly.
