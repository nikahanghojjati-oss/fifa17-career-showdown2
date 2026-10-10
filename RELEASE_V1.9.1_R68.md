# Career Mode Showdown — Season Results fixes (v1.9.1 runtime r68)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r68`  
Previous known-good runtime: `1.9.1-r67`

## What changed

- Season Results no longer pulls a manager back after they moved on (JOB-1579, Sol lead S5). If the manager taps to
  another screen while Season Results is still loading, the late load no longer reopens Season Results.
- A passing hiccup reading the finished Transfer Challenge no longer fails the Season Results publish (JOB-1587, Sol
  lead S2). When the season's Transfer Challenge is already known to be complete for the same context, a failed refresh
  of it is ignored; any other failure is still reported.
- Showdown Gate (CI only): the Gate becomes the only pull request check, with POS20 and Gameplay Fast kept as manual
  runs (JOB-1060). The Rules regression lane runs only when its inputs change on non-main pull requests, and always on
  pushes and on pull requests into main (JOB-1580).
- The composed Rules check is pinned to production main r67 (no Rules change).
- The runtime revision moves to r68.

## What did not change

- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r68, and r67 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r68.
