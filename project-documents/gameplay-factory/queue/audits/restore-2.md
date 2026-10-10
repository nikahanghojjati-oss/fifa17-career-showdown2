# JOB-1490 · restore.js second half audit

Read: `js/restore.js` lines 396 to 791 (the second half of 791 lines).

## Finding 1 · PROBABLE · a Save entry is rebuilt from scratch, which can drop its other fields

- **File and line:** `js/restore.js` line 534, inside `buildRemoteReconciliationCandidate` (called at preview and again at apply).
- **What the player sees:** after a remote-to-local Apply, the local Save keeps its gameplay, but any other field stored on that Save's entry in the Save Library (for example a display name or timestamp, if the entry has one) is silently removed. The player would see the Save list change after a successful reconciliation.
- **Why the code does it:**
  ```
  nextLibrary.saves[resolved.index]={saveId:target.saveId,showdown:clone(showdownAnalysis.value)};
  ```
  The new entry holds only `saveId` and `showdown`. `resolved.entry` (the existing entry) is discarded, so any other keys on it are lost.
- **Smallest change:** `nextLibrary.saves[resolved.index]={...clone(resolved.entry),saveId:target.saveId,showdown:clone(showdownAnalysis.value)};`
- **Confidence limit:** this is PROBABLE, not SURE. Confirming it needs the entry shape from `js/saveLibraryFoundation.js`, which this job does not read (the ticket limits reads to `js/restore.js`). If entries carry only `saveId` and `showdown`, the finding is moot.

## Riskiest places checked (no other real bug found)

1. Lines 593-630 (`validateRemoteReconciliationIntent`): the fingerprint and confirmation text are recomputed from the same core, and the target is re-resolved against the Save Library before any write. A stale or altered intent is rejected.
2. Line 697 (`applyCareerModeRemoteReconciliation` double tap): the `restoreInFlight` guard returns `busy` before any work, and the flag is cleared in `finally`.
3. Lines 716-758 (backup and re-verification): the remote revision is verified before the backup, after the backup, and at the final boundary. Local storage is re-snapshotted at each step. The transaction at line 758 runs only after the final candidate rebuild matches the reviewed intent.

No game file was edited. This job adds one audit file only.
