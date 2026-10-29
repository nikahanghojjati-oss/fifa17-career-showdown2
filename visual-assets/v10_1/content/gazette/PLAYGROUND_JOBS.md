# Touchline Gazette: writing jobs for the Claude playground

Three text jobs for the full newspaper. Run them in the Claude playground at platform.claude.com (paid from the platform credit).
They need no code and no pictures. Each one sends back one block of JSON.

## Settings (the same for all three jobs)

| Setting | Value |
|---|---|
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| Effort | High |
| Thinking | Leave it on (adaptive, the default) |
| Max tokens | 32000 |
| Temperature | Leave it at the default |

Rough cost: about $0.40 to $0.90 a job, so under $3 for all three.

## How to run

1. Open platform.claude.com, then the Workbench (playground), then start a new prompt.
2. Paste the **SYSTEM PROMPT** below into the System box. It is the same for all three jobs.
3. Paste **JOB 1** into the User box and press Run.
4. Copy the whole answer (it is one JSON block) and paste it back in the Claude thread "Make Touchline Gazette a real newspaper".
5. Start a new prompt and do the same for JOB 2, then for JOB 3. Each job gets a fresh prompt with the same system prompt.

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
