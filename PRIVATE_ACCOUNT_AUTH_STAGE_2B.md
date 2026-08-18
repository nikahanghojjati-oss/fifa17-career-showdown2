# Private Account / Authentication Stage 2B — Provider Session Lifecycle & Revocation Boundary

Status: DONE / MERGED / PROVEN through PR #84

Effective: 2026-08-18 ET

Exact validated PR #84 head:

`d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`

Squash merge / independently verified live-main completion boundary:

`c4feadb69fb5e26eba19fa520afa0a09baf1de03`

Production application remains v1.4.0 / `1.4.0-r1`.

Production Firebase runtime remains NOT CONNECTED.
Production accounts remain NOT CREATED.
Production Firestore writes remain DENIED.
Pairing / Connected Rivalry / Remote Joining remain NOT AUTHORIZED.

## Purpose and completed boundary

Stage 2B was the smallest provider-session lifecycle prerequisite after completed Stage 2A. It proved the provider-side account lifecycle operations that a secure future connected product needs while preserving the separate application-account authorization layer enforced by Firestore Security Rules.

Stage 2B is complete. Do not repeat it.

The bounded proof remains entirely inside the fixed Firebase Local Emulator Suite. It did not create a production Firebase project, choose production sign-in UX, choose production Auth persistence, deploy Security Rules, add account UI, enable client Firestore writes, add a trusted shared-state mutation gateway, pair devices, synchronize a Connected Rivalry or implement Remote Joining.

## Inherited completed Stage 2A boundary

Stage 2A is DONE / MERGED / PROVEN through PR #83.

Exact validated PR #83 head:

`a4022d6f316622f73ead9aacde812b545b8dcf78`

Squash merge / verified completion boundary:

`e39c1b0689598ac922569ff839ca30a1d5dee5fa`

Stage 2A permanently proves Firebase Auth `uid` as architecture `accountId`, strict namespace separation, cross-service Auth/Firestore identity, wrong-account and unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, application-account lifecycle separation and continued total application-client Firestore write denial.

## Provider documentation boundary

Firebase Admin user-management APIs are elevated operations intended for a secure server environment.

Firebase Admin user management can set a user disabled state. Firebase Authentication sessions use short-lived ID tokens plus long-lived refresh tokens. Refresh-token revocation is an Admin SDK operation. The Firebase Admin SDK can target the Authentication Emulator by setting `FIREBASE_AUTH_EMULATOR_HOST` without a protocol prefix.

Primary references used for this completed boundary:

- `https://firebase.google.com/docs/auth/admin/manage-users`
- `https://firebase.google.com/docs/auth/admin/manage-sessions`
- `https://firebase.google.com/docs/emulator-suite/connect_auth`

These references describe production/provider APIs. The emulator proof does not claim production proof of every in-flight token invalidation timing detail or final backend `checkRevoked` behavior.

## Exact emulator boundary

The completed proof uses only fixed local project:

`demo-career-mode-showdown-phase1f`

Authentication Emulator:

`127.0.0.1:9099`

Firestore Emulator:

`127.0.0.1:8080`

The Firebase Web SDK is the synthetic client identity path. Firebase Admin Node.js SDK is installed only as CI/test tooling with `--no-save --package-lock=false` and initialized only against the Authentication Emulator.

No service-account file, private key, Application Default Credential, production project credential or production Firebase resource is required or permitted.

`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` is test-process configuration only. It must never make Admin SDK part of the GitHub Pages runtime.

## Completed provider account lifecycle proof

For one synthetic emulator account, Stage 2B permanently proves:

1. Web Auth creates the user and receives the canonical Firebase `uid`.
2. That `uid` is architecture `accountId` and remains distinct from every Local Profile, gameplay, device and session identifier.
3. A test-only Admin SDK instance addressing the same fixed emulator project reads that same `uid`.
4. The trusted Admin boundary can set `disabled: true`.
5. After sign-out, a new client password sign-in fails closed with `auth/user-disabled` while that provider account is disabled.
6. The trusted Admin boundary can set `disabled: false`.
7. A new sign-in succeeds and returns the exact same `uid` / `accountId`.
8. Re-enable creates no new Local Profile, Save, device, rivalry membership or manager ownership.
9. `revokeRefreshTokens(uid)` routes only through the emulator trusted Admin boundary without deliberate raw client bearer-token retrieval or persistence.
10. Refresh-token revocation does not create a new provider identity and remains distinct from provider disablement.

Provider disablement is an authentication lifecycle operation. It is not itself Career Mode Showdown entitlement mutation.

## Application-account lifecycle remains a separate authorization layer

Provider authentication and application authorization remain deliberately separate.

`firestore.rules` uses the authenticated provider principal plus current application account metadata. Connected rivalry reads require the application account document to be active.

Stage 2B permanently proves:

1. an authenticated and provider-enabled user whose application account status is `disabled` cannot read the private rivalry;
2. provider re-enable alone does not rewrite application account metadata or restore connected rivalry authorization;
3. only a separately trusted emulator-only application-lifecycle transition back to `active` restores the same account's existing entitlement;
4. no application client may perform that application-lifecycle transition.

Application account status remains the immediate fail-closed boundary for connected Firestore authorization while provider authentication lifecycle remains separate.

Do not assume provider-side token revocation alone instantly invalidates every already-issued ID token at every consumer.

## Refresh-token revocation limitation

The completed test calls `revokeRefreshTokens(uid)` only against the Authentication Emulator.

The proof deliberately does not call `getIdToken()`, `getIdTokenResult()` or `verifyIdToken()` merely to manufacture a stronger emulator claim, and it does not write a refresh token or ID token to Firestore, canonical local storage, fixtures, logs, URLs or repository files.

The Local Authentication Emulator is a development approximation. Stage 2B does not claim production proof of every in-flight token invalidation timing detail or backend `checkRevoked` behavior. Final production trusted token verification/revocation remains a later Stage 2 operational gate.

## Permanent Firestore write gate

Every application-client Firestore create/update/delete remains denied.

The Phase 1F security finding remains binding: the protected shared-state document does not expose the idempotency-key hash required for Security Rules to identify the matching sibling idempotency receipt for one atomic shared-state mutation.

A modified browser client can bypass a helper. Therefore a correct client transaction helper is not a security boundary.

A future production implementation still requires either a separately authorized trusted mutation gateway or a separately reviewed schema/protocol change that makes every invariant provider-enforceable.

Stage 2B does not authorize Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing.

## Identity and two-owner locks

Firebase Auth `uid` is architecture `accountId`.

It is not `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` or a display label.

Exactly two stable manager slots remain authoritative.

A disabled provider account or disabled application account does not relinquish entitlement, consent to rivalry deletion, transfer ownership or grant the surviving account unrestricted sole mutation authority.

Provider re-enable restores only the same provider identity. Current application account state, rivalry entitlement, device state and later session authority must still be independently rechecked.

## Local recovery and production isolation locks

Canonical local storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot/preconditions, last-moment guards, transaction-owned mutation, ownership-scoped rollback, anti-clobber and exact verification.

No Auth/Admin/cloud module may directly own canonical `localStorage`.

Production package/application/runtime remains v1.4.0 / `1.4.0-r1` because Stage 2B changed only authority documentation, permanent tests and CI-only emulator tooling.

## Public/private product lock

Public profiles, public search/discovery, matchmaking, community systems and global leaderboard/rankings remain eliminated.

Private Remote Joining remains private and dependency-gated.

Registered devices/private pairing remain blocked until the entire Stage 2 identity/authentication/authorization layer is proven. Connected Rivalry and Private Remote Joining remain later blocked stages.

## Completion evidence

PR #84 exact validated head:

`d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`

All 13 normal workflow families passed on that exact unchanged head.

Submitted reviews: 0.

Inline review threads: 0.

The PR was mergeable and squash merged with expected-head protection to:

`c4feadb69fb5e26eba19fa520afa0a09baf1de03`

The live main was independently verified after merge.

No tests, timeout limits, Candidate C guarantees, Firestore Security Rules, workflow topology or performance ceilings were weakened.

## Current successor boundary

Stage 2B is DONE / MERGED / PROVEN through PR #84.

The current bounded prerequisite is Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary, defined in `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`.

Stage 2C remains policy-only and production Firebase remains disconnected. It must not be confused with production account onboarding or Stage 3 pairing.
