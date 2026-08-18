# Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary

Status: IMPLEMENTED BOUNDED CANDIDATE / PR #83 VALIDATION AND MERGE GATE
Effective: 2026-08-18 ET
Production application: v1.4.0 / `1.4.0-r1`
Production Firebase runtime: NOT CONNECTED
Production accounts: NOT CREATED
Production Firestore writes: DENIED
Pairing / Connected Rivalry / Remote Joining: NOT AUTHORIZED

## Purpose

Stage 2A is the smallest private account/authentication prerequisite after Cloud/Sync Readiness Phase 1F. It proves the real Firebase Authentication identity and session-lifecycle boundary inside the existing fixed demo-project Emulator Suite before any production account UI, production Firebase project, registered-device pairing, Connected Rivalry synchronization or Remote Joining runtime is allowed to exist.

The proof establishes that Firebase Auth `uid` is the only provider-authenticated source for architecture-level `accountId`, while every Local Profile and gameplay identity remains separate.

Stage 2A remains deliberately emulator-only. It does not make Career Mode Showdown a connected production application.

## Inherited completed boundary

Cloud/Sync Readiness Phase 1F is DONE / MERGED / PROTECTED through PR #81.

Exact validated PR #81 head:

`0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`

Squash merge / live-main completion boundary:

`231556d86a93535fa90e173577c1159de4f40be0`

Phase 1F permanently keeps every application-client Firestore write denied. Stage 2A does not weaken that rule.

The Phase 1D shared-state document still does not expose the idempotency-key hash needed for Security Rules to identify the matching sibling replay receipt. A trusted production mutation gateway or separately reviewed schema/protocol change therefore remains a later, independent gate.

## Implemented PR #83 candidate

PR #83 adds only the bounded emulator proof authorized here:

1. `firebase.json` adds the Firebase Authentication Emulator at `127.0.0.1:9099` beside the existing Firestore Emulator at `127.0.0.1:8080` under the same fixed demo project.
2. `tests/firebase/private-account-auth-stage2a-emulator.cjs` creates two synthetic Firebase Auth users through the real Web SDK, uses explicit in-memory Auth persistence, connects the same client applications to the Firestore Emulator and exercises the existing Firestore Security Rules with the provider-issued Auth principal.
3. The proof verifies distinct stable Firebase `uid` values, `uid` as architecture `accountId`, strict namespace separation, self/private reads, wrong-account denial, unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, application-account lifecycle separation and provider identity over client-supplied identity.
4. Application-client Firestore create, update and delete remain denied. The existing Phase 1F emulator proof runs in the same Auth + Firestore emulator process and must remain green.
5. Synthetic passwords are generated only inside the isolated test process. The proof never requests raw ID tokens or refresh tokens and never writes credentials into application Firestore data, repository fixtures, URLs, analytics or canonical browser storage.
6. `tests/contracts/private-account-auth-stage2a-contracts.cjs` permanently protects emulator configuration, identity behavior, credential non-persistence, production isolation and unchanged application version.
7. `.github/workflows/validate-static-app.yml` installs the pinned Firebase test toolchain with `--no-save --package-lock=false` and runs Phase 1F plus Stage 2A together. No Firebase package is added to the production dependency graph.

The first PR #83 validation attempt exposed one static-contract matcher defect before emulator execution. The matcher incorrectly required a literal `status: "disabled"` even though the proof correctly passes `"disabled"` through the account-envelope helper. The contract was corrected to assert the real disabled-account transition. No runtime behavior, Security Rule, timeout, recovery guarantee or performance ceiling was weakened.

On corrected technical head `1420d8ffec9e689f1b3973021517713c446c85a0`, the Static App workflow proved the complete 37-file repository contract suite, both Firebase emulators, the preserved Phase 1F proof, the real Stage 2A Auth/Firestore proof and the protected 13-workflow / 27-executable-block topology. Final Stage 2A completion still requires the exact final PR head to be fully green, review/thread state to be clean, the head to remain unchanged, the PR to be mergeable, expected-head squash merge to succeed and live `main` to be independently verified.

Merging PR #83 completes only Stage 2A. It does not automatically authorize another Stage 2 prerequisite. Current source plus a fresh Work Environment Continuity assessment must select the next smallest Stage 2 gate before new implementation begins.

## Provider and emulator boundary

Stage 2A continues using the single fixed demo project:

`demo-career-mode-showdown-phase1f`

The Firebase Authentication Emulator uses localhost port `9099`. Firestore remains on localhost port `8080`.

The same project ID is used by Auth, Firestore and the Firebase CLI so cross-service Security Rules evaluation observes the authenticated emulator identity correctly.

No real Firebase project, production credential, service account, Admin credential or production user data is required.

The Firebase Web SDK remains a CI/test-only dependency for this stage. It is not added to `package.json`, `package-lock.json`, `index.html`, `js/optionalModules.js` or `service-worker.js`.

## Exact identity contract

The following namespaces remain permanently distinct:

- `accountId`: Firebase Auth `uid` supplied by authenticated provider context;
- `profileId`: stable `profile_*` Local Profile identity;
- `saveId`: stable `save_*` identity;
- `seasonId`: stable Season identity;
- `deviceId`: future revocable registered-device attribution metadata, never authentication;
- `installationId`: installation metadata, never authentication;
- `rivalryId`: opaque private Connected Rivalry identity;
- `sessionId`: opaque private session identity;
- display labels: presentation only.

A client-supplied `accountId`, display name, Local Profile label, `deviceId` or installation identifier never authenticates an actor.

Same visible names never establish account/profile linkage. Unresolved historical Local Profile identity remains unresolved until explicit stable-ID mapping exists.

## Test-only authentication mechanism

Stage 2A uses synthetic email/password users inside the Authentication Emulator because the Web SDK and emulator directly support that flow. This is a test mechanism only and does not select the eventual production sign-in UX or provider mix.

The test initializes Auth with non-persistent in-memory state and connects it explicitly to `http://127.0.0.1:9099` before account operations.

No password, raw ID token, refresh token or other bearer credential may be written to:

- Firestore application documents;
- canonical browser storage;
- repository fixtures;
- logs or analytics;
- URLs.

Synthetic test credentials may exist only in the isolated emulator test process and must not be production credentials.

## Required Stage 2A proof

One bounded implementation must permanently prove at least:

1. Auth and Firestore emulators run under the same fixed demo project identity.
2. Two distinct synthetic authenticated users receive distinct stable Firebase `uid` values.
3. `uid` is treated as `accountId` and remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and display labels.
4. A real Auth Emulator session can make an authorized Firestore exact read only when the existing Phase 1F Security Rules authorize that `request.auth.uid`.
5. A different authenticated account cannot read another account's self-scoped metadata.
6. An unauthenticated client cannot read protected application data.
7. Signing out removes authenticated Firestore access for subsequent client operations.
8. App account lifecycle metadata remains a separate authorization layer: an authenticated provider principal whose app account status is not active cannot gain rivalry authority merely by possessing a valid Auth session.
9. Client-supplied account identity fields never override the provider principal.
10. Every application-client Firestore create, update and delete remains denied.
11. No raw password, ID token or refresh token is persisted into application Firestore data, canonical local storage, repository fixtures or logs.
12. Auth test state uses in-memory persistence only; Stage 2A does not commit the production product to long-lived browser token persistence.
13. Synthetic account creation/deletion/sign-out failure paths are explicit and leave no fabricated authenticated application state.
14. Local-only Career Mode Showdown operation remains available when the Auth/remote layer is absent or disabled.
15. Candidate A export remains non-mutating, Candidate B remains read-only and Candidate C remains the sole destructive import Apply authority.
16. Production package/application/runtime identity remains v1.4.0 / `1.4.0-r1` because Stage 2A is emulator/test-only.
17. Public discovery, public profiles, matchmaking, community systems and global leaderboard/rankings remain eliminated.

## Deliberately deferred Stage 2 requirements

Stage 2A does not claim the whole Private Account / Authentication / Authorization stage is complete.

The following remain later bounded Stage 2 work after Stage 2A is proven:

- production Firebase project creation and region/operational selection;
- production account/signup/login UX;
- production persistence choice for Auth state;
- production provider-level disable/revocation/token-refresh guarantees;
- safe application account bootstrap/write lifecycle;
- account export and full provider-aware deletion cascade;
- abuse/rate controls for production authentication endpoints;
- production Security Rules deployment;
- trusted mutation gateway or protocol/schema decision for remote writes.

Do not collapse these into Stage 2A merely because the Auth Emulator is available.

## Permanent exclusions

Stage 2A does not authorize:

- production Firebase SDK/runtime in the GitHub Pages shell;
- real production Firebase users;
- production Firestore data;
- deployed production Security Rules;
- any application-client Firestore write;
- Cloud Functions;
- Firebase Admin SDK production runtime;
- service-account credentials;
- Blaze billing;
- registered-device product UI;
- pairing or invite product UX;
- private-session product runtime;
- Connected Rivalry runtime;
- Remote Joining runtime or UX;
- Private Cloud Backup;
- public profiles, discovery, matchmaking, community systems or global rankings.

## Local recovery and storage locks

Canonical local storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth key.

No Auth or cloud module may directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply authority with strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped rollback, anti-clobber checks and exact verification.

## Validation and version boundary

Stage 2A is test/emulator infrastructure only. Under `VERSIONING_POLICY.md`, it consumes no visible application version by itself.

The Stage 2A candidate preserves all 14 permanent workflow families, all 27 protected executable workflow blocks, Candidate C recovery guarantees, existing timeout ceilings and performance ceilings.

No test, timeout, recovery guarantee or performance ceiling may be weakened merely to obtain green CI.

## Exit gate

Stage 2A is complete only when:

1. the permanent Stage 2A contract and real Auth/Firestore Emulator proof pass;
2. the proof uses only the fixed demo project and synthetic users;
3. exact Auth `uid` to `accountId` behavior is proven through real cross-service Security Rules evaluation;
4. sign-out, unauthenticated and wrong-account denial paths are proven;
5. app-level inactive account status still denies connected authority;
6. all application-client Firestore writes remain denied;
7. no production runtime/package/service-worker dependency changes exist;
8. all complete repository contracts and required workflow families pass on the exact unchanged PR head;
9. review/thread state is clean and the PR is mergeable;
10. live `main` is independently verified after merge.

Only after that proof may the next smallest Stage 2 prerequisite be selected from current source. Registered devices/private pairing remain Stage 3 and may not begin while Stage 2 identity/authentication/authorization remains incomplete.

## Historical pre-implementation provenance

The phrase `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED` describes the source boundary inherited before PR #83 began. It is retained only as historical provenance and is not the current status of Stage 2A.

## Primary Firebase references checked for this boundary

- Authentication Emulator: `https://firebase.google.com/docs/emulator-suite/connect_auth`
- Emulator installation/configuration: `https://firebase.google.com/docs/emulator-suite/install_and_configure`
- Firebase Auth Web API: `https://firebase.google.com/docs/reference/js/auth`
- Authentication state persistence: `https://firebase.google.com/docs/auth/web/auth-state-persistence`
- Manage Web users: `https://firebase.google.com/docs/auth/web/manage-users`
- Firestore Security Rules emulator testing: `https://firebase.google.com/docs/firestore/security/test-rules-emulator`
