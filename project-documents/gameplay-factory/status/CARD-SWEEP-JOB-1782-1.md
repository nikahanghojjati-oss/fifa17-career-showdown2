# CARD-SWEEP-JOB-1782-1 · Identical season scores cannot reload after field order changes

- Verdict: STILL OPEN (confirmed against `gameplay/bug-list-1`, `js/sparkSharedSeasonCommit.js:81`).
- Origin: `SWEEP-JOB-1782.md`, finding row 1.
- Lane: Work mode (provider logic plus contract test, no browser required).
- Size: S (one-line comparison, under 20 changed source lines).

## What the player sees

Both managers finish a season with unchanged scores, but a later load or acknowledgement sometimes reports that the season scores do not match. One manager cannot proceed with the shared season even though neither player edited a result.

## Where in today's game

`js/sparkSharedSeasonCommit.js:78-82`, the stored commit recheck:

```js
  if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.runtimeRevision!==RUNTIME_REVISION||value.seasonNumber!==ready.seasonNumber||!["COMMITTED","ACKNOWLEDGED"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");
  scpExact(value.results,ROLES,"SEASON_COMMIT_PROVIDER_STATE_INVALID");for(const role of ROLES)scpResult(value.results[role],teamCount);
  if(JSON.stringify(value.results)!==JSON.stringify(ready.results))scpFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
  for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");}
```

The nearby helper `scpCanonical(value)` at `js/sparkSharedSeasonCommit.js:29` already compares by sorted object keys for hashes.

## Why

`JSON.stringify` preserves object insertion order, so the same scores and field values can stringify differently after storage reorders keys. The game mistakes a change in field presentation order for a change in season results. The code already has an order-independent canonical serializer, but this comparison skips it.

## How to reproduce

Copy `createHarness` from `tests/contracts/shared-season-commit-provider-contracts.cjs:19-40`. That harness creates ready results for both players, a valid private session, and a store of Firestore-shaped records.

1. `const h=await createHarness(); await Provider.commitSeason({...h.options('playerOne'),operationId:commitOp(3),baseRevision:0});` saves the season successfully.
2. `const saved=h.store.get(h.commitPath); saved.results.playerOne=Object.fromEntries(Object.entries(saved.results.playerOne).reverse());` changes only the order of the seven scores' object keys, not a score.
3. `await Provider.read(h.options('playerOne',2_000_100))` now wrongly returns `{ok:false,code:'SEASON_COMMIT_RESULTS_REVISION_MISMATCH'}`; it should return `ok:true`, `committed:true`, `phase:'COMMITTED'`. `acknowledgeSeason` from the other manager also encounters the same false mismatch.

## Failing test to write

`tests/contracts/sweep-season-score-key-order-contracts.cjs`

Copy the `createHarness`, virtual Firestore transaction/store and `webcrypto` setup from `tests/contracts/shared-season-commit-provider-contracts.cjs` (lines 1-40, 47-59). Assert that, after a successful `commitSeason`, reordering the seven keys of `store.get(commitPath).results.playerOne` and then reading as either manager still returns a valid committed season, and the other manager can acknowledge it. Today's result is `SEASON_COMMIT_RESULTS_REVISION_MISMATCH`. Add a negative control changing `leaguePoints` from 100 to 99: it must still return `SEASON_COMMIT_RESULTS_REVISION_MISMATCH`. Run with `node tests/contracts/sweep-season-score-key-order-contracts.cjs`.

## Smallest fix

Replace the `JSON.stringify` equality comparison with `scpCanonical(value.results)!==scpCanonical(ready.results)`. The existing helper sorts keys recursively while preserving the scores' values, so real changes remain blocked. Keep the same error code for genuine differences.

## Risk and callers checked on today's branch

- Direct game caller: `js/productionSharedSeasonCommit.js:34,37,133,166,176-178` loads `CareerModeSparkSharedSeasonCommit`, reads its status during refresh and action taps, then triggers `commitSeason` or `acknowledgeSeason` through its write path. Both manager views benefit; a genuine changed score must still fail.
- Connected screens and following stages: `js/productionSharedSeasonResultsRoute.js:10,78` opens the commit stage after results; `js/productionSharedCanonicalScoring.js:25,31,79` and `js/productionSharedHistoryConvergence.js:28,37` consume the production Commit adapter downstream. Preserve their expectation of an identical committed score set.
- Contract callers: `tests/contracts/shared-season-commit-provider-contracts.cjs:47-59` directly covers commit, read, acknowledgement and real score drift. Keep that negative drift check; run related `shared-season-commit-production-contracts.cjs` as well.

No game code was modified by this card.
