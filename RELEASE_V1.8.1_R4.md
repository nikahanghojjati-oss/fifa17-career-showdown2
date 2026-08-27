# Career Mode Showdown v1.8.1 — Runtime r4

Status: RELEASE CANDIDATE — APP CHECK TOKEN LIFECYCLE HARDENING

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r4`
Previous known-good runtime: `1.8.1-r3`

## Why r4 exists

Runtime r3 restored and production-proved Connected Account availability while App Check enforcement remains OFF. It already enables Firebase App Check token auto-refresh and records the initial observed token expiry, but the shipped runtime does not explicitly observe a later SDK token transition or prove that a refresh success/failure leaves Connected Account, Connected Rivalry and canonical local saves intact.

Runtime r4 closes that bounded pre-Stage-5 hardening gap without changing provider policy. Firebase remains responsible for refresh scheduling. The production runtime now subscribes to the SDK `onTokenChanged` lifecycle, records only redacted transition metadata, and exposes a bounded explicit `getToken(appCheck, true)` refresh probe for deterministic lifecycle verification and recovery diagnostics. No custom refresh timer is introduced.

## Bounded behavior

- Firebase App Check auto-refresh remains enabled through `isTokenAutoRefreshEnabled: true`.
- `onTokenChanged` observes later SDK token results and records only expiry/change metadata.
- Raw App Check token strings never enter runtime diagnostics, browser storage, logs or authority records.
- A distinct later expiry increments a bounded lifecycle transition counter; duplicate same-expiry notifications do not fabricate new transitions.
- A bounded explicit force-refresh probe can verify success/failure without reinitializing Auth or Firestore.
- Refresh observation failure degrades monitoring only while enforcement is OFF; the initialized Firebase App and existing Connected Account services remain available.
- Connected Rivalry authority and canonical local Save Library state are not mutated by token lifecycle observation or refresh failure.
- App Check enforcement remains OFF.
- No provider configuration, Security Rules, billing, storage, Functions, trusted-runtime IAM or Google Auth scopes change.

## Recovery

`1.8.1-r3` is the previous known-good whole shell. Runtime r3 is the production-proven Connected Account/App Check recovery baseline and remains the direct rollback target if r4 fails promotion or deployed verification.

## Readiness accounting

RJR-1 remains `81/100` until the r4 token-lifecycle capability is independently validated on an exact candidate head. Source changes, release packaging, CI volume and deployment alone earn no readiness points. Any later readiness movement must be limited to genuine fixed-domain evidence that a later token expiry/refresh transition is safely handled while connected/local authority remains intact.

## Promotion gates

Require the exact unchanged r4 candidate head to pass the permanent contract suite including `stage4-token-lifecycle-contracts.cjs`, all permanent workflow families, review/thread/mergeability gates, whole-shell coherence and normal expected-head publication discipline. After deployment, require runtime-byte equality and the normal deployed Stability/App Check journey before treating r4 as production-proven.
