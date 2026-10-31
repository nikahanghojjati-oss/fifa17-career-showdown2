# CARD-HUNT-A06-1 · Rivalry totals stay on the previous Season

- Verdict: CONFIRMED IN CURRENT CODE (MEDIUM confidence for a visible occurrence; screen refresh can also be triggered by another action).
- Origin: `HUNT-A06.md`, finding row 1 (slice `js/rivalryLegacyV10.js:1-219`).
- Checked branch: `gameplay/bug-list-1`.
- Lane: **Work mode** (event/refresher logic and deterministic Node contract; no browser needed for the regression).
- Size: **S** (few source lines; reuse an existing VM screen harness for the contract).

## What the player sees

Daniel and Nik accept another Season while Rivalry Statistics or History stays open. The current screen can continue showing the preceding Season's score or archived Showdown history until reopened, even though the online history has advanced.

## Where in today's game

`js/rivalryLegacyV10.js:191-195`:

```js
const signature=value=>JSON.stringify([context(),value?.phase??null,value?.status??null]);
let last=signature(state(provider));
root.addEventListener?.(event,change=>{
  const next=signature(change?.detail??state(provider));if(next===last)return;last=next;
  for(const screen of Object.keys(APP))if(screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
});
```

The convergence producer sends the omitted information: `js/productionSharedHistoryConvergence.js:99` dispatches `{phase:view.phase,throughSeason:view.throughSeason,acceptedRevisionKey:view.acceptedRevisionKey||view.projection.acceptedRevisionKey}`.

## Why

The listener treats equal **phase** and **status** as an unchanged Showdown, discarding an event with a new accepted Season or history revision. Neither `throughSeason` nor `acceptedRevisionKey` participates in its change signature. Both History and Rivalry Statistics use this listener to re-render their mounted Team V screen.

## How to reproduce

In a VM screen harness, initialize `CareerModeProductionSharedHistoryConvergence.getState()` with `{phase:"HISTORY_CONVERGED",throughSeason:1,acceptedRevisionKey:"rev-season-1"}`. Mount `rivalryStatistics` with a valid frame showing Daniel 7, Nik 5. Update its model to Daniel 15, Nik 11 and dispatch `career-mode-shared-history-convergence-state-change` with `{phase:"HISTORY_CONVERGED",throughSeason:2,acceptedRevisionKey:"rev-season-2"}`. With the same account/manager/rivalry and no separate navigation, the event is ignored and the mounted frame still shows 7–5. It should refresh to 15–11. The same ignored-event path affects mounted `legacy` History.

## Failing test to write

`tests/contracts/sweep-rivalry-history-revision-refresh-contracts.cjs`

Copy the `vm`, fake mounted Team V screens, `register`, `show`, `mount`, `loadRuntimeScript`, and in-memory fixture pattern from `tests/contracts/v10-rivalry-legacy-contracts.cjs:88-105`. Capture `addEventListener` callbacks instead of discarding them; start with a real `finished-three-seasons` Rivalry frame (or another valid model from `tests/fixtures/data-contract-v1/`). Dispatch (1) the same convergence phase/status but a later `throughSeason` and `acceptedRevisionKey`, and (2) an identical repeated revision. Expect one new screen refresh for (1), none for (2), with the final displayed score equal to the new model. Today (1) produces **zero** refreshes, leaving the old total. Add a second assertion that an account/manager identity change still forces refresh. Run with `node tests/contracts/sweep-rivalry-history-revision-refresh-contracts.cjs`.

## Smallest fix

For the `career-mode-shared-history-convergence-state-change` listener, add `throughSeason` and `acceptedRevisionKey` to its signature (or use an event-specific signature); retain the existing identity, phase, status, and same-revision de-duplication. Avoid refreshing on an identical poll.

## Risk and callers checked on today's branch

- **Event producer:** `js/productionSharedHistoryConvergence.js:99,109` publishes accepted Season number/revision and polls for changes. Preserve event coalescing to avoid a screen redraw every poll.
- **Screen routes:** `js/statistics.js:46-54,625-627` opens the Rivalry Statistics Team V bridge; `js/legacy.js:529-534` opens History through the same bridge. Both mounted routes use `js/rivalryLegacyV10.js:178-195,230-258`.
- **Dependent career model:** `js/careerScreensV10.js:1441-1453` obtains online career cache via `CareerModeRivalryLegacyV10` for Career Statistics and Trophy Room; keep the existing `career-mode-online-career-model-change` publication from `js/rivalryLegacyV10.js:208-229` intact.
- **Regression pattern:** `tests/contracts/v10-rivalry-legacy-contracts.cjs:88-105` covers mounts and remounts; `tests/contracts/shared-history-convergence-production-contracts.cjs:13-33` asserts upstream season-history authority.

No gameplay files or tests were changed by this card.
