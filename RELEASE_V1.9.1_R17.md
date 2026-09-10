# Career Mode Showdown v1.9.1 runtime r17

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r17`

Previous known-good runtime: `1.9.1-r16`

## Final Reconciliation

r17 integrates the frozen MDP Final Reconciliation capability on top of r16 Local Reconciliation. It composes the already-authoritative Shared Multi Season terminal state and complete Shared History Convergence projection with the non-destructive Local Reconciliation safety state into one read-only completed-Showdown projection.

Final Reconciliation is available only when the configured 1/3/5/10 season plan is terminal, every configured season is authoritatively accepted and contiguous, the complete history has the exact same rivalry/revision key/league/fixed clubs, and local reconciliation is in a safe non-destructive state. It creates no additional season: the final projection has `nextSeason:null` and `extraSeasonAllowed:false`.

Each manager's local reconciliation state must carry the exact verified History Convergence binding for that manager role: the same `managerRole`, `profileId`, and canonical Save Library `saveId`, with Candidate C remaining the only destructive local Apply route. The production compositor captures that canonical `currentShowdown.identity.saveId` together with the exact `rivalryId`, never the retained legacy timestamp-like Showdown `id`.

The production compositor scopes both in-flight refresh work and any published Final Reconciliation view to the exact canonical `saveId + rivalryId` context. It rechecks that context after each awaited dependency refresh, requires the returned Multi Season/History/Local snapshots to match the same context, hides/invalidates a previously published view immediately when the active canonical context changes, and prevents late work from an old context from clearing or relabeling a newer context.

The final overall winner reuses the existing accumulated canonical Showdown-points authority from History Convergence manager records. The manager with more cumulative canonical points wins; equal cumulative totals remain a draw. r17 deliberately introduces no new cross-season tiebreaker.

Terminal Close remains a separate later capability. r17 marks the final season reconciled and the Showdown terminal for progression, but does not close or mutate provider lifecycle state.

## Retained Private Remote Joining foundation

Private Remote Joining remains the unchanged exact two-manager session and authorization foundation beneath Shared Showdown Journey. r17 adds no discovery, matchmaking, community, ranking, broad list permission, new provider mutation surface, or durable raw authority IDs.

r17 performs no direct canonical local Save mutation, no automatic Candidate C Apply, no provider write, no broad list and no new Firestore collection or Rules surface. Firebase remains Spark-only, Billing remains permanently OFF, App Check enforcement remains OFF, and no Cloud Run or Cloud Functions dependency is introduced.

## Reload and service-worker integration

`js/sharedFinalReconciliation.js` and `js/productionSharedFinalReconciliation.js` are retained in the verified r17 service-worker shell. r16 is retained as the previous known-good whole-shell recovery target.

## Validation boundary

The initial pre-publication candidate `e78e2a63...` and first P1-hardening candidate `846a3340...` each passed their own complete exact-head POS20 runs, but subsequent Codex review findings superseded their merge eligibility. The second review identified that `currentShowdown.id` was a legacy record ID rather than the canonical Save Library identity and that stale-context return paths could leave a previously published view exposed under a different Showdown's manager labels.

The corrected r17 candidate must therefore receive a fresh complete exact-head POS20 and review recheck of its own. No earlier green lane or superseded head may be combined with it.

MDP remains `91.00/100` until r17 is merged, deployed, exact-main validated and both Release Integration Burn-In passes succeed, followed by a separate accounting authority. SSJR-1.1 remains `0/100`; this engineering milestone does not claim production two-account acceptance.
