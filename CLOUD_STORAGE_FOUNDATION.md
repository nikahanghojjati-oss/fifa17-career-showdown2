# Career Mode Showdown — Cloud Storage Foundation Contract

Last updated: 2026-08-17 ET (Remote Joining priority clarification)
Status: future architecture contract only; no cloud runtime is authorized by this document
Current dependency boundary: v1.4.0 Product Deepening is the current application milestone, while v1.3.0 Recovery & Device Resilience Hardening remains the protected resilience baseline. Local Profiles/Save Library, identity-safe Analytics and formatVersion 2 multi-Save portability are completed local dependencies. Cloud Readiness remains future/not authorized today, but the owner has designated Cloud/sync readiness as the first enabling layer of the prioritized long-term Private Remote Joining path.

## 1. Purpose and hard boundary

This document defines the minimum identity, revision, conflict, deletion, privacy and security semantics that future cloud work must satisfy. It does not authorize a backend, account system, network write path or cloud UI in the current local-first product.

The present application remains local-first. `js/storage.js` remains sole public raw browser-persistence authority. `js/storageTransaction.js` remains raw transaction authority and `js/saveLibraryRuntime.js` remains current Save Library product mutation authority. A future sync engine may observe and propose validated state transitions, but it must not mutate canonical state by bypassing the same transaction/revalidation boundary used by local recovery.

Cloud implementation remains dependency-ordered behind the already completed local chain:

v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles/Save Library
→ Cloud Readiness
→ opt-in Cloud Backup.

The first two dependencies above are already shipped. Their presence in this chain describes prerequisite order, not unfinished work. Optional Private Cloud Backup remains one potential consumer of the Cloud foundation; it is not by itself the transport/session layer for Remote Joining.

For the owner-prioritized Private Remote Joining destination, the broader enabling order is:

proven local recovery/identity/portability
→ Cloud / synchronization readiness
→ private account / authentication / authorization identity
→ secure paired-device / private-session capability
→ Connected Rivalry synchronization with stale-write/conflict/offline/two-device proof
→ Private Remote Joining.

This priority does not authorize any of those future runtime layers today. Each layer still requires its own bounded implementation authorization.

Historical roadmap versions such as v1.8 Cloud Readiness and v1.9 Cloud Backup are planning references only. No later release version is assigned by this document.

## 2. Identity model

Future synchronization must separate identities with different lifetimes. Never overload one identifier to mean all of them.

Required concepts:

- `accountId`: remote authenticated principal. Not required for local-only use.
- `profileId`: stable Local Profile identity already present in the shipped Save Library. A profile ID is authoritative for that profile record but does not by itself prove that different profiles across different Saves represent the same real person.
- `saveId`: stable identity of one rivalry/Save.
- `deviceId`: revocable identifier for a registered remote device. It is metadata, not a secret.
- `installationId`: installation/session lineage for diagnostics or sync attribution where appropriate. It is not an account credential.
- `objectType`: synchronization domain, such as Save metadata, active rivalry state, Legacy record, preferences or future content state.
- `objectId`: stable identity within an object type.

Identity rules:

1. identity is independent of filenames, display names, timestamps and cache revisions;
2. display-name equality never establishes profile or account identity;
3. renaming a Showdown does not create a new save identity;
4. a server must authorize every object operation against the authenticated account/profile namespace;
5. client-provided account ownership fields are never trusted as authorization proof;
6. identifiers should be unguessable where exposure creates enumeration risk, but unpredictability never replaces access control;
7. device and installation identifiers are metadata, not authentication tokens;
8. unresolved historical Local Profile relationships must remain unresolved until an explicit identity policy/mapping proves them.

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

Candidate C's confirmed-intent, exact raw precondition and rollback-ownership model remains a permanent local prerequisite for this future revision contract.

## 4. Conflict model

A conflict exists when two valid descendants diverge from the same accepted base or when a client attempts to replace a revision it no longer owns.

Required conflict records should preserve:

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
6. conflict resolution is itself a new revision derived from explicit known heads;
7. unresolved conflicts cannot be hidden by a later unrelated sync.

## 5. Tombstones and deletion

Remote deletion must be represented explicitly. Removing an object without a durable deletion revision permits stale clients to resurrect it.

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
5. compaction requires a server policy proving stale-device resurrection risk is acceptably closed;
6. restore-from-trash, if later offered, creates a new live revision descended from the tombstone rather than erasing deletion history;
7. account-wide privacy deletion may require stronger irreversible deletion than ordinary sync tombstones and must be handled separately.

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
- no public profile, ranking, rivalry feed or discoverability is implied by Cloud Backup or Private Remote Joining;
- clearly separate private backup/synchronization data from any intentionally shared private-session data;
- provide understandable export and deletion paths for remote user data;
- document retention for backups, tombstones, audit/security logs and deleted accounts;
- do not put secrets, auth tokens, email addresses or unnecessary personal data into public URLs, analytics labels or client logs;
- minimize device metadata and avoid fingerprinting beyond what the feature genuinely needs;
- do not treat gameplay data as consent for public sharing;
- future telemetry requires its own explicit data inventory and owner decision.

Private Remote Joining must remain private by default. Pairing/session capability must not silently create public discoverability, public matchmaking, public profiles or global rankings.

## 8. Security contract

The browser backup SHA-256 checksum is an integrity mechanism, not authentication, signing, encryption or authorization.

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
- encryption at rest using provider/platform controls appropriate to the backend;
- secret rotation and no secrets committed to the static GitHub Pages repository;
- auditability of security-sensitive account/device/delete operations without logging backup contents unnecessarily.

Remote content hashes may be signed or MACed in a future design if authenticity requires it, but plain SHA-256 alone must never be presented as proof that data came from the server or account owner.

## 9. Threat model minimums

Before any future Cloud Backup beta or Remote Joining network beta, tests/review must cover at least:

- stale client attempts to overwrite a newer revision;
- two devices editing from one base simultaneously;
- stale client attempting to resurrect a tombstoned Save;
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
- offline edits followed by reconnect conflict;
- unauthorized or replayed pairing/invite attempt;
- one paired device being revoked while another session is active;
- private session data being requested by an unrelated authenticated account.

## 10. Required dependency gates

Cloud Readiness may eventually build repository abstractions, stable sync-ready records and mocked async boundaries, but it must not require a production cloud account to use the app.

The following current prerequisites are already satisfied and must remain protected:

1. Data Safety and Recovery is proven and permanent;
2. Installable Offline App behavior has a proven update/recovery strategy;
3. v1.3 Recovery & Device Resilience Hardening is closed;
4. stable Local Profiles/Save Library identity and migration are production-proven;
5. formatVersion 2 complete multi-Save portability and recovery semantics are production-proven.

Opt-in Cloud Backup or any Remote Joining sync foundation still cannot start until the relevant remaining future gates are satisfied:

6. a server/provider, cost and operational ownership decision is documented;
7. account/privacy/data-retention policy is documented;
8. revision/conflict/tombstone semantics from this contract are implemented in a mocked deterministic model first;
9. authentication/authorization threat model is reviewed;
10. rollback/export escape hatches remain available;
11. production secrets are excluded from GitHub Pages/static source;
12. a rollback/disable plan exists for the cloud/network feature itself;
13. remote identity semantics do not silently guess unresolved local/historical manager relationships;
14. two-device simulation proves stale writes, conflicts, deletion and recovery behavior before production sync.

The prioritized Remote Joining path adds further gates before Remote Joining itself:

15. private account/authentication/authorization identity is proven against the object-access model;
16. device registration, revocation and private-session pairing are proven without treating `deviceId` as authentication;
17. invite/session replay and unauthorized-join cases are permanently tested;
18. Connected Rivalry synchronization proves stale-write protection, conflict behavior and offline/reconnect recovery across two devices;
19. the one-device/local-first path remains available and recoverable unless a later explicit owner decision changes that product rule;
20. only after these gates pass may a bounded Remote Joining UX/runtime candidate be authorized.

Cloud Readiness, Cloud Backup, private identity, paired-device capability, Connected Rivalry and Remote Joining remain separate bounded stages. The owner's priority instruction orders them; it does not collapse them into one implementation.

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
- make cloud mandatory before an explicit owner-approved product decision;
- reinterpret distinct or unresolved Local Profiles by matching display names;
- implement Remote Joining before its Cloud/sync, identity/auth, paired-session and Connected Rivalry prerequisites are proven;
- use the prerequisite requirement as a reason to indefinitely deprioritize Remote Joining once the owner-authorized networked roadmap lane has begun.

## 12. Relationship to current production

v1.4.0 — Product Deepening is the current application milestone and `1.4.0-r1` is the current Installable Offline App runtime label. v1.3.0 — Recovery & Device Resilience Hardening remains the protected resilience baseline beneath it, with `1.3.0-r2` as the immediate previous known-good whole shell.

Local Profiles/Save Library, identity-safe Career Analytics and formatVersion 2 multi-Save portability subsequently shipped as completed local dependency milestones. They are no longer future work.

Current production therefore preserves the dependency history:

v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles/Save Library
→ Cloud Readiness
→ opt-in Cloud Backup.

Only the first two entries in that historical cloud/backup chain are implemented. The current v1.4.0 product layer sits above the same protected local foundation.

For the prioritized Private Remote Joining destination, the current strategic path is:

completed local foundation
→ Cloud / synchronization readiness
→ private Identity / authentication / authorization
→ Paired Device / private-session capability
→ Connected Rivalry synchronization and two-device proof
→ Private Remote Joining.

Cloud Readiness, Cloud Backup, accounts, authentication, pairing, synchronization and remote transport remain future/not authorized unless a later explicit owner decision and `NEXT_TASK.md` establish a bounded candidate. The 2026-08-17 priority amendment means the prerequisite path should be advanced deliberately when that future networked lane is opened; it does not authorize premature implementation today.
