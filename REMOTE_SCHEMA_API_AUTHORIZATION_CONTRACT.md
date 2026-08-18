# Cloud/Sync Readiness Phase 1D — Remote Schema, API and Authorization Contract

Status: architecture contract only. No production Firebase SDK, Firebase Auth runtime, Firestore data, Security Rules deployment, account UI, pairing runtime, Connected Rivalry runtime, Cloud Backup or Remote Joining UI is authorized by this document.

Provider target: Firebase Authentication + Cloud Firestore remains the primary future provider candidate selected in `CLOUD_PROVIDER_DECISION_2026-08-17.md`. This contract is deliberately provider-compatible rather than provider-connected.

Production identity remains v1.4.0 / `1.4.0-r1`. This phase adds dormant source, architecture and permanent tests only, so `VERSIONING_POLICY.md` does not require an application version bump.

## 1. Non-negotiable boundaries

1. Firebase Auth is future authentication principal authority. Cloud Firestore is future application remote-data storage.
2. Firestore persistent offline cache remains disabled for Career Mode Showdown synchronization.
3. The project-owned revision / immutable `baseRevision` / explicit conflict model remains authoritative.
4. Firestore transaction retry may rerun provider work, but may never replace or refresh the original client's `baseRevision`.
5. No silent last-write-wins behavior is accepted.
6. No public collection listing, lobby, discovery, matchmaking, public profile, public community, leaderboard or global ranking is permitted.
7. No privileged Firebase/Admin credential, private key or service credential may enter the GitHub Pages client or repository.
8. Remote data is limited to the explicitly connected rivalry. An unshared Save Library Save is local-only by default.
9. Candidate A export, Candidate B analysis material, Candidate C restore snapshots / rollback material / corrupt bytes, unrelated Legacy data and local preferences remain local-only by default.
10. No remote module may own or directly mutate `localStorage`. Future downloaded state reaches canonical storage only through the existing local transaction / Candidate C-grade recovery authorities.

## 2. Identity model

These identifiers are permanently distinct namespaces:

- `accountId`: authenticated provider principal. For the Firebase candidate, the canonical mapping is the Firebase Auth `uid`.
- `profileId`: stable Local Profile `profile_*` identity.
- `saveId`: stable Save `save_*` identity.
- `seasonId`: stable Season `season_*` identity.
- `deviceId`: registered application device identity used for attribution and revocation checks. It is never authentication.
- `installationId`: installation-instance metadata. It is never authentication and never a substitute for `deviceId`.
- `rivalryId`: opaque private Connected Rivalry identity.
- `sessionId`: opaque private Remote Joining/session identity.
- `inviteId`: opaque one-time private capability identifier.

Display labels are presentation only. Equal names, labels, club names or other visible strings never establish identity, ownership or authorization. Ownership transfer is never inferred from names or identifier coincidence.

The request body must not be trusted to assert `accountId`. The authenticated principal comes from provider context (`request.auth.uid` in future Firestore Security Rules / authenticated provider operations).

## 3. Common revision-controlled document envelope

Every mutable application authority object that participates in synchronization uses this logical envelope:

```text
schemaVersion          integer, exactly 1 for this contract
objectType             fixed object class name
objectId               stable opaque application object ID
revision               integer >= 0, authoritative monotonic revision
parentRevision         null at revision 0; otherwise exact previous revision
lifecycleState         "live" | "tombstoned"
contentHash            "sha256:<lowercase-hex>" for live data; null for tombstone
priorContentHash       prior live hash when tombstoned; otherwise null unless required by explicit transition
authorized timestamps provider/server metadata only, never conflict authority
updatedAt              provider/server timestamp metadata
updatedByAccountId     authenticated actor attribution
updatedByDeviceId      registered device attribution, never authentication
data                    exact live object data; null for tombstone
tombstone               null for live; deletion metadata object for tombstone
```

Canonical hashes are SHA-256 over deterministic canonical JSON with recursively sorted object keys. Hashes are integrity / response metadata, not authorization and not a substitute for revision comparison.

A tombstone keeps the same authoritative document path. It is not represented by deleting the document and recreating it elsewhere. This is the anti-resurrection boundary.

## 4. Exact Firestore-compatible object paths and fields

The names below are the Phase 1D logical contract. Phase 1F may implement these exact paths in the Firebase Emulator only after Phase 1E proof; Phase 1D creates no Firestore collection.

### 4.1 Account metadata

Path:

```text
accounts/{accountId}
```

Identity:

- path `accountId` equals authenticated Firebase Auth `uid`;
- the app document never stores passwords, provider credentials, refresh tokens, ID tokens or duplicated email credentials.

`data` fields:

```text
status                  "active" | "disabled" | "deletion-pending"
createdAt               provider/server timestamp
deletionRequestedAt     provider/server timestamp | null
```

Firebase Auth owns credentials, provider identities, verified email state, password/reset state, MFA state, refresh/ID tokens and provider account lifecycle. The application `accounts` document owns only app authorization/lifecycle metadata required by Career Mode Showdown.

### 4.2 Account-to-profile linkage

Path:

```text
accounts/{accountId}/profileLinks/{profileId}
```

`data` fields:

```text
profileId               stable profile_* ID and must equal path ID
displayLabel            private presentation label | null
linkState               "active" | "detached"
createdAt               provider/server timestamp
```

A display label may help the two authorized owners understand a private rivalry, but it has zero authorization meaning. Cross-Save identity still requires explicit stable Local Profile reuse.

### 4.3 Registered devices

Path:

```text
accounts/{accountId}/devices/{deviceId}
```

`data` fields:

```text
deviceId                stable registered device ID; equals path ID
installationId          installation instance ID | null
displayLabel            private user-facing device label | null
state                   "active" | "revoked"
registeredAt            provider/server timestamp
lastSeenAt              provider/server timestamp | null
revokedAt               provider/server timestamp | null
```

Do not store exact location, browsing history, unrelated telemetry or raw device secrets. Device registration can strengthen revocation and attribution but never authenticates an account by itself.

### 4.4 Connected rivalry governance

Path:

```text
rivalries/{rivalryId}
```

`data` fields:

```text
connectionState         "pending-pair" | "active" | "revoked-read-only" |
                        "single-owner-retained" | "deletion-pending"
connectionStateBeforeDeletion
                        prior non-deletion-pending state | null
managerSlots            exact array length 2
authorizedAccountIds    exact set/array derived from currently entitled non-null account links
createdByAccountId      authenticated creator accountId
createdAt               provider/server timestamp
```

Each `managerSlots` entry is exactly:

```text
slotId                  stable "manager-1" | "manager-2"
accountId               current linked accountId | null
profileId               stable profile_* ID
displayLabel            private presentation label | null
entitlementState        "active" | "retained" | "relinquished"
deletionConsent         boolean
```

The array always contains exactly two stable manager slots. `authorizedAccountIds` is derived only from current account linkage and entitlement state, never from display labels.

### 4.5 Revision-controlled shared rivalry state

Path:

```text
rivalries/{rivalryId}/state/authoritative
```

This is one authoritative synchronization object per private rivalry. Its live `data` fields are:

```text
saveId                  stable save_* ID for the explicitly connected Save
managerBindings         exact array length 2 of { slotId, profileId }
seasonIds               ordered stable season_* IDs included in the connected Save
activeSeasonId          stable season_* ID | null
payloadFormatVersion    positive integer
payload                 the explicitly connected rivalry Save projection only
```

`payload` may contain the gameplay state required to continue that one explicitly connected rivalry. It must not contain:

- the complete local Save Library registry unless every included Save is explicitly part of the same connected rivalry;
- unrelated local Saves;
- Candidate A/B/C recovery material;
- raw browser-storage snapshots or corrupt bytes;
- local-only preferences, accessibility/audio settings or unrelated Legacy history;
- Firebase credentials/tokens;
- public profile/discovery data.

`saveId`, `profileId` and `seasonId` remain authoritative identity fields inside the payload. Display names remain presentation only even if a private snapshot contains them.

### 4.6 Pairing / invite records

Path:

```text
rivalries/{rivalryId}/invites/{inviteId}
```

`inviteId` is a cryptographically strong opaque capability identifier with at least 128 bits of randomness. The raw capability is the path identifier and is never duplicated into document `data`, analytics or application logs. Client list/query access to invites is denied; possession of the exact capability path plus an authenticated account is required for redemption.

`data` fields:

```text
purpose                 "rivalry-pairing" | "private-session"
slotId                  target manager slot
createdByAccountId      authenticated creator
createdAt               provider/server timestamp
expiresAt               short-lived expiry timestamp
state                   "open" | "redeemed" | "revoked" | "expired"
redeemedByAccountId     authenticated redeemer | null
redeemedAt              provider/server timestamp | null
revokedAt               provider/server timestamp | null
```

An invite is one-use. Redemption must be atomic with the resulting membership/link transition. An expired, redeemed or revoked invite cannot be reused.

### 4.7 Private session membership

Path:

```text
rivalries/{rivalryId}/sessions/{sessionId}
```

`data` fields:

```text
rivalryId               exact parent rivalryId
hostAccountId           authenticated host
memberAccountIds        private set/array, maximum exactly the two rivalry accounts
state                   "open" | "active" | "revoked" | "expired" | "closed"
createdAt               provider/server timestamp
expiresAt               expiry timestamp
lastActivityAt          provider/server timestamp | null
revokedAt               provider/server timestamp | null
```

A session does not create a new public identity or public lobby. Current session membership is insufficient by itself: every session operation rechecks current account state, current device state and current rivalry entitlement.

### 4.8 Idempotency / replay records

Path:

```text
rivalries/{rivalryId}/state/authoritative/idempotency/{idempotencyKeyHash}
```

`idempotencyKeyHash` is SHA-256 of the raw client idempotency key. The raw key is not stored.

Immutable fields:

```text
requestFingerprint      deterministic fingerprint of the immutable client request
baseRevision            original immutable client baseRevision
acceptedRevision        revision produced by the accepted logical mutation
resultStatus            deterministic accepted status
resultContentHash       accepted resulting contentHash | null
resultTombstone         boolean
actorAccountId          authenticated actor
deviceId                registered device attribution
createdAt               provider/server timestamp
expiresAt               default createdAt + 7 days
```

An exact replay with the same idempotency key and request fingerprint returns the recorded accepted result and performs no mutation. Reuse of the same key with a different fingerprint returns `idempotency-conflict` and performs no mutation.

### 4.9 Tombstones

Tombstones use the same authoritative rivalry/shared-state document path rather than a separate collection. A tombstoned envelope has:

```text
lifecycleState          "tombstoned"
data                    null
contentHash             null
priorContentHash        last known live content hash | null
revision                exact next monotonic revision
parentRevision          immediately previous revision
tombstone.deletedAt     provider/server timestamp
tombstone.deletedByAccountId
                        authenticated actor that completed the authorized delete
tombstone.reasonCode    bounded enum / reason code
tombstone.restorableByAccountIds
                        only accounts that still hold explicit restoration entitlement
```

Deleted gameplay payload is not retained. Tombstone authority remains for the lifetime of the owning account / connected namespace unless a later mechanism proves equally strong anti-resurrection protection.

### 4.10 Bounded application security metadata

Path:

```text
accounts/{accountId}/securityEvents/{eventId}
```

Immutable fields:

```text
eventType               bounded event enum
occurredAt              provider/server timestamp
outcome                  bounded outcome enum
rivalryId               opaque rivalryId | null
deviceId                deviceId | null
expiresAt               default occurredAt + 30 days
```

Do not store passwords, raw auth tokens, raw invite capabilities, gameplay payloads, recovery bytes, detailed browsing history or exact location. Provider-native Firebase security/audit logs remain provider-owned and follow provider/operational controls rather than being copied wholesale into application collections.

## 5. Request contract

The logical state-changing API envelope is provider-neutral and future Firebase-compatible:

```text
operation               bounded operation name
objectType              exact target object class
objectId                exact target ID / known path identity
deviceId                registered device attribution
installationId          optional installation attribution
baseRevision            immutable client-observed authoritative revision
idempotencyKey          fresh opaque client key for a new logical operation
payload                  operation-specific payload | null
```

`accountId` is deliberately absent as a trusted request field. The provider authentication context supplies it.

For first-seen state-changing requests, the required order is exactly:

1. authenticate;
2. authorize against current account, device, rivalry/session and object scope;
3. read authoritative object state;
4. compare the immutable original client `baseRevision`;
5. reject mismatches explicitly;
6. verify/reserve idempotency and replay state;
7. perform exactly one authorized logical mutation;
8. create exactly the next monotonic revision;
9. update tombstone state when applicable;
10. return deterministic success or explicit conflict.

### 5.1 Provider transaction retry rule

The request's `baseRevision` is captured outside any Firestore transaction callback and is immutable for the lifetime of that logical request. Every automatic provider retry compares the same original value. A retry may reread provider state, but it may not rewrite client intent to match the newly read revision.

If the authoritative revision moves, the request returns an explicit conflict. The client must deliberately fetch/reconcile and issue a new logical request with a new idempotency key and intentionally selected base revision.

### 5.2 Exact accepted replay rule

Phase 1A already protects deterministic replay. Preserve it as follows:

- if the idempotency key has an accepted record with the same deterministic request fingerprint, return the original accepted result without a new logical mutation;
- this replay is not a state-changing request and therefore does not increment revision;
- if the same key has a different fingerprint, return `idempotency-conflict`;
- for a first-seen key, follow the ten-step mutation pipeline above exactly.

This distinction preserves both strict immutable-base compare-and-swap and exact replay behavior.

## 6. Deterministic responses

Accepted response contains only the minimum synchronization authority needed by the client:

```text
status                  "accepted"
objectType
objectId
revision                accepted new revision
parentRevision          original base revision
contentHash             resulting hash | null
tombstone               boolean
idempotencyKeyHash      hash/reference, never raw secret
```

Exact replay returns the same accepted revision/hash/tombstone authority with `status: "replayed"` and does not mutate state.

Stale conflict response is explicit and content-minimized:

```text
status                  "conflict"
code                    "STALE_BASE_REVISION"
baseRevision            immutable submitted base
authoritative.objectType
authoritative.objectId
authoritative.revision
authoritative.contentHash
authoritative.tombstone
```

The conflict response does not include full remote gameplay payload. A separately authorized direct read is required to obtain current shared content.

Other deterministic failure statuses include `unauthenticated`, `forbidden`, `invalid-request`, `idempotency-conflict`, `tombstone-restore-required`, `restore-live-object`, `already-deleted`, `account-disabled`, `device-revoked` and `relationship-revoked`.

## 7. Exact two-owner rivalry deletion / retention semantics

A Connected Rivalry has exactly two stable manager slots. Account linkage and data entitlement are separate from `profileId` gameplay identity.

### One account deletes its account while the second remains

1. immediately deny new remote authority for the deleting account;
2. revoke its registered devices, invites and private sessions;
3. remove its live `accountId` linkage from the rivalry slot and mark that slot `relinquished`;
4. remove its account-to-profile authorization link;
5. preserve the opaque `profileId` only where the remaining owner needs it to interpret already-shared gameplay history; remove presentation labels that are no longer necessary;
6. move the rivalry to `single-owner-retained` and make shared gameplay state read-only;
7. preserve the other owner's read/export/deletion entitlement;
8. do not treat account deletion as deletion consent on behalf of the other owner and do not destroy shared gameplay data.

### One account leaves the rivalry

The leaving account relinquishes only its own remote entitlement. Its live account link is removed, the remaining owner enters `single-owner-retained` read-only retention, and shared gameplay content is not deleted.

### One account revokes the relationship

Either currently entitled account may terminate the connected relationship. Revocation:

- revokes all open pairing/session invites and active private sessions;
- stops further shared gameplay mutation;
- moves both still-entitled slots to retained read-only access;
- preserves read/export/delete-consent entitlement for both;
- never transfers ownership to the revoking account.

### One manager requests rivalry deletion

Record explicit deletion consent on that manager slot and move the rivalry to `deletion-pending`. New shared gameplay mutation is frozen. If another currently entitled manager has not consented, no shared gameplay data is deleted.

### Both currently entitled managers request rivalry deletion

When every currently entitled slot has explicit deletion consent, one atomic logical deletion transaction may:

1. verify the final governance revision and frozen state;
2. tombstone the shared-state document at exactly its next revision;
3. tombstone the rivalry governance document at exactly its next revision;
4. revoke sessions/invites;
5. record idempotency authority;
6. retain only deletion/tombstone metadata required for anti-resurrection and authorized restoration.

No deleted gameplay payload remains in the tombstone.

### Sole remaining entitled owner requests deletion

If the other slot has already explicitly relinquished entitlement or its account has been deleted, the sole remaining entitled owner may explicitly consent to delete the retained rivalry. That explicit survivor action may tombstone the retained remote rivalry because no second account remains entitled to the remote object.

### One account is disabled

Disabling an account immediately denies that account. It does not relinquish its entitlement, consent to deletion or transfer ownership. Shared gameplay mutation is frozen while a required connected account is disabled; the other entitled owner retains authorized read/export access. Re-enabling the same authenticated account restores only the same identity/entitlement that already existed.

### A stale registered device reconnects later

Every request must reauthenticate the account and reauthorize current device state, account state, rivalry entitlement, current revision and tombstone state. Cached membership is never authority. A revoked device is denied. A former member is denied. A stale live write against a tombstone conflicts or is rejected; it cannot resurrect the object. Explicit restore is a separate authorized mutation.

### Ownership transfer

There is no ownership-transfer operation in Phase 1D. Transfer may never be inferred from display name equality, `profileId`, `saveId`, `deviceId` or a surviving account. Any future transfer feature would require a separately authorized contract revision and explicit owner action.

## 8. Authorization matrix

Future Security Rules are deny-by-default. Every collection/client `list` or broad query is denied unless a later private operation proves it necessary and remains scoped to already-authorized IDs. There is no public index.

| Object | Create | Read | Update | Delete | Restore | Invite | Join | Revoke |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| account | authenticated self bootstrap only | self only | self CAS, allowlisted app fields | trusted deletion cascade only | provider account recovery only | deny | deny | self request / trusted security action |
| profile link | self only | self only | self CAS | self after rivalry detach | explicit self relink | deny | deny | self only |
| device | authenticated self | self only | self CAS metadata | no physical client delete | explicit reregister | deny | deny | self only |
| rivalry | authenticated creator creates private pending pair | currently entitled direct get | operation-specific CAS | logical tombstone only after entitlement rule | all currently restorable accounts consent | active entitled member | valid one-time invite capability | either entitled member may end relationship |
| shared state | paired rivalry CAS | currently entitled direct get | active member CAS and account/device checks | rivalry deletion transaction only | rivalry restore transaction only | deny | deny | deny |
| invite | active entitled member with valid slot | creator or authenticated exact capability get | operation-specific CAS | TTL cleanup only | deny | creator operation | authenticated exact capability atomic redeem | creator or relationship/session revoke transaction |
| session | active entitled member | current session member + current rivalry entitlement | current member CAS | TTL cleanup only | deny | via invite record | valid session invite atomic redeem | either current session member may end session |
| idempotency | same atomic transaction as accepted mutation | same authenticated actor exact hash get | deny | TTL cleanup only | deny | deny | deny | deny |
| tombstone | logical delete transaction only | currently restorable accounts direct get | restore transaction only | trusted anti-resurrection cleanup only | all currently restorable accounts explicitly consent | deny | deny | deny |
| security metadata | trusted boundary or rule-verifiable atomic receipt | self only where app-owned | deny | TTL cleanup only | deny | deny | deny | deny |

Security Rules may use authenticated identity, exact path IDs, current account status, current device status, current rivalry membership/entitlement, revision increments, immutable fields, `get()` / `getAfter()` and request time. They must not use display names, client timestamps or device labels as authorization.

## 9. Pairing / join transaction contract

A private invite is not discoverable. The joining account must already be authenticated and possess the exact unguessable capability path.

For rivalry pairing, one atomic provider transaction/batch must:

1. authenticate joiner;
2. direct-get exact invite path; no list/query;
3. require `state == "open"` and `request.time < expiresAt`;
4. require joiner is not already occupying the other manager slot;
5. validate the target manager slot is still open and rivalry revision is unchanged;
6. redeem the invite exactly once;
7. link the joiner's `accountId` to the preselected stable `profileId` only through explicit join data; never infer by label;
8. advance rivalry revision exactly once;
9. create/update idempotency authority atomically;
10. return deterministic success or conflict.

For private-session join, the same one-use rules apply and current rivalry entitlement must already be valid.

If Phase 1F emulator proof shows any required capability cannot be safely expressed in Firestore Security Rules and client transactions, a trusted server boundary may be proposed then. This document does not authorize Cloud Functions, Blaze billing or any server deployment.

## 10. Account deletion cascade boundary

Application account deletion requires an ordered, provider-aware cascade. Future implementation must make the account non-authoritative before cleanup begins.

1. set app account state to `deletion-pending` and deny new app mutations;
2. revoke/close registered devices, invites and sessions;
3. process each rivalry using the two-owner rules above, preserving the other owner's entitlement;
4. detach account/profile authorization links;
5. remove unnecessary presentation labels associated only with the deleting account;
6. update tombstone restoration account lists so a deleted account cannot later authorize restore;
7. clean bounded idempotency/security metadata according to policy;
8. delete or disable the Firebase Auth principal only through the future provider-authorized deletion path after required app cleanup authority is safely available;
9. never copy provider credentials/tokens into app collections to perform the cascade.

Provider-controlled backups/logs and exact Firebase account deletion behavior remain Phase 1F/provider-operation proof. No current production account exists because Firebase is not connected.

## 11. Retention mapping

- open invite: only until redemption/revocation/expiry; terminal one-way replay metadata no more than 7 days;
- idempotency: 7 days by default;
- terminal private session metadata: 7 days by default unless a shorter safe TTL is selected;
- app-owned security metadata: 30 days by default;
- registered device metadata: while account/device relationship is needed; revoke promptly when removed;
- account/profile linkage: while linkage is needed; remove as part of account deletion or explicit detach;
- active connected rivalry/shared state: while at least one authorized owner retains it or until explicit tombstone policy applies;
- tombstone: lifetime of owning account/connected namespace unless equally strong anti-resurrection proof replaces it.

TTL cleanup is provider maintenance, never an authorization mechanism. A client may not make a protected record disappear merely by changing `expiresAt`.

## 12. Offline, reconnect and cloud-disable behavior

Firestore persistent offline cache remains disabled. Local Save Library functionality remains authoritative for local-only use.

If cloud is unreachable or disabled:

- no local Save is deleted or blocked;
- Candidate A export remains available;
- Candidate B analysis remains read-only;
- Candidate C recovery remains the sole destructive import Apply authority;
- formatVersion 2 export/import remains available;
- queued future remote intent must retain its immutable original `baseRevision` and may not auto-rebase on reconnect;
- the next online attempt must reauthenticate and reauthorize before comparing revision.

Phase 1E must prove these rules with a deterministic two-device/offline/reconnect harness before any provider connection.

## 13. Provider-data ownership boundary

Firebase Authentication owns:

- provider principal / `uid` issuance;
- credentials and password/MFA state;
- identity-provider tokens and refresh/ID tokens;
- provider email verification and credential-recovery state;
- provider-level account disable/delete primitives.

Application Firestore collections may own only the minimized Career Mode Showdown metadata and explicitly connected private rivalry state defined above. Do not duplicate credentials, tokens, authentication secrets or unnecessary PII.

The authenticated Firebase `uid` maps to `accountId`; it never maps directly to `profileId`, `saveId`, `seasonId`, `deviceId`, `rivalryId` or `sessionId`.

## 14. Phase 1D implementation boundary

Phase 1D may add:

- this architecture contract;
- dormant `js/cloudSyncRemoteContract.js` machine-readable constants/validators;
- permanent contract tests;
- authority/roadmap synchronization marking Phase 1C done, Phase 1D current and Phase 1E next.

Phase 1D must not add:

- Firebase production SDK/runtime imports;
- Firebase project configuration or credentials;
- production Firestore collections/data;
- deployed Security Rules;
- account UI;
- live pairing/joining;
- Connected Rivalry runtime;
- Remote Joining UI;
- Firestore persistent offline cache;
- Cloud Backup;
- public/community/ranking/discovery/matchmaking features.

## 15. Exit gate and exact next dependency

Phase 1D is complete only when the source contract, documentation and permanent tests agree on schema, identities, mutation order, authorization, two-owner deletion, provider-data ownership and prohibited runtime boundaries; normal PR CI is exact-head green; review state is clean; and main is verified after merge.

The next dependency is Phase 1E: deterministic two-device plus offline/reconnect synchronization harness. Phase 1E is provider-neutral proof. Firebase provider connection/emulator/Security Rules remains Phase 1F and stays blocked until Phase 1E passes.
