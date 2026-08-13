# Career Mode Showdown — Cloud Storage Foundation Contract

Last updated: 2026-08-13
Status: future architecture/security contract only; no cloud runtime, account system, network mutation path or cloud UI is authorized by this document

Current local boundary: v1.2.0 / `1.2.0-r1` is production-proven. The current substantive milestone is v1.3.0 — Recovery & Device Resilience Hardening. Stable Local Profiles and Save Library remains a later prerequisite before Cloud Readiness and Cloud Backup Beta, but its new numeric version is intentionally pending explicit roadmap reconciliation.

## 1. Purpose and hard boundary

This document defines the minimum identity, revision, conflict, deletion, privacy and security semantics future cloud work must satisfy. The present application remains local-first. `js/storage.js` remains sole canonical browser-persistence authority. A future sync engine may observe and propose validated transitions, but it must not bypass the same exact-snapshot, precondition, verification and transaction-owned rollback boundary used by local recovery.

Cloud implementation remains dependency-blocked behind this semantic order:

recovery/data safety → installable offline/PWA → post-PWA recovery/device hardening → stable local profiles/save registry → Cloud Readiness → opt-in Cloud Backup Beta.

Historical roadmap labels `v1.8.0 Cloud Readiness` and `v1.9.0 Cloud Backup Beta` may still appear in older records. They are planning history, not permission to skip the current local prerequisites or silently renumber future releases.

## 2. Identity model

Future synchronization must separate identities with different lifetimes. Never overload one identifier to mean all of them.

Required concepts:

- `accountId`: remote authenticated principal. Not required for local-only use.
- `profileId`: stable local/remote manager-profile namespace introduced only after the future local-profile milestone is explicitly versioned and proven.
- `saveId`: stable identity of one rivalry/save. Existing Showdown identity must be migrated deliberately rather than silently regenerated.
- `deviceId`: revocable identifier for a registered device in remote account state. It must not be used as a secret.
- `installationId`: local installation lineage used for diagnostics/sync attribution where appropriate. It is not an account credential.
- `objectType`: synchronization domain such as save metadata, active rivalry state, Legacy record, preferences or future challenge/content state.
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

Minimum fields:

- `revision`: server-authoritative monotonic revision or opaque equivalent token;
- `baseRevision`: revision the client read and intends to replace;
- `parentRevision`: causal parent for a newly accepted revision where history is retained;
- `contentHash`: deterministic integrity hash of canonical content;
- `updatedAt`: informational display/audit timestamp only;
- `updatedByDeviceId`: attribution metadata only.

Rules:

1. timestamps are never conflict authority;
2. `updatedAt` cannot be used for silent last-write-wins gameplay resolution;
3. remote mutation uses compare-and-swap: accept the write only if `baseRevision` still matches server authority;
4. a stale base produces an explicit conflict response, not silent overwrite;
5. retries carry an idempotency key so network repetition cannot create duplicate logical revisions;
6. content hashes detect content identity/corruption but do not authenticate the writer;
7. local transaction preconditions are rechecked immediately before committing downloaded or merged state.

Candidate C's strict raw snapshot, last-moment prewrite check and rollback-ownership model remain local prerequisites for any future revision-safe synchronization.

## 4. Conflict model

A conflict exists when two valid descendants diverge from one accepted base or when a client attempts to replace a revision it no longer owns.

A conflict record should preserve:

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
2. choose-local, choose-remote or explicit fork are acceptable defaults for non-mergeable gameplay state;
3. deterministic automatic merge is allowed only for a domain with a proven associative/idempotent merge contract and permanent tests;
4. Legacy/history merging must preserve stable IDs and surface same-ID/different-content conflicts;
5. preferences may use field-level merge only if each preference has independent semantics and no destructive coupling;
6. a conflict resolution is itself a new revision derived from explicit known heads;
7. unresolved conflicts cannot be hidden by a later unrelated sync.

## 5. Tombstones and deletion

Remote deletion must be explicit. Physically removing an object without a durable deletion revision permits stale clients to resurrect it.

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
2. deletion participates in compare-and-swap like a normal revision;
3. offline clients receive tombstones before uploading an older live revision;
4. tombstones are not physically purged merely because time elapsed on one client;
5. compaction requires policy that closes stale-device anti-resurrection risk;
6. restore-from-trash, if offered, creates a new live revision descended from the tombstone rather than erasing deletion history;
7. account-wide privacy erasure may require stronger irreversible deletion than ordinary sync tombstones.

## 6. Local transaction boundary for future sync

No future cloud module may call localStorage directly.

Downloaded or conflict-resolved state must follow a strengthened Candidate C-style sequence:

1. flush pending local writes;
2. authenticate and authorize the remote response context;
3. validate schema and migration path;
4. capture an exact local raw/revision snapshot;
5. compare reviewed/local base against the current base;
6. compute the complete candidate result in memory;
7. require explicit conflict decisions where necessary;
8. commit through canonical storage authority only;
9. verify every committed value/revision;
10. rollback only transaction-owned mutations on failure;
11. verify rollback byte-for-byte where the local format permits;
12. refuse to overwrite bytes/revisions the transaction can no longer prove it owns;
13. enter an explicit recovery/conflict state if rollback or ownership cannot be proven.

This sequence remains mandatory even if a backend reports that the remote write is already durable.

## 7. Privacy contract

Cloud features remain opt-in until the owner explicitly changes product policy.

Minimum rules:

- collect only data required to provide the requested synchronization/account feature;
- local-only use remains possible unless a later owner-approved milestone explicitly changes that policy;
- no public profile, ranking, rivalry feed or discoverability is implied by private cloud backup;
- clearly separate private backup data from intentionally shared data;
- provide understandable export and deletion paths for remote user data;
- document retention for backups, tombstones, audit/security logs and deleted accounts;
- do not put secrets, auth tokens, email addresses or unnecessary personal data into public URLs, analytics labels or client logs;
- minimize device metadata and avoid fingerprinting beyond genuine feature needs;
- do not treat gameplay data as consent for public sharing;
- future telemetry requires a separate data inventory and owner decision.

## 8. Security contract

The browser backup SHA-256 checksum is an integrity mechanism only; it is not authentication, signing, encryption or authorization.

Future remote implementation must provide:

- HTTPS/TLS for all network transport;
- authenticated account/session handling using a proven identity provider or equivalently reviewed design;
- short-lived access tokens where practical and secure refresh/session rotation;
- no long-lived bearer secrets in localStorage when a safer browser mechanism exists;
- server-side authorization on every object read/write/delete;
- least-privilege scopes and service credentials;
- CSRF protection where cookie-based authenticated mutations require it;
- XSS-resistant token/session handling and strict input/output validation;
- replay/idempotency protection for state-changing requests;
- rate limiting and abuse controls on authentication, upload and pairing endpoints;
- size/schema limits before parsing/storing remote payloads;
- appropriate platform encryption at rest for hosted user data;
- secret rotation and no privileged secrets committed to the static GitHub Pages repository;
- auditability of account/device/delete operations without unnecessarily logging backup contents.

Remote content hashes may later be signed or MACed if authenticity requires it, but plain SHA-256 alone must never be presented as proof that data came from the server or account owner.

## 9. Threat model minimums

Before any Cloud Backup Beta, tests/review must cover at least:

- stale client attempting to overwrite a newer revision;
- two devices editing from one base simultaneously;
- stale client attempting to resurrect a tombstoned save;
- duplicate/replayed upload request;
- interrupted upload/download;
- corrupted remote payload;
- wrong-account object-ID probing;
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

Cloud Readiness may introduce repository abstractions, stable sync-ready records and mocked asynchronous boundaries, but it must not require a production cloud account to use the app.

Cloud Backup Beta cannot start until all of the following are true:

1. Candidate A/B/C local recovery is proven and permanent;
2. v1.2.0 offline/service-worker behavior and update/recovery strategy are production-proven;
3. v1.3.0 Recovery & Device Resilience Hardening is closed with its regression evidence;
4. stable local profile/save identities and migration are separately versioned and proven after v1.3 hardening;
5. a server/provider, cost and operational ownership decision is documented;
6. account/privacy/data-retention policy is documented;
7. revision/conflict/tombstone semantics from this contract are implemented in a mocked deterministic model first;
8. authentication/authorization threat model is reviewed;
9. rollback/export escape hatches remain available;
10. production secrets are excluded from GitHub Pages/static source;
11. a rollback/disable plan exists for the cloud feature itself.

## 11. Non-negotiable anti-shortcuts

A future developer must not:

- add Firebase, Supabase or another backend merely because it is easy to connect;
- treat `updatedAt` as revision authority;
- silently resolve divergent gameplay state with last-write-wins;
- physically delete remote state without anti-resurrection semantics;
- use device ID as authentication;
- put service-role/admin secrets in client JavaScript;
- call localStorage from a sync module;
- weaken Candidate C transaction verification for remote convenience;
- present SHA-256 backup integrity as encryption or authentication;
- make cloud mandatory before an explicit owner-approved product decision.

## 12. Relationship to the current release

v1.2.0 is production-proven local/offline authority. v1.3.0 Recovery & Device Resilience Hardening is the next legal substantive milestone and must finish before the persistence model expands to stable Local Profiles and Save Library. Cloud remains future-only and dependency-blocked behind both that local identity work and an explicit later owner-approved Cloud Readiness decision.
