# Career Mode Showdown v1.9.0-r2 Maintenance Handoff

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN
Application version: `v1.9.0`
Runtime revision: `1.9.0-r2`
Previous known-good whole shell: `1.8.1-r5`
Remote Joining readiness: `87/100` under fixed model `RJR-1`

## Purpose

`1.9.0-r2` is the bounded Private Remote Joining maintenance candidate that repairs the real production Connected Rivalry restore blocker discovered during the first two-account Stage 5E acceptance on `1.9.0-r1`.

Player Two could successfully complete private pairing and attach the exact Connected Rivalry, but reopening Save Library or entering Remote Joining reinitialized Connected Rivalry from the first local manager binding instead of restoring the valid durable pointer for the actual attached manager. When Player Two was the second local binding, the visible state incorrectly returned to Player One / `Not attached`, preventing the valid Player Two context from reaching Join.

The repair resolves durable Connected Rivalry pointers across every available local manager binding. An existing valid in-memory binding remains stable; otherwise the most recently attached valid pointer for the current authenticated account and registered browser device wins. Binding order no longer discards Player Two attachment authority.

## Pairing to Connected Rivalry quality of life

The private pairing capability is already the exact `pair_...` rivalry ID. `1.9.0-r2` carries that identifier forward automatically instead of asking the owner to copy the same long code into Connected Rivalry a second time.

On the creator browser, generating a pairing code immediately prefills Connected Rivalry with the exact same ID. Before the other manager joins, that prefill is page-memory-only and is not authority: Refresh, Publish and Remote Joining remain unavailable because no Connected Rivalry pointer is fabricated.

On the joining browser, a successful private-pairing redemption keeps the exact redeemed rivalry ID in page memory and immediately reuses the existing verified Connected Rivalry attachment path. If provider authority confirms the now-active exactly-two-manager rivalry, the normal dedicated IndexedDB pointer is persisted automatically for the selected Player One or Player Two binding.

On the creator browser, after the peer joins, the next ordinary Save Library or Remote Joining initialization verifies the now-active exact rivalry and persists the normal pointer automatically. Manual Attach remains available as a recovery fallback, but the normal flow no longer requires a second copy and paste.

This convenience layer adds no provider polling, collection listing, public discovery, Firebase service, localStorage key, Security Rules authority or alternate authorization mechanism. A full reload still discards an unverified page-memory pairing capability; the release does not weaken the existing memory-only capability boundary merely for convenience.

## Locked safety boundary

Firebase remains Spark and billing remains permanently forbidden. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select a paid provider path. Firestore persistence remains memory-only. App Check enforcement remains OFF.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. The private-session capability remains page-memory-only. The Connected Rivalry convenience pointer remains in the already-established dedicated IndexedDB store and grants no authority without exact provider verification.

Candidate C remains the sole destructive remote-to-local Apply authority. Candidate C preserves immutable confirmed intent, verified backup before mutation, strict exact raw snapshot guards, transaction-owned mutation, stale-state and anti-clobber rejection, ownership-scoped reverse rollback, and exact recovery verification. `1.9.0-r2` does not bypass or broaden that authority.

The Installable Offline App and local Career Mode remain independent of Firebase. Provider or Spark quota failure must fail closed while local play remains available. The protected historical rivalry must not be edited, forced, deleted, or used for destructive testing.

## Runtime activation boundary

`service-worker.js` uses the new `1.9.0-r2` whole-shell cache identity so a browser cannot silently keep the broken `r1` Connected Rivalry implementation after the maintenance runtime is deployed. The known-good recovery target remains the whole `1.8.1-r5` shell until `r2` is independently production-proven.

Private Remote Joining remains lazy. Ordinary startup does not execute the Stage 5A private-session protocol or Stage 5C standard-auth adapter. Opening the Remote Joining panel loads only its presentation surface; provider/account/device/rivalry dependencies resolve only on explicit Host, Join, Refresh/Read, Revoke or Close operations.

The production Firestore Rules authority remains the exact provider-live Stage 5D source. This maintenance candidate does not mutate Firestore Rules, provider IAM, authentication policy, App Check enforcement or billing.

## Candidate evidence

The permanent Connected Rivalry regression contract proves the exact production failure case: Player Two's durable pointer restores even when Player One appears first in local binding order, the newest valid durable pointer wins on a fresh initialization, an already-active valid binding remains stable, and no-pointer initialization never fabricates attachment authority.

The same contract proves the pairing quality-of-life handoff: the exact pairing capability becomes the exact Connected Rivalry ID without transformation; the selected pairing manager binding is preserved; invalid or unmatched pairing candidates cannot fabricate authority; automatic handoff reuses the existing verified attachment function; the Connected Rivalry field is visibly prefilled; Player Two retains the redeemed ID after successful pairing; and the implementation contains neither provider polling nor a new localStorage dependency.

Stage 5E contracts continue to prove exact Host, Join, Read/Refresh, Revoke and Close wiring, standard Firebase UID authority, registered-device mutation metadata, exact-path access, memory-only session capability, no listing, no canonical-storage mutation, no gameplay mutation, and zero RJR inflation from source/runtime work.

## Publication and recovery rule

This file describes a release candidate, not a production-proven runtime. `1.8.1-r5` remains the previous production-proven whole-shell recovery target until exact-head CI and review, expected-head merge, Pages deployment, deployed-byte/runtime verification and production smoke gates prove `1.9.0-r2`.

Never construct a mixed-version rollback. If a concrete `r2` regression requires recovery before production promotion is proven, restore the previous whole shell rather than selectively mixing runtime generations.

RJR remains exactly `87/100` through this bug repair, quality-of-life automation, source, tests, CI, review, merge and deployment mechanics. A score change requires genuine fixed-domain production capability evidence. After `1.9.0-r2` is deployed and independently verified, resume only the interrupted real provider-live two-account Private Remote Joining acceptance with a fresh session capability: Host → Join → Refresh/Read → Close across the two registered manager contexts. Stable real-device release acceptance remains a separate evidence gate.