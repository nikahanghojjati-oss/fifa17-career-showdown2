# Private Account / Authentication Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary

Status: CURRENT / IMPLEMENTATION-AUTHORIZED / DORMANT POLICY PROOF / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-18 ET

Stage 2H implementation starting live-main boundary: `8e5e892759ec2ddf033bb46f0c3d370c848615d5` after PR #92.

Stage 2G functional completion boundary remains PR #91 exact validated head `9b11ed82766d011bef6f5ea29ba2a9cd20e4ad52`, squash merge `f97024cf4be3e76cf25c510fb364675b8e747762`.

PR #92 exact validated head `dc012a24e932c1e0dad500855a3220d02f3195e7` reconciled Stage 2G as complete and selected this Stage 2H boundary; its squash merge is the implementation starting main above.

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

## Why Stage 2H is next

Stage 2F already proves how a future trusted service must verify a transient Firebase ID token with revocation checking and derive architecture `accountId` only from the verified Firebase UID. Stage 2G already proves how that verified principal may execute only the narrow same-UID missing-account bootstrap through one trusted atomic transaction.

The next unresolved dependency is the production trust boundary that will eventually host those privileged operations. Firestore server client libraries use Google Cloud IAM rather than Firestore Security Rules, so the runtime, service identity and exact privilege boundary must be proven before any production Firebase or privileged writer is provisioned.

Stage 2H therefore comes before production provisioning, account lifecycle execution, device registration, pairing, Connected Rivalry or Private Remote Joining.

## Selected production trusted runtime

Stage 2H selects one dedicated Google Cloud Run HTTPS service as the future trusted execution runtime for Career Mode Showdown privileged server operations.

This is an architecture and least-privilege policy proof only. Stage 2H does not create, deploy or connect that service.

Current primary provider references rechecked on 2026-08-18 ET:

- `https://cloud.google.com/run/docs/configuring/services/service-identity`
- `https://cloud.google.com/run/docs/authenticating/end-users`
- `https://cloud.google.com/run/docs/reference/iam/roles`
- `https://firebase.google.com/docs/admin/setup`
- `https://firebase.google.com/docs/auth/admin/manage-sessions`
- `https://cloud.google.com/identity-platform/docs/access-control`
- `https://cloud.google.com/firestore/docs/security/iam`
- `https://cloud.google.com/iam/docs/custom-roles-permissions-support`

The policy is implemented as dormant source in `js/trustedExecutionRuntimeIamPolicy.js` and permanently protected by `tests/contracts/private-account-auth-stage2h-contracts.cjs`.

The module is not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`; it performs no Firebase initialization, provider network request, browser-storage mutation, credential loading or production deployment.

## End-user request boundary

The future service is for private Career Mode Showdown end users authenticated by Firebase Authentication, not organization members authenticated to Google Cloud IAM.

The browser may reach the Cloud Run HTTPS endpoint at the network layer, but network reachability grants zero application authority.

For every protected non-preflight request:

1. the signed-in web app obtains a transient Firebase ID token;
2. the request sends that token in an `Authorization: Bearer ...` header over HTTPS;
3. the trusted service passes only that transient token into the Stage 2F verifier boundary;
4. Stage 2F requires the equivalent of `verifyIdToken(idToken, true)`;
5. architecture `accountId` is derived only from the verified Firebase UID;
6. the service performs separate current Career Mode Showdown application authorization for the requested operation;
7. only after both authentication and operation authorization may the request reach an explicitly reviewed trusted adapter.

Cloud Run IAM is the runtime service-identity/resource-access boundary. It is not the Career Mode Showdown end-user authorization mechanism.

CORS, origin checks, Cloud Run reachability, a request-body `accountId`, display name, profile label, device label or possession of a public service URL is never authentication or application authorization.

The initial browser-origin allowlist is exactly the current production origin:

`https://nikahanghojjati-oss.github.io`

That allowlist is defense in depth only and grants no application authority. An `OPTIONS` CORS preflight may be answered without Firebase user authentication when browser protocol requires it, but it must never execute an application operation or disclose protected data.

## Dedicated same-project service identity

The future Cloud Run service must use a dedicated user-managed service account created only for the Career Mode Showdown trusted execution service.

The initial production design keeps that service identity in the same Google Cloud/Firebase project as the Cloud Run service and Firestore database. Cross-project service identity is not authorized by Stage 2H because Google documents additional service-agent token-creation and organization-policy requirements for that topology. A later cross-project design would require its own reviewed boundary.

Do not use:

- a human account;
- the default Compute Engine service account;
- a default broad Firebase service account as a convenience runtime identity;
- a browser credential;
- an exported service-account JSON key;
- a repository secret containing a service-account private key.

Do not grant primitive `Owner`, `Editor` or `Viewer` roles to the runtime identity.

Do not grant broad convenience runtime roles such as `roles/firebase.admin`, `roles/datastore.owner` or `roles/datastore.user`.

`roles/iam.serviceAccountUser` is deployer authority used to attach a service identity to Cloud Run. It is not a runtime application permission and must not be included in the runtime custom role.

Likewise, `roles/iam.serviceAccountTokenCreator` is not part of this same-project runtime permission set. Stage 2H deliberately avoids the cross-project service-identity topology that would introduce additional token-creator/service-agent requirements.

## Exact least-privilege runtime permission set

For the exact Stage 2F plus Stage 2G bootstrap operation currently authorized, the future runtime custom role contains exactly four permissions:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

No other application-data permission is authorized by Stage 2H.

### Why each permission exists

`firebaseauth.users.get`

Stage 2F requires revocation-aware `verifyIdToken(idToken, true)`. Firebase documents that revocation checking requires an additional backend lookup of current user/session status, and Identity Platform documents `firebaseauth.users.get` for `GetAccountInfo`. This permission is therefore the narrow Firebase Authentication Admin read required by the Stage 2F trusted verification path.

`datastore.databases.get`

Firestore documents this permission for `beginTransaction` and rollback. Stage 2G requires the authoritative account read and conditional create to occur in one provider transaction or equivalent atomic compare-and-create boundary.

`datastore.entities.get`

Firestore documents this permission for document reads. Stage 2G must read the authoritative `accounts/{accountId}` document inside the transaction before deciding whether the missing-account create is legal.

`datastore.entities.create`

Firestore documents this permission for a create or commit/update operation with the `exists=false` precondition. Stage 2G grants only one missing-account revision-0 create and no update/delete authority.

### Explicitly excluded permissions

The Stage 2H bootstrap role must not include:

```text
datastore.entities.update
datastore.entities.delete
datastore.entities.list
datastore.databases.getMetadata
datastore.databases.list
datastore.indexes.list
```

Nor may it include broader index, database-management, import/export, bulk-delete, project-administration, service-account administration or Firebase-administration permissions merely for convenience.

Google's predefined `roles/datastore.user` is intentionally rejected because it includes broader `datastore.entities.*` authority plus database, index, namespace, statistics and project reads beyond the Stage 2G bootstrap need.

All four selected permissions are supported in custom roles under current Google Cloud IAM documentation. The runtime permission set is therefore contracted as an exact custom role rather than accepting a broader predefined role.

If a later separately authorized Stage 2 operation requires account update/delete, export, device registration, rivalry mutation or another provider API, its additional permission must be justified by that operation's exact API method and reviewed before the runtime role is expanded. Stage 2H does not pre-authorize that expansion.

## Runtime IAM is not application authorization

The custom IAM role constrains what the Cloud Run process can ask Google Cloud/Firebase services to do. It does not decide what a particular Career Mode Showdown user is allowed to do.

A protected request therefore has three separate gates:

1. Stage 2F authenticates the Firebase end user and derives the trusted UID/accountId;
2. Career Mode Showdown code evaluates current operation-specific application authorization;
3. Google Cloud IAM limits the service process to the provider calls allowed by the dedicated runtime role.

All three gates must pass for a protected operation. None substitutes for another.

Stage 2G still grants only `applicationAuthorizationGranted: "account-bootstrap-only"` for same-UID missing-account creation. Stage 2H grants no device, pairing, rivalry, session, gameplay or shared-mutation authority.

## Application Default Credentials and secret boundary

On Google-managed production runtime, Firebase Admin must initialize through Application Default Credentials bound to the Cloud Run service identity.

No service-account private-key JSON may be committed to the repository, bundled into the GitHub Pages client, stored in browser storage, copied from a connector, embedded in source, printed into CI logs or persisted as application data.

Stage 2F Firebase ID tokens remain transient end-user bearer material. They must not be stored in Firestore, `localStorage`, `sessionStorage`, IndexedDB, diagnostics, analytics or application logs.

The token is consumed by the trusted verifier and is not forwarded to the Stage 2G account transaction adapter.

## Firestore trust model remains unchanged

Every application-client Firestore create, update and delete remains denied.

Cloud Run/Admin/server Firestore access bypasses Firestore Security Rules and therefore must be constrained by both least-privilege IAM and explicit Career Mode Showdown application authentication/authorization before each operation.

Stage 2H does not weaken `firestore.rules` and does not authorize direct browser Firestore shared-state writes.

The Phase 1D / Phase 1F idempotency-receipt finding remains binding. Stage 2H is not the production shared-rivalry mutation gateway contract and does not grant Connected Rivalry or gameplay mutation authority.

## Stage 2G account-bootstrap composition

The future production account-bootstrap path may compose the completed stages only in this order:

1. HTTPS request reaches the trusted Cloud Run service;
2. Stage 2F performs revocation-aware Firebase ID-token verification;
3. authenticated `accountId` is derived only from verified UID;
4. current application authorization is evaluated for the exact requested operation;
5. Stage 2G executes same-UID missing-account bootstrap only through the reviewed atomic transaction adapter;
6. Google Cloud IAM permits only the exact provider methods allowed by the four-permission runtime role;
7. the service returns a bounded response without raw token or arbitrary provider diagnostics.

Stage 2G's `updatedByDeviceId: null` exception remains limited to revision-0 self-bootstrap before Stage 3 registered-device authority exists.

## Production isolation for Stage 2H

Stage 2H must not create or activate:

- a production Firebase project;
- a production Firebase Web App;
- Google provider or Authorized Domains configuration;
- a production Cloud Run service;
- a production service account;
- any IAM binding or custom role;
- Blaze billing or another paid-production commitment;
- production Firestore data;
- deployed production Firestore Security Rules;
- production Firebase Admin runtime;
- service-account keys or credentials;
- production users;
- account UI;
- device registration;
- pairing or invite runtime;
- Connected Rivalry runtime;
- Private Remote Joining runtime.

No production application dependency, runtime asset or Service Worker revision changes in this Stage 2H proof.

## Product and recovery locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C remains the sole destructive import Apply authority with the protected snapshot, precondition, rollback, anti-clobber and exact-verification guarantees.

Public discovery, public profiles, public matchmaking, community systems, global leaderboards and public rankings remain eliminated.

## Version boundary

Stage 2H adds only dormant policy source, permanent contracts and authority documentation. It is not loaded by the production application and creates no deployed trusted service.

Under `VERSIONING_POLICY.md`, no semantic application version bump is appropriate. Production remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 lane remains incomplete after Stage 2H.

Later Stage 2 work still includes production environment provisioning/configuration, production operational verification, account lifecycle export/deletion execution, abuse/rate controls, provider outage/recovery behavior and a separately reviewed trusted shared-mutation gateway/protocol boundary. Their listing is not automatic implementation order.

Stage 3 Registered Devices / Private Pairing remains BLOCKED until the entire Stage 2 lane is DONE / MERGED / PROVEN.

Stage 4 Connected Rivalry remains BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Stage 2H implementation completion gate

Stage 2H may be classified DONE / MERGED / PROVEN only when all of the following are satisfied:

1. Cloud Run is permanently contracted as the only selected trusted execution runtime for this boundary.
2. A dedicated same-project user-managed service identity is required and default/cross-project identities fail closed.
3. Application Default Credentials are required on Google-managed runtime and exported private-key credentials are forbidden.
4. The exact four-permission custom runtime role is documented, justified and permanently contracted.
5. Primitive Owner/Editor/Viewer and broad Firebase/Datastore convenience roles are rejected for runtime authority.
6. Deployer-only service-account attachment authority remains separate from runtime application permissions.
7. End-user Firebase ID tokens remain transient and Stage 2F revocation-aware `verifyIdToken(idToken, true)` remains mandatory.
8. Application authorization remains separate from Firebase authentication and Google Cloud IAM.
9. Stage 2G account-bootstrap-only authority remains narrow and atomic.
10. Every browser Firestore create/update/delete remains denied.
11. No shared-rivalry/gameplay mutation authority is granted.
12. No production Firebase, Cloud Run, IAM, billing, user, Firestore or provider resource is provisioned by Stage 2H.
13. Production application/package/runtime identity remains v1.4.0 / `1.4.0-r1`.
14. Permanent Stage 2H contracts and the complete repository contract suite pass.
15. All 13 normal workflow families succeed on one exact unchanged final PR head.
16. Submitted reviews and inline review threads are clean, mergeability is verified and exact-head identity is unchanged immediately before merge.
17. Expected-head squash merge succeeds and resulting live `main` is independently verified.

Until all seventeen conditions are satisfied, Stage 2H remains current and Stage 3 remains blocked.
