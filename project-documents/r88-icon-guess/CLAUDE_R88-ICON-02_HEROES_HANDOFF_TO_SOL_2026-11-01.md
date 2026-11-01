# R88-ICON-02: Add FUT Heroes and Hall of FUT players to the Prime Pack list

Date: 1 November 2026
From: Claude (Prime Pack build, Career Mode Showdown)
To: GPT
Repository operations: NONE. Produce local files only and send them back to Nik.

## 1. What this is

Prime Pack (working name was Icon Unmasked) is a new once-per-season screen in Career Mode Showdown. A white-and-gold card hides a legendary player. It reveals the position, then the six face stats one by one, then the nation flag. Nik and Daniel type guesses. The name is never shown.

Your last job (R88-ICON-01) delivered 145 male outfield Legends and Icons. Nik has now decided the pool also includes:

1. FUT Heroes
2. Hall of FUT players

This job adds those players. Keep the 145 existing rows exactly as they are.

## 2. Deliverables

Send back three files:

- `heroes_icons.csv` (File A delta): one row per NEW player only, in the exact same 19 columns as File A from ICON-01:
  `id,card_name,full_name,accepted_names,nation,nation_code,position,game,card_version,overall,PAC,SHO,PAS,DRI,DEF,PHY,source_url,source_name,notes`
- `heroes_cards_considered.csv` (File B delta): every allowed card you compared for the new players, plus the Hero cards of existing players (see rule 4). Same five columns as before:
  `id,game,card_version,overall,source_url`
- `R88_ICON_02_report.md`: counts, the rules you applied, what you could not verify, and the existing players who also had a Hero card (their ICON-01 pick stays).

## 3. Who counts

- Male outfield players only. No goalkeepers (their face stats are different), no women.
- FUT Heroes: players released as FUT Heroes in FIFA 21 through FC 27.
- Hall of FUT: first, find out from sources exactly which players and cards EA or the community call "Hall of FUT" (or the closest named programme), and say in the report what you found and which source defines it. If you cannot find a clear definition, do not guess: list what you found and stop that part, so Nik can decide.
- Exclude anyone already in the 145 unless rule 4 applies.

## 4. Which card to use for each player

1. Allowed for Heroes: the standard Hero card of each edition (FIFA 21 to FC 27). Exclude special Hero versions such as World Cup Heroes, Euro or Copa event Heroes, Hero upgrades, Trophy Titans, Moments and every other promo.
2. Allowed for Hall of FUT: the standard version of that programme's card, as defined in section 3. No upgrades or promo versions.
3. Still allowed from ICON-01: FIFA 15 to 17 Legend, FIFA 18 to 23 Prime Icon, FC 24 to 27 standard Base Icon. FIFA 14 Legends stay out (HEA instead of PHY).
4. One card per player, and the Icon card always wins (Nik's rule). If a player has any allowed Legend or Icon card, use the highest overall among those Legend and Icon cards only, even when a Hero or Hall of FUT card is higher. Use a Hero or Hall of FUT card only for players who have no allowed Legend or Icon card at all; then take the highest overall among those. Ties go to the newer game. So the existing 145 picks do not change (Yaya Touré, Lúcio, Maicon, Papin, Bierhoff and the like keep their ICON-01 card). Still list in File B the Hero cards you saw for those players, so the rule can be checked.
5. Position, nation and all six stats must come from that exact card, never mixed across versions.
6. `card_version` values: use `Hero` or `Hall of FUT` for the new types, and keep `Legend`, `Icon Prime`, `Icon Base` as before.

## 5. Names

- `accepted_names` holds every spelling a player could fairly type, separated by `|`. Card name and full name always. Matching ignores case, accents, dots and hyphens, so you don't need accent-free copies.
- No accepted name may match two players across the WHOLE list (the 145 plus your new rows) after that normalisation. If two players share a surname, drop the bare surname for both and keep full names, the way bare "Laudrup" was handled. Check the new rows against the existing 145 too, and list any name you removed from an existing row.
- Avoid generic family names as aliases (for example Santos, Silva, Ferreira, Lima, Souza) unless the player is really known by it.

## 6. Quality bar (please do these before sending)

- Every row has a `source_url` that shows that exact card's face stats.
- Second-source check: confirm the 10 highest-overall new rows and 15 random new rows against a second site (FUTWIZ, FUT.GG, FIFPlay or WeFUT). Fix any mismatch and list it in the report.
- Run the same machine checks as ICON-01: correct headers, unique ids, no GK, every stat an integer 1 to 99, one pick per player, every pick is the highest overall (newer game on ties) among its File B rows, no accepted-name collisions across the full list.
- Ids: lowercase ascii with hyphens, built from the common name (for example `ole-gunnar-solskjaer`, not `ole-gunnar-solskj-r`).
- Say plainly in the report what is verified and what is not. Do not mark anything done that you did not check.

## 7. Hand back

Send the three files to Nik. He passes them to Claude, who runs them through the Prime Pack data checker, spot-checks them and adds them to the package for Team G.
