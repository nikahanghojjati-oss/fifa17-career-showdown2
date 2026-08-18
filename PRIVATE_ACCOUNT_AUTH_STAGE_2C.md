# Private Account / Authentication Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary

Status: DONE / MERGED / PROVEN / POLICY-ONLY / PRODUCTION FIREBASE DISCONNECTED

Effective date: 2026-08-18 ET
Completion: PR #85, exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`, squash merge / verified live-main boundary `22566e1409cf53d728b38d0b5a19de478ae6761b`.

Production application remains:

- application `v1.4.0 — Product Deepening`
- package `1.4.0`
- runtime `1.4.0-r1`
- previous known-good whole shell `1.3.0-r2`

Stage 2C changes no production application runtime and therefore requires no semantic application version bump.

## 1. Why Stage 2C exists

Stage 2A proved the real Firebase Auth Emulator identity boundary. Stage 2B proved the emulator/test-only provider session lifecycle and revocation boundary. Neither stage selected a production sign-in provider, production Auth persistence policy or a browser-hosting-compatible OAuth flow.

Those decisions had to be explicit before any real Firebase project, production user, account UI or connected runtime exists.

Stage 2C is therefore a completed policy and compatibility prerequisite only. It does not connect Firebase in production.

## 2. Source-grounded provider decision

Current Firebase security guidance recommends managed OAuth 2.0 / OpenID Connect providers when feasible. For the first private connected Career Mode Showdown account surface, the initial production provider is:

`GoogleAuthProvider` / Google federated sign-in only.

The initial production provider set does not include Email/Password, email-link, anonymous, phone, Facebook, GitHub, Apple or custom authentication.

Adding another provider later requires a separate source-grounded Stage 2 decision because provider linking, credential recovery, account collision and abuse behavior can change the identity/security boundary.

The Stage 2A/2B synthetic Email/Password users remain a Local Authentication Emulator test mechanism only. They never selected Email/Password for production.

## 3. Static GitHub Pages sign-in flow

The current production host is static GitHub Pages.

For that topology, the initial Google flow is:

`signInWithPopup()` from an explicit user gesture.

`signInWithRedirect()` is NOT authorized on the current host.

Current Firebase documentation explains that redirect sign-in relies on cross-origin Auth helper storage and requires one of the documented hosting/domain workarounds on browsers that block third-party storage. The current GitHub Pages topology has no reviewed reverse proxy, Firebase Hosting custom Auth domain or equivalent same-origin helper boundary.

Therefore Stage 2C deliberately chooses popup rather than pretending redirect is universally safe on the current static host.

If popup behavior later proves unacceptable on a required mobile/PWA platform, the project must first complete a separately reviewed auth-domain/hosting compatibility prerequisite before redirect is enabled.

No code may silently fall back from popup to redirect.

## 4. OAuth scope and provider-token minimization

Career Mode Showdown needs Firebase identity, not access to Google APIs.

The initial provider flow must:

- request no additional Google OAuth scopes;
- not request Contacts, Drive, Calendar or other Google API access;
- not call provider-token extraction merely because the Firebase sample demonstrates it;
- not deliberately retrieve, log, persist, transmit or place the Google OAuth access token into application state;
- not place provider credentials into `localStorage`, `sessionStorage`, IndexedDB, URL parameters, diagnostics or error telemetry.

The provider is an authentication mechanism only.

## 5. Production Firebase Auth persistence decision

Firebase Web Auth defaults to durable local persistence when no explicit persistence is selected. Career Mode Showdown must not inherit that default accidentally.

The initial production connected-account policy is explicit:

`browserSessionPersistence`

The Auth instance must set session persistence before the sign-in attempt.

This means Firebase Auth state is scoped to the current browser/PWA session and is cleared when the authenticated window/session closes. It avoids an implicit indefinitely persistent signed-in state before Stage 3 registered-device attribution/revocation exists.

`browserLocalPersistence` is NOT authorized for the initial connected product.

`inMemoryPersistence` remains the explicit Stage 2A/2B emulator-test choice and is not the selected production UX policy.

A later remembered-device capability may reconsider durable Auth persistence only after the registered-device security model is proven and separately authorized.

Auth persistence is not Firestore offline persistence. Persistent Firestore cache remains disabled under the Phase 1B/1F project-owned synchronization contract.

## 6. Firebase-managed session state is not canonical Career Mode storage

Firebase SDK-managed Auth state is provider/session infrastructure. It is not a fourth Career Mode Showdown canonical storage key and never grants storage ownership to an Auth/cloud module.

Canonical application browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

No Auth module may directly own canonical `localStorage`.

The application must not manually persist raw Firebase ID tokens, refresh tokens, Google OAuth access tokens or passwords in any canonical or auxiliary browser-storage key.

## 7. Identity lock

After successful Firebase authentication:

`request.auth.uid = authenticated accountId`

The Firebase `uid` remains architecture `accountId`.

It is never interchangeable with:

- `profileId`
- `saveId`
- `seasonId`
- `deviceId`
- `installationId`
- `rivalryId`
- `sessionId`
- display name
- email address
- provider photo URL

Google display name, email and photo are provider/presentation data only. They must never auto-link a Local Profile, claim a Save, establish manager-slot ownership, identify a device or transfer rivalry entitlement.

Equal email-like labels or visible names never establish gameplay identity.

## 8. Authorization remains separate from authentication

A successful Google sign-in establishes only provider identity.

Connected application authorization still requires the separate application account status and current rivalry entitlement gates proven in Stage 2A/2B and protected by `firestore.rules`.

A provider-authenticated account whose application account status is not active remains denied private rivalry access.

Provider sign-in success, provider re-enable, provider profile data or provider session persistence never rewrites application-account metadata and never restores gameplay entitlement by themselves.

Every application-client Firestore create/update/delete remains denied.

## 9. Sign-out and failure behavior

Explicit sign-out must call the Firebase Auth sign-out boundary and clear authenticated connected state.

Closing the authenticated browser/PWA session must not leave an application-authenticated state that the application fabricates independently of Firebase Auth.

Popup cancellation, popup blocking, provider errors, network failure or missing Firebase configuration must fail closed:

- no fabricated `accountId`;
- no Local Profile auto-link;
- no connected rivalry authorization;
- local-only Career Mode remains usable where it is already designed to remain local-only.

## 10. Production revocation limitation remains explicit

Stage 2B proved the emulator lifecycle boundary but not every production in-flight ID-token invalidation timing detail.

Current Firebase documentation states that production revocation checking of already issued ID tokens requires trusted verification such as Admin SDK `verifyIdToken(..., checkRevoked=true)` or an equivalent provider-enforceable design.

That trusted production verification boundary is NOT implemented or authorized by Stage 2C.

Stage 2C must not imply that popup sign-in or session persistence solves backend token verification/revocation.

Application account status remains the current immediate fail-closed Firestore connected-authorization layer until a later trusted production verification boundary is separately selected and proven.

## 11. Production project and account creation remain blocked

Stage 2C does NOT create or enable:

- a production Firebase project;
- a production Firebase web-app registration;
- a production Auth provider configuration;
- a production authorized-domain entry;
- a production Firebase SDK dependency in the GitHub Pages shell;
- production account/signup/login UI;
- real production Firebase users;
- production Firestore data;
- deployed production Security Rules;
- a production Admin SDK runtime;
- service-account credentials;
- Cloud Functions;
- Blaze billing or paid infrastructure.

Those remain later Stage 2 operational/security decisions.

## 12. Direct Firestore client-write prohibition remains permanent until separately resolved

Stage 2C does not alter the Phase 1F finding.

Every application-client Firestore write remains denied.

The Phase 1D mutation contract requires authoritative shared-state mutation and the matching idempotency receipt to form one logical atomic operation. The protected shared-state document does not expose the idempotency-key hash needed for Firestore Security Rules to determine which sibling `idempotency/{idempotencyKeyHash}` receipt must accompany a direct state write.

A correct client helper is not a security boundary because a modified client could bypass it.

A later production implementation still needs either:

1. a separately authorized trusted mutation gateway; or
2. a separately reviewed schema/protocol change that makes every invariant provider-enforceable.

## 13. Recovery and local-only locks

Candidate A remains non-mutating export.

Candidate B remains read-only analysis.

Candidate C remains the sole destructive import Apply authority, preserving strict exact raw snapshot/precondition authority, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

Auth/cloud code must not bypass Candidate C or directly mutate canonical application storage.

## 14. Two-owner governance remains unchanged

Exactly two stable manager slots remain authoritative.

Authentication does not imply ownership transfer.

A disabled account does not count as leaving.

A surviving account does not silently gain unrestricted sole shared-mutation authority.

Account deletion, relationship revocation and incomplete shared deletion consent retain the Phase 1D/1C governance locks.

## 15. Public feature prohibition

Public community features and global leaderboard/rankings are **ELIMINATED**.

Stage 2C must not introduce or prepare:

- public profiles;
- public player/account search;
- public discovery;
- matchmaking;
- public invitation directories;
- global rankings;
- community feeds.

Private Remote Joining remains private.

## 16. Downstream gates remain blocked

Registered Devices / Private Pairing remains Stage 3 and is BLOCKED until the entire Stage 2 account/authentication/authorization layer is proven.

Connected Rivalry remains Stage 4 and is BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## 17. Stage 2C proof contract

The Stage 2C repository contract permanently proves that current source preserves all of the following:

1. Stage 2B is DONE / MERGED / PROVEN through PR #84;
2. Stage 2C is DONE / MERGED / PROVEN through PR #85 from exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a` to squash merge `22566e1409cf53d728b38d0b5a19de478ae6761b`;
3. the initial production provider decision is Google federated sign-in only;
4. popup is the selected current static-host flow;
5. redirect is explicitly blocked until a separately reviewed hosting/auth-domain compatibility boundary exists;
6. production Auth persistence is explicitly `browserSessionPersistence` rather than implicit default local persistence;
7. no extra Google OAuth scopes or provider access-token storage is authorized;
8. Firebase `uid` remains architecture `accountId` and all application/game identity namespaces remain separate;
9. application account status/entitlement authorization remains separate from provider authentication;
10. every application-client Firestore write remains denied;
11. production Firebase remains disconnected and package/runtime identity remains v1.4.0 / `1.4.0-r1`;
12. Firebase Admin remains absent from the production dependency graph;
13. Candidate A/B/C, canonical local storage and two-owner governance remain protected;
14. public/community/rankings remain eliminated;
15. Stage 3, Connected Rivalry and Private Remote Joining remain blocked behind the dependency chain.

## 18. Completion boundary

Stage 2C is complete. PR #85 was validated on one exact unchanged head, merged, and independently reconciled to live `main`.

Completion does not authorize production Firebase setup, account UI, production user onboarding, trusted mutation infrastructure, Stage 3 pairing, Connected Rivalry or Private Remote Joining.

The next legal action is a fresh WEC assessment and source-grounded selection of only the next smallest remaining Stage 2 prerequisite. No later Stage 2 implementation is authorized merely by this completed policy.
