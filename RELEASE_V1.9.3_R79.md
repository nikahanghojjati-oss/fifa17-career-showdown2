# Career Mode Showdown — r79: permanent pairing, one START and real and test modes (v1.9.3 runtime r79)

Application version: `v1.9.3`  
Runtime asset revision: `1.9.3-r79`  
Previous known-good runtime: `1.9.2-r78`

r79 is the release the owner calls r79. The application version moves to 1.9.3 and the runtime revision to r79.

## What changed

- Permanent pairing (#900, #903, #905). After their first real pairing Daniel and Nik stay paired: each account keeps a
  partner record, and Daniel's START leaves Nik a private JOIN note, so Nik's Home offers JOIN instead of a code (PASTE A
  CODE stays as the fallback). A partner record comes only from a real-career rivalry. Remote Joining offers no USE A
  SESSION CODE to a permanently paired account.
- One start flow (#901, `js/whichShowdownIsLive.js`). Home START decides once whether to continue the live Showdown, reopen
  WAITING, join or start new. Daniel's START on the seasons screen opens WAITING over the locked league wheel and makes the
  code itself (no GET READY, no Connect Players hop, no CREATE CODE tap). START never offers to close a live Showdown;
  closing stays in Settings. Both managers continue by themselves once connected. Double taps never make two Showdowns.
- Real and test modes (#908, `js/showdownModes.js`). A real account's Settings shows "Paired with <partner>" and UNPAIR
  (blocked while a Showdown is in progress), PAIR WITH <PARTNER> or PAIR AGAIN. A test account shows TEST RUN · nothing
  counts, START TEST RUN / JOIN TEST RUN and FORGET THIS DEVICE. Every Home START is real: the seasons screen shows the
  one-time START REAL CAREER checkmark. The Settings START REAL CAREER row and SHOW TEST SHOWDOWNS AGAIN switch are gone.
- App switching costs at most one JOIN note read per 30 s (#907).
- Daniel's DELETE CURRENT SHOWDOWN no longer blocks Nik's next JOIN of a different length.
- No bare league wheel and no Home flash on reload: WAITING is ready before START routes to the wheel, the loading screen
  holds until reload recovery settles, and the Home START/JOIN tile reads "Checking..." until START settles.
- Look fixes (HO-033, #902, #906): no scrims or vignette, opaque marble panels on Standings, Rivalry, Legacy, Trophy Room,
  Final Winner, Settings and Rule Book, Season Results actions in view, sideways Career Statistics type, and Club phone
  pack badges always visible.
- The application version moves to 1.9.3 and the runtime revision to r79.

## Update safety

- The shell and service worker advance to r79 in a fresh `career-mode-showdown-shell-1.9.3-r79` cache, and r78 is retained
  for rollback. The retained r78 shell is checked against r78's own 219 shell paths; r79 adds `js/whichShowdownIsLive.js`
  and `js/showdownModes.js` and removes none.
- The 12 phone images r78 stopped using (kept in r78 for the r77 rollback shell) are not used by r78 or r79 code. They stay
  deployed in r79 and can be removed in a later release.

## What did not change

- The scoring formula, game rules and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload and decode are unchanged; reload only holds the loading screen longer (above). Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten.

## Firestore Rules

- Rules change (R79-PARTNER): owner-scoped `accounts/{uid}/partner/current` (the partner record, only from a real-career
  rivalry) and the private JOIN note `accounts/{uid}/partnerInbox/current`. No list or delete. Proven by
  `tests/firebase/permanent-partner-emulator.cjs`. The zero-billing Rules deploy runs on merge.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r79.
