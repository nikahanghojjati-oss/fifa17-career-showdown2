# Career Mode Showdown — Final Winner exit fix (v1.9.1 runtime r74)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r74`  
Previous known-good runtime: `1.9.1-r73`

## What changed

- Final Winner (Showdown Champion): REVIEW SEASON and BACK TO SHOWDOWN HOME are reachable again after a real run.
  On live r73, the Shared Showdown Closed box sat above both buttons and pushed them below the clipped stage, so the
  screen had no way out on desktop (windowed or full screen). Nik found it after a three-season run on 2026-10-12.
  - Once closed, the stage already shows SHARED SHOWDOWN CLOSED, the winner and both totals, so the box stays for
    screen readers only and takes no room.
  - While the close is still saving or needs a retry, the box floats above the buttons in the game's type instead of
    pushing them down, and its CLOSE SHARED SHOWDOWN button stays tappable.
  - Checked at 1920x1080, 1920x910, 1366x620, 1280x650, 393x660 and 844x390.
- The runtime revision moves to r74.

## What did not change

- The scoring formula, game rules, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r74, and r73 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r74.
