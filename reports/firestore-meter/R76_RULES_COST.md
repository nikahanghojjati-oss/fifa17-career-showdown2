# R76 Rules cost per season and ranked cut plan

JOB-1825. **REPORT ONLY, DO NOT MERGE.** Both managers combined; unchanged r75 app at `2f3865feca484223ac7d267d83a9c4828bad3078`, measurement parent `f1fbd2ee96da97978898158d0a69900426a84aa5`. Local demo emulators only. No app, Rules, existing test, fixture, deployment or production data change. No SSJR or MDP credit.

## Plain answer

Billable today: about **5800 reads per season**, about **8.7 seasons a day at 60 minutes of waiting**. With the app-side cuts: about **26.0 a day**. With app-side and Rules-side cuts: about **27.6 a day**.

The latter two are conditional engineering budgets, not measured implementations: eliminate unchanged idle polling, remove only backend duplicates if observed, and pay 20 fresh watcher-binding reads per season. Rules changes require Nik’s sign-off. The current estimate is the distinct-document emulator model, with a 20.0-read/season allowance for unresolved contention attempts; it is not a production invoice. Quota capacity is fractional capacity, not a promise of a whole extra playable season.

## Measurement and limits

One fresh three-season m3 run used `METER_IDLE_MS=0`; one fresh i3 run used `120000`, with Home, Standings, Season Results and Nik-hidden Results windows in each season. The unchanged `tests/browser/ce2pg-meter.cjs` ran with a measurement preload. Its on-disk hash is `38da09d8d2e406c0ee336614824b58304977be6656241c6bec1d836925921cce`. Java 21, Chromium 151, SDK 12.17.0, Firebase tools 15.28.1, emulator 1.22.0, Playwright 1.62.1, static server 4511 and `CI=1` match 1824. The exact r75 Rules were composed in scratch space: SHA-256 `6eaeefc63729a9e87c3ec776791bac0ec768f8d9998fa9244b07adc26a478832`. Browser SDK modules were served locally; the original googleapis.com/firebaseio.com blocks remained in force. No real Firebase project or browser service host was used.

The preload observes RPC bodies, outcomes, SDK caller chains, snapshots and local emulator request events. It adds no app behavior or assertion changes. It snapshots documents with emulator-admin reads for replay; those instrumentation reads, seeding writes and replay requests are excluded from client totals. Capturing before-images and fetching coverage add latency, so this is a workload sample, not a timing benchmark. m3 supplies the non-idle base; only timed i3 windows supply idle rates. I3 navigation/coverage overhead outside those windows is not added to the forecast. Setup is allocated to season 1. Ordinary final screens are included; extended rivalry/history/cleared/fresh-browser audit phases are excluded from the workload, retained in full run checks.

Client reads are successful transaction/direct server reads plus non-cache listener deliveries. A denied read attempt is not a returned client document. Each transaction read RPC and final commit is a separate backend request; verify entries are part of the commit, not another client document read. Intentional snapshot-abort read helpers never send a verify commit, so merely converting every read-only helper to getDoc cannot claim a blanket verify saving. No list/query or standalone batched-write request was observed. The JSON retains every observed operation/path/owner tuple, including account reads with zero Rules lookups and mixed-write commit tuples.

Signatures shared between m3 and i3 reuse the same SHA-bound N=3 proof; new signatures receive their own isolated check. For each request signature, restore the captured pre-request database state, rebase freshness timestamps, replay N=3, then subtract emulator coverage counters. Coverage AST path arguments identify concrete dependency documents; union paths before masking identifiers. Two distinct accounts remain two documents even though their masked patterns match. get and getAfter of the same path count once. Evaluator error/dependency-loading passes and repeated helper calls are not separately billed. Direct-read controls and actual onSnapshot controls test listener parity. Stream authorization events are combined with REST captures; event outer time is used because a stream’s Rules context time can stay at its opening time. A new evaluation after a terminal allow is kept as a new authorization. One m3 200-response body was unavailable after navigation; its seasonCommits read uses the same three-document entitlement path, confirmed by the matching-kind probes.

The emulator request UI is not a complete RPC ledger (13 m3 RPCs have no matched UI event); captured RPCs remain authoritative. SDK-to-RPC attribution permits a 30-second dispatch delay; transport retries without a new wrapper event inherit the latest preceding same-context, same-path SDK owner within 120 seconds. Those inferred owner counts are recorded separately and are excluded from duplicate-read savings. Their document costs do not depend on the owner inference. Unmatched GET authorizations account for listener rechecks/direct reads, with owner assigned from the active registration or SDK call. Listener dependency rechecks are included; cache-only deliveries are excluded. The model conservatively retains observed stream authorization events, which the emulator does not expose as a billing invoice. Cached getDoc behavior, reconnect billing and production backend caching remain uncertainty.

Three original m3 commits ended in transaction lock timeout (409). Sequential replay returned 403/400 instead, so their coverage is **not** accepted as an exact match. Their cost is bounded at 0–20 distinct Rules documents per request, the multi-document request access limit: 0–60 across m3, 0–20 per season. They are never silently priced as a successful replay. Per-request counter deltas and mismatched outcomes are published below and in JSON. Valid signatures have N=3 matched outcomes; this proves the sampled branches, not every possible document state.

## Run evidence

| Run | Seasons | Wait ms | CE2PG checks | Verdict | RPCs | Unknown owners | Inferred owners |
| --- | --- | --- | --- | --- | --- | --- | --- |
| m3 | 3 | 0 | 402/433 | FAIL | 1325 | 0 | 0 |
| i3 | 3 | 120000 | 422/460 | FAIL | 2355 | 0 | 4 |

Both three-season games and terminal witnesses completed. The gameplay SDK meter records 1,374 m3 and 2,415 i3 read attempts/deliveries; the server-client model prices 1,373 and 2,413 successful document reads/deliveries respectively, excluding one and two denied attempts. These i3 totals include timed waits; its base-only figure excludes them. Journey failures remain failures; completion is not a full browser-test pass or merge seal. m3 has two additional failed IDs versus 1824 m3a: ident.all.text.careerStatistics.daniel-daniel-fresh and zz.network.nik (a denied post-close session read). The other 29 failed IDs overlap. Timing and denied reads are retained, not repaired by this report. Each run’s failed IDs are in the JSON. The first m3 boot failed before gameplay and was excluded. After both full reports, raw logs and coverage were saved, observer resources kept Node alive. Each completed harness process was stopped during cleanup; the resulting supervisor exit 143 is separate from the 433/460 completed checks. The helper now exits with the original verdict code after flushing its observer stream.

## Base and waiting cost

| Position (m3) | Client | Distinct Rules, lower | Total range |
| --- | --- | --- | --- |
| first + setup | 585 | 1776 | 2361–2381 |
| later | 390 | 1246 | 1636–1636 |
| final + close | 398 | 1254 | 1652–1692 |

Mean base: 457.7 client + 1425.3 Rules = **1883.0–1903.0 reads/season**.

| Screen, both managers | Timed minutes | Client/min | Rules/min | Total/min | Unpriced |
| --- | --- | --- | --- | --- | --- |
| Showdown Home visible | 6.0 | 8.6 | 27.8 | 36.4 | 0 |
| Standings visible | 6.0 | 9.9 | 27.3 | 37.2 | 0 |
| Season Results visible | 6.0 | 27.6 | 91.3 | 118.9 | 0 |
| Season Results Nik hidden | 6.0 | 15.3 | 45.8 | 61.1 | 0 |

Main forecast allocates waiting equally across the three visible screens. Nik-hidden Results is a separate visibility check, not part of that mixture. Every screen’s three windows and manager subtotals are in the JSON. Windows charge only event timestamps inside their recorded start/end; activity during coverage snapshots is excluded. There were no client mutation writes during the idle windows.

## Daily capacity

| Wait min/season | Client | Rules lower | Total range | Seasons/day (upper cost) | 1824 upper reads | 1824 seasons/day |
| --- | --- | --- | --- | --- | --- | --- |
| 30 | 919.3 | 2888.4 | 3807.6–3827.6 | 13.1 | 18135.6 | 2.8 |
| 60 | 1380.9 | 4351.4 | 5732.3–5752.3 | 8.7 | 26114.7 | 1.9 |
| 120 | 2304.0 | 7277.5 | 9581.6–9601.6 | 5.2 | 42072.9 | 1.2 |

Reads/day = 50,000; writes/day = 20,000. The 1824 conservative write mean, 139.2/season including verifies, allows 143.7 seasons/day and does not bind these scenarios. The old upper model charged each Rule evaluation; the revised table charges distinct documents per backend request. 20–30 seasons/day requires about 1,667–2,500 reads/season; the current unchanged idle behavior remains above that budget.

Conditional app budget = upper m3 base − 0.0 measured duplicate-read cost + 20 watcher-binding reads, with unchanged idle polls eliminated: 1923.0 reads/season. Conditional app + Rules budget subtracts another 109.7 Rules reads after duplicates: 1813.3. These forecasts exclude unmeasured cache savings and overlap neither duplicate nor Rules savings. These are quota capacities; a literal 60-minute idle period per sequential season also limits calendar throughput to fewer than 24 seasons/day once play time is included. The proposed watcher design must maintain the same authorizations and invalidate on offline/reconnect, account/device/session/season changes and expiry; otherwise these budgets do not apply.

## Top 10 causes and a cut for each

Ranked by m3 non-idle billable reads/season, not by evaluator count. Each row is an operation/path/owner tuple; request count includes retries. All are transaction reads. Cost = count × (one client document + distinct Rules documents).

| Rank | Path (under rivalries/{rivalry}) | Owner/function | Requests/season | Rules docs/request | Reads/season | App target: skip 2 unchanged reads/season | Rules saving/season |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 40.3 | 4 | 201.7 | 10.0 | 30.7 |
| 2 | transferChallenges/season_{n} | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 27.3 | 3 | 109.3 | 8.0 | 0.0 |
| 3 | careerStart/authoritative | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 25.7 | 3 | 102.7 | 8.0 | 0.0 |
| 4 | sessions/{session} | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 18.0 | 4 | 90.0 | 10.0 | 0.0 |
| 5 | rivalries/{rivalry} | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 19.0 | 3 | 76.0 | 8.0 | 19.0 |
| 6 | sharedSetup/authoritative | js/productionSharedTransferChallenge.js: pstcRefreshNow:111 → pstcProviderOptions:90 → stspRead (js/sparkSharedTransferChallenge.js:151), stspContext:127 | 18.0 | 3 | 72.0 | 8.0 | 0.0 |
| 7 | seasonResults/season_{n}/roles/{role} | js/productionSharedSeasonResults.js: pssrRefreshNow:81 → pssrProviderContext:66 → ssrpRead (js/sparkSharedSeasonResults.js:147), ssrpContext:132 | 10.7 | 4 | 53.3 | 10.0 | 8.7 |
| 8 | seasonCommits/season_{n} | js/productionSharedMultiSeasonProgression.js: pmspRefresh:153 → pmspProviderOptions:56 (js/productionSharedMultiSeasonProgression.js) | 12.7 | 3 | 50.7 | 8.0 | 0.0 |
| 9 | sharedSetup/leagueProjection | js/productionSharedSeasonResults.js: pssrRefreshNow:81 → pssrProviderContext:66 → ssrpRead (js/sparkSharedSeasonResults.js:147), ssrpContext:132 | 11.0 | 3 | 44.0 | 8.0 | 0.0 |
| 10 | seasonResults/season_{n} | js/productionSharedSeasonResults.js: pssrRefreshNow:81 → pssrProviderContext:66 → ssrpRead (js/sparkSharedSeasonResults.js:147), ssrpContext:132 | 9.7 | 3 | 38.7 | 8.0 | 0.0 |

1. **rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}** — App: retain completed role projections, keyed by rivalry/season/public revision; invalidate on authority changes and revalidate before mutation. There are 100 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 10.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally. Rules (Nik sign-off): branch on own role before fetching public phase; retain ssjrEntitled and opponent/completed-history checks. Saves 30.7 additional reads/season after app deduplication.

2. **rivalries/{rivalry}/transferChallenges/season_{n}** — App: use the existing transfer public wait-point snapshot; coalesce unchanged pstcRefreshNow calls into one refresh per revision. There are 61 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

3. **rivalries/{rivalry}/careerStart/authoritative** — App: retain the validated acknowledged careerStart snapshot within the current authorized rivalry/session instead of fetching it for every transfer projection. There are 56 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

4. **rivalries/{rivalry}/sessions/{session}** — App: watch session and device authority, enforce the expiry timer, and reuse their current snapshots for presentation; mutation transactions stay unchanged. There are 33 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 10.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

5. **rivalries/{rivalry}** — App: reuse the current authorized rivalry snapshot; invalidate on membership/account/session changes rather than refetching it for every transfer render. There are 36 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally. Rules (Nik sign-off): direct rivalry GET uses resource.data instead of self get; preserve activeActor, authorizedAccountIds membership and pending-invite fallback. Saves 19.0 additional reads/season after app deduplication.

6. **rivalries/{rivalry}/sharedSetup/authoritative** — App: reuse the validated SHOWDOWN_CONFIRMED setup snapshot for the same authorized rivalry/session; retain all mutation preconditions. There are 33 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

7. **rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}** — App: retain RESULTS_READY role cards for presentation until authority changes; revalidate before any operation. There are 25 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 10.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally. Rules (Nik sign-off): branch on own role before fetching public phase; retain ssjrEntitled and opponent/completed-history checks. Saves 8.7 additional reads/season after app deduplication.

8. **rivalries/{rivalry}/seasonCommits/season_{n}** — App: coalesce pmspRefresh calls and listen to the current commit; replay acknowledged immutable prior history locally. There are 38 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

9. **rivalries/{rivalry}/sharedSetup/leagueProjection** — App: retain the validated immutable leagueProjection with its setup/rivalry key and invalidate it with authority changes. There are 26 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

10. **rivalries/{rivalry}/seasonResults/season_{n}** — App: reuse the existing result-public wait-point snapshot and refresh one projection per revision instead of independent unchanged refreshes. There are 22 read-only presentation reads across m3. Skipping two verified-unchanged requests per season saves 8.0 reads/season. This conditional base-workload target is not added to the capacity forecast; authority watcher costs are charged globally.

## Implementation plan and protection witnesses

App source inspection: stspRead calls stspContext twice after COMPLETED (`js/sparkSharedTransferChallenge.js:151`); ssrpRead repeats ssrpContext after RESULTS_READY (`js/sparkSharedSeasonResults.js:147`). Carrying context forward may simplify execution, but the measured backend ledger has **zero duplicate path reads within the same transaction instance/attempt**. Do not bank wire savings for that source refactor. Transaction IDs restart on navigation, so the analysis anchors them to txstart timestamps before comparing. Independent read helpers and the runtime cache already avoid the supposed duplicate RPCs in this sample. Keep the same transaction snapshot, authority dependencies, CAS/read versions and mutation checks. Measured duplicate cost booked in the forecast is 0.0 reads/season. A plain get still pays its own authorization dependencies.

Next remove independent unchanged-state polling: progression `pmspRefresh`/`pmspWake` (`js/productionSharedMultiSeasonProgression.js:153`, :186), final reconciliation `pfrRefreshNow` (:58), terminal `ptcRefreshNow` (:156), and commit `psscRefreshNow` (:130) in their corresponding productionShared files. Gate final-only work on eligibility; one authoritative change schedules one refresh. Reuse only acknowledged immutable prior history. Watch the current public document and session/device authority, retain active-account/rivalry Rule dependencies and an expiry timer, and force revalidation before any mutation or after reconnect/context changes. Keep the existing public wait-point listeners and their binding/delivery cost already present in the m3 base. The additional binding budget is two managers × (one extra public target + session + device), including dependencies: 20 reads/season. This budget assumes at most one extra public target per manager per season; more target switches, reconnects or authority changes require additional reads. No current mutation authorization or hidden-state privacy checks are removed. The measured idle rates above are the removable unchanged-state polling budget; watcher reconnections or additional state changes must be charged separately.

Rules proposal 1 (Nik sign-off): `currentlyEntitled` at composed Rules :442 self-fetches the rivalry. For the direct rivalry GET only (:2739), use the identical `resource.data` in a dedicated helper, keeping `activeActor`, the authorizedAccountIds list/membership checks and pending-invite fallback. Do not change nested-document or write helpers. After app duplicates this saves 64.0 reads/season. Existing witnesses: `tests/firebase/completed-showdown-read-emulator.cjs` A-series completed reads, B1–B3 strangers, D3–D6 abandoned isolation, F2/F3 private-state boundaries; `tests/firebase/stage5c-zero-billing-standard-auth-session-emulator.cjs` covers active session/device authority.

Rules proposal 2 (Nik sign-off): `ssjrTransferPrivateReadable` :1558 and `ssjrResultsPrivateReadable` :1791 eagerly fetch the public phase before choosing own/opponent role. Move that lookup into the opponent branch; retain `ssjrEntitled` on own reads and retain COMPLETED/RESULTS_READY and completed-history fallback for opponents/closed games. Own missing-role reads are already allowed. Charge no saving for closed-game fallback. Saves 45.7 reads/season after app deduplication. Existing witnesses: `completed-showdown-read-emulator.cjs` F2 denies opponent COLLECTING, F3 allows own COLLECTING, A6/A7 allow final opposite results, B12 denies unknown role, D3/D4/D6 deny abandoned data; `completed-transfer-history-emulator.cjs` and `shared-transfer-challenge-fresh-session-emulator.cjs` cover completed transfer privacy and fresh session boundaries. These are existing tests to rerun on a future patch; no changed Rules were tested or approved here.

Repeated calls to the same path inside one request are already deduplicated: removing such helper calls alone saves **zero** billable reads. Never replace mutable account activation/device revocation/session state with stale auth claims. Neither Rules proposal changes which people are allowed/refused; a future implementation must pass all existing negative matrices and obtain Nik’s Rules sign-off.

## Largest contributors with 60 minutes of waiting

The non-idle top ten above remain the measured base ranking. This additional ranking applies the equal-screen 60-minute workload; idle costs are removed by the conditional polling cut, with new watcher binds charged separately. It does not add a second saving to the forecast.

| Operation/path | Owner | Requests/season forecast | Base reads | Idle reads | Total reads |
| --- | --- | --- | --- | --- | --- |
| transaction read rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedFinalReconciliation.js | 149.4 | 26.7 | 571.0 | 597.7 |
| transaction read rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js | 113.5 | 201.7 | 365.7 | 567.4 |
| transaction read rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedSeasonCommit.js | 98.4 | 21.3 | 372.4 | 393.7 |
| transaction read rivalries/{rivalry}/sessions/{session} | js/productionSharedMultiSeasonProgression.js | 73.7 | 19.3 | 348.4 | 367.7 |
| transaction read rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedMultiSeasonProgression.js | 82.3 | 50.7 | 278.6 | 329.2 |
| transaction read rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedMultiSeasonProgression.js | 73.3 | 14.7 | 278.7 | 293.4 |
| transaction read rivalries/{rivalry} | js/productionSharedMultiSeasonProgression.js | 67.0 | 16.0 | 252.1 | 268.1 |
| transaction read rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedTransferChallenge.js | 63.9 | 109.3 | 146.3 | 255.6 |
| transaction read rivalries/{rivalry}/careerStart/authoritative | js/productionSharedTransferChallenge.js | 58.9 | 102.7 | 133.0 | 235.7 |
| transaction read rivalries/{rivalry}/sharedSetup/leagueProjection | js/productionSharedSeasonResults.js | 47.6 | 44.0 | 146.3 | 190.3 |

## Complete request map

Counts include the entire gameplay slice of each run (i3 includes its timed windows here). Mixed-write commit paths retain each write/verify; duplicate masked role paths may be two concrete documents. P identifiers resolve to exact replay branches in the next table and JSON.

### m3

| Operation | Path pattern(s) | Owner | Count | Client | Rules lower | Unpriced | Proofs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js | 121 | 121 | 484 | 0 | P114,P113,P112 |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedTransferChallenge.js | 82 | 82 | 246 | 0 | P117,P119,P116,P118,P115 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedTransferChallenge.js | 77 | 77 | 231 | 0 | P075 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedTransferChallenge.js | 54 | 54 | 216 | 0 | P096 |
| transaction read | rivalries/{rivalry} | js/productionSharedTransferChallenge.js | 57 | 57 | 171 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedTransferChallenge.js | 54 | 54 | 162 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedSeasonResults.js | 32 | 32 | 128 | 0 | P088,P087,P085 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedMultiSeasonProgression.js | 38 | 38 | 114 | 0 | P083,P082 |
| transaction read | rivalries/{rivalry}/sharedSetup/leagueProjection | js/productionSharedSeasonResults.js | 33 | 33 | 99 | 0 | P108,P107 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedSeasonResults.js | 29 | 29 | 87 | 0 | P090,P089,P092 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedSeasonResults.js | 22 | 22 | 88 | 0 | P096 |
| listen | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedTransferChallenge.js | 25 | 26 | 75 | 0 | P117,P119,P116,P118,P115 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedJourneyConflicts.js | 20 | 20 | 80 | 0 | P087,P085 |
| listen | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownPresentation.js | 30 | 10 | 90 | 0 | P101,P100,P103,P106 |
| transaction commit | rivalries/{rivalry}/transferChallenges/season_{n} + rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative | js/productionSharedTransferChallenge.js | 12 | 0 | 96 | 0 | P043,P046,P052,P049,P044,P047,P053,P050,P045,P048,P054,P051 |
| transaction read | rivalries/{rivalry} | js/productionSharedSeasonResults.js | 23 | 23 | 69 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyConflicts.js | 18 | 18 | 72 | 0 | P096 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/sparkSharedMultiSeasonProgression.js | 18 | 18 | 72 | 0 | P087,P085 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedSeasonResults.js | 21 | 21 | 63 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedFinalReconciliation.js | 20 | 20 | 60 | 0 | P083,P079 |
| transaction read | rivalries/{rivalry} | js/productionSharedJourneyConflicts.js | 18 | 18 | 54 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedJourneyConflicts.js | 18 | 18 | 54 | 0 | P102,P104,P101,P100,P103,P106 |
| transaction commit | rivalries/{rivalry}/transferChallenges/season_{n} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js | 9 | 0 | 69 | 0 | P061,P058,P055,P062,P059,P056,P063,P060,P057 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedSeasonCommit.js | 16 | 16 | 48 | 0 | P083,P082,P081 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedJourneyEntry.js | 16 | 16 | 48 | 0 | P081,P083 |
| transaction commit | rivalries/{rivalry}/seasonCommits/season_{n} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/seasonResults/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedJourneyConflicts.js | 9 | 0 | 63 | 0 | P015,P016,P012,P017,P018,P013,P019,P020,P014 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedMultiSeasonProgression.js | 12 | 11 | 47 | 0 | P096,P095 |
| transaction read | rivalries/{rivalry} | js/productionSharedTerminalClose.js | 13 | 13 | 39 | 0 | P120,P121 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedCareerStart.js | 13 | 13 | 39 | 0 | P076,P077,P075 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedSeasonResults.js | 13 | 13 | 39 | 0 | P075 |
| transaction commit | rivalries/{rivalry}/seasonResults/season_{n} + rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/sharedSetup/leagueProjection + verify rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedSeasonResults.js | 7 | 0 | 51 | 1 | P021,P025,P022,P026,P023,P027 |
| transaction read | rivalries/{rivalry} | js/productionSharedMultiSeasonProgression.js | 12 | 12 | 36 | 0 | P120,P121 |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedSeasonResults.js | 12 | 12 | 36 | 0 | P115 |
| get | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/careerScreensV10.js | 12 | 12 | 36 | 0 | P086,P084 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkRemoteJoining.js | 9 | 9 | 36 | 0 | P098,P099,P096 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedMultiSeasonProgression.js | 11 | 11 | 33 | 0 | P106 |
| transaction read | rivalries/{rivalry} | js/onlinePlayerIdentity.js | 10 | 10 | 30 | 0 | P120,P121 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedShowdownPresentation.js | 8 | 8 | 32 | 0 | P096 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedJourneyConflicts.js | 10 | 10 | 30 | 0 | P092 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedJourneyConflicts.js | 10 | 10 | 30 | 0 | P083,P082 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedSeasonCommit.js | 8 | 8 | 32 | 0 | P096 |
| get | rivalries/{rivalry} | js/careerScreensV10.js | 10 | 10 | 30 | 0 | P120,P121 |
| transaction commit | rivalries/{rivalry}/sharedSetup/authoritative + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyConflicts.js | 7 | 0 | 36 | 1 | P039,P033,P032,P034,P035,P038 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/sparkSharedMultiSeasonProgression.js | 9 | 9 | 27 | 0 | P092 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedShowdownSetup.js | 7 | 7 | 28 | 0 | P096 |
| transaction read | rivalries/{rivalry} | js/productionSharedShowdownPresentation.js | 8 | 8 | 24 | 0 | P120 |
| transaction read | rivalries/{rivalry} | js/productionSharedSeasonCommit.js | 8 | 8 | 24 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedSeasonCommit.js | 8 | 8 | 24 | 0 | P106 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedJourneyEntry.js | 8 | 8 | 24 | 0 | P106 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedCareerStart.js | 6 | 6 | 24 | 0 | P096 |
| listen | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedSeasonCommit.js | 6 | 12 | 18 | 0 | P082,P081 |
| transaction read | rivalries/{rivalry}/sessionOffers/current | js/sparkRemoteJoining.js | 7 | 7 | 21 | 0 | P094,P093 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedCareerStart.js | 7 | 7 | 21 | 0 | P101,P106 |
| transaction read | rivalries/{rivalry} | js/productionSharedCareerStart.js | 6 | 6 | 18 | 0 | P120 |
| listen | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedSeasonResults.js | 6 | 6 | 18 | 0 | P089,P092 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedTransferChallenge.js | 22 | 22 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/productionSharedTransferChallenge.js | 21 | 21 | 0 | 0 | P073 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownSetup.js | 5 | 5 | 15 | 0 | P102,P106 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkSharedMultiSeasonProgression.js | 4 | 4 | 16 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyEntry.js | 4 | 4 | 16 | 0 | P096 |
| transaction read | rivalries/{rivalry}/state/authoritative/idempotency/{id} | js/productionSharedLocalReconciliation.js | 5 | 5 | 15 | 0 | P109 |
| transaction commit | rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 3 | 0 | 20 | 0 | P007,P008,P009 |
| transaction read | accounts/{uid}/pairLinks/current | js/persistentNikDanielPair.js | 18 | 18 | 0 | 0 | P071,P070,P069 |
| transaction read | accounts/{uid} | js/productionSharedJourneyConflicts.js | 18 | 18 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedJourneyConflicts.js | 18 | 18 | 0 | 0 | P067 |
| transaction read | rivalries/{rivalry}/state/authoritative | js/productionSharedLocalReconciliation.js | 6 | 6 | 12 | 0 | P111,P110 |
| get | rivalries/{rivalry}/seasonResults/season_{n} | js/careerScreensV10.js | 6 | 6 | 12 | 0 | P091 |
| get | rivalries/{rivalry}/seasonCommits/season_{n} | js/careerScreensV10.js | 6 | 6 | 12 | 0 | P080 |
| transaction read | rivalries/{rivalry} | js/persistentNikDanielPair.js | 4 | 4 | 12 | 0 | P122,P120 |
| transaction read | rivalries/{rivalry} | js/sparkRemoteJoining.js | 4 | 4 | 12 | 0 | P120 |
| transaction read | rivalries/{rivalry} | js/productionSharedShowdownSetup.js | 4 | 4 | 12 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/sparkSharedMultiSeasonProgression.js | 4 | 4 | 12 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 4 | 4 | 12 | 0 | P081 |
| get | rivalries/{rivalry} | js/rivalryLegacyV10.js | 4 | 4 | 12 | 0 | P120 |
| transaction commit | accounts/{uid}/pairLinks/current + accounts/{uid}/careerIndex/{id} + rivalries/{rivalry} + rivalries/{rivalry}/invites/{invite} + verify accounts/{uid}/devices/{device} | js/persistentNikDanielPair.js | 2 | 0 | 13 | 0 | P004,P003 |
| transaction commit | rivalries/{rivalry}/careerStart/authoritative + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedCareerStart.js | 2 | 0 | 13 | 0 | P011,P010 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownPresentation.js | 3 | 3 | 9 | 0 | P104,P101 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedHistoryConvergence.js | 3 | 3 | 9 | 0 | P081 |
| transaction read | rivalries/{rivalry} | js/sparkSharedHistoryConvergence.js | 3 | 3 | 9 | 0 | P120 |
| transaction read | rivalries/{rivalry} | js/sparkSharedMultiSeasonProgression.js | 3 | 3 | 9 | 0 | P120 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/sparkSharedMultiSeasonProgression.js | 3 | 3 | 9 | 0 | P081 |
| transaction read | rivalries/{rivalry} | js/productionSharedLocalReconciliation.js | 3 | 3 | 9 | 0 | P120 |
| get | accounts/{uid}/careerIndex/{id} | js/careerScreensV10.js | 12 | 12 | 0 | 0 | P065,P064 |
| transaction commit | rivalries/{rivalry}/sessions/{session} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} | js/sparkRemoteJoining.js | 2 | 0 | 10 | 0 | P031,P029 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkSharedHistoryConvergence.js | 2 | 2 | 8 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedTerminalClose.js | 2 | 2 | 8 | 0 | P096 |
| transaction read | accounts/{uid} | js/productionSharedSeasonResults.js | 9 | 9 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedSeasonResults.js | 9 | 9 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/sparkAccountBootstrap.js | 8 | 8 | 0 | 0 | P074,P073,P072 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/sparkSharedHistoryConvergence.js | 2 | 2 | 6 | 0 | P106 |
| transaction read | accounts/{uid} | js/productionSharedTerminalClose.js | 7 | 7 | 0 | 0 | P073 |
| transaction commit | rivalries/{rivalry}/sharedSetup/leagueProjection + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/transferChallenges/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedSeasonResults.js | 1 | 0 | 7 | 0 | P040 |
| transaction commit | rivalries/{rivalry}/state/authoritative + rivalries/{rivalry}/state/authoritative/idempotency/{id} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} | js/productionSharedLocalReconciliation.js | 2 | 0 | 7 | 1 | P041 |
| transaction read | accounts/{uid}/devices/{device} | js/showdown.js | 6 | 6 | 0 | 0 | P067,P066 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedTerminalClose.js | 6 | 6 | 0 | 0 | P067 |
| transaction commit | rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 1 | 0 | 6 | 0 | P005 |
| get | accounts/{uid}/careerIndex/{id} | js/rivalryLegacyV10.js | 6 | 6 | 0 | 0 | P065,P064 |
| get | rivalries/{rivalry}/sharedSetup/authoritative | js/careerScreensV10.js | 2 | 2 | 4 | 0 | P105 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedCareerStart.js | 5 | 5 | 0 | 0 | P067 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedHistoryConvergence.js | 1 | 1 | 4 | 0 | P096 |
| transaction read | accounts/{uid}/devices/{device} | js/onlinePlayerIdentity.js | 4 | 4 | 0 | 0 | P068 |
| transaction read | accounts/{uid}/devices/{device} | js/persistentNikDanielPair.js | 4 | 4 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/careerIndex/{id} | js/persistentNikDanielPair.js | 4 | 4 | 0 | 0 | P065 |
| transaction read | rivalries/{rivalry}/invites/{invite} | js/persistentNikDanielPair.js | 2 | 2 | 2 | 0 | P078 |
| transaction commit | rivalries/{rivalry}/sessionOffers/current | js/sparkRemoteJoining.js | 1 | 0 | 4 | 0 | P028 |
| transaction read | rivalries/{rivalry} | js/productionSharedJourneyEntry.js | 1 | 1 | 3 | 0 | P120 |
| transaction read | rivalries/{rivalry} | js/productionSharedHistoryConvergence.js | 1 | 1 | 3 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedHistoryConvergence.js | 1 | 1 | 3 | 0 | P106 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedTerminalClose.js | 1 | 1 | 3 | 0 | P106 |
| transaction commit | rivalries/{rivalry}/sessions/{session} + rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} | js/productionSharedTerminalClose.js | 1 | 0 | 4 | 0 | P030 |
| transaction read | accounts/{uid} | js/sparkRemoteJoining.js | 3 | 3 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/productionSharedCareerStart.js | 3 | 3 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedSeasonCommit.js | 3 | 3 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/sparkSharedMultiSeasonProgression.js | 3 | 3 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedLocalReconciliation.js | 3 | 3 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/sparkConnectedAccount.js | 2 | 2 | 0 | 0 | P074 |
| transaction commit | accounts/{uid}/devices/{device} | js/onlinePlayerIdentity.js | 2 | 0 | 2 | 0 | P002 |
| transaction read | accounts/{uid}/devices/{device} | js/sparkRemoteJoining.js | 2 | 2 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/sparkSharedCareerStart.js | 2 | 2 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedTransferChallenge.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedShowdownSetup.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedJourneyEntry.js | 1 | 1 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/productionSharedMultiSeasonProgression.js | 1 | 1 | 0 | 0 | P072 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedMultiSeasonProgression.js | 1 | 1 | 0 | 0 | P066 |
| transaction commit | accounts/{uid} | js/sparkAccountBootstrap.js | 2 | 0 | 0 | 0 | P001 |

### i3

| Operation | Path pattern(s) | Owner | Count | Client | Rules lower | Unpriced | Proofs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js | 195 | 195 | 780 | 0 | P114,P113,P112 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedFinalReconciliation.js | 134 | 134 | 402 | 0 | P083,P082,P081 |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedTransferChallenge.js | 129 | 129 | 387 | 0 | P117,P119,P116,P118,P115 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedTransferChallenge.js | 126 | 126 | 378 | 0 | P075 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedMultiSeasonProgression.js | 107 | 107 | 321 | 0 | P083 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedTransferChallenge.js | 83 | 83 | 332 | 0 | P096 |
| transaction read | rivalries/{rivalry} | js/productionSharedTransferChallenge.js | 93 | 93 | 279 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedMultiSeasonProgression.js | 69 | 69 | 276 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedTransferChallenge.js | 82 | 82 | 246 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedSeasonCommit.js | 75 | 75 | 225 | 0 | P083,P082,P081 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedMultiSeasonProgression.js | 70 | 70 | 210 | 0 | P106 |
| transaction read | rivalries/{rivalry}/sharedSetup/leagueProjection | js/productionSharedSeasonResults.js | 64 | 64 | 192 | 0 | P108,P107 |
| transaction read | rivalries/{rivalry} | js/productionSharedMultiSeasonProgression.js | 60 | 60 | 180 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedSeasonResults.js | 47 | 47 | 188 | 0 | P096 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedSeasonResults.js | 43 | 43 | 172 | 0 | P088,P087,P085 |
| transaction read | rivalries/{rivalry} | js/productionSharedSeasonResults.js | 48 | 48 | 144 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedSeasonResults.js | 44 | 44 | 132 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedSeasonResults.js | 37 | 37 | 111 | 0 | P090,P089,P092 |
| listen | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedTransferChallenge.js | 37 | 26 | 111 | 0 | P117,P119,P116,P118,P115 |
| transaction read | rivalries/{rivalry} | js/productionSharedTerminalClose.js | 33 | 33 | 99 | 0 | P120,P121 |
| transaction read | rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedSeasonResults.js | 29 | 29 | 87 | 0 | P115 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedSeasonCommit.js | 23 | 23 | 92 | 0 | P096 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedSeasonResults.js | 27 | 27 | 81 | 0 | P075 |
| transaction read | rivalries/{rivalry} | js/productionSharedSeasonCommit.js | 26 | 26 | 78 | 0 | P120 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/sparkSharedMultiSeasonProgression.js | 22 | 22 | 82 | 0 | P087,P085,P084,P086 |
| listen | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedSeasonCommit.js | 28 | 20 | 84 | 0 | P083,P082,P081 |
| transaction commit | rivalries/{rivalry}/transferChallenges/season_{n} + rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative | js/productionSharedTransferChallenge.js | 12 | 0 | 96 | 0 | P043,P046,P052,P049,P044,P047,P053,P050,P045,P048,P054,P051 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedJourneyConflicts.js | 18 | 18 | 72 | 0 | P087,P085 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyConflicts.js | 17 | 17 | 68 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedSeasonCommit.js | 21 | 21 | 63 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedJourneyEntry.js | 19 | 19 | 57 | 0 | P081,P083 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkSharedMultiSeasonProgression.js | 14 | 14 | 56 | 0 | P096 |
| transaction commit | rivalries/{rivalry}/transferChallenges/season_{n} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} | js/productionSharedTransferChallenge.js | 9 | 0 | 69 | 0 | P061,P058,P055,P062,P059,P056,P063,P060,P057 |
| transaction read | rivalries/{rivalry} | js/productionSharedJourneyConflicts.js | 17 | 17 | 51 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedJourneyConflicts.js | 17 | 17 | 51 | 0 | P102,P104,P101,P100,P103,P106 |
| transaction commit | rivalries/{rivalry}/seasonCommits/season_{n} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/seasonResults/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedJourneyConflicts.js | 9 | 0 | 63 | 0 | P015,P016,P012,P017,P018,P013,P019,P020,P014 |
| transaction read | rivalries/{rivalry} | js/sparkSharedMultiSeasonProgression.js | 13 | 13 | 39 | 0 | P120 |
| transaction commit | rivalries/{rivalry}/seasonResults/season_{n} + rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/sharedSetup/leagueProjection + verify rivalries/{rivalry}/transferChallenges/season_{n} | js/productionSharedSeasonResults.js | 7 | 0 | 51 | 1 | P021,P025,P022,P026,P023,P027 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkRemoteJoining.js | 10 | 10 | 40 | 0 | P098,P099,P096 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedShowdownPresentation.js | 10 | 10 | 40 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkPrivatePairing.js | 10 | 10 | 40 | 0 | P096 |
| transaction read | rivalries/{rivalry} | js/productionSharedShowdownPresentation.js | 12 | 12 | 36 | 0 | P120 |
| transaction read | rivalries/{rivalry}/careerStart/authoritative | js/productionSharedCareerStart.js | 12 | 12 | 36 | 0 | P076,P077,P075 |
| transaction read | rivalries/{rivalry} | js/sparkSharedHistoryConvergence.js | 12 | 12 | 36 | 0 | P120 |
| get | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/careerScreensV10.js | 12 | 12 | 36 | 0 | P086,P084 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedShowdownSetup.js | 9 | 9 | 36 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/sparkSharedMultiSeasonProgression.js | 11 | 11 | 33 | 0 | P106 |
| transaction commit | rivalries/{rivalry}/sharedSetup/authoritative + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyConflicts.js | 7 | 0 | 42 | 0 | P039,P033,P032,P034,P035,P036,P038 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/sparkSharedMultiSeasonProgression.js | 11 | 11 | 30 | 0 | P092,P091 |
| transaction read | rivalries/{rivalry} | js/onlinePlayerIdentity.js | 10 | 10 | 30 | 0 | P120,P121 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownSetup.js | 9 | 9 | 27 | 0 | P102,P106 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/sparkPrivatePairing.js | 9 | 9 | 27 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedJourneyConflicts.js | 9 | 9 | 27 | 0 | P092 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedJourneyConflicts.js | 9 | 9 | 27 | 0 | P083,P082 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/sparkSharedHistoryConvergence.js | 7 | 7 | 28 | 0 | P096 |
| listen | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownPresentation.js | 7 | 12 | 21 | 0 | P104,P101,P100,P103,P106 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedJourneyEntry.js | 8 | 8 | 24 | 0 | P106 |
| get | rivalries/{rivalry} | js/careerScreensV10.js | 8 | 8 | 24 | 0 | P120,P121 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedTransferChallenge.js | 30 | 30 | 0 | 0 | P067 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedJourneyEntry.js | 6 | 6 | 24 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sessionOffers/current | js/sparkRemoteJoining.js | 7 | 7 | 21 | 0 | P094,P093 |
| transaction read | rivalries/{rivalry} | js/productionSharedShowdownSetup.js | 7 | 7 | 21 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedCareerStart.js | 5 | 5 | 20 | 0 | P096 |
| listen | rivalries/{rivalry}/seasonResults/season_{n} | js/productionSharedSeasonResults.js | 6 | 6 | 18 | 0 | P089,P092 |
| transaction read | accounts/{uid}/pairLinks/current | js/persistentNikDanielPair.js | 23 | 23 | 0 | 0 | P071,P070,P069 |
| transaction read | accounts/{uid} | js/productionSharedTransferChallenge.js | 23 | 23 | 0 | 0 | P073 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/sparkSharedHistoryConvergence.js | 6 | 6 | 17 | 0 | P106,P105 |
| transaction read | rivalries/{rivalry} | js/persistentNikDanielPair.js | 5 | 5 | 15 | 0 | P122,P120 |
| transaction read | rivalries/{rivalry} | js/sparkRemoteJoining.js | 5 | 5 | 15 | 0 | P120 |
| transaction read | rivalries/{rivalry} | js/productionSharedCareerStart.js | 5 | 5 | 15 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedCareerStart.js | 5 | 5 | 15 | 0 | P106 |
| get | rivalries/{rivalry}/seasonResults/season_{n} | js/careerScreensV10.js | 6 | 6 | 12 | 0 | P091 |
| get | rivalries/{rivalry}/seasonCommits/season_{n} | js/careerScreensV10.js | 6 | 6 | 12 | 0 | P080 |
| transaction read | accounts/{uid} | js/productionSharedJourneyConflicts.js | 16 | 16 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedJourneyConflicts.js | 16 | 16 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedSeasonResults.js | 16 | 16 | 0 | 0 | P067 |
| transaction read | rivalries/{rivalry} | js/sparkPrivatePairing.js | 4 | 4 | 12 | 0 | P120 |
| transaction read | rivalries/{rivalry}/state/authoritative/idempotency/{id} | js/productionSharedLocalReconciliation.js | 4 | 4 | 12 | 0 | P109 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 4 | 4 | 12 | 0 | P081 |
| get | rivalries/{rivalry} | js/rivalryLegacyV10.js | 4 | 4 | 12 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedHistoryConvergence.js | 3 | 3 | 12 | 0 | P096 |
| transaction read | rivalries/{rivalry}/state/authoritative | js/productionSharedLocalReconciliation.js | 5 | 5 | 10 | 0 | P111,P110 |
| transaction commit | rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 2 | 0 | 14 | 0 | P007,P009 |
| transaction commit | accounts/{uid}/pairLinks/current + accounts/{uid}/careerIndex/{id} + rivalries/{rivalry} + rivalries/{rivalry}/invites/{invite} + verify accounts/{uid}/devices/{device} | js/persistentNikDanielPair.js | 2 | 0 | 13 | 0 | P004,P003 |
| transaction commit | rivalries/{rivalry}/careerStart/authoritative + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedCareerStart.js | 2 | 0 | 13 | 0 | P011,P010 |
| transaction read | accounts/{uid} | js/productionSharedSeasonResults.js | 13 | 13 | 0 | 0 | P073 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedShowdownPresentation.js | 3 | 3 | 9 | 0 | P102,P104 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedHistoryConvergence.js | 3 | 3 | 9 | 0 | P081 |
| transaction read | rivalries/{rivalry} | js/productionSharedJourneyEntry.js | 3 | 3 | 9 | 0 | P120 |
| get | accounts/{uid}/careerIndex/{id} | js/careerScreensV10.js | 12 | 12 | 0 | 0 | P065,P064 |
| transaction commit | rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/seasonCommits/season_{n} | js/productionSharedTerminalClose.js | 2 | 0 | 11 | 0 | P005,P006 |
| transaction commit | rivalries/{rivalry}/sessions/{session} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} | js/sparkRemoteJoining.js | 2 | 0 | 10 | 0 | P031,P029 |
| transaction read | accounts/{uid} | js/sparkAccountBootstrap.js | 8 | 8 | 0 | 0 | P074,P073,P072 |
| transaction read | rivalries/{rivalry} | js/productionSharedFinalReconciliation.js | 2 | 2 | 6 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedHistoryConvergence.js | 2 | 2 | 6 | 0 | P106 |
| transaction read | rivalries/{rivalry}/seasonCommits/season_{n} | js/sparkSharedMultiSeasonProgression.js | 2 | 2 | 6 | 0 | P081 |
| transaction read | accounts/{uid} | js/productionSharedTerminalClose.js | 8 | 8 | 0 | 0 | P073 |
| transaction read | rivalries/{rivalry} | js/productionSharedLocalReconciliation.js | 2 | 2 | 6 | 0 | P120 |
| transaction read | rivalries/{rivalry}/sharedSetup/authoritative | js/productionSharedTerminalClose.js | 2 | 2 | 6 | 0 | P106 |
| transaction read | accounts/{uid} | js/sparkSharedTransferChallenge.js | 7 | 7 | 0 | 0 | P073 |
| transaction commit | rivalries/{rivalry}/sharedSetup/leagueProjection + verify accounts/{uid} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} + verify rivalries/{rivalry}/sessions/{session} + verify rivalries/{rivalry}/sharedSetup/authoritative + verify rivalries/{rivalry}/careerStart/authoritative + verify rivalries/{rivalry}/transferChallenges/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n} + verify rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} | js/productionSharedSeasonResults.js | 1 | 0 | 7 | 0 | P040 |
| transaction commit | rivalries/{rivalry}/state/authoritative + rivalries/{rivalry}/state/authoritative/idempotency/{id} + verify accounts/{uid}/devices/{device} + verify rivalries/{rivalry} | js/productionSharedLocalReconciliation.js | 1 | 0 | 7 | 0 | P041 |
| transaction read | accounts/{uid} | js/productionSharedMultiSeasonProgression.js | 6 | 6 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedMultiSeasonProgression.js | 6 | 6 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/devices/{device} | js/showdown.js | 6 | 6 | 0 | 0 | P067,P066 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedTerminalClose.js | 6 | 6 | 0 | 0 | P067 |
| get | accounts/{uid}/careerIndex/{id} | js/rivalryLegacyV10.js | 6 | 6 | 0 | 0 | P065,P064 |
| get | rivalries/{rivalry}/sharedSetup/authoritative | js/careerScreensV10.js | 2 | 2 | 4 | 0 | P105 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedFinalReconciliation.js | 1 | 1 | 4 | 0 | P096 |
| transaction read | rivalries/{rivalry}/sessions/{session} | js/productionSharedTerminalClose.js | 1 | 1 | 4 | 0 | P096 |
| transaction read | accounts/{uid}/devices/{device} | js/onlinePlayerIdentity.js | 4 | 4 | 0 | 0 | P068 |
| transaction read | accounts/{uid}/devices/{device} | js/persistentNikDanielPair.js | 4 | 4 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/careerIndex/{id} | js/persistentNikDanielPair.js | 4 | 4 | 0 | 0 | P065 |
| transaction read | rivalries/{rivalry}/invites/{invite} | js/persistentNikDanielPair.js | 2 | 2 | 2 | 0 | P078 |
| transaction read | accounts/{uid} | js/sparkRemoteJoining.js | 4 | 4 | 0 | 0 | P073 |
| transaction commit | rivalries/{rivalry}/sessionOffers/current | js/sparkRemoteJoining.js | 1 | 0 | 4 | 0 | P028 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedCareerStart.js | 4 | 4 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/productionSharedSeasonCommit.js | 4 | 4 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/sparkPrivatePairing.js | 4 | 4 | 0 | 0 | P067 |
| transaction commit | rivalries/{rivalry}/sessions/{session} + rivalries/{rivalry} + verify accounts/{uid} + verify accounts/{uid}/devices/{device} | js/productionSharedTerminalClose.js | 1 | 0 | 4 | 0 | P030 |
| transaction read | accounts/{uid}/devices/{device} | js/sparkRemoteJoining.js | 3 | 3 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/productionSharedCareerStart.js | 3 | 3 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedSeasonResults.js | 3 | 3 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkConnectedAccount.js | 2 | 2 | 0 | 0 | P074 |
| transaction commit | accounts/{uid}/devices/{device} | js/onlinePlayerIdentity.js | 2 | 0 | 2 | 0 | P002 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedJourneyEntry.js | 2 | 2 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedSeasonCommit.js | 2 | 2 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/sparkSharedShowdownSetup.js | 2 | 2 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/sparkSharedMultiSeasonProgression.js | 2 | 2 | 0 | 0 | P067 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedLocalReconciliation.js | 2 | 2 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/productionSharedShowdownPresentation.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid}/devices/{device} | js/productionSharedShowdownPresentation.js | 1 | 1 | 0 | 0 | P067 |
| transaction read | accounts/{uid} | js/sparkPrivateSession.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedMultiSeasonProgression.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedCareerStart.js | 1 | 1 | 0 | 0 | P073 |
| transaction read | accounts/{uid} | js/sparkSharedSeasonCommit.js | 1 | 1 | 0 | 0 | P073 |
| transaction commit | accounts/{uid} | js/sparkAccountBootstrap.js | 2 | 0 | 0 | 0 | P001 |

## N-times lookup checks

Each row uses N=3 isolated repetitions and reports the aggregate coverage delta across those repetitions. Defined evaluations can still exceed distinct paths because helper calls repeat. Exact path multiplicities and operation/site/path associations are in [the summary JSON](R76_RULES_COST.summary.json). All Rules line references identify the SHA-bound composed `firestore.spark.generated.rules`, not the stale workspace generated Rules.

| Proof | Request signature | Original → replay | Distinct docs | Eval delta / defined | Rules sites |
| --- | --- | --- | --- | --- | --- |
| P001 | commit / update:accounts/{uid}:0 / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P002 | commit / update:accounts/{uid}/devices/{device}:active:0 / 200 / live | 200 → 200,200,200 | 1 | 12 / 6 | get:75:21 |
| P003 | commit / update:accounts/{uid}/pairLinks/current:0+update:accounts/{uid}/careerIndex/{id}:0+update:rivalries/{rivalry}:active:1+update:rivalries/{rivalry}/invites/{invite}:redeemed:1+verify:accounts/{uid}/devices/{device} / 200 / live | 200 → 200,200,200 | 8 | 252 / 126 | get:75:21,get:87:20,get:348:26,getAfter:349:25,getAfter:390:26,get:2181:19,get:2182:20,get:2201:20,getAfter:2323:21,getAfter:2360:22,getAfter:2517:19,exists:2518:15,get:2525:20,getAfter:2526:19,get:2532:25,getAfter:2536:18,exists:2548:13 |
| P004 | commit / update:accounts/{uid}/pairLinks/current:0+update:accounts/{uid}/careerIndex/{id}:0+update:rivalries/{rivalry}:pending-pair:0+update:rivalries/{rivalry}/invites/{invite}:open:0+verify:accounts/{uid}/devices/{device} / 200 / live | 200 → 200,200,200 | 5 | 252 / 102 | get:75:21,get:87:20,getAfter:286:25,getAfter:318:26,get:348:26,getAfter:349:25,getAfter:2323:21,getAfter:2349:18,getAfter:2360:22,getAfter:2517:19,exists:2518:15,get:2525:20,getAfter:2526:19,get:2532:25,getAfter:2536:18,exists:2548:13 |
| P005 | commit / update:rivalries/{rivalry}:active:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonCommits/season_{n} / 200 / live | 200 → 200,200,200 | 6 | 156 / 60 | get:75:21,get:87:20,get:450:21,get:2181:19,get:2182:20,get:2201:20,get:2629:18,get:2659:19 |
| P006 | commit / update:rivalries/{rivalry}:active:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonCommits/season_{n} / 403 / live | 403 → 403,403,403 | 5 | 96 / 0 | get:75:21,get:87:20,get:450:21,get:2181:19,get:2182:20,get:2201:20,get:2629:18,get:2659:19 |
| P007 | commit / update:rivalries/{rivalry}:active:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}/seasonCommits/season_{n} / 200 / live | 200 → 200,200,200 | 7 | 102 / 36 | get:75:21,get:87:20,get:450:21,get:2181:19,get:2182:20,get:2201:20,get:2629:18,get:2659:19 |
| P008 | commit / update:rivalries/{rivalry}:active:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}/seasonCommits/season_{n} / 403 / live | 403 → 403,403,403 | 6 | 84 / 18 | get:75:21,get:87:20,get:450:21,get:2181:19,get:2182:20,get:2201:20,get:2629:18,get:2659:19 |
| P009 | commit / update:rivalries/{rivalry}:active:4+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}/seasonCommits/season_{n} / 200 / live | 200 → 200,200,200 | 7 | 102 / 36 | get:75:21,get:87:20,get:450:21,get:2181:19,get:2182:20,get:2201:20,get:2629:18,get:2659:19 |
| P010 | commit / update:rivalries/{rivalry}/careerStart/authoritative:CAREER_START_READY:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative / 200 / live | 200 → 200,200,200 | 6 | 216 / 96 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2629:18,get:2687:20 |
| P011 | commit / update:rivalries/{rivalry}/careerStart/authoritative:ONE_MANAGER_ACKNOWLEDGED:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative / 200 / live | 200 → 200,200,200 | 7 | 240 / 108 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:1140:50,get:2629:18,get:2687:20 |
| P012 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:ACKNOWLEDGED:1:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P013 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:ACKNOWLEDGED:2:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P014 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:ACKNOWLEDGED:3:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P015 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:1:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 450 / 186 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:1810:14,get:1813:14,get:1816:14,get:2629:18,get:2659:19,get:2687:20 |
| P016 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:1:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P017 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:2:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 450 / 186 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:1810:14,get:1813:14,get:1816:14,get:2629:18,get:2659:19,get:2687:20 |
| P018 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:2:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P019 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:3:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 450 / 186 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:1810:14,get:1813:14,get:1816:14,get:2629:18,get:2659:19,get:2687:20 |
| P020 | commit / update:rivalries/{rivalry}/seasonCommits/season_{n}:COMMITTED:3:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 6 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P021 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:COLLECTING:1:1+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 9 | 462 / 210 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P022 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:COLLECTING:2:1+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 9 | 462 / 210 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P023 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:COLLECTING:3:1+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 9 | 462 / 210 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P024 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:COLLECTING:3:1+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 409 / live | 409 → 400,400,400 MISMATCH; excluded | 9 | 462 / 210 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P025 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:RESULTS_READY:1:2+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 8 | 366 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P026 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:RESULTS_READY:2:2+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 8 | 366 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P027 | commit / update:rivalries/{rivalry}/seasonResults/season_{n}:RESULTS_READY:3:2+update:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:rivalries/{rivalry}/transferChallenges/season_{n} / 200 / live | 200 → 200,200,200 | 8 | 366 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,getAfter:1577:64,getAfter:1701:14,getAfter:1774:20,get:2629:18,get:2659:19,get:2687:20 |
| P028 | commit / update:rivalries/{rivalry}/sessionOffers/current / 200 / live | 200 → 200,200,200 | 4 | 126 / 42 | get:75:21,get:443:21,get:450:21,get:875:21 |
| P029 | commit / update:rivalries/{rivalry}/sessions/{session}:active:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry} / 200 / live | 200 → 200,200,200 | 5 | 144 / 66 | get:75:21,get:87:20,get:443:21,get:450:21,get:702:21,getAfter:2245:25,get:2253:26,getAfter:2254:25,get:2687:20 |
| P030 | commit / update:rivalries/{rivalry}/sessions/{session}:closed:2+update:rivalries/{rivalry}:closed:5+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device} / 200 / live | 200 → 200,200,200 | 4 | 108 / 36 | get:75:21,get:87:20,get:450:21,getAfter:2245:25,get:2253:26,getAfter:2254:25,getAfter:2281:26 |
| P031 | commit / update:rivalries/{rivalry}/sessions/{session}:open:0+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry} / 200 / live | 200 → 200,200,200 | 5 | 96 / 42 | get:75:21,get:87:20,get:443:21,get:450:21,get:2687:20 |
| P032 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:commit-clubs:CLUB_ASSIGNMENTS_COMMITTED:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 168 / 78 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P033 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:commit-league:LEAGUE_WHEEL_COMMITTED:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 168 / 78 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P034 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:commit-length:SEASON_LENGTH_COMMITTED:4+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 168 / 78 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P035 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:confirm:SEASON_LENGTH_COMMITTED:5+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 168 / 78 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P036 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:confirm:SEASON_LENGTH_COMMITTED:5+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 403 / live | 403 → 403,403,403 | 6 | 132 / 42 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P037 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:confirm:SEASON_LENGTH_COMMITTED:5+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 409 / live | 409 → 403,403,403 MISMATCH; excluded | 6 | 150 / 60 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P038 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:confirm:SHOWDOWN_CONFIRMED:6+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 168 / 78 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:2687:20 |
| P039 | commit / update:rivalries/{rivalry}/sharedSetup/authoritative:open:SHARED_SETUP_OPEN:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session} / 200 / live | 200 → 200,200,200 | 6 | 180 / 84 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:969:14,get:2687:20 |
| P040 | commit / update:rivalries/{rivalry}/sharedSetup/leagueProjection+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}+verify:rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 402 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:990:21,get:1023:19,get:1792:20,get:2629:18,get:2659:19,get:2687:20 |
| P041 | commit / update:rivalries/{rivalry}/state/authoritative:0+update:rivalries/{rivalry}/state/authoritative/idempotency/{id}:0+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry} / 200 / live | 200 → 200,200,200 | 7 | 156 / 72 | get:75:21,get:87:20,get:99:20,get:443:21,get:450:21,get:486:21,getAfter:521:21,exists:522:15,getAfter:601:19,get:2687:20 |
| P042 | commit / update:rivalries/{rivalry}/state/authoritative:0+update:rivalries/{rivalry}/state/authoritative/idempotency/{id}:0+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry} / 409 / live | 409 → 400,400,400 MISMATCH; excluded | 7 | 156 / 72 | get:75:21,get:87:20,get:99:20,get:443:21,get:450:21,get:486:21,getAfter:521:21,exists:522:15,getAfter:601:19,get:2687:20 |
| P043 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:GUESS_ENTRY:1:4+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P044 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:GUESS_ENTRY:2:4+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P045 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:GUESS_ENTRY:3:4+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P046 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:SIGNING_ENTRY:1:5+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P047 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:SIGNING_ENTRY:2:5+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P048 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-guesses:SIGNING_ENTRY:3:5+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P049 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:COMPLETED:1:7+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P050 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:COMPLETED:2:7+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P051 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:COMPLETED:3:7+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P052 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:SIGNING_ENTRY:1:6+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P053 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:SIGNING_ENTRY:2:6+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P054 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:lock-signings:SIGNING_ENTRY:3:6+update:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role}:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative / 200 / live | 200 → 200,200,200 | 8 | 384 / 180 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,getAfter:1508:14,get:2629:18,get:2687:20 |
| P055 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:GUESS_ENTRY:1:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P056 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:GUESS_ENTRY:2:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P057 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:GUESS_ENTRY:3:3+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P058 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:WINDOW_OPEN:1:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P059 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:WINDOW_OPEN:2:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P060 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:request-end-window:WINDOW_OPEN:3:2+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 7 | 366 / 150 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,getAfter:1340:14,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P061 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:start-window:WINDOW_OPEN:1:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 372 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:1255:52,get:1256:53,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P062 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:start-window:WINDOW_OPEN:2:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 372 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:1255:52,get:1256:53,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P063 | commit / update:rivalries/{rivalry}/transferChallenges/season_{n}:start-window:WINDOW_OPEN:3:1+verify:accounts/{uid}+verify:accounts/{uid}/devices/{device}+verify:rivalries/{rivalry}+verify:rivalries/{rivalry}/sessions/{session}+verify:rivalries/{rivalry}/sharedSetup/authoritative+verify:rivalries/{rivalry}/careerStart/authoritative+verify:rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / 200 / live | 200 → 200,200,200 | 9 | 372 / 162 | get:75:21,get:443:21,get:450:21,exists:838:12,get:887:50,get:927:25,get:931:26,get:932:26,get:933:20,get:934:21,get:1255:52,get:1256:53,get:1559:20,get:2629:18,get:2659:19,get:2668:23,get:2687:20 |
| P064 | get / accounts/{uid}/careerIndex/{id} /  /  / 200 / closed | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P065 | get / accounts/{uid}/careerIndex/{id} /  / missing / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P066 | get / accounts/{uid}/devices/{device} /  / active / 200 / closed | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P067 | get / accounts/{uid}/devices/{device} /  / active / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P068 | get / accounts/{uid}/devices/{device} /  / missing / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P069 | get / accounts/{uid}/pairLinks/current /  /  / 200 / closed | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P070 | get / accounts/{uid}/pairLinks/current /  /  / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P071 | get / accounts/{uid}/pairLinks/current /  / missing / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P072 | get / accounts/{uid} /  /  / 200 / closed | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P073 | get / accounts/{uid} /  /  / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P074 | get / accounts/{uid} /  / missing / 200 / live | 200 → 200,200,200 | 0 | 0 / 0 |  |
| P075 | get / rivalries/{rivalry}/careerStart/authoritative /  / CAREER_START_READY / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:450:21 |
| P076 | get / rivalries/{rivalry}/careerStart/authoritative /  / missing / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:450:21 |
| P077 | get / rivalries/{rivalry}/careerStart/authoritative /  / ONE_MANAGER_ACKNOWLEDGED / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:450:21 |
| P078 | get / rivalries/{rivalry}/invites/{invite} /  / open / 200 / live | 200 → 200,200,200 | 1 | 12 / 6 | get:75:21 |
| P079 | get / rivalries/{rivalry}/seasonCommits/season_{n} /  /  / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P080 | get / rivalries/{rivalry}/seasonCommits/season_{n} /  / ACKNOWLEDGED / 200 / closed | 200 → 200,200,200 | 2 | 60 / 24 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P081 | get / rivalries/{rivalry}/seasonCommits/season_{n} /  / ACKNOWLEDGED / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P082 | get / rivalries/{rivalry}/seasonCommits/season_{n} /  / COMMITTED / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P083 | get / rivalries/{rivalry}/seasonCommits/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P084 | get / rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / opponent /  / 200 / closed | 200 → 200,200,200 | 3 | 78 / 30 | get:75:21,get:450:21,get:887:50,get:1792:20,get:2629:18,get:2659:19 |
| P085 | get / rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / opponent /  / 200 / live | 200 → 200,200,200 | 4 | 78 / 30 | get:75:21,get:450:21,get:887:50,get:1792:20,get:2629:18,get:2659:19 |
| P086 | get / rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / own /  / 200 / closed | 200 → 200,200,200 | 3 | 78 / 30 | get:75:21,get:450:21,get:887:50,get:1792:20,get:2629:18,get:2659:19 |
| P087 | get / rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / own /  / 200 / live | 200 → 200,200,200 | 4 | 78 / 30 | get:75:21,get:450:21,get:887:50,get:1792:20,get:2629:18,get:2659:19 |
| P088 | get / rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} / own / missing / 200 / live | 200 → 200,200,200 | 4 | 78 / 30 | get:75:21,get:450:21,get:887:50,get:1792:20,get:2629:18,get:2659:19 |
| P089 | get / rivalries/{rivalry}/seasonResults/season_{n} /  / COLLECTING / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P090 | get / rivalries/{rivalry}/seasonResults/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P091 | get / rivalries/{rivalry}/seasonResults/season_{n} /  / RESULTS_READY / 200 / closed | 200 → 200,200,200 | 2 | 60 / 24 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P092 | get / rivalries/{rivalry}/seasonResults/season_{n} /  / RESULTS_READY / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P093 | get / rivalries/{rivalry}/sessionOffers/current /  /  / 200 / live | 200 → 200,200,200 | 3 | 72 / 36 | get:75:21,get:443:21,get:450:21 |
| P094 | get / rivalries/{rivalry}/sessionOffers/current /  / missing / 200 / live | 200 → 200,200,200 | 3 | 72 / 36 | get:75:21,get:443:21,get:450:21 |
| P095 | get / rivalries/{rivalry}/sessions/{session} /  /  / 403 / closed | 403 → 403,403,403 | 3 | 48 / 18 | get:75:21,get:450:21,exists:838:12 |
| P096 | get / rivalries/{rivalry}/sessions/{session} /  / active / 200 / live | 200 → 200,200,200 | 4 | 60 / 30 | get:75:21,get:450:21,exists:838:12 |
| P097 | get / rivalries/{rivalry}/sessions/{session} /  / closed / 403 / closed | 403 → 403,403,403 | 3 | 48 / 18 | get:75:21,get:450:21,exists:838:12 |
| P098 | get / rivalries/{rivalry}/sessions/{session} /  / missing / 200 / live | 200 → 200,200,200 | 4 | 60 / 30 | get:75:21,get:450:21,exists:838:12 |
| P099 | get / rivalries/{rivalry}/sessions/{session} /  / open / 200 / live | 200 → 200,200,200 | 4 | 60 / 30 | get:75:21,get:450:21,exists:838:12 |
| P100 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / CLUB_ASSIGNMENTS_COMMITTED / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P101 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / LEAGUE_WHEEL_COMMITTED / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P102 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / missing / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P103 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / SEASON_LENGTH_COMMITTED / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P104 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / SHARED_SETUP_OPEN / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P105 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / SHOWDOWN_CONFIRMED / 200 / closed | 200 → 200,200,200 | 2 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P106 | get / rivalries/{rivalry}/sharedSetup/authoritative /  / SHOWDOWN_CONFIRMED / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P107 | get / rivalries/{rivalry}/sharedSetup/leagueProjection /  /  / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:450:21 |
| P108 | get / rivalries/{rivalry}/sharedSetup/leagueProjection /  / missing / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:450:21 |
| P109 | get / rivalries/{rivalry}/state/authoritative/idempotency/{id} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 36 / 18 | get:75:21,get:443:21,exists:2765:16 |
| P110 | get / rivalries/{rivalry}/state/authoritative /  /  / 200 / live | 200 → 200,200,200 | 2 | 30 / 12 | get:75:21,get:443:21 |
| P111 | get / rivalries/{rivalry}/state/authoritative /  / missing / 200 / live | 200 → 200,200,200 | 2 | 30 / 12 | get:75:21,get:443:21 |
| P112 | get / rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / opponent /  / 200 / live | 200 → 200,200,200 | 4 | 84 / 30 | get:75:21,get:450:21,get:887:50,get:1559:20,get:2629:18,get:2659:19,get:2668:23 |
| P113 | get / rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / own /  / 200 / live | 200 → 200,200,200 | 4 | 84 / 30 | get:75:21,get:450:21,get:887:50,get:1559:20,get:2629:18,get:2659:19,get:2668:23 |
| P114 | get / rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} / own / missing / 200 / live | 200 → 200,200,200 | 4 | 84 / 30 | get:75:21,get:450:21,get:887:50,get:1559:20,get:2629:18,get:2659:19,get:2668:23 |
| P115 | get / rivalries/{rivalry}/transferChallenges/season_{n} /  / COMPLETED / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P116 | get / rivalries/{rivalry}/transferChallenges/season_{n} /  / GUESS_ENTRY / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P117 | get / rivalries/{rivalry}/transferChallenges/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P118 | get / rivalries/{rivalry}/transferChallenges/season_{n} /  / SIGNING_ENTRY / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P119 | get / rivalries/{rivalry}/transferChallenges/season_{n} /  / WINDOW_OPEN / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P120 | get / rivalries/{rivalry} /  / active / 200 / live | 200 → 200,200,200 | 3 | 36 / 12 | get:75:21,get:443:21,get:2687:20 |
| P121 | get / rivalries/{rivalry} /  / closed / 200 / closed | 200 → 200,200,200 | 3 | 36 / 12 | get:75:21,get:443:21,get:2687:20 |
| P122 | get / rivalries/{rivalry} /  / pending-pair / 200 / live | 200 → 200,200,200 | 3 | 48 / 24 | get:75:21,get:443:21,get:2687:20 |
| P123 | listen / rivalries/{rivalry}/seasonCommits/season_{n} /  / ACKNOWLEDGED / 200 / closed | 200 → 200,200,200 | 2 | 60 / 24 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P124 | listen / rivalries/{rivalry}/seasonCommits/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P125 | listen / rivalries/{rivalry}/seasonResults/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P126 | listen / rivalries/{rivalry}/seasonResults/season_{n} /  / RESULTS_READY / 200 / closed | 200 → 200,200,200 | 2 | 60 / 24 | get:75:21,get:450:21,get:2629:18,get:2659:19 |
| P127 | listen / rivalries/{rivalry}/sharedSetup/authoritative /  / missing / 200 / live | 200 → 200,200,200 | 3 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P128 | listen / rivalries/{rivalry}/sharedSetup/authoritative /  / SHOWDOWN_CONFIRMED / 200 / closed | 200 → 200,200,200 | 2 | 48 / 18 | get:75:21,get:450:21,get:2629:18 |
| P129 | listen / rivalries/{rivalry}/transferChallenges/season_{n} /  / missing / 200 / live | 200 → 200,200,200 | 3 | 54 / 18 | get:75:21,get:450:21,get:2629:18,get:2659:19 |

## Rules lookup site atlas

Every exercised get/exists/getAfter site from the isolated checks; per-request subsets are linked above and stored in JSON. Match grants are composed Rules :2697 account, :2707 device, :2721 pairLinks, :2728 careerIndex, :2739 rivalry, :2749 state, :2762 idempotency, :2774 invite, :2797 setup, :2804 leagueProjection, :2813 careerStart, :2823 transfer public, :2829 transfer role, :2841 results public, :2847 results role, :2858 commit, :2867 session and :2876 offer. Deny-all :2883 is not an additional document lookup.

| Composed Rules operation:line:column | Dependency document patterns |
| --- | --- |
| get:75:21 | accounts/{uid} |
| get:87:20 | accounts/{uid}/devices/{device} |
| get:99:20 | accounts/{uid}/devices/{device} |
| getAfter:286:25 | rivalries/{rivalry}/invites/{invite} |
| getAfter:318:26 | rivalries/{rivalry} |
| get:348:26 | rivalries/{rivalry}/invites/{invite} |
| getAfter:349:25 | rivalries/{rivalry}/invites/{invite} |
| getAfter:390:26 | rivalries/{rivalry} |
| get:443:21 | rivalries/{rivalry} |
| get:450:21 | rivalries/{rivalry} |
| get:486:21 | rivalries/{rivalry} |
| getAfter:521:21 | rivalries/{rivalry}/state/authoritative/idempotency/{id} |
| exists:522:15 | rivalries/{rivalry}/state/authoritative/idempotency/{id} |
| getAfter:601:19 | rivalries/{rivalry}/state/authoritative |
| get:702:21 | rivalries/{rivalry} |
| exists:838:12 | rivalries/{rivalry}/sessions/{session} |
| get:875:21 | rivalries/{rivalry}/sessions/{session} |
| get:887:50 | rivalries/{rivalry} |
| get:927:25 | rivalries/{rivalry} |
| get:931:26 | accounts/{uid} |
| get:932:26 | accounts/{uid} |
| get:933:20 | accounts/{uid}/devices/{device} |
| get:934:21 | rivalries/{rivalry}/sessions/{session} |
| get:969:14 | rivalries/{rivalry}/sessions/{session} |
| get:990:21 | rivalries/{rivalry} |
| get:1023:19 | rivalries/{rivalry}/sharedSetup/authoritative |
| get:1140:50 | rivalries/{rivalry}/sharedSetup/authoritative |
| get:1255:52 | rivalries/{rivalry}/sharedSetup/authoritative |
| get:1256:53 | rivalries/{rivalry}/careerStart/authoritative |
| getAfter:1340:14 | rivalries/{rivalry}/transferChallenges/season_{n}/roles/{role} |
| getAfter:1508:14 | rivalries/{rivalry}/transferChallenges/season_{n} |
| get:1559:20 | rivalries/{rivalry}/transferChallenges/season_{n} |
| getAfter:1577:64 | rivalries/{rivalry}/sharedSetup/leagueProjection |
| getAfter:1701:14 | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} |
| getAfter:1774:20 | rivalries/{rivalry}/seasonResults/season_{n} |
| get:1792:20 | rivalries/{rivalry}/seasonResults/season_{n} |
| get:1810:14 | rivalries/{rivalry}/sharedSetup/authoritative |
| get:1813:14 | rivalries/{rivalry}/seasonResults/season_{n} |
| get:1816:14 | rivalries/{rivalry}/seasonResults/season_{n}/roles/{role} |
| get:2181:19 | rivalries/{rivalry}/sharedSetup/authoritative |
| get:2182:20 | rivalries/{rivalry}/seasonCommits/season_{n} |
| get:2201:20 | rivalries/{rivalry}/seasonCommits/season_{n} |
| getAfter:2245:25 | rivalries/{rivalry} |
| get:2253:26 | rivalries/{rivalry} |
| getAfter:2254:25 | rivalries/{rivalry} |
| getAfter:2281:26 | rivalries/{rivalry}/sessions/{session} |
| getAfter:2323:21 | rivalries/{rivalry} |
| getAfter:2349:18 | accounts/{uid}/pairLinks/current |
| getAfter:2360:22 | accounts/{uid}/pairLinks/current |
| getAfter:2517:19 | rivalries/{rivalry} |
| exists:2518:15 | rivalries/{rivalry} |
| get:2525:20 | rivalries/{rivalry} |
| getAfter:2526:19 | rivalries/{rivalry} |
| get:2532:25 | accounts/{uid}/careerIndex/{id} |
| getAfter:2536:18 | accounts/{uid}/pairLinks/current |
| exists:2548:13 | rivalries/{rivalry} |
| get:2629:18 | rivalries/{rivalry} |
| get:2659:19 | rivalries/{rivalry} |
| get:2668:23 | rivalries/{rivalry}/transferChallenges/season_{n} |
| get:2687:20 | rivalries/{rivalry}/invites/{invite} |
| exists:2765:16 | rivalries/{rivalry}/state/authoritative/idempotency/{id} |

## Reproduce and validate

Set up 1824’s local Java/SDK/Chromium/server environment. Run the unchanged harness with `NODE_OPTIONS="--require ./reports/firestore-meter/rules-cost/capture.cjs"`, `CE2PG_SEASONS=3 CE2PG_RUN=1 METER_RUN=rules-m3 METER_OUT=work/rules-cost/m3.summary.json METER_IDLE_MS=0 CI=1 CMS_CHROMIUM_PATH=/usr/bin/chromium`; repeat as `rules-i3`, `METER_OUT=work/rules-cost/i3.summary.json METER_IDLE_MS=120000 DISPLAY=:100`, sequentially on fresh databases. `RULES_COST_FIREBASE_CLI` may name the already installed local firebase-tools entry point. Start freeze.cjs while each run is active to retain the gameplay boundary and final admin snapshot, then compact-traces.cjs, augment.cjs, probe.cjs and analyze.cjs. probe.cjs accepts only a hardcoded localhost demo endpoint and local emulator JAR; use the same Rules hash. report.cjs builds both deliverables from local analysis. Raw synthetic auth tokens, manager IDs, document bodies and browser traces remain scratch artifacts and are not committed.

Validation: helper JavaScript syntax, JSON arithmetic/count reconciliation, all 12 i3 timed windows, real start/end visibility checks, three seasons and terminal witnesses, no timed-window mutations, replay outcomes, unchanged tracked app/Rules/harness files, and new-file scope. The original CE2PG failures and contention replay debt are retained above. No full product-test pass, Showdown Gate seal, review approval or deployment is claimed.
