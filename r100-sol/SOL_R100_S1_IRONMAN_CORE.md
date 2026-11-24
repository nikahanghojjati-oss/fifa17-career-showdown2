# Sol 3.0.0 job S1: Ironman core already in gameplay/r100 (High)

Read `r100-sol/_HOUSE_RULES_R100.md` on this branch first. IDs: `S1-NN`.

## Pins
- Review: **gameplay/r100 `2c7e89de6731701c294536cb3116d59f8b2c1e8f`** (52 commits on top of live 2.12.0 main `7dc0d48e`).
- What changed: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/compare/7dc0d48e2916d9371f600480e77881971a1c33f4...2c7e89de6731701c294536cb3116d59f8b2c1e8f

## What is new and must hold
1. **W5, one new-Showdown reset** (#1577, #1584): every page-memory cache (per-module "done" notes, listener and wait state) is reset when a NEW Showdown starts, so nothing from the previous Showdown leaks into the next one. Files: the 2-line reset hooks across `js/*Step.js` and `js/productionShared*.js`, the registry they join.
2. **W8, wait listeners rebuild** (#1582, #1584): a wait whose Firestore stream died is rebuilt within seconds instead of waiting for good. Files: `js/productionSharedSeasonCommit.js`, `js/productionSharedSeasonResults.js`, `js/iconGuessStep.js`, `js/sparkPrivatePairing.js`, `js/sparkRemoteJoining.js`, `js/persistentNikDanielPair.js`.
3. **W7, phone clock jumps** (#1586): a phone whose clock jumps mid-Showdown is measured again; server time decides.
4. **W12, one Prime Pack tap spends one guess** (#1583) even when the answer is lost on the way back (`js/iconGuessStep.js`).
5. **Terminal Close** small changes (`js/productionSharedTerminalClose.js`, +8/-3).

## Sharp questions
- After a FINISHED or ENDED Showdown, then REMATCH or NEW SHOWDOWN on both phones, can any value from the old Showdown (a done note, a cached commit, a wait, a Prime Pack token, a Chamber Men kick, a Transfer War lock) change what the new Showdown shows or allows? Try with and without a reload in between, and with one phone still on the old Final Winner screen.
- Kill a listener's stream (go offline 30-120 s, sleep the phone) at every wait: Season Results wait, Season Commit wait, Prime Pack, JOIN on Home. Does every wait come back by itself within seconds when the network returns, with no extra tap, and without a second write?
- Rebuilt listeners: can one wait end up with two live listeners (double reads, a double advance, or two screens racing)?
- Clock: set one phone 10 minutes ahead or behind mid-season. Can any timer (Prime Pack 25/20/20/20 s, Chamber Men kick clock, the 15-minute Transfer War window) give one manager more or less time than the other, or score a Prime Pack answer differently?
- W12: lose the answer of a Prime Pack guess (offline right after the tap). Is exactly one token spent and is the guess counted exactly once, on both phones?

## Already proven (challenge only with a concrete hole)
- Ironman L7 lane in the Gate: one job per fault leg + 3-season CE2PG, seeded; planted acknowledgement bug turned all 10 legs red. POS1M Ring 1: 20,000 stories per PR, 34/34 planted bugs caught; W12 was POS1M's first real catch.
