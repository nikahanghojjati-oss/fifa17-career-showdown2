# diagnostics-2 (JOB-1558): second-half audit of js/diagnostics.js

Result: no findings.

Riskiest places checked:
1. `getLifecycleProblems` (js/diagnostics.js lines 278-311): it flags `transferTimerInterval`, `leagueWheelSpinInProgress` and `clubAssignmentInProgress` when they are active off their screen. A flag that is still set after a legitimate exit would make `healthy` false, so this check can report a false integrity failure. Not confirmed; it runs as a report only.
2. `runApplicationDiagnostics` (lines 432-446): an unhealthy result is passed to `window.reportApplicationError`. Whether that shows a player-visible notice was not checked here.
3. `getMenuFeedbackProblems` (lines 200-215, read in the first half) compares `synthesis` to "original-web-audio", while the fallback at line 415 uses "lazy". The two only meet when the feedback module is not loaded, so this is a possible mismatch and not a confirmed bug.
