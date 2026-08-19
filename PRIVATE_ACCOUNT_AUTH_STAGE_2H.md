# Private Account / Authentication Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary

Status: AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED

Effective: 2026-08-18 ET

Starting verified live-main boundary: `f97024cf4be3e76cf25c510fb364675b8e747762` after Stage 2G PR #91.

Production application remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1`.

Production Firebase remains disconnected. Every application-client Firestore create, update and delete remains denied.

## Why Stage 2H is next

Stage 2G — Trusted Account Bootstrap Execution Boundary — is DONE / MERGED / PROVEN through PR #91.

Exact validated PR #91 head:

`9b11ed82766d011bef6f5ea29ba2a9cd20e4ad52`

Squash merge / independently verified live-main completion boundary:

`f97024cf4be3e76cf25c510fb364675b8e747762`

All 13 normal pull-request workflow families succeeded on the exact unchanged final PR #91 head. Submitted reviews and inline review threads were empty.

Stage 2F already proves how a future trusted service must verify a transient Firebase ID token with revocation checking and derive architecture `accountId` only from the verified Firebase UID. Stage 2G already proves how that verified principal may execute only the narrow same-UID missing-account bootstrap through one trusted atomic transaction.

The next unresolved dependency is not device registration. It is the production trust boundary that will eventually host those privileged operations. Firestore server client libraries bypass Firestore Security Rules and rely on Google Cloud IAM, so the project must define the runtime, service identity and privilege boundary before any production Firebase or privileged writer is provisioned.

Stage 2H therefore comes before production provisioning, account lifecycle execution, device registration, pairing, Connected Rivalry or Private Remote Joining.

## Selected production trusted runtime

Stage 2H selects a dedicated Google Cloud Run HTTPS service as the future trusted execution runtime for Career Mode Showdown privileged server operations.

This is an architecture selection only. This Stage 2H boundary does not create or deploy that service.

The selection is based on these provider properties:

1. Cloud Run supports a dedicated service identity for access to Google Cloud APIs.
2. Google recommends a user-managed service account with only the minimum permissions required by the service.
3. Firebase Admin SDK on Google-managed runtimes supports Application Default Credentials without exporting service-account key material.
4. Google documents the end-user pattern in which a public web/mobile app obtains a Firebase/Identity Platform ID token, sends it to a Cloud Run service and the service verifies the ID token in application code.
5. Firestore server libraries are privileged and bypass Firestore Security Rules, making explicit IAM and application-authorization boundaries mandatory.

Primary provider references for the implementation successor:

- `https://cloud.google.com/run/docs/configuring/services/service-identity`
- `https://cloud.google.com/run/docs/authenticating/end-users`
- `https://firebase.google.com/docs/admin/setup`
- `https://firebase.google.com/docs/firestore/security/insecure-rules`
- `https://cloud.google.com/firestore/docs/security/iam`

Current provider documentation must be rechecked when Stage 2H is implemented because provider requirements may change.

## End-user request boundary

The future Cloud Run service is intended for private Career Mode Showdown end users authenticated by Firebase Authentication, not organization members with Google Cloud IAM access.

The browser may reach the HTTPS service at the network layer, but network reachability grants zero application authority.

For every protected non-preflight request:

1. the signed-in web app obtains a transient Firebase ID token;
2. the request sends that token in an `Authorization: Bearer ...` header over HTTPS;
3. the trusted service passes only that transient token into the Stage 2F verifier boundary;
4. Stage 2F requires the equivalent of `verifyIdToken(idToken, true)`;
5. architecture `accountId` is derived only from the verified Firebase UID;
6. the service then performs separate current application authorization for the requested operation;
7. only after authentication and application authorization may the operation reach an explicitly reviewed trusted transaction adapter.

CORS, origin checks, Cloud Run reachability, a request body `accountId`, display names, profile labels, device labels or possession of a public service URL are never authentication or application authorization.

An `OPTIONS` CORS preflight may be answered without Firebase user authentication when required by browser protocol, but it must never execute an application operation or disclose protected data.

## Dedicated service identity

The future Cloud Run service must use a dedicated user-managed service account created specifically for the Career Mode Showdown trusted execution service.

Do not use a human account, browser credential, exported service-account JSON key or repository secret as runtime authority.

Do not grant primitive `Owner`, `Editor` or `Viewer` roles to the runtime service identity.

Do not treat a Firebase Admin role, project-wide administrator role or default compute service account as an acceptable convenience substitute for least privilege.

The implementation successor must determine the minimum Firestore permissions needed by the exact reviewed Stage 2 operations. Prefer a narrower custom role when it safely covers the required transaction/read/write methods; if a predefined role is used, justify why its additional permissions are acceptable. The decision must be permanently contracted before production IAM is granted.

Runtime IAM controls what the service process can call at Google Cloud. It does not replace per-request Career Mode Showdown application authorization.

## Application Default Credentials and secret boundary

On Google-managed production runtime, Firebase Admin must initialize through Application Default Credentials bound to the Cloud Run service identity.

No service-account private-key JSON may be committed to the repository, bundled into the GitHub Pages client, stored in browser storage, copied from a connector, embedded in source, printed into CI logs or persisted as application data.

Stage 2F Firebase ID tokens remain transient end-user bearer material. They must not be stored in Firestore, localStorage, sessionStorage, IndexedDB, diagnostics, analytics or application logs.

The token is consumed by the trusted verifier and is not forwarded to the Stage 2G account transaction adapter.

## Firestore trust model remains unchanged

Every application-client Firestore create, update and delete remains denied.

Cloud Run / Admin / server Firestore access bypasses Firestore Security Rules and therefore must be constrained by both:

- least-privilege IAM on the dedicated service identity; and
- explicit Career Mode Showdown application authentication and authorization before each operation.

Stage 2H does not weaken `firestore.rules` and does not authorize direct browser Firestore shared-state writes.

The Phase 1D / Phase 1F idempotency-receipt finding remains binding. Stage 2H is not itself the production shared-rivalry mutation gateway contract and does not grant Connected Rivalry or gameplay mutation authority.

## Stage 2G account-bootstrap composition

The future production account-bootstrap path may compose the completed stages only in this order:

1. HTTPS request reaches the trusted Cloud Run service;
2. Stage 2F performs revocation-aware Firebase ID-token verification;
3. authenticated `accountId` is derived only from verified UID;
4. current application account/lifecycle authorization is evaluated as required by the operation;
5. Stage 2G executes same-UID missing-account bootstrap only through the reviewed atomic transaction adapter;
6. the service returns a bounded response without raw token or provider diagnostics.

Stage 2G's `updatedByDeviceId: null` exception remains limited to revision-0 self-bootstrap before Stage 3 registered-device authority exists.

## Production isolation for this boundary PR

The Stage 2H authorization boundary must not create or activate:

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

No production application dependency, runtime asset or Service Worker revision changes in this authorization boundary.

## Product and recovery locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C remains the sole destructive import Apply authority with the protected snapshot, precondition, rollback, anti-clobber and exact-verification guarantees.

Public discovery, public profiles, public matchmaking, community systems, global leaderboards and public rankings remain eliminated.

## Downstream dependency locks

The complete Private Account / Authentication / Authorization Stage 2 lane remains incomplete.

Stage 2H resolves only the trusted production runtime/service-identity/IAM policy boundary. Later Stage 2 work still includes production environment provisioning/configuration, production operational verification, account lifecycle export/deletion execution, abuse/rate controls, provider outage/recovery behavior and a separately reviewed trusted shared-mutation gateway/protocol boundary. Their listing is not automatic implementation order.

Stage 3 Registered Devices / Private Pairing remains BLOCKED until the entire Stage 2 lane is DONE / MERGED / PROVEN.

Stage 4 Connected Rivalry remains BLOCKED until Stage 3 and all earlier prerequisites are proven.

Private Remote Joining remains the prioritized long-term dependency-gated destination and is NOT YET IMPLEMENTATION-AUTHORIZED.

## Stage 2H implementation completion gate

A future Stage 2H implementation PR may be classified DONE / MERGED / PROVEN only when it permanently proves at minimum:

1. Cloud Run is the selected trusted execution runtime and no alternate runtime silently gains authority.
2. The service uses a dedicated user-managed service identity rather than a default broad identity.
3. Application Default Credentials are required on Google-managed runtime and exported private-key credentials are forbidden.
4. Exact minimum Firestore runtime permissions are documented, justified and permanently contracted before any production grant.
5. Primitive Owner/Editor/Viewer and broad convenience administrator roles are rejected for runtime authority.
6. End-user Firebase ID tokens are verified through the Stage 2F revocation-aware boundary and never treated as Cloud Run IAM credentials.
7. Application authorization remains separate from Firebase authentication and IAM.
8. Stage 2G account-bootstrap-only authority remains narrow and atomic.
9. Every browser Firestore create/update/delete remains denied.
10. No production Firebase, Cloud Run, IAM, billing, user, Firestore or provider resource is provisioned by the Stage 2H implementation proof unless a later independently authorized provisioning gate explicitly permits it.
11. Production runtime/version identity remains unchanged unless a real user-facing/runtime shipment occurs.
12. The complete normal workflow gate succeeds on one exact unchanged final head with clean review/thread state before merge.

This authorization document selects the next prerequisite only. The current handoff-bound environment must publish this boundary and stop before implementing Stage 2H.
