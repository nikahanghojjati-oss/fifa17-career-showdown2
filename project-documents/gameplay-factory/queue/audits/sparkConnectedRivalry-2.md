# JOB-1496 · sparkConnectedRivalry.js second half audit

no findings

Read: `js/sparkConnectedRivalry.js` lines 724 to 1446 (the second half of 1446 lines).

Riskiest places checked, none of which showed a real bug:

1. Lines 1139-1278 and 1293-1296 (publish, preview and apply buttons): PUBLISH, PREVIEW and REFRESH are disabled from `crState.busy` in the same render that sets busy, and the BACK UP + APPLY button starts disabled and needs the checkbox. A double tap cannot start a second publish or apply through the UI. `crHandlePublish` (lines 973-975) has no guard of its own, so this depends on the render disabling the button. A second publish would be refused by the base-revision check anyway, so the damage would be a wrong "conflict" message, not a duplicate write.
2. Lines 1042-1066 (`crHandleReconciliationApply`): the apply is refused when the selected manager, Save or profile differs from the reviewed intent (line 1045), and the remote is re-read through `verifyRemote` before the local write, so a stale preview cannot apply.
3. Lines 1352-1386 (subscriptions): a sign-out clears the state and the retry timer, and a changed account or device re-runs `crInitialize`. `crInitialize` is single-flight at line 774, and a same-context re-init keeps the observed revision (line 818), so the publish base is not reset by reopening Settings.

No game file was edited. This job adds one audit file only.
