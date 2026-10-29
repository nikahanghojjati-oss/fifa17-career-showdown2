# Touchline Gazette and TV commentary: the content factory

Four prompts. Each one is run again and again: copy the whole grey block into the User box and change only the first line, BATCH: 1, then 2, 3 and so on. Send me each raw reply. I check every line, remove repeats across batches and add it to the game.

Settings for all four: Claude Opus 5.5, effort High, Max tokens 64000. System box empty.

| Prompt | Each run gives | Batches | Total | Cost per run | All batches |
|---|---|---|---|---|---|
| A. Headlines | 100 headlines with subhead and kicker | 152 | 15,200 | about $0.50 | about $80 |
| B. TV commentary | 100 commentary lines | 144 | 14,400 | about $0.40 | about $60 |
| C. Front-page stories | 15 full stories with standfirst and pull quote | 76 | 1,140 | about $0.50 | about $40 |
| D. Small print | 100 captions, quotes, trophy desk notes, ears or teasers | 40 | 4,000 | about $0.40 | about $16 |

Best first round (about $40): B batches 1 to 24, A batches 1 to 19, C batches 1 to 19. That already gives every situation fresh copy. Prompt A batch 1 is checked and in (100 headlines, all rules passed). Run batch 1 of B, C and D first and send each, so I can check them before you run the rest.

Why new commentary: the current 1,500 lines (r86) were written to old rules (Europa +3, Golden Showdown = 10 seasons, big win = 10+ points) and many repeat one opening with three endings. Prompt B uses the right rules and the same 24 situations, so it drops straight in.

---

## A. Headlines (BATCH 1 to 152)

```
BATCH: 1

(Change only the number above for each run: 1, 2, 3 and so on up to 152.)

You are the headline desk of "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The Gazette prints a front page after each season and a final front page when the whole Showdown ends. The game picks one headline at random for each page, so we are building a very large library where every headline is a small gem: the kind a reader screenshots and sends to their rival.

STEP 1: WORK OUT YOUR BATCH
Situation number = ((BATCH - 1) mod 19) + 1
Lens number = ((BATCH - 1) div 19) + 1
Examples: batch 1 = situation 1, lens 1. Batch 19 = situation 19, lens 1. Batch 20 = situation 1, lens 2. Batch 152 = situation 19, lens 8.

THE 19 SITUATIONS
1. big-win (season page): {winner} won the season far ahead of {loser} (margin 6 or more).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
2. comfortable-win (season page): {winner} won the season by a clear, comfortable margin (3 to 5).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
3. narrow-win (season page): {winner} won the season by the smallest margin (1 or 2). Never write "{margin} points" in the subhead; say "by the narrowest of margins" or "by {margin}".
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
4. draw (season page): Both managers finished the season on the same points. Nobody won.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonNo} {seasonsTotal} (never {winner} or {loser})
5. champions-league (season page): {winner} lifted the Champions League this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
6. europa-league (season page): {winner} lifted the Europa League this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
7. league-title (season page): {winner} won their league title this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
8. comeback (season page): {winner} was behind overall before this season and this season pulled them back.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
9. lead-extended (season page): {leader} won the season and is now further ahead of {trailer} overall.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {seasonNo} {seasonsTotal}
10. level-overall (season page): After this season the two managers are exactly level overall.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonNo} {seasonsTotal} (never {winner} or {loser})
11. winning-streak (season page): {winner} has now won several seasons in a row. Never say how many.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
12. final-season-decider (season page): The next season is the last one, and it will decide the whole Showdown.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {seasonNo} {seasonsTotal}
13. showdown-won-1-season (final page): {winner} won a one-season Showdown: a sprint, one shot, no second chances.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
14. showdown-won-3-seasons (final page): {winner} won a three-season Showdown: a trilogy, a best of three.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
15. showdown-won-5-seasons (final page): {winner} won a five-season Showdown: an era, a long campaign.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
16. golden-showdown-won (final page): {winner} was the FIRST manager to reach 110 points and wins the Golden Showdown. The biggest story the Gazette will ever print: gold commemorative edition, history books, a dynasty. Never a combined total. Never write the number.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
17. showdown-drawn (final page): The whole Showdown ended exactly level. Nobody wins. Make a shared ending feel dramatic, not disappointing.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonsTotal} (never {winner} or {loser})
18. won-on-the-final-day (final page): {winner} won the Showdown, and it was only settled by the very last season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
19. dominant-win (final page): {winner} finished the whole Showdown far ahead overall.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)

THE 8 LENSES (the imagery family for this batch, so every batch covers fresh ground)
1. The trophy cabinet: silverware, polish, shelves, keys, display cases, engraving, medals, ribbons
2. The table and the scoreboard: league table, columns, sums, ledgers, tallies, ink, figures, the bottom line
3. History and legend: history books, monuments, statues, legends, eras, archives, plaques, folklore
4. Roads, races and journeys: marathons, sprints, finish lines, maps, routes, laps, summits, milestones
5. Stage and screen: theatre, curtain calls, encores, scripts, sequels, premieres, plot twists, credits
6. Crowns, thrones and empires: royalty, coronations, kingdoms, rulers, reigns, palaces, cabinets, elections
7. Kitchen, music and craft: recipes, ovens, menus, encores, orchestras, rhythm, tailoring, workshops
8. Night skies and the console: stars, comets, orbits, late nights, the glow of the screen, controllers, save files, pressing start
At least 70 of your 100 headlines must draw on the batch's lens. The other 30 are free: any strong idea that fits the situation.

STEP 2: WRITE 100 ROWS FOR THAT ONE SITUATION

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. A season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. Metaphors are fine ("A STORM IN THE TABLE"), facts are not ("RAIN STOPS PLAY").

HEADLINE RULES
1. ALL CAPITALS. 12 to 30 characters including spaces (count a placeholder as 10). It must break into two short lines on a phone.
2. No numbers or number words the game should supply (no "ELEVEN", "TWO", "110"). No em or en dashes. Apostrophes, question marks and exclamation marks are fine.
3. At most 20 of the 100 headlines may contain a placeholder.
4. No two headlines share the same key word, idea or pun. No more than 3 headlines start with the same word, and at most 5 start with "A" or "THE".
5. Style mix for the 100: 20 classic broadsheet (calm, grand), 20 tabloid shouts (short, loud, a verb that punches), 20 football wordplay puns (net, bar, post, table, cup, cabinet, whistle, extra time, penalty, offside, clean sheet, silverware, top flight, dugout, half time), 15 alliteration, 10 short questions, 15 punchlines of two or three words with a twist.
6. Reads naturally for any club and either manager. Kind: tease the rivalry, never mock the loser.
7. No real newspapers or famous real headlines, chants, slogans, songs, film titles, players, pundits or brands. American readers must understand it.
8. Never use these tired lines: "WHAT A SEASON", "SIMPLY THE BEST", "OVER THE MOON", "SICK AS A PARROT", "GAME CHANGER", "HISTORY MAKER".

GOOD examples of the bar (do not reuse): "CABINET RESHUFFLE", "NET PROFIT", "TABLE MANNERS", "WHO BLINKED FIRST?", "SILVER SERVICE", "CROWNED AT THE DEATH".
BAD examples: "{winner} WINS THE SEASON" (flat), "A GREAT SEASON" (vague), "WON BY TWO POINTS" (number), "SCORES A HAT TRICK" (the game does not know goals).

SUBHEAD AND KICKER
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline in warm broadsheet English, using only the situation's allowed placeholders. Pay off the headline's idea, do not repeat its words. Numbers only through placeholders. No em dashes.
- "kicker": 1 to 3 words in capitals for the black label above the headline. Use any one kicker at most 4 times. A kicker is a newspaper section label (e.g. "SEASON REVIEW", "CABINET WATCH", "LATE EDITION"); never name the writing style ("WORDPLAY", "QUESTION", "PUN", "ALLITERATION" are banned).
- Subhead variety: vary the sentence shape. At most 10 subheads may use "ahead of", at most 10 "clear of", and at most 25 may mention {seasonNo}. Some subheads lead with the club, some with the rival, some with a short image, then the news.

WORK METHOD
Think briefly; spend your effort on writing, not planning. Write all 100 in one pass, then check rules 1 to 4 quickly and fix what breaks them. Always finish all 100 rows and close the JSON.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids are b<BATCH>-001 to b<BATCH>-100 (for batch 7: b7-001 ... b7-100).
{"batch":1,"situation":"big-win","edition":"season","lens":"The trophy cabinet","rows":[{"id":"b1-001","kicker":"...","headline":"...","subhead":"..."}, ...]}
```

---

## B. TV commentary (BATCH 1 to 144)

```
BATCH: 1

(Change only the number above for each run: 1, 2, 3 and so on up to 144.)

You write the TV commentary for Career Mode Showdown, a private two-player website. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. When a season result is shared, a broadcast-style commentary bar types out one line under the scores, like the commentators in FIFA 17. The game picks a line at random, so we are building a huge library where every line sounds like a real top-level football broadcast: natural, spoken, quotable, never robotic.

STEP 1: WORK OUT YOUR BATCH
Situation number = ((BATCH - 1) mod 24) + 1
Voice number = ((BATCH - 1) div 24) + 1
Examples: batch 1 = situation 1, voice 1. Batch 24 = situation 24, voice 1. Batch 25 = situation 1, voice 2. Batch 144 = situation 24, voice 6.

THE 24 SITUATIONS
1. big-win: {winner} won the season far ahead of {loser} (margin 6 or more).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
2. comfortable-win: {winner} won the season by a clear margin (3 to 5).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
3. narrow-win: {winner} won the season by 1 or 2 points. Never write "{margin} points"; say "by {margin}" or "by the slimmest of margins".
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
4. draw: Both managers finished the season on the same points. A draw: nobody won, no tiebreak.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {season} {seasons} (never {winner} or {loser})
5. champions-league: A manager lifted the Champions League this season (worth 5).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
6. europa-league: A manager lifted the Europa League this season. Never say what it is worth.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
7. league-title: A manager won their league title this season (worth 3).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
8. cup-double: {winner} won the league title and the domestic cup in the same season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
9. no-trophy: {winner} won the season without lifting a trophy, on bonus points and consistency.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
10. comeback: {winner} was behind overall, won this season and closed the gap.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
11. lead-extended: {leader} won again and pulled further ahead of {trailer} overall.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {season} {seasons}
12. level-overall: After this season the overall totals are exactly level.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {season} {seasons} (never {winner} or {loser})
13. winning-streak: {winner} has won three or more seasons in a row. Never say the exact number.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
14. streak-broken: {winner} has just ended {loser}'s run of season wins.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
15. opening-season: The result of season one: the first word in the rivalry.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {season} {seasons}
16. halfway: The middle season of a 5 or 10 season Showdown: the halfway mark.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {season} {seasons}
17. final-season-decider: The last season is about to be played and the Showdown is still open.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {season} {seasons}
18. showdown-won: The whole Showdown is over and {winner} won it.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasons} (points and margin are OVERALL totals)
19. showdown-drawn: The whole Showdown ended level overall. A draw, nobody wins.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {season} {seasons} (never {winner} or {loser})
20. golden-showdown: The race to 110: a manager is closing in on, or has just reached, 110 points to win the Golden Showdown. Only ONE manager's total counts, never a combined total.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {season} {seasons}
21. one-season-sprint: The result of a one-season Showdown: one shot, settled at once.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasons} (points and margin are OVERALL totals)
22. dominant-run: One manager has won every season so far in this Showdown.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {season} {seasons}
23. rivalry-history: A line about the long friendly rivalry between the two managers, no result needed.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {season} {seasons} (never {winner} or {loser})
24. season-preview: Shown before a season starts: anticipation, nobody knows the result yet. No winner or loser.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {season} {seasons} {leader} {trailer}

THE 6 VOICES (write every line of this batch in this voice)
1. The lead caller: the main TV commentator at the big moment: urgent, rising, a crisp call that lands on the final word, like a goal call but for the season result
2. The co-commentator: the former pro beside them: dry, knowing, wry analysis, a little understatement, a reason why it happened told in plain football language
3. The stats desk: the numbers person: the table, the gap, the trophy count, history in the making, but only numbers that come from placeholders
4. The touchline reporter: down by the dugout: the mood, the managers' faces, the celebrations, the quiet walk to the tunnel, the cabinet being opened
5. The studio panel: the late-night highlights show: banter between pundits, a cheeky aside, a gentle wind-up of the rival, a laugh at the end
6. The radio poet: the old-school radio voice: vivid images, rhythm, a memorable turn of phrase, painting the picture for listeners who cannot see it

STEP 2: WRITE 100 LINES FOR THAT ONE SITUATION, IN THAT VOICE

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. A season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. Metaphors are fine ("A STORM IN THE TABLE"), facts are not ("RAIN STOPS PLAY").

WHAT MAKES A GREAT LINE
- It sounds spoken aloud: commas for breath, a build, then a payoff on the last few words. Read it in your head in a broadcaster's voice; if it sounds written, rewrite it.
- 8 to 24 words, 50 to 120 characters including spaces (count a placeholder as 10). One or two sentences.
- Specific to this situation: a narrow-win line must not work for a big win.
- Fresh imagery every time. Football texture is welcome: the table, the cabinet, the dugout, the tunnel, the final whistle, the open-top bus, the trophy ribbons, the long season, the console glow.
- Tone mix for the 100: 40 straight broadcast quality (the line a real commentator would be proud of), 35 warm wit (a smile, a clever turn), 25 big drama (goosebumps, the moment).
- Kind rivalry: tease, never mock or insult the losing manager.

HARD RULES
1. Every line is different in idea and shape. No two lines start with the same three words. At most 4 lines start with any one word. Never write a template with swapped endings (the old library did "X made this season a procession, and ..." three times: never do that).
2. Only the situation's allowed placeholders, copied exactly with curly brackets. Never write the managers' real names. No numbers except through placeholders; you may say "five points" only for the Champions League and "three" only for the league title.
3. Never invent goals, scores, scorers, players, transfers, injuries, dates or weather as fact. No tiebreaks: equal points are a draw.
4. No real commentators, pundits, catchphrases, chants, songs, brands or famous real quotes. No em or en dashes. American listeners must understand it.

WORK METHOD
Think briefly; spend your effort on writing, not planning. Write all 100 in one pass, check the hard rules quickly, fix what breaks them. Always finish all 100 and close the JSON.

OUTPUT
ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids cb<BATCH>-001 to cb<BATCH>-100.
{"batch":1,"situation":"big-win","voice":"The lead caller","lines":[{"id":"cb1-001","text":"..."}, ...]}
```

---

## C. Front-page stories (BATCH 1 to 76)

```
BATCH: 1

(Change only the number above for each run: 1, 2, 3 and so on up to 76.)

You write front-page stories for "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The Gazette prints a front page after each season and a final front page when the whole Showdown ends. The game picks a story at random, so we are building a big library of stories that read like the best sports desk in the world wrote them.

STEP 1: WORK OUT YOUR BATCH
Situation number = ((BATCH - 1) mod 19) + 1
Desk number = ((BATCH - 1) div 19) + 1
Examples: batch 1 = situation 1, desk 1. Batch 20 = situation 1, desk 2. Batch 76 = situation 19, desk 4.

THE 19 SITUATIONS
1. big-win (season page): {winner} won the season far ahead of {loser} (margin 6 or more).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
2. comfortable-win (season page): {winner} won the season by a clear, comfortable margin (3 to 5).
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
3. narrow-win (season page): {winner} won the season by the smallest margin (1 or 2). Never write "{margin} points" in the subhead; say "by the narrowest of margins" or "by {margin}".
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
4. draw (season page): Both managers finished the season on the same points. Nobody won.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonNo} {seasonsTotal} (never {winner} or {loser})
5. champions-league (season page): {winner} lifted the Champions League this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
6. europa-league (season page): {winner} lifted the Europa League this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
7. league-title (season page): {winner} won their league title this season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
8. comeback (season page): {winner} was behind overall before this season and this season pulled them back.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
9. lead-extended (season page): {leader} won the season and is now further ahead of {trailer} overall.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {seasonNo} {seasonsTotal}
10. level-overall (season page): After this season the two managers are exactly level overall.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonNo} {seasonsTotal} (never {winner} or {loser})
11. winning-streak (season page): {winner} has now won several seasons in a row. Never say how many.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}
12. final-season-decider (season page): The next season is the last one, and it will decide the whole Showdown.
   Allowed placeholders: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {seasonNo} {seasonsTotal}
13. showdown-won-1-season (final page): {winner} won a one-season Showdown: a sprint, one shot, no second chances.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
14. showdown-won-3-seasons (final page): {winner} won a three-season Showdown: a trilogy, a best of three.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
15. showdown-won-5-seasons (final page): {winner} won a five-season Showdown: an era, a long campaign.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
16. golden-showdown-won (final page): {winner} was the FIRST manager to reach 110 points and wins the Golden Showdown. The biggest story the Gazette will ever print: gold commemorative edition, history books, a dynasty. Never a combined total. Never write the number.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
17. showdown-drawn (final page): The whole Showdown ended exactly level. Nobody wins. Make a shared ending feel dramatic, not disappointing.
   Allowed placeholders: {managerA} {managerB} {clubA} {clubB} {points} {seasonsTotal} (never {winner} or {loser})
18. won-on-the-final-day (final page): {winner} won the Showdown, and it was only settled by the very last season.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)
19. dominant-win (final page): {winner} finished the whole Showdown far ahead overall.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal} (points and margin are OVERALL totals)

THE 4 DESKS (write every story of this batch in this desk's style)
1. The chief football writer: authoritative broadsheet match report style, measured and grand
2. The tabloid back page: punchy, short paragraphs, exclamations, cheeky puns, big energy
3. The feature writer: long-read magazine style: scene setting, character, what it means for the rivalry
4. The heritage columnist: history and legacy: how this season will be remembered, the archive, the trophy cabinet

STEP 2: WRITE 15 STORIES FOR THAT ONE SITUATION

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. A season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. Metaphors are fine ("A STORM IN THE TABLE"), facts are not ("RAIN STOPS PLAY").

EACH STORY
- "byline": a short invented byline with no person's name, e.g. "From our touchline desk". Vary it.
- "standfirst": one sentence, 14 to 24 words, the summary printed in bold under the headline.
- "paragraphs": exactly 3. Paragraph 1: 30 to 42 words, the news. Paragraph 2: 30 to 45 words, what it means for the rivalry, using only what the game knows. Paragraph 3: 20 to 35 words, the look ahead or the legacy.
- "pullquote": a short invented quote, 8 to 18 words, credited as "who": one of "A Gazette columnist", "The press box", "Overheard in the dugout", "The tea lady at the training ground" or a similar invented role. Never a real person.
- Every story has its own angle and its own opening sentence. No two stories start with the same three words.
- Only the situation's allowed placeholders. No numbers except through placeholders. Never invent goals, scores, players, transfers, injuries, dates or weather. No em or en dashes. Kind rivalry, never mean.

WORK METHOD
Think briefly; spend your effort on writing. Always finish all 15 and close the JSON.

OUTPUT
ONE JSON object and nothing else, no markdown fence. Ids sb<BATCH>-01 to sb<BATCH>-15.
{"batch":1,"situation":"big-win","edition":"season","desk":"The chief football writer","stories":[{"id":"sb1-01","byline":"...","standfirst":"...","paragraphs":["...","...","..."],"pullquote":{"text":"...","who":"..."}}, ...]}
```

---

## D. Small print (BATCH 1 to 40)

```
BATCH: 1

(Change only the number above for each run: 1, 2, 3 and so on up to 40.)

You write the small print of "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The small print is what makes the page feel like a real paper: captions, quotes, the trophy desk, the masthead ears and the inside teasers. The game picks pieces at random, so we are building a big library where every piece has craft and charm.

STEP 1: WORK OUT YOUR BATCH
Kind number = ((BATCH - 1) mod 5) + 1
Lens number = ((BATCH - 1) div 5) + 1
Examples: batch 1 = kind 1, lens 1. Batch 6 = kind 1, lens 2. Batch 40 = kind 5, lens 8.

THE 5 KINDS
1. captions: photo captions under the press photos. Each row names its photo: lead-season (the season results stage), lead-draw (both managers level), lead-final (the final winner stage), lead-gold (the trophy room in gold), winner (one manager celebrating), thinker (one manager deep in thought). 16 or 17 rows per photo. 10 to 22 words. The managers wear the Showdown kit, the stands are full. Never say who stands left or right.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {managerA} {managerB} {clubA} {clubB} (draw photo: only managerA, managerB, clubA, clubB)
2. quotes: invented quotes from the two managers after a season, 8 to 20 words each, each credited "who": "{winner}" or "{loser}" (or "{managerA}" / "{managerB}" for a draw row; set "situation" to win or draw). 70 win rows, 30 draw rows. Gracious, funny, competitive, never mean.
   Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {managerA} {managerB} {clubA} {clubB}
3. briefs: Trophy desk briefs: a bold 2 to 4 word "head" in capitals and a 14 to 26 word "text". Spread over: champions-league, europa-league, league-title, cup, performance-bonus, awards-bonus, empty-cabinet (a season with no trophy). Use {manager} and {club} for the manager it is about.
   Allowed placeholders: {manager} {club}
4. ears: masthead ears: the two little boxes either side of the paper's name. A "head" of 1 to 3 words in capitals and a "text" of 3 to 8 words. Playful newspaper promises like "INSIDE: THE CABINET, DUSTED". No placeholders.
   Allowed placeholders: none
5. inside: inside-pages teasers for the strip at the bottom: 4 to 9 words each, like "Page six: the rematch rumour mill". Never a real page number; say "Inside", "Page six", "Back page" only as words. No placeholders except {winner} or {loser} in at most 10 rows.
   Allowed placeholders: {winner} {loser}

THE 8 LENSES (the imagery family; at least 70 of 100 rows draw on it)
1. The trophy cabinet: silverware, polish, shelves, keys, display cases, engraving, medals, ribbons
2. The table and the scoreboard: league table, columns, sums, ledgers, tallies, ink, figures, the bottom line
3. History and legend: history books, monuments, statues, legends, eras, archives, plaques, folklore
4. Roads, races and journeys: marathons, sprints, finish lines, maps, routes, laps, summits, milestones
5. Stage and screen: theatre, curtain calls, encores, scripts, sequels, premieres, plot twists, credits
6. Crowns, thrones and empires: royalty, coronations, kingdoms, rulers, reigns, palaces, cabinets, elections
7. Kitchen, music and craft: recipes, ovens, menus, encores, orchestras, rhythm, tailoring, workshops
8. Night skies and the console: stars, comets, orbits, late nights, the glow of the screen, controllers, save files, pressing start

STEP 2: WRITE 100 ROWS OF THAT KIND

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. A season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. Metaphors are fine ("A STORM IN THE TABLE"), facts are not ("RAIN STOPS PLAY").

RULES
- Every row different in idea and wording. No two rows start with the same three words.
- Only the kind's allowed placeholders. No numbers except through placeholders. Never invent goals, scores, players, transfers, injuries, dates or weather. No real people, papers or brands. No em or en dashes. Kind rivalry, never mean.
- Think briefly; spend your effort on writing. Always finish all 100 and close the JSON.

OUTPUT
ONE JSON object and nothing else, no markdown fence. Ids pb<BATCH>-001 to pb<BATCH>-100. Include only the fields the kind needs ("photo" for captions, "who" and "situation" for quotes, "situation" and "head" for briefs, "head" for ears).
{"batch":1,"kind":"captions","lens":"The trophy cabinet","rows":[{"id":"pb1-001","photo":"lead-season","text":"..."}, ...]}
```
