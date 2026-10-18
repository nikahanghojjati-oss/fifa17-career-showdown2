# JOB-07 · Career index Rules + client + emulator proofs

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; every Firebase emulator run happens on GitHub CI, see §2) | JOB-01 **and** JOB-02 merged into `gameplay/recovery-v1` | 9 | `gameplay/job-07-career-index` | `gameplay/recovery-v1` | **yes** (you request it yourself in step 9) |

## 1. Goal

Today `accounts/{uid}/pairLinks/current` names only the newest Showdown, so the moment Daniel and Nik pair again the account forgets every earlier Showdown (JOB-02 recorded this as `KNOWN GAP 2 (fixed by G-7)`). This job adds the D1 **career index**: a private, per-account, append-only, oldest-first list of every rivalry id that account created or joined **after this job ships**. Every new pairing commit (Daniel's creation, Nik's redemption) must write the index in the same Firestore transaction as the pair link, or the whole commit is denied by Rules. Nothing is backfilled. Nothing is ever removed. Capacity is paged, never capped.

The job ships three things, all proven before merge:

1. Rules (in the persistent-pair fragment) that make the index own-account, append-only, exactly-once, forward-only and coupled to pairing.
2. Client code in `js/persistentNikDanielPair.js`: the pairing witnesses write the index; a read-only `readCareerIndex()` returns `loading | ready | unavailable`.
3. Proofs: one new contract test, one new composed-Rules emulator test with 58 numbered checks, and updates to two existing emulator tests whose fixtures pair through the provider.

The career index does **not** make closed Showdowns readable (that is G-8) and does **not** classify entries as finished, abandoned or pending (that is G-9). It only records ids, in order, forever.

Deployment is **not** part of this job. Rules reach production only through the zero-billing Rules workflow after Nik types the deploy words; see §8 "Deploy order".

## 2. Branches and files

- The lead creates `gameplay/job-07-career-index` from `gameplay/recovery-v1` after JOB-02 merges. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `tests/firebase/two-manager-journey-emulator.cjs` exists there; if not, reply `Job 7 waits for job 2.` and stop.
- **Lane and CI path.** Work mode has Java 17 and cannot run the Firestore emulator (needs Java 21) and cannot `git push` (smoke `CAPABILITIES_WORK.md`). So: run `npm ci`, `node --check`, `npm run test:contracts`, `npm run test:ops` and `node tests/contracts/career-index-contracts.cjs` locally; save files through the connector (WORKER_HANDBOOK §7 Path A); and read every emulator result from the "Validate Gameplay Fast" run on your **exact head commit** (job `rules-emulator`; the log of the step named in each section is your test output). Add the CI step in **step 3**, so CI runs the new emulator test from the first save.

Create:

- `tests/contracts/career-index-contracts.cjs` (Appendix D)
- `tests/firebase/career-index-emulator.cjs` (Appendix C)

Edit (and only these):

| File | Change |
| --- | --- |
| `firestore.persistent-pair-production.fragment.rules` | two coupling lines + new functions + new match (Appendix A) |
| `js/persistentNikDanielPair.js` | index helpers, witness read/write split, five exports (Appendix B) |
| `scripts/inject-persistent-pair-rules.mjs` | required strings + exactly-one match check (Appendix F) |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended at the end (Appendix F) |
| `tests/operations/pos20-control-plane.test.mjs` | one const + append it to `expectedSupplementalContracts` (Appendix F) |
| `tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs` | fixture only: atomic helpers also write the index; one seed line (Appendix E) |
| `tests/firebase/two-manager-journey-emulator.cjs` | fixture: real witnesses; flip KNOWN GAP 2 into index assertions (Appendix G) |
| `.github/workflows/validate-gameplay-fast.yml` | one step at the end of `rules-emulator` (§5 step 3) |
| `project-documents/gameplay-factory/status/JOB-07.md` on `factory/gameplay-v1` | status file |

Read first (on `gameplay/recovery-v1` at or after `42fc13a`; re-check line numbers, they are observations):

1. `firestore.persistent-pair-production.fragment.rules` (whole file, 171 lines): `cmsPersistentPairRivalryMembership` 8-32 (uses `getAfter`), `cmsPersistentPairCreationWitnessValid` 34-43, `cmsPersistentPairRedemptionWitnessValid` 45-50, `cmsPersistentPairDataValid` 52-67, `cmsPersistentPairCanReplace` 69-92, `cmsPersistentPairAbandonValid` 120-138, `cmsPersistentPairCreateValid` 140-148, `cmsPersistentPairUpdateValid` 150-161, `match .../pairLinks/{pairId}` 165-170.
2. `firestore.spark.rules`: `validEnvelopeShape` 16, `validCreateEnvelope` 45, `validCasEnvelope` 52, `activeDevice` 86, `validInitialRivalryCreate` 283, `validRivalryRedeem` 344, `activePairedRivalry` 447-464, `match /accounts/{accountId}` 862, `match /rivalries/{rivalryId}` 885. **Read only. Do not edit this file.**
3. `js/sparkPrivatePairing.js`: `createPairing` 265-303 (the witness runs at 294, after the device read, before the rivalry/invite sets), `redeemPairing` 325-363 (witness at 349, after the device/rivalry/invite reads). **Read only.**
4. `js/persistentNikDanielPair.js`: `pairLinkReference` 52, `pairReadPairLink` 63, `pairPersistPairLink` 64 (standalone relink/reconfirm: must stay index-free), `pairCreateDurablePairWitness` 112, creation/redemption wrappers 113/114, `pairStartPairing` 144, `pairJoinPairing` 145, `pairRetryPairLink` 147, export object 244 (`contractVersion:4`).
5. `scripts/inject-persistent-pair-rules.mjs` required list 49-72; `scripts/build-production-firestore-rules.mjs` and `...-with-persistent-pair.mjs` (read only).
6. `tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs` (helpers `atomicCreateWithPairLink`, `atomicRedeemWithPairLink`, seed block after line 110).
7. `tests/firebase/two-manager-journey-emulator.cjs` (from JOB-02): `pairLinkWitness` 84-96, `pairFreshRivalry` 98, R2 at 156, R3 at 168, KNOWN GAP 2 at 159.
8. `tests/contracts/persistent-nik-daniel-pair-contracts.cjs`: line 73 forbids `.collection(`, `query(`, `getDocs(`, `listDocuments` in the pair source; line 108 pins `contractVersion` 4. Your code must keep it passing **unchanged**.
9. `tests/operations/pos20-control-plane.test.mjs` 66-70 (`expectedSupplementalContracts` is an ordered `deepEqual` against the registry paths).
10. Authority: Sol ruling S2C-005R2 §3-§4 and §6 items 1-2 (on `visual/cinematic-system-v10`), lead brief §2/§3/§5 (on `leads/relay`), `DATA_CONTRACT_V1.md`.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. **Never deploy Rules or Pages.** Emulator project ids start with `demo-`.
- Billing permanently OFF: Spark only. No Cloud Functions, no Cloud Run, no Blaze, no scheduled jobs, no server code. Do not write the words `billing`, `blaze`, `cloud functions` or `cloud run` into the fragment (the contract test greps for them).
- Exactly two private managers: Daniel = `playerOne`, Nik = `playerTwo`. Index documents are readable and writable only by their own account.
- **No backfill.** No code path, test helper excepted, may write an id for a rivalry that existed before the commit that creates or redeems it. Pre-deployment rivalries never appear in any index. Continue / reconfirm of a pre-deployment pair link keeps working and writes no index.
- **Never truncate, never evict, never cap.** A full head (500 ids) is sealed into an immutable page in the same commit as the next append.
- **Expression budget.** `validInitialRivalryCreate`, `validRivalryRedeem`, `cmsPersistentPairCreationWitnessValid` and `cmsPersistentPairRedemptionWitnessValid` are at the 1,000-expression edge on the rivalry redeem update. Adding even ~5 expressions there makes redemption fail with `maximum of 1000 expressions`. **Do not add anything to those four functions, or to anything under `match /rivalries`.** The coupling lives on the pair-link create/update rules, which have headroom (lead measured: 60 extra comparisons still pass).
- Firestore web SDK transactions: **every `transaction.get` before the first `transaction.set`.**
- Client index code is memory-only (no `localStorage`, `sessionStorage`, `indexedDB`) and reads exact documents only (no `getDocs`, `collection(`, `query(`, `listDocuments`).
- Do not bump `contractVersion` (stays `4`). Do not edit `firestore.spark.rules`, any other fragment, the build scripts, `js/sparkPrivatePairing.js`, the deploy workflows, or any test not listed in §2.
- Never weaken, skip or delete an existing assertion. The only existing assertion that changes meaning is JOB-02's `KNOWN GAP 2`, which this job is chartered to flip.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 Document shapes (D1)

All index documents use the standard envelope (`schemaVersion 1`, `objectType`, `objectId`, `revision`, `parentRevision`, `lifecycleState 'live'`, `contentHash`, `priorContentHash`, `updatedAt`, `updatedByAccountId`, `updatedByDeviceId`, `tombstone null`, `data`) and the existing `validCreateEnvelope` / `validCasEnvelope` checks.

**Head** `accounts/{uid}/careerIndex/current`, `objectType 'careerIndex'`:

```json
"data": { "rivalryIds": ["pair_<64 hex>", "..."], "sealedPageCount": 0 }
```

- Exactly the two keys. `rivalryIds` is 1..500 unique ids, oldest first. `sealedPageCount` is an int >= 0.
- Created at revision 0 by the account's first post-deployment pairing; then each pairing is a CAS update with `revision + 1`.

**Sealed page** `accounts/{uid}/careerIndex/page_{N}`, `objectType 'careerIndexPage'`, N = 1, 2, ...:

```json
"data": { "pageNumber": 1, "rivalryIds": [ "...exactly 500 ids..." ] }
```

- Created once, at revision 0, never updated, never deleted. `page_1` holds the oldest 500 ids.

**Ordered history** = `page_1.rivalryIds ++ page_2.rivalryIds ++ ... ++ page_K.rivalryIds ++ current.rivalryIds`, K = `current.sealedPageCount`.

Why head + sealed pages (the lead brief said "current then page_2"): every append touches exactly one known document (`current`), and rollover touches exactly two (`page_{K+1}` create + `current` update) in the same commit. Rules can prove the sealed page is byte-equal to the full head it replaces, so nothing is ever lost and nothing outside the commit is guessed.

Capacity: `cmsCareerIndexPageCapacity()` returns `500` and the client constant `CAREER_INDEX_PAGE_CAPACITY` is `500`; the contract test pins them equal. 500 ids are about 36 KB, far under the 1 MiB document limit and the 20,000-element Rules list limit.

### 4.2 The Sol corrections, each as a requirement with its proofs

Check ids refer to the emulator test in Appendix C (§6.2 table) and the contract test (Appendix D, "K" ids).

| # | Requirement (S2C-005R2) | How the Rules/client enforce it | Proved by |
| --- | --- | --- | --- |
| R1 | Every new creation atomically indexes the new rivalry in the creator's index | `cmsPersistentPairCreateValid` and `cmsPersistentPairUpdateValid` end with `cmsCareerIndexPairLinkCoupled(accountId, <linked rivalryId>)`: if the account is not already a member of that rivalry **before** the commit, `getAfter(current).rivalryIds` must end with it | B1, B7, B8, B9, G1, P2 |
| R2 | Every new redemption atomically indexes the redeemed rivalry in the redeemer's index | same coupling on the redeemer's pair-link update/create | C3, C7, P2, P5 |
| R3 | Only an eligible rivalry can be appended: one this commit creates (pending-pair, creator = me, authorized = [me]) or one this commit redeems (pending-pair -> active, I am added as second authorized account) and that the creator indexed | `cmsCareerIndexAppendEligible` -> `cmsCareerIndexCreationEligible` / `cmsCareerIndexRedemptionEligible`; pair link after the commit must name the same rivalry, a valid manager role, and `cmsPersistentPairRivalryMembership` | B2, B3, D7, D8, D9, D13 |
| R4 | Bypass fails: a commit that creates/redeems without writing the index is denied | coupling (R1/R2) | B1, B8, C3, G1 |
| R5 | Unrelated append fails | append is eligible only inside the creating/redeeming commit | D7, D8, D9, E2 |
| R6 | Reordering fails | `next[0:prior.size()] == prior` | D1, D2 |
| R7 | Duplicates fail | `!(next[prior.size()] in prior)`; client `Set` check | D3, E2, K2, K4 |
| R8 | Exactly one new entry per write; no truncation, no replacement, no no-op | `next.size() == prior.size() + 1` | D4, D5, D6, D10 |
| R9 | Account forgery fails | `request.auth.uid == accountId`, `updatedByAccountId == accountId`, `activeDevice(updatedByDeviceId)` | B5, B6, C6, D12, D13 |
| R10 | Role forgery fails | `cmsPersistentPairRivalryMembership(accountId, id, pairData.managerRole)` against the rivalry after the commit | C5 |
| R11 | Stale cutover enrollment fails (no backfill) | creation requires `!exists(rivalry)` before; redemption requires the creator's head to already contain the id (Rules-side `get`, nothing disclosed to the client); a head create carries exactly one id | B3, C1, C4, D7, D8 |
| R12 | Continue / reconfirm of a pre-deployment link still works and writes nothing | coupling is satisfied by "already a member before this commit"; `pairPersistPairLink` untouched | C2, E1 |
| R13 | Reconfirmation, retries and races preserve one entry | CAS envelope (`revision + 1`, `priorContentHash`) + slice + not-in; client plan returns `[]` when the id is already present | E1, E2, F1, F2, D14, K3 |
| R14 | Capacity cannot silently lose history | rollover branch: head full, `sealedPageCount + 1`, new head of exactly the new id, and `page_{N}` created in the same commit equal to the old head; pages immutable | G1-G10, K5, P6 |
| R15 | Own-account privacy | `allow get` only for `request.auth.uid == accountId` and ids `current` / `page_N`; `allow list, delete: if false` | A1-A7, G6-G9, P4 |
| R16 | Both managers agree on the shared, paired set | Daniel's ids filtered to rivalries with two authorized accounts equal Nik's ids, same order | H1, P3, P5 |
| R17 | The client never reports a shorter history as complete | `readCareerIndex` returns `unavailable` (not `ready`) for any missing page, malformed doc or failed read | P4, P6, K6-K9 |
| R18 | Reads before writes in the witness transaction | witness READ PHASE then WRITE PHASE | K10 (fake transaction log, both witnesses x first/replacement/rollover) |

### 4.3 Rules function names (exact)

Add these to the fragment, before `// CMS_PERSISTENT_PAIR_FUNCTIONS_END`, verbatim from Appendix A:

`cmsCareerIndexPageCapacity`, `cmsCareerIndexRecordsNewRivalry`, `cmsCareerIndexPairLinkCoupled`, `cmsCareerIndexHeadDataValid`, `cmsCareerIndexCreationEligible`, `cmsCareerIndexRedemptionEligible`, `cmsCareerIndexAppendEligible`, `cmsCareerIndexPageSealedFrom`, `cmsCareerIndexHeadCreateValid`, `cmsCareerIndexHeadUpdateValid`, `cmsCareerIndexPageCreateValid`.

Add one line to the end of each of `cmsPersistentPairCreateValid` and `cmsPersistentPairUpdateValid` (the coupling). Add the match `match /accounts/{accountId}/careerIndex/{indexId}` before `// CMS_PERSISTENT_PAIR_MATCH_END`. Nothing else in the fragment changes.

### 4.4 Client API (`js/persistentNikDanielPair.js`)

New exports (keep every existing export, keep `contractVersion:4`):

| Export | Shape |
| --- | --- |
| `careerIndexPageCapacity` | `500` |
| `readCareerIndex(options?)` | `async` -> frozen `{status, accountId, rivalryIds, sealedPageCount, code}`. Never throws. `options` = `{firestore, firebaseSdk, accountId}` for tests; with none it resolves the signed-in context via `pairResolveContext()`. Sets status `loading` while reading. `ready`: `rivalryIds` is the full ordered history (pages oldest first, then head; `[]` when no head exists yet). `unavailable`: `rivalryIds` is `[]` and `code` says why (`CAREER_INDEX_INVALID`, `CAREER_INDEX_PAGE_MISSING`, a Firestore code such as `permission-denied`, or `CAREER_INDEX_UNAVAILABLE`). Uses only `sdk.getDoc` + `sdk.doc`. |
| `getCareerIndexState()` | the last state, frozen; initial `{status:'loading', accountId:null, rivalryIds:[], sealedPageCount:0, code:null}`. Memory only. |
| `planCareerIndexAppend({headValue, rivalryId, accountId, deviceId, now, cryptoImpl})` | pure, `async`. Returns the exact writes `[{indexId, value}]`: `[]` if the id is already in the head; one head write (create or append); or on a full head `[page_{N} create, head update]`. Throws `CAREER_INDEX_INVALID` on a malformed head. |
| `createDurableCreationWitness(context, role, manager)` | the existing internal creation witness, exported for tests |
| `createDurableRedemptionWitness(context, role, manager, rivalryId)` | the existing internal redemption witness, exported for tests |

Witness change: split `pairCreateDurablePairWitness` into a READ PHASE (pair link, index head, old rivalry, old invite) and a WRITE PHASE (pair link set, then each planned index write). Its result adds `careerIndexAppended: boolean`. `pairPersistPairLink`, `pairRetryPairLink`, abandon and discard paths do **not** write the index.

Why not `{rivalryIds, updatedAt}` with `size()+1 && hasAll` (C2S-005R2 plan): `hasAll` accepts reordering, and an unpaged list either caps or eventually breaks the document limit. The head+page shape plus slice equality closes both.

### 4.5 Existing tests: what changes and what must stay untouched

Must change (fixtures only, every existing assertion kept):

1. `tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs`. Its hand-built atomic create/redeem transactions now also read and write the creator's/redeemer's index (default on whenever they write the pair link), and one seed line records that `acct_d` indexed its seeded pending invites when it created them. Without this, its creator-success and redeemer-success checks fail with PERMISSION_DENIED (lead verified). Appendix E.
2. `tests/firebase/two-manager-journey-emulator.cjs` (JOB-02). Replace its private `pairLinkWitness` in `pairFreshRivalry` with the real `PersistentPair.createDurableCreationWitness` / `createDurableRedemptionWitness`, and replace the `KNOWN GAP 2` assertion with index assertions: both indexes are `[R2]` after Showdown 2 pairing and `[R2, R3]` after Showdown 3 pairing, and `R1` (seeded before the index existed) never appears. Leave the now-unused `pairLinkWitness` function in place or delete it (it is test-local); do not change any other assertion. Appendix G.
3. `tests/operations/pos20-control-plane.test.mjs`: add the new contract to `expectedSupplementalContracts` (order matters: last).
4. `scripts/inject-persistent-pair-rules.mjs`: new required strings and an exactly-one careerIndex match check.

Must stay byte-identical (check with `git diff --stat` in step 7):

- `tests/contracts/persistent-nik-daniel-pair-contracts.cjs` (it must pass unchanged; it spawns both builds and checks line 73 / 108).
- Every other `tests/contracts/*.cjs`, every `tests/browser/*` audit (`persistent-pair-user-facing-routing-audit.cjs`, `pairing-four-code-automation-audit.cjs` included).
- Every other `tests/firebase/*-emulator.cjs`: setup provider, transfer fresh-session, lifecycle (1 and 3 seasons), terminal close, commit/results/transfer diagnostics.
- `firestore.spark.rules`, all other `*.fragment.rules`, both build scripts, `js/sparkPrivatePairing.js`, `.github/workflows/deploy-*.yml`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10 kernel files.

### 4.6 The generated-rules trap

`npm run test:contracts` rebuilds `firestore.spark.generated.rules` **without** the persistent-pair fragment (the pair contract test spawns the shared-only build last). Any emulator run after it, without rebuilding, fails every pair and index write with `PERMISSION_DENIED ... false for 'create' @ L2428` or `false for 'get'` on `careerIndex`. Always run, in this order, immediately before any emulator run (local or in a CI step that follows contracts):

```bash
node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
```

The new emulator test fails fast (check I0) if the composed file lacks the careerIndex match, the pairLinks match or the Shared Journey fragments. CI's `rules-emulator` job already builds both before its first step; do not reorder it. Never commit `firestore.spark.generated.rules` changes or `firestore-debug.log`.

## 5. Steps

After each step update `status/JOB-07.md` on `factory/gameplay-v1` with `Job 7 step k/9: <step name>`. Save code to `gameplay/job-07-career-index` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1`, `npm ci`. Run `npm run test:contracts` (record `N/N`, expected `97/97` at `42fc13a`; it becomes `N+1` in step 7), `npm run test:ops` (record pass/fail), and `node tests/contracts/persistent-nik-daniel-pair-contracts.cjs`. Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1` (it includes JOB-02's `Two-manager journey` step). If that run is not green, set BLOCKED: `Job 7 is blocked: recovery-v1 CI is red before any change.`
2. **Map.** Confirm every line number in §2 "Read first" on the current head; write any drift in the status Notes. Confirm the fragment still ends with the two markers `// CMS_PERSISTENT_PAIR_FUNCTIONS_END` and `// CMS_PERSISTENT_PAIR_MATCH_END`.
3. **Tests first.** Create `tests/contracts/career-index-contracts.cjs` (Appendix D) and `tests/firebase/career-index-emulator.cjs` (Appendix C). Add the registry entry and the ops-test line (Appendix F). Add the CI step at the end of the `rules-emulator` job, after JOB-02's `Two-manager journey` step:
   ```yaml
         - name: Career index matrix
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-index "node tests/firebase/career-index-emulator.cjs"
   ```
   `node --check` both files. Run the contract test locally: it must **fail** (no `careerIndexPageCapacity` export). Save. Record the red CI run on your head (the new `Career index matrix` step fails at I0: no careerIndex match). This red run is your tests-first evidence; link it.
4. **Rules.** Apply Appendix A to `firestore.persistent-pair-production.fragment.rules` and Appendix F to `scripts/inject-persistent-pair-rules.mjs`. Rebuild both. Confirm `grep -c "match /accounts/{accountId}/careerIndex/{indexId}" firestore.spark.generated.rules` prints `1`. Save. CI: `Career index matrix` now passes A-H and fails at P1 (no `readCareerIndex`); `Persistent Nik and Daniel pair matrix` and `Two-manager journey` fail on pairing (expected until step 5). Record.
5. **Fixtures.** Apply Appendix E (pair provider emulator) and Appendix G (two-manager journey). Save. CI: `Persistent Nik and Daniel pair matrix` green. `Two-manager journey` still needs step 6 (it calls the real witnesses).
6. **Client.** Apply Appendix B to `js/persistentNikDanielPair.js`. Run `node tests/contracts/career-index-contracts.cjs` and `node tests/contracts/persistent-nik-daniel-pair-contracts.cjs` locally: both PASS. Save.
7. **Full proof.** Locally: `npm run test:contracts` prints `(N+1)/(N+1)`; `npm run test:ops` has 0 failures; `git diff --stat origin/gameplay/recovery-v1` lists only the §2 files. Rebuild both rules (trap §4.6) and confirm the composed file is not committed. On CI, on your exact head: every step of both jobs green; paste the last line of `Career index matrix` (`PASS career index composed-Rules emulator: 58 numbered checks ...`), of `Persistent Nik and Daniel pair matrix` and of `Two-manager journey`. Budget evidence: the journey's redemption steps commit (no `maximum of 1000 expressions` anywhere in the log).
8. **PR.** Open the PR into `gameplay/recovery-v1` titled `Job 7: career index Rules + client + emulator proofs`. Body: the §4.2 table with the CI step and check ids, the files changed, the CI run URL on the exact head, and the line "Rules are not deployed by this PR. Deploy order: Rules first (Nik's words), then Pages."
9. **Codex review.** After CI is green on the exact head and the PR is open, post one PR comment that says exactly `@codex review`. Set `State: WAITING ON CODEX` in the status file and save it. When the review arrives, fix every finding that is a real bug (push, wait for green CI on the new exact head) and reply on each finding thread in one line: `fixed in <commit>` or why not. A fix that touches Rules or the witness re-runs step 7 in full. Then fill the Done checklist and set `State: DONE`, save `Job 7 done: Career index Rules + client + emulator proofs`. If Codex does not answer, write that in the status file and set DONE; the lead decides. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a).

## 6. Tests first

### 6.1 Contract test (`tests/contracts/career-index-contracts.cjs`, Appendix D)

No Firebase, no emulator. Runs in `npm run test:contracts` through the registry entry.

| Id | Proves |
| --- | --- |
| K1 | `Pair.careerIndexPageCapacity === 500` and the fragment's `cmsCareerIndexPageCapacity()` returns `500` |
| K2 | `planCareerIndexAppend`: first write is a head at revision 0 with one id |
| K3 | append bumps revision and chains `priorContentHash`; an already-indexed id plans `[]` (idempotent) |
| K4 | a full head (500 ids, `sealedPageCount 2`) plans `['page_3', 'current']`, page = old head, new head = `[id]` with `sealedPageCount 3` |
| K5 | malformed heads (duplicate ids, extra key) throw `CAREER_INDEX_INVALID` |
| K6 | `readCareerIndex`: no head -> `ready []` |
| K7 | sealed pages first, oldest first, then head |
| K8 | missing page -> `unavailable`; failed read -> `unavailable`; malformed head -> `unavailable`; result and list frozen |
| K9 | the index code block uses no browser storage, no `getDocs(`, `collection(`, `query(` |
| K10 | fake transaction log, both witnesses x {first, replacement, rollover}: no `get` after the first `set`; head is read; pair link and index written together; rollover writes `page_3` |
| K11 | fragment text: slice equality, not-in, coupling on create and on update; the witness block contains no `careerIndex` (budget guard); the careerIndex match has `allow list, delete: if false`; no billing words |
| K12 | both build scripts exit 0 and the composed file has exactly one careerIndex match and one `cmsCareerIndexHeadUpdateValid` |

### 6.2 Emulator test (`tests/firebase/career-index-emulator.cjs`, Appendix C)

Composed production Rules, project `demo-cms-career-index` locally / `demo-cms-gameplay-fast-career-index` in CI. Accounts: Daniel `acct_daniel`, Nik `acct_nik`, stranger `acct_stranger`, other `acct_other`; second devices for Daniel and Nik. Seeded before the index exists (rules disabled): `OLD_ACTIVE` (Daniel+Nik, active), `OLD_CLOSED` (closed), `STALE` (Daniel's pending invite, open, never indexed), `FOREIGN` (stranger+other), and Nik's pre-deployment pair link to `OLD_ACTIVE`. Output: one `ok <n> <id> <label>` line per check, then `PASS career index composed-Rules emulator: 58 numbered checks ...`.

| Id | Check | Expect |
| --- | --- | --- |
| I0 | composed Rules contain careerIndex match, pairLinks match and Shared Journey fragment | assert |
| B1 | Daniel's first creation (pair link create + rivalry + invite) without index | deny; rivalry not created |
| B2 | index create naming a different rivalry | deny |
| B3 | index create with two ids (backfill attempt) | deny |
| B4 | index create with `sealedPageCount 1` | deny |
| B5 | index create from an unregistered device | deny |
| B6 | index create signed `updatedByAccountId` = Nik | deny |
| B7 | first creation with index create, one commit | allow; head `{[X1], 0}`, revision 0 |
| A1 | Daniel gets own `current` | allow |
| A2 | Nik gets Daniel's `current` | deny |
| A3 | stranger gets Daniel's `current` | deny |
| A4 | unauthenticated get | deny |
| A5 | owner lists `careerIndex` | deny |
| A6 | owner deletes `current` | deny |
| A7 | owner gets a non-index id (`backup`) | deny |
| B8 | replacement creation (old invite expired) without index append | deny |
| B9 | replacement creation with pair-link update + index append | allow; `[X1, X2]`, revision 1 |
| C1 | Nik reconfirms pre-deployment link and creates an index with that rivalry | deny (no import) |
| C2 | Nik reconfirms pre-deployment link alone | allow; Nik has no index |
| C3 | Nik redeems X2 without index | deny |
| C4 | Nik redeems the stale pre-deployment invite (creator never indexed it) with an index | deny |
| C5 | redemption whose pair link claims `playerOne` | deny |
| C6 | redemption whose index write is signed by Daniel | deny |
| C7 | redemption with pair-link replace + rivalry + invite + index create | allow; Nik `[X2]` |
| D1 | head-only reorder | deny |
| D2 | reorder plus a new id | deny |
| D3 | duplicate append | deny |
| D4 | two new ids in one write | deny |
| D5 | replace an existing entry | deny |
| D6 | truncate | deny |
| D7 | standalone append of a closed development rivalry | deny |
| D8 | standalone append of an active development rivalry | deny |
| D9 | append of a rivalry the account is not in | deny |
| D10 | no-op rewrite | deny |
| D11 | `sealedPageCount` tamper | deny |
| D12 | Nik writes Daniel's index | deny |
| D13 | stranger creates own index naming X2 | deny |
| D14 | head write with a skipped revision | deny |
| E1 | Daniel reconfirms the same rivalry, no index write | allow; index byte-identical |
| E2 | replay a committed creation (same id) | deny; index unchanged |
| F1 | two devices race two creations | exactly one commits; exactly one new entry |
| F2 | two devices race one redemption | exactly one commits; Nik `[X2, winner]` |
| H1 | Daniel's ids with two authorized accounts == Nik's ids, same order | assert |
| G1 | at capacity (500), creation without any index write | deny |
| G2 | 501-id head without a page | deny |
| G3 | sealed page that drops an id | deny |
| G4 | seal into the wrong page number | deny |
| G5 | at capacity, seal `page_1` + new head `{[X5], 1}` in the creation commit | allow |
| G6 | owner gets `page_1` | allow |
| G7 | other manager gets `page_1` | deny |
| G8 | page update | deny |
| G9 | page delete | deny |
| G10 | standalone page create | deny |
| P1 | provider `readCareerIndex` on a new career | `ready []` |
| P2 | real `createPairing` / `redeemPairing` with the real witnesses | both commit; `careerIndexAppended true` |
| P3 | both managers read their own index | both `ready [P1]` |
| P4 | Nik reads Daniel's index through `readCareerIndex` | `unavailable []` (never empty-ready) |
| P5 | second Showdown through the provider | both `[P1, P2]` |
| P6 | head claims a sealed page that does not exist | `unavailable []` (never shorter) |

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 3 (URL), failing at I0.
- [ ] `node tests/contracts/career-index-contracts.cjs` PASS locally; `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures.
- [ ] `tests/contracts/persistent-nik-daniel-pair-contracts.cjs` PASS and byte-identical.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including `Career index matrix` (58 numbered checks), `Persistent Nik and Daniel pair matrix` and `Two-manager journey`.
- [ ] Two-manager journey shows indexes `[R2]` then `[R2, R3]` and never `R1`; `KNOWN GAP 2` label is gone; no other assertion changed.
- [ ] No `maximum of 1000 expressions` in any CI log; the four budget-edge functions and `firestore.spark.rules` are unchanged.
- [ ] `git diff --stat` lists only the §2 files; no generated rules, no `firestore-debug.log`; `contractVersion` still 4.
- [ ] No deploy, nothing pushed to `main`, no billing words in the fragment.
- [ ] PR open into `gameplay/recovery-v1` with the §4.2 table and the deploy-order line.
- [ ] Codex: `@codex review` posted after green CI; State was WAITING ON CODEX; every finding thread answered in one line (`fixed in <commit>` or why not); CI green again on the final exact head; or "Codex did not answer" recorded. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 7 is blocked: <one line>`.

Known traps (each one cost the lead a run):

- **`maximum of 1000 expressions` on a rivalry update.** You added something to a rivalry rule or a creation/redemption witness function. Move it to the pair-link rules (§3 expression budget). Do not try to "optimise" the existing rivalry rules in this job.
- **`PERMISSION_DENIED ... false for 'create' @ L2428` or `false for 'get'` on careerIndex.** The composed rules lack the pair fragment (§4.6 trap). Rebuild both.
- **Replacement creation denied with `evaluation error` although everything looks right.** Your test expired the old invite relative to a future client tick. Rules compare against `request.time` (server time). Expire relative to `Date.now()` (`expireInvite` in Appendix C uses `Date.now()-60000`).
- **`Cannot read properties of undefined (reading 'getDoc')` / index `unavailable` in the journey test.** That test's local `sdk()` has no `getDoc`; pass `firestoreSdk` (the full `firebase/firestore` module) to `readCareerIndex`.
- **Firestore SDK error `Firestore transactions require all reads to be executed before all writes`.** A `transaction.get` slipped after a `transaction.set` in the witness. Keep the READ PHASE / WRITE PHASE split.
- **Old client against new Rules, or new client against old Rules.** Old client pairing is denied by new Rules (no index write); a new client reading `careerIndex` is denied by old Rules (`readCareerIndex` returns `unavailable`, and the witness transaction read of the head fails, so pairing fails). This is why deploy order matters; it is the lead's concern, not a bug to fix here.
- `firestore-debug.log` appears after local emulator runs. Never commit it.

### Deploy order (for the lead, not this job)

Rules must be deployed before, or together with, the Pages build that contains this client. Between a Pages deploy and a Rules deploy pairing is broken in one direction or the other. Deployment needs Nik's typed words and goes through the zero-billing Rules workflow; it is out of scope here.

## 8a. Lead decisions (2026-10-02)

- Page capacity 500 stays. `contractVersion` stays 4.
- The career-index proof does not go into `deploy-firestore-rules-zero-billing.yml` in this job. G-12 (composed Rules regression) decides that.
- The pair fragment does not join the zero-billing strict list here. The new contract's billing-word grep is enough for this job.
- Deploy order: Rules deploy before or together with Pages. The lead records this for the final main gate; it is not this job's work.
- JOB-02 also fixes a Setup Rules hex-case bug (`toHexString().lower()`). Start from `gameplay/recovery-v1` after JOB-02 merges, so you have that fix. Activity stamps in emulator tests use real time (`Date.now()`), not future offsets: future stamps can push Terminal Close over the 1000-expression limit.
- Redemption is close to the 1000-expression limit. If a check you add hits "maximum of 1000 expressions", move the check to the pair-link rule as in Appendix A rather than into the witness. If it still does not fit, set State: BLOCKED and quote the error.

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `42fc13a` (Java 21, firebase-tools 15.28.1, firebase 12.17.1, @firebase/rules-unit-testing 5.0.1). Apply them as given; if a hunk does not apply because the branch moved, re-apply by hand and say so in the status Notes. Diffs are against `42fc13a`.

### Appendix A. Rules: `firestore.persistent-pair-production.fragment.rules`

````diff
diff --git a/firestore.persistent-pair-production.fragment.rules b/firestore.persistent-pair-production.fragment.rules
index 4b30a82..9139b78 100644
--- a/firestore.persistent-pair-production.fragment.rules
+++ b/firestore.persistent-pair-production.fragment.rules
@@ -144,7 +144,8 @@
         && pairId == 'current'
         && validCreateEnvelope(root, 'pairLink', pairId)
         && root.updatedByAccountId == accountId
-        && cmsPersistentPairDataValid(accountId, root.data);
+        && cmsPersistentPairDataValid(accountId, root.data)
+        && cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId);
     }
 
     function cmsPersistentPairUpdateValid(accountId, pairId) {
@@ -157,7 +158,147 @@
         && after.updatedByAccountId == accountId
         && cmsPersistentPairDataValid(accountId, after.data)
         && after.data.linkedAt == before.data.linkedAt
-        && cmsPersistentPairCanReplace(before, after);
+        && cmsPersistentPairCanReplace(before, after)
+        && cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId);
+    }
+    // CMS_CAREER_INDEX (D1, JOB-07): own-account, append-only, forward-only career index.
+    function cmsCareerIndexPageCapacity() {
+      return 500;
+    }
+
+    function cmsCareerIndexRecordsNewRivalry(accountId, rivalryId) {
+      let ids = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data.data.rivalryIds;
+      return ids is list
+        && ids.size() >= 1
+        && ids[ids.size() - 1] == rivalryId;
+    }
+
+    // Pair-link coupling (first creation AND replacement): when this commit makes the account a member of
+    // the linked rivalry (creation by Daniel, redemption by Nik), the same commit must end the account's
+    // career index with that rivalry. A link to a rivalry the account already belonged to before this
+    // commit (reconfirm, Continue, recovery of a pre-deployment link) needs no index write and can never
+    // add one.
+    function cmsCareerIndexPairLinkCoupled(accountId, rivalryId) {
+      let rivalryPath = /databases/$(database)/documents/rivalries/$(rivalryId);
+      return (exists(rivalryPath) && accountId in get(rivalryPath).data.data.authorizedAccountIds)
+        || cmsCareerIndexRecordsNewRivalry(accountId, rivalryId);
+    }
+
+    function cmsCareerIndexHeadDataValid(data) {
+      return data.keys().hasOnly(['rivalryIds', 'sealedPageCount'])
+        && data.keys().hasAll(['rivalryIds', 'sealedPageCount'])
+        && data.rivalryIds is list
+        && data.rivalryIds.size() >= 1
+        && data.rivalryIds.size() <= cmsCareerIndexPageCapacity()
+        && data.sealedPageCount is int
+        && data.sealedPageCount >= 0;
+    }
+
+    function cmsCareerIndexCreationEligible(accountId, rivalryId) {
+      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
+      return !exists(/databases/$(database)/documents/rivalries/$(rivalryId))
+        && after.connectionState == 'pending-pair'
+        && after.createdByAccountId == accountId
+        && after.authorizedAccountIds == [accountId];
+    }
+
+    function cmsCareerIndexRedemptionEligible(accountId, rivalryId) {
+      let before = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
+      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
+      return before.connectionState == 'pending-pair'
+        && after.connectionState == 'active'
+        && before.authorizedAccountIds.size() == 1
+        && !(accountId in before.authorizedAccountIds)
+        && after.authorizedAccountIds == [before.createdByAccountId, accountId]
+        && rivalryId in get(/databases/$(database)/documents/accounts/$(before.createdByAccountId)/careerIndex/current).data.data.rivalryIds;
+    }
+
+    function cmsCareerIndexAppendEligible(accountId, rivalryId) {
+      let pairData = getAfter(/databases/$(database)/documents/accounts/$(accountId)/pairLinks/current).data.data;
+      return rivalryId is string
+        && rivalryId.matches('^pair_[0-9a-f]{64}$')
+        && pairData.rivalryId == rivalryId
+        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
+        && cmsPersistentPairRivalryMembership(accountId, rivalryId, pairData.managerRole)
+        && (
+          cmsCareerIndexCreationEligible(accountId, rivalryId)
+          || (
+            exists(/databases/$(database)/documents/rivalries/$(rivalryId))
+            && cmsCareerIndexRedemptionEligible(accountId, rivalryId)
+          )
+        );
+    }
+
+    function cmsCareerIndexPageSealedFrom(accountId, pageNumber, ids) {
+      let page = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/$('page_' + string(pageNumber))).data;
+      return page.objectType == 'careerIndexPage'
+        && page.data.pageNumber == pageNumber
+        && page.data.rivalryIds == ids;
+    }
+
+    function cmsCareerIndexHeadCreateValid(accountId) {
+      let root = request.resource.data;
+      return signedIn()
+        && request.auth.uid == accountId
+        && activeDevice(root.updatedByDeviceId)
+        && validCreateEnvelope(root, 'careerIndex', 'current')
+        && root.updatedByAccountId == accountId
+        && cmsCareerIndexHeadDataValid(root.data)
+        && root.data.sealedPageCount == 0
+        && root.data.rivalryIds.size() == 1
+        && cmsCareerIndexAppendEligible(accountId, root.data.rivalryIds[0]);
+    }
+
+    function cmsCareerIndexHeadUpdateValid(accountId) {
+      let before = resource.data;
+      let after = request.resource.data;
+      let prior = before.data.rivalryIds;
+      let next = after.data.rivalryIds;
+      return signedIn()
+        && request.auth.uid == accountId
+        && activeDevice(after.updatedByDeviceId)
+        && validCasEnvelope(before, after, 'careerIndex', 'current')
+        && after.updatedByAccountId == accountId
+        && cmsCareerIndexHeadDataValid(after.data)
+        && (
+          (
+            prior.size() < cmsCareerIndexPageCapacity()
+            && after.data.sealedPageCount == before.data.sealedPageCount
+            && next.size() == prior.size() + 1
+            && next[0:prior.size()] == prior
+            && !(next[prior.size()] in prior)
+            && cmsCareerIndexAppendEligible(accountId, next[prior.size()])
+          )
+          ||
+          (
+            prior.size() == cmsCareerIndexPageCapacity()
+            && after.data.sealedPageCount == before.data.sealedPageCount + 1
+            && next.size() == 1
+            && !(next[0] in prior)
+            && cmsCareerIndexPageSealedFrom(accountId, after.data.sealedPageCount, prior)
+            && cmsCareerIndexAppendEligible(accountId, next[0])
+          )
+        );
+    }
+
+    function cmsCareerIndexPageCreateValid(accountId, pageId) {
+      let root = request.resource.data;
+      let headBefore = get(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
+      let headAfter = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
+      return signedIn()
+        && request.auth.uid == accountId
+        && activeDevice(root.updatedByDeviceId)
+        && validCreateEnvelope(root, 'careerIndexPage', pageId)
+        && root.updatedByAccountId == accountId
+        && root.data.keys().hasOnly(['pageNumber', 'rivalryIds'])
+        && root.data.keys().hasAll(['pageNumber', 'rivalryIds'])
+        && root.data.pageNumber is int
+        && root.data.pageNumber == headBefore.data.sealedPageCount + 1
+        && pageId == 'page_' + string(root.data.pageNumber)
+        && headBefore.data.rivalryIds.size() == cmsCareerIndexPageCapacity()
+        && root.data.rivalryIds == headBefore.data.rivalryIds
+        && headAfter.revision == headBefore.revision + 1
+        && headAfter.data.sealedPageCount == root.data.pageNumber;
     }
 // CMS_PERSISTENT_PAIR_FUNCTIONS_END
 
@@ -168,4 +309,14 @@
       allow update: if cmsPersistentPairUpdateValid(accountId, pairId);
       allow list, delete: if false;
     }
+
+    match /accounts/{accountId}/careerIndex/{indexId} {
+      allow get: if signedIn()
+        && request.auth.uid == accountId
+        && (indexId == 'current' || indexId.matches('^page_[1-9][0-9]*$'));
+      allow create: if (indexId == 'current' && cmsCareerIndexHeadCreateValid(accountId))
+        || (indexId.matches('^page_[1-9][0-9]*$') && cmsCareerIndexPageCreateValid(accountId, indexId));
+      allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId);
+      allow list, delete: if false;
+    }
 // CMS_PERSISTENT_PAIR_MATCH_END
\ No newline at end of file
````

### Appendix B. Client: `js/persistentNikDanielPair.js`

````diff
diff --git a/js/persistentNikDanielPair.js b/js/persistentNikDanielPair.js
index f5dcf54..b9077b0 100644
--- a/js/persistentNikDanielPair.js
+++ b/js/persistentNikDanielPair.js
@@ -52,6 +52,18 @@
   function pairLinkReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"pairLinks",PAIR_DOC_ID);}
   function pairRivalryReference(context,rivalryId){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",rivalryId);}
   function pairDeviceReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"devices",context.deviceId);}
+  const CAREER_INDEX_HEAD_ID="current";
+  const CAREER_INDEX_PAGE_CAPACITY=500;
+  let careerIndexState=Object.freeze({status:"loading",accountId:null,rivalryIds:Object.freeze([]),sealedPageCount:0,code:null});
+  function pairCareerIndexReference(context,indexId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"careerIndex",indexId);}
+  function pairCareerIndexIdsValid(ids,min,max){return Array.isArray(ids)&&ids.length>=min&&ids.length<=max&&ids.every(id=>typeof id==="string"&&/^pair_[0-9a-f]{64}$/.test(id))&&new Set(ids).size===ids.length;}
+  function pairParseCareerIndexHead(value){if(!pairIsEnvelopeValue(value,"careerIndex",CAREER_INDEX_HEAD_ID))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="rivalryIds,sealedPageCount"||!pairCareerIndexIdsValid(data.rivalryIds,1,CAREER_INDEX_PAGE_CAPACITY)||!Number.isInteger(data.sealedPageCount)||data.sealedPageCount<0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return{revision:value.revision,contentHash:value.contentHash,rivalryIds:[...data.rivalryIds],sealedPageCount:data.sealedPageCount};}
+  function pairParseCareerIndexPage(value,pageNumber){const pageId=`page_${pageNumber}`;if(!pairIsEnvelopeValue(value,"careerIndexPage",pageId)||value.revision!==0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="pageNumber,rivalryIds"||data.pageNumber!==pageNumber||!pairCareerIndexIdsValid(data.rivalryIds,CAREER_INDEX_PAGE_CAPACITY,CAREER_INDEX_PAGE_CAPACITY))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return[...data.rivalryIds];}
+  // Pure: the exact career index writes that record rivalryId for this account in the pairing commit.
+  async function pairPlanCareerIndexAppend({headValue,rivalryId,accountId,deviceId,now,cryptoImpl=root.crypto}){const id=pairNormalizeRivalryId(rivalryId),head=headValue?pairParseCareerIndexHead(headValue):null;if(head&&head.rivalryIds.includes(id))return[];const writes=[];let revision=0,parentRevision=null,priorContentHash=null,data={rivalryIds:[id],sealedPageCount:0};if(head){revision=head.revision+1;parentRevision=head.revision;priorContentHash=head.contentHash;if(head.rivalryIds.length<CAREER_INDEX_PAGE_CAPACITY)data={rivalryIds:[...head.rivalryIds,id],sealedPageCount:head.sealedPageCount};else{const pageNumber=head.sealedPageCount+1,pageId=`page_${pageNumber}`,pageData={pageNumber,rivalryIds:[...head.rivalryIds]};writes.push({indexId:pageId,value:{schemaVersion:1,objectType:"careerIndexPage",objectId:pageId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndexPage",objectId:pageId,revision:0,data:pageData},cryptoImpl),priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data:pageData,tombstone:null}});data={rivalryIds:[id],sealedPageCount:pageNumber};}}writes.push({indexId:CAREER_INDEX_HEAD_ID,value:{schemaVersion:1,objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,parentRevision,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,data},cryptoImpl),priorContentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null}});return writes;}
+  async function pairReadCareerIndexWith({firestore,firebaseSdk,accountId}){const head=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",CAREER_INDEX_HEAD_ID));if(!head.exists())return{rivalryIds:[],sealedPageCount:0};const parsed=pairParseCareerIndexHead(head.data()),ordered=[];for(let pageNumber=1;pageNumber<=parsed.sealedPageCount;pageNumber+=1){const page=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",`page_${pageNumber}`));if(!page.exists())throw pairErrorWithCode("CAREER_INDEX_PAGE_MISSING","Part of the career index is missing.");ordered.push(...pairParseCareerIndexPage(page.data(),pageNumber));}ordered.push(...parsed.rivalryIds);if(new Set(ordered).size!==ordered.length)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return{rivalryIds:ordered,sealedPageCount:parsed.sealedPageCount};}
+  // Read-only: ordered rivalry ids (oldest first) for the signed-in account. Never throws; memory-only state.
+  async function pairReadCareerIndex(options={}){let accountId=null;try{let firestore=options.firestore,firebaseSdk=options.firebaseSdk;accountId=options.accountId||null;if(!firestore||!firebaseSdk||!accountId){const context=await pairResolveContext();firestore=context.services.firestore;firebaseSdk=context.services.firestoreSdk;accountId=context.accountId;}careerIndexState=pairFreezeDeep({status:"loading",accountId,rivalryIds:[],sealedPageCount:0,code:null});const result=await pairReadCareerIndexWith({firestore,firebaseSdk,accountId});careerIndexState=pairFreezeDeep({status:"ready",accountId,rivalryIds:result.rivalryIds,sealedPageCount:result.sealedPageCount,code:null});}catch(error){careerIndexState=pairFreezeDeep({status:"unavailable",accountId,rivalryIds:[],sealedPageCount:0,code:error?.code||"CAREER_INDEX_UNAVAILABLE"});}return careerIndexState;}
   function pairIsEnvelopeValue(value,objectType,objectId){return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");}
   function pairAssertActiveDevice(snapshot,deviceId){if(!snapshot?.exists?.())throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED","This browser is not ready yet.");const value=snapshot.data();if(!pairIsEnvelopeValue(value,"device",deviceId)||value.data?.deviceId!==deviceId||value.data?.state!=="active")throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED","This browser is not ready yet.");return value;}
   function pairRivalrySlotFor(value,accountId){if(!pairIsEnvelopeValue(value,"rivalry",value?.objectId)||!Array.isArray(value.data?.managerSlots))return null;return value.data.managerSlots.find(slot=>slot&&slot.accountId===accountId)||null;}
@@ -109,7 +121,12 @@
   async function pairAttachRecoveryPointer(context,binding,rivalryId){const connected=await pairLoadConnectedRivalry();if(!connected?.attachRivalry)return{ok:false,connected:null,result:null};const result=await connected.attachRivalry({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,deviceId:context.deviceId,binding,rivalryId,indexedDBImpl:root.indexedDB});if(result?.ok&&typeof connected.initialize==="function")await connected.initialize();return{ok:Boolean(result?.ok),connected,result};}
 
 function pairTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
-function pairCreateDurablePairWitness(context,role,manager,expectedRivalryId,connectionState){const sdk=context.services.firestoreSdk,normalizedRole=pairNormalizeManagerRole(role),expected=expectedRivalryId?pairNormalizeRivalryId(expectedRivalryId):null;return async({transaction,binding,capability,now,nowEpochMs})=>{const normalizedRivalryId=pairNormalizeRivalryId(capability);if(expected&&normalizedRivalryId!==expected)throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","The Showdown connection changed during provider mutation.");if(!binding||binding.managerRole!==normalizedRole||!pairValidSaveId(binding.saveId)||!pairValidProfileId(binding.profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The local career identity is invalid.");const pairRef=pairLinkReference(context),pairSnapshot=await transaction.get(pairRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===normalizedRole&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId));if(!oldSnapshot.exists()||!pairIsEnvelopeValue(oldSnapshot.data(),"rivalry",existing.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");const oldState=oldSnapshot.data().data?.connectionState;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");if(oldState==="pending-pair"){const oldInviteRef=sdk.doc(context.services.firestore,"rivalries",existing.rivalryId,"invites",existing.rivalryId),oldInviteSnapshot=await transaction.get(oldInviteRef),oldInvite=oldInviteSnapshot.exists()?oldInviteSnapshot.data():null,expiresAt=pairTimestampMillis(oldInvite?.data?.expiresAt),stillOpen=pairIsEnvelopeValue(oldInvite,"invite",existing.rivalryId)&&oldInvite.data?.state==="open"&&Number.isFinite(expiresAt)&&expiresAt>nowEpochMs;if(stillOpen)throw pairErrorWithCode("PERSISTENT_PAIR_PENDING_CONFLICT","This account already has a connection code waiting for the other player.");}else if(oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}const data={rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,linkedAt,lastConfirmedAt:now},envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});transaction.set(pairRef,envelope);return{ok:true,rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,managerLabel:manager.label,connectionState,providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:envelope.revision};};}
+function pairCreateDurablePairWitness(context,role,manager,expectedRivalryId,connectionState){const sdk=context.services.firestoreSdk,normalizedRole=pairNormalizeManagerRole(role),expected=expectedRivalryId?pairNormalizeRivalryId(expectedRivalryId):null;return async({transaction,binding,capability,now,nowEpochMs})=>{const normalizedRivalryId=pairNormalizeRivalryId(capability);if(expected&&normalizedRivalryId!==expected)throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","The Showdown connection changed during provider mutation.");if(!binding||binding.managerRole!==normalizedRole||!pairValidSaveId(binding.saveId)||!pairValidProfileId(binding.profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The local career identity is invalid.");
+  // READ PHASE: every transaction.get happens before any transaction.set (Sol S2C-005R2 §3).
+  const pairRef=pairLinkReference(context),indexRef=pairCareerIndexReference(context,CAREER_INDEX_HEAD_ID),pairSnapshot=await transaction.get(pairRef),indexSnapshot=await transaction.get(indexRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===normalizedRole&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId));if(!oldSnapshot.exists()||!pairIsEnvelopeValue(oldSnapshot.data(),"rivalry",existing.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");const oldState=oldSnapshot.data().data?.connectionState;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");if(oldState==="pending-pair"){const oldInviteRef=sdk.doc(context.services.firestore,"rivalries",existing.rivalryId,"invites",existing.rivalryId),oldInviteSnapshot=await transaction.get(oldInviteRef),oldInvite=oldInviteSnapshot.exists()?oldInviteSnapshot.data():null,expiresAt=pairTimestampMillis(oldInvite?.data?.expiresAt),stillOpen=pairIsEnvelopeValue(oldInvite,"invite",existing.rivalryId)&&oldInvite.data?.state==="open"&&Number.isFinite(expiresAt)&&expiresAt>nowEpochMs;if(stillOpen)throw pairErrorWithCode("PERSISTENT_PAIR_PENDING_CONFLICT","This account already has a connection code waiting for the other player.");}else if(oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}
+  const indexWrites=await pairPlanCareerIndexAppend({headValue:indexSnapshot.exists()?indexSnapshot.data():null,rivalryId:normalizedRivalryId,accountId:context.accountId,deviceId:context.deviceId,now});const data={rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,linkedAt,lastConfirmedAt:now},envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});
+  // WRITE PHASE
+  transaction.set(pairRef,envelope);for(const write of indexWrites)transaction.set(pairCareerIndexReference(context,write.indexId),write.value);return{ok:true,rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,managerLabel:manager.label,connectionState,providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:envelope.revision,careerIndexAppended:indexWrites.length>0};};}
 function pairCreateDurableCreationWitness(context,role,manager){return pairCreateDurablePairWitness(context,role,manager,null,"pending-pair");}
 function pairCreateDurableRedemptionWitness(context,role,manager,rivalryId){return pairCreateDurablePairWitness(context,role,manager,rivalryId,"active");}
 
@@ -241,5 +258,5 @@ async function pairStartOverFromRecovery(){
   function pairSubscribe(listener){if(typeof listener!=="function")return()=>{};pairListeners.add(listener);return()=>pairListeners.delete(listener);}
 
   if(root.addEventListener){root.addEventListener("career-mode-online-identity-change",()=>pairRender());root.addEventListener("online",()=>{if(state.initialized)void pairInitialize({force:true});});}
-  return pairFreezeDeep({contractVersion:4,feature:"persistent-nik-daniel-pair",pairDocumentId:PAIR_DOC_ID,publicDiscovery:false,billingRequired:false,persistentAcrossRegisteredBrowsers:true,pairLinkPersistentAcrossRegisteredBrowsers:true,gameplayCacheHydrationAcrossFreshBrowsers:false,freshBrowserGameplayRequiresVerifiedLocalRecovery:true,legacyPairMigration:false,managerByRole:MANAGER_BY_ROLE,roleByManager:ROLE_BY_MANAGER,normalizeRivalryId:pairNormalizeRivalryId,parsePairLink:pairParsePairLink,readPairLink:pairReadPairLink,persistPairLink:pairPersistPairLink,initialize:pairInitialize,startPairing:pairStartPairing,joinPairing:pairJoinPairing,retryPairLink:pairRetryPairLink,abandonCurrentShowdown:pairAbandonCurrentShowdown,discardStalePendingConnection:pairDiscardStalePendingConnection,continuePair:pairContinueOnlineShowdown,openRecovery:pairOpenRecoverySurface,startOver:pairStartOverFromRecovery,render:pairRender,subscribe:pairSubscribe,getState:()=>state});
+  return pairFreezeDeep({contractVersion:4,feature:"persistent-nik-daniel-pair",pairDocumentId:PAIR_DOC_ID,publicDiscovery:false,billingRequired:false,persistentAcrossRegisteredBrowsers:true,pairLinkPersistentAcrossRegisteredBrowsers:true,gameplayCacheHydrationAcrossFreshBrowsers:false,freshBrowserGameplayRequiresVerifiedLocalRecovery:true,legacyPairMigration:false,managerByRole:MANAGER_BY_ROLE,roleByManager:ROLE_BY_MANAGER,normalizeRivalryId:pairNormalizeRivalryId,parsePairLink:pairParsePairLink,readPairLink:pairReadPairLink,persistPairLink:pairPersistPairLink,initialize:pairInitialize,startPairing:pairStartPairing,joinPairing:pairJoinPairing,retryPairLink:pairRetryPairLink,careerIndexPageCapacity:CAREER_INDEX_PAGE_CAPACITY,readCareerIndex:pairReadCareerIndex,getCareerIndexState:()=>careerIndexState,planCareerIndexAppend:pairPlanCareerIndexAppend,createDurableCreationWitness:pairCreateDurableCreationWitness,createDurableRedemptionWitness:pairCreateDurableRedemptionWitness,abandonCurrentShowdown:pairAbandonCurrentShowdown,discardStalePendingConnection:pairDiscardStalePendingConnection,continuePair:pairContinueOnlineShowdown,openRecovery:pairOpenRecoverySurface,startOver:pairStartOverFromRecovery,render:pairRender,subscribe:pairSubscribe,getState:()=>state});
 });
\ No newline at end of file
````

### Appendix C. New emulator test: `tests/firebase/career-index-emulator.cjs` (full file)

````js
'use strict';
// JOB-07 career index proofs against the COMPOSED production Rules (firestore.spark.generated.rules built by BOTH scripts).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,runTransaction,setDoc}=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const firestoreSdk=require('firebase/firestore');
const path=require('node:path');
const Pair=require(path.join(__dirname,'../../js/persistentNikDanielPair.js'));
const Pairing=require(path.join(__dirname,'../../js/sparkPrivatePairing.js'));

const PROJECT_ID='demo-cms-career-index';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const CAP=500;
const hash=seed=>`sha256:${String(seed).repeat(64).slice(0,64)}`;
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;
const rid=n=>`pair_${n.toString(16).padStart(64,'0')}`;
let hashSeq=0;const nextHash=()=>`sha256:${(++hashSeq).toString(16).padStart(64,'0')}`;

function envelope({objectType,objectId,revision=0,parentRevision=null,contentHash=nextHash(),priorContentHash=null,updatedAt,accountId,deviceId:updatedByDeviceId=null,data}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:'live',contentHash,priorContentHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
const accountEnvelope=(uid,now)=>envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});
const deviceEnvelope=(uid,id,now)=>envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state:'active',registeredAt:now,lastSeenAt:now,revokedAt:null}});
const openSlot=slotId=>({slotId,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:'open',deletionConsent:false});
const managerSlot=(slotId,uid,ch)=>({slotId,accountId:uid,profileId:`profile_${ch.repeat(24)}`,saveId:`save_${ch.repeat(24)}`,displayLabel:slotId==='playerOne'?'Daniel':'Nik',entitlementState:'active',deletionConsent:false});
const MANAGER={playerOne:'daniel',playerTwo:'nik'};

// Plan the index writes exactly as the provider must: append, or seal a full head into page_N first.
function planIndex(head,uid,device,id,at,{mutate}={}){
  const writes=[];
  if(!head){
    writes.push(['current',envelope({objectType:'careerIndex',objectId:'current',updatedAt:at,accountId:uid,deviceId:device,data:{rivalryIds:[id],sealedPageCount:0}})]);
  }else{
    const ids=head.data.rivalryIds;let data;
    if(ids.length<CAP)data={rivalryIds:[...ids,id],sealedPageCount:head.data.sealedPageCount};
    else{
      const n=head.data.sealedPageCount+1;
      writes.push([`page_${n}`,envelope({objectType:'careerIndexPage',objectId:`page_${n}`,updatedAt:at,accountId:uid,deviceId:device,data:{pageNumber:n,rivalryIds:[...ids]}})]);
      data={rivalryIds:[id],sealedPageCount:n};
    }
    writes.push(['current',envelope({objectType:'careerIndex',objectId:'current',revision:head.revision+1,parentRevision:head.revision,priorContentHash:head.contentHash,updatedAt:at,accountId:uid,deviceId:device,data})]);
  }
  if(mutate)mutate(writes);
  return writes;
}

async function create(db,{uid,device,target,role='playerOne',ch='a',nowMs,index=true,mutate,expiresInMs=600000}){
  const pairRef=doc(db,'accounts',uid,'pairLinks','current'),headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{
    const pairSnap=await tx.get(pairRef),headSnap=index?await tx.get(headRef):{exists:()=>false};           // ALL reads first
    const at=Timestamp.fromMillis(nowMs),invited=role==='playerOne'?'playerTwo':'playerOne';
    const slots=role==='playerOne'?[managerSlot('playerOne',uid,ch),openSlot('playerTwo')]:[openSlot('playerOne'),managerSlot('playerTwo',uid,ch)];
    const rivalry=envelope({objectType:'rivalry',objectId:target,updatedAt:at,accountId:uid,deviceId:device,data:{connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[uid],createdByAccountId:uid,createdAt:at}});
    const invite=envelope({objectType:'invite',objectId:target,updatedAt:at,accountId:uid,deviceId:device,data:{purpose:'rivalry-pairing',slotId:invited,createdByAccountId:uid,createdAt:at,expiresAt:Timestamp.fromMillis(nowMs+expiresInMs),state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null}});
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
    if(pairSnap.exists()){const p=pairSnap.data();revision=p.revision+1;parentRevision=p.revision;priorContentHash=p.contentHash;linkedAt=p.data.linkedAt;}
    const pair=envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,priorContentHash,updatedAt:at,accountId:uid,deviceId:device,data:{rivalryId:target,managerRole:role,managerId:MANAGER[role],linkedAt,lastConfirmedAt:at}});
    const writes=index?planIndex(headSnap.exists()?headSnap.data():null,uid,device,target,at,{mutate}):[];
    tx.set(pairRef,pair);tx.set(doc(db,'rivalries',target),rivalry);tx.set(doc(db,'rivalries',target,'invites',target),invite);
    for(const [id,value] of writes)tx.set(doc(db,'accounts',uid,'careerIndex',id),value);
    return target;
  });
}

async function redeem(db,{uid,device,target,ch='b',nowMs,index=true,mutate,forgeRole}){
  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current'),headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{
    const rs=await tx.get(rivalryRef),is=await tx.get(inviteRef),ps=await tx.get(pairRef),hs=index?await tx.get(headRef):{exists:()=>false};
    const r=rs.data(),inv=is.data(),at=Timestamp.fromMillis(nowMs),role=inv.data.slotId,linkRole=forgeRole||role;
    const slots=r.data.managerSlots.map(s=>s.slotId===role?managerSlot(role,uid,ch):{...s});
    tx.set(rivalryRef,envelope({objectType:'rivalry',objectId:target,revision:r.revision+1,parentRevision:r.revision,priorContentHash:r.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:{...r.data,connectionState:'active',managerSlots:slots,authorizedAccountIds:[inv.data.createdByAccountId,uid]}}));
    tx.set(inviteRef,envelope({objectType:'invite',objectId:target,revision:inv.revision+1,parentRevision:inv.revision,priorContentHash:inv.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:{...inv.data,state:'redeemed',redeemedByAccountId:uid,redeemedAt:at,revokedAt:null}}));
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
    if(ps.exists()){const p=ps.data();revision=p.revision+1;parentRevision=p.revision;priorContentHash=p.contentHash;linkedAt=p.data.linkedAt;}
    tx.set(pairRef,envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,priorContentHash,updatedAt:at,accountId:uid,deviceId:device,data:{rivalryId:target,managerRole:linkRole,managerId:MANAGER[linkRole],linkedAt,lastConfirmedAt:at}}));
    if(index)for(const [id,value] of planIndex(hs.exists()?hs.data():null,uid,device,target,at,{mutate}))tx.set(doc(db,'accounts',uid,'careerIndex',id),value);
    return target;
  });
}

// A head-only write (no creation/redemption in the same commit).
async function headOnly(db,uid,device,fn,nowMs){
  const headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{const h=(await tx.get(headRef)).data();const data=fn(h.data);tx.set(headRef,envelope({objectType:'careerIndex',objectId:'current',revision:h.revision+1,parentRevision:h.revision,priorContentHash:h.contentHash,updatedAt:Timestamp.fromMillis(nowMs),accountId:uid,deviceId:device,data}));});
}

async function closeRivalry(env,target){
  await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'rivalries',target);const r=(await getDoc(ref)).data();await setDoc(ref,{...r,revision:r.revision+1,parentRevision:r.revision,priorContentHash:r.contentHash,contentHash:nextHash(),data:{...r.data,connectionState:'closed'}});});
}
// Expire relative to the REAL clock: request.time is server time, not the test's future tick.
async function expireInvite(env,target){
  await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'rivalries',target,'invites',target);const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{...v.data,expiresAt:Timestamp.fromMillis(Date.now()-60000)}});});
}
const ids=async(env,uid)=>{let out=null;await env.withSecurityRulesDisabled(async c=>{const s=await getDoc(doc(c.firestore(),'accounts',uid,'careerIndex','current'));out=s.exists()?s.data():null;});return out;};
const rivalryExists=async(env,id)=>{let out=false;await env.withSecurityRulesDisabled(async c=>{out=(await getDoc(doc(c.firestore(),'rivalries',id))).exists();});return out;};
let step=0;
async function check(id,label,promise){await promise;step+=1;console.log(`ok ${step} ${id} ${label}`);}
const note=(id,label)=>{step+=1;console.log(`ok ${step} ${id} ${label}`);};

(async()=>{
  // I0: the COMPOSED production Rules (both build scripts), never a single fragment.
  assert.match(RULES,/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/,'I0 composed Rules must contain the career index match');
  assert.match(RULES,/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/,'I0 composed Rules must contain the persistent pair fragment');
  assert.match(RULES,/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/,'I0 composed Rules must contain the Shared Journey fragments');
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const t0=Date.now(),now=Timestamp.fromMillis(t0);
    const D='acct_daniel',N='acct_nik',S='acct_stranger',O='acct_other';
    const dev={[D]:deviceId('d'),[N]:deviceId('e'),[S]:deviceId('5'),[O]:deviceId('6')},dev2={[D]:deviceId('7'),[N]:deviceId('8')};
    const OLD_ACTIVE=rid(0xdead1),OLD_CLOSED=rid(0xdead2),STALE=rid(0xdead3),FOREIGN=rid(0xdead4);
    await env.withSecurityRulesDisabled(async c=>{
      const db=c.firestore();
      for(const uid of [D,N,S,O]){await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(db,'accounts',uid,'devices',dev[uid]),deviceEnvelope(uid,dev[uid],now));if(dev2[uid])await setDoc(doc(db,'accounts',uid,'devices',dev2[uid]),deviceEnvelope(uid,dev2[uid],now));}
      // Pre-deployment development rivalries: they exist, Daniel and Nik are members, nobody ever indexed them.
      const mk=(id,state,a,b)=>envelope({objectType:'rivalry',objectId:id,updatedAt:now,accountId:a.accountId,deviceId:dev[D],data:{connectionState:state,connectionStateBeforeDeletion:null,managerSlots:[a,b],authorizedAccountIds:[a.accountId,b.accountId].filter(Boolean),createdByAccountId:a.accountId,createdAt:now}});
      await setDoc(doc(db,'rivalries',OLD_ACTIVE),mk(OLD_ACTIVE,'active',managerSlot('playerOne',D,'1'),managerSlot('playerTwo',N,'2')));
      await setDoc(doc(db,'rivalries',OLD_CLOSED),mk(OLD_CLOSED,'closed',managerSlot('playerOne',D,'3'),managerSlot('playerTwo',N,'4')));
      await setDoc(doc(db,'rivalries',FOREIGN),mk(FOREIGN,'active',managerSlot('playerOne',S,'5'),managerSlot('playerTwo',O,'6')));
      await setDoc(doc(db,'rivalries',STALE),mk(STALE,'pending-pair',managerSlot('playerOne',D,'7'),openSlot('playerTwo')));
      await setDoc(doc(db,'rivalries',STALE,'invites',STALE),envelope({objectType:'invite',objectId:STALE,updatedAt:now,accountId:D,deviceId:dev[D],data:{purpose:'rivalry-pairing',slotId:'playerTwo',createdByAccountId:D,createdAt:now,expiresAt:Timestamp.fromMillis(t0+600000),state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null}}));
      await setDoc(doc(db,'accounts',N,'pairLinks','current'),envelope({objectType:'pairLink',objectId:'current',updatedAt:now,accountId:N,deviceId:dev[N],data:{rivalryId:OLD_ACTIVE,managerRole:'playerTwo',managerId:'nik',linkedAt:now,lastConfirmedAt:now}}));
    });
    const db={[D]:env.authenticatedContext(D).firestore(),[N]:env.authenticatedContext(N).firestore(),[S]:env.authenticatedContext(S).firestore()};
    const anon=env.unauthenticatedContext().firestore();
    let t=t0+1000;const tick=()=>(t+=1000);
    const X1=rid(1),X2=rid(2),X3=rid(3),X4=rid(4),X5=rid(5);
    const headRef=(dbx,uid,id='current')=>doc(dbx,'accounts',uid,'careerIndex',id);

    // B: creation by Daniel (first pair-link creation, then replacement)
    await check('B1','creation without an index write is denied (first pair link)',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),index:false})));
    assert.equal(await rivalryExists(env,X1),false,'B1 rolled back');
    await check('B2','index create naming a different rivalry is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=[X2];}})));
    await check('B3','index create with two ids (backfill attempt) is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=[OLD_CLOSED,X1];}})));
    await check('B4','index create with sealedPageCount 1 is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.sealedPageCount=1;}})));
    await check('B5','index create from an unregistered device is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].updatedByDeviceId=deviceId('9');}})));
    await check('B6','index create signed by another account is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].updatedByAccountId=N;}})));
    await check('B7','first creation: pair link create + rivalry + invite + index create commit together',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick()})));
    let h=await ids(env,D);assert.deepEqual(h.data,{rivalryIds:[X1],sealedPageCount:0});assert.equal(h.revision,0);

    // A: access
    await check('A1','Daniel gets his own careerIndex/current',assertSucceeds(getDoc(headRef(db[D],D))));
    await check('A2','Nik cannot get Daniel careerIndex/current',assertFails(getDoc(headRef(db[N],D))));
    await check('A3','stranger cannot get Daniel careerIndex/current',assertFails(getDoc(headRef(db[S],D))));
    await check('A4','unauthenticated get is denied',assertFails(getDoc(headRef(anon,D))));
    await check('A5','owner list of careerIndex is denied',assertFails(getDocs(collection(db[D],'accounts',D,'careerIndex'))));
    await check('A6','owner delete of careerIndex/current is denied',assertFails(deleteDoc(headRef(db[D],D))));
    await check('A7','owner get of a non-index id is denied',assertFails(getDoc(headRef(db[D],D,'backup'))));

    await expireInvite(env,X1);
    await check('B8','replacement creation without an index append is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick(),index:false})));
    await check('B9','replacement creation: pair link update + index append commit together',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick()})));
    h=await ids(env,D);assert.deepEqual(h.data.rivalryIds,[X1,X2]);assert.equal(h.revision,1);

    // C: Nik (pre-deployment link, then redemption)
    const reconfirm=(dbx,uid,withIndex)=>runTransaction(dbx,async tx=>{const ref=doc(dbx,'accounts',uid,'pairLinks','current'),href=headRef(dbx,uid);const p=(await tx.get(ref)).data();await tx.get(href);const at=Timestamp.fromMillis(tick());tx.set(ref,{...p,revision:p.revision+1,parentRevision:p.revision,priorContentHash:p.contentHash,contentHash:nextHash(),updatedAt:at,updatedByDeviceId:dev[uid],data:{...p.data,lastConfirmedAt:at}});if(withIndex)tx.set(href,envelope({objectType:'careerIndex',objectId:'current',updatedAt:at,accountId:uid,deviceId:dev[uid],data:{rivalryIds:[p.data.rivalryId],sealedPageCount:0}}));});
    await check('C1','reconfirming a pre-deployment link together with an index create is denied (no import)',assertFails(reconfirm(db[N],N,true)));
    await check('C2','reconfirming a pre-deployment link alone still works (Continue is not import)',assertSucceeds(reconfirm(db[N],N,false)));
    assert.equal(await ids(env,N),null,'C2 a pre-deployment link never creates an index');
    await closeRivalry(env,OLD_ACTIVE);
    await check('C3','redemption without an index write is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),index:false})));
    await check('C4','stale pre-deployment invite (creator never indexed it) cannot be redeemed',assertFails(redeem(db[N],{uid:N,device:dev[N],target:STALE,nowMs:tick()})));
    await check('C5','redemption whose pair link claims the other role is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),forgeRole:'playerOne'})));
    await check('C6','redemption whose index write is signed by another account is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),mutate:w=>{w[0][1].updatedByAccountId=D;}})));
    await check('C7','redemption: pair link replace + rivalry + invite + index create commit together',assertSucceeds(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick()})));
    assert.deepEqual((await ids(env,N)).data.rivalryIds,[X2]);

    // D: append-only integrity (head-only writes, no creation/redemption in the commit)
    const D_=(id,label,fn)=>check(id,label,assertFails(headOnly(db[D],D,dev[D],fn,tick())));
    await D_('D1','reorder is denied',d=>({...d,rivalryIds:[X2,X1]}));
    await D_('D2','reorder plus a new id is denied',d=>({...d,rivalryIds:[X2,X1,X3]}));
    await D_('D3','duplicate append is denied',d=>({...d,rivalryIds:[X1,X2,X2]}));
    await D_('D4','two new ids in one write are denied',d=>({...d,rivalryIds:[X1,X2,X3,X4]}));
    await D_('D5','replacing an existing entry is denied',d=>({...d,rivalryIds:[X1,X3]}));
    await D_('D6','truncation is denied',d=>({...d,rivalryIds:[X1]}));
    await D_('D7','standalone append of a closed development rivalry is denied',d=>({...d,rivalryIds:[X1,X2,OLD_CLOSED]}));
    await D_('D8','standalone append of an active development rivalry is denied',d=>({...d,rivalryIds:[X1,X2,OLD_ACTIVE]}));
    await D_('D9','append of a rivalry the account is not in is denied',d=>({...d,rivalryIds:[X1,X2,FOREIGN]}));
    await D_('D10','no-op rewrite is denied',d=>({...d}));
    await D_('D11','sealedPageCount tamper is denied',d=>({...d,sealedPageCount:1}));
    await check('D12','Nik cannot write Daniel index',assertFails(setDoc(headRef(db[N],D),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:N,deviceId:dev[N],data:{rivalryIds:[X2],sealedPageCount:0}}))));
    await check('D13','stranger cannot create an index naming a rivalry they are not in',assertFails(setDoc(headRef(db[S],S),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:S,deviceId:dev[S],data:{rivalryIds:[X2],sealedPageCount:0}}))));
    await check('D14','head write with a skipped revision is denied',assertFails(runTransaction(db[D],async tx=>{const ref=headRef(db[D],D);const v=(await tx.get(ref)).data();tx.set(ref,{...v,revision:v.revision+2,parentRevision:v.revision,priorContentHash:v.contentHash,contentHash:nextHash(),data:{...v.data,rivalryIds:[...v.data.rivalryIds,X3]}});})));

    // E: idempotency
    const before=await ids(env,D);
    await check('E1','pair-link reconfirm of the same rivalry without an index write succeeds',assertSucceeds(runTransaction(db[D],async tx=>{const ref=doc(db[D],'accounts',D,'pairLinks','current');const p=(await tx.get(ref)).data();const at=Timestamp.fromMillis(tick());tx.set(ref,{...p,revision:p.revision+1,parentRevision:p.revision,priorContentHash:p.contentHash,contentHash:nextHash(),updatedAt:at,data:{...p.data,lastConfirmedAt:at}});})));
    assert.deepEqual(await ids(env,D),before,'E1 reconfirm leaves the index byte-identical');
    await check('E2','replaying a committed creation (same rivalry id) is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick()})));
    assert.deepEqual((await ids(env,D)).data.rivalryIds,[X1,X2],'E2 index unchanged');

    // F: two-device races
    await closeRivalry(env,X2);
    const race=await Promise.allSettled([create(db[D],{uid:D,device:dev[D],target:X3,nowMs:tick()}),create(env.authenticatedContext(D).firestore(),{uid:D,device:dev2[D],target:X4,nowMs:tick()})]);
    h=await ids(env,D);assert.equal(race.filter(r=>r.status==='fulfilled').length,1,'F1 exactly one creation commits');assert.equal(h.data.rivalryIds.length,3,'F1 exactly one new entry');
    const winner=h.data.rivalryIds[2];assert.ok([X3,X4].includes(winner));note('F1','two-device creation race: one commit, one new entry');
    const race2=await Promise.allSettled([redeem(env.authenticatedContext(N).firestore(),{uid:N,device:dev[N],target:winner,nowMs:tick()}),redeem(env.authenticatedContext(N).firestore(),{uid:N,device:dev2[N],target:winner,nowMs:tick()})]);
    assert.equal(race2.filter(r=>r.status==='fulfilled').length,1,'F2 exactly one redemption commits');
    assert.deepEqual((await ids(env,N)).data.rivalryIds,[X2,winner],'F2 one entry per redeemed rivalry');note('F2','two-device redemption race: one commit, one entry');

    // H: agreement on the shared, paired set (Daniel's never-paired X1 excluded; no cross-account read by clients)
    const dIds=(await ids(env,D)).data.rivalryIds,nIds=(await ids(env,N)).data.rivalryIds,paired=[];
    await env.withSecurityRulesDisabled(async c=>{for(const id of dIds){const r=(await getDoc(doc(c.firestore(),'rivalries',id))).data();if(r.data.authorizedAccountIds.length===2)paired.push(id);}});
    assert.deepEqual(paired,nIds,'H1');note('H1',"Daniel's paired ids equal Nik's ids, same order");

    // G: capacity and paging
    await closeRivalry(env,winner);
    const full=Array.from({length:CAP},(_,i)=>rid(0x100000+i));
    await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'accounts',D,'careerIndex','current');const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{rivalryIds:full,sealedPageCount:0}});});
    await check('G1','creation at capacity without any index write is denied (never start unindexed)',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),index:false})));
    await check('G2','a 501st entry without sealing a page is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w.splice(0,1);w[0][1].data={rivalryIds:[...full,X5],sealedPageCount:0};}})));
    await check('G3','sealing a page that drops an id is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=full.slice(1);}})));
    await check('G4','sealing into the wrong page number is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w[0][0]='page_2';w[0][1].objectId='page_2';w[0][1].data.pageNumber=2;w[1][1].data.sealedPageCount=2;}})));
    await check('G5','creation at capacity seals page_1 and starts a new head in the same commit',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick()})));
    h=await ids(env,D);assert.deepEqual(h.data,{rivalryIds:[X5],sealedPageCount:1});
    await check('G6','owner gets page_1',assertSucceeds(getDoc(headRef(db[D],D,'page_1'))));
    await check('G7','other manager cannot get page_1',assertFails(getDoc(headRef(db[N],D,'page_1'))));
    await check('G8','page update is denied',assertFails(setDoc(headRef(db[D],D,'page_1'),envelope({objectType:'careerIndexPage',objectId:'page_1',revision:1,parentRevision:0,priorContentHash:hash('0'),updatedAt:now,accountId:D,deviceId:dev[D],data:{pageNumber:1,rivalryIds:full.slice(1)}}))));
    await check('G9','page delete is denied',assertFails(deleteDoc(headRef(db[D],D,'page_1'))));
    await check('G10','standalone page create is denied',assertFails(setDoc(headRef(db[D],D,'page_2'),envelope({objectType:'careerIndexPage',objectId:'page_2',updatedAt:now,accountId:D,deviceId:dev[D],data:{pageNumber:2,rivalryIds:[X5]}}))));

    // P: provider level (real js/persistentNikDanielPair.js witnesses inside real js/sparkPrivatePairing.js transactions)
    const PD='acct_prov_daniel',PN='acct_prov_nik';const pdev={[PD]:deviceId('a'),[PN]:deviceId('b')};
    await env.withSecurityRulesDisabled(async c=>{for(const uid of [PD,PN]){await setDoc(doc(c.firestore(),'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(c.firestore(),'accounts',uid,'devices',pdev[uid]),deviceEnvelope(uid,pdev[uid],now));}});
    const pdb={[PD]:env.authenticatedContext(PD).firestore(),[PN]:env.authenticatedContext(PN).firestore()};
    const ctx=uid=>({services:{firestoreSdk,firestore:pdb[uid]},accountId:uid,deviceId:pdev[uid]});
    const identity=uid=>({schemaVersion:1,installationId:`installation_${pdev[uid].slice(7)}`,deviceId:pdev[uid],createdAtEpochMs:t0-180000});
    const binding=(role,ch)=>({saveId:`save_${ch.repeat(24)}`,profileId:`profile_${ch.repeat(24)}`,managerRole:role,displayLabel:role==='playerOne'?'Daniel':'Nik'});
    const readIdx=(asUid,ofUid)=>Pair.readCareerIndex({firestore:pdb[asUid],firebaseSdk:firestoreSdk,accountId:ofUid});
    const pair=async capability=>{
      const created=await Pairing.createPairing({user:{uid:PD},firestore:pdb[PD],firebaseSdk:firestoreSdk,identity:identity(PD),binding:binding('playerOne','a'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableCreationWitness(ctx(PD),'playerOne',Pair.managerByRole.playerOne)});
      assert.equal(created.ok,true,JSON.stringify(created));assert.equal(created.durableWitness.careerIndexAppended,true);
      const redeemed=await Pairing.redeemPairing({user:{uid:PN},firestore:pdb[PN],firebaseSdk:firestoreSdk,identity:identity(PN),binding:binding('playerTwo','b'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableRedemptionWitness(ctx(PN),'playerTwo',Pair.managerByRole.playerTwo,capability)});
      assert.equal(redeemed.ok,true,JSON.stringify(redeemed));
    };
    let r=await readIdx(PD,PD);assert.deepEqual([r.status,r.rivalryIds],['ready',[]]);note('P1','readCareerIndex on a new career is ready and empty');
    const P1=rid(0x9001),P2=rid(0x9002);
    await pair(P1);note('P2','provider creation and redemption each commit pair link + rivalry + invite + index in one transaction');
    for(const uid of [PD,PN]){r=await readIdx(uid,uid);assert.deepEqual([r.status,r.rivalryIds],['ready',[P1]]);}note('P3','both managers read the same ordered ids');
    r=await readIdx(PN,PD);assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);note('P4',"reading another account's index is unavailable, never empty");
    await closeRivalry(env,P1);await pair(P2);
    for(const uid of [PD,PN]){r=await readIdx(uid,uid);assert.deepEqual(r.rivalryIds,[P1,P2]);}note('P5','second Showdown: both indexes are [P1, P2]; the pair link moved on, history stayed');
    await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'accounts',PN,'careerIndex','current');const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{...v.data,sealedPageCount:1}});});
    r=await readIdx(PN,PN);assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);note('P6','a missing sealed page makes the index unavailable, never shorter');
    console.log(`PASS career index composed-Rules emulator: ${step} numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).`);
  }finally{
    try{await env.clearFirestore();}catch(_e){}
    await env.cleanup();
  }
})().catch(e=>{process.stderr.write(`${e&&e.stack?e.stack:e}\n`);process.exit(1);});
````

### Appendix D. New contract test: `tests/contracts/career-index-contracts.cjs` (full file; K ids in §6.1 map to its numbered blocks 1-5)

````js
'use strict';
// JOB-07 career index contracts. Plain node:assert, no Firebase, no emulator.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Pair=require(path.join(root,'js/persistentNikDanielPair.js'));
const rid=n=>`pair_${n.toString(16).padStart(64,'0')}`;
const ts=ms=>({toMillis:()=>ms});
const CAP=500;

(async()=>{
  // 1. constants
  assert.equal(Pair.careerIndexPageCapacity,CAP);
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  assert.match(fragment,/function cmsCareerIndexPageCapacity\(\) \{\s*return 500;\s*\}/,'Rules capacity must equal the client constant');

  // 2. pure append plan
  const at=ts(1);
  let w=await Pair.planCareerIndexAppend({headValue:null,rivalryId:rid(1),accountId:'acct',deviceId:'device_x',now:at});
  assert.equal(w.length,1);assert.equal(w[0].indexId,'current');assert.deepEqual(w[0].value.data,{rivalryIds:[rid(1)],sealedPageCount:0});assert.equal(w[0].value.revision,0);assert.equal(w[0].value.parentRevision,null);
  const head=w[0].value;
  w=await Pair.planCareerIndexAppend({headValue:head,rivalryId:rid(2),accountId:'acct',deviceId:'device_x',now:at});
  assert.deepEqual(w[0].value.data.rivalryIds,[rid(1),rid(2)]);assert.equal(w[0].value.revision,1);assert.equal(w[0].value.priorContentHash,head.contentHash);
  assert.deepEqual(await Pair.planCareerIndexAppend({headValue:head,rivalryId:rid(1),accountId:'acct',deviceId:'device_x',now:at}),[],'already indexed: no write (idempotent)');
  const full={...head,data:{rivalryIds:Array.from({length:CAP},(_,i)=>rid(1000+i)),sealedPageCount:2}};
  w=await Pair.planCareerIndexAppend({headValue:full,rivalryId:rid(9),accountId:'acct',deviceId:'device_x',now:at});
  assert.deepEqual(w.map(x=>x.indexId),['page_3','current'],'seal page before head');
  assert.deepEqual(w[0].value.data,{pageNumber:3,rivalryIds:full.data.rivalryIds});assert.deepEqual(w[1].value.data,{rivalryIds:[rid(9)],sealedPageCount:3});
  await assert.rejects(Pair.planCareerIndexAppend({headValue:{...head,data:{rivalryIds:[rid(1),rid(1)],sealedPageCount:0}},rivalryId:rid(2),accountId:'a',deviceId:'d',now:at}),/invalid/i);
  await assert.rejects(Pair.planCareerIndexAppend({headValue:{...head,data:{rivalryIds:[rid(1)],sealedPageCount:0,extra:1}},rivalryId:rid(2),accountId:'a',deviceId:'d',now:at}),/invalid/i);

  // 3. all transaction reads before any write, both witnesses, including replacement and rollover
  function fakeTx(docs){const log=[];return {log,tx:{get:async ref=>{log.push(['get',ref]);const v=docs[ref];return {exists:()=>v!==undefined,data:()=>v};},set:(ref,value)=>{log.push(['set',ref,value]);}}};}
  const sdk={doc:(_f,...parts)=>parts.join('/'),Timestamp:{fromMillis:ts}};
  const ctx={services:{firestoreSdk:sdk,firestore:{}},accountId:'acct',deviceId:`device_${'a'.repeat(32)}`};
  const binding={saveId:`save_${'a'.repeat(24)}`,profileId:`profile_${'a'.repeat(24)}`,managerRole:'playerOne'};
  const prior={schemaVersion:1,objectType:'pairLink',objectId:'current',revision:0,lifecycleState:'live',contentHash:'sha256:p',data:{rivalryId:rid(7),managerRole:'playerOne',managerId:'daniel',linkedAt:at,lastConfirmedAt:at}};
  const closed={schemaVersion:1,objectType:'rivalry',objectId:rid(7),revision:3,lifecycleState:'live',contentHash:'sha256:r',data:{connectionState:'closed'}};
  for(const [label,docs] of [['first',{}],['replacement',{'accounts/acct/pairLinks/current':prior,[`rivalries/${rid(7)}`]:closed,'accounts/acct/careerIndex/current':head}],['rollover',{'accounts/acct/pairLinks/current':prior,[`rivalries/${rid(7)}`]:closed,'accounts/acct/careerIndex/current':full}]]){
    for(const kind of ['creation','redemption']){
      const {log,tx}=fakeTx(docs);
      const witness=kind==='creation'?Pair.createDurableCreationWitness(ctx,'playerOne',Pair.managerByRole.playerOne):Pair.createDurableRedemptionWitness(ctx,'playerOne',Pair.managerByRole.playerOne,rid(5));
      const result=await witness({transaction:tx,binding,capability:rid(5),now:at,nowEpochMs:1});
      assert.equal(result.ok,true);
      const firstSet=log.findIndex(e=>e[0]==='set');
      assert.ok(firstSet>0,`${label}/${kind}: writes happen`);
      assert.equal(log.slice(firstSet).some(e=>e[0]==='get'),false,`${label}/${kind}: no transaction.get after the first transaction.set`);
      assert.ok(log.some(e=>e[0]==='get'&&e[1]==='accounts/acct/careerIndex/current'),`${label}/${kind}: index head is read`);
      const sets=log.filter(e=>e[0]==='set').map(e=>e[1]);
      assert.ok(sets.includes('accounts/acct/pairLinks/current')&&sets.includes('accounts/acct/careerIndex/current'),`${label}/${kind}: pair link and index written together`);
      if(label==='rollover')assert.ok(sets.includes('accounts/acct/careerIndex/page_3'));
    }
  }

  // 4. readCareerIndex: never throws, ready/unavailable, ordered, memory only
  const env=(docs,{fail}={})=>({firestore:{},accountId:'acct',firebaseSdk:{doc:(_f,...p)=>p.join('/'),getDoc:async ref=>{if(fail)throw Object.assign(new Error('denied'),{code:'permission-denied'});const v=docs[ref];return {exists:()=>v!==undefined,data:()=>v};}}});
  let r=await Pair.readCareerIndex(env({}));assert.deepEqual([r.status,r.rivalryIds],['ready',[]]);
  const page1={schemaVersion:1,objectType:'careerIndexPage',objectId:'page_1',revision:0,lifecycleState:'live',contentHash:'sha256:x',data:{pageNumber:1,rivalryIds:full.data.rivalryIds}};
  const head2={...head,data:{rivalryIds:[rid(1)],sealedPageCount:1}};
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':head2,'accounts/acct/careerIndex/page_1':page1}));
  assert.equal(r.status,'ready');assert.deepEqual(r.rivalryIds,[...full.data.rivalryIds,rid(1)],'sealed pages first, oldest first');
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':head2}));assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);
  r=await Pair.readCareerIndex(env({},{fail:true}));assert.equal(r.status,'unavailable');
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':{...head,data:{rivalryIds:'x',sealedPageCount:0}}}));assert.equal(r.status,'unavailable');
  assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rivalryIds));
  const src=read('js/persistentNikDanielPair.js');const block=src.slice(src.indexOf('const CAREER_INDEX_HEAD_ID'),src.indexOf('function pairIsEnvelopeValue('));
  assert.doesNotMatch(block,/localStorage|sessionStorage|indexedDB|getDocs\(|collection\(|query\(/,'career index code is memory-only and reads exact documents');

  // 5. Rules text (fragment) and the composed production artifact
  assert.match(fragment,/next\[0:prior\.size\(\)\] == prior/,'exact old-order preservation');
  assert.match(fragment,/!\(next\[prior\.size\(\)\] in prior\)/,'exactly one new unique id');
  assert.match(fragment,/cmsCareerIndexPairLinkCoupled\(accountId, root\.data\.rivalryId\)/,'coupling on first pair-link creation');
  assert.match(fragment,/cmsCareerIndexPairLinkCoupled\(accountId, after\.data\.rivalryId\)/,'coupling on pair-link replacement');
  const witnessBlock=fragment.slice(fragment.indexOf('function cmsPersistentPairCreationWitnessValid'),fragment.indexOf('function cmsPersistentPairDataValid'));
  assert.doesNotMatch(witnessBlock,/careerIndex/,'rivalry create/redeem rules are at the 1,000-expression edge: never add career index checks there');
  const indexMatch=fragment.slice(fragment.indexOf('match /accounts/{accountId}/careerIndex/{indexId}'),fragment.indexOf('// CMS_PERSISTENT_PAIR_MATCH_END'));
  assert.match(indexMatch,/allow list, delete: if false;/);
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  assert.equal((generated.match(/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/g)||[]).length,1);
  assert.equal((generated.match(/function cmsCareerIndexHeadUpdateValid\(accountId\)/g)||[]).length,1);
  console.log('PASS career index contracts: constants, pure append plan, reads-before-writes, readCareerIndex states, Rules text, composed artifact.');
})().catch(e=>{console.error(e);process.exit(1);});
````

### Appendix E. Fixture update: `tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs`

````diff
diff --git a/tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs b/tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs
index 162b98d..89945cd 100644
--- a/tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs
+++ b/tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs
@@ -23,14 +23,18 @@ function rivalryEnvelope(rivalryId,now,p1,p2,state='active'){
 function inviteEnvelope(rivalryId,now,expiresAt,state='open'){
   return envelope({objectType:'invite',objectId:rivalryId,updatedAt:now,accountId:'acct_d',deviceId:deviceId('d'),data:{purpose:'rivalry-pairing',slotId:'playerTwo',createdByAccountId:'acct_d',createdAt:now,expiresAt,state,redeemedByAccountId:null,redeemedAt:null,revokedAt:null}});
 }
+function careerIndexWrite(uid,device,headSnapshot,target,at){
+  const head=headSnapshot.exists()?headSnapshot.data():null;
+  return envelope({objectType:'careerIndex',objectId:'current',revision:head?head.revision+1:0,parentRevision:head?head.revision:null,contentHash:hash('9'),priorContentHash:head?head.contentHash:null,updatedAt:at,accountId:uid,deviceId:device,data:{rivalryIds:head?[...head.data.rivalryIds,target]:[target],sealedPageCount:head?head.data.sealedPageCount:0}});
+}
 function pairEnvelope(uid,id,role,managerId,device,linkedAt,lastConfirmedAt,{revision=0,parentRevision=null,contentHash=hash('a'),priorContentHash=null}={}){
   return envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,contentHash,priorContentHash,updatedAt:lastConfirmedAt,accountId:uid,deviceId:device,data:{rivalryId:id,managerRole:role,managerId,linkedAt,lastConfirmedAt}});
 }
 
-async function atomicCreateWithPairLink(db,{uid,device,target,role,managerId,char,nowMs,writePairLink=true}){
-  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current');
+async function atomicCreateWithPairLink(db,{uid,device,target,role,managerId,char,nowMs,writePairLink=true,writeCareerIndex=writePairLink}){
+  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current'),indexRef=doc(db,'accounts',uid,'careerIndex','current');
   return runTransaction(db,async transaction=>{
-    const pairSnapshot=await transaction.get(pairRef),at=Timestamp.fromMillis(nowMs+4000),expiresAt=Timestamp.fromMillis(nowMs+604000),invitedRole=role==='playerOne'?'playerTwo':'playerOne';
+    const pairSnapshot=await transaction.get(pairRef),indexSnapshot=await transaction.get(indexRef),at=Timestamp.fromMillis(nowMs+4000),expiresAt=Timestamp.fromMillis(nowMs+604000),invitedRole=role==='playerOne'?'playerTwo':'playerOne';
     const p1=role==='playerOne'?managerSlot('playerOne',uid,char):openSlot('playerOne'),p2=role==='playerTwo'?managerSlot('playerTwo',uid,char):openSlot('playerTwo');
     const rivalryData={connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:[p1,p2],authorizedAccountIds:[uid],createdByAccountId:uid,createdAt:at};
     const inviteData={purpose:'rivalry-pairing',slotId:invitedRole,createdByAccountId:uid,createdAt:at,expiresAt,state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
@@ -39,14 +43,14 @@ async function atomicCreateWithPairLink(db,{uid,device,target,role,managerId,cha
     let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
     if(pairSnapshot.exists()){const prior=pairSnapshot.data();revision=prior.revision+1;parentRevision=prior.revision;priorContentHash=prior.contentHash;linkedAt=prior.data.linkedAt;}
     const pairNext=pairEnvelope(uid,target,role,managerId,device,linkedAt,at,{revision,parentRevision,contentHash:hash(char),priorContentHash});
-    if(writePairLink)transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
+    if(writePairLink)transaction.set(pairRef,pairNext);if(writeCareerIndex)transaction.set(indexRef,careerIndexWrite(uid,device,indexSnapshot,target,at));transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
   });
 }
 
-async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,nowMs,writePairLink=true}){
-  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current');
+async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,nowMs,writePairLink=true,writeCareerIndex=writePairLink}){
+  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current'),indexRef=doc(db,'accounts',uid,'careerIndex','current');
   return runTransaction(db,async transaction=>{
-    const rivalrySnapshot=await transaction.get(rivalryRef),inviteSnapshot=await transaction.get(inviteRef),pairSnapshot=await transaction.get(pairRef);
+    const rivalrySnapshot=await transaction.get(rivalryRef),inviteSnapshot=await transaction.get(inviteRef),pairSnapshot=await transaction.get(pairRef),indexSnapshot=await transaction.get(indexRef);
     const rivalry=rivalrySnapshot.data(),invite=inviteSnapshot.data(),at=Timestamp.fromMillis(nowMs+5000);
     const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?managerSlot(slot.slotId,uid,char):{...slot});
     const rivalryData={...rivalry.data,connectionState:'active',managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,uid]};
@@ -56,7 +60,7 @@ async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,now
     let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at,role='playerTwo';
     if(pairSnapshot.exists()){const prior=pairSnapshot.data();revision=prior.revision+1;parentRevision=prior.revision;priorContentHash=prior.contentHash;linkedAt=prior.data.linkedAt;role=prior.data.managerRole;}
     const pairNext=pairEnvelope(uid,target,role,managerId,device,linkedAt,at,{revision,parentRevision,contentHash:hash(char),priorContentHash});
-    if(writePairLink)transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
+    if(writePairLink)transaction.set(pairRef,pairNext);if(writeCareerIndex)transaction.set(indexRef,careerIndexWrite(uid,device,indexSnapshot,target,at));transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
   });
 }
 
@@ -108,6 +112,8 @@ async function abandonCurrentPairRivalry(db,{uid,device,target,nowMs,tamperCreat
       await setDoc(doc(db,'rivalries',atomicRecovery,'invites',atomicRecovery),inviteEnvelope(atomicRecovery,now,Timestamp.fromMillis(nowMs+600000)));
       await setDoc(doc(db,'rivalries',staleRedeem),rivalryEnvelope(staleRedeem,now,managerSlot('playerOne','acct_d','9'),openSlot('playerTwo'),'pending-pair'));
       await setDoc(doc(db,'rivalries',staleRedeem,'invites',staleRedeem),inviteEnvelope(staleRedeem,now,Timestamp.fromMillis(nowMs+600000)));
+      // JOB-07: the creator (acct_d) indexed its seeded pending invites at creation, as the provider now does.
+      await setDoc(doc(db,'accounts','acct_d','careerIndex','current'),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:'acct_d',deviceId:ids.d,data:{rivalryIds:[atomicRecovery,staleRedeem],sealedPageCount:0}}));
     });
 
     const dbA=testEnv.authenticatedContext('acct_a').firestore();
````

### Appendix F. Registry, ops test and injector

````diff
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 9b9a53e..39328e2 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -473,6 +473,18 @@
         "^tests/contracts/shared-career-analytics-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/career-index-contracts.cjs",
+      "patterns": [
+        "^js/persistentNikDanielPair\\.js$",
+        "^js/sparkPrivatePairing\\.js$",
+        "^firestore\\.persistent-pair-production\\.fragment\\.rules$",
+        "^scripts/inject-persistent-pair-rules\\.mjs$",
+        "^scripts/build-production-firestore-rules(-with-persistent-pair)?\\.mjs$",
+        "^tests/contracts/career-index-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/scripts/inject-persistent-pair-rules.mjs b/scripts/inject-persistent-pair-rules.mjs
index 9d0ebb3..fb488f0 100644
--- a/scripts/inject-persistent-pair-rules.mjs
+++ b/scripts/inject-persistent-pair-rules.mjs
@@ -69,10 +69,22 @@ export function injectPersistentPairRules(){
     "allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current'",
     'allow create: if cmsPersistentPairCreateValid(accountId, pairId)',
     'allow update: if cmsPersistentPairUpdateValid(accountId, pairId)',
-    'allow list, delete: if false'
+    'allow list, delete: if false',
+    'function cmsCareerIndexPageCapacity()',
+    'function cmsCareerIndexPairLinkCoupled(accountId, rivalryId)',
+    'cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId)',
+    'cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId)',
+    'function cmsCareerIndexAppendEligible(accountId, rivalryId)',
+    'next[0:prior.size()] == prior',
+    '!(next[prior.size()] in prior)',
+    'match /accounts/{accountId}/careerIndex/{indexId}',
+    "allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId)"
   ]){
     if(!generated.includes(required))throw new Error(`Generated production Rules missing persistent pair boundary: ${required}`);
   }
+  if((generated.match(/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/g)||[]).length!==1){
+    throw new Error('Generated production Rules must contain exactly one career index account match.');
+  }
   if((generated.match(/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/g)||[]).length!==1){
     throw new Error('Generated production Rules must contain exactly one persistent pair account match.');
   }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 5b2b359..cec3328 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -64,10 +64,11 @@ const physicalJourneyPublicationContract='tests/contracts/ssjr-physical-journey-
 const ssjr2PhysicalRunCreditContract='tests/contracts/ssjr2-physical-run-credit-contracts.cjs';
 const setupNoDroppedTapsContract='tests/contracts/shared-setup-no-dropped-taps-contracts.cjs';
 const sharedCareerAnalyticsContract='tests/contracts/shared-career-analytics-contracts.cjs';
+const careerIndexContract='tests/contracts/career-index-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,careerIndexContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````

### Appendix G. Fixture update and KNOWN GAP 2 flip: `tests/firebase/two-manager-journey-emulator.cjs` (against JOB-02 head `b32d28e`)

````diff
--- a/tests/firebase/two-manager-journey-emulator.cjs
+++ b/tests/firebase/two-manager-journey-emulator.cjs
@@ -97,9 +97,9 @@
 
 async function pairFreshRivalry(env,{rivalryId,sessionId,nowMs}){
   const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
-  const created=await Pairing.createPairing({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),identity:pairingIdentity(DA,"a",nowMs),binding:bindingFor("playerOne"),capability:rivalryId,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:pairLinkWitness(dbA,A,DA,"playerOne")});
+  const created=await Pairing.createPairing({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),identity:pairingIdentity(DA,"a",nowMs),binding:bindingFor("playerOne"),capability:rivalryId,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableCreationWitness({services:{firestoreSdk:sdk(),firestore:dbA},accountId:A,deviceId:DA},"playerOne",PersistentPair.managerByRole.playerOne)});
   assert.equal(created.ok,true,`Daniel provider createPairing failed: ${JSON.stringify(created)}`);
-  const redeemed=await Pairing.redeemPairing({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),identity:pairingIdentity(DB,"b",nowMs),binding:bindingFor("playerTwo"),capability:rivalryId,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:pairLinkWitness(dbB,B,DB,"playerTwo")});
+  const redeemed=await Pairing.redeemPairing({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),identity:pairingIdentity(DB,"b",nowMs),binding:bindingFor("playerTwo"),capability:rivalryId,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableRedemptionWitness({services:{firestoreSdk:sdk(),firestore:dbB},accountId:B,deviceId:DB},"playerTwo",PersistentPair.managerByRole.playerTwo,rivalryId)});
   assert.equal(redeemed.ok,true,`Nik provider redeemPairing failed: ${JSON.stringify(redeemed)}`);
   const rootA=await assertSucceeds(getDoc(doc(dbA,"rivalries",rivalryId))),rootB=await assertSucceeds(getDoc(doc(dbB,"rivalries",rivalryId)));
   assert.equal(rootA.data().data.connectionState,"active");assert.deepEqual(rootA.data().data.managerSlots,rootB.data().data.managerSlots);
@@ -151,12 +151,22 @@
   return {dbA,dbB,a,b,history:historyA,multi:multiA,final:finalA};
 }
 
+async function assertCareerIndex(main,expected,label){
+  for(const [who,db,uid] of [["Daniel",main.dbA,A],["Nik",main.dbB,B]]){
+    const index=await PersistentPair.readCareerIndex({firestore:db,firebaseSdk:firestoreSdk,accountId:uid});
+    assert.equal(index.status,"ready",`${label}: ${who} index must be ready`);
+    assert.deepEqual(index.rivalryIds,expected,`${label}: ${who} index`);
+    assert.equal(index.rivalryIds.includes(R1),false,`${label}: ${who} index never contains pre-index R1`);
+  }
+}
+
 async function runSecondShowdownAndAbandon(env,main){
   const now2=main.now+200000;
   await pairFreshRivalry(env,{rivalryId:R2,sessionId:S2,nowMs:now2});
   await seedGameplayBridge(env,{rivalryId:R2,sessionId:S2,nowMs:now2+2000});
   const pairA2=(await assertSucceeds(getDoc(doc(main.dbA,"accounts",A,"pairLinks","current")))).data(),pairB2=(await assertSucceeds(getDoc(doc(main.dbB,"accounts",B,"pairLinks","current")))).data();
-  assert.equal(pairA2.data.rivalryId,R2,"KNOWN GAP 2 (fixed by G-7): accounts/A/pairLinks/current names only the new rivalry");
+  assert.equal(pairA2.data.rivalryId,R2,"Daniel current pair link moves to the new rivalry");
+  await assertCareerIndex(main,[R2],"G-7 after Showdown 2 pairing (R1 predates the index: never backfilled)");
   assert.equal(pairB2.data.rivalryId,R2,"Nik current pair must also move to the new rivalry");
   for(const [who,db] of [["Daniel",main.dbA],["Nik",main.dbB]]){
     await assertFails(getDoc(doc(db,"rivalries",R1,"sharedSetup","authoritative")),`KNOWN GAP 1 (fixed by G-8): ${who} cannot read Showdown 1 setup after close`);
@@ -167,6 +177,7 @@
   const now3=now2+200000;
   await pairFreshRivalry(env,{rivalryId:R3,sessionId:S3,nowMs:now3});
   await seedGameplayBridge(env,{rivalryId:R3,sessionId:S3,nowMs:now3+2000});
+  await assertCareerIndex(main,[R2,R3],"G-7 after Showdown 3 pairing (closed R2 kept, order kept)");
   const fresh=await playFreshSingleSeason(env,{rivalryId:R3,sessionId:S3,nowMs:now3+5000,closeAtEnd:false});
   globalThis.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:A}},firestore:fresh.dbA,firestoreSdk:sdk()})};
   globalThis.CareerModeSparkConnectedAccount={initialize:async()=>{},getState:()=>({connected:true,accountId:A})};
````

