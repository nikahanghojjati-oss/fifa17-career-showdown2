# JOB-1499 · saveLibraryRuntime.js first half audit

no findings

Read: `js/saveLibraryRuntime.js` lines 1 to 390 (the first half of 671 lines, read through the start of the Legacy manager assignment).

Riskiest places checked, none of which showed a real bug:

1. Lines 278-298 (`runtimeSaveCurrent`): the entry is rebuilt as `{saveId, showdown}` at line 291, and on any failure `updatedAt` is reset (line 295) and a notice is shown. A failed save therefore never reports success, and the in-memory timestamp is not left ahead of the stored one. The entry shape it writes matches the shape read back by `runtimeGetActiveEntry` (lines 69-76).
2. Lines 242-254 (`runtimeCommitLibrary`): a precondition failure or a critical rollback invalidates authority before the error is thrown (line 249), so the runtime cannot keep writing on a stale snapshot. The caller gets an explicit "Reload before writing again" path through `runtimeAuthorityRawSnapshot` (line 202).
3. Lines 330-341 (`runtimeAssignSaveManagerProfile`): the same profile cannot fill both manager roles (line 340), and an assignment that already matches returns `changed:false` without a write (line 341), so a repeated tap cannot write twice.

No game file was edited. This job adds one audit file only.
