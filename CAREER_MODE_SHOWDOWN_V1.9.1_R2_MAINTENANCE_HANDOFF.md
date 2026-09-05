# Career Mode Showdown v1.9.1-r2 Maintenance Release Record

Status: DEPLOYED / PRODUCTION-PROVEN
Application version: `v1.9.1`
Runtime revision: `1.9.1-r2`
Previous known-good whole shell: `1.9.1-r1`
Remote Joining readiness: `91/100` under fixed model `RJR-1`

## Purpose

This runtime-only release packages the Stage 5I privacy-safe physical Remote Joining acceptance recorder so the final unavoidable two-physical-device/two-independent-network evidence can be captured deterministically without exposing private authority material. The recorder activates only when the owner explicitly opens the application with `?rjr-acceptance=1`; ordinary production navigation does not load or display it.

Recorder evidence remains page-memory-only until the owner explicitly copies or downloads it. It performs no recorder Firestore writes, no recorder network uploads and no localStorage writes. Raw account ID, registered device ID, rivalry ID and full private session capability are excluded from exported evidence. The same exact 256-bit private session may be correlated across two physical devices only by a one-way SHA-256 capability fingerprint.

## Production evidence

PR #194 exact reviewed head `42f91df5ec1d5a576f0907836fa03f5994d7646b` passed all 15 permanent pull-request workflow families. Expected-head publication merged it to `main` as `11bb681527a9b78884baf0c384350c90493dc9bd`. All 15 permanent main-push workflow runs completed successfully; Stability run `33947112190` passed. The canonical runtime proof is `V1.9.1_R2_PRODUCTION_PROOF.md`.

## Locked safety boundary

Firebase remains Spark and billing remains permanently forbidden. Billing must never be activated. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select any billing-required provider path. Firestore browser persistence remains memory-only. App Check enforcement remains OFF. Google Auth remains popup-only `browserSessionPersistence` with no additional scopes.

Private pairing and Private Remote Joining remain exact non-enumerable capabilities for exactly two private managers with no public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and strict exact raw-snapshot rollback. The Installable Offline App and v1.3.0 Recovery & Device Resilience baseline remain protected. Provider or Spark quota failure must fail closed while local play remains available.

## Evidence and RJR boundary

Stage 5G/5H already prove the automatable same-capability reconnect boundary: lost Host/Join/Close acknowledgement recovery, real Chromium offline/online transitions, one exact session, no duplicate provider mutation, active revision 1 to terminal revision 2 convergence, capability privacy and unchanged canonical local Save storage. Those browser proofs remain zero-credit for the still-open two-physical-device/two-network ledger gap.

Stage 5I adds permanent browser audit coverage for explicit query gating, release-owned r2 loading, real offline/online recorder events, one-way capability correlation, raw-secret exclusion and canonical-storage immutability. Fixed RJR-1 remains `91/100`. Source, tests, CI, review, merge, deployment, documentation, WEC and this maintenance record receive zero RJR credit. A future score increase requires genuinely new accepted physical Remote Joining capability evidence.

## Recovery and next acceptance rule

`1.9.1-r1` remains the previous independently production-proven whole-shell recovery target. Never construct a mixed-version rollback.

The smallest unavoidable owner action after this production-proven r2 boundary is the genuine physical acceptance run: two actual devices on two independent networks, preferably Chromebook Wi-Fi and iPhone cellular, using sanitized recorder JSON. Only accepted physical evidence may move RJR; final stable Remote Joining release acceptance remains separately required before genuine RJR100.
