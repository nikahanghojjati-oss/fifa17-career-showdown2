# Career Mode Showdown — r82: career screens count real finished Showdowns (v1.9.6 runtime r82)

Application version: `v1.9.6`  
Runtime asset revision: `1.9.6-r82`  
Previous known-good runtime: `1.9.5-r81`

r82 is a fix on top of r81. The application version moves to 1.9.6 and the runtime revision to r82.

## What changed

- Trophy Room, Legacy, History, full Rivalry Statistics and Career Statistics showed zero on the live game: every finished
  real Showdown read as `COMPLETED_SEASON_INVALID` ("Showing 0 of 2 Showdowns" on the owner's accounts). Live Firestore
  returns map fields in its own order, while the emulator keeps the written order, and js/sparkCompletedShowdownReader.js
  compared the season commit's results with `JSON.stringify`. Results are now rebuilt in one fixed key order and compared
  canonically, so every finished real Showdown counts again. The start marker's hidden list (pre-r79 test games), Showdowns
  ended early and codes nobody joined still count nowhere (emulator checks P4b and P5c).

## Update safety

- The shell and service worker advance to r82 in a fresh `career-mode-showdown-shell-1.9.6-r82` cache, and r81 is retained
  for rollback. r82 adds and removes no shell path.

## What did not change

- The scoring formula, game rules and Remote Joining stay as they were. No Rules change.
- The no-flash rules, the Reus Gate, preload and decode are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten and nothing new is written. Nothing in Firebase is deleted or edited.

## Firestore Rules

- No Rules change.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r82.
