# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1C remote-data policy)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering alone is not permission to skip a dependency. The owner's 2026-08-17 instruction explicitly opens continued bounded prerequisite advancement toward Private Remote Joining.

## Work Environment Continuity

Every fresh development environment must follow `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and the repository Work Environment Continuity validate → archive/replace → assess sequence before substantial work. Continuity infrastructure remains outside the website runtime and does not itself authorize product or prerequisite changes.

## Current production milestone

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 full multi-Save backup/import portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Feature release version: **v1.4.0**

Local Profiles / Save Library is a shipped and protected dependency milestone beneath the connected-development lane.

PR #76 and PR #77 are merged and closed. Their Cloud/Sync architecture changes are deliberately not loaded by the production application, so no visible application bump was appropriate. `VERSIONING_POLICY.md` permanently requires meaningful shipped runtime changes to receive PATCH/MINOR/MAJOR version bumps according to scope.

## Closed production/product candidates

The following are closed and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70, `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`)
- Phase C first slice — Showdown Home & Season Experience deepening (PR #73, `dec1d3ba8182c3f62019974dd1704c7c9124def6`)
- Cloud/Sync Readiness Phase 1A deterministic revision/conflict/tombstone/idempotency model (PR #76, `b1fafd9cba7e2c647b88445026f6c2d1134378b1`)
- Cloud/Sync Readiness Phase 1B provider/operational decision (PR #77, `2dc61e24ef07a0a150a228865f954ab3b3941398`)

**Authorized product candidate:** none.

No product candidate is currently authorized. This means no new user-facing production runtime feature is authorized at this boundary.

## Current authorized prerequisite candidate

**Cloud/Sync Readiness Phase 1C — private remote data inventory, privacy and retention policy.**

`REMOTE_DATA_PRIVACY_RETENTION_POLICY.md` is the current bounded candidate. It must remain architecture/policy only and must not add Firebase SDKs, credentials, network calls, Auth runtime, Firestore collections, Security Rules, Cloud Functions, pairing, Connected Rivalry or Remote Joining UI.

The Phase 1C candidate must preserve these decisions:

1. only data necessary for an explicitly connected private rivalry may become remote;
2. unshared Save Library Saves remain local-only by default;
3. Candidate A/B/C recovery/import material remains local-only by default;
4. optional Private Cloud Backup remains a separate future opt-in product;
5. account identity remains distinct from `profile_*` identity and display labels;
6. tombstones retain deletion authority without retaining deleted gameplay content;
7. raw invite/auth secrets and gameplay payloads are prohibited from app logs;
8. pairing/idempotency/security metadata has bounded retention;
9. account deletion immediately revokes connected authority and must later prove provider-specific cleanup;
10. local-only fallback, export/import and Candidate A/B/C recovery remain available if cloud is disabled;
11. no provider region is selected before region/privacy/latency/cost criteria are evaluated;
12. public discovery, public matchmaking, public profiles, public community and global rankings remain eliminated.

## Next prerequisite after Phase 1C merges

**Cloud/Sync Readiness Phase 1D — exact provider-compatible remote schema and API/authorization contract.**

This is conditionally next only after the Phase 1C candidate is fully validated and merged. Phase 1D must translate the provider-neutral Phase 1A model and Phase 1C privacy boundary into exact Firebase-compatible object shapes, authorization scopes, transaction/API contracts and shared-object deletion semantics without connecting production runtime prematurely.

## Prioritized long-term Private Remote Joining path

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

The ordered enabling path is:

1. completed local recovery / Save Library identity / multi-Save portability;
2. Cloud / synchronization readiness;
3. private account / authentication / authorization identity;
4. secure paired-device / private-session capability;
5. Connected Rivalry synchronization with stale-write protection, explicit conflict behavior, offline/reconnect recovery and two-device proof;
6. Private Remote Joining / session UX only after all preceding layers are proven.

Cloud/Sync Readiness is itself staged:

- Phase 1A deterministic revision model — DONE / PR #76;
- Phase 1B provider and operational decision — DONE / PR #77;
- Phase 1C privacy, retention and remote data inventory — CURRENT BOUNDED CANDIDATE;
- Phase 1D remote schema and API/authorization contract — NEXT AFTER 1C MERGES;
- Phase 1E deterministic two-device/offline sync harness — BLOCKED behind 1D;
- Phase 1F provider connection/emulator/Security Rules proof — BLOCKED behind 1E.

Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED until one bounded runtime prerequisite/candidate is explicitly authorized after the architecture and threat-model gates.

The former clean-stop wording to "stop and wait for a further explicit owner instruction" was satisfied by the owner's later 2026-08-17 instruction to prioritize and continue the prerequisite path. Do not revive that obsolete waiting loop.

## Firebase provider boundary

Firebase Authentication + Cloud Firestore is the selected primary future provider candidate, not a connected dependency.

Permanent rules for later Firebase work:

- Firestore persistent offline cache must remain disabled because its documented reconnect model can use last-write-wins for multiple local changes to the same document;
- project-owned immutable `baseRevision` and explicit conflict semantics remain authoritative;
- Firestore transaction auto-retry may never silently refresh client intent to a newer base;
- Firebase Auth account identity remains separate from `profile_*` identity and display labels;
- every remote object operation requires server-side/provider-enforced authorization;
- privileged credentials must never enter the GitHub Pages client or repository;
- paid Blaze/Cloud Functions activation is a separate future operational gate, not implied by provider selection.

## Shipped portability and identity semantics every future candidate must preserve

1. `CAREER_MODE_BACKUP_FORMAT_VERSION = 2` serializes the complete Save Library registry + Legacy + preferences.
2. v1 envelopes remain readable.
3. Candidate A remains non-mutating export.
4. Candidate B remains read-only analysis.
5. Candidate C remains the sole destructive Apply stage.
6. stable `profile_*`, `save_*` and `season_*` identities remain authoritative.
7. display-name equality never establishes identity.
8. explicit stable Local Profile reuse is required for longitudinal cross-Save identity.
9. unresolved historical roles remain unresolved until explicitly mapped.
10. same-name distinct profiles remain distinct.

## Recovery and architecture locks

Public canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Never restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority.
`js/storageTransaction.js` remains raw transaction authority.
`js/saveLibraryRuntime.js` remains Save Library / manager-identity mutation authority.
`js/analytics.js` remains derived Analytics authority.

Candidate C Apply must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority. Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

No future cloud/sync module may directly own `localStorage`.

## Product locks

Exactly two managers. Same selected league. Different permanent clubs. Showdown lengths 1 / 3 / 5 / 10. Maximum Season score 11. Equal non-zero scores are Draws. Only 0–0 uses league position and then league points.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private connected work must not introduce public discovery, public matchmaking or public profiles indirectly.

## Performance and validation locks

The repository protects 14 permanent workflow families and 27 protected multiline executable workflow blocks. Normal PRs generally exercise 13 workflow families; Release Integration Burn-In remains main/manual release authority.

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal startup minimum = `2700 ms`
- reduced-motion startup = `220 ms`

Normal PRs exercise the repository's protected workflow families. Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study

1. Verify live `main` contains PR #77 merge `2dc61e24...` or reconstruct anything newer.
2. Confirm v1.4.0 / `1.4.0-r1` remains the deployed runtime unless newer runtime source proves otherwise.
3. Read `VERSIONING_POLICY.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `CLOUD_SYNC_READINESS_PHASE_1.md`, `CLOUD_PROVIDER_DECISION_2026-08-17.md`, `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md`, `CLOUD_STORAGE_FOUNDATION.md`, `PROJECT_STATE.md` and this file.
4. Confirm Firebase is only a provider candidate and no SDK/network/Auth runtime is authorized.
5. Confirm public community/global rankings remain ELIMINATED.

### Execution

**Current authorized prerequisite work:** complete and validate Phase 1C private remote data inventory/privacy/retention as one bounded candidate.

After Phase 1C is fully validated and merged, continue to Phase 1D exact remote schema/API/authorization contract under the owner's standing instruction. Do not ask for repeated permission merely to progress to that next dependency gate, but never collapse multiple gates into one implementation or start blocked runtime early.
