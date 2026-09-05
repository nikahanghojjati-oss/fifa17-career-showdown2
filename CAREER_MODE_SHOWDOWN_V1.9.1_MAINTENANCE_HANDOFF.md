# Career Mode Showdown v1.9.1-r1 Maintenance Release Record

Status: RELEASE CANDIDATE — NOT PRODUCTION-PROVEN
Application version: `v1.9.1`
Runtime revision: `1.9.1-r1`
Previous known-good whole shell: `1.9.0-r5`
Remote Joining readiness: `91/100` under fixed model `RJR-1`

## Purpose

This candidate packages the Stage 5G Remote Joining-specific same-capability reconnect hardening into a new whole-shell identity. The browser may now recover safely when an exact Host, Join or Close provider mutation commits but its acknowledgement is lost. The unresolved operation remains page-memory-only and bound to the same account, registered device, exact Connected Rivalry and exact session capability. Retry reuses the exact capability; it never manufactures a replacement session to guess whether the first mutation committed.

The full unresolved capability is hidden from copy, replacement Host/Join and Forget are blocked, authority-context drift fails closed, definitive denials remain distinct from ambiguous transport failures, and terminal Close cannot resurrect. Remote Joining still mutates no canonical local Career Mode Save.

## Locked safety boundary

Firebase remains Spark and billing remains permanently forbidden. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select any billing-required provider path. Firestore browser persistence remains memory-only. App Check enforcement remains OFF. Google Auth remains popup-only `browserSessionPersistence` with no additional scopes.

Private pairing and Private Remote Joining remain exact non-enumerable capabilities for exactly two private managers with no public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and strict exact raw-snapshot rollback. The Installable Offline App and v1.3.0 Recovery & Device Resilience baseline remain protected. Provider or Spark quota failure must fail closed while local play remains available.

## Evidence and RJR boundary

The deterministic Stage 5G contract simulates provider commit followed by lost Host, Join and Close acknowledgements. The two-context Chromium audit exercises Host and peer contexts against one provider session, including same-capability retry, terminal convergence, unresolved capability hiding and canonical local-storage immutability.

Fixed RJR-1 remains `91/100`. Source, tests, CI, review, merge, deployment, documentation, WEC and this maintenance record receive zero RJR credit. A future score increase requires genuinely new accepted capability evidence.

## Publication and recovery rule

`1.9.0-r5` remains the production-proven whole-shell recovery target until this unchanged v1.9.1-r1 head passes every permanent workflow family, final review, expected-head merge, post-merge validation, Pages deployment and independent production byte/runtime verification. Never construct a mixed-version rollback. If a concrete candidate regression appears before production proof, restore the previous whole `1.9.0-r5` shell.