# FIFA 17 Career Mode Showdown — Successor Handoff — PR #116 Production App Check Deployment Proof

===== BEGIN READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====

Treat this handoff as orientation, never as implementation authority. Current source, live GitHub state, the deployed website and later owner instructions override every recorded SHA, PR state, workflow result, deployment claim and historical statement.

## Project

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Prior environment: `we-2026-08-20-pr115-production-deployment-proof`

Application version: `1.4.0`

Current production / rollback runtime: `1.4.0-r1`

Current candidate runtime: `1.4.0-r2`

Remote Joining readiness model: `RJR-1`

Recorded RJR score at handoff packaging: `59/100`

## Mandatory startup

1. Independently fetch live `main`, recent commits, tags/releases, open PRs, active branches and current CI before trusting any SHA in this handoff.
2. Independently fetch PR #116 and its exact current head, changed files, draft/readiness state, mergeability, submitted reviews and inline review threads.
3. Read completely: `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `REMOTE_JOINING_READINESS.json`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2H.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2I.md`, `firebase.production.environment.json`, `firebase.runtime-config.json`, `.github/workflows/deploy-github-pages.yml`, `scripts/render-production-firebase-public-config.mjs`, `js/productionFirebaseRuntime.js`, `js/productionAppCheckBootstrap.js` and the PR #116 deployment/runtime contracts.
4. Validate predecessor facts, then initialize a fresh successor WEC. Do not inherit the predecessor transition decision as your own decision. Reset successor counters and run your own assessment before substantial work.
5. Never ask the owner to reconstruct prior chats. Source and live GitHub are authority.
6. Never fabricate usage. If model/account usage is unavailable, record it as unknown.

## Live and merged boundary inherited by this environment

PR #115 `Connect production App Check runtime safely` was independently verified at final sealed head `0ce83bc1b58cb40cf5b766dd76addfd4d00eecb2` with all 13 normal workflow families successful, zero submitted reviews, zero inline review threads and mergeability true. It was marked ready and expected-head squash merged.

Recorded live-main merge boundary after PR #115: `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`.

Important continuity fact: the successor WEC should have been initialized before PR #115 publication. The prior environment instead completed the already-green expected-head merge first and then corrected the sequencing deviation before any further provider/source milestone mutation. Preserve this fact; do not rewrite history to hide it.

PR #115 source merge did not make `1.4.0-r2` production-proven. Tracked `firebase.runtime-config.json` intentionally remains fail-closed and legitimate production App Check traffic has not yet been proven.

## Current PR #116

Title: `Add controlled GitHub Pages App Check deployment`

Branch: `agent/pr115-production-deployment-proof`

Base: `main`

Base SHA recorded during this environment: `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`

Pre-packaging fully green engineering head: `9111b8930dfdcc2d7f69c354946f5879d00d382d`

On `9111b8930dfdcc2d7f69c354946f5879d00d382d`, all 13 normal pull-request workflow families completed successfully. Static passed the complete repository contract suite, Firebase Auth/Firestore emulator proofs and protected validation topology. Stability contracts and Chromium Stability passed. Candidate B and Candidate C browser evidence passed. Licensed Football Visual browser evidence passed. Reviews and inline threads were empty and PR mergeability was true when checked.

Do not treat `9111b893...` as the final sealed head. Handoff packaging and the final WEC seal occur after it. The successor must re-fetch the exact PR head from GitHub and verify `WORK_ENVIRONMENT_STATUS.json` states the final seal.

## What PR #116 adds

`.github/workflows/deploy-github-pages.yml`

The workflow:

- deploys through GitHub Pages rather than Firebase Hosting;
- uses `contents: read`, `pages: write` and `id-token: write` only;
- consumes repository Actions variables `CMS_FIREBASE_WEB_API_KEY` and `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY`;
- fails closed before rendering if either variable is absent;
- never prints the concrete provider values;
- stages only the static runtime surface into an ephemeral Pages artifact;
- runs the existing `scripts/render-production-firebase-public-config.mjs` only inside that artifact;
- verifies the rendered config shape without printing provider values;
- removes the copied renderer before artifact upload;
- does not commit generated runtime configuration back to repository history;
- does not initialize Firebase Hosting or additional Firebase client services.

`tests/contracts/production-pages-app-check-deployment-contracts.cjs`

The permanent contract proves the deployment boundary, including execution of the renderer with synthetic values and verification that stdout does not expose those values.

`tests/support/run-contract-suite.cjs`

Registers the Pages deployment contract in the permanent repository contract suite.

`.github/workflows/validate-static-app.yml` and `tests/support/run-workflow-blocks.cjs`

Preserve the protected validation topology by accounting for the production Pages deployment workflow separately from validation execution. Current authority wording is 14 permanent validation workflow families: 13 normal PR validation workflows plus the separately-owned Stability Lane, with exactly 27 protected literal validation blocks. The Pages deployment workflow is operational infrastructure and is outside those validation-family / 27-block counts.

Authority/provenance contracts were also updated narrowly so current PR #116 authority can coexist with exact historical PR #115 / Stage 2 provenance without weakening security boundaries.

## Diagnostic failures and corrections inside PR #116

Do not repeat these investigations unless live source invalidates them.

1. Fresh-successor interruption-resilience contract had frozen inherited `HANDOFF_AT_CHECKPOINT`; actual predecessor decision was `HANDOFF_NOW`. The contract now requires an explicit inherited non-CONTINUE predecessor decision rather than one hard-coded value.
2. Stage 2I boundary had frozen the predecessor WEC identity and pre-PR #115 starting main. It now accepts only the original predecessor or a verified fresh successor rooted at the exact PR #115 merge boundary, while preserving all Stage 2I/App Check/IAM locks.
3. Static topology initially counted the three operational Pages workflow shell blocks, producing 30 instead of the protected 27 validation blocks. Pages deployment is now explicitly excluded from validation topology and required separately.
4. After current-authority synchronization, Stage 2B and Stage 2C contracts still expected the old PR #115 current-authority heading. They were updated only to distinguish current PR #116 authority from preserved historical PR #115 evidence.
5. Older Stage 2D and later provenance contracts expected the exact historical PR #115 heading and exact historical no-IAM sentence. `NEXT_TASK.md` preserves those strings inside explicitly historical provenance while current authority remains PR #116.
6. Release-authority checks required the established `14 permanent workflow families` / `27 protected` wording. Current authority now states that accurately while accounting for Pages separately.
7. Historical Phase B and Phase C labels were restored exactly: `Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70)` and `Phase C first slice — Showdown Home & Season Experience deepening (PR #73)`.

These were source-coherence/provenance defects. They did not reveal a production App Check, Firebase, recovery, RJR or browser-write security failure.

## Remote Joining readiness truth

RJR-1 uses a fixed 100-point denominator and is capability/evidence based. It must not move because of PR count, roadmap stage count, documentation, CI volume, WEC progress or handoff proximity.

Recorded score: `59/100`.

Domain breakdown:

- deterministic sync and recovery: `20/20`
- identity, authentication and trust: `17/20`
- production cloud and security: `15/20`
- devices, private pairing, Connected Rivalry and actual Remote Joining: `4/30`
- real-device hardening and stable-release proof: `3/10`

Remaining 41 points therefore consist of 3 identity/trust points, 5 production-cloud/security points, 26 devices/pairing/Connected Rivalry/Remote Joining points and 7 real-device hardening/release points.

The current score of 59 is not a current scoring bug. `tests/contracts/remote-joining-readiness-contracts.cjs` independently calculates 59 and protects the fixed denominator against the earlier historical denominator-drift class of error. `tests/contracts/rjr-reporting-authority-contracts.cjs` keeps owner reporting tied to `REMOTE_JOINING_READINESS.json`.

PR #116 source/CI alone earns no RJR points. Some production-cloud/security credit may become eligible only after the controlled deployment and legitimate production App Check traffic are actually proven. The much larger future movement is expected only when registered-device lifecycle, private pairing, production Connected Rivalry, a real remote-manager join and two-real-device hardening/release evidence are actually implemented and proven. Do not invent a future point delta before evidence maps to the ledger criteria.

If future genuine capability proof satisfies a ledger criterion but `REMOTE_JOINING_READINESS.json` fails to award the corresponding earned points, that would be a scoring defect and should be fixed. The current 59 is evidence-consistent.

## Security and product locks

- App Check enforcement remains OFF until legitimate healthy production traffic is observed and a later separately reviewed enforcement gate authorizes enforcement.
- App Check is application attestation only. It is not account authentication, application authorization, device identity, pairing authority, rivalry/session authority, gameplay authority, shared mutation authority or IAM authority.
- Every application-client Firestore create/update/delete remains deny-all.
- Do not initialize Firestore, Firebase Authentication, Storage or Functions in the PR #116 client milestone.
- Stage 2H account-bootstrap custom-role permissions remain exactly `firebaseauth.users.get`, `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.create`. PR #115 / PR #116 do not activate or broaden that IAM boundary.
- Canonical browser storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. `activeShowdown` is not canonical.
- Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot / transaction-owned mutation / stale guards / ownership-scoped rollback / anti-clobber protection.
- Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community features and global leaderboards/rankings remain prohibited/eliminated.
- Stage 3 Registered Devices / Private Pairing remains blocked until genuine remaining Stage 2 production/account/operational trust and IAM prerequisites are DONE / MERGED / PROVEN.
- Connected Rivalry and actual Private Remote Joining remain downstream and are not authorized by PR #116.

## Owner-controlled production configuration blocker

The connected GitHub app available in the prior environment could mutate repository source and PR state but did not expose repository Actions-variable / Pages-source settings. The local container had no usable authenticated GitHub network/checkout route. Therefore the owner-controlled GitHub settings step remains intentionally external to repository source.

Before PR #116 is merged/deployed, the owner must use the repository GitHub UI to:

1. configure GitHub Pages to deploy through GitHub Actions if it is not already configured that way;
2. enter repository Actions variable `CMS_FIREBASE_WEB_API_KEY` directly in the controlled GitHub UI;
3. enter repository Actions variable `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` directly in the controlled GitHub UI.

Never ask the owner to paste either concrete provider value into chat. Never invent the reCAPTCHA Enterprise site key. These values are browser-public configuration rather than authorization secrets, but repository source/history and workflow logs must not newly disclose them.

## Immediate successor task

First, independently verify the final sealed PR #116 head after this handoff package and the final `WORK_ENVIRONMENT_STATUS.json` seal. Confirm all 13 normal workflow families are success on that exact sealed head, reviews and inline threads are clean, mergeability is clean, and the final WEC seal is the last branch mutation.

If the owner-controlled Pages/Actions-variable settings are not yet configured, stop publication and give the owner precise UI instructions to configure them. Do not merge first.

After the settings are confirmed, re-fetch PR #116 to ensure its head did not mutate. Under standing owner authorization, if and only if the exact sealed head remains fully green, review/thread/mergeability gates remain clean and the configured deployment prerequisites are present, mark the PR ready if still draft and expected-head squash merge it.

Then independently verify resulting live `main`, GitHub Pages deployment and `1.4.0-r2` runtime. Prove legitimate production App Check token traffic while enforcement remains OFF. Verify local/offline startup, canonical recovery behavior and the `1.4.0-r1` rollback boundary remain healthy. Verify application-client Firestore writes remain deny-all and no unauthorized Firebase client service or IAM authority was introduced.

Only after genuine production evidence exists should `firebase.production.environment.json`, production release authority and RJR be updated. Increase RJR only when the fixed RJR-1 evidence criteria actually award capability points.

After the PR #115 / PR #116 production App Check proof is truly DONE / MERGED / PROVEN, initialize/reassess WEC before selecting the next remaining Stage 2 prerequisite. Do not jump directly into Stage 3 or Remote Joining UX merely because this handoff exists.

## MANDATORY HANDOFF PROXIMITY RULE

Every substantive owner-facing project response must visibly include `Handoff proximity: X%`.

Handoff proximity estimates Work Environment transition proximity, not product completion or RJR. Base it on observable continuity evidence and do not mechanically increase it after every response.

Never fabricate account/model usage to calculate Handoff proximity. If usage is unavailable, use only observable continuity evidence and keep usage unknown.

At `Handoff proximity: 100%`, automatically generate the complete successor handoff, finish only the current safe bounded checkpoint and stop before beginning another substantial milestone.

WEC remains authoritative when it requires an earlier or stricter transition. Handoff proximity never weakens a WEC decision.

Every successor handoff must recursively preserve this same Handoff Proximity rule unless the owner explicitly changes it.

## Standing anti-sidequest rule

Private Remote Joining remains the owner-prioritized long-term direction. Work on prerequisites that genuinely unlock it in dependency order. Do not turn continuity, documentation, tooling or unrelated optional cleanup into self-perpetuating milestones. Finish necessary side work, return to the roadmap lane and measure RJR only by capability proof.

===== END READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====
