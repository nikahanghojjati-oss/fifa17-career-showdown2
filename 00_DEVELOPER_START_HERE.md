# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-18 ET (Stage 2C complete / governance synchronization current)
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

Every fresh development environment must enter the repository-owned Work Environment Continuity system before substantial work. The inherited record is validated and archived/replaced before the successor assesses its own fresh context. A predecessor transition decision never becomes the successor's starting decision.

Every substantive owner-facing project response must also visibly include `Handoff proximity: X%`. At 100%, automatically generate the complete successor handoff, finish only the current safe bounded checkpoint and stop before another substantial milestone. Never fabricate unavailable usage to calculate the percentage. WEC remains authoritative when it requires an earlier or stricter transition, and every successor handoff must preserve this rule recursively.

## GitHub CLI bootstrap

The repository-owned GitHub CLI bootstrap remains development infrastructure. When local routing permits it, run `npm run work:gh:bootstrap`; its release download must keep checksum verification before extraction and must keep credentials inside the ignored environment-local configuration. Prefer the connected GitHub app connector-first for repository source/write operations when available, and never extract, copy or repurpose connector credentials. If the local environment cannot route to GitHub, record that limitation and do not falsely claim the CLI bootstrap or `gh auth status` succeeded.

## Mandatory startup sequence

1. Fetch current `main`, recent commits, open PRs, active branches, tags/releases and Actions/CI where the environment exposes those endpoints.
2. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and `WORK_ENVIRONMENT_HISTORY.md`.
3. Validate the inherited continuity record. If it belongs to the predecessor, archive its final facts and initialize a fresh successor record before assessment.
4. Set the fresh record's `repository.startingMainSha` to independently verified current `main`; reset per-environment observations and never estimate unavailable usage.
5. Read `PROJECT_STATE.md`, `NEXT_TASK.md`, `POST_V1_ROADMAP_EXECUTION.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md` and current technical contracts relevant to the authorized prerequisite.
6. Run the fresh environment continuity assessment and obey only that environment's decision.
7. Verify production identity from current source before any runtime mutation.

Connected GitHub tooling is source/write authority when the local shell cannot route to GitHub. Do not falsely claim a local `gh`/npm wrapper executed when the environment cannot create a checkout.

## Current production identity

Application: **v1.4.0 — Product Deepening**
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening

Cloud/Sync Phases 1A through 1F and Private Account/Auth Stages 2A / 2B / 2C are completed non-production prerequisite work. Stage 2C is policy-only. Production Firebase remains disconnected.

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
- Phase 1F Firebase Local Emulator / deny-by-default Firestore Security Rules proof — PR #81;
- Stage 2A Firebase Auth Emulator Identity Boundary — PR #83;
- Stage 2B Provider Session Lifecycle & Revocation Boundary — PR #84;
- Stage 2C Production Authentication Policy & Static-Hosting Compatibility Boundary — PR #85.

Do not reopen completed portability, identity, recovery, Cloud/Sync, Stage 2A, Stage 2B or Stage 2C proof merely because they are prerequisites in the history.

## Exact Stage 2C completion boundary

PR #85: `Private Auth Stage 2C production authentication policy`
Exact validated head: `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`
Squash merge / verified completion boundary: `22566e1409cf53d728b38d0b5a19de478ae6761b`

Stage 2C is DONE / MERGED / PROVEN. Its permanent policy selects Google federated sign-in through `GoogleAuthProvider`, explicit-user-gesture `signInWithPopup()` on the current GitHub Pages topology and explicit `browserSessionPersistence`; redirect remains blocked until a separately reviewed auth-domain/hosting compatibility boundary exists.

Production Firebase remains disconnected. Firebase Admin remains emulator/test-only and absent from production runtime/dependencies.

### Security lock carried forward

Every application-client Firestore write remains denied.

The Phase 1D shared-state schema does not expose the idempotency-key hash needed for Security Rules to identify the required sibling idempotency receipt. A modified client could bypass a client helper, so direct client state writes remain fail-closed.

A later trusted mutation gateway or separately reviewed schema/protocol adjustment is a distinct gate. Do not add Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing merely to bypass this finding.

## Current prerequisite direction

No product candidate is authorized.

Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — is DONE / MERGED / PROVEN through PR #85.

The current bounded repository task is governance synchronization only: permanently protect the owner-mandated Handoff Proximity rule, close Stage 2C current-facing authority and publish that non-runtime checkpoint. No later Stage 2 engineering prerequisite is automatically authorized by this synchronization.

After this governance checkpoint is merged and independently verified, the next legal action is a fresh WEC assessment plus source-grounded selection of the next smallest remaining Stage 2 prerequisite. Remaining concerns include production Firebase operational setup, safe application-account bootstrap/write lifecycle, trusted production token verification/revocation, account export/deletion, abuse/rate controls, production Security Rules deployment and the trusted remote mutation boundary. Their listing is not implementation order.

Do not pull into this governance checkpoint:

- production Firebase project creation or web-app registration;
- real production users;
- account/signup/login UI;
- deployed production Security Rules;
- application-client Firestore writes;
- Cloud Functions/Admin production runtime/service credentials/Blaze;
- trusted production `checkRevoked` service;
- safe application-account write bootstrap;
- account export/deletion cascade;
- registered-device UI or pairing;
- Connected Rivalry;
- Remote Joining;
- public discovery/community/rankings.

## Private Remote Joining direction

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

completed local recovery/identity/portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C DONE / remaining Stage 2 prerequisites pending
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

## Historical Stage 2A provenance

At the pre-implementation boundary, the current authorized prerequisite was **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary** and its status was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. This is historical provenance only; Stage 2A is now complete.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

FIRST ENGINEERING TASK: finish only the bounded Handoff Proximity governance and Stage 2C completion synchronization if the fresh environment's WEC decision permits that checkpoint.

Keep production Firebase disconnected, keep production at v1.4.0 / `1.4.0-r1`, preserve all direct-client-write denial and recovery guarantees, require permanent continuity and Stage 2C contracts plus current-authority synchronization to pass the complete exact-head normal PR gate, and do not begin a later Stage 2 prerequisite until this governance checkpoint is merged, live `main` is independently verified and WEC is reassessed.

If the inherited/current continuity record contains a predecessor transition decision, do not let it stop successor initialization. Obey only the fresh successor environment's own assessment.
