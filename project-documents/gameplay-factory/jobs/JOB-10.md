# JOB-10 · Transfer history, completed only

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; every Firebase emulator run happens on GitHub CI, see §2) | JOB-08 merged into `gameplay/recovery-v1` (PR #326, merge `843e64e`) | 8 | `gameplay/job-10-transfer-history` | `gameplay/recovery-v1` | **yes** (you request it yourself in step 8) |

## 1. Goal

JOB-08 made a finished Showdown readable again: setup, season results and season commits of a Showdown closed by a verified Terminal Close. It deliberately left transfers out (its checks B8 and B9 say "stays outside the grant (G-10)"). So today, once a Showdown closes, nobody can see who signed whom or which signings were released, even though both managers saw all of it the moment each season's Transfer Challenge reached `COMPLETED`. DATA_CONTRACT_V1 §5 lists `transfers.status` + a per-season guess/signing summary as **A (G-10)**.

This job adds it:

1. **Rules: a completed-only transfer grant.** For a Showdown closed by a verified Terminal Close (JOB-08's `cmsCompletedSeasonReadable`), a manager may `get` `transferChallenges/season_k` (k = 1..N) and its two role documents. A role document additionally needs that season's challenge to be **publicly `COMPLETED`** with both guesses and both signings locked: the existing `COMPLETED` condition of `ssjrTransferPrivateReadable` is kept, never replaced by a blanket grant (Sol ruling S2C-005R2 §4). No write, no list, no delete changes. Nothing for abandoned Showdowns.
2. **Client: a separate, lazy, session-free reader.** New `js/sparkCompletedTransferHistoryReader.js` with one function, `readCompletedTransferHistory()`. Exact document gets only. It classifies one rivalry as `completed`, `abandoned`, `not-closed` or `unavailable`, and for `completed` returns `transfers` in DATA_CONTRACT_V1 §5 shape (`status` + `seasons[]` keyed `daniel` / `nik`), after checking every stored guess and signing against the hash the transfer provider wrote when it was locked.
3. **Proofs.** One new contract test, one new composed-Rules emulator test with 73 numbered checks, and JOB-08's two chartered transfer checks (contract K8, emulator B8/B9) flipped.

Plain words: after a Showdown is finished, both of you can see its full transfer history (every guess, every signing, which ones were released). Nothing about a rival's unfinished transfer ever leaks, and an abandoned Showdown shows no transfers at all.

This job does **not** wire the reader into any screen or into the G-9 career loader, does **not** change `js/sparkCompletedShowdownReader.js` (JOB-09 depends on its API), and does not deploy anything. The new module is not loaded by `index.html` (startup budget is ~37,493 of 37,500 gzip bytes), so there is no shell, service-worker or visual change. Scoring is untouched.

## 2. Branches and files

- The lead creates `gameplay/job-10-transfer-history` from `gameplay/recovery-v1` at or after `843e64e`. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `js/sparkCompletedShowdownReader.js` and `tests/firebase/completed-showdown-read-emulator.cjs` exist there; if not, reply `Job 10 waits for job 8.` and stop.
- **Lane and CI path.** Work mode has Java 17 and cannot run the Firestore emulator (needs Java 21) and cannot `git push` (smoke `CAPABILITIES_WORK.md`). So: run `npm ci`, `node --check`, `npm run test:contracts`, `npm run test:ops` and `node tests/contracts/completed-transfer-history-contracts.cjs` locally; save files through the connector (WORKER_HANDBOOK §7 Path A); and read every emulator result from the "Validate Gameplay Fast" run on your **exact head commit** (job `rules-emulator`; the log of the step named in each section is your test output). Add the CI step in **step 3**, so CI runs the new emulator test from the first save.

Create:

- `js/sparkCompletedTransferHistoryReader.js` (Appendix B)
- `tests/firebase/completed-transfer-history-emulator.cjs` (Appendix C)
- `tests/contracts/completed-transfer-history-contracts.cjs` (Appendix D)

Edit (and only these):

| File | Change |
| --- | --- |
| `firestore.persistent-pair-production.fragment.rules` | one new function before `// CMS_PERSISTENT_PAIR_FUNCTIONS_END` (Appendix A) |
| `scripts/inject-persistent-pair-rules.mjs` | two `replaceOnce` get-rule seams, four required strings, one exact-count check (Appendix A) |
| `tests/contracts/completed-showdown-read-contracts.cjs` | JOB-08 K8: the chartered G-10 flip, three lines (Appendix F) |
| `tests/firebase/completed-showdown-read-emulator.cjs` | JOB-08 B8 and B9: the chartered G-10 flip, two lines (Appendix F) |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended **last** in `tests` (Appendix E) |
| `tests/operations/pos20-control-plane.test.mjs` | one const after the last contract const, and the same name appended **last** to `expectedSupplementalContracts` (Appendix E) |
| `.github/workflows/validate-gameplay-fast.yml` | one step appended as the **last step of the `rules-emulator` job** (Appendix E). Not at the end of the file: JOB-16 adds a whole new job there |
| `project-documents/gameplay-factory/status/JOB-10.md` on `factory/gameplay-v1` | status file |

That is ten code files. `git diff --stat origin/gameplay/recovery-v1` (or the GitHub compare) must list exactly these ten.

**Registry and CI ordering with jobs in flight.** Jobs 9, 11, 16 and 18 also append one registry entry and one ops const; job 9 also appends a step at the end of `rules-emulator` (`Closed-Showdown adapter journey`) and job 16 adds a new CI job `browser-journey` at the end of the file. Order follows merge order: whoever merges later re-appends its own entry, const and CI step **last**, keeping every other entry. If one of them merges into `gameplay/recovery-v1` before you finish, update your branch from `gameplay/recovery-v1`, keep their lines, and put `completed-transfer-history-contracts` back as the last JSON entry, `completedTransferHistoryContract` back as the last array item, and `Completed transfer history matrix` back as the last step of `rules-emulator`. JSON regex patterns escape a dot as `\\.` in the file text (one backslash in the regex), never `\\\\.`.

**Guards you will meet (checked; all fine if you copy the appendices):**

- `tests/contracts/static-app-release-contracts.cjs`: no file in `js/` except `storage.js` and `diagnostics.js` may contain the word for browser local storage, even in a comment; every top-level-looking `function name(` must be unique across `js/`. The reader's helpers all start with `cth` (contract K2 checks this). Never rename them.
- `scripts/pos10-syntax.mjs` runs `node --check` on every `js/` file: script syntax only, no `import`/`export`.
- Startup budget (`tests/contracts/final-polish-presentation.cjs`, `static-app-release-contracts.cjs`): the new file is **not** referenced by `index.html`, so it costs 0 startup bytes. Do not touch `index.html` or `service-worker.js`.
- The reader reads the canonical transfer catalog from `window.FIFA17_TRANSFER_LEAGUES` / `window.FIFA17_TRANSFER_NATIONALITIES` at call time (set by `data/transferOptions.js`, the same source as `js/sparkSharedTransferChallenge.js`). Tests load `data/transferOptions.js` after `global.window=globalThis`.

Read first (on `gameplay/recovery-v1` at `843e64e`; line numbers are observations, re-check them):

1. `firestore.transfer-challenge-production.fragment.rules`: `ssjrTransferSeasonMatches` 6, `ssjrTransferPublicExactKeys` 37 (public challenge: role lists, operation hashes, timestamps, **no guess or signing content**), `ssjrTransferPrivateExactKeys` 238 (role document: `guesses`, `signings`, lock timestamps), `ssjrTransferPrivateReadable` 305 (own role, or the rival's only when the challenge is `COMPLETED`; both need `ssjrEntitled`, i.e. an active rivalry), `match /transferChallenges/{transferId}` 313, `match /roles/{managerRole}` 319. **Read only.**
2. `firestore.season-results-production.fragment.rules` `ssjrResultsTransfer` 14 and 43-58: a season result can only be published once that season's challenge is `COMPLETED` with both guesses and signings locked. So every season of a Terminal-Closed Showdown has a `COMPLETED` challenge. **Read only.**
3. `firestore.persistent-pair-production.fragment.rules`: JOB-08's `cmsCompletedShowdownReadable` 314 (full witness, two managers, active account), `cmsCompletedSeasonReadable` 344 (`season_1..season_N` only), marker `// CMS_PERSISTENT_PAIR_FUNCTIONS_END` 349.
4. `scripts/inject-persistent-pair-rules.mjs`: JOB-08's last seam (season commits) 53, required list 54, JOB-08 exact-count check 105.
5. `js/sparkSharedTransferChallenge.js`: `stspPublicLedger` 103 and `stspPrivateLedger` 112 (stored shapes), `operationHash` 149 (hash of `{actorRole, type, operationId, baseRevision, guesses|signings}`; the reader recomputes it), `stspProtocolVerdict` 138 (release rule), `stspRead` 142 (session-bound; stops at `TRANSFER_RIVALRY_INACTIVE` once closed). `js/sharedTransferChallenge.js` `stcHash` 32, `stcEvaluateRole` 131, `commandHash` 152. **Read only.**
6. `js/sparkCompletedShowdownReader.js` `csrVerifyRivalry` 50, `csrVerifyWitness` 61, exports 178: the reader mirrors these checks under its own `cth` names. **Do not edit this file.**
7. `tests/firebase/completed-showdown-read-emulator.cjs` B8 156, B9 157, D6 176; `tests/contracts/completed-showdown-read-contracts.cjs` K8 87, 89, 93 (the lines Appendix F flips).
8. `tests/operations/pos20-control-plane.test.mjs` `completedShowdownReadContract` 72 and `expectedSupplementalContracts` 76 (ordered `deepEqual` against the registry paths; the new contract goes last).
9. Authority: Sol ruling S2C-005R2 §4 ("The transfer proposal needs a narrower private-read predicate …", "Transfers can remain a separately unavailable domain …") and §6 item 5 (on `visual/cinematic-system-v10`, `project-documents/model-relay/archive/S2C-005R2_home-recovery-ruling.md`); lead handoff §2 D2 and §5 G-10, §3 default "Transfer history read fails" (on `leads/relay`); `DATA_CONTRACT_V1.md` §0 (statuses, `transfers.status`, managers, privacy) and §5.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. **Never deploy Rules or Pages.** Emulator project ids start with `demo-`.
- Billing permanently OFF: Spark only. No Cloud Functions, no Cloud Run, no Blaze, no scheduled jobs, no server code. App Check enforcement stays off. Do not write the words `billing`, `blaze`, `cloud functions` or `cloud run` into the fragment (the contract tests grep for them).
- Exactly two private managers: Daniel = `playerOne` = `daniel`, Nik = `playerTwo` = `nik`. The grant inherits JOB-08's membership: one of the two authorized accounts, in a manager slot, with an active account. The reader keys seasons by `daniel` / `nik` from the slot role, never by account, profile or save id.
- **Completed only.** The transfer grant sits on top of `cmsCompletedSeasonReadable`, so it needs the full Terminal Close witness and `season_1..season_N`. **Abandoned Showdowns get no transfer read at all** (§8a), not even for seasons whose challenge was `COMPLETED` while the Showdown was live.
- **Privacy, the narrow predicate.** A role document of a closed Showdown is readable only when its season's public challenge is `COMPLETED` with both roles in `guessLockedRoles` and `signingLockedRoles`, its identity matches (schema 1, `sharedTransferChallenge`, this rivalry, this season), and the role id is exactly `playerOne` or `playerTwo`. That is the existing `ssjrTransferPrivateReadable` condition (rival only at `COMPLETED`) applied to both roles after close. Active Showdowns: unchanged and re-proved (F1-F6).
- **Drafts, sessions, invites, career start, league projection, state:** no grant. There is no draft collection in Firestore (unfinished inputs live only in the app and in role documents before `COMPLETED`); any unmatched path such as `…/transferChallenges/season_1/drafts/x` stays under the default deny (B10).
- **Get only.** No write, list or delete rule may mention `cmsCompleted…`. Closed transfer writes stay denied (C1-C5).
- **Expression budget.** Firestore evaluates at most 1,000 expressions per request. This job adds only `allow get` branches; write requests never evaluate `get` rules. **Do not touch any write rule, `validInitialRivalryCreate`, `validRivalryRedeem`, `cmsPersistentPairCreationWitnessValid`, `cmsPersistentPairRedemptionWitnessValid`, or anything under `match /rivalries` except the two `allow get` lines the injector rewrites.** Use the qualified gate in §7.
- **Deploy order: Rules before client** (§8 Deploy order). The reader is not loaded by the app in this job; when it is, a new client against old Rules gets `permission-denied` and reports `unavailable` (contract K6), and old clients never read closed transfers.
- Client reader is memory-only (no browser storage), uses only `sdk.doc` + `sdk.getDoc`, never `runTransaction`, `getDocs(`, `collection(`, `query(`, `onSnapshot`, `getAfter`, any write, or the `sessions` path. Function names inside it start with `cth`.
- **Separate availability** (S2C-005R2 §4, DATA_CONTRACT §0): a failed transfer read never blocks points, seasons or trophies and is never shown as 0 signings. The reader is a separate module with its own reads; `readCompletedShowdown()` does not change (emulator P12 proves the completed reader stays `completed` while transfers are `unavailable`).
- Do not edit `firestore.spark.rules`, any other fragment, either build script, `js/sparkCompletedShowdownReader.js`, `js/persistentNikDanielPair.js` (`contractVersion` stays 4), any other `js/` file, `index.html`, `service-worker.js`, the deploy workflows, or any test not listed in §2.
- Never weaken, skip or delete an existing assertion. The only existing assertions that change meaning are JOB-08's K8 transfer lines and B8/B9, which say "(G-10)" and which this job is chartered to flip. D6 (abandoned transfer role denied) stays exactly as it is.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 What becomes readable (and what does not)

For a rivalry `R` whose root is closed by a verified Terminal Close (JOB-08 witness), for a signed-in manager of `R` with an active account:

| Path | Before | After this job |
| --- | --- | --- |
| `rivalries/R/transferChallenges/season_k`, k = 1..N | denied after close | **readable** (public ledger: role lists, operation ids/hashes, timestamps; no guess or signing content) |
| `rivalries/R/transferChallenges/season_k/roles/{playerOne,playerTwo}`, k = 1..N, challenge publicly `COMPLETED` | denied after close | **readable** (final guesses and signings, both already readable to both managers at `COMPLETED`) |
| the same role, challenge not `COMPLETED`, or one role missing from `guessLockedRoles` / `signingLockedRoles`, or identity mismatch | denied | denied |
| `season_{N+1}` and above, `season_01`, `roles/playerThree`, `roles/playerone`, `…/drafts/…` | denied | denied |
| setup, season results, result roles, season commits | JOB-08 grant | unchanged |
| `careerStart/authoritative`, `sharedSetup/leagueProjection`, `sessions/**`, `invites/**`, `state/**` | as today | unchanged (no grant) |
| any list, any write, any delete | denied | denied |

For an **abandoned** rivalry (closed, no `terminalClose`): no transfer document at all (D1-D6), including a challenge that was `COMPLETED` before the abandon (D2) and an unfinished one where Daniel had already signed (D4). For an **active** rivalry: everything exactly as today (F1-F6).

### 4.2 Requirements and proofs

Check ids refer to the emulator test (Appendix C, §6.2) and the contract test (Appendix D, "K" ids, §6.1). "J8" means JOB-08's emulator/contract after the Appendix F flip.

| # | Requirement (S2C-005R2 §4, §6 item 5; DATA_CONTRACT §0, §5) | How the Rules/client enforce it | Proved by |
| --- | --- | --- | --- |
| R1 | Both managers read the completed transfer history without a gameplay session | public get: `ssjrEntitled(rivalryId) \|\| cmsCompletedSeasonReadable(rivalryId, transferId)`; role get: existing rule `\|\| (managerRole in ['playerOne','playerTwo'] && cmsCompletedTransferRoleReadable(rivalryId, transferId))`; reader uses no session | A1-A6, P1-P3, J8 B8/B9 |
| R2 | Completed means the full Terminal Close witness, never `closedSessionRevision` alone | grant calls JOB-08's `cmsCompletedSeasonReadable`; reader re-verifies the witness before any child read | E0-E10, P10, K5 |
| R3 | Rival role reads keep the existing `COMPLETED` condition; no blanket `existingRead \|\| terminalReadable` | `cmsCompletedTransferRoleReadable`: public challenge schema 1, `sharedTransferChallenge`, same rivalry, season matches id, phase `COMPLETED`, both roles in both lock lists; canonical role ids at the seam | G0-G11, K9, K10, J8 K8 |
| R4 | No unfinished or private input ever leaks, also not by closing | active rules unchanged; closed roles need public `COMPLETED`; abandoned gets nothing | D2-D5, F3, F5, G1-G3 |
| R5 | Abandoned Showdowns: no transfer history (completed only) | no witness, no grant; reader returns `abandoned` after one read, `transfers: null` | D1-D7, P6, P7, K4 |
| R6 | Exactly `season_1..season_N`; a gap is unavailable, never a shorter history | season list `[0:total]` (JOB-08); reader reads every season and fails on any missing document | B4, B5, G4, P13, K8 |
| R7 | Strangers, unauthenticated users, inactive accounts and lists stay denied | JOB-08 membership; list rules untouched | B1-B3, B8, B9, E9, P9 |
| R8 | Closed writes remain denied; no write/list/delete rule changes | get-only seams; injector exact counts | C1-C5, I0, K10 |
| R9 | Drafts, sessions, invites, career start, league projection stay outside | grant appears on exactly two `allow get` lines | B10-B12, I0, K10 |
| R10 | Reader verifies provenance, not just shape | envelope hash, slots, witness, setup ledger (coordinator, length), exact public/role keys, catalog ids, one lock operation per role and type, and each stored guess/signing list hashes to the provider's `operationHash` | K7, K8, P11 |
| R11 | Output in DATA_CONTRACT §5 shape, keyed `daniel`/`nik`; verdicts equal the transfer protocol | `transfers:{status:'ready', seasons:[{season, daniel, nik}]}`; release rule mirrors `stcEvaluateRole` | K7, P1, P4 |
| R12 | Separate availability: transfers fail alone, never as 0 signings | separate module; every failure returns `transfers:{status:'unavailable', seasons:null}` | K3, K5, K6, K8, P9, P11, P12, P13 |
| R13 | Exact gets only: no session, device, transaction, list, write or storage; bounded reads | source grep; 2 + 3N gets; 1 get for `abandoned` / `not-closed` | K2, K4, K7, P5-P8 |
| R14 | JOB-08 reader and its API untouched (JOB-09 depends on it) | file not edited; contract checks API | K11 |
| R15 | Composed production Rules are what is tested; existing suites unchanged | both builds; all prior CI steps stay green | I0, K10, step 6 |

### 4.3 Rules function name (exact)

Add one function to the fragment, after `cmsCompletedSeasonReadable` and before `// CMS_PERSISTENT_PAIR_FUNCTIONS_END`, verbatim from Appendix A: `cmsCompletedTransferRoleReadable(rivalryId, transferId)`. Do not add a match block. The injector (Appendix A) rewrites exactly two composed `allow get` lines with `replaceOnce`:

| Composed seam (must exist exactly once) | Becomes |
| --- | --- |
| `match /transferChallenges/{transferId} {` + `allow get: if ssjrEntitled(rivalryId);` (six and eight spaces) | `allow get: if ssjrEntitled(rivalryId) \|\| cmsCompletedSeasonReadable(rivalryId, transferId);` |
| `allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);` (ten spaces) | same, then `\|\| (managerRole in ['playerOne', 'playerTwo'] && cmsCompletedTransferRoleReadable(rivalryId, transferId));` |

The injector's new count check: `cmsCompletedSeasonReadable(rivalryId, transferId)` appears exactly 2 times (public get + inside the new function) and `cmsCompletedTransferRoleReadable(rivalryId, transferId)` exactly 2 times (definition + role get). JOB-08's own counts (`…ShowdownReadable(rivalryId)` 3, `…SeasonReadable(rivalryId, seasonId)` 4) are unaffected because the transfer calls use `transferId`.

Why the persistent-pair fragment and the injector: same reviewed pattern as G-7 and G-8; `firestore.spark.rules`, the six shared fragments and both build scripts stay byte-identical, and the shared-only build is unchanged.

### 4.4 Client API (`js/sparkCompletedTransferHistoryReader.js`)

Browser global `CareerModeSparkCompletedTransferHistoryReader`; CommonJS export for tests. Frozen module with:

| Export | Shape |
| --- | --- |
| `readCompletedTransferHistory(options)` | `async`, **never throws**. `options = {firestore, firebaseSdk, user, rivalryId, cryptoImpl?}`; `firebaseSdk` needs only `doc` and `getDoc`. Returns a frozen `{status, code, rivalryId, managerRole, transfers}`. |
| `statuses` | `['completed','abandoned','not-closed','unavailable']` |
| flags | `sessionRequired:false, deviceRequired:false, providerWriteRequired:false, listPermissionRequired:false, canonicalStorageMutation:false, billingRequired:false`, `contractVersion:1`, `sourceAuthorityPaths` |

Result by status:

| `status` | Meaning | `transfers` |
| --- | --- | --- |
| `completed` | closed by a verified Terminal Close; every season's challenge and both roles read and verified | `{status:'ready', seasons:[…]}` (below) |
| `abandoned` | closed without a witness. Only the root was read | `null` (History row is status-only) |
| `not-closed` | `active` or `pending-pair`. Only the root was read; live transfers stay with the session-bound provider | `null` |
| `unavailable` | anything else; `code` is a Firestore code such as `permission-denied`, or one of `TRANSFER_HISTORY_PROVIDER_UNAVAILABLE`, `…_AUTH_REQUIRED`, `…_RIVALRY_INVALID`, `…_RIVALRY_MISSING`, `…_RIVALRY_INTEGRITY_FAILED`, `…_NOT_A_MANAGER`, `…_BINDING_INVALID`, `…_TERMINAL_WITNESS_INVALID`, `…_CATALOG_UNAVAILABLE`, `…_SETUP_INVALID`, `…_SEASON_MISSING`, `…_SEASON_INVALID`, `…_PROVENANCE_MISMATCH`, `…_CRYPTO_UNAVAILABLE`, `…_READ_FAILED` | `{status:'unavailable', seasons:null}` (never `[]`, never 0 signings) |

One season (DATA_CONTRACT §5 "per-season guess/signing summary"; Daniel is always `daniel`, the left column):

```js
{season: 1,
 daniel: {guesses:[{slot, type:'league'|'nationality', valueId}],
          signings:[{slot, name, leagueId, nationalityId, release, matchedBy:[{type, valueId}]}],
          released: 1, kept: 0},
 nik:    {…same…}}
```

`release` is true when the rival guessed the signing's league or nationality (same rule as `stcEvaluateRole` / `stspProtocolVerdict`; P4 proves equality with the provider's own verdicts). `released` + `kept` = number of signings. An empty season (`guesses:[]`, `signings:[]`, 0/0) is real data, not unavailable. The summary carries no account, profile, save, session or device id and no timestamps.

Read order for `completed` (each step fails closed): root -> envelope hash, slots, role -> witness (before any child read) -> catalog present (36 leagues, 164 nationalities) -> setup ledger (`sharedSetupLedger`, revision 6, `SHOWDOWN_CONFIRMED`, coordinator, length == witness) -> for k = 1..N: challenge, `roles/playerOne`, `roles/playerTwo` (all three fetched first; any missing -> `…_SEASON_MISSING`) -> public checks (exact keys, schema 1, rivalry, season, runtime `1.9.1-r8`, coordinator == ledger, `COMPLETED`, revision 6 or 7, both lock lists, operation history shape, first op `start-window` by the coordinator, exactly one `lock-guesses` and one `lock-signings` per role, last op `lock-signings`) -> role checks (exact keys, schema 1, rivalry, season, role, catalog ids, signings locked, both lock timestamps) -> provenance (recompute each role's two operation hashes) -> verdicts.

Reads per completed Showdown: 2 + 3N document gets (11 for 3 seasons; each `get` also evaluates a few rule-dependent reads). A later screen job must cache per signed-in account in memory, as S2C-005R2 §5 requires; this job adds no caller.

### 4.5 Existing tests: what changes and what must stay untouched

Must change (every other assertion kept):

1. `tests/contracts/completed-showdown-read-contracts.cjs` (JOB-08 K8): `getLines.length` 5 -> 7 (the transfer challenge get and the call inside the new function now match its regex); `['match /transferChallenges/{transferId}',false]` -> `true`; the "transfer roles stay with G-10" line becomes two assertions on the transfer **roles** block only: no `cmsCompleted(Showdown|Season)Readable` there (no blanket grant), and `cmsCompletedTransferRoleReadable(rivalryId, transferId)` present. Appendix F.
2. `tests/firebase/completed-showdown-read-emulator.cjs` (JOB-08): B8 `assertFails` -> `assertSucceeds` (challenge `COMPLETED`), B9 `assertFails` -> `assertSucceeds` (role, `managerRole == 'playerOne'`), labels say G-10. Still 56 checks. D6 unchanged. Appendix F.
3. `tests/operations/pos20-control-plane.test.mjs`: add the new contract to `expectedSupplementalContracts` (order matters: last).

Must stay byte-identical (check with `git diff --stat` in step 6):

- `firestore.spark.rules`, the six other `*.fragment.rules`, both build scripts, every `js/` file except the new one (in particular `js/sparkCompletedShowdownReader.js`, `js/sparkSharedTransferChallenge.js`, `js/sharedTransferChallenge.js`, `js/persistentNikDanielPair.js`), `index.html`, `service-worker.js`, `.github/workflows/deploy-*.yml`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10 kernel files, `data/transferOptions.js`.
- Every other `tests/contracts/*.cjs`, every `tests/browser/*` audit, every other `tests/firebase/*-emulator.cjs` (journey, career index, pair provider, setup provider, transfer fresh-session, lifecycle, terminal close, diagnostics).

### 4.6 The generated-rules trap

`npm run test:contracts` rebuilds `firestore.spark.generated.rules` **without** the persistent-pair fragment. Any emulator run after it, without rebuilding, has no grant (I0 fails) and fails every pair/index write. Always run, in this order, immediately before any emulator run:

```bash
node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
```

CI's `rules-emulator` job already builds both before its first step; do not reorder it. Never commit `firestore.spark.generated.rules` changes or `firestore-debug.log`.

## 5. Steps

After each step update `status/JOB-10.md` on `factory/gameplay-v1` with `Job 10 step k/8: <step name>`. Save code to `gameplay/job-10-transfer-history` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1` (at or after `843e64e`), `npm ci`. Run `npm run test:contracts` (record `N/N`, expected `103/103` at `843e64e`; it becomes `N+1` in step 6) and `npm run test:ops` (expected pass 73 / fail 0). Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1` (it includes `Completed-only read matrix`). If that run is not green, set BLOCKED: `Job 10 is blocked: recovery-v1 CI is red before any change.` If jobs 9, 11, 16 or 18 merged since `843e64e`, write which in the Notes (ordering, §2).
2. **Map.** Confirm every line number in §2 "Read first" on the current head and write drift in the Notes. Rebuild both Rules (§4.6) and confirm: `grep -A1 "match /transferChallenges/{transferId} {" firestore.spark.generated.rules | grep -c "allow get: if ssjrEntitled(rivalryId);"` prints `1`, and `grep -c "allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);" firestore.spark.generated.rules` prints `1`. Confirm JOB-08's B8/B9 still say `(G-10)` and K8 still has `getLines.length,5`.
3. **Tests first.** Create `tests/contracts/completed-transfer-history-contracts.cjs` (Appendix D) and `tests/firebase/completed-transfer-history-emulator.cjs` (Appendix C). Apply Appendix E (registry entry, ops-test const, CI step `Completed transfer history matrix` as the last step of `rules-emulator`). **Do not apply Appendix F yet.** `node --check` both new files. Run the contract locally: it must **fail** with `Cannot find module …/js/sparkCompletedTransferHistoryReader.js`. Save. On CI, on your head: `Gameplay contracts` fails only on the new contract; in `rules-emulator` every existing step is green and `Completed transfer history matrix` fails at I0 with `0 !== 1` (no grant yet; the reader is loaded only for section P, so I0 is reached). This red run is your tests-first evidence; link it.
4. **Client.** Create `js/sparkCompletedTransferHistoryReader.js` (Appendix B). `node --check` it. Run the contract locally: K1-K8 now pass and it fails at K9 with `AssertionError … cmsCompletedSeasonReadable(rivalryId, transferId)` (no fragment function yet). Save. CI: emulator still red at I0. Record.
5. **Rules and JOB-08 flips, in one save.** Apply Appendix A (fragment + injector) and Appendix F (JOB-08 contract K8 and emulator B8/B9) together; save all four before reading CI. Why together: once the grant exists, JOB-08's K8 fails (`7 !== 5`) and its B8 fails (`Expected request to fail, but it succeeded`), and a failed `Completed-only read matrix` step skips the new step after it. Rebuild both Rules (§4.6); `grep -c "cmsCompletedTransferRoleReadable(rivalryId, transferId)" firestore.spark.generated.rules` prints `2` and `grep -c "cmsCompletedSeasonReadable(rivalryId, transferId)" …` prints `2`. Run both contracts locally (`completed-transfer-history-contracts.cjs`, `completed-showdown-read-contracts.cjs`): PASS. Save. CI should now be fully green; if it is not, go to §8.
6. **Full proof.** Locally: `node tests/contracts/completed-transfer-history-contracts.cjs` PASS; `npm run test:contracts` prints `(N+1)/(N+1)` (expected `104/104` at `843e64e`); `npm run test:ops` has 0 failures; `git diff --stat origin/gameplay/recovery-v1` lists exactly the ten §2 files. Rebuild both Rules (trap §4.6) and confirm the composed file is not committed. On CI, on your exact head: every step of both jobs green; paste the last line of `Completed transfer history matrix` (`PASS completed-only transfer history emulator: 73 numbered checks …`), of `Completed-only read matrix` (`PASS completed-only read emulator: 56 numbered checks …`), of `Two-manager journey`, both lines of `Career index matrix` (Phase A 56, Phase B 58) and of `Transfer fresh-session recovery`. Then run the qualified expression-budget gate (§7).
7. **PR.** Open the PR into `gameplay/recovery-v1` titled `Job 10: transfer history, completed only`. Body: the §4.2 table, the §4.1 table, the ten files, the CI run URL on the exact head, and the line "Rules are not deployed by this PR. Get-only grant. Main-gate order: Rules release before any client that loads the reader; a new client against old Rules reports transfers unavailable, old clients never read closed transfers."
8. **Codex review.** After CI is green on the exact head and the PR is open, post one PR comment that says exactly `@codex review`. Set `State: WAITING ON CODEX` in the status file and save it. When the review arrives, this is your one fix round: fix every finding that is a real bug (push, wait for green CI on the new exact head) and reply on each finding thread in one line: `fixed in <commit>` or why not. A fix that touches Rules or the reader re-runs step 6 in full. Then fill the Done checklist and set `State: DONE`, save `Job 10 done: Transfer history, completed only`. If Codex does not answer, write that in the status file and set DONE; the lead decides. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a).

## 6. Tests first

### 6.1 Contract test (`tests/contracts/completed-transfer-history-contracts.cjs`, Appendix D)

No Firebase, no emulator. Runs in `npm run test:contracts` through the registry entry. Fixtures are three real Transfer Challenges played through `js/sharedTransferChallenge.js` (season 1: Nik's guess releases Daniel's signing; season 2: two Nik signings, one released; season 3: empty rows), stored in the provider's exact shapes; an in-memory fake `{doc, getDoc}` logs every path read.

| Id | Proves |
| --- | --- |
| K1 | API surface: `readCompletedTransferHistory`, the four `statuses`, all six safety flags `false`, `contractVersion` 1, module frozen |
| K2 | reader source has no `runTransaction`, `getDocs(`, `collection(`, `query(`, `listDocuments`, write call, browser storage, `sessions` path, `onSnapshot` or `getAfter`; uses `sdk.getDoc(sdk.doc(`; every named function starts with `cth` |
| K3 | never throws: missing options, bad id, missing user -> frozen `unavailable`, `transfers:{status:'unavailable', seasons:null}` |
| K4 | `active` / `pending-pair` -> `not-closed`, one read; closed without `terminalClose` -> `abandoned`, one read (also with staged `terminalProgress`); `transfers` null |
| K5 | seven forged witnesses -> `TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID` with exactly one read |
| K6 | tampered envelope, stranger, missing root, denied root, denied challenge (JOB-08 Rules without JOB-10: honest `permission-denied`), denied rival role, missing ledger, missing catalog (fails before any child read) |
| K7 | 1- and 3-season completed: exact read order, 2 + 3N gets, keys `season`/`daniel`/`nik`, guesses and verdicts equal the protocol's `evaluateRole`, `released`/`kept`, empty season is `{guesses:[],signings:[],released:0,kept:0}`, Daniel and Nik get identical `transfers` |
| K8 | eleven tampered/partial cases: rival guess edited and signing renamed after lock -> `…_PROVENANCE_MISMATCH`; roles swapped, challenge not `COMPLETED`, unknown catalog id, coordinator differs from setup, extra key, unlocked signings -> `…_SEASON_INVALID`; missing role or challenge -> `…_SEASON_MISSING`; setup length differs -> `…_SETUP_INVALID`; all with `seasons:null` |
| K9 | fragment text: every clause of `cmsCompletedTransferRoleReadable`, no `getAfter` / `request.resource`, no billing words; injector carries the two new seam labels |
| K10 | both builds exit 0; the transfer grant is on exactly the challenge get and the role get; the roles block never carries `cmsCompleted(Showdown|Season)Readable`; no write/list/delete rule mentions `cmsCompleted`; leagueProjection, careerStart, sessions, invites, state have no grant |
| K11 | JOB-08 reader API unchanged (`readCompletedShowdown`, statuses, `contractVersion` 1) and its source never mentions `transferChallenges` |

### 6.2 Emulator test (`tests/firebase/completed-transfer-history-emulator.cjs`, Appendix C)

Composed production Rules, project `demo-cms-completed-transfer` locally / `demo-cms-gameplay-fast-completed-transfer` in CI. Accounts: Daniel `acct_daniel` (`playerOne`), Nik `acct_nik` (`playerTwo`), stranger `acct_stranger`, `acct_inactive` (status `deletion-requested`). Four Showdowns played through the real providers: **X** 3 seasons with the K7 transfer inputs, closed by a real Terminal Close (Daniel 11, Nik 4; the session-bound `Transfer.read` verdicts are captured before close); **Y** 1 season, transfer `COMPLETED` and Daniel's result published, then abandoned by a Rules-checked abandon write (before the abandon Nik could read Daniel's role); **W** 1 season, abandoned during `SIGNING_ENTRY` after Daniel locked his signings; **Z** 3 seasons, active, season 1 acknowledged and season 2's challenge in `SIGNING_ENTRY` with Daniel's signings locked. Forged roots (E, G) are copies of X's root seeded with Rules disabled; G roots also carry seeded challenge documents (role documents absent, so an allowed role `get` returns not-found and a denied one throws). Output: one `ok <n> <id> <label>` line per check, then `PASS completed-only transfer history emulator: 73 numbered checks …`.

| Id | Check | Expect |
| --- | --- | --- |
| I0 | composed Rules carry the grant on exactly the challenge get and the `COMPLETED`-gated role get; no write rule mentions it; pair/index/JOB-08/transfer markers present | assert |
| A1 | Daniel gets X `season_1` challenge; X's session is `closed` | allow |
| A2 | Nik gets X `season_3` challenge | allow |
| A3 | Daniel gets Nik's X `season_1` role | allow |
| A4 | Nik gets Daniel's X `season_1` role | allow |
| A5 | Daniel gets his own X `season_2` role | allow |
| A6 | Nik gets Daniel's X `season_3` role (empty rows) | allow |
| B1 | stranger gets X challenge | deny |
| B2 | stranger gets Nik's X role | deny |
| B3 | unauthenticated get of an X role | deny |
| B4 | Daniel gets X `season_4` challenge (3-season Showdown) | deny |
| B5 | Daniel gets X `season_4` role | deny |
| B6 | Daniel gets X `transferChallenges/season_01` | deny |
| B7 | Daniel gets X `roles/playerThree` | deny |
| B8 | Daniel lists X `transferChallenges` | deny |
| B9 | Daniel lists X `season_1/roles` | deny |
| B10 | Daniel gets X `transferChallenges/season_1/drafts/playerTwo` | deny |
| B11 | Daniel gets X `careerStart/authoritative` | deny |
| B12 | Daniel gets X `sharedSetup/leagueProjection` | deny |
| C1 | Daniel updates X `season_1` challenge | deny |
| C2 | Nik rewrites his X `season_1` role | deny |
| C3 | Daniel creates X `season_4` challenge | deny |
| C4 | Daniel deletes X `season_1` challenge | deny |
| C5 | Nik deletes Daniel's X `season_2` role | deny |
| D1 | Daniel gets abandoned Y challenge | deny |
| D2 | Nik gets Daniel's `COMPLETED` Y role after abandon (readable while active, asserted before the abandon) | deny |
| D3 | Daniel gets his own Y role after abandon | deny |
| D4 | Nik gets Daniel's unfinished W role (`SIGNING_ENTRY`, Daniel signed) | deny |
| D5 | Daniel gets his own W role after abandon | deny |
| D6 | Daniel gets abandoned W challenge | deny |
| D7 | Daniel gets the Y root; `closed`, no `terminalClose` | allow |
| E0 | control: correctly witnessed forged copy, challenge get | allow |
| E1 | closed + `terminalProgress`, no `terminalClose` | deny |
| E2 | witness winner contradicts totals | deny |
| E3 | `closedSessionRevision` null | deny |
| E4 | accepted 2 of 3 seasons | deny |
| E5 | intent totals != progress totals | deny |
| E6 | witness names another rivalry | deny |
| E7 | witness has an extra key | deny |
| E8 | root `tombstoned` | deny |
| E9 | member whose account is not active | deny |
| E10 | closed + `terminalClose`, no `terminalProgress` | deny |
| G0 | control: `COMPLETED` challenge under a witnessed root, rival role get | allow |
| G1 | challenge in `SIGNING_ENTRY`: rival role | deny |
| G2 | challenge in `SIGNING_ENTRY`: own role after close | deny |
| G3 | `COMPLETED` but one signing locked | deny |
| G4 | `season_4` of a 3-season Showdown with a `COMPLETED` challenge | deny |
| G5 | `COMPLETED` but one guess locked | deny |
| G6 | challenge names another rivalry | deny |
| G7 | challenge `seasonNumber` differs from its id | deny |
| G8 | wrong `objectType` | deny |
| G9 | no challenge document | deny |
| G10 | `schemaVersion` 2 | deny |
| G11 | role id `playerone` on a `COMPLETED` challenge | deny |
| F1 | Daniel gets active Z `season_1` challenge (existing rule) | allow |
| F2 | Nik gets Daniel's `COMPLETED` Z `season_1` role (existing rule) | allow |
| F3 | Nik gets Daniel's unfinished Z `season_2` role | deny |
| F4 | Daniel gets his own Z `season_2` role | allow |
| F5 | Daniel gets Nik's unfinished Z `season_2` role | deny |
| F6 | stranger gets a Z role | deny |
| P1 | Daniel `readCompletedTransferHistory(X)` | `completed`, role `playerOne`, frozen, `transfers.status:'ready'`, seasons `[1,2,3]` keyed `daniel`/`nik`, S1 Daniel released 1, S2 Nik released 1 / kept 1, S3 empty |
| P2 | Nik reads X | identical `transfers`, role `playerTwo` |
| P3 | fresh authenticated client, no session/device input | identical `transfers` |
| P4 | reader verdicts vs session-bound `Transfer.read` verdicts taken before close, all three seasons | deep-equal |
| P5 | gets for P1 | exactly 11 (2 + 3N) |
| P6 | Nik reads abandoned Y | `abandoned`, `transfers` null, exactly 1 read |
| P7 | Nik reads abandoned W | `abandoned`, exactly 1 read |
| P8 | Daniel reads active Z | `not-closed`, exactly 1 read |
| P9 | stranger reads X | `unavailable`, `permission-denied`, `seasons:null` |
| P10 | Daniel reads forged E2 root | `…_TERMINAL_WITNESS_INVALID`, exactly 1 read |
| P11 | X `season_2` Nik signing renamed (Rules disabled) | `unavailable`, `…_PROVENANCE_MISMATCH`, `seasons:null` |
| P12 | JOB-08 `readCompletedShowdown(X)` at the same moment | still `completed`, totals 11-4 (separate availability) |
| P13 | P11 edit restored, X `season_3` Daniel role deleted | `unavailable`, `…_SEASON_MISSING`, never shorter |

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 3 (URL), `Completed transfer history matrix` failing at I0 and the contract failing on the missing module; step 4 contract failing at K9.
- [ ] `node tests/contracts/completed-transfer-history-contracts.cjs` PASS locally; `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including `Completed transfer history matrix` (73 numbered checks), `Completed-only read matrix` (56, B8/B9 now G-10 allows), `Two-manager journey`, `Career index matrix` (Phase A 56, Phase B 58) and `Transfer fresh-session recovery`.
- [ ] JOB-08 flips: only K8's three transfer lines and B8/B9 changed; D6 and every other JOB-08 assertion unchanged; JOB-08 still 56 checks.
- [ ] Qualified expression-budget gate (lead wording from JOB-07/08, unchanged): every emulator case that expects success passes; the phrase `maximum of 1000 expressions` may appear only on the log lines of cases that expect PERMISSION_DENIED. Check it mechanically: for each occurrence, the next `ok N <case>` line must be a denial case. Today the only expected occurrences are career-index `D13` (stranger cannot create an index naming a rivalry they are not in), once in Phase A and once in Phase B. Record the case name(s). If the phrase ever appears next to a case that expects success (any transfer-history A/F/G0/E0/P allow, completed-read allow, journey, creation, redemption, rollover or append case), that is a FAIL and BLOCKED. Do not edit any assertion to hide it.
- [ ] No write rule, none of the four budget-edge functions, `firestore.spark.rules`, the six shared fragments and both build scripts changed; the transfer grant appears only on two `allow get` lines; `js/sparkCompletedShowdownReader.js` unchanged.
- [ ] `git diff --stat` lists only the ten §2 files; no generated Rules, no `firestore-debug.log`; `contractVersion` in `js/persistentNikDanielPair.js` still 4; `index.html` and `service-worker.js` unchanged.
- [ ] No deploy, nothing pushed to `main`, no billing words in the fragment.
- [ ] PR open into `gameplay/recovery-v1` with the §4.1 and §4.2 tables and the deploy-order line.
- [ ] Codex: `@codex review` posted after green CI; State was WAITING ON CODEX; every finding thread answered in one line (`fixed in <commit>` or why not); CI green again on the final exact head; or "Codex did not answer" recorded. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 10 is blocked: <one line>`.

Known traps:

- **I0 fails with `0 !== 1` after step 5.** The composed Rules lack the pair fragment (§4.6 trap), or a seam string drifted. Rebuild both; if the injector throws `Expected exactly one completed Showdown transfer … seam`, re-check the seam strings against the composed file from step 2 (six spaces before `match`, eight before the challenge `allow`, ten before the roles `allow`).
- **`Completed-only read matrix` fails at B8 (`Expected request to fail, but it succeeded`) and the new step is skipped.** You saved Appendix A without Appendix F. Save the JOB-08 flips. Same cause if `Gameplay contracts` fails JOB-08 K8 with `7 !== 5`.
- **A3-A6 or G0 denied.** The role seam or the function drifted from Appendix A; never "fix" it by dropping the `COMPLETED` / lock-list clauses.
- **P1 `unavailable` with `…_PROVENANCE_MISMATCH`.** The reader's canonical form drifted from the provider's (`cthSortedCanonical` must equal `stspCanonical`: sorted keys, plain objects only) or the payload key changed. Re-apply Appendix B byte for byte. Do not "simplify" `cthSortedCanonical` into `cthEnvelopeCanonical`: they differ on purpose (provider operation hash vs rivalry envelope hash).
- **P1 `unavailable` with `…_CATALOG_UNAVAILABLE`.** The test did not load `data/transferOptions.js` after `global.window=globalThis`.
- **P13 reports `…_PROVENANCE_MISMATCH`.** The P11 edit was not restored first (Appendix C restores it).
- **`maximum of 1000 expressions` next to an A/F/G0/E0/P allow case.** You changed something other than the two `allow get` lines. The grant must never be on a write rule.
- `firestore-debug.log` appears after local emulator runs. Never commit it.

### Deploy order (for the lead, not this job)

Rules before client. At the main gate this grant joins the same Rules-only release as G-7 and G-8 (zero-billing Rules workflow, Nik's typed words). The client that loads `js/sparkCompletedTransferHistoryReader.js` ships only after that release is live; until then a new client would report transfers `unavailable` (never 0 signings), and old clients are unaffected (they never read closed transfers: the session-bound provider stops at `TRANSFER_RIVALRY_INACTIVE`). G-12 decides whether the transfer-history proof joins `deploy-firestore-rules-zero-billing.yml`. Not this job.

## 8a. Lead decisions (2026-10-03)

- **Lead confirms (2026-10-03):** abandoned Showdowns get no transfer read; the reader stays unwired in this job (G-13 wires it and updates JOB-11's fixture validator for `transfers` together with the view model); the lead sends Team V the new §5 field names in a G2V message after merge; whether this proof joins the zero-billing deploy workflow is G-12's call. Work lane order: JOB-11, then JOB-09, then this job.
- **Abandoned Showdowns: no transfer read at all.** The job title says completed only; Nik's ruling (handoff §3, 2026-10-01) makes an abandoned Showdown a status-only History row that counts for nothing; and the abandoned set includes Showdowns closed mid-challenge, where a role document holds unfinished input (W, D4). Even seasons whose challenge was `COMPLETED` while live (and were then readable to both) close with the Showdown (Y, D2). Granting those would need per-season reasoning for a screen that shows no seasons, so it is out.
- **The public challenge follows the season grant; roles need public `COMPLETED`.** The public challenge holds no guess or signing content (exact keys in `ssjrTransferPublicExactKeys`), so it uses JOB-08's `cmsCompletedSeasonReadable` unchanged. Role documents keep the existing `COMPLETED` condition (S2C-005R2 §4), applied to both roles after close; in a Terminal-Closed Showdown every season is `COMPLETED` anyway (season results require it), so the extra condition costs nothing and closes any forged or partial state (G1-G10).
- **Separate module, not an extension of JOB-08's reader.** JOB-09's adapter and loader depend on `readCompletedShowdown()`'s exact result shape; transfers have their own availability (S2C-005R2 §4, DATA_CONTRACT §0). The witness and envelope checks are duplicated under `cth` names on purpose (two independent readers, no shared mutable module).
- **Provenance through the provider's own operation hash**, so a role document edited after its lock is `unavailable`, not shown.
- **Output field names** for the §5 summary are proposed here (`transfers.seasons[]`: `season`, `daniel`/`nik` -> `guesses`, `signings` with `release`/`matchedBy`, `released`, `kept`). DATA_CONTRACT_V1 changes only by relay message: the lead posts a `G2V` naming these fields after merge. JOB-11's fixture validator currently pins `transfers` to `["status"]`; the screen job that wires this reader (G-13) updates it together with the view model.
- **Get only, no list.** Exact `season_1..season_N` gets bound the reads (2 + 3N); no list rule is added anywhere.
- **Not wired to screens:** no `index.html`, `service-worker.js`, shell revision or loader change here. No staging flag (pure read-side addition).
- Codex: one review, one fix round (RULES.md). After the fix round the lead decides.

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `843e64e` (Java 21, firebase-tools 15.28.1, firebase 12.17.1, @firebase/rules-unit-testing 5.0.1, node 22.22.0; emulator on alternate local ports). Results on that worktree: `npm run test:contracts` `104/104`; `npm run test:ops` 73 pass / 0 fail; every `rules-emulator` CI step run in CI order after rebuilding both Rules (setup provider, transfer fresh-session, lifecycle 1 and 3, terminal close, pair matrix, journey 3 seasons, career index Phase A 56 and Phase B 58, completed-only read 56 with B8/B9 flipped, completed transfer history 73) all PASS; composed Rules 132,878 bytes (131,462 before). Budget: exactly two `maximum of 1000 expressions` lines, both career-index `D13` denials (Phase A and Phase B; the next `ok` line after each is `D13`); none in the transfer-history, completed-read or journey logs. Tests-first states verified: contract fails on the missing module; with the reader but no Rules it fails at K9 (`cmsCompletedSeasonReadable(rivalryId, transferId)`); the emulator fails at I0 (`0 !== 1`) on the JOB-08 Rules; with the new Rules but without Appendix F, JOB-08's emulator fails at B8 (`Expected request to fail, but it succeeded`) and its contract at K8 (`7 !== 5`). Not run by the lead: GitHub CI itself (your step 3-6 runs are the first), Codex, the journey at 1 season, JOB-09's emulator test (not on this branch). Apply the appendices as given; if a hunk does not apply because the branch moved, re-apply by hand and say so in the status Notes. Diffs are against `843e64e`.

### Appendix A. Rules: `firestore.persistent-pair-production.fragment.rules` and `scripts/inject-persistent-pair-rules.mjs`

````diff
diff --git a/firestore.persistent-pair-production.fragment.rules b/firestore.persistent-pair-production.fragment.rules
index 30808c5..587cf75 100644
--- a/firestore.persistent-pair-production.fragment.rules
+++ b/firestore.persistent-pair-production.fragment.rules
@@ -346,6 +346,27 @@
       return cmsCompletedShowdownReadable(rivalryId)
         && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];
     }
+
+    // CMS_COMPLETED_TRANSFER_READ (JOB-10): a transfer role of a Terminal-Closed Showdown, for season_1..season_N,
+    // only when that season's challenge is publicly COMPLETED (both guesses and both signings locked).
+    // Keeps the existing role/phase condition of ssjrTransferPrivateReadable. Get only.
+    function cmsCompletedTransferRoleReadable(rivalryId, transferId) {
+      let challenge = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
+      return cmsCompletedSeasonReadable(rivalryId, transferId)
+        && challenge.schemaVersion == 1
+        && challenge.objectType == 'sharedTransferChallenge'
+        && challenge.rivalryId == rivalryId
+        && ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)
+        && challenge.phase == 'COMPLETED'
+        && challenge.guessLockedRoles is list
+        && challenge.guessLockedRoles.size() == 2
+        && 'playerOne' in challenge.guessLockedRoles
+        && 'playerTwo' in challenge.guessLockedRoles
+        && challenge.signingLockedRoles is list
+        && challenge.signingLockedRoles.size() == 2
+        && 'playerOne' in challenge.signingLockedRoles
+        && 'playerTwo' in challenge.signingLockedRoles;
+    }
 // CMS_PERSISTENT_PAIR_FUNCTIONS_END
 
 // CMS_PERSISTENT_PAIR_MATCH_BEGIN
diff --git a/scripts/inject-persistent-pair-rules.mjs b/scripts/inject-persistent-pair-rules.mjs
index 0547d57..e274a3b 100644
--- a/scripts/inject-persistent-pair-rules.mjs
+++ b/scripts/inject-persistent-pair-rules.mjs
@@ -51,6 +51,10 @@ export function injectPersistentPairRules(){
   generated=replaceOnce(generated,'      match /seasonResults/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId);','      match /seasonResults/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);','completed Showdown season results read');
   generated=replaceOnce(generated,'          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);','          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole)\n            || (managerRole in [\'playerOne\', \'playerTwo\'] && cmsCompletedSeasonReadable(rivalryId, seasonId));','completed Showdown season result role read');
   generated=replaceOnce(generated,'      match /seasonCommits/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId);','      match /seasonCommits/{seasonId} {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);','completed Showdown season commit read');
+  // JOB-10: completed-only transfer history. The public challenge follows the season grant; a role additionally
+  // needs that season's challenge to be publicly COMPLETED (cmsCompletedTransferRoleReadable). Get rules only.
+  generated=replaceOnce(generated,'      match /transferChallenges/{transferId} {\n        allow get: if ssjrEntitled(rivalryId);','      match /transferChallenges/{transferId} {\n        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, transferId);','completed Showdown transfer challenge read');
+  generated=replaceOnce(generated,'          allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);','          allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole)\n            || (managerRole in [\'playerOne\', \'playerTwo\'] && cmsCompletedTransferRoleReadable(rivalryId, transferId));','completed Showdown transfer role read');
   for(const required of [
     'function cmsPersistentPairManagerValid(role, managerId)',
     'function cmsPersistentPairRivalryMembership(accountId, rivalryId, role)',
@@ -92,7 +96,11 @@ export function injectPersistentPairRules(){
     "'terminalClose' in data",
     'progress.closedSessionRevision is int',
     'allow get: if ssjrEntitled(rivalryId) || cmsCompletedShowdownReadable(rivalryId);',
-    'allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);'
+    'allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);',
+    'function cmsCompletedTransferRoleReadable(rivalryId, transferId)',
+    "challenge.phase == 'COMPLETED'",
+    'allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, transferId);',
+    "|| (managerRole in ['playerOne', 'playerTwo'] && cmsCompletedTransferRoleReadable(rivalryId, transferId));"
   ]){
     if(!generated.includes(required))throw new Error(`Generated production Rules missing persistent pair boundary: ${required}`);
   }
@@ -105,6 +113,9 @@ export function injectPersistentPairRules(){
   if((generated.match(/cmsCompletedShowdownReadable\(rivalryId\)/g)||[]).length!==3||(generated.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length!==4){
     throw new Error('Generated production Rules must apply the completed-only read grant to exactly setup, season results, result roles and season commits.');
   }
+  if((generated.match(/cmsCompletedSeasonReadable\(rivalryId, transferId\)/g)||[]).length!==2||(generated.match(/cmsCompletedTransferRoleReadable\(rivalryId, transferId\)/g)||[]).length!==2){
+    throw new Error('Generated production Rules must apply the completed-only transfer grant to exactly the transfer challenge and its COMPLETED roles.');
+  }
   if(!generated.endsWith('\n'))generated+='\n';
   fs.writeFileSync(outputPath,generated,'utf8');
   return generated;
````

### Appendix B. New client: `js/sparkCompletedTransferHistoryReader.js` (full file)

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkCompletedTransferHistoryReader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-10: session-free, read-only transfer history of one Showdown closed by a verified Terminal Close.
  // Exact document gets only (rivalry, setup ledger, transferChallenges/season_1..season_N and both roles);
  // no session, no device, no transaction, no list, no write, no browser storage. Separate availability:
  // a failure here never touches points, seasons or trophies (readCompletedShowdown is independent).
  const cthTerminal=()=>typeof require==="function"?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const MANAGER_KEY=Object.freeze({playerOne:"daniel",playerTwo:"nik"});
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const TRANSFER_RUNTIME="1.9.1-r8";
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const PROGRESS_KEYS=Object.freeze(["schemaVersion","runtimeRevision","totalSeasons","acceptedThroughSeason","managerTotals","closedSessionRevision"]);
  const PUBLIC_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision","startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles","operationIds","operationTypes","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const PRIVATE_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings","guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"]);
  const STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable"]);

  function cthFail(code){const error=new Error(code);error.code=code;throw error;}
  function cthFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(cthFreeze);Object.freeze(value);}return value;}
  function cthPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function cthExact(value,keys,code){if(!cthPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))cthFail(code);return value;}
  function cthClone(value){return JSON.parse(JSON.stringify(value));}
  // Same canonical form as the transfer provider's operation hash (sorted keys, plain objects only).
  function cthSortedCanonical(value){if(Array.isArray(value))return `[${value.map(cthSortedCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${cthSortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  // Same canonical form as the rivalry envelope content hash.
  function cthEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(cthEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=cthEnvelopeCanonical(value[key]);return out;}return value;}
  async function cthDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")cthFail("TRANSFER_HISTORY_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function cthSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function cthIsTimestamp(value){return Boolean(value)&&typeof value.toMillis==="function"&&Number.isFinite(value.toMillis());}
  function cthCatalog(){
    const leagues=Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES.map(item=>item&&item.id).filter(Boolean):[];
    const nations=Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES.map(item=>item&&item.id).filter(Boolean):[];
    if(leagues.length!==36||nations.length!==164)cthFail("TRANSFER_HISTORY_CATALOG_UNAVAILABLE");
    return {leagueIds:new Set(leagues),nationalityIds:new Set(nations)};
  }

  function cthState(status,fields={}){
    return cthFreeze({status,code:fields.code||null,rivalryId:fields.rivalryId||null,managerRole:fields.managerRole||null,transfers:fields.transfers||null});
  }
  async function cthGet(sdk,db,parts){
    try{return cthSnapshot(await sdk.getDoc(sdk.doc(db,...parts)));}
    catch(error){cthFail(error&&typeof error.code==="string"&&error.code?error.code:"TRANSFER_HISTORY_READ_FAILED");}
  }

  async function cthVerifyRivalry(value,rivalryId,uid,cryptoImpl){
    if(!value||value.schemaVersion!==1||value.objectType!=="rivalry"||value.objectId!==rivalryId||!Number.isInteger(value.revision)||value.revision<0||value.lifecycleState!=="live"||!HASH.test(String(value.contentHash||""))||!cthPlain(value.data)||value.tombstone!==null)cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");
    const expected=await cthDigest(JSON.stringify(cthEnvelopeCanonical({objectType:"rivalry",objectId:rivalryId,revision:value.revision,data:value.data})),cryptoImpl);
    if(expected!==value.contentHash)cthFail("TRANSFER_HISTORY_RIVALRY_INTEGRITY_FAILED");
    const slots=value.data.managerSlots,authorized=value.data.authorizedAccountIds;
    if(!Array.isArray(authorized)||authorized.length!==2||new Set(authorized).size!==2||!authorized.includes(uid)||!Array.isArray(slots)||slots.length!==2)cthFail("TRANSFER_HISTORY_NOT_A_MANAGER");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!authorized.includes(slot.accountId))||ordered[0].accountId===ordered[1].accountId)cthFail("TRANSFER_HISTORY_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)cthFail("TRANSFER_HISTORY_NOT_A_MANAGER");
    return actor.slotId;
  }
  function cthVerifyWitness(data,rivalryId){
    let intent;
    try{intent=cthTerminal().verifyIntent(data.terminalClose);}catch(_error){cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");}
    const progress=data.terminalProgress;
    if(!cthPlain(progress)||Object.keys(progress).length!==PROGRESS_KEYS.length||PROGRESS_KEYS.some(key=>!Object.hasOwn(progress,key)))cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");
    if(intent.rivalryId!==rivalryId||progress.schemaVersion!==1||progress.runtimeRevision!=="1.9.1-r18"||progress.totalSeasons!==intent.totalSeasons||progress.acceptedThroughSeason!==progress.totalSeasons||!Number.isInteger(progress.closedSessionRevision)||progress.closedSessionRevision<1||!cthPlain(progress.managerTotals)||progress.managerTotals.playerOne!==intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==intent.managerTotals.playerTwo)cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");
    return intent.totalSeasons;
  }
  function cthAssertLedger(value,rivalryId,totalSeasons){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||value.totalSeasons!==totalSeasons)cthFail("TRANSFER_HISTORY_SETUP_INVALID");
    return value.coordinatorRole;
  }
  function cthRoleList(value){if(!Array.isArray(value)||value.length!==2||new Set(value).size!==2||!ROLES.every(role=>value.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");return value;}
  function cthAssertPublic(value,rivalryId,seasonNumber,coordinatorRole){
    cthExact(value,PUBLIC_KEYS,"TRANSFER_HISTORY_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==TRANSFER_RUNTIME||value.coordinatorRole!==coordinatorRole||value.phase!=="COMPLETED"||(value.revision!==6&&value.revision!==7)||!cthIsTimestamp(value.startedAt)||!cthIsTimestamp(value.endedAt))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    cthRoleList(value.guessLockedRoles);cthRoleList(value.signingLockedRoles);
    if(!Array.isArray(value.endRequestedRoles)||value.endRequestedRoles.length>2||value.endRequestedRoles.some(role=>!ROLES.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)cthFail("TRANSFER_HISTORY_SEASON_INVALID");}
    if(new Set(value.operationIds).size!==value.revision||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    if(value.operationTypes[0]!=="start-window"||value.actorRoles[0]!==coordinatorRole||value.operationTypes.slice(1).includes("start-window"))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    const locks={};
    for(const type of ["lock-guesses","lock-signings"]){
      for(const role of ROLES){
        const at=value.operationTypes.map((t,index)=>t===type&&value.actorRoles[index]===role?index:-1).filter(index=>index>=0);
        if(at.length!==1)cthFail("TRANSFER_HISTORY_SEASON_INVALID");
        locks[`${type}:${role}`]=at[0];
      }
    }
    if(value.operationTypes[value.revision-1]!=="lock-signings")cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    return locks;
  }
  function cthGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)cthFail("TRANSFER_HISTORY_SEASON_INVALID");const slots=new Set();
    return value.map(item=>{cthExact(item,["slot","type","valueId"],"TRANSFER_HISTORY_SEASON_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot)||(item.type!=="league"&&item.type!=="nationality")||!(item.type==="league"?catalog.leagueIds:catalog.nationalityIds).has(item.valueId))cthFail("TRANSFER_HISTORY_SEASON_INVALID");slots.add(item.slot);return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function cthSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)cthFail("TRANSFER_HISTORY_SEASON_INVALID");const slots=new Set();
    return value.map(item=>{cthExact(item,["slot","name","leagueId","nationalityId"],"TRANSFER_HISTORY_SEASON_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot)||typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))cthFail("TRANSFER_HISTORY_SEASON_INVALID");slots.add(item.slot);return {slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};}).sort((a,b)=>a.slot-b.slot);
  }
  function cthAssertRole(value,rivalryId,seasonNumber,role,catalog){
    cthExact(value,PRIVATE_KEYS,"TRANSFER_HISTORY_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||value.signings===null||!cthIsTimestamp(value.guessLockedAt)||!cthIsTimestamp(value.signingLockedAt))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    return {guesses:cthGuesses(value.guesses,catalog),signings:cthSignings(value.signings,catalog)};
  }
  // Provenance: each role's stored guesses and signings must hash to the operation that locked them on the public ledger.
  async function cthAssertProvenance(publicValue,locks,role,inputs,cryptoImpl){
    for(const [type,payload] of [["lock-guesses",{guesses:inputs.guesses}],["lock-signings",{signings:inputs.signings}]]){
      const index=locks[`${type}:${role}`];
      const hash=await cthDigest(cthSortedCanonical({actorRole:role,type,operationId:publicValue.operationIds[index],baseRevision:publicValue.baseRevisions[index],...payload}),cryptoImpl);
      if(hash!==publicValue.operationHashes[index])cthFail("TRANSFER_HISTORY_PROVENANCE_MISMATCH");
    }
  }
  // Same verdict as the transfer protocol: a signing is released when the rival guessed its league or nationality.
  function cthVerdict(own,rival){
    const signings=own.signings.map(signing=>{const matchedBy=rival.guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
    const released=signings.filter(signing=>signing.release).length;
    return {guesses:cthClone(own.guesses),signings,released,kept:signings.length-released};
  }

  async function cthRead(options={}){
    let rivalryId=null,managerRole=null;
    try{
      const sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")cthFail("TRANSFER_HISTORY_PROVIDER_UNAVAILABLE");
      const uid=options.user&&typeof options.user.uid==="string"?options.user.uid.trim():"";if(!uid)cthFail("TRANSFER_HISTORY_AUTH_REQUIRED");
      rivalryId=String(options.rivalryId||"").trim().toLowerCase();if(!RIVALRY_ID.test(rivalryId)){rivalryId=null;cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");}
      const value=await cthGet(sdk,db,["rivalries",rivalryId]);if(!value)cthFail("TRANSFER_HISTORY_RIVALRY_MISSING");
      managerRole=await cthVerifyRivalry(value,rivalryId,uid,cryptoImpl);
      const state=value.data.connectionState;
      // Live transfers stay with the session-bound provider (its own COMPLETED rule); nothing below the root is read here.
      if(state==="pending-pair"||state==="active")return cthState("not-closed",{rivalryId,managerRole});
      if(state!=="closed")cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");
      // Abandoned (closed without a Terminal Close witness): no transfer history at all, nothing else is read.
      if(!Object.hasOwn(value.data,"terminalClose"))return cthState("abandoned",{rivalryId,managerRole});
      const total=cthVerifyWitness(value.data,rivalryId);
      const catalog=cthCatalog();
      const coordinatorRole=cthAssertLedger(await cthGet(sdk,db,["rivalries",rivalryId,"sharedSetup","authoritative"]),rivalryId,total);
      const seasons=[];
      for(let seasonNumber=1;seasonNumber<=total;seasonNumber+=1){
        const transferId=`season_${seasonNumber}`;
        const publicValue=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId]);
        const p1=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId,"roles","playerOne"]);
        const p2=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId,"roles","playerTwo"]);
        // A gap is never a shorter history: any missing season makes the whole transfer history unavailable.
        if(!publicValue||!p1||!p2)cthFail("TRANSFER_HISTORY_SEASON_MISSING");
        const locks=cthAssertPublic(publicValue,rivalryId,seasonNumber,coordinatorRole);
        const inputs={playerOne:cthAssertRole(p1,rivalryId,seasonNumber,"playerOne",catalog),playerTwo:cthAssertRole(p2,rivalryId,seasonNumber,"playerTwo",catalog)};
        for(const role of ROLES)await cthAssertProvenance(publicValue,locks,role,inputs[role],cryptoImpl);
        seasons.push({season:seasonNumber,[MANAGER_KEY.playerOne]:cthVerdict(inputs.playerOne,inputs.playerTwo),[MANAGER_KEY.playerTwo]:cthVerdict(inputs.playerTwo,inputs.playerOne)});
      }
      return cthState("completed",{rivalryId,managerRole,transfers:{status:"ready",seasons}});
    }catch(error){
      // Unavailable is never drawn as empty or as 0 signings: seasons stay null.
      return cthState("unavailable",{rivalryId,managerRole,code:error&&typeof error.code==="string"&&error.code?error.code:"TRANSFER_HISTORY_READ_FAILED",transfers:{status:"unavailable",seasons:null}});
    }
  }

  return Object.freeze({contractVersion:1,feature:"cms-completed-transfer-history-reader",statuses:STATUSES,readCompletedTransferHistory:cthRead,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false,sourceAuthorityPaths:Object.freeze(["rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/transferChallenges/season_{N}","rivalries/{rivalryId}/transferChallenges/season_{N}/roles/{playerOne|playerTwo}"])});
});
````

### Appendix C. New emulator test: `tests/firebase/completed-transfer-history-emulator.cjs` (full file; ids in §6.2)

````js
"use strict";
// JOB-10 completed-only transfer history, against the COMPOSED production Rules
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
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const Catalog=require("../../js/sharedShowdownCatalog.js");
const CompletedReader=require("../../js/sparkCompletedShowdownReader.js");
// Loaded only for section P, so sections I0-F report on the Rules before the client exists (tests-first).
const loadReader=()=>require("../../js/sparkCompletedTransferHistoryReader.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-completed-transfer";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_daniel",B="acct_nik",C="acct_stranger",D="acct_inactive";
const X=`pair_${"a".repeat(64)}`,Y=`pair_${"b".repeat(64)}`,W=`pair_${"d".repeat(64)}`,Z=`pair_${"c".repeat(64)}`;
const SX=`session_${"a".repeat(64)}`,SY=`session_${"b".repeat(64)}`,SW=`session_${"d".repeat(64)}`,SZ=`session_${"c".repeat(64)}`;
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
// Daniel 5+1+5 = 11, Nik 0+3+1 = 4 (JOB-02 journey numbers).
function journeyResult(role,season){if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};}
// Season 1: Nik guesses Daniel's signing nationality (released). Season 2: two Nik signings, one released. Season 3: empty rows.
const INPUTS=[
  {guesses:{playerOne:[{slot:1,type:"league",valueId:"england-premier-league"}],playerTwo:[{slot:1,type:"league",valueId:"germany-bundesliga"},{slot:2,type:"nationality",valueId:"england"}]},signings:{playerOne:[{slot:1,name:"Daniel S1",leagueId:"spain-primera-division",nationalityId:"england"}],playerTwo:[{slot:1,name:"Nik S1",leagueId:"italy-serie-a",nationalityId:"brazil"}]}},
  {guesses:{playerOne:[{slot:1,type:"nationality",valueId:"brazil"}],playerTwo:[{slot:1,type:"league",valueId:"france-ligue-1"}]},signings:{playerOne:[{slot:1,name:"Daniel S2",leagueId:"germany-bundesliga",nationalityId:"france"}],playerTwo:[{slot:1,name:"Nik S2",leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:"Nik S2 B",leagueId:"italy-serie-a",nationalityId:"germany"}]}},
  {guesses:{playerOne:[],playerTwo:[]},signings:{playerOne:[],playerTwo:[]}}
];

async function seed(env,now){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();
  for(const [uid,id,seedChar,status] of [[A,DA,"a","active"],[B,DB,"b","active"],[C,DC,"c","active"],[D,DD,"d","deletion-requested"]]){await setDoc(doc(db,"accounts",uid),await account(uid,status));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seedChar));}
  for(const [id,sid] of [[X,SX],[Y,SY],[W,SW],[Z,SZ]]){await setDoc(doc(db,"rivalries",id),await rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",sid),await session(id,sid,now));}
});}
async function setPairLink(env,rivalryId){await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"accounts",A,"pairLinks","current"),await pairLink(A,rivalryId,"playerOne","daniel",DA));});}

// One Showdown through the real providers: setup + career start, then `seasons` scripted per season.
async function startShowdown(env,{rivalryId,sessionId,nowMs,totalSeasons,opBase}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t),n=k=>opBase+k;
  for(const [type,baseRevision,k,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons}]]){const v=await Setup.mutate({...a(k*10),type,baseRevision,operationId:op("setup_op_",n(k)),...extra});assert.equal(v.ok,true,`setup ${type}: ${JSON.stringify(v)}`);}
  let v=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",n(5))});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",n(6))});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"SHOWDOWN_CONFIRMED");
  const teamCount=Catalog.catalog[v.state.leagueId].length;
  v=await Career.acknowledge({...a(70),operationId:op("career_start_op_",n(1)),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Career.acknowledge({...b(80),operationId:op("career_start_op_",n(2)),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  return {dbA,dbB,a,b,n,teamCount,rivalryId,sessionId};
}
const STOP={COMPLETED:7,DANIEL_SIGNED:6};
async function transferSeason(game,season,inputs,stopAfter=STOP.COMPLETED){
  const {a,b,n}=game,t=season*10000,k=x=>n(season*10+x);
  const steps=[
    ()=>Transfer.startWindow({...a(t+100),seasonNumber:season,operationId:op("transfer_op_",k(1)),baseRevision:0}),
    ()=>Transfer.requestEndWindow({...a(t+200),seasonNumber:season,operationId:op("transfer_op_",k(2)),baseRevision:1}),
    ()=>Transfer.requestEndWindow({...b(t+300),seasonNumber:season,operationId:op("transfer_op_",k(3)),baseRevision:2}),
    ()=>Transfer.lockGuesses({...a(t+400),seasonNumber:season,operationId:op("transfer_op_",k(4)),baseRevision:3,guesses:inputs.guesses.playerOne}),
    ()=>Transfer.lockGuesses({...b(t+500),seasonNumber:season,operationId:op("transfer_op_",k(5)),baseRevision:4,guesses:inputs.guesses.playerTwo}),
    ()=>Transfer.lockSignings({...a(t+600),seasonNumber:season,operationId:op("transfer_op_",k(6)),baseRevision:5,signings:inputs.signings.playerOne}),
    ()=>Transfer.lockSignings({...b(t+700),seasonNumber:season,operationId:op("transfer_op_",k(7)),baseRevision:6,signings:inputs.signings.playerTwo})
  ];
  let v;for(let i=0;i<stopAfter;i+=1){v=await steps[i]();assert.equal(v.ok,true,`S${season} transfer step ${i+1}: ${JSON.stringify(v)}`);}
  if(stopAfter===STOP.COMPLETED)assert.equal(v.state.phase,"COMPLETED");
  return v;
}
async function seasonResults(game,season,{danielOnly=false}={}){
  const {a,b,n}=game,t=season*10000,k=x=>n(season*10+x);
  let v=await Results.publishResult({...a(t+800),seasonNumber:season,operationId:op("season_result_op_",k(1)),baseRevision:0,result:journeyResult("playerOne",season)});assert.equal(v.ok,true,JSON.stringify(v));
  if(danielOnly)return;
  v=await Results.publishResult({...b(t+900),seasonNumber:season,operationId:op("season_result_op_",k(2)),baseRevision:1,result:journeyResult("playerTwo",season)});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"RESULTS_READY");
  v=await Commit.commitSeason({...a(t+1000),seasonNumber:season,operationId:op("season_commit_op_",k(1)),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...b(t+1100),seasonNumber:season,operationId:op("season_commit_op_",k(2)),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...a(t+1200),seasonNumber:season,operationId:op("season_commit_op_",k(3)),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.phase,"ACKNOWLEDGED");
  const scored=await Scoring.read({...a(t+1300),seasonNumber:season,teamCount:game.teamCount});assert.equal(scored.ok,true,JSON.stringify(scored));
}
async function abandonAsDaniel(env,rivalryId){
  await setPairLink(env,rivalryId);
  const db=env.authenticatedContext(A).firestore(),before=(await getDoc(doc(db,"rivalries",rivalryId))).data();
  const after=await envelope("rivalry",rivalryId,before.revision+1,{...before.data,connectionState:"closed"},{accountId:A,deviceId:DA,priorHash:before.contentHash});
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
// Seeds transferChallenges/season_k under a forged (correctly witnessed) root from X's real season_k ledger, then mutates it.
async function forgeChallenge(env,id,seasonNumber,mutate,{fromSeason=seasonNumber}={}){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X,"transferChallenges",`season_${fromSeason}`))).data();
    const value={...real,rivalryId:id,seasonNumber};if(mutate)mutate(value);
    await setDoc(doc(db,"rivalries",id,"transferChallenges",`season_${seasonNumber}`),value);
  });
}

async function run(env){
  const now=Date.now();
  await seed(env,now);
  const anon=env.unauthenticatedContext().firestore();
  const dbC=env.authenticatedContext(C).firestore();

  // X: 3 seasons, transfers varied per season, closed by a real Terminal Close. Session-bound verdicts captured before close.
  const gx=await startShowdown(env,{rivalryId:X,sessionId:SX,nowMs:now,totalSeasons:3,opBase:0});
  const sessionVerdicts=[];let history=null,multi=null;
  for(let season=1;season<=3;season+=1){
    await transferSeason(gx,season,INPUTS[season-1]);
    const ta=await Transfer.read({...gx.a(season*10000+750),seasonNumber:season}),tb=await Transfer.read({...gx.b(season*10000+750),seasonNumber:season});
    assert.equal(ta.ok,true,JSON.stringify(ta));assert.deepEqual(ta.verdicts,tb.verdicts);sessionVerdicts.push(ta.verdicts);
    await seasonResults(gx,season);
    history=await History.read({...gx.a(season*10000+1400),throughSeason:season});assert.equal(history.ok,true,JSON.stringify(history));
    multi=await Multi.read(gx.a(season*10000+1500));assert.equal(multi.ok,true,JSON.stringify(multi));
  }
  const final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
  const closed=await TerminalProvider.close({...gx.a(32000),intent:Terminal.prepare(final,{sessionId:SX})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");

  // Y: 1 season, transfer COMPLETED and Daniel's result published, then abandoned. While active, Nik could read Daniel's COMPLETED role.
  const gy=await startShowdown(env,{rivalryId:Y,sessionId:SY,nowMs:now+1000,totalSeasons:1,opBase:1000});
  await transferSeason(gy,1,INPUTS[0]);await seasonResults(gy,1,{danielOnly:true});
  await assertSucceeds(getDoc(doc(gy.dbB,"rivalries",Y,"transferChallenges","season_1","roles","playerOne")));
  await abandonAsDaniel(env,Y);
  // W: 1 season, abandoned during SIGNING_ENTRY after Daniel locked his signings (unfinished challenge).
  const gw=await startShowdown(env,{rivalryId:W,sessionId:SW,nowMs:now+2000,totalSeasons:1,opBase:2000});
  const signed=await transferSeason(gw,1,INPUTS[1],STOP.DANIEL_SIGNED);assert.equal(signed.state.phase,"SIGNING_ENTRY");
  await abandonAsDaniel(env,W);
  // Z: 3 seasons, active. Season 1 acknowledged; season 2 transfer in SIGNING_ENTRY with Daniel's signings locked.
  const gz=await startShowdown(env,{rivalryId:Z,sessionId:SZ,nowMs:now+3000,totalSeasons:3,opBase:3000});
  await transferSeason(gz,1,INPUTS[0]);await seasonResults(gz,1);
  const zSigned=await transferSeason(gz,2,INPUTS[1],STOP.DANIEL_SIGNED);assert.equal(zSigned.state.phase,"SIGNING_ENTRY");
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const T=(db,id,k,role)=>role?doc(db,"rivalries",id,"transferChallenges",`season_${k}`,"roles",role):doc(db,"rivalries",id,"transferChallenges",`season_${k}`);

  await check("I0","composed Rules carry the transfer grant on exactly the challenge get and the COMPLETED-gated role get",async()=>{
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, transferId\);/g)||[]).length,1);
    assert.match(RULES,/allow get: if ssjrTransferPrivateReadable\(rivalryId, transferId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedTransferRoleReadable\(rivalryId, transferId\)\);/);
    assert.ok(RULES.includes("function cmsCompletedTransferRoleReadable(rivalryId, transferId)"));
    assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(RULES),false);
    for(const marker of ["match /accounts/{accountId}/pairLinks/{pairId}","match /accounts/{accountId}/careerIndex/{indexId}","function cmsCompletedSeasonReadable(rivalryId, seasonId)","function ssjrTransferPrivateReadable(rivalryId, transferId, managerRole)"])assert.ok(RULES.includes(marker),marker);
  });

  // A. Completed Showdown X: both managers read the finished transfer history without a session.
  await check("A1","Daniel reads X season_1 challenge with no live session (X session is closed)",async()=>{
    let sessionState;await env.withSecurityRulesDisabled(async context=>{sessionState=(await getDoc(doc(context.firestore(),"rivalries",X,"sessions",SX))).data().data.state;});
    assert.equal(sessionState,"closed");
    const snap=await assertSucceeds(getDoc(T(dbA,X,1)));assert.equal(snap.data().phase,"COMPLETED");
  });
  await check("A2","Nik reads X season_3 challenge",async()=>{await assertSucceeds(getDoc(T(dbB,X,3)));});
  await check("A3","Daniel reads Nik's X season_1 transfer role (COMPLETED)",async()=>{const snap=await assertSucceeds(getDoc(T(dbA,X,1,"playerTwo")));assert.equal(snap.data().signings[0].name,"Nik S1");});
  await check("A4","Nik reads Daniel's X season_1 transfer role",async()=>{await assertSucceeds(getDoc(T(dbB,X,1,"playerOne")));});
  await check("A5","Daniel reads his own X season_2 transfer role",async()=>{await assertSucceeds(getDoc(T(dbA,X,2,"playerOne")));});
  await check("A6","Nik reads Daniel's X season_3 transfer role (empty rows)",async()=>{const snap=await assertSucceeds(getDoc(T(dbB,X,3,"playerOne")));assert.deepEqual(snap.data().signings,[]);});

  // B. Still denied on the completed Showdown.
  await check("B1","stranger cannot read X season_1 challenge",async()=>{await assertFails(getDoc(T(dbC,X,1)));});
  await check("B2","stranger cannot read Nik's X season_1 role",async()=>{await assertFails(getDoc(T(dbC,X,1,"playerTwo")));});
  await check("B3","unauthenticated read of an X transfer role is denied",async()=>{await assertFails(getDoc(T(anon,X,1,"playerOne")));});
  await check("B4","season_4 challenge of a 3-season Showdown is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,4)));});
  await check("B5","season_4 role of a 3-season Showdown is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,4,"playerTwo")));});
  await check("B6","malformed id transferChallenges/season_01 is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_01")));});
  await check("B7","unknown role id playerThree is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,1,"playerThree")));});
  await check("B8","listing X transfer challenges is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"transferChallenges")));});
  await check("B9","listing X season_1 transfer roles is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"transferChallenges","season_1","roles")));});
  await check("B10","an unmatched draft path under the challenge is denied",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1","drafts","playerTwo")));});
  await check("B11","X career start stays outside every completed grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"careerStart","authoritative")));});
  await check("B12","X league projection stays outside every completed grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"sharedSetup","leagueProjection")));});

  // C. Closed transfer writes stay denied.
  let stored;await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();stored={challenge:(await getDoc(T(db,X,1))).data(),role:(await getDoc(T(db,X,1,"playerTwo"))).data()};});
  await check("C1","Daniel cannot update X season_1 challenge",async()=>{await assertFails(setDoc(T(dbA,X,1),{...stored.challenge,revision:8}));});
  await check("C2","Nik cannot rewrite his X season_1 role",async()=>{await assertFails(setDoc(T(dbB,X,1,"playerTwo"),{...stored.role,signings:[]}));});
  await check("C3","Daniel cannot create X season_4 challenge",async()=>{await assertFails(setDoc(T(dbA,X,4),{...stored.challenge,seasonNumber:4}));});
  await check("C4","Daniel cannot delete X season_1 challenge",async()=>{await assertFails(deleteDoc(T(dbA,X,1)));});
  await check("C5","Nik cannot delete Daniel's X season_2 role",async()=>{await assertFails(deleteDoc(T(dbB,X,2,"playerOne")));});

  // D. Abandoned Showdowns (closed without Terminal Close): no transfer history, finished or unfinished.
  await check("D1","Daniel cannot read abandoned Y season_1 challenge",async()=>{await assertFails(getDoc(T(dbA,Y,1)));});
  await check("D2","Nik cannot read Daniel's COMPLETED Y role after abandon (it was readable while active)",async()=>{await assertFails(getDoc(T(dbB,Y,1,"playerOne")));});
  await check("D3","Daniel cannot read his own Y role after abandon",async()=>{await assertFails(getDoc(T(dbA,Y,1,"playerOne")));});
  await check("D4","Nik cannot read Daniel's unfinished W role (SIGNING_ENTRY, Daniel signed)",async()=>{await assertFails(getDoc(T(dbB,W,1,"playerOne")));});
  await check("D5","Daniel cannot read his own W role after abandon",async()=>{await assertFails(getDoc(T(dbA,W,1,"playerOne")));});
  await check("D6","Daniel cannot read abandoned W challenge",async()=>{await assertFails(getDoc(T(dbA,W,1)));});
  await check("D7","Daniel still reads the Y root (History status row): closed, no terminalClose",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",Y)));assert.equal(snap.data().data.connectionState,"closed");assert.equal(Object.hasOwn(snap.data().data,"terminalClose"),false);});

  // E. Forged or partial terminal witnesses (roots seeded with Rules disabled; children absent, so an allowed get returns not-found).
  await forge(env,forgedId(0),()=>{});
  await forge(env,forgedId(1),data=>{delete data.terminalClose;});
  await forge(env,forgedId(2),data=>{data.terminalClose.winner=data.terminalClose.winner==="playerOne"?"playerTwo":"playerOne";});
  await forge(env,forgedId(3),data=>{data.terminalProgress.closedSessionRevision=null;});
  await forge(env,forgedId(4),data=>{data.terminalProgress.acceptedThroughSeason=2;});
  await forge(env,forgedId(5),data=>{data.terminalProgress.managerTotals={...data.terminalProgress.managerTotals,playerTwo:data.terminalProgress.managerTotals.playerTwo+1};});
  await forge(env,forgedId(6),data=>{data.terminalClose.rivalryId=X;});
  await forge(env,forgedId(7),data=>{data.terminalClose.extra=true;});
  await forge(env,forgedId(8),(data,tools)=>{tools.setLifecycle("tombstoned");});
  await forge(env,forgedId(9),data=>{data.authorizedAccountIds=[A,D];data.managerSlots=[data.managerSlots[0],{...data.managerSlots[1],accountId:D,profileId:PD,saveId:SD}];});
  await forge(env,forgedId(10),data=>{delete data.terminalProgress;});
  const dbD=env.authenticatedContext(D).firestore();
  await check("E0","control: a correctly witnessed forged copy grants the challenge get (keyed on the witness)",async()=>{await assertSucceeds(getDoc(T(dbA,forgedId(0),1)));});
  await check("E1","closed with terminalProgress but no terminalClose is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(1),1)));});
  await check("E2","witness whose winner contradicts its totals is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(2),1)));});
  await check("E3","witness without a closed session revision is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(3),1)));});
  await check("E4","witness with fewer accepted seasons than configured is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(4),1)));});
  await check("E5","intent totals that differ from progress totals are denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(5),1)));});
  await check("E6","witness naming another rivalry is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(6),1)));});
  await check("E7","witness with an extra key is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(7),1)));});
  await check("E8","tombstoned root is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(8),1)));});
  await check("E9","member whose account is not active is denied",async()=>{await assertFails(getDoc(T(dbD,forgedId(9),1)));});
  await check("E10","closed with terminalClose but no terminalProgress is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(10),1)));});

  // G. Forged challenge states under correctly witnessed roots: a role needs a publicly COMPLETED challenge of that exact season.
  const G1=forgedId(20),G2=forgedId(21),G3=forgedId(22);
  for(const id of [G1,G2,G3])await forge(env,id,()=>{});
  await forgeChallenge(env,G1,1);
  await forgeChallenge(env,G1,2,v=>{v.phase="SIGNING_ENTRY";v.signingLockedRoles=["playerOne"];});
  await forgeChallenge(env,G1,3,v=>{v.signingLockedRoles=["playerOne"];});
  await forgeChallenge(env,G1,4,null,{fromSeason:1});
  await forgeChallenge(env,G2,1,v=>{v.guessLockedRoles=["playerTwo"];});
  await forgeChallenge(env,G2,2,v=>{v.rivalryId=X;});
  await forgeChallenge(env,G2,3,v=>{v.seasonNumber=2;});
  await forgeChallenge(env,G3,1,v=>{v.objectType="sharedTransferChallengeRole";});
  await forgeChallenge(env,G3,3,v=>{v.schemaVersion=2;});
  await check("G0","control: COMPLETED challenge under a witnessed root grants the role get",async()=>{await assertSucceeds(getDoc(T(dbA,G1,1,"playerTwo")));});
  await check("G1","challenge in SIGNING_ENTRY: rival role denied",async()=>{await assertFails(getDoc(T(dbA,G1,2,"playerTwo")));});
  await check("G2","challenge in SIGNING_ENTRY: own role denied after close too",async()=>{await assertFails(getDoc(T(dbA,G1,2,"playerOne")));});
  await check("G3","COMPLETED but only one signing locked: denied",async()=>{await assertFails(getDoc(T(dbA,G1,3,"playerTwo")));});
  await check("G4","season_4 of a 3-season Showdown, even if a COMPLETED challenge exists: denied",async()=>{await assertFails(getDoc(T(dbA,G1,4,"playerTwo")));});
  await check("G5","COMPLETED but only one guess locked: denied",async()=>{await assertFails(getDoc(T(dbA,G2,1,"playerTwo")));});
  await check("G6","challenge naming another rivalry: denied",async()=>{await assertFails(getDoc(T(dbA,G2,2,"playerTwo")));});
  await check("G7","challenge whose seasonNumber differs from its id: denied",async()=>{await assertFails(getDoc(T(dbA,G2,3,"playerTwo")));});
  await check("G8","challenge with the wrong objectType: denied",async()=>{await assertFails(getDoc(T(dbA,G3,1,"playerTwo")));});
  await check("G9","no challenge document for the season: role denied",async()=>{await assertFails(getDoc(T(dbA,G3,2,"playerTwo")));});
  await check("G10","challenge with an unknown schemaVersion: denied",async()=>{await assertFails(getDoc(T(dbA,G3,3,"playerTwo")));});
  await check("G11","non-canonical role id on a COMPLETED challenge: denied",async()=>{await assertFails(getDoc(T(dbA,G1,1,"playerone")));});

  // F. Active Showdown Z regressions: the existing COMPLETED condition and privacy are unchanged.
  await check("F1","Daniel reads active Z season_1 challenge (existing rule)",async()=>{await assertSucceeds(getDoc(T(dbA,Z,1)));});
  await check("F2","Nik reads Daniel's COMPLETED Z season_1 role (existing rule)",async()=>{await assertSucceeds(getDoc(T(dbB,Z,1,"playerOne")));});
  await check("F3","Nik cannot read Daniel's unfinished Z season_2 role (SIGNING_ENTRY)",async()=>{await assertFails(getDoc(T(dbB,Z,2,"playerOne")));});
  await check("F4","Daniel reads his own Z season_2 role",async()=>{await assertSucceeds(getDoc(T(dbA,Z,2,"playerOne")));});
  await check("F5","Daniel cannot read Nik's unfinished Z season_2 role",async()=>{await assertFails(getDoc(T(dbA,Z,2,"playerTwo")));});
  await check("F6","stranger cannot read a Z transfer role",async()=>{await assertFails(getDoc(T(dbC,Z,1,"playerOne")));});

  // P. Session-free transfer history reader.
  const Reader=loadReader();
  const read=(db,uid,id,counter)=>Reader.readCompletedTransferHistory({firestore:db,firebaseSdk:readerSdk(counter),user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
  let danielX,danielReads={reads:0},untampered=null;
  await check("P1","Daniel's reader: X completed, 3 seasons keyed daniel/nik, ready",async()=>{
    danielX=await read(dbA,A,X,danielReads);
    assert.equal(danielX.status,"completed",JSON.stringify(danielX));assert.equal(danielX.code,null);assert.equal(danielX.managerRole,"playerOne");assert.equal(Object.isFrozen(danielX),true);
    assert.equal(danielX.transfers.status,"ready");assert.deepEqual(danielX.transfers.seasons.map(s=>s.season),[1,2,3]);
    assert.deepEqual(Object.keys(danielX.transfers.seasons[0]),["season","daniel","nik"]);
    assert.equal(danielX.transfers.seasons[0].daniel.released,1);assert.equal(danielX.transfers.seasons[1].nik.released,1);assert.equal(danielX.transfers.seasons[1].nik.kept,1);
    assert.deepEqual(danielX.transfers.seasons[2].nik,{guesses:[],signings:[],released:0,kept:0});
  });
  await check("P2","Nik's reader returns the identical history",async()=>{const nikX=await read(dbB,B,X);assert.equal(nikX.status,"completed");assert.equal(nikX.managerRole,"playerTwo");assert.deepEqual(nikX.transfers,danielX.transfers);});
  await check("P3","fresh authenticated client, no session or device input: identical history",async()=>{const again=await read(env.authenticatedContext(A).firestore(),A,X);assert.deepEqual(again.transfers,danielX.transfers);});
  await check("P4","verdicts equal the session-bound provider's verdicts taken before close, every season",async()=>{
    for(let k=1;k<=3;k+=1){const season=danielX.transfers.seasons[k-1],v=sessionVerdicts[k-1];assert.deepEqual(JSON.parse(JSON.stringify(season.daniel.signings)),JSON.parse(JSON.stringify(v.playerOne)),`S${k} Daniel`);assert.deepEqual(JSON.parse(JSON.stringify(season.nik.signings)),JSON.parse(JSON.stringify(v.playerTwo)),`S${k} Nik`);}
  });
  await check("P5","exact gets: 2 + 3N = 11 for a 3-season Showdown",async()=>{assert.equal(danielReads.reads,11);});
  await check("P6","abandoned Y: status only, no transfers, exactly one read",async()=>{const c={reads:0};const y=await read(dbB,B,Y,c);assert.equal(y.status,"abandoned");assert.equal(y.transfers,null);assert.equal(c.reads,1);});
  await check("P7","abandoned W (unfinished challenge): status only, exactly one read",async()=>{const c={reads:0};const w=await read(dbB,B,W,c);assert.equal(w.status,"abandoned");assert.equal(w.transfers,null);assert.equal(c.reads,1);});
  await check("P8","active Z: not-closed, exactly one read",async()=>{const c={reads:0};const z=await read(dbA,A,Z,c);assert.equal(z.status,"not-closed");assert.equal(z.transfers,null);assert.equal(c.reads,1);});
  await check("P9","stranger: unavailable with the Firestore denial code, never empty",async()=>{const s=await read(dbC,C,X);assert.equal(s.status,"unavailable");assert.equal(s.code,"permission-denied");assert.deepEqual(s.transfers,{status:"unavailable",seasons:null});});
  await check("P10","forged winner witness: unavailable before any child read",async()=>{const c={reads:0};const f=await read(dbA,A,forgedId(2),c);assert.equal(f.code,"TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");assert.equal(c.reads,1);});
  await check("P11","a signing edited after lock: unavailable (provenance), never a partial list",async()=>{
    await env.withSecurityRulesDisabled(async context=>{const ref=T(context.firestore(),X,2,"playerTwo"),value=(await getDoc(ref)).data();untampered=value;await setDoc(ref,{...value,signings:value.signings.map(s=>s.slot===1?{...s,name:"Someone else"}:s)});});
    const t=await read(dbA,A,X);assert.equal(t.status,"unavailable");assert.equal(t.code,"TRANSFER_HISTORY_PROVENANCE_MISMATCH");assert.deepEqual(t.transfers,{status:"unavailable",seasons:null});
  });
  await check("P12","separate availability: the completed-only reader still returns X completed while transfers are unavailable",async()=>{const c=await CompletedReader.readCompletedShowdown({firestore:dbA,firebaseSdk:firestoreSdk,user:{uid:A},rivalryId:X,cryptoImpl:crypto.webcrypto});assert.equal(c.status,"completed",JSON.stringify(c));assert.deepEqual(c.final.totals,{playerOne:11,playerTwo:4});});
  await check("P13","a missing season_3 role makes the history unavailable, never shorter",async()=>{
    // Restore the P11 edit first, so the only fault left is the missing season_3 role.
    await env.withSecurityRulesDisabled(async context=>{await setDoc(T(context.firestore(),X,2,"playerTwo"),untampered);await deleteDoc(T(context.firestore(),X,3,"playerOne"));});
    const m=await read(dbB,B,X);assert.equal(m.status,"unavailable");assert.equal(m.code,"TRANSFER_HISTORY_SEASON_MISSING");assert.deepEqual(m.transfers,{status:"unavailable",seasons:null});
  });
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();await run(env);assert.equal(checks,73);process.stdout.write(`PASS completed-only transfer history emulator: ${checks} numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, G forged challenge states, F active regressions, P session-free reader).\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});
````

### Appendix D. New contract test: `tests/contracts/completed-transfer-history-contracts.cjs` (full file; K ids in §6.1 map to its numbered blocks)

````js
'use strict';
// JOB-10 completed-only transfer history contracts. Plain node:assert, no Firebase, no emulator.
// Fixtures are produced by the real transfer protocol (js/sharedTransferChallenge.js), then stored the way
// js/sparkSharedTransferChallenge.js stores them (public ledger + one private role document per manager).
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
global.window=globalThis;
require(path.join(root,'data/transferOptions.js'));
const Reader=require(path.join(root,'js/sparkCompletedTransferHistoryReader.js'));
const CompletedReader=require(path.join(root,'js/sparkCompletedShowdownReader.js'));
const TransferProtocol=require(path.join(root,'js/sharedTransferChallenge.js'));

const A='acct_daniel',B='acct_nik',C='acct_stranger';
const RID=`pair_${'a'.repeat(64)}`;
const SESSION=`session_${'a'.repeat(64)}`,DEVICE=`device_${'a'.repeat(32)}`;
const ts=ms=>({toMillis:()=>ms});
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==='function')return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function sha(value){return 'sha256:'+crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function rivalryDoc(data,{id=RID,revision=4}={}){return {schemaVersion:1,objectType:'rivalry',objectId:id,revision,parentRevision:revision-1,lifecycleState:'live',contentHash:sha({objectType:'rivalry',objectId:id,revision,data}),priorContentHash:`sha256:${'0'.repeat(64)}`,updatedAt:ts(1),updatedByAccountId:A,updatedByDeviceId:DEVICE,data,tombstone:null};}
const slots=[{slotId:'playerOne',accountId:A,profileId:`profile_${'1'.repeat(24)}`,saveId:`save_${'3'.repeat(24)}`,displayLabel:'Daniel',entitlementState:'active',deletionConsent:false},{slotId:'playerTwo',accountId:B,profileId:`profile_${'2'.repeat(24)}`,saveId:`save_${'4'.repeat(24)}`,displayLabel:'Nik',entitlementState:'active',deletionConsent:false}];
const baseData=state=>({connectionState:state,connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:ts(1)});
const intent=(total,over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',phase:'TERMINAL_CLOSE_READY',rivalryId:RID,sessionId:SESSION,totalSeasons:total,completedSeason:total,managerTotals:{playerOne:5,playerTwo:0},winner:'playerOne',terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:'closed',sessionTargetState:'closed',terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false,...over});
const progress=(total,over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons:total,acceptedThroughSeason:total,managerTotals:{playerOne:5,playerTwo:0},closedSessionRevision:3,...over});
const ledger=(total,over={})=>({schemaVersion:1,objectType:'sharedSetupLedger',rivalryId:RID,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',operationIds:[],operationTypes:[],baseRevisions:[],actorRoles:[],totalSeasons:total,confirmedRoles:['playerOne','playerTwo'],activeSessionId:SESSION,updatedAt:ts(1),updatedByDeviceId:DEVICE,...over});
const leagueIds=window.FIFA17_TRANSFER_LEAGUES.map(item=>item.id),nationalityIds=window.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);
const opId=n=>`transfer_op_${n.toString(16).padStart(32,'0')}`;
// Season inputs: season 1 Daniel's signing is guessed by Nik (released); season 3 has empty rows.
const SEASON_INPUTS=[
  {guesses:{playerOne:[{slot:1,type:'league',valueId:'england-premier-league'}],playerTwo:[{slot:2,type:'nationality',valueId:'england'},{slot:1,type:'league',valueId:'germany-bundesliga'}]},signings:{playerOne:[{slot:1,name:'Daniel S1',leagueId:'spain-primera-division',nationalityId:'england'}],playerTwo:[{slot:1,name:'Nik S1',leagueId:'italy-serie-a',nationalityId:'brazil'}]}},
  {guesses:{playerOne:[{slot:1,type:'nationality',valueId:'brazil'}],playerTwo:[{slot:1,type:'league',valueId:'france-ligue-1'}]},signings:{playerOne:[{slot:1,name:'Daniel S2',leagueId:'germany-bundesliga',nationalityId:'france'}],playerTwo:[{slot:1,name:'Nik S2',leagueId:'england-premier-league',nationalityId:'brazil'},{slot:2,name:'Nik S2 B',leagueId:'italy-serie-a',nationalityId:'germany'}]}},
  {guesses:{playerOne:[],playerTwo:[]},signings:{playerOne:[],playerTwo:[]}}
];

async function playSeason(protocol,seasonNumber,inputs){
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Chelsea'}};
  const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
  let state=null,n=seasonNumber*100,now=1000*seasonNumber;
  const step=async(actorRole,command)=>{const applied=await protocol.apply({state,setup,careerStart,seasonNumber,actorRole,command:{...command,operationId:opId(++n),baseRevision:state?state.revision:0},nowEpochMs:now+=10});state=applied.state;};
  await step('playerOne',{type:'start-window'});
  await step('playerOne',{type:'request-end-window'});await step('playerTwo',{type:'request-end-window'});
  await step('playerOne',{type:'lock-guesses',guesses:inputs.guesses.playerOne});await step('playerTwo',{type:'lock-guesses',guesses:inputs.guesses.playerTwo});
  await step('playerOne',{type:'lock-signings',signings:inputs.signings.playerOne});await step('playerTwo',{type:'lock-signings',signings:inputs.signings.playerTwo});
  assert.equal(state.phase,'COMPLETED');
  return state;
}
// Stored shape of js/sparkSharedTransferChallenge.js (stspPublicLedger / stspPrivateLedger).
function storedPublic(state){const r=state.receipts;return {schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId:RID,seasonNumber:state.seasonNumber,runtimeRevision:'1.9.1-r8',coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt:ts(state.startedAtEpochMs),endedAt:ts(state.endedAtEpochMs),endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:r.map(x=>x.operationId),operationTypes:r.map(x=>x.type),operationHashes:r.map(x=>x.commandHash),baseRevisions:r.map(x=>x.baseRevision),actorRoles:r.map(x=>x.actorRole),activeSessionId:SESSION,updatedAt:ts(9),updatedByDeviceId:DEVICE};}
function storedRole(state,role){const input=state.inputs[role];return {schemaVersion:1,objectType:'sharedTransferChallengeRole',rivalryId:RID,seasonNumber:state.seasonNumber,managerRole:role,guesses:JSON.parse(JSON.stringify(input.guesses)),signings:JSON.parse(JSON.stringify(input.signings)),guessLockedAt:ts(5),signingLockedAt:ts(7),activeSessionId:SESSION,updatedAt:ts(7),updatedByDeviceId:DEVICE};}

function fakeSdk(docs,{deny=new Set()}={}){
  const log=[];
  return {log,sdk:{
    doc:(_db,...parts)=>({path:parts.join('/')}),
    getDoc:async ref=>{log.push(ref.path);if(deny.has(ref.path)){const e=new Error('denied');e.code='permission-denied';throw e;}const value=docs[ref.path];return {exists:()=>value!==undefined,data:()=>value};}
  }};
}
const readWith=(docs,opts={},uid=A)=>{const f=fakeSdk(docs,opts);return Reader.readCompletedTransferHistory({firestore:{},firebaseSdk:f.sdk,user:{uid},rivalryId:RID,cryptoImpl:crypto.webcrypto}).then(r=>({r,log:f.log}));};
const P0=`rivalries/${RID}`;
const clone=value=>JSON.parse(JSON.stringify(value,(k,v)=>v));
function cloneDocs(docs){const out={};for(const [k,v] of Object.entries(docs)){out[k]=structuredCloneWithTs(v);}return out;}
function structuredCloneWithTs(value){if(value&&typeof value.toMillis==='function')return ts(value.toMillis());if(Array.isArray(value))return value.map(structuredCloneWithTs);if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=structuredCloneWithTs(v);return out;}return value;}

(async()=>{
  const protocol=await TransferProtocol.createProtocol({leagueIds,nationalityIds,cryptoImpl:crypto.webcrypto});
  const states=[];for(let k=1;k<=3;k+=1)states.push(await playSeason(protocol,k,SEASON_INPUTS[k-1]));
  const completedDocs=total=>{const docs={[P0]:rivalryDoc({...baseData('closed'),terminalClose:intent(total),terminalProgress:progress(total)}),[`${P0}/sharedSetup/authoritative`]:ledger(total)};for(let k=1;k<=total;k+=1){const s=states[k-1],t=`${P0}/transferChallenges/season_${k}`;docs[t]=storedPublic(s);docs[`${t}/roles/playerOne`]=storedRole(s,'playerOne');docs[`${t}/roles/playerTwo`]=storedRole(s,'playerTwo');}return docs;};

  // K1. API surface and safety flags
  assert.equal(typeof Reader.readCompletedTransferHistory,'function');
  assert.deepEqual([...Reader.statuses],['completed','abandoned','not-closed','unavailable']);
  for(const [k,v] of Object.entries({sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false}))assert.equal(Reader[k],v,k);
  assert.equal(Reader.contractVersion,1);assert.equal(Object.isFrozen(Reader),true);

  // K2. Reader source: exact gets only; no session, transaction, list, write, listener or browser storage
  const src=read('js/sparkCompletedTransferHistoryReader.js');
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/listDocuments/,/setDoc|updateDoc|deleteDoc|\.set\(|\.update\(|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/onSnapshot/,/getAfter/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/sdk\.getDoc\(sdk\.doc\(/);
  assert.equal((src.match(/function\s+(?!cth)[A-Za-z_$][\w$]*\s*\(/g)||[]).length,0,'every named function starts with cth (static release contract: unique names across js/)');

  // K3. Never throws; bad input is unavailable, frozen, with a code; transfers never empty
  for(const bad of [undefined,{},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},user:{uid:A},rivalryId:'nope'},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},rivalryId:RID}]){
    const r=await Reader.readCompletedTransferHistory(bad);assert.equal(r.status,'unavailable');assert.ok(r.code);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null});assert.equal(Object.isFrozen(r),true);
  }

  // K4. Classification from the root alone: live and abandoned Showdowns read nothing below the root
  for(const state of ['active','pending-pair']){const {r,log}=await readWith({[P0]:rivalryDoc(baseData(state))});assert.equal(r.status,'not-closed',state);assert.deepEqual(log,[P0]);assert.equal(r.transfers,null);}
  {const {r,log}=await readWith({[P0]:rivalryDoc(baseData('closed'))},{},B);assert.equal(r.status,'abandoned');assert.equal(r.managerRole,'playerTwo');assert.deepEqual(log,[P0]);assert.equal(r.transfers,null);}
  {const {r,log}=await readWith({[P0]:rivalryDoc({...baseData('closed'),terminalProgress:progress(1,{closedSessionRevision:null})})});assert.equal(r.status,'abandoned');assert.deepEqual(log,[P0]);}

  // K5. Forged witnesses fail before any child read
  for(const [label,extra] of [
    ['winner contradicts totals',{terminalClose:intent(1,{winner:'draw'}),terminalProgress:progress(1)}],
    ['no closed session revision',{terminalClose:intent(1),terminalProgress:progress(1,{closedSessionRevision:null})}],
    ['accepted < total',{terminalClose:intent(3),terminalProgress:progress(3,{acceptedThroughSeason:2})}],
    ['totals differ',{terminalClose:intent(1),terminalProgress:progress(1,{managerTotals:{playerOne:4,playerTwo:0}})}],
    ['other rivalry',{terminalClose:intent(1,{rivalryId:`pair_${'b'.repeat(64)}`}),terminalProgress:progress(1)}],
    ['extra progress key',{terminalClose:intent(1),terminalProgress:{...progress(1),extra:1}}],
    ['missing progress',{terminalClose:intent(1)}]
  ]){const {r,log}=await readWith({[P0]:rivalryDoc({...baseData('closed'),...extra})});assert.equal(r.code,'TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID',label);assert.deepEqual(log,[P0],label);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null},label);}

  // K6. Integrity, membership, catalog and denied reads are unavailable, never empty
  {const value=rivalryDoc(baseData('closed'));value.data={...value.data,connectionState:'active'};const {r}=await readWith({[P0]:value});assert.equal(r.code,'TRANSFER_HISTORY_RIVALRY_INTEGRITY_FAILED');}
  {const {r}=await readWith({[P0]:rivalryDoc(baseData('closed'))},{},C);assert.equal(r.code,'TRANSFER_HISTORY_NOT_A_MANAGER');}
  {const {r}=await readWith({});assert.equal(r.code,'TRANSFER_HISTORY_RIVALRY_MISSING');}
  {const {r}=await readWith({},{deny:new Set([P0])});assert.equal(r.code,'permission-denied');}
  {const {r}=await readWith(completedDocs(1),{deny:new Set([`${P0}/transferChallenges/season_1`])});assert.equal(r.code,'permission-denied','JOB-08 Rules without JOB-10: honest unavailable');assert.deepEqual(r.transfers,{status:'unavailable',seasons:null});}
  {const {r}=await readWith(completedDocs(1),{deny:new Set([`${P0}/transferChallenges/season_1/roles/playerTwo`])});assert.equal(r.code,'permission-denied');}
  {const docs=completedDocs(1);delete docs[`${P0}/sharedSetup/authoritative`];const {r}=await readWith(docs);assert.equal(r.code,'TRANSFER_HISTORY_SETUP_INVALID');}
  {const saved=window.FIFA17_TRANSFER_LEAGUES;window.FIFA17_TRANSFER_LEAGUES=undefined;try{const {r,log}=await readWith(completedDocs(1));assert.equal(r.code,'TRANSFER_HISTORY_CATALOG_UNAVAILABLE');assert.deepEqual(log,[P0]);}finally{window.FIFA17_TRANSFER_LEAGUES=saved;}}

  // K7. Completed: exact gets 2 + 3N in a fixed order, keyed daniel/nik, verdicts equal the transfer protocol
  for(const total of [1,3]){
    const {r,log}=await readWith(completedDocs(total),{},total===1?A:B);
    assert.equal(r.status,'completed',JSON.stringify(r));assert.equal(r.code,null);assert.equal(r.managerRole,total===1?'playerOne':'playerTwo');assert.equal(Object.isFrozen(r.transfers.seasons[0].daniel.signings),true);
    const expectedLog=[P0,`${P0}/sharedSetup/authoritative`];for(let k=1;k<=total;k+=1){const t=`${P0}/transferChallenges/season_${k}`;expectedLog.push(t,`${t}/roles/playerOne`,`${t}/roles/playerTwo`);}
    assert.deepEqual(log,expectedLog);assert.equal(log.length,2+3*total);
    assert.equal(r.transfers.status,'ready');assert.equal(r.transfers.seasons.length,total);
    for(let k=1;k<=total;k+=1){
      const season=r.transfers.seasons[k-1],state=states[k-1];
      assert.deepEqual(Object.keys(season),['season','daniel','nik']);assert.equal(season.season,k);
      for(const [key,role] of [['daniel','playerOne'],['nik','playerTwo']]){
        const verdict=protocol.evaluateRole(role,state);
        assert.deepEqual(clone(season[key].signings),clone(verdict),`${key} S${k} verdict equals the protocol`);
        assert.deepEqual(clone(season[key].guesses),clone(state.inputs[role].guesses));
        assert.equal(season[key].released,verdict.filter(x=>x.release).length);assert.equal(season[key].kept,verdict.length-season[key].released);
      }
    }
  }
  {const {r}=await readWith(completedDocs(3));assert.equal(r.transfers.seasons[0].daniel.released,1,'Nik guessed Daniel S1 nationality: released');assert.deepEqual(r.transfers.seasons[2].daniel,{guesses:[],signings:[],released:0,kept:0},'an empty season is real, not unavailable');}
  {const a=await readWith(completedDocs(3),{},A),b=await readWith(completedDocs(3),{},B);assert.deepEqual(a.r.transfers,b.r.transfers,'both managers read the identical history');}

  // K8. Tampered or partial season data: unavailable, never shorter, never a partial list
  const tamper=async(label,mutate,code)=>{const docs=cloneDocs(completedDocs(3));mutate(docs);const {r}=await readWith(docs);assert.equal(r.status,'unavailable',label);assert.equal(r.code,code,label);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null},label);};
  const T=k=>`${P0}/transferChallenges/season_${k}`;
  await tamper('rival guess edited after lock',d=>{d[`${T(1)}/roles/playerTwo`].guesses[0].valueId='italy-serie-a';},'TRANSFER_HISTORY_PROVENANCE_MISMATCH');
  await tamper('signing renamed after lock',d=>{d[`${T(2)}/roles/playerOne`].signings[0].name='Someone else';},'TRANSFER_HISTORY_PROVENANCE_MISMATCH');
  await tamper('roles swapped',d=>{const x=d[`${T(1)}/roles/playerOne`];d[`${T(1)}/roles/playerOne`]=d[`${T(1)}/roles/playerTwo`];d[`${T(1)}/roles/playerTwo`]=x;},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('challenge not COMPLETED',d=>{d[T(2)].phase='SIGNING_ENTRY';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('missing season 3 role',d=>{delete d[`${T(3)}/roles/playerOne`];},'TRANSFER_HISTORY_SEASON_MISSING');
  await tamper('missing season 2 challenge',d=>{delete d[T(2)];},'TRANSFER_HISTORY_SEASON_MISSING');
  await tamper('unknown catalog id',d=>{d[`${T(1)}/roles/playerOne`].signings[0].leagueId='atlantis-league';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('coordinator differs from setup',d=>{d[`${P0}/sharedSetup/authoritative`].coordinatorRole='playerTwo';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('extra key on a role',d=>{d[`${T(1)}/roles/playerTwo`].note='x';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('unlocked signings',d=>{d[`${T(1)}/roles/playerTwo`].signings=null;},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('setup length differs from witness',d=>{d[`${P0}/sharedSetup/authoritative`].totalSeasons=5;},'TRANSFER_HISTORY_SETUP_INVALID');

  // K9. Rules text: phase-gated role grant, witness-keyed, no write inspection, no billing words
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  const grant=fragment.slice(fragment.indexOf('function cmsCompletedTransferRoleReadable'),fragment.indexOf('// CMS_PERSISTENT_PAIR_FUNCTIONS_END'));
  for(const needle of ['cmsCompletedSeasonReadable(rivalryId, transferId)',"challenge.objectType == 'sharedTransferChallenge'",'challenge.rivalryId == rivalryId','ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)',"challenge.phase == 'COMPLETED'","'playerOne' in challenge.guessLockedRoles","'playerTwo' in challenge.guessLockedRoles","'playerOne' in challenge.signingLockedRoles","'playerTwo' in challenge.signingLockedRoles"])assert.ok(grant.includes(needle),needle);
  assert.doesNotMatch(grant,/getAfter|request\.resource/,'read grant never inspects a write');
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  const inject=read('scripts/inject-persistent-pair-rules.mjs');
  for(const label of ['completed Showdown transfer challenge read','completed Showdown transfer role read','completed Showdown setup read','completed Showdown season commit read'])assert.ok(inject.includes(label),label);

  // K10. Composed artifact: both builds pass; the transfer grant sits on exactly two get lines, roles are phase-gated
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  assert.equal((generated.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, transferId\);/g)||[]).length,1,'public challenge get');
  assert.match(generated,/allow get: if ssjrTransferPrivateReadable\(rivalryId, transferId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedTransferRoleReadable\(rivalryId, transferId\)\);/);
  const transferAt=generated.indexOf('match /transferChallenges/{transferId}'),rolesAt=generated.indexOf('match /roles/{managerRole}',transferAt),transferEnd=generated.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END');
  assert.ok(transferAt>0&&rolesAt>transferAt&&transferEnd>rolesAt);
  assert.doesNotMatch(generated.slice(rolesAt,transferEnd),/cmsCompleted(Showdown|Season)Readable/,'roles never get the blanket season grant (S2C-005R2 §4)');
  assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false,'no write, list or delete rule mentions a completed grant');
  for(const [match,granted] of [['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false],['match /state/authoritative',false],['match /transferChallenges/{transferId}',true]]){
    const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));assert.equal(/cmsCompleted/.test(getLine),granted,match);
  }

  // K11. JOB-08's reader (JOB-09 depends on it) is unchanged in API and never reads transfers
  assert.equal(typeof CompletedReader.readCompletedShowdown,'function');assert.deepEqual([...CompletedReader.statuses],['completed','abandoned','not-closed','unavailable']);assert.equal(CompletedReader.contractVersion,1);
  assert.doesNotMatch(read('js/sparkCompletedShowdownReader.js'),/transferChallenges/);
  console.log('PASS completed-only transfer history contracts: reader API, exact-get source, classification, witness checks, unavailable states, protocol-equal verdicts, provenance, Rules text, composed artifact, JOB-08 API intact.');
})().catch(e=>{console.error(e);process.exit(1);});
````

### Appendix E. Registry, ops test and CI step

Registry patterns are JSON strings compiled with `new RegExp`: a literal dot is `\\.` in the JSON source (one escaped backslash), never `\\\\.`. If jobs 9, 11, 16 or 18 merged first, keep their entries and put these lines last (§2).

````diff
diff --git a/.github/workflows/validate-gameplay-fast.yml b/.github/workflows/validate-gameplay-fast.yml
index fa2ca59..36f25d9 100644
--- a/.github/workflows/validate-gameplay-fast.yml
+++ b/.github/workflows/validate-gameplay-fast.yml
@@ -72,3 +72,5 @@ jobs:
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-index "node tests/firebase/career-index-emulator.cjs && CMS_CAREER_INDEX_ENFORCED=1 node tests/firebase/career-index-emulator.cjs"
       - name: Completed-only read matrix
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-completed-read "node tests/firebase/completed-showdown-read-emulator.cjs"
+      - name: Completed transfer history matrix
+        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-completed-transfer "node tests/firebase/completed-transfer-history-emulator.cjs"
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 3323da0..4b174f8 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -547,6 +547,23 @@
         "^tests/contracts/completed-showdown-read-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/completed-transfer-history-contracts.cjs",
+      "patterns": [
+        "^js/sparkCompletedTransferHistoryReader\\.js$",
+        "^js/sparkCompletedShowdownReader\\.js$",
+        "^js/sharedTransferChallenge\\.js$",
+        "^js/sharedTerminalClose\\.js$",
+        "^data/transferOptions\\.js$",
+        "^firestore\\.persistent-pair-production\\.fragment\\.rules$",
+        "^firestore\\.spark\\.rules$",
+        "^firestore\\.(transfer-challenge|terminal-close)-production\\.fragment\\.rules$",
+        "^scripts/inject-persistent-pair-rules\\.mjs$",
+        "^scripts/build-production-firestore-rules(-with-persistent-pair)?\\.mjs$",
+        "^tests/contracts/completed-transfer-history-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 353b654..7f7c95c 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -70,10 +70,11 @@ const startJoinViewModelContract='tests/contracts/start-join-view-model-contract
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
 const completedShowdownReadContract='tests/contracts/completed-showdown-read-contracts.cjs';
+const completedTransferHistoryContract='tests/contracts/completed-transfer-history-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract,completedTransferHistoryContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````

### Appendix F. JOB-08 chartered flips: `tests/contracts/completed-showdown-read-contracts.cjs` K8 and `tests/firebase/completed-showdown-read-emulator.cjs` B8/B9 (against `843e64e`)

````diff
diff --git a/tests/contracts/completed-showdown-read-contracts.cjs b/tests/contracts/completed-showdown-read-contracts.cjs
index dbe081b..f03f0c5 100644
--- a/tests/contracts/completed-showdown-read-contracts.cjs
+++ b/tests/contracts/completed-showdown-read-contracts.cjs
@@ -84,12 +84,12 @@ const readWith=(docs,opts={},uid=A)=>{const f=fakeSdk(docs,opts);return Reader.r
   for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
   const generated=read('firestore.spark.generated.rules');
   const getLines=generated.split('\n').filter(line=>/cmsCompleted(Showdown|Season)Readable\(rivalryId/.test(line)&&!/function /.test(line));
-  assert.equal(getLines.length,5,'setup, results, roles, commits + the season helper call');
+  assert.equal(getLines.length,7,'setup, results, roles, commits + the season helper call; JOB-10 adds the transfer challenge get and the transfer role helper call');
   assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false);
-  for(const [match,granted] of [['match /sharedSetup/authoritative',true],['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /transferChallenges/{transferId}',false],['match /seasonResults/{seasonId}',true],['match /seasonCommits/{seasonId}',true],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false]]){
+  for(const [match,granted] of [['match /sharedSetup/authoritative',true],['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /transferChallenges/{transferId}',true],['match /seasonResults/{seasonId}',true],['match /seasonCommits/{seasonId}',true],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false]]){
     const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));
     assert.equal(/cmsCompleted/.test(getLine),granted,match);
   }
-  const transferRoles=generated.slice(generated.indexOf('match /transferChallenges/{transferId}'));assert.doesNotMatch(transferRoles.slice(0,transferRoles.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END')),/cmsCompleted/,'transfer roles stay with G-10');
+  const transferAt=generated.indexOf('match /transferChallenges/{transferId}'),transferRoles=generated.slice(generated.indexOf('match /roles/{managerRole}',transferAt),generated.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END'));assert.doesNotMatch(transferRoles,/cmsCompleted(Showdown|Season)Readable/,'transfer roles never get the blanket season grant (G-10 keeps the COMPLETED condition)');assert.match(transferRoles,/cmsCompletedTransferRoleReadable\(rivalryId, transferId\)/,'G-10: transfer roles only through the COMPLETED-gated grant');
   console.log('PASS completed-only read contracts: reader API, exact-get source, classification, witness checks, unavailable states, Rules text, composed artifact.');
 })().catch(e=>{console.error(e);process.exit(1);});
diff --git a/tests/firebase/completed-showdown-read-emulator.cjs b/tests/firebase/completed-showdown-read-emulator.cjs
index 0bf2934..7a11414 100644
--- a/tests/firebase/completed-showdown-read-emulator.cjs
+++ b/tests/firebase/completed-showdown-read-emulator.cjs
@@ -153,8 +153,8 @@ async function run(env){
   await check("B5","season_2 of a 1-season Showdown is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_2")));});
   await check("B6","malformed season id season_01 is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_01")));});
   await check("B7","listing X season commits is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"seasonCommits")));});
-  await check("B8","X transfer challenge stays outside the grant (G-10)",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1")));});
-  await check("B9","X transfer roles stay outside the grant (G-10)",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",X,"transferChallenges","season_1","roles","playerOne")));});
+  await check("B8","X transfer challenge is readable through the G-10 completed transfer grant",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1")));assert.equal(snap.data().phase,"COMPLETED");});
+  await check("B9","X transfer role is readable through the G-10 grant only because season_1 is COMPLETED",async()=>{const snap=await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"transferChallenges","season_1","roles","playerOne")));assert.equal(snap.data().managerRole,"playerOne");});
   await check("B10","X career start stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"careerStart","authoritative")));});
   await check("B11","X league projection stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"sharedSetup","leagueProjection")));});
   await check("B12","unknown role id playerThree is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_1","roles","playerThree")));});
````
