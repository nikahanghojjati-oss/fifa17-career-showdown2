# Career Mode Showdown — Season Results on phones and the closed Final Winner (v1.9.1 runtime r66)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r66`  
Previous known-good runtime: `1.9.1-r65`

## What changed

- Season Results on phones (JOB-1041). One page scroll now reaches COMMIT & ACKNOWLEDGE SHARED SEASON and ACKNOWLEDGE
  SHARED SEASON in portrait and landscape, with no inner scroll box. The title has its own row above the tabs. Both
  manager photos sit in matching boxes; short landscape hides them. Desktop layout is unchanged.
- The closed Final Winner shows the final season and trophies on both phones (JOB-1042), including when the rival's
  phone closed the Showdown first. The screen reads the closed Showdown once with the completed-Showdown reader and still
  verifies it before showing anything.
- Showdown Gate (CI only, trial mode): pull-request code no longer runs with a write token (JOB-1043).
- The runtime revision moves to r66.

## What did not change

- Firestore Rules are unchanged, so no Rules deploy is needed.
- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r66, and r65 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r66.
