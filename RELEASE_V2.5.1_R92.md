# Career Mode Showdown 2.5.1 (r92 hotfix): LOCK MY SIGNINGS works with names picked from the list (v2.5.1 runtime r92)

Application version: `v2.5.1`  
Runtime asset revision: `2.5.1-r92`  
Previous known-good runtime: `2.5.0-r92`

2.5.1 is a one-fix release on top of 2.5.0 (main 36b648ad), shipped on Nik's OK on 15 November 2026 ("2.51 if it's
helpful"). The bug was found by the R93-06 Fable hunt (T2-1) on the emulator, on 2.5.0 and on gameplay/r93. It was not seen
in a real game yet. The rules of a Showdown did not change.

## The bug

When a manager picked two or three of his three signings from the Transfer War name list, LOCK MY SIGNINGS was refused
every time, and the screen said "Your Showdown session expired". Going back to Home and opening the Showdown again did
not help. A picked name carries the player's overall, position and SoFIFA id (r91). The Firestore Rules check every
signing row, and with two or three picked rows the check passed Firestore's limit of 1,000 evaluated expressions for one
request. Firestore then refuses the write, and the screen showed its normal text for a refused write.

- Before the fix, three typed rows with overall and position already used about 969 of the 1,000.
- 3 picked: refused. 2 picked + 1 typed: refused. 1 picked + 2 typed: locked. 2 picked only: locked.
- Workaround on 2.5.0: pick at most one name from the list and type the others, or lock two signings.

## What changed

- **Firestore Rules, Transfer War signing lock only** (R93-07, `firestore.transfer-challenge-production.fragment.rules`).
  The checks are the same, written in a cheaper form:
  - a signing's league and nationality ids are checked by the catalog of their own kind only. The general id check
    in front of them always gave the same answer;
  - the 15 positions are one pattern instead of a 15-item list;
  - overall, playerId and position are each read once. A key that is present must still be an int 30..99, an int
    1..999999 or one of the 15 positions;
  - the role document at the lock is checked with one "only these keys changed" test instead of a key list plus seven
    equal-to-stored checks.
- Kept: every row rule, the owner checks, the lock salts, the link to the public ledger write, and the account, device
  and active Session checks on both halves of the lock.
- **Worst legal lock** (3 picked signings with 80-character names, 1 or 3 guesses, either manager first, first or second
  to lock): refused before, about **842 of 1,000** now, with about 158 to spare, measured in all 8 orders.

## New checks

- `tests/firebase/transfer-lock-budget-emulator.cjs`: measures the worst legal lock on the composed production Rules
  with a calibrated padding meter and fails if any order is refused or has fewer than 150 expressions to spare. It runs
  in the Gate, the fast CI and the Rules deploy workflow.
- `tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs` K6: the same worst-case lock through the real
  provider, plus 28 refused variants: bad playerId, overall or position, extra or duplicate rows, wrong ids, and a role
  document whose guesses, timestamps or identity change, gain a key or lose one.

## Update safety

- The shell and service worker advance to 2.5.1-r92 in a fresh `career-mode-showdown-shell-2.5.1-r92` cache, and
  2.5.0-r92 is retained for rollback. 2.5.1 adds and removes no shell path. The retained shell is verified against its own
  293 paths (`tests/fixtures/shell-paths/2.5.0-r92.json`, from main 36b648ad, the same list as 2.4.0's).
- The version strings are the same length as 2.5.0's, so the startup budget is unchanged.
- 2.5.0 and 2.5.1 phones can play each other. The Rules serve both, and nothing a phone writes or saves changed.

## Deploy order

- This release changes the Firestore Rules. The Rules deploy runs first on main, and the Pages workflow deploys the site
  only after that Rules deploy succeeded.
- Compile probe (measure-firestore-rules-compile, compile only, nothing published): see the hotfix PR for the 3/3 numbers.

## Firestore Rules

- Composed production Rules SHA-256 `2a0d029e911165022ffc40b1ff347372cc78333fa60b152fd5183a339006d9be` (192,364 bytes).
  The reviewed main delta (`tests/fixtures/composed-production-rules/main-delta.json`) names main 36b648ad and lists the
  8 R93-07 hunks.

## Reads and writes

No get() or getAfter() was added or removed, and no game code that reads or writes Firebase changed. A season costs the
same billed reads and writes as 2.5.0.

## What did not change

- No tiebreak anywhere. Pairing, joining and the Remote Joining protocol stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.
- The Rule Book is unchanged.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment. The fix is proven on the emulator only. The real proof is Nik or Daniel locking three names
picked from the list in a real game.
