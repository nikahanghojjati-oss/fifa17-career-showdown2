# Career Mode Showdown — r81: the first real r79 game shows again (v1.9.5 runtime r81)

Application version: `v1.9.5`  
Runtime asset revision: `1.9.5-r81`  
Previous known-good runtime: `1.9.4-r80`

r81 is a hotfix on top of r80. The application version moves to 1.9.5 and the runtime revision to r81.

## What changed

- A real game finished on r79 that the r79 start bug hid shows again in History, Legacy, Career Statistics, Rivalry
  Statistics and the Trophy Room (owner decision 2026-10-19 20:35-20:37 UTC: only that game, Liverpool vs Hull City, comes
  back). This puts back the r80 #936 reveal that #941 had removed: `careerHiddenRivalryIds` in js/careerStartMarker.js reads
  the hidden Showdowns newest first (at most 10 exact gets, once per account and page), shows only those finished with a
  Terminal Close on r79 or later, stops at the first Showdown last written before r79 went live, and fails closed. Test
  games from earlier builds, Showdowns ended early and codes nobody joined stay hidden. A marker made after the r80 cutoff
  (2026-10-19 12:00 UTC) shows nothing extra.
- js/rivalryLegacyV10.js keeps the r80 career scope (no marker = test runs only) and asks the reveal for a ready marker.

## Update safety

- The shell and service worker advance to r81 in a fresh `career-mode-showdown-shell-1.9.5-r81` cache, and r80 is retained
  for rollback. r81 adds and removes no shell path.

## What did not change

- The scoring formula, game rules and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload and decode are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten and nothing new is written. Nothing in Firebase is deleted or edited.

## Firestore Rules

- No Rules change.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r81.
