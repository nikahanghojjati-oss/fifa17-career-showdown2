# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1C remote-data policy)

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

PR #76 added the first owner-authorized Remote Joining prerequisite: a deterministic revision/conflict/tombstone/idempotency model plus the permanent versioning policy and detailed Remote Joining execution roadmap. PR #77 selected Firebase Authentication + Cloud Firestore as the primary future provider candidate without connecting provider runtime. Both changes are architecture-only and production remains v1.4.0 / `1.4.0-r1`.

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

Phase 1C — private remote data inventory, privacy and retention policy: **CURRENT BOUNDED CANDIDATE**.

`REMOTE_DATA_PRIVACY_RETENTION_POLICY.md` now defines the candidate architecture: remote-by-need only, unshared Saves/recovery material local-only, optional Cloud Backup separate, tombstones as metadata rather than deleted-content backups, bounded pairing/idempotency/security metadata, account deletion gating, cloud-disable/local-only fallback and no public discovery/rankings.

Phase 1D — exact provider-compatible remote schema and API/authorization contract: **NEXT PREREQUISITE AFTER PHASE 1C MERGES**.

Later phases remain gated: deterministic two-device/offline harness → provider/emulator/Security Rules proof → private account/auth/authorization → paired-device/private-session capability → Connected Rivalry → Private Remote Joining.

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

The owner's 2026-08-17 instruction separately authorizes continued bounded prerequisite advancement on the prioritized Remote Joining path. Phase 1C is the current architecture-only prerequisite candidate and does not alter production runtime. After it merges, `NEXT_TASK.md` advances to Phase 1D remote schema/API/authorization contract work.

Do not jump to Firebase integration, account/auth runtime, pairing, Connected Rivalry or Remote Joining until the intervening gates are complete and proven.
