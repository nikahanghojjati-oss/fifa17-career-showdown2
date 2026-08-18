# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-18 ET (Phase 1F complete / Private Auth Stage 2A next)
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical bootstrap for a new developer session.

## Authority ownership

Read current source before changing anything. Handoffs are orientation only.

- `PROJECT_STATE.md` is the primary owner of current deployed product state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification.
- `REMOTE_JOINING_EXECUTION_ROADMAP.md` owns the detailed private Remote Joining prerequisite lane.
- `VERSIONING_POLICY.md` owns application/runtime version numbering.
- `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and `WORK_ENVIRONMENT_HISTORY.md` own Work Environment Continuity and environment transition discipline.

## Work Environment Continuity startup

Every fresh development environment must enter the repository-owned Work Environment Continuity system before substantial work. The inherited record is validated and archived/replaced before the successor assesses its own fresh context. A predecessor `HANDOFF_AT_CHECKPOINT` decision never becomes the successor's starting decision.

## GitHub CLI bootstrap

The repository-owned GitHub CLI bootstrap remains development infrastructure. When local routing permits it, run `npm run work:gh:bootstrap`; its release download must keep checksum verification before extraction and must keep credentials inside the ignored environment-local configuration. Prefer the connected GitHub app connector-first for repository source/write operations when available, and never extract, copy or repurpose connector credentials. If the local environment cannot route to GitHub, record that limitation and do not falsely claim the CLI bootstrap or `gh auth status` succeeded.

## Mandatory startup sequence

1. Fetch current `main`, recent commits, open PRs, active branches, tags/releases and Actions/CI.
2. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and `WORK_ENVIRONMENT_HISTORY.md`.
3. Validate the inherited continuity record. If it belongs to the predecessor, archive its final facts and initialize a fresh successor record before assessment.
4. Set the fresh record's `repository.startingMainSha` to independently verified current `main`; reset per-environment observations and never estimate unavailable usage.
5. Read `PROJECT_STATE.md`, `NEXT_TASK.md`, `POST_V1_ROADMAP_EXECUTION.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md` and the current technical contracts relevant to the authorized prerequisite.
6. Run the fresh environment continuity assessment and obey only that environment's decision.
7. Verify production identity from current source before any runtime mutation.

Connected GitHub tooling is source/write authority when the local shell cannot route to GitHub. Do not falsely claim a local `gh`/npm wrapper executed when the environment cannot create a checkout.

## Current production identity

Application: **v1.4.0 — Product Deepening**
Runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening

Cloud/Sync Phases 1A through 1F are dormant/test/provider-readiness work and did not change production runtime identity.

## Completed product/dependency chain

The current source sits above these completed/protected layers:

- v1.3.0 Recovery & Device Resilience Hardening;
- Local Profiles / Save Library identity foundation;
- canonical Save Library persistence/runtime authority;
- visible Local Profiles / Save Library Core UI;
- explicit cross-Save/historical manager identity linkage foundation — PR #57;
- identity-safe longitudinal Career Analytics / Trophy Room correction — PR #59;
- presentation-only Local Profile display-label editing — PR #61;
- formatVersion 2 full multi-Save backup/import portability — PR #67;
- Phase A authority synchronization — PR #68;
- Phase B Save Library / Local Profile Experience 2.0 first slice — PR #70;
- Phase C Showdown Home & Season Experience first slice — PR #73;
- Cloud/Sync Readiness Phase 1A deterministic revision model — PR #76;
- Phase 1B Firebase provider decision — PR #77;
- Phase 1C privacy/retention/data inventory — PR #78;
- Phase 1D exact remote schema/API/authorization contract — PR #79;
- Phase 1E deterministic two-device/offline/reconnect harness — PR #80;
- Phase 1F Firebase Local Emulator / deny-by-default Firestore Security Rules proof — PR #81.

Do not reopen completed portability, identity, recovery or Cloud/Sync proof merely because they are prerequisites in the history.

## Exact Phase 1F completion boundary

PR #81: `Cloud Sync Readiness Phase 1F Firebase emulator and rules proof`
Exact validated head: `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`
Squash merge/current completion boundary: `231556d86a93535fa90e173577c1159de4f40be0`

All 13 normal PR workflow families were independently verified successful on the exact unchanged PR head before merge.

Production Firebase remains disconnected. Phase 1F uses fixed demo project `demo-career-mode-showdown-phase1f` only for emulator proof.

### Security lock carried forward

Every application-client Firestore write remains denied.

The Phase 1D shared-state schema does not expose the idempotency-key hash needed for Security Rules to identify the required sibling idempotency receipt. A modified client could bypass a client helper, so direct client state writes remain fail-closed.

A later trusted mutation gateway or separately reviewed schema/protocol adjustment is a distinct gate. Do not add Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing merely to bypass this finding.

## Current prerequisite direction

No product candidate is authorized.

The current authorized prerequisite is **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**.

Detailed scope: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Stage 2A is test/emulator-only. It must prove real Firebase Auth `uid` → architecture `accountId` semantics and cross-service Firestore Security Rules identity under the same fixed demo project without connecting production Firebase.

It must cover distinct synthetic identities, wrong-account denial, unauthenticated denial, sign-out loss of authenticated access, app-account lifecycle separation, provider identity over client-supplied identity, no unsafe credential/token persistence, in-memory-only test Auth state and continued denial of every client Firestore write.

Synthetic email/password users are permitted only as an emulator test mechanism. Stage 2A does not select production sign-in UX.

Do not pull into Stage 2A:

- production signup/login/account UI;
- production Auth persistence choice;
- production provider-level disable/revocation work;
- account export/deletion cascade;
- safe production account-write bootstrap;
- registered-device UI or pairing;
- Connected Rivalry;
- Remote Joining;
- Cloud Functions/Admin/Blaze;
- public discovery/community/rankings.

## Private Remote Joining direction

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

completed local recovery/identity/portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane
→ paired-device / private-session capability — blocked Stage 3
→ Connected Rivalry — blocked Stage 4
→ Private Remote Joining — final dependency-gated destination.

Public community, public discovery, public matchmaking, public profiles and global leaderboard/rankings remain eliminated.

## Recovery and local-storage authority

Candidate A remains non-mutating export.
Candidate B remains read-only analysis.
Candidate C remains the exclusive destructive import Apply authority.

Candidate C retains strict exact raw snapshot authority through `captureCareerModeRawRestoreSnapshot()`, last-moment exact preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification, corrupt-byte preservation and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth key. No Auth/cloud/sync module may directly own canonical `localStorage`.

## Gameplay locks

Exactly two managers. Same selected league. Different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero scores are Draws. Only 0–0 uses league position and then league points.

## Validation locks

14 permanent workflow families and 27 protected multiline executable workflow blocks remain repository authority. Normal PRs generally exercise 13. Release Integration Burn In remains main/manual release authority.

Do not weaken Candidate C, tests, timeouts or performance ceilings to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

FIRST ENGINEERING TASK: after completing the mandatory startup and fresh continuity assessment, implement only the Stage 2A Auth Emulator identity proof described in `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md` if that environment's decision permits beginning the milestone.

Add Auth Emulator configuration under the existing fixed demo project, prove real Firebase Auth identities through Firestore Security Rules, keep Auth test persistence in memory, keep every client Firestore write denied, preserve local-only/recovery authority and leave production v1.4.0 / `1.4.0-r1` untouched.

If the inherited/current continuity record says `HANDOFF_AT_CHECKPOINT`, do not let a predecessor decision stop successor initialization. If the fresh successor's own assessment says `HANDOFF_AT_CHECKPOINT`, finish only its current checkpoint and hand off before beginning another distinct milestone.
