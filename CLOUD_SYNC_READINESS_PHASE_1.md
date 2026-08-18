# Cloud / Sync Readiness — Phase 1 Deterministic Revision Model

Status: bounded prerequisite implementation for the prioritized Private Remote Joining path
Owner authorization: 2026-08-17 ET
Production network status: no backend, no account system, no remote writes, no Remote Joining runtime

## Goal

Prove the state-transition semantics required by future synchronization before choosing a provider or allowing any network mutation.

This phase is intentionally provider-neutral and non-runtime. It creates a deterministic model that can be tested without credentials, servers, browser persistence or production network behavior.

## Implemented boundary

`js/cloudSyncRevisionModel.js` models one remote synchronization object with:

- server-authoritative monotonic `revision`;
- exact `baseRevision` compare-and-swap;
- explicit stale-write conflict records;
- durable tombstone state and anti-resurrection behavior;
- explicit restore-from-tombstone operation;
- idempotency/replay protection for accepted mutations;
- account/object scope matching;
- device attribution as metadata only;
- deterministic content fingerprints for replay comparison.

The model deliberately contains no `fetch`, `XMLHttpRequest`, WebSocket, `localStorage`, session secret, backend SDK or provider dependency.

It is not referenced by `index.html` or the production optional-module loader. Therefore it does not change the current `v1.4.0 / 1.4.0-r1` shipped application runtime.

## Required behaviors

1. A mutation is accepted only when `baseRevision` equals current authority.
2. Two devices editing from the same base cannot silently overwrite each other; the second stale write returns an explicit conflict.
3. Replaying the same accepted request with the same idempotency key cannot create another revision.
4. Reusing an idempotency key for different logical content is rejected.
5. Deletion creates a newer tombstone revision rather than erasing object identity.
6. A stale live write cannot resurrect a newer tombstone.
7. Restoring a tombstoned object requires the explicit `restore` operation against the current tombstone revision.
8. `deviceId` is attribution only and never authentication.
9. Account/object scope mismatch is rejected before mutation.
10. Timestamps are not conflict authority.

## What this phase does not do

- choose Firebase, Supabase or any other provider;
- create accounts;
- authenticate users;
- persist remote data;
- pair devices;
- create invites or sessions;
- synchronize a live Showdown;
- alter Candidate A/B/C;
- mutate canonical browser storage;
- expose a Remote Joining UI.

## Next dependency gates after Phase 1

Phase 1 does not automatically authorize Phase 2. The next Cloud/Sync Readiness work must remain bounded and should resolve remaining prerequisites in safe order:

1. provider, cost and operational ownership decision;
2. account/privacy/data-retention policy;
3. authentication/authorization threat-model review;
4. remote schema and API boundary around the proven revision model;
5. rollback/disable/export escape-hatch design;
6. deterministic two-device harness expanded to offline/reconnect and deletion scenarios;
7. only then production-capable synchronization work.

After Cloud/Sync Readiness is proven, continue in dependency order to private account/auth/authorization, paired-device/private-session capability, Connected Rivalry synchronization and two-device proof, and finally Private Remote Joining.

Public community, public matchmaking, public profiles and global rankings remain eliminated.
