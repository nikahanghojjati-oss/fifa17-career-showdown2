# Playground content prompts (owner picked "All three", 27 Oct 2026)

**Settings for every run:** model `claude-opus-5-5`; thinking **off** (or the lowest level); max tokens **32000**. Use the laptop. Open a **New** prompt for each run, paste the prompt into the user message, press Run, then copy the whole answer and paste it in the r85 lead thread (or attach it as a .txt file) with the run's code, e.g. "C1".

Order: C1 to C7, then S1 to S4, then H1 to H4. 15 runs in total. For C6, C7 and S1 to S4 set thinking to **low** (real facts); keep it off for the rest.

## C1: Commentator lines 1: big-win, narrow-win, comfortable-win, draw

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 300 short commentary lines the game shows after a result, spread evenly across these situations:
- big-win (margin of 10+ points in a season)
- narrow-win (margin 1 to 3 points)
- comfortable-win (margin 4 to 9 points)
- draw (equal points in a season: a draw, nobody wins)

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "<prefix>-<3-digit number>", "situation": "<one of the situations>", "text": "<the line>"}. Lines are 8 to 28 words, spoken-commentary style (they are read aloud), all different from each other (vary openings, rhythm and imagery). At least a third must be genuinely funny: playful banter, football clichés turned on their head, cheeky mock-drama. Never mean. Use id prefix "c1".
```

## C2: Commentator lines 2: champions-league, europa-league, league-title, cup-double, no-trophy

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 300 short commentary lines the game shows after a result, spread evenly across these situations:
- champions-league (a manager won the Champions League this season, +5)
- europa-league (a manager won the Europa League this season, +3)
- league-title (a manager won their domestic league)
- cup-double (league plus a domestic cup)
- no-trophy (the season winner won no trophy but still outscored the rival)

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "<prefix>-<3-digit number>", "situation": "<one of the situations>", "text": "<the line>"}. Lines are 8 to 28 words, spoken-commentary style (they are read aloud), all different from each other (vary openings, rhythm and imagery). At least a third must be genuinely funny: playful banter, football clichés turned on their head, cheeky mock-drama. Never mean. Use id prefix "c2".
```

## C3: Commentator lines 3: comeback, lead-extended, level-overall, winning-streak, streak-broken

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 300 short commentary lines the game shows after a result, spread evenly across these situations:
- comeback (the overall trailer won this season and closed the gap)
- lead-extended (the overall leader won again and pulled further ahead)
- level-overall (after this season the Showdown totals are equal)
- winning-streak (same manager won 3 or more seasons in a row)
- streak-broken (a winning streak just ended)

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "<prefix>-<3-digit number>", "situation": "<one of the situations>", "text": "<the line>"}. Lines are 8 to 28 words, spoken-commentary style (they are read aloud), all different from each other (vary openings, rhythm and imagery). At least a third must be genuinely funny: playful banter, football clichés turned on their head, cheeky mock-drama. Never mean. Use id prefix "c3".
```

## C4: Commentator lines 4: opening-season, halfway, final-season-decider, showdown-won, showdown-drawn

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 300 short commentary lines the game shows after a result, spread evenly across these situations:
- opening-season (season 1 result)
- halfway (middle season of a 5 or 10 season Showdown)
- final-season-decider (the last season, Showdown still open)
- showdown-won (the whole Showdown is over and {winner} won it)
- showdown-drawn (the whole Showdown ended level: a draw)

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "<prefix>-<3-digit number>", "situation": "<one of the situations>", "text": "<the line>"}. Lines are 8 to 28 words, spoken-commentary style (they are read aloud), all different from each other (vary openings, rhythm and imagery). At least a third must be genuinely funny: playful banter, football clichés turned on their head, cheeky mock-drama. Never mean. Use id prefix "c4".
```

## C5: Commentator lines 5: golden-showdown, one-season-sprint, dominant-run, rivalry-history, season-preview

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 300 short commentary lines the game shows after a result, spread evenly across these situations:
- golden-showdown (10-season Golden Showdown moments: start, milestones, finish)
- one-season-sprint (a 1-season Showdown result)
- dominant-run (one manager has won every season so far)
- rivalry-history (references the long rivalry between the two managers across many Showdowns)
- season-preview (shown before a season starts: anticipation, no result yet)

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "<prefix>-<3-digit number>", "situation": "<one of the situations>", "text": "<the line>"}. Lines are 8 to 28 words, spoken-commentary style (they are read aloud), all different from each other (vary openings, rhythm and imagery). At least a third must be genuinely funny: playful banter, football clichés turned on their head, cheeky mock-drama. Never mean. Use id prefix "c5".
```

## C6: Club history commentator lines, part 1 of 2

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: for EACH club below, write 5 commentary lines that the game speaks when a manager of that club wins, draws or lifts a trophy. Each line must bring in something real and well known from the club's history or identity before 2017: famous trophies and eras, legendary managers, iconic nights, nicknames, stadium atmosphere, local rivalries, underdog stories. Make them fun, proud or cheeky, broadcast style, read aloud.

Premier League: Arsenal, Bournemouth, Burnley, Chelsea, Crystal Palace, Everton, Hull City, Leicester City, Liverpool, Manchester City, Manchester United, Middlesbrough, Southampton, Stoke City, Sunderland, Swansea City, Tottenham Hotspur, Watford, West Bromwich Albion, West Ham United
LaLiga: Alavés, Athletic Club, Atlético Madrid, Barcelona, Celta Vigo, Deportivo La Coruña, Eibar, Espanyol, Granada, Las Palmas, Leganés, Málaga, Osasuna, Real Betis, Real Madrid, Real Sociedad, Sevilla, Sporting Gijón, Valencia, Villarreal

FACTS: only use history you are confident is true and widely known (no exact dates or numbers unless you are certain). Never invent a fact; if a club has little famous history, lean on its nickname, city and identity instead. No living player's private life. Do not mention events after June 2017.

PLACEHOLDERS allowed: {manager} (that club's manager), {rival} (the other manager), {rivalClub}, {season}. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"club": "<exactly as written above>", "mood": "<win | draw | trophy | any>", "text": "<8 to 28 words>"}. 5 per club, at least one funny.
```

## C7: Club history commentator lines, part 2 of 2

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: for EACH club below, write 5 commentary lines that the game speaks when a manager of that club wins, draws or lifts a trophy. Each line must bring in something real and well known from the club's history or identity before 2017: famous trophies and eras, legendary managers, iconic nights, nicknames, stadium atmosphere, local rivalries, underdog stories. Make them fun, proud or cheeky, broadcast style, read aloud.

Bundesliga: Bayern Munich, Borussia Dortmund, Bayer Leverkusen, Borussia Mönchengladbach, Schalke 04, Mainz 05, Hertha BSC, Wolfsburg, Hoffenheim, Eintracht Frankfurt, Werder Bremen, Hamburg, FC Augsburg, SC Freiburg, RB Leipzig, FC Ingolstadt, Darmstadt 98, 1. FC Köln
Serie A: Atalanta, Bologna, Cagliari, Chievo, Crotone, Empoli, Fiorentina, Genoa, Inter Milan, Juventus, Lazio, Milan, Napoli, Palermo, Pescara, Roma, Sampdoria, Sassuolo, Torino, Udinese
Ligue 1: Angers, Bastia, Bordeaux, Caen, Dijon, Guingamp, Lille, Lorient, Lyon, Marseille, Metz, Monaco, Montpellier, Nancy, Nantes, Nice, Paris Saint-Germain, Rennes, Saint-Étienne, Toulouse

FACTS: only use history you are confident is true and widely known (no exact dates or numbers unless you are certain). Never invent a fact; if a club has little famous history, lean on its nickname, city and identity instead. No living player's private life. Do not mention events after June 2017.

PLACEHOLDERS allowed: {manager} (that club's manager), {rival} (the other manager), {rivalClub}, {season}. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"club": "<exactly as written above>", "mood": "<win | draw | trophy | any>", "text": "<8 to 28 words>"}. 5 per club, at least one funny.
```

## S1-S4: Marquee Player scouting cards (4 runs: ranks 1-50, 51-100, 101-150, 151-200)

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

ATTACHED: fifa17-top200.txt, the top 200 FIFA 17 high-potential players with rank, club, position, overall and potential.

TASK: write a scouting card for players ranked [RANKS] in the attached list (change [RANKS] to 1-50, then 51-100, 101-150, 151-200 on each run). Use the list's data exactly (name, club, position, ratings). Describe each player as he was in 2016-17. Keep it to playing style and on-pitch qualities that are widely known; if you are unsure about a detail, stay general rather than invent facts, transfers, stats or quotes.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item:
{"rank": <number>, "name": "<as in list>", "club": "<as in list>", "position": "<as in list>", "style": "<2 to 4 word playing-style tag, e.g. Press-resistant playmaker>", "report": "<scouting report, 25 to 40 words>", "special": "<why he is special, 8 to 14 words>"}
```

## H1: Season front pages

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 200 newspaper front pages shown at the end of a season, spread across these situations: big-win, narrow-win, comfortable-win, draw, champions-league, europa-league, league-title, comeback, lead-extended, level-overall, winning-streak, final-season-decider.

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "h1-<3-digit number>", "situation": "<situation>", "headline": "<tabloid-style headline, 3 to 8 words, may use placeholders>", "subhead": "<one sentence, 12 to 24 words>"}. All headlines different; use football puns sparingly and well.
```

## H2: Final Winner front pages

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: write 80 front pages for the moment a whole Showdown ends, spread across: showdown-won-1-season, showdown-won-3-seasons, showdown-won-5-seasons, golden-showdown-won (10 seasons), showdown-drawn (equal totals: a draw, no winner), won-on-the-final-day, dominant-win.

PLACEHOLDERS you may use (exactly as written, curly braces included): {winner} {loser} (manager names), {winnerClub} {loserClub}, {winnerPoints} {loserPoints}, {margin} (point gap), {season} (season number), {seasons} (Showdown length), {leader} {trailer} (overall Showdown leader/trailer), {totalLeader} {totalTrailer} (overall points). For draws use {managerA} {managerB} {clubA} {clubB} {points}. Use only placeholders that make sense for the situation. Never hard-code Daniel or Nik.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"id": "h2-<3-digit number>", "situation": "<situation>", "headline": "<3 to 8 words>", "subhead": "<one sentence, 12 to 24 words>", "kicker": "<tiny label above the headline, 1 to 3 words, e.g. GOLDEN SHOWDOWN>"}
```

## H3: Club story blurbs, part 1 of 2

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: for each club below (as in FIFA 17, season 2016-17), write a short club card a manager sees when the club is assigned to them.

Premier League: Arsenal, Bournemouth, Burnley, Chelsea, Crystal Palace, Everton, Hull City, Leicester City, Liverpool, Manchester City, Manchester United, Middlesbrough, Southampton, Stoke City, Sunderland, Swansea City, Tottenham Hotspur, Watford, West Bromwich Albion, West Ham United
LaLiga: Alavés, Athletic Club, Atlético Madrid, Barcelona, Celta Vigo, Deportivo La Coruña, Eibar, Espanyol, Granada, Las Palmas, Leganés, Málaga, Osasuna, Real Betis, Real Madrid, Real Sociedad, Sevilla, Sporting Gijón, Valencia, Villarreal

Stay with well-known, stable facts (city, nickname, stadium name in 2016-17, club identity). If unsure of a fact, leave that field as an empty string rather than guess. No player names.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"club": "<exactly as written above>", "league": "<league as above>", "city": "<city>", "nickname": "<common nickname or empty>", "stadium": "<stadium in 2016-17 or empty>", "story": "<20 to 35 words: what managing this club feels like, its expectations and identity>", "challenge": "<one line, 8 to 16 words: the realistic target for a career-mode manager here>"}
```

## H4: Club story blurbs, part 2 of 2

```text
GAME CONTEXT: "Career Mode Showdown" is a private game for two friends, Daniel and Nik, who each play a FIFA 17 career (2016-17 season) and compare results season by season. A Showdown lasts 1, 3, 5 or 10 seasons (10 seasons = a "Golden Showdown"). Each season a manager scores points from league finish and trophies; Champions League adds +5, Europa League +3 (never both). Equal totals are a DRAW: there is NO tiebreak, ever, so never write that anyone "edged it on goal difference" or similar. Tone: premium football broadcast, warm, witty, never insulting, no swearing, nothing about real players' private lives.

TASK: for each club below (as in FIFA 17, season 2016-17), write a short club card a manager sees when the club is assigned to them.

Bundesliga: Bayern Munich, Borussia Dortmund, Bayer Leverkusen, Borussia Mönchengladbach, Schalke 04, Mainz 05, Hertha BSC, Wolfsburg, Hoffenheim, Eintracht Frankfurt, Werder Bremen, Hamburg, FC Augsburg, SC Freiburg, RB Leipzig, FC Ingolstadt, Darmstadt 98, 1. FC Köln
Serie A: Atalanta, Bologna, Cagliari, Chievo, Crotone, Empoli, Fiorentina, Genoa, Inter Milan, Juventus, Lazio, Milan, Napoli, Palermo, Pescara, Roma, Sampdoria, Sassuolo, Torino, Udinese
Ligue 1: Angers, Bastia, Bordeaux, Caen, Dijon, Guingamp, Lille, Lorient, Lyon, Marseille, Metz, Monaco, Montpellier, Nancy, Nantes, Nice, Paris Saint-Germain, Rennes, Saint-Étienne, Toulouse

Stay with well-known, stable facts (city, nickname, stadium name in 2016-17, club identity). If unsure of a fact, leave that field as an empty string rather than guess. No player names.

OUTPUT: only a JSON array, nothing before or after it, no markdown fences. Each item: {"club": "<exactly as written above>", "league": "<league as above>", "city": "<city>", "nickname": "<common nickname or empty>", "stadium": "<stadium in 2016-17 or empty>", "story": "<20 to 35 words: what managing this club feels like, its expectations and identity>", "challenge": "<one line, 8 to 16 words: the realistic target for a career-mode manager here>"}
```
