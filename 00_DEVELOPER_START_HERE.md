# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-18 ET (Cloud/Sync Readiness Phase 1E deterministic two-device/offline/reconnect harness)
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
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)
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
11. Phase C Showdown Home & Season Experience first slice — PR #73;
12. Cloud/Sync Readiness Phase 1A deterministic revision model — PR #76;
13. Cloud/Sync Readiness Phase 1B provider decision — PR #77;
14. Cloud/Sync Readiness Phase 1C privacy/retention boundary — PR #78;
15. Cloud/Sync Readiness Phase 1D exact remote schema/API/authorization contract — PR #79.

The visible v1.4.0 seal groups the already-shipped Phase B and Phase C first slices under one public milestone and advances the atomic whole shell to `1.4.0-r1`, retaining `1.3.0-r2` as the immediate predecessor. Phases 1A through 1D are deliberately dormant/non-runtime prerequisites and therefore did not consume visible application versions.

**Current authorized product candidate: none.**

**Current authorized prerequisite candidate: Cloud/Sync Readiness Phase 1E — deterministic two-device and offline/reconnect synchronization harness.**

Phase 1E is provider-neutral dormant source/test/authority work. Firebase production runtime, provider credentials, production Firestore data, deployed Security Rules, account UI, pairing runtime, Connected Rivalry runtime and Remote Joining runtime remain blocked.

## Permanent product-direction locks

Career Mode Showdown is a private two-manager companion for the owner and one friend.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private Remote Joining is a **PRIORITIZED LONG-TERM** product destination. It is **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Do not rush directly to networking or multiplayer UI. The ordered enabling path is Cloud/sync readiness → private identity/auth → paired-device/private-session capability → Connected Rivalry/two-device conflict/offline proof → Remote Joining.

The active connected-development lane should prefer the next safe prerequisite over unrelated optional expansion while preserving every dependency gate. A green authorized PR may be merged without asking the owner again. That standing merge instruction never creates permission to skip a gate or start a new product candidate.

## Phase 1E boundary

Detailed authority: `CLOUD_SYNC_READINESS_PHASE_1E.md`.

The current candidate composes the protected Phase 1A revision model with a deterministic two-device harness and the existing Candidate C-grade raw transaction engine. It must prove:

- two devices beginning from one authority revision;
- accepted mutation versus explicit stale conflict;
- exact accepted replay without mutation and mismatched replay rejection;
- tombstone anti-resurrection and explicit restoration;
- recursively immutable offline intent and original `baseRevision` across reconnect/retry;
- current account, registered-device, rivalry-membership and relationship authorization;
- mutation freeze when a required peer account or membership is no longer active;
- malformed/unsupported payload rejection before mutation;
- full reviewed canonical local snapshot protection between preview and Apply;
- transaction-owned mutation, ownership-scoped rollback and anti-clobber behavior;
- local-only operation and Candidate A/B/C recovery authority when remote is disabled;
- deterministic repeated final state;
- no Firebase, network, credential or `localStorage` dependency.

Phase 1F — Firebase provider connection, Emulator Suite and deny-by-default Security Rules proof — is next only after Phase 1E is fully validated, merged and independently verified. Phase 1F remains blocked during this candidate.

## GitHub CLI bootstrap

The connected GitHub app remains connector-first authority for repository, PR and issue state. Before substantial GitHub work in a fresh environment, run `npm run work:gh:bootstrap` or its exact owner `node scripts/bootstrap-github-cli.mjs` when an npm wrapper is cancelled before execution.

The bootstrap reuses a working `gh` when available. Otherwise it resolves the official stable `cli/cli` release, selects the current Linux architecture, verifies the published SHA-256 checksum before extraction, installs under ignored `.work-tools/`, and uses writable environment-local GitHub CLI configuration. Missing authentication requires the supported `gh auth login` flow; connector credentials are never copied into the CLI.

Neither the binary nor its authentication is assumed to persist across Work environments. The repository script is the repeatable authority, and `.work-tools/` must never be committed.

## Authority ownership map

One current fact should have one primary owner.

- `00_HANDOFF_GOLDEN_RULE.md` owns permanent session/handoff operating policy.
- `00_WORK_ENVIRONMENT_CONTINUITY.md` owns measurable context, reliability, transition-cost and alert protocol. `WORK_ENVIRONMENT_STATUS.json` is the machine-readable record and `WORK_ENVIRONMENT_HISTORY.md` is append-only transition history.
- `PROJECT_STATE.md` is the primary owner of current deployed product, identity, storage, recovery, performance and production state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary. A roadmap item is not a task unless this file or a later explicit owner instruction makes it one.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification. It does not authorize implementation by itself.
- `REMOTE_JOINING_EXECUTION_ROADMAP.md` owns the detailed dependency-gated Private Remote Joining lane.
- `VERSIONING_POLICY.md` owns PATCH/MINOR/MAJOR and runtime revision classification.
- `PRODUCT_PHILOSOPHY_LOCK.md` plus `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md` own the permanent private-product and Remote Joining priority direction.
- `00_CURRENT_HANDOFF.md` remains the concise rolling handoff/evidence trail.
- release and production-proof files own frozen evidence for the release/candidate they name.
- older handoffs preserve chronology and rationale only.
- external reviews are non-authoritative hypotheses and never override current source, repository authority or later explicit owner decisions.

## Required read order

Always fetch live `main`, recent commits, open PRs, active branches, tags/releases and current CI first.

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
11. `VERSIONING_POLICY.md`
12. `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md`
13. `REMOTE_JOINING_EXECUTION_ROADMAP.md`
14. `CLOUD_STORAGE_FOUNDATION.md`
15. `CLOUD_SYNC_READINESS_PHASE_1.md`
16. `CLOUD_PROVIDER_DECISION_2026-08-17.md`
17. `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md`
18. `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md`
19. `CLOUD_SYNC_READINESS_PHASE_1E.md`
20. current release/proof documents when their frozen evidence is relevant.

After reading, validate the inherited Work Environment Continuity record, archive/replace a predecessor record when required, initialize fresh observations and only then run the current environment assessment. Unknown usage remains unknown; do not invent an exact percentage.

Current verified source plus later explicit owner decisions outrank stale historical narration.

## Current development boundary

Closed production/product work must not be reopened as the active task without new authority:

- Local Profile display-label editing;
- Identity-Safe Career Analytics;
- formatVersion 2 full multi-Save backup/import portability (PR #67);
- Phase A authority synchronization (PR #68);
- Phase B Save Library / Local Profile Experience 2.0 first slice (PR #70);
- Phase C Showdown Home & Season Experience first slice (PR #73).

Closed Cloud/Sync prerequisites are Phase 1A (PR #76), Phase 1B (PR #77), Phase 1C (PR #78) and Phase 1D (PR #79). Phase 1E is the current bounded prerequisite. Phase 1F and every account/pairing/Connected Rivalry/Remote Joining runtime layer remain blocked until their preceding gates are proven.

Production identity semantics include stable `profile_*`, `save_*` and `season_*` IDs; same visible names never imply identity; explicitly reused profiles aggregate across Saves; unresolved historical roles remain unresolved; display labels are presentation only; Career Statistics and Trophy Room consume identity-safe Analytics authority; Rivalry Analytics remains Showdown-scoped.

formatVersion 2 preserves the complete Save Library registry on backup/import, exact `activeSaveId`, same-name distinct profiles, explicit cross-Save profile reuse, unresolved historical roles, Legacy and preferences. v1 envelopes remain readable.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After reconstructing live repository state and reading current authority:

1. verify live `main` contains PR #79 merge `fc2e8e8b921a435103a438a9239efbb890584d22` or reconstruct every newer change before touching the candidate;
2. confirm v1.4.0 / `1.4.0-r1` remains production identity and `1.3.0-r2` remains the previous known-good whole shell unless newer runtime source proves otherwise;
3. validate/archive/replace the inherited continuity record correctly and assess only the fresh environment;
4. confirm public community/global rankings remain ELIMINATED and Private Remote Joining remains PRIORITIZED LONG-TERM but DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED;
5. verify Phase 1D is DONE / PR #79 and Phase 1E is the one current bounded prerequisite;
6. inspect `js/cloudSyncRevisionModel.js`, `js/cloudSyncRemoteContract.js`, `js/cloudSyncTwoDeviceHarness.js`, `js/storageTransaction.js`, Candidate C recovery tests and the Phase 1E permanent contract before changing behavior;
7. finish only Phase 1E, preserving immutable intent, peer-account/membership mutation freeze, tombstone anti-resurrection and the full reviewed three-key local Apply guard;
8. run the complete appropriate repository validation and exact-head PR gate;
9. if every required check is green, review state is clean, head is unchanged and the PR is mergeable, squash merge without another owner approval;
10. verify live `main`, reassess continuity and do not begin Phase 1F in a transition-prepared environment.

Do not ask the owner to reconstruct already-recorded repository history. Do not connect Firebase early. Do not convert roadmap ordering into permission to skip dependency gates.

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

## Canonical storage and mutation locks

Post-cutover public canonical keys are exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Old singleton migration may read `careerModeShowdown.activeShowdown`, but it is never a permanent fourth post-cutover key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library product and manager-identity mutation authority. `js/analytics.js` remains derived/read-only Analytics authority. UI, Analytics and future sync code do not directly own canonical `localStorage`.

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
