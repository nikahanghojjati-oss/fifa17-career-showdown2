# Private Account / Authentication — Trusted Connected Data Account Export Execution Boundary

Status: CURRENT IMPLEMENTATION PREREQUISITE / DORMANT PROOF / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-19 ET

Starting verified live-main boundary: `630d047c2db7634bbb0d5ff2d387f71fc265f58d` after merged PR #107.

This prerequisite intentionally has no synthetic Stage 2J label. It is selected by function from the remaining Stage 2 dependency graph because the connected-data privacy policy requires a future explicit private connected-data export, Stage 2H still lists account lifecycle export as unresolved, and current main contains no trusted connected-data account export executor.

Private Remote Joining remains the prioritized long-term destination. This is a direct account lifecycle and portability prerequisite, not an unrelated documentation milestone.

## Why this prerequisite comes before production activation

Production Firebase/provider provisioning must not create a connected account system that can collect private connected data without first proving the user-facing export boundary for that application-owned data.

The repository already proves local Candidate A formatVersion 2 portability, but Candidate A exports local browser data only. A connected-data account export is a different operation over future private provider-held application data. Remote enablement may never replace, weaken or silently upload Candidate A exports.

This is the smallest remaining provider-neutral account lifecycle blocker after trusted account deletion execution. It can be proven without connecting production Firebase, expanding IAM, weakening browser Firestore rules, creating users or starting Stage 3 pairing.

## Dormant implementation

The proof implementation is:

`js/trustedConnectedDataAccountExport.js`

Permanent executable contracts are:

`tests/contracts/trusted-connected-data-account-export-contracts.cjs`

`tests/contracts/trusted-connected-data-account-export-boundary-contracts.cjs`

The module is trusted-server-only dormant source. It is not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`.

It imports no Firebase SDK/Admin package, performs no network request, touches no browser storage, creates no production resource and changes no shipped runtime behavior.

Production remains application/package `1.4.0`, Installable Offline App runtime `1.4.0-r1`, previous known-good whole shell `1.3.0-r2`.

No semantic version bump is appropriate for this dormant non-runtime prerequisite.

## Permanent outer trust order

Before this export operation may execute in a future production trusted service, preserve the completed Stage 2 trust order for protected non-preflight browser requests:

1. production-origin allowlist defense in depth;
2. transient `X-Firebase-AppCheck`;
3. trusted Firebase Admin App Check verification;
4. exact expected production Firebase Web App identity;
5. exact production project audience;
6. Stage 2F revocation-aware `verifyIdToken(idToken, true)`;
7. derive architecture `accountId` only from verified Firebase UID;
8. exact operation-specific Career Mode Showdown authorization for connected-data account export;
9. only then invoke this trusted export adapter under separately reviewed production IAM.

App Check alone grants no account, device, pairing, rivalry, session, gameplay, export, mutation or IAM authority.

The executor accepts account identity only as the already verified Firebase UID. A request-body `accountId`, display name, profile label, device label or rivalry label is never identity or export entitlement.

## Account state boundary

Self-service connected-data export requires the current application account to be `active`.

A `disabled` application account is denied while disabled. Disablement preserves underlying ownership/entitlement but denies that account's current remote authority. Re-enabling the same authenticated account may restore only its already-existing identity and entitlement.

A `deletion-pending` account is denied because account deletion immediately revokes normal remote access and new operation authority.

The export operation is read-only. It never changes account status, revision, ownership, relationship state, rivalry state, tombstones, devices, invitations, sessions or gameplay.

## Exact exported application data classes

The current formatVersion 1 connected-data account export contains only these application-controlled classes:

1. the requesting account's minimized application account metadata: `accountId`, active status, current revision and application creation timestamp;
2. that account's account-to-profile link records, including stable `profileId`, private display label, linkage state and creation timestamp;
3. that account's registered-device metadata permitted by the privacy policy, including device/installation IDs where present, private label, current state and bounded registration/last-seen/revocation timestamps;
4. private rivalry governance only for rivalries where the requesting account currently holds `active` or `retained` entitlement;
5. the authoritative explicitly connected rivalry state that the requesting account is currently entitled to read, including live shared gameplay content or minimized tombstone metadata.

The export is a private portability projection. It is not a restorable provider snapshot, mutation request, idempotency receipt, security log archive, cloud backup or replacement for Candidate A.

## Peer identity minimization

A two-owner rivalry is shared product data, but another account's provider principal identifier is not needed for the requesting user's portability export.

The exported rivalry governance therefore does not emit raw `authorizedAccountIds`, peer Firebase UID/accountId or `createdByAccountId`.

Each manager slot exports only:

`slotId`
`requester` boolean
`profileId`
private shared `displayLabel`
`entitlementState`
`deletionConsent`

The rivalry-level creator is represented only as `createdByRequester: true|false`.

Shared-state `updatedByAccountId` is represented only as `updatedByRequester: true|false`.

Tombstone account lists are minimized to requester-relative booleans such as `deletedByRequester` and `restorableByRequester`.

This preserves shared gameplay meaning without turning the export into a directory of another user's provider identity.

## Two-owner export entitlement

The existing Phase 1D governance remains authoritative.

An export may include a rivalry only when the requesting verified account occupies one of the exactly two stable manager slots and that slot's current entitlement is `active` or `retained`.

This intentionally permits read/export portability for retained read-only relationships such as `revoked-read-only` and `single-owner-retained` when current governance still grants the requester entitlement.

A relationship revocation stops shared gameplay mutation but preserves legitimate read/export entitlement for still-entitled owners.

A sole surviving owner may export retained shared gameplay that existing governance entitles that owner to retain.

A requester whose slot is `relinquished`, absent or belongs to another account is denied for that rivalry. The trusted inventory adapter returning an out-of-scope rivalry is treated as a fail-closed scope violation rather than silently filtered, because a broad or incorrect provider query must not be disguised as a successful export.

No export grants ownership transfer, deletion consent, restoration authority or shared mutation authority.

## Explicitly excluded operational and secret classes

The connected-data export excludes:

provider authentication credentials, passwords, refresh tokens and ID tokens;
raw device secrets;
raw invite capabilities or invite tokens;
private-session operational records;
idempotency/replay records;
application security-event records;
provider-controlled security/audit logs.

It must never expose another account's authentication secrets, device secrets, security logs or invite tokens.

The trusted inventory adapter is required to return only the approved export classes. If it attempts to supply invites, sessions, idempotency records, security events, provider-auth material, provider security logs or raw device secrets, the executor fails closed.

## Shared gameplay content

For a currently entitled rivalry, the authoritative shared-state `data` is the explicitly connected rivalry Save projection that both authorized managers are entitled to read under the existing schema contract.

It must still obey all pre-existing remote-data minimization rules: no entire unrelated Save Library, Candidate A/B/C recovery material, raw browser-storage snapshots, unrelated Legacy history, local-only preferences, Firebase credentials/tokens, public discovery data or Cloud Backup payloads.

The export executor does not independently redefine the connected rivalry payload schema.

## Error and retry behavior

Unauthenticated identity, missing operation authorization, malformed account state, disabled/deletion-pending account state, cross-account profile/device records, unauthorized rivalry inventory and malformed shared-state authority fail closed before a successful export is returned.

Provider/trusted read unavailability returns a retryable failure. No false success is reported.

Because export is non-mutating, retry does not require mutation idempotency authority and never advances application revisions.

## Browser Firestore lock

Every application-client Firestore create/update/delete remains denied.

This export prerequisite does not weaken `firestore.rules`, enable direct browser shared reads by broad query or authorize any browser write.

A future production export endpoint performs trusted provider reads only after the completed authentication/attestation/application-authorization chain.

## IAM boundary remains intentionally unactivated

Stage 2H's currently proven account-bootstrap runtime role remains exactly:

`firebaseauth.users.get`

`datastore.databases.get`

`datastore.entities.get`

`datastore.entities.create`

Do not add list/query, account-update/delete, provider-user-delete, shared-state mutation or broader Firebase/Datastore permissions merely because this dormant export executor exists.

A future production-connected export adapter must identify its exact Firebase Auth and Firestore direct-get/list/query methods, justify the minimum required IAM permissions and prove the scoped query strategy before production role activation. That production IAM expansion remains separately gated.

## Production isolation

This prerequisite does not create, configure, deploy or connect:

production Firebase;
production Firebase Web App;
Google Auth provider;
Authorized Domains;
reCAPTCHA Enterprise;
App Check registration or enforcement;
Cloud Run;
service accounts;
IAM bindings or custom-role expansion;
Blaze billing;
production Firestore data;
production Security Rules;
Firebase Admin production runtime;
production users;
account/login UI;
registered devices;
pairing or invitations;
private sessions;
Connected Rivalry runtime;
Private Remote Joining runtime.

Production dormancy is sequencing for safety, not the final destination. Once all genuine pre-provisioning requirements are proven and current authority selects production activation, provision incrementally and prove real provider behavior instead of creating endless dormant paperwork.

## Canonical storage and recovery locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`

`careerModeShowdown.legacyShowdowns`

`careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as permanent authority.

Candidate A remains non-mutating local formatVersion 2 export.

Candidate B remains read-only import analysis.

Candidate C remains the sole destructive import Apply authority with exact snapshots, last-moment guards, preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber protection, exact post-write verification, byte-for-byte rollback verification and corrupt-byte preservation intact.

No connected export module directly owns canonical browser storage mutation.

## Identity and product locks

Firebase Auth UID maps only to architecture `accountId`.

`accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId` remain distinct namespaces.

Exactly two manager slots remain authoritative. Display labels never establish identity or entitlement.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community systems, global leaderboards and public rankings remain eliminated.

Gameplay/scoring rules are unchanged. Remote transport and export do not redefine gameplay authority.

## Exit gate

This trusted connected-data account export prerequisite is DONE / MERGED / PROVEN only when:

1. this boundary and the dormant executor agree;
2. only verified Firebase UID identity and explicit operation-specific authorization can reach export execution;
3. active-account-only self export is proven and disabled/deletion-pending accounts fail closed;
4. account/profile/device scope validation rejects cross-account inventory;
5. exactly-two-manager current `active`/`retained` rivalry entitlement is revalidated for every exported rivalry;
6. peer raw account identifiers are minimized from rivalry governance/state metadata;
7. another account's authentication/device/security/invite secrets cannot enter the export;
8. operational invites, sessions, idempotency and security-event classes are excluded;
9. live shared gameplay data is exported only from the already-authorized explicitly connected rivalry projection;
10. tombstone account identity lists are requester-relative/minimized;
11. export is strictly non-mutating and grants no ownership transfer, deletion, restore or shared mutation authority;
12. browser Firestore writes remain deny-all;
13. Stage 2H production IAM remains unchanged;
14. no production provider/runtime/resource activation occurs;
15. the module remains absent from production browser and Service Worker loading;
16. package/runtime identity remains `1.4.0` / `1.4.0-r1`;
17. permanent contracts are registered and the complete repository contract suite passes;
18. all normal PR workflow families pass on one exact unchanged final head;
19. submitted reviews and inline review threads are clean;
20. expected-head merge succeeds and live main is independently verified.

This prerequisite does not by itself complete Stage 2 or authorize Stage 3. After publication, reconstruct the remaining genuine Stage 2 production/account/operational blockers. If no pre-production blocker remains, current authority should move to real incremental provider/IAM/Security Rules activation rather than manufacturing another dormant milestone.