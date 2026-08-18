# Private Account / Authentication Stage 2B — Provider Session Lifecycle & Revocation Boundary

Status: CURRENT BOUNDED CANDIDATE / EMULATOR-ONLY IMPLEMENTATION
Effective: 2026-08-18 ET
Production application: v1.4.0 / `1.4.0-r1`
Production Firebase runtime: NOT CONNECTED
Production accounts: NOT CREATED
Production Firestore writes: DENIED
Pairing / Connected Rivalry / Remote Joining: NOT AUTHORIZED

## Purpose

Stage 2B is the smallest private account/authentication prerequisite after completed Stage 2A. It proves the provider-side account lifecycle operations that a secure future connected product will need, while preserving the separate application-account authorization layer that Firestore Security Rules already enforce.

The bounded candidate remains entirely inside the fixed Firebase Local Emulator Suite. It does not create a production Firebase project, choose production sign-in UX, choose production Auth persistence, deploy Security Rules, add account UI, enable client Firestore writes, add a trusted shared-state mutation gateway, pair devices, synchronize a Connected Rivalry or implement Remote Joining.

Stage 2B answers four narrow questions before production sign-in is allowed:

1. can a trusted provider boundary disable and re-enable the exact Firebase Auth `uid` without changing architecture `accountId`;
2. does a disabled provider account fail closed for a new sign-in;
3. can the provider refresh-token revocation operation be exercised without retrieving, logging or persisting raw tokens;
4. does Career Mode Showdown continue to rely on current application account lifecycle metadata for immediate connected authorization rather than assuming provider session revocation instantly invalidates every already-issued credential.

## Inherited completed boundary

Private Account / Authentication Stage 2A is DONE / MERGED / PROVEN through PR #83.

Exact validated PR #83 head:

`a4022d6f316622f73ead9aacde812b545b8dcf78`

Squash merge / verified live-main completion boundary:

`e39c1b0689598ac922569ff839ca30a1d5dee5fa`

Stage 2A permanently proves Firebase Auth `uid` as architecture `accountId`, strict namespace separation, cross-service Auth/Firestore identity, wrong-account and unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, application-account lifecycle separation and continued total application-client Firestore write denial.

Stage 2B must not weaken any Stage 2A guarantee.

## Provider documentation boundary

Current Firebase primary documentation establishes the production behavior that motivates this proof:

- Firebase Admin user-management APIs are elevated operations intended for a secure server environment.
- Admin user management can set a user `disabled` state.
- Firebase Authentication sessions use short-lived ID tokens plus long-lived refresh tokens.
- refresh-token revocation is an Admin SDK operation.
- the Firebase Admin SDK can target the Authentication Emulator by setting `FIREBASE_AUTH_EMULATOR_HOST` without a protocol prefix.

Primary references:

- `https://firebase.google.com/docs/auth/admin/manage-users`
- `https://firebase.google.com/docs/auth/admin/manage-sessions`
- `https://firebase.google.com/docs/emulator-suite/connect_auth`

These references describe production/provider APIs. The emulator proof below must not claim stronger production revocation guarantees than it can directly exercise.

## Exact emulator boundary

Stage 2B continues using the fixed local project:

`demo-career-mode-showdown-phase1f`

Authentication Emulator:

`127.0.0.1:9099`

Firestore Emulator:

`127.0.0.1:8080`

The Firebase Web SDK remains the synthetic client identity path. Firebase Admin Node.js SDK is added only to the CI test-tool installation with `--no-save --package-lock=false` and is initialized only against the Authentication Emulator.

No service-account file, private key, Application Default Credential, production project credential or production Firebase resource is required or permitted.

`FIREBASE_AUTH_EMULATOR_HOST` is test-process configuration only. It must never be set as a production runtime dependency or used to make an Admin SDK bundle part of GitHub Pages.

## Provider account lifecycle contract

For one synthetic emulator account:

1. Web Auth creates the user and receives the canonical Firebase `uid`.
2. That `uid` is architecture `accountId` and remains distinct from every Local Profile/gameplay/device/session identifier.
3. A test-only Admin SDK instance addressing the same fixed emulator project reads that same `uid`.
4. The trusted Admin boundary sets `disabled: true`.
5. After client sign-out, a new password sign-in for that exact provider account must fail while disabled.
6. The trusted Admin boundary sets `disabled: false`.
7. A new password sign-in succeeds and returns the exact same `uid` / `accountId`.
8. Re-enable never creates a new Local Profile identity, ownership transfer, new Save identity, new device identity or new rivalry membership.

Provider disablement is an authentication lifecycle operation. It is not itself Career Mode Showdown entitlement mutation.

## Application-account lifecycle remains a separate authorization layer

Provider authentication and application authorization remain deliberately separate.

`firestore.rules` continues to use the authenticated provider principal plus current application account metadata. Connected rivalry reads require the application account document to be active.

Stage 2B must prove:

1. an authenticated and provider-enabled user whose application account status is `disabled` still may not read the private rivalry;
2. re-enabling the provider account alone does not rewrite application account metadata or restore connected rivalry authorization;
3. only a separately trusted application-lifecycle transition back to `active` restores the existing account's previously authorized read path;
4. no client write is allowed to perform that application-lifecycle transition.

This separation is the immediate fail-closed boundary for connected Firestore authorization. Do not assume provider-side token revocation alone instantly invalidates every already-issued ID token at every consumer.

## Refresh-token revocation boundary

The test-only trusted Admin boundary may call `revokeRefreshTokens(uid)` against the Authentication Emulator.

The proof is intentionally limited:

- the operation must target the same emulator project and same stable `uid`;
- the test must not call `getIdToken()`, `getIdTokenResult()`, `verifyIdToken()` or otherwise retrieve a raw bearer token merely to manufacture stronger emulator claims;
- no refresh token or ID token may be written to Firestore, canonical local storage, fixtures, logs, URLs or repository files;
- revocation does not mean the Firebase user is disabled or deleted;
- a later deliberate reauthentication may establish a new valid session for the same still-enabled provider account;
- application account status is rechecked independently for connected authorization.

The Auth Emulator is a development approximation. Stage 2B does not claim production proof of every in-flight token invalidation timing detail or backend `checkRevoked` behavior. Any such guarantee remains a later provider-operation Stage 2 gate and must be proven against the final trusted production boundary before real users are onboarded.

## Required Stage 2B proof

One bounded implementation must permanently prove at least:

1. Stage 2A is completed through PR #83 / live-main boundary `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.
2. Auth and Firestore continue to use the fixed demo project and localhost emulator ports.
3. Firebase Admin SDK is installed test-only and never enters `package.json`, `package-lock.json`, `index.html`, `js/optionalModules.js` or `service-worker.js`.
4. The Admin SDK targets only the Authentication Emulator through `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and the fixed demo project ID.
5. A synthetic Web Auth account and the test-only Admin boundary observe the exact same stable Firebase `uid`.
6. Provider disable is observable through the trusted Admin boundary.
7. A new client sign-in fails while the provider account is disabled.
8. Provider re-enable allows a new sign-in with the same exact `uid`.
9. Provider re-enable alone cannot bypass a disabled application account document.
10. A disabled application account fails private rivalry authorization through the existing Firestore Security Rules.
11. A separately trusted test-only application status transition back to active restores only the same pre-existing entitlement; no ownership transfer is inferred.
12. `revokeRefreshTokens(uid)` routes through the test-only Admin/Auth Emulator boundary without requesting or persisting raw client bearer tokens.
13. Refresh-token revocation does not itself change the stable `uid` or fabricate a new application identity.
14. Every application-client Firestore create/update/delete remains denied.
15. Test Web Auth state remains explicit in-memory persistence only; Stage 2B does not select production persistence.
16. Production package/application/runtime remains v1.4.0 / `1.4.0-r1`.
17. Production Firebase remains disconnected; no production project/region/Auth users/Firestore data/Security Rules deployment is introduced.
18. Candidate A remains non-mutating, Candidate B remains read-only and Candidate C remains sole destructive import Apply authority.
19. Canonical browser storage remains exactly Save Library, Legacy and preferences.
20. public profiles, public search/discovery, matchmaking, community systems and global leaderboard/rankings remain eliminated.
21. registered devices/private pairing, Connected Rivalry and Remote Joining remain blocked.

## Deliberately deferred Stage 2 requirements

Stage 2B does not complete the entire Private Account / Authentication / Authorization stage.

Still deferred:

- production Firebase project creation, location and operational ownership setup;
- production account/signup/login UX and final provider mix;
- production Auth persistence choice;
- production backend verification/check-revoked behavior for already-issued credentials;
- safe application account bootstrap/write lifecycle;
- account export and full provider-aware deletion cascade;
- authentication abuse/rate controls;
- production Security Rules deployment;
- trusted production mutation gateway or separately reviewed provider-enforceable schema/protocol decision;
- any registered-device or pairing capability.

No deferred item is automatically authorized by merging Stage 2B.

## Permanent Firestore write gate

Stage 2B changes no application-client Firestore write authority.

The Phase 1F security finding remains binding: the protected shared-state document does not expose the idempotency-key hash required for Security Rules to identify the matching sibling idempotency receipt for one atomic shared-state mutation.

A modified browser client can bypass a helper. Therefore every application-client Firestore create/update/delete remains denied.

Do not use Firebase Admin test tooling as a backdoor argument for production Admin credentials in the GitHub Pages client.

## Two-owner and identity locks

Exactly two stable manager slots remain authoritative.

A disabled provider account or disabled application account:

- does not relinquish entitlement;
- does not consent to rivalry deletion;
- does not transfer ownership;
- does not grant the surviving account unrestricted sole mutation authority.

Re-enabling the same provider `uid` restores only that same provider identity. Current application account state, rivalry entitlement, device state and later session authority must still be independently rechecked.

Display names remain labels only. Same visible names never establish identity.

## Local recovery and production isolation locks

Canonical local storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

No Auth/Admin/cloud module may directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply authority with exact raw snapshot/preconditions, last-moment guards, transaction-owned mutation, ownership-scoped rollback, anti-clobber and exact verification.

No production application version bump is required because Stage 2B changes only authority documentation, permanent tests and CI-only emulator tooling. A future production runtime capability must apply `VERSIONING_POLICY.md` normally.

## Exit gate

Stage 2B is complete only when:

1. its permanent static contract passes;
2. the real Auth/Firestore/Admin emulator proof passes under the fixed demo project;
3. provider disable/new-sign-in denial/re-enable stable-uid behavior is proven;
4. application account status independently fails private rivalry authorization and reactivation restores only the same existing entitlement;
5. Admin refresh-token revocation routes only through the emulator and raw bearer tokens are never requested/persisted;
6. all application-client Firestore writes remain denied;
7. production runtime/dependencies remain unchanged;
8. complete repository contracts and all required normal workflow families pass on the exact unchanged PR head;
9. review/thread state is clean and the PR is mergeable;
10. expected-head squash merge succeeds and live `main` is independently verified.

Only after that boundary may a fresh successor select the next smallest remaining Stage 2 prerequisite. Stage 3 registered devices/private pairing remains blocked until the whole Stage 2 identity/authentication/authorization layer is proven.
