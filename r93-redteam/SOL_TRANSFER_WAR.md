# Job S-TW · Sol · Transfer War: serious bugs that stop the game

Read r93-redteam/_HOUSE_RULES.md first; it is part of this job.

Goal: find a serious bug that stops a real Showdown in Transfer War: a manager who cannot lock, cannot see verdicts, cannot move on to Squad Management, is stuck on a loading or error screen, or the two phones end up on different steps for good. The last such bug (fixed in 2.5.1) was a fair LOCK refused by the Firebase Rules because the write needed more than 1,000 expressions; look for any other fair Transfer War write the Rules would refuse, and any client path that turns a refusal into a dead end.

Start here: firestore.transfer-challenge-production.fragment.rules (and the composed Rules from the build script), js/productionSharedTransferChallenge.js (lock, retry, error text around permission-denied), js/sharedTransferChallenge.js, js/sparkSharedTransferChallenge.js, tests/firebase/transfer-lock-budget-emulator.cjs and the r93 sweep in L5 (search the repo for "budget sweep" / knownOver) for how writes are measured.

Try in particular:
- Every fair Transfer War write at its largest legal size (longest names, all fields, 3 signings, 3 guesses, list-picked and typed, season 1 and season 10), both lockers, both orders, on the emulator with the composed Rules.
- The 15-minute clock: lock 0-500 ms before and after the end, device clock minutes off, screen off across the end, reopen after the end.
- Network: offline at LOCK then back, a slow write, a write that is refused once and retried, two tabs of the same manager.
- Update mid-Transfer War (old build on one phone, ce4d1317 on the other).
Report as the house rules say, file name SOL_TRANSFER_WAR_REPORT.md.
