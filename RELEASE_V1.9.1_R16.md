# Career Mode Showdown v1.9.1 runtime r16

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r16`

Previous known-good runtime: `1.9.1-r15`

## Local Reconciliation

r16 integrates the frozen MDP Local Reconciliation capability on top of r15 Journey Conflicts. It connects authoritative Shared Journey history to the already-proven Connected Rivalry Candidate B/C reconciliation authority without creating a second storage or provider writer.

Read-only Candidate B preview preserves the exact local Save, profile and season identities and leaves unrelated saves unchanged. Candidate C remains the sole destructive local Apply authority: Apply requires explicit user confirmation, creates and verifies a local backup before mutation, rechecks exact remote revision/content authority before and after backup, rejects stale local or remote state, performs the guarded raw-storage transaction, and retains exact rollback behavior.

Offline behavior is fail-closed for mutation. An already-observed exact remote envelope may remain available for read-only preview while offline, but Apply is denied until online authority can be revalidated. The r16 Shared Journey adapter itself performs no direct canonical local-storage write.

Existing Firebase authority remains unchanged. r16 adds no Firestore collection, list permission, remote mutation surface, Cloud Run or Cloud Functions dependency. Firebase remains Spark-only, billing remains permanently OFF and App Check enforcement remains OFF.

Private Remote Joining remains retained and unchanged as the exact two-manager session authority beneath the Shared Journey; r16 adds no discovery, matchmaking, community or ranking surface.

## Reload and service-worker integration

`js/sharedLocalReconciliation.js` and `js/productionSharedLocalReconciliation.js` are retained in the verified r16 service-worker shell so Local Reconciliation remains available after install, reload and offline shell recovery. r15 is retained as the previous known-good whole-shell recovery target.

## Validation boundary

The final pre-publication r16 candidate passed complete normal PR POS20 run #394 on exact head `703018a341d83c34fe15a43538c5e80ad145fd39`, including deterministic census, operations, STATIC, REMOTE, STORAGE, VISUAL, INLINE, FULL and the exact-head cognitive seal. Earlier failed r16 heads remain historical failure evidence only and are not combined with this candidate.

Publication changes executable release bytes and therefore requires a fresh complete exact-head POS20 before PR #246 can merge. The Actions-authored publication commit is not final acceptance authority by itself; a connector-authored provenance head must establish the final publication boundary.

MDP remains `86.50/100` until r16 is merged, deployed, exact-main validated and both Release Integration Burn-In passes succeed. SSJR-1.1 remains `0/100`; this engineering milestone does not claim production two-account acceptance.
