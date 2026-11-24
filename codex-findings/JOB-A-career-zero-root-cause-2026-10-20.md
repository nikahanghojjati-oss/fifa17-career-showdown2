# JOB-A — career screens show zero after normal play

**Answer: incident attribution remains unproven; the top two suspects are the closed reader's order-sensitive comparison of Firestore result maps (`sparkCompletedShowdownReader.js:138`) and its browser dependencies not being awaited by the career-screen loader (`rivalryLegacyV10.js:79–90`). Both independently reject a valid finished Showdown in local reproductions.**

Investigated main `9230e33455eae93040317e7553131be34c20da9b`, runtime `1.9.5-r81`, on 2026-10-20. No `codex-findings/` directory existed at this head, so there were no earlier findings to duplicate. No app code, tests, accounts, Rules or deployments were changed. The reproductions below use an existing emulator fixture and isolated JavaScript VMs, not an owner's production account or console.

## What is proved, and what is still missing

There is a concrete reader defect that the live season-commit reader already avoids: identical results with different property insertion orders fail the career reader. There is also a concrete dependency omission on a cold career-screen entry. Neither requires a player to modify the app. The first is a representation problem at the database/SDK boundary; the second is ordinary script-loading timing.

I did **not** observe the failing production accounts' marker, index, reader error codes, result-map ordering or Terminal Close documents. Consequently, the evidence does not establish that either defect occurred on those particular devices, or that every real Showdown is universally rejected. A claim that r81 has a newly added writer field that invalidates every Showdown would be unsupported: the writer/reader schema comparisons below agree.

Of these two suspects, the map comparison better explains repeated failures after playing a whole game, when the protocols have necessarily loaded. The dependency omission explains direct entry after a fresh load; it alone does not explain permanent zero after every subsequent screen visit once all scripts have loaded.

## The failing read path and the zero display

1. Current Rivalry Statistics calls `buildActiveShowdownViews(rlSnapshot())` and can render `active.rivalry` directly: `js/rivalryLegacyV10.js:299–305`. That projection already contains live seasons and trophies. Its correct cup counts therefore do not prove that the closed reader can reconstruct a stored game.
2. Career Statistics and Trophy Room use `v10LoadOnline()` → `loadCareerModel()`: `js/careerScreensV10.js:1628–1643`. History/Legacy and the career-backed rivalry view use the same `rlLoadCareerModel`: `js/rivalryLegacyV10.js:244–277,299–305`.
3. `rlCareerScope` reads the account marker. `none` becomes `testOnly:true`; an unreadable/unknown marker becomes unavailable: `js/rivalryLegacyV10.js:222–230,258–262`. `testRunsOnly:true` deliberately supplies an empty index and performs no Showdown reads: `js/sparkClosedShowdownCareerLoader.js:54–58`. Thus missing marker → empty career is real behavior, but missing marker on a current normal first pairing is **not established**.
4. Otherwise the loader reads the career index and each non-hidden rivalry: `js/sparkClosedShowdownCareerLoader.js:58–69`. It cannot substitute the active projection for a failed completed read: `js/sharedClosedShowdownAdapter.js:54–68`.
5. For a terminal-closed rivalry the reader verifies the witness and setup, reads both result-role documents and the commit for every season, reconstructs scores/history, and compares totals to the close witness: `js/sparkCompletedShowdownReader.js:159–200`. Any exception returns `unavailable` with a code: lines 201–202.
6. **One unavailable Showdown does not blank all good Showdowns.** The adapter preserves an unavailable entry (`js/sharedClosedShowdownAdapter.js:55–57,96–100`); analytics skips its counters but keeps readable entries (`js/sharedCareerAnalytics.js:116–149`). A ready index whose entries are **all** unavailable yields `partial`, readable `0/N`, and zero accumulated manager/trophy totals (`js/sharedCareerAnalytics.js:113,121–123,151–163`). Legacy filters out unavailable rows (`js/rivalryLegacyV10.js:26–30`). That combination explains zero cabinets/statistics and no completed History cards without any loss of stored results. An unavailable **index** instead produces an unavailable whole model (`js/sharedCareerAnalytics.js:112–114`).
7. The reader's specific code survives in loader `entries`, but the UI caller retains only `result.model`: `js/sparkClosedShowdownCareerLoader.js:68–69`, `js/sharedClosedShowdownAdapter.js:57`, `js/rivalryLegacyV10.js:262–263`. The visible symptom therefore cannot distinguish a protocol failure from a result-shape failure.

## Suspect 1: equal maps are rejected because their keys have different orders

`csrResult` validates a result, then clones it without canonicalizing key order (`js/sparkCompletedShowdownReader.js:37,42–43`). The reconstructed ready result keeps the role documents' ordering (lines 121–128). At line 138 the reader compares it with the separately stored commit using:

```js
if (JSON.stringify(value.results) !== JSON.stringify(ready.results))
  csrFail("COMPLETED_SEASON_INVALID");
```

The two maps can have exactly the same keys, types, values and canonical hashes while producing different JSON strings. Map property order is not a gameplay invariant or a Firestore Rules equality requirement. The current season-commit provider uses canonical comparison for this exact boundary: `js/sparkSharedSeasonCommit.js:80–89`, specifically line 84. Its writer stores `state.results` (`js/sparkSharedSeasonCommit.js:91`), with result normalization performed by `js/sharedSeasonCommit.js:67`; the role writer separately stores `normalizedResult` (`js/sparkSharedSeasonResults.js:46–51,168`). The career reader must compare their contents, not assume identical serialization order from independent document reads.

This omission survived an earlier fix: `git show b41f2969 -- js/sparkSharedSeasonCommit.js` shows the r76 release replacing the provider's same `JSON.stringify` inequality with `scpCanonical` equality. `sparkCompletedShowdownReader.js:138` still has the old comparison on r81.

Reproduction on the unmodified r79 saved fixture: load every browser protocol and the actual reader, decode the fixture into normal JS objects, and reverse **only the property order** in the role documents' `result` maps. Change no values, keys, arrays, receipts, witness or hashes. The reader changes from `completed` to `unavailable / COMPLETED_SEASON_INVALID`; the real adapter and analytics change from one completed Showdown to zero. Replacing only that comparison with `csrSortedCanonical` in the isolated VM restores `completed` and one completed career entry. This proves the defect and the causal zero path; it does not prove the owner's SDK returned this ordering.

## Suspect 2: a cold Trophy Room entry can outrun required protocols

The browser reader resolves setup, catalog, results, commit, scoring, history and terminal APIs from globals, while Node loads them through `require`: `js/sparkCompletedShowdownReader.js:11–19`.

`modelDependencies()` explicitly awaits history, final, terminal, analytics, adapters, reader and loader, but omits `sharedShowdownSetup`, `sharedShowdownCatalog`, `sharedSeasonResults`, `sharedSeasonCommit` and `sharedCanonicalScoring`: `js/rivalryLegacyV10.js:79–90`. Trophy Room's lazy entry awaits this function indirectly, not the entire SSJR bootstrap: `js/careerScreensV10.js:1629–1643`.

`ssjr.js` does load the omitted protocols, but in a different asynchronous chain: season commit installation → canonical-scoring preparation (`js/ssjr.js:98–113`), then history and later terminal setup (`114–157`). There is no await from the career loader to that chain. The Home-ready gate at `js/ssjr.js:87` also does not await it. A fast career entry with slow/delayed scripts can therefore reach `csrRebuildSetup` before setup/catalog exist, returning `COMPLETED_PROTOCOL_UNAVAILABLE` (`js/sparkCompletedShowdownReader.js:100–101,201–202`). Missing scoring can instead throw at line 177 and become the generic `COMPLETED_READ_FAILED`.

With only the actual career dependency list available, the same valid saved fixture reproduces `unavailable / COMPLETED_PROTOCOL_UNAVAILABLE` and a `partial` career with zero completions. With all protocols available it passes. Unavailable reads are not cached as completed (`js/sparkClosedShowdownCareerLoader.js:20,34–40`), so a later explicit reload of the career should recover once dependencies arrive. A dependency-ready notification is not itself awaited by the failed career request.

## Markers and indexes: who actually writes them

| Normal path | Daniel (`playerOne`) | Nik (`playerTwo`) | Index behavior |
| --- | --- | --- | --- |
| First Home START / first real pairing | Seasons START calls the real-career gate before creating the shell (`js/productionSharedJourneyEntry.js:290–298,441–457`); `showdownModes.beforeSeasonsStart` calls `startRealCareer` (`js/showdownModes.js:167–201`). Marker write is `js/careerStartMarker.js:179–205`. With a marker and no permanent partner, code creation selects `CMS17R-` (`js/persistentNikDanielPair.js:259,337–342`). | Redeeming that `CMS17R-` code validates joinability, then calls `pairEnsureOwnMarkerBeforeRealJoin` **before** provisioning/redeeming (`js/persistentNikDanielPair.js:264,352–363`). A failed marker write aborts the join. | Daniel's create and Nik's redeem each supply their own durable witness (`js/persistentNikDanielPair.js:206–207,259,264`). That witness reads the account's index, plans an append, and writes it alongside its pair link (`200–205`). |
| Subsequent permanent-pair START / Home JOIN note | The existing marker is reused; START's mode gate returns real (`js/showdownModes.js:180`). No second career-start marker is required. | Home note creates a plain code and calls the same `joinPairing` (`js/onlinePlayerIdentity.js:99–102`). This route does **not** create a marker; it relies on the existing permanent partner record. A partner record can be created only against an existing own marker (`firestore.persistent-pair-production.fragment.rules:409–425`); clients cannot delete that marker (`590–597`). | The same creation/redemption witnesses append the new ID for each account. Home JOIN does not bypass the redeem witness. |
| CONTINUE with an ACTIVE rivalry | Resumes the existing rivalry; does not create or repair a career-start marker. | Same. | No new rivalry is created, so no new append is expected (`js/persistentNikDanielPair.js:275`; `js/onlinePlayerIdentity.js:105`). |
| CONTINUE / reload with an old pending code | r80 redirects an unarmed test-mode pending START to the real seasons/checkmark flow (`js/productionSharedJourneyEntry.js:233–257`; `js/onlinePlayerIdentity.js:105`). | A real first-pairing code still takes the marker-before-redeem path; a Home note uses the existing permanent-pair route. | Any newly made/redeemed code uses the same witnesses. |

The witnesses run inside the actual pairing transactions, not after a successful pairing as a best-effort save (`js/sparkPrivatePairing.js:294–305,350–359`). `pairPlanCareerIndexAppend` is idempotent and handles sealed pages; `readCareerIndex` reads pages and head in order (`js/persistentNikDanielPair.js:131–134`). There is no identified current first-START/Home-JOIN index omission for either manager.

**Can an ordinary account have no marker? Yes:** before its first real START, during an explicit Settings test run, and when continuing a previously active test/older markerless rivalry. ACTIVE CONTINUE has no marker repair, and a plain test-code join intentionally has no first-real marker write (`js/persistentNikDanielPair.js:264,275,343–348`). Those facts do not prove a new r81 Home-created real rivalry can skip the marker. r79's actual accidental code-resume leak is documented in `js/productionSharedJourneyEntry.js:234–240`; it was addressed in r80, rather than being a newly demonstrated r81 fresh-account defect.

Marker creation hides exactly the then-current index (`js/careerStartMarker.js:89–93,195–199`). r81's recovery only reveals qualifying hidden closed roots for markers in the r79-to-r80 time window, scans at most ten IDs, and stops on unreadable/older roots (`js/careerStartMarker.js:44–75`). It cannot rescue a markerless career, a marker made outside that window, or a closed reader that rejects the newly revealed root. Thus the r81 hotfix does not resolve either reader defect above.

## Every strict reader gate compared with current writers

| Reader check | Current storage writer / conclusion |
| --- | --- |
| Root envelope/content hash (`js/sparkCompletedShowdownReader.js:53–56`) | Terminal Close hashes the complete resulting root data with sorted keys and timestamp canonicalization (`js/sparkTerminalClose.js:15–22,41,81`). The algorithms agree. Root additions such as `endedEarly` are included in that hash; the reader does not impose an exact root-data key set. |
| Setup exact keys, six operations, revision 6, both confirmations (`87–112`) | `js/sparkSharedShowdownSetup.js:129–151` writes that exact ledger. The live season-commit provider already requires and replays the same six-operation sequence (`js/sparkSharedSeasonCommit.js:60–66`); Terminal Close requires revision 6 (`js/sparkTerminalClose.js:39`). r79's Daniel-only season choice did not remove `commit-length` or the two confirmations from the stored protocol. |
| Result runtime `1.9.1-r9`, role shape and result keys (`115–131`) | Result protocol still declares r9 (`js/sharedSeasonResults.js:8`); provider writes public and role documents accordingly (`js/sparkSharedSeasonResults.js:168`). Public `teamCount` and role metadata are accepted: these documents are not checked with an obsolete exact top-level key set by the reader. |
| Optional Europa League | Reader accepts the sparse eighth `europaLeague:true` key, excluding simultaneous Champions League (`25–27,42–43`). Writer normalizes the same sparse key (`js/sparkSharedSeasonResults.js:46–51`), commit preserves it, scoring/history and terminal tally it (`js/sharedHistoryConvergence.js:17–40`; `js/sparkTerminalClose.js:36–38`). No newly added r80 result key was found that the reader rejects as an unknown key. |
| Exact commit keys, r10, ACKNOWLEDGED/revision 3, results revision 2 (`134–146`) | Provider storage shape matches (`js/sparkSharedSeasonCommit.js:22,91`), and protocol revision remains r10 (`js/sharedSeasonCommit.js:8`). **Contents match semantically; the reader's extra ordering requirement at line 138 is the defect.** |
| Terminal intent and exact progress keys/r18 (`79–85`) | Intent verifier and writer remain r18 (`js/sharedTerminalClose.js:7–26`); progress creation and finalization use exactly the expected six keys (`js/sparkTerminalClose.js:10,40,49,81`). r81 app asset version is not the persisted protocol revision. |
| Reconstructed season totals equal Terminal Close (`195–199`) | Close sums acknowledged season results using the same 5/3/1/bonus scoring, including Europa +3 (`js/sparkTerminalClose.js:37–49,79`). No scoring mismatch was demonstrated. |
| END SHOWDOWN | r80 early-ending roots have no terminal witness, so they intentionally return `abandoned`, with the `endedEarly` metadata used for a status row, not trophies (`js/sparkCompletedShowdownReader.js:150–176`; `js/sharedClosedShowdownAdapter.js:70–74`). This is not how a successful terminal close is classified. |
| r80 Firebase career save | Production automatically invokes the real terminal provider and accepts its result (`js/productionSharedTerminalClose.js:20–35,276–289`). A final winner screen alone is not proof of a persisted terminal witness if automatic saving failed; retry UI exists. The browser journey explicitly verifies the root witness (`tests/browser/two-manager-browser-journey.cjs:837–845`). |

## Firestore Rules and deployment evidence

Ran both requested builders successfully:

```text
node scripts/build-production-firestore-rules.mjs
node scripts/build-production-firestore-rules-with-persistent-pair.mjs
INJECTED persistent Nik/Daniel pair authority 154706 bytes
git hash-object firestore.spark.generated.rules
13cab80a76979299fcac195da925fa984c51d8a5
```

The composed source permits exact gets of terminal-closed setup, public results, **either manager's** role result and season commits (`firestore.spark.generated.rules:3037,3081,3087–3088,3098`). The completed grant binds the authenticated active account to the two rivalry slots and the exact completed witness/progress, not to a live session or the current pair link (`firestore.persistent-pair-production.fragment.rules:514–547`). The root is readable by its authorized managers (`firestore.spark.generated.rules:442–446,2978–2979`); the own index and marker have own-account get grants (`firestore.persistent-pair-production.fragment.rules:580–597`).

Deployment drift is not supported by the evidence available here. The successful [r80 Rules deployment](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/39268282641), job `118124952014`, logs the same 154706 bytes and `PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS 13cab80a76979299fcac195da925fa984c51d8a5` at 2026-10-19 14:48:48 UTC. It published/read back ruleset `fbf81f33-61e7-492e-8014-bae08384ed94`. The current deployment workflow runs both builders (`.github/workflows/deploy-firestore-rules-zero-billing.yml:82–86`). Current main's Pages [deployment](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/39340642836) and [Showdown Gate](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/39340642793) succeeded.

This proves the recorded deployment's bytes, not that nobody subsequently changed the provider externally. No production Firebase administration credential was available for a fresh provider readback. The Rules source itself contains the needed other-manager grant; adding broad reads is not the suggested repair.

## Why the tests can pass

- **Completed-reader emulator test:** `tests/firebase/completed-showdown-read-emulator.cjs:71–77` seeds active accounts/devices, already-active two-manager rivalries, sessions and some pair links with Rules disabled. It bypasses the real first START/join/marker/index lifecycle. It then genuinely plays the lower-level providers through terminal closure (`79–108,138–141`) and directly invokes the Node reader (`227–230`), so `require()` always supplies its protocols. Its career aggregation constructs a ready index from `Object.keys(reads)` at line 229, rather than using the UI marker gate. It does **not** seed career-start markers to prove that gate; it never exercises that gate. It explicitly proves the other manager's result-role reads (lines 162–163), weakening a source-Rules denial hypothesis.
- **Two-manager browser journey:** it is inaccurate to say this test seeds the career markers by hand. It starts with no markers, presses the real START/checkmark, redeems `CMS17R-`, and asserts both markers and both index entries (`tests/browser/two-manager-browser-journey.cjs:386–429`). The later permanent-pair flow asserts both indexes contain `[R1,R2]` (`947–948`). It checks Career Statistics, Trophy Room and Legacy after closure and after reload (`323–359,848–858`). These are meaningful checks.
- That browser journey swaps production Firebase initialization/sign-in for a localhost-only Auth/Firestore emulator runtime (`tests/browser/two-manager-browser-journey.cjs:71–87`; `tests/browser/support/emulator-runtime-switch.js:27–70`). It normally injects one automatic-close failure to test manual retry, unless `CMS_FINAL_NO_CLOSE_TAP=1` (`two-manager-browser-journey.cjs:80–85`). Its only documented owner seed helper plants an expired JOIN note (line 44); it is not a career seed. Those differences must not be conflated with the product's Settings test-run mode.
- The journey completes gameplay before its first career assertions, so required protocols are warm. After reload it waits for loading/Home, then enters Career Statistics before Trophy Room. It does not deliberately delay the omitted SSJR protocols and go directly to Trophy Room. It also never independently permutes role-result and commit-result map ordering; all reads use the same emulator/SDK representation. Passing this journey does not prove ordering invariance or a dependency-safe cold career route.
- Smaller contract tests often stub the marker, reader and/or model. For example `tests/contracts/r80-ce2pg-career-pages-contracts.cjs:29–48` supplies a ready marker and stubbed loader. `tests/contracts/career-start-marker-contracts.cjs` explicitly passes the missing-marker → empty behavior as a desired assertion. Such tests protect their configured contract, not the premise that every ordinary completed production game reaches that contract with eligible data.

## Suggested repair and a clear counting boundary

1. Make the closed reader use the same order-independent result equality as the live commit provider. Validate the exact allowed keys/types first, then compare canonical content. Keep witness, membership, season coverage and totals checks. No scoring change or database rewrite is needed for this defect.
2. Await **all seven reader protocols** in the career-screen dependency loader before the first read. Reuse the release loader and ensure adapter dependencies are ready before their factories execute. An unavailable dependency should remain a retriable unavailable state, rather than appear as zero earned trophies.
3. Remove the fragile account-level inference that “no marker means all games are tests” for future games. The simplest owner-acceptable policy is to retire Settings test mode, use one explicit fixed-release cutover instant `T`, and have every normal create/redeem atomically index that real rivalry for its manager as today. Define future career eligibility from the rivalry's immutable creation time/explicit versioned career eligibility, not from when either account later happened to press a checkmark. Document `T` as a UTC instant in the release. Every terminal-closed eligible rivalry created from `T` onward must count for both managers, including after CONTINUE, a lost join acknowledgement, a new browser or a reload.
4. Keep pre-r79 games permanently excluded. Do **not** remove the marker filter without replacing its historical exclusion policy. For a bounded historical repair, only consider known indexed roots created at/after the r79 boundary `2026-10-18T17:17:45Z`, validate them with the corrected reader, and retain the immutable exclusion of pre-r79 games. Prefer an explicit reviewed eligibility list for ambiguous historical test-versus-real games; merely using `updatedAt` can revive an old test whose root was later touched. If history cannot be classified, the fixed cutover `T` still gives a clear forward guarantee. Never recreate a marker by hiding the entire current index: that can hide the very completed games being repaired.
5. Preserve/display a short read failure reason and `readable/indexed` coverage in the career UI, and make automatic-close failure visibly distinct from a completed Firebase career save. This allows ordinary taps on real devices to distinguish missing eligibility, failed close, denied reads and protocol/schema failure, without asking the owner to use the console.

Steps 1–2 repair the demonstrated defects. Step 3 removes the marker lifecycle as a future source of silent exclusion; it is not a claim that the marker caused this particular report. A fresh failing account's read-only diagnostic must still establish which branch actually fired before declaring the incident solved.

## A test that would have caught the demonstrated gap

Use a valid, fully closed Showdown written by the **current production providers** from two fresh accounts. Enter through the real first START and first join, then repeat through permanent-pair Home JOIN and ACTIVE CONTINUE. Assert both markers/indexes at the appropriate boundary; verify the closed root rather than treating the Final Winner screen as a save receipt.

For every completed reader read, independently permute the property order of the public/role/commit maps supplied by the SDK test boundary, without changing content, and require the identical verified projection and career totals. Keep operation-array order unchanged. Run in a browser context without `require`. Open Trophy Room first after a fresh tab/sign-in while delaying the omitted protocol scripts beyond Home readiness; require the loader to await them and eventually show the correct nonzero totals. Revisit all career screens, then repeat with one genuinely unavailable entry alongside a valid finished entry and require the valid totals to survive. Include pre-r79 exclusion and a missing historical marker without allowing a new eligible game to vanish.

The following local probe is reproducible without Firebase, credentials, installed test dependencies or app edits. From repository root, save it outside the checkout and run with Node 24. It uses the existing r79 fixture as a stable valid control; the prospective regression should additionally use current-writer data as above.

```js
const fs = require('node:fs'), vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const fixture = JSON.parse(fs.readFileSync(
  'tests/fixtures/saved-showdowns/r79-1season-win.json', 'utf8'));
function decode(v) {
  for (const k of ['nullValue', 'stringValue', 'booleanValue', 'doubleValue'])
    if (k in v) return k === 'nullValue' ? null : v[k];
  if ('integerValue' in v) return Number(v.integerValue);
  if ('timestampValue' in v) return { ms: Date.parse(v.timestampValue) };
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(
    Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, decode(x)]));
  throw Error('Unknown fixture value');
}
const docs = Object.fromEntries(fixture.documents.map(d =>
  [d.path, decode({ mapValue: { fields: d.fields } })]));
const files = ['sharedShowdownCatalog', 'sharedShowdownSetup',
  'sharedSeasonResults', 'sharedSeasonCommit', 'sharedCanonicalScoring',
  'sharedHistoryConvergence', 'sharedFinalReconciliation', 'sharedTerminalClose',
  'sharedCareerAnalytics', 'sharedActiveShowdownAdapter',
  'sharedClosedShowdownAdapter', 'sparkCompletedShowdownReader'];
async function probe(label, missing = [], reorder = false, compareFix = false) {
  const c = vm.createContext({ TextEncoder, crypto: webcrypto });
  vm.runInContext(`var docs = ${JSON.stringify(docs)};
    function restore(v) {
      if (!v || typeof v !== 'object') return;
      if (Object.hasOwn(v, 'ms')) { v.toMillis = () => v.ms; return; }
      Object.values(v).forEach(restore);
    } restore(docs);`, c);
  if (reorder) vm.runInContext(`for (const [p,v] of Object.entries(docs))
    if (p.includes('/roles/') && v.result)
      v.result = Object.fromEntries(Object.entries(v.result).reverse());`, c);
  for (const f of files) if (!missing.includes(f)) {
    let source = fs.readFileSync(`js/${f}.js`, 'utf8');
    if (compareFix && f === 'sparkCompletedShowdownReader') source = source.replace(
      'JSON.stringify(value.results)!==JSON.stringify(ready.results)',
      'csrSortedCanonical(value.results)!==csrSortedCanonical(ready.results)');
    vm.runInContext(source, c);
  }
  c.rid = fixture.rivalryId;
  c.uid = docs[`rivalries/${fixture.rivalryId}`].data.authorizedAccountIds[0];
  c.read = await vm.runInContext(`CareerModeSparkCompletedShowdownReader
    .readCompletedShowdown({firestore:{},user:{uid},rivalryId:rid,
      firebaseSdk:{doc:(_db,...p)=>p.join('/'),getDoc:async p=>({
        exists:()=>!!docs[p],data:()=>docs[p]})}})`, c);
  const model = vm.runInContext(`CareerModeSharedCareerAnalytics.buildCareerModel(
    CareerModeSharedClosedShowdownAdapter.buildClosedCareerInput({
      index:{status:'ready',rivalryIds:[rid]},reads:{[rid]:read}}))`, c);
  console.log(label, c.read.status, c.read.code, model.status,
    model.managers.daniel.showdowns.completed);
}
(async () => {
  await probe('control');
  await probe('career dependencies only', files.slice(0, 5));
  await probe('equal reordered results', [], true);
  await probe('VM-only canonical comparison', [], true, true);
})();
```

Observed output:

```text
control completed null ready 1
career dependencies only unavailable COMPLETED_PROTOCOL_UNAVAILABLE partial 0
equal reordered results unavailable COMPLETED_SEASON_INVALID partial 0
VM-only canonical comparison completed null ready 1
```

Also ran and passed `tests/contracts/completed-showdown-read-contracts.cjs`, `tests/contracts/career-start-marker-contracts.cjs` (14 cases), and `tests/contracts/europa-league-compat-contracts.cjs` (32 checks, including byte compatibility of 17 old Showdowns). Did not run a new full emulator/browser journey in this investigation; their existing source and published CI are evidence of their tested scope, not new production proof.
