# Bounded red-team job · Season end and resume · r96 (2.9.0 candidate)

**For:** Astra 6.2 and Sol 6.2, the same job for each, run separately. **Read only:** change no code and open no PRs.
**Suggested effort:** Astra 6.2 **High** (not Extra: an Extra Astra job on r93 used a whole 5-hour limit and returned nothing). Sol 6.2 **Extra high**.
**Hard time box: 4 hours.** See "Time plan". A short report delivered on time beats a long one that never arrives.

## Code to test
Repo nikahanghojjati-oss/fifa17-career-showdown2, branch **gameplay/r96**, commit **93af7740** (use this exact commit, not main). Live is 2.8.0 on main 30b79695.

## The game in 6 lines
A private two-player FIFA 17 career "Showdown" between two managers, Nik and Daniel. Each plays on his own phone or Chromebook, and both share one Firebase (Spark, free tier) database. A Showdown is 1, 3, 5 or 10 seasons. Each season both managers enter their own result, each **publishes**, then each taps **CONFIRM SEASON**. That makes **one shared season commit**, after which the next season starts, or, after the last season, **Terminal Close** shows **Final Winner**. **Sacked:** if either manager ticks Sacked on Season Results, the Showdown ends after that season and the points so far decide. Equal points are a draw; there is no tiebreak anywhere.

## Why this area
Season end is where most real bugs in this game have lived: the commit button not showing after both published, unfinished seasons changing career totals, resume after reload and reconnect failing, and (fixed today in #1546) a tab closed right after the final CONFIRM reopening on Home. It is also the step where a mistake sticks: a wrong commit, a double commit, or a lost season.

## Scope: only these files
js/productionSharedSeasonResults.js, js/productionSharedSeasonResultsRoute.js, js/productionSharedSeasonCommit.js, js/productionSharedMultiSeasonProgression.js, js/productionSharedTerminalClose.js, js/productionSharedJourneyEntry.js, js/productionSharedJourneyReconnect.js, js/sparkRemoteJoining.js, js/seasonFinalV10.js, plus the Rules fragments firestore.season-results-production.fragment.rules, firestore.season-commit-production.fragment.rules and firestore.terminal-close-production.fragment.rules. Read anything else only to follow a call from these files.

## The 6 questions, in priority order. Stop at the time box, whatever is left.
1. **Exactly one commit.** Can any normal sequence give a season zero commits (stuck for good) or two (a double count)? Cover both tapping CONFIRM at the same instant, double taps, a retry after a network error, and one phone offline during the other's CONFIRM.
2. **Reload or reopen at each step.** Reopen a tab at each of these points: just after publish, between the two CONFIRMs, just after the second CONFIRM, and during Terminal Close. Does each phone land on the right screen within about 10 s and with the right numbers? (Check that the #1546 fix holds and finds no new hole.)
3. **Sacked.** Sacked in season 1, in the middle, and in the last season, by either manager or both. Does the Showdown end after that season, with the right points and on both phones?
4. **Points and History.** After Final Winner, do the points, the winner (or draw), the Golden Showdown (150 in 10 seasons) and perfect season (15) flags, and the History/career totals match the season results on both phones? Does an unfinished or ended-early Showdown stay out of the career totals?
5. **The two phones disagree.** Can one phone show a different season, score or winner from the other for longer than one refresh?
6. **Rules vs app.** Does any normal step of the season end get refused by the Rules (permission-denied), or hit the 1,000 expressions per document limit, at season 10?

## Out of scope (do not report)
- Anything that needs a modified app, hand-made requests, a third person, or "an attacker". This is a private two-player tool.
- Looks, fonts and layout.
- Known items: a 2.7.0 phone refused by a 2.8.0 Showdown (both phones update by opening Home); the ~11 s wait on Remote Joining under very slow Firestore before Final Winner; Firebase read counts (measured elsewhere).

## How to run (Codex cloud or your sandbox)
`npm ci`. Contracts: `node tests/support/run-selected-product-contracts.cjs --all`. Emulator tests: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-x "node tests/firebase/<file>.cjs"` (use firebase@12.17.0 in the app; 12.17.1 breaks auth). Build the production Rules with `node scripts/build-production-firestore-rules-with-persistent-pair.mjs`. Two-manager browser journey: tests/browser/ce2pg-journey.cjs (Chromium via Playwright; its CE2PG_* options are listed at the top of the file; `CE2PG_OUTAGES=1` adds dropped connections and a killed tab). **Use 1- and 3-season runs only.** A 10-season run takes too long for this box: answer question 6 from the Rules and the emulator tests.

## Time plan (stick to it)
- **0:00-0:30:** read the scope files and pick your 3 strongest suspects across questions 1-6.
- **0:30-2:30:** try to replay each suspect at least twice.
- **2:30:** write REPORT DRAFT 1 now, even if nothing is confirmed.
- **2:30-3:30:** take the next suspects, or a second replay of anything still unsure.
- **3:30-4:00:** final report. **Stop at 4:00.**
- Stop early once you have 3 CONFIRMED P0/P1 findings. Don't polish P3s.

## A finding counts only with a replay
Give exact steps or a script that make it happen on 93af7740, run at least twice. If you couldn't run it, mark it UNSURE and say exactly what you could not run. Never present a guess as a bug.

## Report (one markdown file, plain words)
- **File name:** ASTRA_SEASON_END_R96.md or SOL_SEASON_END_R96.md.
- **First line:** VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
- **One row per finding:** ID (AS-NN for Astra, SS-NN for Sol), severity, what the player sees, the exact replay, the file:line of the cause, CONFIRMED (ran twice) or UNSURE, and a one-line fix idea.
- **Severity:** P0 = the game can't continue, for good; P1 = a step is blocked, or a wrong result sticks; P2 = wrong but recoverable; P3 = cosmetic.
- **Close with:** a short list of the questions you checked and found clean, plus what you could not run.
