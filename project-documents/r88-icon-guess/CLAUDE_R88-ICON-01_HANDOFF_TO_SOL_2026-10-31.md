# CLAUDE -> SOL HANDOFF - R88-ICON-01

Data job: build the Icon database for the R88 icon guessing game (provisional, written for GPT to execute)

## Header

| | |
|---|---|
| Task ID | R88-ICON-01 |
| Role | Claude (Team G thread) wrote this job; GPT-5.6 Sol (or another GPT with web browsing) executes it; Claude spot-checks the result |
| Date | 2026-10-31 |
| Source anchor | main `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e`, SOURCE_DRIFT no |
| Write operations | none in the repo; you return a data file |
| Verdict status | job ticket, waiting for execution |

**Context.** Career Mode Showdown is a companion web app that Nik and Daniel use with FIFA 17 Career Mode. In R88, each season they race to name a legendary player from a card that reveals itself bit by bit: first the position, then the six face stats one at a time, then the nation flag. Whoever names him first wins one Showdown point. The game needs a database of past Legend and Icon cards with **exact** card values, because the guesses depend on them. Accuracy matters more than speed.

## 1. Verdict

NONE. This is a job ticket, not a review.

## 2. What to build

One row per player, for every player who meets **all** of these:

1. **Male.** No women. FC 24 onward has women Icons; leave them all out.
2. **Has an allowed card**, which is one of:
   - **(a) a Legend card.** Legends were FIFA Ultimate Team cards on Xbox only, in the years before FIFA 18. Find out which games had them, starting in FIFA 13 or 14 as far as we know, and write the years down.
   - **(b) an Icon card** from FIFA 18 to the latest game released on the day you do this job. Write that cutoff game down too.
3. **Outfield player.** Drop anyone whose chosen card says GK.
4. **The chosen card shows the six outfield face stats:** PAC SHO PAS DRI DEF PHY. If you find a card in the pool that shows HEA (heading) instead of PHY, leave it out and list it in the report.

### Which card counts (the version rule)

For each player, list every **allowed** card across all games:

- **Legend years:** the one Legend card.
- **Icon years with three versions** (Base, Mid and Prime, from FIFA 18 until EA stopped making Mid and Prime): the **Prime** card only. Base and Mid don't count.
- **Icon years after that** (one Base card plus special versions): the **Base** card only.
- **Never allowed:** Icon Moments, Prime Icon Moments, Baby or Future Icons, or any promo, event, objective, SBC, World Cup, Euro, Copa, TOTY, TOTS, Birthday, Shapeshifter, Hero or other special version. FUT Heroes are not Icons, so they're out too.
- **A year you can't fit to a rule:** write down what that year had, and ask in the report.

Then **keep the allowed card with the highest overall** for the player. If two allowed cards tie on overall, keep the one from the **newer** game. Every value in the row (overall, position, the six stats, nation) comes from that **one** card. Never mix cards.

## 3. Output format (strict)

Return two CSV files, UTF-8 with a header row and comma separators. Quote any field that contains a comma.

### File A: `icons.csv` (one row per player)

| column | rule |
|---|---|
| `id` | lower-case ASCII slug of the card name, unique (`zinedine-zidane`) |
| `card_name` | the name exactly as printed on the chosen card, with accents (`Zidane`, `Ronaldo`, `Čech` style) |
| `full_name` | the player's full common name with accents |
| `accepted_names` | names a person might type, separated by `\|`: the card name, the full name, the surname, the same names in plain A-Z letters, and at most 2 widely used nicknames. No nickname shared by another player in the list. |
| `nation` | the nation as shown on the card (English name) |
| `nation_code` | ISO 3166-1 alpha-2 (`FR`, `BR`, `NL`); use `GB-ENG`, `GB-SCT`, `GB-WLS`, `GB-NIR` for the UK home nations; for nations that no longer exist (Soviet Union, Yugoslavia, Czechoslovakia, West Germany), use the code of the nation **the card shows** and explain in `notes` |
| `position` | position printed on the chosen card (`ST`, `CF`, `CAM`, `CM`, `CDM`, `LM`, `RM`, `LW`, `RW`, `LB`, `RB`, `LWB`, `RWB`, `CB`, `LF`, `RF`) |
| `game` | the game of the chosen card (`FIFA 19`, `FC 25`) |
| `card_version` | `Legend`, `Icon Prime` or `Icon Base` |
| `overall` | integer 1 to 99 |
| `PAC`,`SHO`,`PAS`,`DRI`,`DEF`,`PHY` | integers 1 to 99, the six numbers printed on the card face |
| `source_url` | a page that shows this exact card with these exact numbers |
| `source_name` | the site's name |
| `notes` | anything unusual, otherwise empty |

### File B: `icon_cards_considered.csv` (every allowed card you looked at)

Columns: `id`, `game`, `card_version`, `overall`, `source_url`. One row per allowed card per player. File B lets the reviewer check the "highest overall, newer on a tie" choice.

## 4. Sources and conduct

- Use pages that show the card itself: FUTBIN, FUTWIZ, FUTHEAD (older games), EA's own ratings pages, or the FIFA fandom wiki as a last resort.
- Look players up one by one. **Don't bulk-scrape or run scripts against a site that forbids it in its terms.** If a site blocks you, use another source.
- Never fill a number from memory or estimate it. If you can't find a card's numbers on a page, leave the player out of File A and list them in the report under "not found".
- If two sources disagree, use the one that shows the card image and write both in `notes`.

## 5. Report (return with the files)

1. Total players in File A, and how many come from Legend, Icon Prime and Icon Base cards.
2. The Legend years you found, and the cutoff game.
3. The years you assigned to the three-version rule and to the Base-only rule.
4. Players left out, with the reason for each (woman, goalkeeper, heading stat, not found, only special cards).
5. Anything you weren't sure about, one line each.

## 6. How Claude will check it (so you know the bar)

1. **Schema check by script:** every column present; ids unique; integers in range; `card_version` matches the game's rule; `nation_code` valid; no `GK`; no duplicate accepted name across two players.
2. **Choice check:** for every player, File A's card must be the highest-overall allowed card in File B, with the newer game winning ties.
3. **Value spot-check:** at least 20 rows, about 15% of the list, chosen at random, plus the 10 highest overalls. Each is compared against a second source.
   - Any wrong number sends that row back to you.
   - More than 2 wrong rows in the sample sends the whole file back.
4. Nik reviews the final list of names.

## 7. Conflicts found

NONE known. If what you find in the games contradicts the version rule in §2 (for example, a year that had Base, Mid and Prime plus specials), follow the rule as written and report the year.

## 8. Questions for Astra

NONE

## 9. Questions for Nik

NONE for this job. The pool rules above are Nik's own (31 Oct 2026).

## 10. Evidence appendix

- Goalkeeper cards are left out because their faces show DIV HAN KIC REF SPD POS. You can see that format in this repo's `data/marqueePlayers.js`, where every GK row has those keys.
- The six outfield keys used across the app are PAC SHO PAS DRI DEF PHY (`data/marqueePlayers.js`).
- The app's nation code convention is ISO 3166 alpha-2 with `GB-ENG` and `GB-WLS` for the home nations (`data/marqueePlayers.js`, file header).

## 11. Recommended next actions

1. Run this job and return both CSVs and the report to Nik.
2. Nik passes them to the Claude thread for the check in §6.
3. After the check passes, Team G converts them to `data/icons.js`.

## 12. What to send back to Claude

`icons.csv`, `icon_cards_considered.csv` and the report, unchanged.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION
