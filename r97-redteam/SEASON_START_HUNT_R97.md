# Bounded red-team job · Season start: Prime Pack and Transfer War · r97 (2.9.0 live)

**For:** Sol 6.2 (a new area; Astra 6.2 takes the season-end packet r97-redteam/SEASON_END_HUNT_R97.md). **Read only:** change no code and open no PRs.
**Suggested effort:** Sol 6.2 **Extra high**.
**Hard time box: 4 hours.** See "Time plan". A short report delivered on time beats a long one that never arrives.

## Code to test
Repo nikahanghojjati-oss/fifa17-career-showdown2, commit **56642b8f** on **main** (this is 2.9.0, live since 2026-11-18; use this exact commit).

## The game in 7 lines
A private two-player FIFA 17 career "Showdown" between two managers, Nik and Daniel. Each plays on his own phone or Chromebook, and both share one Firebase (Spark, free tier) database. A Showdown is 1, 3, 5 or 10 seasons. Each season starts in a fixed order that is never skipped: **roulette → Prime Pack → Transfer War**. **Prime Pack:** both phones reveal one masked player card in stages (timers 25/20/20/20 s, server clock); each manager has 2 guesses; the first right guess the server records wins 4, 3, 2 or 1 points by stage; ONE manager may win, never both; nobody right by the last stage is a draw and the full card shows. **Transfer War:** a shared 15-minute window on the server clock where each manager makes private guesses/signings that stay hidden from the other until the game reveals them. A guessed (shot) player never joins the squad board and can never be signed in the Transfer War. The Special Player never comes from the manager's own club and never shows on a squad board.

## Why this area
Sol's r96 hunt covered season end and came back mostly clean. Season start has the two shared timers, the only private information in the game, and a points award decided by server time, and it has not had an outside hunt since Prime Pack shipped (r87-r88).

## Scope: only these files
js/iconGuessStep.js and js/iconGuess.js (Prime Pack; file names keep the old working name), js/rosterRoulette.js, js/rosterRouletteStep.js, js/productionSharedTransferChallenge.js, js/sparkSharedTransferChallenge.js, js/sharedTransferChallenge.js, js/transferScreenV10.js, plus the Rules fragments firestore.transfer-challenge-production.fragment.rules and firestore.season-results-production.fragment.rules (it holds primePackRounds). Read anything else only to follow a call from these files.

## The 6 questions, in priority order. Stop at the time box, whatever is left.
1. **Prime Pack awards exactly once.** Can both managers get points, or neither when one was right first, or the wrong stage's points? Cover both phones guessing right at the same instant, a guess sent just as a stage ends, a retry after a network error, double taps, and a phone whose own clock is minutes off.
2. **Privacy.** In normal use (the real app, no hand-made requests), can either phone see the other manager's Transfer War guesses or signings, or the Prime Pack answer, before the game reveals them: in the page, its saved data, or anything it reads?
3. **Timers.** Do the Prime Pack stages and the 15-minute Transfer War window follow the server clock on both phones, and does the window close exactly once with both phones agreeing? Include a phone that joins late, and one whose own clock is wrong.
4. **Reload or reopen at each step.** Reopen a tab during the roulette, during each Prime Pack stage, while the Transfer War is open, and just after its verdicts. Does each phone land on the right step within about 10 s, with the right guesses left and nothing lost or doubled?
5. **Board rules.** Can a shot (guessed) player ever join a board or be signed in the Transfer War, can the Special Player come from the manager's own club or appear on a board, or can a Transfer War verdict be lost or counted twice?
6. **Rules vs app.** Does any normal step of season start get refused by the Rules (permission-denied), or come near the 1,000 expressions per document limit, at season 10?

## Out of scope (do not report)
- Anything that needs a modified app, hand-made requests, a third person, or "an attacker". This is a private two-player tool.
- Looks, fonts, layout and 3D quality.
- Firebase read counts (measured elsewhere); an older-version phone refused by a 2.9.0 Showdown (both phones update by opening Home).

## How to run (Codex cloud or your sandbox)
`npm ci`. Contracts: `node tests/support/run-selected-product-contracts.cjs --all`. Emulator tests: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-x "node tests/firebase/<file>.cjs"` (use firebase@12.17.0 in the app; 12.17.1 breaks auth). Build the production Rules with `node scripts/build-production-firestore-rules-with-persistent-pair.mjs`. Two-manager browser journey: tests/browser/ce2pg-journey.cjs (Chromium via Playwright; its CE2PG_* options are listed at the top of the file; `CE2PG_OUTAGES=1` adds dropped connections and a killed tab). **Use 1- and 3-season runs only.** Answer question 6 from the Rules and the emulator tests.

## Time plan (stick to it)
- **0:00-0:30:** read the scope files and pick your 3 strongest suspects across questions 1-6.
- **0:30-2:30:** try to replay each suspect at least twice.
- **2:30:** write REPORT DRAFT 1 now, even if nothing is confirmed.
- **2:30-3:30:** take the next suspects, or a second replay of anything still unsure.
- **3:30-4:00:** final report. **Stop at 4:00.**
- Stop early once you have 3 CONFIRMED P0/P1 findings. Don't polish P3s.

## A finding counts only with a replay
Give exact steps or a script that make it happen on 56642b8f, run at least twice. If you couldn't run it, mark it UNSURE and say exactly what you could not run. Never present a guess as a bug.

## Report (one markdown file, plain words)
- **File name:** SOL_SEASON_START_R97.md.
- **First line:** VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
- **One row per finding:** ID (SS7-NN), severity, what the player sees, the exact replay, the file:line of the cause, CONFIRMED (ran twice) or UNSURE, and a one-line fix idea.
- **Severity:** P0 = the game can't continue, for good; P1 = a step is blocked, or a wrong result sticks; P2 = wrong but recoverable; P3 = cosmetic.
- **Close with:** a short list of the questions you checked and found clean, plus what you could not run.
