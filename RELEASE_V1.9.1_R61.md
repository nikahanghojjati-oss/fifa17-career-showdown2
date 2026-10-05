# Career Mode Showdown — phone full track list (v1.9.1 runtime r61)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r61`  
Previous known-good runtime: `1.9.1-r60`

## What changed

No gameplay, scoring or Firestore Rules change.

- **The phone track list stays below the logo and scrolls (PR #383).** In r60, the 11-track soundtrack sheet on phones grew upward over the "Two managers · One legacy" tagline.
  - The sheet's height is now the smaller of two values: its natural height, and the space between the hero and the bottom bar (`100dvh - --phone-hero - --phone-nav - 20px`).
  - When the list is longer than that, the sheet scrolls, with `overscroll-behavior: contain`. CLOSE is placed from the same capped height, so it stays in the sheet's top corner.
  - Only the phone portrait query in `css/homeV10.css` changes.
- The runtime revision moves to r61, so browsers on r60 receive the changed shell-cached stylesheet.

## What did not change

- No Firestore Rules change since r54.
- These stay as they were: the scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r61, and r60 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r61.
