# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-14 ET

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime feature merge: `c5c7d50cc3a2d9003e057d1813744c877323c068`
Validated PR #59 head: `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, and Identity-Safe Career Analytics / Trophy Room longitudinal consumption are complete, merged, deployed and production-proven.

PR #59 passed all 13 normal pull-request workflow families on exact unchanged head `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`, merged with expected-head protection to `c5c7d50cc3a2d9003e057d1813744c877323c068`, and passed the permanent push/deployment proof. Stability run `31827619109` and deployed-site-smoke job `94855938131` passed exact runtime bytes, runtime provenance, Home, Save Library, manager identity linkage, Identity-Safe Career Analytics, football visuals, Candidate A/B/C, offline boundary and the complete deployed journey.

## Current implementation authorization

No new substantial runtime product candidate is authorized after the Identity-Safe Career Analytics production seal.

Do not infer authorization from roadmap order, technical readiness, historical version numbering or the fact that a dependency is now complete.

The next developer's concrete task is authority-preserving verification only until the owner supplies a later explicit product instruction.

### IMMEDIATE NEXT TASK AFTER FULL STUDY

After independently fetching live `main`, recent commits and open PRs and reading the permanent authority files:

1. verify that live `main` still contains the production-proven Identity-Safe Career Analytics runtime and the current authority seal;
2. verify there is no newer owner-authorized candidate in `NEXT_TASK.md`, current PRs or a later explicit owner instruction;
3. if no newer authorization exists, make no runtime mutation and preserve the clean production boundary;
4. when the owner gives a new product request, reconstruct only the source/history needed for that request, classify its dependency/scope against `PROJECT_STATE.md` and `POST_V1_ROADMAP_EXECUTION.md`, then implement only the explicitly authorized bounded candidate.

This is intentionally a stop boundary, not permission to choose the next roadmap feature autonomously.

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
- profile rename/edit semantics;
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

None is implementation-authorized by this file today.

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

- eager raw `162781` <= `165000`
- eager gzip `37415` <= `37500`
- Reus startup portrait `88492` <= `95000`
- combined first-party startup `251273` <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation/authority PRs generally run 13 workflow families; Release Integration Burn-In remains main/manual release authority.

Never weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Stop condition

Identity-Safe Career Analytics is closed as a production-proven candidate. Preserve the sealed boundary and stop before any new runtime feature unless a later explicit owner instruction authorizes it.
