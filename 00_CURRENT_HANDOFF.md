# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This file is the concise rolling handoff for the current development/investigation boundary. It does not own every current fact. `PROJECT_STATE.md` owns current production state, `NEXT_TASK.md` owns the active implementation boundary, `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status, and frozen release/proof documents own evidence for the release they name.

## Current production authority

Application milestone: `v1.3.0 — Recovery & Device Resilience Hardening`
Installable Offline App runtime: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Current product layer: Visible Local Profiles / Save Library Core UI
Feature release version: intentionally unassigned

The Local Profiles / Save Library dependency chain is complete, merged, deployed and production-proven:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53.

Do not reimplement this foundation. Stable `profile_*`, `save_*` and `season_*` identities, multi-save storage, explicit `activeSaveId`, additive creation, switching, scoped deletion, read-only Local Profiles and fail-closed persistence/recovery behavior are shipped product behavior.

## Active source-grounded audit

Owner request: deeply reconstruct current source; challenge the August 14 external review rather than treating it as authority; trace stable identity through Legacy and Analytics; re-evaluate the roadmap without reviving stale version numbering; improve the handoff system with less duplicated authority; implement no major product feature until the dependency boundary is proven.

Verified base `main` SHA:

`a8a34ee2d64b63a68ec471f2623a2f27ff9e8c8b`

Active branch:

`agent/identity-analytics-roadmap-audit`

Open historical drafts independently checked:

- PR #37 / `agent/v13-hardening` remains open, draft, unmerged and based on obsolete state;
- PR #35 / `agent/v1.2-installable-offline-r2` remains open, draft, unmerged and based on obsolete state.

Neither is a development baseline.

## Source and evidence inspected

Current authority/bootstrap:

- `00_HANDOFF_GOLDEN_RULE.md`
- `00_DEVELOPER_START_HERE.md`
- this file
- `PROJECT_STATE.md`
- `NEXT_TASK.md`
- `POST_V1_ROADMAP_EXECUTION.md`
- current Local Profiles / Save Library handoffs
- v1.3 release and production-proof documents

Identity, persistence and recovery:

- `js/saveLibraryFoundation.js`
- `js/saveLibraryPersistence.js`
- `js/saveLibraryRuntime.js`
- `js/saveLibraryUI.js`
- `js/storage.js`
- `js/backup.js`
- permanent Save Library, recovery and browser contracts

Legacy and Analytics:

- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `js/legacy.js`
- `js/seasonEngine.js`
- `js/showdown.js`
- Statistics contracts/fixtures

Roadmap/authority coherence:

- `CLOUD_STORAGE_FOUNDATION.md`
- `ROADMAP_AMENDMENTS.md`
- `tests/contracts/cloud-foundation-contracts.cjs`
- `tests/contracts/release-authority-coherence.cjs`
- repository tree and recent authority-reconciliation history

## Assumptions rejected

- Save Library is not in progress. It is shipped.
- Stable local IDs do not still need to be invented. They exist.
- Multi-save creation/switch/delete UI does not still need to be built as foundation work.
- Historical `v1.4 Legacy`, `v1.5 Analytics` or later numeric labels are not current release assignments.
- Profile rename/archive is not required merely to call Save Library complete.
- Display-name equality is never identity proof.
- A naive switch from name-keyed Analytics to `profileId`-keyed Analytics is not automatically correct person-level career semantics.
- Candidate A/B/C compatibility does not mean the current v1 backup envelope is a complete fresh-device export of every Save Library entry.

## Reproduced Analytics identity defect

Current `js/analytics.js` aggregates career managers through `analyticsNormalizeName()` and `getOrCreateManagerStats()`.

`calculateCareerAnalytics()` passes `showdown.managers[playerKey]` into that name-keyed map and does not consume `showdown.identity.managerProfileIds`.

Therefore two distinct authoritative `profile_*` identities with the same visible label collapse into one career Analytics row. The same merged manager rows feed career records and Trophy Room cabinets/leaderboards.

The existing Statistics fixture protects two distinct labels (`Alex`, `Jordan`) but calls them "stable manager identities" even though the fixture contains no profile IDs. That wording is stale and does not prove identity-safe longitudinal aggregation.

## Identity matrix for Analytics inputs

A. Authoritative identity available:

- current Save Library Showdowns whose `identity.managerProfileIds` resolve to known Local Profiles;
- post-cutover completed Showdowns archived with those profile references;
- an exact Legacy copy of the active singleton during migration when exact Showdown identity proves the relationship.

B. Safely recoverable identity:

- only relationships proved by stable record identity or an existing valid reference, never by matching display names.

C. Intentionally unresolved historical identity:

- migrated historical Legacy records that are not the exact active Showdown retain null manager profile references and are explicitly counted as requiring historical mapping.

D. Display-name-only legacy input:

- pre-identity historical data can exist without authoritative profile references. Current Analytics still accepts those labels, but the identity layer must not infer a profile solely from them.

## Cross-Save identity dependency

The current Save Library candidate creates two fresh Local Profiles for each newly created Save. Permanent deterministic/browser proof intentionally allows equal visible names to remain separate IDs and currently proves three same-name Saves as six distinct Local Profiles.

That means `profile_*` is stable identity, but the current product does not yet establish that two profiles from different Saves represent the same real manager.

Consequences:

- name-keyed career Analytics can falsely merge distinct people/profiles;
- profile-keyed career Analytics alone could split one real manager across multiple Saves;
- a future rename could make name-keyed Analytics split one stable profile by label;
- full authoritative person-level longitudinal Analytics requires explicit cross-Save/profile linkage semantics plus explicit treatment of unresolved historical identity.

Do not solve this by silent name matching.

## Legacy / Analytics dependency finding

The earlier intuition that richer historical identity treatment should precede full longitudinal Analytics remains valid, but not as a mandatory monolithic "Legacy release then Analytics release" queue.

Showdown- or Season-scoped history/achievement calculations can remain independent because they do not require cross-history person identity.

Cross-career achievements, manager totals, career records and authoritative longitudinal Analytics do require a proven identity relationship across Saves/history.

A future explicit historical/profile mapping capability should be owned behind the existing identity/storage transaction boundaries. `js/legacy.js` may surface history, but UI code must not become raw canonical mutation authority.

## Save Library repeated-use proof boundary

Already automated/proven includes multi-save creation, three Saves, same-name profiles, explicit switching, switch plus reload, active/non-active deletion, keyboard activation/focus, Chromebook containment, phone containment, reduced motion, corrupt/dual authority fail-closed behavior and stale runtime authority contracts.

Still not equivalent to long-term human usage proof:

- large Save counts over repeated real use;
- many repeated switch/reload cycles over time;
- true installed-PWA process restart behavior;
- combined browser/PWA interruption and stale-tab journeys beyond current targeted contracts;
- extended real-device Chromebook/mobile use.

Do not redesign those areas without reproduced friction.

## Backup portability boundary

Under Save Library authority, Candidate A's current v1 envelope projects the authoritative active Save into the historical `activeShowdown` payload together with Legacy and preferences. The normal envelope does not serialize the complete `careerModeShowdown.saveLibrary` registry/non-active Saves.

Candidate C preparation preserves non-active Saves that already exist in the destination library while replacing/restoring the active entry.

Therefore same-device restore compatibility is proven, but a full fresh-device multi-Save library round trip is not currently the same guarantee. Backup/import envelope evolution remains a separate future candidate and is not authorized by this audit.

## Documentation/handoff drift found

`CLOUD_STORAGE_FOUNDATION.md` still contains current-facing prose saying Local Profiles / Save Library must follow v1.3 and remain the next structural direction, despite those layers already being shipped.

Recent authority-reconciliation commits updated roadmap/contracts but did not remove all stale current-facing cloud prose. Existing regex contracts can pass while that contradiction remains.

This is the concrete reason to strengthen authority ownership/coherence rather than add another large disconnected handoff.

## Current decision

No Analytics runtime behavior will be changed on this audit branch.

A direct profile-ID key swap is not sufficiently correct because cross-Save real-manager identity is not yet established. Historical ambiguous records must remain unresolved rather than guessed.

This branch is limited to:

1. resynchronizing current authority/roadmap documentation to the source-proven state;
2. making authority ownership clearer so one current fact has one primary owner;
3. correcting stale cloud dependency prose;
4. strengthening existing deterministic coherence checks against this specific drift class;
5. correcting misleading test narration where it claims label fixtures prove stable identity.

No gameplay, persistence, Save Library runtime, recovery, PWA, scoring, visual, performance or release-version behavior is being changed.

## Validation / publication state

Local clone execution is unavailable in this session because the execution container could not resolve GitHub hosts. No product inference was made from that environment limitation. Repository reads/writes use the authenticated GitHub connector.

Candidate head: pending documentation/contract edits.
Draft PR: pending.
CI: pending exact candidate head.
Merge: not authorized until exact candidate evidence is reviewed.
Production proof: unchanged from the shipped PR #53 / v1.3 baseline because this branch currently changes no runtime bytes.

## Clean stop condition

Finish the bounded authority/roadmap/coherence repair, obtain exact-head CI evidence, update this handoff with the candidate SHA/PR/result, and stop before implementing a product identity or Analytics behavior change unless that next candidate has explicit owner/dependency authority.
