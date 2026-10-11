# v10Screens-1 (JOB-1577): first-half audit of js/v10Screens.js

Result: no findings.

Riskiest places checked:
1. `vsStyle` settle logic (js/v10Screens.js lines 122-140): a stylesheet is left alone until it loads, errors or times out, so disabling a link that is still loading cannot drop its request. A timed-out link that never loaded stays unsettled and is not treated as ready.
2. `vsNavLock` and `vsNavFor` (lines 67-77): a lock check that throws falls back to unlocked, which keeps the bar usable. The lock reason is passed through only when the lock is on.
3. `vsOpenCareer` (lines 78-87): the Showdown's live step opens through the same special openers the app's resume path uses (`openTransferChallenge`, `prepareClubAssignment`), and everything else goes through `navigateTo`.
