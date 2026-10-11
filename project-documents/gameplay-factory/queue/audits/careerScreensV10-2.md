# careerScreensV10-2 (JOB-1566): second-half audit of js/careerScreensV10.js

Result: no findings.

Riskiest places checked:
1. `v10WrapRender` local fallback (js/careerScreensV10.js lines 176-190): when the source is local, the V10 host is removed and the old open path runs again. That path recreates the section through `createCareerStatisticsScreen` (js/statistics.js lines 87-92), so the screen is not left blank, and the wrapper does not loop because the removed host no longer carries `data-career-v10`.
2. `v10LoadOnline` (lines 225-231): `onlineLoading` is cleared in `finally`, and only the latest request (token check) redraws, so a stale load cannot leave the screen stuck on LOADING.
3. The identity-change listener (lines 209-214): it reloads the online model only when a live screen has no model and the route is online, and otherwise redraws. A sign-in or sign-out therefore refreshes the mounted screen without a second loader.
