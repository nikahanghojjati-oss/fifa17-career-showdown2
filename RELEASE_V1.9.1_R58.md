# Career Mode Showdown — Home phone overlays without the ghost coat (v1.9.1 runtime r58)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r58`  
Previous known-good runtime: `1.9.1-r57`

## What changed

No gameplay, scoring or Firestore Rules change.

- **The blurred extra coat between Daniel and Nik on the phone Home screen is gone.** Team V's V1 phone overlays each carried a feathered piece of the other manager: Daniel's had Nik's sleeve, and Nik's had Daniel's shirt and coat. Stacked together, they drew a ghost coat between the two managers. Team V cut new V2 overlays (hand-off HO-005, job V-243, factory 2daf437) that each hold only one manager. The V2 cut also removes the thin light line across Nik's jacket and the old "The Maestro / SKILL. VISION. MAGIC." lettering beside Daniel.
- The app now points `js/homeScreensV10.js` and `visual-assets/v10_1/home/home.css` at `OVL_HOME_DANIEL_PHONE_V2.webp` and `OVL_HOME_NIK_PHONE_V2.webp`, both pinned by hash. V2 keeps V1's crop box and pixel size, so placement is unchanged. The V1 files stay in the repo.
- The runtime revision moves to r58 so browsers on r57 receive the changed shell-cached files.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r58, and r57 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r58.
