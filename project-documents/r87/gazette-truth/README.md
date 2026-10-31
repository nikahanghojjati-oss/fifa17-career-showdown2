# r87 Touchline Gazette: every printed line is true (Fable cloud job 1)

The Gazette (`js/touchlineGazette.js`) prints a SEASON paper after each Season Results and a FINAL paper after Final Winner,
from the HO-048 rows in `data/gazetteCopy.js` and `data/frontPages.js`. Owner rule (Nik): **every printed line must match
what happened.** This folder holds the truth sweep that renders every paper the engine can print and the record of what
the read of every printable row found and changed.

## The sweep (`tests/support/gazetteTruthSweep.cjs`)

```
node tests/support/gazetteTruthSweep.cjs                       # full sweep, 50 Showdown ids per case -> sweep-report.json
node tests/support/gazetteTruthSweep.cjs --ids=50 --out=x.json  # another report name
node tests/support/gazetteTruthSweep.cjs --fast                 # the contract's fixed-seed subset (G18, a few seconds)
```

It builds valid Shared History projections with `js/sharedHistoryConvergence.js` (the shape the contracts use; clubs
"Borussia M'gladbach" and "Atlético Madrid", or "Coventry City" and "Nott'm Forest") and renders:

- every season-score pair 0..11 × 0..11 with **every legal trophy mix** that gives those scores (48 mixes per manager:
  Champions League or Europa League or neither, league title, domestic cup, performance bonus, awards bonus; 2,304 mix
  pairs per score grid), as season 1, 2 and 9 of a 10-season Showdown (SEASON edition) and as the last season of a 1-, 3-
  and 5-season Showdown (told by the FINAL edition, since the last season has no SEASON paper). The seasons before the one
  under test come from 13 prefix families (Daniel or Nik leading, level, all draws, streaks, wide gaps, narrow gaps, Europe,
  zero) so comeback, lead-extended, level-overall, winning-streak and final-season-decider pages all print;
- the named FINAL cases for 1, 3, 5 and 10 seasons: Daniel wins, Nik wins, level, a 1-point margin, a big margin, a
  comeback (trailing until the last season), a lead held throughout, Golden (110), 0 total, all draws, a bonus-only winner,
  a Europa-only winner, level before the last season, decided early, a drawn season inside a won Showdown; with Special
  Players present and missing, and the season papers of the same Showdowns;
- 50 Showdown ids per case (the hash walks different rows), both phones' papers compared for one id in five.

Every printed row (headline, story, quote, caption, ears, briefs, the engine's own lines) is recorded with the facts it
was printed for (season and total scores, margin, items won, gaps before and after, streak, level, decider, led
throughout, decided early, Golden, Special Players) and sample filled texts. Mechanical checks fail the sweep: leftover
`{...}`, undefined/NaN/null, "1 points", "marquee", a manager other than Daniel or Nik, a club not in the game, a number
not among the paper's facts, both phones printing different papers, a paper that throws or returns null. A set of broad
truth checks (a draw told as a win, a rout on a small margin, Europe without Europe, "five seasons" in a ten-season
Showdown, ...) flags rows for the read; they are deliberately noisy and were read by hand.

Reports: `sweep-report-before.json` (the engine and copy before this job's fixes) and `sweep-report-after.json`.

## Engine fixes (`js/touchlineGazette.js`), each with a contract in `tests/contracts/r87-gazette-contracts.cjs` that fails before the fix

| Fix | What was false | Contract |
| --- | --- | --- |
| "1 seasons" | A drawn 1-season Showdown printed "After 1 seasons" (`{seasonsTotal} seasons`); only "1 points" was singularised. `fill` now singularises "1 seasons" too. | G14 |
| Last-season decider at a gap of 11 | The decider pages ("whoever wins it", "turn the Showdown upside down", "a stunning change of monarch", "sudden death") were offered while the gap was 11, when the trailer can at best level it (a season is worth 11, equal totals are a draw). Now offered at a gap of at most 10. | G15 |
| Dominant win | The dominant pages (landslide, ocean, laps ahead, "from start to finish", "unchallenged reign", "out of sight by the end") were offered whenever the gap before the last season exceeded 11, so they printed for a 1-point final margin (the loser won the last season 11-0) and for winners who trailed early. Now offered only when the winner was ahead after every season, out of reach before the last one and still more than a season clear at the end. | G16 |
| Silverware without a trophy | The two ears (strap lines by the masthead, e.g. "Every cup in the room now smirks") skipped the no-silverware rule, so a bonus-only win printed them; a drawn season with no trophy either side (0-0, 1-1 on bonuses) and a drawn Showdown without a trophy printed silver headlines, stories, quotes and captions. The ears now go through the same keep, and trophy-less draws count as no-silver. | G17 |
| Fresh situations preferred | With fewer rows left for trophy-less draws, nine drawn seasons could repeat a story. When several true situations are offered, the paper now prefers those whose headline and story are both unused in this Showdown (unchanged choice when all are fresh). | G17 |

Part 0 (Fable job 2 findings, G12 and G13): a season paper no longer closes on a 9-second timer while
`continueToNextSeason()` is in flight (it stays until the step has finished or failed, and a failed step hands Season
Results back with its own working button); the Special Player chip is loaded as one of the paper's files and read when
the paper is built, so both phones print the identical paper, Special Players line included.

## Rows found false and what was done (34 rows, 35 edits; nothing removed, every situation keeps its rows)

Judged as a sub-editor against every input the row printed for. Colour the data cannot contradict ("the closing weeks
felt like a lap of honour") was left alone; claims the data can contradict were edited minimally, keeping the voice.

| Row | Old text (the false part) | Input that made it false | Done |
| --- | --- | --- | --- |
| h1-002 (big-win) | EVERY NICHE FILLED / Not a corner was left empty as {winner} ran up... | 6-0 win with one trophy (Champions League plus a bonus): niches were left empty | NICHE AFTER NICHE FILLED / Corner after corner was filled as... |
| h1-033 (big-win) | SIDEBOARD SWEPT BARE / {winner} cleared the table of honours | 7-0 with the Champions League only: the table was not cleared | SIDEBOARD RAIDED / {winner} took the pick of the honours |
| h1-110 (narrow-win) | NARROWLY DRAWN ENDING | any narrow win: a won season headlined DRAWN | NARROWLY SKETCHED ENDING |
| h1-127 (draw) | [HALF TIME] HALF TIME, FULL RESPECT | a drawn season 1 of 10 or 9 of 10: not half time | [FULL TIME] FULL TIME, FULL RESPECT |
| h1-220 (comeback) | a contest once leaning the other way has found its suspense again | the winner is still behind overall (the comeback page prints only then) | a contest leaning the other way... |
| h1-235 (comeback) | ...and closed the previous gap | still behind: the gap was narrowed, not closed | ...narrowed the previous gap |
| h1-252 (lead-extended) | From the outset {leader} held the better overall position | leader lost season 1, led from season 3, extended in season 4 | Before this season {leader} held... |
| h1-380 (decider) | The chaser is far from finished | level totals before the last season: nobody is chasing | {trailer} is far from finished (the row is now refused when level) |
| h1-383 (decider) | After many seasons of preparation | season 2 of 3: two seasons | After the seasons of preparation |
| h1-387 (decider) | Whoever owns this one will be remembered as the Showdown's champion | leader 8 ahead: the trailer can win the last season by 3 and still lose | This one decides who will be remembered... |
| h1-388 (decider) | It has one run of fixtures and it must produce a winner | the last season can leave the totals level (a draw) | ...and then the Showdown is over |
| h2-004 (1 season) | a single tight season that ended in the Showdown title | 11-0 in one season | a single season that ended... |
| h2-029 (1 season) | a Showdown that never allowed a rematch | the Final Winner screen offers a one-tap Rematch (r87) | ...never allowed a second season |
| h2-042 (3 seasons) | finished as clear Showdown winners | a 1-point Showdown margin | finished as the Showdown winners |
| h2-044 (3 seasons) | {winnerClub} led the 3-part saga from the front, and the finale simply confirmed the order | winner trailed until the last season (won on the final day) | came out on top of the 3-part saga, and the finale settled the order of things |
| h2-064 (3 seasons) | {winner} walked it without ever losing the way | winner lost a season, or trailed before the last | {winner} was the one who reached the end of it first |
| h2-066 (3 seasons) | {winnerClub} kept the best of the music for last | winner lost the last season (decided early) | was still playing the lead when the music stopped |
| h2-103 (5/10 seasons) | The disagreement lasted a great many seasons | 5 seasons | The disagreement lasted {seasonsTotal} seasons |
| h2-172 (drawn) | The deadlock held through the whole Showdown and not even the last season could force it open | one manager led until the last season levelled it | The Showdown ends in deadlock, and not even the last season could pull the managers apart |
| h2-189 (final day) | HELD ON FOR THE FINISH / {winner} refused to let go of the Showdown through the closing season | the final-day winner was never ahead before the last season | TOOK HOLD AT THE FINISH / {winner} took hold of the Showdown in the closing season |
| h2-192 (final day) | A COMEBACK OF NERVE | level before the last season: no comeback | A FINISH OF NERVE |
| h2-198 (final day) | {winner} edged {loser} at the line | level before, then 11-0: an 11-point margin | {winner} passed {loser} at the line |
| h2-201 (final day) | THE CROWN CHANGED HANDS LATE / Both managers wore it in turn | level throughout, then won: the loser never led | THE CROWN SETTLED LATE / Neither manager owned it until the end |
| h2-220 (final day) | {loserClub} chased all the way | the loser led before the last season | {loserClub} was in it all the way |
| h2-221 (final day) | Margins narrowed all the way to the closing season | gaps of 0, then -3, then -5, then won: nothing narrowed | The question stayed open all the way to the closing season |
| h2-246 (dominant) | Each season added to the lead | the loser won a season inside a dominant Showdown | The lead was built early |
| s-014 (narrow-win) | Season {seasonNo} was merely the opening round of a long argument | season 2 of 10 | ...merely one round of a long argument |
| s-097 (drawn) | two rivals spent years trading blows | a drawn 1-season Showdown | spent the whole Showdown trading blows |
| s-101 (drawn) | {clubA} and {clubB} traded the lead, the pressure and the nerves | one manager led throughout until the last season levelled it; a 1-season draw has no lead to trade | traded blows, pressure and nerves |
| s-103 (final day) | who edged home by {margin} / A margin of {margin} sounds small written down | level before, then 11-0: margin 11 | who came home by {margin} / A margin of {margin} is how it reads written down |
| s-104 (final day) | Close finishes are the stuff of memory... how near the distance was, with only {margin} between them | margin 10 or 11 | Late finishes are the stuff of memory... will remember the distance, {margin} between them |
| s-107 (final day) | had been inseparable for long stretches | the loser led by 11 before the last season | had kept the question open for long stretches |
| s-108 (final day) | {winner} held on when {loser} pushed hardest | the winner was never ahead before the last season | {winner} came through when {loser} pushed hardest |
| s-114 (dominant) | this one tilted early and kept tilting | the loser won a season inside a dominant Showdown | tilted early and stayed tilted |

Rows that can never print and were left as they are: h1-145, h1-424, h1-461, h1-467 (they contain "marquee" in the
theatre sense; the engine's BANNED rule skips them, and each situation keeps at least 36 other rows).

Judgement calls (left as voice, not facts): cabinet hyperbole for a winner with at least one real trophy (big and
comfortable wins always have one), within-season narrative the data cannot contradict ("led from the first page",
"settled long before the end"), "rematch" on final pages (the product offers one; "next season" lines are filtered),
"Price: one point" on the masthead, the brief "Nothing on the shelf / No trophy and no bonus point" (a statement of fact).

## Before / after (50 ids per case, the same 707,600 papers each)

| | before (base `73713d7`) | after (this PR) |
| --- | --- | --- |
| Papers rendered | 707,600 (358,800 season, 348,800 final) | 707,600 |
| Rows printed and read | 968 (724 headlines, 114 stories, 30 quotes, 30 captions, 30 ears, 35 briefs, 9 engine lines) | 968 |
| Rows fixed / removed | | 34 fixed (35 edits) / 0 removed |
| Mechanical failures | 0 | 0 |
| Rows printing "1 seasons" | 8 | 0 |
| Dominant rows printed with a final margin of 11 or less | 42 | 0 |
| Decider rows printed at a gap of 11 | 27 | 0 |
| Silverware ears printed on a trophy-less win | 11 | 0 |
| Broad truth-check hits (noisy by design, read by hand) | 207 | 184 (the rest are the judgement calls above) |

Never printed in either run: h1-145, h1-424, h1-461, h1-467 ("marquee", skipped by the engine), h1-361 and h1-396 ("whoever
wins it" decider lines, refused while a leader exists; when the totals are level the decider stories all need `{leader}`, so
the situation is not offered), and five final headlines the 50-id hash walk did not reach (h2-030; h2-116, h2-143, h2-144,
h2-147 of the Golden pages, which have only 100 papers in the sweep). They are the rows G18 cannot see; read by hand, all true.
