# Prime Pack: base Hero census and Icon check

Date: 2026-11-01. Sources were read with a web fetch tool. Direct downloads from FUT.GG, FUTWIZ, FUTBIN, FIFPlay and OvrUp were blocked by this environment's proxy. Through the fetch tool, FUTWIZ refused (robots.txt) and FUTBIN returned an error, so **FUT.GG was the only card database read**. List articles were used only to find which players to look up.

## Results

- **Icon conflicts (task A):** none. None of the 81 players has a FIFA 15–17 Legend card or a FIFA 18–FC 27 Icon card.
- **Replacements (task C ii):** none. For all 64 Hero players in the 81, no older base Hero card is strictly higher than the pick. The two picks that already use FC 26 (Morientes 89 and Gomez 88) are correct, because their FC 27 base Heroes are 87.
- **New Hero players (task C i):** 5 rows in `census_picks.csv`:
  - Aleksandr Mostovoi, 86, FC 25
  - Lars Ricken, 85, FC 25
  - Daniele De Rossi, 87, FC 27
  - Gilberto Silva, 87, FC 27
  - Uli Hoeneß, 86, FC 27

  None of the five is in the 81 or the 145, and none has a Legend or Icon card.
- **Stat mismatches (task D):** none in the 15 OvrUp-only rows checked.
- `census_cards.csv` holds 332 base Hero cards across 89 players:

| Game | Male outfield base Heroes |
|---|---|
| FIFA 22 | 17 |
| FIFA 23 | 38 |
| FC 24 | 56 |
| FC 25 | 65 |
| FC 26 | 81 |
| FC 27 | 75 |

Of the 89 players, 64 are in the 81, 20 are in the protected 145 and 5 are new.

## What was checked and where

The rule for every game: male outfield players only, and only the base card. On FUT.GG the base card is labelled "FUT Heroes" (FIFA 22/23), "UT Heroes" (FC 24/25), "Heroes" (FC 26) or "Base Hero" (FC 27), and its card id equals the player's base id. Every promo version was ignored, including World Cup Hero, Trophy Titans, FUTTIES, UEFA Heroes, Prime Hero, Fantasy, Winter Wildcards and upgrades.

| Game | Roster source (listing URL) | Total listed | Male outfield | How each card was read |
|---|---|---|---|---|
| FIFA 22 | https://cms.ggrecon.com/guides/fifa-22-fut-heroes-list/ (19). Cross-checked with https://fifauteam.com/?p=111251 (19) and https://www.fifplay.com/fifa-22-fut-heroes/ (18; it leaves out Di Natale). | 19 | 17 (without the goalkeepers Dudek and Campos) | All 17 FUT.GG card pages opened (`/22-<id>/`), with overall, position, nation and six stats. |
| FIFA 23 | https://www.thegamer.com/fifa-23-all-base-fut-heroes/ (40). Cross-checked with https://www.fut.gg/news/new-fifa23-fut-heroes-yaya-toure-marchisio-crouch-more/ (21 new + 18 returning; its overalls are reveal predictions, so they were not used). | 40 | 38 (without Dudek and Campos) | All 38 FUT.GG card pages opened (`/23-<id>/`). |
| FC 24 | https://fifauteam.com/fc-24-heroes-list/ (61). FUT.GG has no readable FC 24 listing because its listing pages load by script. | 61 | 56 (without 3 women and Dudek, Campos) | FUT.GG player history page for each player (`/players/<id>-<slug>/`), which lists every FC 24–27 card with its label and overall. |
| FC 25 | https://fifauteam.com/fc-25-heroes-tracker/ (77) | 77 | 65 confirmed (the tracker implies 68) | FUT.GG player history page for each player. |
| FC 26 | https://www.fut.gg/rarities/heroes/ (4 pages) | 93 (matches https://fifauteam.com/fc-26-heroes-tracker) | 81 (without 9 women and Howard, Dudek, Campos) | FUT.GG rarity listing plus each player's history page. |
| FC 27 | https://www.fut.gg/rarities/base-hero/ (3 pages) | 88 (Necib appears twice) | 75 (without 10 women entries and Howard, Dudek, Campos) | FUT.GG rarity listing plus each player's history page. |

The FC 25 tracker lists Doumbia, Gervinho and Ibarbo as FC 25 base Heroes. FUT.GG shows only promo cards for them in FC 25 (FUTTIES, FUT Birthday, Streets Won't Forget), so they are not counted for FC 25. Their first base Hero is FC 26, which matches the 81.

FUT.GG player history pages do not list FIFA 22/23 Hero cards, so those card pages were opened one by one.

Ratings almost never change between games: each player's base Hero overall is the same in every year he appears, with three exceptions. Hazard went from 88 in FC 25/26 to 89 in FC 27, and Morientes and Gomez dropped by 2 and 1 in FC 27. That is why there are no replacements.

## Task A: Icon check

**Result: no Icon conflicts among the 81.**

- **FC 24–FC 27:** the FUT.GG history page was read for all 81 players, both the 64 Heroes and the 17 Hall of FUT players. No page shows a card labelled Icon or Legend.
  - These pages do show old Legend cards as "Icon" for players who had them. For example, Ljungberg and Solskjær show FIFA 15–17 Icon cards, and Bierhoff, Litmanen, Okocha and Rui Costa show older Icon cards. That suggests the history pages do record old Legend cards, so the FUT.GG check probably also covers earlier years for the 81, although this was not tested on any player from the 81.
- **FIFA 15–17 Legends and FIFA 18–23 Icons:** full or partial lists were compared by name. None of the 81 or the 5 new players appears in any of them.
  - https://games.softpedia.com/blog/FIFA-15-Ultimate-Team-Legends-on-Xbox-One-Will-Include-Beckenbauer-Keane-Carlos-More-454710.shtml (FIFA 15)
  - https://www.fifplay.com/fut-16-legends/ (FIFA 16)
  - https://www.fifplay.com/fifa-17-legends/ (FIFA 17; 74 of the stated 76 names)
  - https://mein-mmo.de/en/fifa-18-icons-all-icons-with-values-in-the-list,178202 (FIFA 18)
  - https://mein-mmo.de/en/fifa-19-icons-all-icons-with-ratings-in-the-list,266687 (FIFA 19)
  - https://mein-mmo.de/en/fifa-20-all-new-icons-with-pep-guardiola-overview,376065 (FIFA 20, new Icons only)
  - https://www.fifplay.com/fifa-21-icons/ (FIFA 21, 99 Icons)
  - https://www.pcgamer.com/all-fifa-22-icons-new/ (FIFA 22, new Icons only)
  - https://fifauteam.com/?p=200339 (FIFA 23, full list)
- **For information, about the 145:** the 20 Hero-card players who are in the 145 all have Legend or Icon history. Papin, Lúcio, Yaya Touré and Maicon have an FC 27 "Base Icon". So the 145 correctly takes them out of the Hero list.

## Task C ii: replacements

**Result: none.** Every Hero pick in the 81 equals the computed pick: the highest-overall base Hero card from FIFA 22 to FC 27, with the newer game winning a tie.

## Notes on the 81 (no change made)

- **Micah Richards:** the pick is Hall of FUT FC 27 at 85. He also has an FC 26 base Hero at 85. Under rule 3 this was left as it is, but he is a player with both card types.
- **Accepted names:** some rows in the 81 break the naming rule. Each may need a decision from the person who owns that list:
  - generic or odd short names: "Sung" (Park Ji-sung), "Natale" (Di Natale), "Jaber", "Owairan", "Luiz" (David Luiz), "dos Santos"
  - repeated entries: for example "David Ginola|David Ginola" and "Hulk|...|Hulk"

## Gaps and limits

- **Second database:** no game was checked against a second full card database, because FUTWIZ, FUTBIN and OvrUp could not be reached. FUT.GG is the only card source.
- **FC 24 and FC 25 rosters:** these come from the fifauteam trackers, checked player by player on FUT.GG. A base Hero missing from both the tracker and every other list read would be missed. Both FC 24 and FC 25 are therefore **not independently complete**.
- **Where the overalls in census_cards.csv come from:**
  - FIFA 22/23 cards and the 5 new picks: read on each card page.
  - FC 24–26 cards (and FC 27 cards apart from the picks and the 15 spot-checked pages): read from the FUT.GG player history page or the FUT.GG rarity listing, which link to the card URL given. Those card pages were not each opened.
  - For Tévez, McManaman, Gervinho, Giuly, Aimar, Park, Milito, Beasley, Dempsey, Al Jaber, Marchisio, Lizarazu, Gomez and others, the fetch tool did not show the card link but did show the label and overall. The URL given follows FUT.GG's base-card pattern (`/<yy>-<baseid>/`), which held for every card that was opened.
  - For Ramires, Fàbregas, Kohler and Bierhoff the history-page read missed the FC 27 card, but the FUT.GG FC 27 Base Hero listing shows it.
- **FIFA 23 position and nation:** the Forlán and Donovan FIFA 23 pages did not show position or nation. Only the overall is used from them.
- **Icon lists:** the full FIFA 20 and FIFA 22 Icon lists were not read (only the new additions), and the FIFA 17 Legend list has 74 of the stated 76 names. Per-player FUT.GG histories cover the rest.
- **OvrUp:** the OvrUp pages themselves could not be opened, so task D compares the values in the 81 file with FUT.GG.

## Task D: stat spot-check (15 OvrUp-only rows)

The checked rows are the 6 OvrUp rows at 89 (a six-way tie for the top overall) plus 9 more across positions. Each was compared with the same FC 27 Base Hero card on FUT.GG: overall, position and the six face stats. File values are shown first, FUT.GG values second.

| id | position | OVR | PAC/SHO/PAS/DRI/DEF/PHY (file = FUT.GG) | FUT.GG card page | result |
|---|---|---|---|---|---|
| abedi-pele | CAM / CAM | 89 / 89 | 91/83/87/91/48/66 / 91/83/87/91/48/66 | https://www.fut.gg/players/167425-abedi-pele/27-167425/ | match |
| david-ginola | LM / LM | 89 / 89 | 90/88/87/91/55/84 / 90/88/87/91/55/84 | https://www.fut.gg/players/191972-david-ginola/27-191972/ | match |
| eden-hazard | LM / LM | 89 / 89 | 91/84/85/93/37/69 / 91/84/85/93/37/69 | https://www.fut.gg/players/183277-eden-hazard/27-183277/ | match |
| gianluca-vialli | ST / ST | 89 / 89 | 86/89/72/83/42/79 / 86/89/72/83/42/79 | https://www.fut.gg/players/233700-gianluca-vialli/27-233700/ | match |
| jurgen-kohler | CB / CB | 89 / 89 | 74/51/63/62/91/90 / 74/51/63/62/91/90 | https://www.fut.gg/players/261593-jurgen-kohler/27-261593/ | match |
| rudi-voller | ST / ST | 89 / 89 | 89/90/76/86/47/85 / 89/90/76/86/47/85 | https://www.fut.gg/players/166676-rudi-voller/27-166676/ | match |
| antonio-di-natale | ST / ST | 88 / 88 | 90/91/85/90/46/70 / 90/91/85/90/46/70 | https://www.fut.gg/players/120274-antonio-di-natale/27-120274/ | match |
| bixente-lizarazu | LB / LB | 88 / 88 | 87/59/80/82/83/82 / 87/59/80/82/83/82 | https://www.fut.gg/players/5454-bixente-lizarazu/27-5454/ | match |
| javier-mascherano | CB / CB | 88 / 88 | 77/55/76/75/89/86 / 77/55/76/75/89/86 | https://www.fut.gg/players/142754-javier-mascherano/27-142754/ | match |
| cesc-fabregas | CM / CM | 88 / 88 | 77/78/92/85/68/72 / 77/78/92/85/68/72 | https://www.fut.gg/players/162895-cesc-fabregas/27-162895/ | match |
| claudio-marchisio | CM / CM | 87 / 87 | 82/81/85/86/80/82 / 82/81/85/86/80/82 | https://www.fut.gg/players/173210-claudio-marchisio/27-173210/ | match |
| jaap-stam | CB / CB | 87 / 87 | 83/52/62/68/89/88 / 83/52/62/68/89/88 | https://www.fut.gg/players/5740-jaap-stam/27-5740/ | match |
| michel-salgado | RB / RB | 87 / 87 | 82/60/80/80/85/87 / 82/60/80/80/85/87 | https://www.fut.gg/players/8348-miguel-angel-salgado-fernandez/27-8348/ | match |
| ze-roberto | LM / LM | 87 / 87 | 87/79/86/89/78/80 / 87/79/86/89/78/80 | https://www.fut.gg/players/28765-jose-roberto-da-silva-junior/27-28765/ | match |
| peter-crouch | ST / ST | 85 / 85 | 74/87/75/78/52/80 / 74/87/75/78/52/80 | https://www.fut.gg/players/51257-peter-crouch/27-51257/ | match |

Mismatches: 0

