# Red team r87 — CAREER_HISTORY (job D)

Audit target: `nikahanghojjati-oss/fifa17-career-showdown2`, `gameplay/r87` at **5598c0768067a48a51dc5b2675a5b0701197734b** (latest fetched head; includes #1088 reads fixes). Report date: 2026-10-31. Only this report is added. No game, test, Rules, dependency manifest or production data changes.

## Verdict

**7/10 for career/history readiness.** The arithmetic probes and 10/30/100-game summary comparison agree; this is not proof of the required real two-phone ten-season release journey. Findings below concern filtering, missing release history, a clipped season total and readable names. No P0 wrong-winner defect was established. The user's current house rules take precedence over comments/tests that intentionally preserve older behavior, particularly ended-early History cards.

Evidence levels: **executed module** = unchanged production functions with local fixtures / fake SDK IO; **browser** = actual app/renderers/styles in local Chromium, external requests blocked; **emulator** = local demo Firebase only. Synthetic historical cases establish conditional defects, not the contents of Daniel's or Nik's private accounts. Production Firebase was never queried.

## Findings

### R87-D-01 — P1 — Ended-early Showdowns remain visible in History

**Evidence:** `js/sharedCareerAnalytics.js:122`–`124` adds abandoned status rows; `js/rivalryLegacyV10.js:38`–`39` explicitly includes them in the archive; `visual-assets/v10_1/legacy/legacy.js:153`–`191` paints their cards. `js/sharedClosedShowdownAdapter.js:74`–`78` carries the reader's abandoned answer into the model. This remains present at the audited commit.

**Exact player steps:** Start a real 3-season Showdown, commit season 1, use Settings → END SHOWDOWN, then open History. Reload or sign in on a fresh phone and open History again. The closed root has no `terminalClose`, so `js/sparkCompletedShowdownReader.js:178` returns `abandoned` with its ended metadata. No altered client is needed.

**Player sees:** An extra numbered card, e.g. `SHOWDOWN 2` / `Ended early · 31 Oct 2026 · 1 season`, although the current house rule says ended-early/abandoned games stay hidden. Later completed games also inherit numbering gaps relative to the visible finished-only career. Points and trophies correctly exclude the ended game; this is a visibility defect, not an extra win.

**Executed proof:** A verified completed 47–47 game followed by one abandoned entry produces two `toV10Frame(model,"legacy").showdowns`, statuses `["completed","abandoned"]`, while career points remain 47 each and completed count remains 1. The existing CE2PG oracle explicitly expects ended rows (`tests/browser/ce2pg-journey.cjs:277`–`282`), so a green run under that expectation would not enforce this house rule.

**Root cause:** The older “list status, exclude totals” policy remains in both model and view.

**Smallest fix:** Exclude abandoned entries before assigning public History numbers, retain any diagnostic classification outside the visible archive, and change the ended-row oracle to assert absence. Preserve completed-only arithmetic.

### R87-D-02 — P2 — Roster Roulette releases have no career History representation

**Evidence:** `js/rosterRoulette.js:213`–`252` computes the season's fired turn and player; `js/sharedCareerAnalytics.js:68`–`72` reduces seasons to score/winner/league facts and sparse EL attribution; `js/rivalryLegacyV10.js:39` copies those reduced seasons into History. `visual-assets/v10_1/legacy/legacy.js:305`–`331` renders only scores, position/points/goals and an EL note. Rivalry also hard-codes `transfers:{status:"unavailable"}` at `js/rivalryLegacyV10.js:59`. The closed transfer reader returns Transfer War guesses/signings/verdicts (`js/sparkCompletedTransferHistoryReader.js:119`–`123`, `155`–`157`), not Roulette outcomes, and is not consumed by these career frames.

**Exact player steps:** On a Showdown confirmed after the r87 Roulette cutoff, spin a fired result, release the named player in FIFA 17, finish the Showdown, open History → VIEW SEASON HISTORY and Rivalry Statistics. Repeat after reload/on a fresh phone.

**Player sees:** Season scores and league facts, but no Roulette release or released player's name. This is missing history, not a claim that the release incorrectly changes points. There is no career-screen control to recover that fact.

**Executed proof:** Calling the unchanged `rosterRoulette.forSeason` for `pair_1` + hexadecimal 4 padded to 63 digits, Arsenal/Liverpool, season 1, yields Nik firing at slot 5: **G. Wijnaldum**, rating 81 (Daniel does not fire). Revalidation also supplied the actual post-r86 Special Player draw (Neymar / Cristiano Ronaldo); the same release results. The reproduction below finds that valid 1-season ID. The career History frame has no field for that event; actual browser History drawers have ten score/league rows and no Roulette line. Source tracing establishes the loss at the frame boundary, independently of which random ID normal play creates. The particular live r87 fired-result → closed-history browser journey is **unknown** until separately exercised; the data omission itself is deterministic.

**Root cause:** The new deterministic Roulette presentation was not connected to career-history rendering. Existing transfer-release handling in the retired local Legacy renderer (`js/legacy.js:128`–`151`) does not service online History.

**Smallest fix:** Add display-only per-season Roulette facts to the online History/Rivalry read model, derived with the same ID, clubs, Special Players and preceding verified Transfer War verdicts as the live wheel. Render fired releases separately from Transfer War releases; never add either to scoring or W/D/L. Load them on detail demand so opening the career summary does not re-read every transfer season.

### R87-D-03 — P1 — The eleventh eligible r79 hidden Showdown is never restored

**Evidence:** `js/careerStartMarker.js:57` fixes `REVEAL_SCAN_LIMIT=10`; line `66` scans only `hidden.slice(-REVEAL_SCAN_LIMIT)`; line `72` returns every unscanned ID as hidden. `js/rivalryLegacyV10.js:238` passes that answer into the loader, which drops those IDs before reading at `js/sparkClosedShowdownCareerLoader.js:121`–`122`. The result affects every career screen using the common model, not just History.

**Exact normal-history precondition / steps:** An account has eleven eligible finished r79 games in the marker's hidden list because of the documented r79 first-real-START leak (`js/careerStartMarker.js:44`–`56`); its marker was created between 2026-10-18 17:17:45 UTC and 2026-10-19 12:00 UTC. Open any career page on r87. This is a historical normal-play case, not a way to write eleven IDs from a modified r87 app. Whether either real account has this precondition is **unknown**.

**Player sees / arithmetic:** Only ten of those eleven completed games. If each is the repository's saved 1-season 5–1 game, expected completed=11, seasons=11, Daniel=55, Nik=11; actual completed=10, seasons=10, Daniel=50, Nik=10. Each manager is missing one game's trophies and records too. Reload/cleared storage cannot restore the eleventh; the same filter is run again.

**Executed proof:** Eleven chronological IDs, all with closed non-test roots and close times within r79, passed to the actual `careerHiddenRivalryIds` cause exactly ten SDK gets and return `[oldestId]` as still hidden. No failed get, malformed root or pre-r79 cutoff is involved. A second executed probe reused the actual scale harness with eleven distinct copies of the valid saved 5–1 fixture and passed the resulting oldest-ID exclusion to the real loader: completed=10, seasons=10, Daniel=50, Nik=10, all asserted. This separates the filter defect from completed-reader validation.

**Root cause:** A bounded repair scan is treated as a complete exclusion decision. Nothing resumes it at the omitted prefix.

**Smallest fix:** Walk all eligible hidden IDs in bounded batches, with progress and a continuation until the complete set is classified. Preserve pre-r79 and explicit test exclusions; do not blindly reveal every hidden ID. A repair must also work on a fresh phone without local migration state.

### R87-D-04 — P3 — Desktop Career Statistics truncates Special Player names

**Evidence:** `js/specialPlayerChip.js:114` sets `.spChipName` to hidden overflow/ellipsis; `:150` applies compact chips to the career table, but the wrapping override at `:165`–`167` exists only inside `max-width:640px`. The real statistics renderer inserts the chip in the Manager cell at `visual-assets/v10_1/career-statistics/career-statistics.js:102`.

**Exact player steps:** Finish a post-r86 Showdown assigning a long Special Player name such as Cristiano Ronaldo, open Career Statistics at 1440×900, compare its chip with the phone view or hover its title.

**Player sees:** A shortened name in the desktop table. Executed Chromium measurement: Cristiano Ronaldo name box `clientWidth=43`, `scrollWidth=71`, hidden overflow and ellipsis. At 390×844 the wrapping override permits the full name (`clientWidth=scrollWidth=36`, multiple lines). The same result reproduced with 10, 30 and 100 finished games.

**Root cause:** Only phone table chips were given a wrapping rule. The full desktop name is recoverable in the hover title (`js/specialPlayerChip.js:84`–`88`), hence P3; no numeric loss or incorrect player assignment is claimed.

**Smallest fix:** Allow name wrapping in desktop Manager cells too, with enough row height, or expose a visible full-name detail control. Keep SP wording and tier color.

### R87-D-05 — P2 — At 100 ten-season games the desktop season total loses its last digit

**Evidence:** `visual-assets/v10_1/career-statistics/career-statistics.js:86` caps the combined number-length hint at six digits, even when `1000 / 1000` needs eight. `visual-assets/v10_1/career-statistics/career-statistics.css:29` clips tile overflow; lines `41`–`42` provide sizing only for five/six digits, with a minimum 20px font. The inline D/N labels, gaps and icon consume additional width.

**Exact player steps:** Finish 100 ten-season Showdowns, open Career Statistics at 1440×900, read SEASONS PLAYED. This normal-play scale case does not depend on score outcomes or any altered data. The scale fixture's outcomes are merely a convenient way to populate the model.

**Player sees:** The right-hand `1000` is clipped at the tile edge (roughly its last digit); the phone at 390×844 shows both `1000` values. Actual data and the career table's `1000-0-0` / `0-0-1000` remain correct, making this a recoverable presentation defect rather than an arithmetic P1.

**Executed browser proof:** At 1440×900, the range containing Nik's `1000` extends from x=675.98 to **724.73**, while its `.headlineTile` ends at **716.39** with `overflow-x:hidden`: **8.34px of numeric ink is outside the clipping edge**. The screenshot visibly truncates that value. The first `1000`, career points `5000`, and trophy count `1000` have no such clipping in this fixture. Phone screenshot shows the two complete season counts.

**Root cause:** Three-digit-total sizing was extended only to a six-digit combined hint; 100 games × ten seasons produces four digits for both managers.

**Smallest fix:** Size to the actual available number area (including both labels and gaps), support eight combined digits or stack the pair, and assert visible text ranges fit their clipping ancestors at 10/30/100 games. A DOM-text assertion alone still sees the correct `1000` and misses this.

## Ranked top five

1. **D-03 (P1, conditional historical case):** Restore every eligible r79 completion; the hard cap silently subtracts whole games on affected histories.
2. **D-01 (P1):** Hide ended-early/abandoned entries and number only the permitted archive.
3. **D-05 (P2):** Keep both full season totals visible at the requested 100-game scale.
4. **D-02 (P2):** Make fired Roulette releases recoverable in online career detail pages without affecting scores.
5. **D-04 (P3):** Make full desktop SP names readable.

## Independent arithmetic and screen checks

Scoring checked against `js/sharedHistoryConvergence.js:43`–`50`: CL 5 **or** EL 3, league title 3, domestic cup 1, performance bonus `points>=100 OR goals>=100` capped at 1, individual awards `topScorer OR topAssist` capped at 1. No season here has both European competitions. All unmentioned booleans are false; default league points=60, goals=55, position=5.

Archetypes: **P** = position 1, points/goals 100/100, CL, cup, both awards → `5+3+1+1+1=11`; **E** = EL+cup → `3+1=4`; **C** = CL → 5; **L** = position 1 → 3; **Z** = none → 0. Both managers may earn the same honour in their separate FIFA saves. S6 deliberately compares position 5 against position 2, both scoring zero.

| Season | Daniel | Nik | Scores D–N | Result |
|---|---|---|---|---|
| 1 | P | P | 11–11 | Draw |
| 2 | E | C | 4–5 | Nik |
| 3 | C | E | 5–4 | Daniel |
| 4 | L | E | 3–4 | Nik |
| 5 | E | L | 4–3 | Daniel |
| 6 | Z (position 5) | Z (position 2) | 0–0 | Draw, no position tiebreak |
| 7 | C | Z | 5–0 | Daniel |
| 8 | Z | C | 0–5 | Nik |
| 9 | E | E | 4–4 | Draw |
| 10 | P | P | 11–11 | Draw |

Per manager: `11+4+5+3+4+0+5+0+4+11=47` (Nik's ordering differs, same sum); **3W/4D/3L**, ten seasons; one Showdown **draw**, zero Showdown wins/losses; both career rank 1. CL=4, EL=3, league titles=3, cups=5, trophies=`4+3+3+5=15`. Two perfect seasons, two performance bonuses, two awards bonuses, two 100-point and two 100-goal seasons. League point total=`2×100+8×60=680`, average **68**; league goal total=`2×100+8×55=640`, average **64**; average season score **4.7**. Highest score 11, league points 100, goals 100, all shared; biggest Showdown win is absent. No Golden at 47. Separate ten P/P seasons yield **110–110**, Draw, **one Golden each**; 1-, 3- and 5-season P/P prefixes never earn Golden.

The same prefix inputs as separate completed 1/3/5/10-season games yielded:

| Length | Points per manager | Season W/D/L per manager | CL / EL / league / cups | Trophies | Avg league points / goals | Avg score |
|---|---:|---|---|---:|---|---:|
| 1 | 11 | 0/1/0 | 1/0/1/1 | 3 | 100 / 100 | 11 |
| 3 | 20 | 1/1/1 | 2/1/1/2 | 6 | 73.333… / 70 | 6.666… |
| 5 | 27 | 2/1/2 | 2/2/2/3 | 9 | 68 / 64 | 5.4 |
| 10 | 47 | 3/4/3 | 4/3/3/5 | 15 | 68 / 64 | 4.7 |

An extra executed three-season control has scores `5–0`, `0–3`, `0–2`: career points **5–5** despite season wins **Daniel 1 / Nik 2**. The actual Statistics frame gives **rank 1 to both**, and History says Draw. Thus the rank check does not merely pass because the ten-season example has equal season wins.

A duplicate identical rivalry entry still yields 47, not 94 (`sharedCareerAnalytics.js:47`–`62`). Adding a distinct same-manager 1-season 5–0 Showdown yields Daniel=52/Nik=47 and eleven seasons each; the first row still has exactly ten seasons. Source isolation is by rivalry ID and exact season path (`sparkCompletedShowdownReader.js:185`–`198`), not just manager pairing or season number. The r87 Rematch creates a new Showdown through the normal start path; UI Rematch execution in this audit is **unknown**, so this is model/addressing proof, not a claim of a played Rematch.

| Career screen | Values checked against supplied verified data | Evidence / result | Unknown / limitation |
|---|---|---|---|
| Trophy Room | Career ranks/points, season wins, CL/EL/title/cup counts, Showdown wins, five record values/holders, Golden counts | Executed `toV10Frame`; mixed-EL desktop DOM and phone MORE (47–47, shared 11/100/100/2 records); scale browser at both sizes | Phone MORE opened in mixed-EL probe; full ink/overlap census for every category and size unknown |
| Career Statistics | Completed games, seasons, career points, season W/D/L, trophies, comparison averages, leaders, shared ranks, Golden, SP identity | Executed frame, 47–47 mixed-EL browser table at both sizes, actual scale browser; D-04/D-05 | Streaks are not fields in this online model/renderer; no invented streak validation |
| Rivalry Statistics | Single Showdown score, seasons, W/D/L, trophy types, season winners, Golden, SP | Executed `toV10Frame` for isolated ten-season model | Actual 47–47 desktop DOM checked: 3/3 wins, 4 draws, all ten season winners and trophy counts. Phone pane coverage/ink unknown; Roulette history absent (D-02) |
| Legacy / History archive | Finished game totals, Draw label, seasons, league points/goals/positions, EL annotation, SP, paging | Executed frame, 47–47 ten-season browser drawer at both sizes (six EL labels, correct per-manager seasons), actual scale browser; D-01/D-02 | The archive does not show every CL/cup honour per season; no claim of a wrong total solely from an omitted optional label |
| History / SHOWDOWN SO FAR (in game) | Totals, Level/lead copy, seasons played, W/D/L, league/cup/CL/EL attribution | Source `productionSharedHistoryConvergence.js:77`–`87`; actual emulator UI checks for both managers through season 6 passed | Custom mixed-EL browser execution unknown; SP/Roulette not rendered by this panel |
| Standings — Career | Points, season W/D/L, CL/EL/title/cup/trophy totals, level state | Executed `standingsFrames` → common career record; emulator UI correctly excluded live unfinished seasons from Career through season 6 | Custom 47–47 desktop/phone ink and all responsive wording unknown |
| Standings — This Showdown | Same fields isolated to current rivalry, no whole-career mixing | Source `seasonFinalV10.js:232`–`254`; actual emulator UI current-season checks through season 6 passed | Custom mixed-EL DOM execution unknown |
| Rule Book | CL +5, EL +3, league +3, cup +1, capped bonuses, maximum 11, Golden=110 in 10, no SP points, Roulette release rule | Source `ruleBook.js:61`, `:137`–`177`, `:210`–`213`; arithmetic maximum independently worked | Actual expanded Rule Book phone ink / screen reader output unknown; the mutually-exclusive CL/EL sentence was deliberately removed from print at `:158` |
| Final Winner | Draw headline, 47–47, margin 0, ten seasons, final season 11–11 Draw, CL4/EL3/title3/cup5/total15 each | Executed `finalFrame` with verified History, Final Reconciliation and Closed fixtures; returns `ready`, `completed` | Actual custom 47–47 Final Winner desktop and phone Summary DOM checked (Draw, 10 seasons, margin 0, last season drawn); desktop honours checked. Phone Honours ink/tab not exercised |

## Summaries, phone copies, scale and validation

The summary store keeps the reader's full verified answer, hashes it, keys phone records by account/rivalry and rejects other reader versions (`js/careerSummaryStore.js:21`, `:38`–`45`, `:101`–`112`). The loader passes both cached and full answers through the same closed adapter and projection verifier (`js/sparkClosedShowdownCareerLoader.js:85`–`99`; `js/sharedClosedShowdownAdapter.js:47`–`58`). No normal-play path changing a terminal game's scoring data was established; frozen summary/phone data was therefore not labelled stale just because it does not re-fetch immutable seasons. Future reader migrations and an actual supported change to already-closed data remain **unknown**; the current version is 1.

Executed `node tests/contracts/r86-career-summary-scale-contracts.cjs`: **PASS**, 10/30/100 finished ten-season Showdowns × both managers, identical serialized models for full reads, known phone, fresh phone, and repeated opens. Stale-reader versions fall back; failed summary reads retry; denied summaries fall back; pending summary writes do not hold the page. These include the already-fixed r87 read cases and are **not re-reported** as defects.

| Finished ten-season games | First backfill SDK gets / writes | Known phone gets | Fresh phone gets | Known-phone model load (local ms) | Firebase / phone KB per manager |
|---|---|---:|---:|---:|---|
| 10 | 431 / 10 | 1 | 11 | 10 | 128 / 125 |
| 30 | 1,291 / 30 | 1 | 31 | 42 | 383 / 376 |
| 100 | 4,301 / 100 | 1 | 101 | 116 | 1,276 / 1,255 |

These are fake-SDK counts and local elapsed times, **not** actual billed reads or Firebase network latency. Fresh summaries also incur Rules account lookups. No claim that a 100-game cold backfill fits an arbitrary real-phone timeout. Index paging above 500 games is source/test coverage, outside this requested 100-game browser sample.

Browser scale fixture: every game is ten seasons, Daniel scores 5 per season/Nik 0. Expected totals for 10/30/100 games are **500/1,500/5,000 vs 0**, seasons **100/300/1,000**, Daniel CL **100/300/1,000**, completed and Daniel Showdown wins **10/30/100**. Actual Career Statistics/Trophy Room/History renderers received these common verified models. Desktop History mounts four cards per page; its final 100-game page contains 97–100 and shows ten detail rows. Phone mounts 10/30/100 cards but shows the selected card; 99 forward-arrow taps reached #100 and its ten-row detail drawer. No document horizontal overflow was observed. At 100 games the phone pager grew from 44px to 82px but remained inside the viewport. Numeric ink is not uniformly safe: D-05 clips the desktop season total. Phone Trophy Room MORE and hidden comparison/leader tabs were not opened by this scale probe; their scale ink remains unknown.

### Commands and result ledger

Initial evidence ledger retained from report commit `36228a38569bdcc3cd8d480c14e87484c2b9fbf4`; fresh revalidation against the same gameplay head is recorded immediately below. The incomplete CE2PG run was not repeated during revalidation. Temporary probes/artifacts stay outside the committed report.

Executed locally:

```sh
npm install --no-save --package-lock=false firebase@12.17.0 @firebase/rules-unit-testing@5.0.0
npm run test:contracts
node tests/contracts/r86-career-summary-scale-contracts.cjs
node tests/contracts/reus-gate-startup-contracts.cjs  # isolated timeout rerun
# under localhost Firestore emulator, sequentially:
node tests/firebase/career-summary-emulator.cjs
node tests/firebase/completed-showdown-read-emulator.cjs
node tests/firebase/completed-transfer-history-emulator.cjs
CE2PG_PLAN=single CE2PG_SEASONS=10 CE2PG_SCENARIO=draw npm run test:ce2pg
```

- Node v24.19.0; Firebase JS SDK **12.17.0**, Java 21; CLI requested by repository CE2PG **firebase-tools@15.28.1**.
- Full contracts: **266/267 passed; command exited 1** because `tests/contracts/reus-gate-startup-contracts.cjs` exceeded the census subprocess timeout (`spawnSync ... ETIMEDOUT`). **Isolated rerun PASS**, all startup/plate/fallback checks; no source changes or weakened assertions. This is not reported as an all-green single census run.
- Firebase emulator: **PASS, 150 checks** — career-summary 10, completed-Showdown reader 66, completed-transfer reader 74; sequential command exited 0. Tests install the composed production Rules before assertions via the local test environment (the CLI bootstrap warning about no initial Rules file is not the tested Rules state). Summary full-read and fresh-summary models agree for both managers; unjoined codes are excluded, abandoned outcomes are classified, and missing seasons are unavailable rather than shortened. All project IDs are `demo-*`, endpoints localhost.
- Ten-season drawn CE2PG: **FAIL / incomplete**, command exited 1. Run `ce2pg-single-10-1-draw`, 642,788 ms of UI execution, **198/198 recorded checks passed, 0 failed assertions, 2 fatal problem records**. It committed through season 6, reloaded both phones successfully, then stopped in the season-6 career checkpoint on an 8-second `#careerStatisticsRivalryButton` click timeout (`tests/browser/ce2pg-journey.cjs:746`). The two fatal records describe the same stopped journey from Daniel/Nik contexts, not two established independent game defects. Daniel was on Home and Nik on Career Statistics when diagnostics were captured. Root cause **unknown (harness or game)**; not promoted to an extra finding without a repeatable code-path explanation. Viewports: Daniel 393×660, Nik 390×844. Final ten-season closure, storage wipe and fresh-browser end checks were **not reached / unknown**. Local ignored artifact: `test-results/ce2pg-single-10-1-draw.json`. Both `zz.production`, page-error and network checks passed; no production Firebase contact. This is **not** a passing ten-season release proof.
- CE2PG coverage gap: `buildPlanOnce` at `tests/browser/ce2pg-journey.cjs:292`–`330` never generates `europaLeague`; `tally` at `:240`–`252` counts CL/title/cup only. Consequently even a completed default run cannot validate EL arithmetic. The separate mixed-EL arithmetic/frame/browser probes above supply that coverage; this gap is not labelled a new player-facing defect.
- Custom arithmetic/filter probes (including executing this report's embedded Node reproduction verbatim): **PASS** for asserted arithmetic, deduplication, second-ID separation, final frame, Golden controls; D-01/D-02/D-03 reproduced at the module boundary.
- Browser: actual local app and shipped styles, reduced motion, two viewport sizes, all off-origin requests aborted. Models are read-only fixtures, not production-account evidence.

### Fresh revalidation (2026-10-31, same gameplay head)

- **`npm run test:contracts`: PASS, 267/267 in one invocation, exit 0.** This includes the startup contract that timed out in the initial ledger. No assertions or game source changed.
- **Emulator: PASS, 150/150, exit 0**, repeating the three suites above under `demo-cms-r87-d-recheck`, with Firebase JS **12.17.0**, Java 21 and CLI **15.28.1**. Exact invocation:

  ```sh
  npx --yes firebase-tools@15.28.1 emulators:exec --only firestore \
    --project demo-cms-r87-d-recheck \
    'node tests/firebase/career-summary-emulator.cjs && node tests/firebase/completed-showdown-read-emulator.cjs && node tests/firebase/completed-transfer-history-emulator.cjs'
  ```

- **Summary scale: PASS** for both managers at 10/30/100 ten-season games. The local timing column above now records this revalidation's 10/42/116 ms; SDK get/write counts and payload sizes match the initial run. These remain fake-IO timings.
- **Module probes: PASS** for D-01/D-02/D-03, the full arithmetic/prefix/Golden matrix, duplicate suppression, distinct-rivalry isolation, equal ranks despite unequal season wins, and the verified closed Final Winner frame. The embedded reproduction below includes these arithmetic assertions. The separate eleven-valid-game loader probe again gives 10 games, 10 seasons and 50–10 after the oldest ID is excluded.
- **Chromium: D-04/D-05 reproduced** in actual Career Statistics at 10/30/100 games, 1440×900 and 390×844. Desktop Cristiano Ronaldo remains 43px wide with 71px content; the desktop second `1000` still exceeds its clipping ancestor by 8.34px. Phone controls show complete names/numbers. Screenshots were inspected; all off-origin browser requests were aborted. This rerun did not repeat the other screens' original browser probes or the CE2PG journey; their recorded coverage and unknowns above remain unchanged.
- Latest base was re-resolved as `5598c0768067a48a51dc5b2675a5b0701197734b`. Only this Markdown report differs from it. No production Firebase was contacted.

### Minimal reproducible module probes

Run from the repository root with `node` (all imports are local; no network). The helper builds projections through the real History verifier and computes canonical scoring. The independent expected totals are the arithmetic table above, not values copied out of the screen.

```js
const A = require('node:assert/strict');
const {result:r, projection, finalFor} = require('./tests/support/career-fixture-helpers.cjs');
const C = require('./js/sharedCareerAnalytics.js');
const V = require('./js/rivalryLegacyV10.js');
const G = require('./js/careerScreenSeam.js');
const P = r({leaguePosition:1,leaguePoints:100,leagueGoals:100,
  championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
const E = r({europaLeague:true,domesticCup:true}), CL = r({championsLeague:true});
const L = r({leaguePosition:1}), Z = r();
const seasons = [[P,P],[E,CL],[CL,E],[L,E],[E,L],
  [Z,r({leaguePosition:2})],[CL,Z],[Z,CL],[E,E],[P,P]];
const p = projection({seed:'a',totalSeasons:10,seasons});
const done = {rivalryId:p.rivalryId,classification:'completed',projection:p,final:finalFor(p)};
const m = C.buildCareerModel({indexStatus:'ready',showdowns:[done]});
for (const x of Object.values(m.managers)) {
  A.equal(x.careerPoints,47); A.equal(x.totalTrophies,15);
  A.deepEqual([x.seasonWins,x.seasonDraws,x.seasonLosses],[3,4,3]);
  A.equal(x.averageLeaguePoints,68); A.equal(x.averageLeagueGoals,64);
}
A.ok(m.trophyRoom.standings.every(x=>x.level));
A.deepEqual(G.goldenShowdownCounts(m.history.showdowns),{daniel:0,nik:0});
const ended = C.buildCareerModel({indexStatus:'ready',showdowns:[done,{
  rivalryId:'pair_'+'c'.repeat(64),classification:'abandoned',
  ended:{endedAt:Date.parse('2026-10-31'),seasonsPlayed:1}}]});
console.log('D-01',V.toV10Frame(ended,'legacy').showdowns.map(x=>[x.status,x.endedLabel]));
console.log('D-02 History fields',Object.keys(V.toV10Frame(m,'legacy').showdowns[0].seasons[0]));
const rr = require('./js/rosterRoulette.js');
for (let i=1;i<100;i++) {
  const id='pair_1'+i.toString(16).padStart(63,'0');
  const special=require('./js/marqueePlayer.js').forShowdown(id,Date.parse('2026-10-31'));
  const turn=rr.forSeason(id,{playerOne:'Arsenal',playerTwo:'Liverpool'},1,{special});
  if (turn.turns.some(t=>t.fired)) { console.log('D-02 fired',id,turn.turns); break; }
}
for(const [n,pts,wdl,cups] of [[1,11,[0,1,0],3],[3,20,[1,1,1],6],[5,27,[2,1,2],9],[10,47,[3,4,3],15]]){
 const q=projection({seed:'a',totalSeasons:n,seasons:seasons.slice(0,n)});
 const model=C.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:q.rivalryId,classification:'completed',projection:q,final:finalFor(q)}]});
 for(const x of Object.values(model.managers)){A.equal(x.careerPoints,pts);A.equal(x.totalTrophies,cups);A.deepEqual([x.seasonWins,x.seasonDraws,x.seasonLosses],wdl);}
 const gp=projection({seed:'b',totalSeasons:n,seasons:Array.from({length:n},()=>[P,P])});
 const gm=C.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:gp.rivalryId,classification:'completed',projection:gp,final:finalFor(gp)}]});
 A.deepEqual(G.goldenShowdownCounts(gm.history.showdowns),{daniel:n===10?1:0,nik:n===10?1:0});
 console.log('prefix/Golden',n,pts,cups,'PASS');
}
for(const x of Object.values(m.managers)){A.deepEqual([x.championsLeagues,x.europaLeagues,x.leagueTitles,x.domesticCups],[4,3,3,5]);A.equal(x.averageSeasonScore,4.7);}
const dup=C.buildCareerModel({indexStatus:'ready',showdowns:[done,done]});A.equal(dup.managers.daniel.careerPoints,47);
const q=projection({seed:'b',totalSeasons:1,seasons:[[CL,Z]]});
const next=C.buildCareerModel({indexStatus:'ready',showdowns:[done,{rivalryId:q.rivalryId,classification:'completed',projection:q,final:finalFor(q)}]});A.equal(next.managers.daniel.careerPoints,52);A.equal(next.managers.nik.careerPoints,47);A.equal(next.managers.nik.seasons,11);A.equal(next.history.showdowns[0].seasons.length,10);
const tied=projection({seed:'c',totalSeasons:3,seasons:[[CL,Z],[Z,L],[Z,r({domesticCup:true,topScorer:true})]]});
const tiedModel=C.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:tied.rivalryId,classification:'completed',projection:tied,final:finalFor(tied)}]});
A.equal(tiedModel.managers.daniel.careerPoints,5);A.equal(tiedModel.managers.nik.careerPoints,5);A.equal(tiedModel.managers.daniel.seasonWins,1);A.equal(tiedModel.managers.nik.seasonWins,2);
A.deepEqual(require('./js/careerScreensV10.js').toV10Frame(tiedModel,'careerStatistics').expectedCareerTableRows.map(r=>r.rank),[1,1]);
console.log('PASS 47-47 honours, dedup, distinct rivalry isolation, 5-5 ranks despite unequal season wins');
const F=require('./tests/support/active-showdown-fixtures.cjs');
const final=require('./js/seasonFinalV10.js').finalFrame(F.finalReconciliation(p),F.closed(p),F.history(p));
A.equal(final.status,'ready');A.equal(final.state,'completed');A.equal(final.winner,'draw');A.equal(final.outcomeHeadline,'DRAW');A.equal(final.margin,0);A.deepEqual(final.totals,{daniel:47,nik:47});A.deepEqual(final.lastSeason,{season:10,daniel:11,nik:11,winner:'draw'});
for(const x of Object.values(final.trophies))A.deepEqual(x,{championsLeague:4,europaLeague:3,leagueTitles:3,domesticCups:5,total:15});
console.log('PASS verified closed Final Winner 47-47, DRAW, margin 0, last season draw, all honours');

(async()=>{
  const Marker=require('./js/careerStartMarker.js');
  const ids=Array.from({length:11},(_,i)=>'pair_'+(i+1).toString(16).padStart(64,'0'));
  let gets=0;
  const hidden=await Marker.careerHiddenRivalryIds({
    accountId:'acct_daniel',firestore:{},marker:{status:'ready',
      startedAt:Date.parse('2026-10-18T22:00:00Z'),contentHash:'fixture',hiddenRivalryIds:ids},
    firebaseSdk:{doc:(_db,_collection,id)=>id,getDoc:async id=>{
      gets++; return {exists:()=>true,data:()=>({objectType:'rivalry',objectId:id,
        updatedAt:{toMillis:()=>Date.parse('2026-10-18T21:00:00Z')},
        data:{connectionState:'closed',terminalClose:{}}})};
    }}});
  A.equal(gets,10); A.deepEqual(hidden,[ids[0]]);
  console.log('D-03',gets,hidden);
})();
```

The marker probe intentionally supplies only the root fields the exclusion scan reads; it does not claim that `{terminalClose:{}}` passes the completed-reader verifier. The separate executed aggregate probe used eleven copies of the repository's valid `tests/fixtures/saved-showdowns/r79-1season-win.json`, distinct IDs, in the existing scale loader harness and applied that hidden-ID list (50/10 across ten games, asserted).

D-04 browser reproduction: use `tests/browser/r80-short-screens-audit.cjs`'s exported `openScreen(page,"CAREER_STATISTICS")`, feed `openCareerStatistics({model})` a verified model with `setupConfirmedAt=Date.parse("2026-10-31")` and IDs `pair_a` + the hexadecimal game number padded to 63 digits. This deterministically draws Neymar / Cristiano Ronaldo. At 1440×900 inspect visible `.careerTable .spChipName` nodes: compare `scrollWidth` to `clientWidth` and computed `overflow`, then repeat at 390×844. Use the test static server; abort every off-origin browser request. No app alteration is involved.

## Remaining evidence debt and 10/10 condition

Fix and regression-check D-01 through D-05. Then complete the required one ten-season two-phone journey, comparing **every visible value** against emulator/online authoritative data at each career screen and after closure, reload, cleared storage and a fresh phone. Include EL and CL in different seasons, equal totals with unequal season wins, position-different season draws, a Golden control, fired Roulette releases, a Rematch, and enough history to cross paging boundaries. Restore all eligible r79 games without reintroducing pre-r79/test/unjoined/ended games.

Real physical phones, production-account archive completeness, arbitrary mobile network delays, all window sizes, supported post-close data changes and new-reader migration against existing production summaries are **unknown**. No SSJR/MDP score is changed or re-earned by this audit. Earlier History deadline, completed-current summary skip, CE2PG reconnect meter, empty-career Standings wording and summary-get retry findings are not re-reported.

For D-05, on the same 100-game Statistics page, run this read-only browser diagnostic. Nik's second seasons value is the entry with a nonempty `clips` array at 1440×900; the 390×844 sample has none. This checks painted character ranges rather than only DOM contents:

```js
[...document.querySelectorAll('#careerStatistics .headlinePair b')].map(el => {
  const range=document.createRange(); range.selectNodeContents(el);
  const ink=range.getBoundingClientRect(), clips=[];
  for(let a=el.parentElement;a&&a.id!=='careerStatistics';a=a.parentElement){
    const style=getComputedStyle(a), box=a.getBoundingClientRect();
    if(/hidden|clip|auto|scroll/.test(style.overflowX)&&ink.right>box.right+1)
      clips.push({element:a.className,right:box.right,overflow:style.overflowX});
  }
  return {text:el.textContent,inkRight:ink.right,clips};
});
```
