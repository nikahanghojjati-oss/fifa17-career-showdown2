# Career Mode Showdown — career history, auto close and plain words (v1.9.1 runtime r65)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r65`  
Previous known-good runtime: `1.9.1-r64`

## What changed

- Finished online Showdowns now count in Legacy, Trophy Room and Career Statistics on both devices (JOB-1037, JOB-1039,
  JOB-1028). A code that was never joined no longer blocks the history. An unknown or still-loading current Showdown
  affects only its own row. Legacy no longer reloads on every shared event or spins forever; it gives up after 15 s with
  TRY AGAIN. Statistics shows an abandoned-only career instead of "unavailable".
- The final winner screen closes the Showdown by itself (JOB-1038, Nik's "Auto close" card). CLOSE SHARED SHOWDOWN
  appears only if saving failed. The closed screen keeps the final season's score and the trophies.
- Plain words on game screens (JOB-1011). For example: NEW CONNECTION NEEDED, SHOWDOWN FINAL RESULT, CLOSED · NO NEW
  SESSION.
- A new browser journey opens Career Statistics, Trophy Room and Legacy after a finished online Showdown, before and
  after a reload (JOB-1040).
- The runtime revision moves to r65.

## What did not change

- Firestore Rules are unchanged, so no Rules deploy is needed.
- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r65, and r64 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r65.
