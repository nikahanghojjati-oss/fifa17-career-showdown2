# Career Mode Showdown v1.9.1 runtime r15

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r15`

Previous known-good runtime: `1.9.1-r14`

## Journey Conflicts

r15 integrates the frozen MDP Journey Conflicts capability on top of r14 Journey Reconnect. It observes the existing Shared Setup and Shared Season Commit mutation surfaces without replacing their provider transaction authority.

The conflict layer uses non-authorizing in-memory receipts to distinguish exact replay from altered replay, permits at most one bounded stale-base retry under the same operation identity, rejects replay-altered intent before another provider mutation, expires local receipts, and preserves provider error codes for stale contention, revocation, receipt expiry, quota failure and other provider denials.

Existing Firebase transaction/CAS checks remain the sole remote mutation and authorization authority. The r15 layer introduces no new Firestore collection, list permission, canonical local Save mutation, provider write surface, Cloud Run or Cloud Functions dependency. Firebase remains Spark-only, billing remains permanently OFF and App Check enforcement remains OFF.

Private Remote Joining remains retained and unchanged as the exact two-manager session authority beneath the Shared Journey; r15 adds no discovery, matchmaking, community or ranking surface.

## Reload and service-worker integration

`js/sharedJourneyConflicts.js` and `js/productionSharedJourneyConflicts.js` are retained in the verified r15 service-worker shell so the conflict guard remains available after install, reload and offline shell recovery. r14 is retained as the previous known-good whole-shell recovery target.

## Validation boundary

The pre-publication r15 candidate passed a full normal PR POS20 on exact head `b38935bd0cb2d29079deb5fd81dd5b92547ff67e`, including deterministic census, operations, all inherited heavy-proof groups, FULL, REMOTE, STORAGE and the exact-head cognitive seal. Earlier failed r15 heads remain historical failure evidence only and are not combined with this candidate.

Publication changes executable release bytes and therefore requires a fresh complete exact-head POS20 before PR #244 can merge. The Actions-authored publication commit is not final acceptance authority by itself; a connector-authored provenance head must establish the final publication boundary.

MDP remains `82.00/100` until r15 is merged, deployed, exact-main validated and both Release Integration Burn-In passes succeed. SSJR-1.1 remains `0/100`; this engineering milestone does not claim production two-account acceptance.
