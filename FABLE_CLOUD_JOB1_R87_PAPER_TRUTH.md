# Fable cloud job 1: every Touchline Gazette line is true (Career Mode Showdown 2.0.0)

You are running in a Claude Code cloud session on repo `nikahanghojjati-oss/fifa17-career-showdown2`. You can run code. Work alone and finish in one go: **open one PR, then stop.** No check-ins, no PR subscription, no `send_later`, no waiting for CI or reviews, no follow-up messages. Do not touch `main` and do not merge anything.

## Setup
```
git fetch origin gameplay/r87
git checkout -B claude-gameplay/r87-fable-paper-truth origin/gameplay/r87
npm ci
```
Record the base SHA (`git rev-parse HEAD`) in the PR body.

## The product, in short
A private two-player FIFA 17 Career Mode competition web app. Two managers, Daniel (playerOne) and Nik (playerTwo), play a Showdown of 1, 3, 5 or 10 seasons. Each season each manager scores 0-11 points: Champions League +5 or Europa League +3 (never both), league title +3, domestic cup +1, one shared +1 for 100 league points and/or 100 league goals, one shared +1 for Top Scorer and/or Top Assist. Equal scores are a DRAW; equal totals are level. **No tiebreak anywhere; league position never decides.** Golden Showdown = 110 points in a 10-season Showdown. Each manager has one **Special Player** ("Special Player" or "SP" on screen, never "Marquee").

The **Touchline Gazette** (js/touchlineGazette.js) prints a newspaper after each season (SEASON edition) and after Final Winner (FINAL edition). It picks rows from data/gazetteCopy.js (stories, small.briefs/captions/ears/quotes) and data/frontPages.js (season, final headlines) by situation, fills `{placeholders}`, and filters some words (SILVER, FUTURE, BANNED, WINNER_TAKES_ALL). It exports `seasonEdition({projection,seasonNumber,specialPlayers})`, `finalEdition({projection,final,specialPlayers})` and `paperText(edition)` for Node. Tests: tests/contracts/r87-gazette-contracts.cjs.

## Owner rule
**Every printed line must match what happened.** A draw is never told as a win; a 1-point win is never a big win or a rout; a season without a trophy never talks about silverware; a manager without the Champions League is never called a European champion; EL is never told as CL; a final page never talks about next season; a level Showdown has no winner; nothing invents facts (scores, goals, players, injuries, managers' names other than Daniel/Nik, clubs other than the two in the game). No raw `{placeholder}`, "undefined", "NaN", "1 points", wrong club, wrong season number or wrong total.

## Part 0: two known Gazette bugs from Fable job 2 (fix first, each with a contract that fails before the fix)
- **F2-15:** `SEASON_SAFETY_MS=9000` closes the paper while `continueToNextSeason()` is still in flight. Expected: the paper (or a loading state, never dimmed) stays until the action it runs has finished or failed, and a failure leaves the player with a working way on. The tap must never run twice.
- **F2-16:** the two phones' papers can differ by the Special Players line when `CareerModeSpecialPlayerChip` is not loaded on one phone. Expected: both phones print the identical paper (load the chip's data before the paper is built, or leave the line out on both by a rule that depends only on shared data).
Commit and push Part 0 before Part A.

## Part A: an exhaustive renderer (commit and push when done)
Write `tests/support/gazetteTruthSweep.cjs` that builds valid Shared History projections (same shape the contracts test uses) and renders papers for:
- every season-score pair 0..11 × 0..11, with every legal trophy mix that gives those scores (CL vs EL vs neither, title, cup, both bonuses), for season 1 of 1, season 1/2/9 of 10, and the last season of 3 and 5;
- FINAL editions for 1, 3, 5 and 10 seasons: Daniel wins, Nik wins, level, a 1-point final margin, a big margin, a comeback (trailing until the last season), a lead held throughout, Golden (110), 0 total, Special Player present and missing, clubs with an apostrophe and an accent (e.g. "Borussia M'gladbach", "Atlético Madrid");
- 50 random Showdown ids per case, so the hash walks different rows.

For each paper, record every printed row id with its situation and the filled text. Mechanical checks (fail the sweep): leftover `{...}`, undefined/NaN/null, "1 points", "marquee", a name other than Daniel/Nik for a manager, a club not in the game, both phones (same input) printing a different paper, a paper that throws or returns null for a valid input. Output a JSON report under `project-documents/r87/gazette-truth/` (row id → every situation/input it was printed for, plus failures).

## Part B: read every row that can print (commit and push when done)
Using the sweep's report, read **every row that was printed at least once** (stories, briefs, captions, ears, quotes, season and final headlines) against **every kind of input it was printed for**. Judge it as a careful sub-editor: is every word true for that input? List each false row with the input that makes it false.

Fix the smallest coherent cause:
- the row's situation tag is wrong → retag it;
- the row's text overclaims → edit the text minimally (keep the voice; no tiebreak words, "Special Player"/"SP" only);
- the engine picks a false situation or fills a wrong value → fix js/touchlineGazette.js;
- a row cannot be made true → remove it, and make sure its situation still has rows (at least 3).
Do not change any other file (Part 0 may also change only js/touchlineGazette.js). Do not change the paper's layout, js/seasonFinalV10.js, the renderer or CSS.

Every engine fix gets a case in tests/contracts/r87-gazette-contracts.cjs that fails before the fix. Every data fix is covered by turning the sweep's mechanical checks plus a list of the false rows you found into a contract (a small fixed-seed version of the sweep that runs in under 10 s) added to r87-gazette-contracts.cjs.

## Part C (only if A and B are pushed and the tests pass)
Run the sweep once more and attach the before/after counts (rows read, rows fixed, rows removed, failures) to the PR body.

## Finish
1. `npm run -s test:contracts` must pass in full. Also run `node tests/contracts/r87-gazette-contracts.cjs` on its own and report the time.
2. Open ONE PR from `claude-gameplay/r87-fable-paper-truth` into `gameplay/r87` titled "r87 Gazette: every printed line is true (Fable cloud job 1)". Body: base SHA, head SHA, what the sweep covers, a table of every false row (id, old text, input that made it false, what you did), engine fixes with their tests, test results, and anything you were unsure of. Do not post "@codex review"; the lead posts it.
3. Then stop. Do not subscribe to the PR, do not wait for CI, do not schedule anything. The r87 lead verifies, gets Codex review and merges.

## Never
- Never push to `main` or `gameplay/r87` directly; never merge; never skip or weaken a test.
- Never add a Firebase read or write; the Gazette reads nothing.
- Never touch js/rosterRoulette*.js, career screens, css/rivalryLegacyV10.css, js/specialPlayerChip.js, js/seasonFinalV10.js.
