# Career Mode Showdown — Private Remote Data, Privacy & Retention Policy

Status: Cloud/Sync Readiness Phase 1C architecture authority
Effective: 2026-08-17 ET
Runtime status: architecture/policy only; no Firebase SDK, project connection, credential, remote collection, Auth runtime, Security Rules, Cloud Function, network mutation, pairing or Remote Joining UI is authorized by this document

## 1. Purpose

Define the minimum remote data that the future private connected product may need before any provider is connected.

The governing principle is data minimization: Remote Joining must synchronize only the private two-manager state necessary to operate the authorized connected relationship. It must not silently turn the complete local Save Library into cloud storage, create public identity, or upload unrelated local history.

Optional Private Cloud Backup remains a separate future opt-in product. It is not part of Remote Joining synchronization and is not authorized by this policy.

## 2. Privacy boundary

Career Mode Showdown remains a private two-manager companion.

Remote data is private by default and may be readable only by an authenticated account that is explicitly authorized for the specific private object or session.

The following remain permanently prohibited unless a later owner instruction explicitly reverses the product lock:

- public profiles;
- public search or discovery;
- public matchmaking;
- public community feeds;
- global leaderboards or global rankings;
- public exposure of Save, rivalry, session, device or manager data.

Exactly two manager roles remain the product model.

## 3. Identity separation

Future remote identity must preserve the existing local identity architecture.

- `accountId` identifies the authenticated private account principal.
- `profileId` identifies the stable Career Mode Showdown Local Profile.
- `saveId` identifies a stable local Save.
- `seasonId` identifies a stable Season.
- `deviceId` identifies a registered/revocable device record but is never authentication.
- `installationId` identifies an installation instance for recovery/sync diagnostics but is never authentication.
- display labels are presentation only and never establish identity.

A remote account may explicitly link only to stable IDs that the user has authorized. Same visible names never create account/profile linkage. Unresolved historical Local Profile roles remain unresolved until explicitly mapped.

## 4. Remote data classes allowed in principle

This section defines data classes and minimum purpose. Phase 1D must define exact schema and fields. No collection/path/provider implementation is authorized here.

### 4.1 Account principal metadata

Purpose: bind private connected objects to an authenticated account.

Minimum application-owned metadata:

- `accountId`;
- account lifecycle state needed for authorization, such as active/deletion-pending/disabled;
- minimal creation/lifecycle timestamps only when operationally required.

Do not duplicate authentication credentials, password material, provider tokens or email addresses into application data merely for convenience. Authentication-provider data remains provider-owned unless a later feature has a specific product need.

### 4.2 Account-to-profile authorization linkage

Purpose: prove which stable Local Profile identities an account has explicitly linked for connected play.

Minimum concepts:

- `accountId`;
- `profileId`;
- explicit linkage status;
- linkage creation/revocation metadata required for authorization.

Display-name equality is never linkage authority.

### 4.3 Connected rivalry / shared Save authority

Purpose: synchronize only the shared rivalry state required by the two authorized managers.

Minimum concepts:

- stable private object identity such as `saveId` and connected-rivalry/session identity;
- the two authorized manager/account relationships;
- stable `profileId` references used by the shared rivalry;
- shared Showdown/Season content that both managers must observe;
- `revision`, `parentRevision`, `contentHash`, tombstone state and other Phase 1A synchronization authority;
- minimum timestamps for lifecycle/diagnostic use, never as conflict authority.

Remote Joining does not authorize automatic upload of every local Save. A local Save becomes remote only through an explicit connected-flow action defined by a later product candidate.

### 4.4 Registered device metadata

Purpose: support revocation and secure private-device participation.

Minimum concepts:

- `accountId`;
- `deviceId`;
- `installationId` where required by the final security model;
- registration state;
- revocation state/time;
- minimal last-authorized/synchronization metadata only if required for stale-device policy.

Do not remotely store detailed browsing history, unrelated device telemetry, exact location, contact lists, advertising identifiers or an unnecessary fingerprint of the device.

### 4.5 Private pairing / invite records

Purpose: create a short-lived, private, replay-resistant path for the intended second manager/device.

Minimum concepts:

- private invite/pairing identifier;
- creator/authorizing account scope;
- intended private session/rivalry scope;
- expiration;
- redemption/revocation state;
- one-way representation of any secret token when server-side replay detection requires it.

Raw reusable invite secrets must not be retained in application logs or long-term server records after they are issued.

### 4.6 Private session membership / authorization

Purpose: prove that exactly the intended two manager accounts/devices may participate in one private connected session.

Minimum concepts:

- private session identity;
- the two authorized account/profile roles;
- authorized/revoked membership state;
- bounded session lifecycle metadata;
- device authorization linkage if the final security model requires it.

No public lobby or discoverability index is allowed.

### 4.7 Mutation idempotency / replay metadata

Purpose: ensure retried or replayed remote requests cannot create duplicate logical mutations.

Minimum concepts:

- opaque idempotency key or one-way representation;
- object/account authorization scope;
- accepted revision;
- operation class;
- retention/expiry metadata.

Do not retain full gameplay payload copies merely for idempotency when a fingerprint and accepted revision are sufficient.

### 4.8 Tombstones / deletion authority

Purpose: prevent a stale device from silently resurrecting a deleted object.

Minimum concepts:

- private object identity;
- deletion revision;
- deletion/lifecycle metadata required for authorization and anti-resurrection;
- no deleted gameplay content.

Tombstones are metadata, not backups.

### 4.9 Minimal security/audit metadata

Purpose: diagnose and respond to authorization, revocation, pairing and replay failures.

Permitted application-level events are limited to security-relevant facts such as:

- account/session/device identifier scope;
- event type;
- success/failure classification;
- timestamp;
- relevant object/session identifier;
- bounded reason code.

Do not log passwords, raw authentication tokens, raw invite secrets, full Save payloads, imported backup contents, arbitrary browser storage, message text that does not exist as a product feature, or unrelated browsing/device behavior.

Provider-controlled operational/security logs are a separate provider boundary and must be documented before production enablement.

## 5. Data that remains local-only by default

The following must not be uploaded merely because Remote Joining infrastructure exists:

- Candidate A export files and raw backup envelopes unless the user separately invokes an authorized future Cloud Backup feature;
- Candidate B analysis inputs/results beyond data explicitly needed to perform a user-requested remote operation;
- Candidate C raw restore snapshots, rollback snapshots and corrupt-byte preservation material;
- unshared Save Library Saves;
- unrelated Legacy history;
- local preferences, accessibility, audio and presentation settings unless a later opt-in synchronization feature specifically requires them;
- derived Analytics caches and presentation caches;
- browser-storage raw bytes;
- local diagnostic/recovery state that is not needed for a remote security decision;
- files selected by the user for import/export;
- any personal data unrelated to the two-manager private companion.

The local three-key canonical storage architecture remains independent from remote storage. No future cloud module may directly own `localStorage`.

## 6. Data-minimization rules

1. A field may be remote only when a documented connected feature needs it for synchronization, authorization, recovery, security or user-visible private session behavior.
2. Do not collect a field because the provider makes it convenient.
3. Do not duplicate provider-owned authentication secrets/data into application collections without a specific need.
4. Prefer stable opaque IDs over names, email addresses or device descriptions for authorization.
5. Do not retain rejected stale mutation payloads on the server merely to create a conflict log. The client that proposed the stale mutation may retain its local candidate until the user resolves or abandons it.
6. Do not use timestamps as conflict authority.
7. Do not use analytics/telemetry to expand the product into community discovery or rankings.
8. Private Cloud Backup, if later authorized, must be separately opt-in and separately scoped.

## 7. Retention policy

### 7.1 Active connected rivalry state

Retain while the private connected rivalry remains active or intentionally retained by its authorized owners. Mere inactivity must not silently delete an active rivalry.

When an authorized deletion is requested, gameplay content becomes inaccessible to normal connected clients immediately after the deletion mutation is accepted and the object becomes a tombstone under the revision authority.

### 7.2 Tombstones

Retain the minimum tombstone metadata for the lifetime of the owning account/connected namespace unless a later schema proves an equally strong non-resurrection mechanism.

Reason: a long-offline or previously registered stale device must never be able to recreate a deleted object merely because a short tombstone timer expired.

Tombstones must not retain deleted gameplay content. Account deletion must remove tombstones as part of account-scoped cleanup after access is revoked.

### 7.3 Registered device records

Retain active registered-device metadata while the device remains registered.

When revoked, retain only the minimum revocation metadata required to prevent the revoked device identity from silently regaining authority. Remove it during account-scoped deletion after authorization is revoked.

### 7.4 Pairing / invite records

A raw invite secret must be short-lived and must never be stored in logs.

The later pairing design must use an explicit expiration measured in minutes, not days. Phase 1D/Stage 3 will choose the exact duration after threat-model testing.

After expiration, redemption or revocation, retain only the minimum one-way/replay/security metadata for no more than 7 days unless a documented security incident requires a separately controlled preservation process. Then delete it.

### 7.5 Private transport/session records

Ephemeral transport/presence state must expire promptly after the private session ends or disconnect recovery can no longer validly resume it.

Authorization/membership that belongs to a continuing Connected Rivalry may remain with that rivalry until explicitly revoked. Do not confuse continuing rivalry membership with ephemeral transport presence.

### 7.6 Idempotency metadata

Retain accepted-mutation idempotency metadata for 7 days by default. Phase 1D may extend this only if deterministic retry/offline tests prove a longer replay window is necessary.

Even after idempotency metadata expires, revision/baseRevision authority and tombstones must still prevent duplicate or stale logical state from being accepted silently.

### 7.7 Security/audit metadata

Retain app-controlled security/audit metadata for 30 days by default, then delete it automatically unless a documented unresolved security incident requires a separately controlled longer hold.

Security logs must contain reason codes and opaque identifiers rather than gameplay payloads or secrets.

### 7.8 Account deletion

An account-deletion request must immediately revoke normal remote access and new mutation authority for that account.

Production account deletion is not ready until the provider-specific implementation can prove complete cleanup of application-controlled:

- account metadata;
- account/profile links;
- connected rivalry data owned solely by the deleting account, subject to an explicit two-owner shared-object policy defined in Phase 1D;
- device registrations/revocation records;
- invites/pairing records;
- session memberships;
- idempotency metadata;
- tombstones;
- app-controlled audit metadata.

Phase 1D must define the exact policy for a shared two-owner rivalry when only one account requests deletion: the deleting account's access and identifying linkage must be revoked without silently destroying data that the other authorized owner is entitled to retain. No name-based remapping is permitted.

Before production provider enablement, Phase 1F must document provider-controlled deletion/backups/log retention separately. Do not claim deletion guarantees stronger than the provider can actually prove.

## 8. Export and portability

Existing local Candidate A / formatVersion 2 export remains the primary local escape hatch and must stay available.

A future connected-data export must be explicit and private. It must not expose another account's authentication secrets, device secrets, security logs or invite tokens.

Remote enablement must never remove local export/import portability.

## 9. Conflict privacy

A stale write is rejected, not preserved as a hidden server-side competing copy by default.

The conflict response may return the minimum authoritative remote revision/hash/tombstone metadata needed for the client to explain the conflict. Full remote content may be returned only through a separately authorized read that the authenticated account is permitted to access.

The local client may retain its unsent/proposed local state until the user explicitly resolves, retries or discards it.

## 10. Cloud disable / outage / rollback behavior

Connected infrastructure must remain feature-gated.

If the provider is unavailable, disabled, misconfigured or rolled back:

- local-only use must remain available;
- existing local Save Library data must not be deleted;
- Candidate A export, Candidate B analysis, Candidate C recovery and formatVersion 2 portability must remain available;
- the client must not pretend a remote mutation succeeded;
- queued/retry intent must retain immutable `baseRevision` and be re-authorized/revalidated before later submission;
- no remote module may bypass local transaction authority to force downloaded state into canonical storage.

## 11. Region-selection criteria

No Firebase/Firestore region is selected in Phase 1C.

Before provider creation/production data, select region intentionally using:

- location of the actual two-manager user base;
- latency for the private session path;
- provider availability for required Auth/Firestore/server-only capabilities;
- data-residency/privacy requirements that apply at implementation time;
- pricing/egress implications;
- backup/disaster-recovery behavior;
- compatibility with any later server-only pairing/session component.

Region selection must be recorded before real remote user data is stored.

## 12. Prohibited implementation shortcuts

Phase 1C does not authorize:

- Firebase SDK installation;
- Firebase project creation as a production dependency;
- Auth UI/runtime;
- Firestore collection/schema creation;
- Security Rules deployment;
- Cloud Functions;
- enabling Firestore persistent offline cache;
- public profile/search/matchmaking data;
- automatic upload of the entire Save Library;
- private Cloud Backup;
- device pairing runtime;
- Connected Rivalry runtime;
- Remote Joining UI/runtime.

## 13. Phase 1C completion gate

Phase 1C is complete when repository contracts prove that:

- all permitted remote data classes and purposes are explicit;
- local-only classes are explicit;
- retention/deletion rules are explicit;
- tombstones cannot become content backups and remain strong enough to prevent stale resurrection;
- invite/idempotency/security metadata have bounded retention;
- account deletion and shared-object ambiguity are explicitly gated for Phase 1D resolution;
- public/community/global ranking features remain eliminated;
- optional Cloud Backup remains separate;
- no production runtime/provider connection was introduced.

After Phase 1C is merged, the next bounded prerequisite is Phase 1D: exact provider-compatible remote schema and API/authorization contract. Phase 1D still must not jump directly to production Remote Joining.