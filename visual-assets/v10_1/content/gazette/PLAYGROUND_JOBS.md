# Touchline Gazette: writing jobs for the Claude playground

Five text jobs for the full newspaper (jobs 4 and 5 are the big headline packs). Run them in the Claude playground at platform.claude.com (paid from the platform credit).
They need no code and no pictures. Each one sends back one block of JSON.

## Settings (the same for all three jobs)

| Setting | Value |
|---|---|
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| Effort | High |
| Thinking | Leave it on (adaptive, the default) |
| Max tokens | 32000 |
| Temperature | Leave it at the default |

Rough cost: jobs 1 to 3 about $0.40 to $0.90 each, jobs 4 and 5 about $1 to $1.50 each, so about $5 for all five.

## How to run

1. Open platform.claude.com, then the Workbench (playground), then start a new prompt.
2. Paste the **SYSTEM PROMPT** below into the System box. It is the same for all three jobs.
3. Paste **JOB 1** into the User box and press Run.
4. Copy the whole answer (it is one JSON block) and paste it back in the Claude thread "Make Touchline Gazette a real newspaper".
5. Start a new prompt and do the same for JOB 2, JOB 3, JOB 4 and JOB 5. Each job gets a fresh prompt with the same system prompt.
6. For JOB 4 and JOB 5 only, set Max tokens to 64000 (they are long). Each costs about $1 to $1.50.

Claude checks every line against the rules before anything goes in the game.

---

## SYSTEM PROMPT (paste into the System box for every job)

```
You write copy for "The Touchline Gazette", an invented sports newspaper inside a private two-player website called Career Mode Showdown. Two friends, Daniel and Nik, each play a FIFA 17 career mode as a manager. After every season each manager enters what their club won, and the site turns it into points. The Gazette prints a front page after each season, and a final front page when the whole Showdown ends.

THE ONLY FACTS THE GAME KNOWS (never invent anything else)
- Each manager has one club for the whole Showdown.
- Points per season, per manager: Champions League win 5, league title 3, domestic cup 1, performance bonus pair at most 1, awards bonus pair at most 1. Europa League may appear as a trophy line.
- So a manager scores between 0 and 11 points in a season. 11 is the maximum. Never write a season score above 11.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the season points added up.
- A Golden Showdown is won when ONE manager reaches 110 points. It is never a combined total.
- A drawn season or a drawn Showdown is a draw. Nobody wins it.
- The game does NOT know: goals, match scores, scorers, player names, transfers, injuries, managers' tactics, crowd sizes, dates, weather, or anything that happened inside a match. Never mention any of these as fact. You may be playful about the rivalry, the scoreboard, the trophy cabinet, the long nights at the console and the pressure of the next season.

PLACEHOLDERS (the game fills these in; use them exactly, with the curly brackets)
{winner} {loser} the season or Showdown winner and the other manager
{winnerClub} {loserClub} their clubs
{managerA} {managerB} {clubA} {clubB} for draws and level pages (A is always Daniel's side, but never assume who is A)
{margin} points between them
{winnerPoints} {loserPoints} each one's points this season (or overall on a final page)
{points} each manager's points when they are level
{leader} {trailer} who is ahead and who is behind overall
{seasonNo} {seasonsTotal} e.g. season 2 of 3
Only use the placeholders listed for each job. Never write the names Daniel or Nik directly; always use placeholders. Never write a number that should come from the game; use a placeholder.

STYLE
- British broadsheet sports desk with a warm, witty tabloid edge. Plain English, short sentences, vivid verbs.
- Friendly rivalry. Tease, never insult. No swearing, no body or personal jokes, nothing mean about the losing manager.
- No real newspapers, journalists, pundits, players, chants, slogans or brand names. Real club names only ever arrive through the placeholders.
- American readers must understand it too, so avoid obscure slang.
- No em dashes. Use commas, full stops or colons.
- Every line must read naturally whatever club and name the game fills in.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Use straight double quotes. Keep every id unique and in the order shown.
```

---

## JOB 1: season front-page stories (paste into the User box)

```
Write the lead story for the SEASON front page.

For each of these 12 situations write 4 different stories (48 in all):
big-win, narrow-win, comfortable-win, draw, champions-league, europa-league, league-title, comeback, lead-extended, level-overall, winning-streak, final-season-decider

What the situations mean:
- big-win: the season winner was far ahead (margin 6 or more).
- comfortable-win: margin 3 to 5.
- narrow-win: margin 1 or 2.
- draw: both managers finished the season on the same points. Use {managerA} {managerB} {clubA} {clubB} {points}, never {winner} or {loser}.
- champions-league: the season winner lifted the Champions League.
- europa-league: the season winner lifted the Europa League.
- league-title: the season winner won their league title.
- comeback: the season winner was behind overall before this season and the season pulled them back.
- lead-extended: the overall leader won the season and stretched the lead. Use {leader} {trailer}.
- level-overall: after this season both are level overall. Use {managerA} {managerB}.
- winning-streak: the season winner has now won several seasons in a row.
- final-season-decider: the next season is the last one and decides the Showdown.

Each story:
- "byline": a short invented byline such as "By the Gazette Chief Football Writer" or "From our touchline desk". No person's name.
- "paragraphs": exactly 3 paragraphs. Paragraph 1: 28 to 40 words, the news. Paragraph 2: 30 to 45 words, what it means for the rivalry. Paragraph 3: 20 to 35 words, a look ahead to {seasonNo} plus one, or to the cabinet.
- Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {managerA} {managerB} {clubA} {clubB} {points} {leader} {trailer} {seasonNo} {seasonsTotal}.

JSON shape:
{"stories":[{"id":"g1-001","edition":"season","situation":"big-win","byline":"...","paragraphs":["...","...","..."]}, ...]}
Number the ids g1-001 to g1-048.
```

---

## JOB 2: final front-page stories (paste into the User box, new prompt)

```
Write the lead story for the FINAL front page, printed when the whole Showdown is over.

For each of these 7 situations write 5 different stories (35 in all):
showdown-won-1-season, showdown-won-3-seasons, showdown-won-5-seasons, golden-showdown-won, showdown-drawn, won-on-the-final-day, dominant-win

What the situations mean:
- showdown-won-1/3/5-seasons: {winner} won a Showdown that lasted that many seasons.
- golden-showdown-won: {winner} was the FIRST manager to reach 110 points. This is the biggest story the Gazette will ever print: write it like a gold commemorative edition. Never call 110 a combined total.
- showdown-drawn: both managers finished level overall. Use {managerA} {managerB} {clubA} {clubB} {points}, never {winner} or {loser}.
- won-on-the-final-day: the result was only settled by the last season.
- dominant-win: {winner} finished far ahead overall.

Each story:
- "byline": a short invented byline, no person's name.
- "paragraphs": exactly 3 paragraphs. Paragraph 1: 30 to 42 words, the result. Paragraph 2: 30 to 45 words, how the rivalry went over the seasons, only using what the game knows. Paragraph 3: 20 to 35 words, the legacy and the rematch.
- Allowed placeholders: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {managerA} {managerB} {clubA} {clubB} {points} {seasonsTotal}. Here {winnerPoints} and {loserPoints} are OVERALL totals.

JSON shape:
{"stories":[{"id":"g2-001","edition":"final","situation":"showdown-won-1-season","byline":"...","paragraphs":["...","...","..."]}, ...]}
Number the ids g2-001 to g2-035.
```

---

## JOB 3: captions, quotes, trophy desk, ears and teasers (paste into the User box, new prompt)

```
Write the small print that makes the Gazette look like a real paper. Five lists in one JSON object.

1. "captions": 48 photo captions, 8 to 20 words each, written like real press captions (present tense, who and where). There are no faces or match action to describe: the photos are portraits of the two managers in suits or kits, in a floodlit stadium, a trophy hall or a lounge.
   8 for each "photo" value:
   - "lead-season": both managers in the stadium after a season. Use {winner} {loser}.
   - "lead-draw": both managers, the season ended level. Use {managerA} {managerB}.
   - "lead-final": both managers on the final night with confetti. Use {winner} {loser}.
   - "lead-gold": both managers in the trophy hall on the Golden Showdown night. Use {winner} {loser}.
   - "winner": a portrait of the season winner celebrating, fist raised. Use {winner} {winnerClub}.
   - "thinker": a portrait of the other manager, arms crossed or hand on chin, already planning. Use {loser} {loserClub}. Kind, never mocking.
   Shape: {"id":"gc-001","photo":"lead-season","text":"..."}

2. "quotes": 48 short quotes for a pull-quote box, 6 to 18 words each. They are lighthearted lines the Gazette "heard", attributed by the game to a manager. Friendly, confident, never boastful about the other person, never rude.
   8 for each "mood": "season-winner", "season-runner-up", "season-draw", "champion" (won the whole Showdown), "runner-up" (lost the Showdown), "golden" (reached 110 first).
   No placeholders inside quotes except {winnerClub} or {loserClub} where it fits.
   Shape: {"id":"gq-001","mood":"season-winner","text":"..."}

3. "briefs": 56 short "Trophy desk" briefs for the side column, one manager each. "head" 2 to 5 words, "text" 14 to 26 words. Never write a point value.
   8 for each "topic": "champions-league", "europa-league", "league-title", "domestic-cup", "performance-bonus", "awards-bonus", "empty-cabinet" (this manager won nothing this season; be kind and hopeful).
   Use only {manager} and {club}.
   Shape: {"id":"gb-001","topic":"champions-league","head":"...","text":"..."}

4. "ears": 30 tiny joke lines for the boxes beside the masthead, 3 to 8 words each, in the style of "Weather: floodlights, rivalry heating up" or "Price: one point, no refunds". No placeholders.
   Shape: {"id":"ge-001","text":"..."}

5. "inside": 30 teaser lines for the "Inside today" strip at the foot of the page, 4 to 10 words each, ending with an invented page number such as "p.6". They tease features the Gazette might run: the trophy cabinet, the rivalry table, the next club draw, the letters page, the console room. Never promise facts the game does not know. Use {winner} or {loser} in at most 10 of them.
   Shape: {"id":"gi-001","text":"..."}

JSON shape:
{"captions":[...],"quotes":[...],"briefs":[...],"ears":[...],"inside":[...]}
```

---

## JOB 4: 480 more season headlines (paste into the User box, new prompt, Max tokens 64000)

```
Write MANY more headlines for the SEASON front page so the paper rarely repeats itself.

For each of these 12 situations write 40 new rows (480 in all):
big-win, narrow-win, comfortable-win, draw, champions-league, europa-league, league-title, comeback, lead-extended, level-overall, winning-streak, final-season-decider
(Same meanings as before: big-win margin 6+, comfortable 3 to 5, narrow 1 or 2; draw and level-overall use {managerA} {managerB} {clubA} {clubB} {points}, never {winner}; lead-extended uses {leader} {trailer}.)
For narrow-win write the subhead so it reads right for a margin of 1 as well as 2: never write "{margin} points"; say "by the narrowest of margins", "by {margin}" or similar.

Rules for every headline:
- ALL CAPITALS, 12 to 30 characters including spaces. It must fit two short lines on a phone.
- At most 1 in 5 headlines may use a placeholder ({winner}, {loser}, {winnerClub}, {loserClub}, {leader}, {trailer}, {managerA}, {managerB}); count a placeholder as 10 characters.
- Mix the styles evenly: classic broadsheet, punchy tabloid shout, wordplay and puns on football words (net, bar, cup, table, silverware, cabinet, whistle, extra time, penalty), alliteration, short questions, one-word-plus-punch ("SILVER LINING"), and grand commemorative lines.
- Every headline must be new: not the same as, or a tiny change of, any headline in the EXISTING list below, and no two new ones alike. Do not start more than 3 headlines with the same word.
- Never state a number in a headline.

Each row also has:
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline, using the placeholders allowed for that situation (see JOB 1/JOB 2 meanings). Numbers only through placeholders.
- "kicker": 1 to 3 words in capitals for the black label above the headline (e.g. "SEASON REVIEW", "DRAMA", "GOLDEN EDITION").

JSON shape (order by situation as listed, ids h1-301 to h1-780):
{"season":[{"id":"h1-301","situation":"big-win","kicker":"...","headline":"...","subhead":"..."}, ...]}

EXISTING season headlines (do not repeat or lightly reword any of these):
A SCOREBOARD STATEMENT | THE GAP GROWS GRAND | A SEASON IN CAPITALS | ONE WAY TRAFFIC | A GIANT POINTS HAUL | THE BIG FINISH | THAT IS SOME MARGIN | ROOM TO CELEBRATE | THE POINTS PARADE | THE DISTANCE TELLS | CLEAR BLUE SCOREBOARD | A MARGIN WITH MUSCLE | THE LEAD IS LARGE | PLENTY OF DAYLIGHT | THE BIG PICTURE | A DASH OF DOMINANCE | POINTS BY THE PLENTY | A WHISKER WILL DO | THE NARROWEST OF WINDOWS | JUST ENOUGH TO CHEER | FINE MARGINS FINE FEELING | A LITTLE GOES LONG | A SLENDER SEASON SUCCESS | THE TINIEST BREATHING SPACE | CLOSE CALL CLEAR RESULT | TWO SIDES ONE SMALL GAP | A FINISH WORTH FRAMING | SMALL GAP BIG GRIN | THE SLIM ADVANTAGE | A CLOSE SHAVE INDEED | THAT WILL JUST ABOUT DO | LITTLE BETWEEN THESE TWO | A TIGHT SEASON SETTLED | THE NARROW ROAD HOME | A SOLID SEASON'S WORK | THE CUSHION LOOKS COMFY | A HEALTHY LEAD TAKES IT | COMFORT ON THE CARD | A VERY HANDY MARGIN | NO NEED FOR A RULER | THE POINTS ADD UP | A LITTLE ROOM TO ROAR | THE CAMPAIGN PAYS OFF | SPACE ON THE SCOREBOARD | THE COMFORT ZONE | POINTS WITH PURPOSE | A REWARDING RETURN | THE GAP HAS A CHAIR | A CONVINCING CAMPAIGN | A GOOD DAY FOR ARITHMETIC | THE STEADY ROUTE HOME | LEVEL AT THE LINE | POINTS SHARED HONOURS SHARED | THE SCOREBOARD SAYS DRAW | A PERFECT BALANCE | EVEN STEVENS ON POINTS | THE SHARED SPOILS | TWO CAMPAIGNS ONE TOTAL | NO SPACE BETWEEN THEM | A MATCHED SET | DEAD LEVEL AND DELIGHTFUL | THE SAME NUMBER TWICE | THE EQUALLY GOOD NEWS | ALL SQUARE IN PRINT | THE BALANCE HOLDS | A DRAW TO REMEMBER | THE NUMBERS AGREE | SHARING THE SPOTLIGHT | EUROPE'S BIG NIGHT BELONGS | THE EUROPEAN CROWN ARRIVES | A FIVE POINT EUROPEAN TOUR | THE STARS SHINE BRIGHT | A EUROPEAN NIGHT TO FRAME | THE BIG CUP COMES HOME | FIVE POINTS OF GLORY | CHAMPIONS OF THE CONTINENT | THE ANTHEM HAS A WINNER | A TROPHY UNDER THE LIGHTS | EUROPEAN SILVERWARE SECURED | THE CROWN AND THE COUNT | A NIGHT ABOVE THE REST | FIVE FOR THE BIG ONE | THE EUROPEAN SPOTLIGHT | SILVERWARE WITH STAR QUALITY | THE CONTINENTAL CELEBRATION | EUROPA GLORY ON THE BOARD | THREE POINTS AND A TROPHY | THE EUROPA CELEBRATION | A EUROPEAN PRIZE CLAIMED | THREE CHEERS FOR EUROPA | THE ROAD ENDS IN GLORY | A CONTINENTAL CUP RETURNS | EUROPA LIGHTS UP THE PAGE | A TRIO OF EUROPEAN POINTS | THE CUP WITH THREE POINTS | A NIGHT IN EUROPA COLOURS | SILVERWARE AND THREE MORE | EUROPEAN JOY IN THREE | THE EUROPA REWARD | A CUP FOR THE CABINET | THREE POINTS ACROSS EUROPE | THE EUROPA EDITION | TOP OF THE LEAGUE | THE CHAMPIONS HAVE ARRIVED | A CROWN FOR THE CAMPAIGN | LEAGUE GLORY IN PRINT | THE TITLE IS THEIRS | CHAMPIONS ON HOME SOIL | A TITLE WORTH THE WAIT | THE LEAGUE BELONGS HERE | CROWNED AFTER THE CAMPAIGN | THE CHAMPION'S EDITION | FIRST PLACE FESTIVITIES | A LEAGUE OF THEIR OWN | THE TITLE COMES TO TOWN | DOMESTIC DELIGHT DELIVERED | THE TOP TABLE CELEBRATES | CHAMPIONS WRITE THE STORY | THE CROWN FINDS A HOME | THE CHASE GAINS GROUND | A STEP BACK TOWARD THE LEAD | THE PURSUIT FINDS ITS FEET | A LITTLE CLOSER NOW | THE GAP GETS A TRIM | THE COMEBACK HAS BEGUN | A GAIN IN THE CHASE | THE ROAD BACK OPENS | THE LEADER LOOKS BACK | POINTS TAKEN GROUND GAINED | THE CHASER STRIKES BACK | A TURN IN THE PURSUIT | THE MARGIN MEETS ITS MATCH | A CHASE WORTH WATCHING | THE GAP IS SHRINKING | A REPLY ON THE BOARD | THE COMEBACK COLUMN | THE LEADER PULLS AWAY | MORE ROOM AT THE TOP | THE LEAD GETS LONGER | POINTS PILE UP FRONT | THE GAP TAKES A STEP | FRONT RUNNER FINDS MORE | THE LEADER ADDS DISTANCE | ANOTHER STEP CLEAR | THE CUSHION GETS CUSHIONIER | THE VIEW FROM FIRST | MORE POINTS MORE DISTANCE | A LEAD WITH LEGS | OUT IN FRONT AGAIN | THE GAP GROWS AGAIN | FRONT PAGE FOR THE LEADER | THE ADVANTAGE BUILDS | THE OVERALL SCORES ALIGN | A LEVEL PLAYING LEDGER | THE BIG PICTURE IS EVEN | NOTHING BETWEEN THEM OVERALL | THE OVERALL BALANCE RETURNS | EVEN IN THE LONG VIEW | THE SHOWDOWN STANDS SQUARE | OVERALL HONOURS EVEN | TWO TOTALS ONE NUMBER | THE LEDGER LEVELS OUT | THE BIG SCOREBOARD BALANCES | A SHOWDOWN IN EQUILIBRIUM | LEVEL IN THE LONG GAME | THE TOTALS SHAKE HANDS | THE OVERALL PICTURE MATCHES | ALL SQUARE ACROSS SEASONS | THE RUN ROLLS ON | ANOTHER SEASON ANOTHER WIN | THE STREAK HAS LEGS | THE WINNING WAYS CONTINUE | A HABIT WORTH KEEPING | THE RUN CONTINUES IN STYLE | THE STREAK MAKES HEADLINES | THE WINNING COLUMN GROWS | ANOTHER ENTRY IN THE RUN | THE SEASONS KEEP COMING | THREE OR MORE AND RISING | THE STREAK STILL SHINES | A SEQUENCE TO SAVOUR | THE RUN IS STILL RUNNING | MORE MOMENTUM MORE MEMORIES | THE STREAK FINDS ANOTHER GEAR | THE FINAL CHAPTER AWAITS | ONE SEASON LEFT TO WRITE | THE LAST ACT BECKONS | THE DECIDER DRAWS NEAR | ONE MORE CAMPAIGN TO GO | THE FINALE TAKES SHAPE | THE LAST SEASON CALLS | ALL ROADS LEAD TO FINALE | THE FINAL PAGE IS BLANK | THE LAST CAMPAIGN LOOMS | THE FINALE IS SET | ONE LAST SEASON'S WORK | THE SHOWDOWN'S FINAL ACT | THE LAST WORD AWAITS | THE HOME STRETCH BEGINS | ONE SEASON TO SETTLE IT
```

---

## JOB 5: 280 more final headlines (paste into the User box, new prompt, Max tokens 64000)

```
Write MANY more headlines for the FINAL front page, printed when the whole Showdown ends.

For each of these 7 situations write 40 new rows (280 in all):
showdown-won-1-season, showdown-won-3-seasons, showdown-won-5-seasons, golden-showdown-won, showdown-drawn, won-on-the-final-day, dominant-win
(Same meanings as JOB 2: golden-showdown-won means {winner} was the FIRST manager to reach 110 points, never a combined total; showdown-drawn uses {managerA} {managerB} {clubA} {clubB} {points}, never {winner}.)
Golden Showdown headlines should feel like a once-in-a-lifetime commemorative edition.

Rules for every headline:
- ALL CAPITALS, 12 to 30 characters including spaces. It must fit two short lines on a phone.
- At most 1 in 5 headlines may use a placeholder ({winner}, {loser}, {winnerClub}, {loserClub}, {leader}, {trailer}, {managerA}, {managerB}); count a placeholder as 10 characters.
- Mix the styles evenly: classic broadsheet, punchy tabloid shout, wordplay and puns on football words (net, bar, cup, table, silverware, cabinet, whistle, extra time, penalty), alliteration, short questions, one-word-plus-punch ("SILVER LINING"), and grand commemorative lines.
- Every headline must be new: not the same as, or a tiny change of, any headline in the EXISTING list below, and no two new ones alike. Do not start more than 3 headlines with the same word.
- Never state a number in a headline.

Each row also has:
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline, using the placeholders allowed for that situation (see JOB 1/JOB 2 meanings). Numbers only through placeholders.
- "kicker": 1 to 3 words in capitals for the black label above the headline (e.g. "SEASON REVIEW", "DRAMA", "GOLDEN EDITION").

JSON shape (order by situation as listed, ids h2-301 to h2-580):
{"final":[{"id":"h2-301","situation":"showdown-won-1-season","kicker":"...","headline":"...","subhead":"..."}, ...]}

EXISTING final headlines (do not repeat or lightly reword any of these):
THE SPRINT BELONGS HERE | ONE CAMPAIGN ONE CHAMPION | A SINGLE SEASON TRIUMPH | THE QUICK ROUTE TO GLORY | ONE AND WON | THE SHORT GAME DELIVERS | A ONE SEASON MASTERPIECE | THE SPRINT FINDS A WINNER | ONE SEASON ALL THE GLORY | A BRIEF AND BRIGHT CAMPAIGN | THE ONE SEASON STORY | A SPRINT TO CELEBRATE | THREE SEASONS ONE VICTOR | THE THREE ACT TRIUMPH | A TRILOGY WITH A WINNER | THREE CAMPAIGNS ONE CROWN | THE THIRD CHAPTER CLOSES | THREE SEASONS OF STORIES | THE THREE YEAR SHOWDOWN | A TRIPLE CHAPTER CELEBRATION | THE SERIES FINDS ITS CHAMPION | THREE SEASONS IN THE BOOKS | THE THIRD SEASON'S VERDICT | THREE STEPS TO THE TITLE | FIVE SEASONS ONE CHAMPION | THE FIVE CHAPTER FINALE | HALF A DECADE OF DRAMA | FIVE CAMPAIGNS ONE CROWN | THE FIFTH ACT CLOSES | FIVE SEASONS IN PRINT | A FIVE SEASON CELEBRATION | THE LONG STORY FINDS ITS WINNER | THE FIFTH CHAPTER'S CHAMPION | FIVE CAMPAIGNS AND COUNTED | A FINALE FIVE SEASONS MAKING | THE FIVE SEASON VERDICT | TEN SEASONS OF GOLD | A DECADE FINDS ITS CHAMPION | THE GOLDEN CROWN IS CLAIMED | TEN CHAPTERS ONE WINNER | THE DECADE BELONGS HERE | GOLD AT THE FINISH | THE GOLDEN STORY CLOSES | A DECADE WORTH CELEBRATING | TEN SEASONS ONE GOLDEN ENDING | THE LONG ROAD TO GOLD | A GOLDEN FINALE TO REMEMBER | THE SHOWDOWN ENDS LEVEL | A SHARED FINAL CHAPTER | TWO MANAGERS ONE DRAW | THE TOTALS TELL THE STORY | EVEN AT THE VERY END | THE FINAL LEDGER BALANCES | NO SPACE BETWEEN TOTALS | HONOURS EVEN AFTER ALL | A PERFECTLY SHARED FINALE | THE ENDING IS ALL SQUARE | EQUAL BILLING IN THE FINALE | THE LAST DAY DELIVERS | A FINALE FOR THE AGES | THE LAST WORD GOES HERE | THE DECIDING DAY ARRIVES | THE FINALE FINDS ITS HERO | ONE LAST DAY OF DRAMA | THE CLOSING ACT DECIDES | A FINAL DAY TO FRAME | THE LAST PAGE IS WRITTEN | THE DECISIVE DAY BELONGS | THE CURTAIN FALLS ON GLORY | A SHOWDOWN IN FULL COMMAND | THE BIG PICTURE BELONGS | THE GAP TELLS THE STORY | CLEAR AT THE FINISH | A COMMANDING FINAL ACCOUNT | A LEAD BUILT TO LAST | PLENTY OF ROOM TO CELEBRATE | THE GRAND SCOREBOARD STATEMENT | A CONVINCING FINAL CHAPTER | THE OVERALL MARGIN SPEAKS | A BIG WIN IN PRINT
```
