# Career Mode Showdown — Developer Start Here

## CURRENT SUCCESSOR OVERRIDE — 2026-08-18 ET

This short section is the current source-facing override. The complete PR #89 live-main body below is intentionally retained byte-for-byte as historical/proven contract provenance except for this prefixed successor update. Current source, live GitHub state and `NEXT_TASK.md` override the historical Stage 2D-current wording below.

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary — DONE / MERGED / PROVEN through PR #89. Exact validated head `f7d462b3d8252b2912f34a1589e457c03e977bd3`; squash merge / independently verified live-main boundary `0cb56c22f82facdb248c8c68ec59064c5612c543`.

Stage 2F — Trusted Request Authentication & ID Token Revocation Boundary — CURRENT / IMPLEMENTATION-AUTHORIZED / TRUSTED-VERIFIER-CONTRACT / EMULATOR-WIRING-PROOF. Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2F.md` and `NEXT_TASK.md`.

Current production remains v1.4.0 / package `1.4.0` / Installable Offline App runtime `1.4.0-r1`. Production Firebase remains disconnected. Every application-client Firestore create/update/delete remains denied. Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Stage 2F must remain production-dormant: require trusted `verifyIdToken(idToken, true)`, derive architecture `accountId` only from verified Firebase UID, keep provider authentication separate from application authorization, persist/log no raw token material, and do not create production Firebase/Admin/IAM/write infrastructure.

Every substantive owner-facing project response must visibly include `Handoff proximity: X%`; at 100%, finish only the current safe bounded checkpoint, automatically generate the complete successor handoff and stop before another substantial milestone. Never fabricate unavailable usage, and preserve the rule recursively.

---

# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-18 ET (PR #87 complete / Stage 2D production Firebase preflight current)
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
5. Read `PROJECT_STATE.md`, `NEXT_TASK.md`, `POST_V1_ROADMAP_EXECUTION.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`, `PRIVATE_ACCOUNT_AUTH_STAGE_2D.md` and current technical contracts relevant to the authorized prerequisite.
6. Run the fresh environment continuity assessment and obey only that environment's decision.
7. Verify production identity from current source before any runtime mutation.

Connected GitHub tooling is source/write authority when the local shell cannot route to GitHub. Do not falsely claim a local `gh`/npm wrapper executed when the environment cannot create a checkout.

## Current production identity

Application: **v1.4.0 — Product Deepening**
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening

Cloud/Sync Phases 1A through 1F and Private Account/Auth Stages 2A / 2B / 2C are completed non-production prerequisite work. Stage 2C is policy-only. PR #86 and PR #87 are completed non-runtime governance/authority work. Stage 2D is the current dormant non-runtime prerequisite. Production Firebase remains disconnected.

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
- Stage 2C Production Authentication Policy & Static-Hosting Compatibility Boundary — PR #85;
- Handoff Proximity governance synchronization / Stage 2C authority seal — PR #86;
- post-PR #86 current-authority reconciliation — PR #87.

Do not reopen completed portability, identity, recovery, Cloud/Sync, Stage 2A, Stage 2B, Stage 2C, PR #86 or PR #87 work merely because those layers appear in dependency history.

## Exact Stage 2C completion boundary

PR #85: `Private Auth Stage 2C production authentication policy`
Exact validated head: `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`
Squash merge / verified completion boundary: `22566e1409cf53d728b38d0b5a19de478ae6761b`

Stage 2C is DONE / MERGED / PROVEN. Its permanent policy selects Google federated sign-in through `GoogleAuthProvider`, explicit-user-gesture `signInWithPopup()` on the current GitHub Pages topology and explicit `browserSessionPersistence`; redirect remains blocked until a separately reviewed auth-domain/hosting compatibility boundary exists.

Production Firebase remains disconnected. Firebase Admin remains emulator/test-only and absent from production runtime/dependencies.

## Exact PR #86 governance completion boundary

PR #86: `Protect Handoff Proximity governance and seal Stage 2C`
Exact validated head: `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`
Squash merge: `1794f1f86968781b898d000360d1fb56234fb92f`

PR #86 is DONE / MERGED / PROTECTED. All 13 normal workflow families completed successfully on that exact unchanged head and submitted reviews plus inline review threads were empty. The owner-mandated visible `Handoff proximity: X%` rule, honest unknown-usage handling, WEC precedence, 100% automatic successor handoff/stop boundary and recursive propagation are repository-protected.

PR #86 changed no production runtime and did not connect Firebase. Do not repeat PR #86.

## Exact PR #87 reconciliation completion boundary

PR #87: `Reconcile authority after Handoff Proximity governance merge`
Exact validated head: `2415c156161b6244c75e49917bad28efed957adf`
Squash merge / independently verified Stage 2D starting main: `0accb827fa91f86fdd28e63590bd4843267546ae`

PR #87 is DONE / MERGED / PROVEN. All 13 normal workflow families passed on the exact unchanged head; submitted reviews and inline review threads were empty. It changed no production runtime and intentionally left the next Stage 2 engineering prerequisite unselected for a fresh successor.

Do not repeat PR #87.

### Security lock carried forward

Every application-client Firestore write remains denied.

The Phase 1D shared-state schema does not expose the idempotency-key hash needed for Security Rules to identify the required sibling idempotency receipt. A modified client could bypass a client helper, so direct client state writes remain fail-closed.

A later trusted mutation gateway or separately reviewed schema/protocol adjustment is a distinct gate. Do not add Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing merely to bypass this finding.

## Current prerequisite direction

No product candidate is authorized.

Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — is DONE / MERGED / PROVEN through PR #85.

PR #86 — Handoff Proximity governance synchronization — is DONE / MERGED / PROTECTED.

PR #87 — post-PR #86 authority reconciliation — is DONE / MERGED / PROVEN.

Stage 2D — Production Firebase Environment & Configuration Preflight — is CURRENT / IMPLEMENTATION-AUTHORIZED / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2D.md` and `NEXT_TASK.md`.

Stage 2D exists to fail closed before any real production Firebase provisioning or connection. Its dormant validator must protect environment separation, reject demo-project identities and mismatched project metadata, preserve the Stage 2C Google popup/session-persistence policy, require the production GitHub Pages authorized-domain plan and an explicit Firestore location decision, reject persistent Firestore cache, reject credential material and keep all direct application-client Firestore writes denied.

A passing synthetic Stage 2D fixture is proof of the guardrail only. It is never proof that a real Firebase project, web app, Auth provider, user, Firestore database or Security Rules deployment exists.

Stage 2D does not authorize production Firebase project creation, web-app registration, Auth console changes, real users, production Rules deployment, production Firestore data, production Admin/Functions/Blaze infrastructure, a trusted mutation gateway or a production token-verification service.

Remaining later Stage 2 concerns include actual production Firebase operational setup, safe application-account bootstrap/write lifecycle, trusted production token verification/revocation, account export/deletion, abuse/rate controls, production Security Rules deployment and the trusted remote mutation boundary. Their listing is not implementation order.

## Private Remote Joining direction

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

completed local recovery/identity/portability
→ Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C DONE / Stage 2D CURRENT
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

FIRST ENGINEERING TASK: finish only Stage 2D on `agent/stage2-next-prerequisite` / draft PR #88 if the fresh environment's WEC decision permits that checkpoint.

Keep production Firebase disconnected, keep production at v1.4.0 / `1.4.0-r1`, preserve all direct-client-write denial and recovery guarantees, finish the dormant preflight and permanent contract/authority synchronization, and require the complete exact-head normal PR gate before merge.

After PR #88 merges and live `main` is independently verified, reassess WEC and do not begin another Stage 2 prerequisite in this environment when the WEC decision requires transition.

If the inherited/current continuity record contains a predecessor transition decision, do not let it stop successor initialization. Obey only the fresh successor environment's own assessment.
