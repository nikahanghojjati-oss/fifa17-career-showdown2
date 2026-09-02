# Career Mode Showdown v1.9.0-r2 — Connected Rivalry Restore Hotfix

Status: RELEASE CANDIDATE

Application version: `v1.9.0`

Runtime asset revision: `1.9.0-r2`

Previous known-good runtime: `1.8.1-r5`

## Purpose

This runtime hotfix repairs a production blocker discovered during the first real two-account Stage 5E Remote Joining acceptance on `1.9.0-r1`.

Private pairing and Connected Rivalry attachment succeeded for Player Two, and the exact attachment pointer was persisted in the dedicated `careerModeShowdown.connectedRivalry` IndexedDB. However, reopening Save Library or entering Remote Joining re-ran Connected Rivalry initialization and restored only `bindings[0]`. When the durable pointer belonged to Player Two while Player One was the first local binding, the runtime incorrectly reset visible state to `Not attached`, selected Player One and prevented the valid Player Two context from joining the private session.

`1.9.0-r2` resolves durable attachment across all available local manager bindings. It preserves the current in-memory binding when that binding still has a valid pointer; otherwise it selects the most recently attached valid pointer for the current authenticated account and registered browser device. Binding order no longer discards Player Two attachment authority.

A permanent regression contract proves the exact observed case: Player Two's durable pointer restores even when Player One is the first local binding, newest durable attachment wins after a fresh initialization, an existing valid in-memory binding remains stable, and the no-pointer case never fabricates authority.

## Pairing-to-Connected-Rivalry quality of life

The same exact `pair_...` capability that establishes the private pairing is also the durable Connected Rivalry ID. `1.9.0-r2` now hands that value forward automatically instead of requiring the owner to copy the same long identifier into a second field.

On the creator browser, generating a pairing code immediately prefills Connected Rivalry with the exact same ID. While the second manager has not joined yet, that value remains a non-authoritative page-memory prefill only and no Connected Rivalry pointer is fabricated. After the second manager joins, the creator's next normal Save Library or Remote Joining check verifies the exact active rivalry through the existing Connected Rivalry authority and persists the normal IndexedDB pointer automatically.

On the joining browser, successful pairing retains the redeemed exact rivalry ID in page memory. The existing Connected Rivalry verification path then runs automatically and stores the normal verified pointer for the selected Player Two or Player One binding. Manual `ATTACH CONNECTED RIVALRY` remains available only as a recovery fallback.

This automation adds no provider polling, no collection listing, no new Firebase infrastructure, no new localStorage key and no parallel authorization path. A full page reload still intentionally clears a pairing capability that has not yet become a verified durable Connected Rivalry pointer; that preserves the existing memory-only capability boundary rather than weakening it for convenience.

## Safety boundary

This repair changes client-side restoration and the page-memory handoff into the already verified Connected Rivalry attachment path. It does not create any new Firebase authority or modify shared gameplay state or canonical local Saves beyond the pairing operation the user explicitly requested.

Firebase remains Spark and billing remains forbidden. No Cloud Billing, Blaze, payment method, Cloud Run, Cloud Functions or other billing-required service is introduced. Firestore remains memory-only. App Check enforcement remains OFF.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate C remains the sole destructive remote-to-local gameplay Apply authority. No public listing, discovery, lobby, matchmaking, community or rankings surface is introduced.

The protected historical rivalry remains untouched.

## RJR accounting

Fixed RJR-1 remains `87/100` through this repair, quality-of-life automation, tests, review, merge and deployment. The bug prevented the real production Remote Joining acceptance from completing, but repairing the blocker and eliminating redundant copy/paste are not themselves evidence that Host → Join → Read/Refresh → Close succeeds in production.

After `1.9.0-r2` is deployed and independently verified, repeat only the interrupted production acceptance using a fresh private session capability. Credit RJR only from newly verified production capability evidence.