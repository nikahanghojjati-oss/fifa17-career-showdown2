> **SHELVED 2026-11-24 17:56 UTC (Nik): not run.** See DUET_P1_PHONE_ROOMS.md and DUET_P2_STORY_NOTES.md.

# Claude Duet jobs for 3.0.0 "Phoenix", Tue 24 to Thu 26 Nov 2026

Follow `r100-duet/DUET_ROLE_R100.md` (role, model, budget, rules) and `r100-sol/_HOUSE_RULES_R100.md` (game summary, evidence rule, how to run things, report format). One Duet channel per job. Read and run only.

**Pins.** Unless a job names PR heads, review the NEWEST commit of branch `gameplay/r100` when you start, and write that SHA in your first line. If it moves while you work, keep your SHA.

**Budget.** About $25-40 per job, 13 jobs, about $450 in all. Stop and report if a job passes $60.

**Order.** Tuesday: D1, D2, D3, D4. Wednesday: D5-D9. Thursday: D10-D13. Any order is fine if a channel is free.

---

## D1 Swapped phone and lost taps (second opinion)
Run `r100-sol/SOL_R100_S2_RESUME_ANY_PHONE.md` as written. Note: #1590 W2 is now merged into gameplay/r100; #1592 W3 is still a PR (use its newest head). Don't look for any other report.

## D2 JOIN, END SHOWDOWN, Season Commit wait (second opinion)
Run `r100-sol/SOL_R100_S3_JOIN_END_COMMIT.md` as written (use each PR's newest head; some may have merged into gameplay/r100 by then).

## D3 10-season soak
Two-manager journey for 10 seasons (`tests/browser/ce2pg-journey.cjs`, 10 seasons) twice, then the interruption journey with EVERY interruption it supports at 3 seasons (`tests/browser/fault-injection-journey.cjs`, list them from the file). Report every failure class with its reproduction, and billed reads and writes per season. Also run `tests/browser/ce2pg-leak-soak.cjs` once and report memory growth across seasons.

## D4 Ironman core (second opinion)
Run `r100-sol/SOL_R100_S1_IRONMAN_CORE.md` as written, on the newest gameplay/r100.

## D5 Remembered sign-in and SIGN OUT (second opinion)
Run `r100-sol/SOL_R100_S4_REMEMBERED_SIGN_IN.md` as written (PR #1599 newest head, or gameplay/r100 if merged). Add the one thing the first run could not: SIGN OUT while a shared write is in flight (a Transfer War lock, a publish, a CONFIRM).

## D6 Points, winner and History truth
Files: `js/scoring.js`, `js/sharedCanonicalScoring.js`, `js/productionSharedCanonicalScoring.js`, `js/sparkSharedCanonicalScoring.js`, `js/seasonFinalV10.js`, `js/turningPoints.js` (if merged; else PR #1576), `js/productionSharedHistoryConvergence.js`, `js/careerScreensV10.js`, `js/careerSummaryStore.js`.
Check, with many generated Showdowns plus the CE2PG journey: Europa League +3 or Champions League +5, never both; Prime Pack 4/3/2/1 or nothing, never both managers in one season; perfect season 15, Golden Showdown 150; equal = DRAW with no tiebreak anywhere, and a draw never names a winner; Sacked ends the Showdown after that season and points so far decide; every career screen and History agree with the shared record; Turning Points lines are true and never name a winner on a draw. The one finished Showdown (Arsenal v Burnley, fixture `tests/fixtures/r79-finished-game`) must keep its exact numbers.

## D7 Transfer War and Squad under pressure
Files: `js/productionSharedTransferChallenge.js`, `js/sparkSharedTransferChallenge.js`, `js/sharedTransferChallenge.js`, `js/transferScreenV10.js`, `js/squadSheetStep.js`, `js/squadSheet.js`.
Two phones racing: both LOCK at the same moment; a lock near the end of the 15-minute window; a reload or a closed tab between guesses and signings; clock changed on one phone. Check that guesses and signings stay private until the reveal, a guessed player never joins a board and can't be signed again, LOCK refuses shot and guessed players on both phones, and the 15-minute window is the same for both managers.

## D8 Chamber Men and Roster Russian Roulette
Files: `js/chamberMen.js`, `js/chamberMenStep.js`, `js/rosterRoulette.js`, `js/rosterRouletteStep.js`.
7 kicks each, turn by turn; a crash or closed tab during a kick counts as a missed kick (Nik's rule, not a bug); each goal loads one bullet into the opponent's cylinder; exactly ONE trigger pull per season; the cylinder stops uniformly at random on 7 holes and never back on the start hole. Check reloads, two tabs and offline at every kick and at the pull: no kick or pull is lost, repeated or stored for the wrong manager, and both phones show the same result.

## D9 Firebase cost per season (measure only)
Run the paced budget journey (`CE2PG_BUDGET=1`, 3 seasons, slow/mid/fast) on the newest gameplay/r100 twice. Report billed reads and writes per season and the top 10 callers. Then list the 5 biggest reads that look avoidable without hurting play, sync or integrity, each with file:line and an estimated saving. Spark limit is 50,000 reads/day; Nik plays 14-30 seasons a day. Do not suggest Rules changes as the first option.

## D10 Pairing, JOIN and player choice
Files: `js/persistentNikDanielPair.js`, `js/onlinePlayerIdentity.js`, `js/sparkPrivatePairing.js`, `js/sparkRemoteJoining.js`, `js/startJoinViewModel.js`.
Pair, UNPAIR, pair again; Home auto-JOIN (polls every 20 s, max 10 min); NEW CODE while Nik is joining; CHANGE PLAYER only before pairing; a reload or offline at every step. Only Daniel starts a Showdown and picks seasons. Nothing may leave a phone stuck on WAITING or pair the wrong way round.

## D11 End of a Showdown and History at scale
Files: `js/productionSharedTerminalClose.js`, `js/sparkTerminalClose.js`, `js/productionSharedFinalReconciliation.js`, `js/sparkClosedShowdownCareerLoader.js`, `js/productionSharedJourneyEntry.js`.
Final Winner, END SHOWDOWN at every step, Sacked, REMATCH, NEW SHOWDOWN, a reload during Terminal Close on either phone. Then `tests/browser/r87-history-scale-audit.cjs` and `tests/browser/r80-first-real-game-history-audit.cjs`: History opens on the newest Showdown and stays fast with hundreds of Showdowns.

## D12 Updates, offline and cold start
Files: `service-worker.js`, `js/offlineApp.js`, `index.html`.
On the 3.0.0 build only (old versions are out of scope): first open on a fresh phone, cold start offline, a new build deployed while a Showdown is live (both phones on the same new build), reload during an update. The loading screen must hold until the next screen is ready, and nothing may flash, dim or cover a face or button.

## D13 Clubhouses look check (premium, Platinum)
Files: `css/r78-marble-surfaces.css`, `js/settings.js`, `tools/clubhouse-themes/`, `tests/browser/v10-screen-flash-audit.cjs`. Use PRs #1600, #1604 and #1607 heads if they are not merged yet.
In all four clubhouses (Wooden, Platinum, Metallic Black, Premium Matte Black), at 1920x866, 1920x1035, 1366x768, 390x844 upright and 844x390 sideways: flash test, faces identical to Wooden, no element covering a face or a button, readable text, and no player-visible "Silver". Report with screenshots described in words. This job is about looks, so a cheaper model at high effort is fine here.
