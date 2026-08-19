# Private Account / Authentication Stage 2I — Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary

## SUCCESSOR COMPLETION OVERRIDE — 2026-08-19 ET

Status: DONE / MERGED / PROVEN / PRODUCTION DORMANT / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

PR #95 `Private Auth Stage 2I app attestation request boundary` is DONE / MERGED / PROVEN. Exact validated final head: `9a553318791d40afa8c573acf4922ee710284ef2`. Squash merge / independently verified live-main boundary: `264e53dd56e088262c2f17fc10e36617dfef6c5d`. All 13 normal pull-request workflow families succeeded on that exact unchanged head; submitted reviews and inline review threads were both empty. GitHub marks the merge commit verified and its sole parent is prior main `faec8273e8ee4b80fa56b4fd5317d36c7d5e3bdb`.

The dormant implementation remains `js/trustedAppAttestationRequest.js`. Permanent executable proof remains `tests/contracts/private-account-auth-stage2i-contracts.cjs` plus `tests/contracts/private-account-auth-stage2i-boundary-contracts.cjs`. Do not repeat Stage 2I implementation.

For every future protected non-preflight browser request, the permanent trust order remains: Stage 2H production-origin defense in depth; transient `X-Firebase-AppCheck`; trusted Firebase Admin App Check verification; normalize the official `VerifyAppCheckTokenResponse.token` wrapper or the explicitly injected direct decoded-claims adapter; require exact decoded `app_id` / `sub` equality to the expected production Career Mode Showdown Firebase Web App; require exactly two audience entries matching the production Firebase project number and project ID; only then invoke the Stage 2F equivalent of `verifyIdToken(idToken, true)`; derive architecture `accountId` only from verified Firebase UID; evaluate operation-specific Career Mode Showdown authorization; only then execute an explicitly reviewed trusted operation under Stage 2H least-privilege IAM.

The Stage 2H runtime permission set remains exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

Optional App Check limited-use token consumption remains separate beta hardening. `firebaseappcheck.appCheckTokens.verify` / `roles/firebaseappcheck.tokenVerifier` is not part of the Stage 2H four-permission role and is not a correctness dependency for the current account-bootstrap path.

Production remains application/package `1.4.0` and Installable Offline App runtime `1.4.0-r1`; previous whole shell remains `1.3.0-r2`. No production Firebase project, Firebase Web App, reCAPTCHA Enterprise key, App Check registration/enforcement, Cloud Run service, service account, IAM binding/custom role, billing commitment, production user/data/provider configuration or production Security Rules deployment is authorized or connected by this closure. Every application-client Firestore create/update/delete remains denied.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. Candidate A remains non-mutating export, Candidate B remains read-only import analysis, and Candidate C remains the sole destructive import Apply authority with all exact-snapshot, precondition, transaction, rollback, anti-clobber, verification and corrupt-byte-preservation guarantees. Firebase Auth `uid` remains architecture `accountId` and remains distinct from every profile/save/season/device/installation/rivalry/session/invite identity. Exactly two manager slots remain authoritative. Public discovery, public profiles, public matchmaking, public invitation directories, community systems, global leaderboards and public rankings remain eliminated.

The complete Private Account / Authentication / Authorization Stage 2 lane remains incomplete. Later Stage 2 prerequisites remain dependency-gated and are not preselected by roadmap order. This closure selects no new Stage 2 implementation prerequisite. Stage 3 Registered Devices / Private Pairing remains BLOCKED until the entire Stage 2 lane is DONE / MERGED / PROVEN; Stage 4 Connected Rivalry and Stage 5 Private Remote Joining remain downstream and blocked.

The retained implementation-era body below is historical/proven provenance and no longer overrides this completion section.

---

# Private Account / Authentication Stage 2I — Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary

Status: CURRENT IMPLEMENTATION PREREQUISITE / DORMANT PROOF IMPLEMENTED / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED / EXACT-HEAD COMPLETION GATE PENDING

Effective: 2026-08-19 ET

Starting verified live-main boundary: `f85d692384cba0b343a9634a5a7b1d56f0b0cc4b` after Stage 2H PR #93.

Stage 2I implementation successor starting live main: `faec8273e8ee4b80fa56b4fd5317d36c7d5e3bdb` after PR #94 authorized this implementation prerequisite.

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

## Current implementation activation

PR #94 authorized Stage 2I but deliberately did not implement it. Fresh successor environment `we-2026-08-19-stage2i-app-attestation` independently verified PR #94 and live `main`, initialized a fresh WEC record, rechecked current primary Firebase App Check / reCAPTCHA Enterprise / custom-backend documentation and received a fresh `CONTINUE` assessment before beginning implementation.

The dormant implementation proof is:

`js/trustedAppAttestationRequest.js`

Permanent implementation contracts are:

`tests/contracts/private-account-auth-stage2i-contracts.cjs`

The dormant module is not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`. It imports no Firebase production SDK, performs no network request, creates no Firebase/App Check/reCAPTCHA/Cloud Run/IAM resource and changes no shipped application behavior.

The implementation requires the future trusted server adapter to supply the exact configured production Web App ID, project number and project ID at deployment time. Stage 2I does not invent those production identities before the production Firebase environment exists.

The executable proof enforces this order for protected non-preflight requests:

1. exact Stage 2H browser origin defense;
2. transient `X-Firebase-AppCheck` token presence;
3. injected trusted App Check verification with no limited-use token consumption enabled by default;
4. exact decoded `app_id` / `sub` equality to the configured Web App ID;
5. exact decoded `aud[0]` project-number and `aud[1]` project-ID match;
6. Stage 2F revocation-aware Firebase ID-token authentication;
7. separate operation-specific Career Mode Showdown application authorization;
8. only then the injected trusted operation adapter.

App Check and Firebase ID tokens are never forwarded to the application-authorization or trusted-operation adapters. The boundary additionally rejects payloads that contain reserved authentication/attestation fields or the actual transient bearer values so Stage 2G/trusted transaction payloads cannot accidentally inherit either credential.

`OPTIONS` preflight returns only the bounded preflight decision and executes no protected verifier, authorization or trusted operation.

This implementation remains a proof boundary until the complete exact-head PR gate, clean review/thread state, expected-head merge and independent live-main verification are complete. Stage 2I must not be classified DONE / MERGED / PROVEN before those publication conditions are satisfied.

## Why Stage 2I is next

Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary — is DONE / MERGED / PROVEN through PR #93.

Exact validated PR #93 head:

`98f28f71fa6977502333535a9865ab446effde65`

Squash merge / independently verified live-main completion boundary:

`f85d692384cba0b343a9634a5a7b1d56f0b0cc4b`

All 13 normal pull-request workflow families succeeded on the exact unchanged final PR #93 head. Submitted reviews and inline review threads were empty.

Stage 2H permanently selects the future trusted execution topology: one dedicated same-project Google Cloud Run HTTPS service, one dedicated user-managed service account, Application Default Credentials, separate Career Mode Showdown application authorization and the exact four-permission runtime custom role currently required by Stage 2F plus Stage 2G account bootstrap:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

That trust-hosting policy still leaves one important pre-provisioning gap. A browser-reachable Cloud Run endpoint can receive traffic from scripts and impersonating clients even when Firebase Authentication later rejects the caller. Firebase App Check is the provider-supported application-attestation layer for Firebase products and custom backends, including a custom HTTPS backend. It complements Firebase Authentication and authorization rather than replacing either one.

Stage 2I therefore defines and proves only the production app-attestation and endpoint abuse-resistance policy before any production Firebase, App Check, Cloud Run, IAM or billing resource is provisioned.

It does not create live infrastructure, connect the website to Firebase, add a production account UI, authorize shared-state mutation, begin device registration or begin pairing.

## Primary provider references reviewed

Current primary documentation reviewed on 2026-08-19 ET:

- `https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider`
- `https://firebase.google.com/docs/app-check/web/custom-resource`
- `https://firebase.google.com/docs/app-check/custom-resource-backend`
- `https://firebase.google.com/docs/app-check/enable-enforcement`
- `https://firebase.google.com/docs/app-check/monitor-metrics`
- `https://firebase.google.com/docs/reference/admin/node/firebase-admin.app-check.decodedappchecktoken`
- `https://cloud.google.com/iam/docs/roles-permissions/firebaseappcheck`
- `https://cloud.google.com/run/docs/configuring/max-instances`
- `https://cloud.google.com/run/docs/about-concurrency`

Current provider documentation must be rechecked when any production provisioning later begins.

The implementation recheck confirmed that the Firebase Admin decoded App Check token exposes `app_id` from the token subject and that `aud` contains the project number and project ID. Stage 2I therefore permanently proves exact Web App identity plus exact project audience matching after trusted Admin verification rather than accepting any registered application in the project.

## Selected web attestation provider

For the current browser-only GitHub Pages application, Stage 2I selects Firebase App Check with the built-in reCAPTCHA Enterprise provider for the future production web app.

Reasons:

1. Firebase currently recommends reCAPTCHA Enterprise for new web App Check integrations.
2. It is designed for score-based invisible web attestation rather than an interactive checkbox challenge.
3. It can protect Firebase services and can supply App Check tokens for a custom backend.
4. It lets the project monitor attestation quality before enforcement and tune the risk threshold deliberately.

The initial policy keeps the provider-documented default risk threshold of `0.5` and default token TTL of one hour unless a later measured production review proves a different value is safer. Shorter TTLs increase attestation frequency, latency and quota/cost pressure; longer TTLs increase the useful lifetime of a leaked token.

The production reCAPTCHA Enterprise web key must be scoped only to the real production web domain plan. `localhost` must not be added to the production key.

Debug App Check providers/tokens belong only to explicit development, emulator or CI environments. No production debug token may be committed, logged, bundled, stored in canonical browser storage or treated as a production bypass.

## App Check is not authentication or application authorization

A valid App Check token proves only that the request came from an attested instance of an application registered to the expected Firebase project/app boundary.

It does not prove:

- which human account is making the request;
- ownership of a Firebase Auth UID;
- Career Mode Showdown account status;
- device registration;
- rivalry entitlement;
- invite/session membership;
- shared-state mutation authority;
- gameplay authority.

The trusted request still requires Stage 2F revocation-aware Firebase ID-token verification and a separate current Career Mode Showdown application-authorization decision.

CORS, origin checks, App Check, Firebase Authentication, Career Mode Showdown authorization and Google Cloud IAM remain distinct gates. None substitutes for another.

## Exact future protected-request order

For every protected non-preflight browser request to the future trusted Cloud Run service, the required order is:

1. Browser protocol `OPTIONS` handling may answer a valid CORS preflight without performing any protected application operation or exposing protected data.
2. Enforce the Stage 2H production-origin allowlist as defense in depth. Origin alone grants no authority.
3. Require one transient App Check token in the `X-Firebase-AppCheck` header. Do not accept the token in a URL, query parameter or request body field used as authority.
4. Verify the App Check token through the trusted Firebase Admin App Check verifier.
5. Require the decoded App Check `app_id` / subject to match the single expected registered production Career Mode Showdown Firebase Web App identity. A valid token for another registered app is not sufficient for this web endpoint.
6. Require the decoded token audience/project identity to remain consistent with the selected production Firebase project.
7. Only after App Check succeeds, pass the separate transient Firebase ID token to the Stage 2F verifier, which requires the equivalent of `verifyIdToken(idToken, true)`.
8. Derive architecture `accountId` only from the verified Firebase UID.
9. Evaluate current Career Mode Showdown operation-specific application authorization.
10. Only after all prior gates pass may an explicitly reviewed trusted operation adapter execute under the Stage 2H least-privilege service identity.

This order rejects non-attested traffic before the more expensive revocation-aware user-verification/provider work and before any application or Firestore operation.

A later implementation may reorder only purely local parsing/format checks ahead of App Check when that reduces attack surface without granting authority. It may not execute privileged provider work before the required attestation/authentication/authorization gates.

## Token handling boundary

The App Check token is transient bearer-like application-attestation material.

It must not be:

- written to `localStorage`, `sessionStorage` or IndexedDB as application-owned state;
- stored in Firestore;
- copied into security-event documents;
- placed in URL/query parameters;
- printed into logs, analytics, diagnostics, CI output or exception reflection;
- forwarded into Stage 2G account transaction data;
- reused as Firebase Authentication or Career Mode Showdown account identity.

The trusted service returns only bounded error codes. It does not reflect raw App Check token material or arbitrary provider verification diagnostics to the caller.

## Fail-closed attestation outcomes

Protected operations fail closed and perform no privileged application operation when:

- the App Check header is absent;
- the App Check token is malformed;
- verification fails;
- the token is expired;
- the trusted verifier is unavailable;
- the decoded token has no usable Firebase App identity;
- the decoded app identity is not the exact expected production Career Mode Showdown Web App;
- project/audience identity conflicts with the configured production project;
- a provider failure is unknown or unclassified.

Successful App Check verification still grants zero user identity and zero Career Mode Showdown operation authority by itself.

## Firebase-service enforcement direction

When the first production-connected account release is prepared, App Check must be initialized before the application uses Firebase services.

The future production rollout must monitor App Check metrics before switching an already-used Firebase product from unenforced monitoring to enforcement. Because Career Mode Showdown currently has no production Firebase-connected account release, the preferred launch direction is to avoid intentionally shipping an unprotected production account surface and to enable App Check enforcement for the Firebase services actually exposed to the web client as part of the same controlled production launch gate once legitimate-client verification has been proven.

At minimum, the later production gate must explicitly review App Check enforcement for:

- Firebase Authentication;
- Cloud Firestore browser reads used by the connected account experience;
- the custom Cloud Run backend through explicit `X-Firebase-AppCheck` verification in service code.

This document does not enable any enforcement setting.

## Replay-protection boundary

Firebase App Check supports limited-use tokens and backend token consumption for replay protection, but current provider documentation identifies this as beta for custom backends and notes an extra verification network round trip plus additional attestation/quota pressure.

Stage 2I does not make that beta feature a correctness dependency for the initial account-bootstrap path.

The existing Stage 2G account bootstrap is already idempotent and atomic for repeated same-UID requests. Any future security-critical operation that wants App Check token consumption must receive a separate explicit review before relying on the beta capability.

If a later operation authorizes App Check token consumption, the provider currently requires `firebaseappcheck.appCheckTokens.verify`, exposed by `roles/firebaseappcheck.tokenVerifier`. That permission is not silently added to the Stage 2H four-permission runtime role by this boundary.

The dormant implementation calls the injected App Check verifier with only the transient token. It does not pass a consume/replay option and therefore does not make limited-use token consumption an implicit requirement.

## Cloud Run scaling is defense in depth, not rate authorization

Cloud Run maximum-instance and concurrency settings can reduce blast radius, resource pressure and cost exposure, but they are not authentication, application authorization or a strict per-user rate limiter. Google documents that maximum-instance targets can be temporarily exceeded during some traffic spikes and maintenance behavior.

A future production Cloud Run provisioning milestone must select finite scaling/concurrency bounds deliberately and validate them under the actual trusted service workload. Stage 2I does not invent an untested numerical production limit.

Operation-specific account/device abuse throttles remain a later separately reviewed concern where needed. No throttling rule may use display names as identity or silently grant authority after a limit check.

## Stage 2H IAM boundary remains protected

The Stage 2H four-permission account-bootstrap runtime role remains exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

Baseline App Check policy proof does not authorize a broader Firebase Administrator role, Firebase App Check Administrator role, Datastore convenience role, Owner/Editor/Viewer or any service-agent role for the runtime.

Any future additional IAM permission must be tied to an exact reviewed provider operation and permanently proven before grant.

`roles/firebaseappcheck.tokenVerifier` / `firebaseappcheck.appCheckTokens.verify` is reserved only for a later explicitly reviewed replay-consumption operation if that beta feature is chosen. It is not part of the Stage 2H four-permission runtime role and is not authorized by this Stage 2I dormant implementation proof.

## Firestore and shared-mutation boundary remains unchanged

Every application-client Firestore create, update and delete remains denied.

App Check does not repair the Phase 1D / Phase 1F shared-state idempotency-receipt schema finding and must not be used to justify direct browser shared-state writes.

App Check also does not turn a browser into a trusted mutation gateway. A modified but attested client must still be treated as untrusted application logic.

A separately reviewed trusted shared-mutation gateway/protocol boundary remains required before Connected Rivalry shared-state mutation can become production-authorized.

## Production isolation for this implementation PR

The Stage 2I dormant implementation proof must not create, enable, deploy or connect:

- a production Firebase project;
- a production Firebase Web App;
- a production reCAPTCHA Enterprise key;
- App Check registration or enforcement;
- production Google provider or Authorized Domains configuration;
- a production Cloud Run service;
- a production service account;
- any IAM binding, custom role or App Check verifier role;
- Blaze billing or another paid-production commitment;
- production Firestore data;
- production Firestore Security Rules deployment;
- production Firebase Admin runtime;
- real production users;
- account/login UI;
- registered devices;
- pairing or invite runtime;
- Connected Rivalry runtime;
- Private Remote Joining runtime.

No production application dependency, runtime asset, Service Worker revision or Firebase/App Check import is authorized by this Stage 2I implementation proof.

## Product, recovery and identity locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C remains the sole destructive import Apply authority with strict exact raw snapshots, exact last-moment preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery guarantees.

Firebase Auth `uid` remains architecture `accountId` and remains distinct from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId`.

Exactly two manager slots remain authoritative. Same visible names never establish identity.

Public discovery, public profiles, public matchmaking, public invitation directories, community systems, global leaderboards and public rankings remain eliminated.

## Version boundary

Stage 2I implementation is dormant source, documentation and permanent contracts only and changes no shipped application behavior.

Under `VERSIONING_POLICY.md`, no semantic application version bump is appropriate for this bounded prerequisite. Production remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

When an App Check/Firebase-connected production capability actually ships, its version must be classified from the real shipped scope rather than from the Stage number.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 lane remains incomplete.

Stage 2I resolves only the app-attestation / initial endpoint abuse-resistance proof. Later Stage 2 work still includes real production Firebase environment provisioning/configuration, production Web App/provider/Authorized Domains operational setup, production Security Rules deployment, account export, provider-aware deletion cascade, operation-specific abuse/rate controls where required, provider outage/recovery behavior, production operational verification and the trusted shared-mutation gateway/protocol boundary.

Their listing is not automatic implementation order.

Stage 3 Registered Devices / Private Pairing remains BLOCKED until the entire Stage 2 lane is DONE / MERGED / PROVEN.

Stage 4 Connected Rivalry remains BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Stage 2I implementation completion gate

Stage 2I may be classified DONE / MERGED / PROVEN only when it permanently proves at minimum:

1. reCAPTCHA Enterprise is the sole selected initial production web App Check provider for the current GitHub Pages topology;
2. the initial policy preserves the provider-recommended default risk threshold `0.5` and one-hour TTL unless measured evidence explicitly justifies a later change;
3. production web-domain scoping is explicit and production App Check configuration rejects `localhost`;
4. debug-provider/token handling remains development/emulator/CI-only and no production bypass material is committed or persisted;
5. every protected custom-backend request requires App Check in `X-Firebase-AppCheck` and never in a URL/query parameter;
6. trusted verification fails closed for missing, invalid, expired, wrong-app, wrong-project and unavailable-verifier outcomes;
7. the exact expected production Firebase Web App identity is checked rather than accepting any app in the project;
8. App Check remains separate from Stage 2F user authentication, Career Mode Showdown application authorization and Stage 2H IAM;
9. raw App Check tokens remain transient, unlogged, unpersisted and absent from trusted transaction payloads;
10. beta limited-use/replay consumption is not treated as a correctness dependency and does not silently expand runtime IAM;
11. Cloud Run scaling/cost controls are classified as defense in depth, not authorization or a strict per-user rate limiter;
12. every browser Firestore create/update/delete remains denied and the shared-mutation security finding remains unresolved by App Check;
13. no production Firebase, App Check, reCAPTCHA, Cloud Run, IAM, billing, user, Firestore or provider resource is provisioned by the Stage 2I implementation proof unless a later independently authorized production gate explicitly permits it;
14. production application/package/runtime identity remains v1.4.0 / `1.4.0-r1` unless a real production runtime shipment occurs;
15. permanent Stage 2I contracts and the complete repository contract suite pass;
16. all 13 normal workflow families succeed on one exact unchanged final PR head with clean submitted reviews and inline review threads before merge;
17. expected-head merge succeeds and live `main` is independently verified afterward.

Conditions 1 through 15 are the implementation target of the current bounded branch. Conditions 16 and 17 remain publication gates and must be independently proven before Stage 2I is called DONE / MERGED / PROVEN.

Do not select or begin another Stage 2 prerequisite or Stage 3 inside this bounded Stage 2I implementation environment.
