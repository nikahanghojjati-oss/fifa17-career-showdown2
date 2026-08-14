# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime label: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Original v1.3 runtime release PR: #42
Original v1.3 runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Original production proof: `V1.3.0_PRODUCTION_PROOF.md`

Save Library runtime authority cutover PR #51 is now merged into `main` and independently post-merge proven.

Exact PR #51 merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

No new application/runtime release label was assigned by the cutover. Feature release version remains intentionally unassigned.

Owner visual/product acceptance remains a separate evidence channel and is never inferred from CI.

## Local Profiles / Save Library completed technical chain

The completed dependency chain is:

1. Identity foundation PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Save Library runtime authority cutover PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.

Detailed Local Profiles feature history lives in `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.

Detailed runtime architecture and the failure/correction ledger live in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

No visible Save Library / Local Profiles product UI is claimed as implemented.

## PR #51 interruption reconstruction and final closure

The exact green runtime/test implementation head was:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

It passed all 13 normal PR workflow families.

The interrupted session had definitely landed only one documentation commit after that implementation head:

`89fa6c185d9829269f6516feb80eccaa49060383`

Comparison proved that head changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`. The attempted `PROJECT_STATE.md` write had not landed, so the stale authority documents were updated only after live GitHub state was independently reconstructed.

Final PR #51 head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

The final closure delta after `89fa6c...` changed only:

- `00_CURRENT_HANDOFF.md`;
- `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`;
- `NEXT_TASK.md`;
- `PROJECT_STATE.md`.

No runtime, test, workflow, Service Worker, gameplay, scoring or protected visual source changed during documentation closure.

The exact final PR head passed all 13 normal PR workflow families.

Immediately before merge, `main` was re-fetched at:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

PR #51 was clean and mergeable. It was merged with expected-head protection against `bda19f8181598d880c7b1eb7f4e9446464d015e6`.

Exact merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

Its exact parents are:

1. `98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`;
2. `bda19f8181598d880c7b1eb7f4e9446464d015e6`.

## Post-merge production proof

All 14 permanent push-triggered workflow families succeeded on exact merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.

Release Integration Burn-In run `31768712755` completed both jobs successfully:

- `integration-burnin-pass-1`;
- `integration-burnin-pass-2`.

Both repeated the complete stateful integration journey and uploaded evidence.

Stability Lane run `31768712798` completed all three jobs successfully:

- `stability-contracts`;
- `chromium-stability`;
- `deployed-site-smoke`.

The deployed-site smoke verified every expected runtime byte on GitHub Pages and then passed:

- runtime error provenance;
- Home visual audit;
- crop-safe football-photo audit;
- Candidate A backup export;
- Candidate B import analysis;
- Candidate C atomic restore and recovery;
- install/offline boundary;
- complete deployed-site journey.

There were no failed post-merge workflow families, no weakened tests and no raised budgets.

## Runtime cutover architecture — production authority

`js/saveLibraryCutover.js` is lazy and absent from eager HTML. It loads the Save Library identity, persistence and runtime stack only when required.

Only actual Start or Continue may initiate singleton-to-Save-Library migration. Predictive hover/focus gameplay warm-up remains non-mutating.

Settings and Legacy remain non-mutating on an unmigrated singleton device. On an already-migrated device they may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously disabled before lazy loading begins so rapid double activation cannot race the loader gap.

`js/storage.js` remains the sole public raw localStorage authority.

`js/saveLibraryRuntime.js` performs no direct localStorage access. It validates exact owned Save Library bytes before writes.

Normal `saveCurrentShowdown()` cannot write singleton active-save bytes after activation. Gameplay keeps its synchronous persistence facade but routes through Save Library runtime authority.

New Showdowns receive stable save/profile identity before first authoritative persistence. Completed Seasons receive stable season identity before synchronous persistence.

Stable identity prefixes remain `save_*`, `season_*` and `profile_*`.

Display-name equality is never identity authority. Two managers with identical display names still receive distinct manager identities. Historical ambiguous identity remains explicit future mapping work.

## Canonical storage model

Before explicit Save Library activation, the compatibility-facing public model remains exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful Save Library runtime cutover, the public canonical model becomes exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It is only a transitional migration/recovery slot.

Normal gameplay must never recreate singleton active-save authority after successful migration.

Service Worker and Cache Storage remain application-byte authorities only and may never become canonical user-data storage.

## Fail-closed ownership and recovery

Save Library runtime writes fail closed on cross-tab Save Library drift, singleton reappearance, corrupt Save Library bytes, ownership mismatch, critical recovery lock or unverifiable state.

`js/storageTransaction.js` remains the raw transaction engine and preserves exact preconditions, last-moment requested-slot guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership checks, exact post-write verification, byte-for-byte rollback verification and critical recovery when ownership is uncertain.

A temporary four-slot migration/recovery view over `saveLibrary`, `activeShowdown`, `legacyShowdowns` and `preferences` does not create a permanent four-key canonical model.

## Candidate A / B / C locks

Candidate A remains non-mutating export. Backup format remains v1. On migrated devices it may project the authoritative active Save Library Showdown into the existing backup active-Showdown field without mutating canonical data.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The established three-slot Candidate C path remains mandatory for unmigrated singleton state. Save Library state adds exact Save Library-byte protection and the Save Library restore path. Dual authority fails closed.

## Final runtime performance proof

Exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` reported:

- eager raw: `162935` bytes;
- eager gzip: `37475` bytes;
- lazy feedback: `4845` bytes.

Locked ceilings remain:

- eager raw <= `165000`;
- eager gzip <= `37500`;
- Reus startup portrait <= `95000`;
- combined first-party startup <= `260000`;
- normal loading minimum `2700 ms`;
- reduced-motion loading `220 ms`.

No limit was raised and no limit may be raised to make CI green.

## Resolved cutover failure classes

The detailed ledger is retained in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`. Do not regress these resolved classes:

- eager cutover logic exceeding startup budgets;
- predictive warm-up mutating storage;
- Candidate C incorrectly requiring a four-slot snapshot everywhere;
- source compaction breaking frozen-intent/source-shape contracts;
- Settings reset losing safe pre-cutover singleton behavior;
- Settings or Legacy initiating migration merely by being opened;
- a transient four-key public canonical model;
- Stability still expecting singleton writes after cutover;
- corrupt singleton replacement instead of fail-closed preservation;
- quota failure targeting the retired singleton writer;
- rapid Start racing the lazy loader gap;
- Transfer Challenge losing shared `cloneForStorage()`;
- unsafe branch overwrite attempts after expected-head HTTP 409 conflicts.

The final substantive browser defect was the missing `cloneForStorage()` compatibility helper. It was restored with structured clone plus JSON fallback compatibility before the final green implementation boundary.

## Installable Offline App and protected product locks

Current whole shell label remains `1.3.0-r1`; immediate previous known-good whole shell remains `1.2.0-r2`.

The shipped Installable Offline App baseline remains protected. `CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Preserve the installed iOS loading composition, Settings-only install/update presentation, protected FIFA 17-inspired visual shell and subject-safe football photography.

Exactly two managers. Showdown lengths remain 1 / 3 / 5 / 10. Same selected league, different permanent clubs. Champions League +5, League +3, Domestic Cup +1, 100 League Points and/or 100 League Goals combined maximum +1, Top Scorer and/or Top Assist combined maximum +1, maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position and then league points.

## Next legal engineering task

PR #51 is complete, merged and post-merge proven.

Do not continue visible product work in this closure session.

The next dependency-ordered candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

It must begin in a fresh development session and independently reconstruct exact current `main`, current handoffs and owner/repository UI scope before implementation.

Do not automatically include historical manager auto-linking by display-name equality, cloud, accounts, QR pairing, synchronization, remote transport, backup/import envelope redesign, gameplay/scoring changes, protected visual redesign or feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

No visible Save Library UI is implemented yet.

## Historical authority and warning

PR #46 is the merged identity foundation authority.

PR #48 is the merged canonical persistence integration authority.

PR #51 is the merged and production-proven runtime authority cutover.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be revived or merged.

A future developer must independently fetch live GitHub authority rather than trusting a stale handoff SHA.