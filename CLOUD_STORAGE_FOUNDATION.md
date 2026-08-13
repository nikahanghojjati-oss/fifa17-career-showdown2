# Career Mode Showdown — Cloud Storage Foundation Contract

Last updated: 2026-08-13
Status: future architecture contract only; no cloud backend, runtime, account system or network mutation is authorized
Detailed specification snapshot: commit `c62fae2f030c2a293a3eef97f3d646e86583f9ea`

## Current dependency boundary

v1.2.0 Installable Offline App is production-proven. v1.3.0 Recovery & Device Resilience Hardening is current. Stable Local Profiles and Save Library remains a later local prerequisite before Cloud Readiness and Cloud Backup Beta.

Required order: recovery/data safety → offline/PWA → device/recovery hardening → stable local profile/save identity → Cloud Readiness → Cloud Backup Beta.

## Identity and revision authority

Future sync must keep `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, `objectType` and `objectId` distinct. Renames, timestamps and cache revisions never redefine save identity. Device identity is metadata, not authentication.

Every mutable remote object requires server-authoritative `revision`, client `baseRevision`, causal `parentRevision` where applicable, deterministic `contentHash`, and informational `updatedAt`. Remote mutation uses compare-and-swap. A stale base is an explicit conflict, never silent last-write-wins. Retries require idempotency protection. SHA-256 content hashes provide integrity, not authentication.

## Conflict, deletion and anti-resurrection

Conflicts preserve object identity, known base, local/remote heads and hashes, safe origin metadata, resolution status and explicit resolution. Active gameplay never silently merges divergent state.

Deletion is a revision. A tombstone preserves identity, deletion revision, prior base/hash where policy permits, server deletion time and retention metadata. Stale live state may not overwrite a newer tombstone. Restore creates a new descendant revision. Compaction must prove anti-resurrection safety.

## Canonical local boundary

No future cloud module may call localStorage directly.

Downloaded or conflict-resolved state must pass the same local safety boundary as Candidate C: exact raw snapshot, schema/migration validation, stale-precondition rejection, complete in-memory planning, explicit conflict decisions, last-moment prewrite checks, canonical `js/storage.js` mutation authority, post-write verification, transaction-owned rollback, byte-for-byte rollback verification where applicable, anti-clobber ownership checks and explicit critical recovery on uncertainty.

## Privacy and security

Cloud remains local-first and opt-in unless explicitly changed by the owner. Local-only use remains possible. Private backup implies no public ranking/feed/profile. Remote data needs export/delete and documented retention. Minimize personal/device metadata and keep secrets out of public URLs/logs.

Future remote implementation requires HTTPS/TLS, reviewed authentication, server-side authorization on every object operation, least-privilege access, secure session/token handling, replay/idempotency protection, rate limiting, schema/size limits, appropriate encryption at rest, secret rotation and no privileged secret in static JavaScript.

The browser backup SHA-256 checksum is an integrity mechanism only; it is not authentication, signing, encryption or authorization.

## Required future gates

Before Cloud Backup Beta:

1. Candidate A/B/C recovery remains permanent;
2. v1.2 offline/update recovery remains production-proven;
3. v1.3 Recovery & Device Resilience Hardening is closed;
4. stable local profile/save identity and migration are separately versioned and proven;
5. provider/cost/operations, privacy/retention and authentication/authorization decisions are documented;
6. compare-and-swap conflicts, tombstones, anti-resurrection and deterministic mocked sync are proven;
7. rollback/export and cloud-disable escape hatches exist;
8. production secrets remain outside GitHub Pages/static source.

Do not add a backend merely because it is convenient, use timestamps/device IDs as authority, weaken Candidate C, bypass canonical storage, physically delete without tombstones, or make cloud mandatory without explicit owner approval.
