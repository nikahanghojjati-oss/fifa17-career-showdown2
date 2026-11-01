# CLAUDE -> G LEAD HANDOFF - R87 Prime Pack

A new once-a-season screen joining the r87 release: one package, one PR into `gameplay/r87`.

## Header

| | |
|---|---|
| Task ID | R87-PRIME-PACK (working name R88 Icon Unmasked; Nik renamed it Prime Pack and moved it to r87 on 2026-11-01) |
| Role | Claude (Prime Pack thread) built the package; G Lead reviews, resolves overlaps and merges into `gameplay/r87` |
| Date | 2026-11-01 |
| Branch | `claude/r88-icon-unmasked`, branched from `gameplay/r87` at `b2ba864e` (up to date with it when written) |
| PR | one draft PR into `gameplay/r87`; it supersedes #1124 (round logic), #1127 (names and data loader) and #1136 (screen page) |
| Rules | changed (composed Rules, lookup table and main-delta fixture regenerated); not deployed |
| Merge | nothing merged by Claude; the merge is G Lead's |

## 1. What Prime Pack is (Nik's decisions)

- Once per season, right after Roster Roulette and before the Transfer Challenge window opens, both phones show one masked white-and-gold card.
- The card reveals the position, then the six face stats one by one in a seeded random order, then the nation flag as the last chance. The name is never shown until the result. The overall rating stays hidden until the result (Nik N2).
- Each beat has an 8 s guess window. Nik and Daniel type guesses with suggestions; plain-letter spellings count. Each manager has two guesses (chips both phones see); wrong guesses are never shown or stored.
- The first right guess wins 1 Showdown point. No punishment. Nobody right by the flag is a draw. Season maximum goes from 11 to 12, stored as a sparse `primePack: true` result key, exactly like the r80 Europa League point.
- Only Showdowns confirmed on r87 or later play it (Nik N1, the same boundary as Roster Roulette). Old Showdowns are unchanged and never load anything.
- The list: male outfield Legends (FIFA 15 to 17), Prime Icons (FIFA 18 to 23), Base Icons (FC 24 to 27), base FUT Heroes and Hall of FUT players, one card each. The Icon card always wins (Nik 2026-11-01): a player with any Legend or Icon card uses the highest of those only; Hero or Hall of FUT cards are used only for players with none. Hall of FUT has one version; for Heroes only the base card counts. Ties go to the newer game.

## 2. What is in the package

Player-facing text says Prime Pack everywhere. Internal file names keep the working name (`iconGuess*`, `icon-guess`) so the three reviewed parts stay where they were reviewed; renaming them is optional and purely cosmetic.

| Part | Files |
|---|---|
| Round logic (was #1124) | `js/iconGuess.js`: seeded draw from the Showdown id (no icon twice in 10 seasons), stat order, beat clock (3 s lead, 8 beats of 1.5 s reveal + 8 s window), two chips, first right guess wins, draw rules |
| Names and data (was #1127) | `js/iconNames.js` (folding, matching, suggestions, ambiguous names cost no chip), `scripts/r88-icons-from-csv.mjs` (the CSV checker and generator), `data/icons.js` (generated; do not edit by hand) |
| Screen (was #1136) | `visual-assets/v10_1/icon-guess/index.html`, stand-in card art; it never decides anything, the game drives it by `postMessage` |
| Live round (workstream D) | `js/iconGuessStep.js`: arrival, live sync by one listener, guesses in transactions, result, Continue |
| Hook | `js/productionSharedTransferChallenge.js`: `pstcPrimePackFirst` runs after `pstcRouletteFirst` and before `navigateTo("transferChallenge")`; false keeps the window shut with a dashboard line, tapping again retries |
| The point | `js/productionSharedSeasonResults.js`: `pssrWithPrimePack` adds `primePack: true` to the winner's result before publish (one read of the round record, cached) |
| Rules | `firestore.season-results-production.fragment.rules`: `primePackRounds/{season_N}` match and functions, private result `primePack` tied to the round record; commit and terminal-close fragments: key allowed, +1, cap `* 12` |
| Scoring and screens | season max 12 and the Prime Pack line in `js/scoring.js`, `js/sharedCanonicalScoring.js`, `js/sharedSeasonResults.js`, `js/sharedSeasonCommit.js`, `js/spark*` validators, `js/sharedHistoryConvergence.js`, `js/sharedCareerAnalytics.js`, `js/seasonEngine.js`, `js/seasonFinalV10.js`, `js/productionSharedCanonicalScoring.js`, `js/ruleBook.js` (Rule Book row "Prime Pack: first to name the masked Icon +1") |
| Offline | `service-worker.js`: five files in `SHELL_PATHS` and `SHELL_PATHS_ADDED_SINCE_PREVIOUS` |
| Tests | `tests/contracts/r88-icon-guess-contracts.cjs`, `r88-icon-names-contracts.cjs`, `r88-icon-page-contracts.cjs`, `r87-prime-pack-step-contracts.cjs`, `tests/browser/r88-icon-page-audit.cjs`, `tests/firebase/prime-pack-rules-emulator.cjs` (new), Prime Pack terminal close and budget added to `tests/firebase/europa-league-rules-emulator.cjs` |
| Docs and data trail | this folder: the feature spec, the Team V card brief, both GPT data tickets, GPT's CSVs and reports as delivered, the corrected CSVs, and the spot-check findings |

### The round record and trust model

`rivalries/{rid}/primePackRounds/season_N` holds 11 fields: arrivals (server time), each manager's used chips, `namedBy` (the winner's role or null), revision, session, device and `updatedAt`. The Rules let each manager write only his own facts: his arrival once at server time, then one chip at a time from 1 s to 84 s after the later arrival, `namedBy` only to himself and only once; nothing changes after that. A private Season Result may carry `primePack: true` only when the record names that manager.

Which icon it is comes from the Showdown id on both phones, and whether a guess is right is decided on the guessing phone; the answer is never stored. So a manager who edits his own phone's code could claim a right guess. That is the same trust level as the rest of the Spark-plan game (no Cloud Functions, billing stays off), and the Rules still stop him touching the other manager's facts, guessing out of time or changing a decided round.

Reads: one listener on the round record while the screen is open (at most about 6 deliveries a season), one transaction read per write, one read when publishing the result. A Showdown that does not play it costs nothing.

## 3. How to test it

All of these pass on the branch:

```
npm run -s test:contracts
node tests/operations/pos20-control-plane.test.mjs
npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal "node tests/firebase/europa-league-rules-emulator.cjs && node tests/firebase/prime-pack-rules-emulator.cjs"
```

- Prime Pack Rules emulator: 19 checks (arrivals, guess timing, tampering with the other manager, decided rounds, the result point, reads/list/delete).
- Europa League emulator: 24 checks, now with a 10-season Prime Pack close at 12 a season; expression budget measured at about 773/1000 (initial progress) and 904/1000 (season 10) with EL and Prime Pack wins for both managers.
- The page on its own: open `visual-assets/v10_1/icon-guess/index.html` (preview mode plays a sample round).
- On two phones, start a new Showdown on r87, spin the roulette, tap the Transfer Challenge button: Prime Pack opens and waits for the other manager; guesses, chips and the result should match on both; Continue opens the window; the winner's Season Results show the +1.
- Kill switch: `CMS_PRIME_PACK = "off"` skips it.

## 4. Overlaps with open r87 PRs and how to resolve them

Checked against every open PR into `gameplay/r87` on 2026-11-01:

| Shared file | Open PRs | Resolution |
|---|---|---|
| Generated artifacts: `tests/fixtures/composed-production-rules/main-delta.json`, `tests/browser/support/billed-reads-table.json`, the `FSB_RULES_SHA256` / `FSB_RULES_LOOKUPS` block in `js/sparkPrivatePairing.js` | #1147, #1148 | Don't hand-merge. After merging the Rules fragments of both sides, rebuild and regenerate: `node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs`, then `node tests/browser/support/billed-meter.cjs --print-client-table` (paste rows and sha), set the table json `rulesSha256`, and `node tests/support/composed-production-rules.cjs --print-main-delta origin/main` (keep owners; Prime Pack hunks are owner `R87-PRIME-PACK`, 11 hunks). |
| `scripts/build-production-firestore-rules.mjs`, `tests/contracts/composed-production-rules-contracts.cjs` | #1147 | Keep both sets of required strings and both owner allowances (`r87Pack` line added here). |
| `js/productionSharedTransferChallenge.js` | #1147, #1118, #1105 | The hook is one added call in `pstcOpenNow` after `pstcRouletteFirst`, one new function, one dashboard line and one line in `pstcCloseRoulette`. Keep the order roulette, Prime Pack, window. |
| `js/productionSharedSeasonResults.js` | #1145 | One new function and a two-line change around `provider.publishResult`. |
| `service-worker.js`, `tests/contracts/r86-release-contracts.cjs` | #1126, #1122, #1118 | Keep every side's shell files; update the shell count in the r86 release contract (this branch: 261 = 256 + 5). |
| `js/seasonFinalV10.js`, `js/sharedCareerAnalytics.js`, `js/seasonEngine.js`, `js/productionSharedCanonicalScoring.js` | #1135, #1130, #1120, #1103, #1118 | Small: the 12 cap, perfect season at 11 or more, a Prime Pack line in the breakdown text. |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, `tests/operations/pos20-control-plane.test.mjs` | most PRs | Append-only lists: keep every side's entries (this branch adds 4). |
| `tests/contracts/r87-wait-both-spins-contracts.cjs` | #1105 | One stub line: the harness gives `CareerModeIconGuessStep` that resolves true. |

The release PR must keep `ICON_FROM_MS` in `js/iconGuess.js` equal to `RRR_FROM_MS` in `js/rosterRouletteStep.js` (both 2026-10-30); a contract checks it. If the roulette boundary moves, move both.

## 5. Data status

See section 7 for the final numbers. In short:

- ICON-01 (Legends and Icons): 145 players from GPT, run through the checker with the last Prime game FIFA 23, and spot-checked against a second source (`data/R88_SPOTCHECK_FINDINGS.md`): 38 of 39 rows matched; one correction (Landon Donovan's position LM to CF). The odd id `ole-gunnar-solskj-r` became `ole-gunnar-solskjaer`, card name "Solskjær" with plain-letter spellings accepted. Not verified: whether Zico had a 91+ Prime card.
- ICON-02 (Heroes and Hall of FUT): see section 7.
- `data/icons.js` is generated by `scripts/r88-icons-from-csv.mjs`; its row order is part of the seeded draw, so once released, a list change needs a new `LIST_VERSION`.

## 6. Still waiting

- Team V's card art (brief: `R88_ICON_CARD_TEAM_V_BRIEF.md`). The page ships with a stand-in card; the art drops into the page without code changes elsewhere.
- Nik's calls listed in section 7, if any.

## 7. Data numbers (filled in when the Heroes merge finished)

PENDING
