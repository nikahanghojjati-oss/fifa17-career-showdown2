# Touchline Gazette: the headline factory (one prompt, run it many times)

Settings: Claude Opus 5.5, effort High, Max tokens 64000. System box empty.

How to use:
1. Copy the whole grey block into the User box.
2. The first line says BATCH: 1. Change only that number each run (1, 2, 3 ... up to 152). Everything else stays the same.
3. Send me the raw reply. I check every headline, remove repeats across batches, and add it to the game.

Each batch gives 100 headlines with a subhead and kicker for one situation, in one imagery family. There are 19 situations and 8 families, so 152 batches = 15,200 headlines. Each run costs about $0.50 to $0.70, so all 152 would be about $80 to $105. You can stop any time: batches 1 to 19 already give every page 100 fresh headlines.

This replaces PLAYGROUND_HEADLINES.md (4B, 5A, 5B), so you do not need to run those.

---

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
- "kicker": 1 to 3 words in capitals for the black label above the headline. Use any one kicker at most 4 times.

WORK METHOD
Think briefly; spend your effort on writing, not planning. Write all 100 in one pass, then check rules 1 to 4 quickly and fix what breaks them. Always finish all 100 rows and close the JSON.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids are b<BATCH>-001 to b<BATCH>-100 (for batch 7: b7-001 ... b7-100).
{"batch":1,"situation":"big-win","edition":"season","lens":"The trophy cabinet","rows":[{"id":"b1-001","kicker":"...","headline":"...","subhead":"..."}, ...]}
```
