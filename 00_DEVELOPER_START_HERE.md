# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first read for a new developer session.

## Sixty-second state

Application label: `v1.3.0`
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Visible Local Profiles / Save Library Core UI is complete, merged, deployed and production-proven.

Completed Local Profiles / Save Library dependency chain:

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

PR #53 exact final head: `2021a0a2eaed26f0aca6639278de82afe2a28d6d`.

Its production-proof documentation closure was merged through PR #54. No new application release label or Service Worker revision was assigned by this feature chain.

Technical production proof and owner visual/product acceptance remain separate evidence channels.

## Required read order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`
8. `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md` when runtime-cutover history is relevant
9. `V1.3.0_PRODUCTION_PROOF.md` when the original v1.3 release baseline is relevant
10. `RELEASE_V1.3.0.md`
11. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
12. `POST_V1_ROADMAP_EXECUTION.md`
13. `00_MASTER_DEVELOPER_CONTEXT.md` only when deeper history is needed.

Always fetch live `main` first. Never assume a SHA recorded in documentation is still current. Current source plus later explicit owner decisions outrank stale historical prose.

## Current continuation boundary

There is no automatically authorized next substantial implementation candidate after the shipped Save Library Core UI.

If the owner supplies a new explicit task, bound it against current source and the current handoff before creating a branch.

Do not select a roadmap item merely because the previous phase is complete.

Possible future areas such as profile rename/edit, standalone profile creation, historical profile mapping, cloud/private-room foundations, accounts/authentication, pairing/synchronization, remote transport, device/writer identity, distributed revisions/conflicts or backup/import evolution remain separate candidates requiring explicit authorization and dependency review.

Profile rename/edit requires special care because current Showdown records also contain manager display labels. Stable profile identity must remain distinct from display-name propagation and historical-label policy.

## Locked product model

Exactly two managers.

Showdown lengths: `1`, `3`, `5`, `10`.

Both managers use the same selected league and different permanent clubs.

Scoring remains:

- Champions League: +5
- League: +3
- Domestic Cup: +1
- 100 League Points and/or 100 League Goals: combined maximum +1
- Top Scorer and/or Top Assist: combined maximum +1

Maximum Season score: 11.

Equal non-zero scores are a Draw.

Only 0–0 invokes league position and then league points.

Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings and Smart Back remain protected.

## Identity authority

Stable prefixes are:

- `save_*`
- `season_*`
- `profile_*`

Current generated IDs use 24 lowercase hexadecimal characters after the prefix.

Display names are labels only. Display-name equality, normalized spelling or case equality never establishes identity.

Two Local Profiles may have exactly the same visible name while remaining distinct identities.

Never auto-link historical managers solely by visible name.

## Canonical storage authority

Before explicit Save Library activation on an old singleton device, public canonical keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful cutover, public canonical keys remain exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a permanent fourth key after cutover. It is only a migration/recovery compatibility slot.

`js/storage.js` remains sole public raw `localStorage` authority. UI code must not directly manipulate canonical browser storage.

## Save Library runtime and product locks

`js/saveLibraryCutover.js` remains lazy.

Confirmed Start/Continue may activate or migrate old singleton state. Opening Save Library/Settings or Legacy on an unmigrated singleton device remains non-mutating.

`js/saveLibraryRuntime.js` remains exact runtime mutation authority and owns detached library inspection, additive creation, active switching, single-Save deletion and active gameplay persistence.

The visible product remains lazy inside the existing Settings navigation/focus owner rather than creating a second persistence or Smart Back system.

Current product semantics include:

- empty, one-save and multi-save states;
- additive New Showdown creation;
- one explicit `activeSaveId`;
- explicit active-Save switching by stable identity;
- deletion of exactly one Save without full-reset semantics;
- no implicit replacement after deleting the active Save;
- read-only Local Profiles;
- retained profiles after single-Save deletion;
- blocked fail-closed presentation for corrupt, dual-authority or otherwise unverifiable state;
- keyboard/focus containment through the existing Settings dialog.

Runtime authority continues to fail closed on stale/cross-tab drift, singleton reappearance, critical-recovery lock, exact-byte mismatch or transaction failure.

## Recovery contract

Candidate A remains non-mutating export.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to commit canonical restore state.

A legal Candidate C Apply preserves immutable confirmed intent, strict exact raw snapshot/preconditions, stale-state barriers, complete in-memory planning, last-moment exact-byte checks, transaction-owned mutation and rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority. Never replace it with `captureCareerModeRawBackupInputs()`.

The defensive recovery architecture is deliberate future-facing infrastructure. Do not simplify it for conceptual neatness.

## Installable Offline App locks

Current whole shell: `1.3.0-r1`.

Immediate previous known-good whole shell: `1.2.0-r2`.

Preserve atomic verified cache population, explicit safe update activation, Candidate C activation gating, whole-runtime selection, corruption-aware current/previous recovery, app-namespace-only cleanup, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell and await successful `skipWaiting()` before acknowledging activation.

Service Worker and Cache Storage own application bytes only, never canonical user data.

## Visual locks

Preserve the r2 iOS installed-app loading composition: bounded mobile top band, independent subject-safe Reus image box, width-owned composition and opacity/filter-only animation. Do not reintroduce viewport-height-sensitive sizing or arbitrary crop/brightness hacks.

Preserve the current FIFA 17-inspired Home and Save Library presentation unless a separately authorized visual candidate or reproduced defect requires change.

## Validation and performance

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation PRs generally run 13; Release Integration Burn-In remains main/manual release authority.

Exact final PR #53 measurements:

- eager raw: `162781` bytes
- eager gzip: `37415` bytes
- lazy feedback: `4845` bytes
- Reus startup portrait: `88492` bytes
- combined first-party startup: `251273` bytes

Locked ceilings remain:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Never raise a performance or timeout limit merely to obtain green CI.

## Current production proof

PR #53 exact final head `2021a0a2eaed26f0aca6639278de82afe2a28d6d` passed all 13 normal PR workflow families.

Exact runtime merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` passed all 14 permanent push workflow families.

Release Integration Burn-In `31771269732` succeeded with both complete stateful integration passes.

Post-merge Stability `31771269740` succeeded, including deployed-site-smoke job `94677863736`.

Production Pages proof verified 71 `1.3.0-r1` runtime files byte-for-byte and passed runtime provenance, Home, visible Save Library, licensed football-photo, Candidate A, Candidate B, Candidate C, Installable Offline App/offline and complete deployed journey audits.

## Historical branch warning

PR #37 / `agent/v13-hardening` and PR #35 remain historical draft work. Do not revive them as current authority or merge their alternate assumptions over current `main` without a separately justified, current-main investigation.
