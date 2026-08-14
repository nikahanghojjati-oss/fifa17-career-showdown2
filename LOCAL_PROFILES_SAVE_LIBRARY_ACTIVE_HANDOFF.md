# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-13 ET
Status: Save Library runtime authority cutover implementation complete and technically green; PR #51 in documentation closure / final exact-head validation
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Feature release version: intentionally unassigned

## Current boundary

The owner-authorized Local Profiles / Save Library dependency chain has now completed three technical layers:

1. identity foundation;
2. canonical persistence transition;
3. runtime authority cutover implementation.

The third layer is active in PR #51 and is not yet production `main` authority until merge and post-merge proof complete.

No visible Save Library / Local Profiles product UI is claimed as implemented.

No profile creation, rename or historical mapping UI was added.

No cloud, accounts, QR pairing, synchronization or remote transport was added.

No gameplay, scoring, Smart Back, protected football visual, installed iOS loading composition, Settings install/update presentation or backup/import envelope redesign was authorized by the runtime cutover.

No feature release version was assigned.

## Completed identity foundation

Foundation PR #46 merged at:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

`js/saveLibraryFoundation.js` remains pure identity/migration-planning logic and performs no direct localStorage mutation.

Stable opaque identity prefixes remain:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for managers.

Display-name equality is never identity authority. Two managers with identical display names remain distinct identities. Historical Legacy identities that cannot be proven from stable identity remain explicit future mapping work.

## Completed canonical persistence transition

Canonical persistence PR #48 merged at:

`d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

The persistence layer established the strict, non-eager singleton-to-Save-Library transition without itself activating runtime ownership.

`js/storage.js` remained sole public raw localStorage authority.

`js/storageTransaction.js` remained the raw transaction engine.

`js/saveLibraryPersistence.js` remained non-direct-storage orchestration over strict storage authority.

The temporary migration view can include:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

That temporary transition set never means four permanent canonical keys.

Singleton retirement remains the migration commit point. Exact raw preconditions, all-requested-slot prewrite guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, interruption/retry idempotence and critical recovery remain protected.

Candidate C destructive Apply retained its mandatory three-slot `captureCareerModeRawRestoreSnapshot()` authority.

## Save Library runtime authority cutover — implementation complete

Active PR:

#51 — Cut over runtime authority to Save Library

Active branch:

`agent/save-library-runtime-authority-cutover`

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

That implementation head passed all 13 normal PR workflow families.

The first documentation head after implementation:

`89fa6c185d9829269f6516feb80eccaa49060383`

was exactly one documentation commit ahead of `46d3e9d10d849b82e9d7d301fb6646404dec82bf`, changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`, and also passed all 13 normal PR workflow families.

Detailed architecture and the complete failure/correction ledger live in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

The runtime implementation is complete. Documentation closure must not reopen it unless new exact-head validation exposes a genuine defect.

## Runtime loading and activation ownership

`js/saveLibraryCutover.js` remains lazy and outside eager HTML.

Only confirmed Start or Continue actions may initiate singleton-to-Save-Library migration.

Predictive hover/focus gameplay warm-up remains non-mutating.

Opening Settings or Legacy on an unmigrated singleton device remains non-mutating.

On an already-migrated device, Settings or Legacy may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously locked before lazy cutover loading begins, preventing rapid double activation from racing the loader gap.

The heavy identity/persistence/runtime stack remains behind the lazy action boundary because the eager startup budget is extremely tight.

## Runtime persistence authority

`js/storage.js` remains sole public raw localStorage authority.

`js/saveLibraryRuntime.js` performs no direct localStorage access.

Normal `saveCurrentShowdown()` cannot write `careerModeShowdown.activeShowdown` singleton bytes after runtime activation.

Gameplay retains the established synchronous persistence facade but routes through Save Library runtime authority.

New Showdowns receive stable save/profile identity before first authoritative persistence.

Completed Seasons receive stable season identity before synchronous persistence.

The runtime validates exact owned Save Library bytes before writes and fails closed on:

- cross-tab Save Library drift;
- singleton reappearance;
- corrupt Save Library bytes;
- ownership mismatch;
- critical recovery lock;
- unverifiable state.

## Exact canonical key models

Before explicit activation, compatibility-facing public canonical keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful runtime cutover, public canonical keys become exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It remains only a transitional migration/recovery slot.

Normal gameplay must never recreate singleton active-save authority after successful migration.

## Candidate A / B / C compatibility

Candidate A remains non-mutating export and backup format remains v1.

On a migrated device, Candidate A may project the authoritative active Save Library Showdown into the existing backup active-Showdown field without mutating canonical data.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The established three-slot Candidate C path continues to work for unmigrated singleton state.

Migrated Save Library devices additionally protect exact Save Library bytes and use the Save Library restore path.

Dual authority fails closed.

## Critical failure/correction ledger

The detailed exact ledger is preserved in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`. The following resolved classes must not return:

1. Eager Save Library cutover logic exceeded startup budgets. Heavy activation was moved behind a lazy confirmed-action boundary.
2. Predictive gameplay warm-up became mutating. Migration was restricted to confirmed Start/Continue actions.
3. Candidate C initially required the four-slot snapshot everywhere. The old three-slot destructive snapshot remained mandatory and Save Library protection became additive only when relevant.
4. Source compaction broke frozen-intent/source-shape contracts. Readable source and the established transaction call shape were restored.
5. Settings reset lost safe pre-cutover singleton behavior. Existing behavior was retained only when Save Library is absent.
6. Settings/Legacy initially initiated migration merely by opening. Unmigrated openings became non-mutating again.
7. A transient four-key public canonical model appeared. Exactly three canonical keys now exist before activation and exactly three after activation.
8. Stability still expected singleton writes after cutover. The browser journey now asserts zero singleton writes.
9. Corrupt singleton bytes briefly followed a replacement-dialog model. They now fail closed and are preserved; no Save Library authority is fabricated.
10. Quota failure targeted the retired singleton writer. It now targets Save Library authority.
11. Rapid Start exposed a lazy-loader race. Start/Continue are disabled synchronously before loading.
12. Transfer Challenge failed because the storage rewrite accidentally removed shared `cloneForStorage()`. Compatibility was restored through the lazy cutover path with `structuredClone` plus JSON fallback.
13. Concurrent GitHub branch advances produced expected-head HTTP 409 conflicts. Those operations were safely rejected; force overwrite is forbidden.

After the Transfer Challenge correction, exact head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed the complete Stability browser journey and all 13 normal PR workflow families.

## Performance proof

Exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf`:

- eager raw: `162935` bytes;
- eager gzip: `37475` bytes;
- lazy feedback: `4845` bytes.

Locked ceilings remain unchanged:

- eager raw <= `165000`;
- eager gzip <= `37500`;
- Startup Marco Reus portrait <= `95000`;
- combined first-party startup <= `260000`;
- normal loading minimum `2700 ms`;
- reduced-motion loading `220 ms`.

No budget was raised.

## PR #51 workflow proof so far

Implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed:

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

Documentation-only head `89fa6c185d9829269f6516feb80eccaa49060383` also passed all 13.

A fresh validation generation is still required on the exact final documentation head before merge.

## Installable Offline App and permanent locks

Production app/runtime remains `v1.3.0` / `1.3.0-r1` until PR #51 is merged and post-merge proven.

Immediate previous whole runtime remains `1.2.0-r2`.

The shipped Installable Offline App baseline remains protected. Never assemble mixed runtime shells. Service Worker and Cache Storage remain application-byte authorities only, not canonical user-data authority.

Preserve Settings-only install/update presentation, installed iOS loading composition, protected football photography, FIFA 17-inspired visual shell, gameplay/scoring, Smart Back and all current accessibility/responsive evidence.

## Documentation closure boundary

PR #51 is now in documentation closure / final exact-head validation.

Before merge:

- fetch the exact live PR head;
- verify documentation closure changed no runtime/test source;
- require every applicable exact-head PR workflow to be green;
- verify mergeability;
- re-fetch current `main` immediately before merge;
- merge only with expected-head protection.

After merge:

- re-fetch and prove the exact `main` merge;
- verify every applicable permanent push-triggered workflow;
- verify Release Integration Burn-In if main-triggered;
- publish exact merge/post-merge proof if the established documentation process requires a separate closure;
- stop at the clean boundary.

Do not begin visible Save Library UI in PR #51 or this context-heavy closure session.

## Next substantial candidate after PR #51

Only after PR #51 merges and current `main` is independently re-fetched and proven, begin a fresh separately bounded visible Local Profiles / Save Library product-UI candidate.

That future candidate must reconstruct exact owner/repository UI scope before implementation.

Do not automatically include:

- historical manager auto-linking by display-name equality or normalized spelling;
- cloud;
- accounts;
- QR pairing;
- synchronization;
- remote transport;
- backup/import envelope redesign;
- gameplay/scoring changes;
- protected visual redesign;
- feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

## Handoff decision

The Save Library runtime cutover implementation has reached a clean technical boundary. PR #51 is a closure/merge task now, not a new feature-development task.

Future work must independently re-fetch live GitHub authority and must not trust a stale branch or handoff SHA.