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

## Safety boundary

This repair changes only client-side restoration of an already verified Connected Rivalry pointer. It does not create, modify or delete a Firebase rivalry, pairing, session, shared gameplay state or canonical local Save.

Firebase remains Spark and billing remains forbidden. No Cloud Billing, Blaze, payment method, Cloud Run, Cloud Functions or other billing-required service is introduced. Firestore remains memory-only. App Check enforcement remains OFF.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate C remains the sole destructive remote-to-local gameplay Apply authority. No public listing, discovery, lobby, matchmaking, community or rankings surface is introduced.

The protected historical rivalry remains untouched.

## RJR accounting

Fixed RJR-1 remains `87/100` through this repair, tests, review, merge and deployment. The bug prevented the real production Remote Joining acceptance from completing, but repairing the blocker is not itself evidence that Host → Join → Read/Refresh → Close succeeds in production.

After `1.9.0-r2` is deployed and independently verified, repeat only the interrupted production acceptance using a fresh private session capability. Credit RJR only from newly verified production capability evidence.
