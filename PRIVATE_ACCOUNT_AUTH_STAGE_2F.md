# Private Account / Authentication Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary

Status: DONE / MERGED / PROVEN / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-18 ET

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

## Verified completion boundary

Stage 2F is DONE / MERGED / PROVEN through PR #90.

Exact validated PR #90 head:

`1b0178979ea421b3bf27dd7675ad973aa7bfad8c`

Squash merge / independently verified live-main completion boundary:

`a27147695607537a1cd1543efb84e6583929a696`

All 13 normal pull-request workflow families passed on the unchanged exact PR #90 head before merge. Submitted reviews and inline review threads were empty.

Do not repeat Stage 2F. The design and proof contract below remains protected historical/current architecture authority for downstream stages.

## Purpose

Stage 2F was the smallest safe Private Account / Authentication / Authorization prerequisite after completed Stage 2E.

Stage 2E proved how a trusted Firebase Authentication UID maps to the minimal application account bootstrap decision, but it deliberately did not define how a future privileged production request proves that the caller actually owns a valid, current Firebase session before any trusted account bootstrap, export, deletion, device registration or later mutation operation executes.

Stage 2F defines and proves only that trusted request-authentication boundary.

It does not create a production backend, production Firebase project, production user, account UI, registered device, pairing flow, Connected Rivalry runtime or Remote Joining runtime.

## Inherited completed Stage 2E boundary

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary — is DONE / MERGED / PROVEN through PR #89.

Exact validated PR #89 head:

`f7d462b3d8252b2912f34a1589e457c03e977bd3`

Squash merge / independently verified live-main completion boundary:

`0cb56c22f82facdb248c8c68ec59064c5612c543`

All 13 normal workflow families passed on the unchanged exact PR head before merge. Submitted reviews and inline review threads were empty.

Do not repeat Stage 2E.

## Why Stage 2F comes before the remaining alternatives

Current source leaves several Stage 2 concerns unresolved: production Firebase provisioning, production Web App/provider/domain configuration, trusted token verification, trusted account-write execution, IAM/service identity, production Security Rules deployment, account export/deletion, abuse controls, provider outage handling and the trusted mutation-gateway decision.

Stage 2F comes first because every later privileged operation needs a trustworthy authenticated actor before it can safely decide authorization or mutate anything.

A production project alone does not establish trusted request identity. A privileged account writer or mutation gateway without token verification would have no safe basis for deriving `accountId`. Account export, deletion, device registration and later shared mutations likewise cannot trust a client-supplied account identifier.

Therefore the order is:

trusted provider request authentication first;
then separately reviewed trusted execution/IAM and lifecycle operations;
then later production-connected capabilities.

This ordering reduces attack surface and avoids provisioning live privileged infrastructure before its request-authentication contract exists.

## Current Firebase source boundary

Primary Firebase references reviewed for this stage:

- `https://firebase.google.com/docs/auth/admin/verify-id-tokens`
- `https://firebase.google.com/docs/auth/admin/manage-sessions`
- `https://firebase.google.com/docs/auth/admin`
- `https://firebase.google.com/docs/emulator-suite/connect_auth`
- `https://firebase.google.com/docs/admin/setup`
- `https://firebase.google.com/docs/firestore/security/rules-conditions`

The relevant provider facts are:

1. a Firebase client may send its Firebase ID token to a custom backend over HTTPS after sign-in;
2. the trusted backend verifies the token and derives the authenticated Firebase `uid` from the verified token rather than trusting a request-body account identifier;
3. ordinary Admin SDK `verifyIdToken(idToken)` verifies token integrity/authenticity but does not by itself check revocation;
4. revocation-aware trusted verification requires the revocation check to be enabled, represented in Node.js as `verifyIdToken(idToken, true)`;
5. revocation checking is a trusted-server operation and may require an additional provider request;
6. the Authentication Emulator issues unsigned test tokens that Admin SDK accepts only when deliberately pointed at the emulator with `FIREBASE_AUTH_EMULATOR_HOST`; that emulator setting must not exist in production;
7. privileged Firestore server clients bypass Firestore Security Rules and rely on IAM, so token verification does not itself authorize privileged database access.

## Exact dormant implementation boundary

The dormant implementation is:

`js/trustedRequestAuthentication.js`

It is not loaded by the production application.

It performs no Firebase initialization, network request, Firestore operation, localStorage mutation, sessionStorage mutation, IndexedDB operation, credential persistence or logging.

The module receives only:

- a transient Firebase ID token supplied to the future trusted execution boundary;
- an injected trusted `verifyIdToken` adapter supplied by that future server environment.

The module itself does not import Firebase Admin and does not create a production server.

## Exact verification contract

For a non-empty transient Firebase ID token and an available trusted verifier:

1. invoke the trusted verifier exactly as `verifyIdToken(idToken, true)`;
2. require successful decoded Firebase identity;
3. derive architecture `accountId` only from the verified decoded `uid`;
4. if decoded `sub` is present, require it to equal that same UID;
5. return only the minimal verified principal needed by downstream trusted authorization;
6. mark revocation checking as required/performed by the adapter contract;
7. explicitly state that application authorization has not yet been granted;
8. never return, log or persist the raw ID token.

A client-supplied `accountId`, email, display name, profile label, club label or other visible field has zero authentication or authorization authority.

The successful result exposes the trusted provider principal in the Stage 2E-compatible shape:

`providerPrincipal.uid = verified Firebase uid`

This lets a later trusted account-bootstrap execution consume Stage 2E without inventing a second identity source.

## Fail-closed verification outcomes

The boundary rejects without granting application authorization when:

- the trusted request input is malformed;
- no non-empty Firebase ID token is present;
- the trusted verifier is unavailable;
- the token is invalid;
- the token is expired;
- the token is revoked;
- the provider account is disabled;
- the provider account is unavailable;
- the verifier returns no valid UID;
- decoded UID and decoded subject conflict;
- trusted provider verification fails for any unrecognized reason.

Provider error details are reduced to bounded application error codes. Raw token material and arbitrary provider error messages are not reflected into the result.

Unknown trusted-verifier failures fail closed rather than being treated as authenticated.

## Authentication is not application authorization

Successful Stage 2F verification establishes provider identity only.

It does not by itself authorize:

- application account creation or lifecycle mutation;
- access by an application account whose current status is disabled or deletion-pending where the operation requires active status;
- Local Profile linking;
- Save ownership;
- device registration;
- pairing/invite redemption;
- rivalry membership;
- private session membership;
- shared-state mutation;
- account deletion;
- ownership transfer.

Every later trusted operation must separately load and evaluate the current application account, device, rivalry/session and operation-specific authorization state required by the protected Phase 1D request pipeline.

## Stage 2E composition rule

The future trusted application-account bootstrap sequence may compose Stage 2F and Stage 2E only in this order:

1. receive the transient Firebase ID token over a separately reviewed HTTPS trusted endpoint;
2. Stage 2F trusted verification derives `providerPrincipal.uid` with revocation checking required;
3. if authentication fails, stop;
4. only then pass that trusted provider principal to the Stage 2E bootstrap decision;
5. execute any resulting trusted write only through a later separately reviewed IAM/service-identity/write boundary.

The request body never supplies authoritative `accountId`.

Stage 2F does not authorize step 5. Stage 2G is the separately reviewed dormant trusted account-bootstrap execution semantics boundary; it still does not select production IAM or hosting.

## Emulator proof boundary

Permanent emulator proof is:

`tests/firebase/private-account-auth-stage2f-token-verification-emulator.cjs`

It uses only the fixed demo project:

`demo-career-mode-showdown-phase1f`

Authentication Emulator:

`127.0.0.1:9099`

The proof uses Firebase Web Auth with `inMemoryPersistence` and test-only Firebase Admin Auth pointed at the Authentication Emulator.

It may retrieve an emulator Firebase ID token transiently in process memory only so the trusted verification path can be exercised. The token is never logged, written to disk, placed in browser storage, committed to fixtures or returned from the trusted decision result.

The emulator proof establishes wiring and identity behavior only:

1. the Web Auth client and Admin verifier observe the same Firebase UID/accountId;
2. `verifyIdToken` is invoked with revocation checking explicitly enabled;
3. the accepted trusted principal contains only the verified UID-derived account identity and no raw token;
4. client-supplied account identity does not override the verified UID;
5. malformed/absent verification inputs fail closed;
6. deterministic unit contracts cover revoked, disabled, expired, invalid and unknown verifier failures without leaking provider error details.

The Authentication Emulator is not production proof of cryptographic signing, provider rate limits, IAM behavior or every production in-flight revocation timing characteristic. Emulator-issued ID tokens are deliberately unsigned test tokens accepted only by emulator-configured Admin SDK.

Stage 2F therefore does not claim that local timing proves production revocation propagation. Production operational verification remains part of the later real environment/trusted-server deployment gate.

## Production trusted-server and IAM warning

Firebase Admin is a privileged server SDK.

Firestore server client libraries bypass Firestore Security Rules and use IAM. Therefore a successfully verified Firebase user token does not automatically constrain an Admin/Firestore server process to that user's Firestore permissions.

A later trusted execution boundary must independently define:

- hosting/runtime choice;
- service identity;
- least-privilege IAM;
- secret/credential handling;
- endpoint authentication and transport;
- operation authorization;
- rate/abuse controls;
- audit/security event behavior;
- rollback and provider outage behavior;
- cost/billing boundary.

Stage 2F deliberately creates none of that infrastructure.

## Production isolation

Stage 2F does not add or authorize:

- Firebase or Firebase Admin in production `package.json`;
- Firebase/Auth/Firestore/Admin imports in the GitHub Pages shell;
- Stage 2F code in `index.html`, `js/optionalModules.js` or `service-worker.js`;
- a production Firebase project or Firebase Web App;
- production Google provider/domain configuration;
- real production Firebase users;
- production Firestore data;
- deployed production Security Rules;
- Firebase Admin production runtime;
- service-account JSON/private keys in repository or browser code;
- Cloud Functions, Cloud Run or another trusted production service;
- Blaze billing;
- a trusted production mutation gateway;
- production account UI;
- registered-device runtime;
- pairing/invite runtime;
- Connected Rivalry runtime;
- Remote Joining runtime;
- public profiles, discovery, matchmaking, community features or global rankings.

## Firestore write boundary remains unchanged

Every application-client Firestore create/update/delete remains denied.

Stage 2F does not resolve the Phase 1D/1F shared-state/idempotency-receipt security finding.

A modified browser client can bypass helper code, so direct application-client shared-state writes remain unauthorized. A later trusted mutation gateway or separately reviewed provider-enforceable protocol/schema change is still required before remote mutation can ship.

## Identity, local recovery and privacy locks

Firebase Auth `uid` remains architecture `accountId` and is distinct from:

- `profileId`
- `saveId`
- `seasonId`
- `deviceId`
- `installationId`
- `rivalryId`
- `sessionId`
- `inviteId`

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains read-only analysis.

Candidate C remains the sole destructive import Apply authority with strict exact raw snapshots/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks, exact verification, corrupt-byte preservation and critical recovery.

No Stage 2F/Auth/cloud module may directly own canonical localStorage.

## Version boundary

Stage 2F is dormant source, authority, permanent contract and emulator/test proof only. It changes no shipped production application behavior.

Under `VERSIONING_POLICY.md`, no semantic application version bump is required for this bounded prerequisite. Production remains v1.4.0 / `1.4.0-r1`.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 remains incomplete after Stage 2F.

Remaining Stage 2 requirements still include real production Firebase operational setup, production provider/configuration, trusted application-account write execution, IAM/service identity, production Security Rules deployment, account export, provider-aware deletion cascade, abuse/rate controls, provider outage/recovery behavior and the separately reviewed trusted production mutation boundary.

Their listing is not automatic implementation order.

Registered Devices / Private Pairing remains Stage 3 and BLOCKED until the whole Stage 2 lane is proven.

Connected Rivalry remains Stage 4 and BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Completion gate

Stage 2F is complete only when:

1. Stage 2E is reconciled to DONE / MERGED / PROVEN in current authority;
2. the dormant trusted request-authentication model and permanent static contracts pass;
3. the model invokes the trusted verifier with revocation checking required and derives accountId only from verified UID;
4. invalid, expired, revoked, disabled, unavailable and unknown verification failures all fail closed;
5. successful provider authentication explicitly does not grant application authorization;
6. the Auth Emulator wiring proof passes without persisting/logging token material or overclaiming emulator behavior as production proof;
7. every application-client Firestore create/update/delete remains denied;
8. production runtime/dependencies remain unchanged at v1.4.0 / `1.4.0-r1`;
9. all complete repository contracts and all 13 normal workflow families pass on one exact unchanged final PR head;
10. submitted reviews and inline review threads are clean;
11. the PR is mergeable and exact-head identity remains unchanged;
12. expected-head squash merge succeeds;
13. live `main` is independently verified afterward.

All thirteen completion conditions were satisfied by PR #90 at the verified boundary above. A fresh successor WEC assessment selected Stage 2G as the next bounded prerequisite.
