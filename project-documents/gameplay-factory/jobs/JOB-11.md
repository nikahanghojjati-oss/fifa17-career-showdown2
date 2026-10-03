# JOB-11 · Contract fixtures generated from the real model

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm and node; no browser, no emulator needed; writes go through the GitHub connector, CI "Validate Gameplay Fast" runs the suites, see §2) | JOB-03 **and** JOB-05 merged into `gameplay/recovery-v1` (PR #316 and PR #319; both are in `889810f`) | 8 | `gameplay/job-11-contract-fixtures` | `gameplay/recovery-v1` | no |

## 1. Goal

Team V builds every screen on sample data today, and it will swap that sample data for ours (Team V job 104, "Showcase: screens read Team G's model-true fixtures"). If our sample data is typed by hand it will drift from what the app really computes, and the screens will be designed around numbers or states the game can never show. This job makes the sample data **impossible to drift**:

1. **A generator** (`tests/support/data-contract-v1-fixtures.cjs`) builds provider-shaped inputs for 14 scenarios and runs them through the real model: `sharedHistoryConvergence.buildProjection` (which re-checks every score and season winner), the G-5 active Showdown adapter, the G-3 career model, the G-6 Start/Join view model and its nav lock. It writes one JSON file per scenario plus `index.json` and `nav.json` into `tests/fixtures/data-contract-v1/`.
2. **The committed fixtures** (16 JSON files) that Team V reads.
3. **One contract test** that regenerates every fixture and fails if one byte differs from what is committed, validates every fixture against the exact `DATA_CONTRACT_V1` field names, types, enums and value bounds, proves no fixture that represents one manager's view carries the rival's unpublished inputs or any account/profile/save/device id, re-derives every score from the season facts with the unchanged scoring rules, and checks that every screen and both phones show the same numbers.
4. **One-line adapter fix** the generator found: the real pair provider reports an account with no pair link as `managerRole: null, managerId: null` (`js/persistentNikDanielPair.js:148`), and the G-5 adapter's identity guard compared that `null` with the signed-in manager and returned `unavailable`. So a new, signed-in, never-paired manager would see Home **unavailable** instead of Start / Join. JOB-05's own fixture kept `managerId` on the unpaired pair, so its contract never saw the real shape. The fix skips the guard when the pair has no manager yet; the guard still catches a real mismatch.

Plain words: the example data Team V designs with is produced by the same code the app runs, so the screens and the game always agree. If anyone changes the model, the test forces the example data to be regenerated in the same PR.

This job does **not** wire anything into the app (G-13), does not read Firestore (no emulator run), and does not add fields to the contract. It does not touch `index.html`, `service-worker.js`, any Rules file, the startup bundle or any screen script.

## 2. Branches and files

- The lead creates `gameplay/job-11-contract-fixtures` from `gameplay/recovery-v1` at or after `889810f`. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `js/sharedActiveShowdownAdapter.js` and `js/startJoinViewModel.js` both exist there; if not, reply `Job 11 waits for job 5.` and stop.
- **Lane and CI path.** Work mode has node and npm (Java 17, no browser, no `git push`). Everything this job runs is node: `npm ci`, `node --check`, the generator, `npm run test:contracts`, `npm run test:ops`. Save every file through the connector (WORKER_HANDBOOK §7 Path A) and read "Validate Gameplay Fast" on your **exact head commit** after each save (job `Gameplay contracts`; the `Composed Rules on the emulator` job must stay green but this job changes nothing it tests).

Create:

| File | What |
| --- | --- |
| `tests/support/data-contract-v1-fixtures.cjs` | the generator (Appendix A, full file) |
| `tests/contracts/data-contract-v1-fixtures-contracts.cjs` | the contract (Appendix B, full file) |
| `tests/fixtures/data-contract-v1/index.json`, `nav.json` and the 14 scenario files in §4.1 | **generated** by `node tests/support/data-contract-v1-fixtures.cjs --write`; never typed or edited by hand (expected hashes in Appendix E) |

Edit (and only these):

| File | Change |
| --- | --- |
| `js/sharedActiveShowdownAdapter.js` | one condition on line 48 (Appendix C) |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended **last** (Appendix D) |
| `tests/operations/pos20-control-plane.test.mjs` | one const + append it **last** to `expectedSupplementalContracts` (Appendix D) |
| `project-documents/gameplay-factory/status/JOB-11.md` on `factory/gameplay-v1` | status file |

That is 21 code files: 2 new code files, 16 generated JSON files, 3 edits. `git diff --stat origin/gameplay/recovery-v1` (or the PR's "Files changed") must list exactly these 21.

**Other jobs in flight.** JOB-08 and JOB-16 (and JOB-18, if written by then) also append one registry entry and one ops-test const. Whichever job merges later re-applies its own entry as the new **last** item on top of the merged branch, keeping every entry already there (registry order = `expectedSupplementalContracts` order; the ops test `deepEqual`s them). Never drop or reorder another job's entry. The contract count in §5 becomes `N+1` of whatever `N` the branch has when you start.

Read first (on `gameplay/recovery-v1` at `889810f`; line numbers are observations, re-check them):

1. `project-documents/leads/DATA_CONTRACT_V1.md` on branch `leads/relay`: §0 (statuses, managers, scoring, value bounds, interim label), §1 Home, §2 Start/Join, §3 Season Results, §4 Final winner, §5 Rivalry, §6 Career Statistics, §7 Trophy Room, §8 History, §10 top bar. Field names there are binding; a field changes only through a relay message. Also `G2V-005` (`project-documents/leads-relay/archive/G2V-005_view-model-additions.md`): breakdown nesting and the Start/Join additions.
2. `js/sharedActiveShowdownAdapter.js` (149 lines, JOB-05): `inspect` 20-75 and the identity guard on line 48; `career` (the `careerInput` builder) 130-138; `buildActiveShowdownViews` 141; `seasonResultsView` 147.
3. `js/sharedCareerAnalytics.js` (158 lines, JOB-03): `buildCareerModel` 104-156, `seasonRow` 66-69.
4. `js/startJoinViewModel.js` (148 lines, JOB-06): `buildStartJoinViewModel` 101-138, `navLockState` 139-145, `NAV_LOCK_TEXT` 17.
5. `js/careerScreenSeam.js` (153 lines, JOB-04): `careerScreenView` 104-118 (the contract binds every fixture through it).
6. `js/persistentNikDanielPair.js:148` (the real unpaired shape: `managerRole:null, managerId:null`; a closed link is `status:"waiting"` with `connectionState:"closed"`). **Read only.**
7. `tests/support/active-showdown-fixtures.cjs` (JOB-05, provider `getState()` shapes) and `tests/support/career-fixture-helpers.cjs` (JOB-03). The generator reuses both; do not edit them.
8. `data/clubs.js` (club names per league; the generator checks every club it uses is in it). **Read only.**
9. Team V's target: `project-documents/factory/jobs/JOB-104.md` on Team V's branch `factory/v1-wtt5ye` (read only, never write there): it binds Home, Start/Join, Season Results, Final Winner, Rivalry, Career Statistics, Standings, Legacy and Trophy Room, all five states, and the top bar lock to these files.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. Never deploy anything. No Firebase, no emulator, no Rules change in this job.
- Exactly two managers: Daniel = `playerOne` = `daniel` (left), Nik = `playerTwo` = `nik`. Every fixture is keyed `daniel` / `nik`.
- Scoring never changes: Champions League 5, league title 3, domestic cup 1, performance bonus 1 (100+ league points **or** 100+ league goals, never 2), awards bonus 1 (top scorer **or** top assist, never 2), season max 11. Season winner: total, then league position, then league points, else draw. Final: totals only, equal = draw. The generator never computes a score that reaches a fixture: `buildProjection` rejects any score or winner that breaks these rules, and the contract re-derives every one independently (K5).
- **Privacy.** A fixture's `viewers.daniel` subtree is what Daniel's phone would get, and `viewers.nik` is Nik's. Neither ever holds the rival's unpublished season inputs (K4 sentinel), the pairing code (only Daniel, only after he created it), or any `accountId`, `profileId`, `saveId`, `deviceId`, `sessionId`, `capability`, projection or witness object. `career`, `careerInterim` and `checkSource` are shared and hold only accepted seasons both managers already saw. Never add `careerInput` (it carries the projection with account ids) to a fixture.
- **Generated, never typed.** Never edit a file in `tests/fixtures/data-contract-v1/` by hand. Change the generator, run `--write`, save the output. K2 fails on any hand edit.
- **No contract change here.** The contract test's `SPEC` mirrors `DATA_CONTRACT_V1` plus the listed G-announced additions. Do not add, rename or drop a field in `SPEC` or in any `js/` module to make a check pass; if V1 and the model disagree, set BLOCKED (§8).
- **Production code:** only the one condition in Appendix C. The adapter is not loaded by `index.html` or the service worker today (G-13 wires it), so the startup JavaScript budget and the shell are untouched. Do not edit any other `js/` file, `index.html`, `service-worker.js`, `firestore*.rules`, the workflows, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10/POS20/SSJR authority files, or any existing test.
- Never weaken, skip or delete an existing assertion. JOB-05's contract must still print `19/19` after the fix.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 The fixture set (`tests/fixtures/data-contract-v1/`)

| File | Scenario (plain words) | `career.status` | classification (Daniel / Nik) |
| --- | --- | --- | --- |
| `empty-career.json` | Both signed in, never paired: no Showdowns. Start/Join offers Daniel CREATE and Nik JOIN | `empty` | `none` / `none` |
| `loading.json` | The pair provider is still starting | `loading` | `loading` / `loading` |
| `unavailable.json` | The pair provider failed: never drawn as empty or zero | `unavailable` | `unavailable` / `unavailable` |
| `pairing-code-created.json` | Daniel created a code and waits; only his Start/Join view has the code | `empty` | `pending` / `none` |
| `active-first-season.json` | Paired 3-season La Liga Showdown, season 1 not played: 0-0 | `empty` | `active` / `active` |
| `active-mid-season.json` | 5-season Premier League Showdown after 2 seasons; Daniel published season 3, Nik has not (privacy sentinel `leagueGoals: 131`) | `ready` | `active` / `active` |
| `active-results-ready.json` | Same Showdown, both published season 3: both inputs visible to both, not yet committed | `ready` | `active` / `active` |
| `completion-pending.json` | 3-season Bundesliga, every season accepted and reconciled, Terminal Close not yet verified | `ready` | `completion-pending` / same |
| `finished-three-seasons.json` | 3-season La Liga closed by a verified Terminal Close; Daniel wins 15-5 | `ready` | `completed` / `completed` |
| `tiebreak-finish.json` | 3-season Serie A, every season level on points and decided by league position; Daniel wins 2 seasons, Nik 1, final 7-7 is a **draw** | `ready` | `completed` / `completed` |
| `equal-position-tiebreaks.json` | The rare equal league positions the app allows: one season won on league points, one drawn. The only scenario where both share a position | `ready` | `completed` / `completed` |
| `abandoned.json` | 5-season Ligue 1 abandoned after 2 seasons (one perfect Nik season): nothing counts, History row is status-only | `ready` | `abandoned` / `abandoned` |
| `partial-career.json` | Career index with one readable completed Showdown and one known only by its Terminal Close witness: `partial`, 1 of 2 | `partial` | `none` / `none` |
| `multi-showdown-career.json` | Oldest first: Daniel wins a 3-season Premier League Showdown, a Serie A Showdown is abandoned, Nik wins a 1-season La Liga Showdown with a perfect season, a 5-season Bundesliga Showdown is in progress after 2 seasons (the current one) | `ready` | `active` / `active` |
| `nav.json` | `navLockState` for all 13 screen ids, lock text "Finish this step first" | | |
| `index.json` | List of the files with their sha256, career status, classification, and where each screen's data sits | | |

Every scenario except `equal-position-tiebreaks` also follows Team V's "one league table" product truth (`PRODUCT_TRUTH.md` line 27 on Team V's branch: distinct positions, the higher position has more points, one winner per trophy per season), so Team V's own `check_fixtures.py` prints `0 errors` on every file with played seasons, except `equal-position-tiebreaks` by design (K8).

### 4.2 File format (one scenario file)

```text
{ schema: "cms-data-contract-v1-fixture", contractVersion: "1.0", scenario, summary, generator,
  checkSource: [ { ref, totalSeasons, leagueId, state, seasons: [ { daniel: {7 inputs}, nik: {7 inputs} } ] } ],   // Team V check_fixtures.py format; accepted seasons only
  career:        buildCareerModel output with the career-index input G-9 will pass (interimLabel null)          // V1 §6, §7, §8
  careerInterim: buildCareerModel(adapter careerInput) = what screens show before G-9 (interimLabel = exact V1 text)
  viewers: { daniel: View, nik: View } }
View = { classification,                       // fixture metadata: the G-5 classification
         home,                                 // V1 §1 (adapter home)
         startJoin,                            // V1 §2 + G2V-005 (buildStartJoinViewModel)
         seasonResults,                        // V1 §3, the current season (adapter seasonResults)
         seasonResultsBySeason: [ ... ],       // V1 §3 for seasons 1..current (adapter seasonResultsView); [] when no counted Showdown
         finalWinner,                          // V1 §4
         rivalry }                             // V1 §5 (Standings: rivalry + career.trophyRoom.standings)
```

Serialisation is `JSON.stringify(value, null, 2) + "\n"`, key order as the modules produce it. Clubs are real names from `data/clubs.js`; rivalry ids are synthetic `pair_<64 hex>`; the clock for session expiry is fixed (`NOW = 1790000000000`). No timestamps, no randomness.

### 4.3 Requirements and proofs

K ids are the contract's numbered checks (Appendix B, §6).

| # | Requirement | How | Proved by |
| --- | --- | --- | --- |
| R1 | Fixtures come from running the real model, not hand-written JSON | generator calls `buildProjection`, `buildActiveShowdownViews`, `seasonResultsView`, `careerInput`, `buildCareerModel`, `buildStartJoinViewModel`, `navLockState`; no clock, randomness or env | K2 (source + determinism) |
| R2 | Fixtures can never drift from the model | the contract regenerates all 16 files and compares byte for byte; missing, extra or changed file fails; `index.json` hashes match | K2 |
| R3 | Every fixture matches DATA_CONTRACT_V1 exactly | `SPEC`: exact key sets per object, enums, integer/null types, value bounds (§0), status-only abandoned rows, five record labels in order, totals-only final winner and margin | K3 |
| R4 | No rival private/unfinished input and no ids in one manager's view | forbidden-key and id-prefix walk over every file; sentinel 131 visible to Daniel, absent from Nik's views and shared parts; rival inputs `null` before `results-ready`; pairing code only in Daniel's own view | K4 |
| R5 | Scoring never changes | independent re-derivation from `checkSource` of every season score, winner, tiebreak, breakdown, Showdown total and final winner; career totals = sum of counted seasons; abandoned counts for nothing | K5 |
| R6 | Same numbers on every screen and both phones | home score = rivalry score = final totals = history row; rivalry managers = career managers; committed breakdown totals = rivalry season scores; Daniel's and Nik's shared views identical (only `viewerRole` and private parts differ); one-Showdown `career` = adapter path | K6 |
| R7 | Fixtures bind through the G-4 career screen seam | `careerScreenView` keeps each fixture's status for Career Statistics, Trophy Room, Legacy and Rivalry | K7 |
| R8 | The scenarios Team V needs, every state | the 7 required scenarios; all five career statuses; all Season Results phases; both final states; all four tiebreaks; all five history row statuses; both managers win a Showdown; one-league-table truth except the one designed exception | K8 |
| R9 | Real provider shapes reach the adapter | unpaired real shape classifies `none` and Home `ready` for both managers; Nik's identity on Daniel's pair link still `unavailable` | K1 |

### 4.4 The adapter fix (Appendix C)

`js/sharedActiveShowdownAdapter.js` line 48, classification rule 3 (JOB-05 §4):

```text
before: else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&identity.managerId!==pair.managerId))classification="unavailable";
after:  else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&pair.managerId!=null&&identity.managerId!==pair.managerId))classification="unavailable";
```

Nothing else in the file changes. The guard's purpose (a browser whose identity is Nik reading Daniel's pair link) is unchanged and re-proved in K1. JOB-05's contract still passes 19/19 (it never used the null shape).

### 4.5 Existing tests: what must stay untouched

Byte-identical: every file in `js/` except the one line in §4.4, `index.html`, `service-worker.js`, every `firestore*.rules`, every script, every workflow, `CURRENT_PRODUCT_TEST_MANIFEST.json`, `tests/support/active-showdown-fixtures.cjs`, `tests/support/career-fixture-helpers.cjs`, every existing `tests/contracts/*`, `tests/firebase/*`, `tests/browser/*`. Only `tests/operations/pos20-control-plane.test.mjs` changes, by the one registry line.

### 4.6 Traps

- **Byte-exact saves.** The connector must save each generated JSON exactly as `--write` produced it, including the final newline and two-space indentation. If CI says `FAIL K2 … fixtures drifted` but `node tests/support/data-contract-v1-fixtures.cjs --check` prints `OK 16 fixture files match the model` locally, a saved file differs from your local one: re-save the file(s) the local `--check` would name after you pull the branch, or compare the sha256 in `index.json` against Appendix E.
- **Order of saves in step 6.** Save `index.json` last: it holds the hashes of the other 15.
- `node --check` does not apply to JSON; the contract parses every file.
- The static release contract forbids duplicate top-level function names across `js/`; this job adds no `js/` file, so it cannot trip.

## 5. Steps

After each step update `status/JOB-11.md` on `factory/gameplay-v1` with `Job 11 step k/8: <step name>`. Save code to `gameplay/job-11-contract-fixtures` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1` (at or after `889810f`), `npm ci`. Run `npm run test:contracts` (record `N/N`; `102/102` at `889810f`, one more for each of JOB-08 / JOB-16 / JOB-18 already merged) and `npm run test:ops` (record pass/fail; `73/0` at `889810f`). Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1`. If it is red, set BLOCKED: `Job 11 is blocked: recovery-v1 CI is red before any change.`
2. **Map.** Confirm the line numbers in §2 "Read first" and write drift in the Notes. Reproduce the bug and paste the output: `node -e 'const A=require("./js/sharedActiveShowdownAdapter.js");console.log(A.classifyCurrentShowdown({identity:{status:"ready",managerId:"daniel",registered:true},pair:{status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null}}))'` must print `unavailable` today.
3. **Tests first.** Create `tests/contracts/data-contract-v1-fixtures-contracts.cjs` (Appendix B) and apply Appendix D (registry entry last, ops const last). `node --check` the contract. Run it: it must **fail** with `FAIL K1 unpaired real shape is none, not unavailable: daniel`. `npm run test:ops` must still be 0 failures (the registry and the ops list agree). Save. On CI, on your head: `Gameplay contracts` fails only on the new contract (`1/N+1` failed), the emulator job is green. Link that red run: it is your tests-first evidence.
4. **Adapter fix.** Apply Appendix C (one condition). `node --check js/sharedActiveShowdownAdapter.js`. `node tests/contracts/shared-active-showdown-adapter-contracts.cjs` still prints `PASS … (19/19 cases) …`. The step 2 one-liner now prints `none`. The new contract now fails with `Cannot find module '…/tests/support/data-contract-v1-fixtures.cjs'`. Save. Record.
5. **Generator.** Create `tests/support/data-contract-v1-fixtures.cjs` (Appendix A). `node --check` it. Run the contract: it must fail with `FAIL K2 committed fixtures equal a fresh run of the generator: fixtures drifted …`; `node tests/support/data-contract-v1-fixtures.cjs --check` prints `DRIFT missing tests/fixtures/data-contract-v1/index.json; …`. Save. Record.
6. **Generate and save the fixtures.** Run `node tests/support/data-contract-v1-fixtures.cjs --write` (prints `WROTE 16 fixture files to tests/fixtures/data-contract-v1`). Compare the generated `index.json` with Appendix E: every `sha256` should be identical at `889810f`; if any differs, the model on the branch moved since the lead's run: write which scenarios differ in the Notes and continue (the contract, not Appendix E, is the authority). Run `--check` (`OK 16 fixture files match the model`) and the contract (`PASS data contract v1 fixtures contracts (31 checks, 14 scenarios + nav) …`). Save the 15 data files, then `index.json` last. Never edit them by hand.
7. **Full proof.** Locally: `npm run test:contracts` prints `(N+1)/(N+1)` (`103/103` at `889810f`); `npm run test:ops` 0 failures; JOB-05's contract 19/19; the 21 files of §2 are the only changes. On CI, on your exact head: both jobs green; paste the `PASS data contract v1 fixtures contracts …` line and the census line from `Gameplay contracts`.
8. **PR and finish.** Open the PR into `gameplay/recovery-v1` titled `Job 11: contract fixtures generated from the real model`. Body: the §4.1 table, the §4.3 table, the 21 files, the adapter fix in one sentence, the CI run URL on the exact head, and the line "Regenerate with `node tests/support/data-contract-v1-fixtures.cjs --write`; the contract fails if the committed fixtures differ from the model." Fill the Done checklist, set `State: DONE`, save `Job 11 done: Contract fixtures generated from the real model`. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a) and tells Team V where the files are.

## 6. Tests first

### 6.1 Contract test (`tests/contracts/data-contract-v1-fixtures-contracts.cjs`, Appendix B)

No Firebase, no emulator, no network. Runs in `npm run test:contracts` through the registry entry. 31 checks at `889810f` (14 scenario checks in K3).

| Id | Proves |
| --- | --- |
| K1 | real unpaired provider shape (`managerRole/managerId: null`) classifies `none`, Home `ready` / `unpaired`, for both managers; Nik's identity on Daniel's pair link stays `unavailable` |
| K2 | committed fixtures equal a fresh generator run (byte for byte, no missing or extra file); two runs are identical; generator calls the real modules and has no clock/random/env/storage; `index.json` lists every file with its sha256 |
| K3 | nav fixture equals `navLockState` for all 13 screens (exactly 4 locked); every scenario matches `SPEC` = DATA_CONTRACT_V1 §0-§8, §10 plus the G-announced additions (exact keys, enums, types, bounds, status-only abandoned rows, record labels, totals-only final, interim label exact) |
| K4 | no forbidden key or id string in any file; pairing code only in Daniel's Start/Join after creation; sentinel 131 (Daniel's unpublished season 3) visible to Daniel, absent from Nik's view and the shared parts; rival inputs `null` before `results-ready` in every scenario; `checkSource` holds accepted seasons only |
| K5 | every season score, winner, tiebreak, breakdown, Showdown total and final winner re-derives from the season facts with the unchanged rules; career totals are sums of counted seasons; abandoned counts for nothing |
| K6 | home = rivalry = final = history for the current Showdown; rivalry managers = career managers; Daniel and Nik identical except `viewerRole` and private parts; one-Showdown `career` = adapter path |
| K7 | every `career` and `careerInterim` binds through `careerScreenView` without changing status |
| K8 | required scenarios and every state present; one-league-table truth in every scenario except `equal-position-tiebreaks`, which carries `league-points`, `draw`, `none` |

Tests-first states (each one is a step's evidence): step 3 fails at K1; step 4 fails on the missing generator; step 5 fails at K2 (missing fixtures); step 6 passes.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: red CI run from step 3 (URL) failing only `data-contract-v1-fixtures-contracts.cjs` at K1; step 4 missing-module failure; step 5 K2 drift failure.
- [ ] `node tests/contracts/data-contract-v1-fixtures-contracts.cjs` PASS (31 checks, 14 scenarios + nav); `node tests/support/data-contract-v1-fixtures.cjs --check` prints `OK 16 fixture files match the model`.
- [ ] `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures; `shared-active-showdown-adapter-contracts.cjs` still 19/19.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), both jobs.
- [ ] `index.json` sha256 rows equal Appendix E, or the differing scenarios are named in the Notes with the reason.
- [ ] No fixture edited by hand; no `careerInput`, projection, witness or id in any fixture; pairing code only in Daniel's own view.
- [ ] Only the 21 §2 files changed; the only `js/` change is the one condition in `js/sharedActiveShowdownAdapter.js`; `index.html`, `service-worker.js`, Rules, workflows and existing tests unchanged; registry entry and ops const are last, every other job's entry kept.
- [ ] No deploy, nothing pushed to `main`, nothing merged.
- [ ] PR open into `gameplay/recovery-v1` with the §4.1 and §4.3 tables and the regenerate line. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing `FAIL K… :` line and the last 30 lines of output into the status file, save, and reply `Job 11 is blocked: <one line>`.

Known traps:

- **K2 fails on CI but `--check` passes locally.** A connector save changed bytes (§4.6). Re-save the named files exactly.
- **K3 fails with `… keys` after the branch moved.** A module on the branch now emits a field V1 does not name (or drops one). Do not edit `SPEC` or the module: set BLOCKED with the key path; the lead decides whether it needs a relay message to Team V.
- **`buildProjection` throws `HISTORY_CONVERGENCE_…` during `--write`.** A scenario input broke a value bound or a rule. You did not change the inputs, so the model changed: BLOCKED with the code.
- **The ops test `POS20 supplemental registry owns all registered contracts` fails.** The registry entry and the ops list disagree in order: both must end with this job's entry, after every other entry already on the branch.
- **K6 "one-Showdown career equals the adapter path" fails.** The adapter's `careerInput` and the career-index entries diverged; BLOCKED, do not touch either module.
- **JOB-05 contract fails after step 4.** You changed more than the one condition. Re-apply Appendix C exactly.

## 8a. Lead decisions (2026-10-03)

- **The adapter fix is in this job.** Without it the `empty-career`, `pairing-code-created` (Nik) and `partial-career` fixtures would tell Team V that a signed-in, unpaired manager sees Home `unavailable`, and G-13 would ship that. It is one condition in a module the live app does not load yet, proved by K1 and by JOB-05's unchanged 19/19.
- **Location and format:** `tests/fixtures/data-contract-v1/` on `gameplay/recovery-v1`, one file per scenario, plain JSON, read-only for Team V (raw link `https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/gameplay/recovery-v1/tests/fixtures/data-contract-v1/index.json`). The lead names it to Team V in a `G2V` message after merge (Team V job 104 waits for that message).
- **Two career objects per scenario.** `career` is the launch shape (career index, no interim label), `careerInterim` is what screens show before G-9 (current Showdown only, exact interim label). Both are real model output.
- **`checkSource`** uses Team V's `check_fixtures.py` format so Team V can check our files with its own tool; it holds accepted seasons only.
- **Model behaviours the fixtures show and this job does not change** (the lead files follow-ups; do not "fix" them here): `seasonResults.status` is `loading` with `phase: null` when there is no counted Showdown; after a Showdown closes (completed or abandoned) the pair link reads `status: "waiting", connectionState: "closed"`, so Home `continue.state` is `waiting` and Start/Join offers no CREATE / JOIN; a career whose only Showdown was abandoned is `ready` with zeros (not `empty`); Home `tiles.*` (V1 §1) and transfer summaries (V1 §5) are not produced by any model yet (G-13, G-10).
- **Branch base moved.** The reference ran on `889810f`; `gameplay/recovery-v1` is now `843e64e` (JOB-08 merged, which appended its own registry entry and const). Your branch is cut from `843e64e`: append this job's entry and const after JOB-08's, keeping JOB-08's. The code files of this job are not touched by JOB-08.
- **Tiebreak scenario stays.** DATA_CONTRACT_V1 names the `league-points` and `draw` tiebreaks, so keep them in the one labelled `equal-position-tiebreaks` scenario even though Team V's one-league-table rule makes them unreachable in normal play; the two `check_fixtures.py` errors there are expected and must be listed in the PR body.
- No Codex review (RULES.md list).

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `889810f` (node 22.22.0, npm ci). Results: `npm run test:contracts` `103/103`; `npm run test:ops` 73 pass / 0 fail; `node tests/contracts/data-contract-v1-fixtures-contracts.cjs` `PASS … (31 checks, 14 scenarios + nav)`; `shared-active-showdown-adapter-contracts.cjs` 19/19 after the fix; `--check` OK on a second run; the 21-file diff of §2 and nothing else. Tests-first states verified (K1 fails without the fix; missing-module failure without the generator; K2 drift without the fixtures). Mutations verified to fail: a hand edit to one fixture (K2), a missing fixture (K2), the adapter fix reverted (K1), an extra model field (K3), an extra private key (K3), Daniel's season 3 input injected into Nik's view (K4), two cup winners in one season (K8), an out-of-bounds input (`buildProjection` throws `HISTORY_CONVERGENCE_RESULTS_INVALID`). Team V's `check_fixtures.py` (read from `factory/v1-wtt5ye`, not committed anywhere): `0 errors` on all 8 files with played seasons except `equal-position-tiebreaks` (2 errors, equal positions, by design); files without played seasons have no `checkSource` rows to check. Not run by the lead: GitHub CI (your step 3-7 runs are the first), Node 24 (CI's version; JSON number formatting is identical across V8 versions, so hashes should match), any browser or Team V binding. Apply the appendices as given; if a hunk does not apply because the branch moved, re-apply by hand and say so in the Notes.

### Appendix A. Generator: `tests/support/data-contract-v1-fixtures.cjs` (full file)

````js
"use strict";
// G-11: DATA_CONTRACT_V1 fixtures generated by running the real career model and adapters.
// Usage: node tests/support/data-contract-v1-fixtures.cjs --write   (regenerate tests/fixtures/data-contract-v1)
//        node tests/support/data-contract-v1-fixtures.cjs --check   (exit 1 if the committed files differ)
// Nothing here is hand-written view data: every view comes from js/ modules; this file only builds provider-shaped inputs.
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const ROOT=path.join(__dirname,"../..");
const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js"));
const Adapter=require(path.join(ROOT,"js/sharedActiveShowdownAdapter.js"));
const StartJoin=require(path.join(ROOT,"js/startJoinViewModel.js"));
const {score,winner,result}=require("./career-fixture-helpers.cjs");
const F=require("./active-showdown-fixtures.cjs");

const OUT_DIR="tests/fixtures/data-contract-v1";
const SCHEMA="cms-data-contract-v1-fixture";
const CONTRACT_VERSION="1.0";
const GENERATOR="tests/support/data-contract-v1-fixtures.cjs";
const NOW=1790000000000; // fixed clock for the Start/Join session expiry check
const SCREEN_IDS=Object.freeze(["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]);
const VIEWERS=Object.freeze(["daniel","nik"]);
const CLUBS=(()=>{const src=fs.readFileSync(path.join(ROOT,"data/clubs.js"),"utf8");return vm.runInNewContext(src+"\n;clubsByLeague",{});})();

function club(leagueId,name){if(!CLUBS[leagueId]||!CLUBS[leagueId].includes(name))throw new Error("FIXTURE_CLUB_UNKNOWN "+leagueId+" "+name);return name;}
function rid(seed){return "pair_"+seed.repeat(64);}
// Real History.buildProjection; it re-verifies every score and season winner, so a wrong helper value throws.
function projectionOf({seed,leagueId,totalSeasons,clubs,seasons}){
  const rivalryId=rid(seed),hash=n=>"sha256:"+seed.repeat(8)+String(n).padStart(56,"0");
  return History.buildProjection({rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,leagueId,clubs:{playerOne:club(leagueId,clubs[0]),playerTwo:club(leagueId,clubs[1])}},
    managerSlots:[{slotId:"playerOne",accountId:"acct_daniel",profileId:"profile_"+"a".repeat(24),saveId:"save_"+"a".repeat(24),entitlementState:"active"},{slotId:"playerTwo",accountId:"acct_nik",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"b".repeat(24),entitlementState:"active"}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
const roleOf=viewer=>viewer==="nik"?"playerTwo":"playerOne";
function session(state){return state?{status:"ready",busy:false,sessionId:F.SESSION,sessionState:state,expiresAtEpochMs:NOW+3600000,pendingAction:null}:null;}

// One Showdown described once; snapshots per viewer are derived from it.
// kind: none | loading | unavailable | pending | active | completion-pending | completed | abandoned | witness-only
function showdown(def){return Object.freeze({...def});}
function multiOf(def){
  if(!def.p)return F.multi({rivalryId:rid(def.seed),leagueId:def.leagueId,totalSeasons:def.totalSeasons,clubs:{playerOne:def.clubs[0],playerTwo:def.clubs[1]},acceptedSeasons:0,acceptedRevisionKey:""});
  return F.multiFor(def.p);
}
function seasonResultsFor(def,viewer){
  const cur=def.current;if(!cur)return null;
  const role=roleOf(viewer),other=role==="playerOne"?"playerTwo":"playerOne";
  const mine=cur[role]||null,theirs=cur[other]||null;
  const published=["playerOne","playerTwo"].filter(r=>cur[r]);
  const ready=published.length===2;
  // Mirrors the real provider: the rival's result is present only once RESULTS_READY.
  return F.seasonResults({rivalryId:rid(def.seed),seasonNumber:cur.season,managerRole:role,phase:ready?"RESULTS_READY":"COLLECTING",published,own:mine,opponent:ready?theirs:null});
}
function snapshotFor(def,viewer){
  const identity=F.identity(viewer);
  if(def.kind==="loading")return {identity,pair:{...F.pair(null,{managerId:viewer}),status:"idle",initialized:false,rivalryId:null,connectionState:null}};
  if(def.kind==="unavailable")return {identity,pair:{...F.pair(null,{managerId:viewer}),status:"unavailable",rivalryId:null,connectionState:null,managerRole:null,managerId:null}};
  if(def.kind==="none")return {identity,pair:{...F.pair(null,{managerId:viewer}),status:"unpaired",rivalryId:null,connectionState:null,managerRole:null,managerId:null}};
  const id=rid(def.seed);
  if(def.kind==="pending"){
    if(viewer==="nik")return {identity,pair:{...F.pair(null,{managerId:"nik"}),status:"unpaired",rivalryId:null,connectionState:null,managerRole:null,managerId:null}};
    return {identity,pair:F.pair(id,{managerId:"daniel",status:"waiting",connectionState:"pending-pair",capability:"CMS17-"+id})};
  }
  const s={identity,pair:F.pair(id,{managerId:viewer}),multiSeason:multiOf(def),history:def.p?F.history(def.p):null,finalReconciliation:null,terminalClose:null,seasonResults:seasonResultsFor(def,viewer)};
  if(def.kind==="completion-pending"){s.finalReconciliation=F.finalReconciliation(def.p);s.terminalClose={phase:"READY",rivalryId:id,terminal:false};}
  if(def.kind==="completed"||def.kind==="witness-only"){s.pair=F.pair(id,{managerId:viewer,status:"waiting",connectionState:"closed"});s.finalReconciliation=F.finalReconciliation(def.p);s.terminalClose=F.closed(def.p);}
  if(def.kind==="witness-only"){s.history=null;s.multiSeason=null;s.finalReconciliation=null;}
  if(def.kind==="abandoned")s.pair=F.pair(id,{managerId:viewer,status:"waiting",connectionState:"closed"});
  return s;
}
function sessionFor(def){return def.kind==="active"||def.kind==="completion-pending"?session("active"):null;}
function plain(value){return JSON.parse(JSON.stringify(value));}
function seasonNumbersFor(def){
  if(!def.p&&!def.current)return [];
  const accepted=def.p?def.p.acceptedSeasons:0,current=def.current?def.current.season:accepted===0&&def.kind==="active"?1:0;
  const n=Math.max(accepted,current);return Array.from({length:n},(_,i)=>i+1);
}
function viewerViews(def,viewer){
  const snap=snapshotFor(def,viewer);
  const v=Adapter.buildActiveShowdownViews(snap);
  return {
    classification:v.classification,
    home:plain(v.home),
    startJoin:plain(StartJoin.buildStartJoinViewModel({identity:snap.identity,pair:snap.pair,session:sessionFor(def),nowEpochMs:NOW})),
    seasonResults:plain(v.seasonResults),
    seasonResultsBySeason:(["active","completion-pending","completed"].includes(v.classification)?seasonNumbersFor(def):[]).map(k=>plain(Adapter.seasonResultsView(snap,{season:k}))),
    finalWinner:plain(v.finalWinner),
    rivalry:plain(v.rivalry)
  };
}
// Career index entries exactly as the adapter emits them for each Showdown (oldest first).
function careerEntries(defs){
  const entries=[];
  for(const def of defs)for(const entry of Adapter.careerInput(snapshotFor(def,"daniel")).showdowns)entries.push(entry);
  return entries;
}
function careerIndexStatus(defs){const k=defs.length===1?defs[0].kind:null;return k==="loading"?"loading":k==="unavailable"?"unavailable":"ready";}
function checkSourceFor(defs){
  const state={completed:"completed","completion-pending":"completion-pending",active:"active",abandoned:"abandoned"};
  return defs.filter(def=>def.p&&state[def.kind]).map(def=>({ref:def.ref,totalSeasons:def.totalSeasons,leagueId:def.leagueId,state:state[def.kind],
    seasons:def.p.seasonHistory.map(item=>Object.fromEntries([["daniel",item.playerOne],["nik",item.playerTwo]].map(([m,r])=>[m,{leaguePosition:r.leaguePosition,leaguePoints:r.leaguePoints,leagueGoals:r.leagueGoals,domesticCup:r.domesticCup,championsLeague:r.championsLeague,topScorer:r.topScorer,topAssist:r.topAssist}])))}));
}

// ---- Scenario inputs (season facts only; scoring, winners and every view come from js/) ----
const R=result;
function scenarios(){
  const pl=["Arsenal","Chelsea"],la=["Barcelona","Real Madrid"],bl=["Bayern Munich","Borussia Dortmund"],sa=["Juventus","Napoli"],l1=["Lyon","Marseille"];
  const perfect=R({leaguePosition:1,leaguePoints:101,leagueGoals:104,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
  const mid={seed:"6",ref:"active-mid-season",leagueId:"premier_league",totalSeasons:5,clubs:pl,seasons:[[R({leaguePosition:1,leaguePoints:89,leagueGoals:85,domesticCup:true}),R({leaguePosition:2,leaguePoints:84,leagueGoals:78,topScorer:true})],[R({leaguePosition:3,leaguePoints:74,leagueGoals:70}),R({leaguePosition:1,leaguePoints:91,leagueGoals:88,championsLeague:true})]]};
  const midP=projectionOf(mid);
  // Daniel's unpublished-to-Nik season 3 result: leagueGoals 131 is a sentinel used nowhere else.
  const danielS3=R({leaguePosition:2,leaguePoints:86,leagueGoals:131,topAssist:true}),nikS3=R({leaguePosition:4,leaguePoints:70,leagueGoals:66});
  const done3={seed:"9",ref:"finished-three-seasons",leagueId:"laliga",totalSeasons:3,clubs:la,seasons:[[R({leaguePosition:1,leaguePoints:93,leagueGoals:112,championsLeague:true,topScorer:true}),R({leaguePosition:2,leaguePoints:90,leagueGoals:99,domesticCup:true})],[R({leaguePosition:2,leaguePoints:84,leagueGoals:80,domesticCup:true}),R({leaguePosition:1,leaguePoints:88,leagueGoals:86,topAssist:true})],[R({leaguePosition:1,leaguePoints:100,leagueGoals:95}),R({leaguePosition:3,leaguePoints:76,leagueGoals:71})]]};
  // Every season level on points and decided by league position (one league table: positions differ). Final 7-7 is a draw although Daniel won 2 of 3 seasons.
  const tie={seed:"a",ref:"tiebreak-finish",leagueId:"serie_a",totalSeasons:3,clubs:sa,seasons:[[R({leaguePosition:2,leaguePoints:82,leagueGoals:74,domesticCup:true}),R({leaguePosition:3,leaguePoints:78,leagueGoals:80,topScorer:true})],[R({leaguePosition:2,leaguePoints:84,leagueGoals:104,domesticCup:true,topScorer:true}),R({leaguePosition:1,leaguePoints:88,leagueGoals:86})],[R({leaguePosition:1,leaguePoints:90,leagueGoals:84}),R({leaguePosition:2,leaguePoints:85,leagueGoals:101,domesticCup:true,topAssist:true})]]};
  // The app does not block equal league positions: one season won on league points, one drawn. The only scenario with equal positions.
  const eq={seed:"7",ref:"equal-position-tiebreaks",leagueId:"premier_league",totalSeasons:3,clubs:["Tottenham Hotspur","Leicester City"],seasons:[[R({leaguePosition:3,leaguePoints:70,leagueGoals:64}),R({leaguePosition:3,leaguePoints:72,leagueGoals:61})],[R({leaguePosition:5,leaguePoints:60,leagueGoals:55}),R({leaguePosition:5,leaguePoints:60,leagueGoals:55})],[R({leaguePosition:1,leaguePoints:90,leagueGoals:88}),R({leaguePosition:2,leaguePoints:86,leagueGoals:80})]]};
  const pend={seed:"8",ref:"completion-pending",leagueId:"bundesliga",totalSeasons:3,clubs:bl,seasons:[[R({leaguePosition:1,leaguePoints:82,leagueGoals:92}),R({leaguePosition:2,leaguePoints:79,leagueGoals:85})],[R({leaguePosition:2,leaguePoints:75,leagueGoals:80,domesticCup:true}),R({leaguePosition:1,leaguePoints:84,leagueGoals:90,championsLeague:true})],[R({leaguePosition:1,leaguePoints:85,leagueGoals:101,topScorer:true}),R({leaguePosition:3,leaguePoints:70,leagueGoals:66})]]};
  const ab={seed:"b",ref:"abandoned",leagueId:"ligue_1",totalSeasons:5,clubs:l1,seasons:[[R({leaguePosition:2,leaguePoints:78,leagueGoals:74}),perfect],[R({leaguePosition:1,leaguePoints:88,leagueGoals:81,domesticCup:true}),R({leaguePosition:2,leaguePoints:83,leagueGoals:79})]]};
  const careerA={seed:"c",ref:"career-showdown-1",leagueId:"premier_league",totalSeasons:3,clubs:["Liverpool","Manchester City"],seasons:[[R({leaguePosition:1,leaguePoints:95,leagueGoals:102,championsLeague:true}),R({leaguePosition:2,leaguePoints:88,leagueGoals:90})],[R({leaguePosition:1,leaguePoints:91,leagueGoals:89,topScorer:true}),R({leaguePosition:3,leaguePoints:77,leagueGoals:72,domesticCup:true})],[R({leaguePosition:2,leaguePoints:84,leagueGoals:83}),R({leaguePosition:1,leaguePoints:90,leagueGoals:86})]]};
  const careerB={seed:"d",ref:"career-showdown-2",leagueId:"serie_a",totalSeasons:5,clubs:["Inter Milan","Milan"],seasons:[[R({leaguePosition:3,leaguePoints:72,leagueGoals:66}),R({leaguePosition:1,leaguePoints:114,leagueGoals:120,championsLeague:true,domesticCup:true,topScorer:true})]]};
  const careerC={seed:"e",ref:"career-showdown-3",leagueId:"laliga",totalSeasons:1,clubs:["Atlético Madrid","Sevilla"],seasons:[[R({leaguePosition:2,leaguePoints:86,leagueGoals:79}),perfect]]};
  const careerD={seed:"f",ref:"career-showdown-4",leagueId:"bundesliga",totalSeasons:5,clubs:["Schalke 04","Wolfsburg"],seasons:[[R({leaguePosition:1,leaguePoints:80,leagueGoals:88,domesticCup:true}),R({leaguePosition:2,leaguePoints:78,leagueGoals:82})],[R({leaguePosition:5,leaguePoints:58,leagueGoals:55}),R({leaguePosition:1,leaguePoints:87,leagueGoals:90,topAssist:true})]]};
  const partialX={seed:"1",ref:"partial-readable",leagueId:"ligue_1",totalSeasons:1,clubs:["Lille","Bordeaux"],seasons:[[R({leaguePosition:1,leaguePoints:84,leagueGoals:77}),R({leaguePosition:2,leaguePoints:80,leagueGoals:73,domesticCup:true})]]};
  const partialY={seed:"2",ref:"partial-unreadable",leagueId:"premier_league",totalSeasons:1,clubs:["Everton","Watford"],seasons:[[R({leaguePosition:6,leaguePoints:62,leagueGoals:58}),R({leaguePosition:7,leaguePoints:60,leagueGoals:55})]]};
  const P=def=>({...def,p:projectionOf(def)});
  const list=[
    {id:"empty-career",summary:"Both managers signed in, never paired: no Showdowns. Career screens are empty, Start/Join offers Daniel CREATE and Nik JOIN.",showdowns:[showdown({kind:"none"})]},
    {id:"loading",summary:"The pair provider is still starting: every screen is loading.",showdowns:[showdown({kind:"loading"})]},
    {id:"unavailable",summary:"The pair provider failed: every screen is unavailable (never drawn as empty or zero).",showdowns:[showdown({kind:"unavailable"})]},
    {id:"pairing-code-created",summary:"Daniel created a pairing code and waits for Nik. Only Daniel's Start/Join view carries the code.",showdowns:[showdown({kind:"pending",seed:"5"})]},
    {id:"active-first-season",summary:"Paired 3-season La Liga Showdown, season 1 not yet played: 0-0, rivalry empty.",showdowns:[showdown({kind:"active",seed:"4",ref:"active-first-season",leagueId:"laliga",totalSeasons:3,clubs:["Valencia","Villarreal"],p:null,current:{season:1}})]},
    {id:"active-mid-season",summary:"Paired 5-season Premier League Showdown after 2 seasons; Daniel published season 3, Nik has not. Nik's views never contain Daniel's season 3 inputs.",showdowns:[showdown({kind:"active",...mid,p:midP,current:{season:3,playerOne:danielS3}})],sentinel:{owner:"daniel",rival:"nik",value:131}},
    {id:"active-results-ready",summary:"Same Showdown; both managers published season 3 (RESULTS_READY): both inputs visible to both, breakdown not yet committed.",showdowns:[showdown({kind:"active",...mid,p:midP,current:{season:3,playerOne:danielS3,playerTwo:nikS3}})]},
    {id:"completion-pending",summary:"3-season Bundesliga Showdown, every season accepted and reconciled, Terminal Close not yet verified.",showdowns:[showdown({kind:"completion-pending",...P(pend)})]},
    {id:"finished-three-seasons",summary:"3-season La Liga Showdown closed by a verified Terminal Close; Daniel wins.",showdowns:[showdown({kind:"completed",...P(done3)})]},
    {id:"tiebreak-finish",summary:"3-season Serie A Showdown, every season level on points and decided by league position; Daniel wins 2 seasons, Nik 1, but the final is a 7-7 draw (season tiebreaks never decide the final).",showdowns:[showdown({kind:"completed",...P(tie)})]},
    {id:"equal-position-tiebreaks",summary:"3-season Premier League Showdown with the rare equal league positions the app allows: season 1 won on league points, season 2 a draw, season 3 decides it. The only scenario where both managers share a league position.",showdowns:[showdown({kind:"completed",...P(eq)})]},
    {id:"abandoned",summary:"5-season Ligue 1 Showdown abandoned after 2 seasons (including a perfect Nik season): nothing counts, History shows a status-only row.",showdowns:[showdown({kind:"abandoned",...P(ab)})]},
    {id:"partial-career",summary:"Career index with one readable completed Showdown and one whose seasons cannot be read (only its Terminal Close witness is known): career is partial, 1 of 2 readable. No current Showdown.",showdowns:[showdown({kind:"completed",...P(partialX)}),showdown({kind:"witness-only",...P(partialY)}),showdown({kind:"none"})]},
    {id:"multi-showdown-career",summary:"Four Showdowns oldest first: Daniel wins a 3-season Premier League Showdown, a Serie A Showdown is abandoned, Nik wins a 1-season La Liga Showdown with a perfect season, and a 5-season Bundesliga Showdown is in progress after 2 seasons (the current one).",showdowns:[showdown({kind:"completed",...P(careerA)}),showdown({kind:"abandoned",...P(careerB)}),showdown({kind:"completed",...P(careerC)}),showdown({kind:"active",...P(careerD),current:{season:3}})]}
  ];
  return list;
}

function buildScenario(sc){
  const defs=sc.showdowns,current=defs[defs.length-1],history=defs.filter(def=>def.kind!=="none"||defs.length===1);
  const indexDefs=history.filter(def=>def.kind!=="none");
  const career=Career.buildCareerModel({indexStatus:careerIndexStatus(history),showdowns:careerEntries(indexDefs)});
  const careerInterim=Career.buildCareerModel(Adapter.careerInput(snapshotFor(current,"daniel")));
  return {
    schema:SCHEMA,contractVersion:CONTRACT_VERSION,scenario:sc.id,summary:sc.summary,generator:GENERATOR,
    checkSource:checkSourceFor(indexDefs),
    career:plain(career),
    careerInterim:plain(careerInterim),
    viewers:Object.fromEntries(VIEWERS.map(viewer=>[viewer,viewerViews(current,viewer)]))
  };
}
function navFixture(){
  return {schema:SCHEMA,contractVersion:CONTRACT_VERSION,scenario:"nav",summary:"Top bar lock state for every screen id (DATA_CONTRACT_V1 section 10), from navLockState.",generator:GENERATOR,lockText:StartJoin.NAV_LOCK_TEXT,screens:Object.fromEntries(SCREEN_IDS.map(id=>[id,plain(StartJoin.navLockState(id))]))};
}
function serialize(value){return JSON.stringify(value,null,2)+"\n";}
function sha256(text){return "sha256:"+crypto.createHash("sha256").update(text).digest("hex");}
// Returns {relativePath: fileText} for every committed fixture file, in a fixed order.
function buildDataContractFixtures(){
  const files={},rows=[];
  for(const sc of scenarios()){
    const fixture=buildScenario(sc),text=serialize(fixture),file=sc.id+".json";
    files[OUT_DIR+"/"+file]=text;
    rows.push({id:sc.id,file,summary:sc.summary,careerStatus:fixture.career.status,classification:{daniel:fixture.viewers.daniel.classification,nik:fixture.viewers.nik.classification},sha256:sha256(text)});
  }
  const navText=serialize(navFixture());files[OUT_DIR+"/nav.json"]=navText;
  const index={schema:SCHEMA,contractVersion:CONTRACT_VERSION,generator:GENERATOR,regenerate:"node "+GENERATOR+" --write",
    screens:{home:"viewers.<manager>.home",startJoin:"viewers.<manager>.startJoin",seasonResults:"viewers.<manager>.seasonResults and seasonResultsBySeason[]",finalWinner:"viewers.<manager>.finalWinner",rivalryStatistics:"viewers.<manager>.rivalry",careerStatistics:"career (managers, biggestShowdownWin, coverage)",trophyRoom:"career.trophyRoom",history:"career.history",standings:"career.trophyRoom.standings and viewers.<manager>.rivalry",interim:"careerInterim (current Showdown only, before career history is wired)",nav:"nav.json"},
    scenarios:rows,nav:{file:"nav.json",sha256:sha256(navText)}};
  return {[OUT_DIR+"/index.json"]:serialize(index),...files};
}
function committedFixtureFiles(root=ROOT){
  const dir=path.join(root,OUT_DIR);if(!fs.existsSync(dir))return {};
  return Object.fromEntries(fs.readdirSync(dir).sort().map(name=>[OUT_DIR+"/"+name,fs.readFileSync(path.join(dir,name),"utf8")]));
}
function diffFixtures(root=ROOT){
  const want=buildDataContractFixtures(),have=committedFixtureFiles(root),problems=[];
  for(const file of Object.keys(want))if(!(file in have))problems.push("missing "+file);else if(have[file]!==want[file])problems.push("differs "+file);
  for(const file of Object.keys(have))if(!(file in want))problems.push("unexpected "+file);
  return problems;
}
module.exports={OUT_DIR,SCHEMA,CONTRACT_VERSION,SCREEN_IDS,VIEWERS,NOW,scenarios,snapshotFor,buildScenario,buildDataContractFixtures,committedFixtureFiles,diffFixtures};

if(require.main===module){
  const mode=process.argv[2];
  if(mode==="--write"){
    const files=buildDataContractFixtures(),dir=path.join(ROOT,OUT_DIR);
    fs.mkdirSync(dir,{recursive:true});
    for(const name of fs.readdirSync(dir))if(!(OUT_DIR+"/"+name in files))fs.unlinkSync(path.join(dir,name));
    for(const [file,text] of Object.entries(files))fs.writeFileSync(path.join(ROOT,file),text);
    console.log("WROTE "+Object.keys(files).length+" fixture files to "+OUT_DIR);
  }else if(mode==="--check"){
    const problems=diffFixtures();
    if(problems.length){console.error("DRIFT "+problems.join("; ")+". Run: node "+GENERATOR+" --write");process.exit(1);}
    console.log("OK "+Object.keys(buildDataContractFixtures()).length+" fixture files match the model");
  }else{console.error("Usage: node "+GENERATOR+" --write | --check");process.exit(2);}
}
````

### Appendix B. Contract: `tests/contracts/data-contract-v1-fixtures-contracts.cjs` (full file; K ids in §6.1)

````js
"use strict";
// G-11 contract: the DATA_CONTRACT_V1 fixtures in tests/fixtures/data-contract-v1 are exactly what the real model
// produces (K2), match the V1 field contract exactly (K3), never carry a rival's private inputs (K4), keep scoring
// unchanged (K5), agree across screens and managers (K6), bind through the G-4 seam (K7) and cover every state (K8).
// A field changes only through a relay message: change SPEC below in the same PR as that message, never alone.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.join(__dirname,"../..");
const Adapter=require(path.join(ROOT,"js/sharedActiveShowdownAdapter.js"));
const Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
const StartJoin=require(path.join(ROOT,"js/startJoinViewModel.js"));
const CONTRACT_VERSION="1.0";
const DIR="tests/fixtures/data-contract-v1";
const INTERIM="Current Showdown only. Career history is not yet available.";
const STATUS5=["loading","empty","unavailable","partial","ready"];
const MANAGERS=["daniel","nik"];
const TEAMS={premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20};
const INPUT_KEYS=["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"];
const REQUIRED_SCENARIOS=["empty-career","active-mid-season","finished-three-seasons","abandoned","tiebreak-finish","equal-position-tiebreaks","multi-showdown-career"];
let checks=0;
function check(name,fn){try{fn();checks+=1;}catch(error){console.error("FAIL "+name+": "+error.message);throw error;}}
const keysOf=o=>Object.keys(o);
function exact(o,keys,where){assert.ok(o&&typeof o==="object"&&!Array.isArray(o),where+" is not an object");assert.deepEqual(keysOf(o).slice().sort(),keys.slice().sort(),where+" keys");}
const isInt=v=>Number.isInteger(v);
const oneOf=(v,list,where)=>assert.ok(list.includes(v),where+" = "+JSON.stringify(v)+" not in "+JSON.stringify(list));
const intOrNull=(v,where)=>assert.ok(v===null||isInt(v),where+" int or null");
const numOrNull=(v,where)=>assert.ok(v===null||(typeof v==="number"&&Number.isFinite(v)),where+" number or null");
function walk(value,visit,trail="$"){visit(value,trail);if(value&&typeof value==="object")for(const [k,v] of Object.entries(value))walk(v,visit,trail+"."+k);}

// ---------- K1. Real provider shapes reach the adapter (regression for the unpaired identity guard) ----------
check("K1 unpaired real shape is none, not unavailable",()=>{
  // js/persistentNikDanielPair.js pairInitialize: an account with no pair link has managerRole:null and managerId:null.
  for(const viewer of MANAGERS){
    const identity={status:"ready",initialized:true,busy:false,online:true,managerId:viewer,registered:true};
    const pair={status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,capability:null};
    assert.equal(Adapter.classifyCurrentShowdown({identity,pair}),"none",viewer);
    assert.equal(Adapter.homeView({identity,pair}).status,"ready",viewer);
    assert.equal(Adapter.homeView({identity,pair}).continue.state,"unpaired",viewer);
    // The guard still catches a real mismatch: Nik's identity on Daniel's pair link.
    assert.equal(Adapter.classifyCurrentShowdown({identity:{...identity,managerId:"nik"},pair:{...pair,status:"paired",managerRole:"playerOne",managerId:"daniel",rivalryId:"pair_"+"1".repeat(64),connectionState:"active"}}),"unavailable");
  }
});

const G=require(path.join(ROOT,"tests/support/data-contract-v1-fixtures.cjs"));

// ---------- K2. Generated from the model, never drifted ----------
check("K2 committed fixtures equal a fresh run of the generator",()=>{
  const problems=G.diffFixtures(ROOT);
  assert.deepEqual(problems,[],"fixtures drifted from the model; run node tests/support/data-contract-v1-fixtures.cjs --write and commit");
});
check("K2 generator is deterministic and uses the real modules",()=>{
  assert.deepEqual(G.buildDataContractFixtures(),G.buildDataContractFixtures());
  const src=fs.readFileSync(path.join(ROOT,"tests/support/data-contract-v1-fixtures.cjs"),"utf8");
  assert.doesNotMatch(src,/Date\.now|new Date|Math\.random|process\.env|localStorage|sessionStorage|indexedDB/);
  for(const call of ["History.buildProjection(","Adapter.buildActiveShowdownViews(","Adapter.seasonResultsView(","Adapter.careerInput(","Career.buildCareerModel(","StartJoin.buildStartJoinViewModel(","StartJoin.navLockState("])assert.ok(src.includes(call),call);
});
const files=G.committedFixtureFiles(ROOT);
const index=JSON.parse(files[DIR+"/index.json"]);
const nav=JSON.parse(files[DIR+"/nav.json"]);
const fixtures=index.scenarios.map(row=>({row,fx:JSON.parse(files[DIR+"/"+row.file])}));
check("K2 index lists every file with its hash",()=>{
  exact(index,["schema","contractVersion","generator","regenerate","screens","scenarios","nav"],"index");
  assert.equal(index.schema,G.SCHEMA);assert.equal(index.contractVersion,CONTRACT_VERSION);
  assert.deepEqual(Object.keys(files).sort(),[DIR+"/index.json",DIR+"/nav.json",...index.scenarios.map(r=>DIR+"/"+r.file)].sort());
  const crypto=require("node:crypto"),sha=t=>"sha256:"+crypto.createHash("sha256").update(t).digest("hex");
  for(const r of index.scenarios){exact(r,["id","file","summary","careerStatus","classification","sha256"],"index row "+r.id);assert.equal(r.file,r.id+".json");assert.equal(r.sha256,sha(files[DIR+"/"+r.file]),r.id);}
  assert.equal(index.nav.sha256,sha(files[DIR+"/nav.json"]));
});

// ---------- K3. DATA_CONTRACT_V1 field contract (exact keys, types, enums, bounds) ----------
// Keys outside V1 are listed with their source; any other key, or a missing key, fails.
const SPEC={
  fixture:["schema","contractVersion","scenario","summary","generator","checkSource","career","careerInterim","viewers"],
  viewer:["classification","home","startJoin","seasonResults","seasonResultsBySeason","finalWinner","rivalry"], // classification: fixture metadata (G-5 enum)
  home:["status","viewerRole","continue"], // V1 §1; tiles.* not yet produced (G-13)
  continue:["state","leagueId","clubs","season","totalSeasons","score"],
  startJoin:["status","viewerRole","busy","pairing","session","abandonShowdown","forgetThisDevice","primaryActions","moreActions"], // V1 §2 + G2V-005 item 2
  action:["available","enabled","provider","args","confirm","confirmedByProvider"], // G2V-005 item 2
  pairingActions:["createCode","join","copyCode","newCode","checkStatus","retry"],
  sessionActions:["host","join","refresh","revoke","close","forget"],
  seasonResults:["status","season","phase","viewerRole","inputs","breakdown","winner","tiebreak"], // V1 §3 + G-5 §4 (season, viewerRole)
  breakdown:["championsLeague","leagueTitle","domesticCup","performanceBonus","awardsBonus","total"], // V1 §3, nested per manager (G2V-005 item 1)
  finalWinner:["status","state","totals","winner","margin","seasonsPlayed","trophies"], // V1 §4
  trophies:["championsLeague","leagueTitles","domesticCups","total"],
  rivalry:["status","leagueId","clubs","season","totalSeasons","score","managers","seasons","transfers"], // V1 §5
  rivalryManager:["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"],
  rivalrySeason:["season","score","winner","leaguePosition","leaguePoints","leagueGoals"],
  career:["status","interimLabel","coverage","managers","biggestShowdownWin","trophyRoom","history"], // V1 §0, §6, §7, §8
  careerManager:["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","performanceBonuses","awardsBonuses","bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition","averageSeasonScore","averageLeaguePoints","averageLeagueGoals","showdowns"],
  historyRow:["number","rivalryId","status","leagueId","clubs","seasonsPlayed","totalSeasons","totals","winner","seasons"], // V1 §8 + rivalryId (G-3 ref target)
  historySeason:["season","score","winner","tiebreak","leaguePosition","leaguePoints","leagueGoals"],
  record:["label","manager","value","ref"],
  recordLabels:["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"],
  checkSource:["ref","totalSeasons","leagueId","state","seasons"]
};
const pairOf=(v,where,test)=>{exact(v,MANAGERS,where);for(const m of MANAGERS)test(v[m],where+"."+m);};
function league(v,where,nullable=true){if(nullable&&v===null)return;oneOf(v,Object.keys(TEAMS),where);}
function seasonsTotal(v,where){if(v===null)return;oneOf(v,[1,3,5,10],where);}
function input(r,where,leagueId){
  if(r===null)return;exact(r,INPUT_KEYS,where);const teams=TEAMS[leagueId]||20;
  assert.ok(isInt(r.leaguePosition)&&r.leaguePosition>=1&&r.leaguePosition<=teams,where+".leaguePosition bound");
  assert.ok(isInt(r.leaguePoints)&&r.leaguePoints>=0&&r.leaguePoints<=(teams-1)*6,where+".leaguePoints bound");
  assert.ok(isInt(r.leagueGoals)&&r.leagueGoals>=0&&r.leagueGoals<=300,where+".leagueGoals bound");
  for(const k of INPUT_KEYS.slice(3))assert.equal(typeof r[k],"boolean",where+"."+k);
}
function action(a,where){exact(a,SPEC.action,where);assert.equal(typeof a.available,"boolean");assert.equal(typeof a.enabled,"boolean");assert.equal(typeof a.confirmedByProvider,"boolean");assert.ok(a.provider===null||typeof a.provider==="string",where);assert.ok(a.confirm===null||typeof a.confirm==="string",where);if(!a.available)assert.deepEqual(a,{available:false,enabled:false,provider:null,args:null,confirm:null,confirmedByProvider:false},where);}
function validateHome(h,where){
  exact(h,SPEC.home,where);oneOf(h.status,STATUS5,where+".status");oneOf(h.viewerRole,[...MANAGERS,null],where+".viewerRole");
  const c=h.continue;exact(c,SPEC.continue,where+".continue");oneOf(c.state,["paired","waiting","recovery-required","unpaired",null],where+".continue.state");
  league(c.leagueId,where+".leagueId");if(c.clubs!==null)pairOf(c.clubs,where+".clubs",(v,w)=>assert.equal(typeof v,"string",w));
  intOrNull(c.season,where+".season");seasonsTotal(c.totalSeasons,where+".totalSeasons");if(c.score!==null)pairOf(c.score,where+".score",(v,w)=>assert.ok(isInt(v)&&v>=0,w));
}
function validateStartJoin(s,where){
  exact(s,SPEC.startJoin,where);oneOf(s.status,["loading","unavailable","ready"],where+".status");oneOf(s.viewerRole,[...MANAGERS,null],where);assert.equal(typeof s.busy,"boolean");
  exact(s.pairing,["state","code","actions"],where+".pairing");oneOf(s.pairing.state,["none","code-created","waiting-for-nik","paired"],where+".pairing.state");
  assert.ok(s.pairing.code===null||typeof s.pairing.code==="string");exact(s.pairing.actions,SPEC.pairingActions,where+".pairing.actions");for(const k of SPEC.pairingActions)action(s.pairing.actions[k],where+".pairing."+k);
  exact(s.session,["state","actions"],where+".session");oneOf(s.session.state,["open","active","revoked","closed","expired",null],where+".session.state");
  exact(s.session.actions,SPEC.sessionActions,where+".session.actions");for(const k of SPEC.sessionActions)action(s.session.actions[k],where+".session."+k);
  action(s.abandonShowdown,where+".abandonShowdown");action(s.forgetThisDevice,where+".forgetThisDevice");
  const ids=[...SPEC.pairingActions.map(k=>"pairing."+k),...SPEC.sessionActions.map(k=>"session."+k),"abandonShowdown","forgetThisDevice"];
  for(const id of [...s.primaryActions,...s.moreActions])oneOf(id,ids,where+" action id");
}
function validateSeasonResults(r,where,leagueId){
  exact(r,SPEC.seasonResults,where);oneOf(r.status,STATUS5,where+".status");intOrNull(r.season,where+".season");
  oneOf(r.phase,["entering","waiting-for-rival","results-ready","committed",null],where+".phase");oneOf(r.viewerRole,[...MANAGERS,null],where+".viewerRole");
  if(r.inputs!==null)pairOf(r.inputs,where+".inputs",(v,w)=>input(v,w,leagueId));
  if(r.breakdown!==null)pairOf(r.breakdown,where+".breakdown",(b,w)=>{exact(b,SPEC.breakdown,w);oneOf(b.championsLeague,[0,5],w);oneOf(b.leagueTitle,[0,3],w);oneOf(b.domesticCup,[0,1],w);oneOf(b.performanceBonus,[0,1],w);oneOf(b.awardsBonus,[0,1],w);assert.equal(b.total,b.championsLeague+b.leagueTitle+b.domesticCup+b.performanceBonus+b.awardsBonus,w+".total");assert.ok(b.total<=11);});
  oneOf(r.winner,[...MANAGERS,"draw",null],where+".winner");oneOf(r.tiebreak,["none","league-position","league-points","draw",null],where+".tiebreak");
  if(r.phase!=="committed")assert.ok(r.breakdown===null&&r.winner===null&&r.tiebreak===null,where+" breakdown/winner/tiebreak only once committed");
}
function validateFinal(f,where){
  exact(f,SPEC.finalWinner,where);oneOf(f.status,STATUS5,where+".status");oneOf(f.state,["completion-pending","completed",null],where+".state");
  if(f.totals!==null){pairOf(f.totals,where+".totals",(v,w)=>assert.ok(isInt(v)&&v>=0,w));const a=f.totals.daniel,b=f.totals.nik;assert.equal(f.winner,a>b?"daniel":b>a?"nik":"draw",where+" totals-only winner");assert.equal(f.margin,Math.abs(a-b),where+".margin");}
  else assert.ok(f.winner===null&&f.margin===null,where);
  intOrNull(f.seasonsPlayed,where+".seasonsPlayed");
  if(f.trophies!==null)pairOf(f.trophies,where+".trophies",(t,w)=>{exact(t,SPEC.trophies,w);assert.equal(t.total,t.championsLeague+t.leagueTitles+t.domesticCups,w);});
}
function validateRivalry(v,where){
  exact(v,SPEC.rivalry,where);oneOf(v.status,STATUS5,where+".status");league(v.leagueId,where+".leagueId");intOrNull(v.season,where+".season");seasonsTotal(v.totalSeasons,where+".totalSeasons");
  if(v.clubs!==null)pairOf(v.clubs,where+".clubs",(c,w)=>assert.equal(typeof c,"string",w));if(v.score!==null)pairOf(v.score,where+".score",(s,w)=>assert.ok(isInt(s),w));
  if(v.managers!==null)pairOf(v.managers,where+".managers",(m,w)=>{exact(m,SPEC.rivalryManager,w);for(const k of SPEC.rivalryManager)k==="bestSeasonScore"?intOrNull(m[k],w+"."+k):assert.ok(isInt(m[k]),w+"."+k);});
  assert.ok(Array.isArray(v.seasons));v.seasons.forEach((s,i)=>{exact(s,SPEC.rivalrySeason,where+".seasons["+i+"]");oneOf(s.winner,[...MANAGERS,"draw"],where);for(const k of ["leaguePosition","leaguePoints","leagueGoals"])pairOf(s[k],where+"."+k,(x,w)=>assert.ok(isInt(x),w));});
  exact(v.transfers,["status"],where+".transfers");oneOf(v.transfers.status,STATUS5,where+".transfers.status");
}
function validateCareer(c,where){
  exact(c,SPEC.career,where);oneOf(c.status,STATUS5,where+".status");oneOf(c.interimLabel,[INTERIM,null],where+".interimLabel");
  exact(c.coverage,["readable","indexed"],where+".coverage");intOrNull(c.coverage.readable,where);intOrNull(c.coverage.indexed,where);
  pairOf(c.managers,where+".managers",(m,w)=>{exact(m,SPEC.careerManager,w);for(const k of SPEC.careerManager){if(k==="showdowns"){exact(m.showdowns,["completed","wins","draws","losses"],w+".showdowns");for(const x of Object.values(m.showdowns))intOrNull(x,w);}else if(k.startsWith("average"))numOrNull(m[k],w+"."+k);else intOrNull(m[k],w+"."+k);}});
  if(c.biggestShowdownWin!==null){exact(c.biggestShowdownWin,["manager","margin","showdownRef"],where+".biggestShowdownWin");oneOf(c.biggestShowdownWin.manager,MANAGERS,where);assert.ok(isInt(c.biggestShowdownWin.margin)&&c.biggestShowdownWin.margin>0);}
  exact(c.trophyRoom,["cabinet","standings","records"],where+".trophyRoom");pairOf(c.trophyRoom.cabinet,where+".cabinet",(x,w)=>exact(x,["championsLeagues","leagueTitles","domesticCups","totalTrophies"],w));
  for(const row of c.trophyRoom.standings){assert.ok(keysOf(row).every(k=>["manager","careerPoints","seasonWins","level"].includes(k)),where+" standings keys");oneOf(row.manager,MANAGERS,where);if("level" in row)assert.equal(row.level,true);}
  if(["ready","partial","empty"].includes(c.status))assert.deepEqual(c.trophyRoom.records.map(r=>r.label),SPEC.recordLabels,where+" record labels");
  for(const r of c.trophyRoom.records){exact(r,SPEC.record,where+".record");oneOf(r.manager,[...MANAGERS,"shared"],where);numOrNull(r.value,where);}
  exact(c.history,["showdowns"],where+".history");
  c.history.showdowns.forEach((row,i)=>{const w=where+".history["+i+"]";exact(row,SPEC.historyRow,w);assert.equal(row.number,i+1,w+".number");oneOf(row.status,["completed","in-progress","completion-pending","abandoned","unavailable"],w+".status");
    if(row.status==="abandoned"||row.status==="unavailable"){assert.deepEqual([row.leagueId,row.clubs,row.seasonsPlayed,row.totalSeasons,row.totals,row.winner,row.seasons],[null,null,null,null,null,null,[]],w+" status-only row");return;}
    league(row.leagueId,w,false);seasonsTotal(row.totalSeasons,w);pairOf(row.totals,w+".totals",(x,ww)=>assert.ok(isInt(x),ww));oneOf(row.winner,row.status==="in-progress"?[null]:[...MANAGERS,"draw"],w+".winner");
    row.seasons.forEach((s,j)=>{exact(s,SPEC.historySeason,w+".seasons["+j+"]");oneOf(s.tiebreak,["none","league-position","league-points","draw"],w);});
  });
}
check("K3 nav fixture matches V1 §10",()=>{
  exact(nav,["schema","contractVersion","scenario","summary","generator","lockText","screens"],"nav");assert.equal(nav.lockText,"Finish this step first");
  assert.deepEqual(keysOf(nav.screens),G.SCREEN_IDS);
  for(const [id,s] of Object.entries(nav.screens)){exact(s,["locked","reason"],"nav."+id);oneOf(s.reason,["transfer-window","season-entry","setup",null],"nav."+id);assert.equal(s.locked,s.reason!==null);assert.deepEqual(s,{...StartJoin.navLockState(id)});}
  assert.deepEqual(Object.entries(nav.screens).filter(([,s])=>s.locked).map(([id])=>id).sort(),["clubWheelScreen","leagueWheelScreen","seasonEntry","transferChallenge"]);
});
for(const {row,fx} of fixtures){
  check("K3 "+row.id+" matches DATA_CONTRACT_V1",()=>{
    exact(fx,SPEC.fixture,row.id);assert.equal(fx.schema,G.SCHEMA);assert.equal(fx.contractVersion,CONTRACT_VERSION);assert.equal(fx.scenario,row.id);
    validateCareer(fx.career,row.id+".career");validateCareer(fx.careerInterim,row.id+".careerInterim");
    assert.equal(fx.career.interimLabel,null,"launch-state career has no interim label");assert.equal(fx.careerInterim.interimLabel,INTERIM);
    exact(fx.viewers,MANAGERS,row.id+".viewers");
    for(const m of MANAGERS){const v=fx.viewers[m],w=row.id+"."+m;exact(v,SPEC.viewer,w);
      oneOf(v.classification,["loading","unavailable","none","pending","abandoned","active","completion-pending","completed"],w+".classification");
      validateHome(v.home,w+".home");validateStartJoin(v.startJoin,w+".startJoin");validateFinal(v.finalWinner,w+".finalWinner");validateRivalry(v.rivalry,w+".rivalry");
      const leagueId=v.rivalry.leagueId||v.home.continue.leagueId;
      validateSeasonResults(v.seasonResults,w+".seasonResults",leagueId);v.seasonResultsBySeason.forEach((r,i)=>{validateSeasonResults(r,w+".seasonResultsBySeason["+i+"]",leagueId);assert.equal(r.season,i+1);});
      if(v.viewerRole!==undefined)assert.fail("viewerRole belongs inside views");
      for(const view of [v.home,v.startJoin,v.seasonResults])if(view.viewerRole!==null)assert.equal(view.viewerRole,m,w+" viewerRole");
    }
    fx.checkSource.forEach((sd,i)=>{const w=row.id+".checkSource["+i+"]";exact(sd,SPEC.checkSource,w);league(sd.leagueId,w,false);seasonsTotal(sd.totalSeasons,w);oneOf(sd.state,["completed","active","completion-pending","abandoned"],w);assert.ok(sd.seasons.length<=sd.totalSeasons);sd.seasons.forEach((s,j)=>pairOf(s,w+".seasons["+j+"]",(r,ww)=>input(r,ww,sd.leagueId)));});
  });
}

// ---------- K4. Privacy: no ids, no codes, no rival's unpublished inputs ----------
const FORBIDDEN_KEYS=["accountId","profileId","saveId","deviceId","providerSaveId","providerProfileId","sessionId","capability","managerSlots","managerRecords","projection","terminalWitness","opponentResult","ownResult","allResults","publishedRoles","operationIds","operationHashes","acceptedRevisionKey","resultsContentHash","contentHash","email","uid"];
check("K4 no private keys or ids in any fixture",()=>{
  for(const [file,text] of Object.entries(files)){
    walk(JSON.parse(text),(v,trail)=>{
      if(v&&typeof v==="object"&&!Array.isArray(v))for(const k of keysOf(v))assert.ok(!FORBIDDEN_KEYS.includes(k),file+" "+trail+"."+k);
      if(typeof v==="string"){assert.doesNotMatch(v,/^(acct|profile|save|device|session)_/,file+" "+trail);assert.doesNotMatch(v,/@/,file+" "+trail);}
    });
  }
});
check("K4 the pairing code appears only in Daniel's own Start/Join view after he created it",()=>{
  for(const {row,fx} of fixtures){
    walk(fx,(v,trail)=>{if(typeof v==="string"&&v.startsWith("CMS17-"))assert.equal(trail,"$.viewers.daniel.startJoin.pairing.code",row.id+" "+trail);});
    assert.equal(fx.viewers.nik.startJoin.pairing.code,null,row.id);
  }
  const code=fixtures.find(f=>f.row.id==="pairing-code-created").fx;assert.match(code.viewers.daniel.startJoin.pairing.code,/^CMS17-pair_[0-9a-f]{64}$/);assert.equal(code.viewers.daniel.startJoin.pairing.state,"code-created");
});
check("K4 a rival's unpublished season inputs never reach the other manager",()=>{
  let proved=0;
  for(const sc of G.scenarios()){
    if(!sc.sentinel)continue;
    const fx=fixtures.find(f=>f.row.id===sc.id).fx,{owner,rival,value}=sc.sentinel;
    let inOwner=0;walk(fx.viewers[owner],v=>{if(v===value)inOwner+=1;});assert.ok(inOwner>0,sc.id+" sentinel must be visible to its owner (proves the walk)");
    for(const part of [fx.viewers[rival],fx.career,fx.careerInterim,fx.checkSource])walk(part,(v,trail)=>assert.notEqual(v,value,sc.id+" sentinel leaked at "+trail));
    const cur=fx.viewers[rival].seasonResults;assert.equal(cur.inputs[owner],null,sc.id+" rival sees owner inputs");assert.equal(cur.phase,"entering");
    proved+=1;
  }
  assert.ok(proved>=1,"at least one scenario carries an unpublished-input sentinel");
  for(const {row,fx} of fixtures)for(const m of MANAGERS){const r=fx.viewers[m].seasonResults,other=m==="daniel"?"nik":"daniel";
    if(r.phase==="entering"||r.phase==="waiting-for-rival")assert.equal(r.inputs[other],null,row.id+" "+m+" sees rival input before results-ready");}
});
check("K4 checkSource holds only accepted seasons (both managers already saw them)",()=>{
  for(const {row,fx} of fixtures){
    const rows=fx.career.history.showdowns.filter(r=>r.seasons.length);
    const counted=fx.checkSource.filter(s=>s.state!=="abandoned");
    assert.deepEqual(counted.map(s=>s.seasons.length),rows.map(r=>r.seasons.length),row.id);
  }
});

// ---------- K5. Scoring never changes (independent re-derivation from checkSource) ----------
function score(r){const b={championsLeague:r.championsLeague?5:0,leagueTitle:r.leaguePosition===1?3:0,domesticCup:r.domesticCup?1:0,performanceBonus:(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,awardsBonus:(r.topScorer||r.topAssist)?1:0};b.total=b.championsLeague+b.leagueTitle+b.domesticCup+b.performanceBonus+b.awardsBonus;return b;}
function seasonWinner(d,n){const a=score(d).total,b=score(n).total;if(a!==b)return [a>b?"daniel":"nik","none"];if(d.leaguePosition!==n.leaguePosition)return [d.leaguePosition<n.leaguePosition?"daniel":"nik","league-position"];if(d.leaguePoints!==n.leaguePoints)return [d.leaguePoints>n.leaguePoints?"daniel":"nik","league-points"];return ["draw","draw"];}
check("K5 every season score, winner, tiebreak and total re-derives from the season facts",()=>{
  for(const {row,fx} of fixtures){
    const rows=fx.career.history.showdowns.filter(r=>r.seasons.length),srcs=fx.checkSource.filter(s=>s.state!=="abandoned");
    rows.forEach((hr,i)=>{const src=srcs[i];assert.equal(hr.leagueId,src.leagueId);assert.equal(hr.totalSeasons,src.totalSeasons);let td=0,tn=0;
      hr.seasons.forEach((s,j)=>{const {daniel:d,nik:n}=src.seasons[j],[w,t]=seasonWinner(d,n);assert.deepEqual(s.score,{daniel:score(d).total,nik:score(n).total},row.id+" score");assert.equal(s.winner,w,row.id+" winner");assert.equal(s.tiebreak,t,row.id+" tiebreak");assert.deepEqual(s.leaguePosition,{daniel:d.leaguePosition,nik:n.leaguePosition});td+=score(d).total;tn+=score(n).total;});
      assert.deepEqual(hr.totals,{daniel:td,nik:tn},row.id+" totals");if(hr.status==="completed"||hr.status==="completion-pending")assert.equal(hr.winner,td>tn?"daniel":tn>td?"nik":"draw",row.id+" final is totals only");});
    for(const m of MANAGERS)for(const r of fx.viewers[m].seasonResultsBySeason)if(r.phase==="committed")for(const who of MANAGERS)assert.deepEqual(r.breakdown[who],score(r.inputs[who]),row.id+" breakdown");
  }
  const perfect=score({leaguePosition:1,leaguePoints:101,leagueGoals:104,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});assert.equal(perfect.total,11);assert.equal(perfect.performanceBonus,1);assert.equal(perfect.awardsBonus,1);
});
check("K5 career totals are sums of counted seasons; abandoned counts for nothing",()=>{
  for(const {row,fx} of fixtures){if(!["ready","partial"].includes(fx.career.status))continue;
    for(const m of MANAGERS){const rows=fx.career.history.showdowns.filter(r=>r.status!=="abandoned"&&r.status!=="unavailable");
      assert.equal(fx.career.managers[m].careerPoints,rows.reduce((t,r)=>t+r.totals[m],0),row.id+" careerPoints "+m);
      assert.equal(fx.career.managers[m].seasons,rows.reduce((t,r)=>t+r.seasons.length,0),row.id+" seasons "+m);
      const completed=rows.filter(r=>r.status==="completed");assert.equal(fx.career.managers[m].showdowns.completed,completed.length,row.id);
      assert.equal(fx.career.managers[m].showdowns.wins,completed.filter(r=>r.winner===m).length,row.id+" wins");}}
  const ab=fixtures.find(f=>f.row.id==="abandoned").fx;assert.equal(ab.career.managers.nik.perfectSeasons,0);assert.equal(ab.career.managers.nik.bestSeasonScore,null);assert.equal(ab.career.managers.nik.careerPoints,0);
});

// ---------- K6. Same numbers on every screen and on both phones ----------
const COUNTED=["active","completion-pending","completed"];
check("K6 home, rivalry, final winner and history agree for the current Showdown",()=>{
  for(const {row,fx} of fixtures)for(const m of MANAGERS){const v=fx.viewers[m];if(!COUNTED.includes(v.classification)||v.rivalry.status!=="ready")continue;
    const cur=fx.careerInterim.history.showdowns[0];
    assert.deepEqual(v.rivalry.score,cur.totals,row.id+" rivalry vs history");
    if(v.home.continue.score!==null)assert.deepEqual(v.home.continue.score,v.rivalry.score,row.id+" home vs rivalry");
    if(v.finalWinner.totals!==null)assert.deepEqual(v.finalWinner.totals,v.rivalry.score,row.id+" final vs rivalry");
    assert.deepEqual(v.rivalry.seasons,cur.seasons.map(({tiebreak,...rest})=>rest),row.id+" rivalry seasons vs history");
    for(const k of SPEC.rivalryManager)for(const who of MANAGERS)assert.equal(v.rivalry.managers[who][k],fx.careerInterim.managers[who][k],row.id+" "+k);
    v.seasonResultsBySeason.filter(r=>r.phase==="committed").forEach(r=>{const s=v.rivalry.seasons[r.season-1];assert.deepEqual({daniel:r.breakdown.daniel.total,nik:r.breakdown.nik.total},s.score);assert.equal(r.winner,s.winner);});
  }
});
check("K6 Daniel and Nik see identical shared numbers; only their own role differs",()=>{
  const strip=v=>JSON.parse(JSON.stringify(v),(k,x)=>k==="viewerRole"?undefined:x);
  for(const {row,fx} of fixtures){const d=fx.viewers.daniel,n=fx.viewers.nik;
    if(d.classification!==n.classification)continue; // pairing-code-created: Nik has no Showdown yet
    for(const k of ["rivalry","finalWinner"])assert.deepEqual(d[k],n[k],row.id+" "+k);
    assert.deepEqual(strip(d.home),strip(n.home),row.id+" home");
    assert.deepEqual(d.seasonResultsBySeason.filter(r=>r.phase==="committed").map(strip),n.seasonResultsBySeason.filter(r=>r.phase==="committed").map(strip),row.id+" committed seasons");
    if(d.seasonResults.phase==="results-ready")assert.deepEqual(strip(d.seasonResults),strip(n.seasonResults),row.id+" results-ready");
  }
});
check("K6 one-Showdown career equals the adapter path (interim label aside)",()=>{
  for(const {row,fx} of fixtures){
    const single=fx.career.history.showdowns.length<=1&&fx.checkSource.length<=1&&row.id!=="partial-career"&&row.id!=="pairing-code-created";
    if(!single)continue;const {interimLabel:a,...career}=fx.career,{interimLabel:b,...interim}=fx.careerInterim;
    assert.deepEqual(career,interim,row.id);
  }
});

// ---------- K7. Fixtures bind through the G-4 career screen seam without degrading ----------
check("K7 careerScreenView keeps each fixture's status",()=>{
  for(const {row,fx} of fixtures){
    for(const model of [fx.career,fx.careerInterim])for(const screen of ["careerStatistics","trophyRoom","legacy"])assert.equal(Seam.careerScreenView(screen,model).status,model.status,row.id+" "+screen);
    if(fx.careerInterim.history.showdowns.length===1&&["ready","partial"].includes(fx.careerInterim.status))assert.equal(Seam.careerScreenView("rivalryStatistics",fx.careerInterim).status,fx.careerInterim.status,row.id+" rivalryStatistics");
  }
});

// ---------- K8. Coverage of the states Team V designs ----------
check("K8 required scenarios and every state are present",()=>{
  const ids=fixtures.map(f=>f.row.id);for(const id of REQUIRED_SCENARIOS)assert.ok(ids.includes(id),id);
  const seen=(fn)=>new Set(fixtures.flatMap(fn));
  const careerStatuses=seen(f=>[f.fx.career.status]);for(const s of STATUS5)assert.ok(careerStatuses.has(s),"career status "+s);
  const phases=seen(f=>MANAGERS.flatMap(m=>[f.fx.viewers[m].seasonResults.phase,...f.fx.viewers[m].seasonResultsBySeason.map(r=>r.phase)]));for(const p of ["entering","waiting-for-rival","results-ready","committed"])assert.ok(phases.has(p),"phase "+p);
  const states=seen(f=>[f.fx.viewers.daniel.finalWinner.state]);for(const s of ["completion-pending","completed"])assert.ok(states.has(s),"final "+s);
  const tiebreaks=seen(f=>f.fx.career.history.showdowns.flatMap(r=>r.seasons.map(s=>s.tiebreak)));for(const t of ["none","league-position","league-points","draw"])assert.ok(tiebreaks.has(t),"tiebreak "+t);
  const rows=seen(f=>[...f.fx.career.history.showdowns,...f.fx.careerInterim.history.showdowns].map(r=>r.status));for(const s of ["completed","in-progress","completion-pending","abandoned","unavailable"])assert.ok(rows.has(s),"history "+s);
  const winners=seen(f=>[f.fx.viewers.daniel.finalWinner.winner]);for(const w of ["daniel","draw"])assert.ok(winners.has(w),"final winner "+w);
  const multi=fixtures.find(f=>f.row.id==="multi-showdown-career").fx;assert.ok(multi.career.managers.daniel.showdowns.wins>=1&&multi.career.managers.nik.showdowns.wins>=1,"both managers win a Showdown");
  const pairing=seen(f=>MANAGERS.map(m=>f.fx.viewers[m].startJoin.pairing.state));for(const s of ["none","code-created","paired"])assert.ok(pairing.has(s),"pairing "+s);
  const tie=fixtures.find(f=>f.row.id==="tiebreak-finish").fx;assert.equal(tie.viewers.daniel.finalWinner.winner,"draw");assert.equal(tie.viewers.daniel.finalWinner.margin,0);
});

check("K8 one league table: distinct positions, consistent points, one winner per trophy (Team V PRODUCT_TRUTH)",()=>{
  for(const {row,fx} of fixtures){if(row.id==="equal-position-tiebreaks")continue;
    for(const sd of fx.checkSource)sd.seasons.forEach(({daniel:d,nik:n},i)=>{const w=row.id+" "+sd.ref+" S"+(i+1);
      assert.notEqual(d.leaguePosition,n.leaguePosition,w+" equal positions");
      if(d.leaguePoints!==n.leaguePoints)assert.equal(d.leaguePosition<n.leaguePosition,d.leaguePoints>n.leaguePoints,w+" higher position has fewer points");
      for(const f of ["championsLeague","domesticCup","topScorer","topAssist"])assert.ok(!(d[f]&&n[f]),w+" both have "+f);});}
  const eq=fixtures.find(f=>f.row.id==="equal-position-tiebreaks").fx;assert.deepEqual(eq.career.history.showdowns[0].seasons.map(s=>s.tiebreak),["league-points","draw","none"]);
});

console.log("PASS data contract v1 fixtures contracts ("+checks+" checks, "+fixtures.length+" scenarios + nav): real provider shapes, generated from the model, V1 fields, privacy, scoring, cross-screen agreement, seam binding, state coverage.");
````

### Appendix C. Adapter fix: `js/sharedActiveShowdownAdapter.js` (against `889810f`)

````diff
diff --git a/js/sharedActiveShowdownAdapter.js b/js/sharedActiveShowdownAdapter.js
index f38ba72..546f75f 100644
--- a/js/sharedActiveShowdownAdapter.js
+++ b/js/sharedActiveShowdownAdapter.js
@@ -45,7 +45,7 @@
         classification="completed";
       }catch(_error){witness=null;classification="unavailable";}
     }else if(!pair||pair.initialized!==true||TRANSIENT.includes(pair.status))classification="loading";
-    else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&identity.managerId!==pair.managerId))classification="unavailable";
+    else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&pair.managerId!=null&&identity.managerId!==pair.managerId))classification="unavailable";
     else if(pair.rivalryId!=null&&typeof pair.rivalryId!=="string")classification="unavailable";
     else if(pair.status==="unpaired"||rid===null)classification="none";
     else if(pair.connectionState==="pending-pair")classification="pending";
````

### Appendix D. Registry entry and ops test (against `889810f`; both append LAST)

Registry patterns are JSON strings compiled with `new RegExp`: a literal dot is `\\.` in the JSON source (one escaped backslash), never `\\\\.`. If JOB-08, JOB-16 or JOB-18 merged first, their entry and const stay where they are and this one goes after them.

````diff
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 14f0d17..6b0c558 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -532,6 +532,25 @@
         "^tests/contracts/career-index-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/data-contract-v1-fixtures-contracts.cjs",
+      "patterns": [
+        "^js/sharedActiveShowdownAdapter\\.js$",
+        "^js/sharedCareerAnalytics\\.js$",
+        "^js/startJoinViewModel\\.js$",
+        "^js/careerScreenSeam\\.js$",
+        "^js/sharedHistoryConvergence\\.js$",
+        "^js/sharedTerminalClose\\.js$",
+        "^js/sharedFinalReconciliation\\.js$",
+        "^data/clubs\\.js$",
+        "^tests/support/data-contract-v1-fixtures\\.cjs$",
+        "^tests/support/active-showdown-fixtures\\.cjs$",
+        "^tests/support/career-fixture-helpers\\.cjs$",
+        "^tests/fixtures/data-contract-v1/",
+        "^tests/contracts/data-contract-v1-fixtures-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 346eed4..6be3b5f 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -69,10 +69,11 @@ const sharedActiveShowdownAdapterContract='tests/contracts/shared-active-showdow
 const startJoinViewModelContract='tests/contracts/start-join-view-model-contracts.cjs';
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
+const dataContractFixturesContract='tests/contracts/data-contract-v1-fixtures-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,dataContractFixturesContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````

### Appendix E. Expected `tests/fixtures/data-contract-v1/index.json` at `889810f` (generated; do not type it, compare it)

````json
{
  "schema": "cms-data-contract-v1-fixture",
  "contractVersion": "1.0",
  "generator": "tests/support/data-contract-v1-fixtures.cjs",
  "regenerate": "node tests/support/data-contract-v1-fixtures.cjs --write",
  "screens": {
    "home": "viewers.<manager>.home",
    "startJoin": "viewers.<manager>.startJoin",
    "seasonResults": "viewers.<manager>.seasonResults and seasonResultsBySeason[]",
    "finalWinner": "viewers.<manager>.finalWinner",
    "rivalryStatistics": "viewers.<manager>.rivalry",
    "careerStatistics": "career (managers, biggestShowdownWin, coverage)",
    "trophyRoom": "career.trophyRoom",
    "history": "career.history",
    "standings": "career.trophyRoom.standings and viewers.<manager>.rivalry",
    "interim": "careerInterim (current Showdown only, before career history is wired)",
    "nav": "nav.json"
  },
  "scenarios": [
    {
      "id": "empty-career",
      "file": "empty-career.json",
      "summary": "Both managers signed in, never paired: no Showdowns. Career screens are empty, Start/Join offers Daniel CREATE and Nik JOIN.",
      "careerStatus": "empty",
      "classification": {
        "daniel": "none",
        "nik": "none"
      },
      "sha256": "sha256:3fe95a68705a28e5be58ab780f366a36bc850f739feb98f76a6c18e48183e65e"
    },
    {
      "id": "loading",
      "file": "loading.json",
      "summary": "The pair provider is still starting: every screen is loading.",
      "careerStatus": "loading",
      "classification": {
        "daniel": "loading",
        "nik": "loading"
      },
      "sha256": "sha256:c9d364adc1bb03ee4a75d3be2411600178bcfcaf73d3a6e3aa1103faff780376"
    },
    {
      "id": "unavailable",
      "file": "unavailable.json",
      "summary": "The pair provider failed: every screen is unavailable (never drawn as empty or zero).",
      "careerStatus": "unavailable",
      "classification": {
        "daniel": "unavailable",
        "nik": "unavailable"
      },
      "sha256": "sha256:9e859dd6ae80e11e4f0722021ebd5f63f2aedd1d26e009312f86edfb6f15dfb0"
    },
    {
      "id": "pairing-code-created",
      "file": "pairing-code-created.json",
      "summary": "Daniel created a pairing code and waits for Nik. Only Daniel's Start/Join view carries the code.",
      "careerStatus": "empty",
      "classification": {
        "daniel": "pending",
        "nik": "none"
      },
      "sha256": "sha256:05338319c1884b9f0da82c41f555fcd41dd2198423ab2a8beb3653d4e24ace7b"
    },
    {
      "id": "active-first-season",
      "file": "active-first-season.json",
      "summary": "Paired 3-season La Liga Showdown, season 1 not yet played: 0-0, rivalry empty.",
      "careerStatus": "empty",
      "classification": {
        "daniel": "active",
        "nik": "active"
      },
      "sha256": "sha256:02e76363d69290474b828271ee6ee78039cd306ccf59b56d704ddfa2da01d2a5"
    },
    {
      "id": "active-mid-season",
      "file": "active-mid-season.json",
      "summary": "Paired 5-season Premier League Showdown after 2 seasons; Daniel published season 3, Nik has not. Nik's views never contain Daniel's season 3 inputs.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "active",
        "nik": "active"
      },
      "sha256": "sha256:b9ce4bdb52050e69bf56d1f96c91e3eaf380d93cc548dc68ef802ee72c04c36e"
    },
    {
      "id": "active-results-ready",
      "file": "active-results-ready.json",
      "summary": "Same Showdown; both managers published season 3 (RESULTS_READY): both inputs visible to both, breakdown not yet committed.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "active",
        "nik": "active"
      },
      "sha256": "sha256:882051e76a3cf11cb75617d9fc4dc187ddff56351be75fc3f387519d26f98c36"
    },
    {
      "id": "completion-pending",
      "file": "completion-pending.json",
      "summary": "3-season Bundesliga Showdown, every season accepted and reconciled, Terminal Close not yet verified.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "completion-pending",
        "nik": "completion-pending"
      },
      "sha256": "sha256:2c473a55f6ee16aaeaec85e957adf1a2e9e3d28ecd9930206ae4a0ce7472a348"
    },
    {
      "id": "finished-three-seasons",
      "file": "finished-three-seasons.json",
      "summary": "3-season La Liga Showdown closed by a verified Terminal Close; Daniel wins.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "completed",
        "nik": "completed"
      },
      "sha256": "sha256:20bab23cdb532d57e11ba26ee25e3f1c8f205a2c93069ed8f3bfb43a953988c6"
    },
    {
      "id": "tiebreak-finish",
      "file": "tiebreak-finish.json",
      "summary": "3-season Serie A Showdown, every season level on points and decided by league position; Daniel wins 2 seasons, Nik 1, but the final is a 7-7 draw (season tiebreaks never decide the final).",
      "careerStatus": "ready",
      "classification": {
        "daniel": "completed",
        "nik": "completed"
      },
      "sha256": "sha256:acc82e5341804e2cc0911a713b33cdf69999e782169e36bc74ef37dbe88072b9"
    },
    {
      "id": "equal-position-tiebreaks",
      "file": "equal-position-tiebreaks.json",
      "summary": "3-season Premier League Showdown with the rare equal league positions the app allows: season 1 won on league points, season 2 a draw, season 3 decides it. The only scenario where both managers share a league position.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "completed",
        "nik": "completed"
      },
      "sha256": "sha256:ad421a61813c15643c9c04c78db1c207a2e3807f3f30b090d8c266a6d1dd1b06"
    },
    {
      "id": "abandoned",
      "file": "abandoned.json",
      "summary": "5-season Ligue 1 Showdown abandoned after 2 seasons (including a perfect Nik season): nothing counts, History shows a status-only row.",
      "careerStatus": "ready",
      "classification": {
        "daniel": "abandoned",
        "nik": "abandoned"
      },
      "sha256": "sha256:dada5bf70fe2286500870838e940e5f8a8995d2b2f0e120e1067fd513f3d51a0"
    },
    {
      "id": "partial-career",
      "file": "partial-career.json",
      "summary": "Career index with one readable completed Showdown and one whose seasons cannot be read (only its Terminal Close witness is known): career is partial, 1 of 2 readable. No current Showdown.",
      "careerStatus": "partial",
      "classification": {
        "daniel": "none",
        "nik": "none"
      },
      "sha256": "sha256:2855280c9c6f53d0d70ece79a7f3f2d9594f92444a247f4356d6ec29aab968f9"
    },
    {
      "id": "multi-showdown-career",
      "file": "multi-showdown-career.json",
      "summary": "Four Showdowns oldest first: Daniel wins a 3-season Premier League Showdown, a Serie A Showdown is abandoned, Nik wins a 1-season La Liga Showdown with a perfect season, and a 5-season Bundesliga Showdown is in progress after 2 seasons (the current one).",
      "careerStatus": "ready",
      "classification": {
        "daniel": "active",
        "nik": "active"
      },
      "sha256": "sha256:9e9bf0701eae3fb64d19e727ae306dca0a2f29ea36b436646b5c28f71619a62b"
    }
  ],
  "nav": {
    "file": "nav.json",
    "sha256": "sha256:8f50d993b3c287ca83cd51af959d61c5ba0e0023fe75d1ae5f551f6fad62fcfe"
  }
}
````
