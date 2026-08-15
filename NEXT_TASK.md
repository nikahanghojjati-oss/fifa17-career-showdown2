# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-15 ET

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Current production runtime feature merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`
Validated PR #61 head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption and presentation-only Local Profile display-label editing are complete, merged, deployed and production-proven.

PR #61 passed all 13 normal pull-request workflow families on exact unchanged head `cfedec8dccde51a7a9932a1bd3a92cc91514e579`, merged with expected-head protection to `67095a02188ebd246da0d0f2cd61158b8e9e504e`, and passed all 15 permanent push/deployment runs. Pages deployment `5922244376`, Release Integration Burn-In `31894832592`, Stability `31894832637` and deployed-site-smoke job `95036682319` succeeded. Independent proof matched 71 runtime files plus Service Worker and manifest byte for byte and passed the public profile-label journey with stable IDs and unchanged saved Showdown labels.

## Current implementation authorization

The one later owner-authorized Local Profile display-label candidate is closed as production-proven. Completion assigns no next substantial product area.

No new substantial runtime product candidate is authorized. Do not infer implementation authority from roadmap order, an old branch, an open historical PR or the existence of a possible future area.

### IMMEDIATE NEXT TASK AFTER FULL STUDY

After independently fetching live `main`, recent commits and open PRs and reading the permanent authority files:

1. verify live production still descends from r2 runtime merge `67095a02188ebd246da0d0f2cd61158b8e9e504e` or reconstruct every newer change before proceeding;
2. verify the public site, `1.3.0-r2` whole-shell identity, open PRs, branches, releases, authority files and current tests;
3. preserve all shipped Local Profile label, stable-identity, Analytics, recovery, PWA, gameplay, visual, accessibility and performance semantics;
4. if no later explicit owner instruction authorizes a bounded candidate, make no runtime mutation;
5. keep the rolling handoff current if repository state changes, but do not manufacture a roadmap assignment.

Do not reopen Local Profile display-label editing, propagate labels into Showdown/Legacy history, or begin profile merge/delete, standalone profile creation, backup/import redesign, Analytics expansion, cloud, gameplay or Service Worker behavior changes without a later explicit owner instruction.

## Shipped identity and Analytics semantics that every future candidate must preserve

1. stable `profile_*`, `save_*` and `season_*` identities remain authoritative;
2. display-name equality never maps identity automatically;
3. fresh New Showdown creation still intentionally creates fresh Local Profiles for its two manager roles;
4. explicit reuse of one Local Profile across Saves is the only supported longitudinal identity relationship unless an exact stable Save relationship or explicit historical mapping establishes it;
5. same-name distinct Local Profiles remain separate;
6. unresolved historical roles remain unresolved until explicitly mapped and are never guessed by name;
7. unresolved roles are excluded only from identity-dependent longitudinal manager totals, leaderboards and Trophy cabinets;
8. identity-independent completed Showdown/Season totals, points, trophies and Showdown/Season-scoped records remain complete;
9. Career Statistics and Trophy Room consume the same identity-safe Analytics authority;
10. Local Profile display names are presentation labels only and may be read through existing read-only exact Save Library snapshot authority without activating mutation authority;
11. identity and profile-presentation state participate in Analytics/Trophy revision invalidation;
12. Rivalry Statistics remains Showdown-scoped and semantically unchanged.

## Separate future areas are not assignments

Potential future work remains separately bounded, including:

- complete fresh-device multi-Save backup/import envelope portability;
- profile merge/delete semantics or broader profile CRUD;
- standalone Local Profile creation/reuse outside current New Showdown behavior;
- evidence-driven Save Library/identity-link UX refinement;
- broader Analytics 2.0 presentation or visualization expansion;
- Legacy/Achievements expansion;
- optional content and custom challenge content;
- Cloud Readiness;
- opt-in Cloud Backup;
- private paired-device capability;
- Connected Rivalry;
- private sharing/groups;
- conditional future community/discovery/rankings.

None of the future areas above is implementation-authorized by this file today.

## Architecture locks

Preserve stable `profile_*`, `save_*` and `season_*` identities. Display names remain labels, never identity keys.

Before explicit singleton cutover, public canonical storage remains `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

After successful Save Library cutover, public canonical storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Never make `careerModeShowdown.activeShowdown` a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains product Save Library and manager-identity mutation authority. `js/analytics.js` remains read-only derived Analytics authority. UI and Analytics code must not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C Apply must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

Preserve the Installable Offline App whole-shell exactness and protected product/gameplay surfaces.

## Performance and validation boundary

Locked ceilings remain:

- eager raw `162782` <= `165000`
- eager gzip `37416` <= `37500`
- Reus startup portrait `88492` <= `95000`
- combined first-party startup `251274` <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation/authority PRs generally run 13 workflow families; Release Integration Burn-In remains main/manual release authority.

Never weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Stop condition

Local Profile display-label editing and Identity-Safe Career Analytics are closed and must not be reopened without evidence and explicit authorization. Stop with no runtime change until a later explicit owner instruction names a new bounded candidate. PR #61 completion authorizes no second roadmap candidate.
