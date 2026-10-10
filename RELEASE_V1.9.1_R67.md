# Career Mode Showdown — Olympiad fixes and private transfer locks (v1.9.1 runtime r67)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r67`  
Previous known-good runtime: `1.9.1-r66`

## What changed

- Transfer guesses stay private (JOB-1051). Each locked guess and signing commitment now carries a private 64-hex salt
  kept in the manager's own role document, so the shared ledger hash no longer reveals a locked guess. The reader
  accepts both r66 and salted records.
- Transfer Rules match the reader (JOB-1052). Signing names and catalog values are checked by the Firestore Rules the
  same way the app checks them.
- The transfer countdown agrees across both phones (JOB-1058). The server clock is anchored to the middle of the token
  round trip, with half a second added when the token time is a whole second.
- Unfinished Signing Entry rows survive a refresh (JOB-1050) and use the app's storage helpers.
- Season Results caps league position and points by the real league size (JOB-1055).
- The club summary stays sealed until each pack opens (JOB-1049).
- The Rule Book and Season review text match the rules (JOB-1048).
- Restoring a backup with Keep current onto an empty device keeps it empty (JOB-1053).
- Showdown Gate (CI only, trial mode): the exit report and seal fail closed on bad evidence (JOB-1044), and its actions
  are pinned to verified commits (JOB-1045).
- The runtime revision moves to r67.

## What did not change

- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r67, and r66 is retained for rollback.

## Firestore Rules

- The transfer challenge fragment changes (JOB-1051 and JOB-1052, approved by Nik). The zero-billing Rules deploy runs
  from main with this release. After the merge, the composed Rules fixture is re-pinned to production main.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r67.
