# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-14 ET

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime feature merge: `95e98c13bbb4cac485531565c3577ae31286d0af`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI and the explicit cross-Save/historical manager identity-linkage foundation are complete, merged, deployed and production-proven.

Identity foundation PR #57 final head: `9bf4cc19c6ec6485c28a7dd542cbac74052d44bc`.
Identity foundation PR #57 merge: `95e98c13bbb4cac485531565c3577ae31286d0af`.

All 13 normal PR workflow families passed the exact final head. All 14 permanent push workflow families passed the exact runtime merge. Post-merge Stability run `31812858587` succeeded through repository contracts, canonical Chromium integration, deployed byte verification, deployed Save Library, deployed manager identity linkage, Candidate A/B/C, offline and complete journey proof.

## Current owner-authorized candidate

On 2026-08-14 ET the owner explicitly instructed the developer to correct repository record inconsistencies and then work independently according to the roadmap toward the next step with maximum attention to detail and accuracy.

That later owner instruction authorizes the previously identified smallest high-value candidate: a narrow identity-safe longitudinal Career Analytics correction with coherent Trophy Room consumption.

Active branch:

`agent/identity-safe-career-analytics`

Exact verified branch base:

`8c6fad42e38b4964d848128e40569442c3fa06d5`

Production remains unchanged until this candidate passes exact-head validation, is merged by expected head, and passes exact production/deployed-site proof.

## Shipped identity semantics the candidate must consume

1. stable `profile_*`, `save_*` and `season_*` identities remain authoritative;
2. fresh New Showdown creation still intentionally creates fresh Local Profiles for its two manager roles;
3. a user who knows two Save roles represent the same real manager can explicitly reuse an existing Local Profile across Saves;
4. display-name equality never maps identity automatically;
5. same-name distinct managers remain separate unless an explicit stable-identity action links a role;
6. matching Legacy copies inherit a Save-role link only through exact stable `identity.saveId` equality;
7. historical-only Legacy roles may be explicitly mapped to an existing Local Profile or explicitly left/returned unresolved;
8. profiles are retained after Save deletion and explicit linkage never destructively merges/deletes the previous profile;
9. Candidate A keeps the existing v1 envelope while Candidate C restore preparation preserves valid incoming active `profile_*` references and reconstructs only the minimum missing referenced profiles when necessary;
10. Save/Legacy identity mutations remain transaction-owned, exact-raw guarded and fail closed on stale authority.

Do not silently map historical or cross-Save identity because display names match.

## Required Analytics behavior

The implementation must correct the current name-keyed longitudinal defect without converting display labels into identity authority.

At minimum it must protect:

- `js/analytics.js` career-manager aggregation keys and cache invalidation;
- exact stable `identity.managerProfileIds` across linked Saves;
- two distinct profiles with the same visible manager name remaining separate career identities;
- one explicitly reused profile across multiple Saves aggregating as one career identity;
- historical records whose manager profile reference remains null/unresolved without guessing from labels;
- unresolved historical contributions remaining excluded from identified longitudinal manager totals, cabinets and manager leaderboards until explicitly mapped;
- overall completed Showdown count, seasons, Showdown points, trophies and Showdown/Season-scoped records remaining complete even when a manager role is unresolved;
- Rivalry/Showdown-scoped Analytics behavior remaining correct and label-scoped because it does not require cross-history identity;
- Local Profile display names being presentation labels for identified careers, never aggregation keys;
- Analytics calculation cache and Career Statistics/Trophy Room render caches invalidating when identity mapping changes affect derived output;
- Trophy Room consuming the corrected Career Analytics model coherently;
- deterministic and browser regression evidence for same-name distinct managers, one linked manager across Saves, unresolved historical roles, explicit mapping refresh and Trophy Room coherence.

A direct profile-ID key swap alone is not sufficient. The unresolved-history and cache semantics above are part of the authorized behavior.

## Current record correction

`00_DEVELOPER_START_HERE.md` was stale because it stopped the completed dependency chain at PR #53 and still narrated cross-Save/profile linkage as future work.

The active candidate must correct that bootstrap record to acknowledge PR #57 and merge `95e98c13bbb4cac485531565c3577ae31286d0af` as shipped production authority without assigning a new feature/application release version.

## Separate future boundary: backup portability

Candidate A/B/C remain compatible with Save Library and explicit manager identity linkage, but the current v1 backup envelope projects the active Save rather than serializing the complete Save Library registry.

Same-device restore preserves non-active Saves already present in the destination library. A complete fresh-device multi-Save library round trip remains separate future backup/import envelope work.

Do not combine that evolution with the current Analytics work merely because both involve Save Library data.

## Possible future areas are not assignments

Separately bounded future areas after this candidate include:

- profile rename/edit semantics;
- standalone Local Profile creation/reuse outside the current New Showdown behavior;
- further Save Library/identity-link UX refinement backed by reproduced usability evidence;
- backup/import envelope evolution;
- Legacy/Achievements expansion beyond what this narrow Analytics correction needs;
- optional content and custom challenge content;
- Cloud Readiness;
- opt-in Cloud Backup;
- private paired-device capability;
- Connected Rivalry;
- private sharing/groups;
- conditional future community/discovery/rankings.

Historical milestone numbers for these outcomes are not release assignments.

## Hard out-of-scope defaults

Do not expand this candidate into cloud storage, accounts, authentication, QR pairing, synchronization, network multiplayer, device/writer IDs, distributed revision clocks, historical auto-linking by name, backup/import redesign, generic migration framework work, profile editing/renaming, gameplay/scoring changes, unrelated Statistics/Legacy/Trophy Room redesign, global Smart Back redesign, global visual redesign, loading/music redesign or release-version assignment.

## Architecture locks

Preserve stable `profile_*`, `save_*` and `season_*` identities. Display names remain labels, never identity keys.

Before explicit singleton cutover, public canonical storage remains `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

After successful Save Library cutover, public canonical storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Never make `careerModeShowdown.activeShowdown` a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains product Save Library and manager identity mutation authority. Analytics and UI code must not directly own canonical `localStorage`.

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

The new Analytics behavior must be added to permanent deterministic and Chromium proof. Never weaken tests, timeouts or performance ceilings merely to obtain green CI.

## Stop condition

Complete only this explicitly authorized identity-safe longitudinal Career Analytics/Trophy Room candidate and its record/validation coherence.

After exact production/deployed proof and a current authority seal, stop before backup portability, profile editing, cloud, another Analytics expansion, gameplay changes or any other substantial product candidate unless a later explicit owner instruction authorizes it.
