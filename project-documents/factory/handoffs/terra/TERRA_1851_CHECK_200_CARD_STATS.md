# Job 1851 · GPT-5.6 Terra: check the six card stats of all 200 Special Players against real FIFA 17

Wed 28 Oct 2026, Team V lead. For Nik.

**Why:** the six card stats (PAC SHO PAS DRI DEF PHY, or DIV HAN KIC REF SPD POS for keepers) in Team G's list were **calculated** from a FIFA 17 dataset's sub-attributes with FIFA's weights. Team G says they match the real cards "within 1", but they were not copied from the real FIFA 17 cards. This job checks every one against the real FIFA 17 Ultimate Team base cards.

**Steps for Nik:**
1. Open a **normal new ChatGPT chat** with **GPT-5.6 Terra** (web search on).
2. Paste the prompt below exactly.
3. When it finishes, download the CSV and drop it into the Team V lead thread tagged `1851 STATS`. Claude checks it and sends the fixes to Team G (Team G owns the data file).

**Prompt (paste everything in the box):**

```
You are checking football card data. Be exact and never guess.

Open this file (raw text): https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/claude-gameplay/r86-mp-numbers/data/marqueePlayers.js
It lists 200 players (rank, name, club, overall, potential, number, nation, position, stats). The "stats" are the six card-face stats: PAC SHO PAS DRI DEF PHY for outfield players, DIV HAN KIC REF SPD POS for goalkeepers.

For EVERY one of the 200 players, find the real FIFA 17 Ultimate Team BASE card (the original September 2016 release gold/silver/bronze card, NOT an in-form, TOTW, TOTS, TOTY, Ones to Watch or any special card) and compare all six face stats, plus overall and position.

Use web search. Best sources, in order: FUTBIN FIFA 17 player pages (futbin.com/17/player/...), then FUTWIZ FIFA 17, then FIFA Index FIFA 17 (fifaindex.com, "FIFA 17" version). Use the first source that has the base card.

Rules:
- Never invent a number. If you cannot find the base card, write NOT FOUND for that player and move on.
- Check all 200. Do not stop early, do not summarise, do not sample. If you run out of room, say exactly which rank you stopped at so I can ask you to continue.
- Same name, club and FIFA 17 for each match. Watch players with the same name.

Output: one CSV file to download, named stats_check_1851.csv, one row per player (200 rows), with these columns:
rank,name,club,field,file_value,real_value,status,source_url
- One row per player when everything matches: field = ALL, status = OK.
- One row per wrong field when something differs (field = PAC, SHO, ..., OVERALL or POSITION; status = WRONG).
- status = NOT FOUND when you could not find the base card.

At the end of the chat, write three lines: how many players are fully OK, how many have at least one WRONG field, how many are NOT FOUND.
```

**If it stops early,** reply in the same chat: `Continue from the next rank exactly where you stopped, same CSV columns, then give me the full combined CSV.`
