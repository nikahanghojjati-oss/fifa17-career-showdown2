# Red team r87: RULES_ESTIMATE

Audit target: `gameplay/r87` **b2ba864e691c6c7a4c47edc83d080b4822033237**, checked against the remote on 2026-10-31. Scope: Daniel and Nik's normal phones, including ordinary caller bugs, races and timeout retries. No game code changed, no production Firebase accessed, no deploy or merge performed. All emulator projects were `demo-*` on loopback. This report distinguishes authorization evidence, engine access-limit evidence, and the repository's conservative billed-read model; agreement between the two counters is not an independent invoice measurement.

## Findings

### R87-E-01 — P0: a wrong season argument can persist a complete future season

**Evidence:** `firestore.transfer-challenge-production.fragment.rules:21-49,65-69,175-190` (`ssjrTransferSeasonMatches`, `ssjrTransferPrerequisites`, create); composed equivalents `firestore.spark.generated.rules:1296-1323,1338-1344`. `firestore.season-results-production.fragment.rules:15-63` requires that season's completed transfer, but no previous season. `firestore.season-commit-production.fragment.rules:53-114,116-161` checks that season's results and acknowledgements, but no previous commit. Caller context at `js/sparkSharedTransferChallenge.js:142-150` reads setup/career and the requested season; it does not establish the sequential season frontier.

**Exact reproduction:** use the real fixture and providers in `tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs` with a three-season Showdown. Complete shared setup and Career Start normally. Change only the loop's first season argument from `1` to `3`. Both phones mark season 3, the coordinator starts its window, both request the early end, lock guesses/signings, publish their results, and commit/acknowledge. Stop immediately after `commit.phase === 'ACKNOWLEDGED'`; server-read `seasonCommits/season_1` and `seasonCommits/season_2` and assert both are missing. The local probe printed:

```text
OUT_OF_ORDER season 3 commit ACKNOWLEDGED with seasons 1 and 2 absent
```

Every provider and payload constructor was unchanged. Only the caller's season argument was changed, modeling a normal UI/local-progression bug; no forged account, Rules bypass, or malicious client was needed. This does **not** claim the present UI normally skips seasons. It proves the Rules would accept the bad data if that ordinary caller bug occurs, as required by this threat model.

**Root cause:** the Rules bind the path to its numeric season and setup range, but do not bind new season authority to the accepted sequential frontier. Result/commit creation trusts that independently creatable transfer ledger. A future acknowledged result is durable inconsistent season history, even if a subsequent history reader notices the hole.

**Smallest fix:** for transfer ledger creation/start after marks, require `seasonNumber == 1` or the immediately preceding `seasonCommits/season_(N-1)` to be `ACKNOWLEDGED`, with matching rivalry/season identity. Keep existing current-ledger CAS and immutable result protections. Also bind pre-window marks to the intended season if preventing stale/future premarks is desired; marks alone do not corrupt a result. A prior-commit prerequisite adds **one distinct Rules read per successful start for N > 1**, not one per later listener delivery or ledger update. Changing only the client would leave the integrity gap.

### R87-E-02 — P0, conditional on old Rules: spin marks fail closed, unlike the reads meter

**Evidence:** `js/productionSharedTransferChallenge.js:394-398,477-505` disables START for missing marks and retains the wait after a refused mark; `js/sparkSharedTransferChallenge.js:189-193,209-217` enforces both marks in the provider and returns the mark write's permission denial. Old main has neither R87-SPINS grant. The new grant is `firestore.transfer-challenge-production.fragment.rules:346-399`.

**Exact reproduction:** compose main `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e` with its own build scripts using `tests/support/composed-production-rules.cjs` `composeFromRef('origin/main')`, and load that text into the emulator. Use the current real lifecycle fixture to confirm a new eligible Showdown and acknowledge Career Start. Call current `Transfer.markSpun` for playerOne, then current `Transfer.startWindow` for season 1. Actual output:

```text
OLD_RULES_MARK permission-denied START TRANSFER_ROULETTE_PENDING
```

Reload does not change the server's Rules. The screen contract's refused-mark case (`tests/contracts/r87-wait-both-spins-contracts.cjs:228-232`) likewise keeps START disabled with a reload message. Thus **the meter fails open to an estimate; the roulette gate does not fail open to play**. An old, ineligible Showdown is a different case and does not prove compatibility for a new Showdown.

**Root cause:** missing stored marks mean both “partner has not spun” and “server cannot store marks”; current provider intentionally treats either as pending. This is not a denial under the candidate composed Rules, and not a second finding about the already-known deployment order.

**Smallest fix:** correct any claim that the spin gate safely falls back with old Rules, and make deployment of these Rules a hard release prerequisite. If compatibility itself is required, it needs an explicit product decision and a trusted capability design; silently treating every permission denial as two completed spins weakens the new gate. Keeping the Rules-first release prerequisite has **zero additional gameplay reads**. Production deployment status is **unknown** here; no production probe was made.

### R87-E-03 — P3: a cheap spin mark is charged as a full transfer mutation

**Evidence:** `js/sparkPrivatePairing.js:716,745,1597` uses the public transfer path's seven-document write union for every successful transaction on that path. `tests/browser/support/billed-meter.cjs:15-18,52-64` uses the same create/update upper bound. `firestore.transfer-challenge-production.fragment.rules:358-376` accepts a normal mark using only rivalry entitlement and the actor role; the phase guards at `:175,195-196,369,380` keep ledger branches off that pre-window request.

**Trigger:** each phone completes Roulette and sends its own one-document `markSpun` transaction, including an idempotent retry after a timeout. A successful mark reaches one distinct dependency, the rivalry. The model instead includes account, device, session, setup, Career Start, and private-role dependencies as well. These are alternatives for ledger writes on the same path, not extra documents needed by a mark.

**Cost:** **1 Rules read actual dependency / 7 in both counters**, so **+6 estimated reads per successful mark**, normally **+12 per season across two phones**. A successful explicit retry adds another +6 estimation bias. Writes themselves are not billed document reads. The public document delivered to a waiting listener costs **1 document + 1 rivalry dependency = 2**, independently of this write charge. This is a concrete new R87-SPINS branch-cost instance of the conservative-upper-bound limitation discussed in prior A-05; it is not another claim about the already-fixed symbolic path aliases.

**Smallest fix:** retain the union for diagnostics, but price successful `markSpun` as its own operation with one dependency in both client and CE2PG. Do not lower every transfer write to one. This changes the estimate by −12 per ordinary season and saves **zero actual Firebase reads**. Engine-boundary proof and its limits appear below.

### R87-E-04 — P0: three normal r87 signings exhaust the Rules expression budget

**Evidence:** `js/productionSharedTransferChallenge.js:271` collects all three signing rows, including the required overall and position inputs; `js/sparkSharedTransferChallenge.js:69-71` accepts these optional protocol fields. `firestore.transfer-challenge-production.fragment.rules:236-251,257-262,309-339` validates those rows during signing lock. Composed `firestore.spark.generated.rules:1511-1526,1532-1537,1584-1614,3125-3135` is the deployed-path candidate.

**Exact reproduction:** copy `tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs` to a temporary file, preserving all providers, normal three-guess inputs, pairing, setup and Career Start. In each of its three normal signing rows on each phone, add `position: 'ST', overall: 80`. Use the unmodified candidate Rules. Season 1 fails at Daniel's first `Transfer.lockSignings` (the source fixture's assertion at line 162). Wrap only the SDK's `runTransaction` rejection to print its original error before rethrowing; the engine reports:

```text
Unable to evaluate the expression as the maximum of 1000 expressions
  to evaluate has been reached. for 'update' @ L3125
... 'update' @ L3128 ... 'update' @ L3135
S1 Daniel signings failed: {"ok":false,"code":"permission-denied"}
```

The failure was reproduced twice. The same lifecycle's three rows **without** these r87 fields succeeds (E-01's run reached the acknowledged commit); the normal fresh-session suite's maximal payload test also passes without these fields. CE2PG at `tests/browser/ce2pg-journey.cjs:574-583` enters **one** signing per phone with position/overall, so its successful season does not cover this three-signing case. No invalid position, name, nationality, league or overall was supplied.

**Root cause:** valid extra r87 row predicates push the already near-ceiling composed transaction evaluation past 1,000 expressions. Accepting the new keys syntactically is insufficient; the combined read/write evaluation must fit. Retries of this same payload do not reduce its expression count.

**Smallest tested candidate fix:** in `ssjrTransferPrivateUpdateValid` (`firestore.transfer-challenge-production.fragment.rules:331`), replace `ssjrWriteAuthorityValid` with `ssjrActorWriteAuthorityValid`. Retain the full pair-envelope check on the public ledger update, and all the private/public operation, actor, device, session and `request.time` linkage checks. The private update still checks all four authority documents, including account/device liveness and exact ACTIVE session. It avoids redoing the pair-envelope predicates already required by the linked public write. On a temporary Rules copy, the exact same full three-row inputs progressed through both signing locks, results, commit and both acknowledgements:

```text
POSITION_FIX full 3-row signing payloads completed season 1
```

This is a narrowly tested candidate, **not** a release-approved patch: repeat the adversarial private-only/public-only and revoked-authority matrices on it before adopting it. An initial experiment removing only the two redundant option-ID regex checks per signing row **still failed** at 1,000 expressions and is not offered as a sufficient fix. The successful candidate introduces **zero additional distinct dependency reads**. Successful play avoids failed attempts and retries, whose exact denied-request bill is **unknown**.

### R87-E-05 — P2: reading one's own private inputs fetches the public phase unnecessarily

**Evidence:** `firestore.transfer-challenge-production.fragment.rules:384-387` and `firestore.season-results-production.fragment.rules:233-236` bind `public = get(...)` before testing whether `managerRole` is the actor's own role. On that own-role branch, the phase is irrelevant. Normal provider reads include the own role at `js/sparkSharedTransferChallenge.js:148`, including every mutation's context read. The shipped model prices private transfer/result gets as three units: target document, rivalry and public phase document.

**Exact steps:** on a live two-manager rivalry, read one's own `transferChallenges/season_1/roles/playerOne` as playerOne, with the public challenge still WINDOW_OPEN. Add nine distinct padding get predicates to the complete private-get allow expression in a temporary composed Rules copy. The original helper is refused (eleven dependencies including the two normal dependencies). Move the public get into the right side of the own-role `||` and repeat the identical request: it succeeds (ten dependencies). The same experiment was applied to the private Season Results helper. This tests engine branch execution rather than estimating counts from coverage nodes. Exact outcomes are recorded in the validation measurements below.

**Root cause:** an eagerly bound `let` defeats the cheap own-role short circuit. The public phase remains necessary for a rival's reveal and must not be removed there. This is separate from known A-02's root self-get: the unnecessary dependency here is a **different** document, so the root's self-cache caveat does not apply.

**Smallest fix:** use `ssjrEntitled(rid) && (managerRole == ssjrActorRole(rid) || get(publicPath).data.phase == finalPhase)` without the upfront `let`. Retain the completed-game fallback. Price owner/rival reads separately in the client and CE2PG after this change; a path-only union would keep reporting the old cost. No payload, visibility or ledger transition needs to change.

**Billed-read effect:** **−1 actual dependent read per own-role server get/delivery**, from 3 to 2 total, for each helper so changed. For T own transfer deliveries and S own result deliveries, savings are **T + S**. There is no savings on a rival reveal, which must still read the public phase, or on a cache-only delivery. An aggregate per-season saving is **unknown**: the printed role-path totals mix own and rival reads, and are not used as an invented owner-only count.

## Rules paths and prices

The current table and client pin are `bffd4bff694d6fa91d97c0b943b1fd6c40f7e125db4acb53639684a31dd86e9e`. Prices below are **the shipped model**, including its conservative alternatives, not independent measured bills. Each server listener delivery pays the applicable read price again; cache-only deliveries do not. Write columns contain Rules dependencies only.

| Document | Live get/delivery | Finished get | Write union |
|---|---:|---:|---:|
| rivalry root | 2 | 3 | 8 |
| shared setup | 2 | 3 | 5 |
| Career Start | 2 | 2 | 5 |
| public transfer | 2 | 3 | 7 |
| private transfer role | 3 | 4 | 5 |
| public season results | 2 | 3 | 6 |
| private season result | 3 | 4 | 2 |
| season commit | 2 | 3 | 8 |
| reads meter | 2 | 3 | 1 |

The root-finished price and root self-get are the previously reported A-04/A-02, not new findings. Alias folding was added since the earlier A-05 report (`canonicalWriteDoc`, `writeRequestDocs`); A-06's missing partner career snapshot is addressed by the shared meters. No earlier A-01–A-06 issue is presented here as a newly discovered issue.

### Engine proof without coverage counters

A local probe added N successful, distinct `get(/pad/pN)` predicates to **all relevant allow branches** of a temporary Rules copy and seeded those padding documents with `ok: true`. Reads used `getDoc` and writes used the real normal meter/spin shapes with `serverTimestamp()`. The production source was untouched. With the per-request access-call ceiling as a sentinel, nine extra dependencies plus a normal meter or mark fit; ten extra dependencies do not. Repeated rivalry helper calls therefore do not represent repeated distinct dependency reads. This is an engine denial/acceptance experiment, not a count of AST evaluation nodes.

The root control is particularly important: **ten padding dependencies plus its self-get passed; eleven padding dependencies were denied**. A child meter read fits only nine. The engine evidently gives the root's own document an access-cache benefit. This experiment does **not** establish whether Firebase's billing accounting charges that self-get: an emulator has no invoice, and a Rules access-limit cache is not an independently observed bill. Therefore the requested A-02 *billed-saving* proof remains **unknown**; subtracting every modelled root self-get from a measured season would overclaim. A root-specific `resource.data` helper is still the proposed authorization-preserving simplification, but this audit does not relabel that known proposal as a verified monetary saving.



| Sentinel experiment | 9 padding gets | 10 padding gets | 11 padding gets |
|---|---|---|---|
| Root get with existing self-get | pass | pass | permission-denied |
| Live meter get | pass | permission-denied | not needed |
| Own meter write | pass | permission-denied | not needed |
| Own spin mark create | pass | permission-denied | not needed |

For reproducibility, each pad predicate was `get(/databases/$(database)/documents/pad/pN).data.ok == true`; seed all padding docs via `withSecurityRulesDisabled`. Wrap the original root get allow in `(original) && (pads)`. For the meter, wrap the matching get or create/update allow, including the completed alternative, rather than adding another permissive allow. For a mark, prepend pads to `ssjrTransferSpinCreate`; seed no challenge, and send the exact seven-key NOT_STARTED shape. Use authenticated member `acct_a`, matching playerOne slot, an active two-slot rivalry and `serverTimestamp()`. Tests used fresh initialized environments between Rules variants. The root eleven-pad negative control prevents misinterpreting an unenforced ceiling as evidence of a cache benefit. These temporary Rules were never written to a production fragment or deployed.

## Normal flows, isolation, retries and old Rules

- **Candidate marks:** `shared-transfer-challenge-fresh-session-emulator.cjs` passed **19 checks**, including RM1–RM5: first own mark, idempotent own retry, partner mark, START only after both, preserving/removing marks, stranger/other-role denial, and a late mark refused after WINDOW_OPEN. START replaced the marks with the original ledger. The existing fresh-session timeout path preserved `startedAt`, migrated authority, and advanced the expired window. The 1,000-expression failure for three r87 signing rows is E-04, outside that suite's old-field maximal-payload case.
- **Candidate meters:** `shared-reads-meter-emulator.cjs` passed **23 checks**, including real budget layers writing and reading through Rules. Both showed **76 seasons left at 612 modelled reads/season** from its fixture. This proves document compatibility and identical arithmetic, not a measured career cost. Wrong role, stranger, signed out, closed write, list/delete, malformed keys/counts/costs/timestamps are refused.
- **After close:** `completed-showdown-read-emulator.cjs` passed **70 checks**. A8 proves both members' meter gets after Terminal Close, B13 denies outsider/signed-out/list, C6 denies meter writes/deletes after close, D7 denies an abandoned game's meter read. That reaches the `cmsCompletedShowdownReadable` branch (`firestore.persistent-pair-production.fragment.rules:549-576`) rather than assuming a live entitlement still holds. Its distinct dependencies are the root and acting account: **3 billed units including the delivered meter document** under the stated model.
- **Meter/mark isolation:** a separate candidate-Rules batch probe accepted a valid meter, refused a meter carrying `phase`, refused both replacement and merge marks against a live WINDOW_OPEN transfer, and refused a batch combining a valid changed meter with a bad ledger replacement. Admin verification found the original live transfer unchanged and meter `game` still 1, not the attempted 99. Output: `ISOLATION_PASS meter cannot smuggle ledger keys; mark cannot replace/merge into live window; meter+bad-ledger batch is atomic and refused`. The live transfer seed was intentionally minimal, to test the phase guards; full valid-ledger coverage also comes from RM5. Independent write checks still apply to every other document in a batch; the meter grant is not a parent wildcard.
- **Races:** concurrent commit acknowledgements, the two-page acknowledgement race (both orders and simultaneous), and Terminal Close stale-write race suites passed. The close suite denied stale progress and half/full stale close writes, preserved the winning phone's writes, replayed a losing close and converged in a real two-provider race. The raw-SDK authority suite was rerun to completion on its own emulator: **18 checks passed**, including missing/revoked account/device/session denial. An earlier shared-emulator run was interrupted when its owning command exited and is not counted as a product failure.
- **Old Rules:** the actual old-Rules provider experiment is E-02. The meter's permission-denied fail-open behavior is covered by M4 in `r87-shared-reads-meter-contracts.cjs` and by its error catch at `js/sparkPrivatePairing.js:939-947`; it stops the day's first denied meter exchange and keeps the phone-derived estimate. PR #1097's fallback claim matches that behavior. PR #1101's body (read live during this audit) explicitly says “If a mark is refused (old Rules), the client fails open on that phone”; the current provider/screen and emulator contradict that statement. Update the claim even if Rules-first deployment is retained.
- **Rematch/Deadline Day/Special Player/Roulette:** Rematch and Deadline Day contracts passed (5 and 7 groups); Roulette passed 27 groups; shared reads SP fixes passed 5. The two-browser journeys exercise current setup, Roulette and one signing with position per phone against composed Rules. This is not exhaustive emulator coverage of every local board, SP selection or Rematch combination. No new server path is introduced by the Rematch/Deadline Day contracts. E-04 demonstrates why a passing one-row browser journey is insufficient to certify all normal transfers.

## Composition, pins and deployment boundary

`composed-production-rules-contracts.cjs` passed **10 checks**. Both build scripts were replayed in a temporary directory, producing **162,066 bytes**, SHA-256 **bffd4bff694d6fa91d97c0b943b1fd6c40f7e125db4acb53639684a31dd86e9e**, Git blob **4a7a09f604c3949c404fc22f499e4d1ba40669bf**. The generated file is a build artifact, not a separately tracked authoritative source. The table, client and `tests/fixtures/composed-production-rules/main-delta.json` candidate agree. Relative to main `5b4337fd`, the reviewed allowlist has **8 hunks, −3/+98 lines**: optional signing fields, meter grants/completed get, spin grants and the phase-before-ledger guard. No unexplained composition drift was found.

`r86-billed-counter-contracts.cjs` passed 8 checks; `r84-billed-budget-contracts.cjs`, shared result/commit Rules contracts and deployment-path contracts passed. The r87 shared-meter and both-spins contracts passed as well. The full composed regression runner was **not** claimed as rerun; the report names the actual suites executed rather than borrowing its historical 63/63 result.

The existing Rules-first Pages dependency remains present at `.github/workflows/deploy-github-pages.yml:22-62`: a failed same-head Rules run blocks the site; absent a run, the fallback checks the latest completed main Rules run before continuing. This audit does not re-report that known deploy-order item or claim the workflow prevents a human/git push to main: it gates site deployment. No push to main occurred. Provider deploy/read-back status, including whether either addition has since been deployed, is **unknown** because production Firebase was out of scope. A matching pin proves composition identity, not successful deployment or expression-budget headroom.

## Reads estimate and measurement method

`js/settings.js:309-339` renders `CareerModeFirestoreBudget`'s result. In `js/sparkPrivatePairing.js:732,868-871,891-915`, the default is **400 billed reads per phone per season**; fallback divides by the phone's assumed role share (Daniel 0.55, Nik 0.45; unknown 0.5). A fresh phone therefore assumes **727 / 889 / 800** pair reads respectively, not one common 800. The shared mode sums the two phone costs and snapshots. Setup before Career Start is excluded from the steady-season average (`:829-856`); don't compare a fresh Showdown's setup-inclusive first season directly with that default and call the difference an estimator defect.

Roulette's history is not unconditionally extra Firebase traffic every season. `js/productionSharedTransferChallenge.js:65,445-462` keeps up to **40** verdict entries in local storage and returns those before calling the provider; each completed transfer seeds the cache. `js/rosterRouletteStep.js:113-123` asks for all preceding seasons, but a normal phone with its verdicts retained serves these locally. A missing-cache prior season requires the provider read; its three transfer payload documents alone cost **2 + 3 + 3 = 8** while the rivalry is live, plus any uncached context reads. The whole cold-context cost is **unknown** here; do not present the payload subtotal as the full bill. The slim budget runs retain that verdict cache and are not a cold-history stress test.

The local CE2PG runs used real two-context Chromium, Firebase Auth and Firestore emulators and the pinned composed Rules. Required packages were exactly **firebase 12.17.0, @firebase/rules-unit-testing 5.0.1, firebase-admin 14.2.0**; CLI **firebase-tools 15.28.1**, Firestore emulator **1.22.0**, Java 21. Production-host guards passed in the completed journeys. Databases and emulator Auth accounts were cleared between independent lengths; browser multi-context mode was enabled. An initial single-process Chromium startup failed before play and was rerun with `CMS_CHROMIUM_MULTI_CONTEXT=1`; no zero-read failed startup is included as a measured season. An attempted three-season run reusing the preceding pairing state was also discarded and restarted against a cleared emulator.

Commands (each length uses its own cleared demo emulator):

```sh
CMS_CHROMIUM_MULTI_CONTEXT=1 CE2PG_BUDGET=1 \
CE2PG_BUDGET_SAMPLE_MIN=0.1 CE2PG_BUDGET_SHORT_SAMPLE_MIN=0.05 \
CE2PG_PLAN=single CE2PG_SEASONS=1 node tests/browser/ce2pg-journey.cjs
# Repeat with CE2PG_SEASONS=3 and 10.
```

These are deliberately identified as **short-sample runs**: 6-second long waits / 3-second short waits. Their measured windows count actual observed SDK deliveries priced by the upper-bound Rules model. Their minute/hour profiles extrapolate the last half of those very short samples. A single delayed startup/ack read can be magnified into hundreds of reads/minute; this was observed, so those profiles cannot independently certify the 400 default or a real daily capacity. A separate longer-sample one-season run uses the repository's budget-script sample durations, 1 minute / 0.5 minute. Results are recorded below. There is no real Firebase invoice measurement in any row.


## Measured per-season billed-model reads

These are measured-window **document deliveries plus modelled Rules dependencies**, both phones. Rules-on-write is included in the total; writes themselves are excluded. Season 1 includes START/pairing/setup; the final row includes the journey's close boundary but excludes the separately marked page-check tail from its play window. Keep those boundaries when comparing runs. Setup leagues differed: short 1 Serie A, short 3 Premier League, short 10 LaLiga, longer 1 Bundesliga.

| Run | Season | Documents | Rules on reads | Rules on writes | Total | Daniel | Nik | Writes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| short 1 | 1 | 310 | 389 | 236 | **935** | 500 | 435 | 51 |
| short 3 | 1 | 317 | 400 | 226 | **943** | 509 | 434 | 48 |
| short 3 | 2 | 182 | 264 | 107 | **553** | 286 | 267 | 22 |
| short 3 | 3 | 209 | 298 | 133 | **640** | 366 | 274 | 27 |
| short 10 | 1 | 434 | 515 | 226 | **1175** | 619 | 556 | 48 |
| short 10 | 2 | 263 | 346 | 107 | **716** | 379 | 337 | 22 |
| short 10 | 3 | 258 | 340 | 107 | **705** | 399 | 306 | 22 |
| short 10 | 4 | 230 | 311 | 107 | **648** | 345 | 303 | 22 |
| short 10 | 5 | 252 | 337 | 107 | **696** | 367 | 329 | 22 |
| short 10 | 6 | 226 | 309 | 107 | **642** | 353 | 289 | 22 |
| short 10 | 7 | 224 | 311 | 107 | **642** | 340 | 302 | 22 |
| short 10 | 8 | 201 | 284 | 107 | **592** | 310 | 282 | 22 |
| short 10 | 9 | 194 | 279 | 107 | **580** | 308 | 272 | 22 |
| short 10 | 10 | 233 | 318 | 189 | **740** | 425 | 315 | 34 |
| longer 1 | 1 | 321 | 405 | 236 | **962** | 526 | 436 | 51 |

| Run | Total window reads | Average / season | Checks | Billed pace gate |
|---|---:|---:|---|---|
| short 1 | 935 | 935.0 | 36/37 | fail (short-sample extrapolation) |
| short 3 | 2,136 | 712.0 | 71/72 | fail (short-sample extrapolation) |
| short 10 | 7,136 | 713.6 | 195/196 | fail (short-sample extrapolation) |
| longer 1 | 962 | 962.0 | 37/37 | pass |

The short three-season total is **2,136**, versus the supplied r86 measurement of about **2,378** (−242, −10.2%). That is an observed numerical comparison, **not** a controlled r87 saving: wait sampling, setup, delivery ordering and fixtures differ. Do not attribute the difference to any one Rules change or extrapolate it into a production bill.

The longer-sample one-season run passed **37/37**, with **962** measured-window units over 409.5 seconds of play-window measurement (447 seconds total harness runtime). Its slow/mid/fast modelled totals were **1,058 / 1,018 / 998** and all passed their pace budgets. The 6/3-second pilots all finished the gameplay checks; their sole failed check was `zz.billed`. The three-season pilot exaggerated a handful of delayed results-entry/ack reads into 440–520 billed/minute; similar transient amplification occurred in the ten-season pilot. Those failed gates are reported, not silently relabelled passes or evidence of sustained production waste.

**Is 400 per phone per season right for r87? Unknown as a calibrated real-play constant.** It is an initial heuristic, superseded by measured phone averages and then shared meter costs, not an engine-derived price. The supplied r86 average was 792.7 per pair; the short r87 three-season average is 712.0 including startup, while its steady-season windows are 553 and 640. The longer one-season number includes startup and a different amount of waiting. These do not establish a common steady-season denominator within 10% for a real FIFA-length season. Retained Roulette verdicts add no mandatory history fetch; cold/recovery verdicts do. Do not blindly increase the default for every season, or lower it from a setup-inclusive pilot average. A controlled longer-sample multi-season run with per-phone season-start marks and a separate cold-history run are still needed before certifying or replacing 400. No replacement constant is guessed here.

### Exact engine outcomes for E-05

```text
OWN_ROLE_NINE_PADS before permission-denied
OWN_ROLE_NINE_PADS after PASS
OWN_RESULT_NINE_PADS before permission-denied
OWN_RESULT_NINE_PADS after PASS
```

Both experiments used the pinned candidate before changing only the helper's eager public get to a short-circuited reveal branch; nine seeded pad documents, the same authenticated own role, and the same target/public documents were used on both sides. The full allow (including completed fallback) was wrapped, so another grant could not bypass the padding. This proves the one-dependency reduction on each normal live own-role branch. It does not price a stranger's denied request or a finished-game fallback by assumption.

## Ranked top five and score

| Rank | ID | Priority | Action |
|---:|---|---|---|
| 1 | R87-E-04 | P0 | Restore Rules expression headroom for three valid r87 signings; add this real payload to the emulator gate. |
| 2 | R87-E-01 | P0 | Bind season creation to the previous acknowledged season so an ordinary wrong-season argument cannot persist future results. |
| 3 | R87-E-02 | P0 with old Rules | Correct the spin fail-open claim and treat matching Rules as a release prerequisite; the meter fallback does not make START compatible. |
| 4 | R87-E-05 | P2 | Defer public phase gets until the rival-reveal branch; save one dependency on every own private read. |
| 5 | R87-E-03 | P3 | Price the new mark operation at one dependency rather than the seven-dependency transfer union. |

**Score: 6/10.** The exact composition, private scope, immutable locks/results, close races, completed meter access and meter fallback have useful passing evidence. The normal maximum signing payload is blocked and a wrong season can create acknowledged future results, so a high score would hide material defects. To reach 10/10: fix and reprove those two P0s (including max payload, out-of-order starts, private-only writes and authority denials), resolve the explicit old-Rules compatibility claim, implement and remeasure the two branch-specific cost improvements, and establish repeatable 1/3/10-season realistic-wait and cold-Roulette-history measurements before certifying the default or Settings' capacity. Root self-get invoice savings and production deployment remain **unknown**, not assumed accomplishments.
