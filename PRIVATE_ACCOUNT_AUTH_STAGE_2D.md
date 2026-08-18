# Private Account / Authentication Stage 2D — Production Firebase Environment & Configuration Preflight

Status: CURRENT / IMPLEMENTATION-AUTHORIZED / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED

Selected: 2026-08-18 ET after independent verification of PR #87 and fresh Work Environment Continuity initialization.

## Purpose

Stage 2D is the smallest remaining Stage 2 prerequisite that safely precedes creation or connection of real production Firebase resources.

It must build a deterministic, repository-owned preflight contract that rejects unsafe or incomplete future production Firebase environment metadata before any production project, web app, Authentication provider, Firestore database or Security Rules deployment is connected to the Career Mode Showdown runtime.

Stage 2D is a readiness validator, not production provisioning.

## Why this prerequisite is next

Current primary Firebase documentation reviewed on 2026-08-18 establishes the material provider facts that shape this boundary:

1. production and development should use separate Firebase projects;
2. a web client needs a registered Firebase web app and configuration before it can connect;
3. Firebase web configuration and its API key identify project resources but are not an authorization secret or substitute for Security Rules/IAM;
4. Firestore location must be deliberately selected during provisioning and cannot later be changed for that database;
5. server SDKs bypass Firestore Security Rules and therefore belong to a separately trusted IAM/server boundary.

The repository currently has only the fixed Local Emulator Suite project `demo-career-mode-showdown-phase1f`. Production Firebase remains disconnected. Creating a real project before protecting environment identity, location decision, Auth policy and credential boundaries would make later mistakes harder to detect and recover from.

## Exact implementation authority

Stage 2D authorizes only:

1. a dormant deterministic production Firebase preflight module that is not loaded by the production application;
2. permanent repository contracts for that module and this Stage 2D boundary;
3. synthetic test fixtures proving valid metadata is accepted and dangerous/incomplete metadata fails closed;
4. current-facing authority synchronization that records PR #87 as complete and Stage 2D as the single current prerequisite;
5. complete normal repository CI on one exact unchanged PR head.

The preflight must validate at least these invariants:

- environment is explicitly `production`;
- the candidate production project ID is non-empty and does not use the protected `demo-` emulator namespace;
- the candidate project ID differs from `demo-career-mode-showdown-phase1f`;
- a future web-app configuration has the expected project identity and required public Firebase web configuration fields;
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

Permanent contracts must prove rejection of at least:

- missing production environment identity;
- `demo-` project IDs;
- the existing emulator project ID;
- mismatched project IDs between environment metadata and Firebase web configuration;
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

Stage 2D does not authorize:

- creating a real Firebase project;
- registering a real Firebase web app;
- choosing or provisioning a real Firestore database/location on the owner's behalf;
- enabling Google Sign-In in a real Firebase console;
- changing real Authorized Domains;
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

Production therefore remains:

- application `v1.4.0 Product Deepening`;
- package `1.4.0`;
- runtime `1.4.0-r1`;
- previous known-good whole shell `1.3.0-r2`.

No semantic version bump is authorized for this non-runtime prerequisite.

## Completion gate

Stage 2D is complete only when:

1. the deterministic preflight implementation exists and is production-dormant;
2. permanent contracts prove the required pass/fail matrix;
3. production runtime/dependency isolation remains exact;
4. current authority records PR #87 as DONE / MERGED / PROVEN and Stage 2D as the current bounded prerequisite;
5. the entire repository contract suite and all normal workflow families pass on one exact unchanged PR head;
6. submitted reviews and inline review threads are clean;
7. mergeability and exact head identity are reverified immediately before merge;
8. the PR is squash-merged with expected-head protection;
9. live `main` is independently verified after merge;
10. WEC is reassessed before any distinct later Stage 2 milestone.

Stage 3 Registered Devices / Private Pairing, Stage 4 Connected Rivalry and Stage 5 Private Remote Joining remain blocked.
