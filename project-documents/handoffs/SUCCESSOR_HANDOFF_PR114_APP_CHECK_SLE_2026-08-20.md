# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #114 App Check Bootstrap

Status: WEC successor package prepared for the PR #114 clean checkpoint. Treat this file as orientation, never as implementation authority. Current source, live GitHub/provider state, WEC, security/recovery contracts and later owner instructions override every recorded fact.

## SLE objective

Start lean, verify live state first, load only the evidence needed for the current dependency, and continue substantive Remote Joining prerequisite work without reconstructing the complete project history unless evidence forces a deep fallback.

The owner’s long-term product priority remains Private Remote Joining. Stability and dependency order remain mandatory. Do not manufacture process/documentation milestones when a genuine prerequisite is available.

## Repository

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Verified live `main` before this SLE packaging sequence: `1ccf2d3f451ea53575698877787562e38f1d6f50` from merged PR #113.

Application/package: `1.4.0`

Runtime: `1.4.0-r1`

Previous known-good whole shell: `1.3.0-r2`

No runtime/version bump was warranted because PR #114 does not load Firebase/App Check into the shipped website.

## Current candidate

Draft PR: `#114 — Record production App Check registration and add controlled bootstrap`

Branch: `agent/pr114-app-check-bootstrap`

Base: `main`

Merge authorization: NOT GRANTED. The owner explicitly authorized branch creation, commits/pushes and opening the draft PR, but not merge. Do not merge PR #114 until a later explicit owner instruction authorizes it.

Pre-SLE-packaging engineering head: `30ea11102840ad84352c3402f52af107fde1935c`.

That head passed all 13 normal pull-request workflow families and PR #114 was mergeable with zero submitted reviews and zero inline review threads. The later SLE packaging/WEC-seal commits intentionally move the branch beyond that head, so the successor must fetch PR #114 live and validate the final sealed exact head rather than treating `30ea111...` as current.

## Provider proof completed by owner on 2026-08-20

Production project: `fifa17-career-showdown-prod`.

The owner supplied Google Cloud/Firebase screenshots proving:

1. reCAPTCHA Enterprise API enabled;
2. production Web key `Career Mode Showdown Production App Check` created;
3. Web domain exactly `nikahanghojjati-oss.github.io`;
4. domain verification enabled;
5. AMP, interactive challenges, testing-only mode and WAF mode disabled;
6. the existing Career Mode Showdown Firebase Web App registered with Firebase App Check using reCAPTCHA Enterprise;
7. token TTL exactly one hour;
8. App risk threshold Medium (`0.5`);
9. Firebase displayed `App registration successful` and the Web App status became `Registered` with a green reCAPTCHA Enterprise provider indicator.

Provider evidence is preserved at `authority-history/APP_CHECK_PROVIDER_REGISTRATION_2026-08-20.md` and in `firebase.production.environment.json`.

App Check enforcement remains OFF.

## PR #114 implementation

`firebase.production.environment.json`

Now records provider-verified App Check registration while keeping:

- `appCheckEnforcement: false`;
- `appCheckRuntimeBootstrapConnected: false`;
- `trustedRuntimeIam: not-activated-yet`;
- `runtimeConnected: false`;
- application-client Firestore writes `deny-all`.

`js/productionAppCheckBootstrap.js`

Dormant bootstrap contract only. It is intentionally not loaded by `index.html`, `js/optionalModules.js` or `service-worker.js`.

It locks:

- production origin `https://nikahanghojjati-oss.github.io`;
- project `fifa17-career-showdown-prod`;
- exact production Firebase Web App identity;
- reCAPTCHA Enterprise provider;
- one-hour TTL / `0.5` risk policy;
- production debug path forbidden;
- premature enforcement forbidden;
- injected Firebase Web config and reCAPTCHA site key required;
- `initializeApp` before `initializeAppCheck`;
- `ReCaptchaEnterpriseProvider`;
- `isTokenAutoRefreshEnabled: true`;
- no Firestore initialization;
- no browser trusted-mutation authority.

Concrete Firebase Browser API key and concrete reCAPTCHA Enterprise site key are not newly hard-coded into committed runtime source. Preserve the controlled public-config injection policy established after PR #111.

Permanent App Check/RJR contracts are registered in the canonical contract suite.

## RJR — Remote Joining readiness

Machine-readable numeric authority: `REMOTE_JOINING_READINESS.json`.

Model: `RJR-1`.

Current evidence-backed readiness at this checkpoint: approximately `59%`.

Fixed 100-point domains:

- deterministic sync and recovery safety: 20;
- identity/authentication/authorization/trust: 20;
- production cloud/security activation: 20;
- devices/pairing/Connected Rivalry/actual Remote Joining: 30;
- real-device hardening/stable release: 10.

Do not derive RJR from PR count, roadmap-stage count, WEC, Handoff proximity or visible owner actions. Increase only when verified evidence improves a fixed capability domain. Decrease only when credited evidence is invalidated or a proven regression removes capability. Changing weights/denominator requires a new RJR model version, rationale and backcast.

Provider App Check registration moved the reconstructed 58 baseline to 59. The dormant PR #114 bootstrap and CI proof do not by themselves justify another RJR point because production client traffic is still not proven.

## WEC and owner reporting

Every substantive owner-facing development checkpoint must preserve exactly this seven-line order:

`Handoff proximity: X%`

`Remote Joining readiness: ~Y%`

`Current lane: ...`

`Concrete dependency completed: ...`

`Next unlock: ...`

`Blocker: ...`

`Sidequest check: ...`

RJR comes from `REMOTE_JOINING_READINESS.json`. Handoff proximity/WEC is a separate continuity metric and must never share a denominator with RJR.

At Handoff proximity 100%, finish only the current safe boundary, generate the successor package and stop before another substantial milestone. The predecessor’s WEC decision is historical; a successor must initialize its own fresh WEC identity and assess itself after validating inherited state.

Usage is unavailable unless objectively supplied. Never fabricate account/model usage.

## Important environment lessons

A sequence of non-fast-forward `update_ref` attempts was rejected by GitHub with 422 after branch creation. None changed repository state. That route was circuit-broken. Do not repeat it; normal GitHub contents writes worked.

The first PR #114 validation exposed two distinct test defects/implementation hygiene issues:

1. an RJR reporting regex incorrectly required an extra literal `not` and was corrected;
2. the new App Check module initially reused global helper names already present in other JS files. Exact Stability job logs identified `isRecord`, `deepFreeze` and `reject` duplicates. The helpers were renamed with production-App-Check-specific names.

Do not infer CI causes from the workflow family name. For a failure, fetch exact workflow run jobs and then exact failed job logs before modifying code.

No security/recovery test was weakened to obtain green CI.

## Permanent security/data locks

Production Firestore Rules source remains `firestore.rules`, blob `0473750cb16b5b8eea234c0f8138c41de5ff3dfb`, provider-verified deployed through PR #113.

Every application-client Firestore create/update/delete remains denied.

App Check is attestation only. It grants no account identity, application authorization, pairing authority, rivalry entitlement, gameplay authority, shared-mutation authority or IAM authority.

Trusted request order remains: production-origin defense in depth → transient `X-Firebase-AppCheck` → trusted Admin App Check verification → exact App identity/project audience → revocation-aware Firebase ID token verification → derive accountId from verified UID → operation-specific application authorization → trusted operation adapter under separately reviewed IAM.

Stage 2H current least-privilege account-bootstrap permission proof remains:

`firebaseauth.users.get`

`datastore.databases.get`

`datastore.entities.get`

`datastore.entities.create`

Do not silently broaden production IAM.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`

`careerModeShowdown.legacyShowdowns`

`careerModeShowdown.preferences`

`activeShowdown` is not a fourth canonical key.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community, public rankings and global leaderboards remain prohibited/eliminated.

Exactly two managers remain authoritative.

## Dependency order

Current progression remains:

production App Check/runtime trust completion → remaining genuine Stage 2 production/operational trust/IAM proof → Stage 3 Registered Devices / Private Pairing → Stage 4 Connected Rivalry → Stage 5 Private Remote Joining → real-device hardening → stable release.

Stage 3 remains blocked today. Do not start it simply because provider App Check registration succeeded.

## Immediate successor startup — SLE path

The owner should initially provide only `START_NEXT_SESSION_V1.2.0_PR114.md`.

Successor should then:

1. use the connected GitHub tool first;
2. fetch live `main`, PR #114 metadata, PR #114 exact head, relevant recent commits and current workflow runs;
3. read only `SESSION_BOOTSTRAP.json`, `REMOTE_JOINING_READINESS.json`, `WORK_ENVIRONMENT_STATUS.json` and `firebase.production.environment.json` initially;
4. validate inherited WEC status, archive predecessor facts if required, create a fresh environment ID/reset signals and only then run the successor’s own WEC assessment;
5. if PR #114 final sealed head is unchanged and all 13 normal workflow families are green, verify reviews/threads/mergeability and report the checkpoint;
6. do not merge without explicit owner authorization;
7. if a workflow fails, inspect exact run jobs and exact failed job logs before repair;
8. load `js/productionAppCheckBootstrap.js`, its App Check contracts, Stage 2I and `firestore.rules` only when needed;
9. use this complete handoff only as deep fallback.

`NEXT_TASK.md` still contains an older connected-export current-authority body inherited from PR #108. That historical text is preserved in Git history and permanent contracts but is stale relative to the later owner-authorized provider activation/PR #114 lane. Do not regress to PR #108 merely because that heading says CURRENT. Current live source, this later owner instruction, PR #109–#114 provider evidence and the newest WEC/start packet supersede it. Reconcile `NEXT_TASK.md` naturally when publication authority permits; do not create a standalone documentation repair PR.

## Immediate work after PR #114 is eventually authorized and merged

Do not jump to App Check enforcement.

The next substantive dependency is controlled production runtime-config delivery and App Check client initialization/proof:

- determine the leanest safe way to provide the public Firebase Web config/API key and public reCAPTCHA Enterprise site key without reversing PR #111 handling policy;
- initialize Firebase App and App Check in the legitimate production client before protected Firebase services;
- require token auto-refresh;
- keep debug provider disabled in production;
- keep Firestore application-client writes deny-all;
- deploy/observe legitimate App Check traffic;
- use metrics to prove legitimate requests are verified;
- only then evaluate service-specific enforcement;
- trusted-runtime IAM/endpoint activation remains separately reviewed and least privilege.

If current provider guidance changes, verify it before provider mutation and update only with evidence.

## SLE context system

`SESSION_BOOTSTRAP.json` is the compact capsule.

`SESSION_CONTEXT_GRAPH.json` records dependency/provenance relationships.

`SESSION_CONTEXT_MODEL.json` retains deterministic ranking priors.

`SESSION_CONTEXT_LEARNING.json` now contains one labeled material session. It is still cold-start state and is not a trained ML model. Do not claim otherwise. Supervised ranking remains ineligible before at least 20 materially distinct labeled sessions and must beat deterministic retrieval on held-out startup simulations without increasing missed-critical-context events.

Connected GitHub tooling remains primary. Rootless `gh` is fallback only for a concrete unsupported operation.

## Clean-stop rule

At this handoff boundary, do not begin the next substantial runtime-config/App Check traffic milestone. First complete the exact sealed-head proof of PR #114 and obtain any required owner merge authorization. Then the next fresh environment can continue the dependency chain.
