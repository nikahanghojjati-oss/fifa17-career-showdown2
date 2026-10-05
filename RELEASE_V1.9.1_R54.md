# Career Mode Showdown — Version 2.0 (v1.9.1 runtime r54)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r54`  
Previous known-good runtime: `1.9.1-r53`

## What changed

Version 2.0 ships `gameplay/recovery-v1` to production. It is the first release with the full Team V visual package on every screen, fewer taps through a shared Showdown, and the game fixes found in the real-phone tests of r52 and r53. The owner chose to release it live and then play it.

The player-facing name is Version 2.0. The technical identity stays on the `1.9.1` line as runtime `r54` because the frozen POS10 release and Shared Showdown contracts bind the production runtime to the `1.9.1-rN` line (the immediate previous runtime must be `1.9.1-r(N-1)`). Moving the application version to `2.0.0` needs a separate, reviewed change to those contracts.

### Team V screens

- Screen loader and top bar on every screen, with a revision-keyed image cache.
- Home, the Audius music player and the Loading screen.
- Start / Join, the League wheel and the Club packs.
- Transfer War (the shared Transfer Challenge).
- Rivalry Statistics and Legacy (completed History).
- Season Results, Standings and the Final Winner.
- Rule Book and Settings.

### Fewer taps

- Screens forward on their own when both managers are ready instead of waiting for a tap.
- Waiting screens check every 3 seconds.
- Season commit and acknowledge are one tap each.

### Game fixes

- Career Start no longer shows "Career Start could not be read" when a ready view can be reused (PR #353).
- A background refresh that outlives its season stays quiet instead of showing a `*_CONTEXT_STALE` error (PR #356).
- Long games (up to ten seasons) survive a 4-hour session expiry (PR #350).
- When both managers publish season results at the same moment, the later one retries instead of getting "permission denied" (PR #359).
- The app header stays readable while a Team V screen shows (PR #361).
- Same-moment season results: the two remaining paths that could still show "permission denied" (a denied league-projection preflight and a contended re-read) now recover too (PR #365).
- After the final season, comparing a past save no longer stays stuck on "waiting" (PR #363).
- Season Results no longer loses a typed value when the Team V skin mounts, and the phone shows your own card first (PR #364).

## What did not change

- No Firestore Rules change since r53 (the Rules fragments and `scripts/inject-persistent-pair-rules.mjs` are identical to main).
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r54, and r53 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r54.
