# Career Mode Showdown — Studio Z follow-up (v1.9.1 runtime r64)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r64`  
Previous known-good runtime: `1.9.1-r63`

## What changed

Two problems Nik hit on r63 the same night.

- **Z10 Forget device no longer locks the account out.** After Forget device, the game kept the forgotten device in
  memory, so signing in again in the same tab reused it and was refused ("This registered device has been revoked"),
  and TRY AGAIN looped. Forget device now drops it, so the same Google account signs in again straight away as a new
  device. A device removed from another browser still stays removed.
- **Z11 LOCK MY SIGNINGS shows on iPhones held upright.** The Signing Entry form scrolls inside its own area, and in r63
  that area ended above the button, so iPhone Safari cut the button off. The area now keeps the full screen height,
  with room kept at the bottom so the last signing row stays above the button. On a phone held sideways, the "Hidden
  from your rival until you both lock" note no longer covers row 3 and the LOCK button; the PRIVATE tag says the same.
- The runtime revision moves to r64, so browsers on r63 receive the changed shell files.

## What did not change

- Firestore Rules, the scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r64, and r63 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r64.
