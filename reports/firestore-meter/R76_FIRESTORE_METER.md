# R76 Firestore meter: seasons and daily capacity

JOB-1824. Report only; never merge. Application: r75, `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`. Both managers together. Local Auth and Firestore emulators only, project `demo-cms-browser-journey`. No application, Rules, existing test, deployment or production data changes; no real Google sign-in. No SSJR or MDP credit.

## Result

With about an hour of waiting per season, about **1 season per quota day** fit under the conservative Rules-lookup model; **reads** run out first. All 25 configured seasons were played and terminal witnesses verified.

## Method and meter check

The new `tests/browser/ce2pg-meter.cjs` copies CE2PG `82bfcc74f9ed7893b912607f6d42b3ff7df667a2`. All 92 original check call sites remain. It embeds the SDK wrapper from `tools/firestore-meter` (`0f271c5a441ec4aaf1fab34d0600418f10d5cfde`), adds non-cache listener deliveries and successful transaction verify entries, and records manager, browser context, CE2PG season/phase, actual screen and document visibility. SDK reads are attempts, matching the supplied meter; denied attempts and cached direct reads can overestimate billing. Writes count committed document mutations plus verifies from the successful final transaction attempt. Intentional snapshot-abort read helpers are classified separately from genuine transaction failures; they make no verify commit. Transactions are SDK calls, including those read helpers, not a separately billed unit.

Playwright routes serve all Firebase SDK modules locally and block every `*.googleapis.com` and `*.firebaseio.com` browser destination. Dependency setup fetched the Firestore emulator JAR from `storage.googleapis.com`, which does not satisfy the card’s literal ban on all `*.googleapis.com` hosts. This artifact download did not access a real Firebase project. The initial Firebase CLI start also attempted its public MOTD probe; the network policy denied it. These setup deviations are disclosed rather than treated as evidence of strict host-ban compliance. Subsequent starts set `CI=1` to disable that probe and disable CLI usage reporting. Recorded browser blocks were Google Fonts requests, aborted locally; no browser request to a Firebase service host was observed. No real project was selected, contacted, signed into or deployed. The stale workspace-generated Rules did not match r75, so the harness composes exact r75 Rules in a temporary tree, uploads them to the emulator and proves an anonymous read is denied before either manager opens the game. Composed Rules SHA-256: `6eaeefc63729a9e87c3ec776791bac0ec768f8d9998fa9244b07adc26a478832`.

The meter accounting smoke check proved that a read/write transaction emits one verify for its read-only document, and that non-cache listener deliveries are counted while cache deliveries are excluded. The one-season run recorded 552 reads / 193 writes, including 154 / 65 in initial setup and 66 / 2 in extended post-close audits. Its phase-defined gameplay cost was 486 / 191. A one-season game bears all setup and close overhead; a three-season average amortizes them. The first completed three-season run recorded 1,311 / 407 against the JOB card’s approximate r75 reference of 1,261 / 410 (reads +4.0%, writes −0.7%). Its successful commit RPCs independently total exactly 407 mutations plus verifies. The extra CE2PG reloads, excursions and cleared/fresh-browser checks explain additional reads. This is a comparison with the card’s quoted reference, not an invoice comparison.

A workspace/session transition stopped the first m10 attempt after season four; its incomplete data are excluded and the full run was restarted. Later runs save partial evidence every 15 seconds. The first i3 attempt completed one Home wait, then failed because a direct route call did not load the lazy Standings screen. Its summary is archived as `i3-navigation-error.summary.json` and excluded from the forecast. The meter navigation was corrected to use real Home/Standings controls. A separate one-season, 100 ms-window pilot proved all four screen/visibility transitions and the terminal witness; its short waits are excluded from the rate estimates. The full five-minute i3 was restarted. The first m3a bootstrap exposed a manager-label scope error in the response recorder and was restarted before gameplay. In m1 that error was swallowed by the recorder; its preserved SDK counts remain valid, but its network write cross-check is unavailable. All subsequent runs use the corrected recorder. m1/m3a summaries were reaggregated from their preserved events to use the same source, read-helper and phase definitions as later runs. All compact summaries add terminal-witness and failed-check metadata from their retained CE2PG reports.

Runs are sequential and start fresh emulator databases. `METER_IDLE_MS=0` by default. i3 uses 300,000 ms after both result publications, before commit, on Home, Standings and Season Results, then Season Results with Nik hidden. Two isolated native Chromium browsers are connected through CDP with `noDefaults:true`, since ordinary Playwright focus emulation keeps tabs visible. Their windows are positioned separately. The harness calls `context.newPage()` and `bringToFront()` for Nik, checks actual `document.visibilityState === "hidden"`, and checks Daniel stays visible. Visibility is recorded at both ends of every window. No visibility property is spoofed.

Gameplay phase totals include setup, all seasons, continuation/reload/ordinary mid-season visits, terminal close and ordinary completed career screens. They exclude timed idle windows and the extended rivalry/history/cleared/fresh-browser audits. Season tags follow the CE2PG loop: continuation into the next season is charged to the season just finished. Setup is recorded as season 0 and allocated to season 1 below. Full totals and audit costs remain in each linked JSON.

Reproduction: install Java 21, Chromium and `npm i --no-save --package-lock=false firebase@12.17.0`; serve the unchanged tree with `CMS_TEST_PORT=4511 node tests/support/static-server.cjs`. Then `CI=1 CMS_CHROMIUM_PATH=/usr/bin/chromium CE2PG_SEASONS=3 CE2PG_RUN=1 METER_RUN=m3a node tests/browser/ce2pg-meter.cjs`. Use RUN 2 for m3b, RUN 3 for m5, RUN 1 for m1/m10/i3; set `METER_IDLE_MS=300000 DISPLAY=:100` for i3 on a 1920×1080 virtual display. Firebase tools 15.28.1, Firestore emulator 1.22.0, SDK 12.17.0 and Playwright 1.62.1. The harness starts/stops emulators itself.

## Runs and per-season costs

| Run | Planned | Played | Closed | CE2PG checks | Full reads | Full writes | Gameplay reads/season | Writes/season | Tx calls/season | Listener deliveries/season |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [m1](m1.summary.json) | 1 | 1 | True | 292/308 | 552 | 193 | 486.0 | 191.0 | 265.0 | 24.0 |
| [m3a](m3a.summary.json) | 3 | 3 | True | 404/433 | 1,311 | 407 | 404.3 | 135.0 | 239.3 | 16.7 |
| [m3b](m3b.summary.json) | 3 | 3 | True | 404/433 | 1,309 | 407 | 403.7 | 135.0 | 240.0 | 17.3 |
| [m5](m5.summary.json) | 5 | 5 | True | 538/575 | 2,197 | 621 | 413.4 | 123.8 | 260.4 | 15.4 |
| [m10](m10.summary.json) | 10 | 10 | True | 800/860 | 5,071 | 1,156 | 486.1 | 115.4 | 339.3 | 14.5 |
| [i3](i3.summary.json) | 3 | 3 | True | 432/460 | 2,495 | 407 | 521.0 | 135.0 | 352.3 | 19.0 |

CE2PG verdicts and failed checks are retained; a closed game with verified totals is distinct from a fully passing browser audit. `measurementComplete` requires the configured number of seasons and a passing database terminal-witness check.

| Metric, per season | Mean across run means | Lowest run mean | Highest run mean |
| --- | --- | --- | --- |
| reads | 452.4 | 403.7 | 521.0 |
| writes | 139.2 | 115.4 | 191.0 |
| transactions | 282.7 | 239.3 | 352.3 |
| listenerDeliveries | 17.8 | 14.5 | 24.0 |

| Run | Season | Position | Reads | Writes | Tx calls | Listener deliveries |
| --- | --- | --- | --- | --- | --- | --- |
| m1 | 1 | first + setup; final + close | 486 | 191 | 265 | 24 |
| m3a | 1 | first + setup | 549 | 178 | 351 | 25 |
| m3a | 2 | later | 348 | 103 | 223 | 13 |
| m3a | 3 | final + close | 316 | 124 | 144 | 12 |
| m3b | 1 | first + setup | 556 | 178 | 365 | 26 |
| m3b | 2 | later | 332 | 103 | 207 | 13 |
| m3b | 3 | final + close | 323 | 124 | 148 | 13 |
| m5 | 1 | first + setup | 571 | 178 | 376 | 25 |
| m5 | 2 | later | 357 | 103 | 232 | 13 |
| m5 | 3 | later | 391 | 103 | 265 | 14 |
| m5 | 4 | later | 389 | 103 | 264 | 13 |
| m5 | 5 | final + close | 359 | 132 | 165 | 12 |
| m10 | 1 | first + setup | 740 | 178 | 549 | 25 |
| m10 | 2 | later | 517 | 103 | 400 | 14 |
| m10 | 3 | later | 468 | 103 | 333 | 13 |
| m10 | 4 | later | 458 | 103 | 324 | 14 |
| m10 | 5 | later | 427 | 103 | 311 | 13 |
| m10 | 6 | later | 443 | 103 | 308 | 13 |
| m10 | 7 | later | 430 | 103 | 314 | 13 |
| m10 | 8 | later | 443 | 103 | 317 | 14 |
| m10 | 9 | later | 450 | 103 | 315 | 13 |
| m10 | 10 | final + close | 485 | 152 | 222 | 13 |
| i3 | 1 | first + setup | 643 | 178 | 449 | 28 |
| i3 | 2 | later | 427 | 103 | 310 | 14 |
| i3 | 3 | final + close | 493 | 124 | 298 | 15 |

| Season position | Samples | Metric | Mean | Lowest | Highest |
| --- | --- | --- | --- | --- | --- |
| First + setup | 6 | reads | 590.8 | 486 | 740 |
| First + setup | 6 | writes | 180.2 | 178 | 191 |
| First + setup | 6 | transactions | 392.5 | 265 | 549 |
| First + setup | 6 | listenerDeliveries | 25.5 | 24 | 28 |
| Later, before final | 14 | reads | 420 | 332 | 517 |
| Later, before final | 14 | writes | 103 | 103 | 103 |
| Later, before final | 14 | transactions | 294.5 | 207 | 400 |
| Later, before final | 14 | listenerDeliveries | 13.4 | 13 | 14 |
| Final + close | 6 | reads | 410.3 | 316 | 493 |
| Final + close | 6 | writes | 141.2 | 124 | 191 |
| Final + close | 6 | transactions | 207 | 144 | 298 |
| Final + close | 6 | listenerDeliveries | 14.8 | 12 | 24 |

The one-season run appears in both first and final groups because its single season includes both setup and close.

## Five biggest client sources

Owner is the outermost recorded `js/production*` module in the transaction caller chain (or event chain), otherwise its outermost module. Totals below combine gameplay across all completed samples; no Rule lookup is attributed to a JavaScript module.

Largest reads:

| Owner module | Reads |
| --- | --- |
| js/productionSharedTransferChallenge.js | 4,011 |
| js/productionSharedSeasonResults.js | 1,499 |
| js/productionSharedJourneyConflicts.js | 922 |
| js/productionSharedMultiSeasonProgression.js | 890 |
| js/sparkSharedMultiSeasonProgression.js | 585 |

Largest writes:

| Owner module | Writes |
| --- | --- |
| js/productionSharedTransferChallenge.js | 1,400 |
| js/productionSharedJourneyConflicts.js | 855 |
| js/productionSharedSeasonResults.js | 560 |
| js/productionSharedTerminalClose.js | 130 |
| js/productionSharedCareerStart.js | 72 |

## Rules lookups and idle cost

The emulator coverage endpoint returned a report. The harness walks its expression tree, counts get/exists/getAfter evaluations using value counts, and keeps the smallest AST span per source line/column so `get(...).data` parent expressions are not double-counted. i3 snapshots the counter before and after each window. These are evaluation counts, not billable document-access counts: repeated Rule lookups can be cached within a request. The prediction deliberately charges **one extra read per evaluation**, a conservative upper-cost model, rather than claiming cached calls are independently billed. Complete-run Rule counts include post-close audits; their non-idle remainder is therefore also conservative. If coverage is unavailable, the harness records that fact and the prediction uses the requested 25% read headroom instead. Window snapshots bracket the timed interval and include unquantified activity during coverage generation/fetch. Coverage collection became slow late in i3, so the Rule rates and non-idle remainder also include observer overhead. This is another reason to treat the forecast as a conservative quota model, not precise billing.

| Run | get | exists | getAfter | Total evaluations | Reliable evaluation count |
| --- | --- | --- | --- | --- | --- |
| m1 | 9,828 | 362 | 152 | 10,342 | True |
| m3a | 25,366 | 768 | 280 | 26,414 | True |
| m3b | 25,948 | 792 | 294 | 27,034 | True |
| m5 | 44,438 | 1,184 | 400 | 46,022 | True |
| m10 | 98,736 | 2,356 | 738 | 101,830 | True |
| i3 | 45,268 | 1,314 | 288 | 46,870 | True |

| Wait screen / visibility | Minutes observed | Client reads/min | Lowest window | Highest window | Writes/min | Rule evaluations/min | Daniel reads/min | Nik reads/min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Showdown Home visible | 15.0 | 9.1 | 7.8 | 10.8 | 0.0 | 148.9 | 4.5 | 4.6 |
| Standings visible | 15.0 | 9.8 | 8.0 | 11.6 | 0.0 | 158.2 | 4.7 | 5.1 |
| Season Results visible | 15.0 | 23.6 | 20.6 | 29.2 | 0.0 | 448.3 | 13.6 | 10.0 |
| Season Results Nik hidden | 15.0 | 13.1 | 10.8 | 16.4 | 0.0 | 233.1 | 13.1 | 0.0 |

Each visibility entry and end screen is preserved in i3’s JSON. Hidden-window totals include visible Daniel plus hidden Nik; forecasting uses both-visible windows only.

## Daily prediction

Limits are the JOB card’s 50,000 reads and 20,000 writes per quota day, shared by both players, reset at 3 am Boston. The base is the mean of all six non-idle run means. Waiting uses equal observed time on Home, Standings and Season Results with both tabs visible. Formula: `reads = base reads + idle reads/min × minutes`, likewise writes; `seasons/day = min(50000/reads, 20000/writes)`. Base reads and idle reads include the conservative Rules-evaluation ceiling above. The plain answer floors the mean capacity to whole completed seasons. The low/high range combines measured run costs and each i3 season’s visible-screen average; it is not a confidence interval or a claim about uncached production billing.

Mean non-idle base: 10,156.5 budget reads and 139.2 writes per season. Both-visible waiting: 14.2 client reads + 251.8 Rule evaluations per minute, charged as 266.0 budget reads/min; 0.0 writes/min.

| Waiting/season | Reads/season, upper-cost model | Writes/season | Seasons/day, mean | Lowest–highest across samples | First limit |
| --- | --- | --- | --- | --- | --- |
| 30 | 18,135.6 | 139.2 | 2.8 | 2.4–3.1 | reads |
| 60 | 26,114.7 | 139.2 | 1.9 | 1.6–2.1 | reads |
| 120 | 42,072.9 | 139.2 | 1.2 | 1.0–1.3 | reads |

**With about an hour of waiting per season, about 1 season a day fit.** Reads run out first in this conservative model. Rules caching can allow more; this experiment does not measure a production invoice or live quota consumption.

## Limits and retained failures

The supplied CE2PG expectations fail on this unchanged r75 application: stale Home season labels / Standings loading during excursions, Champion REVIEW SEASON visibility and label expectations, post-close Rivalry Statistics, phone Trophy Room detail visibility, and some denied/over-budget Rules requests. These are retained in the per-run check lists. Some expectations or seeded screen-opening paths may be harness mismatches rather than proven product defects. No expectation was loosened and no app fix was attempted. A passing terminal database witness establishes completed gameplay for measurement, not full browser-suite success.

Five-minute waits are extrapolated to 30/60/120 minutes as the task requests; token renewal, disconnect/reconnect billing and different player activity can change actual costs. Counter estimates apply to this exact r75 code, these inputs, two managers and the stated waiting states. Rules evaluation counts overestimate uncached accesses when caching applies. The 25% fallback is a heuristic only if coverage cannot be counted. The daily table describes quota capacity; real calendar time also constrains play. Re-run for a changed code head.

Only this report, compact per-run JSON summaries, the prediction summary and the new meter harness are published. Raw event dumps, screenshots, full CE2PG reports and large Rule coverage reports remain local. Coverage can contain synthetic test auth/data values, so none is exported. Every summary preserves aggregate season, source, phase, screen and manager costs plus visibility windows and check outcomes; no real account data was used.
