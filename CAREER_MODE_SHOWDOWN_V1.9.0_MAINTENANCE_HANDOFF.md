# Career Mode Showdown v1.9.0-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN
Application version: `v1.9.0`
Runtime revision: `1.9.0-r1`
Previous known-good whole shell: `1.8.1-r5`
Remote Joining readiness: `87/100` under fixed model `RJR-1`

## Purpose

Stage 5E is the first bounded user-facing Private Remote Joining runtime slice after the Stage 5D minimum production session Rules source became provider-live. Showdown Home exposes an explicit Private Remote Joining action. The presentation runtime is lazy: ordinary startup does not execute the Stage 5A private-session protocol or Stage 5C standard-auth adapter, and opening the panel does not initialize Firebase/account/device/rivalry authority until Host, Join, Refresh/Read or Close is explicitly requested.

Host creates a fresh exact 256-bit session capability. Join accepts only the exact capability shared directly by the already-paired other manager. Refresh reads only that exact session path. Close performs the existing terminal active-member close transition. No collection listing, lobby, discovery, matchmaking, community or rankings surface is introduced.

## Locked safety boundary

Firebase remains Spark and billing remains permanently forbidden. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select a paid provider path. Firestore persistence remains memory-only. App Check enforcement remains OFF.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. The session capability is page-memory-only and Stage 5E performs no canonical gameplay-storage mutation. Candidate C remains the sole destructive remote-to-local Apply authority.

Candidate C preserves immutable confirmed intent, verified backup before mutation, strict exact raw snapshot guards, transaction-owned mutation, stale-state and anti-clobber rejection, ownership-scoped reverse rollback, and exact recovery verification. Stage 5E does not bypass or broaden that authority.

The Installable Offline App and local Career Mode remain independent of Firebase. Provider or Spark quota failure must fail closed while local play remains available. The protected historical rivalry must not be edited, forced, deleted, or used for destructive testing.

## Runtime activation boundary

`service-worker.js` may precache the already-reviewed private-session protocol and standard-auth adapter so the new whole shell remains rollback-complete, but precaching is not execution. `index.html`, `js/app.js`, and `js/productionFirebaseRuntime.js` do not directly bootstrap the Stage 5A/Stage 5C session adapters during ordinary startup. The Stage 5E Remote Joining surface loads its own presentation runtime only after the explicit dashboard action, then resolves provider dependencies only on explicit session operations.

The provider Rules authority remains the exact reviewed Stage 5D/Stage 5C source. This runtime slice does not mutate Firestore Rules or provider IAM.

## Candidate evidence

The Stage 5E deterministic contract proves exact Host, Join, Read/Refresh and Close wiring, standard Firebase UID authority, registered-device mutation metadata, exact-path access, memory-only session capability, no listing, no canonical-storage mutation, no gameplay mutation, and zero RJR inflation from source/runtime work.

The rendered Chromium audit must prove ordinary startup contains no Remote Joining runtime/dependency execution; opening the panel loads only the presentation surface; provider dependencies remain unloaded before an explicit session action; and canonical local storage remains byte-for-byte unchanged.

The fixed startup budget remains unchanged at 165000 raw bytes and 37500 gzip bytes. The current Stage 5E candidate measurement is 163072 raw bytes and 37497 gzip bytes.

## Publication and recovery rule

This file describes a release candidate, not a production-proven runtime. `1.8.1-r5` remains the previous production-proven whole-shell recovery target until exact-head CI/review, expected-head merge, Pages deployment, deployed-byte/runtime verification and production smoke gates prove `1.9.0-r1`.

Never construct a mixed-version rollback. If a concrete Stage 5E regression requires recovery before production promotion is proven, restore the previous whole shell rather than selectively mixing runtime generations.

RJR remains exactly `87/100` through source, CI, review, merge and deployment mechanics. A score change requires genuine fixed-domain production capability evidence. The next distinct evidence gate is real provider-live two-account/two-device Private Remote Joining Host → Join → Refresh/Read → Close across registered devices, followed separately by real-device stable-release acceptance. If that evidence cannot be obtained in the current environment, record the unconsumed gate without inventing capability credit.
