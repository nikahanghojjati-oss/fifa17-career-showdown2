# Career Mode Showdown v1.9.1 runtime r17

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r17`

Previous known-good runtime: `1.9.1-r16`

Authoritative integration base at final publication staging: `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`

## Final Reconciliation

r17 integrates the frozen MDP Final Reconciliation capability on top of r16 Local Reconciliation. It composes the already-authoritative Shared Multi Season terminal state and complete Shared History Convergence projection with the non-destructive Local Reconciliation safety state into one read-only completed-Showdown projection.

Final Reconciliation is available only when the configured 1/3/5/10 season plan is terminal, every configured season is authoritatively accepted and contiguous, the complete history has the exact same rivalry/revision key/league/fixed clubs, and local reconciliation is in a safe non-destructive state. It creates no additional season: the final projection has `nextSeason:null` and `extraSeasonAllowed:false`.

Each manager's local reconciliation state must carry the exact verified History Convergence binding for that manager role: the same `managerRole`, `profileId`, and canonical Save Library `saveId`, with Candidate C remaining the only destructive local Apply route. The production compositor captures that canonical `currentShowdown.identity.saveId` together with the exact `rivalryId`, never the retained legacy timestamp-like Showdown `id`.

The production compositor scopes published Final Reconciliation state to exact Save Library authority, manager-profile binding, canonical `saveId + rivalryId` context and an authority generation. Context or authority loss synchronously invalidates the published view. Every asynchronous refresh is generation-bound, so an A→B→A transition or authority-loss→same-authority recovery cannot allow work started under the old generation to republish or clear a newer recovered view. Recovered same-key authority starts fresh work rather than deduplicating behind pre-loss work.

Cross-tab canonical Save Library invalidation is fail-closed. Named Save Library/singleton storage changes and `localStorage.clear()` (`storage` event `key === null`) invalidate Save Library authority and the Final Reconciliation view. Hidden-document Local Reconciliation authority loss is processed before the visibility guard, and fresh exact authority is required before republishing.

The final overall winner reuses the existing accumulated canonical Showdown-points authority from History Convergence manager records. The manager with more cumulative canonical points wins; equal cumulative totals remain a draw. r17 deliberately introduces no new cross-season tiebreaker.

Terminal Close remains a separate later capability. r17 marks the final season reconciled and the Showdown terminal for progression, but does not close or mutate provider lifecycle state.

## Retained Private Remote Joining foundation

Private Remote Joining remains the unchanged exact two-manager session and authorization foundation beneath Shared Showdown Journey. r17 adds no discovery, matchmaking, community, ranking, broad list permission, new provider mutation surface, or durable raw authority IDs.

r17 performs no direct canonical local Save mutation, no automatic Candidate C Apply, no provider write, no broad list and no new Firestore collection or Rules surface. Firebase remains Spark-only, Billing remains permanently OFF, App Check enforcement remains OFF, and no Cloud Run or Cloud Functions dependency is introduced.

## Reload and service-worker integration

`js/sharedFinalReconciliation.js` and `js/productionSharedFinalReconciliation.js` remain in the r17 service-worker shell. `1.9.1-r16` remains the previous known-good whole-shell recovery target. This release record update changes publication provenance only and does not mutate executable r17 behavior or advance the runtime revision beyond `1.9.1-r17`.

## Final post-review product lineage

The final post-review product correction is:

- `942c320a41a97c246519e100a2956b482f7e2232` — `fix: invalidate stale r17 authority generations`

That correction incorporates the earlier Save Library/hidden-document authority hardening and closes the final two exact-head review gaps found on candidate `9651ace46becd49112cba335483f6aeeed02e80f`:

1. transient authority-loss/recovery and A→B→A ABA refresh resurrection,
2. cross-tab `localStorage.clear()` null-key authority invalidation.

Its guarded correction run `34541052229` passed focused deterministic, production and two-context Final Reconciliation proof plus aggregate SSJR, operations, contracts and `git diff --check`, then self-cleaned the temporary helper. That run is builder evidence only; it is not substituted for the exact candidate/publication acceptance gates below.

## Exact clean candidate boundary

The user-authored no-tree-change candidate boundary immediately above the final product correction is:

- `54dc1880c860b4ad66aa4ebd8e8d9ecd7fdbee11` — `chore: establish r17 post-ABA acceptance boundary`

Fresh exact-head acceptance on that candidate is complete:

- POS20 #428, run `34541134030`: `success` on exact head `54dc1880c860b4ad66aa4ebd8e8d9ecd7fdbee11`.
- All ten POS20 jobs completed successfully, including operations authority, deterministic census, cognitive benchmark and FULL/REMOTE/STORAGE/STATIC/VISUAL/INLINE proof lanes.
- Fresh Codex review on exact commit `54dc1880c8` reported no major issues.
- All addressed PR #248 review threads were resolved after that clean exact-head acceptance.
- `main` was rechecked immediately before final publication staging and remained `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`.

## Superseded evidence remains historical

Earlier r17 candidates and their green runs remain historical only. In particular, `58fc7170...`, `7bf25525...`, `aaca2bd7...`, `c7348c13...`, `9651ace...` and helper/tooling heads are not merge authority because later review findings or corrections superseded them. Evidence is never combined across heads.

## Final publication acceptance boundary

This publication provenance commit is the final r17 publication head candidate. Because it advances the branch beyond `54dc1880...`, it must receive its own fresh exact-head POS20 before merge. No product behavior changed in this publication step, but the final merge authority is still exact-head only.

Before merge:

1. require fresh POS20 success on this exact publication head,
2. recheck PR #248 review state and confirm no new unresolved current-head issue,
3. recheck `main` has not moved from the authoritative integration base,
4. merge with expected-head protection only.

After merge, r17 is not yet MDP-accounted. Verify GitHub Pages on the exact merged `main`, require exact-main POS20, and require both Release Integration Burn-In passes on that exact main. Only after those integration gates succeed may a separate accounting authority move MDP from `91.00/100` to the frozen r17 integrated value `93.70/100`.

SSJR-1.1 remains `0/100`; r17 engineering/integration does not claim genuine production-two-account acceptance.
