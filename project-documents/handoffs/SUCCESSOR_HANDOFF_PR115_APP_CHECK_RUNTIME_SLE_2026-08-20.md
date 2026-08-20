# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #115

Treat this handoff as orientation only. Current source, live GitHub/provider/deployment state, WEC, security/recovery contracts and later owner instructions override recorded facts.

## Fast startup

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
PR #115: `Connect production App Check runtime safely`
PR branch: `agent/production-app-check-runtime`
Recorded base/live main before PR #115 publication: `7944b87a20cf793c659077d7518c4446f178e32c`
Recorded pre-packaging validated PR head: `36debe7511bd4001a17be03b5e3d787559fd032a`
Application/package: `1.4.0`
Production runtime at handoff packaging: `1.4.0-r1`
PR #115 candidate runtime: `1.4.0-r2`

Use the connected GitHub tool first. Fetch live `main`, PR #115 exact head/state, exact-head workflow runs, submitted reviews, inline review threads and mergeability before acting. The pre-packaging green head above is evidence only; the final publication authority is the later transition-prepared sealed head.

Initial reads only:

1. `SESSION_BOOTSTRAP.json`
2. `REMOTE_JOINING_READINESS.json`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `firebase.production.environment.json`
5. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`

Expand to this full handoff, `NEXT_TASK.md`, runtime source and exact failed-job logs only when the compact packet or live state requires it.

## Standing owner merge/deploy authorization

On 2026-08-20 the owner granted project-wide standing authorization through full project completion: once a PR passes every required test and current mandatory publication gate, current and future developers may merge and deploy it without requesting a new owner confirmation.

For PR #115, after the final immutable transition-prepared sealed head passes the full exact-head gate, mark ready if required, squash-merge with expected-head protection, independently verify resulting live `main`, and complete applicable deployment verification without asking again.

This authorization does not waive exact-head CI, clean submitted reviews, clean inline review threads, mergeability, expected-head protection, deployment proof, WEC, versioning, security/recovery guarantees or current implementation scope.

Permanent provenance:

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`
`authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md`

## PR #115 purpose

PR #115 is the smallest direct post-PR #114 Remote Joining prerequisite. It connects only Firebase App + Firebase App Check to the shipped production-origin client through controlled public runtime configuration while preserving local/offline-first operation.

It advances the whole-shell runtime from `1.4.0-r1` to candidate `1.4.0-r2` while retaining `1.4.0-r1` as the immediate known-good rollback shell until r2 is production-proven.

The milestone intentionally does not initialize Firestore, Firebase Authentication, Storage, Functions or any trusted mutation client service. It does not activate trusted runtime IAM, does not grant browser Firestore writes, does not enable App Check enforcement and does not implement Registered Devices, pairing, Connected Rivalry or Remote Joining UX.

## Runtime implementation truth

Key files:

`js/productionFirebaseRuntime.js`
`js/productionAppCheckBootstrap.js`
`firebase.runtime-config.json`
`scripts/render-production-firebase-public-config.mjs`
`tests/contracts/production-app-check-runtime-contracts.cjs`
`tests/contracts/production-app-check-bootstrap-contracts.cjs`
`RELEASE_V1.4.0_R2.md`
`CAREER_MODE_SHOWDOWN_V1.4.0_R2_MAINTENANCE_HANDOFF.md`

The candidate runtime:

* starts the local Career Mode Showdown shell first and initializes production Firebase/App Check lazily afterward;
* permits the Firebase path only on exact origin `https://nikahanghojjati-oss.github.io` and the `/fifa17-career-showdown2/` path while online;
* fetches controlled runtime configuration only after the production gate;
* keeps tracked `firebase.runtime-config.json` fail-closed with `configured:false`, no concrete Firebase Web API key and an empty reCAPTCHA Enterprise site key;
* uses `scripts/render-production-firebase-public-config.mjs` to render browser-public provider values from `CMS_FIREBASE_WEB_API_KEY` and `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` without printing them;
* loads the already-proven App Check bootstrap on demand rather than making it an offline startup dependency;
* pins Firebase browser modules to SDK `12.17.0` for Firebase App + App Check only;
* initializes Firebase App before App Check;
* uses `ReCaptchaEnterpriseProvider`, token auto-refresh and `getToken(..., false)` to produce legitimate App Check traffic without exposing the raw token to diagnostics;
* returns safely to local mode if offline, runtime config is missing/invalid, bootstrap loading fails, SDK loading fails or provider token acquisition fails;
* contains no production debug App Check provider path;
* leaves App Check enforcement OFF;
* initializes no Firestore/Auth/Storage/Functions client service and grants no trusted mutation authority.

Service Worker/runtime-shell behavior is deliberate: `js/productionFirebaseRuntime.js` is part of the r2 whole-shell cache so local startup can reference the lazy loader, while mutable `firebase.runtime-config.json` and on-demand `js/productionAppCheckBootstrap.js` are not Service Worker startup dependencies. Firebase/provider unavailability must never block canonical local storage, recovery or offline gameplay.

## Production provider truth at this handoff

Production Firebase project: `fifa17-career-showdown-prod`
Web App ID: `1:409396353288:web:1d3a2a5d6921de6ccbb4bd`
Auth domain: `fifa17-career-showdown-prod.firebaseapp.com`
Firestore database: `(default)` Standard, location `nam7`

Production Firestore Security Rules remain provider-verified deployed from canonical `firestore.rules`; every application-client Firestore create/update/delete remains deny-all.

Google Authentication provider is enabled and the production authorized-domain set excludes localhost.

Firebase App Check is provider-registered for the production Web App with reCAPTCHA Enterprise, one-hour token TTL, risk threshold `0.5`, and enforcement OFF.

Do not claim production r2 runtime connection merely because PR #115 code exists. Until merge/deployment + controlled public config + real production traffic proof are independently verified, `firebase.production.environment.json` correctly remains production-runtime disconnected and `1.4.0-r1` remains production/rollback authority.

The Firebase Web API key and reCAPTCHA Enterprise site key are browser-public configuration, not authorization secrets, but concrete provider values must not be newly hard-coded into committed source or printed into logs. If a required deployment variable is absent, have the owner enter it directly into the controlled GitHub deployment configuration rather than pasting it into chat or committing it. The exact reCAPTCHA Enterprise site-key value was not available to this environment and must never be invented.

## Pre-packaging exact-head proof

Recorded pre-packaging engineering head: `36debe7511bd4001a17be03b5e3d787559fd032a`

On that unchanged head all 13 normal PR workflow families completed with `success`:

* Validate Static App
* Validate Stability Lane
* Validate Statistics Workstream
* Validate Season Review
* Validate Final Polish
* Validate Transfer Workstream
* Validate Home Bootstrap
* Validate Settings Workstream
* Validate V1 Visual Immersion
* Validate League Confirmation
* Validate Licensed Football Visuals
* Validate Candidate B Import Analysis
* Validate Candidate C Atomic Restore

The Stability Lane contract suite passed, Chromium Stability completed its canonical runtime/Save Library/offline/integration browser journey successfully, and Candidate C completed its authoritative restore/recovery browser audit successfully.

At the same pre-packaging checkpoint:

* submitted PR reviews: none;
* inline review threads: none;
* PR mergeability: true;
* PR state: open draft;
* base: `main` at `7944b87a20cf793c659077d7518c4446f178e32c`.

Packaging and the final WEC seal intentionally move the branch after this head. Never use `36debe...` as final publication authority. Fetch and validate the final sealed exact head.

## Important corrections completed in this environment

The environment encountered a long validation-reconciliation chain. Corrections were source-grounded and did not relax runtime/security boundaries:

* historical Stage 2A through 2I contracts were separated from current PR #115 authority so old emulator/dormant checkpoints no longer falsely freeze the current r2 shell;
* Stage 2H least-privilege IAM proof remains exact and unbroadened;
* trusted shared mutation gateway, account deletion and connected-data export execution contracts remain release-independent and protected;
* the App Check bootstrap contract was aligned to the actual safer architecture: production runtime loader is shell-cached, mutable config and App Check bootstrap stay network/on-demand, and local mode remains independent;
* the r2 runtime contract now proves offline/provider-failure fallback behavior instead of depending only on brittle prose strings;
* release-authority provenance/Markdown mismatches were corrected without changing underlying state;
* `NEXT_TASK.md` again records the permanent validation topology as 14 permanent workflow families — 13 normal PR families plus Stability Lane — and 27 protected workflow blocks;
* RJR remains fixed at 59 and no process/contract cleanup was allowed to inflate it.

For a future CI failure, fetch the exact workflow run, exact job and completed failed-job log before changing code. An attempt to fetch logs from an in-progress job returned a transient 404; use job/step status until the job is complete rather than treating that as product evidence.

## Remote Joining readiness

Numeric authority: `REMOTE_JOINING_READINESS.json`
Model: `RJR-1`
Current evidence-backed readiness at packaging: approximately `59%`

Do not infer readiness from PR count, stage count, WEC, Handoff proximity or visible effort. PR #115 implementation and test success alone do not earn readiness points. Only new verified capability evidence at the required production boundary may move the ledger.

Private Remote Joining remains the highest long-term priority, dependency-gated and stability-first.

## Permanent security/recovery locks

App Check is attestation only. It is not authentication, application authorization, device identity, pairing authority, rivalry/session entitlement, gameplay authority, shared-mutation authority or IAM authority.

Trusted request order remains production-origin defense in depth → transient `X-Firebase-AppCheck` → trusted Admin App Check verification → exact App identity/project audience → revocation-aware Firebase ID token verification → derive `accountId` from verified UID → operation-specific application authorization → trusted operation adapter under separately reviewed IAM.

Stage 2H account-bootstrap IAM proof remains exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Do not silently broaden IAM.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot authority, transaction-owned mutation, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

Exactly two managers remain authoritative.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community, rankings and global leaderboards remain prohibited/eliminated.

## Immediate successor task — finish PR #115 publication only

The successor must initialize its own fresh WEC identity before substantial work. The predecessor's HANDOFF_NOW/transition-prepared state is historical and must not become the successor's decision.

Then finish this same PR #115 milestone in dependency order:

1. fetch PR #115 live and identify the final transition-prepared sealed exact head;
2. verify that the WEC seal is the last branch mutation;
3. require all 13 normal PR workflow families green on that exact unchanged sealed head;
4. re-check submitted reviews, inline review threads and mergeability;
5. use the standing owner authorization to mark ready if required and squash-merge with expected-head protection;
6. independently verify resulting live `main`;
7. verify deployed public site/runtime identity is `1.4.0-r2` and `1.4.0-r1` remains the rollback target;
8. deliver the two browser-public Firebase/App Check provider values through the controlled deployment configuration path, not committed source/logs;
9. prove legitimate production App Check token traffic while enforcement remains OFF;
10. verify local/offline operation remains healthy and every application-client Firestore create/update/delete remains deny-all;
11. only after genuine production evidence exists, update `firebase.production.environment.json`, production proof/release authority and `REMOTE_JOINING_READINESS.json` if and only if RJR-1 evidence criteria actually award capability points.

Do not enable App Check enforcement merely because token traffic exists. Enforcement is a later separately reviewed gate after healthy legitimate traffic is observed.

Do not begin Stage 3 Registered Devices / Private Pairing until remaining genuine Stage 2 production/account/operational trust and IAM activation/hardening prerequisites are DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

## Dependency order after PR #115 production proof

Remaining genuine Stage 2 production/operational trust/IAM activation and hardening
→ Stage 3 Registered Devices / Private Pairing
→ Stage 4 Connected Rivalry
→ Stage 5 Private Remote Joining
→ real-device hardening
→ stable release.

Do not create a documentation-only sidequest between these dependencies unless an objective blocker requires it.

## WEC and owner reporting

Every substantive owner-facing development checkpoint keeps exactly:

`Handoff proximity: X%`
`Remote Joining readiness: ~Y%`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

Handoff proximity is WEC transition proximity, not task completion. RJR is independent and comes only from `REMOTE_JOINING_READINESS.json`. Never fabricate hidden usage.

This predecessor environment reached mandatory transition because accumulated corrected validation defects/reliability evidence made a fresh successor safer even though the final engineering checkpoint was clean. At Handoff proximity 100%, stop before beginning another substantial milestone.

## SLE package

Newest starter: `START_NEXT_SESSION_V1.3.1_PR115.md`
Mirror: `project-documents/session-starts/START_NEXT_SESSION_V1.3.1_PR115.md`

Handoff root/mirror must remain byte-identical:

`SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md`
`project-documents/handoffs/SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md`

`SESSION_BOOTSTRAP.json` is the compact capsule. `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` remain progressive fallback context, not mandatory preload.

## Clean stop

This predecessor must stop after the final transition-prepared WEC seal is the last PR-branch mutation and that sealed exact head is validated. Do not merge/deploy or begin a separate Stage 2/Stage 3 milestone in this predecessor environment. The fresh successor owns final PR #115 publication/deployment/production-traffic proof under the standing owner authorization.
