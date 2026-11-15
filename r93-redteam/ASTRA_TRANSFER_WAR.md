# Job A-TW · Astra · Transfer War: real bugs that change the game

Read r93-redteam/_HOUSE_RULES.md first; it is part of this job.

Goal: find genuine bugs in Transfer War that would change a real game: a wrong verdict, a wrong refusal of a fair signing or guess, a fair entry accepted when it should be refused, points or squads that end up wrong, or the two phones disagreeing.

Start here: js/productionSharedTransferChallenge.js, js/transferSelector.js, js/playerSearch.js (name list), js/transferScreenV10.js, js/sharedTransferChallenge.js, js/squadSheet.js (what a verdict feeds into), data/transferOptions.js, firestore.transfer-challenge-production.fragment.rules.

Play it like the two managers would, both roles, seasons 1-10:
- Names: the same name for two different players, accents typed with and without, a player picked from the list vs typed by hand, a player guessed in an earlier season, the rival's Special Player, own Special Player, a player who left and is signed back (buy-back), a loan back.
- Edges: 0, 1, 2 and 3 signings; 0-3 guesses; locking near the end of the 15-minute clock and just after; one manager never locking; both locking at the same instant; reload, app reopen, screen off and late join during entry, at LOCK and on the verdicts.
- After the verdicts: check the next Squad Management screen and the next season's Transfer War carry exactly what the verdicts said, on both phones.
Report as the house rules say, file name ASTRA_TRANSFER_WAR_REPORT.md.
