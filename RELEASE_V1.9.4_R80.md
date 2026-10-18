# Career Mode Showdown — r80: the live Showdown is saved online and END SHOWDOWN (v1.9.4 runtime r80)

Application version: `v1.9.4`  
Runtime asset revision: `1.9.4-r80`  
Previous known-good runtime: `1.9.3-r79`

r80 is the release the owner calls r80. The application version moves to 1.9.4 and the runtime revision to r80.

## What changed

- The live Showdown continues on any device and after a reload (#929). Firebase is the one source of truth for a live
  Showdown: when a phone or browser does not have the game yet, it rebuilds it from the online pairing and carries on in the
  same season. Nothing new is stored online for this and no extra reads or writes are made.
- END SHOWDOWN replaces deleting a live game (#930). Settings shows END SHOWDOWN (same red button). It ends the Showdown for
  both players, and History keeps it as "Ended early" with the date and the seasons played. Ended-early games never count
  towards Legacy, Career Statistics, the Trophy Room or the Rivalry.
- A second Showdown on the same page no longer shows a red History error (#931).
- Career Statistics numbers no longer stick at 0 on the first visit after a reload (#931).
- Wording: no screen says the career lives in "this browser", "this device" or a "local copy" any more. The Home START tile
  reads CONTINUE SHOWDOWN while a Showdown is live (WAITING FOR NIK while Daniel's code is open), and UNPAIR and START REAL
  CAREER say "Finish or end the current Showdown" instead of "delete". Device sign-in wording (registered device, FORGET
  THIS DEVICE) and backup-file wording stay as they were. `tests/contracts/r80-online-save-wording-contracts.cjs` keeps it so.
- The application version moves to 1.9.4 and the runtime revision to r80.

## Update safety

- The shell and service worker advance to r80 in a fresh `career-mode-showdown-shell-1.9.4-r80` cache, and r79 is retained
  for rollback. r80 adds and removes no shell path, so the retained r79 shell is checked against the same 221 paths.

## What did not change

- The scoring formula, game rules and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload and decode are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Finished Showdowns open exactly as before.

## Firestore Rules

- Rules change (#928): the abandon write may carry the ended-early mark `endedEarly:{seasonsPlayed}`. No new collection.
  The zero-billing Rules deploy runs on merge.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r80.
