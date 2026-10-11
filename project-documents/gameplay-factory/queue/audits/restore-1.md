# JOB-1489 · restore.js first half audit

Read: `js/restore.js` lines 1 to 400 (the first half of 791 lines).

## Finding 1 · PROBABLE · a "keep current active" choice is ignored when the full Save Library is restored

- **File and line:** `js/restore.js` lines 159-171 (the full-library block starts at line 159), inside `createCareerModeRestorePlan`. Line 137 still validates the active choice.
- **What the player sees:** the restore review asks whether to keep the current active Showdown or use the backup's active one, and the player picks "keep current". If they also pick "use the backup Save Library", the review reports the active state as "use-backup", and the apply replaces the whole library and clears the singleton active Showdown. The active Showdown the player chose to keep is replaced.
- **Why the code does it:**
  ```
  candidateRaw.activeShowdown=null;
  // Full library restore owns active selection via activeSaveId; clear singleton activeShowdown
  summary.active="use-backup";
  ```
  The full-library branch sets `summary.active` and clears `activeShowdown` without reading `activeChoice`.
- **Smallest change:** when `saveLibraryChoice==="use-backup"` and `activeChoice==="keep-current"`, return a blocking `choice-blocked` error with the message "Replacing the Save Library also replaces the active Showdown. Choose use-backup for the active Showdown, or keep the current Save Library." Then the review no longer shows a choice that the apply will not honour.

## Riskiest places checked (no other real bug found)

1. Lines 80-106 (`mergeLegacy`): the replacement loop at line 102 removes the higher indices first, so the first matched index stays valid. Duplicate and conflicting backup IDs are handled by `dedupeBackupLegacy` before any write.
2. Lines 270-275 (`applyCareerModeRestore` double tap): `restoreInFlight` is set synchronously before the first `await`, so a second tap gets `busy` and cannot start a second transaction.
3. Lines 297-312 (stale review): the reviewed raw state is compared against the fresh snapshot at line 297, before the plan is built at line 312 from the same complete snapshot, so keep-current cannot be reinterpreted as clean at apply time.

No game file was edited. This job adds one audit file only.
