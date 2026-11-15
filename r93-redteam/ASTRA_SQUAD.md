# Job A-SQ · Astra · Squad Management: real bugs that change the game

Read r93-redteam/_HOUSE_RULES.md first; it is part of this job.

Goal: find genuine bugs in Squad Management that would change a real game: a wrong player on the board, a player missing who should be there, a guessed or rival Special Player getting in, the own Special Player on the board, a wrong overall or position, starters/bench rules broken (11 + 4), a squad that shrinks when the club still has players, or the two phones showing different squads.

Start here: js/squadSheet.js (the engine: excluded, barred, alts, buy-backs, loans, hidden reserves), js/squadSheetStep.js, js/squadScreen.js, data/rosterSquads.js, js/rosterRoulette.js, tests/contracts/r91-squad-sheet-contracts.cjs (C17-C20 show the intended rules).

Play it like the two managers would, both roles, 1/3/5/10 seasons:
- Signings kept, lost, sold and bought back, loaned and loaned back, same-name players at the club and signed, a player shot in Russian roulette, a player guessed by the rival, hidden reserves coming back when better players leave.
- Swaps between starters and bench, an injured or departed starter, the last possible squad of a small club by season 10.
- Reload, reopen, late join and update mid-Squad Management; both lock at once.
Check each season's board against what Transfer War, roulette and the club pool say it should be. Report as the house rules say, file name ASTRA_SQUAD_REPORT.md.
