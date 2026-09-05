# CURRENT OVERRIDE — PR #192 / STAGE 5F ACCEPTED / RJR91 / STAGE 5G RELEASE CANDIDATE v1.9.1-r1

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN

Authorized product candidate: `v1.9.1 / 1.9.1-r1` on PR #192. Candidate status: NOT PRODUCTION-PROVEN. Production remains independently verified `v1.9.0 / 1.9.0-r5` on live main PR #191 merge `7ca132a607cbf4fd78710b14526b4bec849ac2d2`; exact PR #187 runtime merge `277f1b55dc362ee84d285445b99172b9fbed8509` remains the production runtime provenance. The previous known-good whole shell and rollback target is `1.9.0-r5` until the candidate is merged and independently proven live.

PR #192 packages the genuinely uncredited Stage 5G Remote Joining-specific same-capability reconnect hardening. If Host, Join or Close commits at the provider but its acknowledgement is lost, the page retains only the exact unresolved capability in memory and retries that same operation. It does not generate a replacement session, expose the full unresolved capability for copy, permit Forget/replacement Host/Join while unresolved, accept authority-context drift, mutate canonical local saves, or resurrect terminal state.

Stage 5F production acceptance remains PASS in `PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md`.

Fixed RJR-1 remains `91/100` with domain vector:

- deterministic sync and recovery safety: 20/20
- identity, authentication, authorization and trust: 20/20
- production cloud and security activation: 20/20
- devices, pairing, Connected Rivalry and actual Remote Joining: 22/30
- real-device hardening and stable release: 9/10

No source, test, review, CI, merge, deployment, release-version, documentation, WEC or repeated-proof credit is included. A score increase requires genuinely new accepted Remote Joining-specific capability evidence.

Current Work Environment Continuity (WEC) execution authority is `we-2026-09-04-stage5g-reconnect-recovery`. Future environments must enter through the Work Environment Continuity system, independently validate live repository/provider evidence, archive the predecessor only at its actual closure boundary, initialize a fresh unique WEC with reset counters, and obey that fresh environment's own assessment. The predecessor `we-2026-09-04-pr191-publication-stage5g` remains immutable archived transition provenance.

## Current lane

Finish v1.9.1-r1 exact-head automation, review, expected-head merge, post-merge validation and deployed-byte/runtime proof. Stage 5G two-device/two-network reconnect and adverse-network hardening is the active automated capability target: exact Host/Join/Close retry after ambiguous acknowledgement loss, one provider session, no phantom success, lifecycle monotonicity, capability privacy and unchanged canonical local Save bytes.

Only after every automatable boundary is exhausted should owner interaction be requested for genuinely physical two-device/two-independent-network behavior that cannot be simulated or provider-proven. After that boundary is genuinely evidence-complete, final stable Remote Joining release acceptance remains the explicit last lane toward genuine RJR100.

## Protected baselines and permanent locks

The Installable Offline App remains the local-first startup/recovery baseline. The v1.3.0 Recovery & Device Resilience baseline and Local Profiles / Save Library remain protected. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Billing is permanently forbidden and Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Cloud Run and Cloud Functions remain forbidden because they require billing under this architecture. Trusted-runtime IAM remains unactivated/unbroadened.

Candidate A is non-mutating; Candidate B is read-only; Candidate C remains the sole destructive remote-to-local gameplay Apply authority with strict exact raw snapshot and transaction-owned rollback. Exactly two private managers remain mandatory. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain full private pairing/session capabilities. The protected historical rivalry must not be used for destructive testing.

Historical project-state overrides remain available through versioned prior handoffs and repository history; this current override intentionally replaces stale inline state.