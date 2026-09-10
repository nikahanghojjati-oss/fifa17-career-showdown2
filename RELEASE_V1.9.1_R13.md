# Career Mode Showdown v1.9.1 runtime r13

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r13`

Previous known-good runtime: `1.9.1-r12`

## Multi Season progression

r13 integrates the SSJR-1.1 Multi Season capability on top of the r12 History Convergence authority. The shared season cursor advances exactly once only after provider-authoritative History Convergence witnesses the accepted season, preserves the configured 1/3/5/10 season plan and permanent league/club bindings, rejects duplicate or skipped progression, and closes at the configured terminal season.

The production adapter is additive: before r13 provider authority is established, existing local/r12 season consumers retain their explicit season behavior. Once authoritative, downstream shared Transfer Challenge, Season Results, Season Commit, Canonical Scoring and History Convergence consumers resolve the shared cursor without mutating canonical local Save state.

## Validation boundary

The candidate includes deterministic progression/provider contracts and a two-context desktop/mobile browser audit covering 1, 3, 5 and 10 season plans. Exact-head POS20 validation is required after this publication commit; earlier green heads are historical evidence only.

The one-shot shell publisher produced coherent r13 bytes but its Actions-authored commit was not eligible to execute the normal PR validation jobs. This connector-authored provenance commit intentionally changes no product behavior and exists to establish a new exact head on which the complete POS20 suite can execute. Only that new exact-head run may authorize integration.

No new Firestore write or collection-list surface is introduced by Multi Season progression. Firebase remains Spark-only and billing remains permanently off. SSJR production-two-account acceptance remains separate from MDP engineering maturity.
