# CLAUDE -> G LEAD HANDOFF - R87 Prime Pack

A new once-a-season screen in the r87 release: one package, PR #1149 into `gameplay/r87`.

## Header

| | |
|---|---|
| Task ID | R87-PRIME-PACK (working name R88 Icon Unmasked; Nik renamed it Prime Pack and moved it to r87 on 2026-11-01) |
| Role | Claude (Prime Pack thread) built the package; G Lead reviews and merges into `gameplay/r87` |
| Date | 2026-11-01 |
| Branch | `claude/r88-icon-unmasked`, with `gameplay/r87` at `f4efa199` merged in (real code files conflicted: the transfer hook, `seasonEngine.js`, `productionSharedCanonicalScoring.js`) |
| PR | #1149 into `gameplay/r87`; it replaces #1124 (round logic), #1127 (names and data loader) and #1136 (screen page) |
| Rules | changed and recomposed (sha `fd8788fb…`); not deployed |
| Merge | nothing merged by Claude; the merge is G Lead's |

## 1. What Prime Pack is (Nik's decisions, 2026-10-31 and 2026-11-01)

- Once per season, right after Roster Roulette and before the Transfer Challenge window opens, both phones show one masked white-and-gold card of one random player.
- Four stages. Stage 1 shows the position and one real card stat; each later stage adds one more real stat. The values always come from the player's real card data (`data/icons.js`); only which stats show, and in which order, is random. The name never shows before the result; the overall stays hidden until the result.
- Points by stage, in ONE table (`STAGE_POINTS` in `js/iconGuess.js`): 4, 3, 2, 1. Stage 4 is the last chance.
- Each stage has one guess window, one setting (`WINDOW_MS`, default 8 s, allowed 5 to 10 s).
- Nik and Daniel type guesses with suggestions; plain-letter spellings count. Two guesses each (chips both phones see); wrong guesses are never shown or stored.
- The first right guess wins, ordered by server time. One manager scores 4, 3, 2 or 1; both can never score; there is no tiebreak.
- Nobody right by the end of stage 4: nobody scores. Guessing is closed, then the whole card is revealed with the flag. The flag is only part of that full reveal.
- Season maximum 15 (was 11) and Golden Showdown 150 (was 110) for Showdowns confirmed on or after the Prime Pack boundary (2026-10-30, the same as Roster Roulette). Older Showdowns keep 11 and 110, never load Prime Pack and are unchanged.
- The answer (which player) is never stored: both phones derive it from the Showdown id.
- The list: male outfield Legends (FIFA 15 to 17), Prime Icons (FIFA 18 to 23), Base Icons (FC 24 to 27), base FUT Heroes and Hall of FUT players, one card each; "the Icon card always wins".

## 2. What is in the package

Player-facing text says Prime Pack everywhere. Internal file names keep the working name (`iconGuess*`, `icon-guess`).

| Part | Files |
|---|---|
| Round logic | `js/iconGuess.js`: seeded draw from the Showdown id (no player twice in 10 seasons), the stat order, the stage clock (3 s lead, four stages of 1.5 s reveal + `WINDOW_MS`), `STAGE_POINTS`, `stagePointsAt`, two chips, first right guess wins |
| Names and data | `js/iconNames.js`, `scripts/r88-icons-from-csv.mjs`, `data/icons.js` (generated) |
| Screen | `visual-assets/v10_1/icon-guess/index.html`: stand-in marble-and-gold card, four stages with the points banner, flag only on the result; it never decides anything |
| Live round | `js/iconGuessStep.js`: arrival, one listener, guesses in transactions, `pointsFor`, result, Continue; the round carries `stagePoints` so the page shows the same table |
| Hook | `js/productionSharedTransferChallenge.js`: `pstcPrimePackFirst` after the roulette and before the transfer window; Showdowns confirmed before the boundary never load the step |
| The points | `js/productionSharedSeasonResults.js`: the winner's private result gets `primePack: N` (1 to 4) before publish |
| Rules | season-results fragment: the `primePackRounds/{season_N}` block (guesses 2 to 43 s after the later arrival), `primePack` 1 to 4 on a private result only when the round names that manager and N matches the stage of the winning write's server time; commit and terminal-close fragments: the key allowed, cap `* 15` |
| Totals everywhere | `js/careerScreenSeam.js` (`SEASON_MAX`, `seasonMaxFor`, `goldenShowdownPoints`: 150 or 110), Trophy Room, Career Stats and Legacy through the seam; `js/touchlineGazette.js` (race strip uses 15 per season left, Golden draw 150-150); `js/commentaryEngine.js` (clinched, perfect, Golden lines use the Showdown's own max); `js/ruleBook.js` (Golden 150/110 and the Prime Pack rule); Season Results, Final Winner and Standings breakdowns show the Prime Pack row |
| Validators | `js/scoring.js`, `js/sharedCanonicalScoring.js`, `js/sharedSeasonResults.js`, `js/sharedSeasonCommit.js`, `js/spark*`, `js/seasonEngine.js`, `js/seasonFinalV10.js`, `js/productionSharedCanonicalScoring.js`, `js/analytics.js` |
| Fix | `js/sharedHistoryConvergence.js` refused any season with the `primePack` breakdown key (History would have failed on the first Prime Pack season); it now accepts it |

### Trust model

The round record holds 11 fields: arrivals (server time), each manager's used chips, `namedBy`, revision, session, device and `updatedAt`. Each manager writes only his own facts. Which player it is and whether a guess is right are decided on the guessing phone, as for the rest of the Spark-plan game (no Cloud Functions, billing off). The Rules still stop a manager touching the other's facts, guessing out of time, changing a decided round, claiming points he did not win, claiming the wrong stage's points, or both managers scoring.

Reads: one listener on the round while the screen is open, one transaction read per write, one read when publishing the result. Old Showdowns cost nothing.

## 3. How to test it (all pass on the pushed head)

```
npm run -s test:contracts
npm run -s test:ops
node tests/browser/r88-icon-page-audit.cjs
npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal "node tests/firebase/prime-pack-rules-emulator.cjs && node tests/firebase/europa-league-rules-emulator.cjs && node tests/firebase/prime-pack-three-season-emulator.cjs"
```

New test files to wire into `package.json` and the gate if you want them in CI (the contracts already run through POS20):

- `tests/contracts/r87-prime-pack-totals-contracts.cjs` (new, 6 checks: one boundary, 150/110, career screens, Gazette race and Golden draw, commentary, Rule Book)
- `tests/contracts/r87-prime-pack-step-contracts.cjs` (8 checks, including: every revealed value is the player's real stat, which stats show varies)
- `tests/contracts/r88-icon-guess-contracts.cjs` (9 checks, including G8: the Rules stage edges equal the clock)
- `tests/firebase/prime-pack-rules-emulator.cjs` (20 checks)
- `tests/firebase/prime-pack-three-season-emulator.cjs` (new, 26 checks: 3 seasons on both phones, 4 points, 2 points, nobody; the Rules refuse the loser, the wrong value and both scoring; totals never above 15; the answer is never stored)
- `tests/browser/r88-icon-page-audit.cjs` (8 checks, Playwright)

## 4. Needs G Lead

- The Rules: recompose, re-pin and deploy (sha `fd8788fb9c158ce2d39da37b82548f6366b27c16088580b8f98c4df5138ecd8d`, 172400 bytes). Generated files are regenerated on this head: `main-delta.json` (11 hunks owner `R87-PRIME-PACK`), the lookup table in `js/sparkPrivatePairing.js` and `billed-reads-table.json`.
- The window value: 8 s now. If you change `WINDOW_MS`, change the Rules stage edges (12500, 22000, 31500 ms) and the 43 s close with it; contract G8 fails until they match.
- The boundary 2026-10-30 is in `js/iconGuess.js`, `js/careerScreenSeam.js`, `js/touchlineGazette.js` and `js/productionSharedTransferChallenge.js`, pinned equal by contract T1. If the release boundary moves, move all four with `RRR_FROM_MS`.
- Service worker: Prime Pack's five files are in `SHELL_PATHS` and `SHELL_PATHS_ADDED_SINCE_PREVIOUS` (r86 release contract count 264). Version text, rollback list and `package.json` are untouched.
- No shell changes: nothing in `index.html`, `js/app.js` or shared CSS.
- Two other teams' tests changed because Golden is now 150 for new Showdowns: the History layout fixture in `r87-career-fixes-browser-contracts.cjs` (its Showdowns are confirmed 2026-10-31, so its Golden card is now 150-150), and a Prime Pack step stub in `r87-fable-step-contracts.cjs` and `r87-roulette-hits-contracts.cjs`.
- Kill switch: `CMS_PRIME_PACK = "off"` skips Prime Pack.
- Startup gzip is 37492 of 37495 bytes.
- The card is the stand-in until Team V's art arrives.

## 5. Data status

See section 7 for the final numbers. In short:

- ICON-01 (Legends and Icons): 145 players from GPT, run through the checker with the last Prime game FIFA 23, and spot-checked against a second source (`data/R88_SPOTCHECK_FINDINGS.md`): 38 of 39 rows matched; one correction (Landon Donovan's position LM to CF). The odd id `ole-gunnar-solskj-r` became `ole-gunnar-solskjaer`, card name "Solskjær" with plain-letter spellings accepted. Not verified: whether Zico had a 91+ Prime card.
- ICON-02 (Heroes and Hall of FUT) and ICON-03 (Icons ICON-01 missed): see section 7.
- `data/icons.js` is generated by `scripts/r88-icons-from-csv.mjs`; its row order is part of the seeded draw, so once released, a list change needs a new `LIST_VERSION`.

## 6. Still waiting

- Team V's card art (brief: `R88_ICON_CARD_TEAM_V_BRIEF.md`). The page ships with a stand-in card; the art drops into the page without code changes elsewhere.
- Nothing from Nik on the data: his rules are applied as given.

## 7. Data numbers

`data/icons.js` now holds **232 players**: 17 Legend, 103 Icon Prime, 26 Icon Base, 68 Hero, 18 Hall of FUT, chosen from 536 cards considered (`--last-prime-game "FIFA 23" --generated-on 2026-11-01 --sample-seed 88`). `LIST_VERSION` stays 1 because Prime Pack has not been released.

To rebuild it exactly:

```
D=project-documents/r88-icon-guess/data
node scripts/r88-icons-from-csv.mjs \
  --icons $D/R88_icons_145_players.csv,$D/R88_ICON_03_missing_icons.csv,$D/R88_ICON_02_heroes_icons.csv,$D/R88_ICON_02_census_new_heroes.csv \
  --cards $D/R88_icon_cards_considered_180.csv,$D/R88_ICON_03_missing_icon_cards.csv,$D/R88_ICON_02_heroes_cards_considered.csv,$D/R88_ICON_02_census_hero_cards_new_only.csv \
  --last-prime-game "FIFA 23" --out data/icons.js --generated-on 2026-11-01 --sample-seed 88
```

Where each part came from:

| Part | Players | Source files (all in `data/`) |
|---|---|---|
| ICON-01 Legends and Icons (GPT, spot-checked) | 145 | `R88_icons_145_players.csv`, `R88_icon_cards_considered_180.csv`, `R88_SPOTCHECK_*` |
| ICON-03 Icon ICON-01 missed (Claude) | 1: Pep Guardiola, FIFA 22 Prime 90 | `R88_ICON_03_*` and its report |
| ICON-02 Heroes and Hall of FUT (GPT, corrected) | 81: 63 Hero, 18 Hall of FUT | `R88_ICON_02_heroes_icons.csv`, `R88_ICON_02_heroes_cards_considered.csv`; GPT's files as delivered end in `_gpt.csv`; changes in `R88_ICON_02_name_changes.txt` |
| Base-Hero census FIFA 22 to FC 27 (Claude) | 5 new Heroes: Mostovoi, Ricken, De Rossi, Gilberto Silva, Hoeneß | `R88_ICON_02_census_new_heroes.csv`, `R88_ICON_02_census_hero_cards.csv` (all 332 cards), `R88_ICON_02_census_hero_cards_new_only.csv` (the 245 not already in GPT's file), `R88_ICON_02_CENSUS_REPORT.md` |

What was checked:

- None of the Hero or Hall of FUT players has an allowed Legend or Icon card; the checker also enforces "the Icon card always wins", one base Hero card per game and one Hall of FUT card.
- The census found no older base Hero card higher than GPT's picks, and where the census and GPT list the same card (87 cards) the overalls agree.
- 15 OvrUp-only Hero rows, including all six tied at 89, match FUT.GG on overall, position and all six face stats.
- Names: duplicate and weak aliases fixed (for example Natale to Di Natale, Sung to Ji-sung Park, Jaber to Al-Jaber, Owairan to Al-Owairan, "Luiz" removed); surname aliases added where unique (Vialli, Stam, Córdoba, Salgado, King); Cole and Keane left out because Ashley Cole and Roy Keane are Icons. Shared surnames such as Silva or Hernández stay full-name only, and an ambiguous typed name costs no chip.

What is not verified:

- FUT.GG was the only card database reachable; nothing was cross-checked against a second full database.
- FC 24 and FC 25 Hero and Icon rosters come from fan trackers, checked player by player on FUT.GG.
- Whether Zico had a Prime card above his FC 27 Base 91 (from ICON-01).
- Icons added after launch in older games could be missing; a cross-check found none.
- If Robben, David Silva, Platini or Paolo Rossi get an FC 27 Base Icon later, they need adding (new `LIST_VERSION` once released).

## 8. A question for G Lead from Nik: Claude Duet's role in the workflow

Nik would like your view on where Claude Duet (the Claude in Nik's app, which built this package) fits best in the Showdown workflow. His view: building a full screen in Duet is probably not the most efficient way, so this screen is a one-off. Going forward, Duet might be better as something lighter that keeps Nik up to date without using much, or another role you think fits better.

Some roles to react to, not a shortlist:

- Status and tracking: watches the r87/r88 PRs, CI and the job board, and tells Nik in plain words what changed and what needs him.
- Ticket writing: turns Nik's voice notes into job tickets for Team G, Sol or Team V in the house format.
- Review and data checks: a second pair of eyes on a finished PR, or checking data like this Icon list against sources, without building features.
- Handoffs: packages finished work, findings and open questions for you or Sol, like this note.
- Small, contained builds only: a self-contained page or script, with the Rules and the integration left to Team G.

Please send your suggestions back through Nik: which role or roles, what Duet should stop doing, and anything that would make its work easier for you to take in.
