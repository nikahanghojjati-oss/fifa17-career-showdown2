# Career Mode Showdown — old-design flash fix (v1.9.1 runtime r69)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r69`  
Previous known-good runtime: `1.9.1-r68`

## What changed

- The old design no longer flashes on screen changes (PR #485). While a Team V screen is still loading, the page keeps
  Team V's dark base, header and footer and Team V's stylesheets stay on, so the old white header, light page and old
  footer no longer show for a moment between screens. A screen that keeps the app's own look still ends the Team V look
  once it settles. New contract F3c covers this.
- The runtime revision moves to r69.

## What did not change

- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r69, and r68 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r69.
