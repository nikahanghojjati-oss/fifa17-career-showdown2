# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-14 ET

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI is complete, merged, deployed and production-proven.

PR #53 final head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

PR #53 merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

All 13 normal PR workflow families passed the exact final head.

All 14 permanent push workflow families passed the exact runtime merge.

Release Integration Burn-In `31771269732` succeeded with both complete stateful integration passes.

Post-merge Stability `31771269740` succeeded, including deployed-site-smoke job `94677863736`. Production Pages verified 71 `1.3.0-r1` runtime files byte-for-byte and passed the deployed Save Library, Candidate A/B/C, offline, visual and complete-journey audits.

## Immediate next-task boundary

There is no automatically authorized next substantial implementation candidate after PR #53.

The next developer must not select a roadmap item merely because the previous phase is complete.

First:

1. Fetch live `main` independently.
2. Inspect recent commits and open pull requests.
3. Read `00_HANDOFF_GOLDEN_RULE.md`.
4. Read `00_DEVELOPER_START_HERE.md`.
5. Read `00_CURRENT_HANDOFF.md`.
6. Read `PROJECT_STATE.md`.
7. Read this file.
8. Read `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.
9. Read `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`.
10. Inspect current source and permanent contracts before proposing or implementing another candidate.
11. If the owner supplies a new explicit task, bound that task against current repository authority instead of reviving an old roadmap assumption.

Do not continue work merely to keep a development branch active.

## Completed Local Profiles / Save Library dependency chain

1. Stable identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Save Library runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.

Do not reimplement these layers.

## Possible future product areas are not assignments

The following may become separately bounded future work only after owner/dependency authorization:

- profile rename/edit semantics;
- standalone Local Profile creation outside New Showdown;
- explicit historical manager/profile mapping;
- further Save Library interaction refinement supported by reproduced usability evidence;
- cloud or private-room foundations;
- accounts/authentication;
- pairing or synchronization;
- remote transport;
- device/writer identity;
- distributed revision/conflict/tombstone systems;
- future backup/import envelope evolution.

This list is not a priority order and is not permission to implement any item.

Profile rename/edit deserves special caution: Showdown records currently also contain manager display labels. A correct rename feature must explicitly decide propagation, historical labeling and identity semantics rather than treating profile display-name editing as generic CRUD.

## Hard out-of-scope defaults until separately authorized

Do not automatically begin:

- cloud storage;
- accounts;
- authentication;
- QR pairing;
- synchronization;
- network multiplayer;
- deviceId/writerId systems;
- distributed revision clocks;
- historical manager auto-linking by name;
- backup format redesign;
- import format redesign;
- generic migration framework work for architectural neatness;
- gameplay/scoring changes;
- league/team-selection redesign;
- Transfer Challenge redesign unrelated to a reproduced defect;
- Statistics/Legacy/Trophy Room/Rule Book redesign unrelated to a reproduced defect;
- global Smart Back redesign;
- global visual redesign;
- loading-screen redesign;
- music redesign;
- release-version assignment.

## Architecture locks for whatever comes next

Preserve stable `save_*`, `season_*` and `profile_*` identities.

Display names remain labels, never identity keys.

Before explicit cutover on an old singleton device, the public canonical storage keys remain `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`.

After successful cutover, the public canonical storage keys remain `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`.

Never turn `careerModeShowdown.activeShowdown` into a permanent fourth canonical key.

UI code must not directly own canonical `localStorage`.

Preserve lazy Save Library activation and non-mutating Settings/Legacy opening on old singleton devices.

Preserve exact owned-byte runtime authority, stale/cross-tab fail-closed behavior and singleton reappearance rejection.

Preserve Candidate A non-mutating export and Candidate B read-only analysis.

Candidate C remains the only destructive import stage. Its Apply path must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

Preserve Installable Offline App whole-shell exactness.

Preserve the existing gameplay/scoring rules and protected product surfaces.

Do not raise performance ceilings or workflow timeouts merely to make a future candidate pass.

## Current performance boundary

Exact PR #53 final measurements:

- eager raw `162781` <= `165000`
- eager gzip `37415` <= `37500`
- Reus startup portrait `88492` <= `95000`
- combined first-party startup `251273` <= `260000`
- lazy feedback `4845`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

The eager gzip ceiling remains especially tight. New substantial UI/runtime work should continue to respect existing lazy boundaries where appropriate.

## Validation topology

Repository authority remains:

- 14 permanent workflow families;
- 27 protected multiline executable blocks;
- normal implementation PRs generally run 13 workflow families;
- Release Integration Burn-In remains main/manual release authority.

Never weaken tests or reduce the protected topology merely to obtain green CI.

## Stop condition

This file intentionally ends at a clean production boundary.

Do not begin another feature until current repository authority and an owner-authorized next goal identify it.
