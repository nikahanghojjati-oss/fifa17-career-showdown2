# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-14 ET

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI is complete, merged, deployed and production-proven.

PR #53 final head: `2021a0a2eaed26f0aca6639278de82afe2a28d6d`.
PR #53 merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

All 13 normal PR workflow families passed the exact final head. All 14 permanent push workflow families passed the exact runtime merge. Release Integration Burn-In `31771269732` and post-merge Stability `31771269740` succeeded, including deployed-site proof.

## Immediate next-task boundary

There is still no automatically authorized next substantial runtime/product implementation candidate.

The completed source-grounded audit has identified a real Career Analytics identity defect and the dependency that prevents a naive fix:

1. `js/analytics.js` currently groups career managers by normalized display name;
2. it does not consume `identity.managerProfileIds` for career aggregation;
3. distinct same-name authoritative profiles can therefore collapse into one career manager row;
4. current New Showdown creation intentionally creates fresh stable Local Profiles per Save/manager role;
5. a direct profile-ID key swap could therefore split one real manager across multiple Saves rather than establish person-level career identity;
6. historical Legacy profile references may deliberately remain null when the relationship is not provable.

Do not silently map historical or cross-Save identity because display names match.

## Smallest high-value future product candidate

The smallest source-supported product candidate is not "finish Save Library" and not a broad Analytics redesign.

If separately authorized, the next bounded product candidate should establish explicit manager identity linkage semantics across Saves/history. At minimum it must decide:

- whether and how an existing Local Profile can be selected/reused when creating another Save;
- whether separate existing profiles can be explicitly linked without destroying their stable IDs;
- how unresolved historical manager relationships are represented;
- how an owner can explicitly map historical records without name guessing;
- whether historical Showdown labels remain frozen or follow later profile display-name changes;
- which canonical domain owns the relationship and how mutations remain transaction-safe.

That candidate must not become generic profile CRUD, rename/archive scope creep or an implicit Analytics rewrite.

After authoritative cross-Save/historical identity semantics exist, a separate narrow Analytics candidate can make career aggregation consume authoritative identity while preserving explicitly unresolved history.

This candidate is identified, not automatically authorized for runtime implementation by repository state.

## Safe work already authorized by the current audit request

The current `agent/identity-analytics-roadmap-audit` branch is limited to source-grounded authority repair:

- record the reproduced Analytics identity limitation without changing runtime behavior;
- resynchronize roadmap classification to actual shipped state;
- correct stale cloud dependency narration;
- reduce duplicated handoff authority;
- strengthen deterministic authority-coherence checks;
- correct misleading test narration that calls name-only fixtures stable identity proof.

No gameplay, persistence, recovery, PWA, Analytics calculation, Save Library runtime, visual or release-version behavior is part of this branch.

## Separate future boundary: backup portability

Candidate A/B/C remain compatible with Save Library, but the current v1 backup envelope projects the active Save rather than serializing the complete Save Library registry.

Same-device restore preserves non-active Saves that already exist in the destination library. A complete fresh-device multi-Save library round trip remains separate future backup/import envelope work.

Do not combine that evolution with identity/Analytics work merely because both involve Save Library data.

## Possible future areas are not assignments

Separately bounded future areas include:

- explicit cross-Save/profile linkage and historical mapping semantics;
- profile rename/edit semantics;
- standalone Local Profile creation/reuse outside the current New Showdown behavior;
- identity-safe career Analytics;
- further Save Library UX refinement backed by reproduced usability evidence;
- backup/import envelope evolution;
- Legacy/Achievements expansion;
- optional content and custom challenge content;
- Cloud Readiness;
- opt-in Cloud Backup;
- private paired-device capability;
- Connected Rivalry;
- private sharing/groups;
- conditional future community/discovery/rankings.

Historical milestone numbers for these outcomes are not release assignments.

## Hard out-of-scope defaults until separately authorized

Do not automatically begin cloud storage, accounts, authentication, QR pairing, synchronization, network multiplayer, device/writer IDs, distributed revision clocks, historical auto-linking by name, backup/import redesign, generic migration framework work, gameplay/scoring changes, unrelated Statistics/Legacy/Trophy Room redesign, global Smart Back redesign, global visual redesign, loading/music redesign or release-version assignment.

## Architecture locks for whatever comes next

Preserve stable `profile_*`, `save_*` and `season_*` identities. Display names remain labels, never identity keys.

Before explicit singleton cutover, public canonical storage remains `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

After successful Save Library cutover, public canonical storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Never make `careerModeShowdown.activeShowdown` a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains product Save Library mutation authority. UI code must not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C Apply must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

Preserve the Installable Offline App whole-shell exactness and protected product/gameplay surfaces.

## Performance and validation boundary

Locked ceilings remain:

- eager raw `162781` <= `165000`
- eager gzip `37415` <= `37500`
- Reus startup portrait `88492` <= `95000`
- combined first-party startup `251273` <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation PRs generally run 13 workflow families; Release Integration Burn-In remains main/manual release authority.

Never weaken tests, timeouts or performance ceilings merely to obtain green CI.

## Stop condition

Complete and validate the bounded authority/roadmap/coherence audit branch. Do not begin the identified identity-linkage product candidate or an Analytics runtime correction until explicit owner/dependency authorization establishes that next implementation scope.
