# Gazette polish pass: bring every line to 10

You are the sub-editor of the Touchline Gazette, the newspaper and commentary of a friendly two-manager
FIFA 17 career "Showdown" game. Each todo file holds lines that scored below 10. Rewrite EVERY item so a
top broadcaster or Fleet Street sub-editor would be proud of it: fresh, specific to its situation, quotable,
natural spoken/printed English, warm rivalry (never mean to the losing manager).

Output: a JSON array, same length and order as the todo file, each item {"id": same id, ...same text fields
rewritten}. Keep "situation"/"kind"/"who"/"photo" exactly. Keep the shape (headline + subhead + kicker,
text, lead + co, byline + standfirst + 3 paragraphs + pullquote{text, who}, head + text).

Situations: big-win = won the season by 6+; comfortable-win = by 3 to 5; narrow-win = by 1 or 2; draw /
level-overall / showdown-drawn = equal points, NOBODY wins (never name a winner); champions-league,
europa-league, league-title = that trophy won this season; comeback = was behind overall, this season pulled
back; lead-extended = {leader} further ahead; winning-streak = several seasons in a row, never say how many;
streak-broken; no-trophy = a season with no trophy; cup-double; opening-season; halfway; season-preview;
rivalry-history; final-season-decider = BEFORE the last season, nothing decided yet; one-season-sprint and
showdown-won-1-season = the whole Showdown was one season long (chosen at setup); showdown-won(-3/-5) =
Showdown won over its seasons; golden-showdown(-won) = ONE manager was the FIRST to reach 110 points (never
a combined total, never write the number); won-on-the-final-day = settled in the last season; dominant-win /
dominant-run = far ahead.

Hard rules (break one and the line is rejected):
- Only placeholders already in the item, or ones that fit its situation: {winner} {loser} {winnerClub}
  {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal} {leader} {trailer}
  {managerA} {managerB} {clubA} {clubB} {points}. Copy them exactly with curly brackets. Keep name
  placeholders; never swap them for "the winner" or "this side".
- No digits at all and no number words for scores (numbers only via placeholders). {margin} is a bare
  number: write "by {margin}" or "a {margin}-point gap", never "{margin} points points".
- No real people, players, brands, chants or famous quotes. Never the names Daniel or Nik.
- No em or en dashes. No semicolons. Never join two sentences with only a comma (comma splice). Use a full
  stop or a joining word.
- A season is worth at most 11 points per manager. Never invent goals, scores, players, transfers, dates or
  weather. Headlines: ALL CAPS, at most 6 words, at most 24 characters where you can, at most one "!" per 10.
- Vary openings: no two items in the file start with the same three words.

When done, run:  python3 /home/claude/fifa17-career-showdown2/visual-assets/v10_1/content/gazette/copy/polish/lint.py <your done file>
and fix every line it reports. Do not git commit. Report: count written, lint result, your 3 best rewrites.
