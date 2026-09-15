# Career Mode Showdown v1.9.1 — Runtime r22

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r22`

Previous known-good runtime: `1.9.1-r21`

Runtime `1.9.1-r22` is the whole-shell release candidate for the R13 CONNECT PLAYERS reconciliation hardening. It advances the installable shell identity because shipped player identity routing and Shared Journey entry bytes changed after r21; r21 remains the immediate known-good whole-shell recovery target.

R22 keeps Daniel permanently Player One and Nik permanently Player Two. CONNECT PLAYERS now reuses the same promise-shared, provider-authoritative stale-role reconciliation sidecar as canonical Continue Career and performs the same single bounded retry after an absent or unavailable pair read. It does not introduce a second identity repair mechanism or weaken provider authority.

The real browser routing regression covers a registered browser with stale opposite local role plus one transient sidecar failure and requires the second bounded sidecar attempt to reconcile to the durable provider role and reach CAREER READY without dead-ending into unavailable or false recovery controls.

The installed service worker uses a distinct r22 cache namespace and retains r21 as the preferred recovery runtime. Index, manifest, eager shell scripts, lazy visual-fidelity CSS and Marco Reus asset query identities move together to r22 so the service worker cannot serve stale r21 runtime bytes under the new release.

Remote Joining and Shared Journey terminology remain engineering provenance only; the player-facing product remains the single Start a Showdown / Continue Career experience. There is no public discovery or list authority expansion.

Firebase remains Spark-only with Billing permanently OFF. App Check enforcement remains OFF. No Cloud Run, Cloud Functions, Blaze/payment dependency or paid infrastructure is introduced.

SSJR-1.1 remains exactly `0/100`; no source commit, CI pass, merge, deployment or release-note publication earns physical-journey acceptance credit. MDP remains `95.50/100` until separately governed evidence changes it.

Production Pages and Rules deployment/readback must pass on the merged exact main head before genuine two-device testing is requested.
