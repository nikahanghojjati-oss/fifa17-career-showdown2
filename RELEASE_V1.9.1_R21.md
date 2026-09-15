# Career Mode Showdown v1.9.1 — Runtime r21

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r21`

Previous known-good runtime: `1.9.1-r20`

Runtime `1.9.1-r21` is the whole-shell release candidate for the canonical Daniel/Nik persistent Showdown product. It advances the installable shell identity because the shipped shell, pairing runtime, player identity routing, recovery behavior and Firestore Rules integration changed after r20; r20 remains the immediate known-good whole-shell recovery target.

r21 keeps Daniel permanently Player One and Nik permanently Player Two, preserves provider-atomic private pair authority, requires explicit 1/3/5/10 season selection before pairing, and keeps exact provider Save/Profile recovery fail-closed. Canonical Continue and the persistent-pair panel both reactivate the established Save Library authority before deciding local recovery, so transient provider reads, cross-tab storage invalidation and cold reloads do not create false recovery or stale-role lockout.

The installed service worker uses a distinct r21 cache namespace and retains r20 as the preferred recovery runtime. A failed r21 population therefore cannot delete the r20 known-good shell merely because both releases shared one cache identity.

Remote Joining and Shared Journey terminology remain engineering provenance only; the player-facing product remains the single Start a Showdown / Continue Career experience. There is no public discovery or list authority expansion.

Firebase remains Spark-only with Billing permanently OFF. App Check enforcement remains OFF. No Cloud Run, Cloud Functions, Blaze/payment dependency or paid infrastructure is introduced.

SSJR-1.1 remains exactly `0/100`; no source commit, CI pass, merge, deployment or release-note publication earns physical-journey acceptance credit. MDP remains `95.50/100` until separately governed evidence changes it.

Production Pages and Rules deployment/readback must pass on the merged exact main head before genuine two-device testing is requested.
