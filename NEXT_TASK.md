# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1B provider decision)

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
Feature release version: **v1.4.0**

Local Profiles / Save Library is a shipped and protected dependency milestone beneath the connected-development lane.

PR #76 is merged and closed. Its deterministic Cloud/Sync revision model is dormant, network-free and not loaded by the production application, so no visible application bump was appropriate. `VERSIONING_POLICY.md` now permanently requires meaningful shipped runtime changes to receive PATCH/MINOR/MAJOR version bumps according to scope.

## Closed production/product candidates

The following are closed and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70, `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`)
- Phase C first slice — Showdown Home & Season Experience deepening (PR #73, `dec1d3ba8182c3f62019974dd1704c7c9124def6`)
- Cloud/Sync Readiness Phase 1A deterministic revision/conflict/tombstone/idempotency model (PR #76, `b1fafd9cba7e2c647b88445026f6c2d1134378b1`)

**Authorized product candidate:** none.

No product candidate is currently authorized. This means no new user-facing production runtime feature is authorized at this boundary.

## Authorized prerequisite candidate

**Cloud/Sync Readiness Phase 1C — private remote data inventory, privacy and retention policy.**

Phase 1B provider/operational selection is established by `CLOUD_PROVIDER_DECISION_2026-08-17.md`: Firebase Authentication + Cloud Firestore is the primary future provider candidate. This decision does not connect Firebase or authorize remote runtime.

Phase 1C must define, before any provider connection:

1. the exact data classes that may become remote;
2. which data remains local-only;
3. purpose and minimum fields for every remote object class;
4. private account/profile/save/device/session relationship boundaries;
5. retention periods for live objects, tombstones, pairing/session records and security/audit metadata;
6. export and account/object deletion semantics;
7. what must be deleted irreversibly versus retained temporarily for anti-resurrection/security;
8. prohibited remote data and prohibited logs;
9. data minimization rules;
10. local-only fallback and cloud disable/rollback behavior;
11. region-selection criteria without choosing a region prematurely;
12. explicit confirmation that public discovery, public matchmaking, public profiles and global rankings remain eliminated.

Phase 1C is architecture/policy only. It must not add Firebase SDKs, credentials, network calls, Auth runtime, Firestore collections, Security Rules, Cloud Functions, pairing, Connected Rivalry or Remote Joining UI.

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
- Phase 1B provider and operational decision — DECISION RECORDED / current provider-decision candidate;
- Phase 1C privacy, retention and remote data inventory — AUTHORIZED NEXT;
- Phase 1D remote schema and API contract — BLOCKED behind 1C;
- Phase 1E deterministic two-device/offline sync harness — BLOCKED behind 1D;
- production-capable sync/provider connection — BLOCKED until the readiness gates are proven.

Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED until one bounded runtime prerequisite/candidate is explicitly authorized after the architecture and threat-model gates.

The former clean-stop wording to "stop and wait for a further explicit owner instruction" was satisfied by the owner's later 2026-08-17 instruction to prioritize and continue the prerequisite path. Do not revive that obsolete waiting loop.

## Firebase provider boundary

Firebase is a selected candidate, not a connected dependency.

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

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal startup minimum = `2700 ms`
- reduced-motion startup = `220 ms`

Normal PRs exercise the repository's protected workflow families. Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study

1. Verify live `main` contains PR #76 merge `b1fafd9c...` or reconstruct anything newer.
2. Confirm v1.4.0 / `1.4.0-r1` remains the deployed runtime unless newer runtime source proves otherwise.
3. Read `VERSIONING_POLICY.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `CLOUD_SYNC_READINESS_PHASE_1.md`, `CLOUD_PROVIDER_DECISION_2026-08-17.md`, `CLOUD_STORAGE_FOUNDATION.md`, `PROJECT_STATE.md` and this file.
4. Confirm Firebase is only a provider candidate and no SDK/network/Auth runtime is authorized.
5. Confirm public community/global rankings remain ELIMINATED.

### Execution

**Current authorized prerequisite work:** complete Phase 1C private remote data inventory, privacy and retention policy as one bounded candidate.

After Phase 1C is fully validated and merged, continue to the next smallest safe Cloud/Sync Readiness prerequisite under the owner's standing instruction. Do not ask for repeated permission merely to progress to the next dependency gate, but never collapse multiple gates into one implementation or start blocked runtime early.
