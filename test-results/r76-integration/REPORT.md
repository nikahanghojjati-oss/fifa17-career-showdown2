RETARGET TO gameplay/bug-list-1

**DO NOT MERGE — draft integration evidence for Claude.**

**Before:** r75 base `2f3865feca484223ac7d267d83a9c4828bad3078` has the reported gameplay defects. Its baseline syntax and 73 operations tests passed; contracts failed at `season-entry-no-flash-contracts.cjs:115` (`decoded before the reveal`).

**After:** Nine source PRs are integrated in the requested order. JOB-1802 and JOB-1815 were rolled back under the red-check rule; JOB-1811 was skipped for a product-code conflict. This is a failing integration candidate, not a release. No independent product fix or new test was written in this integration-only job.

**Cause**

- JOB-1805 startup gzip is **37,569 bytes**, above the 37,500 / 37,495 limits. Its six size failures are **known, JOB-1805 size, Claude fixes**. They remain unchanged.
- The no-flash failure also exists on the unchanged base. Excluding JOB-1802 / JOB-1815 does **not** establish either as its cause; no retry was performed.
- JOB-1811 and retained JOB-1807 change existing `js/seasonFinalV10.js` lines around `seasonSource`; this is not additions-only. Retained line 1894 is:
```js
return {final:finalSeasonReview?{status:"unavailable"}:finalFrame(s.finalReconciliation,s.terminalClose,history)};
```
- Browser route expectations disagree with the integrated Home routes. `tests/browser/shared-season-results-audit.cjs:217` still waits for `#dashboard` after the Home escape; `tests/browser/stability-audit.cjs:180` likewise waits for the dashboard after Rivalry Statistics Back. CE2PG reaches `mainMenu` after the same Back and later clicks a hidden `#seasonPrimaryAction`. Existing test assertions and harness checks are untouched; additions to the registration lists are combined in PR order.

**How**

Merged source branches with `git merge --no-ff`, keeping adjacent test-registration additions in PR order. Aborted the non-additive JOB-1811 merge. Ran syntax, contracts and operations after every completed merge; rolled back every red merge except the six explicitly exempt JOB-1805 size checks. Source PR head commits were fetched and pinned; review/thread queries were empty at inventory time. All 12 source heads and the base were reconfirmed unchanged after the browser audits. No open PR existed for JOB-1813 or JOB-1814. Tested product head: `e062e3dacea26307eec006ec67961e9de8711dc0`.

**Evidence**

| Job / PR | Branch | Exact source head | Result / evidence |
| --- | --- | --- | --- |
| 1802 / #836 | `codex/job-1802-ce2pg-baseline` | `638eac62b09aa5aec77a0566b711b17e5cdb73c5` | BREAKS contracts; syntax 0, contracts 1, ops 0; non-size failure: `AssertionError [ERR_ASSERTION]: decoded before the reveal` (also on base) |
| 1803 / #837 | `codex/job-1803-close-write-limit` | `1cdaab57066e675c3b9d13b9cf2f8f0d8679c800` | merged; syntax 0, contracts 0, ops 0 |
| 1804 / #838 | `codex/job-1804-setup-write-refused` | `20b9349e9b1b36aab9c5aec7498a22a6e614c35c` | merged; syntax 0, contracts 0, ops 0 |
| 1805 / #843 | `gameplay/work-1805-season-chip` | `b1cbb27c6f0300eab2ff79046bd49a49897bc1bb` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1808 / #841 | `codex/job-1808-standings-loading` | `8c3e1f23b7bb51ee16075b26848d644c8e454e49` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1809 / #846 | `codex/job-1809-rivalry-statistics` | `e4349c2502675a3e1001d4952e34f1f8e432f74e` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1806 / #839 | `codex/job-1806-back-home-route` | `9b9675fe51c5f4a771f9c01217724f03077c21d7` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1807 / #840 | `codex/job-1807-review-season-hidden` | `4f57485eb07fdfa257546868b1875b027ea038a7` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1810 / #844 | `codex/job-1810-phone-trophy-data` | `2ebe8c391698c92e6bbc873d031c94f6a16ab206` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1811 / #847 | `codex/job-1811-final-cells-empty` | `74c6422f0070ba888816d6f1c7c98aa93444eb72` | CONFLICT; `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, `js/seasonFinalV10.js`, `tests/operations/pos20-control-plane.test.mjs` |
| 1812 / #842 | `codex/job-1812-free-limit-home` | `148a3fd1b177af643fefab9917b0dd6c9704bc45` | merged (known, JOB-1805 size, Claude fixes); syntax 0, contracts 1, ops 0 |
| 1815 / #848 | `codex/job-1815-journey-guard-marker` | `b8f3b767027a400a1ac7f02d0313c7c125e7547b` | BREAKS contracts; syntax 0, contracts 1, ops 0; non-size failure: `AssertionError [ERR_ASSERTION]: decoded before the reveal` (also on base) |

Per-merge checks’ last lines (full retained output is in `test-results/r76-integration/logs/`):

```text
JOB-1802
POS10 syntax: 353 active source files, 0 failures
POS10 selected deterministic census failed in 1/191 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1803
POS10 syntax: 352 active source files, 0 failures
PASS POS10 selected deterministic census (192/192 current blocking contracts: frozen POS10 floor + POS20 supplements).
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1804
POS10 syntax: 352 active source files, 0 failures
PASS POS10 selected deterministic census (193/193 current blocking contracts: frozen POS10 floor + POS20 supplements).
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1805
POS10 syntax: 352 active source files, 0 failures
POS10 selected deterministic census failed in 6/194 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1808
POS10 syntax: 352 active source files, 0 failures
POS10 selected deterministic census failed in 6/195 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1809
POS10 syntax: 352 active source files, 0 failures
POS10 selected deterministic census failed in 6/196 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1806
POS10 syntax: 353 active source files, 0 failures
POS10 selected deterministic census failed in 6/196 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1807
POS10 syntax: 354 active source files, 0 failures
POS10 selected deterministic census failed in 6/196 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1810
POS10 syntax: 355 active source files, 0 failures
POS10 selected deterministic census failed in 6/196 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1812
POS10 syntax: 355 active source files, 0 failures
POS10 selected deterministic census failed in 6/197 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```
```text
JOB-1815
POS10 syntax: 356 active source files, 0 failures
POS10 selected deterministic census failed in 7/197 contract(s):
ℹ tests 73; ℹ pass 73; ℹ fail 0
```

The six known size failures are: `static-app-release-contracts.cjs`, `final-polish-presentation.cjs`, `browser-journey-emulator-switch-contracts.cjs`, `v10-transfer-contracts.cjs`, `v10-club-contracts.cjs`, `reus-gate-startup-contracts.cjs`. JOB-1815 additionally failed the baseline no-flash assertion.

Browser bundle: **29/31 passed**. `npm run -s test:browser` ran once and stopped at entry 7; entries 8–31 then each ran once individually to complete the census. No failed audit was retried.

| Failed audit | First error line | Location / evidence |
| --- | --- | --- |
| 7: `CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-season-results-audit.cjs` | `locator.waitFor: Timeout 30000ms exceeded.` | `browser-bundle.log` |
| 16: `node tests/browser/stability-audit.cjs` | `locator.waitFor: Timeout 12000ms exceeded.` | `browser-16.log` |

| Additional required check | Result | Last line / first failure |
| --- | --- | --- |
| `CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/v10-screen-flash-audit.cjs` | exit 0 | `v10 screen flash audit: PASS` |
| `node tests/contracts/firestore-budget-contracts.cjs` | exit 0 | `PASS Firestore budget contracts: 16 checks, measured reads/min 3.4 / 0.0 / 3.0 / 1.8 / 60.0 (waiting <= 5 reads/min, hidden 0, idle writes 0, partner update <= 1000 ms).` |
| `node tests/contracts/reus-gate-startup-contracts.cjs` | exit 1 | `AssertionError [ERR_ASSERTION]: startup gzip 37569 must stay <= 37495` |

CE2PG used the byte-identical harness copied from `gameplay/ce2pg`, local Auth/Firestore emulators, Firebase CLI 15.28.1, browser SDK 12.17.0 and Java 21. The three journeys ran sequentially; browser audits ran independently alongside them. Committed JSON reports are the unmodified harness output. History below counts check IDs containing `history` or beginning `hist.`; a partial denominator does not prove the later history screens.

| CE2PG seasons / run | Finished | Accepted seasons | Minutes | Checks | History | HTTP 409 / lock-timeout messages | Rules-denied commits / evaluation-error network entries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 / 1 | no | 1/3 | 3.23 | 76/82 | 8/8 | 0 / 0 | 1 / 1 |
| 5 / 2 | no | 1/5 | 3.35 | 76/82 | 8/8 | 0 / 0 | 0 / 0 |
| 10 / 3 | no | 1/10 | 3.32 | 76/82 | 8/8 | 0 / 0 | 1 / 1 |

Rules-denied commits and evaluation-error entries can describe the same request; do not add those columns. Console-line counts and first messages are retained in `checks.json`.

- 3/1: first Rules error: `{"error":{"code":403,"message":"\nevaluation error at L2800:26 for 'update' @ L2800, false for 'update' @ L2883, false for 'update' @ L2800, false for 'update' @ L2883","status":"PERMISSION_DENIED"}}`. Fatal: `locator.click: Timeout 30000ms exceeded.`.

- 5/2: first Rules error: `none recorded`. Fatal: `locator.click: Timeout 30000ms exceeded.`.

- 10/3: first Rules error: `{"error":{"code":403,"message":"\nevaluation error at L2800:26 for 'update' @ L2800, false for 'update' @ L2883, false for 'update' @ L2800, false for 'update' @ L2883","status":"PERMISSION_DENIED"}}`. Fatal: `locator.click: Timeout 30000ms exceeded.`.

Known bugs (numbers follow JOB-1802):

| Bug | 3 / 1 | 5 / 2 | 10 / 3 |
| --- | --- | --- | --- |
| 1 REVIEW SEASON hidden | not reached | not reached | not reached |
| 2 Home season tile/header | not observed in executed checks | not observed in executed checks | not observed in executed checks |
| 3 Standings loading | not observed in executed checks | not observed in executed checks | not observed in executed checks |
| 4 Rivalry Statistics loading | not observed in executed checks | not observed in executed checks | not observed in executed checks |
| 5 Champion Back to Home route | not reached | not reached | not reached |
| 6 Phone Trophy Room ranks/records | not reached | not reached | not reached |
| 7 Final reconciliation/final-season cells | not reached | not reached | not reached |
| 8 Rules setup/close refusal | observed | no observed setup denial; close not reached | observed |

Only the executed first-season Home tile and dashboard checks cover bug 2; later-season and terminal behavior remain unproven. All three journeys stopped before final-screen, post-close, cleared-storage and fresh-context checks.

CE2PG failed IDs:

- 3/1: `S1.excursion.stats.daniel`, `S1.excursion.trophy.daniel`, `S1.rivalry.back.daniel`, `S1.excursion.stats.nik`, `S1.excursion.trophy.nik`, `S1.rivalry.back.nik`.

- 5/2: `S1.excursion.stats.daniel`, `S1.excursion.trophy.daniel`, `S1.rivalry.back.daniel`, `S1.excursion.stats.nik`, `S1.excursion.trophy.nik`, `S1.rivalry.back.nik`.

- 10/3: `S1.excursion.stats.daniel`, `S1.excursion.trophy.daniel`, `S1.rivalry.back.daniel`, `S1.excursion.stats.nik`, `S1.excursion.trophy.nik`, `S1.rivalry.back.nik`.

Baseline comparison: JOB-1802 reports exist for 3/1, 3/2 and 10/3. Matched 3/1 and 10/3 baseline summaries and evaluated-ID differences are retained in `checks.json`; 5/2 has no matching baseline. The six current first-season failing IDs are new versus matched baseline failures, while first-season tile/Standings/Rivalry-loading failures now pass. Unreached baseline failures are not counted as fixed.

**Reads/writes per season:** unavailable in both integration and JOB-1802 baseline. The harness `network` section records failed/environment requests, aborted Listen channels and selected denied Commit bodies; it does not count successful reads/writes or billable document operations. No zero or cost reduction is inferred. The required budget contract is reported separately and is not a CE2PG per-season measurement.

| Run | Integration reads / writes per season | JOB-1802 reads / writes per season | Baseline comparison |
| --- | --- | --- | --- |
| 3 / 1 | not captured / not captured | not captured / not captured | matched scenario; baseline 403/433 checks, full journey |
| 5 / 2 | not captured / not captured | no matching report | JOB-1802 ran 3 / 2, not 5 / 2 |
| 10 / 3 | not captured / not captured | not captured / not captured | matched scenario; baseline 822/878 checks, full journey |

Terminal logs are normalized only to remove terminal color escapes and trailing whitespace. The three CE2PG JSON files are byte-identical to the harness output.

**Not done / unsure**

- Do not merge this draft. The two browser audit failures, aborted multi-season journeys, retained startup-size failures, skipped JOB-1811, and excluded JOB-1802/JOB-1815 require Claude review.
- The setup `L2800` refusal still appears even with JOB-1804 retained; setup subsequently completed. Terminal close was not reached, so JOB-1803’s real close behavior and known bugs 1/5/6/7 are unproven here.
- Mid-showdown Career Statistics and Trophy Room contain accepted-season data where CE2PG expects no completed-showdown data, and Rivalry Statistics Back reaches Home where it expects the dashboard. These are recorded integration mismatches, not silently waived.
- No existing test assertions or harness checks were edited, no independent product code was changed, no protected source or Rules file was changed outside source merges, and no deployment or production Firebase was used. The copied harness and incidental runtime artifacts are not committed.
- Full logs, exact heads, first failures, check tails, baseline limitations and three CE2PG JSON reports are committed under `test-results/r76-integration/`.
