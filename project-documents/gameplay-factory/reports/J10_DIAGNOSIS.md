# J10 diagnosis: terminal snapshot publication depends on an unsynchronized cache

## Scope and evidence

Read-only investigation of `nikahanghojjati-oss/fifa17-career-showdown2`. Compared `85e32017e03502043c1d4dc7df700184585c4e99..1e7775a4c312fdc2cccbc7efdb32b163de459539` for all changed `js/production*.js` and `tests/browser/two-manager-browser-journey.cjs`. Report branch starts at observed `gameplay/recovery-v1` head `710121b34a6bb332e67bb9d2dfcd92abccbf9a19`. Line references below are at `1e7775a4`; the cited reconciliation, commit, scoring, history, progression and browser-journey files are unchanged at that recovery head.

Only this report is added. The proposed source diff below is documentation, not an applied change. No Rules, tests, runtime files, PR, merge or deployment are changed.

## Root cause and exact blocking path

**Confirmed code defect: Local Reconciliation's first-snapshot fallback tests cached terminal MultiSeason authority without awaiting it.** The gate is `js/productionSharedLocalReconciliation.js:57,65`. A successful read of a missing snapshot can therefore return `LOCAL_RECONCILIATION_PREVIEW_BLOCKED` even though the final season has been accepted remotely. Once this happens, subsequent projection-only refreshes cannot recover without another Preview action.

1. `tests/browser/two-manager-browser-journey.cjs:139-170` waits for the acknowledged commit, canonical score and a visible History panel. It does not wait for MultiSeason `SHOWDOWN_COMPLETE`, or assert the History panel's `throughSeason` at that point. J10 immediately clicks Daniel's Preview once (`:588-604`), then waits for 60 seconds without clicking again. Nik's Preview has not run when Daniel fails.
2. `lrPreview` initializes Connected Rivalry and projects local state (`js/productionSharedLocalReconciliation.js:71-74`). An exact binding and authoritative History are enough to expose the Preview UI; MultiSeason terminal authority is not a UI prerequisite (`:18,29-36`).
3. `lrObserveRemote` really does call `refreshAttachedSharedState(before.binding)` (`:58-64`). This is not a missing-read call. The Connected Rivalry transaction reads the separate `rivalries/{rivalryId}/state/authoritative` document (`js/sparkConnectedRivalry.js:471-493`). A missing document is a successful `exists:false` result (`:487`); the adapter records `status:"refreshed"`, `observedExists:false`, `observedEnvelope:null` (`:937-967`). A Season Commit snapshot and a Connected Rivalry snapshot are different documents.
4. Publication happens only at `js/productionSharedLocalReconciliation.js:65-67`: successful empty read, no tombstone, **and `lrMultiTerminal()`**. That helper only calls MultiSeason `getState()` (`:57`); it does not refresh or await progression. If that view is still `SEASON_READY`, null or otherwise nonterminal, publication is skipped entirely. No envelope can be observed because the document has not been created.
5. `lrRefresh()` then projects that empty envelope as `WAITING_REMOTE`, `reason:"remote-not-observed"`, `previewAllowed:false` (`js/sharedLocalReconciliation.js:18-31`). `lrPreview` returns the reported blocked code (`js/productionSharedLocalReconciliation.js:74`).
6. History dispatches its state-change event only after binding/rendering its result (`js/productionSharedHistoryConvergence.js:97-99`). MultiSeason listens to that event, but its wake starts an asynchronous refresh without awaiting it (`js/productionSharedMultiSeasonProgression.js:136-143,174-175`). History visibility therefore does not guarantee completion of MultiSeason's provider read.
7. When MultiSeason later becomes `SHOWDOWN_COMPLETE`, Local Reconciliation's timer/events still only call the synchronous `lrRefresh()` (`js/productionSharedLocalReconciliation.js:101-107`). They do not call `lrObserveRemote`, publish, or retry Preview. Final Reconciliation also uses `localApi.refresh()` rather than `preview()` (`js/productionSharedFinalReconciliation.js:60-62`); it cannot create the missing document. Waiting longer after the single blocked click leaves the local state waiting.

This is an ordering/liveness defect, not evidence that Daniel lost pairing, that scoring failed, or that the snapshot read was denied. A read failure normally takes the separate `LOCAL_RECONCILIATION_REMOTE_READ_FAILED` path (`js/productionSharedLocalReconciliation.js:64,73`).

## What the regression diff changes

| Suspect | Finding at `1e7775a4` |
| --- | --- |
| Combined COMMIT & ACKNOWLEDGE | `js/productionSharedSeasonCommit.js:176-197` commits and then acknowledges Daniel with separate provider operations. Nik still acknowledges. This changes pacing; it never publishes Connected Rivalry state. |
| ACKNOWLEDGED early return | `js/productionSharedSeasonCommit.js:132-135` now reuses the commit view. It bypasses `psscRefreshNow` and its nested Setup/Results refreshes (`:123-129,54-64`), not a direct Connected Rivalry snapshot publish. Removing this cache would add reads but would not establish the missing MultiSeason dependency. |
| Light 3-second reads | Scoring skips Setup/Commit refreshes (`js/productionSharedCanonicalScoring.js:63-72`); History skips Setup/Commit/Scoring refreshes (`js/productionSharedHistoryConvergence.js:89-108`). They can make visible downstream authority arrive sooner. MultiSeason remains on its separate asynchronous wake/15-second poll. The resulting exposure of the race is an inference from the changed dependency ordering, not a captured first-click trace. |
| R2 transfer auto-open | It exists only in `pmspAdvance` (`js/productionSharedMultiSeasonProgression.js:144-153`). `pmspCanContinue` rejects terminal state and requires `season < totalSeasons` (`:112-114`), and `pmspAdvance` checks that bound again (`:147`) before opening transfers. The inspected path does **not** automatically open a transfer after the FINAL season commit. No evidence supports removing R2 to fix J10. |
| Reconciliation/provider changes | `productionSharedLocalReconciliation.js`, `sparkConnectedRivalry.js` and `sparkSharedMultiSeasonProgression.js` have no changes across the requested range. The cache dependency is pre-existing. The regression changes its timing, rather than adding or removing the snapshot publisher. |

The remaining changed production modules are Career Start, Journey Entry, Season Results, Showdown Presentation and Transfer Challenge. Their changes implement earlier navigation/light reads; none adds a terminal Connected Rivalry snapshot publication or awaits MultiSeason at Preview.

## Smallest targeted proposed fix

At the successful empty-snapshot read, explicitly await MultiSeason refresh when its cached view is not yet terminal, before evaluating the existing publish guard. Keep the online, exact-binding, missing-document and tombstone gates, the existing Connected Rivalry publisher, and the post-publish re-read. Do not publish from a poll or remove the terminal requirement.

```diff
diff --git a/js/productionSharedLocalReconciliation.js b/js/productionSharedLocalReconciliation.js
--- a/js/productionSharedLocalReconciliation.js
+++ b/js/productionSharedLocalReconciliation.js
@@ -62,6 +62,7 @@
     await api.refreshAttachedSharedState(before.binding);
     const read=api.getState?.()||null;
     if(!read||!(read.status==="refreshed"||read.status==="tombstoned"))return null;
+    if(read.status==="refreshed"&&read.observedExists===false&&read.observedTombstone!==true&&!lrMultiTerminal())await root.CareerModeProductionSharedMultiSeasonProgression?.refresh?.();
     if(read.status==="refreshed"&&read.observedExists===false&&read.observedTombstone!==true&&lrMultiTerminal()&&typeof api.publishAttachedSharedState==="function"){
       await api.publishAttachedSharedState(before.binding);
       await api.refreshAttachedSharedState(before.binding);
```

This is the minimum proposed dependency fix, not a verified full runtime repair. Production implementation must also verify behavior when `pmspRefresh()` coalesces an older in-flight read (`js/productionSharedMultiSeasonProgression.js:143`) and when the account/save/rivalry changes during the extra await; a still-nonterminal or changed authority must remain fail-closed. Those interleavings have not been validated here.

## Verification performed

Executed the actual reconciliation source from each requested commit in Node VM contexts, using the real `sharedLocalReconciliation.project` and controlled in-memory Connected Rivalry/MultiSeason adapters. No source or test file was edited; the proposed line was inserted only into a VM source string.

| Controlled ordering | Result |
| --- | --- |
| `85e32017`: terminal History, nonterminal cached MultiSeason, missing remote document | `LOCAL_RECONCILIATION_PREVIEW_BLOCKED`, `WAITING_REMOTE`; 1 remote read, 0 publishes, 0 progression refreshes. |
| `1e7775a4`: same ordering | Identical blocked result and call counts. |
| MultiSeason becomes terminal after the blocked call; call only Local Reconciliation `refresh()` | Still `WAITING_REMOTE`; 0 publishes. |
| Explicit second Preview after MultiSeason becomes terminal | `PREVIEW_READY`; 1 publish and its subsequent remote observation. |
| `1e7775a4`: terminal MultiSeason already cached at first Preview | `PREVIEW_READY` on the first action. |
| Proposed VM-only diff: progression refresh returns terminal before the publish gate | `PREVIEW_READY` on the first action; 1 progression refresh, 1 publish, 2 remote reads. |

Read GitHub CI evidence as well:

- [Run 37248606798 at `1e7775a4`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37248606798), browser job `111571421955`: J10.1 and J10.2 passed; the full 36-check journey passed. Thus this commit does not fail every run.
- [Run 37249989566 at recovery head `710121b`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37249989566), browser job `111575503721`: J8.5 passed, then Daniel's J10 timed out. At the timeout, MultiSeason was `SHOWDOWN_COMPLETE` with `terminal:true`, History was converged through 3, local state was `WAITING_REMOTE/remote-not-observed`, and the UI retained `LOCAL_RECONCILIATION_PREVIEW_BLOCKED`. Both pages were on `seasonEntry` with no logged application errors. This is consistent with a skipped first publication and no retry; it does not record the gate's inputs at the initial click.

## Unknowns and limits

- Daniel's cached MultiSeason phase **at the initial failed Preview read**, rather than 60 seconds later: **unknown**. The exact first-click interleaving in that CI failure is therefore **unknown**. The race is demonstrated in the actual source, but attribution of that particular failed run remains unconfirmed.
- Connected Rivalry's initial `status`, `observedExists`, tombstone flag, publication attempt count and publication error: **unknown** in that failure log. A publish failure is an alternative not ruled out: `crHandlePublish` catches errors into `publish-error/conflict` (`js/sparkConnectedRivalry.js:1006-1007`), and `lrObserveRemote` re-reads afterward without checking that publish status (`js/productionSharedLocalReconciliation.js:66-67`). A subsequent empty successful read can also produce the same blocked result. No evidence identifies a specific publish error here.
- Whether the first failure actually occurred at `1e7775a4`, and failure frequency before/after #358: **unknown**. Retrieved exact-head CI proves at least one successful run at that commit.
- A complete emulator/browser journey with the proposed diff, real Firestore publication acceptance, both-manager convergence, all in-flight/context-change interleavings, and physical/production behavior: **unknown**. No full journey was rerun and no Rules or tests were edited.
- The full two-manager journey at `85e32017` was not rerun here; its reported pass is user-provided context. The controlled reproduction shows the same latent cache-ordering defect at that commit.

Conclusion: fix the Preview's missing synchronization with terminal progression, rather than reverting coordinator acknowledgement, removing the acknowledged cache, opening an extra season, or relaxing Rules. Capture first-click Connected Rivalry and MultiSeason state in a later authorized investigation to distinguish the reproduced skipped-publication path from a swallowed publish failure in the specific CI run.

