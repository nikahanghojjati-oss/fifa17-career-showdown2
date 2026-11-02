# R88-ICON-02: Add FUT Heroes and Hall of FUT players to the Prime Pack list

Date: 1 November 2026
From: Claude (Prime Pack build, Career Mode Showdown)
To: GPT
Repository operations: NONE. Produce local files only and send them back to Nik.

## 1. What this is

Prime Pack is a new once-per-season screen in Career Mode Showdown, shipping in release r87. A white-and-gold card hides a legendary player. It reveals the position, then the six face stats one by one, then the nation flag. Nik and Daniel type guesses. The name is never shown.

Your last job (R88-ICON-01) delivered 145 male outfield Legends and Icons. Nik has now added two more groups to the pool:

1. FUT Heroes
2. Hall of FUT players

This job adds those players. Keep the 145 existing rows exactly as they are.

## 2. Deliverables

Send back three files:

- `heroes_icons.csv` (File A delta): one row per NEW player only, in the exact same 19 columns as File A from ICON-01:
  `id,card_name,full_name,accepted_names,nation,nation_code,position,game,card_version,overall,PAC,SHO,PAS,DRI,DEF,PHY,source_url,source_name,notes`
- `heroes_cards_considered.csv` (File B delta): every allowed card you compared for the new players, plus the base Hero cards you found for players already in the 145. Same five columns as before:
  `id,game,card_version,overall,source_url`
- `R88_ICON_02_report.md`: counts, the rules you applied, which source lists the Hall of FUT players, what you could not verify, and the players already in the 145 who also had a Hero card (their ICON-01 pick stays).

## 3. Who counts

- Male outfield players only. No goalkeepers (their face stats are different), no women.
- FUT Heroes: every player released with a base Hero card, FIFA 21 through FC 27.
- Hall of FUT: every player with a Hall of FUT card. Find a source that lists them and name it in the report. If you cannot find a clear list, do not guess: report what you found and stop that part, so Nik can decide.

## 4. Which card to use (Nik's rules)

1. Heroes: only the base Hero card of each edition counts. Exclude every other Hero version: World Cup Heroes, Euro or Copa event Heroes, Hero upgrades, Trophy Titans, Moments and every other promo.
2. Hall of FUT: there is only one version per player. Use that card.
3. Legends and Icons, as in ICON-01: FIFA 15 to 17 Legend, FIFA 18 to 23 Prime Icon, FC 24 to 27 standard Base Icon. FIFA 14 Legends stay out (HEA instead of PHY).
4. The Icon card always wins. If a player has any allowed Legend or Icon card, use the highest overall among those only, even when a Hero or Hall of FUT card is higher. So the 145 picks never change.
5. A player with no Legend or Icon card: use the highest overall among their base Hero and Hall of FUT cards.
6. Ties go to the newer game.
7. Position, nation and all six stats must come from that one exact card, never mixed across versions.
8. `card_version` values: `Hero` and `Hall of FUT` for the new types; keep `Legend`, `Icon Prime` and `Icon Base` as before.

## 5. Names

- `accepted_names` holds every spelling a player could fairly type, separated by `|`. Always include the card name and the full name. Matching ignores case, accents, dots and hyphens, so you don't need accent-free copies.
- No accepted name may match two players across the whole list (the 145 plus your new rows) after that normalisation. If two players share a surname, drop the bare surname for both and keep full names, the way bare "Laudrup" was handled. List any name you would remove from an existing row in the report; don't edit the 145 yourself.
- Avoid generic family names as aliases (Santos, Silva, Ferreira, Lima, Souza and similar) unless the player is really known by that name.

## 6. Quality bar (do these before sending)

- Every row has a `source_url` that shows that exact card's face stats.
- Second-source check: confirm the 10 highest-overall new rows and 15 random new rows against a second site (FUTWIZ, FUT.GG, FIFPlay or WeFUT). Fix any mismatch and list it in the report.
- Machine checks, as in ICON-01: correct headers, unique ids, no GK, every stat a whole number from 1 to 99, one pick per player, every pick follows the rules in section 4 against its File B rows, and no accepted-name collisions across the full list.
- Ids: lowercase plain letters with hyphens, built from the common name (for example `ole-gunnar-solskjaer`, not `ole-gunnar-solskj-r`).
- Say plainly in the report what is verified and what is not. Do not mark anything done that you did not check.

## 7. Hand back

Send the three files to Nik. He passes them to Claude, who runs them through the Prime Pack data checker, spot-checks them and adds them to the package for Team G.
