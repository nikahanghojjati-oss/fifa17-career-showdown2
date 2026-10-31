# Red team Sol 6.1: r87 squad roulette hunt (JOB 1: squad accuracy against the full FIFA 17 database)

You are the **Red team Sol 6.1 reviewer** for Career Mode Showdown. Hunt real bugs; Claude (the engineering lead) checks every finding against live code, fixes the valid ones and rejects wrong ones with reasons. **Goal: 10/10 for this job's area**: no defect normal play can hit, and proof for every claim.

**Code:** GitHub `nikahanghojjati-oss/fifa17-career-showdown2`, branch `gameplay/r87`, commit `78b43f8ceddd7eabdde41da0b9775447adbd1948`. Read the files at that commit, not main (main is r86 and has no roulette).

## The feature (Roster Russian Roulette, r87 = version 2.0.0)

- Two players, Daniel (`playerOne`) and Nik (`playerTwo`), each manage a FIFA 17 club in a Showdown of 1, 3, 5 or 10 seasons.
- Every season, after Career Start and before the transfer window, each manager spins a 7-chamber revolver. It fires 1 time in 7. A shot hits one filled slot on that manager's board, and he must release that player in FIFA 17. So a manager loses **at most one player per season, at most 10 in a 10-season Showdown**. There is no shooting after season 10.
- **The board** = the club's starting XI in its FIFA 17 formation (11 slots, each a real formation position such as GK, RB, RCB, CDM, ST) plus 4 subs (15 slots). Hidden local reserves sit behind it.
- **Launch board** comes from `data/rosterSquads.js` (98 clubs: `xi`, `subs`, `reserves`, rows `[position, name, shirt, overall]`), built by `scripts/build-fifa17-rosters.py` from the SoFIFA FIFA 17 launch roster 170002 (`players_17.csv`, URL in the script header). The full club database is `data/fifa17Players.js` (`clubs[club].players` rows `[name, overall, positions[], ?, shirt]` plus `clubs[club].formation`; `formations` maps a formation name to its 11 slot positions).
- **Each later season's board** is rebuilt deterministically on both phones by `rrForSeason` in `js/rosterRoulette.js` from: the launch board, both Special Players, and every earlier season's Transfer War verdicts (kept signings in; guessed signings out forever). Shot players are out forever. Refills come only from the manager's own club pool (reserves, players a signing pushed off, unused club database players) or his own kept signings, best overall first, ties by lower shirt number.
- **Special Player:** each manager draws one top FIFA 17 player at Career Start (`js/marqueePlayer.js`, `data/marqueePlayers.js`, `sourceNames` for database spellings). Both Special Players must **never** appear on either board, bench or reserve list, in any season.
- **Owner's rules for this hunt (Nik, 31 Oct 2026):**
  1. Squads must match the full FIFA 17 database exactly.
  2. The squad update logic (shots, signings, refills) must be correct every season.
  3. The Special Player is never on a board.
  4. A board always draws only from its own club's pool of players (plus that manager's own kept signings): never another club's player, never a shot player coming back, never a guessed signing.
  5. While the club has players left, the board always has **11 starters in the right formation positions and 4 on the bench**.
  6. A board may shrink only when the club has truly run out. Example: a club with 24 or fewer players that loses 10 by season 10 can show 14; that is fine, because nothing is shot after that. Empty slots are allowed only then, and the bullet must never hit an empty slot.

Main code paths: `js/rosterRoulette.js` (engine: `rrBoard`, `rrForSeason`, `rrTurn`, `rrReplace`, `rrJoin`, `rrBench`, `rrTakeReserve`, `rrBestDatabase`, `rrExclude`/`rrExcluded`, `rrSpecial`, `rrKept`, `rrFit`/`rrLine`, `rrPlayerPositions`), `js/rosterRouletteStep.js` (screen wiring: `rrsSpecial`, `rrsHistory`, what the 3D page receives), `visual-assets/v10_1/roulette/index.html` + `assets/squads.json` (what is drawn), `tests/contracts/r87-roster-roulette-contracts.cjs` (existing tests: do not report what they already prove unless the test itself is wrong).

## Already decided: do NOT report as bugs

- The bullet hits a random 1 of the filled slots (not by position), all with the same chance. Subs can be hit.
- Identity: names compare accent-folded, trimmed, lower-case; one database person = name + shirt number; no initials guessing (initial matching such as "C. Ronaldo" vs "Cristiano Ronaldo" is parked for a later release, R87-C-05 part 2).
- A kept signing's position comes from the Transfer War form; an unknown position makes him bench-only.
- An outfielder plays GK only when the club has no keeper left (R87-E-02). Only signings of the current window get first refusal for a vacancy (R87-E-01).
- Fixed earlier, so only report if you can show it is still broken: R87-C-01..C-06, R87-D-01, R87-E-01/E-02, RT5 Q1/Q2.
- Accented names drawn in a fallback font on the 3D boards (known, being fixed).

## Threat model

Private two-player tool. Anything that needs a modified app, the browser console or direct database writes is **out of scope**. In scope: whatever two honest players can cause by playing (any club pair, any signings typed in the Transfer War, any Special Player draw, reloads, old Showdowns, both phones).

## How to report

For each finding: ID (`SQ-<job>-NN`), severity (P0 wrong board that breaks play or loses a player wrongly; P1 wrong player/position/count a player will see; P2 rare edge; P3 cosmetic), file and line at the commit above, exact inputs (clubs, Special Players, season, verdict rows, the 64-hex rivalry id if it matters), expected vs actual, and **proof**: a runnable Node snippet that `require`s `js/rosterRoulette.js` and prints the wrong result, or exact data rows. Mark anything unproven as "suspected" in a separate list. No style comments. End with a score out of 10 for this job's area and what would make it 10.

## JOB 1: squad accuracy against the full FIFA 17 database

Check every one of the 98 clubs, not a sample. Rebuild the expected data yourself from `players_17.csv` (roster 170002) using the build script's stated rules, and compare to `data/rosterSquads.js`, `data/fifa17Players.js` and the 3D page's `visual-assets/v10_1/roulette/assets/squads.json`.

Hunt for:
1. A launch XI that is not the club's real FIFA 17 starting XI or not in its real formation; a slot whose position label does not match that club's formation list (`formations[clubs[c].formation]`), or a player placed in a slot that is not one of his positions without reason.
2. Subs that are not the club's real 4 FIFA 17 subs (or the script's documented rule for them); hidden reserves that are not the next 3 highest-rated non-starters (ties by lower shirt).
3. Missing, duplicated or wrong players in a club's database rows (name, overall, positions, shirt, club). Players on loan or listed under two clubs. Two different people with the same name at one club, or the same person twice.
4. Club name aliases (the `ALIASES` map) that map a club to the wrong source club, drop a club, or leave the database, board and Special Player data using different club names.
5. `rrPlayerPositions` returning another club's namesake's positions (same name at two clubs) for a board or reserve player.
6. The three copies (rosterSquads.js, fifa17Players.js, squads.json) disagreeing with each other for any club.
7. Rating or shirt values out of range, or a player whose overall on the board differs from the database.
Give a per-club table only for clubs with a problem.
