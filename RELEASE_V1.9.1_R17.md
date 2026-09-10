# Career Mode Showdown v1.9.1 runtime r17

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r17`

Previous known-good runtime: `1.9.1-r16`

## Final Reconciliation

r17 integrates the frozen MDP Final Reconciliation capability on top of r16 Local Reconciliation. It composes the already-authoritative Shared Multi Season terminal state and complete Shared History Convergence projection with the non-destructive Local Reconciliation safety state into one read-only completed-Showdown projection.

Final Reconciliation is available only when the configured 1/3/5/10 season plan is terminal, every configured season is authoritatively accepted and contiguous, the complete history has the exact same rivalry/revision key/league/fixed clubs, and local reconciliation is in a safe non-destructive state. It creates no additional season: the final projection has `nextSeason:null` and `extraSeasonAllowed:false`.

The final overall winner reuses the existing accumulated canonical Showdown-points authority from History Convergence manager records. The manager with more cumulative canonical points wins; equal cumulative totals remain a draw. r17 deliberately introduces no new cross-season tiebreaker.

Terminal Close remains a separate later capability. r17 marks the final season reconciled and the Showdown terminal for progression, but does not close or mutate provider lifecycle state.

## Retained Private Remote Joining foundation

Private Remote Joining remains the unchanged exact two-manager session and authorization foundation beneath Shared Showdown Journey. r17 adds no discovery, matchmaking, community, ranking, broad list permission, new provider mutation surface, or durable raw authority IDs.

r17 performs no direct canonical local Save mutation, no automatic Candidate C Apply, no provider write, no broad list and no new Firestore collection or Rules surface. Firebase remains Spark-only, Billing remains permanently OFF, App Check enforcement remains OFF, and no Cloud Run or Cloud Functions dependency is introduced.

## Reload and service-worker integration

`js/sharedFinalReconciliation.js` and `js/productionSharedFinalReconciliation.js` are retained in the verified r17 service-worker shell. r16 is retained as the previous known-good whole-shell recovery target.

## Validation boundary

The final pre-publication r17 candidate passed complete normal PR POS20 run #402 on exact head `e78e2a63af59eb06e7e452fcbf4310c8a7d8bd0d`, including deterministic census, operations, STATIC, REMOTE, STORAGE, VISUAL, INLINE, FULL and the exact-head cognitive seal. Earlier failed guarded-builder attempts remain historical failure/mechanics evidence only and are not combined with this candidate.

Publication changes executable release bytes and therefore requires a fresh complete exact-head POS20 on the final publication head before PR #248 can merge. The Actions-authored publication commit is not final acceptance authority by itself; a connector-authored provenance head must establish the final publication boundary.

MDP remains `91.00/100` until r17 is merged, deployed, exact-main validated and both Release Integration Burn-In passes succeed, followed by a separate accounting authority. SSJR-1.1 remains `0/100`; this engineering milestone does not claim production two-account acceptance.
