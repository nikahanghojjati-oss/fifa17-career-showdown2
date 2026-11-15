# Job S-SQ · Sol · Squad Management: serious bugs that stop the game

Read r93-redteam/_HOUSE_RULES.md first; it is part of this job.

Goal: find a serious bug that stops a real Showdown at Squad Management: a manager who cannot lock his squad, a LOCK the Firebase Rules refuse for a fair squad (including the 1,000-expressions-per-document limit at the largest fair squad), a screen that never loads, a squad the engine cannot build (empty slot, endless loop, crash), or the two phones stuck on different steps.

Start here: js/squadSheet.js, js/squadSheetStep.js, js/squadScreen.js, the Squad sheet Rules (search the Rules files and the composed Rules for "squad"), tests/firebase/squad-sheets-rules-emulator.cjs, tests/contracts/r91-squad-terminal-close-contracts.cjs and r91-upgrade-squad-contracts.cjs.

Try in particular:
- The largest fair squad write: season 10, maximum signings kept and bought back, longest names, every optional field, both managers, on the emulator with the composed Rules.
- Engine edge cases: a club with too few players, all signings lost, every bench slot a signing, a buy-back of a player who also has a namesake at the club, a run of 10 seasons fuzzed (the engine is pure JS; you can drive it directly).
- Reload, app reopen, screen off, offline and update during Squad Management and at LOCK; the Showdown ending (END SHOWDOWN or a sacking) while a squad is open.
Report as the house rules say, file name SOL_SQUAD_REPORT.md.
