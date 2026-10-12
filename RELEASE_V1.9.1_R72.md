# Career Mode Showdown — screen trains, player improvements and FULL MOTION (v1.9.1 runtime r72)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r72`  
Previous known-good runtime: `1.9.1-r71`

## What changed

- Player improvements (the 2026-10-12 QoL list Nik approved):
  - QoL 1 and 7 (PR #738): on the recovery screen RESTORE BACKUP leads, and DELETE OLD SHOWDOWN & START OVER stays as a
    smaller 44px button; the signed-in account name is kept.
  - QoL 2 (JOB-1723, PR #737): Career Start failures show a plain-English sentence and "Please try again." instead of a
    raw provider code; the code stays in diagnostics.
  - QoL 3 and 6 (PR #739): a half-typed Season Result and half-typed Transfer Challenge guesses survive a reload on the
    same device (own manager only), and are cleared on publish, lock and when the Showdown closes.
- FULL MOTION setting (JOB-1652, PR #691): the in-app motion preference is stored and applied at startup.
- Club reveal respects reduced motion (JOB-1653, PR #693).
- Season Results: the 1920x1080 layout applies, and a double tap starts one navigation (JOB-1658, PR #700, #740).
- Layout trains, each browser-checked by the Team G lead before merge:
  - Home (PR #712), Connect Players (PR #713), Select League (PR #702), Transfer Challenge (PR #705),
    Season Results and Final Winner (PR #716), Rivalry and Legacy (PR #721).
  - Club (PR #684), career screens (PR #686), Rule Book and Settings (PR #687).
- Checks only: the old-CSS liveness report reads the live revision (JOB-1648, PR #690), and the screen-flash guard
  covers the Season Results and Final Winner journeys as report-only findings (JOB-1651, PR #692).
- The runtime revision moves to r72.

## What did not change

- The scoring formula, game rules, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r72, and r71 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r72.
