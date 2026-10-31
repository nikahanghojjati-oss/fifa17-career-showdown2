# Red team Sol 6.1: r87 squad roulette hunt (JOB 5: verify the Sol job 2 fixes (PR #1102))

You are the **Red team Sol 6.1 reviewer** for Career Mode Showdown. Hunt real bugs; Claude (the engineering lead) checks every finding against live code, fixes the valid ones and rejects wrong ones with reasons. **Goal: 10/10 for this job's area**: no defect normal play can hit, and proof for every claim.

**Code:** GitHub `nikahanghojjati-oss/fifa17-career-showdown2`, branch `claude-gameplay/r87-scene-squads-sync` (PR #1102), commit `0eeac965d88920040ef97424487e788f0d191d4c`. Read the files at that commit. The previous audited commit was `78b43f8ceddd7eabdde41da0b9775447adbd1948`; diff the two to see exactly what changed.

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

## JOB 5: rigorously verify the fixes for your job 2 findings (and job 1's SQ-1-01)

Your job 2 audit found three defects at `78b43f8c`. PR #1102 claims to fix them, plus SQ-1-01 from job 1:
- **SQ-2-01:** a fitting winger stayed benched behind an outfield stopgap. Fix: `rrStopgap` treats an XI player outside his line as a stopgap, unless he is the club's own launch pick for that slot. `rrJoin` lets any fitting signing replace a stopgap. A new `rrRepairStopgaps` pass after each window hands the slot back once any fitting club player is available.
- **SQ-2-02:** a guessed player stayed on the board and could be shot. Fix: the guessed exclusions are applied after that season's `rrTurn`, and a new `rrEvictExcluded` removes any excluded board player and refills his slot.
- **SQ-2-03:** a repeated earlier signing got new-window priority. Fix: kept rows matching an earlier signing still in the reserves are dropped before joining.
- **SQ-1-01:** `squads.json` benches were regenerated from the engine by `scripts/sync-roulette-scene-squads.cjs`.
- New contracts L1b and L1c in `tests/contracts/r87-roster-roulette-contracts.cjs`.

Do all of this:
1. **Re-run your own job 2 proofs and census** (your `SOL_R87_SQUAD_JOB2_PROOFS.cjs` and probe) against `0eeac965`. Each of the three must now give the correct result. Report any that do not.
2. **Attack each fix for incompleteness.** Find inputs where the same defect still happens by another path.
   - SQ-2-01: a stopgap created through a signing's displacement, a bench vacancy, a GK slot, a stopgap who is himself a kept signing, two stopgaps at once, or a repair that should happen in the same season as the shot.
   - SQ-2-02: a guessed player sitting on the bench, a guessed name matching a club namesake, a guess in the same window as his first kept entry, a guess in season 9 (affects the season 10 board), a guessed Special Player name.
   - SQ-2-03: a repeat of a signing who is now on the board rather than in the reserves, who was shot, who was later guessed, or entered with a different position or overall.
3. **Attack each fix for regressions.**
   - Does the repair or eviction ever change a season's board *retroactively*, so that season s's board or turn differs from what season s showed before a later window's verdicts existed? It must not: season s may only depend on history 1..s-1.
   - Does it ever change the launch board or any board with empty histories? It must not.
   - Does it ever pull a non-club player, duplicate a person, leave fewer than 11 + 4 while the pool has players, hit an empty slot, or let the two phones compute different boards?
   - Is a launch starter whom FIFA 17 itself puts out of position (68 such slots) now wrongly swapped out?
4. **Check the new tests prove the fixes.** Would L1b/L1c fail on `78b43f8c`? Are their assertions strong enough, or could a wrong fix pass them?
5. Run the full existing contract file and your census across all 98 clubs, seasons 1 to 10, at `0eeac965`, and report the counts.

Report as before, with IDs `SQ-5-NN`. For each original finding, give a verdict: **FIXED**, **PARTIAL** (with a repro of what remains) or **NOT FIXED**. End with the job 2 area score out of 10 at `0eeac965`, and what is still needed for 10.
