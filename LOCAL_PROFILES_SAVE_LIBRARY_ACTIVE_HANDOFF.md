# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-14 ET
Status: identity, canonical persistence and Save Library runtime authority technical layers complete, merged and production-proven; visible product UI remains future work
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Feature release version: intentionally unassigned

## Current boundary

The owner-authorized Local Profiles / Save Library dependency chain has completed three technical layers:

1. identity foundation;
2. canonical persistence transition;
3. runtime authority cutover.

The third layer merged through PR #51 at:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

It is now production `main` authority and has passed exact post-merge production validation.

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

The persistence layer established the strict, non-eager singleton-to-Save-Library transition.

`js/storage.js` remains sole public raw localStorage authority.

`js/storageTransaction.js` remains the raw transaction engine.

`js/saveLibraryPersistence.js` remains non-direct-storage orchestration over strict storage authority.

The temporary migration view can include `saveLibrary`, `activeShowdown`, `legacyShowdowns` and `preferences`, but that temporary transition set never means four permanent canonical keys.

Singleton retirement remains the migration commit point. Exact raw preconditions, all-requested-slot prewrite guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, interruption/retry idempotence and critical recovery remain protected.

Candidate C destructive Apply retained its mandatory three-slot `captureCareerModeRawRestoreSnapshot()` authority.

## Completed Save Library runtime authority cutover

PR:

#51 — Cut over runtime authority to Save Library

Implementation branch:

`agent/save-library-runtime-authority-cutover`

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Exact final PR head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

Exact merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

The final PR head passed all 13 normal PR workflow families. The merge was performed with expected-head protection after re-fetching current `main` at `98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`.

The exact merge commit parents are the pre-merge `main` SHA and the exact green final PR head.

All 14 permanent push-triggered workflow families subsequently passed on the exact merge SHA.

Release Integration Burn-In run `31768712755` passed both stateful integration repetitions.

Stability Lane run `31768712798` passed all three jobs. Its deployed-site smoke verified exact Pages runtime bytes and passed runtime provenance, Home visual, crop-safe football-photo, Candidate A, Candidate B, Candidate C, install/offline and complete deployed-site journey audits.

No test was weakened and no performance budget was raised.

Detailed cutover architecture and the complete failure/correction ledger remain in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

## Runtime loading and activation ownership

`js/saveLibraryCutover.js` remains lazy and outside eager HTML.

Only confirmed Start or Continue actions may initiate singleton-to-Save-Library migration.

Predictive hover/focus gameplay warm-up remains non-mutating.

Opening Settings or Legacy on an unmigrated singleton device remains non-mutating.

On an already-migrated device, Settings or Legacy may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously locked before lazy cutover loading begins, preventing rapid double activation from racing the loader gap.

The heavy identity/persistence/runtime stack remains behind the lazy action boundary because the eager startup budget is tightly protected.

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

The detailed exact ledger remains in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`. These resolved classes must not return:

1. eager Save Library cutover logic exceeding startup budgets;
2. predictive gameplay warm-up becoming mutating;
3. Candidate C incorrectly requiring the four-slot snapshot everywhere;
4. source compaction breaking frozen-intent/source-shape contracts;
5. Settings reset losing safe pre-cutover singleton behavior;
6. Settings/Legacy initiating migration merely by opening;
7. a transient four-key public canonical model;
8. Stability expecting singleton writes after cutover;
9. corrupt singleton replacement rather than fail-closed preservation;
10. quota failure targeting the retired singleton writer;
11. rapid Start racing the lazy loader gap;
12. Transfer Challenge failing after accidental removal of shared `cloneForStorage()`;
13. unsafe overwriting after expected-head HTTP 409 conflicts.

The final substantive browser regression was the missing `cloneForStorage()` compatibility helper. It was restored through the lazy cutover path using `structuredClone` with JSON fallback. Exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` then passed the complete Stability browser journey and all 13 normal PR workflow families.

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

## Installable Offline App and permanent locks

Production app/runtime labels remain `v1.3.0` / `1.3.0-r1`.

Immediate previous whole runtime remains `1.2.0-r2`.

The shipped Installable Offline App baseline remains protected. Never assemble mixed runtime shells. Service Worker and Cache Storage remain application-byte authorities only, not canonical user-data authority.

Preserve Settings-only install/update presentation, installed iOS loading composition, protected football photography, FIFA 17-inspired visual shell, gameplay/scoring, Smart Back and all current accessibility/responsive evidence.

## Next substantial candidate

The technical Local Profiles / Save Library foundation is complete through runtime authority cutover.

The next dependency-ordered candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

It must begin in a fresh development session and independently re-fetch current `main` before reconstructing exact owner/repository UI scope.

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

No visible Save Library UI is implemented yet.

## Handoff decision

The Save Library runtime cutover is complete, merged and production-proven. Future work must not reopen this architecture without newly reproduced evidence on current repository authority.