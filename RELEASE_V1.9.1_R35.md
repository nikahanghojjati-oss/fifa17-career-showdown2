# Career Mode Showdown v1.9.1 — Runtime r35

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r35`
Previous known-good runtime: `1.9.1-r34`

This runtime fixes the physical resume blocker observed on both Nik's iPhone and Daniel's Chromebook after choosing `CONTINUE CAREER`: the Shared Setup screen incorrectly reported `SETUP PROVIDER UNAVAILABLE`.

Root cause: `sparkSharedShowdownSetup.js` captured its browser protocol/catalog dependencies at module evaluation time. The Career Start bootstrap could evaluate the provider before `sharedShowdownCatalog.js` existed, permanently freezing an undefined catalog in that page runtime. A later correct load of the catalog could not repair the already-created provider object.

r35 repairs this in two layers:
1. The Spark Shared Setup provider resolves the Shared Setup protocol and catalog at call time instead of freezing browser globals at module evaluation.
2. Career Start explicitly loads `sharedShowdownCatalog.js` before evaluating `sparkSharedShowdownSetup.js`.

The fix is resume-safe: it does not delete or recreate the Daniel/Nik rivalry, does not redraw league or clubs, does not alter the selected season count, and does not mutate canonical local saves.

The r34 single-click reliability fixes remain intact. Remote Joining engineering provenance remains repository-only and does not change the player-facing flow. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; production credit is not inferred from CI or deployment evidence and still requires genuine physical two-device completion.
