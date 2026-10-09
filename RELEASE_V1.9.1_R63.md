# Career Mode Showdown — Studio Z fixes (v1.9.1 runtime r63)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r63`  
Previous known-good runtime: `1.9.1-r62`

## What changed

Studio Z fixes the problems from Daniel and Nik's physical test of 2026-10-08 (Problem Z). It also ships the factory jobs
that were waiting on `gameplay/bug-list-1` since r62: jobs 1001-1006, 1009, 1010, 1014, 1015, 1017-1027 and 1029-1034,
plus Team V hand-offs HO-011 and HO-018 to HO-020.

- **Z1 Sign-in shows on a slow start.** When the phone loaded slowly, Home could come up without the player badge and
  without sign-in until Settings was opened. The identity surface now retries by itself.
- **Z2 No false "offline".** One failed network check used to lock the game on CONNECTION REQUIRED, even after the
  network came back, and TRY AGAIN did not re-check. The game now needs two failed checks in a row (or the browser saying
  it is offline), keeps re-checking, and TRY AGAIN re-checks before it tries again.
- **Z3 Refresh no longer drops a player out of the game.** A refresh on any screen (Transfer, setup, results) used to
  land on Home, and CONTINUE CAREER then asked for a session code while the other phone was still playing. The phone now
  goes back into the same game by itself. A closed and reopened tab needs one CONTINUE CAREER tap after sign-in.
- **Z4 No session codes.** Daniel's phone opens the game day and shares it with Nik's phone through the pair. Nik's phone
  joins by itself. The code screen is still reachable through USE A SESSION CODE.
- **Z5 Old builds stop lingering.** A downloaded update now applies by itself the next time the phone is on Home with
  nothing open, instead of waiting for someone to find UPDATE in Settings.
- **Z6 Sign-in cannot hang.** A Google sign-in that is closed, blocked or stuck returns to SIGN IN WITH GOOGLE after
  20 seconds with a plain message.
- **Z7 Transfer on tablets.** Upright tablets used the wide desktop layout, which pushed the Transfer fields off the left
  edge. Touch screens held upright now use the phone layout on every screen. On a phone held sideways
  or a foldable, the player-name field in Signing Entry is no longer squeezed to nothing (LOCK MY SIGNINGS failed
  with "Complete signing 1 with player name").
- **Old Settings panels are gone for good.** The Offline App install panel and the old Connected Rivalry, pairing and
  Save Library panels showed in Settings when sign-in started late. Settings now never shows them.
- **Z8 League names two countries share.** Typing "Primera División" or "Serie A" used to pick Argentina or Brazil
  silently. Those names now wait for the player to choose the country from the list.
- The runtime revision moves to r63, so browsers on r62 receive the changed shell files.

## Firestore Rules

One addition: `rivalries/{rivalryId}/sessionOffers/current`, the pair's pointer to its current game day.

- Only the two accounts of the live paired rivalry can read it, and only by its exact name.
- Only the session's own host can write it, pointing at their own open or active session, with that session's expiry
  and a server write time.
- It is never listed or deleted.

## What did not change

- The scoring formula, canonical local storage and Candidate C Apply stay as they were.
- Private Remote Joining still keeps the session itself only in page memory. A refresh keeps only a one-bit "in a game" flag for the
  tab.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r63, and r62 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r63.
