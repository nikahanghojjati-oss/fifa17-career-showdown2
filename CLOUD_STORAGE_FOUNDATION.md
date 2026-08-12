# Career Mode Showdown — Cloud Storage Foundation Contract

Last updated: 2026-08-12
Status: future architecture contract only; no cloud runtime is authorized by this document
Current dependency boundary: v1.8.0 Cloud Readiness, then v1.9.0 opt-in Cloud Backup Beta

## 1. Purpose and hard boundary

This document defines the minimum identity, revision, conflict, deletion, privacy and security semantics that future cloud work must satisfy. It does not authorize a backend, account system, network write path or cloud UI in v1.1.5.

The present application remains local-first. `js/storage.js` remains sole canonical browser-persistence authority. A future sync engine may observe and propose validated state transitions, but it must not mutate the current canonical model by bypassing the same transaction/revalidation boundary used by local recovery.

Cloud implementation remains dependency-blocked behind the approved roadmap: recovery → offline/PWA → stable local profiles/save registry → cloud readiness → opt-in cloud backup.

## 2. Identity model

Future synchronization must separate identities that have different lifetimes. Never overload one identifier to mean all of them.

Required concepts:

- `accountId`: remote authenticated principal. Not required for local-only use.
- `profileId`: stable local/remote manager-profile namespace introduced by the local profile milestone.
- `saveId`: stable identity of one rivalry/save. Existing Showdown identity must be migrated deliberately rather than silently regenerated.
- `deviceId`: revocable identifier for a registered device in remote account state. It must not be used as a secret.
- `installationId`: local installation/session lineage used for diagnostics/sync attribution where appropriate. It is not an account credential.
- `objectType`: the synchronization domain, such as save metadata, active rivalry state, Legacy record, preferences or future challenge/content state.
- `objectId`: stable identity within an object type.

Identity rules:

1. identity is independent of filenames, display names, timestamps and cache revisions;
2. renaming a Showdown does not create a new save identity;
3. a server must authorize every object operation against the authenticated account/profile namespace;
4. client-provided account ownership fields are never trusted as authorization proof;
5. identifiers should be unguessable where exposure creates enumeration risk, but unpredictability never replaces access control;
6. device and installation identifiers are metadata, not authentication tokens.

## 3. Revision model

Every remotely synchronized mutable object must have explicit revision authority.

Minimum revision fields:

- `revision`: server-authoritative monotonic revision or opaque equivalent token;
- `baseRevision`: revision the client read and intends to replace;
- `parentRevision`: causal parent for a newly accepted revision where history is retained;
- `contentHash`: deterministic integrity hash of canonical content;
- `updatedAt`: informational display/audit timestamp only;
- `updatedByDeviceId`: attribution metadata only.

Rules:

1. timestamps are never conflict authority;
2. `updatedAt` cannot be used for silent last-write-wins gameplay resolution;
3. remote mutation uses compare-and-swap semantics: the write is accepted only if `baseRevision` still matches server authority;
4. a stale base produces an explicit conflict response, not silent overwrite;
5. retries carry an idempotency key so network repetition cannot create duplicate logical revisions;
6. content hashes detect content identity/corruption but do not authenticate the writer;
7. local transaction preconditions must be rechecked immediately before committing downloaded or merged state.

The v1.1.5 Candidate C pre-write byte precondition and rollback-ownership model is a local prerequisite for this future revision contract.

## 4. Conflict model

A conflict exists when two valid descendants diverge from the same accepted base or when a client attempts to replace a revision it no longer owns.

Required conflict record should preserve:

- object identity;
- common/base revision when known;
- local head revision/content hash;
- remote head revision/content hash;
- origin device metadata where safe;
- conflict creation time;
- resolution status;
- explicit resolution decision and resulting revision.

Rules:

1. active gameplay/rivalry state must never use silent last-write-wins;
2. choose-local, choose-remote or explicit fork are acceptable default resolutions for non-mergeable gameplay state;
3. deterministic automatic merge is allowed only for a domain with a proven associative/idempotent merge contract and permanent tests;
4. Legacy/history merging must preserve stable IDs and surface same-ID/different-content conflicts;
5. preferences may eventually use field-level merge only if each preference has independent semantics and no destructive coupling;
6. a conflict resolution is itself a new revision derived from explicit known heads;
7. unresolved conflicts cannot be hidden by a later unrelated sync.

## 5. Tombstones and deletion

Remote deletion must be represented explicitly. Removing a row/object without a durable deletion revision permits stale clients to resurrect it.

A tombstone needs at minimum:

- object identity;
- deletion revision;
- `baseRevision` / prior live revision;
- prior content hash when policy permits;
- `deletedAt` server timestamp;
- deleting device/account attribution where appropriate;
- retention/compaction eligibility metadata.

Rules:

1. stale live data may not overwrite a newer tombstone;
2. deletion participates in compare-and-swap exactly like a normal revision;
3. offline clients must receive tombstones before they may upload an older live revision;
4. tombstones are not physically purged merely because time elapsed on one client;
5. compaction requires a server policy proving stale-device resurrection risk is acceptably closed, for example retention plus a known-device/revision floor;
6. restore-from-trash, if later offered, creates a new live revision descended from the tombstone rather than erasing deletion history;
7. account-wide deletion/privacy erasure policy may require stronger irreversible deletion than ordinary sync tombstones and must be handled separately.

## 6. Local transaction boundary for future sync

No future cloud module may call localStorage directly.

Downloaded or conflict-resolved state must follow a strengthened Candidate C-style sequence:

1. flush pending local writes;
2. authenticate/authorize the remote response context;
3. validate schema and migration path;
4. capture an exact local raw/revision snapshot;
5. compare the reviewed/local base against the current base;
6. compute the entire candidate result in memory;
7. require explicit conflict decisions where necessary;
8. commit through canonical storage authority only;
9. verify every committed value/revision;
10. rollback only transaction-owned mutations on failure;
11. verify rollback;
12. refuse to overwrite bytes/revisions the transaction can no longer prove it owns;
13. enter an explicit recovery/conflict state if rollback or ownership cannot be proven.

This sequence is mandatory even if a backend claims the remote write is already durable.

## 7. Privacy contract

Cloud features must remain opt-in until the owner explicitly changes product policy.

Minimum privacy rules:

- collect only data required to provide the requested synchronization/account feature;
- local-only use remains possible unless a later owner-approved milestone explicitly changes that rule;
- no public profile, ranking, rivalry feed or discoverability is implied by cloud backup;
- clearly separate private backup data from any future intentionally shared data;
- provide understandable export and deletion paths for remote user data;
- document retention for backups, tombstones, audit/security logs and deleted accounts;
- do not put secrets, auth tokens, email addresses or unnecessary personal data into public URLs, analytics labels or client logs;
- minimize device metadata and avoid fingerprinting beyond what the feature genuinely needs;
- do not treat gameplay data as consent for public sharing;
- future telemetry requires its own explicit data inventory and owner decision.

## 8. Security contract

The browser backup SHA-256 checksum is an integrity mechanism only. It is not authentication, signing, encryption or authorization.

Future remote implementation must provide:

- HTTPS/TLS for all network transport;
- authenticated account/session handling using a proven identity provider or equivalently reviewed design;
- short-lived access tokens where practical and secure refresh/session rotation;
- no long-lived bearer secrets in localStorage when a safer browser mechanism is available;
- server-side authorization on every object read/write/delete;
- least-privilege scopes and service credentials;
- CSRF protection where cookie-based authenticated mutations require it;
- XSS-resistant token/session handling and strict output/input validation;
- replay/idempotency protection for state-changing requests;
- rate limiting and abuse controls on authentication, upload and pairing endpoints;
- size/schema limits before parsing/storing remote payloads;
- encryption at rest for hosted user data using provider/platform controls appropriate to the backend;
- secret rotation and no secrets committed to the static GitHub Pages repository;
- auditability of security-sensitive account/device/delete operations without logging backup contents unnecessarily.

Remote content hashes may be signed or MACed in a future design if authenticity requires it, but plain SHA-256 alone must never be presented as proof that data came from the server or account owner.

## 9. Threat model minimums

Before v1.9 cloud beta, tests/review must cover at least:

- stale client attempts to overwrite a newer revision;
- two devices editing from one base simultaneously;
- stale client attempting to resurrect a tombstoned save;
- duplicate/replayed upload request;
- interrupted upload/download;
- corrupted remote payload;
- wrong-account object ID probing;
- revoked device attempting access;
- expired/invalid session;
- unauthorized delete/restore request;
- local state changing between remote preview and local apply;
- local write/quota failure during downloaded-state apply;
- rollback failure and ownership loss during apply;
- schema downgrade/unsupported future schema;
- oversized or malicious JSON input;
- offline edits followed by reconnect conflict.

## 10. Required roadmap gates

v1.8.0 Cloud Readiness may build repository abstractions, stable sync-ready records and mocked async boundaries, but it must not require a production cloud account to use the app.

v1.9.0 Cloud Backup Beta cannot start until all of the following are true:

1. v1.1 recovery is proven and permanent;
2. v1.2 offline/service-worker behavior has an update/recovery strategy;
3. v1.3 stable profile/save identities and migration are proven;
4. a server/provider, cost and operational ownership decision is documented;
5. account/privacy/data-retention policy is documented;
6. revision/conflict/tombstone semantics from this contract are implemented in a mocked deterministic model first;
7. authentication/authorization threat model is reviewed;
8. rollback/export escape hatches remain available;
9. production secrets are excluded from GitHub Pages/static source;
10. a rollback/disable plan exists for the cloud feature itself.

## 11. Non-negotiable anti-shortcuts

A future developer must not:

- add Firebase/Supabase/another backend merely because it is easy to connect;
- treat `updatedAt` as revision authority;
- silently resolve divergent gameplay state with last-write-wins;
- physically delete remote state without anti-resurrection semantics;
- use device ID as authentication;
- put service-role/admin secrets in client JavaScript;
- call localStorage from a sync module;
- weaken Candidate C transaction verification for remote convenience;
- present SHA-256 backup integrity as encryption or authentication;
- make cloud mandatory before an explicit owner-approved product decision.

## 12. Relationship to the next release

v1.1.5 does not implement cloud storage. It strengthens local confirmed-intent snapshots, exact byte preconditions and rollback ownership because those are necessary building blocks for future revision-safe synchronization. The next legal substantive milestone remains v1.2.0 Installable Offline App.