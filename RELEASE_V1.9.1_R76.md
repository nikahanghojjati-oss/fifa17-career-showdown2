# Career Mode Showdown — gameplay bug fixes and read-cost cut (v1.9.1 runtime r76)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r76`  
Previous known-good runtime: `1.9.1-r75`

## What changed

- Gameplay bugs (owner, 2026-10-13: r76 is gameplay bugs only). Every fix landed with a failing test first.
  - The Showdown close no longer fails with a Rules evaluation-limit error. When both managers close at the same moment, the
    one who loses the race re-reads and carries on instead of showing an error.
  - Nik's setup save is no longer refused by the Rules.
  - Home's tile and header chip follow the shared season instead of sticking on "Season 1 of N".
  - BACK TO SHOWDOWN HOME on the Champion screen goes to Showdown Home, not the old dashboard.
  - REVIEW SEASON shows on the Champion screen again.
  - Standings THIS SHOWDOWN and Rivalry Statistics show the committed score mid-Showdown instead of "Loading standings."
  - The Rivalry Statistics button shows, and the screen is filled after the close.
  - Final Winner cells and the final result line are filled after the close, including when the partner closed first.
  - Phone Trophy Room shows ranks and records.
  - Tied seasons and missing stats are scored and shown correctly.
  - The Career Start panel can no longer hang: it has a time limit and a working retry.
- Read cost (owner, 2026-10-15: r76 must fix read cost).
  - Waiting on the partner costs no reads while the live update works. The repeating checks only run if it drops.
  - Measured on the release head (emulator, composed production Rules): about 404 reads and 124 writes per season. That is
    about 30 seasons a day inside the free limit, for both 30-minute and 1-hour seasons. The gate is 14 and 10.
- When the free daily limit is used up, Home shows the plain message on its own. On phones it covers no button, upright
  or sideways.
- The runtime revision moves to r76.

## What did not change

- The scoring formula, game rules, canonical local storage, the fewer-taps flow and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload, decode and startup order are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r76, and r75 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. The Rules evaluation-limit and setup fixes are in the app.

## Checks

- test:contracts, test:ops and the final-polish startup budget pass on the release head.
- All 31 full-bundle browser audits pass, and the screen-flash audit passes.
- CE2PG two-browser runs on the final workbench: 16 runs (1, 3, 5 and 10 seasons, 3 runs each, plus a draw). Every run
  reached the Champion with history identical on both browsers, after reloads and fresh sign-ins.
- Gallery of every screen, r75 against r76, at desktop and phone sizes: https://claude.ai/artifact/V2gSpstRsPH3B9FNzJmzSn

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r76.
