# Season Results simultaneous-publish diagnosis

## Scope and conclusion

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.
Inspected `gameplay/recovery-v1` at **710121b34a6bb332e67bb9d2dfcd92abccbf9a19**.
PR [#359](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/359) merged as **85e32017e03502043c1d4dc7df700184585c4e99**; its fallback is present at the inspected head.

**Confirmed implementation defect: the permission-denied recovery catch covers the publish transaction but excludes the league-projection preflight transaction.** A denial in that earlier transaction exits without any re-read, even if the rival has already published revision 1. The exact escape is `js/sparkSharedSeasonResults.js:158` → outer catch at **191**, bypassing the inner catch at **168–190**.

This is a demonstrated explanation for how permission-denied can still escape after #359. **It is not proven that the user's particular failing emulator run took this path.** Its returned error and winner's document do not identify which transaction failed. The other surviving possibility is a failure of the fallback's own read at line 185. The report distinguishes the confirmed control-flow defect from that unresolved runtime attribution.

Only this report is added. The diff below is a proposal, not an applied code change. No Rules or tests are changed; no emulator or production writes were performed for this diagnosis.

## Exact path and field analysis

All line references below are to the inspected head unless another commit is named.

1. `tests/firebase/two-manager-journey-emulator.cjs:290–300` issues two `publishResult` calls with **baseRevision 0** using `Promise.all`, then requires the rejected call to return `SEASON_RESULTS_STALE_BASE_REVISION`.
2. Each call first awaits `ssrpEnsureLeagueProjection(options)` at `js/sparkSharedSeasonResults.js:158`.
3. That helper opens its own transaction at **148–154**. Even when the league projection already exists, it first calls `ssrpContext` at **150**, before returning at **151**. Context reads the public season result and this manager's own role document at **140–141**. Thus the preflight touches documents involved in the simultaneous publish; it is not merely a read of the stable league projection.
4. The transaction that publishes the result is defined at **159–166**. Its normal stale check is **162**.
5. Only `runPublishTransaction()` is inside the inner try at **167**. #359's denial mapping at **170–187** cannot intercept a rejection from step 2.
6. The outer catch at **191**, via `ssrpResultError` at **23**, returns the original error code.

For a publish-transaction denial that *does* reach the fallback:

- The emulator's `sdk()` at `tests/firebase/two-manager-journey-emulator.cjs:49` exposes `Timestamp/doc/runTransaction/serverTimestamp`, without `getDoc`. The production bundle at `js/productionFirebaseRuntime.js:333` has the same keys.
- Consequently line **177** uses a **new** `runTransaction` containing only `transaction.get(publicRef)`. It does not reuse the failed publish transaction. It never reads the rival's private result.
- The await and snapshot extraction are at **184**. A read failure rethrows the *original publish denial* at **185**, hiding the fresh read's error code.
- Line **187** compares the public document's top-level **revision** against the caller's **baseRevision**. With the reported `revision:1` and caller `baseRevision:0`, the condition is true.
- `baseRevisions:[0]` records the base used by the winning operation. It is not the document's current revision. `publishedRoles:["playerTwo"]` identifies the first publisher; it is not used as revision authority.
- Line **186** precedes the comparison only for an already-recorded **same operationId**. The journey generates distinct IDs for Daniel and Nik at **291**, so the winner's operation is not the loser's own-op replay.

**Therefore, if the fallback successfully receives that revision-1 document with the winner's distinct operation ID, it must return STALE.** A wrong-field comparison does not explain the result.

A cached `getDoc` snapshot is also not the path used by this emulator SDK. A successful fallback transaction returning an older/missing document on all three attempts is theoretically another way to preserve the denial, but no such snapshots were captured in the supplied evidence. The winner's returned state alone does not reveal the timing or contents of each loser read.

## Why the new contract misses the preflight escape

`tests/contracts/season-results-race-denied-contracts.cjs:33–36` hard-codes:

- Transaction call 1 succeeds with `18` (projection preflight).
- Transaction call 2 throws permission-denied (publish).
- Subsequent calls invoke the simulated read callback.

It therefore proves #359's publish-denial mapping, but never exercises a denial from the first transaction. It also does not model a real transaction's completion after the callback reads its document. Passing this contract does not establish which path an intermittent emulator denial used.

## Smallest proposed fix

Move the existing preflight await into the existing permission-denied recovery try. No schema, Rules, scoring, result payload or privacy change is required.

```diff
diff --git a/js/sparkSharedSeasonResults.js b/js/sparkSharedSeasonResults.js
--- a/js/sparkSharedSeasonResults.js
+++ b/js/sparkSharedSeasonResults.js
@@ -155,7 +155,6 @@
   }
   async function ssrpPublishResult(options={}){
     try{ssrpValidateSdk(options);const operationId=ssrpNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)ssrpFail("SEASON_RESULTS_COMMAND_INVALID");
-      await ssrpEnsureLeagueProjection(options);
       const runPublishTransaction=()=>options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
@@ -167,1 +166,1 @@
-      try{return await runPublishTransaction();}
+      try{await ssrpEnsureLeagueProjection(options);return await runPublishTransaction();}
```

This retains the bounded public-only re-read and the existing behavior for non-denial failures, unreadable public documents, and denials without a newer revision. It fixes the proven preflight coverage gap. It is **not** established as sufficient if the original failure instead occurred in the fallback read at line 185.

## Verification and evidence limits

An in-memory Node VM loaded the inspected provider source with injected SDK outcomes. The winner snapshot had `revision:1`, `baseRevisions:[0]`, `publishedRoles:["playerTwo"]`, and a distinct operation ID. The proposed change was applied only to the in-memory string.

| Scenario | Returned code | Transaction calls | Fallback reads |
| --- | --- | ---: | ---: |
| Current source; preflight denied | permission-denied | 1 | 0 |
| Current source; publish denied | SEASON_RESULTS_STALE_BASE_REVISION | 3 | 1 |
| Proposed source; preflight denied | SEASON_RESULTS_STALE_BASE_REVISION | 2 | 1 |
| Proposed source; publish denied | SEASON_RESULTS_STALE_BASE_REVISION | 3 | 1 |

All four assertions passed. This proves the catch boundary and the proposed change's behavior for those injected outcomes; it is not an emulator reproduction or proof of the original denial's low-level cause.

Live CI at the inspected head: [run 37249989566](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37249989566), emulator job **111575503716**, logged both 3-season and 10-season journeys passing, including simultaneous taps. Its overall failure was the separate browser journey. This does not rule out an intermittent race.

Retrieved older CI: [run 37242874872](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37242874872), head **2bcf40d7c0f27a79bdc09b16200c6d9ffc0fd495**, emulator job **111554899577**, failed at line 300 at 2026-10-04T23:14:25Z. That run had playerOne winning and failed during the 3-season command, before the 10-season command began. Its provider still had the old `if(typeof sdk.getDoc!=="function")throw error;` at line 171. It predates #359 and cannot establish a failure of #359's new read-only fallback. It is not the exact playerTwo-winning, 10-season failure described by the user.

## Unknown

- The exact commit/run ID and full logs of the reported **10-season, playerTwo-winning** failure were not supplied and were not matched among the retrieved runs.
- Whether that failure came from the preflight transaction, the publish transaction, or the fallback transaction's read/completion. The public return value preserves none of this stage information.
- Whether a fallback read actually ran in that failure; if it did, its snapshots, errors and timing relative to the winner's committed write are unknown.
- The low-level reason for a preflight denial, if that was the path. The shared reads expose it to concurrent changes, but injected outcomes do not prove how the emulator classified that conflict.
- Whether the two-line proposal eliminates the particular intermittent failure. Next verification is to capture transaction-stage/read outcomes in a separate authorized diagnostic run and run the unchanged 10-season emulator journey against the proposed provider using a demo project. No Rules relaxation or test-expectation change is justified by the present evidence.
