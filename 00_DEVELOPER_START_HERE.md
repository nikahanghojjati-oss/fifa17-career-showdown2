# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-17 ET (Remote Joining priority clarification)
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical bootstrap for a new developer session.

## Sixty-second state

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Feature release version: **v1.4.0**

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption, presentation-only Local Profile display-label editing, formatVersion 2 full multi-Save portability, Phase B Save Library / Local Profile Experience 2.0 first slice and Phase C Showdown Home & Season Experience first slice are complete, merged, deployed and production-proven.

Completed dependency chain:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53;
5. explicit cross-Save/historical manager identity linkage foundation — PR #57;
6. identity-safe longitudinal Career Analytics / Trophy Room correction — PR #59;
7. presentation-only Local Profile display-label editing — PR #61;
8. formatVersion 2 full multi-Save backup/import portability — PR #67;
9. Phase A authority synchronization — PR #68;
10. Phase B Save Library / Local Profile Experience 2.0 first slice — PR #70;
11. Phase C Showdown Home & Season Experience first slice — PR #73.

The visible v1.4.0 seal groups the already-shipped Phase B and Phase C first slices under one public milestone and advances the atomic whole shell to `1.4.0-r1`, retaining `1.3.0-r2` as the immediate predecessor.

**Current authorized product candidate: none. Hold a clean stop until further explicit owner instruction.**

## Permanent product-direction locks

Career Mode Showdown is a private two-manager companion for the owner and one friend.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private Remote Joining is a **PRIORITIZED LONG-TERM** product destination. It is **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Do not rush directly to networking or multiplayer UI. The ordered enabling path is Cloud/sync readiness → private identity/auth → paired-device/private-session capability → Connected Rivalry/two-device conflict/offline proof → Remote Joining.

When future networked work is explicitly authorized, the next safe prerequisite on that path should be preferred over unrelated optional expansion unless a later owner instruction changes the priority. Each prerequisite still requires its own bounded implementation authorization.

A green authorized PR may be merged without asking the owner again. That standing merge instruction never creates permission for a new product candidate.

## GitHub CLI bootstrap

The connected GitHub app remains connector-first authority for repository, PR and issue state. Before substantial GitHub work in a fresh environment, run `npm run work:gh:bootstrap` or its exact owner `node scripts/bootstrap-github-cli.mjs` when an npm wrapper is cancelled before execution.

The bootstrap reuses a working `gh` when available. Otherwise it resolves the current official stable `cli/cli` release, selects the current Linux architecture, downloads the official archive and checksum list, requires SHA-256 checksum verification before extraction, installs under ignored `.work-tools/`, and runs both `gh --version` and `gh auth status` with writable environment-local configuration. Missing authentication requires the printed supported `gh auth login` device flow; connector credentials are never copied into the CLI.

Neither the binary nor its authentication is assumed to persist across Work environments. The repository script is the repeatable authority, and `.work-tools/` must never be committed.

## Authority ownership map

One current fact should have one primary owner.

- `00_HANDOFF_GOLDEN_RULE.md` owns permanent session/handoff operating policy.
- `00_WORK_ENVIRONMENT_CONTINUITY.md` owns measurable context, reliability, transition-cost and alert protocol. `WORK_ENVIRONMENT_STATUS.json` is the machine-readable record and `WORK_ENVIRONMENT_HISTORY.md` is append-only transition history.
- `PROJECT_STATE.md` is the primary owner of current deployed product, identity, storage, recovery, performance and production state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary. A roadmap item is not a task unless this file or a later explicit owner instruction makes it one.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification. It does not authorize implementation by itself.
- `PRODUCT_PHILOSOPHY_LOCK.md` plus `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md` own the permanent private-product and Remote Joining priority direction.
- `00_CURRENT_HANDOFF.md` remains the concise rolling handoff/evidence trail.
- `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` is historical branch-specific evidence for PR #59.
- release and production-proof files own frozen evidence for the release/candidate they name.
- older Local Profiles / Save Library handoffs preserve chronology and rationale only.
- external reviews are non-authoritative hypotheses and never override current source, repository authority or later explicit owner decisions.

## Required read order

Always fetch live `main`, recent commits, open PRs, active branches and current CI first.

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
11. `PRODUCT_PHILOSOPHY_LOCK.md`
12. `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md`
13. current release/proof documents when their frozen evidence is relevant
14. historical handoffs only when deeper rationale is required.

After reading, run `npm run work:continuity:validate` and `npm run work:assess`. Initialize a fresh environment record before substantial work when the recorded environment has closed or belongs to a prior chat. Unknown usage remains unknown; do not invent an exact percentage.

Current verified source plus later explicit owner decisions outrank stale historical narration.

## Current development boundary

The following work is closed and production-proven and must not be reopened as an active candidate without new owner authorization:

- Local Profile display-label editing;
- Identity-Safe Career Analytics;
- formatVersion 2 full multi-Save backup/import portability (PR #67);
- Phase A authority synchronization (PR #68);
- Phase B Save Library / Local Profile Experience 2.0 first slice (PR #70);
- Phase C Showdown Home & Season Experience first slice (PR #73).

Production identity semantics include:

- authoritative longitudinal manager identity is a valid stable `profile_*` reference;
- same visible names never imply the same manager identity;
- one explicitly reused Local Profile across multiple Saves aggregates as one career identity;
- distinct same-name profiles remain distinct career identities;
- unresolved historical roles remain unresolved and are excluded from identity-dependent manager totals/leaderboards/cabinets rather than guessed from labels;
- overall Showdown/Season totals and Showdown/Season-scoped records remain complete when identity is unresolved;
- Local Profile display names remain presentation only;
- Career Statistics and Trophy Room consume identity-safe Analytics authority;
- Rivalry Analytics remains Showdown-scoped.

formatVersion 2 preserves the complete Save Library registry on backup/import, exact `activeSaveId`, same-name distinct profiles, explicit cross-Save profile reuse, unresolved historical roles, Legacy and preferences. v1 envelopes remain readable.

Phase B first slice provides richer Save cards, clearer Local Profile presentation, local non-destructive sorting and 44px touch targets.

Phase C first slice provides Home series lead/trail status, contextual primary action including `VIEW COMPLETED SHOWDOWN`, last completed season summary and presentation/touch-target polish while preserving eager CSS ceilings.

Broader profile CRUD, further Product Deepening, Season redesign, Career Statistics 2.0, Legacy 2.0, Cloud/sync runtime, private identity/auth, paired device, Connected Rivalry and Remote Joining remain unauthorized until explicitly assigned. Remote Joining’s lack of current authorization must not be interpreted as lack of long-term priority.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After reconstructing live repository state and reading current authority:

1. confirm live `main` includes Phase C product merge `dec1d3ba8182c3f62019974dd1704c7c9124def6` or reconstruct every newer change;
2. confirm the visible application identity is v1.4.0 and the Installable Offline App runtime is `1.4.0-r1` with `1.3.0-r2` as the immediate previous known-good whole shell;
3. validate the inherited Work Environment Continuity record, initialize fresh observations and run `npm run work:assess`;
4. confirm public community/global leaderboard remain ELIMINATED and Private Remote Joining remains PRIORITIZED LONG-TERM but DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED;
5. confirm the future enabling order is Cloud/sync readiness → private identity/auth → paired device/private session → Connected Rivalry/two-device proof → Remote Joining;
6. read `NEXT_TASK.md` and verify the authorized product candidate is none;
7. hold the clean stop until a later explicit owner instruction authorizes one bounded next slice or one bounded prerequisite in the prioritized Remote Joining path.

Do not ask the owner to reconstruct already-recorded repository history. Do not convert roadmap ordering into implementation authority.

## Permanent gameplay locks

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

Post-cutover public canonical keys are exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Old singleton migration may read `careerModeShowdown.activeShowdown`, but it is never a permanent fourth post-cutover key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library product and manager-identity mutation authority. `js/analytics.js` remains derived/read-only Analytics authority. UI and Analytics code do not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C destructive Apply must use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority, never `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

## Installable Offline App and performance locks

Current production Installable Offline App whole shell is `1.4.0-r1`; its immediate previous known-good whole shell is `1.3.0-r2`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve atomic verified cache population, explicit safe-boundary update activation, Candidate C activation gating, current/previous whole-shell recovery and Settings-owned install/update presentation.

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

Automated proof and owner visual/product acceptance remain separate evidence channels.

## Historical branch warning

PR #37 / `agent/v13-hardening`, PR #35 and other superseded branches remain historical work based on obsolete snapshots. Do not revive or merge them over current `main` without a new current-source justification.
