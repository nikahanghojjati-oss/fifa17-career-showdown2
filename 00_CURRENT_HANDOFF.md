# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Runtime release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

The shipped runtime remains technically production-proven. Owner visual/product acceptance remains a separate evidence channel and is never inferred from CI.

PR #51 has not yet merged at this handoff boundary, so production `main` must not yet be described as Save Library-cut-over.

## Current development authority

The active product direction remains Local Profiles / Save Library, with feature release version intentionally unassigned.

The completed dependency chain is:

1. Identity foundation PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Save Library runtime authority cutover implementation in active PR #51, technically complete and green.

Detailed Local Profiles feature history lives in `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.

Detailed PR #51 implementation architecture, failure/correction ledger and green proof lives in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

## PR #51 exact interruption reconstruction

Active PR:

#51 — Cut over runtime authority to Save Library

Active branch:

`agent/save-library-runtime-authority-cutover`

Exact green runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

The implementation head passed all 13 normal PR workflow families.

The last live PR head independently fetched before documentation closure resumed was:

`89fa6c185d9829269f6516feb80eccaa49060383`

Comparison against `46d3e9d10d849b82e9d7d301fb6646404dec82bf` proved that `89fa6c185d9829269f6516feb80eccaa49060383` was exactly one documentation commit ahead and changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

The interrupted attempted `PROJECT_STATE.md` update had not landed. `PROJECT_STATE.md`, `NEXT_TASK.md`, `00_CURRENT_HANDOFF.md` and `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md` were still at the prior persistence-closure authority and therefore required this documentation seal.

The exact documentation-only head `89fa6c185d9829269f6516feb80eccaa49060383` itself also completed all 13 normal PR workflow families successfully.

No runtime/test source changed after the exact green implementation head before this documentation closure.

## Runtime cutover implementation — complete

The runtime architecture is complete. Do not reopen it merely because the documentation head advances.

`js/saveLibraryCutover.js` is lazy and absent from eager HTML. It loads the Save Library identity, persistence and runtime stack only when required.

Only actual Start or Continue may initiate singleton-to-Save-Library migration. Predictive hover/focus gameplay warm-up remains non-mutating.

Settings and Legacy remain non-mutating on an unmigrated singleton device. On an already-migrated device they may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously disabled before lazy loading begins so rapid double activation cannot race the loader gap.

`js/storage.js` remains the sole public raw localStorage authority.

`js/saveLibraryRuntime.js` performs no direct localStorage access. It owns active Save Library behavior only after activation and validates exact owned Save Library bytes before writes.

Normal `saveCurrentShowdown()` cannot write singleton active-save bytes. Gameplay keeps its synchronous persistence facade but routes through Save Library runtime authority.

New Showdowns receive stable save/profile identity before first authoritative persistence. Completed Seasons receive stable season identity before synchronous persistence.

Stable identity prefixes remain `save_*`, `season_*` and `profile_*`.

Two managers with identical display names still receive distinct manager identities. Display-name equality is never identity authority. Historical ambiguous identity remains explicit future mapping work.

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

Exact implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Final Polish reported:

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

## Runtime validation proof

Implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed all 13 normal PR workflow families:

- Validate Static App;
- Validate Final Polish;
- Validate Home Bootstrap;
- Validate Settings Workstream;
- Validate League Confirmation;
- Validate Transfer Workstream;
- Validate Season Review;
- Validate Statistics Workstream;
- Validate V1 Visual Immersion;
- Validate Licensed Football Visuals;
- Validate Candidate B Import Analysis;
- Validate Candidate C Atomic Restore;
- Validate Stability Lane.

The documentation-only head `89fa6c185d9829269f6516feb80eccaa49060383` also passed all 13.

The final documentation head produced by this closure must receive a fresh exact-head PR validation generation before merge.

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
- Transfer Challenge losing the shared `cloneForStorage()` helper;
- unsafe branch overwrite attempts after expected-head HTTP 409 conflicts.

The final substantive browser defect was the missing `cloneForStorage()` compatibility helper. It was restored through the lazy cutover path using `structuredClone` with JSON fallback. After that correction the exact implementation head passed the complete Stability browser journey and all 13 workflow families.

## Installable Offline App and protected product locks

Current whole shell remains `1.3.0-r1`; immediate previous known-good whole shell remains `1.2.0-r2`.

The shipped Installable Offline App baseline remains protected. `CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Preserve the installed iOS loading composition, Settings-only install/update presentation, protected FIFA 17-inspired visual shell and subject-safe football photography.

Exactly two managers. Showdown lengths remain 1 / 3 / 5 / 10. Same selected league, different permanent clubs. Champions League +5, League +3, Domestic Cup +1, 100 League Points and/or 100 League Goals combined maximum +1, Top Scorer and/or Top Assist combined maximum +1, maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position and then league points.

## Documentation closure and merge boundary

PR #51 is in documentation closure / final exact-head validation.

Before merge:

1. fetch the exact current PR head;
2. verify documentation closure changed no runtime/test source;
3. require a fresh exact-head applicable PR validation generation to be fully green;
4. confirm the PR is mergeable and clean;
5. re-fetch current `main` immediately before merge;
6. merge only with expected-head protection.

After merge:

1. re-fetch `main` and verify the exact merge;
2. verify all applicable permanent push-triggered workflows;
3. verify Release Integration Burn-In if it is automatically/main triggered;
4. record exact merge SHA and post-merge proof in the public authority if the established project process requires a separate documentation-only closure;
5. stop at the clean boundary.

Do not start visible Save Library UI in PR #51 or this context-heavy closure session.

## Next legal engineering task after PR #51

After PR #51 is merged and post-merge proven, the next dependency-ordered candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

It must start in a fresh development session and independently reconstruct exact current `main`, current handoffs and owner/repository UI scope before implementation.

Do not automatically include historical manager auto-linking by display-name equality, cloud, accounts, QR pairing, synchronization, remote transport, backup/import envelope redesign, gameplay/scoring changes, protected visual redesign or feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

## Historical authority and warnings

PR #46 is the merged identity foundation authority.

PR #48 is the merged canonical persistence integration authority.

PR #51 is the active runtime authority cutover candidate and is not production authority until merge plus post-merge proof.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be revived or merged.

Prior expected-head HTTP 409 conflicts are safety evidence: when the branch advances concurrently, re-fetch the live head and exact file contents. Never force overwrite newer repository work.

## Quality-first continuation boundary

The Save Library runtime cutover implementation is complete and technically green. PR #51 is now a documentation-closure/final-validation task, not a runtime redesign task.

A future developer must always independently fetch live GitHub authority instead of trusting a stale handoff SHA.