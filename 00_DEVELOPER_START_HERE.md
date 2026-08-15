# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-15 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical bootstrap for a new developer session.

## Sixty-second state

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current production runtime feature merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`
Feature release version: intentionally unassigned

Latest infrastructure boundary: PR #66 validated head `72e4b41b2b4734e49fd3af4626e9b4048bbc7367` merged to `0a7dfbefc0920fc5eaa119c7fd6b22cc8df63b96`; all 15 post-merge workflows and Pages deployment `5925677418` passed with no website runtime-path change. This seal retains PR #64 corrected-bootstrap authority at merge `629b01d160e4eb1215c54ff6bc9558396a2b256d`.

Latest owner-authorized sequence: reconcile and complete PR #65's portable rootless GitHub CLI bootstrap on the PR #66 main, then immediately advance the bounded complete fresh-device multi-Save backup/import portability candidate after source confirmation.

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption and Local Profile display-label editing are complete, merged, deployed and production-proven.

Completed dependency chain:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53;
5. explicit cross-Save/historical manager identity linkage foundation — PR #57;
6. identity-safe longitudinal Career Analytics / Trophy Room correction — PR #59;
7. presentation-only Local Profile display-label editing — PR #61.

PR #61 exact validated head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`.
Production runtime feature merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`.
Production Stability run: `31894832637`.
Deployed-site-smoke job: `95036682319`.
Pages deployment: `5922244376`.

The application version remains v1.3.0. Runtime maintenance r2 gives the changed Save Library JavaScript/CSS a coherent atomic shell identity and retains r1 as the immediate predecessor.

## GitHub CLI bootstrap

The connected GitHub app remains the connector-first authority for repository, PR and issue state. Before substantial GitHub work in a fresh environment, run `npm run work:gh:bootstrap` or its exact owner `node scripts/bootstrap-github-cli.mjs` when an npm wrapper is cancelled before execution.

The bootstrap reuses a working `gh` when available. Otherwise it resolves the current official stable `cli/cli` release, selects the current Linux architecture, downloads the official archive and checksum list, requires SHA-256 checksum verification before extraction, installs under ignored `.work-tools/`, and runs both `gh --version` and `gh auth status` with writable environment-local configuration. Missing authentication requires the printed supported `gh auth login` device flow; connector credentials are never copied into the CLI.

Neither the binary nor its authentication is assumed to persist across Work environments. The repository script is the repeatable authority, and `.work-tools/` must never be committed.

## Authority ownership map

One current fact should have one primary owner. Do not copy a fact into a new document merely to make it easier to find.

- `00_HANDOFF_GOLDEN_RULE.md` owns permanent session/handoff operating policy.
- `00_WORK_ENVIRONMENT_CONTINUITY.md` owns the measurable context, reliability, transition-cost and alert protocol. `WORK_ENVIRONMENT_STATUS.json` is its current machine-readable record and `WORK_ENVIRONMENT_HISTORY.md` is its append-only transition history.
- `PROJECT_STATE.md` is the primary owner of current deployed product, identity, storage, recovery, performance and production-proof state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary. A roadmap item is not a task unless this file or a later explicit owner instruction makes it one.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification. It does not assign release versions and does not authorize implementation by itself.
- `00_CURRENT_HANDOFF.md` is the concise rolling production/evidence handoff and retains the prior identity/Analytics candidate failure history and production proof.
- `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` is retained as the closed branch-specific evidence trail for PR #59 and its validation failures/corrections. It is historical after production promotion and does not override current authority.
- release and production-proof files own frozen evidence for the release/candidate they name. Historical proof may accurately describe an older canonical storage model and must not be mistaken for current product authority.
- Local Profiles / Save Library handoffs preserve rationale and implementation chronology for that completed chain.
- `00_MASTER_DEVELOPER_CONTEXT.md` and older handoffs are historical rationale only.
- external reviews are non-authoritative hypotheses. They never override current source, current repository authority or later explicit owner decisions.

## Required read order

Always fetch live `main`, recent commits and open PRs first.

Then read:

1. `AGENTS.md`
2. `00_HANDOFF_GOLDEN_RULE.md`
3. `00_WORK_ENVIRONMENT_CONTINUITY.md`
4. `WORK_ENVIRONMENT_STATUS.json`
5. `WORK_ENVIRONMENT_HISTORY.md`
6. this file
7. `00_CURRENT_HANDOFF.md`
8. `PROJECT_STATE.md`
9. `NEXT_TASK.md`
10. `POST_V1_ROADMAP_EXECUTION.md`
11. `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` when PR #59 failure chronology is relevant
12. Local Profiles / Save Library historical handoffs only when their rationale is relevant
13. current release/proof documents only when their frozen evidence is relevant
14. `00_MASTER_DEVELOPER_CONTEXT.md` only when deeper history is required.

After reading, run `npm run work:continuity:validate` and `npm run work:assess`. Initialize a fresh environment record before substantial work when the recorded environment has closed or belongs to a prior chat. Unknown usage remains unknown; do not estimate an exact percentage.

Current verified source plus later explicit owner decisions outrank stale historical narration.

## Current development boundary

Identity-Safe Career Analytics and Local Profile display-label editing are no longer active branch tasks. Both are production-proven.

Production semantics now include:

- authoritative longitudinal manager identity is a valid stable `profile_*` reference;
- same visible names never imply the same manager identity;
- one explicitly reused Local Profile across multiple Saves aggregates as one career identity;
- distinct same-name profiles remain distinct career identities;
- unresolved historical roles remain unresolved and are excluded from identity-dependent manager totals/leaderboards/cabinets rather than guessed from labels;
- overall Showdown/Season totals and Showdown/Season-scoped records remain complete when identity is unresolved;
- Local Profile display names remain presentation only;
- read-only Career Statistics can obtain canonical profile presentation without eager Save Library mutation-runtime activation;
- Analytics and Trophy Room caches/renders refresh when identity mapping or consumed profile presentation changes;
- Rivalry Analytics remains scoped to one Showdown and does not become a cross-history identity consumer.

Production Local Profile display-label editing changes only `profile.displayName`, never stable identity or saved/historical Showdown labels. A later owner handoff authorizes PR #65 reconciliation followed by one bounded complete multi-Save portability candidate. Broader profile CRUD, Analytics 2.0, cloud, communities, rankings and unrelated product work remain unauthorized.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After reconstructing live repository state and reading current authority:

1. verify live `main` remains PR #66 merge `0a7dfbefc0920fc5eaa119c7fd6b22cc8df63b96` or reconstruct every newer change;
2. validate the inherited Work Environment Continuity record, initialize fresh observations and only then run `npm run work:assess`;
3. verify PR #66's 15 successful post-merge workflows, deployment `5925677418`, retained PR #64 proof, unchanged runtime paths and coherent `1.3.0-r2` / previous `1.3.0-r1` whole-shell recovery;
4. reconcile PR #65 historical head `978fa967517207733cc84c7e6dd6e778b5770723` onto the PR #66 main while preserving corrected continuity ordering and the checksum-verified rootless bootstrap security boundary;
5. rerun the real bootstrap, supported GitHub authentication check, complete local contracts/syntax/runtime-diff proof and fresh exact-head CI/review before protected PR #65 merge;
6. after PR #65 post-merge proof, confirm complete multi-Save portability remains incomplete and unblocked, then begin only the bounded candidate and acceptance criteria in `NEXT_TASK.md`.

Do not ask the owner to reconstruct already-recorded repository history.

## Permanent product and identity locks

Exactly two managers.
Showdown lengths: `1`, `3`, `5`, `10`.
Both managers use the same selected league and different permanent clubs.

Scoring remains:

- Champions League +5
- League +3
- Domestic Cup +1
- 100 League Points and/or 100 League Goals combined maximum +1
- Top Scorer and/or Top Assist combined maximum +1

Maximum Season score: 11.
Equal non-zero scores are Draws.
Only 0–0 invokes league position and then league points.

Stable prefixes remain `profile_*`, `save_*` and `season_*`. Display names are labels only and same-name profiles are legal.

Protected product surfaces include Home, Continue Career, Create Showdown, league and club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

## Canonical storage and mutation locks

Before explicit Save Library cutover on an old singleton device, the public canonical keys are exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful cutover, they are exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is never a permanent fourth post-cutover key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library product and manager-identity mutation authority. `js/analytics.js` remains derived/read-only Analytics authority. UI and Analytics code do not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C destructive Apply must use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority, never `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

## Installable Offline App and performance locks

Current production Installable Offline App whole shell is `1.3.0-r2`; its immediate previous known-good whole shell is `1.3.0-r1`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve atomic verified cache population, explicit update activation, Candidate C activation gating, current/previous whole-shell recovery and Settings-owned install/update presentation.

Locked ceilings remain:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Never raise performance or timeout limits merely to obtain green CI.

## Validation topology and proof

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation/authority PRs generally exercise 13; Release Integration Burn-In is main/manual release authority.

PR #61 exact final head `cfedec8dccde51a7a9932a1bd3a92cc91514e579` passed all 13 normal PR workflow families. Exact runtime merge `67095a02188ebd246da0d0f2cd61158b8e9e504e` had 15 successful push/deployment runs, zero failures and zero cancellations. Stability run `31894832637` passed contracts, canonical Chromium and deployed-site proof; deployed-site-smoke job `95036682319` passed every public production gate through the complete journey. Independent proof matched 71 runtime files plus Service Worker and manifest byte for byte and passed the public profile-label journey.

Automated proof and owner visual/product acceptance remain separate evidence channels.

## Historical branch warning

PR #37 / `agent/v13-hardening` and PR #35 remain historical draft work based on obsolete snapshots. Do not revive or merge them over current `main` without a new current-source justification.
