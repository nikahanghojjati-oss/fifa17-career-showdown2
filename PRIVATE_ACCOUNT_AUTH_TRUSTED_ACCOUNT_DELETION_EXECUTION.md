# Private Account / Authentication — Trusted Account Deletion Execution Boundary

Status: CURRENT IMPLEMENTATION PREREQUISITE / DORMANT PROOF / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-19 ET

Starting verified live-main boundary: `9f1546177ec84bc11c2c9ee6a631c69906df2206` after merged PR #106.

This prerequisite intentionally has no synthetic Stage 2J label. It is selected by function from the remaining Stage 2 production/account/operational dependency graph after the trusted shared-mutation gateway merged through PR #105.

Private Remote Joining remains the prioritized long-term destination. This boundary closes one genuine account-lifecycle prerequisite without jumping ahead to Registered Devices / Private Pairing, Connected Rivalry or Remote Joining runtime.

## Why this prerequisite is required

The completed Stage 2E account model already defines `active`, `disabled` and `deletion-pending` application lifecycle states. Phase 1C and Phase 1D already require a provider-aware deletion cascade that first removes the deleting account's authority, then revokes account-scoped connected capability, preserves the surviving manager's legitimate two-owner entitlement, removes the deleting account from restoration authority and only then deletes the Firebase Authentication principal through a trusted provider boundary.

Stage 2H also explicitly retained account lifecycle export/deletion execution as later Stage 2 work. PR #105 completed the separately required trusted shared-mutation gateway, but it did not execute account deletion.

A production account release cannot be considered safe while deleting an account could either leave a provider principal authoritative after an incomplete application cleanup or destroy shared two-manager data that the other entitled manager is still allowed to retain.

This boundary therefore proves the deletion orchestration before production Firebase/Admin/IAM resources are provisioned.

## Dormant implementation

Implementation:

`js/trustedAccountDeletionExecution.js`

Permanent executable proof:

`tests/contracts/trusted-account-deletion-execution-contracts.cjs`

Boundary proof:

`tests/contracts/trusted-account-deletion-execution-boundary-contracts.cjs`

The module is trusted-server-only dormant source. It is not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`. It performs no network request, imports no Firebase SDK/Admin package, touches no browser storage, creates no production resource and changes no shipped runtime behavior.

Production remains application/package `1.4.0`, Installable Offline App runtime `1.4.0-r1`, previous whole shell `1.3.0-r2`.

No semantic application version or runtime revision bump is appropriate for this dormant prerequisite.

## Outer trust boundary remains mandatory

This module is an operation adapter behind the previously proven request trust chain. It does not authenticate a browser request by itself.

Before the future trusted service may invoke this deletion execution boundary for a protected non-preflight request, the permanent order remains:

1. enforce the production browser-origin allowlist as defense in depth;
2. require transient `X-Firebase-AppCheck`;
3. verify App Check through trusted Firebase Admin logic;
4. require the exact expected production Firebase Web App identity;
5. require the exact production project audience;
6. perform Stage 2F-equivalent revocation-aware `verifyIdToken(idToken, true)`;
7. derive architecture `accountId` only from the verified Firebase UID;
8. perform exact operation-specific Career Mode Showdown authorization for account deletion;
9. only then invoke this trusted account-deletion adapter under separately reviewed IAM.

App Check, origin, a request-body account ID, display labels, device labels or provider reachability grants no deletion authority.

The deletion module receives only the already-verified Firebase UID and an explicit operation-authorization result. It never trusts a client-supplied account identity.

## Current scope: active-account self deletion

The current proof authorizes only the application-level execution semantics for an authenticated, currently active account that has separately passed exact account-deletion operation authorization.

A `disabled` application account is denied by this self-service boundary. A future administrative/security deletion of a disabled provider principal requires its own trusted policy and must not be smuggled through the self-service path.

An already `deletion-pending` account may resume the saga after an interruption. It is not reactivated and its lifecycle is not reset.

## Required deletion order

The trusted execution sequence is deliberately fail-closed and retryable.

### 1. Load current trusted state

The trusted adapter loads the current application account envelope and whether the provider principal is still present.

The account document must match the verified UID exactly and retain the protected revision-controlled account envelope. Malformed identity, revision, lifecycle or status state fails closed.

If both application account and provider principal are already absent, the operation returns deterministic `already-complete` without mutation.

If the application account is absent while the provider principal is still present, the operation fails closed. It must not delete the provider principal merely to hide an inconsistent application state.

### 2. Make the account non-authoritative first

For an `active` application account, the trusted adapter must atomically move it to `deletion-pending` at exactly the next revision before destructive cleanup begins.

The execution accepts the transition only when the adapter confirms:

- the exact verified account ID;
- committed status `deletion-pending`;
- revision exactly `prior revision + 1`.

A mismatch fails closed before cleanup.

For an already `deletion-pending` account, the operation resumes from the current revision without repeating the transition.

`deletion-pending` means normal remote access and new mutation authority stay denied during every retry or provider outage.

### 3. Prove application cleanup and survivor preservation

Before provider-principal deletion, the trusted cleanup adapter must return a complete proof for the same account that confirms all of the following:

- registered devices are revoked;
- invites are revoked;
- sessions are closed;
- every affected rivalry is processed under the protected two-owner governance rules;
- account/profile links are detached;
- presentation labels belonging only to the deleting account are minimized;
- the deleting account is removed from tombstone restoration authority;
- bounded idempotency/security metadata is handled under the retention policy;
- surviving-owner entitlements are preserved;
- no shared gameplay is destroyed without the exact required deletion consent.

Any missing or contradictory proof returns a retryable failure and the provider principal is not deleted.

The cleanup proof is an application orchestration contract. A future provider-specific adapter must prove its actual Firestore transaction/query behavior separately before production activation.

## Two-owner preservation lock

Account deletion is not rivalry-deletion consent on behalf of the other manager.

When the second manager remains entitled, deletion of one account must:

1. revoke the deleting account's live connected authority;
2. remove its live account linkage;
3. preserve an opaque `profileId` only when needed to interpret already-shared gameplay history;
4. move the rivalry to retained read-only state when required by the Phase 1D governance contract;
5. preserve the surviving owner's read/export/deletion entitlement;
6. never infer ownership transfer;
7. never destroy the shared gameplay payload solely because one account is deleted.

Shared rivalry destruction remains governed by the existing explicit deletion-consent rules and trusted shared-state tombstone authority.

## Provider-principal deletion comes after application cleanup

The Firebase Authentication principal may be deleted only after the complete application cleanup proof passes.

If provider deletion fails or the provider is unavailable:

- the operation returns a bounded retryable failure;
- the application account remains `deletion-pending`;
- cleanup may be retried idempotently;
- the application account is not finalized away;
- no success is reported.

If a retry observes that the provider principal is already absent, it does not call provider deletion again. It still reruns/verifies required application cleanup before finalization.

This covers interruption after provider deletion but before application-account finalization without restoring provider authority or pretending a partially completed operation never happened.

## Final application-account removal is last

Only after application cleanup is proven and provider principal deletion is confirmed as `deleted` or `already-absent` may the trusted adapter finalize removal of the application account document.

Finalization itself must confirm the exact account ID and a deterministic `deleted` / `already-absent` outcome.

If finalization fails, the operation remains retryable. The provider principal stays deleted and the application account remains non-authoritative until cleanup/finalization finishes.

## Provider/IAM boundary remains unresolved for production

This dormant proof grants no new production IAM authority.

Stage 2H's currently proven account-bootstrap runtime role remains exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Do not add account-update, account-delete, provider-user-delete, list/query, shared-state or broader Firebase/Datastore permissions merely because this orchestration proof exists.

A future production adapter must separately identify the exact Firebase Authentication and Firestore provider methods it will call, justify the minimum required IAM permissions for those methods, and prove those permissions before provisioning or expanding the production runtime role.

## Browser Firestore write lock

Every application-client Firestore create/update/delete remains denied.

Account lifecycle mutation is trusted-server work. The browser may not directly mark its account `deletion-pending`, revoke devices, detach rivalry ownership, delete account metadata or delete provider identities.

`firestore.rules` remains deny-by-default for all application-client writes.

## Production isolation

This prerequisite does not create, configure, deploy or connect:

- a production Firebase project;
- a production Firebase Web App;
- Google Authentication provider configuration;
- Authorized Domains;
- reCAPTCHA Enterprise;
- App Check registration or enforcement;
- Cloud Run;
- service accounts;
- IAM bindings or custom roles;
- Blaze billing;
- production Firestore data;
- production Security Rules;
- Firebase Admin production runtime;
- production users;
- account/login UI;
- registered devices or pairing runtime;
- Connected Rivalry runtime;
- Private Remote Joining runtime.

Production dormancy is sequencing for safety, not the final destination. Real resources must be provisioned and proven when the remaining production prerequisites and owner-controlled configuration choices are available.

## Canonical storage and recovery locks

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Candidate A remains non-mutating export.
Candidate B remains read-only import analysis.
Candidate C remains the sole destructive import Apply authority with exact raw snapshots, last-moment guards, preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber protection, exact post-write verification, byte-for-byte rollback verification and corrupt-byte preservation intact.

No account/cloud/deletion module directly owns canonical browser-storage mutation.

## Identity, privacy and product locks

Firebase Auth UID maps only to architecture `accountId`.

`accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId` remain distinct namespaces.

Exactly two manager slots remain authoritative. Display labels never establish identity or entitlement. A disabled account does not surrender ownership. A surviving account never gains unrestricted destructive authority merely because the peer is offline, disabled, deleting or deleted.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community systems, global leaderboards and public rankings remain eliminated.

## What remains after this prerequisite

Completing this boundary closes only the trusted account-deletion execution subdependency.

It does not by itself complete Stage 2 or authorize Stage 3. Remaining genuine Stage 2 production/account/operational work still includes, subject to fresh source reconstruction after publication:

- connected-data account export execution;
- real production Firebase/environment/provider provisioning and configuration;
- production Security Rules deployment and operational verification;
- exact provider/IAM activation for trusted operations;
- abuse/rate controls where required;
- provider outage/recovery and rollback proof;
- production launch validation/hardening.

Do not convert that list into automatic milestone numbering or roadmap order. After this prerequisite is published, reconstruct the smallest remaining blocker again from current source and live state.

Stage 3 Registered Devices / Private Pairing remains blocked until the entire Stage 2 lane is genuinely DONE / MERGED / PROVEN at its required production boundary.

## Exit gate

This trusted account-deletion execution prerequisite is DONE / MERGED / PROVEN only when:

1. the dormant execution module and this boundary agree;
2. verified UID is the only account identity source accepted by the module;
3. exact operation authorization is required before any trusted adapter executes;
4. malformed or inconsistent application/provider state fails closed;
5. an active account becomes `deletion-pending` at exactly the next revision before cleanup;
6. an already `deletion-pending` account resumes without reactivation or duplicate transition;
7. cleanup proof requires devices, invites, sessions, rivalries, profile links, presentation minimization, tombstone restoration authority and bounded metadata handling;
8. survivor entitlement preservation is mandatory and unconsented shared gameplay destruction fails closed;
9. incomplete cleanup never reaches provider-principal deletion;
10. provider delete happens only after complete application cleanup;
11. provider outage/failure leaves a retryable deletion-pending state without false success;
12. retry after an already-absent provider principal skips duplicate provider deletion but still verifies cleanup;
13. application-account finalization occurs only after provider deletion is confirmed;
14. browser Firestore writes remain deny-all;
15. Stage 2H IAM is not broadened;
16. no production provider/resource/runtime activation occurs;
17. the module remains absent from production browser and Service Worker loading;
18. production application/package/runtime identity remains `1.4.0` / `1.4.0-r1`;
19. permanent account-deletion contracts are registered in the repository suite and pass;
20. all normal PR workflow families required by the repository pass on one exact unchanged final head;
21. submitted reviews and inline review threads are clean;
22. expected-head merge succeeds and live main is independently verified.

This prerequisite alone does not authorize Stage 3, Connected Rivalry or Private Remote Joining.
