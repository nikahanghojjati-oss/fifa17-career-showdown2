# Career Mode Showdown — Version 2.0 live-site fixes (v1.9.1 runtime r55)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r55`  
Previous known-good runtime: `1.9.1-r54`

## What changed

No gameplay, scoring or Firestore Rules change.

- The GitHub Pages deploy now publishes `visual-assets/` (PR #367). Without it every Team V file returned 404 on the live site and the r54 service worker could not finish installing.
- The Settings and Rule Book look keeps keyboard focus on the same control when it mounts or unmounts (PR #368).
- The runtime revision moves to r55 so browsers that already installed r54 receive the changed `js/rulesSettingsV10.js` through a fresh shell cache.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r55, and r54 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r55.
