# JOB-4 — Standings, statistics and Trophy Room consistency

## Summary

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**, on **2026-10-22** (America/New_York). **One new P2 finding; no substantiated new P1/P3 finding.** An unfinished real Showdown contributes seasons, points, trophies and records to career totals when the page holds converged History, but contributes none through the progression fallback. History's visible archive omits that unfinished Showdown in both cases. Consequently, the requested guarantee that career counters equal finished real Showdowns, consistently for both managers, is **not proved**.

`codex-findings/` was absent on main. Before selecting findings, fetched and read the complete reports in open draft PRs **#958–#969**. Their reported problems are excluded: completed-reader map ordering and missing protocols; career loading/remounting/readiness; marker/reveal recovery; pairing/mode labels; session/continuation recovery; Firebase usage and Rules observations. The existing reader repair **#957** is also excluded. Rechecked live main and the open audit PR list before publication; main remained unchanged and no newer findings report appeared.

This investigation starts at **Standings' per-season frame and Trophy Room category counts**, rather than the latest report's first-pairing recovery or JOB-A's completed-reader boundary. Read all seven requested files and followed their shared Standings (`js/seasonFinalV10.js`), active/closed adapters, analytics, seam, History, scoring and actual Team V renderers. History is the `legacy` route; Rivalry Statistics is `statistics`.

No app code, repository tests, Rules, production accounts or data were changed. Only this report belongs in the draft PR.

## Evidence and limits

- **Stored data:** the unchanged completed-reader emulator suite runs current providers through actual commits and Terminal Close under composed production Rules. The saved-game suite exercises actual captured r75/r76/r79 documents through both managers' index → reader → career loader. Both suites passed. Reading an old fixture directly does not make a pre-r79/test game eligible for the normal career; marker eligibility is a separate gate.
- **Independent arithmetic:** generated legal 1/3/5/10-season projections, independently summed competition points and counters, verified both manager roles, and checked every accepted prefix through live Standings/Rivalry. Retained the existing capped performance/awards bonuses; no scoring rule was changed. Included both managers winning the same competitions, CL and EL in different seasons, true season draws, and equal season scores resolved by league position. One manager never won CL and EL together.
- **New defect:** a scratch SDK supplied the actual captured r79 completed game plus a synthetic correctly sealed ACTIVE root and protocol-generated accepted-season projection. The actual index client, completed reader, closed loader, active/closed adapters and analytics ran unchanged. The shared browser career binder was also executed unchanged in a VM with valid account/services and a ready marker. No request failed and no stored result/map ordering was altered. The synthetic root/projection and supplied provider snapshots are test instrumentation, not player actions.
- **Visible output:** Chromium ran the actual Career Statistics, Trophy Room, Standings and Rivalry renderers at **1920×1080** and **393×660**. Its supported model seam received the verified probe outputs; this presentation check is separate from the normal-source loader check. All six Trophy Room tabs were clicked and their settled displayed figures checked. Screenshots of the live-career discrepancy were inspected. The requested phone audit separately passed **1920×1080, 393×660 and 393×852**, including MORE/CLOSE and storage immutability.

No private production archive census, live Google sign-in or physical-device acceptance run was performed. The known production reader/loading findings remain unfixed on the audited head. Passing local readers does not establish that every production SDK representation is accepted. Scratch scripts, logs, fixture outputs and screenshots remain in `work/job4/`, excluded from the PR.

## Findings

### F1 — P2: unfinished seasons inflate career honours, and page-memory History decides whether they count

**Player steps**

1. Have at least one finished real Showdown, then start a new real three-season Showdown normally.
2. Complete and acknowledge season 1 of the new Showdown. Let its normal shared History converge; leave the Showdown unfinished.
3. Open Career Statistics, Trophy Room and Standings → CAREER. They include the unfinished season's points, trophies, season W-D-L and records, although COMPLETED SHOWDOWNS has not increased. Open History: its visible cards still contain only finished games (plus any status-only ended-early rows).
4. Compare with a freshly resumed page using progression's verified accepted-season projection while its History view is absent/behind. Its live THIS SHOWDOWN and Rivalry counters remain correct, but its career counters exclude that same season. Either manager can occupy either state. No outage or invalid save is necessary.

**Cause / file:line**

1. The production career binder snapshots live state at `js/rivalryLegacyV10.js:247` and passes `active.careerInput` to the closed loader at **`:262`**. `js/sparkClosedShowdownCareerLoader.js:68–69` combines that current input with indexed reads.
2. For an indexed `not-closed` root, `js/sharedClosedShowdownAdapter.js:76–84` forwards a known live `active`/`completion-pending` entry. In contrast, a loading current input becomes `pending` at **`:78`**, and pending entries are omitted by `js/sharedCareerAnalytics.js:53`.
3. **The counting boundary is at `js/sharedCareerAnalytics.js:121–131`:** only unavailable/abandoned entries skip accumulation. Active and completion-pending entries run `accumulate` and enter season-record candidates. That increments points, seasons, W-D-L, league/cup/CL/EL honours and bonus counters (`:77–95`). Only completed **Showdown outcomes** are gated by `classification === "completed"` at `:137–140`. The resulting career has mixed eligibility without a provisional label.
4. Whether the live entry is forwarded depends on page memory: `js/sharedActiveShowdownAdapter.js:144–155`, specifically **`:146`**, deliberately strips the progression fallback from career input and returns loading. With matching converged History, it instead forwards the active projection at `:151`. Both paths retain the same verified live rivalry numbers (`:91–106`). The normal History adapter can clear its page view while the next season lacks terminal commit/scoring (`js/productionSharedHistoryConvergence.js:90–98`); this is not equivalent to losing the accepted prefix in progression.
5. History's V10 conversion lists only completed and abandoned rows (`js/rivalryLegacyV10.js:26–30`), whereas Career Statistics/Trophy Room map the accumulated managers/cabinets (`js/careerScreensV10.js:43–71`). Standings CAREER maps that same accumulated model (`js/seasonFinalV10.js:227–234`). The closed adapter sets `currentShowdownOnly:false` (`js/sharedClosedShowdownAdapter.js:104`), so no current-only warning distinguishes the provisional contribution.

**Reproduction result**

The stored finished r79 game contributes **5–1 points**, **1–1 trophies**, one season and one Daniel Showdown win. The new game's accepted season is Daniel league+cup+EL = **7**, Nik EL = **3**; both managers legally win EL in their separate saves. It is still 1/3 accepted and has no Terminal Close.

| Observation | Career points D/N | Career trophies D/N | Career seasons per manager | Completed Showdowns | Visible finished History cards | THIS SHOWDOWN points D/N |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Required finished-game total | 5 / 1 | 1 / 1 | 1 | 1 | 1 | 7 / 3 |
| Converged History present | **12 / 4** | **4 / 2** | **2** | 1 | 1 | 7 / 3 |
| Same accepted prefix, History missing; verified progression present | 5 / 1 | 1 / 1 | 1 | 1 | 1 | 7 / 3 |

Each observed row was reproduced separately as Daniel and Nik. The common online binder returned **12–4** as well. Actual desktop/phone Career Statistics rendered `1 completed`, `2 / 2 seasons`, `12 / 4 points`, `4 / 2 trophies`; Standings CAREER displayed 12–4. Trophy Room showed league **2–0**, cup **1–1**, CL **0–0**, EL **1–1**, with just the old **1–0** Showdown champion count. Each category tab consistently reproduced its ALL-card values: this is a shared model eligibility error, not a category-filter arithmetic error. Rivalry and THIS SHOWDOWN correctly showed 7–3, three/one competition trophies and one/no season wins for the current game.

There is no demonstrated double addition after legitimate closure: the closed/current merge counted each fully completed game once in the prefix matrix. Ending the new game early correctly removed its provisional contribution on a fresh load. That means previously displayed career honours can disappear even though the underlying completed career has not changed. There is no evidence of stored season loss.

This is separate from the excluded reader/marker/loading findings: the reader, index and marker all succeed, the model is `ready`, and both source paths possess the same valid accepted prefix. Some existing contracts intentionally allow provisional career contributions; that existing behavior conflicts with this job's finished-Showdown counting requirement, while the fallback also creates inconsistent behavior between pages.

**Suggested fix:** maintain separate completed-career and current-Showdown projections. Accumulate career counters, cabinets, ranks and records only from verified completed eligible entries; keep active/completion-pending seasons in THIS SHOWDOWN/Rivalry or an explicitly separate provisional view. Make History presence versus progression fallback irrelevant to completed-career totals. Preserve exact-once closure, ended-early/test exclusions, witness verification and account boundaries. Do not solve the discrepancy by adding unfinished games to the finished archive or by hiding their live Standings.

**Regression needed:** one completed game plus 1/3 and 2/3 accepted live seasons; both roles with matching/missing/lagging History, before/after reload; then successful close or END SHOWDOWN. Assert career totals equal only finished eligible games, live figures equal accepted current seasons, all tabs agree, and close adds the game exactly once. Also cover a failed automatic close with `completion-pending` so provisional honours cannot masquerade as a completed career.

## Minimal reproduction without app edits

From repository root, save this as a scratch `.cjs` file and run it with Node. This small reproduction uses repository protocol-generated fixtures at the adapter boundary; the actual saved-document/index/reader probe described above independently exercised the source path.

```js
const assert = require('node:assert/strict');
const fromRoot = p => require(process.cwd() + '/' + p);
const F = fromRoot('tests/support/active-showdown-fixtures.cjs');
const A = fromRoot('js/sharedActiveShowdownAdapter.js');
const D = fromRoot('js/sharedClosedShowdownAdapter.js');
const C = fromRoot('js/sharedCareerAnalytics.js');
const RV = fromRoot('js/rivalryLegacyV10.js');
const R = F.result;
const old = F.projection({seed:'1', totalSeasons:1, seasons:[[
  R({leaguePosition:1, leaguePoints:100, topScorer:true}),
  R({domesticCup:true})
]]});
const live = F.projection({seed:'2', totalSeasons:3, seasons:[[
  R({leaguePosition:1, domesticCup:true, europaLeague:true}),
  R({europaLeague:true})
]]});
const final = F.finalFor(old);
for (const historyPresent of [true, false]) {
  const snapshot = {identity:F.identity(), pair:F.pair(live.rivalryId),
    multiSeason:{...F.multiFor(live), projection:live},
    history:historyPresent ? F.history(live) : null};
  const input = D.buildClosedCareerInput({
    index:{status:'ready', rivalryIds:[old.rivalryId,live.rivalryId]},
    reads:{[old.rivalryId]:{status:'completed', rivalryId:old.rivalryId,
      managerRole:'playerOne', projection:old,
      terminalWitness:F.closed(old).terminalWitness,
      final:{...final, margin:4, seasonsPlayed:1}},
      [live.rivalryId]:{status:'not-closed', rivalryId:live.rivalryId,
        managerRole:'playerOne'}}, current:A.careerInput(snapshot)});
  const m = C.buildCareerModel(input);
  const points = [m.managers.daniel.careerPoints,m.managers.nik.careerPoints];
  assert.deepEqual(points, historyPresent ? [12,4] : [5,1]);
  assert.equal(RV.toV10Frame(m,'legacy').showdowns.length,1);
  assert.deepEqual(A.rivalryView(snapshot).score,{daniel:7,nik:3});
  console.log({historyPresent, points, seasons:m.managers.daniel.seasons});
}
// true: 12–4, two seasons; false: 5–1, one season.
```

## Requested paths checked without another new finding

| Requirement | Verdict / practical limit |
| --- | --- |
| Finished-game counters agree with History | Verified completed projections agree across analytics, History rows, Career Statistics/Trophy Room frames and Standings CAREER, independently of viewer role. Stored-data reader/loader controls passed for both managers. F1 and excluded existing findings prevent an unconditional production guarantee. |
| League +3, cup +1, CL +5, EL +3 | Independent totals and the existing six-scorer parity suite agree. Per-manager CL/EL exclusivity and separate-save simultaneous wins pass. Existing capped performance/awards bonuses remain unchanged. |
| Season versus Showdown draws | Equal season scores use league position, then league points; a tied final total remains a Showdown draw. The combined finished archive below has one Showdown draw and five season draws; these are distinct counters. |
| All six Trophy Room tabs | At both desktop/phone sizes, ALL shows the same five cases as their individual tabs; category counts below equal the Career Statistics model. Showdown champions count finished wins separately from competition `totalTrophies`; draws award no champion. Zero wins display a dash/“Not won yet”, not unavailable. The requested MORE/CLOSE audit passes too. |
| THIS SHOWDOWN after each season | All accepted prefixes of 1/3/5/10-season projections pass both-role independent point/counter checks, including Europa. Rivalry matches the current projection, not whole-career aggregates. F1 affects CAREER's eligibility, not live arithmetic. |
| Current → completed, no duplicate | Closed witness plus matching current completed entry contributes exactly once. An abandoned read supersedes earlier active seasons; no trophies, points, season outcomes or completed Showdown wins survive from that ended-early entry. |
| Tests and hidden IDs | Actual loader controls with `testRunsOnly:true` or all relevant hidden IDs produce empty careers for both roles, despite supplied live seasons. Existing real/test contracts pass. Historical marker/reveal and stale-mode findings remain excluded. |
| Data exists versus unavailable | Healthy verified completed controls render ready across the requested screens. The transfer reader independently verifies both-role history/provenance; it does not gate score/trophy availability (`js/sparkCompletedTransferHistoryReader.js:8–11`). Its unavailable transfer placeholder is not a visible numerical scoreboard failure in the current Rivalry renderer. No additional unavailable defect was established; #957/#959/#967 and #958/#964 remain applicable. |

The completed-only arithmetic matrix uses four legal finished games:

| Seasons in game | Points D/N | Trophies D/N | CL D/N | EL D/N | League D/N | Cup D/N | Season W-D-L D / N | Showdown result |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 9 / 9 | 3 / 3 | 1 / 1 | 0 / 0 | 1 / 1 | 1 / 1 | 0-1-0 / 0-1-0 | Draw |
| 3 | 21 / 19 | 7 / 7 | 2 / 1 | 1 / 2 | 2 / 2 | 2 / 2 | 1-1-1 / 1-1-1 | Daniel |
| 5 | 35 / 22 | 11 / 8 | 3 / 1 | 1 / 3 | 4 / 2 | 3 / 2 | 3-1-1 / 1-1-3 | Daniel |
| 10 | 70 / 44 | 22 / 16 | 6 / 2 | 2 / 6 | 8 / 4 | 6 / 4 | 6-2-2 / 2-2-6 | Daniel |
| **Career, 19 seasons** | **135 / 94** | **43 / 34** | **12 / 5** | **4 / 11** | **15 / 9** | **12 / 9** | **10-5-4 / 4-5-10** | **D: 3W-1D-0L; N: 0W-1D-3L** |

These exact combined category values were checked in the actual Trophy Room tabs and Career Statistics table at both viewport sizes. The model/renderer matrix is not four new full two-player provider playthroughs.

## Validation record

- PASS: `tests/contracts/europa-league-season-screens-contracts.cjs` (**8**); `r80-europa-career-pages-contracts.cjs` (**7**); `europa-league-scoring-parity-contracts.cjs` (**13 checks / 192 cases / 6 scorers**).
- PASS: `shared-career-analytics-contracts.cjs` (**18**); `closed-showdown-adapter-contracts.cjs` (**25**); `completed-showdown-read-contracts.cjs`; `completed-transfer-history-contracts.cjs`; `career-screen-seam-contracts.cjs` (**17**).
- PASS: `standings-this-showdown-midway-contracts.cjs`; `career-screens-v10-contracts.cjs` (**12**); `v10-rivalry-legacy-contracts.cjs` (**17**); `r80-ce2pg-career-pages-contracts.cjs` (**15**); `r80-real-vs-test-contracts.cjs` (**10**); `completed-showdown-wins-contracts.cjs`.
- PASS: `tests/browser/phone-trophy-room-data-audit.cjs`, all three requested sizes; independent desktop/phone tab/table/Standings/Rivalry browser probe, zero page errors; unchanged-module source-path F1 reproduction and independent counter/prefix/closure/exclusion controls.
- PASS: `tests/firebase/completed-showdown-read-emulator.cjs` (**64**), then `saved-showdowns-still-open-emulator.cjs` (**5 captures / 42 checks**), sequentially on an isolated Firestore emulator with unchanged composed Rules blob **`13cab80a76979299fcac195da925fa984c51d8a5`**. SDK **12.17.0**, Firebase CLI **15.28.1**, Firestore emulator **1.22.0**. No deployed Rules readback is claimed.
- POS20 route: **`POS20_DOC_ONLY`**, zero selected product contracts, required **`V10_FLASH_BROWSER`**. The unchanged V10 screen-flash audit **PASS** at portrait, landscape and desktop, including double taps, reduced motion and additional Club checks. Its nonblocking tap-feedback observation is outside this data audit.

Why these tests can pass: `shared-career-analytics-contracts.cjs` explicitly expects active/completion-pending points to count (cases 8–9); `closed-showdown-adapter-contracts.cjs` tests that behavior and later abandonment removal (C8/C15). Conversely, the midway Standings contract explicitly requires the progression-only career input to exclude live counters. Neither compares those two healthy source states against one finished-career oracle. The requested phone audit supplies one already verified completed model and checks ranks/records; it does not test live eligibility or all category tabs. Its passing result therefore does not cover F1.

Initial scratch attempts had a mistaken saved-fixture trophy expectation and an ambiguous ALL DOM selector; both harness mistakes were corrected without changing application code or expectations about gameplay. Initial emulator configuration referenced Rules outside its config directory and was rejected before tests; the successful run used a byte-identical Rules copy inside `work/job4/`. No failed setup is counted as an application defect. Only this report is proposed; no merge or deployment.
