# Private Account / Authentication Stage 2D — Production Firebase Environment & Configuration Preflight

Status: DONE / MERGED / PROVEN / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED

Completed: PR #88, exact validated head `f019c6c6c39385fcb1f76f3de240fd73bb972e49`, squash merge / independently verified live-main boundary `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

Historical pre-merge status retained for contract provenance only: `CURRENT / IMPLEMENTATION-AUTHORIZED / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED`.

Selected: 2026-08-18 ET after independent verification of PR #87 and fresh Work Environment Continuity initialization.

## Completion proof

Stage 2D is complete and must not be repeated.

All 13 normal workflow families succeeded on the exact unchanged PR #88 head `f019c6c6c39385fcb1f76f3de240fd73bb972e49`. Submitted reviews and inline review threads were empty before the expected-head squash merge. The independently verified resulting live `main` boundary is `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

The final preflight also rejects an initial Firebase Auth domain that does not match the selected project identity through `AUTH_DOMAIN_PROJECT_MISMATCH`. A later custom Auth domain remains a separately reviewed compatibility/security boundary.

PR #88 changed no production application runtime, dependency, Firebase connection, Security Rule, timeout or performance ceiling. Production therefore remains v1.4.0 / package `1.4.0` / runtime `1.4.0-r1` with production Firebase disconnected.

The next bounded prerequisite is not defined by this completed Stage 2D document. Current implementation authority is owned by `NEXT_TASK.md`; on the Stage 2E branch it selects only Trusted Application Account Bootstrap & Lifecycle Boundary.

## Purpose

Stage 2D was the smallest remaining Stage 2 prerequisite that safely preceded creation or connection of real production Firebase resources.

It built a deterministic, repository-owned preflight contract that rejects unsafe or incomplete future production Firebase environment metadata before any production project, web app, Authentication provider, Firestore database or Security Rules deployment is connected to the Career Mode Showdown runtime.

Stage 2D is a readiness validator, not production provisioning.

## Why this prerequisite was selected

Current primary Firebase documentation reviewed on 2026-08-18 established the material provider facts that shaped this boundary:

1. production and development should use separate Firebase projects;
2. a web client needs a registered Firebase web app and configuration before it can connect;
3. Firebase web configuration and its API key identify project resources but are not an authorization secret or substitute for Security Rules/IAM;
4. Firestore location must be deliberately selected during provisioning and cannot later be changed for that database;
5. server SDKs bypass Firestore Security Rules and therefore belong to a separately trusted IAM/server boundary.

The repository still has only the fixed Local Emulator Suite project `demo-career-mode-showdown-phase1f`. Production Firebase remains disconnected.

## Exact completed implementation boundary

Stage 2D contains only:

1. dormant deterministic `js/firebaseProductionPreflight.js`, not loaded by the production application;
2. permanent repository contracts for the preflight and Stage 2D boundary;
3. synthetic fixtures proving valid metadata is accepted and dangerous/incomplete metadata fails closed;
4. current-facing authority that was frozen before exact-head CI and merge;
5. complete normal repository CI on one exact unchanged PR head.

The preflight validates at least these invariants:

- environment is explicitly `production`;
- the candidate production project ID is non-empty and does not use the protected `demo-` emulator namespace;
- the candidate project ID differs from `demo-career-mode-showdown-phase1f`;
- a future web-app configuration has the expected project identity and required public Firebase web configuration fields;
- the initial accepted Firebase Auth domain matches the candidate project's default `<projectId>.firebaseapp.com` identity; a custom Auth domain requires a separately reviewed hosting/auth-domain compatibility and security boundary before it can be authorized;
- the Firebase web API key is classified as public project configuration, never as an application secret or authorization boundary;
- service-account credentials, private keys and Admin credentials are rejected from client/repository configuration;
- the Stage 2C provider policy remains Google federated sign-in through `GoogleAuthProvider`;
- the Stage 2C GitHub Pages flow remains explicit-user-gesture `signInWithPopup()`;
- `signInWithRedirect()` remains unauthorized until its separate hosting/auth-domain compatibility gate is reviewed;
- Auth persistence remains `browserSessionPersistence`, never silently `browserLocalPersistence`;
- the production GitHub Pages host `nikahanghojjati-oss.github.io` is explicitly represented in the future authorized-domain plan;
- a Firestore location decision is explicit before provisioning readiness can pass;
- persistent Firestore offline cache remains disabled;
- every application-client Firestore create/update/delete remains denied;
- no client configuration can claim trusted mutation-gateway authority;
- public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

## Fail-closed proof requirements

Permanent contracts prove rejection of at least:

- missing production environment identity;
- `demo-` project IDs;
- the existing emulator project ID;
- mismatched project IDs between environment metadata and Firebase web configuration;
- an Auth domain that does not correspond to the candidate production project's default `<projectId>.firebaseapp.com` boundary;
- missing required web configuration fields;
- a missing production authorized-domain plan;
- redirect sign-in authorization;
- durable local Auth persistence;
- an unset Firestore location decision;
- persistent Firestore cache enablement;
- any service-account/private-key/Admin credential material;
- any claim that the web API key is a secret security boundary;
- any direct application-client Firestore write authorization;
- any public discovery/ranking capability.

A synthetic fully specified production-like fixture may pass the validator. Passing a synthetic fixture must never be interpreted as proof that a real Firebase production project exists or is configured.

## Explicitly not authorized

Stage 2D did not authorize:

- creating a real Firebase project;
- registering a real Firebase web app;
- choosing or provisioning a real Firestore database/location on the owner's behalf;
- enabling Google Sign-In in a real Firebase console;
- changing real Authorized Domains;
- authorizing a custom Firebase Auth domain or redirect-hosting topology;
- adding Firebase SDK/Auth/Firestore to the GitHub Pages production runtime;
- creating real Firebase users;
- account/login UI;
- deploying production Firestore Security Rules;
- production Firestore data;
- application-client Firestore writes;
- Cloud Functions;
- Firebase Admin production runtime;
- service-account credentials;
- Blaze billing or other paid infrastructure;
- a trusted production mutation gateway;
- production `verifyIdToken(..., checkRevoked=true)` infrastructure;
- registered-device/pairing UI;
- Connected Rivalry runtime;
- Private Remote Joining runtime or UX;
- Private Cloud Backup;
- public/community/discovery/matchmaking/ranking features.

## Protected security boundary

Every application-client Firestore create/update/delete remains denied.

Stage 2D does not resolve the Phase 1D/1F idempotency-receipt security finding. A client helper is not a security boundary. Any future production mutation gateway or schema/protocol change remains a separately reviewed Stage 2 requirement.

Firebase Admin remains emulator/test-only until a separately authorized trusted production boundary exists.

## Identity and recovery locks

Firebase Auth `uid` remains architecture `accountId` and remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` and `sessionId`.

Exactly two manager slots remain authoritative. No ownership transfer is inferred from names or account lifecycle changes.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive local import Apply authority over exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Stage 2D code may directly own canonical `localStorage`.

## Runtime and version boundary

Stage 2D is dormant prerequisite infrastructure and contracts only. It changes no shipped application behavior.

Production remains:

- application `v1.4.0 Product Deepening`;
- package `1.4.0`;
- runtime `1.4.0-r1`;
- previous known-good whole shell `1.3.0-r2`.

No semantic version bump was required for this non-runtime prerequisite.

## Historical completion gate

Stage 2D's pre-merge completion gate required:

1. the deterministic preflight implementation to exist and remain production-dormant;
2. permanent contracts proving the required pass/fail matrix;
3. exact production runtime/dependency isolation;
4. then-current authority recording PR #87 as DONE / MERGED / PROVEN and Stage 2D as the current bounded prerequisite;
5. the entire repository contract suite and all normal workflow families on one exact unchanged PR head;
6. clean submitted reviews and inline review threads;
7. mergeability and exact head identity reverified immediately before merge;
8. expected-head squash merge;
9. independent live-main verification after merge;
10. WEC reassessment before a distinct later Stage 2 milestone.

All ten conditions were satisfied by PR #88. Stage 3 Registered Devices / Private Pairing, Stage 4 Connected Rivalry and Stage 5 Private Remote Joining remain blocked.
