# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #114

Treat this handoff as orientation only. Current source, live GitHub/provider state, WEC, security/recovery contracts and later owner instructions override recorded facts.

## Fast startup

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
PR #114 branch: `agent/pr114-app-check-bootstrap`
Recorded pre-SLE live main: `1ccf2d3f451ea53575698877787562e38f1d6f50` after PR #113
Application/package: `1.4.0`
Runtime: `1.4.0-r1`

Use connected GitHub first. Fetch live `main`, PR #114 exact head/state, exact-head workflows, submitted reviews, inline review threads and mergeability. Do not preload full history.

Initial reads only:

1. `SESSION_BOOTSTRAP.json`
2. `REMOTE_JOINING_READINESS.json`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `firebase.production.environment.json`
5. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`

Use this complete handoff only when the compact packet cannot resolve a discrepancy, CI failure, security/recovery question or WEC transition issue.

## Standing owner merge/deploy authorization

On 2026-08-20 the owner granted project-wide standing authorization through full project completion: once a PR passes every required test and current mandatory publication gate, current and future developers may merge and deploy it without requesting a new owner confirmation.

This later instruction supersedes PR #114's earlier draft-only/no-merge limitation. After the final immutable sealed PR #114 head passes its full gate, mark ready if needed, squash-merge with expected-head protection, independently verify resulting live `main`, and complete applicable deployment verification without asking again.

The standing authorization does not waive exact-head CI, clean reviews/threads, mergeability, expected-head protection, deployment proof when applicable, WEC, versioning, security/recovery guarantees or current implementation scope.

Permanent provenance:

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`
`authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md`

## PR #114 purpose and production truth

PR #114 records owner-verified production Firebase App Check registration and adds a dormant controlled bootstrap. It does not load Firebase/App Check into the shipped website runtime and does not warrant an application/runtime version bump.

Provider truth proved by owner screenshots on 2026-08-20:

* production project `fifa17-career-showdown-prod`;
* reCAPTCHA Enterprise API enabled;
* production Web key restricted to `nikahanghojjati-oss.github.io`;
* Firebase Web App registered with App Check using reCAPTCHA Enterprise;
* token TTL one hour;
* app-risk threshold `0.5`;
* registration status successful/Registered;
* App Check enforcement remains OFF.

Production Firestore Security Rules remain provider-verified deployed from canonical `firestore.rules`. Every application-client Firestore create/update/delete remains deny-all.

Production Firebase runtime remains disconnected. App Check client/runtime bootstrap remains disconnected. Trusted runtime IAM remains unactivated.

## PR #114 implementation

`firebase.production.environment.json` records provider-verified App Check registration while preserving enforcement OFF, runtime disconnected, trusted runtime IAM unactivated and browser writes deny-all.

`js/productionAppCheckBootstrap.js` is dormant and absent from `index.html`, `js/optionalModules.js` and `service-worker.js`. It locks exact production origin/project/App identity, reCAPTCHA Enterprise, one-hour TTL/0.5 risk policy, no production debug path, no premature enforcement, controlled public-config injection, `initializeApp` before `initializeAppCheck`, `ReCaptchaEnterpriseProvider`, token auto-refresh, no Firestore initialization and no browser trusted-mutation authority.

The concrete Firebase Web API key and reCAPTCHA Enterprise site key must continue to follow controlled public-config delivery rather than being newly hard-coded into committed runtime source.

## Exact-head proof and repairs

The pre-SLE engineering head `30ea11102840ad84352c3402f52af107fde1935c` passed all 13 normal PR workflow families, with clean reviews, clean threads and mergeability. Later SLE/WEC packaging intentionally moved the branch, so that old head is not publication authority.

The valid final gate is the final sealed exact head only:

1. all 13 normal workflow families green on one unchanged head;
2. submitted reviews clean;
3. inline review threads clean;
4. mergeability clean;
5. final transition-prepared WEC seal is the last PR-branch mutation;
6. no later branch mutation;
7. then use standing authorization to merge/deploy.

Known objective repairs from this environment:

* an RJR reporting regex accidentally required an extra literal `not`; fixed without weakening meaning;
* App Check module helper names collided globally with existing JS helpers; exact Stability job logs identified the collision and helpers were uniquely renamed;
* legacy continuity contracts incorrectly allowed successor divergence only while `active`; they were corrected to permit legitimate `transition-prepared` closure only with 100% handoff completeness.

For any CI failure, fetch the exact run, jobs and failed job log before changing code. Do not guess from workflow name.

## Remote Joining readiness

Numeric authority: `REMOTE_JOINING_READINESS.json`
Model: `RJR-1`
Current evidence-backed readiness: approximately `59%`

Do not infer readiness from PR count, roadmap stage count, WEC, Handoff proximity or visible effort. Provider App Check registration earned the reconstructed move to 59%; dormant bootstrap/SLE packaging alone earns no additional point because legitimate production App Check traffic is not yet proven.

Private Remote Joining remains the highest long-term priority, dependency-gated and stability-first.

## Permanent security/recovery locks

App Check is attestation only. It is not authentication, application authorization, pairing authority, rivalry entitlement, gameplay authority, shared-mutation authority or IAM authority.

Trusted request order remains production-origin defense in depth → transient `X-Firebase-AppCheck` → trusted Admin App Check verification → exact App identity/project audience → revocation-aware Firebase ID token verification → derive `accountId` from verified UID → operation-specific application authorization → trusted operation adapter under separately reviewed IAM.

Stage 2H bootstrap IAM proof remains exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

Do not silently broaden IAM.

Canonical browser storage remains exactly:

`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community, rankings and global leaderboards remain prohibited/eliminated.

Exactly two managers remain authoritative.

## Dependency order after PR #114

After PR #114 is merged and live-main is verified, the next substantive dependency is controlled production Firebase/App Check runtime-config delivery and legitimate App Check traffic proof while enforcement remains OFF.

Then continue only the genuine remaining Stage 2 production/operational trust/IAM prerequisites → Stage 3 Registered Devices / Private Pairing → Stage 4 Connected Rivalry → Stage 5 Private Remote Joining → real-device hardening → stable release.

Stage 3 remains blocked at this checkpoint.

Do not jump directly to App Check enforcement. First initialize the legitimate production client before protected Firebase services, keep token auto-refresh on, keep debug provider off, observe legitimate verified traffic, and only then evaluate service-specific enforcement.

## WEC and reporting

Every substantive owner-facing development checkpoint keeps exactly:

`Handoff proximity: X%`
`Remote Joining readiness: ~Y%`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

At Handoff proximity 100%, finish only the current safe boundary, generate the successor package and stop before a new substantial milestone. The successor must initialize its own fresh WEC identity; never inherit the predecessor transition decision as its own. Never fabricate hidden usage.

## SLE package

Newest starter: `START_NEXT_SESSION_V1.3.0_PR114.md`
Mirror: `project-documents/session-starts/START_NEXT_SESSION_V1.3.0_PR114.md`

Handoff root/mirror must remain byte-identical:

`SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md`
`project-documents/handoffs/SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md`

`SESSION_BOOTSTRAP.json` is the compact capsule. `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` are progressive fallback context, not mandatory preload.

`NEXT_TASK.md` still contains stale PR #108-era current-heading prose. Current live source, later owner instructions, PR #109–#114 provider work, WEC and this SLE packet supersede it. Do not create a documentation-only repair milestone; reconcile it naturally inside substantive authorized work.

## Clean stop

This environment closes only after the final WEC seal is the last PR-branch mutation and the sealed exact head passes all required PR #114 gates. Then use the standing owner authorization to merge/deploy. Do not begin the next runtime-config/App Check traffic milestone inside this inherited WEC=100 environment; that begins under a fresh successor WEC.
