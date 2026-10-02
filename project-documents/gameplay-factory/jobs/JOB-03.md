# JOB-03 · Pure shared career model + tests

| Mode | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **Work mode** (terminal, node 24) | nothing | 7 | `gameplay/job-03-career-model` | `gameplay/recovery-v1` | no |

## 1. Goal

Build `js/sharedCareerAnalytics.js`: one pure function that turns verified Showdown histories into every number the History, Career Statistics and Trophy Room screens show, using the agreed data contract. Nik and Daniel must see the same totals on both phones, abandoned Showdowns must count for nothing, and no old browser-local data may ever change a number; a pure, fully tested model is how we guarantee that before any screen is switched on.

## 2. Branches and files

- Cut `gameplay/job-03-career-model` from `gameplay/recovery-v1`. Open a PR into `gameplay/recovery-v1` titled `Job 3: pure shared career model`.
- Create:
  - `tests/support/career-fixture-helpers.cjs` (given in full in section 6; copy it exactly)
  - `tests/contracts/shared-career-analytics-contracts.cjs`
  - `js/sharedCareerAnalytics.js`
- Edit: `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (append one entry, step 6).
- Status: `project-documents/gameplay-factory/status/JOB-03.md` on `factory/gameplay-v1`.
- Change nothing else. Do not touch `index.html`, `service-worker.js`, any screen script or any Rules file. Wiring the model into the app is a later job.

Read first:

1. The data contract, `project-documents/leads/DATA_CONTRACT_V1.md` on branch `leads/relay`: sections 0, 5, 6, 7, 8. Field names there are binding.
2. `js/sharedHistoryConvergence.js` (117 lines, on `gameplay/recovery-v1`). Your input projections come from its `buildProjection`. Note `hcManagerBase` and `hcAccumulate` (lines 88-94): your per-Showdown math must agree with them exactly. Copy its module wrapper style (lines 1-5) and its freeze helpers.
3. `js/sharedCanonicalScoring.js` lines 25-29: `scBreakdown` and `scWinner`, the scoring and season-tiebreak rules.
4. `tests/contracts/shared-history-convergence-contracts.cjs`: how a contract test in this repo is written (plain `node:assert/strict`, one `console.log("PASS …")` at the end, non-zero exit on failure).

## 3. Rules that apply (product truth; do not change)

- Two managers only. Output keys are `daniel` and `nik`. `playerOne` → `daniel`, `playerTwo` → `nik`. Never key by account, profile or save id.
- Scoring: Champions League 5, league title (position 1) 3, domestic cup 1, performance bonus 1 if league points ≥ 100 **or** league goals ≥ 100 (never 2), awards bonus 1 if top scorer **or** top assist (never 2). Season max 11. A season score of 11 is a "perfect season".
- Season winner: higher total; if equal, better (lower) league position; if equal, more league points; else draw.
- Final Showdown winner: higher total points; equal = draw. Season tiebreaks never apply to the final.
- Trophies are counts of wins: a Champions League win is 1 trophy and 5 points.
- What counts (Sol ruling, binding):

  | `classification` | Seasons count | Showdown outcome counts | History row |
  | --- | --- | --- | --- |
  | `pending` | no | no | not listed |
  | `active` | accepted seasons in its projection | no | `in-progress` |
  | `completion-pending` | all accepted seasons | no | `completion-pending` (totals and winner shown) |
  | `completed` | all accepted seasons | exactly one | `completed` |
  | `abandoned` | **none** | none | `abandoned`, status only: no totals, no winner, no seasons |
  | `unavailable` | none | none | `unavailable`; the whole model becomes `partial` |

- Abandoned Showdowns contribute to nothing: not points, not seasons, not bests, not averages, not trophies, not records. Rebuild from scratch; never subtract.
- Averages come from combined sums and counts across all counted seasons, never an average of per-Showdown averages. With 0 counted seasons an average or best is `null`.
- Never read `localStorage`, `sessionStorage`, `indexedDB`, `document`, `window.currentShowdown` or any global. The function gets everything as arguments.

## 4. The API to build

```js
// Browser: window.CareerModeSharedCareerAnalytics; Node: module.exports
buildCareerModel({ indexStatus, showdowns, currentShowdownOnly }) -> frozen object
seasonTiebreak(season) -> "none" | "league-position" | "league-points" | "draw"
```

Input:

- `indexStatus`: `"loading"` | `"unavailable"` | `"ready"`.
- `showdowns`: array, in career order (oldest first). Each entry: `{ rivalryId, classification, projection, final }`.
  - `projection`: the output of `sharedHistoryConvergence.buildProjection` (required for `active`, `completion-pending`, `completed`; `null` otherwise). Call `verifyProjection` on it; if it throws, treat that Showdown as `unavailable`.
  - `final`: for `completed` and `completion-pending`, `{ totals: { playerOne, playerTwo }, winner: "playerOne" | "playerTwo" | "draw" }` from the reconciled result / Terminal Close witness. If `final.totals` do not equal the projection's summed season totals, or `final.winner` does not follow the totals-only rule, treat that Showdown as `unavailable` (integrity failure; never pick one side).
- `currentShowdownOnly` (optional boolean): when true, the output carries `interimLabel: "Current Showdown only. Career history is not yet available."`; otherwise `interimLabel: null`.

Deduplication: the same `rivalryId` twice with identical projections counts once. The same `rivalryId` with different data for the same season number is an integrity failure: that Showdown becomes `unavailable`.

Output (all numbers are integers except averages; unknown = `null`):

```js
{
  status,                // "loading" | "unavailable" | "empty" | "partial" | "ready"
  interimLabel,          // string or null
  coverage: { readable, indexed },   // counts of Showdowns (pending excluded from both)
  managers: {
    daniel: { careerPoints, seasons, seasonWins, seasonDraws, seasonLosses,
              championsLeagues, leagueTitles, domesticCups, totalTrophies,
              hundredPointSeasons, hundredGoalSeasons, topScorerSeasons, topAssistSeasons,
              perfectSeasons, performanceBonuses, awardsBonuses,
              bestSeasonScore, bestLeaguePoints, bestLeagueGoals, bestLeaguePosition,
              averageSeasonScore, averageLeaguePoints, averageLeagueGoals,
              showdowns: { completed, wins, draws, losses } },
    nik: { …same… }
  },
  biggestShowdownWin,    // { manager: "daniel"|"nik", margin, showdownRef: rivalryId } or null (completed, non-draw only)
  trophyRoom: {
    cabinet: { daniel: { championsLeagues, leagueTitles, domesticCups, totalTrophies }, nik: {…} },
    standings: [ { manager, careerPoints, seasonWins }, … ],   // careerPoints desc, then seasonWins desc; if both equal, both rows get level: true
    records: [ { label, manager, value, ref } ]                // see below
  },
  history: {
    showdowns: [ { number, rivalryId, status, leagueId, clubs: { daniel, nik }, seasonsPlayed, totalSeasons,
                   totals: { daniel, nik } | null, winner: "daniel"|"nik"|"draw"|null,
                   seasons: [ { season, score: { daniel, nik }, winner, tiebreak,
                                leaguePosition: {daniel,nik}, leaguePoints: {daniel,nik}, leagueGoals: {daniel,nik} } ] } ]
  }
}
```

- `status`: `indexStatus` `loading` → `loading`; `unavailable` → `unavailable` (every number `null`, lists empty). `ready` with zero non-pending Showdowns → `empty`. `ready` with any `unavailable` Showdown → `partial`. Otherwise `ready`.
- `history.showdowns[].number` is the 1-based position among listed (non-pending) Showdowns in input order. For `active` Showdowns, `totals` are the accepted-season sums and `winner` is `null`. `clubs` come from the projection's `managerRecords.*.club`; for `abandoned` or `unavailable` rows without a projection, `leagueId`, `clubs`, `seasonsPlayed`, `totalSeasons` are `null`.
- `records` has exactly these five labels, in this order: `"Highest season score"`, `"Highest league points"`, `"Highest league goals"`, `"Biggest Showdown win"`, `"Most perfect seasons"`. `manager` is `"daniel"`, `"nik"` or `"shared"` (tie). `value` is the number (`null` if no data). `ref` is `{ rivalryId, season }` for season records, `{ rivalryId }` for the Showdown win, `null` for perfect seasons or when tied across different places.

## 5. Steps

After each step update `status/JOB-03.md` and push it to `factory/gameplay-v1` with `Job 3 step k/7: <step name>`. Push code to `gameplay/job-03-career-model` as you go.

1. **Baseline.** Clone, check out `gameplay/recovery-v1`, `npm ci`, `npm run test:contracts`. Record the last line (`… 96/96 …`).
2. **Helpers.** Create `tests/support/career-fixture-helpers.cjs` exactly as in section 6. Run `node tests/support/career-fixture-helpers.cjs`; it must print `2 11 1 playerTwo`.
3. **Failing tests first.** Write `tests/contracts/shared-career-analytics-contracts.cjs` with every case in section 7, using the helpers. Create `js/sharedCareerAnalytics.js` containing only the module wrapper and functions that throw `"not implemented"`. Run the test; it must fail. Commit and push both ("tests first").
4. **Model.** Implement `buildCareerModel` and `seasonTiebreak` until the test passes. No DOM, no storage, no globals, no `Date.now()`, no randomness. Freeze the output deeply.
5. **Agreement check.** Add one more test case: for a single `completed` Showdown, every per-manager field that also exists in `sharedHistoryConvergence` `managerRecords` (`seasons`, `seasonWins`, `seasonDraws`, `seasonLosses`, `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies`, `hundredPointSeasons`, `hundredGoalSeasons`, `topScorerSeasons`, `topAssistSeasons`, `perfectSeasons`, `bestSeasonScore`, `bestLeaguePoints`, `bestLeagueGoals`, `bestLeaguePosition`, and `careerPoints` = `totalPoints`) is equal to the projection's value. Run.
6. **Register.** Append this entry to the `tests` array in `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (keep the file's formatting):
   ```json
   {
     "path": "tests/contracts/shared-career-analytics-contracts.cjs",
     "patterns": [
       "^js/sharedCareerAnalytics\\.js$",
       "^js/sharedHistoryConvergence\\.js$",
       "^tests/support/career-fixture-helpers\\.cjs$",
       "^tests/contracts/shared-career-analytics-contracts\\.cjs$",
       "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
     ]
   }
   ```
   Run `npm run test:contracts` (now `97/97`) and `npm run test:ops`. Push. Wait for "Validate Gameplay Fast" on your exact head if Job 1 has been merged (otherwise write "fast CI not yet on base" in the status file). Open the PR.
7. **Finish.** Fill the Done checklist, set State: DONE with branch, head SHA, PR link, push `Job 3 done: Pure shared career model`.

## 6. `tests/support/career-fixture-helpers.cjs` (copy exactly)

```js
"use strict";
const path=require("node:path");
const History=require(path.join(__dirname,"../../js/sharedHistoryConvergence.js"));
function score(r){const championsLeague=r.championsLeague?5:0,leagueTitle=r.leaguePosition===1?3:0,domesticCup=r.domesticCup?1:0,performanceBonus=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,individualAwardsBonus=(r.topScorer||r.topAssist)?1:0;return {championsLeague,leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};}
function winner(a,b){const x=score(a).total,y=score(b).total;if(x>y)return"playerOne";if(y>x)return"playerTwo";if(a.leaguePosition<b.leaguePosition)return"playerOne";if(b.leaguePosition<a.leaguePosition)return"playerTwo";if(a.leaguePoints>b.leaguePoints)return"playerOne";if(b.leaguePoints>a.leaguePoints)return"playerTwo";return"draw";}
function result(o={}){return {leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...o};}
// seasons: array of [danielResult, nikResult]; seed: one hex char making a distinct rivalry id
function projection({seed="1",leagueId="premier_league",totalSeasons=3,seasons}){
  const rivalryId="pair_"+seed.repeat(64);
  const hash=n=>"sha256:"+String(n).padStart(64,"0");
  return History.buildProjection({rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,leagueId,clubs:{playerOne:"club_a",playerTwo:"club_b"}},
    managerSlots:[{slotId:"playerOne",accountId:"acct_daniel",profileId:"profile_"+"a".repeat(24),saveId:"save_"+"a".repeat(24),entitlementState:"active"},{slotId:"playerTwo",accountId:"acct_nik",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"b".repeat(24),entitlementState:"active"}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
// final result for a projection: totals-only winner rule
function finalFor(p){const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw"};}
module.exports={score,winner,result,projection,finalFor};
if(require.main===module){const p=projection({seasons:[[result({leaguePosition:1,leaguePoints:101,championsLeague:true,topScorer:true,topAssist:true,domesticCup:true}),result()],[result(),result({leaguePosition:2})]]});History.verifyProjection(p);console.log(p.acceptedSeasons,p.managerRecords.playerOne.totalPoints,p.managerRecords.playerOne.perfectSeasons,p.seasonHistory[1].winner);}
```

## 7. Test cases (write all of them in step 3, before the model)

Each is one block with a clear assertion message.

1. **Bonus caps.** A season with 101 points **and** 101 goals gives `performanceBonuses` 1 and a season score including exactly 1 performance point; top scorer **and** top assist gives `awardsBonuses` 1 and exactly 1 award point. A season with everything is 11 and counts as one perfect season.
2. **Trophy is not points.** One CL win: `championsLeagues` 1, `totalTrophies` 1, `careerPoints` includes 5.
3. **Season tiebreaks.** `seasonTiebreak` returns `none` (different totals), `league-position` (equal totals, different positions), `league-points` (equal totals and positions, different points), `draw` (all equal). The season `winner` in `history` matches.
4. **Final is totals only.** A completed Showdown with equal totals is a draw even if one manager won more seasons; `showdowns.draws` is 1 for both.
5. **Once only.** The same completed Showdown passed twice counts once (seasons, points, `coverage.indexed` 1).
6. **Conflict is integrity failure.** The same `rivalryId` with a different season-1 result → that Showdown `unavailable`, model `partial`, its seasons not counted.
7. **Abandoned removal.** Career with Showdown A (completed) and B (abandoned, but pass a projection where Nik had a record 11-point season and 114 league points). Nik's `bestSeasonScore`, `bestLeaguePoints`, `perfectSeasons`, records and averages come from A only; B's row is status-only (`totals` null, `seasons` empty).
8. **Completion pending.** Seasons count; `showdowns.completed` stays 0; history row shows `completion-pending` with totals and winner.
9. **Active.** Accepted seasons count; `winner` null on its row; no Showdown outcome.
10. **Final mismatch.** A completed Showdown whose `final.totals` differ from the projection sums → `unavailable`, model `partial`, `coverage` `{readable: n-1, indexed: n}`.
11. **Combined averages.** Showdown A: 1 season, Daniel scores 10. Showdown B: 3 seasons, Daniel scores 2 each. `averageSeasonScore` is 4 (16 / 4), not 6.
12. **Status.** `indexStatus` `loading` → `loading`; `unavailable` → `unavailable` with `null` numbers; `ready` + `[]` → `empty`; `ready` + only a `pending` entry → `empty`; any unavailable → `partial`.
13. **Left/right.** `playerOne` data lands under `daniel`, `playerTwo` under `nik`, for every field.
14. **Records and standings.** Ties give `manager: "shared"`; standings tie on points and season wins gives `level: true` on both rows; `biggestShowdownWin` ignores draws, active and completion-pending Showdowns.
15. **Interim label.** `currentShowdownOnly: true` gives the exact text; otherwise `null`.
16. **Pure and frozen.** The output is deeply frozen (`Object.isFrozen` on nested objects). Calling twice with the same input gives `deepEqual` output. The source text of `js/sharedCareerAnalytics.js` contains none of `localStorage`, `sessionStorage`, `indexedDB`, `document.`, `currentShowdown`, `Date.now`, `Math.random`. Setting `globalThis.localStorage` to an object with conflicting fake data before the call changes nothing.

## 8. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The test failed before the model existed (commit link) and passes now.
- [ ] All 16 cases plus the agreement check are present.
- [ ] `npm run test:contracts` passes at 97/97; `npm run test:ops` passes.
- [ ] "Validate Gameplay Fast" green on the exact head (run URL), or "fast CI not yet on base" recorded.
- [ ] Only the four files in section 2 changed; no app screen, `index.html`, service worker or Rules file touched.
- [ ] No storage, DOM or globals in the model; output keys are `daniel` / `nik`.
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed.

## 9. When stuck

If the contract and this job disagree, this job wins for now: write the question in the status file and continue. If the same step fails twice, set State: BLOCKED with the failing assertion and what you tried, push, and reply "Job 3 is blocked: <one line>".
