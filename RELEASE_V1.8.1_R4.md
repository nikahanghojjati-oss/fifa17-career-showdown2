# Career Mode Showdown v1.8.1 — Runtime r4

Status: RELEASE CANDIDATE — APP CHECK TOKEN LIFECYCLE HARDENING — CAPABILITY EVIDENCE-PROVEN / DEPLOYMENT PENDING

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r4`
Previous known-good runtime: `1.8.1-r3`

## Why r4 exists

Runtime r3 restored and production-proved Connected Account availability while App Check enforcement remains OFF. It already enables Firebase App Check token auto-refresh and records the initial observed token expiry, but did not explicitly prove a later SDK token transition or prove that refresh success/failure leaves Connected Account, Connected Rivalry and canonical local saves intact.

Runtime r4 closes that bounded pre-Stage-5 hardening gap without changing provider policy. Firebase remains responsible for refresh scheduling. The production runtime subscribes to the SDK `onTokenChanged` lifecycle, records only redacted transition metadata, and exposes a bounded explicit `getToken(appCheck, true)` refresh probe for deterministic lifecycle verification and recovery diagnostics. No custom refresh timer is introduced.

## Bounded behavior

- Firebase App Check auto-refresh remains enabled through `isTokenAutoRefreshEnabled: true`.
- `onTokenChanged` observes later SDK token results and records only expiry/change metadata.
- Raw App Check token strings never enter runtime diagnostics, browser storage, logs or authority records.
- A distinct later expiry increments a bounded lifecycle transition counter; duplicate same-expiry notifications do not fabricate new transitions.
- A bounded explicit force-refresh probe verifies success/failure without reinitializing Auth or Firestore.
- Refresh observation failure degrades monitoring only while enforcement is OFF; the initialized Firebase App and existing Connected Account services remain available.
- Connected Rivalry authority and canonical local Save Library state are not mutated by token lifecycle observation or refresh failure.
- App Check enforcement remains OFF.
- No provider configuration, Security Rules, billing, storage, Functions, trusted-runtime IAM or Google Auth scopes change.

## Evidence checkpoint

Permanent `tests/contracts/stage4-token-lifecycle-contracts.cjs` PASSED inside the repository suite on exact PR #160 branch head `ac465bc781b038860f91620debb7ae7fc7a3e05d`. That PASS establishes a distinct later expiry transition, same-expiry dedupe, bounded force-refresh success/failure, metadata-only observer error, raw-token redaction, preserved Connected Account/Firestore service identity, unchanged Connected Rivalry authority and unchanged canonical local Save bytes. A later WEC wording assertion stopped the same suite after this capability PASS; it did not invalidate the lifecycle evidence.

## Recovery

`1.8.1-r3` is the previous known-good whole shell. Runtime r3 is the production-proven Connected Account/App Check recovery baseline and remains the direct rollback target if r4 fails promotion or deployed verification.

## Readiness accounting

Fixed RJR-1 is now `82/100`. The focused lifecycle proof adds exactly +1 from 81 → 82 in the `production-cloud-security` domain. Source changes, release packaging, CI volume and deployment itself earn no readiness points. Production runtime remains r3 until r4 passes exact-head publication gates and deployed verification.

## Promotion gates

Require the exact unchanged final r4 candidate head to pass the permanent contract suite, all 14 permanent workflow families, review/thread/mergeability gates, whole-shell coherence and normal expected-head publication discipline. After deployment, require runtime-byte equality and the normal deployed Stability/App Check journey before treating r4 as production-proven. Deployment verification closes publication confidence but does not duplicate the already-earned lifecycle capability point.
