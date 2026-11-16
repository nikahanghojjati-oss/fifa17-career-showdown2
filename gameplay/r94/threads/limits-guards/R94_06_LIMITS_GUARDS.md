# R94-06 · Firebase limits guards · RESULT

Branch `claude-gameplay/r94-limits-guards` on `gameplay/r94` 0cbc324. Brief: `R94_06_LIMITS_GUARDS_BRIEF.md` (project files). Source findings: R94-05 study P3-1, P3-2, P3-4 (branch `claude-gameplay/r94-limits-study`, a475200).

No Rules change, no game code change, no change to reads or writes per Showdown. Tests and test tooling only. Job 4 (lead, from Nik's "make sure no screen or action hits the Firebase 1000 limit") added below.

## P3-1 · Lookup guard in the Rules budget sweep (Gate L5)

- `tests/support/rules-budget-recorder.cjs`: every write the sweep already measures is also replayed to count its Rules lookups (get/exists/getAfter/existsAfter). Request total, exact: the COMPOSED Rules unchanged plus a pad collection; one or two pad documents in the same batch look up k more missing documents; used = 20 - largest passing k. Per written document: only when a multi-document request uses 9 or more (one document never looks up more than its request); an `exists()` chain in front of that document's write rules, 10 - largest passing k, an upper bound. A kind seen before in the same suite is checked with one replay at its worst count so far.
- `tests/firebase/rules-budget-sweep-emulator.cjs`: fails when a kind is within 1 of its cap (9 of 10 for a one-document request, 19 of 20 for a batch or transaction, 9 of 10 for one document of it) or looks up more than its baseline. Prints `lookups=N/cap` on every line.
- `tests/fixtures/rules-budget/baseline.json`: `lookups` added to all 45 kinds (expression numbers untouched) plus the new JOIN page-turn kind (below).
- `tests/contracts/r93-rules-budget-sweep-contracts.cjs`: S7 (lookup bars, every baseline kind measured and at most cap - 2, CONFIRM SEASON pinned at 8) and S8 (JOIN at a full index played).

Numbers (first full sweep, 827 writes, 46 kinds, before job 4): CONFIRM SEASON 8 of 10 (worst single document), START of a Transfer War 8 of 20, JOIN at a page turn 9 of 20 with every document at most 3 of 10, all others 1 to 6. Matches the study.

Fails before, passes after: with one extra `exists()` on the season commit create (`RULES_BUDGET_SWEEP_MUTATE`, Sacked suite), the old sweep PASSES (expressions 891, under its 898 baseline); the new sweep FAILS with "create rivalries/*/seasonCommits/season_N [COMMITTED]: 9 of 10 Rules lookups for the request, within 1 of the lookup cap".

Emulator facts re-checked here: the per-document cap of 10 is enforced inside a batch, and a document's own lookups count even when another document of the batch already looked the same path up (p: 6 + q: same 6 + 5 new is refused; same 6 + 4 new saves).

Time: with lookups the 11 flows took 20.5 min locally (the Gate's sweep step ran 16 to 19 min before); the lookup replays cost about a quarter of the measuring time. With job 4's six suites the full local sweep is 29 min. L5 has 65 min; the regression step takes 6 to 9.

## P3-2 · JOIN at a full History page

`tests/firebase/career-index-emulator.cjs`:
- G5J, next to G5: Nik's JOIN when his own index head holds 500 seals page_1 and starts a new head in the same commit (page_1 holds the 500 in order).
- P7, P8: real client code (`sparkPrivatePairing.js` + `persistentNikDanielPair.js`), both managers' indexes full: START and JOIN each seal page_1, then both read all 501 Showdowns in order, newest last.
- Phase A 59 checks, Phase B 61. The sweep now measures the page-turn JOIN (904 expressions on the rivalry document, the JOIN figure; 9 of 20 lookups).

Fails before, passes after: Rules copy where only the JOIN page turn is broken (page-turn branch also requires the joined rivalry to be missing): the old suite PASSES (56 checks), the new suite FAILS at G5J with PERMISSION_DENIED.

## Job 4 · Every client save is measured, and a new one cannot slip past

- **Gap found and fixed:** the R93-08 recorder only recognised transactions and batches. A `setDoc`/`updateDoc` on a document reference carries the modular Firestore instance, not the test context's compat one, so every single-document save in the sweep's suites went unmeasured. The recorder now registers both (`db._delegate`).
- **Six more suites in the sweep** for saves no flow made: career-start marker, career summary, permanent partner + JOIN note, shared reads meter, account bootstrap (`RULES_BUDGET_SWEEP_COMPOSE=1` moves that older suite onto the composed Rules for the sweep only), and the new `tests/firebase/r94-other-saves-emulator.cjs` (device register and revoke, session offer, connected shared state publish and replay; real client code on a pair made by the real START and JOIN).
- **Map + contract:** `tests/fixtures/rules-budget/write-sites.json` lists all 17 client modules that save (47 write calls) and the documents each writes. Contract S9 counts write calls in `js/**` with two independent detectors and fails when a file gains, loses or adds a call that is not listed, or when a listed document has no kind in the sweep baseline. Proof: one new `setDoc` in `js/squadScreen.js` fails ("makes 1 Firestore write call(s) that write-sites.json does not list"); one extra `tx.update` in `js/chamberMenStep.js` fails ("4 Firestore write calls, write-sites.json lists 3").
- **Result:** 63 kinds from 17 flows, none refused, none within 1 of a lookup cap. New kinds: 177 to 730 expressions, 0 to 5 lookups. Two existing kinds measured higher once single saves counted: the rivalry Terminal Progress update that carries the exact sacked map, **~866** (was ~857; 134 left under 1,000; knownOver text updated), and the pair link update 550 / 5 lookups (was 512 / 4). Both are measurements of saves the old sweep never saw, not changes.

## P3-4 · Chamber Men and Prime Pack fallback poll: cannot happen, no change

Replay: `gameplay/r94/threads/limits-guards/p3-4-fallback-replay.cjs` (output next to it). It runs the real watch functions from `js/chamberMenStep.js` and `js/iconGuessStep.js` in Chromium with a stand-in module at the real gstatic URL, tab hidden.
- Production order (the runtime imports the Firestore module to sign in, then the network is cut): listener from the module map, 0 fallback reads in 8 s hidden, 0 network requests, one module instance. Both screens.
- Control (module never loaded): the fallback starts and reads 4 times in 8 s while hidden.
- Why production cannot get there: production `io.sdk` has no `onSnapshot` (`productionFirebaseRuntime.js:237`), so the step imports `firebaseFirestoreModule`, the same URL the runtime already imported in `loadAccountFirebaseSdk` to build the signed-in services. A second import of a loaded module never fails. Without that module there is no sign-in and no Showdown screen.

Per the brief, nothing changed in the game for P3-4.

## Replay

```
npm ci && npm install --no-save firebase@12.17.0 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0
node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
npx firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-rules-budget-sweep "node tests/firebase/rules-budget-sweep-emulator.cjs"
npx firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-career-index "node tests/firebase/career-index-emulator.cjs && CMS_CAREER_INDEX_ENFORCED=1 node tests/firebase/career-index-emulator.cjs"
node tests/contracts/r93-rules-budget-sweep-contracts.cjs
CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node gameplay/r94/threads/limits-guards/p3-4-fallback-replay.cjs
```
Never rebuild the Rules or run contracts that rebuild them while a sweep runs.
