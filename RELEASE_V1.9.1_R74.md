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
  - While the close is still saving or needs a retry, the message is a slim black-and-gold strip directly above the
    two buttons, with a gold-edged CLOSE SHARED SHOWDOWN button (no more old blue-and-white box). The scoreboard makes
    room for it, so the message never covers the scoreboard and never hides a button.
- Final Winner: the scoreboard, the close message and the two buttons now stack and never overlap (Nik, 2026-10-12).
  On short desktop windows and with the SHOWDOWN COMPLETE line on top, the buttons used to cover the TOTAL TROPHIES row;
  now they always sit just under the scoreboard, which rides up only as far as the window needs, and the trophy shrinks
  a little rather than stand behind it.
- Final Winner on big sideways phones (iPhone Plus and Pro Max, 932x430) uses the sideways layout instead of the old
  blue-and-white buttons.
- Final Winner on small laptops and tablets on their side (1024x768, 1180x820): the two exits use the black-and-gold
  buttons instead of the old blue-and-white ones.
- Checked with no overlap at 1920x1080, 1920x910, 1680x1050, 1600x900, 1536x864, 1440x900, 1366x768, 1366x620,
  1280x800, 1280x720, 1280x650, 1180x820, 1100x900, 1024x768, 1024x1366, 932x430, 844x390, 667x375, 820x1180, 768x1024, 414x896, 393x660, 390x844,
  375x667 and 360x640, both closed and while the close is saving.
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
