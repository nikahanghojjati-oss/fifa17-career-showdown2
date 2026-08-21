# FIFA 17 Career Mode Showdown — Successor Handoff — PR #116 App Check Deployment Boundary

Date: 2026-08-20 ET

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Current branch: `agent/pr115-production-deployment-proof`

Current pull request: #116 `Add controlled GitHub Pages App Check deployment`

Starting independently verified live main for this environment: `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`

Application version: `v1.4.0`

Current production / rollback runtime authority: `1.4.0-r1`

Candidate runtime: `1.4.0-r2`

Current environment: `we-2026-08-20-pr115-production-deployment-proof`

Pre-handoff fully green PR #116 engineering/authority checkpoint: `9111b8930dfdcc2d7f69c354946f5879d00d382d`

Remote Joining readiness model: `RJR-1`

Remote Joining readiness at this handoff: `59/100`

## Orientation rule

Treat this handoff as orientation, never as implementation authority. Current source, current GitHub state, deployed production, `NEXT_TASK.md`, `PROJECT_STATE.md`, Work Environment Continuity records and later owner instructions override every recorded SHA, status or statement here.

The successor must independently fetch live `main`, PR #116, its exact head, changed files, all workflow runs, reviews, review threads, mergeability and the deployed site before mutating anything.

## Owner direction that remains controlling

Private Remote Joining is the highest long-term roadmap priority, but it must be reached through stable dependency order. Do not rush into pairing, Connected Rivalry or Remote Joining UX before their prerequisites are actually production-proven.

Do not let continuity, documentation, process cleanup or unrelated optional work become a self-perpetuating side quest. Finish only the currently necessary prerequisite, then continue the roadmap toward Private Remote Joining.

Public community, public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, global leaderboard and public rankings remain eliminated/prohibited.

Version changes must remain meaningful: PATCH for fixes/hardening, MINOR for features, MAJOR for breaking changes. Runtime `rN` revisions do not substitute for application semantic versioning.

## Handoff Proximity rule — mandatory and recursive

Every substantive owner-facing development checkpoint must visibly report:

`Handoff proximity: X%`

It must also report the current Remote Joining readiness score.

Handoff proximity is an evidence-based Work Environment Continuity signal, not task completion. Never fabricate model/account usage. If approved usage information is unavailable, keep `usageRemainingPercent` null / `usageSource: unavailable` and base Handoff proximity only on observable continuity evidence.

At `Handoff proximity: 100%`, automatically generate a complete successor handoff, finish only the current safe bounded checkpoint and stop before starting another substantial milestone.

WEC decisions such as `PREPARE_HANDOFF`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW` and `FINISH_SAFE_BOUNDARY` always take precedence over a weaker Handoff proximity interpretation.

Every future handoff must preserve this rule recursively.

## Live history immediately before this handoff

PR #114 `Record production App Check registration and add controlled bootstrap` is DONE / MERGED / PROVEN at live main `7944b87a20cf793c659077d7518c4446f178e32c`.

Provider evidence established the real production Web App App Check registration with reCAPTCHA Enterprise, one-hour token TTL, risk threshold `0.5`, production GitHub Pages host and enforcement OFF.

PR #115 `Connect production App Check runtime safely` is DONE / MERGED AS SOURCE at live main `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`.

PR #115 final sealed head before merge: `0ce83bc1b58cb40cf5b766dd76addfd4d00eecb2`.

That exact PR #115 head passed all 13 normal workflow families, with zero submitted reviews, zero inline review threads and clean mergeability before expected-head squash merge.

PR #115 connected only Firebase App + App Check to the optional production-origin client runtime. It did not initialize Firestore, Firebase Authentication, Storage or Functions and did not grant browser writes, trusted mutation authority or IAM authority.

PR #115 alone did not make `1.4.0-r2` production-proven because committed `firebase.runtime-config.json` correctly remains fail-closed and production App Check token traffic has not yet been proven.

## Why PR #116 exists

The repository already had `scripts/render-production-firebase-public-config.mjs`, but there was no proven GitHub Pages deployment path that consumed controlled deployment values and rendered `firebase.runtime-config.json` only inside the deployed artifact.

PR #116 fills that exact production deployment gap without committing provider-issued browser configuration to source history.

This is completion of the same PR #115 / `1.4.0-r2` production App Check proof. It is not Stage 3, Connected Rivalry or Remote Joining UX.

## PR #116 implementation

PR #116 adds `.github/workflows/deploy-github-pages.yml`.

The workflow:

1. triggers on `main` push and manual `workflow_dispatch`;
2. uses only `contents: read`, `pages: write` and `id-token: write` permissions;
3. requires controlled repository Actions variables named `CMS_FIREBASE_WEB_API_KEY` and `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY`;
4. fails closed if either variable is missing;
5. stages only the static production runtime surface into `.pages-artifact`;
6. copies the existing renderer into that temporary artifact workspace;
7. runs the renderer only inside the deployment artifact;
8. verifies the resulting configuration shape without printing provider values;
9. removes the copied renderer before artifact upload;
10. uploads through `actions/upload-pages-artifact@v4`;
11. deploys through `actions/deploy-pages@v4` with the `github-pages` environment;
12. performs no `git add`, `git commit` or `git push`;
13. introduces no Firebase Hosting path.

The tracked source file `firebase.runtime-config.json` remains `configured:false` and contains no concrete Firebase Browser API key or reCAPTCHA Enterprise site key.

The two values are browser-public provider configuration, not authorization secrets, but they must still be supplied through the controlled GitHub deployment path rather than newly hard-coded into committed source or printed in logs.

Never ask the owner to paste those concrete values into chat. The owner must enter them directly into the repository Actions variables UI.

## Permanent deployment proof

PR #116 adds `tests/contracts/production-pages-app-check-deployment-contracts.cjs` and registers it in `tests/support/run-contract-suite.cjs`.

The contract proves:

- the required Pages/OIDC permissions;
- use of the two repository variables;
- absence of a secret-variable substitution path for these browser-public values;
- fail-closed behavior when values are absent;
- no logging of provider values;
- no Firebase Hosting;
- no Git repository mutation from deployment;
- tracked source remains fail-closed;
- the renderer executes successfully with synthetic provider values;
- synthetic values are not echoed to stdout;
- generated deployment config becomes `configured:true` only inside the synthetic artifact execution.

## Protected validation topology

The protected validation topology remains 14 permanent validation workflow families: the 13 normal PR validation workflows plus the separately-owned Stability Lane.

Those validation families retain exactly 27 protected literal executable shell blocks.

The new production Pages deployment workflow is separate operational deployment infrastructure and is excluded from the validation-family and 27-block counts.

`tests/support/run-workflow-blocks.cjs` and Static validation now account for this separation explicitly.

## Pre-handoff fully green proof

Exact PR #116 head `9111b8930dfdcc2d7f69c354946f5879d00d382d` completed all 13 normal PR workflow families successfully:

- Validate Static App
- Validate Stability Lane
- Validate Candidate B Import Analysis
- Validate Candidate C Atomic Restore
- Validate Licensed Football Visuals
- Validate Settings Workstream
- Validate League Confirmation
- Validate Transfer Workstream
- Validate Statistics Workstream
- Validate Final Polish
- Validate V1 Visual Immersion
- Validate Home Bootstrap
- Validate Season Review

Static on that exact head passed JavaScript syntax, dynamic static release architecture, the complete permanent repository contract suite, all Firebase Auth/Firestore emulator proofs and the protected workflow topology.

Candidate C contract and browser restore/recovery audits passed.

Stability contract and Chromium complete integration journey passed.

At the pre-handoff checkpoint, PR #116 had zero submitted reviews, zero inline review threads and `mergeable=true`.

This pre-handoff head is evidence only. The creation of this handoff file and the later final WEC seal necessarily supersede it as the exact branch head. The successor must rely on the final sealed head recorded in `WORK_ENVIRONMENT_STATUS.json`, not merge `9111...` merely because it was green.

## Diagnostic failure history — preserve it; do not rewrite history

PR #116 intentionally used diagnostic CI to expose source-coherence defects. The meaningful failures were corrected narrowly rather than weakening runtime/security protections.

1. A Work Environment interruption-resilience contract froze inherited predecessor decision `HANDOFF_AT_CHECKPOINT` even though the real predecessor decision was `HANDOFF_NOW`. It was generalized to require an explicitly inherited non-`CONTINUE` predecessor decision while preserving fresh-successor separation.

2. A Stage 2I boundary contract froze predecessor WEC identity and pre-PR #115 starting main. It was narrowed so only the historical predecessor or a verified fresh successor rooted at exact PR #115 merge main can pass, with inherited `HANDOFF_NOW` evidence required.

3. Static topology counted the new Pages workflow's three operational shell blocks and reported 30 instead of the protected 27 validation blocks. The fix excluded production deployment from validation topology while explicitly requiring the deployment workflow to exist.

4. After current authority moved from PR #115 to PR #116, older Stage 2B and Stage 2C contracts still froze the obsolete PR #115 current-authority heading. Those assertions were updated to recognize explicit PR #116 deployment-proof authority while preserving all substantive provider lifecycle, Auth, IAM, deny-all and Stage 3 locks.

5. The trusted connected-data export boundary still required the exact historical sentence `PR #115 adds no IAM permission and no trusted mutation authority`. Current source now preserves that historical sentence separately while also stating the stronger current truth that PR #115 and PR #116 add no IAM permission and no trusted mutation authority.

6. Historical Phase B/Phase C wording in `NEXT_TASK.md` drifted from exact executable provenance strings. The final source restores `Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70)` and `Phase C first slice — Showdown Home & Season Experience deepening (PR #73)` without altering product/runtime behavior.

7. One attempted GitHub connector fetch used the wrong Static workflow filename and returned 404. It was corrected without mutation.

8. The connector does not expose repository Actions-variable/secret or Pages-settings mutation. Local rootless `gh` bootstrap could not be used in this environment because there is no repository checkout and direct GitHub network/DNS is unavailable. No connector credential was copied or repurposed.

9. The fresh successor WEC should have been initialized before PR #115 publication. This environment first completed the already-green expected-head PR #115 squash merge, then recorded and corrected that sequencing deviation before any further provider/source milestone mutation. Preserve this fact instead of rewriting history.

## Security locks that must not regress

App Check enforcement remains OFF until healthy legitimate production traffic is observed and a separately reviewed enforcement gate is authorized.

App Check is application attestation only. It is not Firebase Authentication, Career Mode Showdown application authorization, device identity, pairing authority, invite authority, rivalry/session authority, gameplay authority, shared mutation authority or IAM authority.

Every application-client Firestore create/update/delete remains deny-all.

Do not initialize Firestore, Firebase Authentication, Storage or Functions in this PR #116 milestone.

Do not activate or broaden Stage 2H trusted-runtime IAM here.

The protected Stage 2H account-bootstrap runtime custom-role permission set remains exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

No production debug App Check provider/token path is allowed.

`1.4.0-r1` remains rollback authority until full `1.4.0-r2` production proof succeeds.

## Local/recovery locks

Canonical browser storage remains exactly:

```text
careerModeShowdown.saveLibrary
careerModeShowdown.legacyShowdowns
careerModeShowdown.preferences
```

`activeShowdown` is not canonical authority.

Candidate A remains non-mutating export.

Candidate B remains read-only import analysis.

Candidate C remains the sole destructive import Apply authority with exact raw snapshot authority, transaction-owned mutation, immutable confirmed intent, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

Remote enablement must not remove local/offline operation or local backup/import portability.

## Remote Joining readiness — why it is 59 and why that is not a bug

`REMOTE_JOINING_READINESS.json` is the machine-readable authority for RJR-1.

RJR-1 uses a fixed 100-point denominator and five fixed capability domains:

- deterministic sync and recovery safety: `20/20`
- identity, authentication, authorization and trust: `17/20`
- production cloud and security activation: `15/20`
- devices, pairing, Connected Rivalry and actual Remote Joining: `4/30`
- real-device hardening and stable release: `3/10`

Total: `59/100`.

This score is intentionally not measured by pull-request count, roadmap-stage count, WEC age, Handoff proximity or number of visible owner actions.

It increases only when new verified evidence materially improves one of the fixed capability domains. It decreases only if previously credited evidence is invalidated or a proven regression removes capability.

Therefore PR #115 merge, PR #116 implementation, green CI, documentation synchronization and WEC sealing do not by themselves justify an RJR increase.

The current PR #116 work can legitimately unlock additional `production-cloud-security` credit only after the controlled deployment is actually running and legitimate production App Check token traffic is proven.

The largest remaining readiness gains intentionally sit later in the roadmap: registered-device lifecycle, private pairing, production Connected Rivalry, an actual remote manager join, two-real-device failure testing, abuse hardening, rollback proof and stable release acceptance.

Do not artificially raise 59 simply because significant infrastructure work was completed. If a successor proves a scored capability but the ledger fails to credit it, that is a scoring defect and must be corrected with an append-only evidence event. Otherwise 59 is the correct current score.

## What is intentionally NOT proven yet

`1.4.0-r2` is not yet production-proven.

The GitHub Pages deployment workflow exists and is contract-proven, but the owner-controlled repository settings required to execute the production configuration path have not been proven in this environment.

Legitimate production App Check token traffic has not been proven.

App Check enforcement must remain OFF.

Production trusted-runtime IAM has not been activated.

Stage 3 Registered Devices / Private Pairing remains blocked.

Connected Rivalry remains downstream.

Actual Private Remote Joining remains downstream.

No RJR score increase is claimed by this handoff.

## Owner-controlled prerequisite before PR #116 publication/deployment

The owner must use the GitHub repository UI, not chat, to establish the reviewed deployment configuration:

1. configure GitHub Pages to use GitHub Actions as its deployment source if it is not already configured that way;
2. create repository Actions variable `CMS_FIREBASE_WEB_API_KEY` with the real production Firebase Web API key;
3. create repository Actions variable `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` with the real production reCAPTCHA Enterprise site key.

Do not commit either concrete value to repository source.

Do not print either concrete value in workflow logs.

Do not ask the owner to paste either value into chat.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Bootstrap/study first:

1. independently fetch live `main` and confirm whether it still equals `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd` or has legitimately advanced;
2. read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `WORK_ENVIRONMENT_STATUS.json`, this handoff and `REMOTE_JOINING_READINESS.json`;
3. inspect PR #116 live metadata, exact final sealed head, changed files, all 13 workflow families, submitted reviews, inline review threads and mergeability;
4. validate the inherited WEC, archive the predecessor final facts to `WORK_ENVIRONMENT_HISTORY.md` as append-only history if the repository protocol requires it at successor activation, then initialize a fresh successor environment with reset counters and its own assessment;
5. independently verify whether GitHub Pages is set to GitHub Actions and whether both required repository Actions variables exist. Do not expose their values in chat or committed source.

Execution after study:

First concrete action: finish the PR #116 production deployment proof only. Do not select or begin another Stage 2 milestone before this production proof is closed.

If the owner-controlled Pages/Actions-variable configuration is present and the final sealed PR #116 head is still unchanged, all 13 normal workflow families are green, reviews/threads are clean and mergeability is clean, use the standing owner authorization to mark the draft ready if needed and perform an expected-head protected squash merge.

Then:

1. independently fetch resulting live `main` and verify the squash merge SHA;
2. verify the GitHub Pages deployment used the reviewed custom Actions workflow;
3. verify public `1.4.0-r2` runtime identity;
4. verify deployed `firebase.runtime-config.json` is configured for the intended production Firebase project without newly exposing provider values in repository history/logs;
5. verify legitimate production App Check token traffic while enforcement remains OFF;
6. verify local/offline startup remains healthy if Firebase/App Check is unavailable;
7. verify `1.4.0-r1` rollback authority remains available until all r2 production gates pass;
8. verify every application-client Firestore create/update/delete remains deny-all;
9. verify no Firestore/Auth/Storage/Functions client initialization or trusted IAM expansion entered this milestone;
10. only after genuine production capability evidence exists, update `firebase.production.environment.json`, release/production authority and `REMOTE_JOINING_READINESS.json` if and only if RJR-1 fixed-domain rules award new capability points.

After PR #115 / PR #116 production App Check proof is fully DONE / MERGED / PROVEN, reassess WEC before selecting the smallest remaining Stage 2 production/operational trust prerequisite. Stage 3 remains blocked until Stage 2 is genuinely complete.

## Publication/merge gate

Do not merge PR #116 merely because this handoff exists.

Publication still requires the final sealed exact PR head to have all 13 normal workflow families green, zero blocking review/thread findings, clean mergeability and the owner-controlled GitHub Pages/Actions-variable configuration in place.

The final WEC seal must be the last branch mutation before that exact-head validation.

## Ready-to-paste successor prompt

You are continuing active development of the FIFA 17 Career Mode Showdown PWA for owner Hawk / nikahanghojjati-oss.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat `SUCCESSOR_HANDOFF_PR116_APP_CHECK_DEPLOYMENT_BOUNDARY_2026-08-20.md` as orientation only. Current source and live GitHub always win.

Start by independently fetching live main, PR #116, exact PR head, changed files, all workflow runs, reviews, review threads, mergeability and deployed production state. Read the mandatory repository authority/WEC files before mutation. Validate the predecessor WEC, append its final facts to canonical history if required by successor activation, initialize a fresh WEC with reset counters, run its own assessment and obey that decision. Never inherit the predecessor's transition decision as your own.

Private Remote Joining is the long-term priority, but do not skip prerequisites. Public discovery/community/matchmaking/invitation-directory/lobby/ranking/global-leaderboard features remain prohibited/eliminated.

Finish only PR #116 / the `1.4.0-r2` production App Check deployment proof first. Do not begin Stage 3, Connected Rivalry or Remote Joining UX until this production proof and remaining Stage 2 prerequisites are genuinely closed.

Do not ask the owner to paste Firebase Web API key or reCAPTCHA Enterprise site key into chat. Verify the owner has entered `CMS_FIREBASE_WEB_API_KEY` and `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` directly into repository Actions variables and that GitHub Pages uses GitHub Actions. Keep App Check enforcement OFF until legitimate production traffic is proven.

Preserve deny-all browser Firestore writes, local/offline-first behavior, Candidate A/B/C recovery authority, the exact Stage 2H four-permission role, no new Firebase client services/IAM expansion, and `1.4.0-r1` rollback authority until r2 production proof passes.

Remote Joining readiness is currently `59/100` under fixed model RJR-1. Do not raise it for PR count, green CI, merge mechanics, WEC work or documentation. Raise it only for new verified capability evidence in a fixed domain.

Every substantive owner-facing checkpoint must visibly report Handoff proximity and Remote Joining readiness. Unknown usage must remain unknown rather than fabricated. At Handoff proximity 100%, automatically generate a complete successor handoff, finish only the current safe bounded checkpoint and stop before another substantial milestone. WEC decisions take precedence over a weaker Handoff proximity interpretation.

Continue actual roadmap advancement after the bounded production proof; do not become trapped in continuity/process side quests.