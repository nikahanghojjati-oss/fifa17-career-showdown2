# Career Mode Showdown — Firebase read/write fix and Reus Gate (v1.9.1 runtime r75)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r75`  
Previous known-good runtime: `1.9.1-r74`

## What changed

- Firebase reads and writes (owner, 2026-10-12: Spark Firestore answered `429 resource-exhausted` after one evening of play).
  - Read-only checks no longer commit a write, the device check is cached, identical refreshes are shared, a hidden tab
    does no background work, and a quota answer pauses background work instead of retrying.
  - Partner waits use one live listener on the document the partner's move changes, with the 3 s / 15 s checks kept as the
    fallback.
  - Measured on a whole three-season Showdown for both managers: about 9,000 reads and 8,000 writes before, 1,261 reads and
    410 writes after. Idle reads per browser fell from 192–399 a minute to 0–22. Partner updates land in 0.5–2.2 s, and
    Final Winner in 1.8–2.7 s.
  - History, Career Statistics, Trophy Room and Legacy still save and show on both devices after every season, including
    with a hidden tab and after a reload. Details: `/mnt/project-files/gameplay/r75/FIRESTORE_BUDGET.md`.
  - When the free daily limit is used up, the game says so in one plain line: "Today's free online limit is used up. It
    resets at 3 am Boston time. Your saved career is safe."
- The Reus Gate (owner, 2026-10-13: the old or half-loaded Home flashed for seconds between the loading screen and Home).
  - The Marco Reus loading screen stays until the real Home is ready: its stylesheets loaded, fonts ready, its pictures
    decoded at this screen's density and nothing pending. A fast device moves on quickly and a slow one keeps the loading
    screen longer, with a 15 s safety cap.
  - The same ready check covers the first open of each screen: a screen stays covered until its scenery picture is decoded.
- Journey Reconnect and Terminal Close now load their runtime only when a shared Showdown exists, so an ordinary start no
  longer loads the retired Remote Joining code.
- The runtime revision moves to r75.

## What did not change

- The scoring formula, game rules, canonical local storage, the fewer-taps flow, Remote Joining and Candidate C Apply stay
  as they were.
- The no-flash rules, preload, decode and startup order are unchanged; the loading screen's minimum time stays 2.7 s.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r75, and r74 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r75.
