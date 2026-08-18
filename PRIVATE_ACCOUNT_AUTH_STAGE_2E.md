# Private Account / Authentication Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary

Status: DONE / MERGED / PROVEN / EMULATOR-TEST-ONLY / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-18 ET

Completion: PR #89, exact validated head `f7d462b3d8252b2912f34a1589e457c03e977bd3`, squash merge / independently verified live-main boundary `0cb56c22f82facdb248c8c68ec59064c5612c543`.

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

Do not repeat Stage 2E.

## Purpose and completed boundary

Stage 2E was the smallest unblocked Private Account / Authentication / Authorization prerequisite after completed Stage 2D. It is now complete and protected through PR #89.

Stage 2D proved a fail-closed production Firebase environment/configuration preflight. It did not define how a successfully authenticated provider identity obtains the minimal Career Mode Showdown application account document that later authorization, registered-device and pairing logic depend on.

Stage 2E defines and proves only that trusted application-account bootstrap boundary. It did not create a production backend, production Firebase project, production user, account UI, registered device, pairing flow, Connected Rivalry runtime or Remote Joining runtime.

## Inherited completed Stage 2D boundary

Stage 2D — Production Firebase Environment & Configuration Preflight — is DONE / MERGED / PROVEN / NON-RUNTIME through PR #88.

Exact validated PR #88 head:

`f019c6c6c39385fcb1f76f3de240fd73bb972e49`

Squash merge / independently verified live-main completion boundary:

`0fd0ac3651a4b8c78957242b645e095a3c151c9d`

All 13 normal workflow families passed on the unchanged exact PR head before merge. Submitted reviews and inline review threads were empty.

Do not repeat Stage 2D.

## Source-grounded trust boundary

Firebase Authentication `uid` remains architecture `accountId`.

Firebase Admin user-management APIs are elevated operations intended for secure server environments. Firestore server client libraries bypass Firestore Security Rules and rely on IAM. Therefore Stage 2E does not pretend that an emulator helper or browser JavaScript becomes a production trusted server simply because it can demonstrate the required transition.

The Stage 2E implementation is deliberately dormant and emulator/test-only. Any future production implementation of this trusted bootstrap requires a separately reviewed production execution boundary, IAM/service identity, token verification/revocation behavior, cost/operations model and rollback plan.

Primary Firebase references reviewed for this boundary:

- Firebase Admin user management: `https://firebase.google.com/docs/auth/admin/manage-users`
- Firebase Admin authentication: `https://firebase.google.com/docs/auth/admin`
- Firestore Security Rules conditions / server bypass boundary: `https://firebase.google.com/docs/firestore/security/rules-conditions`
- Firestore server client/IAM boundary: `https://firebase.google.com/docs/firestore/enterprise/behavior-differences`
- Firebase project/environment guidance: `https://firebase.google.com/docs/projects/dev-workflows/general-best-practices`

## Exact account schema authority

Stage 2E does not invent a new remote schema.

It uses the protected Phase 1D account path exactly:

`accounts/{accountId}`

The path `accountId` must equal the trusted provider Firebase Auth `uid`.

The application account document remains a revision-controlled envelope with:

- `schemaVersion: 1`;
- `objectType: "account"`;
- `objectId` equal to the path/provider `accountId`;
- non-negative integer `revision`;
- `lifecycleState: "live"` for the bootstrap boundary;
- `data.status` exactly one of `active`, `disabled`, `deletion-pending`;
- `data.createdAt` from a trusted provider/server timestamp authority;
- `data.deletionRequestedAt` provider/server timestamp or null;
- no password, provider credential, raw ID token, refresh token or duplicated email credential.

Display name, email address, provider photo, Local Profile label, club name or any other visible string has zero identity or authorization meaning.

## Deterministic bootstrap contract

The dormant implementation is `js/trustedAccountBootstrap.js`.

It is a decision model only. It performs no network request, Firestore write, localStorage mutation, Firebase initialization or credential operation.

Its trusted input contains a provider principal whose canonical identity is `providerPrincipal.uid`, the exact target account path identity and the currently observed application account document when one exists.

The client request body never supplies trusted `accountId` authority.

### Missing account

A missing `accounts/{uid}` document produces exactly one initial create plan when the trusted provider principal has a non-empty `uid`.

When no `accounts/{uid}` document exists and the trusted provider principal has a non-empty `uid`, the decision is exactly one initial create plan:

- path `accounts/{uid}`;
- `revision: 0`;
- `lifecycleState: "live"`;
- initial application status `active`;
- `deletionRequestedAt: null`;
- `createdAt` and envelope `updatedAt` supplied by the later trusted provider/server timestamp boundary.

The dormant model does not itself write the document.

### Existing same-UID account

If a structurally valid application account already exists at the exact provider UID path, bootstrap returns `existing` and performs no rewrite.

This no-write behavior is required for all currently valid application statuses:

- `active`;
- `disabled`;
- `deletion-pending`.

For `disabled` and `deletion-pending` accounts, bootstrap therefore remains a no-write outcome.

Bootstrap must never reactivate a disabled account, cancel deletion-pending state, rewrite account creation time, reset revision, refresh provider metadata or otherwise use sign-in as an application lifecycle mutation.

This is the idempotency rule for account bootstrap.

### Conflict and malformed state

Bootstrap fails closed and performs no write when:

- the trusted provider UID is absent;
- the requested document path does not equal that UID;
- the stored `objectId` does not equal the trusted provider UID;
- the stored object is not a valid account envelope;
- revision is malformed;
- lifecycle state is unsafe for this bootstrap boundary;
- exact application account data fields or status are invalid.

A conflict is not repaired by overwrite. A later recovery or migration operation would require its own bounded authority.

## Real emulator proof

Permanent provider proof is `tests/firebase/private-account-auth-stage2e-bootstrap-emulator.cjs`.

The proof uses only:

- fixed demo project `demo-career-mode-showdown-phase1f`;
- Authentication Emulator `127.0.0.1:9099`;
- Firestore Emulator `127.0.0.1:8080`;
- Firebase Web Auth synthetic users with `inMemoryPersistence`;
- test-only Firebase Admin Auth pointed at the Authentication Emulator to observe the provider-issued UID through a trusted provider boundary;
- `withSecurityRulesDisabled()` only as the existing local-emulator trusted-write test mechanism.

It proves:

1. Web Auth and the test-only trusted Admin Auth boundary observe the same stable Firebase UID / architecture `accountId`.
2. A browser client cannot create its own `accounts/{uid}` bootstrap document.
3. The trusted bootstrap creates a missing application account exactly once.
4. The created document uses the protected Phase 1D account identity/schema boundary.
5. The authenticated account can read its own account metadata after trusted bootstrap.
6. Another authenticated account cannot read it.
7. Browser clients still cannot update or delete application account metadata.
8. Repeating bootstrap for the same valid account is a no-write idempotent decision and preserves revision, lifecycle status, creation timestamp and update timestamp.
9. Repeating bootstrap while application status is `disabled` leaves it disabled.
10. Repeating bootstrap while application status is `deletion-pending` leaves deletion pending.
11. A conflicting stored account identity fails closed and is not overwritten.
12. A provider UID/path mismatch fails closed.
13. Missing trusted provider identity fails closed.
14. Firebase `accountId` remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` and `sessionId`.
15. No production Firebase project, real production user, credential or network endpoint is required.

## Security Rules remain fail closed

`firestore.rules` is not weakened by Stage 2E.

Signed-in clients may continue to direct-get their own application account document. Every application-client account list/create/update/delete remains denied, and the global deny fallback remains intact.

The trusted Stage 2E emulator write is proof tooling only. It is not an authorization pattern that production browser code may copy.

The Phase 1F remote-write finding also remains unchanged: direct application-client shared-state writes remain denied because a modified client could bypass a helper and the protected schema does not expose the sibling idempotency receipt path required for provider-enforceable atomic validation.

## Provider and application lifecycle separation

Provider authentication and application authorization remain separate.

A successful Google sign-in in a future production implementation proves provider identity only. It does not by itself:

- reactivate a disabled Career Mode Showdown application account;
- cancel an account deletion request;
- create or transfer rivalry entitlement;
- link a Local Profile;
- register a device;
- redeem an invite;
- create a session;
- grant shared mutation authority.

Stage 2E bootstrap may create initial application metadata only when no account document exists. Once the application account exists, current application lifecycle state remains authoritative until a separately authorized lifecycle transition changes it.

## Production isolation

Stage 2E does not add or authorize:

- Firebase or Firebase Admin in production `package.json`;
- Firebase/Auth/Firestore imports in the GitHub Pages shell;
- Stage 2E code in `index.html`, `js/optionalModules.js` or `service-worker.js`;
- a real Firebase production project or web app;
- production Google provider or authorized-domain changes;
- a production Firestore database or Security Rules deployment;
- production service-account credentials or private keys;
- Cloud Functions;
- Blaze billing or other paid infrastructure;
- a production trusted token-verification service;
- a trusted production mutation gateway;
- account UI or production user onboarding;
- registered-device runtime;
- pairing/invite runtime;
- Connected Rivalry runtime;
- Remote Joining runtime;
- public profiles, discovery, matchmaking, community features or global rankings.

## Local recovery and storage locks

Canonical application storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains read-only analysis.

Candidate C remains the sole destructive import Apply authority with strict raw snapshot/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks, exact verification, corrupt-byte preservation and critical recovery.

No Stage 2E/Auth/cloud module may directly own canonical `localStorage`.

## Version boundary

Stage 2E is dormant source, emulator/test proof and authority documentation only. It is not loaded by the production application and changes no shipped runtime behavior.

Under `VERSIONING_POLICY.md`, no semantic application version bump is required for this bounded prerequisite. Production remains v1.4.0 / `1.4.0-r1`.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 remains incomplete after Stage 2E.

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — is the current bounded successor prerequisite. Detailed authority is `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

Remaining later Stage 2 requirements still include real production Firebase operational setup, production provider/configuration, trusted application-account write execution, IAM/service identity, account export, provider-aware deletion cascade, abuse/rate controls, production Security Rules deployment, provider outage/recovery behavior and the separately reviewed trusted production mutation boundary.

Their listing is not automatic implementation order.

Registered Devices / Private Pairing remains Stage 3 and BLOCKED until the whole Stage 2 lane is proven.

Connected Rivalry remains Stage 4 and BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Completion evidence

Stage 2E is DONE / MERGED / PROVEN through PR #89.

Exact validated PR #89 head:

`f7d462b3d8252b2912f34a1589e457c03e977bd3`

Squash merge / independently verified live-main completion boundary:

`0cb56c22f82facdb248c8c68ec59064c5612c543`

All 13 normal workflow families passed on that exact unchanged head before merge. Submitted reviews and inline review threads were empty.

The completion proof preserves trusted UID identity, initial missing-account create planning, exact no-write behavior for valid active/disabled/deletion-pending existing accounts, conflict rejection, browser account-write denial and production isolation.

No test, timeout, Candidate C guarantee, Firestore Security Rule or performance ceiling was weakened to complete Stage 2E.

Do not repeat Stage 2E. Continue only with the separately bounded Stage 2F authority after fresh WEC initialization and assessment.
