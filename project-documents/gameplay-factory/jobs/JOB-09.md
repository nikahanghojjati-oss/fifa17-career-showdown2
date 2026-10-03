# JOB-09 · Closed-Showdown adapter into the career model

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; every Firebase emulator run happens on GitHub CI, see §2) | JOB-03 **and** JOB-08 merged into `gameplay/recovery-v1` (JOB-08 PR #326, merge `843e64e`; JOB-05 and JOB-07 are also merged and this job uses both) | 7 | `gameplay/job-09-closed-adapter` | `gameplay/recovery-v1` | no |

## 1. Goal

JOB-07 gave each account a career index (every Showdown it paired, oldest first). JOB-08 made a finished Showdown readable again without a session: `readCompletedShowdown()` answers `completed`, `abandoned`, `not-closed` or `unavailable`. Nothing turns those answers into career numbers yet. The career model from JOB-03 (`buildCareerModel`) still only ever sees the current Showdown (JOB-05's `careerInput`, which carries the interim label "Current Showdown only. Career history is not yet available.").

This job adds the missing link, in two new files:

1. **A pure adapter** `js/sharedClosedShowdownAdapter.js`. It takes the career index, one reader result per indexed Showdown, and the current Showdown's `careerInput` from JOB-05, and returns exactly the input `buildCareerModel` accepts: `{indexStatus, showdowns:[{rivalryId, classification, projection, final}], currentShowdownOnly:false}`. No Firebase, no reads, no storage, no globals.
2. **A thin loader** `js/sparkClosedShowdownCareerLoader.js`. It walks the signed-in account's career index with JOB-07's `readCareerIndex()` (sealed pages, then head), calls JOB-08's `readCompletedShowdown()` once per indexed Showdown, keeps finished results in memory for that account, and returns the adapter output plus the career model.
3. **Proofs.** One node contract (22 cases, fixtures built from the real model functions) and one emulator journey on CI (12 numbered checks): a 3-season Showdown closed by a real Terminal Close, a Showdown abandoned after Nik scored an 11-point season, and a live Showdown, all paired through the provider and read by both managers from fresh clients.

Plain words: finished and abandoned Showdowns read from Firebase now flow into the shared career model, so History, Career Statistics and the Trophy Room can show real history. A finished Showdown counts exactly once with the totals its Terminal Close recorded; an abandoned one shows as a status row and counts for nothing; anything unreadable makes the career `partial`, never smaller.

This job does **not** change any Rules, does **not** load the new files in the app (no `index.html`, no `service-worker.js`, no screen script: G-13 wires them), and does **not** read transfers (G-10). Nothing changes on screen.

## 2. Branches and files

- The lead creates `gameplay/job-09-closed-adapter` from `gameplay/recovery-v1` at or after `843e64e`. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `js/sparkCompletedShowdownReader.js` and `js/sharedCareerAnalytics.js` exist there; if not, reply `Job 9 waits for job 8.` and stop.
- **Lane and CI path.** Work mode has Java 17 and cannot run the Firestore emulator (needs Java 21) and cannot `git push` (smoke `CAPABILITIES_WORK.md`). So: run `npm ci`, `node --check`, `npm run test:contracts`, `npm run test:ops` and `node tests/contracts/closed-showdown-adapter-contracts.cjs` locally; save files through the connector (WORKER_HANDBOOK §7 Path A); and read the emulator result from the "Validate Gameplay Fast" run on your **exact head commit** (job `rules-emulator`, step `Closed-Showdown adapter journey`; its log is your test output). Add the CI step in **step 3**, so CI runs the new emulator test from the first save.

Create:

- `js/sharedClosedShowdownAdapter.js` (Appendix A)
- `js/sparkClosedShowdownCareerLoader.js` (Appendix B)
- `tests/contracts/closed-showdown-adapter-contracts.cjs` (Appendix C)
- `tests/firebase/closed-showdown-adapter-emulator.cjs` (Appendix D)

Edit (and only these):

| File | Change |
| --- | --- |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended **last** in `tests` (Appendix E) |
| `tests/operations/pos20-control-plane.test.mjs` | one const after `completedShowdownReadContract`, and the same name appended **last** to `expectedSupplementalContracts` (Appendix E) |
| `.github/workflows/validate-gameplay-fast.yml` | one step appended as the **last step of the `rules-emulator` job**, after `Completed-only read matrix` (Appendix E). Not at the end of the file: JOB-16 adds a whole new job there |
| `project-documents/gameplay-factory/status/JOB-09.md` on `factory/gameplay-v1` | status file |

That is seven code files. `git diff --stat origin/gameplay/recovery-v1` (or the GitHub compare) must list exactly these seven.

**Registry ordering with jobs in flight.** Jobs 11, 16 and 18 also append one registry entry and one ops const. Order follows merge order: whoever merges later re-appends its own entry and const **last**, keeping every other entry. If one of them merges into `gameplay/recovery-v1` before you finish, update your branch from `gameplay/recovery-v1` and put `closed-showdown-adapter-contracts` back as the last JSON entry and `closedShowdownAdapterContract` back as the last array item. JSON regex patterns escape a dot as `\\.` in the file text (one backslash in the regex), never `\\\\.`.

**Guards you will meet (checked; all fine if you copy the appendices):**

- `tests/contracts/static-app-release-contracts.cjs:30`: no file in `js/` except `storage.js` and `diagnostics.js` may contain the word for browser local storage, even in a comment; every top-level-looking `function name(` must be unique across `js/`. The adapter's helpers start with `cad`, the loader's with `ccl`. Never rename them to `freeze`, `plain` or similar.
- `tests/contracts/statistics-architecture.cjs:63-64`: no second file in `js/` with "analytics" in its name. The two new names are allowed.
- `scripts/pos10-syntax.mjs` runs `node --check` on every `js/` file: script syntax only, no `import`/`export`.
- Startup budget (`tests/contracts/final-polish-presentation.cjs:53`, `static-app-release-contracts.cjs:28`): about 37,493 of 37,500 gzip bytes are used. The new files are **not** referenced by `index.html`, so they cost 0 startup bytes. Do not touch `index.html`.

Read first (on `gameplay/recovery-v1` at `843e64e`; line numbers are observations, re-check them):

1. `project-documents/leads/DATA_CONTRACT_V1.md` on `leads/relay`: §0 (statuses, managers, scoring, interim label), §6 "What counts", §7, §8. Field names are binding and change only through a relay message. This job changes no field.
2. JOB-03's model `js/sharedCareerAnalytics.js`: `verified` 33 (re-verifies every projection and the `final` totals and totals-only winner), `uniqueEntries` 50 (`pending` skipped; the same id with different data becomes `unavailable`), `buildCareerModel` 104 (`currentShowdownOnly` 105). You feed it; you never re-implement it.
3. JOB-05's adapter `js/sharedActiveShowdownAdapter.js`: `inspect` 20 (classification), `career` 130 (`careerInput`: `{indexStatus, showdowns:[entry]|[], currentShowdownOnly:true}`; a completed Showdown without a usable history becomes an `unavailable` entry; 0 accepted seasons gives `[]`). Its output is the loader's `current` argument.
4. JOB-08's reader `js/sparkCompletedShowdownReader.js`: `csrState` 42 (result shape `{status, code, rivalryId, managerRole, terminalWitness, projection, final}`), `csrRead` 132, `not-closed` for both `active` and `pending-pair` 142 (one read, no way to tell them apart), `abandoned` 145 (one read), exports 178. Reads per completed Showdown: 2 + 4N gets.
5. JOB-07's index client `js/persistentNikDanielPair.js`: `pairReadCareerIndexWith` 64 (head, then `page_1..page_K`, oldest first; duplicate ids are `CAREER_INDEX_INVALID`), `pairReadCareerIndex` 66 (never throws; `ready` / `unavailable` with a code), the replacement guard at 126 (an account with an **active** Showdown cannot pair again: `PERSISTENT_PAIR_ACTIVE_CONFLICT`; an old **pending** one can be replaced once its code has expired).
6. Tests to copy style from: `tests/contracts/shared-active-showdown-adapter-contracts.cjs` (pure/frozen/vm checks), `tests/support/active-showdown-fixtures.cjs` and `tests/support/career-fixture-helpers.cjs` (you use both, unchanged), `tests/firebase/two-manager-journey-emulator.cjs` (`pairFreshRivalry` 99, `playFreshSingleSeason` 127, provider abandon 206; the new emulator test reuses these patterns).
7. `tests/operations/pos20-control-plane.test.mjs` `completedShowdownReadContract` 72 and `expectedSupplementalContracts` 76 (ordered `deepEqual` against the registry paths).
8. Authority: Sol ruling S2C-005R2 §2 ("What counts") and §5 (cache per signed-in account in memory), lead handoff §3 (Nik's decisions: abandoned counts nothing; start now, no backfill) and §5 G-9 (`ready`/`partial`) on `leads/relay`.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. Never deploy anything. Emulator project ids start with `demo-`.
- Billing permanently OFF: Spark only. No Cloud Functions, no Cloud Run, no Blaze, no scheduled jobs, no server code. App Check enforcement stays off. **No Rules change** in this job: the reads it needs were granted by JOB-07 and JOB-08.
- Exactly two managers. `playerOne` = Daniel = `daniel` (left), `playerTwo` = Nik = `nik`. The adapter never keys anything by account, profile or save id; the career model's output carries none (contract C14, emulator C5).
- **Scoring never changes and the adapter never computes it.** Every season score comes from the reader's verified projection (CL 5, title 3, cup 1, performance 1, awards 1, season max 11). A completed Showdown enters the model only if its projection totals, the reader's `final` and the **Terminal Close witness `managerTotals`** all agree, and the winner follows the totals-only rule; anything else is `unavailable` (C4).
- **What counts** (DATA_CONTRACT §6, binding): completed = all seasons + exactly one outcome; abandoned = status row only, no seasons, no totals, no winner, even if a projection is attached (C3); unreadable = nothing invented, career `partial` (C5); pending = not listed. Abandoning later rebuilds the model; never subtract (C15, emulator B2).
- **No backfill** (Nik, 2026-10-01). A live Showdown that is not in the career index never enters career history (C12). Pre-index Showdowns stay out.
- **Privacy.** The adapter receives only final results (reader: Terminal-Closed seasons, all of which reached `RESULTS_READY`) and JOB-05's `careerInput` (which never carries unrevealed rival inputs). No new read path exists.
- **Pure adapter.** No `getDoc`, no Firebase names, no browser storage, `document`, `window`, `getState()`, timers, `Date.now()` or randomness; never throws; deep-frozen output; projections passed **by identity** (never copied or edited) (C16).
- **Loader.** Exact gets only, and only through `readCareerIndex()` and `readCompletedShowdown()`: no transaction, list, query, listener, write or `sessions` path; never throws; memory cache only (L1, L3, L4).
- **Lazy-loaded only.** Do not edit `index.html`, `service-worker.js`, any screen script (`statistics.js`, `screens.js`, `optionalModules.js`, `careerScreenSeam.js`, `onlinePlayerIdentity.js`), any provider, `js/persistentNikDanielPair.js` (`contractVersion` stays 4), `js/sparkCompletedShowdownReader.js`, `js/sharedCareerAnalytics.js`, `js/sharedActiveShowdownAdapter.js`, any Rules file, either build script, or any test not listed in §2. No visual change.
- Never weaken, skip or delete an existing assertion.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 From reader result to career entry

The adapter walks the career index in order and turns each id into one career entry. `live` means the current Showdown's entry in JOB-05's `careerInput` **for the same rivalry id**.

| Reader `status` | Live view of the same id | Career entry `classification` | `projection` / `final` |
| --- | --- | --- | --- |
| `completed`, witness + projection + final agree | none, or `active` / `completion-pending` / `pending` / `abandoned` / `unavailable` | `completed` | reader projection (same object); `final = {totals: witness.managerTotals, winner: witness.winner}` |
| `completed`, they agree | `completed` with the same totals and winner | `completed` | as above |
| `completed`, they agree | `completed` with different totals or winner | `unavailable` (`CLOSED_STATE_CONFLICT`) | `null` / `null` |
| `completed`, any check fails | any | `unavailable` (`CLOSED_COMPLETED_INVALID`) | `null` / `null` |
| `abandoned` | anything but `completed` | `abandoned` (status row) | `null` / `null`, even if the read carried a projection |
| `abandoned` | `completed` | `unavailable` (`CLOSED_STATE_CONFLICT`) | `null` / `null` |
| `not-closed` | `active` / `completion-pending` / `pending` | the live classification | the live entry's own `projection` (same object) and `final` |
| `not-closed` | `completed` or `abandoned` | `unavailable` (`CLOSED_STATE_CONFLICT`; a stale read, the next load fixes it) | `null` / `null` |
| `not-closed` | live `unavailable` | `unavailable` (`CLOSED_CURRENT_UNAVAILABLE`) | `null` / `null` |
| `not-closed` | no live entry for this id, live state known | `pending` (excluded: not listed, not in coverage) (`CLOSED_NOT_CURRENT`) | `null` / `null` |
| `not-closed` | live state unknown (missing, malformed, `unavailable`) | `unavailable` (`CLOSED_CURRENT_UNKNOWN`) | `null` / `null` |
| `unavailable` | any | `unavailable` (the reader's code) | `null` / `null` |
| missing, malformed, wrong `rivalryId`, role not `playerOne`/`playerTwo` | any | `unavailable` (`CLOSED_READ_MISSING` / `CLOSED_READ_INVALID`) | `null` / `null` |

Whole-career states:

| Index (`readCareerIndex()`) | Live `careerInput.indexStatus` | Adapter `indexStatus` |
| --- | --- | --- |
| `loading` | any | `loading` |
| `unavailable`, or malformed (not an array, a bad id, a duplicate) | any | `unavailable` (model: every number `null`) |
| `ready` | `loading` | `loading` (wait for the live Showdown) |
| `ready` | `ready`, `unavailable` or unknown | `ready`, entries per the table above |

A live entry whose rivalry id is **not** in the index is never added (no backfill); `describeClosedCareer` reports it as `outside-index` / `CLOSED_NOT_INDEXED`.

Why a `not-closed` id that is not the live Showdown is `pending`: the reader cannot tell `active` from `pending-pair`, but an account with an active Showdown cannot pair again (`PERSISTENT_PAIR_ACTIVE_CONFLICT`, `persistentNikDanielPair.js:126`), so any other not-closed id in an index is an expired connection code Daniel created that Nik never redeemed. Only Daniel's index can hold one (Nik appends only on redemption). Excluding it is exactly Sol's correction "pending unpaired entries excluded when comparing Daniel's and Nik's sets", and it is what makes both managers' models identical (C9).

### 4.2 Requirements and proofs

"C"/"L" ids are contract cases (§6.1, Appendix C); "E:" ids are emulator checks (§6.2, Appendix D).

| # | Requirement | How it is enforced | Proved by |
| --- | --- | --- | --- |
| R1 | Finished Showdowns read from Firebase flow into the career model | loader: index -> reader -> adapter -> `buildCareerModel` | C2, C7, L2, E:A2, E:C2, E:C4 |
| R2 | A completed Showdown counts once, with totals equal to the Terminal Close `managerTotals` | `cadCompleted`: witness verifies, coverage N of N, projection totals == witness, `final` totals/winner/margin/seasonsPlayed == witness; the model re-checks `final` against the projection | C2, C4 (11 forgeries), C13, E:A2, E:C5 |
| R3 | Abandoned counts nothing; abandoning later rebuilds | abandoned -> status row, projection dropped; model rebuilds from scratch | C3, C15, E:B1, E:B2 |
| R4 | Unreadable is never empty or shorter | every failure -> `unavailable` entry -> model `partial` with `coverage` | C4, C5, C10, L4, L5, E:D2 |
| R5 | The live Showdown joins career history through JOB-05, never re-derived | `not-closed` + live entry of the same id -> live classification and its projection by identity | C7, C8, E:A1, E:B1, E:C2 |
| R6 | Stale pending connection codes are excluded, so both managers agree | `not-closed` without a live entry -> `pending` | C9, E:C4 |
| R7 | Terminal views win over lagging live views; two terminal views that disagree are unavailable | §4.1 table | C11 |
| R8 | No backfill | live entry outside the index is not added | C12 |
| R9 | Scoring unchanged | adapter never computes a score; source grep | C13 |
| R10 | Exactly two managers; identical career for Daniel and Nik; no ids in the model | slot roles only; reader `managerRole` only validated, never used for keys | C14, L2, E:C4, E:C5 |
| R11 | Pure, frozen, never throws, deterministic | source grep; frozen walk with borrowed projections; caller input unchanged; vm browser global | C16, C17 |
| R12 | Loader: exact gets only through the two modules; no session, write, list or storage | source grep; options passed through | L1, L2 |
| R13 | Cache per signed-in account, in memory, terminal results only | `completed`/`abandoned` cached by rivalry id; cleared on account change; `not-closed`/`unavailable` re-read | L3, E:C3, E:C4 |
| R14 | Index paging (JOB-07) walked in order | real `readCareerIndex()` over a sealed 500-id page + head | L5, E:C1 |
| R15 | Strangers get nothing | no index -> `empty`; direct read `permission-denied` | E:D1 |
| R16 | No Rules, shell, screen or startup change; existing suites unchanged | seven-file diff; all prior CI steps stay green | step 6 |

### 4.3 API

`js/sharedClosedShowdownAdapter.js`. Browser global `CareerModeSharedClosedShowdownAdapter`; CommonJS export for tests. Dependencies: `sharedHistoryConvergence.js` (`verifyProjection`) and `sharedTerminalClose.js` (`verifyIntent`), as `require` in Node and the globals `CareerModeSharedHistoryConvergence` / `CareerModeSharedTerminalClose` in the browser.

| Export | Shape |
| --- | --- |
| `buildClosedCareerInput({index, reads, current})` | never throws; frozen `{indexStatus, showdowns, currentShowdownOnly:false}`, exactly `buildCareerModel`'s input. `index` = `readCareerIndex()` result; `reads` = plain object `{[rivalryId]: readCompletedShowdown() result}`; `current` = JOB-05 `careerInput(snapshot)`. Projections inside are the callers' objects (identity). |
| `describeClosedCareer({index, reads, current})` | never throws; frozen array of `{rivalryId, source, classification, code}` per index id (`source`: `reader`, `current`, `excluded`), plus `outside-index` and `index` notes. Diagnostics for tests and G-13; screens never show codes. |
| `readStatuses` | `['completed','abandoned','not-closed','unavailable']` |
| flags | `sessionRequired, providerWriteRequired, listPermissionRequired, canonicalStorageMutation, billingRequired` all `false`; `contractVersion:1` |

`js/sparkClosedShowdownCareerLoader.js`. Browser global `CareerModeSparkClosedShowdownCareerLoader`. Dependencies (lazy, at call time): `persistentNikDanielPair.js`, `sparkCompletedShowdownReader.js`, `sharedClosedShowdownAdapter.js`, `sharedCareerAnalytics.js` (globals `CareerModePersistentNikDanielPair`, `CareerModeSparkCompletedShowdownReader`, `CareerModeSharedClosedShowdownAdapter`, `CareerModeSharedCareerAnalytics` in the browser).

| Export | Shape |
| --- | --- |
| `loadClosedShowdownCareer({firestore, firebaseSdk, user, cryptoImpl, current})` | `async`, never throws. `firebaseSdk` needs only `doc` and `getDoc`. Reads the index for `user.uid`, then each indexed Showdown **in order, one at a time**. Returns frozen `{status, accountId, careerInput, model, entries}` (`status` = `model.status`; `entries` = `describeClosedCareer`). Missing user -> `CLOSED_AUTH_REQUIRED`; missing services -> `CLOSED_PROVIDER_UNAVAILABLE` (both `unavailable`). |
| `clearClosedShowdownCache()`, `closedShowdownCacheSize()` | memory cache control (G-13 clears on sign-out) |
| flags | `sessionRequired, deviceRequired, providerWriteRequired, listPermissionRequired, canonicalStorageMutation, billingRequired` all `false`; `contractVersion:1` |

Firestore gets per load (exact, from the emulator): first load for an account = 1 index head (+ 1 per sealed page) + (2 + 4N) per completed N-season Showdown + 1 per abandoned or not-closed Showdown. Later loads for the same account = index + 1 per not-closed Showdown. The journey in §6.2 costs 17 gets first, then 2.

### 4.4 Existing tests: what must stay untouched

Must stay byte-identical (check with the compare in step 6): every `js/` file except the two new ones, every `firestore*.rules`, both build scripts, `index.html`, `service-worker.js`, `.github/workflows/deploy-*.yml`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10 kernel files, `tests/support/*`, every other `tests/contracts/*.cjs`, every `tests/firebase/*-emulator.cjs` (journey, career index, completed read, pair provider, lifecycle, terminal close, setup, transfer), every `tests/browser/*`.

### 4.5 The generated-rules trap

`npm run test:contracts` rebuilds `firestore.spark.generated.rules` **without** the persistent-pair fragment. Any emulator run after it, without rebuilding, has no career index and no completed-read grant (the new test fails at I0). CI's `rules-emulator` job already builds both before its first step; do not reorder it. If you ever run an emulator locally, first run:

```bash
node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
```

Never commit `firestore.spark.generated.rules` or `firestore-debug.log`.

## 5. Steps

After each step update `status/JOB-09.md` on `factory/gameplay-v1` with `Job 9 step k/7: <step name>`. Save code to `gameplay/job-09-closed-adapter` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1` (at or after `843e64e`), `npm ci`. Run `npm run test:contracts` (record `N/N`, expected `103/103` at `843e64e`; it becomes `N+1` in step 5) and `npm run test:ops` (expected pass 73 / fail 0). Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1` (it includes `Completed-only read matrix`). If it is not green, set BLOCKED: `Job 9 is blocked: recovery-v1 CI is red before any change.` If jobs 11, 16 or 18 merged since `843e64e`, write which in the Notes (registry order, §2).
2. **Map.** Confirm every line number in §2 "Read first" on the current head and write drift in the Notes. Run `node tests/support/active-showdown-fixtures.cjs`; it must print `CLOSED 5 playerOne SHOWDOWN_COMPLETE`. Confirm `js/sharedClosedShowdownAdapter.js` and `js/sparkClosedShowdownCareerLoader.js` do not exist yet.
3. **Tests first.** Create `tests/contracts/closed-showdown-adapter-contracts.cjs` (Appendix C) and `tests/firebase/closed-showdown-adapter-emulator.cjs` (Appendix D). Apply Appendix E (registry entry last, ops const last, CI step `Closed-Showdown adapter journey` as the last step of `rules-emulator`). `node --check` both new files. Run the contract locally: it must **fail** with `Cannot find module …/js/sharedClosedShowdownAdapter.js`. Save. On CI, on your head: `Gameplay contracts` fails only on the new contract; in `rules-emulator` every existing step is green and `Closed-Showdown adapter journey` fails with `Cannot find module '../../js/sparkClosedShowdownCareerLoader.js'`. This red run is your tests-first evidence; link it.
4. **Pure adapter.** Create `js/sharedClosedShowdownAdapter.js` (Appendix A). `node --check` it. Run the contract locally: C1-C17 pass and it fails at `L1 loader surface and source: Cannot find module …/js/sparkClosedShowdownCareerLoader.js`. Save. Record.
5. **Loader.** Create `js/sparkClosedShowdownCareerLoader.js` (Appendix B). `node --check` it. Run the contract locally: `PASS closed-Showdown adapter contracts (22/22 cases) …`. Run `npm run test:contracts` (`(N+1)/(N+1)`, expected `104/104`) and `npm run test:ops` (fail 0). Save. CI should now be fully green; if not, go to §8.
6. **Full proof.** On CI, on your exact head: every step of both jobs green; paste the last line of `Closed-Showdown adapter journey` (`PASS closed-Showdown adapter emulator: 12 numbered checks …`) and of `Completed-only read matrix`, `Two-manager journey` and `Career index matrix` (both lines). Run the qualified expression-budget gate (§7). GitHub compare with `gameplay/recovery-v1`: exactly the seven §2 files, no generated Rules, no `firestore-debug.log`.
7. **PR and finish.** Open the PR into `gameplay/recovery-v1` titled `Job 9: closed-Showdown adapter into the career model`. Body: the §4.1 table, the §4.2 table, the seven files, the CI run URL on the exact head, and the line "No Rules, shell or screen change: the new modules are not loaded by the app until G-13." Fill the Done checklist, set `State: DONE`, save `Job 9 done: Closed-Showdown adapter into the career model`. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a). No Codex review on this job.

## 6. Tests first

### 6.1 Contract test (`tests/contracts/closed-showdown-adapter-contracts.cjs`, Appendix C)

No Firebase, no emulator. Runs in `npm run test:contracts` through the registry entry. Fixtures come from the real model functions: projections from `career-fixture-helpers.cjs` (`buildProjection`), Terminal Close witnesses from `Terminal.prepare` via `active-showdown-fixtures.cjs` `closed(p)`, live `careerInput` from the real JOB-05 adapter. Reader results copy `csrState`'s shape exactly.

| Id | Proves |
| --- | --- |
| C1 | API surface, five safety flags `false`, frozen module |
| C2 | completed: one entry, projection by identity, `final` from the witness; model `ready`, `careerPoints` == witness totals, one completed Showdown, row `completed` 6-3 |
| C3 | abandoned (even with a forged projection attached): status row, Nik's 11-point season counts nowhere |
| C4 | 11 forgeries (witness totals, final totals, winner, margin, seasonsPlayed, tampered projection, 2 of 3 seasons, other-rivalry witness, missing witness, read for another id, bad role) -> `unavailable`, model `partial`, 0 points invented |
| C5 | reader `unavailable`, missing read, malformed read -> `unavailable` row with its code; the readable Showdown still counts |
| C6 | index `loading` / `unavailable` / malformed (5 shapes) / empty; live `loading` -> `loading` |
| C7 | completed + abandoned + live active: rows `completed, abandoned, in-progress`; live projection by identity; points 9-3 |
| C8 | live completion-pending counts seasons, not the outcome |
| C9 | stale pending id in Daniel's index only -> excluded; Daniel's and Nik's models deep-equal |
| C10 | not-closed with unknown live state (4 shapes) -> `unavailable`, `partial`; unknown live state never touches closed Showdowns |
| C11 | §4.1 conflicts: live closed vs not-closed read; closed read vs lagging live; agreeing and disagreeing witnesses; reloaded closed pair without local witness; abandon irreversible |
| C12 | no backfill: live Showdown outside the index stays out; `outside-index` note |
| C13 | scoring unchanged for 1/3/5/10 seasons (11 max, bonuses never 2); adapter source never computes a score |
| C14 | Daniel-view and Nik-view reads give identical input; model keyed `daniel`/`nik`, no ids |
| C15 | abandoning later removes those seasons from totals, perfect seasons, bests and records |
| C16 | never throws (6 bad inputs); frozen except borrowed projections; caller input unchanged and unfrozen; deterministic; purity grep; a conflicting global `currentShowdown` changes nothing |
| C17 | browser: vm with the two globals exposes `CareerModeSharedClosedShowdownAdapter`, same output |
| L1 | loader API and flags; source grep (no transaction, list, query, listener, write, storage, `sessions`, `getState`, timers); index read with exact options |
| L2 | index walked in order, reader called with exactly `{cryptoImpl, firebaseSdk, firestore, rivalryId, user}`; identical models for Daniel and Nik |
| L3 | completed/abandoned cached, live re-read; account change clears the cache |
| L4 | never throws (6 bad option sets); index failure -> `unavailable`; reader failure -> that entry `unavailable`, career `partial` |
| L5 | real `readCareerIndex()` over a sealed 500-id `page_1` + head: head then page read, one exact root get per id in order, 501 missing Showdowns -> `partial` 0 of 501 |

### 6.2 Emulator test (`tests/firebase/closed-showdown-adapter-emulator.cjs`, Appendix D)

Composed production Rules, project `demo-cms-closed-adapter` locally / `demo-cms-gameplay-fast-closed-adapter` in CI. Accounts: Daniel `acct_game_a` (`playerOne`), Nik `acct_game_b` (`playerTwo`), stranger `acct_game_c`. Every Showdown is paired through the provider (`createPairing` / `redeemPairing` with the JOB-07 witnesses, so both career indexes record it), then played through the real providers on the JOB-02 gameplay bridge. Every career read uses a **fresh** authenticated client and a counting `{doc, getDoc}`. The live `current` is JOB-05 `careerInput` built from the real pair link and root (and, while live, the real `History.read` / `Multi.read` results). Output: one `ok <n> <id> <label>` line per check, then `PASS closed-Showdown adapter emulator: 12 numbered checks …`.

| Id | Check | Expect |
| --- | --- | --- |
| I0 | composed Rules carry the career index match and the completed-read grant (4) | assert |
| A1 | Showdown 1, 3 seasons played, before Terminal Close, both managers | `completion-pending` from `current`; Daniel 11 points; 0 completed Showdowns |
| A2 | after a real Terminal Close (live pair now "closed" with no local witness), both managers | `completed` from `reader`; `final` == root witness `{11, 4}`, winner Daniel; row totals 11-4 |
| B1 | Showdown 2 live, 1 of 3 seasons, Nik 11 points (Nik) | `[completed, active]`; Nik 15 points, 1 perfect season |
| B2 | Showdown 2 abandoned through `abandonCurrentShowdown`, both managers | `[completed, abandoned]`; Nik back to 4, 0 perfect seasons, best 3; abandoned row has no totals, winner or seasons |
| C1 | both career indexes | `[R1, R2, R3]` |
| C2 | Daniel, Showdown 3 live with 1 season | `ready`; `[completed, abandoned, active]`; sources `[reader, reader, current]`; exactly 17 gets |
| C3 | Daniel again, same loader | 2 gets (cache); identical model |
| C4 | Nik, fresh client and own index | 17 gets (cache cleared on account change); model deep-equal to Daniel's |
| C5 | career numbers | coverage 3/3; Daniel 11+3, Nik 4; 4 seasons; Showdowns 1-0 / 0-1; biggest win Daniel by 7 on R1; no interim label; no ids |
| D1 | stranger | loader `empty` (no index); direct reader `permission-denied` |
| D2 | Daniel with no live state | `partial`; the live Showdown is `unavailable` (`CLOSED_CURRENT_UNKNOWN`), never hidden |

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 3 (URL): contract fails on the missing adapter module, `Closed-Showdown adapter journey` fails on the missing loader module, every existing step green; step 4 contract failing at L1.
- [ ] `node tests/contracts/closed-showdown-adapter-contracts.cjs` PASS (22/22) locally; `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including `Closed-Showdown adapter journey` (12 numbered checks), `Completed-only read matrix` (56), `Two-manager journey` and `Career index matrix` (Phase A 56, Phase B 58).
- [ ] Emulator proves for both managers from fresh clients: R1 `completed` with totals equal to the Terminal Close `managerTotals`, R2 `abandoned` counting nothing, R3 live from JOB-05, identical models, 17 then 2 gets.
- [ ] Qualified expression-budget gate (unchanged from JOB-08): every emulator case that expects success passes; the phrase `maximum of 1000 expressions` may appear only next to cases that expect PERMISSION_DENIED (today only career-index `D13`, once per phase). None may appear in the new step's log. Record the case names.
- [ ] Compare lists exactly the seven §2 files; no Rules, `index.html`, `service-worker.js`, screen, provider or other `js/` file changed; no generated Rules or `firestore-debug.log`; `contractVersion` in `js/persistentNikDanielPair.js` still 4.
- [ ] Registry entry and ops const are the last items (after any job that merged first), patterns use `\\.`.
- [ ] No deploy, nothing pushed to `main`.
- [ ] PR open into `gameplay/recovery-v1` with the §4.1 and §4.2 tables and the no-change line. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 9 is blocked: <one line>`.

Known traps:

- **The registry test fails with a deep-equal diff on `expectedSupplementalContracts`.** Another job merged first. Put `closedShowdownAdapterContract` back as the last item and the JSON entry back as the last entry, keeping theirs (§2).
- **`static-app-release-contracts` fails** (duplicate function name, or the storage word). You renamed a `cad…`/`ccl…` helper or added a comment. Re-apply Appendix A/B byte for byte.
- **Emulator I0 fails.** The composed Rules lack the pair fragment (§4.5). In CI this cannot happen unless the workflow order changed; never reorder it.
- **E:A1/E:B1 fail with a pairing error** (`PERSISTENT_PAIR_ACTIVE_CONFLICT`). The previous Showdown was not closed or abandoned before the next pairing. Do not reorder Appendix D.
- **E:C2 gets count is not 17.** The loader reads in a different order or re-reads: the count is index head 1 + R1 (2 + 4×3) + R2 root 1 + R3 root 1. Do not change the loader to read in parallel or to prefetch.
- **A model mismatch between Daniel and Nik.** One of them saw a different live classification. Both `current` inputs come from their own pair link; check that both pair links name R3.
- `firestore-debug.log` appears after local emulator runs. Never commit it.

## 8a. Lead decisions (2026-10-03)

- **Lead confirms (2026-10-03):** the career stays `loading` while the live Showdown loads, as in JOB-05 (G-13 may revisit); a live Showdown that predates the career index stays out of career history; sequential exact gets with the in-memory cache are fine for Spark. Run this job after JOB-11 in the Work lane (one Work chat at a time); JOB-11 touches `js/sharedActiveShowdownAdapter.js` line 48 only, no conflict with this job.
- **`not-closed` without a live entry is `pending`** (excluded), §4.1 reasoning. The reader stays unchanged (no need to expose `connectionState`).
- **Terminal reads win over lagging live views.** The reader verified the root's own witness and rebuilt every season; JOB-05 may still say `active`, `completion-pending`, or, on a reloaded device, `abandoned` (closed pair, no local Terminal Close state). Only two terminal views that disagree (two different witnesses, or witness vs no witness) become `unavailable`. This is "never pick a side" applied to equal authorities.
- **Live `loading` makes the career `loading`**, as in JOB-05. Live state unknown or `unavailable` touches only `not-closed` ids (they become `unavailable`); closed Showdowns still show.
- **No backfill**: the live Showdown counts in career history only if it is in the career index. The Rivalry screen still shows it from JOB-05.
- **Cache**: memory only, per signed-in account, `completed` and `abandoned` only (both are irreversible). S2C-005R2 §5. G-13 calls `clearClosedShowdownCache()` on sign-out; an account change clears it anyway.
- **Reads are sequential** in career order (deterministic cost, no burst). Parallel reads are a later optimisation if a career ever gets long.
- **`careerInput` keeps the providers' projections by identity**, which contain internal slot ids, exactly like JOB-05. Screens bind to the model, never to `careerInput`.
- **No data-contract change**; no relay message needed. `coverage.indexed` counts listed Showdowns (pending excluded), as JOB-03 already does.
- **Not in this job**: wiring (G-13 obtains `firestore`/`firebaseSdk` from `CareerModeProductionFirebaseRuntime.ensureAccountServices()` and `current` from `CareerModeSharedActiveShowdownAdapter.careerInput(snapshot)`, and adds the files to the lazy shell list), transfer history (G-10), contract fixtures (G-11).

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `843e64e` (Java 21, firebase-tools 15.28.1, firebase 12.17.1, @firebase/rules-unit-testing 5.0.1, node 22; CI uses node 24). Results on that worktree: `node tests/contracts/closed-showdown-adapter-contracts.cjs` PASS 22/22; `npm run test:contracts` `104/104` (baseline `103/103`); `npm run test:ops` 73 pass / 0 fail (unchanged); the new emulator test PASS 12 numbered checks twice (about 22 s each, alternate emulator ports); one `emulators:exec` running every `rules-emulator` CI step in order (setup provider, transfer fresh-session, lifecycle 1 and 3, terminal close, pair matrix, journey 3 seasons, career index Phase A 56 and Phase B 58, completed-only read 56, closed-Showdown adapter 12) all PASS in 90 s. Budget: the only `maximum of 1000 expressions` lines were the two known career-index `D13` denials; none in the new test's log. Tests-first states verified: without both modules the contract fails on `…/js/sharedClosedShowdownAdapter.js` and the emulator test on `../../js/sparkClosedShowdownCareerLoader.js`; with the adapter only, the contract passes C1-C17 and fails at L1. Not run by the lead: GitHub CI itself (your step 3-6 runs are the first). Apply the appendices as given; if a hunk does not apply because the branch moved (another job's registry entry), re-apply by hand keeping theirs and say so in the status Notes. Diffs are against `843e64e`.

### Appendix A. New pure adapter: `js/sharedClosedShowdownAdapter.js` (full file)

````js
(function(root,factory){
  const node=typeof module!=="undefined"&&module.exports;
  const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose);
  if(node)module.exports=api;else root.CareerModeSharedClosedShowdownAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History,Terminal){
  "use strict";

  // JOB-09 (G-9): pure adapter. Career index + session-free reader results (+ the current Showdown's
  // careerInput from the active adapter) -> exactly the input of sharedCareerAnalytics.buildCareerModel.
  // No reads, no writes, no storage, no globals: everything arrives as one argument.
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const READ_STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable"]);
  const CURRENT_CLASSES=Object.freeze(["pending","active","completion-pending","completed","abandoned","unavailable"]);
  const INDEX_STATUSES=Object.freeze(["loading","unavailable","ready"]);

  function cadPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  // Projections are borrowed by identity (already frozen by their producer); freeze only what this adapter owns.
  function cadFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cadFreeze(item,borrowed));Object.freeze(value);}return value;}
  function cadWinner(a,b){return a>b?"playerOne":b>a?"playerTwo":"draw";}
  function cadEntry(rivalryId,classification,projection=null,final=null){return {rivalryId,classification,projection,final};}
  function cadNote(rivalryId,source,classification,code=null){return {rivalryId,source,classification,code};}

  function cadIndex(index){
    if(!cadPlain(index)||!INDEX_STATUSES.includes(index.status))return {status:"unavailable",ids:[],code:"CLOSED_INDEX_INVALID"};
    if(index.status!=="ready")return {status:index.status,ids:[],code:index.status==="unavailable"?(typeof index.code==="string"&&index.code?index.code:"CLOSED_INDEX_UNAVAILABLE"):null};
    const ids=index.rivalryIds;
    if(!Array.isArray(ids)||ids.some(id=>typeof id!=="string"||!RIVALRY_ID.test(id))||new Set(ids).size!==ids.length)return {status:"unavailable",ids:[],code:"CLOSED_INDEX_INVALID"};
    return {status:"ready",ids:[...ids],code:null};
  }
  // current = sharedActiveShowdownAdapter.careerInput(snapshot): {indexStatus, showdowns:[entry]|[], currentShowdownOnly:true}.
  function cadCurrent(current){
    if(!cadPlain(current)||current.currentShowdownOnly!==true||!INDEX_STATUSES.includes(current.indexStatus)||!Array.isArray(current.showdowns))return {status:"unknown",entry:null};
    if(current.indexStatus!=="ready")return {status:current.indexStatus==="loading"?"loading":"unknown",entry:null};
    if(current.showdowns.length===0)return {status:"known",entry:null};
    const entry=current.showdowns[0];
    if(current.showdowns.length!==1||!cadPlain(entry)||typeof entry.rivalryId!=="string"||!RIVALRY_ID.test(entry.rivalryId)||!CURRENT_CLASSES.includes(entry.classification))return {status:"unknown",entry:null};
    return {status:"known",entry};
  }
  // A completed read counts only if the rebuilt projection, the reader's final and the Terminal Close witness all agree.
  function cadCompleted(read,rivalryId){
    const witness=Terminal.verifyIntent(read.terminalWitness);
    const projection=History.verifyProjection(read.projection);
    const totals=witness.managerTotals,final=read.final;
    if(witness.rivalryId!==rivalryId||projection.rivalryId!==rivalryId)throw new Error("CLOSED_RIVALRY_MISMATCH");
    if(projection.totalSeasons!==witness.totalSeasons||projection.acceptedSeasons!==witness.totalSeasons||projection.seasonHistory.length!==witness.totalSeasons)throw new Error("CLOSED_COVERAGE_MISMATCH");
    if(projection.managerRecords.playerOne.totalPoints!==totals.playerOne||projection.managerRecords.playerTwo.totalPoints!==totals.playerTwo)throw new Error("CLOSED_TOTALS_MISMATCH");
    if(!cadPlain(final)||!cadPlain(final.totals)||final.totals.playerOne!==totals.playerOne||final.totals.playerTwo!==totals.playerTwo||final.winner!==witness.winner||final.winner!==cadWinner(totals.playerOne,totals.playerTwo)||final.margin!==Math.abs(totals.playerOne-totals.playerTwo)||final.seasonsPlayed!==witness.totalSeasons)throw new Error("CLOSED_FINAL_MISMATCH");
    return cadEntry(rivalryId,"completed",read.projection,{totals:{playerOne:totals.playerOne,playerTwo:totals.playerTwo},winner:witness.winner});
  }
  function cadClassify(rivalryId,read,current){
    if(!cadPlain(read))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_MISSING")];
    if(!READ_STATUSES.includes(read.status)||read.rivalryId!==rivalryId)return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_INVALID")];
    if(read.status==="unavailable")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable",typeof read.code==="string"&&read.code?read.code:"CLOSED_READ_UNAVAILABLE")];
    if(!ROLES.includes(read.managerRole))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_INVALID")];
    const live=current.entry&&current.entry.rivalryId===rivalryId?current.entry:null;
    if(read.status==="completed"){
      let entry;
      try{entry=cadCompleted(read,rivalryId);}catch(_error){return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_COMPLETED_INVALID")];}
      // The reader verified the root's own Terminal Close witness and rebuilt every season, so it wins over a live
      // view that is still catching up (active, completion-pending, or a reloaded "closed" pair with no local witness).
      // Two verified witnesses that disagree are an integrity failure: never pick a side.
      if(live&&live.classification==="completed"&&(live.final?.totals?.playerOne!==entry.final.totals.playerOne||live.final?.totals?.playerTwo!==entry.final.totals.playerTwo||live.final?.winner!==entry.final.winner))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_STATE_CONFLICT")];
      return [entry,cadNote(rivalryId,"reader","completed")];
    }
    if(read.status==="abandoned"){
      if(live&&live.classification==="completed")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_STATE_CONFLICT")];
      // Abandoned: status row only; any seasons shown before are dropped (rebuild, never subtract).
      return [cadEntry(rivalryId,"abandoned"),cadNote(rivalryId,"reader","abandoned")];
    }
    // not-closed: the root is active or pending-pair. Only the live Showdown can say which, and what it holds.
    if(current.status!=="known")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_CURRENT_UNKNOWN")];
    if(!live)return [cadEntry(rivalryId,"pending"),cadNote(rivalryId,"excluded","pending","CLOSED_NOT_CURRENT")];
    if(live.classification==="completed"||live.classification==="abandoned")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_STATE_CONFLICT")];
    if(live.classification==="unavailable")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_CURRENT_UNAVAILABLE")];
    return [cadEntry(rivalryId,live.classification,live.projection??null,live.final??null),cadNote(rivalryId,"current",live.classification)];
  }
  function cadPlan(options){
    const o=cadPlain(options)?options:{},index=cadIndex(o.index),current=cadCurrent(o.current),reads=cadPlain(o.reads)?o.reads:{};
    if(index.status==="loading")return {indexStatus:"loading",showdowns:[],notes:[]};
    if(index.status!=="ready")return {indexStatus:"unavailable",showdowns:[],notes:[cadNote(null,"index","unavailable",index.code)]};
    if(current.status==="loading")return {indexStatus:"loading",showdowns:[],notes:[]};
    const showdowns=[],notes=[];
    for(const id of index.ids){const [entry,note]=cadClassify(id,Object.hasOwn(reads,id)?reads[id]:null,current);showdowns.push(entry);notes.push(note);}
    // No backfill: a live Showdown that is not in the career index never enters career history.
    if(current.entry&&!index.ids.includes(current.entry.rivalryId))notes.push(cadNote(current.entry.rivalryId,"outside-index",current.entry.classification,"CLOSED_NOT_INDEXED"));
    return {indexStatus:"ready",showdowns,notes};
  }
  function cadBorrowed(showdowns){return new Set(showdowns.map(entry=>entry.projection).filter(Boolean));}
  function buildClosedCareerInput(options){
    try{const plan=cadPlan(options);return cadFreeze({indexStatus:plan.indexStatus,showdowns:plan.showdowns,currentShowdownOnly:false},cadBorrowed(plan.showdowns));}
    catch(_error){return cadFreeze({indexStatus:"unavailable",showdowns:[],currentShowdownOnly:false});}
  }
  function describeClosedCareer(options){
    try{return cadFreeze(cadPlan(options).notes.map(note=>({...note})));}
    catch(_error){return cadFreeze([cadNote(null,"index","unavailable","CLOSED_ADAPTER_FAILED")]);}
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-adapter",readStatuses:READ_STATUSES,buildClosedCareerInput,describeClosedCareer,sessionRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});
````

### Appendix B. New loader: `js/sparkClosedShowdownCareerLoader.js` (full file)

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkClosedShowdownCareerLoader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-09 (G-9): thin loader. Walks the signed-in account's career index (pages, then head; JOB-07),
  // reads each Showdown with the session-free reader (JOB-08), and hands everything to the pure adapter
  // and the career model. Exact gets only, through those two modules; no session, no write, no list.
  // Terminal results (completed, abandoned) are cached in memory per signed-in account only.
  const cclNode=typeof module!=="undefined"&&module.exports;
  const cclModule=(file,key)=>cclNode?require(file):root[key];
  const cclModules={
    get pair(){return cclModule("./persistentNikDanielPair.js","CareerModePersistentNikDanielPair");},
    get reader(){return cclModule("./sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader");},
    get adapter(){return cclModule("./sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter");},
    get career(){return cclModule("./sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics");}
  };
  const TERMINAL=Object.freeze(["completed","abandoned"]);
  let cclCacheAccount=null;
  const cclCache=new Map();

  function cclFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cclFreeze(item,borrowed));Object.freeze(value);}return value;}
  function cclClear(){cclCache.clear();cclCacheAccount=null;}
  function cclResult(accountId,careerInput,entries){
    const model=cclModules.career.buildCareerModel(careerInput);
    return cclFreeze({status:model.status,accountId,careerInput,model,entries},new Set([careerInput,model,entries]));
  }
  function cclUnavailable(accountId,code){
    const careerInput=cclModules.adapter.buildClosedCareerInput({index:{status:"unavailable",code}});
    return cclResult(accountId,careerInput,Object.freeze([Object.freeze({rivalryId:null,source:"index",classification:"unavailable",code})]));
  }
  async function cclRead(reader,options,uid,rivalryId){
    const key=rivalryId;
    if(cclCache.has(key))return cclCache.get(key);
    let read;
    try{read=await reader.readCompletedShowdown({firestore:options.firestore,firebaseSdk:options.firebaseSdk,user:{uid},rivalryId,cryptoImpl:options.cryptoImpl});}
    catch(_error){read=null;}
    if(read&&read.rivalryId===rivalryId&&TERMINAL.includes(read.status)&&cclCacheAccount===uid)cclCache.set(key,read);
    return read;
  }
  async function cclLoad(options={}){
    let uid=null;
    try{
      const o=options&&typeof options==="object"?options:{};
      uid=o.user&&typeof o.user.uid==="string"?o.user.uid.trim():"";
      if(!uid){uid=null;return cclUnavailable(null,"CLOSED_AUTH_REQUIRED");}
      if(!o.firestore||!o.firebaseSdk||typeof o.firebaseSdk.doc!=="function"||typeof o.firebaseSdk.getDoc!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      const pair=cclModules.pair,reader=cclModules.reader;
      if(!pair||typeof pair.readCareerIndex!=="function"||!reader||typeof reader.readCompletedShowdown!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      // A different signed-in account never sees the previous account's cached Showdowns.
      if(cclCacheAccount!==uid){cclCache.clear();cclCacheAccount=uid;}
      let index;
      try{index=await pair.readCareerIndex({firestore:o.firestore,firebaseSdk:o.firebaseSdk,accountId:uid});}catch(_error){index={status:"unavailable",code:"CAREER_INDEX_UNAVAILABLE"};}
      const reads={};
      if(index&&index.status==="ready"&&Array.isArray(index.rivalryIds)){
        for(const rivalryId of index.rivalryIds){if(typeof rivalryId==="string"&&!Object.hasOwn(reads,rivalryId))reads[rivalryId]=await cclRead(reader,o,uid,rivalryId);}
      }
      const input={index,reads,current:o.current};
      return cclResult(uid,cclModules.adapter.buildClosedCareerInput(input),cclModules.adapter.describeClosedCareer(input));
    }catch(_error){
      try{return cclUnavailable(uid,"CLOSED_LOADER_FAILED");}catch(_inner){return Object.freeze({status:"unavailable",accountId:uid,careerInput:null,model:null,entries:Object.freeze([])});}
    }
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-career-loader",loadClosedShowdownCareer:cclLoad,clearClosedShowdownCache:cclClear,closedShowdownCacheSize:()=>cclCache.size,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});
````

### Appendix C. New contract test: `tests/contracts/closed-showdown-adapter-contracts.cjs` (full file; ids in §6.1)

````js
"use strict";
// JOB-09 closed-Showdown adapter + career loader contracts. Plain node:assert, no Firebase, no emulator.
// Fixtures are built from the real model functions (buildProjection, Terminal.prepare, the JOB-05 adapter).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const Adapter=require(path.join(root,"js/sharedClosedShowdownAdapter.js"));
const Career=require(path.join(root,"js/sharedCareerAnalytics.js"));
const Active=require(path.join(root,"js/sharedActiveShowdownAdapter.js"));
const History=require(path.join(root,"js/sharedHistoryConvergence.js"));
const Terminal=require(path.join(root,"js/sharedTerminalClose.js"));
const F=require("../support/active-showdown-fixtures.cjs");
const {result:R,projection:P}=F;

const clone=x=>JSON.parse(JSON.stringify(x));
const id=seed=>"pair_"+seed.repeat(64);
const perfect=R({leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
function deepFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;}
// What readCompletedShowdown() returns (js/sparkCompletedShowdownReader.js csrState), built from a real projection and a real Terminal Close intent.
function completedRead(p,{role="playerOne",witnessTotals=null,final=null,rivalryId=p.rivalryId}={}){
  const witness=F.closed(p,witnessTotals).terminalWitness,a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  return deepFreeze({status:"completed",code:null,rivalryId,managerRole:role,terminalWitness:witness,projection:p,final:final||{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",margin:Math.abs(a-b),seasonsPlayed:p.totalSeasons}});
}
const statusRead=(status,rivalryId,{role="playerOne",code=null,projection=null}={})=>deepFreeze({status,code,rivalryId,managerRole:status==="unavailable"?null:role,terminalWitness:null,projection,final:null});
const index=(ids,status="ready")=>deepFreeze({status,accountId:"acct_daniel",rivalryIds:status==="ready"?ids:[],sealedPageCount:0,code:status==="unavailable"?"permission-denied":null});
const readsOf=list=>Object.fromEntries(list.map(r=>[r.rivalryId,r]));
// The current Showdown, exactly as the JOB-05 adapter hands it to the career model.
const liveSnap=(p,extra={})=>({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:F.multiFor(p),history:F.history(p),finalReconciliation:null,terminalClose:null,seasonResults:null,...extra});
const noCurrent=()=>Active.careerInput({identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,finalReconciliation:null,terminalClose:null,seasonResults:null});
const model=o=>Career.buildCareerModel(Adapter.buildClosedCareerInput(o));
// Three finished seasons: Daniel 5+1+0 = 6, Nik 0+0+3 = 3.
const s1=()=>P({seed:"1",seasons:[[R({championsLeague:true}),R()],[R({domesticCup:true}),R()],[R(),R({leaguePosition:1})]]});
// An abandoned Showdown that had an 11-point Nik season before it was abandoned.
const s2=()=>P({seed:"2",seasons:[[R(),perfect]]});
// The live Showdown: 1 of 3 seasons accepted, Daniel 3, Nik 0.
const s3=()=>P({seed:"3",seasons:[[R({leaguePosition:1}),R()]]});
function frozen(x,borrowed){if(borrowed.has(x))return;if(x&&typeof x==="object"){assert.ok(Object.isFrozen(x),"every owned output object is frozen");Object.values(x).forEach(y=>frozen(y,borrowed));}}
function noIds(x){if(x&&typeof x==="object"){for(const key of Object.keys(x))assert.ok(!["accountId","profileId","saveId","terminalWitness","managerRole","sessionId"].includes(key),"model output must not carry "+key);Object.values(x).forEach(noIds);}}

let cases=0;
async function check(name,fn){try{await fn();cases+=1;}catch(error){error.message=name+": "+error.message;throw error;}}

(async()=>{
await check("C1 API surface",()=>{
  assert.equal(typeof Adapter.buildClosedCareerInput,"function");assert.equal(typeof Adapter.describeClosedCareer,"function");
  assert.deepEqual([...Adapter.readStatuses],["completed","abandoned","not-closed","unavailable"]);
  for(const k of ["sessionRequired","providerWriteRequired","listPermissionRequired","canonicalStorageMutation","billingRequired"])assert.equal(Adapter[k],false,k);
  assert.equal(Adapter.contractVersion,1);assert.ok(Object.isFrozen(Adapter));
});

await check("C2 completed Showdown counts once with the witness totals",()=>{
  const p=s1(),r=completedRead(p),input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:readsOf([r]),current:noCurrent()});
  assert.deepEqual(Object.keys(input),["indexStatus","showdowns","currentShowdownOnly"]);
  assert.equal(input.indexStatus,"ready");assert.equal(input.currentShowdownOnly,false);
  assert.equal(input.showdowns.length,1);assert.equal(input.showdowns[0].classification,"completed");
  assert.equal(input.showdowns[0].projection,p,"projection is the reader's verified projection itself");
  assert.deepEqual(input.showdowns[0].final,{totals:clone(r.terminalWitness.managerTotals),winner:r.terminalWitness.winner});
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.equal(m.interimLabel,null);assert.deepEqual(m.coverage,{readable:1,indexed:1});
  assert.equal(m.managers.daniel.careerPoints,r.terminalWitness.managerTotals.playerOne);assert.equal(m.managers.nik.careerPoints,r.terminalWitness.managerTotals.playerTwo);
  assert.deepEqual([m.managers.daniel.showdowns.completed,m.managers.daniel.showdowns.wins,m.managers.nik.showdowns.losses],[1,1,1]);
  const row=m.history.showdowns[0];assert.equal(row.status,"completed");assert.deepEqual(row.totals,{daniel:6,nik:3});assert.equal(row.winner,"daniel");assert.equal(row.seasons.length,3);
});

await check("C3 abandoned Showdown is a status row and counts for nothing",()=>{
  const p=s2(),forged=statusRead("abandoned",p.rivalryId,{projection:p});
  const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:readsOf([forged]),current:noCurrent()});
  assert.deepEqual(clone(input.showdowns),[{rivalryId:p.rivalryId,classification:"abandoned",projection:null,final:null}]);
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.deepEqual(m.coverage,{readable:1,indexed:1});
  assert.equal(m.managers.nik.careerPoints,0);assert.equal(m.managers.nik.bestSeasonScore,null);assert.equal(m.managers.nik.perfectSeasons,0);assert.equal(m.managers.nik.seasons,0);
  const row=m.history.showdowns[0];assert.equal(row.status,"abandoned");assert.equal(row.totals,null);assert.equal(row.winner,null);assert.deepEqual(row.seasons,[]);
});

await check("C4 totals must equal the Terminal Close managerTotals; forgeries are unavailable, never shorter",()=>{
  const p=s1(),good=completedRead(p),a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  const tampered=clone(p);tampered.managerRecords.playerTwo.totalPoints+=1;
  const partialP=P({seed:"1",seasons:[[R({championsLeague:true}),R()],[R({domesticCup:true}),R()]]});
  const forged=[
    ["witness totals differ",completedRead(p,{witnessTotals:{playerOne:a+1,playerTwo:b}})],
    ["final totals differ",completedRead(p,{final:{totals:{playerOne:a,playerTwo:b+1},winner:"playerOne",margin:a-b-1,seasonsPlayed:3}})],
    ["final winner wrong",completedRead(p,{final:{...good.final,winner:"draw"}})],
    ["margin wrong",completedRead(p,{final:{...good.final,margin:0}})],
    ["seasonsPlayed wrong",completedRead(p,{final:{...good.final,seasonsPlayed:2}})],
    ["tampered projection",deepFreeze({...clone(good),projection:tampered})],
    ["2 of 3 seasons",deepFreeze({...clone(good),projection:partialP})],
    ["witness for another rivalry",deepFreeze({...clone(good),terminalWitness:completedRead(s2()).terminalWitness})],
    ["missing witness",deepFreeze({...clone(good),terminalWitness:null})],
    ["read names another rivalry",completedRead(p,{rivalryId:id("9")})],
    ["bad role",deepFreeze({...clone(good),managerRole:"playerThree"})]
  ];
  for(const [label,r] of forged){
    const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:{[p.rivalryId]:r},current:noCurrent()});
    assert.deepEqual(clone(input.showdowns),[{rivalryId:p.rivalryId,classification:"unavailable",projection:null,final:null}],label);
    const m=Career.buildCareerModel(input);assert.equal(m.status,"partial",label);assert.deepEqual(m.coverage,{readable:0,indexed:1},label);assert.equal(m.managers.daniel.careerPoints,0,label+": nothing invented");
  }
});

await check("C5 unreadable Showdowns make the career partial",()=>{
  const p=s1(),q=s2();
  const cases5=[[statusRead("unavailable",q.rivalryId,{code:"permission-denied"}),"permission-denied"],[undefined,"CLOSED_READ_MISSING"],[deepFreeze({status:"weird",rivalryId:q.rivalryId}),"CLOSED_READ_INVALID"]];
  for(const [r,code] of cases5){
    const reads={[p.rivalryId]:completedRead(p)};if(r)reads[q.rivalryId]=r;
    const o={index:index([p.rivalryId,q.rivalryId]),reads,current:noCurrent()},m=model(o);
    assert.equal(m.status,"partial",code);assert.deepEqual(m.coverage,{readable:1,indexed:2},code);assert.equal(m.managers.daniel.careerPoints,6,code+": readable Showdown still counts");
    assert.equal(m.history.showdowns[1].status,"unavailable",code);assert.equal(Adapter.describeClosedCareer(o)[1].code,code);
  }
});

await check("C6 index and current states",()=>{
  assert.equal(model({index:index([],"loading"),reads:{},current:noCurrent()}).status,"loading");
  const u=model({index:index([],"unavailable"),reads:{},current:noCurrent()});assert.equal(u.status,"unavailable");assert.equal(u.managers.daniel.careerPoints,null);assert.deepEqual(u.history.showdowns,[]);
  assert.equal(Adapter.describeClosedCareer({index:index([],"unavailable")})[0].code,"permission-denied");
  for(const bad of [null,{},{status:"ready",rivalryIds:"x"},{status:"ready",rivalryIds:[id("1"),id("1")]},{status:"ready",rivalryIds:["pair_1"]}])assert.equal(model({index:bad,reads:{},current:noCurrent()}).status,"unavailable",JSON.stringify(bad));
  const e=model({index:index([]),reads:{},current:noCurrent()});assert.equal(e.status,"empty");assert.equal(e.interimLabel,null);
  const loadingCurrent=Active.careerInput({pair:null});assert.equal(loadingCurrent.indexStatus,"loading");
  assert.equal(model({index:index([s1().rivalryId]),reads:readsOf([completedRead(s1())]),current:loadingCurrent}).status,"loading","waits for the live Showdown");
});

await check("C7 the live Showdown joins career history from the JOB-05 adapter",()=>{
  const p=s1(),q=s2(),live=s3(),current=Active.careerInput(liveSnap(live));
  assert.equal(current.showdowns[0].classification,"active");
  const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId),statusRead("not-closed",live.rivalryId)]),current});
  assert.equal(input.showdowns[2].projection,current.showdowns[0].projection,"live projection passed by identity");
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.deepEqual(m.coverage,{readable:3,indexed:3});
  assert.deepEqual(m.history.showdowns.map(row=>row.status),["completed","abandoned","in-progress"]);
  assert.equal(m.managers.daniel.careerPoints,6+3);assert.equal(m.managers.nik.careerPoints,3);
  assert.equal(m.managers.daniel.showdowns.completed,1);assert.equal(m.managers.daniel.seasons,4);
});

await check("C8 completion pending counts seasons but not the outcome",()=>{
  const p=s1(),live=P({seed:"3",seasons:[[R({leaguePosition:1}),R()],[R(),R()],[R(),R({championsLeague:true})]]}),current=Active.careerInput(liveSnap(live));
  assert.equal(current.showdowns[0].classification,"completion-pending");
  const m=model({index:index([p.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",live.rivalryId,{role:"playerTwo"})]),current});
  assert.deepEqual(m.history.showdowns.map(row=>row.status),["completed","completion-pending"]);
  assert.equal(m.managers.daniel.showdowns.completed,1);assert.equal(m.managers.nik.careerPoints,3+5);
});

await check("C9 a stale pending rivalry in one index is excluded, so both managers agree",()=>{
  const p=s1(),live=s3(),stale=id("7"),current=Active.careerInput(liveSnap(live));
  const reads=readsOf([completedRead(p),statusRead("not-closed",stale),statusRead("not-closed",live.rivalryId)]);
  const daniel=Adapter.buildClosedCareerInput({index:index([p.rivalryId,stale,live.rivalryId]),reads,current});
  const nikReads=readsOf([completedRead(p,{role:"playerTwo"}),statusRead("not-closed",live.rivalryId,{role:"playerTwo"})]);
  const nik=Adapter.buildClosedCareerInput({index:index([p.rivalryId,live.rivalryId]),reads:nikReads,current:Active.careerInput(liveSnap(live,{identity:F.identity("nik"),pair:F.pair(live.rivalryId,{managerId:"nik"})}))});
  assert.equal(daniel.showdowns[1].classification,"pending");
  assert.deepEqual(clone(Career.buildCareerModel(daniel)),clone(Career.buildCareerModel(nik)),"Daniel's and Nik's career models are identical");
  assert.deepEqual(Career.buildCareerModel(daniel).coverage,{readable:2,indexed:2});
  assert.equal(Adapter.describeClosedCareer({index:index([stale]),reads,current})[0].code,"CLOSED_NOT_CURRENT");
});

await check("C10 a not-closed Showdown with an unknown live state is unavailable, never hidden",()=>{
  const p=s1(),live=s3();
  for(const current of [null,"x",{indexStatus:"ready",showdowns:[{}],currentShowdownOnly:true},Active.careerInput({pair:F.pair(live.rivalryId,{status:"error"})})]){
    const o={index:index([p.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",live.rivalryId)]),current},m=model(o);
    assert.equal(m.status,"partial",JSON.stringify(current));assert.equal(m.history.showdowns[1].status,"unavailable");
    assert.match(Adapter.describeClosedCareer(o)[1].code,/^CLOSED_CURRENT_(UNKNOWN|UNAVAILABLE)$/);
  }
  assert.equal(model({index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:null}).status,"ready","an unknown live state does not touch closed Showdowns");
});

await check("C11 terminal and live views of the same Showdown",()=>{
  const p=s1(),pClosed=Active.careerInput(liveSnap(p,{terminalClose:F.closed(p)})),pAlt=P({seed:"1",seasons:[[R(),R()],[R(),R()],[R(),R({championsLeague:true})]]}),pOther=Active.careerInput(liveSnap(pAlt,{terminalClose:F.closed(pAlt)}));
  assert.equal(pOther.showdowns[0].classification,"completed");assert.equal(pOther.showdowns[0].rivalryId,p.rivalryId);
  assert.equal(pClosed.showdowns[0].classification,"completed");
  const one=(r,current)=>Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:{[p.rivalryId]:r},current}).showdowns[0].classification;
  assert.equal(one(statusRead("not-closed",p.rivalryId),pClosed),"unavailable","live says closed, root read says not closed");
  assert.equal(one(completedRead(p),Active.careerInput(liveSnap(p))),"completed","closed read wins over a live view still catching up");
  assert.equal(one(completedRead(p),pClosed),"completed","agreeing terminal views");
  const pReloaded=Active.careerInput(liveSnap(p,{pair:F.pair(p.rivalryId,{connectionState:"closed"}),history:null}));assert.equal(pReloaded.showdowns[0].classification,"abandoned");
  assert.equal(one(completedRead(p),pReloaded),"completed","a reloaded closed pair without its local witness never hides the verified close");
  assert.equal(one(completedRead(p),pOther),"unavailable","terminal views disagree");
  const q=s2(),qLive=Active.careerInput(liveSnap(q)),qAbandoned=Active.careerInput(liveSnap(q,{pair:F.pair(q.rivalryId,{connectionState:"closed"})}));
  assert.equal(qAbandoned.showdowns[0].classification,"abandoned");
  assert.equal(Adapter.buildClosedCareerInput({index:index([q.rivalryId]),reads:readsOf([statusRead("abandoned",q.rivalryId)]),current:qLive}).showdowns[0].classification,"abandoned","abandon is irreversible");
  assert.equal(Adapter.buildClosedCareerInput({index:index([q.rivalryId]),reads:readsOf([statusRead("not-closed",q.rivalryId)]),current:qAbandoned}).showdowns[0].classification,"unavailable");
  assert.equal(one(statusRead("abandoned",p.rivalryId),pClosed),"unavailable","abandoned read vs completed live view");
});

await check("C12 no backfill: a live Showdown outside the career index stays out of career history",()=>{
  const p=s1(),live=s3(),o={index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:Active.careerInput(liveSnap(live))};
  const m=model(o);assert.deepEqual(m.coverage,{readable:1,indexed:1});assert.equal(m.managers.daniel.careerPoints,6);
  assert.deepEqual(clone(Adapter.describeClosedCareer(o)[1]),{rivalryId:live.rivalryId,source:"outside-index",classification:"active",code:"CLOSED_NOT_INDEXED"});
});

await check("C13 scoring unchanged across lengths",()=>{
  for(const n of [1,3,5,10]){
    const seasons=Array.from({length:n},(_,i)=>i===0?[perfect,R({topScorer:true,topAssist:true,leaguePoints:100})]:[R({leaguePosition:2}),R({domesticCup:true})]);
    const p=P({seed:"5",totalSeasons:n,seasons}),r=completedRead(p),m=model({index:index([p.rivalryId]),reads:readsOf([r]),current:noCurrent()});
    assert.equal(m.status,"ready",String(n));
    const s=m.history.showdowns[0].seasons[0];assert.equal(s.score.daniel,11);assert.equal(s.score.nik,2,"performance 1 + awards 1, never 2 each");
    assert.equal(m.managers.daniel.careerPoints,r.terminalWitness.managerTotals.playerOne);assert.equal(m.managers.nik.careerPoints,r.terminalWitness.managerTotals.playerTwo);
    assert.equal(m.managers.daniel.perfectSeasons,1);assert.ok(m.managers.daniel.bestSeasonScore<=11);
  }
  const src=read("js/sharedClosedShowdownAdapter.js");assert.doesNotMatch(src,/\?\s*5\s*:|\?\s*3\s*:|scoring\.total\s*=/,"the adapter never computes scores");
});

await check("C14 exactly two managers; both views identical; no ids in the model",()=>{
  const p=s1(),q=s2();
  const d=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),current:noCurrent()});
  const n=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p,{role:"playerTwo"}),statusRead("abandoned",q.rivalryId,{role:"playerTwo"})]),current:noCurrent()});
  assert.deepEqual(clone(d),clone(n));
  const m=Career.buildCareerModel(d);assert.deepEqual(Object.keys(m.managers),["daniel","nik"]);noIds(m);
  assert.equal(m.history.showdowns[0].clubs.daniel,p.managerRecords.playerOne.club,"Daniel = playerOne, left");
});

await check("C15 abandoning later rebuilds the career without those seasons",()=>{
  const p=s1(),q=P({seed:"2",seasons:[[R(),perfect],[R(),perfect]]});
  const before=model({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",q.rivalryId)]),current:Active.careerInput(liveSnap(q))});
  assert.equal(before.managers.nik.careerPoints,3+22);assert.equal(before.managers.nik.perfectSeasons,2);
  const after=model({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),current:noCurrent()});
  assert.equal(after.managers.nik.careerPoints,3);assert.equal(after.managers.nik.perfectSeasons,0);assert.equal(after.managers.nik.bestSeasonScore,3);
  assert.equal(after.trophyRoom.records.find(r=>r.label==="Highest season score").value,5);
});

await check("C16 never throws, frozen, pure",()=>{
  for(const bad of [undefined,null,{},"x",{index:index([id("1")]),reads:null,current:7},{index:{status:"ready",rivalryIds:[id("1")]},reads:{[id("1")]:{status:"completed",rivalryId:id("1"),managerRole:"playerOne",projection:{},terminalWitness:{},final:{}}}}]){
    const v=Adapter.buildClosedCareerInput(bad);assert.ok(Object.isFrozen(v));assert.ok(["unavailable","ready","loading"].includes(v.indexStatus));
    const d=Adapter.describeClosedCareer(bad);assert.ok(Array.isArray(d)&&Object.isFrozen(d));
  }
  const p=s1(),live=s3(),current=Active.careerInput(liveSnap(live)),reads=readsOf([completedRead(p),statusRead("not-closed",live.rivalryId)]),idx=index([p.rivalryId,live.rivalryId]);
  const mutableIdx=clone(idx),before=clone(mutableIdx);
  const v=Adapter.buildClosedCareerInput({index:mutableIdx,reads,current});
  frozen(v,new Set([p,current.showdowns[0].projection]));assert.deepEqual(mutableIdx,before,"caller input unchanged");assert.equal(Object.isFrozen(mutableIdx),false,"caller input not frozen by the adapter");
  assert.deepEqual(clone(Adapter.buildClosedCareerInput({index:idx,reads,current})),clone(v),"deterministic");
  const src=read("js/sharedClosedShowdownAdapter.js");
  assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.|\bwindow\b|getState\s*\(|addEventListener|setInterval|setTimeout|Date\.now|Math\.random|getDoc|firebase|firestore|require\("\.\/spark|fetch\(/i);
  globalThis.currentShowdown={rivalryId:p.rivalryId,scores:[99,99]};
  try{assert.deepEqual(clone(Adapter.buildClosedCareerInput({index:idx,reads,current})),clone(v),"globals change nothing");}finally{delete globalThis.currentShowdown;}
});

await check("C17 browser globals",()=>{
  const p=s1(),o={index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:noCurrent()};
  const context=vm.createContext({CareerModeSharedHistoryConvergence:History,CareerModeSharedTerminalClose:Terminal});
  vm.runInContext(read("js/sharedClosedShowdownAdapter.js"),context);
  assert.ok(context.CareerModeSharedClosedShowdownAdapter);
  assert.deepEqual(clone(context.CareerModeSharedClosedShowdownAdapter.buildClosedCareerInput(o)),clone(Adapter.buildClosedCareerInput(o)));
});

// Loader: loaded in a vm with fake index and reader globals, so every call is counted.
function loaderWith({indexes,reads}){
  const calls={index:0,reader:[]};
  const context=vm.createContext({
    CareerModeSharedHistoryConvergence:History,CareerModeSharedTerminalClose:Terminal,CareerModeSharedCareerAnalytics:Career,
    CareerModePersistentNikDanielPair:{readCareerIndex:async({accountId})=>{calls.index+=1;const v=indexes[accountId];if(v instanceof Error)throw v;return v||index([]);}},
    CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{calls.reader.push({uid:options.user.uid,rivalryId:options.rivalryId,keys:Object.keys(options).sort().join(",")});const v=reads[options.rivalryId];if(v instanceof Error)throw v;return typeof v==="function"?v():v;}}
  });
  vm.runInContext(read("js/sharedClosedShowdownAdapter.js"),context);
  vm.runInContext(read("js/sparkClosedShowdownCareerLoader.js"),context);
  return {L:context.CareerModeSparkClosedShowdownCareerLoader,calls};
}
const services={firestore:{},firebaseSdk:{doc:()=>({}),getDoc:async()=>({exists:()=>false})},cryptoImpl:{subtle:{}}};

await check("L1 loader surface and source",()=>{
  const L=require(path.join(root,"js/sparkClosedShowdownCareerLoader.js"));
  assert.equal(typeof L.loadClosedShowdownCareer,"function");assert.equal(typeof L.clearClosedShowdownCache,"function");
  for(const k of ["sessionRequired","deviceRequired","providerWriteRequired","listPermissionRequired","canonicalStorageMutation","billingRequired"])assert.equal(L[k],false,k);
  const src=read("js/sparkClosedShowdownCareerLoader.js");
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/onSnapshot/,/setDoc|updateDoc|deleteDoc|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/getState\s*\(/,/Date\.now|setTimeout|setInterval/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/readCareerIndex\(\{firestore:o\.firestore,firebaseSdk:o\.firebaseSdk,accountId:uid\}\)/);assert.match(src,/readCompletedShowdown\(/);
});

await check("L2 walks the index in order and builds the career for both managers",async()=>{
  const p=s1(),q=s2(),live=s3();
  const {L,calls}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId,live.rivalryId]),acct_nik:index([p.rivalryId,q.rivalryId,live.rivalryId])},reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId),statusRead("not-closed",live.rivalryId)])});
  const d=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current:Active.careerInput(liveSnap(live))});
  assert.equal(d.status,"ready");assert.equal(d.accountId,"acct_daniel");assert.ok(Object.isFrozen(d));
  assert.deepEqual(calls.reader.map(c=>c.rivalryId),[p.rivalryId,q.rivalryId,live.rivalryId]);assert.equal(calls.reader[0].keys,"cryptoImpl,firebaseSdk,firestore,rivalryId,user");
  assert.deepEqual(d.model.history.showdowns.map(r=>r.status),["completed","abandoned","in-progress"]);
  const n=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_nik"},current:Active.careerInput(liveSnap(live,{identity:F.identity("nik"),pair:F.pair(live.rivalryId,{managerId:"nik"})}))});
  assert.deepEqual(clone(n.model),clone(d.model),"identical career for Daniel and Nik");
});

await check("L3 terminal results are cached per signed-in account only",async()=>{
  const p=s1(),q=s2(),live=s3();
  let liveCalls=0;
  const {L,calls}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId,live.rivalryId]),acct_nik:index([p.rivalryId])},reads:{...readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),[live.rivalryId]:()=>{liveCalls+=1;return statusRead("not-closed",live.rivalryId);}}});
  const current=Active.careerInput(liveSnap(live));
  const first=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current});assert.equal(calls.reader.length,3);assert.equal(L.closedShowdownCacheSize(),2);
  const second=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current});
  assert.equal(calls.reader.length,4,"only the live Showdown is read again");assert.equal(liveCalls,2);assert.deepEqual(clone(second.model),clone(first.model));
  await L.loadClosedShowdownCareer({...services,user:{uid:"acct_nik"},current:noCurrent()});
  assert.equal(calls.reader.length,5,"another account starts with an empty cache");assert.equal(calls.reader[4].uid,"acct_nik");assert.equal(L.closedShowdownCacheSize(),1);
  L.clearClosedShowdownCache();assert.equal(L.closedShowdownCacheSize(),0);
});

await check("L4 never throws; failures are unavailable, never empty",async()=>{
  const p=s1(),q=s2();
  const {L}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId]),acct_broken:new Error("boom")},reads:{[p.rivalryId]:completedRead(p),[q.rivalryId]:new Error("network")}});
  for(const bad of [undefined,{},{...services},{user:{uid:"acct_daniel"}},{...services,user:{uid:""}},{...services,firebaseSdk:{doc:()=>1},user:{uid:"acct_daniel"}}]){
    const v=await L.loadClosedShowdownCareer(bad);assert.equal(v.status,"unavailable",JSON.stringify(Object.keys(bad||{})));assert.equal(v.model.status,"unavailable");assert.ok(Object.isFrozen(v));
  }
  const broken=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_broken"},current:noCurrent()});assert.equal(broken.status,"unavailable");
  const partial=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current:noCurrent()});
  assert.equal(partial.status,"partial");assert.deepEqual(partial.model.coverage,{readable:1,indexed:2});assert.equal(partial.entries[1].code,"CLOSED_READ_MISSING");
});

await check("L5 paging: the real career index client walks sealed pages, then the head",async()=>{
  const L=require(path.join(root,"js/sparkClosedShowdownCareerLoader.js"));L.clearClosedShowdownCache();
  const ids=Array.from({length:501},(_,i)=>"pair_"+i.toString(16).padStart(64,"0"));
  const env=(type,objectId,data)=>({schemaVersion:1,objectType:type,objectId,revision:type==="careerIndexPage"?0:1,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data});
  const docs={"accounts/acct_daniel/careerIndex/page_1":env("careerIndexPage","page_1",{pageNumber:1,rivalryIds:ids.slice(0,500)}),"accounts/acct_daniel/careerIndex/current":env("careerIndex","current",{rivalryIds:ids.slice(500),sealedPageCount:1})};
  const log=[];
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};}};
  const v=await L.loadClosedShowdownCareer({firestore:{},firebaseSdk:sdk,user:{uid:"acct_daniel"},cryptoImpl:require("node:crypto").webcrypto,current:noCurrent()});
  assert.deepEqual(log.slice(0,2),["accounts/acct_daniel/careerIndex/current","accounts/acct_daniel/careerIndex/page_1"]);
  assert.deepEqual(log.slice(2),ids.map(x=>"rivalries/"+x),"one exact root get per indexed Showdown, in career order");
  assert.equal(v.status,"partial");assert.deepEqual(v.model.coverage,{readable:0,indexed:501},"missing Showdowns are unavailable, never a shorter career");
  assert.equal(v.entries[0].code,"COMPLETED_RIVALRY_MISSING");
});

console.log("PASS closed-Showdown adapter contracts ("+cases+"/"+cases+" cases): completed and abandoned Showdowns from the session-free reader, witness totals, live-Showdown merge, stale pending exclusion, no backfill, unavailable never empty, two managers, pure frozen adapter, paged cached loader.");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
````

### Appendix D. New emulator test: `tests/firebase/closed-showdown-adapter-emulator.cjs` (full file; ids in §6.2)

````js
"use strict";
// JOB-09: closed-Showdown adapter on the composed production Rules.
// Journey: Showdown 1 (3 seasons) closed by a real Terminal Close, Showdown 2 abandoned after one season
// (Nik had an 11-point season), Showdown 3 live with one accepted season. All three are paired through the
// provider, so the G-7 career index names them. Every career read runs from fresh authenticated clients
// through the loader: career index -> session-free reader -> pure adapter -> career model.

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const CareerStart=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const Pairing=require("../../js/sparkPrivatePairing.js");
const Catalog=require("../../js/sharedShowdownCatalog.js");
const PersistentPair=require("../../js/persistentNikDanielPair.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const Active=require("../../js/sharedActiveShowdownAdapter.js");
const Loader=require("../../js/sparkClosedShowdownCareerLoader.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-closed-adapter";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_game_a",B="acct_game_b",C="acct_game_c";
const R1=`pair_${"1".repeat(64)}`,R2=`pair_${"2".repeat(64)}`,R3=`pair_${"3".repeat(64)}`;
const S1=`session_${"b".repeat(64)}`,S2=`session_${"c".repeat(64)}`,S3=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;

let checks=0;
async function ok(id,label,fn){await fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now())}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:`sha256:${"0".repeat(64)}`,updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function session(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,rivalryId,sessionId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function pairingIdentity(deviceId,seed,nowMs){return {schemaVersion:1,installationId:`installation_${seed.repeat(32).slice(0,32)}`,deviceId,createdAtEpochMs:nowMs-180000};}
function bindingFor(role){return role==="playerOne"?{saveId:SA,profileId:PA,managerRole:role,displayLabel:"Daniel"}:{saveId:SB,profileId:PB,managerRole:role,displayLabel:"Nik"};}
const neutral={leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const perfect={leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
// Showdown 1 (same numbers as the JOB-02 journey): Daniel 5+1+5 = 11, Nik 0+3+1 = 4.
function journeyResult(role,season){if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};}

async function seedAccounts(env){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [uid,id,seed] of [[A,DA,"a"],[B,DB,"b"],[C,DC,"c"]]){await setDoc(doc(db,"accounts",uid),await account(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seed));}});}

// Real provider pairing (writes both career indexes), then the JOB-02 gameplay bridge (template-equivalent paired root + session).
async function pairThroughProvider(env,{rivalryId,sessionId,nowMs}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const created=await Pairing.createPairing({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),identity:pairingIdentity(DA,"a",nowMs),binding:bindingFor("playerOne"),capability:rivalryId,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableCreationWitness({services:{firestoreSdk:sdk(),firestore:dbA},accountId:A,deviceId:DA},"playerOne",PersistentPair.managerByRole.playerOne)});
  assert.equal(created.ok,true,`Daniel createPairing: ${JSON.stringify(created)}`);
  const redeemed=await Pairing.redeemPairing({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),identity:pairingIdentity(DB,"b",nowMs),binding:bindingFor("playerTwo"),capability:rivalryId,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableRedemptionWitness({services:{firestoreSdk:sdk(),firestore:dbB},accountId:B,deviceId:DB},"playerTwo",PersistentPair.managerByRole.playerTwo,rivalryId)});
  assert.equal(redeemed.ok,true,`Nik redeemPairing: ${JSON.stringify(redeemed)}`);
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,"rivalries",rivalryId),await rivalry(rivalryId));await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session(rivalryId,sessionId,nowMs+2000));});
}

// Plays `play` of `totalSeasons` seasons through the real providers; closes with a real Terminal Close when asked.
async function playShowdown(env,{rivalryId,sessionId,nowMs,totalSeasons,play,results,opBase,close=false}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t),n=k=>opBase+k;
  for(const [type,baseRevision,k,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons}]]){const value=await Setup.mutate({...a(k*10),type,baseRevision,operationId:op("setup_op_",n(k)),...extra});assert.equal(value.ok,true,`setup ${type}: ${JSON.stringify(value)}`);}
  let setup=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",n(5))});assert.equal(setup.ok,true,JSON.stringify(setup));
  setup=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",n(6))});assert.equal(setup.ok,true,JSON.stringify(setup));assert.equal(setup.state.phase,"SHOWDOWN_CONFIRMED");
  const teamCount=Catalog.catalog[setup.state.leagueId].length;
  let career=await CareerStart.acknowledge({...a(70),operationId:op("career_start_op_",n(1)),baseRevision:0});assert.equal(career.ok,true,JSON.stringify(career));
  career=await CareerStart.acknowledge({...b(80),operationId:op("career_start_op_",n(2)),baseRevision:1});assert.equal(career.ok,true,JSON.stringify(career));
  let history=null,multi=null;
  for(let season=1;season<=play;season+=1){
    const t=season*10000,k=x=>n(season*10+x),step=async(value,label)=>{assert.equal(value.ok,true,`S${season} ${label}: ${JSON.stringify(value)}`);return value;};
    await step(await Transfer.startWindow({...a(t+100),seasonNumber:season,operationId:op("transfer_op_",k(1)),baseRevision:0}),"transfer start");
    await step(await Transfer.requestEndWindow({...a(t+200),seasonNumber:season,operationId:op("transfer_op_",k(2)),baseRevision:1}),"end window A");
    await step(await Transfer.requestEndWindow({...b(t+300),seasonNumber:season,operationId:op("transfer_op_",k(3)),baseRevision:2}),"end window B");
    await step(await Transfer.lockGuesses({...a(t+400),seasonNumber:season,operationId:op("transfer_op_",k(4)),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]}),"guesses A");
    await step(await Transfer.lockGuesses({...b(t+500),seasonNumber:season,operationId:op("transfer_op_",k(5)),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]}),"guesses B");
    await step(await Transfer.lockSignings({...a(t+600),seasonNumber:season,operationId:op("transfer_op_",k(6)),baseRevision:5,signings:[{slot:1,name:`Daniel S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]}),"signings A");
    await step(await Transfer.lockSignings({...b(t+700),seasonNumber:season,operationId:op("transfer_op_",k(7)),baseRevision:6,signings:[{slot:1,name:`Nik S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]}),"signings B");
    await step(await Results.publishResult({...a(t+800),seasonNumber:season,operationId:op("season_result_op_",k(1)),baseRevision:0,result:results("playerOne",season)}),"result A");
    const ready=await step(await Results.publishResult({...b(t+900),seasonNumber:season,operationId:op("season_result_op_",k(2)),baseRevision:1,result:results("playerTwo",season)}),"result B");assert.equal(ready.state.phase,"RESULTS_READY");
    await step(await Commit.commitSeason({...a(t+1000),seasonNumber:season,operationId:op("season_commit_op_",k(1)),baseRevision:0}),"commit");
    await step(await Commit.acknowledgeSeason({...b(t+1100),seasonNumber:season,operationId:op("season_commit_op_",k(2)),baseRevision:1}),"ack B");
    const acked=await step(await Commit.acknowledgeSeason({...a(t+1200),seasonNumber:season,operationId:op("season_commit_op_",k(3)),baseRevision:2}),"ack A");assert.equal(acked.phase,"ACKNOWLEDGED");
    const scored=await Scoring.read({...a(t+1300),seasonNumber:season,teamCount});assert.equal(scored.ok,true,JSON.stringify(scored));
    history=await History.read({...a(t+1400),throughSeason:season});assert.equal(history.ok,true,JSON.stringify(history));
    multi=await Multi.read(a(t+1500));assert.equal(multi.ok,true,JSON.stringify(multi));
  }
  let final=null;
  if(close){
    final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
    const closed=await TerminalProvider.close({...a(play*10000+2000),intent:Terminal.prepare(final,{sessionId})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");
  }
  return {history,multi,final,a,b,dbA};
}

// Live provider snapshot for the JOB-05 adapter, read from a fresh client: real pair link + root, real history/multi when given.
// Pair status mirrors persistentNikDanielPair.js:148 (active -> "paired", otherwise "waiting").
async function liveCareerInput(env,uid,{history=null,multi=null}={}){
  const db=env.authenticatedContext(uid).firestore(),link=(await assertSucceeds(getDoc(doc(db,"accounts",uid,"pairLinks","current")))).data().data;
  const root=(await assertSucceeds(getDoc(doc(db,"rivalries",link.rivalryId)))).data().data;
  const managerId=link.managerRole==="playerOne"?"daniel":"nik";
  return Active.careerInput({identity:{status:"ready",initialized:true,managerId},pair:{status:root.connectionState==="active"?"paired":"waiting",initialized:true,busy:false,managerRole:link.managerRole,managerId,rivalryId:link.rivalryId,connectionState:root.connectionState},multiSeason:multi,history,finalReconciliation:null,terminalClose:null,seasonResults:null});
}
// Fresh authenticated client per load; every exact get is counted.
async function load(env,uid,current){
  const db=env.authenticatedContext(uid).firestore(),counter={gets:0};
  const counted={doc:firestoreSdk.doc,getDoc:async ref=>{counter.gets+=1;return firestoreSdk.getDoc(ref);}};
  const value=await Loader.loadClosedShowdownCareer({firestore:db,firebaseSdk:counted,user:{uid},cryptoImpl:crypto.webcrypto,current});
  return {value,gets:counter.gets};
}
const rows=v=>v.model.history.showdowns.map(row=>row.status);
const classes=v=>v.careerInput.showdowns.map(entry=>entry.classification);
const plain=x=>JSON.parse(JSON.stringify(x));
function noIds(x){if(x&&typeof x==="object"){for(const key of Object.keys(x))assert.ok(!["accountId","profileId","saveId","terminalWitness","sessionId"].includes(key),`model carries ${key}`);Object.values(x).forEach(noIds);}}

async function main(env){
  await seedAccounts(env);
  await ok("I0","composed Rules carry the career index and the completed-only grant",async()=>{
    assert.match(RULES,/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/,"career index match");
    assert.equal((RULES.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length,4,"completed grant");
  });

  // Showdown 1: 3 seasons, real Terminal Close.
  const now1=Date.now();
  await pairThroughProvider(env,{rivalryId:R1,sessionId:S1,nowMs:now1});
  const one=await playShowdown(env,{rivalryId:R1,sessionId:S1,nowMs:now1+5000,totalSeasons:3,play:3,results:journeyResult,opBase:0});
  await ok("A1","before Terminal Close the live Showdown is completion-pending for both managers",async()=>{
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid,{history:one.history,multi:one.multi}));
      assert.equal(value.status,"ready");assert.deepEqual(classes(value),["completion-pending"]);assert.equal(value.entries[0].source,"current");
      assert.equal(value.model.managers.daniel.showdowns.completed,0,"the outcome waits for Terminal Close");assert.equal(value.model.managers.daniel.careerPoints,11);
    }
  });
  const final1=Final.reconcile({sharedActive:true,multiSeason:one.multi,history:one.history,localReconciliation:localAuthority("playerOne")});
  const closed1=await TerminalProvider.close({...one.a(32000),intent:Terminal.prepare(final1,{sessionId:S1})});assert.equal(closed1.ok,true,JSON.stringify(closed1));
  let witness1;await env.withSecurityRulesDisabled(async context=>{witness1=(await getDoc(doc(context.firestore(),"rivalries",R1))).data().data.terminalClose;});
  await ok("A2","after Terminal Close both managers read Showdown 1 completed with the witness totals",async()=>{
    assert.deepEqual(witness1.managerTotals,{playerOne:11,playerTwo:4});
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid));
      assert.deepEqual(classes(value),["completed"]);assert.equal(value.entries[0].source,"reader");
      assert.deepEqual(value.careerInput.showdowns[0].final,{totals:witness1.managerTotals,winner:witness1.winner});
      assert.equal(value.model.managers.daniel.careerPoints,witness1.managerTotals.playerOne);assert.equal(value.model.managers.nik.careerPoints,witness1.managerTotals.playerTwo);
      assert.deepEqual(value.model.history.showdowns[0].totals,{daniel:11,nik:4});assert.equal(value.model.history.showdowns[0].winner,"daniel");
    }
  });

  // Showdown 2: paired, one of three seasons (Nik scores a perfect 11), then abandoned by the provider.
  const now2=Date.now();
  await pairThroughProvider(env,{rivalryId:R2,sessionId:S2,nowMs:now2});
  const two=await playShowdown(env,{rivalryId:R2,sessionId:S2,nowMs:now2+5000,totalSeasons:3,play:1,results:role=>role==="playerTwo"?perfect:neutral,opBase:200});
  await ok("B1","while Showdown 2 is live its 11-point Nik season counts",async()=>{
    const {value}=await load(env,B,await liveCareerInput(env,B,{history:two.history,multi:two.multi}));
    assert.deepEqual(classes(value),["completed","active"]);assert.equal(value.model.managers.nik.careerPoints,4+11);assert.equal(value.model.managers.nik.perfectSeasons,1);
  });
  globalThis.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:A}},firestore:two.dbA,firestoreSdk:sdk()})};
  globalThis.CareerModeSparkConnectedAccount={initialize:async()=>{},getState:()=>({connected:true,accountId:A})};
  globalThis.CareerModeSparkPrivatePairing={initialize:async()=>{},getState:()=>({registered:true,deviceId:DA})};
  globalThis.CareerModeOnlinePlayerIdentity={getState:()=>({managerId:"daniel"})};
  const abandoned=await PersistentPair.abandonCurrentShowdown({expectedRivalryId:R2,expectedSaveId:SA,cryptoImpl:crypto.webcrypto});
  assert.equal(abandoned.ok,true,JSON.stringify(abandoned));
  await ok("B2","after abandon the career is rebuilt without Showdown 2's seasons",async()=>{
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid));
      assert.deepEqual(classes(value),["completed","abandoned"]);assert.deepEqual(rows(value),["completed","abandoned"]);
      assert.equal(value.model.managers.nik.careerPoints,4);assert.equal(value.model.managers.nik.perfectSeasons,0);assert.equal(value.model.managers.nik.bestSeasonScore,3);
      const row=value.model.history.showdowns[1];assert.equal(row.totals,null);assert.equal(row.winner,null);assert.deepEqual(row.seasons,[]);
    }
  });

  // Showdown 3: paired and live with one accepted season (Daniel 3, Nik 0).
  const now3=Date.now();
  await pairThroughProvider(env,{rivalryId:R3,sessionId:S3,nowMs:now3});
  const three=await playShowdown(env,{rivalryId:R3,sessionId:S3,nowMs:now3+5000,totalSeasons:3,play:1,results:role=>role==="playerOne"?{...neutral,leaguePosition:1}:neutral,opBase:400});

  const views={};
  await ok("C1","both career indexes name the three Showdowns in order",async()=>{
    for(const uid of [A,B]){const index=await PersistentPair.readCareerIndex({firestore:env.authenticatedContext(uid).firestore(),firebaseSdk:firestoreSdk,accountId:uid});assert.equal(index.status,"ready");assert.deepEqual(index.rivalryIds,[R1,R2,R3]);}
  });
  await ok("C2","Daniel: completed, abandoned and live Showdowns from a fresh client",async()=>{
    Loader.clearClosedShowdownCache();
    const {value,gets}=await load(env,A,await liveCareerInput(env,A,{history:three.history,multi:three.multi}));
    assert.equal(value.status,"ready");assert.deepEqual(classes(value),["completed","abandoned","active"]);assert.deepEqual(rows(value),["completed","abandoned","in-progress"]);
    assert.deepEqual(value.entries.map(e=>e.source),["reader","reader","current"]);
    assert.equal(gets,1+(2+4*3)+1+1,"index head + completed (2+4N) + abandoned root + live root");
    views.daniel=value;
  });
  await ok("C3","Daniel again: completed and abandoned Showdowns come from the memory cache",async()=>{
    const {value,gets}=await load(env,A,await liveCareerInput(env,A,{history:three.history,multi:three.multi}));
    assert.equal(gets,2,"index head + live root only");assert.deepEqual(plain(value.model),plain(views.daniel.model));
  });
  await ok("C4","Nik: identical career from his own fresh client and index",async()=>{
    const {value,gets}=await load(env,B,await liveCareerInput(env,B,{history:three.history,multi:three.multi}));
    assert.equal(gets,17,"account change clears the cache");assert.deepEqual(plain(value.model),plain(views.daniel.model));
    views.nik=value;
  });
  await ok("C5","career numbers: totals equal the witness, abandoned counts nothing, live season counts, no ids",async()=>{
    const m=views.daniel.model;
    assert.deepEqual(m.coverage,{readable:3,indexed:3});
    assert.equal(m.managers.daniel.careerPoints,witness1.managerTotals.playerOne+3);assert.equal(m.managers.nik.careerPoints,witness1.managerTotals.playerTwo);
    assert.equal(m.managers.daniel.seasons,4);assert.equal(m.managers.nik.perfectSeasons,0);
    assert.deepEqual(m.managers.daniel.showdowns,{completed:1,wins:1,draws:0,losses:0});assert.deepEqual(m.managers.nik.showdowns,{completed:1,wins:0,draws:0,losses:1});
    assert.deepEqual(m.biggestShowdownWin,{manager:"daniel",margin:7,showdownRef:R1});assert.equal(m.interimLabel,null);
    noIds(m);
  });
  await ok("D1","the stranger has no career index and reads nothing",async()=>{
    Loader.clearClosedShowdownCache();
    const {value}=await load(env,C,null);assert.equal(value.status,"empty");assert.deepEqual(value.model.coverage,{readable:0,indexed:0});
    const direct=await Reader.readCompletedShowdown({firestore:env.authenticatedContext(C).firestore(),firebaseSdk:firestoreSdk,user:{uid:C},rivalryId:R1,cryptoImpl:crypto.webcrypto});
    assert.equal(direct.status,"unavailable");assert.equal(direct.code,"permission-denied");
  });
  await ok("D2","an unknown live state never hides the live Showdown: it is unavailable and the career is partial",async()=>{
    const {value}=await load(env,A,null);assert.equal(value.status,"partial");assert.deepEqual(classes(value),["completed","abandoned","unavailable"]);assert.equal(value.entries[2].code,"CLOSED_CURRENT_UNKNOWN");
  });
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{await env.clearFirestore();await main(env);process.stdout.write(`PASS closed-Showdown adapter emulator: ${checks} numbered checks (I0, A Terminal Close, B abandon rebuild, C three-Showdown career for both managers with cache, D stranger and unknown live state).\n`);}
  finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
````

### Appendix E. Registry, ops test and CI step

Registry patterns are JSON strings compiled with `new RegExp`: a literal dot is `\\.` in the JSON source (one escaped backslash), never `\\\\.`. The entry and the const go **last**; the CI step goes **last inside `rules-emulator`** (if JOB-16 merged first, its new job sits after `rules-emulator`: leave it there).

````diff
diff --git a/.github/workflows/validate-gameplay-fast.yml b/.github/workflows/validate-gameplay-fast.yml
index fa2ca59..251cca0 100644
--- a/.github/workflows/validate-gameplay-fast.yml
+++ b/.github/workflows/validate-gameplay-fast.yml
@@ -72,3 +72,5 @@ jobs:
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-index "node tests/firebase/career-index-emulator.cjs && CMS_CAREER_INDEX_ENFORCED=1 node tests/firebase/career-index-emulator.cjs"
       - name: Completed-only read matrix
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-completed-read "node tests/firebase/completed-showdown-read-emulator.cjs"
+      - name: Closed-Showdown adapter journey
+        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-closed-adapter "node tests/firebase/closed-showdown-adapter-emulator.cjs"
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 3323da0..5f4ace2 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -547,6 +547,24 @@
         "^tests/contracts/completed-showdown-read-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/closed-showdown-adapter-contracts.cjs",
+      "patterns": [
+        "^js/sharedClosedShowdownAdapter\\.js$",
+        "^js/sparkClosedShowdownCareerLoader\\.js$",
+        "^js/sparkCompletedShowdownReader\\.js$",
+        "^js/persistentNikDanielPair\\.js$",
+        "^js/sharedActiveShowdownAdapter\\.js$",
+        "^js/sharedCareerAnalytics\\.js$",
+        "^js/sharedHistoryConvergence\\.js$",
+        "^js/sharedTerminalClose\\.js$",
+        "^js/sharedFinalReconciliation\\.js$",
+        "^tests/support/active-showdown-fixtures\\.cjs$",
+        "^tests/support/career-fixture-helpers\\.cjs$",
+        "^tests/contracts/closed-showdown-adapter-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 353b654..0aba145 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -70,10 +70,11 @@ const startJoinViewModelContract='tests/contracts/start-join-view-model-contract
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
 const completedShowdownReadContract='tests/contracts/completed-showdown-read-contracts.cjs';
+const closedShowdownAdapterContract='tests/contracts/closed-showdown-adapter-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract,closedShowdownAdapterContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````
