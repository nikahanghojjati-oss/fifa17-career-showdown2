# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1E deterministic two-device/offline/reconnect harness)

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
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)
Feature release version: **v1.4.0**

Local Profiles / Save Library is a shipped and protected dependency milestone beneath the connected-development lane.

PRs #76, #77, #78 and #79 are merged and closed. Their Cloud/Sync architecture/policy/dormant-source work is deliberately not loaded by the production application, so no visible application bump was appropriate. `VERSIONING_POLICY.md` permanently requires meaningful shipped runtime changes to receive PATCH/MINOR/MAJOR version bumps according to scope.

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
- Cloud/Sync Readiness Phase 1C private remote data inventory/privacy/retention boundary (PR #78, `59957f8b0c29ce0cd480a0e9270a095160005599`)
- Cloud/Sync Readiness Phase 1D exact Firebase-compatible remote schema/API/authorization/replay/two-owner deletion contract (PR #79, `fc2e8e8b921a435103a438a9239efbb890584d22`)

**Authorized product candidate:** none.

No product candidate is currently authorized. This means no new user-facing production runtime feature is authorized at this boundary.

## Current authorized prerequisite candidate

**Cloud/Sync Readiness Phase 1E — deterministic two-device and offline/reconnect synchronization harness.**

`CLOUD_SYNC_READINESS_PHASE_1E.md`, dormant `js/cloudSyncTwoDeviceHarness.js` and permanent `tests/contracts/cloud-sync-two-device-harness-contracts.cjs` are the current bounded candidate. Phase 1E must prove the provider-neutral behavior that later Firebase integration is required to preserve.

Phase 1E must remain dormant source/test/authority work. It must not add Firebase production SDK/runtime imports, Firebase Auth runtime, production Firestore collections/data, deployed Security Rules, Cloud Functions, account UI, pairing runtime, Connected Rivalry runtime, Remote Joining UI, persistent Firestore offline cache or Cloud Backup.

The Phase 1E candidate must permanently prove:

1. two devices can start from one authoritative revision and only one stale concurrent intent may be accepted;
2. stale writes return explicit conflict rather than silent overwrite;
3. exact accepted idempotency replay remains non-mutating while key reuse with a different fingerprint fails explicitly;
4. deletion creates authoritative tombstone state and a long-offline stale device cannot resurrect it;
5. restoration is a separate explicit authorized mutation against the current tombstone revision;
6. interrupted/provider-style retry preserves the original recursively immutable client intent, especially `baseRevision` and payload;
7. offline intent retains the base observed at creation even after reconnect refreshes current authority;
8. reconnect rechecks current account, device, rivalry membership and relationship authority before refreshing the device observation;
9. revoked devices, disabled accounts, revoked relationships and changed membership invalidate stale cached assumptions;
10. malformed/unsupported payloads are rejected before authoritative mutation;
11. local canonical state changing between preview and Apply is detected before overwrite;
12. precondition/write/rollback/ownership failure cannot clobber newer local state the transaction no longer owns;
13. cloud disable preserves local-only Save Library operation and Candidate A/B/C authority boundaries;
14. repeated equivalent executions produce the same deterministic final state;
15. no Phase 1E proof path requires production Firebase, production network access, credentials or direct `localStorage` ownership.

## Next prerequisite after Phase 1E merges

**Cloud/Sync Readiness Phase 1F — Firebase provider connection, Emulator Suite and deny-by-default Security Rules proof.**

Phase 1F is conditionally next only after Phase 1E is fully validated, merged and independently verified on live `main`. Phase 1F may connect the selected provider only inside a bounded emulator/security-rules milestone and must prove exact provider retry behavior, authorization denial, private invite capability behavior and local-only fallback before any account or pairing product runtime is authorized.

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
- Phase 1C privacy, retention and remote data inventory — DONE / PR #78;
- Phase 1D remote schema and API/authorization contract — DONE / PR #79;
- Phase 1E deterministic two-device/offline sync harness — CURRENT BOUNDED CANDIDATE;
- Phase 1F provider connection/emulator/Security Rules proof — NEXT AFTER 1E MERGES / BLOCKED until then.

Cloud/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED until Phase 1E is proven and a later bounded runtime prerequisite is explicitly opened by dependency order and current source authority.

The former clean-stop wording to "stop and wait for a further explicit owner instruction" was satisfied by the owner's later 2026-08-17 instruction to prioritize and continue the prerequisite path. Do not revive that obsolete waiting loop.

## Firebase provider boundary

Firebase Authentication + Cloud Firestore is the selected primary future provider candidate, not a connected dependency during Phase 1E.

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

The repository protects 14 permanent workflow families and 27 protected multiline executable workflow blocks. Normal PRs generally exercise 13 workflow families; Release Integration Burn In remains main/manual release authority.

- eager raw <= `165000` bytes
- eager gzip <= `37500` bytes
- Reus startup portrait <= `95000` bytes
- combined first-party startup <= `260000` bytes
- normal startup minimum = `2700 ms`
- reduced-motion startup = `220 ms`

Normal PRs exercise the repository's protected workflow families. Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study

1. Verify live `main` contains PR #79 merge `fc2e8e8b921a435103a438a9239efbb890584d22` or reconstruct anything newer.
2. Confirm v1.4.0 / `1.4.0-r1` remains the deployed runtime unless newer runtime source proves otherwise.
3. Read `VERSIONING_POLICY.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `CLOUD_SYNC_READINESS_PHASE_1.md`, `CLOUD_SYNC_READINESS_PHASE_1E.md`, `CLOUD_PROVIDER_DECISION_2026-08-17.md`, `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md`, `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md`, `CLOUD_STORAGE_FOUNDATION.md`, `PROJECT_STATE.md` and this file.
4. Confirm Firebase remains disconnected in production and Phase 1F is blocked while Phase 1E is unmerged.
5. Confirm public community/global rankings remain ELIMINATED.

### Execution

**Current authorized prerequisite work:** complete and validate Phase 1E deterministic two-device/offline/reconnect synchronization harness as one bounded provider-neutral dormant-source/test candidate.

Do not connect Firebase in Phase 1E. After Phase 1E is fully validated and merged, reassess Work Environment Continuity before starting the distinct Phase 1F provider/emulator/Security Rules milestone. Do not ask for repeated permission merely to progress to the next dependency gate when source authority and the standing owner instruction still authorize it, but never collapse multiple gates into one implementation.
