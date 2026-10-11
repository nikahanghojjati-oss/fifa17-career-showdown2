# legacy.js audit, second half (lines 294-587)

no findings

Riskiest places checked:
1. Lines 296 and 421 (delete confirmations): the confirm dialog is modal, so a second tap cannot run the delete twice. The export button is also guarded by `backupExportInProgress` and `disabled` (lines 371-381).
2. Lines 317-336 (`deleteAllLegacyHistoryTransaction`): the history is restored if the active completed copy cannot be removed, and the message says so. The `history` array used for the check is the one captured at render time.
3. Lines 538-540 (render cache): the render is skipped only when the storage revision is unchanged and the container has content. Each delete and each source change resets `lastLegacyRenderedRevision` to null (lines 301, 426, 500, 526).
