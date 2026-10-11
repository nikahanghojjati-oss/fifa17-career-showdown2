# JOB-1500 · saveLibraryRuntime.js second half audit

Read: `js/saveLibraryRuntime.js` lines 336 to 671 (the second half of 671 lines).

## Finding 1 · PROBABLE · switching or creating a Showdown can overwrite a save made while it waits

- **File and line:** `js/saveLibraryRuntime.js` lines 433-445 (`runtimeSwitchActiveSave`) and lines 477-487 (`runtimeCreateShowdown`). Both read the library before an `await` and build the commit from that old copy after the `await`.
- **What the player sees:** the player switches to another Showdown, or starts a new one, while the active Showdown is saving. The old active Showdown's last progress disappears, and the Showdown goes back to the state from before the save. There is no error, so the player only sees the old progress when they return to it.
- **Why the code does it:**
  ```
  const library=runtimeParseLibrary(raw.saveLibrary);      // line 435, before the await
  await runtimePrimeSeasonIdentities(prepared);            // line 438
  ...
  const next={...library,activeSaveId:saveId,...};         // line 442, built from the old copy
  ```
  `runtimeSaveCurrent` can run during that `await`. It updates `ownedLibraryRaw`, so the precondition check at line 439 and the commit check in `runtimeCommitLibrary` both pass, and the stale copy is written over the newer save. `runtimeCreateShowdown` has the same shape: `currentLibrary` (line 478) is read before the `await` at line 479 and used at line 484.
- **Smallest change:** read the library again after each `await` and build the candidate from that copy (`const current=runtimeParseLibrary(runtimeAuthorityRawSnapshot().saveLibrary);` immediately before line 442 and before line 484). Re-resolve `target` from the same copy.
- **Confidence limit:** PROBABLE, not SURE. The window is open only if `migrateShowdownIdentity` (in `js/saveLibraryFoundation.js`, not read by this job) yields to the event loop, for example when it awaits a crypto call. If it does not, no save can run in the gap.

## Riskiest places checked (no other real bug found)

1. Lines 548-580 (`runtimePrepareRestoreLibraryRaw`): an incoming profile that already exists in the library is not added again (line 566), and the generated profile for that role is dropped (line 565), so a restore cannot create a profile conflict on merge.
2. Lines 491-505 (`runtimeArchiveShowdown`): a repeated archive with the same `updatedAt` and `completedAt` returns `true` without a write (line 505), so repeated calls cannot write twice.
3. Lines 607-617 (`runtimeBindStorageListener`): a change to the Save Library or the active slot in another tab invalidates authority, and the next write is refused until the player reloads. This matches the message shown to the player.

No game file was edited. This job adds one audit file only.
