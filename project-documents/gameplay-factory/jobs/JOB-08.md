# JOB-08 · Completed-only read grant + session-free reader

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; every Firebase emulator run happens on GitHub CI, see §2) | JOB-07 merged into `gameplay/recovery-v1` (PR #325, merge `889810f`) | 8 | `gameplay/job-08-completed-read` | `gameplay/recovery-v1` | **yes** (you request it yourself in step 8) |

## 1. Goal

Today a finished Showdown goes dark. Every document below the rivalry root (setup, season results, season commits) is readable only while the rivalry is `active` (`ssjrEntitled` -> `activePairedRivalry`, `firestore.spark.rules:447`), and the providers that read them also demand a live gameplay session. The moment Terminal Close sets `connectionState: 'closed'`, Daniel and Nik can still read the root (final totals and winner) but not a single season. JOB-02 recorded this as `KNOWN GAP 1 (fixed by G-8)`. Career history (G-9), History, Career Statistics and the Trophy Room cannot be rebuilt without it.

This job adds D2:

1. **Rules: a completed-only read grant.** A manager of a Showdown that was closed **by a verified Terminal Close** may `get` exactly its setup ledger, and for `season_1` .. `season_N` (N = the configured length) its public season results, both result roles and its season commit. No session needed. Nothing else opens: no write, no list, no transfers, no drafts, no sessions, no invites, no career-start or league-projection documents, nothing at all for abandoned Showdowns.
2. **Client: a session-free reader.** New `js/sparkCompletedShowdownReader.js` with one function, `readCompletedShowdown()`. Exact document gets only (no session, no device, no transaction, no list, no write, no browser storage). It classifies one rivalry as `completed`, `abandoned`, `not-closed` or `unavailable`, and for `completed` rebuilds and verifies the full history and cross-checks it against the Terminal Close witness.
3. **Proofs.** One new contract test, one new composed-Rules emulator test with 56 numbered checks, and the JOB-02 journey's `KNOWN GAP 1` flipped into completed-read assertions (both managers, fresh clients, through the G-7 career index).

Plain words: a finished Showdown stays readable for both of you after it closes. You see only the final results you had both already seen; never anything unfinished, never anything private, never anything from an abandoned Showdown.

This job does **not** classify a whole career, compute totals across Showdowns or feed any screen (that is G-9), and does **not** open transfer history (that is G-10). It does not deploy anything. The new module is not loaded by `index.html` in this job (G-9 wires it), so there is no shell or service-worker change.

## 2. Branches and files

- The lead creates `gameplay/job-08-completed-read` from `gameplay/recovery-v1` at or after `889810f`. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `tests/firebase/career-index-emulator.cjs` exists there; if not, reply `Job 8 waits for job 7.` and stop.
- **Lane and CI path.** Work mode has Java 17 and cannot run the Firestore emulator (needs Java 21) and cannot `git push` (smoke `CAPABILITIES_WORK.md`). So: run `npm ci`, `node --check`, `npm run test:contracts`, `npm run test:ops` and `node tests/contracts/completed-showdown-read-contracts.cjs` locally; save files through the connector (WORKER_HANDBOOK §7 Path A); and read every emulator result from the "Validate Gameplay Fast" run on your **exact head commit** (job `rules-emulator`; the log of the step named in each section is your test output). Add the CI step in **step 3**, so CI runs the new emulator test from the first save.

Create:

- `js/sparkCompletedShowdownReader.js` (Appendix B)
- `tests/firebase/completed-showdown-read-emulator.cjs` (Appendix C)
- `tests/contracts/completed-showdown-read-contracts.cjs` (Appendix D)

Edit (and only these):

| File | Change |
| --- | --- |
| `firestore.persistent-pair-production.fragment.rules` | two new functions before `// CMS_PERSISTENT_PAIR_FUNCTIONS_END` (Appendix A) |
| `scripts/inject-persistent-pair-rules.mjs` | four `replaceOnce` get-rule seams, six required strings, one exact-count check (Appendix A) |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended at the end (Appendix E) |
| `tests/operations/pos20-control-plane.test.mjs` | one const + append it to `expectedSupplementalContracts` (Appendix E) |
| `.github/workflows/validate-gameplay-fast.yml` | one step at the end of `rules-emulator` (Appendix E) |
| `tests/firebase/two-manager-journey-emulator.cjs` | flip `KNOWN GAP 1` into completed-read assertions; one helper; PASS line wording (Appendix F) |
| `project-documents/gameplay-factory/status/JOB-08.md` on `factory/gameplay-v1` | status file |

That is nine code files. `git diff --stat origin/gameplay/recovery-v1` must list exactly these nine.

Read first (on `gameplay/recovery-v1` at `889810f`; line numbers are observations, re-check them):

1. `firestore.spark.rules`: `activeAccount` 74, `currentlyEntitled` 440 (root `get` for members, also after close), `activePairedRivalry` 447-464 (requires `connectionState == "active"`), `match /rivalries/{rivalryId}` 885. **Read only.**
2. `firestore.shared-setup-production.fragment.rules`: `ssjrEntitled` 33, `match /sharedSetup/authoritative` 256. `firestore.season-results-production.fragment.rules`: `ssjrResultsPrivateReadable` 226 (rival role readable only at `RESULTS_READY`), `match /seasonResults/{seasonId}` 234, `match /roles/{managerRole}` 240. `firestore.season-commit-production.fragment.rules`: `match /seasonCommits/{seasonId}` 282. **Read only.**
3. `firestore.terminal-close-production.fragment.rules`: `ssjrTerminalValidIntent` 7, `ssjrTerminalProgressShape` 65, `ssjrTerminalValidCloseUpdate` 196 (the protected transition that writes the witness). The grant reuses the first two. **Read only.**
4. `firestore.persistent-pair-production.fragment.rules`: `cmsPersistentPairAbandonValid` 120 (abandon = closed **without** `terminalClose`), `cmsCareerIndexPageCreateValid` 292, markers `// CMS_PERSISTENT_PAIR_FUNCTIONS_END` 311 and `// CMS_PERSISTENT_PAIR_MATCH_END` 330.
5. `scripts/inject-persistent-pair-rules.mjs`: abandonment seam ends 47, required list 49, exact-count checks ending 92.
6. `js/sparkTerminalClose.js` `stcRead` 57 (witness checks the reader mirrors); `js/sparkSharedSeasonCommit.js` `scpRebuildSetup` 59, `scpReadyState` 68, `scpCoreFromStorage` 77, `scpContext` 90 (the storage-to-protocol conversions the reader mirrors, minus account/device/session); `js/sharedHistoryConvergence.js` `hcBuild` 95, `hcVerify` 111. **Read only.**
7. `tests/firebase/two-manager-journey-emulator.cjs`: `PersistentPair` require 26, `runSecondShowdownAndAbandon` 163, `KNOWN GAP 1` 172-173, last abandon assertion 195, PASS line 273.
8. `tests/operations/pos20-control-plane.test.mjs` `careerIndexContract` and `expectedSupplementalContracts` (ordered `deepEqual` against the registry paths; the new contract goes last).
9. Authority: Sol ruling S2C-005R2 §4 (D2 corrections) and §6 items 4 and 6 (on `visual/cinematic-system-v10`, `project-documents/model-relay/archive/S2C-005R2_home-recovery-ruling.md`), lead handoff §2 "D2" (on `leads/relay`), `DATA_CONTRACT_V1.md` §6 "What counts" and §8.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. **Never deploy Rules or Pages.** Emulator project ids start with `demo-`.
- Billing permanently OFF: Spark only. No Cloud Functions, no Cloud Run, no Blaze, no scheduled jobs, no server code. App Check enforcement stays off. Do not write the words `billing`, `blaze`, `cloud functions` or `cloud run` into the fragment (the contract tests grep for them).
- Exactly two private managers: Daniel = `playerOne`, Nik = `playerTwo`. The grant requires the reader to be one of the two authorized accounts **and** in one of the two manager slots, with an active account.
- **Completed-only.** The grant keys on the full Terminal Close witness, never on `closedSessionRevision` alone: closed, live, `terminalClose` present and valid (`ssjrTerminalValidIntent`), `terminalProgress` valid (`ssjrTerminalProgressShape`), `acceptedThroughSeason == totalSeasons`, `closedSessionRevision` an int, intent totals and length equal progress totals and length. Abandoned Showdowns (closed without a witness) get nothing below the root.
- **Privacy.** A manager never sees the rival's unfinished inputs. The grant covers result roles only for seasons 1..N of a Terminal-Closed Showdown; Terminal Close is only reachable after every one of those seasons was acknowledged, which required `RESULTS_READY`, which is when both roles were already readable to both managers. Active and abandoned privacy is unchanged and re-proved (F2, D3, D4).
- **Transfers stay out** (G-10 keeps the existing `COMPLETED` condition). So do drafts, invites, sessions, `careerStart` and `sharedSetup/leagueProjection`.
- **Get only.** No write, list or delete rule may mention `cmsCompleted…`. Closed writes stay denied (C1-C5).
- **Expression budget.** Firestore evaluates at most 1,000 expressions per request. Write rules on the rivalry are at that edge (`validInitialRivalryCreate`, `validRivalryRedeem`, `cmsPersistentPairCreationWitnessValid`, `cmsPersistentPairRedemptionWitnessValid`). This job adds only `allow get` branches; write requests never evaluate `get` rules. **Do not touch any write rule, any of those four functions, or anything under `match /rivalries` except the four `allow get` lines the injector rewrites.**
- **No staging flag needed.** The grant is a pure read-side addition: existing clients never read closed documents (their providers stop at `RIVALRY_INACTIVE` first), so old clients are unaffected, and a new client against old Rules gets `permission-denied`, which the reader reports as `unavailable` (contract K6). Deploy order is free. Do not add an `…Enforced()` constant.
- Client reader is memory-only (no `localStorage`, `sessionStorage`, `indexedDB`), uses only `sdk.doc` + `sdk.getDoc`, never `runTransaction`, `getDocs(`, `collection(`, `query(`, `onSnapshot`, any write, or the `sessions` path. Function names inside it start with `csr` (the static release contract forbids duplicate top-level function names across `js/`).
- Do not edit `firestore.spark.rules`, any other fragment, either build script, `js/persistentNikDanielPair.js` (`contractVersion` stays 4), any other `js/` file, `index.html`, `service-worker.js`, the deploy workflows, or any test not listed in §2.
- Never weaken, skip or delete an existing assertion. The only existing assertion that changes meaning is JOB-02's `KNOWN GAP 1`, which this job is chartered to flip.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 What becomes readable (and what does not)

For a rivalry `R` whose root is closed by a verified Terminal Close, for a signed-in manager of `R` with an active account:

| Path | Before | After this job |
| --- | --- | --- |
| `rivalries/R` | readable (`currentlyEntitled`) | unchanged |
| `rivalries/R/sharedSetup/authoritative` | denied after close | **readable** |
| `rivalries/R/seasonResults/season_k`, k = 1..N | denied after close | **readable** |
| `rivalries/R/seasonResults/season_k/roles/{playerOne,playerTwo}`, k = 1..N | denied after close | **readable** (final results, shared at `RESULTS_READY`) |
| `rivalries/R/seasonCommits/season_k`, k = 1..N | denied after close | **readable** |
| `season_{N+1}` and above, `season_01`, `roles/playerThree` | denied | denied |
| `transferChallenges/**` | denied after close | denied (G-10) |
| `careerStart/authoritative`, `sharedSetup/leagueProjection`, `sessions/**`, `invites/**`, `state/**` | as today | unchanged (no grant) |
| any list, any write, any delete | denied | denied |

For an **abandoned** rivalry (closed, no `terminalClose`): only the root stays readable, for the History status row. For an **active** rivalry: everything exactly as today.

### 4.2 Requirements and proofs

Check ids refer to the emulator test (Appendix C, §6.2) and the contract test (Appendix D, "K" ids, §6.1). "Journey" is the updated two-manager journey (Appendix F).

| # | Requirement (S2C-005R2 §4, §6 items 4 and 6) | How the Rules/client enforce it | Proved by |
| --- | --- | --- | --- |
| R1 | Entitled members read setup and season data of a completed Showdown without a gameplay session | four `allow get` branches: `ssjrEntitled(rivalryId) \|\| cmsCompleted…Readable(…)`; reader uses no session | A1-A7, P1-P3, Journey |
| R2 | Completed means a fully verified Terminal Close witness, not `closedSessionRevision` alone | `cmsCompletedShowdownReadable`: closed, live, `terminalClose` present, `ssjrTerminalValidIntent`, `ssjrTerminalProgressShape`, accepted == total, `closedSessionRevision is int`, intent length/totals == progress length/totals; reader mirrors `stcRead` | E0-E10, P8, K5 |
| R3 | Abandoned Showdowns: no season reads, nothing counted | no witness -> no grant; reader returns `abandoned` after one read | D1-D6, P5, K4, Journey (R3) |
| R4 | Exactly `season_1..season_N`; a gap is unavailable, never a shorter history | `seasonId in ['season_1',…,'season_10'][0:total]`; reader reads every season and fails on any missing doc | B5, B6, P10 |
| R5 | No rival's unfinished inputs, ever | roles granted only for witness-covered seasons (all reached `RESULTS_READY`); active/abandoned rules unchanged | A6, A7, D3, D4, F2, F3 |
| R6 | Transfer reads keep the existing `COMPLETED` condition (out of this job) | no grant on `transferChallenges` or its roles | B8, B9, D6, K8 |
| R7 | Drafts, invites, sessions, career-start and other paths stay outside the grant | grant appears on exactly four `allow get` lines | B10, B11, I0, K8 |
| R8 | Strangers, unauthenticated users, inactive accounts and lists stay denied | membership in `authorizedAccountIds` and a manager slot, `activeAccount(request.auth.uid)`; list rules untouched | B1-B4, B7, E9 |
| R9 | Closed writes remain denied | get-only grant; no write rule mentions it | C1-C5, I0, K8 |
| R10 | Active Showdowns behave exactly as before | existing `ssjrEntitled` branch first, unchanged | F1-F4, every other CI step unchanged |
| R11 | Reader verifies provenance and content, not just shape | root envelope hash, slots/role, witness; setup ledger replayed through the setup protocol; per season public results + both roles -> canonical results hash -> results protocol `verifyState`; acknowledged commit -> commit protocol `verifyState`; canonical scoring; `buildProjection` + `verifyProjection` | P1, P4, K6 |
| R12 | Coverage and both totals cross-checked against the witness; totals-only final winner (no season tiebreaks) | `acceptedSeasons == totalSeasons == N`, rebuilt totals == witness totals, winner from totals == witness winner, else `COMPLETED_TOTALS_MISMATCH` | P1, P9 |
| R13 | Both managers get the identical result; it equals the session-bound projection | deterministic rebuild from the same documents | P2, P3, P4, Journey |
| R14 | Unavailable is never drawn as empty or shorter | every failure returns `unavailable` with a code and `projection: null` | P7, P8, P10, K3, K6 |
| R15 | Exact gets only: no session, device, transaction, list, write or storage | source grep; one read for `abandoned`/`not-closed` | K2, P5, P6 |
| R16 | Composed production Rules are what is tested; existing suites unchanged | both builds; all prior CI steps stay green | I0, K8, step 6 |

### 4.3 Rules function names (exact)

Add these two functions to the fragment, before `// CMS_PERSISTENT_PAIR_FUNCTIONS_END`, verbatim from Appendix A: `cmsCompletedShowdownReadable(rivalryId)`, `cmsCompletedSeasonReadable(rivalryId, seasonId)`. Do not add a match block. The injector (Appendix A) rewrites exactly four composed `allow get` lines with `replaceOnce`:

| Composed seam (must exist exactly once) | Becomes |
| --- | --- |
| `match /sharedSetup/authoritative {` + `allow get: if ssjrEntitled(rivalryId);` | `allow get: if ssjrEntitled(rivalryId) \|\| cmsCompletedShowdownReadable(rivalryId);` |
| `match /seasonResults/{seasonId} {` + `allow get: if ssjrEntitled(rivalryId);` | `… \|\| cmsCompletedSeasonReadable(rivalryId, seasonId);` |
| `allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);` | same, then `\|\| (managerRole in ['playerOne', 'playerTwo'] && cmsCompletedSeasonReadable(rivalryId, seasonId));` |
| `match /seasonCommits/{seasonId} {` + `allow get: if ssjrEntitled(rivalryId);` | `… \|\| cmsCompletedSeasonReadable(rivalryId, seasonId);` |

Why the persistent-pair fragment and the injector (not the shared fragments): it keeps `firestore.spark.rules`, the six shared fragments and both build scripts byte-identical (their own contracts pin them), and it is the same reviewed pattern as G-7. The shared-only build stays exactly as it is.

### 4.4 Client API (`js/sparkCompletedShowdownReader.js`)

Browser global `CareerModeSparkCompletedShowdownReader`; CommonJS export for tests. Frozen module with:

| Export | Shape |
| --- | --- |
| `readCompletedShowdown(options)` | `async`, **never throws**. `options = {firestore, firebaseSdk, user, rivalryId, cryptoImpl?}`; `firebaseSdk` needs only `doc` and `getDoc`. Returns a frozen `{status, code, rivalryId, managerRole, terminalWitness, projection, final}`. |
| `statuses` | `['completed','abandoned','not-closed','unavailable']` |
| flags | `sessionRequired:false, deviceRequired:false, providerWriteRequired:false, listPermissionRequired:false, canonicalStorageMutation:false, billingRequired:false`, `contractVersion:1`, `sourceAuthorityPaths` |

Result by status:

| `status` | Meaning | Fields |
| --- | --- | --- |
| `completed` | closed by a verified Terminal Close; every season rebuilt and verified; totals equal the witness | `managerRole`, `terminalWitness` (verified intent), `projection` (a `sharedHistoryConvergence` projection, verifies with `verifyProjection`), `final:{totals:{playerOne,playerTwo}, winner, margin, seasonsPlayed}` |
| `abandoned` | closed without a witness. Only the root was read | `managerRole`; `projection` and `final` are `null` |
| `not-closed` | `active` or `pending-pair` (G-5 / G-9 handle it). Only the root was read | `managerRole` |
| `unavailable` | anything else | `code`: a Firestore code such as `permission-denied`, or one of `COMPLETED_PROVIDER_UNAVAILABLE`, `COMPLETED_AUTH_REQUIRED`, `COMPLETED_RIVALRY_INVALID`, `COMPLETED_RIVALRY_MISSING`, `COMPLETED_RIVALRY_INTEGRITY_FAILED`, `COMPLETED_NOT_A_MANAGER`, `COMPLETED_BINDING_INVALID`, `COMPLETED_TERMINAL_WITNESS_INVALID`, `COMPLETED_SETUP_INVALID`, `COMPLETED_SEASON_MISSING`, `COMPLETED_SEASON_INVALID`, `COMPLETED_TOTALS_MISMATCH`, `COMPLETED_PROTOCOL_UNAVAILABLE`, `COMPLETED_CRYPTO_UNAVAILABLE`, `COMPLETED_READ_FAILED` |

Read order for `completed` (each step fails closed): root -> envelope hash, slots, role -> witness (before any child read) -> setup ledger (exact keys, confirmed, length == witness) -> replay the ledger through `sharedShowdownSetup.createProtocol` to get `leagueId`, `clubs`, team count -> for k = 1..N: public results, `roles/playerOne`, `roles/playerTwo`, commit (all four fetched first; any missing -> `COMPLETED_SEASON_MISSING`) -> canonical results hash (`RESULTS_READY` core) + results protocol `verifyState` -> commit core with that hash + commit protocol `verifyState` -> canonical scoring -> `buildProjection` + `verifyProjection` -> coverage/totals/winner == witness.

Reads per completed Showdown: 2 + 4N document gets (each `get` also evaluates up to two rule-dependent reads: the rivalry root and the reader's account). G-9 must cache per signed-in account in memory, as S2C-005R2 §5 requires.

### 4.5 Existing tests: what changes and what must stay untouched

Must change (every other assertion kept):

1. `tests/firebase/two-manager-journey-emulator.cjs` (JOB-02, as updated by JOB-07): the two `KNOWN GAP 1` `assertFails` become `assertSucceeds` for both managers; a new helper `assertCompletedShowdowns` reads with `readCompletedShowdown` from **fresh** authenticated clients: after Showdown 2 pairing, R1 is `completed` with the main journey's final totals; after Showdown 3 is abandoned, the career index is `[R2, R3]` for both managers, R2 is `completed` (1 season, 5-0), R3 is `abandoned`, R1 is still `completed`, and Daniel and Nik get identical results. The PASS line says `second Showdown, completed-only reads of closed Showdowns` instead of `second Showdown known gaps`. Appendix F.
2. `tests/operations/pos20-control-plane.test.mjs`: add the new contract to `expectedSupplementalContracts` (order matters: last).

Must stay byte-identical (check with `git diff --stat` in step 6):

- `firestore.spark.rules`, the six other `*.fragment.rules`, both build scripts, every `js/` file except the new one, `index.html`, `service-worker.js`, `.github/workflows/deploy-*.yml`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10 kernel files.
- `tests/contracts/career-index-contracts.cjs`, `tests/contracts/persistent-nik-daniel-pair-contracts.cjs`, every other `tests/contracts/*.cjs`, every `tests/browser/*` audit, every other `tests/firebase/*-emulator.cjs` (career index, pair provider, setup provider, transfer fresh-session, lifecycle, terminal close, diagnostics).

### 4.6 The generated-rules trap

`npm run test:contracts` rebuilds `firestore.spark.generated.rules` **without** the persistent-pair fragment (the pair contract spawns the shared-only build last). Any emulator run after it, without rebuilding, has no grant (I0 fails) and fails every pair/index write. Always run, in this order, immediately before any emulator run (local or in a CI step that follows contracts):

```bash
node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
```

CI's `rules-emulator` job already builds both before its first step; do not reorder it. Never commit `firestore.spark.generated.rules` changes or `firestore-debug.log`.

## 5. Steps

After each step update `status/JOB-08.md` on `factory/gameplay-v1` with `Job 8 step k/8: <step name>`. Save code to `gameplay/job-08-completed-read` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1` (at or after `889810f`), `npm ci`. Run `npm run test:contracts` (record `N/N`, expected `102/102` at `889810f`; it becomes `N+1` in step 6), `npm run test:ops` (record pass/fail, expected 73/0). Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1` (it includes `Career index matrix`). If that run is not green, set BLOCKED: `Job 8 is blocked: recovery-v1 CI is red before any change.`
2. **Map.** Confirm every line number in §2 "Read first" on the current head and write drift in the Notes. Rebuild both Rules (§4.6) and confirm each of these prints `1`: `grep -c "allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);" firestore.spark.generated.rules`, and `grep -A1 -E "match /(sharedSetup/authoritative|seasonResults/\{seasonId\}|seasonCommits/\{seasonId\}) \{" firestore.spark.generated.rules | grep -c "allow get: if ssjrEntitled(rivalryId);"` prints `3`. Confirm the journey still has both `KNOWN GAP 1` lines.
3. **Tests first.** Create `tests/contracts/completed-showdown-read-contracts.cjs` (Appendix D) and `tests/firebase/completed-showdown-read-emulator.cjs` (Appendix C). Apply Appendix E (registry entry, ops-test line, CI step `Completed-only read matrix` at the end of `rules-emulator`, after `Career index matrix`). `node --check` both new files. Run the contract locally: it must **fail** with `Cannot find module …/js/sparkCompletedShowdownReader.js`. Save. On CI, on your head: `Gameplay contracts` fails only on the new contract; in `rules-emulator` every existing step is green and `Completed-only read matrix` fails at I0 with `0 !== 1` (no grant in the composed Rules yet; the reader is loaded only for section P, so I0 is reached). This red run is your tests-first evidence; link it.
4. **Client.** Create `js/sparkCompletedShowdownReader.js` (Appendix B). `node --check` it. Run the contract locally: K1-K6 now pass and it fails at K7 with `AssertionError … data.connectionState == 'closed'` (the fragment has no grant yet). Save. CI: emulator still red at I0. Record.
5. **Rules and journey flip, in one save.** Apply Appendix A (fragment + injector) and Appendix F (journey) together; save both before reading CI. Why together: once the grant exists, the journey's `KNOWN GAP 1` `assertFails` fails, and a failed journey step skips every later CI step. Rebuild both Rules (§4.6); `grep -c "cmsCompletedSeasonReadable(rivalryId, seasonId)" firestore.spark.generated.rules` prints `4` and `grep -c "cmsCompletedShowdownReadable(rivalryId)" …` prints `3`. Run the contract locally: PASS. Save. CI should now be fully green; if it is not, go to §8.
6. **Full proof.** Locally: `node tests/contracts/completed-showdown-read-contracts.cjs` PASS; `npm run test:contracts` prints `(N+1)/(N+1)` (expected `103/103`); `npm run test:ops` has 0 failures; `git diff --stat origin/gameplay/recovery-v1` lists exactly the nine §2 files. Rebuild both Rules (trap §4.6) and confirm the composed file is not committed. On CI, on your exact head: every step of both jobs green; paste the last line of `Completed-only read matrix` (`PASS completed-only read emulator: 56 numbered checks …`), of `Two-manager journey` (`… second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.`), both lines of `Career index matrix` (Phase A 56, Phase B 58) and of `Persistent Nik and Daniel pair matrix`. Then run the qualified expression-budget gate (§7).
7. **PR.** Open the PR into `gameplay/recovery-v1` titled `Job 8: completed-only read grant + session-free reader`. Body: the §4.2 table, the §4.1 table, the nine files, the CI run URL on the exact head, and the line "Rules are not deployed by this PR. Read-only grant: deploy order is free (old clients never read closed Showdowns; a new client against old Rules reports unavailable)."
8. **Codex review.** After CI is green on the exact head and the PR is open, post one PR comment that says exactly `@codex review`. Set `State: WAITING ON CODEX` in the status file and save it. When the review arrives, this is your one fix round: fix every finding that is a real bug (push, wait for green CI on the new exact head) and reply on each finding thread in one line: `fixed in <commit>` or why not. A fix that touches Rules or the reader re-runs step 6 in full. Then fill the Done checklist and set `State: DONE`, save `Job 8 done: Completed-only read grant + session-free reader`. If Codex does not answer, write that in the status file and set DONE; the lead decides. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a).

## 6. Tests first

### 6.1 Contract test (`tests/contracts/completed-showdown-read-contracts.cjs`, Appendix D)

No Firebase, no emulator. Runs in `npm run test:contracts` through the registry entry. Uses an in-memory fake `{doc, getDoc}` that logs every path read.

| Id | Proves |
| --- | --- |
| K1 | API surface: `readCompletedShowdown`, the four `statuses`, all six safety flags `false`, module frozen |
| K2 | reader source has no `runTransaction`, `getDocs(`, `collection(`, `query(`, `listDocuments`, write call, browser storage, `sessions` path or `onSnapshot`; uses `sdk.getDoc(sdk.doc(` |
| K3 | never throws: missing options, bad id, missing user -> frozen `unavailable` with a code |
| K4 | `active` / `pending-pair` -> `not-closed`, one read; closed without `terminalClose` -> `abandoned`, one read (also with staged `terminalProgress`) |
| K5 | seven forged witnesses (winner, no closed revision, accepted < total, totals differ, other rivalry, extra progress key, missing progress) -> `COMPLETED_TERMINAL_WITNESS_INVALID` with exactly one read |
| K6 | tampered envelope -> `COMPLETED_RIVALRY_INTEGRITY_FAILED`; stranger -> `COMPLETED_NOT_A_MANAGER`; missing root -> `COMPLETED_RIVALRY_MISSING`; denied root -> `permission-denied`; missing ledger -> `COMPLETED_SETUP_INVALID`; denied ledger (old Rules) -> `permission-denied` |
| K7 | fragment text: every witness clause present, no `getAfter` / `request.resource` in the grant, no billing words; injector carries the four seam labels |
| K8 | both builds exit 0; the grant appears on exactly setup, season results, result roles, season commits; never on leagueProjection, careerStart, transferChallenges (or its roles), sessions or invites; no write/list/delete rule mentions it |

### 6.2 Emulator test (`tests/firebase/completed-showdown-read-emulator.cjs`, Appendix C)

Composed production Rules, project `demo-cms-completed-read` locally / `demo-cms-gameplay-fast-completed-read` in CI. Accounts: Daniel `acct_daniel` (`playerOne`), Nik `acct_nik` (`playerTwo`), stranger `acct_stranger`, `acct_inactive` (status `deletion-requested`). Three real 1-season Showdowns played through the providers: **X** completed by a real Terminal Close; **Y** abandoned mid-season by a Rules-checked abandon write after Daniel published his result (season `COLLECTING`); **Z** active with season `COLLECTING`. Forged roots (E) are copies of X's root with one field changed, seeded with Rules disabled (children absent, so an allowed `get` returns not-found and a denied one throws). Output: one `ok <n> <id> <label>` line per check, then `PASS completed-only read emulator: 56 numbered checks …`.

| Id | Check | Expect |
| --- | --- | --- |
| I0 | composed Rules carry the grant on exactly the four `allow get` lines, no write rule mentions it, pair/index/terminal markers present | assert |
| A1 | Daniel gets X setup; X's session is `closed` | allow |
| A2 | Nik gets X setup | allow |
| A3 | Daniel gets X `season_1` commit (`ACKNOWLEDGED`) | allow |
| A4 | Nik gets X `season_1` commit | allow |
| A5 | Nik gets X `season_1` public results | allow |
| A6 | Daniel gets Nik's X `season_1` result role | allow |
| A7 | Nik gets Daniel's X `season_1` result role | allow |
| B1 | stranger gets X setup | deny |
| B2 | stranger gets X `season_1` commit | deny |
| B3 | stranger gets X result role | deny |
| B4 | unauthenticated get of X setup | deny |
| B5 | Daniel gets X `season_2` commit (1-season Showdown) | deny |
| B6 | Daniel gets X `seasonResults/season_01` | deny |
| B7 | Daniel lists X `seasonCommits` | deny |
| B8 | Daniel gets X `transferChallenges/season_1` | deny |
| B9 | Nik gets X transfer role `playerOne` | deny |
| B10 | Daniel gets X `careerStart/authoritative` | deny |
| B11 | Daniel gets X `sharedSetup/leagueProjection` | deny |
| B12 | Daniel gets X `roles/playerThree` | deny |
| C1 | Daniel rewrites X setup | deny |
| C2 | Nik creates X `season_2` commit | deny |
| C3 | Daniel rewrites X `season_1` commit | deny |
| C4 | Daniel deletes X setup | deny |
| C5 | Nik rewrites his X result role | deny |
| D1 | Daniel gets abandoned Y setup | deny |
| D2 | Nik gets Y `season_1` public results | deny |
| D3 | Nik gets Daniel's unfinished Y result role | deny |
| D4 | Daniel gets his own Y result role after abandon | deny |
| D5 | Daniel gets the Y root; `closed`, no `terminalClose` | allow |
| D6 | Daniel gets Nik's Y transfer role | deny |
| E0 | control: correctly witnessed forged copy | allow |
| E1 | closed + `terminalProgress`, no `terminalClose` | deny |
| E2 | witness winner contradicts totals | deny |
| E3 | `closedSessionRevision` null | deny |
| E4 | accepted 1 of 3 seasons | deny |
| E5 | intent totals != progress totals | deny |
| E6 | witness names another rivalry | deny |
| E7 | witness has an extra key | deny |
| E8 | root `tombstoned` | deny |
| E9 | member whose account is not active | deny |
| E10 | closed + `terminalClose`, no `terminalProgress` | deny |
| F1 | Daniel gets active Z setup (existing rule) | allow |
| F2 | Nik gets Daniel's `COLLECTING` Z result role | deny |
| F3 | Daniel gets his own `COLLECTING` Z result role | allow |
| F4 | stranger gets Z setup | deny |
| P1 | Daniel `readCompletedShowdown(X)` | `completed`, role `playerOne`, frozen, projection verifies, `final = {totals:{5,0}, winner:'playerOne', margin:5, seasonsPlayed:1}` == witness |
| P2 | Nik reads X | `completed`, role `playerTwo`, identical projection and final |
| P3 | fresh authenticated client, no session/device input | identical projection |
| P4 | reader projection vs session-bound `History.read` projection taken before close | deep-equal |
| P5 | Nik reads abandoned Y | `abandoned`, `projection`/`final` null, exactly 1 read |
| P6 | Daniel reads active Z | `not-closed`, exactly 1 read |
| P7 | stranger reads X | `unavailable`, `permission-denied`, never empty |
| P8 | Daniel reads forged E2 root | `unavailable`, `COMPLETED_TERMINAL_WITNESS_INVALID`, exactly 1 read |
| P9 | X witness totals rewritten to 6-0 (Rules still allow) | `unavailable`, `COMPLETED_TOTALS_MISMATCH` |
| P10 | X `season_1` commit deleted | `unavailable`, `COMPLETED_SEASON_MISSING`, never shorter |

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 3 (URL), `Completed-only read matrix` failing at I0 and the contract failing on the missing module; step 4 contract failing at K7.
- [ ] `node tests/contracts/completed-showdown-read-contracts.cjs` PASS locally; `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including `Completed-only read matrix` (56 numbered checks), `Two-manager journey` (new PASS wording), `Career index matrix` (Phase A 56, Phase B 58) and `Persistent Nik and Daniel pair matrix`.
- [ ] Two-manager journey: both managers read closed R1 setup and season 1; R1 and R2 `completed`, R3 `abandoned`, index `[R2, R3]`, identical for both; `KNOWN GAP 1` label is gone; no other assertion changed.
- [ ] Qualified expression-budget gate (lead wording from JOB-07, unchanged): every emulator case that expects success passes; the phrase `maximum of 1000 expressions` may appear only on the log lines of cases that expect PERMISSION_DENIED. Check it mechanically: for each occurrence, the next `ok N <case>` line must be a denial case. Today the only expected occurrences are career-index `D13` (stranger cannot create an index naming a rivalry they are not in), once in Phase A and once in Phase B. Record the case name(s). If the phrase ever appears next to a case that expects success (any completed-read A/F/P allow, journey, creation, redemption, rollover or append case), that is a FAIL and BLOCKED. Do not edit any assertion to hide it.
- [ ] No write rule, none of the four budget-edge functions, `firestore.spark.rules`, the six shared fragments and both build scripts changed; the grant appears only on four `allow get` lines.
- [ ] `git diff --stat` lists only the nine §2 files; no generated Rules, no `firestore-debug.log`; `contractVersion` in `js/persistentNikDanielPair.js` still 4; `index.html` and `service-worker.js` unchanged.
- [ ] No deploy, nothing pushed to `main`, no billing words in the fragment.
- [ ] PR open into `gameplay/recovery-v1` with the §4.1 and §4.2 tables and the deploy-order line.
- [ ] Codex: `@codex review` posted after green CI; State was WAITING ON CODEX; every finding thread answered in one line (`fixed in <commit>` or why not); CI green again on the final exact head; or "Codex did not answer" recorded. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 8 is blocked: <one line>`.

Known traps:

- **I0 fails with `0 !== 1` after step 5.** The composed Rules lack the pair fragment (§4.6 trap), or a seam string drifted. Rebuild both; if the injector throws `Expected exactly one completed Showdown … seam`, re-check the seam strings against the composed file from step 2 (exact indentation: six spaces before `match`, eight before `allow`, ten before the roles `allow`).
- **`Two-manager journey` fails at `KNOWN GAP 1 (fixed by G-8)` and later steps are skipped.** You saved Appendix A without Appendix F. Save the journey flip.
- **P1/P2 `unavailable` with `COMPLETED_SETUP_INVALID` or `COMPLETED_SEASON_INVALID`.** A conversion in the reader drifted from `scpRebuildSetup` / `scpReadyState` / `scpCoreFromStorage`. Re-apply Appendix B byte for byte; do not "simplify" the canonical hash (`csrSortedCanonical`) or the envelope hash (`csrEnvelopeCanonical`): they are different on purpose, exactly as in the providers they mirror.
- **P1 `unavailable` with `COMPLETED_RIVALRY_INTEGRITY_FAILED`.** The test's forge helper or a fixture rewrote the root without recomputing `contentHash`; only P9 rewrites X, and it recomputes the hash.
- **`maximum of 1000 expressions` next to an A/F/P allow case.** You changed something other than the four `allow get` lines. The grant must never be on a write rule.
- **Old client against new Rules, new client against old Rules.** Neither is a bug: old clients never read closed documents; a new client against old Rules gets `permission-denied` and reports `unavailable`.
- `firestore-debug.log` appears after local emulator runs. Never commit it.

### Deploy order (for the lead, not this job)

Read-only grant: Rules and Pages may ship in either order. It rides the same Rules-only release as G-7 at the main gate. Deployment needs Nik's typed words and goes through the zero-billing Rules workflow; it is out of scope here.

## 8a. Lead decisions (2026-10-03)

- Lead decision (2026-10-03): the result-role read grant for seasons 1..N of a Terminal-Closed Showdown is approved. Those documents hold only final results both managers could already read once each season reached RESULTS_READY, so no unfinished input is exposed and the projection stays equal to the active one.

- **Scope of the grant:** setup ledger, season results (public + both roles) and season commits for `season_1..season_N`. Role documents are included because the canonical results hash (`resultsContentHash`, part of every projection row) can only be rebuilt from them, and S2C-005R2 §4 requires "canonical results hash/scoring reconstruction"; P4 proves the session-free projection is byte-identical to the session-bound one. They contain only final results already readable to both managers since `RESULTS_READY`.
- **Not in the grant:** transfers (G-10), `careerStart`, `sharedSetup/leagueProjection`, sessions, invites, `state`, idempotency. The reader recomputes league and clubs from the setup ledger, exactly like `scpRebuildSetup`.
- **No staged rollout:** unlike G-7, nothing an existing client writes changes, so there is no `…Enforced()` constant and no Phase B.
- **Placement:** persistent-pair fragment + injector seams (the G-7 pattern), so the shared-only composition and its contracts stay byte-identical.
- **Not wired to screens:** no `index.html`, `service-worker.js` or shell revision change here. G-9 loads the module and feeds the career model. The main-gate requirements carried from JOB-07 (Rules-only release first, r52 shell bump, Phase B flip later) are unchanged; this grant joins that Rules-only release.
- G-12 decides whether the completed-read proof joins `deploy-firestore-rules-zero-billing.yml`. Not this job.
- Codex: one review, one fix round (RULES.md). After the fix round the lead decides.

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `889810f` (Java 21, firebase-tools 15.28.1, firebase 12.17.1, @firebase/rules-unit-testing 5.0.1, node 22). Results on that worktree: `npm run test:contracts` `103/103`; `npm run test:ops` 73 pass / 0 fail; one `emulators:exec` running every `rules-emulator` CI step in order (setup provider, transfer fresh-session, lifecycle 1 and 3, terminal close, pair matrix, journey 3 seasons, career index Phase A 56 and Phase B 58, completed-only read 56) all PASS; journey also PASS at 1 season; composed Rules 131,462 bytes. Budget: the only `maximum of 1000 expressions` lines were the two known career-index `D13` denials; none in the completed-read or journey logs. Tests-first states verified: contract fails on the missing module, then at K7 with the reader but no grant; emulator fails at I0 without the grant. Not run by the lead: GitHub CI itself (your step 3-6 runs are the first), Codex. Apply the appendices as given; if a hunk does not apply because the branch moved, re-apply by hand and say so in the status Notes. Diffs are against `889810f`.

### Appendix A. Rules: `firestore.persistent-pair-production.fragment.rules` and `scripts/inject-persistent-pair-rules.mjs`

````diff
diff --git a/firestore.persistent-pair-production.fragment.rules b/firestore.persistent-pair-production.fragment.rules
index 0fca55c..30808c5 100644
--- a/firestore.persistent-pair-production.fragment.rules
+++ b/firestore.persistent-pair-production.fragment.rules
@@ -308,6 +308,44 @@
         && headAfter.revision == headBefore.revision + 1
         && headAfter.data.sealedPageCount == root.data.pageNumber;
     }
+
+    // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified
+    // Terminal Close. Get only; no write, list or delete rule refers to these functions.
+    function cmsCompletedShowdownReadable(rivalryId) {
+      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
+      let data = root.data;
+      let slots = data.managerSlots;
+      let progress = data.terminalProgress;
+      return signedIn()
+        && rivalryId.matches('^pair_[0-9a-f]{64}$')
+        && root.objectType == 'rivalry'
+        && root.objectId == rivalryId
+        && root.lifecycleState == 'live'
+        && data.connectionState == 'closed'
+        && data.authorizedAccountIds is list
+        && data.authorizedAccountIds.size() == 2
+        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
+        && request.auth.uid in data.authorizedAccountIds
+        && slots is list
+        && slots.size() == 2
+        && slots[0].slotId == 'playerOne'
+        && slots[1].slotId == 'playerTwo'
+        && (slots[0].accountId == request.auth.uid || slots[1].accountId == request.auth.uid)
+        && activeAccount(request.auth.uid)
+        && 'terminalClose' in data
+        && ssjrTerminalValidIntent(rivalryId, data.terminalClose)
+        && ssjrTerminalProgressShape(progress)
+        && progress.acceptedThroughSeason == progress.totalSeasons
+        && progress.closedSessionRevision is int
+        && data.terminalClose.totalSeasons == progress.totalSeasons
+        && data.terminalClose.managerTotals == progress.managerTotals;
+    }
+
+    function cmsCompletedSeasonReadable(rivalryId, seasonId) {
+      let total = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.terminalProgress.totalSeasons;
+      return cmsCompletedShowdownReadable(rivalryId)
+        && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];
+    }
 // CMS_PERSISTENT_PAIR_FUNCTIONS_END
 
 // CMS_PERSISTENT_PAIR_MATCH_BEGIN
diff --git a/scripts/inject-persistent-pair-rules.mjs b/scripts/inject-persistent-pair-rules.mjs
index 04be889..0547d57 100644
--- a/scripts/inject-persistent-pair-rules.mjs
+++ b/scripts/inject-persistent-pair-rules.mjs
@@ -46,6 +46,11 @@ export function injectPersistentPairRules(){
     "      allow update: if (request.resource.data.data.connectionState == 'closed'\n          && !('terminalClose' in request.resource.data.data)\n          && cmsPersistentPairAbandonValid(rivalryId))\n        || ssjrTerminalValidRivalryUpdate(rivalryId)\n        || (!('terminalProgress' in request.resource.data.data) && validRivalryRedeem(rivalryId));",
     'persistent pair abandonment authority'
   );
+  // JOB-08 (D2): completed-only read grant. Get rules only; writes, list and delete stay as they are.
+  generated=replaceOnce(generated,'      match /sharedSetup/authoritative {\n        allow get: if ssjrEntitled(rivalryId);','      match /sharedSetup/authoritative {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedShowdownReadable(rivalryId);','completed Showdown setup read');
+  generated=replaceOnce(generated,'      match /seasonResults/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId);','      match /seasonResults/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);','completed Showdown season results read');
+  generated=replaceOnce(generated,'          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);','          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole)\n            || (managerRole in [\'playerOne\', \'playerTwo\'] && cmsCompletedSeasonReadable(rivalryId, seasonId));','completed Showdown season result role read');
+  generated=replaceOnce(generated,'      match /seasonCommits/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId);','      match /seasonCommits/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);','completed Showdown season commit read');
   for(const required of [
     'function cmsPersistentPairManagerValid(role, managerId)',
     'function cmsPersistentPairRivalryMembership(accountId, rivalryId, role)',
@@ -81,7 +86,13 @@ export function injectPersistentPairRules(){
     'next[0:prior.size()] == prior',
     '!(next[prior.size()] in prior)',
     'match /accounts/{accountId}/careerIndex/{indexId}',
-    "allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId)"
+    "allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId)",
+    'function cmsCompletedShowdownReadable(rivalryId)',
+    'function cmsCompletedSeasonReadable(rivalryId, seasonId)',
+    "'terminalClose' in data",
+    'progress.closedSessionRevision is int',
+    'allow get: if ssjrEntitled(rivalryId) || cmsCompletedShowdownReadable(rivalryId);',
+    'allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);'
   ]){
     if(!generated.includes(required))throw new Error(`Generated production Rules missing persistent pair boundary: ${required}`);
   }
@@ -91,6 +102,9 @@ export function injectPersistentPairRules(){
   if((generated.match(/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/g)||[]).length!==1){
     throw new Error('Generated production Rules must contain exactly one persistent pair account match.');
   }
+  if((generated.match(/cmsCompletedShowdownReadable\(rivalryId\)/g)||[]).length!==3||(generated.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length!==4){
+    throw new Error('Generated production Rules must apply the completed-only read grant to exactly setup, season results, result roles and season commits.');
+  }
   if(!generated.endsWith('\n'))generated+='\n';
   fs.writeFileSync(outputPath,generated,'utf8');
   return generated;
````

### Appendix B. New client: `js/sparkCompletedShowdownReader.js` (full file)

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkCompletedShowdownReader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-08 (D2): session-free, read-only reader for one Showdown closed by a verified Terminal Close.
  // Exact document gets only (rivalry, setup ledger, season_1..season_N results/roles/commits);
  // no session, no device, no transaction, no list, no write, no browser storage.
  const csrModule=(file,key)=>typeof require==="function"?require(file):root[key];
  const csrModules={
    get setup(){return csrModule("./sharedShowdownSetup.js","CareerModeSharedShowdownSetup");},
    get catalog(){return csrModule("./sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog");},
    get results(){return csrModule("./sharedSeasonResults.js","CareerModeSharedSeasonResults");},
    get commit(){return csrModule("./sharedSeasonCommit.js","CareerModeSharedSeasonCommit");},
    get scoring(){return csrModule("./sharedCanonicalScoring.js","CareerModeSharedCanonicalScoring");},
    get history(){return csrModule("./sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence");},
    get terminal(){return csrModule("./sharedTerminalClose.js","CareerModeSharedTerminalClose");}
  };
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const PROGRESS_KEYS=Object.freeze(["schemaVersion","runtimeRevision","totalSeasons","acceptedThroughSeason","managerTotals","closedSessionRevision"]);
  const SETUP_LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole","operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons","confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const COMMIT_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","resultsRevision","results","acknowledgedRoles","operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable"]);

  function csrFail(code){const error=new Error(code);error.code=code;throw error;}
  function csrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(csrFreeze);Object.freeze(value);}return value;}
  function csrPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function csrExact(value,keys,code){if(!csrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))csrFail(code);return value;}
  function csrClone(value){return JSON.parse(JSON.stringify(value));}
  function csrSortedCanonical(value){if(Array.isArray(value))return `[${value.map(csrSortedCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${csrSortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  function csrEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(csrEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=csrEnvelopeCanonical(value[key]);return out;}return value;}
  async function csrDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")csrFail("COMPLETED_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function csrSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function csrResult(value,teamCount){csrExact(value,RESULT_KEYS,"COMPLETED_SEASON_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)csrFail("COMPLETED_SEASON_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")csrFail("COMPLETED_SEASON_INVALID");}return csrClone(value);}

  function csrState(status,fields={}){
    return csrFreeze({status,code:fields.code||null,rivalryId:fields.rivalryId||null,managerRole:fields.managerRole||null,terminalWitness:fields.terminalWitness||null,projection:fields.projection||null,final:fields.final||null});
  }
  async function csrGet(sdk,db,parts){
    try{return csrSnapshot(await sdk.getDoc(sdk.doc(db,...parts)));}
    catch(error){csrFail(error&&typeof error.code==="string"&&error.code?error.code:"COMPLETED_READ_FAILED");}
  }

  async function csrVerifyRivalry(value,rivalryId,uid,cryptoImpl){
    if(!value||value.schemaVersion!==1||value.objectType!=="rivalry"||value.objectId!==rivalryId||!Number.isInteger(value.revision)||value.revision<0||value.lifecycleState!=="live"||!HASH.test(String(value.contentHash||""))||!csrPlain(value.data)||value.tombstone!==null)csrFail("COMPLETED_RIVALRY_INVALID");
    const expected=await csrDigest(JSON.stringify(csrEnvelopeCanonical({objectType:"rivalry",objectId:rivalryId,revision:value.revision,data:value.data})),cryptoImpl);
    if(expected!==value.contentHash)csrFail("COMPLETED_RIVALRY_INTEGRITY_FAILED");
    const slots=value.data.managerSlots,authorized=value.data.authorizedAccountIds;
    if(!Array.isArray(authorized)||authorized.length!==2||new Set(authorized).size!==2||!authorized.includes(uid)||!Array.isArray(slots)||slots.length!==2)csrFail("COMPLETED_NOT_A_MANAGER");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!authorized.includes(slot.accountId)||!/^profile_[0-9a-f]{24}$/.test(String(slot.profileId||""))||!/^save_[0-9a-f]{24}$/.test(String(slot.saveId||"")))||ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)csrFail("COMPLETED_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)csrFail("COMPLETED_NOT_A_MANAGER");
    return {slots:ordered,authorized:[...authorized],managerRole:actor.slotId};
  }
  function csrVerifyWitness(data,rivalryId){
    let intent;
    try{intent=csrModules.terminal.verifyIntent(data.terminalClose);}catch(_error){csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");}
    const progress=data.terminalProgress;
    if(!csrPlain(progress)||Object.keys(progress).length!==PROGRESS_KEYS.length||PROGRESS_KEYS.some(key=>!Object.hasOwn(progress,key)))csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");
    if(intent.rivalryId!==rivalryId||progress.schemaVersion!==1||progress.runtimeRevision!=="1.9.1-r18"||progress.totalSeasons!==intent.totalSeasons||progress.acceptedThroughSeason!==progress.totalSeasons||!Number.isInteger(progress.closedSessionRevision)||progress.closedSessionRevision<1||!csrPlain(progress.managerTotals)||progress.managerTotals.playerOne!==intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==intent.managerTotals.playerTwo)csrFail("COMPLETED_TERMINAL_WITNESS_INVALID");
    return intent;
  }
  function csrAssertLedger(value,rivalryId,totalSeasons){
    csrExact(value,SETUP_LEDGER_KEYS,"COMPLETED_SETUP_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||value.totalSeasons!==totalSeasons||!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))csrFail("COMPLETED_SETUP_INVALID");
    for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==6)csrFail("COMPLETED_SETUP_INVALID");}
    if(JSON.stringify(value.operationTypes)!==JSON.stringify(["open","commit-league","commit-clubs","commit-length","confirm","confirm"])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))csrFail("COMPLETED_SETUP_INVALID");
    return value;
  }
  function csrAuthority(rivalryId,rivalry,role,sessionId,hostRole){
    const slot=rivalry.slots.find(item=>item.slotId===role),host=rivalry.slots.find(item=>item.slotId===hostRole);
    if(!slot||!host)csrFail("COMPLETED_SETUP_INVALID");
    // Replays the stored ledger through the setup protocol; the session values are inert replay inputs, not a live session.
    return {rivalryId,connectionState:"active",managerSlots:rivalry.slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"})),actor:{accountId:slot.accountId,deviceId:"device_"+"0".repeat(32),deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},session:{sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Number.MAX_SAFE_INTEGER},nowEpochMs:0};
  }
  async function csrRebuildSetup(ledger,rivalry,rivalryId,cryptoImpl){
    if(!csrModules.setup||typeof csrModules.setup.createProtocol!=="function"||!csrModules.catalog||!csrModules.catalog.catalog)csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.setup.createProtocol({catalog:csrModules.catalog.catalog,cryptoImpl});let state=null;
    for(let index=0;index<ledger.revision;index+=1){
      const type=ledger.operationTypes[index],authority=csrAuthority(rivalryId,rivalry,ledger.actorRoles[index],ledger.activeSessionId,ledger.coordinatorRole);let command;
      if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});
      else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};
      else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await protocol.confirmationHash(state)};
      else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};
      const applied=await protocol.apply({state,authority,command});if(!applied||!applied.ok)csrFail("COMPLETED_SETUP_INVALID");state=applied.state;
    }
    if(!state||state.phase!=="SHOWDOWN_CONFIRMED"||state.revision!==6)csrFail("COMPLETED_SETUP_INVALID");
    return state;
  }
  function csrTeamCount(setup){const clubs=csrModules.catalog?.catalog?.[setup?.leagueId];if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)csrFail("COMPLETED_SETUP_INVALID");return clubs.length;}
  function csrAssertPublicResults(value,rivalryId,seasonNumber){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r9"||value.phase!=="RESULTS_READY"||value.revision!==2)csrFail("COMPLETED_SEASON_INVALID");
    for(const key of ["publishedRoles","operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==2)csrFail("COMPLETED_SEASON_INVALID");}
    if(new Set(value.publishedRoles).size!==2||!ROLES.every(role=>value.publishedRoles.includes(role))||new Set(value.operationIds).size!==2||value.operationIds.some(id=>!RESULT_OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))csrFail("COMPLETED_SEASON_INVALID");
    return value;
  }
  function csrAssertRoleResult(value,rivalryId,seasonNumber,role,teamCount){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!RESULT_OPERATION.test(value.operationId||"")||!HASH.test(value.commandHash||""))csrFail("COMPLETED_SEASON_INVALID");
    return {...value,result:csrResult(value.result,teamCount)};
  }
  async function csrReadyState(publicResult,roleResults,teamCount,cryptoImpl){
    const receipts=publicResult.actorRoles.map((role,index)=>{const own=roleResults[role];if(!own||own.operationId!==publicResult.operationIds[index]||publicResult.publishedRoles[index]!==role)csrFail("COMPLETED_SEASON_INVALID");return {operationId:publicResult.operationIds[index],baseRevision:publicResult.baseRevisions[index],actorRole:role,type:"publish-result",commandHash:own.commandHash};});
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r9",seasonNumber:publicResult.seasonNumber,phase:"RESULTS_READY",revision:2,publishedRoles:[...publicResult.publishedRoles],results:{playerOne:csrResult(roleResults.playerOne.result,teamCount),playerTwo:csrResult(roleResults.playerTwo.result,teamCount)},receipts};
    const state={...core,contentHash:await csrDigest(csrSortedCanonical(core),cryptoImpl)};
    if(!csrModules.results||typeof csrModules.results.createProtocol!=="function")csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.results.createProtocol({teamCount,cryptoImpl});
    try{await protocol.verifyState(state);}catch(_error){csrFail("COMPLETED_SEASON_INVALID");}
    return state;
  }
  async function csrAcknowledgedCommit(value,ready,teamCount,cryptoImpl){
    csrExact(value,COMMIT_KEYS,"COMPLETED_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.runtimeRevision!=="1.9.1-r10"||value.seasonNumber!==ready.seasonNumber||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2)csrFail("COMPLETED_SEASON_INVALID");
    csrExact(value.results,ROLES,"COMPLETED_SEASON_INVALID");for(const role of ROLES)csrResult(value.results[role],teamCount);
    if(JSON.stringify(value.results)!==JSON.stringify(ready.results))csrFail("COMPLETED_SEASON_INVALID");
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==3)csrFail("COMPLETED_SEASON_INVALID");}
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2)csrFail("COMPLETED_SEASON_INVALID");
    const receipts=value.operationIds.map((operationId,index)=>({operationId,baseRevision:value.baseRevisions[index],actorRole:value.actorRoles[index],type:index===0?"commit-season":"acknowledge-season",commandHash:value.operationHashes[index]}));
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r10",seasonNumber:value.seasonNumber,phase:value.phase,revision:value.revision,resultsRevision:2,resultsContentHash:ready.contentHash,results:csrClone(value.results),acknowledgedRoles:[...value.acknowledgedRoles],receipts};
    const state={...core,contentHash:await csrDigest(csrSortedCanonical(core),cryptoImpl)};
    if(!csrModules.commit||typeof csrModules.commit.createProtocol!=="function")csrFail("COMPLETED_PROTOCOL_UNAVAILABLE");
    const protocol=await csrModules.commit.createProtocol({teamCount,cryptoImpl,seasonResultsModule:csrModules.results});
    try{await protocol.verifyState(state);}catch(_error){csrFail("COMPLETED_SEASON_INVALID");}
    return state;
  }

  async function csrRead(options={}){
    let rivalryId=null,managerRole=null;
    try{
      const sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")csrFail("COMPLETED_PROVIDER_UNAVAILABLE");
      const uid=options.user&&typeof options.user.uid==="string"?options.user.uid.trim():"";if(!uid)csrFail("COMPLETED_AUTH_REQUIRED");
      rivalryId=String(options.rivalryId||"").trim().toLowerCase();if(!RIVALRY_ID.test(rivalryId)){rivalryId=null;csrFail("COMPLETED_RIVALRY_INVALID");}
      const value=await csrGet(sdk,db,["rivalries",rivalryId]);if(!value)csrFail("COMPLETED_RIVALRY_MISSING");
      const rivalry=await csrVerifyRivalry(value,rivalryId,uid,cryptoImpl);managerRole=rivalry.managerRole;
      const state=value.data.connectionState;
      if(state==="pending-pair"||state==="active")return csrState("not-closed",{rivalryId,managerRole});
      if(state!=="closed")csrFail("COMPLETED_RIVALRY_INVALID");
      // Abandoned (closed without a Terminal Close witness): status only, nothing else is read or counted.
      if(!Object.hasOwn(value.data,"terminalClose"))return csrState("abandoned",{rivalryId,managerRole});
      const intent=csrVerifyWitness(value.data,rivalryId),total=intent.totalSeasons;
      const ledger=csrAssertLedger(await csrGet(sdk,db,["rivalries",rivalryId,"sharedSetup","authoritative"]),rivalryId,total);
      const setup=await csrRebuildSetup(ledger,rivalry,rivalryId,cryptoImpl),teamCount=csrTeamCount(setup);
      const scoringProtocol=await csrModules.scoring.createProtocol({teamCount,cryptoImpl,seasonCommitModule:csrModules.commit});
      const seasons=[];
      for(let seasonNumber=1;seasonNumber<=total;seasonNumber+=1){
        const seasonId=`season_${seasonNumber}`;
        const publicValue=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId]);
        const p1=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId,"roles","playerOne"]);
        const p2=await csrGet(sdk,db,["rivalries",rivalryId,"seasonResults",seasonId,"roles","playerTwo"]);
        const stored=await csrGet(sdk,db,["rivalries",rivalryId,"seasonCommits",seasonId]);
        // A gap is never a shorter history: any missing season makes the whole Showdown unavailable.
        if(!publicValue||!p1||!p2||!stored)csrFail("COMPLETED_SEASON_MISSING");
        const ready=await csrReadyState(csrAssertPublicResults(publicValue,rivalryId,seasonNumber),{playerOne:csrAssertRoleResult(p1,rivalryId,seasonNumber,"playerOne",teamCount),playerTwo:csrAssertRoleResult(p2,rivalryId,seasonNumber,"playerTwo",teamCount)},teamCount,cryptoImpl);
        const commit=await csrAcknowledgedCommit(stored,ready,teamCount,cryptoImpl);
        const scored=scoringProtocol.scoreAuthoritativeResults(commit.results);
        seasons.push({
          commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,results:csrClone(commit.results),rivalryId},
          scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,scoring:csrClone(scored.scoring),winner:scored.winner,rivalryId}
        });
      }
      const projection=csrModules.history.buildProjection({rivalryId,setup:{...setup,rivalryId},managerSlots:rivalry.slots,seasons});
      csrModules.history.verifyProjection(projection);
      const a=projection.managerRecords.playerOne.totalPoints,b=projection.managerRecords.playerTwo.totalPoints,winner=a>b?"playerOne":b>a?"playerTwo":"draw";
      // Full coverage and both reconstructed totals must equal the Terminal Close witness; totals-only final winner.
      if(projection.acceptedSeasons!==total||projection.totalSeasons!==total||a!==intent.managerTotals.playerOne||b!==intent.managerTotals.playerTwo||winner!==intent.winner)csrFail("COMPLETED_TOTALS_MISMATCH");
      return csrState("completed",{rivalryId,managerRole,terminalWitness:csrClone(intent),projection,final:{totals:{playerOne:a,playerTwo:b},winner,margin:Math.abs(a-b),seasonsPlayed:total}});
    }catch(error){
      return csrState("unavailable",{rivalryId,managerRole,code:error&&typeof error.code==="string"&&error.code?error.code:"COMPLETED_READ_FAILED"});
    }
  }

  return Object.freeze({contractVersion:1,feature:"cms-completed-showdown-reader",statuses:STATUSES,readCompletedShowdown:csrRead,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false,sourceAuthorityPaths:Object.freeze(["rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/seasonResults/season_{N}","rivalries/{rivalryId}/seasonResults/season_{N}/roles/{playerOne|playerTwo}","rivalries/{rivalryId}/seasonCommits/season_{N}"])});
});
````

### Appendix C. New emulator test: `tests/firebase/completed-showdown-read-emulator.cjs` (full file; ids in §6.2)

````js
"use strict";
// JOB-08 completed-only read grant + session-free reader, against the COMPOSED production Rules
// (firestore.spark.generated.rules built by BOTH scripts). One `ok <n> <id> <label>` line per check.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const HistoryProtocol=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
// Loaded only for section P, so sections I0-F report on the Rules before the client exists (tests-first).
const loadReader=()=>require("../../js/sparkCompletedShowdownReader.js");

const PROJECT_ID="demo-cms-completed-read";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_daniel",B="acct_nik",C="acct_stranger",D="acct_inactive";
const X=`pair_${"a".repeat(64)}`,Y=`pair_${"b".repeat(64)}`,Z=`pair_${"c".repeat(64)}`;
const SX=`session_${"a".repeat(64)}`,SY=`session_${"b".repeat(64)}`,SZ=`session_${"c".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`,DD=`device_${"d".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`,PD=`profile_${"5".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`,SD=`save_${"6".repeat(24)}`;
const forgedId=n=>`pair_${"e".repeat(62)}${String(n).padStart(2,"0")}`;

let checks=0;
async function check(id,label,fn){await fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function readerSdk(counter){return {doc,getDoc:(...args)=>{if(counter)counter.reads+=1;return getDoc(...args);}};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid,status="active"){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status,createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function pairLink(uid,id,role,managerId,deviceId){const now=Timestamp.fromMillis(Date.now()-80000),data={rivalryId:id,managerRole:role,managerId,linkedAt:now,lastConfirmedAt:now};return envelope("pairLink","current",0,data,{accountId:uid,deviceId,updatedAt:now});}
async function session(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,rivalryId,sessionId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
const RESULT={playerOne:{leaguePosition:1,leaguePoints:102,leagueGoals:89,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false},playerTwo:{leaguePosition:3,leaguePoints:88,leagueGoals:85,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}};

async function seed(env,now){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();
  for(const [uid,id,seedChar,status] of [[A,DA,"a","active"],[B,DB,"b","active"],[C,DC,"c","active"],[D,DD,"d","deletion-requested"]]){await setDoc(doc(db,"accounts",uid),await account(uid,status));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seedChar));}
  for(const [id,sid] of [[X,SX],[Y,SY],[Z,SZ]]){await setDoc(doc(db,"rivalries",id),await rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",sid),await session(id,sid,now));}
  await setDoc(doc(db,"accounts",A,"pairLinks","current"),await pairLink(A,Y,"playerOne","daniel",DA));
});}

// One-season Showdown through the real providers, up to Daniel publishing his season result (COLLECTING).
async function playToCollecting(env,rivalryId,sessionId,nowMs){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t);
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:1}]]){const v=await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra});assert.equal(v.ok,true,JSON.stringify(v));}
  let v=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"SHOWDOWN_CONFIRMED");
  v=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.startWindow({...a(100),seasonNumber:1,operationId:op("transfer_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.requestEndWindow({...a(110),seasonNumber:1,operationId:op("transfer_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.requestEndWindow({...b(120),seasonNumber:1,operationId:op("transfer_op_",3),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockGuesses({...a(130),seasonNumber:1,operationId:op("transfer_op_",4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockGuesses({...b(140),seasonNumber:1,operationId:op("transfer_op_",5),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockSignings({...a(150),seasonNumber:1,operationId:op("transfer_op_",6),baseRevision:5,signings:[{slot:1,name:"Daniel signing",leagueId:"spain-primera-division",nationalityId:"england"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockSignings({...b(160),seasonNumber:1,operationId:op("transfer_op_",7),baseRevision:6,signings:[{slot:1,name:"Nik signing",leagueId:"england-premier-league",nationalityId:"brazil"}]});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"COMPLETED");
  v=await Results.publishResult({...a(200),seasonNumber:1,operationId:op("season_result_op_",1),baseRevision:0,result:RESULT.playerOne});assert.equal(v.ok,true,JSON.stringify(v));
  return {dbA,dbB,a,b};
}
async function finishAndClose(game,sessionId){
  const {a,b}=game;
  let v=await Results.publishResult({...b(210),seasonNumber:1,operationId:op("season_result_op_",2),baseRevision:1,result:RESULT.playerTwo});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"RESULTS_READY");
  v=await Commit.commitSeason({...a(220),seasonNumber:1,operationId:op("season_commit_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...b(230),seasonNumber:1,operationId:op("season_commit_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...a(240),seasonNumber:1,operationId:op("season_commit_op_",3),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.phase,"ACKNOWLEDGED");
  const history=await History.read({...a(250),throughSeason:1});assert.equal(history.ok,true,JSON.stringify(history));
  const multi=await Multi.read(a(260));
  const final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
  const closed=await TerminalProvider.close({...a(300),intent:Terminal.prepare(final,{sessionId})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");
  return {sessionHistory:history.projection};
}
async function abandonAsDaniel(db,rivalryId){
  const before=(await getDoc(doc(db,"rivalries",rivalryId))).data();
  const data={...before.data,connectionState:"closed"};
  const after=await envelope("rivalry",rivalryId,before.revision+1,data,{accountId:A,deviceId:DA,priorHash:before.contentHash});
  await assertSucceeds(setDoc(doc(db,"rivalries",rivalryId),after));
}
async function forge(env,id,mutate){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X))).data();
    const data=JSON.parse(JSON.stringify({...real.data,createdAt:null}));data.createdAt=real.data.createdAt;data.terminalClose.rivalryId=id;
    let lifecycleState="live";mutate(data,{setLifecycle:value=>{lifecycleState=value;}});
    const value=await envelope("rivalry",id,real.revision,data,{accountId:A,deviceId:DA,priorHash:real.priorContentHash});value.lifecycleState=lifecycleState;
    await setDoc(doc(db,"rivalries",id),value);
  });
}

async function run(env){
  const now=Date.now();
  await seed(env,now);
  const anon=env.unauthenticatedContext().firestore();
  const dbC=env.authenticatedContext(C).firestore();

  // Showdown X: completed with a real Terminal Close. Showdown Y: abandoned mid-season. Showdown Z: active, season COLLECTING.
  const gameX=await playToCollecting(env,X,SX,now);const {sessionHistory}=await finishAndClose(gameX,SX);
  const gameY=await playToCollecting(env,Y,SY,now+1000);await abandonAsDaniel(gameY.dbA,Y);
  await playToCollecting(env,Z,SZ,now+2000);
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();

  await check("I0","composed Rules carry the completed-only grant on exactly setup, season results, result roles and season commits",async()=>{
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedShowdownReadable\(rivalryId\);/g)||[]).length,1);
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, seasonId\);/g)||[]).length,2);
    assert.match(RULES,/allow get: if ssjrResultsPrivateReadable\(rivalryId, seasonId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedSeasonReadable\(rivalryId, seasonId\)\);/);
    assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(RULES),false);
    for(const marker of ["match /accounts/{accountId}/pairLinks/{pairId}","match /accounts/{accountId}/careerIndex/{indexId}","function ssjrTerminalValidIntent(rivalryId, intent)"])assert.ok(RULES.includes(marker),marker);
  });

  // A. Completed Showdown X: both managers read the final, already-shared results without a session.
  await check("A1","Daniel reads X setup with no live session (X session is closed)",async()=>{
    let sessionState;await env.withSecurityRulesDisabled(async context=>{sessionState=(await getDoc(doc(context.firestore(),"rivalries",X,"sessions",SX))).data().data.state;});
    assert.equal(sessionState,"closed");
    const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative")));assert.equal(snap.data().phase,"SHOWDOWN_CONFIRMED");
  });
  await check("A2","Nik reads X setup",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"sharedSetup","authoritative")));});
  await check("A3","Daniel reads X season_1 commit",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1")));assert.equal(snap.data().phase,"ACKNOWLEDGED");});
  await check("A4","Nik reads X season_1 commit",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonCommits","season_1")));});
  await check("A5","Nik reads X season_1 public results",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonResults","season_1")));});
  await check("A6","Daniel reads Nik's final season_1 result (shared at RESULTS_READY)",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_1","roles","playerTwo")));});
  await check("A7","Nik reads Daniel's final season_1 result",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonResults","season_1","roles","playerOne")));});

  // B. Still denied on the completed Showdown.
  await check("B1","stranger cannot read X setup",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"sharedSetup","authoritative")));});
  await check("B2","stranger cannot read X season_1 commit",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"seasonCommits","season_1")));});
  await check("B3","stranger cannot read X result roles",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"seasonResults","season_1","roles","playerOne")));});
  await check("B4","unauthenticated read of X setup is denied",async()=>{await assertFails(getDoc(doc(anon,"rivalries",X,"sharedSetup","authoritative")));});
  await check("B5","season_2 of a 1-season Showdown is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_2")));});
  await check("B6","malformed season id season_01 is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_01")));});
  await check("B7","listing X season commits is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"seasonCommits")));});
  await check("B8","X transfer challenge stays outside the grant (G-10)",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1")));});
  await check("B9","X transfer roles stay outside the grant (G-10)",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",X,"transferChallenges","season_1","roles","playerOne")));});
  await check("B10","X career start stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"careerStart","authoritative")));});
  await check("B11","X league projection stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"sharedSetup","leagueProjection")));});
  await check("B12","unknown role id playerThree is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_1","roles","playerThree")));});

  // C. Closed writes stay denied.
  let stored;await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();stored={setup:(await getDoc(doc(db,"rivalries",X,"sharedSetup","authoritative"))).data(),commit:(await getDoc(doc(db,"rivalries",X,"seasonCommits","season_1"))).data(),role:(await getDoc(doc(db,"rivalries",X,"seasonResults","season_1","roles","playerTwo"))).data()};});
  await check("C1","Daniel cannot rewrite X setup",async()=>{await assertFails(setDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative"),{...stored.setup,revision:7}));});
  await check("C2","Nik cannot create X season_2 commit",async()=>{await assertFails(setDoc(doc(dbB,"rivalries",X,"seasonCommits","season_2"),{...stored.commit,seasonNumber:2}));});
  await check("C3","Daniel cannot update X season_1 commit",async()=>{await assertFails(setDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1"),{...stored.commit}));});
  await check("C4","Daniel cannot delete X setup",async()=>{await assertFails(deleteDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative")));});
  await check("C5","Nik cannot rewrite his X result role",async()=>{await assertFails(setDoc(doc(dbB,"rivalries",X,"seasonResults","season_1","roles","playerTwo"),{...stored.role}));});

  // D. Abandoned Showdown Y (closed without Terminal Close): nothing below the root is readable.
  await check("D1","Daniel cannot read abandoned Y setup",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"sharedSetup","authoritative")));});
  await check("D2","Nik cannot read abandoned Y season results",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Y,"seasonResults","season_1")));});
  await check("D3","Nik cannot read Daniel's unfinished Y result",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Y,"seasonResults","season_1","roles","playerOne")));});
  await check("D4","Daniel cannot read his own Y result after abandon",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"seasonResults","season_1","roles","playerOne")));});
  await check("D5","Daniel still reads the Y root (History status row)",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",Y)));assert.equal(snap.data().data.connectionState,"closed");assert.equal(Object.hasOwn(snap.data().data,"terminalClose"),false);});
  await check("D6","Daniel cannot read Nik's Y transfer role",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"transferChallenges","season_1","roles","playerTwo")));});

  // E. Forged or partial terminal witnesses (roots seeded with Rules disabled; children absent, so an allowed get returns not-found).
  await forge(env,forgedId(0),()=>{});
  await forge(env,forgedId(1),data=>{delete data.terminalClose;});
  await forge(env,forgedId(2),data=>{data.terminalClose.winner=data.terminalClose.winner==="playerOne"?"playerTwo":"playerOne";});
  await forge(env,forgedId(3),data=>{data.terminalProgress.closedSessionRevision=null;});
  await forge(env,forgedId(4),data=>{for(const t of [data.terminalClose,data.terminalProgress])t.totalSeasons=3;data.terminalClose.completedSeason=3;data.terminalProgress.acceptedThroughSeason=1;});
  await forge(env,forgedId(5),data=>{data.terminalProgress.managerTotals={...data.terminalProgress.managerTotals,playerTwo:data.terminalProgress.managerTotals.playerTwo+1};});
  await forge(env,forgedId(6),data=>{data.terminalClose.rivalryId=X;});
  await forge(env,forgedId(7),data=>{data.terminalClose.extra=true;});
  await forge(env,forgedId(8),(data,tools)=>{tools.setLifecycle("tombstoned");});
  await forge(env,forgedId(9),data=>{data.authorizedAccountIds=[A,D];data.managerSlots=[data.managerSlots[0],{...data.managerSlots[1],accountId:D,profileId:PD,saveId:SD}];});
  await forge(env,forgedId(10),data=>{delete data.terminalProgress;});
  const setupOf=(db,id)=>getDoc(doc(db,"rivalries",id,"sharedSetup","authoritative"));
  const dbD=env.authenticatedContext(D).firestore();
  await check("E0","control: a correctly witnessed forged copy is readable (grant keys on the witness, not on the id)",async()=>{await assertSucceeds(setupOf(dbA,forgedId(0)));});
  await check("E1","closed with terminalProgress but no terminalClose is denied",async()=>{await assertFails(setupOf(dbA,forgedId(1)));});
  await check("E2","witness whose winner contradicts its totals is denied",async()=>{await assertFails(setupOf(dbA,forgedId(2)));});
  await check("E3","witness without a closed session revision is denied",async()=>{await assertFails(setupOf(dbA,forgedId(3)));});
  await check("E4","witness with fewer accepted seasons than configured is denied",async()=>{await assertFails(setupOf(dbA,forgedId(4)));});
  await check("E5","intent totals that differ from progress totals are denied",async()=>{await assertFails(setupOf(dbA,forgedId(5)));});
  await check("E6","witness naming another rivalry is denied",async()=>{await assertFails(setupOf(dbA,forgedId(6)));});
  await check("E7","witness with an extra key is denied",async()=>{await assertFails(setupOf(dbA,forgedId(7)));});
  await check("E8","tombstoned root is denied",async()=>{await assertFails(setupOf(dbA,forgedId(8)));});
  await check("E9","member whose account is not active is denied",async()=>{await assertFails(setupOf(dbD,forgedId(9)));});
  await check("E10","closed with terminalClose but no terminalProgress is denied",async()=>{await assertFails(setupOf(dbA,forgedId(10)));});

  // F. Active Showdown Z regressions: the existing session-free active reads and privacy are unchanged.
  await check("F1","Daniel reads active Z setup (existing rule)",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",Z,"sharedSetup","authoritative")));});
  await check("F2","Nik cannot read Daniel's COLLECTING Z result",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Z,"seasonResults","season_1","roles","playerOne")));});
  await check("F3","Daniel reads his own COLLECTING Z result",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",Z,"seasonResults","season_1","roles","playerOne")));});
  await check("F4","stranger cannot read active Z setup",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",Z,"sharedSetup","authoritative")));});

  // P. Session-free provider reader.
  const Reader=loadReader();
  const read=(db,uid,id,counter)=>Reader.readCompletedShowdown({firestore:db,firebaseSdk:readerSdk(counter),user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
  let danielX;
  await check("P1","Daniel's reader: X completed, totals equal the Terminal Close witness, one season",async()=>{
    danielX=await read(dbA,A,X);
    assert.equal(danielX.status,"completed",JSON.stringify(danielX));assert.equal(danielX.code,null);assert.equal(danielX.managerRole,"playerOne");
    assert.equal(Object.isFrozen(danielX),true);HistoryProtocol.verifyProjection(danielX.projection);
    assert.deepEqual(danielX.final.totals,danielX.terminalWitness.managerTotals);assert.equal(danielX.final.winner,danielX.terminalWitness.winner);assert.equal(danielX.final.seasonsPlayed,1);
    assert.deepEqual(danielX.final,{totals:{playerOne:5,playerTwo:0},winner:"playerOne",margin:5,seasonsPlayed:1});
  });
  await check("P2","Nik's reader returns the identical projection and final result",async()=>{const nikX=await read(dbB,B,X);assert.equal(nikX.status,"completed");assert.equal(nikX.managerRole,"playerTwo");assert.deepEqual(nikX.projection,danielX.projection);assert.deepEqual(nikX.final,danielX.final);});
  await check("P3","fresh authenticated client, no session or device input: same projection",async()=>{const fresh=env.authenticatedContext(A).firestore();const again=await read(fresh,A,X);assert.equal(again.status,"completed");assert.deepEqual(again.projection,danielX.projection);});
  await check("P4","session-free projection equals the session-bound history projection taken before close",async()=>{assert.deepEqual(danielX.projection,sessionHistory);});
  await check("P5","abandoned Y: status only, exactly one read (the root)",async()=>{const counter={reads:0};const y=await read(dbB,B,Y,counter);assert.equal(y.status,"abandoned");assert.equal(y.projection,null);assert.equal(y.final,null);assert.equal(counter.reads,1);});
  await check("P6","active Z: not-closed, exactly one read",async()=>{const counter={reads:0};const z=await read(dbA,A,Z,counter);assert.equal(z.status,"not-closed");assert.equal(counter.reads,1);});
  await check("P7","stranger: unavailable with the Firestore denial code, never empty",async()=>{const s=await read(dbC,C,X);assert.equal(s.status,"unavailable");assert.equal(s.code,"permission-denied");assert.equal(s.projection,null);});
  await check("P8","forged winner witness: unavailable before any child read",async()=>{const counter={reads:0};const f=await read(dbA,A,forgedId(2),counter);assert.equal(f.status,"unavailable");assert.equal(f.code,"COMPLETED_TERMINAL_WITNESS_INVALID");assert.equal(counter.reads,1);});
  await check("P9","witness totals that disagree with the rebuilt seasons: unavailable",async()=>{
    await env.withSecurityRulesDisabled(async context=>{const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X))).data();const data={...real.data,terminalClose:{...real.data.terminalClose,managerTotals:{playerOne:6,playerTwo:0}},terminalProgress:{...real.data.terminalProgress,managerTotals:{playerOne:6,playerTwo:0}}};await setDoc(doc(db,"rivalries",X),{...real,data,contentHash:await digest({objectType:"rivalry",objectId:X,revision:real.revision,data})});});
    await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1")));
    const t=await read(dbA,A,X);assert.equal(t.status,"unavailable");assert.equal(t.code,"COMPLETED_TOTALS_MISMATCH");
  });
  await check("P10","a missing season commit makes the Showdown unavailable, never shorter",async()=>{
    await env.withSecurityRulesDisabled(async context=>{await deleteDoc(doc(context.firestore(),"rivalries",X,"seasonCommits","season_1"));});
    const m=await read(dbB,B,X);assert.equal(m.status,"unavailable");assert.equal(m.code,"COMPLETED_SEASON_MISSING");assert.equal(m.projection,null);
  });
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();await run(env);assert.equal(checks,56);process.stdout.write(`PASS completed-only read emulator: ${checks} numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, F active regressions, P session-free reader).\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});
````

### Appendix D. New contract test: `tests/contracts/completed-showdown-read-contracts.cjs` (full file; K ids in §6.1 map to its numbered blocks)

````js
'use strict';
// JOB-08 completed-only read grant + session-free reader contracts. Plain node:assert, no Firebase, no emulator.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Reader=require(path.join(root,'js/sparkCompletedShowdownReader.js'));

const A='acct_daniel',B='acct_nik',C='acct_stranger';
const RID=`pair_${'a'.repeat(64)}`;
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==='function')return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function sha(value){return 'sha256:'+crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function rivalryDoc(data,{id=RID,revision=4}={}){return {schemaVersion:1,objectType:'rivalry',objectId:id,revision,parentRevision:revision-1,lifecycleState:'live',contentHash:sha({objectType:'rivalry',objectId:id,revision,data}),priorContentHash:`sha256:${'0'.repeat(64)}`,updatedAt:{toMillis:()=>1},updatedByAccountId:A,updatedByDeviceId:`device_${'a'.repeat(32)}`,data,tombstone:null};}
const slots=[{slotId:'playerOne',accountId:A,profileId:`profile_${'1'.repeat(24)}`,saveId:`save_${'3'.repeat(24)}`,displayLabel:'Daniel',entitlementState:'active',deletionConsent:false},{slotId:'playerTwo',accountId:B,profileId:`profile_${'2'.repeat(24)}`,saveId:`save_${'4'.repeat(24)}`,displayLabel:'Nik',entitlementState:'active',deletionConsent:false}];
const baseData=state=>({connectionState:state,connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:{toMillis:()=>1}});
const intent=(over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',phase:'TERMINAL_CLOSE_READY',rivalryId:RID,sessionId:`session_${'a'.repeat(64)}`,totalSeasons:1,completedSeason:1,managerTotals:{playerOne:5,playerTwo:0},winner:'playerOne',terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:'closed',sessionTargetState:'closed',terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false,...over});
const progress=(over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons:1,acceptedThroughSeason:1,managerTotals:{playerOne:5,playerTwo:0},closedSessionRevision:3,...over});

function fakeSdk(docs,{deny=new Set()}={}){
  const log=[];
  return {log,sdk:{
    doc:(_db,...parts)=>({path:parts.join('/')}),
    getDoc:async ref=>{log.push(ref.path);if(deny.has(ref.path)){const e=new Error('denied');e.code='permission-denied';throw e;}const value=docs[ref.path];return {exists:()=>value!==undefined,data:()=>value};}
  }};
}
const readWith=(docs,opts={},uid=A)=>{const f=fakeSdk(docs,opts);return Reader.readCompletedShowdown({firestore:{},firebaseSdk:f.sdk,user:{uid},rivalryId:RID,cryptoImpl:crypto.webcrypto}).then(r=>({r,log:f.log}));};

(async()=>{
  // K1. API surface and safety flags
  assert.equal(typeof Reader.readCompletedShowdown,'function');
  assert.deepEqual([...Reader.statuses],['completed','abandoned','not-closed','unavailable']);
  for(const [k,v] of Object.entries({sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false}))assert.equal(Reader[k],v,k);
  assert.equal(Object.isFrozen(Reader),true);

  // K2. Reader source: exact gets only; no session, transaction, list, write or browser storage
  const src=read('js/sparkCompletedShowdownReader.js');
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/listDocuments/,/setDoc|updateDoc|deleteDoc|\.set\(|\.update\(|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/onSnapshot/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/sdk\.getDoc\(sdk\.doc\(/);

  // K3. Never throws; bad input is unavailable, frozen, with a code
  for(const bad of [undefined,{},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},user:{uid:A},rivalryId:'nope'},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},rivalryId:RID}]){
    const r=await Reader.readCompletedShowdown(bad);assert.equal(r.status,'unavailable');assert.ok(r.code);assert.equal(r.projection,null);assert.equal(Object.isFrozen(r),true);
  }

  // K4. Classification from the root alone, without reading anything below it
  const path0=`rivalries/${RID}`;
  for(const state of ['active','pending-pair']){const {r,log}=await readWith({[path0]:rivalryDoc(baseData(state))});assert.equal(r.status,'not-closed',state);assert.deepEqual(log,[path0]);assert.equal(r.managerRole,'playerOne');}
  {const {r,log}=await readWith({[path0]:rivalryDoc({...baseData('closed')})},{},B);assert.equal(r.status,'abandoned');assert.equal(r.managerRole,'playerTwo');assert.deepEqual(log,[path0],'abandoned reads nothing below the root');assert.equal(r.final,null);}
  {const {r}=await readWith({[path0]:rivalryDoc({...baseData('closed'),terminalProgress:progress({closedSessionRevision:null})})});assert.equal(r.status,'abandoned','closed without terminalClose is abandoned even with staged progress');}

  // K5. Terminal witness checks happen before any child read
  const witnessCases=[
    ['winner contradicts totals',{terminalClose:intent({winner:'draw'}),terminalProgress:progress()}],
    ['no closed session revision',{terminalClose:intent(),terminalProgress:progress({closedSessionRevision:null})}],
    ['accepted < total',{terminalClose:intent({totalSeasons:3,completedSeason:3}),terminalProgress:progress({totalSeasons:3,acceptedThroughSeason:2})}],
    ['totals differ',{terminalClose:intent(),terminalProgress:progress({managerTotals:{playerOne:4,playerTwo:0}})}],
    ['other rivalry',{terminalClose:intent({rivalryId:`pair_${'b'.repeat(64)}`}),terminalProgress:progress()}],
    ['extra progress key',{terminalClose:intent(),terminalProgress:{...progress(),extra:1}}],
    ['missing progress',{terminalClose:intent()}]
  ];
  for(const [label,extra] of witnessCases){const {r,log}=await readWith({[path0]:rivalryDoc({...baseData('closed'),...extra})});assert.equal(r.status,'unavailable',label);assert.equal(r.code,'COMPLETED_TERMINAL_WITNESS_INVALID',label);assert.deepEqual(log,[path0],label);}

  // K6. Integrity, membership and read failures are unavailable, never empty
  {const value=rivalryDoc(baseData('closed'));value.data={...value.data,connectionState:'active'};const {r}=await readWith({[path0]:value});assert.equal(r.code,'COMPLETED_RIVALRY_INTEGRITY_FAILED');}
  {const {r}=await readWith({[path0]:rivalryDoc(baseData('closed'))},{},C);assert.equal(r.code,'COMPLETED_NOT_A_MANAGER');}
  {const {r}=await readWith({});assert.equal(r.code,'COMPLETED_RIVALRY_MISSING');}
  {const {r}=await readWith({},{deny:new Set([path0])});assert.equal(r.status,'unavailable');assert.equal(r.code,'permission-denied');}
  {const docs={[path0]:rivalryDoc({...baseData('closed'),terminalClose:intent(),terminalProgress:progress()})};const {r,log}=await readWith(docs);assert.equal(r.code,'COMPLETED_SETUP_INVALID','missing setup ledger');assert.deepEqual(log,[path0,`${path0}/sharedSetup/authoritative`]);}
  {const docs={[path0]:rivalryDoc({...baseData('closed'),terminalClose:intent(),terminalProgress:progress()})};const {r}=await readWith(docs,{deny:new Set([`${path0}/sharedSetup/authoritative`])});assert.equal(r.code,'permission-denied','old Rules: honest unavailable');}

  // K7. Rules text: get-only grant on exactly four seams, witness-keyed, no billing words
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  const grant=fragment.slice(fragment.indexOf('function cmsCompletedShowdownReadable'),fragment.indexOf('// CMS_PERSISTENT_PAIR_FUNCTIONS_END'));
  for(const needle of ["data.connectionState == 'closed'","'terminalClose' in data",'ssjrTerminalValidIntent(rivalryId, data.terminalClose)','ssjrTerminalProgressShape(progress)','progress.acceptedThroughSeason == progress.totalSeasons','progress.closedSessionRevision is int','data.terminalClose.managerTotals == progress.managerTotals','request.auth.uid in data.authorizedAccountIds','activeAccount(request.auth.uid)',"[0:total]"])assert.ok(grant.includes(needle),needle);
  assert.doesNotMatch(grant,/getAfter|request\.resource/,'read grant never inspects a write');
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  const inject=read('scripts/inject-persistent-pair-rules.mjs');
  for(const label of ['completed Showdown setup read','completed Showdown season results read','completed Showdown season result role read','completed Showdown season commit read'])assert.ok(inject.includes(label),label);

  // K8. Composed artifact: both builds pass; grant appears on exactly setup, results, roles and commits, never on a write rule
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  const getLines=generated.split('\n').filter(line=>/cmsCompleted(Showdown|Season)Readable\(rivalryId/.test(line)&&!/function /.test(line));
  assert.equal(getLines.length,5,'setup, results, roles, commits + the season helper call');
  assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false);
  for(const [match,granted] of [['match /sharedSetup/authoritative',true],['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /transferChallenges/{transferId}',false],['match /seasonResults/{seasonId}',true],['match /seasonCommits/{seasonId}',true],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false]]){
    const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));
    assert.equal(/cmsCompleted/.test(getLine),granted,match);
  }
  const transferRoles=generated.slice(generated.indexOf('match /transferChallenges/{transferId}'));assert.doesNotMatch(transferRoles.slice(0,transferRoles.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END')),/cmsCompleted/,'transfer roles stay with G-10');
  console.log('PASS completed-only read contracts: reader API, exact-get source, classification, witness checks, unavailable states, Rules text, composed artifact.');
})().catch(e=>{console.error(e);process.exit(1);});
````

### Appendix E. Registry, ops test and CI step

Registry patterns are JSON strings compiled with `new RegExp`: a literal dot is `\\.` in the JSON source (one escaped backslash), never `\\\\.`.

````diff
diff --git a/.github/workflows/validate-gameplay-fast.yml b/.github/workflows/validate-gameplay-fast.yml
index 94976bf..fa2ca59 100644
--- a/.github/workflows/validate-gameplay-fast.yml
+++ b/.github/workflows/validate-gameplay-fast.yml
@@ -70,3 +70,5 @@ jobs:
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-journey "CMS_SHOWDOWN_LENGTH=3 node tests/firebase/two-manager-journey-emulator.cjs"
       - name: Career index matrix
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-index "node tests/firebase/career-index-emulator.cjs && CMS_CAREER_INDEX_ENFORCED=1 node tests/firebase/career-index-emulator.cjs"
+      - name: Completed-only read matrix
+        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-completed-read "node tests/firebase/completed-showdown-read-emulator.cjs"
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 14f0d17..3323da0 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -532,6 +532,21 @@
         "^tests/contracts/career-index-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/completed-showdown-read-contracts.cjs",
+      "patterns": [
+        "^js/sparkCompletedShowdownReader\\.js$",
+        "^js/sharedTerminalClose\\.js$",
+        "^js/sharedHistoryConvergence\\.js$",
+        "^firestore\\.persistent-pair-production\\.fragment\\.rules$",
+        "^firestore\\.spark\\.rules$",
+        "^firestore\\.(shared-setup|season-results|season-commit|terminal-close)-production\\.fragment\\.rules$",
+        "^scripts/inject-persistent-pair-rules\\.mjs$",
+        "^scripts/build-production-firestore-rules(-with-persistent-pair)?\\.mjs$",
+        "^tests/contracts/completed-showdown-read-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 346eed4..353b654 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -69,10 +69,11 @@ const sharedActiveShowdownAdapterContract='tests/contracts/shared-active-showdow
 const startJoinViewModelContract='tests/contracts/start-join-view-model-contracts.cjs';
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
+const completedShowdownReadContract='tests/contracts/completed-showdown-read-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````

### Appendix F. Journey flip of KNOWN GAP 1: `tests/firebase/two-manager-journey-emulator.cjs` (against `889810f`)

````diff
diff --git a/tests/firebase/two-manager-journey-emulator.cjs b/tests/firebase/two-manager-journey-emulator.cjs
index 4b50e6d..2985d0a 100644
--- a/tests/firebase/two-manager-journey-emulator.cjs
+++ b/tests/firebase/two-manager-journey-emulator.cjs
@@ -24,6 +24,7 @@ const TerminalProvider=require("../../js/sparkTerminalClose.js");
 const Sessions=require("../../js/sparkPrivateSession.js");
 const Pairing=require("../../js/sparkPrivatePairing.js");
 const PersistentPair=require("../../js/persistentNikDanielPair.js");
+const CompletedReader=require("../../js/sparkCompletedShowdownReader.js");
 
 const PROJECT_ID="demo-cms-two-manager-journey";
 const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
@@ -160,6 +161,24 @@ async function assertCareerIndex(main,expected,label){
   }
 }
 
+async function assertCompletedShowdowns(env,expected,label,{indexed=null}={}){
+  const seen={};
+  for(const [who,uid] of [["Daniel",A],["Nik",B]]){
+    const db=env.authenticatedContext(uid).firestore();
+    let ids=Object.keys(expected);
+    if(indexed){const index=await PersistentPair.readCareerIndex({firestore:db,firebaseSdk:firestoreSdk,accountId:uid});assert.equal(index.status,"ready",`${label}: ${who} index`);assert.deepEqual(index.rivalryIds,indexed,`${label}: ${who} index ids`);ids=[...new Set([...index.rivalryIds,...ids])];}
+    for(const id of ids){
+      const result=await CompletedReader.readCompletedShowdown({firestore:db,firebaseSdk:firestoreSdk,user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
+      const want=expected[id];
+      assert.equal(result.status,want.status,`${label}: ${who} ${id.slice(0,9)} status ${JSON.stringify(result)}`);
+      if(want.status==="completed"){assert.deepEqual(result.final.totals,want.totals,`${label}: ${who} totals`);assert.equal(result.final.seasonsPlayed,want.seasonsPlayed);assert.equal(result.projection.seasonHistory.length,want.seasonsPlayed);}
+      else assert.equal(result.projection,null,`${label}: ${who} abandoned Showdown carries no seasons`);
+      if(seen[id])assert.deepEqual({projection:result.projection,final:result.final},seen[id],`${label}: both managers read the same ${id.slice(0,9)}`);
+      else seen[id]={projection:result.projection,final:result.final};
+    }
+  }
+}
+
 async function runSecondShowdownAndAbandon(env,main){
   const now2=Date.now();
   await pairFreshRivalry(env,{rivalryId:R2,sessionId:S2,nowMs:now2});
@@ -169,9 +188,10 @@ async function runSecondShowdownAndAbandon(env,main){
   await assertCareerIndex(main,[R2],"G-7 after Showdown 2 pairing (R1 predates the index: never backfilled)");
   assert.equal(pairB2.data.rivalryId,R2,"Nik current pair must also move to the new rivalry");
   for(const [who,db] of [["Daniel",main.dbA],["Nik",main.dbB]]){
-    await assertFails(getDoc(doc(db,"rivalries",R1,"sharedSetup","authoritative")),`KNOWN GAP 1 (fixed by G-8): ${who} cannot read Showdown 1 setup after close`);
-    await assertFails(getDoc(doc(db,"rivalries",R1,"seasonCommits","season_1")),`KNOWN GAP 1 (fixed by G-8): ${who} cannot read Showdown 1 season 1 after close`);
+    await assertSucceeds(getDoc(doc(db,"rivalries",R1,"sharedSetup","authoritative")),`G-8: ${who} reads closed Showdown 1 setup without a session`);
+    await assertSucceeds(getDoc(doc(db,"rivalries",R1,"seasonCommits","season_1")),`G-8: ${who} reads closed Showdown 1 season 1 without a session`);
   }
+  await assertCompletedShowdowns(env,{[R1]:{status:"completed",totals:main.finalA.managerTotals,seasonsPlayed:TOTAL_SEASONS}},"G-8 after Showdown 2 pairing");
   await playFreshSingleSeason(env,{rivalryId:R2,sessionId:S2,nowMs:now2+5000,closeAtEnd:true});
 
   const now3=Date.now();
@@ -193,6 +213,8 @@ async function runSecondShowdownAndAbandon(env,main){
   let storedCommit;
   await env.withSecurityRulesDisabled(async context=>{storedCommit=(await getDoc(doc(context.firestore(),"rivalries",R3,"seasonCommits","season_1"))).data();});
   await assertFails(setDoc(doc(fresh.dbA,"rivalries",R3,"seasonCommits","season_1"),storedCommit),"Further direct season writes must be denied after abandon");
+  // G-8: from fresh authenticated clients, the career index leads to R2 completed and R3 abandoned; closed R1 stays completed.
+  await assertCompletedShowdowns(env,{[R1]:{status:"completed",totals:main.finalA.managerTotals,seasonsPlayed:TOTAL_SEASONS},[R2]:{status:"completed",totals:{playerOne:5,playerTwo:0},seasonsPlayed:1},[R3]:{status:"abandoned"}},"G-8 after Showdown 3 abandon",{indexed:[R2,R3]});
 }
 
 async function playMainJourney(env){
@@ -270,4 +292,4 @@ async function playMainJourney(env){
   return {now,dbA,dbB,finalA};
 }
 
-(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();const main=await playMainJourney(env);await runSecondShowdownAndAbandon(env,main);process.stdout.write(`PASS two-manager journey Sections A-G (${TOTAL_SEASONS} season${TOTAL_SEASONS===1?"":"s"} main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown known gaps, and persistent-provider abandon all proved.\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});
+(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();const main=await playMainJourney(env);await runSecondShowdownAndAbandon(env,main);process.stdout.write(`PASS two-manager journey Sections A-G (${TOTAL_SEASONS} season${TOTAL_SEASONS===1?"":"s"} main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});
````
