# Private Account / Authentication — Trusted Shared Mutation Gateway Boundary

Status: CURRENT IMPLEMENTATION PREREQUISITE / DORMANT PROOF / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-19 ET

Starting verified live-main boundary: `902058d56ec3f1b1fef4918f38568b54cf2dd7bb` after merged PR #100.

This prerequisite intentionally has no synthetic Stage 2J label. It is selected by function from the remaining Stage 2 dependency graph because Stage 2I explicitly leaves a trusted shared-mutation gateway/protocol boundary unresolved while every application-client Firestore create/update/delete remains denied.

Private Remote Joining remains the long-term prioritized destination. This gateway is a mandatory security and synchronization prerequisite, not an unrelated architecture exercise.

## Why this prerequisite comes before Stage 3

Registered Devices / Private Pairing and later Connected Rivalry / Remote Joining need privileged shared mutations that cannot safely be delegated to unrestricted browser writes.

Phase 1D requires an authoritative shared mutation and its idempotency receipt to form one logical atomic operation. Phase 1F proved that the current Firestore client-rule shape cannot securely enforce the required sibling idempotency-receipt relationship for arbitrary direct client writes. Stage 2H therefore kept all browser Firestore writes denied and reserved privileged provider calls for a trusted runtime. Stage 2I added the App Check + revocation-aware authentication + operation authorization request boundary, but deliberately granted no shared mutation authority.

The smallest remaining direct prerequisite is therefore to define and prove the trusted server-side mutation protocol that sits behind the Stage 2I trusted-operation adapter.

This proof does not provision or deploy the server. It fixes the application protocol and deterministic safety boundary before production IAM expansion, provisioning, device registration, pairing, or connected shared-state runtime can be authorized.

## Dormant implementation

The proof implementation is:

`js/trustedSharedMutationGateway.js`

Permanent executable contracts are:

`tests/contracts/trusted-shared-mutation-gateway-contracts.cjs`

The module is not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`. It performs no network request, imports no Firebase SDK/Admin package, touches no browser storage, creates no production resource and changes no shipped runtime behavior.

Production remains application/package `1.4.0`, Installable Offline App runtime `1.4.0-r1`, previous whole shell `1.3.0-r2`.

No semantic version bump is appropriate for this dormant non-runtime prerequisite.

## Composition with completed Stage 2 trust layers

For a future browser-originating protected mutation, the permanent outer trust order remains Stage 2I:

1. handle valid `OPTIONS` preflight without protected execution;
2. enforce the production browser-origin allowlist as defense in depth;
3. require transient `X-Firebase-AppCheck`;
4. verify App Check with trusted Firebase Admin logic;
5. verify exact expected Web App identity;
6. verify exact production project audience;
7. perform Stage 2F-equivalent revocation-aware `verifyIdToken(idToken, true)`;
8. derive architecture `accountId` only from verified Firebase UID;
9. perform exact operation-specific Career Mode Showdown authorization;
10. only then call the trusted operation adapter.

The trusted shared-mutation gateway is one possible trusted operation adapter for explicitly authorized shared-state operations. It never accepts a request-body account identity as authority.

App Check grants no account, device, rivalry, session, gameplay, mutation or IAM authority.

## Current gateway scope

The current bounded proof supports only the authoritative shared rivalry state object:

`rivalries/{rivalryId}/state/authoritative`

Logical object type:

`sharedState`

Allowed logical mutation operations:

`put`
`delete`
`restore`

This is intentionally narrower than every future privileged provider operation. Device registration, invite creation/redemption, session mutation, account deletion cascade and provider administration remain separately scoped operations and are not silently authorized through this gateway proof.

## Client request boundary

The client may supply only mutation intent and attribution fields required by the Phase 1D protocol:

`operation`
`objectType`
`objectId`
`rivalryId`
`deviceId`
`installationId` when available
`baseRevision`
`idempotencyKey`
`contentHash` for live put/restore
`payload` for live put/restore

The client must not be trusted to supply:

`accountId`
`authorizedAccountIds`
`entitlementState`
`revision`
`parentRevision`
`updatedByAccountId`

Those fields are provider/trusted-authority outputs or server-derived current state.

The current shared-state object ID is the exact `rivalryId` scope. A mismatched `objectId` / `rivalryId` is rejected before the transaction adapter runs.

## Immutable retry intent

The gateway clones and recursively freezes the complete logical client intent before calling the provider transaction adapter.

At minimum these values remain immutable across every provider retry:

`operation`
`objectType`
`objectId`
`rivalryId`
`deviceId`
`installationId`
`baseRevision`
`idempotencyKey`
`contentHash`
`payload`

The provider may rerun its transaction callback after concurrency. It may reread current state. It may not refresh the original client `baseRevision`, rewrite payload intent or silently rebase the logical request onto a newer remote revision.

If current authoritative revision differs from the frozen client `baseRevision`, the request returns explicit `STALE_BASE_REVISION` conflict authority and performs no logical mutation.

## Current authorization recheck inside the atomic boundary

The gateway does not rely only on authorization performed before entering the provider transaction. The injected trusted atomic adapter must provide a current authorization snapshot read from trusted/provider state within the same authoritative operation boundary.

The decision requires:

1. current account status is `active`;
2. current registered device state is `active`;
3. the verified `accountId` is still in the current entitled account set;
4. current rivalry state permits shared mutation, currently exactly `active`;
5. the exact requested operation remains explicitly authorized;
6. when that operation's policy requires a live private session, current session authority is also true.

Session authority is conditional, not globally required. Connected Rivalry synchronization may be allowed by its own future operation policy outside a live Remote Joining session. A Remote Joining-session-scoped operation may require both rivalry entitlement and active session authority.

Cached membership is never authority. A revoked device, disabled account, former member, revoked/read-only rivalry or denied operation fails closed.

## Exact replay and idempotency

The raw idempotency key is request material. The provider adapter is responsible for storing only the Phase 1D-approved hashed key path and immutable receipt fields.

The gateway creates a deterministic request fingerprint from the verified `accountId` and frozen logical intent.

Inside the atomic decision:

1. if no receipt exists, proceed to authorization/CAS mutation;
2. if an accepted receipt exists with the exact same fingerprint and original `baseRevision`, return the recorded accepted result with `status: replayed` and perform no mutation;
3. if the same idempotency authority is reused with a different fingerprint or base revision, return `idempotency-conflict` and perform no mutation.

An exact accepted replay does not increment revision.

## Compare-and-swap and revision behavior

For a first-seen accepted mutation:

1. recheck current authorization;
2. read the authoritative state;
3. require `intent.baseRevision === authoritative.revision`;
4. reserve/verify idempotency atomically;
5. perform exactly one logical mutation;
6. write exactly `revision + 1`;
7. set `parentRevision` to the prior authoritative revision;
8. attribute `updatedByAccountId` from the verified principal;
9. attribute `updatedByDeviceId` from the currently authorized registered device;
10. materialize the idempotency receipt in the same provider transaction/batch;
11. return deterministic accepted authority.

The dormant module returns a mutation specification to the injected adapter. It does not pretend that a JavaScript helper itself is the production transaction or security boundary.

## Tombstone and anti-resurrection behavior

`delete` does not physically erase the authoritative state object.

An accepted delete produces the next revision with:

`lifecycleState: tombstoned`
`data: null`
`contentHash: null`
`priorContentHash` from the prior live state when available

Deleted gameplay payload is not copied into the tombstone.

A normal `put` against a tombstone is rejected with `tombstone-restore-required`.

A `restore` against a live object is rejected with `restore-live-object`.

A repeated delete against an already tombstoned object is rejected with `already-deleted` unless a future separately reviewed idempotent delete policy explicitly changes that semantic.

Restore is an explicit separately authorized logical mutation using the current tombstone revision as immutable `baseRevision`. It creates exactly the next live revision.

The broader two-owner deletion-consent and restorable-account rules from Phase 1D remain mandatory. This gateway proof does not waive them.

## Conflict response minimization

A stale response may disclose only the synchronization authority needed to detect/reconcile the conflict:

`objectType`
`objectId`
`revision`
`contentHash`
`tombstone`

It does not return full remote gameplay payload. Fetching current remote content remains a separately authorized direct read.

## Trusted transaction adapter contract

The injected `runAtomicSharedMutation` adapter is the future provider-specific execution boundary. It receives a frozen object containing:

`accountId`
`intent`
`requestFingerprint`
`decide(context)`

The adapter must execute all current authoritative reads and any accepted shared-state + idempotency writes as one provider atomic operation.

The adapter supplies `decide` with:

`authorization`
`authoritativeState`
`idempotencyRecord`

The gateway accepts the adapter result only when it reports a coherent `committed` state matching the returned decision. A rejected/replayed decision marked committed, or an accepted commit decision marked uncommitted, fails closed as `TRUSTED_SHARED_MUTATION_COMMIT_MISMATCH`.

## IAM boundary remains intentionally unresolved for production

Stage 2H's current exact four-permission role remains only the proven account-bootstrap role:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

This gateway proof does not silently add `datastore.entities.update`, `datastore.entities.delete` or any broader role.

A future production-connected shared-state mutation operation necessarily needs separately justified provider permissions for its exact Firestore transaction methods. That IAM expansion must be reviewed and proven before production provisioning. The existence of this dormant gateway is not permission to broaden IAM.

Physical Firestore document delete is not required for logical shared-state tombstoning and remains outside this proof.

## Firestore browser-write lock

Every application-client Firestore create/update/delete remains denied.

The gateway is trusted-server-only. It is not shipped to the browser runtime. It does not weaken `firestore.rules`.

A correct client transaction helper is not a security boundary. The shared-state and idempotency-receipt atomic invariant therefore remains trusted-service responsibility under the current architecture.

## Production isolation

This prerequisite does not create, configure, deploy or connect:

production Firebase
production Firebase Web App
Google Auth provider
Authorized Domains
reCAPTCHA Enterprise
App Check registration or enforcement
Cloud Run
service accounts
IAM bindings/custom roles
Blaze billing
production Firestore data
production Security Rules
Firebase Admin production runtime
production users
account UI
registered devices
pairing
invites
private sessions
Connected Rivalry runtime
Private Remote Joining runtime

Production dormancy is temporary safety sequencing, not the final destination. At the correct later prerequisite, production resources must be provisioned incrementally and proven rather than kept dormant indefinitely.

## Canonical storage and recovery locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

Candidate A remains non-mutating export.
Candidate B remains read-only analysis.
Candidate C remains the sole destructive import Apply authority with exact raw snapshots, last-moment guards, preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber protection, exact post-write verification, byte-for-byte rollback verification and corrupt-byte preservation intact.

No cloud/auth/sync/gateway module directly owns canonical browser-storage mutation.

## Identity and product locks

Firebase Auth UID maps only to architecture `accountId`.

`accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId` remain distinct namespaces.

Exactly two manager slots remain authoritative. Display labels never establish identity or entitlement. A disabled account does not surrender ownership. A surviving account never gains unrestricted sole destructive authority merely because the peer is offline, disabled or unavailable.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community systems, global leaderboards and public rankings remain eliminated.

## Exit gate

This trusted shared-mutation prerequisite is DONE / MERGED / PROVEN only when:

1. the dormant gateway implementation and this boundary agree;
2. immutable complete client intent is proven across provider retry callbacks;
3. client-supplied account/entitlement/revision authority is rejected;
4. current account/device/rivalry/operation authorization is rechecked inside the atomic boundary;
5. session authority is required only where operation policy requires it;
6. stale `baseRevision` fails explicitly without mutation;
7. exact accepted replay returns the recorded result without mutation/revision increment;
8. idempotency-key reuse with different fingerprint/base returns conflict;
9. first-seen accepted mutation advances exactly one revision and attributes verified account + current device;
10. tombstone delete/restore/anti-resurrection behavior is proven;
11. stale conflict responses do not expose full gameplay payload;
12. browser Firestore writes remain deny-all;
13. no production dependency/runtime/resource/IAM expansion occurs;
14. the module remains absent from production browser/service-worker loading;
15. permanent gateway contracts are registered in the repository suite and pass;
16. all normal PR workflow families required by the repository pass on one exact unchanged final head;
17. submitted reviews and inline review threads are clean;
18. expected-head merge succeeds and live main is independently verified.

This prerequisite alone does not prove the entire Stage 2 lane complete and does not automatically authorize Stage 3. After publication, reconstruct the remaining Stage 2 production/account/operational requirements and select the next smallest genuine blocker toward Registered Devices / Private Pairing.
