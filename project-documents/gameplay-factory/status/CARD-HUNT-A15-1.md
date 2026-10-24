# CARD-HUNT-A15-1 · Missing league points and goals count as zero

- Verdict: **CONFIRMED IN CURRENT CODE** (HIGH confidence in shared-result protocol/provider behavior; the standard on-screen form already blocks empty entries).
- Origin: `HUNT-A15.md`, finding row 1 (slice `js/sparkSharedSeasonResults.js:1-117`).
- Checked branch: `gameplay/bug-list-1` (14 October 2026).
- Lane: **Work mode** (shared-result validation plus deterministic Node contract; no browser required).
- Size: **S** (two small validator gates and a focused contract).

## What the player sees

A shared Season Result with a missing league-points or league-goals value can be published as if the manager earned **0** points or scored **0** goals. The incorrect zeros persist in the private Season Result and, once both managers publish, in the revealed results and downstream Season/Career totals. **Scope:** the ordinary Review My Result form rejects blank fields (`js/productionSharedSeasonResults.js:92-100`); the confirmed defect is the shared protocol/provider boundary when malformed or stale payloads reach it.

## Where in today's game

`js/sparkSharedSeasonResults.js:42-47`:

```js
function ssrpResultShape(value,teamCount){
  ssrpExact(value,RESULT_KEYS,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
  const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
  if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
```

The publish path first accepts those same values through `js/sharedSeasonResults.js:30-36`:

```js
ssrExact(value,RESULT_KEYS,"SEASON_RESULTS_PAYLOAD_INVALID");
const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
if(!Number.isInteger(position)||position<1||position>teamCount)ssrFail("SEASON_RESULTS_POSITION_INVALID");
if(!Number.isInteger(points)||points<0||points>maxPoints)ssrFail("SEASON_RESULTS_POINTS_INVALID");
if(!Number.isInteger(goals)||goals<0||goals>300)ssrFail("SEASON_RESULTS_GOALS_INVALID");
```

## Why

`Number(null)` and `Number("")` both become `0`. Range checks accept **0** as a real result, so the protocol converts absent stats to valid-looking numbers before the Spark provider hashes and stores them. The Spark private-result reader performs the same coercion, rather than rejecting missing stored values at its own trust boundary.

## How to reproduce

Copy the fixture inputs from `tests/contracts/shared-season-results-contracts.cjs:5-12`, then call `Factory.createProtocol({teamCount:20,cryptoImpl:webcrypto})`. Publish Season 1 as playerOne with a valid seven-field result except `leaguePoints:null` and `leagueGoals:""`, a valid `season_result_op_...` ID and `baseRevision:0`. The protocol returns `ok:true` and a `COLLECTING` state whose `results.playerOne.leaguePoints===0` and `leagueGoals===0`. **Expected:** reject the absent league points; with valid points and an empty goals field, reject the absent goals. An empty/null league position is also incorrectly converted to zero but then rejected by its minimum-1 bound.

For a realistic storage path, copy `createHarness`, `p1Result`, `resultOp` and `options` from `tests/contracts/shared-season-results-provider-contracts.cjs:5-61`. `Provider.publishResult({...h.options("playerOne"),operationId:resultOp(90),baseRevision:0,result:{...p1Result,leaguePoints:null,leagueGoals:""}})` currently succeeds and stores both stats as zero in the private result document; it should return a validation failure and write no Season Result.

## Failing test to write

`tests/contracts/sweep-missing-season-stats-contracts.cjs`

Copy the `assert`, `webcrypto`, setup/Career Start/completed Transfer Challenge fixtures, `result`, `command` and `run` pattern from `tests/contracts/shared-season-results-contracts.cjs:1-12,85-98`. Use a 20-club Season 1 and valid award booleans. Test `leaguePoints:null` and `leaguePoints:""` separately: expect `SEASON_RESULTS_POINTS_INVALID`; test `leagueGoals:null` and `leagueGoals:""` separately: expect `SEASON_RESULTS_GOALS_INVALID`. **Wrong today:** all four are accepted as zero and return a `COLLECTING` result. Control: explicit numeric zeros remain valid, as do 114 maximum points/300 maximum goals for a 20-club league. Also copy the in-memory Firestore `createHarness` from `tests/contracts/shared-season-results-provider-contracts.cjs:23-61,79-91`; verify malformed publish returns `ok:false` and leaves public/private Season Result documents unwritten, while valid numeric-zero publish and opponent privacy still work. A separate private-read check should reject persisted `null`/`""` stats even when they would coerce to a hash-valid zero. Run `node tests/contracts/sweep-missing-season-stats-contracts.cjs`.

## Smallest fix

Before converting each `leaguePosition`, `leaguePoints` and `leagueGoals` field in **both** `ssrNormalizeResult` and `ssrpResultShape`, reject null/undefined, empty/whitespace-only strings, booleans, arrays and objects as absent/non-numeric inputs. Then retain the present integer/range checks; preserve truly entered numeric zero and, if compatibility requires it, nonempty numeric strings. Reuse a small local helper in each module if needed, without changing the payload shape or the existing error codes.

## Risk and callers checked on today's branch

- **Protocol user:** `js/sparkSharedSeasonResults.js:123-127` calls `resultsModule.createProtocol(...).apply(...)` to normalize each published Season Result. Changing protocol validation also affects any direct `js/sharedSeasonResults.js` consumers and its deterministic tests.
- **Private-result reader:** `js/sparkSharedSeasonResults.js:108-118,130-141` uses `ssrpResultShape` while loading either manager's private Season Result; maintain private-before-both-publish restrictions and command-hash verification.
- **Production screen:** `js/productionSharedSeasonResults.js:25-38,92-100,174-184` loads the provider, already blocks blank form fields, and passes its reviewed numeric result to `publishResult`. Do not weaken Review/Edit checking or reject genuine score zero.
- **Regression callers:** `tests/contracts/shared-season-results-contracts.cjs:76-98` covers numeric boundaries; `tests/contracts/shared-season-results-provider-contracts.cjs:79-111,116-138` exercises Firestore writes, private reads, and hashes; `tests/contracts/shared-season-results-production-contracts.cjs` checks the production screen routing.

No gameplay files or tests were changed by this card.
