# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1E deterministic two-device/offline/reconnect harness)

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` and `REMOTE_JOINING_EXECUTION_ROADMAP.md` own dependency direction/status. Release/proof documents remain frozen evidence for the release they name.

## Development continuity infrastructure

The repository's Work Environment Continuity system remains active through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. Every fresh development environment must follow the repository's validate → archive/replace → assess sequence before substantial work. Continuity infrastructure is excluded from the website runtime and does not itself authorize product changes.

## Production authority

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Current feature release version: **v1.4.0**
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)

PR #76 added the deterministic revision/conflict/tombstone/idempotency foundation. PR #77 selected Firebase Authentication + Cloud Firestore as the primary future provider candidate without connecting provider runtime. PR #78 fixed the private remote-data/privacy/retention boundary. PR #79 fixed the exact remote schema/API/authorization/replay/two-owner governance contract. All four are protected non-runtime prerequisites and production remains v1.4.0 / `1.4.0-r1`.

## Completed local dependency chain

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. explicit cross-Save/historical manager identity linkage foundation — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59. Identity-Safe Career Analytics is production-proven.
7. Local Profile display-label editing and `1.3.0-r2` whole-shell delivery — PR #61.
8. formatVersion 2 full multi-Save backup/import portability — PR #67.
9. Phase A documentation authority synchronization — PR #68.
10. Phase B first slice — Save Library / Local Profile Experience 2.0 — PR #70.
11. Phase C first slice — Showdown Home & Season Experience — PR #73.

All eleven local/product layers are shipped and production-proven.

## Cloud / Sync Readiness state

The owner opened the prerequisite lane on 2026-08-17 with an explicit instruction to prioritize everything required for Private Remote Joining in dependency order, without rushing or skipping stability gates.

Phase 1A — deterministic revision model: **DONE / MERGED / PROTECTED** through PR #76.

The protected model proves server-authoritative monotonic revision, immutable `baseRevision` compare-and-swap, explicit stale conflicts, tombstones/anti-resurrection, explicit restore, replay/idempotency protection, scope separation and device attribution without provider/network/localStorage ownership.

Phase 1B — provider and operational decision: **DONE / MERGED / PROTECTED** through PR #77.

Firebase Authentication + Cloud Firestore is the primary future provider candidate. Firestore persistent offline cache must remain disabled for project sync because provider last-write-wins reconnect semantics are incompatible with the project's explicit-conflict rule. No provider is connected yet.

Phase 1C — private remote data inventory, privacy and retention policy: **DONE / MERGED / PROTECTED** through PR #78.

`REMOTE_DATA_PRIVACY_RETENTION_POLICY.md` protects remote-by-need only, unshared Save/recovery material local-only by default, optional Private Cloud Backup separation, minimized remote identity/metadata, tombstone anti-resurrection without deleted gameplay, bounded invite/idempotency/security retention, account-deletion revocation, local-only fallback and the permanent public-feature prohibition.

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **DONE / MERGED / PROTECTED** through PR #79.

`REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md` and dormant `js/cloudSyncRemoteContract.js` define exact Firebase-compatible document paths/fields, the revision-controlled envelope, immutable original `baseRevision` transaction behavior, deterministic replay/conflict output, deny-by-default create/read/update/delete/restore/invite/join/revoke authorization, account/profile/save/season/device/installation/rivalry/session identity boundaries, two-owner rivalry deletion/retention behavior and Firebase Auth versus application-data ownership.

Phase 1E — deterministic two-device/offline/reconnect synchronization harness: **CURRENT BOUNDED CANDIDATE**.

`CLOUD_SYNC_READINESS_PHASE_1E.md`, dormant `js/cloudSyncTwoDeviceHarness.js` and permanent `tests/contracts/cloud-sync-two-device-harness-contracts.cjs` prove the provider-neutral multi-device behavior required before Firebase is connected. The harness composes the Phase 1A CAS/replay/tombstone kernel with current simulated account/device/rivalry authority, recursively immutable queued intents, reconnect/revocation semantics and in-memory Candidate C-grade local transaction proof.

Phase 1E is not production runtime. It is deliberately absent from the application shell and contains no Firebase SDK, remote credential, production network access or direct `localStorage` ownership.

Phase 1F provider connection / Firebase Emulator Suite / deny-by-default Security Rules proof is **NEXT AFTER PHASE 1E MERGES / BLOCKED until then**. Later stages remain gated: private account/auth/authorization → registered devices/private pairing/session capability → Connected Rivalry → Private Remote Joining → hardening/stable release.

## Versioning authority

`VERSIONING_POLICY.md` is permanent owner authority for release numbering.

- shipped bug fixes, maintenance and small backward-compatible runtime corrections use PATCH bumps;
- meaningful backward-compatible product capabilities use MINOR bumps;
- transformative or compatibility-breaking product boundaries may use MAJOR bumps;
- a new application version begins at `-r1`;
- `-rN` identifies a whole-shell generation and may not substitute for a required application-version bump;
- documentation, tests and deliberately dormant non-runtime prerequisite models do not consume a visible application version by themselves.

A version is stable only after required exact-head validation, merge, deployment and production verification.

## Identity-Safe Career Analytics state

`js/analytics.js` remains derived Analytics authority. Stable `profile_*` identity, not display-name equality, owns longitudinal aggregation. Same-name distinct profiles remain distinct; explicit reuse aggregates across Saves. unresolved historical roles remain excluded from identified longitudinal manager totals until explicitly mapped; identity-independent Showdown/Season totals remain complete.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only destructive import Apply stage.

Candidate C must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority. Preserve last-moment preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery.

**formatVersion 2 is live.** Complete fresh-device multi-Save portability is production-proven and closed.

Canonical public storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

No future cloud/sync module may directly own `localStorage`. Future downloaded state must pass the proven local transaction/recovery authority before it can affect canonical storage.

## Installable Offline App and performance state

Whole-shell label remains exactly `1.4.0-r1`; immediate previous known-good is `1.3.0-r2`.

Locked ceilings remain:

- eager raw `162782` <= `165000` bytes
- eager gzip `37416` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251274` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Never weaken tests, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Protected gameplay and product philosophy

Exactly two managers. Showdown lengths remain `1`, `3`, `5`, `10`. Both managers use the same selected league and different permanent clubs. Maximum Season score remains 11. Equal non-zero scores are Draws; only 0–0 uses league position and then league points.

Career Mode Showdown remains a private two-manager companion.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private Remote Joining is **PRIORITIZED LONG-TERM** and **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. It is not deprioritized or permanently blocked.

The ordered path is:

completed local recovery / identity / portability
→ Cloud / synchronization readiness
→ private account / authentication / authorization
→ secure paired-device / private-session capability
→ Connected Rivalry synchronization and two-device proof
→ Private Remote Joining.

## Current authorization boundary

**No product candidate is currently authorized.** That phrase means no new user-facing production runtime feature is authorized at this exact boundary.

The owner's 2026-08-17 instruction separately authorizes continued bounded prerequisite advancement on the prioritized Remote Joining path. Phase 1E is the current provider-neutral dormant prerequisite candidate and does not alter production runtime. After it merges and is proven, `NEXT_TASK.md` may advance to Phase 1F provider/emulator/Security Rules proof only after Work Environment Continuity reassessment.

Do not jump to Phase 1F, account/auth runtime, pairing, Connected Rivalry or Remote Joining until Phase 1E's exact merge gate is complete and the intervening gates remain satisfied.
