# Career Mode Showdown v1.9.1 — Runtime r29

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r29`

Previous known-good runtime: `1.9.1-r28`

Runtime r29 fixes stale remote test-state cleanup for the current Daniel-hosted product flow.

If Nik / Player Two still has a historical `pending-pair` from an older test, the Home connection panel no longer exposes that stale host capability, `COPY CODE`, or `NEW CODE`. Instead it shows `OLD CONNECTION FOUND` with `DELETE OLD CONNECTION & START FRESH`.

That action revalidates the exact pending rivalry, asks for confirmation, closes that stale remote rivalry exactly once, and returns Nik to the current supported join state: `Paste Daniel's code` + `JOIN DANIEL'S SHOWDOWN`.

Daniel / Player One pending-pair behavior remains unchanged: Daniel is the only manager allowed to create and share the Showdown connection code.

Fresh-browser ACTIVE recovery remains unchanged. `DELETE OLD SHOWDOWN & START OVER` still closes an old active online Showdown for both players only after recovery state is revalidated.

Runtime r28 Career Start routing, single-season selection, paired-capability validation, persistent `UPDATE TO LATEST VERSION`, and the online-only two-manager architecture remain unchanged.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. No Cloud Functions, Cloud Run, paid tier, or Rules expansion is introduced.

SSJR-1.1 remains exactly `0/100` until a fresh real two-device physical journey passes.
