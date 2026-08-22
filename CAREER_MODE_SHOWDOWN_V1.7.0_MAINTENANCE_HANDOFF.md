# Career Mode Showdown v1.7.0-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / STAGE 4 CONNECTED RIVALRY / NOT PRODUCTION-PROVEN
Application version: `v1.7.0`
Runtime revision: `1.7.0-r1`
Previous known-good whole shell: `1.6.0-r1`
Starting production-proven main: `df3fe061c7df3c4235aa2394623e703a4412ca46`
Branch: `agent/v1.7.0-connected-rivalry-state`
Remote Joining readiness: `69/100` under fixed model `RJR-1` until genuine production capability proof exists

## Purpose

This bounded candidate implements the first Stage 4 Connected Rivalry slice directly after production-proven Registered Devices / Private Pairing. The goal is private authoritative shared-gameplay state for exactly the two paired managers without prematurely implementing Stage 5 Remote Joining sessions.

## Candidate boundary

`v1.6.0 / 1.6.0-r1` remains production-proven until `1.7.0-r1` passes one immutable exact-head source checkpoint, the exact reviewed Stage 4 Firestore Rules are published and verified, merge/deployment succeeds under standing owner authorization, and real production Connected Rivalry proof succeeds.

The candidate must keep App Check enforcement OFF, Firebase Spark / zero billing, Google popup authentication with `browserSessionPersistence`, memory-only Firestore, no additional OAuth scopes and no new trusted backend.

## Connected Rivalry authority

Shared state lives only at `rivalries/{rivalryId}/state/authoritative`. Idempotency receipts live only beneath that exact state at `rivalries/{rivalryId}/state/authoritative/idempotency/{idempotencyKeyHash}`.

Rivalry access remains direct and exact. Client listing, public discovery, matchmaking and invitation directories remain denied. A private IndexedDB rivalry pointer is convenience metadata only; it never grants authorization and never becomes gameplay authority.

Shared-state mutation requires a currently active rivalry with exactly two authorized manager accounts, both accounts active, and the writing browser's registered device still active. Display labels do not authorize.

The client `baseRevision` is immutable across retries. The accepted mutation must advance exactly one monotonic revision. A stale base returns an explicit conflict and must never silently rebase. Last-writer-wins behavior is prohibited.

Idempotency uses the SHA-256 hash of the raw key. A first accepted mutation atomically creates the authoritative state update and its receipt. An exact accepted replay returns the recorded result without another mutation or revision increment. Reusing a key with a different request fingerprint is an explicit idempotency conflict.

Existing tombstoned authoritative state cannot be resurrected by this slice. Rivalry deletion/restore governance remains outside this bounded implementation.

## Local-first and installed-app locks

The Installable Offline App remains a protected baseline. Firebase failure or absence must not block local Career Mode, Save Library, Legacy history, Settings or recovery.

Canonical browser localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. `activeShowdown` remains non-canonical.

The Stage 4 runtime may read the active Save Library snapshot and create a deterministic connected-rivalry projection for publication. It must not directly replace canonical local Save Library bytes with remote content in this first slice.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with transaction-owned mutation, immutable confirmed intent, strict exact raw snapshot authority, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

## Stage 5 lock

Remote Joining session documents remain write-denied. This candidate adds no host/join session orchestration, private-session capability flow, presence, session lobby, reconnect orchestration or public lobby surface.

The dependency order remains:

Cloud / synchronization readiness
→ private account / authentication / authorization and production operational trust
→ Registered Devices / Private Pairing
→ Connected Rivalry
→ Private Remote Joining
→ two-real-device hardening / stable release.

## Validation checkpoint

Before provider publication, one immutable Stage 4 candidate head must prove:

1. complete repository contracts green;
2. all permanent pull-request workflow families green without expanding the existing 14-family topology merely for this stage;
3. Stage 3 device/pairing regression protection green;
4. deterministic Stage 4 client contracts green;
5. Firestore emulator proof for authorized create/update, exact replay, reused-key conflict, stale CAS conflict, third-account denial, account-disable freeze, device-revocation freeze, tombstone anti-resurrection and Stage 5 session-write denial;
6. browser/local-first stability green;
7. submitted reviews clean;
8. inline review threads clean;
9. mergeability clean;
10. no production Stage 4 Rules publication before this source checkpoint is sealed.

RJR-1 remains `69/100` during source-only validation. Source code, documentation, emulator proof and CI do not equal production capability proof.

## Provider publication boundary

After the exact-head source checkpoint is clean, publish exactly the reviewed Stage 4 `firestore.spark.rules` to the existing free production Firebase project. Do not repeat Firebase App setup, Google provider setup, Stage 2 self-account bootstrap configuration, Stage 3 pairing setup or other already-proven console work.

No App Check enforcement change, Blaze upgrade, billing account, Cloud Functions, Cloud Run, Firebase Storage or IAM activation belongs in this gate.

If repository credentials cannot publish the Rules directly, the owner may be asked only for the single exact Rules publication that cannot otherwise be performed. Do not ask the owner to repeat prior setup.

## Merge, deployment and proof

After exact-head source and provider gates are clean, standing owner authorization permits merge/deploy. Production promotion requires deployed `1.7.0-r1` verification and real Connected Rivalry behavior between the two private paired identities.

Only genuine production proof may move `REMOTE_JOINING_READINESS.json`.

## Failure and rollback

If Stage 4 remote operations fail, local Career Mode remains usable and canonical local saves remain authoritative. If the new whole shell is defective, recover to production-proven `1.6.0-r1`. Never mix assets across runtime generations.

## Immediate next task

Finish v1.7.0-r1 source coherence, open the Stage 4 PR, and run exact-head validation. Correct only concrete failures. Do not publish production Rules until all source gates are clean, and do not begin Stage 5 Remote Joining sessions inside this candidate.

Handoff proximity must remain visible in substantive owner-facing project responses. Usage is unavailable and must not be estimated. WEC remains authoritative if it requires an earlier transition.
