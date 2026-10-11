# v10Screens-2 (JOB-1578): second-half audit of js/v10Screens.js

Result: no findings.

Riskiest places checked:
1. `vsShow` (js/v10Screens.js lines 227-245): the frame is checked for null (the app keeps its own screen), a repeat show with the same frame and host is a no-op, and a failed mount clears the mounted state and rethrows. The `finally` always clears the pending expectation, so the app's screen is not left hidden.
2. `vsOnScreenShown` and `vsWatchScreenClasses` (lines 304-339): screens that the app no longer shows are unmounted, and class-only screen changes (used by Shared Setup) are caught by the observer, so the bar and the Team V screen follow the same screen.
3. `vsWhenStarted` (lines 290-301): the bar is mounted only after the loading screen is hidden, with a poll fallback when MutationObserver is missing, so the bar cannot appear over the splash.
