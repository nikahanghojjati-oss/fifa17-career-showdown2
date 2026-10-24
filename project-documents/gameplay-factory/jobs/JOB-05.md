# JOB-05 · Active Showdown adapter (Rivalry, Continue, tiebreak, final state)

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode: terminal, node 24) | JOB-03 merged into `gameplay/recovery-v1` | 7 | `gameplay/job-05-active-adapter` | `gameplay/recovery-v1` | no |

## 1. Goal

Build `js/sharedActiveShowdownAdapter.js`: one pure module that takes what the live providers already know about the current Showdown and turns it into the agreed screen data for Rivalry Statistics, the Home Continue line, the Season Results tiebreak and the Final winner state (including "completion pending"). Today those screens read the old browser-local `currentShowdown`, so Daniel's and Nik's phones can disagree. After this job every number for the current Showdown comes from the shared provider, both phones see the same thing, a Showdown only counts as won after the real Terminal Close, and Nik never sees Daniel's season inputs before the game reveals them. Team V's Home, Rivalry, Season Results and Final winner screens bind to this output.

## 2. Branches and files

- Code branch `gameplay/job-05-active-adapter` (the lead cut it from `gameplay/recovery-v1` after job 3 merged). Push code there. Open a PR into `gameplay/recovery-v1` titled `Job 5: active Showdown adapter`.
- If Work mode cannot run a command (see `smoke/CAPABILITIES_WORK.md`), use the CI path in WORKER_HANDBOOK.md §7: commit to the code branch and read "Validate Gameplay Fast" on your exact head commit.
- Create:
  - `tests/support/active-showdown-fixtures.cjs` (given in full in section 6; copy it exactly)
  - `tests/contracts/shared-active-showdown-adapter-contracts.cjs`
  - `js/sharedActiveShowdownAdapter.js`
- Edit (step 6 only, registry lines; change nothing else in them):
  - `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`: append one entry.
  - `tests/operations/pos20-control-plane.test.mjs`: add one constant next to line 66 and append it as the **last** item of `expectedSupplementalContracts` (line 70). Without this the operations test `POS20 supplemental registry owns all registered contracts` (line 75) fails, because it `deepEqual`s the registry against that list.
- Status: `project-documents/gameplay-factory/status/JOB-05.md` on `factory/gameplay-v1`.
- Change nothing else. Do not touch `index.html`, `service-worker.js`, any `production*.js` / `spark*.js` provider, any screen script (`statistics.js`, `screens.js`, `optionalModules.js`, `onlinePlayerIdentity.js`, `persistentNikDanielPair.js`), job 3's `js/sharedCareerAnalytics.js`, or any Rules file. No contract needs the new module in `index.html` or the service worker; job 3's module is not listed there either. Wiring is a later job.

**Guards you will meet (checked, all fine if you follow this):**
- `tests/contracts/statistics-architecture.cjs:63-64` fails if a second file in `js/` has "analytics" in its name. The name `sharedActiveShowdownAdapter.js` is allowed. Do not name anything `*analytics*`.
- `tests/contracts/release-shell-coherence-contracts.cjs:28-31` reads every `js/*.js` and fails on the strings `1.8.1-r0` or `1.8.0-r0`. Do not write them.
- `scripts/pos10-syntax.mjs:15` runs `node --check` on every file in `js/`. The module must be valid script syntax (no `import`/`export`).

Read first (all on `gameplay/recovery-v1` unless named):

1. The data contract `project-documents/leads/DATA_CONTRACT_V1.md` on `leads/relay`: sections 0, 1, 3, 4, 5. Field names there are binding.
2. Job 3's model `js/sharedCareerAnalytics.js` (158 lines): `seasonTiebreak` (lines 21-27, takes one projection `seasonHistory` item), `buildCareerModel` input (lines 33-49, 104-105) and `seasonRow` (lines 66-69). You reuse `seasonTiebreak`; you never re-implement it. Copy the module wrapper (lines 1-5) and freeze helper (line 16).
3. `js/sharedHistoryConvergence.js`: `seasonHistory` item shape (line 102), projection shape (line 109), `verifyProjection` (lines 111-115), `managerRecords` fields (line 87). `buildProjection` needs at least one season (line 97), so a Showdown with 0 accepted seasons has **no** projection.
4. Live provider states (what the caller will pass you, one snapshot each):
   - Identity: `CareerModeOnlinePlayerIdentity.getState()`, `js/onlinePlayerIdentity.js:7` (shape), `:49` (statuses `offline`, `connecting`, `signed-out`, `device-error`, `choose-manager`, `ready`, `error`), `:3` (`daniel`/`nik`).
   - Pair: `CareerModePersistentNikDanielPair.getState()`, `js/persistentNikDanielPair.js:20` (shape: `status, initialized, busy, managerRole, managerId, rivalryId, connectionState, …`), `:131` (`paired`, `recovery-required`, `waiting`, `unpaired`, `signed-out`, `unavailable`), `:9-14` (`playerOne`=`daniel`, `playerTwo`=`nik`). Transient statuses: `idle`, `starting`, `joining`, `continuing`, `retrying-link`, `abandoning`, `pair-link-retry`; failure: `error`, `save-required` (`:72,102,144-148,192`).
   - Multi-season: `CareerModeProductionSharedMultiSeasonProgression.getState()`, `js/productionSharedMultiSeasonProgression.js:138,152`; shape `{ok, authoritative, phase: "SEASON_READY"|"SHOWDOWN_COMPLETE", rivalryId, state}` from `js/sparkSharedMultiSeasonProgression.js:101`; `state` fields from `js/sharedMultiSeasonProgression.js:44` (`totalSeasons, acceptedSeasons, activeSeason, leagueId, fixedClubs, acceptedRevisionKey, terminal`). Exists even with 0 accepted seasons.
   - History: `CareerModeProductionSharedHistoryConvergence.getState()`, `js/productionSharedHistoryConvergence.js:99`; shape `{ok, authoritative, phase: "HISTORY_CONVERGED", rivalryId, throughSeason, projection}` from `js/sparkSharedHistoryConvergence.js:75`. **Two gaps you design around:** it is `null` while the current season is not yet committed (`productionSharedHistoryConvergence.js:48-51,85`), and it cannot read a closed rivalry at all (`sparkSharedHistoryConvergence.js:34`). So the caller may pass the last verified history view it kept in memory; your checks in section 4 decide whether it is still usable.
   - Final reconciliation: `CareerModeProductionSharedFinalReconciliation.getState()`, `js/productionSharedFinalReconciliation.js:44,77`; reconciled shape at `js/sharedFinalReconciliation.js:49`, checked by `verifyProjection` (`:51-58`). It depends on a **local** phase (`sharedFinalReconciliation.js:43`), so Sol's ruling (S2C-005R2 §1: "do not derive the completion state from a local phase") means you may only cross-check it, never require it.
   - Terminal Close: `CareerModeProductionSharedTerminalClose.getState()`, `js/productionSharedTerminalClose.js:30,193`; phases `CLOSED` (`:112,135`, carries `terminalWitness`), `BLOCKED` (`:124`), `READY` (`:126`), `RECOVERY_PENDING` (`:148`). Only `CLOSED` with a witness that passes `CareerModeSharedTerminalClose.verifyIntent` (`js/sharedTerminalClose.js:15-28`) means completed.
   - Season results: `CareerModeProductionSharedSeasonResults.getState()`, `js/productionSharedSeasonResults.js:73,152`; shape `{ok, revision, state: {phase: "COLLECTING"|"RESULTS_READY", publishedRoles, …} | null, managerRole, seasonNumber, ownResult, opponentResult, allResults}` from `js/sparkSharedSeasonResults.js:112,146`. The rival's result is only real once `state.phase === "RESULTS_READY"` (`js/sharedSeasonResults.js:70`).
5. `tests/contracts/shared-career-analytics-contracts.cjs` (job 3): how a contract test is written here, including the purity and browser (`vm`) checks in its case 16.

## 3. Rules that apply (product truth; do not change)

- Two managers only. Output keys are `daniel` and `nik`; `playerOne` → `daniel` (always the left column), `playerTwo` → `nik`. Never key by account, profile or save id, and never copy those ids into a view model.
- Scoring never changes and you never compute it: every score, breakdown and season winner comes from the verified projection (Champions League 5, title 3, cup 1, performance 1, awards 1, max 11). The only rename is `individualAwardsBonus` → `awardsBonus`.
- Season winner and `tiebreak` come from the projection and job 3's `seasonTiebreak`. Final winner is totals only (equal = draw); `margin` = absolute points difference, 0 for a draw.
- **Privacy.** No view model ever contains the rival's season inputs before the provider says `RESULTS_READY`, even if a bad or stale state object carries them. Never copy a provider `state` object through; pick fields.
- Completed means a verified Terminal Close witness. Reconciled but not closed is `completion-pending`. Closed without a witness is abandoned and counts for nothing.
- Pure: no `localStorage`, `sessionStorage`, `indexedDB`, `document`, `window`, `currentShowdown` global, `getState()` calls, event listeners, timers, `Date.now()` or randomness. Everything arrives as one argument. Never throw on bad input: return `loading` or `unavailable`.

## 4. The API to build

```js
// Browser: window.CareerModeSharedActiveShowdownAdapter; Node: module.exports
buildActiveShowdownViews(snapshot) -> frozen { classification, home, rivalry, seasonResults, finalWinner, careerInput }
classifyCurrentShowdown(snapshot) -> classification string
homeView(snapshot), rivalryView(snapshot), finalWinnerView(snapshot), careerInput(snapshot) -> frozen objects
seasonResultsView(snapshot, { season } = {}) -> frozen object
// snapshot = { identity, pair, multiSeason, history, finalReconciliation, terminalClose, seasonResults }  (any may be null)
```

Dependencies: in Node `require("./sharedHistoryConvergence.js")`, `require("./sharedCareerAnalytics.js")`, `require("./sharedTerminalClose.js")`, `require("./sharedFinalReconciliation.js")`; in the browser the globals `CareerModeSharedHistoryConvergence`, `CareerModeSharedCareerAnalytics`, `CareerModeSharedTerminalClose`, `CareerModeSharedFinalReconciliation` (pattern: `js/sharedTerminalClose.js:1-5`).

**Current rivalry id** `rid` = `pair.rivalryId` if it is a string, else `terminalClose.rivalryId` when `terminalClose.phase === "CLOSED"`, else `null`. A source whose `rivalryId` differs from `rid` is stale: treat it as absent (never an error).

**Usable projection `P`:** `history.ok === true`, `history.authoritative === true`, `history.phase === "HISTORY_CONVERGED"`, `verifyProjection(history.projection)` does not throw, and `projection.rivalryId === rid`. If a matching `multiSeason` (`ok`, `authoritative`, same `rivalryId`) exists: equal `acceptedSeasons` but different `acceptedRevisionKey`, `leagueId`, `totalSeasons` or clubs → `P` is **invalid**; different `acceptedSeasons` → `P` is **behind** (treated as absent).

**Classification**, first rule that matches wins:

| # | Condition | `classification` |
| --- | --- | --- |
| 1 | `terminalClose.phase === "CLOSED"`, `terminal === true`, rivalry matches, and the witness passes `verifyIntent`, and (no `P`, or `P.acceptedSeasons` equals witness `totalSeasons` and `P` totals equal witness `managerTotals`). If the phase is `CLOSED` for this rivalry but any of those checks fails, the result is `unavailable` instead. | `completed` |
| 2 | `pair` missing, `pair.initialized !== true`, or `pair.status` transient | `loading` |
| 3 | `pair.status` is `signed-out`, `unavailable`, `error` or `save-required`; or identity `ready` with a `managerId` different from `pair.managerId` | `unavailable` |
| 4 | `pair.status === "unpaired"` or `rid === null` | `none` |
| 5 | `pair.connectionState === "pending-pair"` | `pending` |
| 6 | `pair.connectionState === "closed"` | `abandoned` |
| 7 | `connectionState === "active"` and `P` invalid | `unavailable` |
| 8 | active, `P` usable, `P.acceptedSeasons === P.totalSeasons`, and matching `multiSeason` (if any) is `SHOWDOWN_COMPLETE`. If a matching `finalReconciliation` with `phase "FINAL_SEASON_RECONCILED"` exists, it must pass `verifyProjection` and agree on `acceptedRevisionKey`, `managerTotals` and `winner`, else `unavailable` | `completion-pending` |
| 9 | active, `P` usable | `active` |
| 10 | active, no matching `history` at all, matching `multiSeason.state.acceptedSeasons === 0` | `active` (no seasons yet) |
| 11 | active, no `P` otherwise | `loading` |
| 12 | anything else | `unavailable` |

**`home`** (contract §1):

```js
{ status, viewerRole, continue: { state, leagueId, clubs: { daniel, nik }, season, totalSeasons, score: { daniel, nik } } }
```

- `viewerRole`: identity `ready` and `managerId` is `daniel`/`nik` → that id; else `pair.managerId` if valid; else `null`.
- `continue.state`: `pair.status` if it is `paired`, `waiting`, `recovery-required` or `unpaired`; otherwise `null`. `status`: `loading` for classification `loading`, `unavailable` for `unavailable`, else `ready`.
- `leagueId`, `clubs`, `season`, `totalSeasons` come from the matching `multiSeason.state` only when `continue.state` is `paired` or `recovery-required` (`clubs` from `fixedClubs`; `season` = `activeSeason`, or `totalSeasons` when terminal). Otherwise `null`.
- `score`: from `P` (`managerRecords.*.totalPoints`) when usable; `{ daniel: 0, nik: 0 }` only when classification 10 applies; otherwise `null`. Never invent 0.

**`rivalry`** (contract §5):

```js
{ status, leagueId, clubs: { daniel, nik }, season, totalSeasons, score: { daniel, nik },
  managers: { daniel: { seasonWins, seasonDraws, seasonLosses, championsLeagues, leagueTitles, domesticCups, totalTrophies,
                        hundredPointSeasons, hundredGoalSeasons, topScorerSeasons, topAssistSeasons, perfectSeasons, bestSeasonScore }, nik: {…} },
  seasons: [ { season, score: { daniel, nik }, winner, leaguePosition: { daniel, nik }, leaguePoints: {…}, leagueGoals: {…} } ],
  transfers: { status: "unavailable" } }
```

- `status`: `ready` when `P` is usable (classifications `active`, `completion-pending`, `completed`); `empty` for `none`, `pending`, `abandoned` and classification 10 (then `managers` counts are 0, `bestSeasonScore` `null`, `seasons` `[]`, `score` `{0,0}` for 10, else `null`); `loading` / `unavailable` mirror the classification; `completed` without `P` → `unavailable`. With `loading`/`unavailable` every field except `status` and `transfers` is `null` and `seasons` is `[]`.
- Managers copy `P.managerRecords` fields 1:1. `seasons` rows have exactly these keys and must equal job 3's `seasonRow` minus `tiebreak`. `season`: `multiSeason.state.activeSeason`, or `totalSeasons` when terminal or completed. `transfers` stays `unavailable` until job G-10.

**`seasonResults`** (contract §3), for `season` = the argument, else `seasonResults.seasonNumber`, else `multiSeason.state.activeSeason`; `null` if none is known:

```js
{ status, season, phase, viewerRole,
  inputs: { daniel: Result | null, nik: Result | null },        // Result = the seven input fields, nothing else
  breakdown: { daniel: { championsLeague, leagueTitle, domesticCup, performanceBonus, awardsBonus, total }, nik: {…} } | null,
  winner: "daniel" | "nik" | "draw" | null,
  tiebreak: "none" | "league-position" | "league-points" | "draw" | null }
```

- `committed`: that season is in `P.seasonHistory` → both inputs, `breakdown`, `winner` and `tiebreak` from that item (`tiebreak` = `seasonTiebreak(item)`).
- `results-ready`: not committed, `seasonResults` matches rivalry and season, `state.phase === "RESULTS_READY"` and `allResults` has both roles → both inputs; `breakdown`, `winner`, `tiebreak` `null`.
- `waiting-for-rival`: `state.phase === "COLLECTING"` and `publishedRoles` includes the viewer's role → own input only; rival `null`.
- `entering`: anything else that matches; both inputs `null` (drafts are local and never shown here).
- The viewer's role comes from `seasonResults.managerRole`, which must equal the pair's `managerRole`; if not, `status: "unavailable"` with every field `null`. Read `ownResult` only; read `opponentResult`/`allResults` only in the `results-ready` rule. Copy only the seven input keys.
- `status`: `ready` when a phase is set, else `loading`.

**`finalWinner`** (contract §4):

```js
{ status, state, totals: { daniel, nik }, winner, margin, seasonsPlayed,
  trophies: { daniel: { championsLeague, leagueTitles, domesticCups, total }, nik: {…} } }
```

- `completion-pending`: `status ready`, `state "completion-pending"`, totals from `P`, winner by totals only, `seasonsPlayed = P.acceptedSeasons`, trophies from `P.managerRecords` (`championsLeagues` → `championsLeague`, `totalTrophies` → `total`).
- `completed` with `P`: same with `state "completed"`, totals from the witness (they equal `P`). Without `P`: `status "partial"`, totals, winner, margin from the witness, `seasonsPlayed = witness.totalSeasons`, `trophies: null`.
- Other classifications: `status` `empty` (`none`, `pending`, `active`, `abandoned`), or `loading`/`unavailable`; every other field `null`.

**`careerInput`** (exactly what job 3's `buildCareerModel` accepts):

```js
{ indexStatus: "loading" | "unavailable" | "ready", showdowns: [ { rivalryId, classification, projection, final } ] | [], currentShowdownOnly: true }
```

- `loading`/`unavailable` classification → that `indexStatus`, `showdowns: []`. `none` and classification 10 → `ready`, `[]`.
- `pending` → `{ rid, "pending", null, null }`; `abandoned` → `{ rid, "abandoned", null, null }` even if a projection was supplied; `active` → `{ rid, "active", P, null }`; `completion-pending` / `completed` → `{ rid, classification, P, { totals: { playerOne, playerTwo }, winner } }`; `completed` without `P` → `{ rid, "unavailable", null, null }`.
- Pass `P` itself (the verified projection object), never a copy you edited.

### Lead decisions (2026-10-02)

- The caller may keep the last verified history view in memory, keyed by rivalry id and cleared when the signed-in account changes; your usability checks decide whether it still counts. Wiring that cache is a later job (G-13), not this one.
- An active Showdown with 0 accepted seasons gives `careerInput.showdowns: []`, so the career model reads `empty` with the interim label. That is correct.
- Home tiles (`tiles.*.available` / `reason`) are not in this job; G-13 owns them.
- `rivalry.transfers.status` stays `"unavailable"` until G-10.
- `seasonResults.breakdown` is nested per manager (`breakdown.{daniel,nik}.{…,total}`) and `null` until committed. The lead tells Team V.
- During pair transitions (`continuing`, `retrying-link`, …) Home is `loading` with `continue.state: null`. Smoothing that is a screen concern for G-13.

## 5. Steps

After each step update `status/JOB-05.md` and push it to `factory/gameplay-v1` with `Job 5 step k/7: <step name>`. Push code to `gameplay/job-05-active-adapter` as you go.

1. **Baseline.** Check out the code branch, confirm `js/sharedCareerAnalytics.js` exists (job 3 merged; if not, set BLOCKED), `npm ci`, `npm run test:contracts`. Record the last line (`… 97/97 …`) and `npm run test:ops` (`pass 73`).
2. **Fixtures.** Create `tests/support/active-showdown-fixtures.cjs` exactly as in section 6. Run `node tests/support/active-showdown-fixtures.cjs`; it must print `CLOSED 5 playerOne SHOWDOWN_COMPLETE`.
3. **Failing tests first.** Write `tests/contracts/shared-active-showdown-adapter-contracts.cjs` with every case in section 7 (style of job 3's contract: `check(name, fn)`, one final `console.log("PASS …")`). Create `js/sharedActiveShowdownAdapter.js` with only the module wrapper and functions that throw `"not implemented"`. Run the test; it must fail. Commit and push both ("tests first").
4. **Adapter.** Implement section 4 until the test passes. Freeze outputs deeply; never freeze or mutate the caller's objects (freeze your own copies; `P` inside `careerInput` is the provider's already-frozen projection).
5. **Agreement check.** Add case 19: for a 3-season active Showdown, `rivalry.managers.*` equals `buildCareerModel(careerInput(snapshot)).managers.*` for every shared field (`seasonWins`, `seasonDraws`, `seasonLosses`, `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies`, `hundredPointSeasons`, `hundredGoalSeasons`, `topScorerSeasons`, `topAssistSeasons`, `perfectSeasons`, `bestSeasonScore`), and `rivalry.score.*` equals `careerPoints`. Run.
6. **Register.** Append to the `tests` array of `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (keep its formatting):
   ```json
   {
     "path": "tests/contracts/shared-active-showdown-adapter-contracts.cjs",
     "patterns": [
       "^js/sharedActiveShowdownAdapter\\.js$",
       "^js/sharedCareerAnalytics\\.js$",
       "^js/sharedHistoryConvergence\\.js$",
       "^js/sharedTerminalClose\\.js$",
       "^js/sharedFinalReconciliation\\.js$",
       "^tests/support/active-showdown-fixtures\\.cjs$",
       "^tests/support/career-fixture-helpers\\.cjs$",
       "^tests/contracts/shared-active-showdown-adapter-contracts\\.cjs$",
       "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
     ]
   }
   ```
   In `tests/operations/pos20-control-plane.test.mjs` add `const sharedActiveShowdownAdapterContract='tests/contracts/shared-active-showdown-adapter-contracts.cjs';` after line 66 and append `sharedActiveShowdownAdapterContract` as the last item of `expectedSupplementalContracts`. Run `npm run test:contracts` (now `98/98`) and `npm run test:ops` (`pass 73`, `fail 0`). Push. Wait for "Validate Gameplay Fast" green on your exact head. Open the PR.
7. **Finish.** Fill the Done checklist, set State: DONE with branch, head SHA, PR link, push `Job 5 done: Active Showdown adapter`.

## 6. `tests/support/active-showdown-fixtures.cjs` (copy exactly)

```js
"use strict";
const path=require("node:path");
const Final=require(path.join(__dirname,"../../js/sharedFinalReconciliation.js"));
const Terminal=require(path.join(__dirname,"../../js/sharedTerminalClose.js"));
const {result,projection,finalFor}=require("./career-fixture-helpers.cjs");
const SESSION="session_"+"c".repeat(64);
const roleOf=managerId=>managerId==="nik"?"playerTwo":"playerOne";
// CareerModeOnlinePlayerIdentity.getState() when ready (js/onlinePlayerIdentity.js:49)
function identity(managerId="daniel"){return {status:"ready",initialized:true,busy:false,online:true,accountId:"acct_"+managerId,managerId,managerLabel:managerId==="nik"?"Nik":"Daniel",deviceId:"device_"+"d".repeat(32),registered:true,message:"Welcome."};}
// CareerModePersistentNikDanielPair.getState() (js/persistentNikDanielPair.js:20,131)
function pair(rivalryId,overrides={}){const managerId=overrides.managerId||"daniel";return {status:"paired",initialized:true,busy:false,accountId:"acct_"+managerId,deviceId:"device_"+"d".repeat(32),managerRole:roleOf(managerId),managerId,rivalryId,connectionState:"active",providerSaveId:null,providerProfileId:null,capability:null,message:"",...overrides};}
// CareerModeProductionSharedMultiSeasonProgression.getState() (js/sparkSharedMultiSeasonProgression.js:101; state from js/sharedMultiSeasonProgression.js:44)
function multi({rivalryId,leagueId="premier_league",totalSeasons=3,clubs={playerOne:"club_a",playerTwo:"club_b"},acceptedSeasons=0,acceptedRevisionKey=""}){const terminal=acceptedSeasons===totalSeasons,phase=terminal?"SHOWDOWN_COMPLETE":"SEASON_READY";return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",phase,revision:acceptedSeasons,rivalryId,managerRole:"playerOne",state:{schemaVersion:1,runtimeRevision:"1.9.1-r13",phase,revision:acceptedSeasons,rivalryId,setupRevision:6,leagueId,totalSeasons,acceptedSeasons,activeSeason:terminal?null:acceptedSeasons+1,completedSeason:acceptedSeasons||null,fixedClubs:{...clubs},acceptedRevisionKey,terminal,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false},dashboard:null};}
function multiFor(p){return multi({rivalryId:p.rivalryId,leagueId:p.leagueId,totalSeasons:p.totalSeasons,clubs:{playerOne:p.managerRecords.playerOne.club,playerTwo:p.managerRecords.playerTwo.club},acceptedSeasons:p.acceptedSeasons,acceptedRevisionKey:p.acceptedRevisionKey});}
// CareerModeProductionSharedHistoryConvergence.getState() (js/sparkSharedHistoryConvergence.js:75)
function history(p){return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r12",phase:"HISTORY_CONVERGED",revision:1,rivalryId:p.rivalryId,managerRole:"playerOne",throughSeason:p.acceptedSeasons,acceptedRevisionKey:p.acceptedRevisionKey,projection:p};}
// CareerModeProductionSharedFinalReconciliation.getState() when reconciled (js/sharedFinalReconciliation.js:49)
function finalReconciliation(p,totals){const a=totals?totals.playerOne:p.managerRecords.playerOne.totalPoints,b=totals?totals.playerTwo:p.managerRecords.playerTwo.totalPoints;return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:p.rivalryId,leagueId:p.leagueId,totalSeasons:p.totalSeasons,acceptedSeasons:p.totalSeasons,completedSeason:p.totalSeasons,acceptedRevisionKey:p.acceptedRevisionKey,fixedClubs:{playerOne:p.managerRecords.playerOne.club,playerTwo:p.managerRecords.playerTwo.club},managerTotals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};}
// CareerModeProductionSharedTerminalClose.getState() after a verified close (js/productionSharedTerminalClose.js:112,135)
function closed(p,totals){const intent=Terminal.prepare(finalReconciliation(p,totals),{sessionId:SESSION});return {phase:"CLOSED",rivalryId:p.rivalryId,sessionId:SESSION,rivalryRevision:9,sessionRevision:4,terminal:true,terminalWitness:JSON.parse(JSON.stringify(intent)),replayed:false,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
// CareerModeProductionSharedSeasonResults.getState() (js/sparkSharedSeasonResults.js:112,146; js/productionSharedSeasonResults.js:73)
function seasonResults({rivalryId,seasonNumber,managerRole="playerOne",phase=null,published=[],own=null,opponent=null}){const state=phase?{phase,revision:published.length,publishedRoles:[...published],operationIds:[],operationHashes:[],baseRevisions:[],actorRoles:[...published]}:null,ready=phase==="RESULTS_READY",other=managerRole==="playerOne"?"playerTwo":"playerOne";let allResults=null;if(ready&&own&&opponent){allResults={};allResults[managerRole]=own;allResults[other]=opponent;}return {ok:true,revision:state?state.revision:0,state,managerRole,seasonNumber,ownResult:own,opponentResult:opponent,allResults,setup:null,rivalryId};}
module.exports={SESSION,identity,pair,multi,multiFor,history,finalReconciliation,closed,seasonResults,result,projection,finalFor};
if(require.main===module){const p=projection({totalSeasons:1,seasons:[[result({championsLeague:true}),result()]]});Final.verifyProjection(finalReconciliation(p));const c=closed(p);Terminal.verifyIntent(c.terminalWitness);console.log(c.phase,c.terminalWitness.managerTotals.playerOne,c.terminalWitness.winner,multiFor(p).phase);}
```

Note: `seasonResults({phase:"COLLECTING", opponent: …})` deliberately lets you build a **bad** state that carries the rival's input too early; real providers never do this, and the adapter must ignore it.

## 7. Test cases (write all of them in step 3, before the adapter)

Each is one `check` block with clear assertion messages. "Snapshot" means `{identity, pair, multiSeason, history, finalReconciliation, terminalClose, seasonResults}` built from the fixtures; `views` = `buildActiveShowdownViews(snapshot)`.

1. **Left/right.** A season where Daniel (`playerOne`) wins 8-3: every `daniel` field in `home`, `rivalry`, `seasonResults` and `finalWinner` carries `playerOne` data. A snapshot for viewer `nik` gives the same numbers in the same keys; only `viewerRole` differs.
2. **Rivalry from the provider.** 2 of 3 seasons accepted: `rivalry.status` `ready`, `season` 3, `totalSeasons` 3, `leagueId`, `clubs`, `score` = `managerRecords.*.totalPoints`, all 13 manager fields equal `managerRecords`, `seasons` deep-equals job 3's history rows for the same projection with `tiebreak` removed. No key other than those in section 4 exists (check `Object.keys`).
3. **Rivalry states.** Pair not initialized → `loading`; paired with `multi` at 0 accepted and `history` null → `empty` with `seasons` `[]` and `score` `{0,0}`; pair `waiting`/`pending-pair` → `empty` with `score` null; tampered projection (JSON-clone it, change one `totalPoints`) → `unavailable`.
4. **Stale and lagging sources.** A `history` for another rivalry id is ignored (status `loading` when `multi` says 1 accepted). A `history` at 1 season while `multi` says 2 → `loading`, never the old score. Same count but different `acceptedRevisionKey` → `unavailable`.
5. **Home Continue line.** Paired, season 2 of 5, scores 6-4: `home` equals exactly `{status:"ready", viewerRole:"daniel", continue:{state:"paired", leagueId, clubs, season:2, totalSeasons:5, score:{daniel:6,nik:4}}}`. `waiting`, `recovery-required`, `unpaired` give that `state` (of these only `recovery-required` keeps league, clubs and season); every transient status (`idle`, `starting`, `joining`, `continuing`, `retrying-link`, `abandoning`, `pair-link-retry`) gives `status:"loading"`, `state:null`; `signed-out`, `unavailable`, `error`, `save-required` give `status:"unavailable"`. Identity `nik` with pair `daniel` → `unavailable`.
6. **Season Results phases.** For season 2 of 3 (season 1 committed): no own result → `entering`, both inputs null; own published (`COLLECTING`) → `waiting-for-rival`, own inputs equal what was published, rival null; `RESULTS_READY` → `results-ready`, both inputs, `breakdown`/`winner`/`tiebreak` null; season 1 → `committed` with `breakdown` and `total` from the projection. `breakdown.*` has `awardsBonus` and no `individualAwardsBonus` key. `seasonResults.managerRole` ≠ pair role → `unavailable`.
7. **Tiebreak.** Four committed seasons: different totals → `none`; equal totals, positions 2 vs 3 → `league-position`; equal totals and positions, 80 vs 78 points → `league-points`; all equal → `draw` with `winner` `draw`. Each equals `seasonTiebreak` of the same projection item, and `winner` matches the projection.
8. **No rival leak.** Rival input uses a sentinel nobody else uses (`leagueGoals: 287`). Build bad states: `COLLECTING` with `opponent` set; `COLLECTING` with `allResults` set by hand; `state: null` with `opponent` set; `seasonResults.managerRole` set to the rival's role (so `ownResult` holds the rival's input) while the pair says otherwise (must give `unavailable`). For viewer Daniel and viewer Nik, walk every value of `buildActiveShowdownViews(snapshot)` and of `seasonResultsView(snapshot)`: no value equals 287 and no object has `opponentResult`, `allResults`, `publishedRoles`, `operationIds`, `accountId`, `profileId` or `saveId` keys. Once `RESULTS_READY`, 287 does appear (proves the walk works).
9. **Completion pending.** All 3 seasons accepted, `multi` `SHOWDOWN_COMPLETE`, no Terminal Close: `classification` `completion-pending`; `finalWinner` `{status:"ready", state:"completion-pending", totals, winner, margin, seasonsPlayed:3, trophies}`. Same result with no `finalReconciliation`, with a matching one, and with Terminal Close `READY`, `BLOCKED` or `RECOVERY_PENDING`. A `finalReconciliation` whose `managerTotals` differ → `unavailable`. `buildCareerModel(careerInput)` shows `showdowns.completed` 0 and the history row `completion-pending`.
10. **Completed.** Add `closed(p)`: `classification` `completed`, `finalWinner.state` `completed`; `buildCareerModel(careerInput)` shows `showdowns.completed` 1 for both. A witness built with other totals (`closed(p,{playerOne:1,playerTwo:0})`) → `unavailable` everywhere and the model goes `partial`. A `CLOSED` state for another rivalry is ignored.
11. **Final is totals only.** Daniel wins 2 seasons, Nik 1, totals equal: `winner` `draw`, `margin` 0. Nik ahead by 4: `winner` `nik`, `margin` 4 (positive).
12. **Witness only.** `CLOSED` witness, no history: `finalWinner.status` `partial` with totals, winner, margin, `seasonsPlayed` from the witness and `trophies` null; `rivalry.status` `unavailable`; career entry classification `unavailable`.
13. **Trophies.** One CL and one title for Nik across the Showdown: `finalWinner.trophies.nik` is `{championsLeague:1, leagueTitles:1, domesticCups:0, total:2}`, and `score.nik` includes 8 points for them.
14. **Abandoned.** Pair `connectionState:"closed"`, no witness, but a history view carrying an 11-point Nik season: `classification` `abandoned`; career entry `{rivalryId, classification:"abandoned", projection:null, final:null}`; `rivalry.status` `empty`; `finalWinner.status` `empty`; the model's Nik `bestSeasonScore` is `null`.
15. **Career input.** `careerInput` for loading, unavailable, none, pending, 0 accepted seasons, active, completion-pending and completed matches section 4 exactly; `currentShowdownOnly` is always `true`; `buildCareerModel(careerInput(snapshot)).interimLabel` is exactly `"Current Showdown only. Career history is not yet available."`; the `projection` in an entry is the same object (`===`) as the verified history projection.
16. **Scoring unchanged.** A season with 101 points, 101 goals, top scorer and top assist plus CL, title and cup: `breakdown` is `{championsLeague:5, leagueTitle:3, domesticCup:1, performanceBonus:1, awardsBonus:1, total:11}`.
17. **Never throws.** `buildActiveShowdownViews()`, `({})`, `({pair:"x"})`, `({pair:{initialized:true,status:"paired",rivalryId:7}})` and a snapshot with `history.projection = {}` all return frozen objects with `loading` or `unavailable` statuses.
18. **Pure and frozen.** Output is deeply frozen; two calls give `deepEqual` output; the caller's snapshot is unchanged (`deepEqual` to a clone taken before) and not frozen by you. The source of `js/sharedActiveShowdownAdapter.js` does not match `/localStorage|sessionStorage|indexedDB|document\.|\bwindow\b|\bcurrentShowdown\b|getState\s*\(|addEventListener|setInterval|setTimeout|Date\.now|Math\.random/`. Setting `globalThis.localStorage` and `globalThis.currentShowdown` to conflicting fake data changes nothing. Loaded in a `vm` context with the four browser globals it exposes `CareerModeSharedActiveShowdownAdapter` and gives `deepEqual` output to Node.
19. (step 5) **Agreement with job 3.**

## 8. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The test failed before the adapter existed (commit link) and passes now.
- [ ] All 18 cases plus case 19 are present and pass.
- [ ] `npm run test:contracts` passes at 98/98; `npm run test:ops` passes with fail 0.
- [ ] "Validate Gameplay Fast" green on the exact head (run URL).
- [ ] Only the five files in section 2 changed (three new, two registry edits); no provider, screen, `index.html`, service worker, `sharedCareerAnalytics.js` or Rules file touched.
- [ ] No storage, DOM, globals or `getState()` calls in the adapter; output keys are `daniel` / `nik`; no account, profile or save id in any view.
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed.

## 9. When stuck

If the contract and this job disagree, this job wins for now: write the question in the status file and continue. If a provider shape in section 2 does not match the code, trust the code, cite the line in the status file and continue with the real shape. If the same step fails twice, set State: BLOCKED with the failing assertion and what you tried, push, and reply "Job 5 is blocked: <one line>".
