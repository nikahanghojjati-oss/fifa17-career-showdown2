# offlineApp-1 (JOB-1559): first-half audit of js/offlineApp.js

Result: no findings.

Riskiest places checked:
1. `verifyNetworkConnectivity` and `scheduleConnectivityProbe` (js/offlineApp.js lines 201-240): a failed probe only counts as offline after a second failure in a row, and a stale probe result is dropped by the generation check at line 229. The timeout and retry path looked correct.
2. `scheduleAutoApplyUpdate` (lines 279-289): the one-try guard `autoUpdateTried` is set before `activateWaitingUpdate`, and a busy screen reschedules after 15 s. A refused activation therefore keeps the old build, as the comment says, and no loop was found.
3. `setMenuMediaOfflineState` (lines 117-149): the toggle is disabled and restored, and the status text is restored only when it still shows the offline message. A possible edge case (a toggle disabled for another reason before going offline is re-enabled on return) was not confirmed from this file alone.
