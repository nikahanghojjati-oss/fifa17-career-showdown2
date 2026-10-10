# Mega factory run report · 2026-10-10T20:23:29Z

Taken 116 of 518 jobs. By state: on_train 20, pr_open 96, waiting 402

## By stage
Stage | name | total | picked up | merged
--- | --- | --- | --- | ---
1 | audits | 112 | 71 | 0
2 | screen fixes | 266 | 44 | 0
3 | mockup match | 14 | 1 | 0
4 | phone studies | 70 | 0 | 0
5 | desktop studies | 56 | 0 | 0

## Code trains (5 fixes per pull request)
Train | jobs done | PR | state
--- | --- | --- | ---
gameplay/train-home-1 | 3 of 5 | - | on train, no PR yet
gameplay/train-start-join-1 | 3 of 5 | - | on train, no PR yet
gameplay/train-league-1 | 3 of 5 | - | on train, no PR yet
gameplay/train-club-1 | 3 of 5 | - | on train, no PR yet
gameplay/train-transfer-1 | 2 of 5 | - | on train, no PR yet
gameplay/train-season-final-1 | 2 of 5 | - | on train, no PR yet
gameplay/train-rivalry-legacy-1 | 5 of 5 | [#509](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/509) | pr_open
gameplay/train-rivalry-legacy-2 | 5 of 5 | [#521](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/521) | pr_open
gameplay/train-rivalry-legacy-3 | 5 of 5 | [#536](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/536) | pr_open
gameplay/train-rivalry-legacy-4 | 5 of 5 | [#539](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/539) | pr_open
gameplay/train-career-screens-1 | 2 of 5 | - | on train, no PR yet
gameplay/train-rivalry-legacy-5 | 2 of 5 | [#542](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/542) | pr_open
gameplay/train-rules-settings-1 | 2 of 5 | - | on train, no PR yet

## Finished study and audit jobs
Number | job | title | state | link
--- | --- | --- | --- | ---
2 | 1467 | Audit all screens: tap targets of at least 44 px on every team v screen | pr_open | [PR #458](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/458)
4 | 1468 | Audit all screens: long manager and club names never break a layout | pr_open | [PR #459](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/459)
6 | 1469 | Audit all screens: phone notch and bottom bar safe areas | pr_open | [PR #461](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/461)
8 | 1470 | Audit all screens: phone held sideways: nothing hidden or overlapping | pr_open | [PR #462](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/462)
10 | 1471 | Audit all screens: keyboard focus rings and reduced motion | pr_open | [PR #463](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/463)
12 | 1472 | Audit all screens: empty, loading and waiting messages read the same everywhere | pr_open | [PR #464](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/464)
14 | 1473 | Audit all screens: text contrast on plates and badges | pr_open | [PR #465](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/465)
16 | 1474 | Audit all screens: fonts: fallback while loading, no jumps | pr_open | [PR #466](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/466)
18 | 1475 | Audit all screens: picture descriptions and screen reader labels | pr_open | [PR #468](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/468)
20 | 1476 | Audit all screens: stacking order: dialogs above screens, toasts above dialogs | pr_open | [PR #467](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/467)
22 | 1477 | Audit all screens: hard-coded colours that should use the design tokens | pr_open | [PR #470](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/470)
24 | 1478 | Audit all screens: hover-only effects must also work by touch | pr_open | [PR #471](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/471)
26 | 1479 | Audit js/seasonEngine.js for gameplay bugs (first half) | pr_open | [PR #472](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/472)
28 | 1480 | Audit js/seasonEngine.js for gameplay bugs (second half) | pr_open | [PR #473](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/473)
30 | 1481 | Audit js/transferChallenge.js for gameplay bugs (first half) | pr_open | [PR #475](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/475)
32 | 1482 | Audit js/transferChallenge.js for gameplay bugs (second half) | pr_open | [PR #474](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/474)
34 | 1483 | Audit js/productionSharedTransferChallenge.js for gameplay bugs (first half) | pr_open | [PR #478](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/478)
36 | 1484 | Audit js/productionSharedTransferChallenge.js for gameplay bugs (second half) | pr_open | [PR #479](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/479)
38 | 1485 | Audit js/sparkSharedTransferChallenge.js for gameplay bugs (first half) | pr_open | [PR #480](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/480)
40 | 1486 | Audit js/sparkSharedTransferChallenge.js for gameplay bugs (second half) | pr_open | [PR #481](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/481)
42 | 1487 | Audit js/sharedTransferChallenge.js for gameplay bugs (first half) | pr_open | [PR #483](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/483)
126 | 1529 | Audit js/sparkTerminalClose.js for gameplay bugs (first half) | pr_open | [PR #487](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/487)
128 | 1530 | Audit js/sparkTerminalClose.js for gameplay bugs (second half) | pr_open | [PR #488](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/488)
130 | 1531 | Audit js/productionSharedCanonicalScoring.js for gameplay bugs (first half) | pr_open | [PR #489](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/489)
132 | 1532 | Audit js/productionSharedCanonicalScoring.js for gameplay bugs (second half) | pr_open | [PR #490](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/490)
134 | 1533 | Audit js/productionSharedHistoryConvergence.js for gameplay bugs (first half) | pr_open | [PR #493](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/493)
136 | 1534 | Audit js/productionSharedHistoryConvergence.js for gameplay bugs (second half) | pr_open | [PR #494](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/494)
138 | 1535 | Audit js/sharedHistoryConvergence.js for gameplay bugs (first half) | pr_open | [PR #496](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/496)
140 | 1536 | Audit js/sharedHistoryConvergence.js for gameplay bugs (second half) | pr_open | [PR #497](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/497)
142 | 1537 | Audit js/sharedJourneyReconnect.js for gameplay bugs (first half) | pr_open | [PR #500](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/500)
144 | 1538 | Audit js/sharedJourneyReconnect.js for gameplay bugs (second half) | pr_open | [PR #501](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/501)
146 | 1539 | Audit js/sharedActiveShowdownAdapter.js for gameplay bugs (first half) | pr_open | [PR #504](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/504)
148 | 1540 | Audit js/sharedActiveShowdownAdapter.js for gameplay bugs (second half) | pr_open | [PR #505](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/505)
150 | 1541 | Audit js/statistics.js for gameplay bugs (first half) | pr_open | [PR #510](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/510)
152 | 1542 | Audit js/statistics.js for gameplay bugs (second half) | pr_open | [PR #511](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/511)
154 | 1543 | Audit js/legacy.js for gameplay bugs (first half) | pr_open | [PR #514](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/514)
156 | 1544 | Audit js/legacy.js for gameplay bugs (second half) | pr_open | [PR #515](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/515)
158 | 1545 | Audit js/analytics.js for gameplay bugs (first half) | pr_open | [PR #518](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/518)
160 | 1546 | Audit js/analytics.js for gameplay bugs (second half) | pr_open | [PR #519](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/519)
162 | 1547 | Audit js/settings.js for gameplay bugs (first half) | pr_open | [PR #522](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/522)
164 | 1548 | Audit js/settings.js for gameplay bugs (second half) | pr_open | [PR #523](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/523)
166 | 1549 | Audit js/screens.js for gameplay bugs (first half) | pr_open | [PR #525](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/525)
168 | 1550 | Audit js/screens.js for gameplay bugs (second half) | pr_open | [PR #526](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/526)
170 | 1551 | Audit js/menuExperience.js for gameplay bugs (first half) | pr_open | [PR #529](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/529)
172 | 1552 | Audit js/menuExperience.js for gameplay bugs (second half) | pr_open | [PR #530](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/530)
174 | 1553 | Audit js/clubAssignment.js for gameplay bugs (first half) | pr_open | [PR #533](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/533)
176 | 1554 | Audit js/clubAssignment.js for gameplay bugs (second half) | pr_open | [PR #491](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/491)
178 | 1555 | Audit js/storage.js for gameplay bugs (first half) | pr_open | [PR #492](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/492)
180 | 1556 | Audit js/storage.js for gameplay bugs (second half) | pr_open | [PR #495](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/495)
182 | 1557 | Audit js/diagnostics.js for gameplay bugs (first half) | pr_open | [PR #498](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/498)
184 | 1558 | Audit js/diagnostics.js for gameplay bugs (second half) | pr_open | [PR #499](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/499)
186 | 1559 | Audit js/offlineApp.js for gameplay bugs (first half) | pr_open | [PR #502](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/502)
188 | 1560 | Audit js/offlineApp.js for gameplay bugs (second half) | pr_open | [PR #503](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/503)
190 | 1561 | Audit js/sparkCompletedShowdownReader.js for gameplay bugs (first half) | pr_open | [PR #507](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/507)
192 | 1562 | Audit js/sparkCompletedShowdownReader.js for gameplay bugs (second half) | pr_open | [PR #508](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/508)
194 | 1563 | Audit js/sparkCompletedTransferHistoryReader.js for gameplay bugs (first half) | pr_open | [PR #512](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/512)
196 | 1564 | Audit js/sparkCompletedTransferHistoryReader.js for gameplay bugs (second half) | pr_open | [PR #513](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/513)
198 | 1565 | Audit js/careerScreensV10.js for gameplay bugs (first half) | pr_open | [PR #516](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/516)
200 | 1566 | Audit js/careerScreensV10.js for gameplay bugs (second half) | pr_open | [PR #517](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/517)
202 | 1567 | Audit js/rivalryLegacyV10.js for gameplay bugs (first half) | pr_open | [PR #520](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/520)
204 | 1568 | Audit js/rivalryLegacyV10.js for gameplay bugs (second half) | pr_open | [PR #524](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/524)
206 | 1569 | Audit js/transferScreenV10.js for gameplay bugs (first half) | pr_open | [PR #527](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/527)
208 | 1570 | Audit js/transferScreenV10.js for gameplay bugs (second half) | pr_open | [PR #528](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/528)
210 | 1571 | Audit js/clubScreenV10.js for gameplay bugs (first half) | pr_open | [PR #531](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/531)
212 | 1572 | Audit js/clubScreenV10.js for gameplay bugs (second half) | pr_open | [PR #532](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/532)
214 | 1573 | Audit js/seasonFinalV10.js for gameplay bugs (first half) | pr_open | [PR #534](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/534)
216 | 1574 | Audit js/seasonFinalV10.js for gameplay bugs (second half) | pr_open | [PR #535](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/535)
218 | 1575 | Audit js/homeScreensV10.js for gameplay bugs (first half) | pr_open | [PR #537](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/537)
220 | 1576 | Audit js/homeScreensV10.js for gameplay bugs (second half) | pr_open | [PR #538](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/538)
222 | 1577 | Audit js/v10Screens.js for gameplay bugs (first half) | pr_open | [PR #540](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/540)
224 | 1578 | Audit js/v10Screens.js for gameplay bugs (second half) | pr_open | [PR #541](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/541)

## Needs a look (blocked, no change needed, needs Team V or mockup)

