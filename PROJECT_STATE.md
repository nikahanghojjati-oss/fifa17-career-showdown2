# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-14 ET

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime label: `1.3.0-r1`
Production previous known-good runtime: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Original v1.3 runtime release PR: #42
Original v1.3 runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

The Local Profiles / Save Library technical dependency chain has now advanced production `main` without assigning a new application/runtime release label.

Save Library runtime authority cutover PR #51 merged successfully at:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

That merge is now production `main` authority and has been independently post-merge proven.

Owner visual/product acceptance remains separate from automated technical proof and is not inferred here.

## Local Profiles / Save Library completed technical chain

Feature release version remains intentionally unassigned.

Completed dependency-ordered foundations:

1. Identity foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Save Library runtime authority cutover PR #51 merged at `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2` and is post-merge proven.

No visible Save Library / Local Profiles product UI is claimed as implemented by these technical layers.

Detailed runtime architecture and the failure/correction ledger remain in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

## PR #51 exact proof chain

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

That implementation head passed all 13 normal PR workflow families.

First documentation-only closure head:

`89fa6c185d9829269f6516feb80eccaa49060383`

That head changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md` relative to the runtime/test implementation head and also passed all 13 normal PR workflow families.

Final PR #51 head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

The final head contained the completed runtime/test implementation plus documentation closure. Relative to `89fa6c185d9829269f6516feb80eccaa49060383`, only these four Markdown authority files changed:

- `00_CURRENT_HANDOFF.md`;
- `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`;
- `NEXT_TASK.md`;
- `PROJECT_STATE.md`.

No runtime, test, workflow, Service Worker, gameplay, scoring or protected visual source changed during final documentation closure.

The final PR head passed all 13 normal PR workflow families.

Immediately before merge, current `main` was independently re-fetched at:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

PR #51 was clean and mergeable. It was merged with expected-head protection against exact head `bda19f8181598d880c7b1eb7f4e9446464d015e6`.

Exact merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

The merge commit parents are exactly:

1. pre-merge `main`: `98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`;
2. exact green PR head: `bda19f8181598d880c7b1eb7f4e9446464d015e6`.

## Post-merge production proof

All 14 permanent push-triggered workflow families completed successfully on exact merge SHA:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

This includes the 13 normal validation families plus Release Integration Burn-In.

Release Integration Burn-In run:

`31768712755`

Both integration jobs completed successfully:

- `integration-burnin-pass-1` — success;
- `integration-burnin-pass-2` — success.

Each repeated the complete stateful integration journey and uploaded pass evidence.

Post-merge Stability Lane run:

`31768712798`

All three Stability jobs completed successfully:

- `stability-contracts` — success;
- `chromium-stability` — success;
- `deployed-site-smoke` — success.

The deployed-site smoke verified the exact Pages runtime bytes and then passed:

- runtime error provenance audit;
- Home visual audit;
- crop-safe football-photo audit;
- Candidate A backup export audit;
- Candidate B import analysis;
- Candidate C atomic restore and recovery audit;
- install and offline boundary audit;
- complete deployed-site journey.

No test was weakened and no performance ceiling was raised.

## Runtime authority cutover state

`js/saveLibraryCutover.js` remains lazy and outside eager HTML.

Only confirmed Start or Continue may initiate singleton-to-Save-Library migration. Predictive hover/focus gameplay warm-up remains non-mutating.

Opening Settings or Legacy on an unmigrated singleton device remains non-mutating. On an already-migrated device, Settings or Legacy may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously locked before lazy loading begins, preventing rapid double activation from racing the loader gap.

`js/storage.js` remains the sole public raw localStorage authority. `js/saveLibraryRuntime.js` and `js/saveLibraryCutover.js` perform no direct localStorage access.

Normal `saveCurrentShowdown()` does not write singleton active-save bytes after activation. Gameplay retains its synchronous persistence facade but routes through Save Library runtime authority.

New Showdowns receive stable save/profile identity before first authoritative persistence. Completed Seasons receive stable season identity before synchronous persistence.

Stable identity prefixes remain:

- `save_*`;
- `season_*`;
- `profile_*`.

Display-name equality is never identity authority. Two managers with identical display names still receive distinct manager identities. Ambiguous historical manager identity remains explicit future mapping work.

## Canonical key model

Before explicit Save Library activation, the compatibility-facing public canonical storage-key model remains exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful Save Library runtime cutover, the public canonical model becomes exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It is only a transitional migration/recovery slot. Normal gameplay must never recreate singleton active-save authority after successful migration.

Service Worker and Cache Storage remain application-byte authorities only and never canonical user-data authority.

## Fail-closed runtime ownership

`js/saveLibraryRuntime.js` validates exact owned Save Library bytes before writes and fails closed on:

- cross-tab Save Library drift;
- singleton reappearance;
- corrupt Save Library bytes;
- ownership mismatch;
- critical recovery lock;
- unverifiable state.

`js/storageTransaction.js` remains the raw transaction engine with exact preconditions, requested-slot prewrite guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery when rollback ownership cannot be proven.

The temporary migration reasoning set may include `saveLibrary`, `activeShowdown`, `legacyShowdowns` and `preferences`, but this never creates a permanent four-key authority model.

## Candidate A / B / C locks

Candidate A remains non-mutating export and backup format remains v1. It may project the authoritative active Save Library Showdown into the existing backup active-Showdown field without mutating canonical data.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The established three-slot Candidate C path remains mandatory for unmigrated singleton state. Migrated Save Library devices additionally guard exact Save Library bytes and use the Save Library restore path. Dual authority fails closed.

## Performance proof

On exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf`, Final Polish reported:

- eager raw: `162935` bytes;
- eager gzip: `37475` bytes;
- lazy feedback: `4845` bytes.

Locked ceilings remain:

- eager raw <= `165000`;
- eager gzip <= `37500`;
- Startup Marco Reus portrait <= `95000`;
- combined first-party startup <= `260000`;
- normal loading minimum `2700 ms`;
- reduced-motion loading `220 ms`.

No performance limit may be raised to make CI green.

## Installable Offline App authority

Current whole shell label: `1.3.0-r1`
Immediate previous known-good shell: `1.2.0-r2`

The shipped Installable Offline App baseline remains protected.

Preserve verified atomic cache population, explicit safe update activation, Candidate C busy/recovery gating, whole-runtime selection, previous-known-good recovery, fail-closed behavior when no coherent shell exists, app-namespace-only cleanup, unrelated-cache preservation, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Install/update controls remain Settings-only.

## Protected presentation and product rules

Preserve the installed iOS loading composition, proven FIFA 17-inspired menu shell and subject-safe football photography.

Exactly two managers. Showdown lengths are 1, 3, 5 or 10. Same selected league, different permanent clubs. Champions League +5. League +3. Domestic Cup +1. 100 League Points and/or 100 League Goals combined maximum +1. Top Scorer and/or Top Assist combined maximum +1. Maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position then league points.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Next dependency-ordered candidate

The technical Save Library foundation and runtime authority chain is complete and production-proven.

The next substantial candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

It must begin in a fresh development session by independently re-fetching current `main` and reconstructing exact owner/repository UI scope before implementation.

Do not automatically include:

- historical manager auto-linking by display-name equality;
- cloud;
- accounts;
- QR pairing;
- synchronization;
- remote transport;
- backup/import envelope redesign;
- gameplay or scoring changes;
- protected visual redesign;
- feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

No visible Save Library UI is implemented yet.

## Validation topology

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

## Historical warnings

PR #46 is the merged identity foundation authority.

PR #48 is the merged canonical persistence integration authority.

PR #51 is the merged and production-proven Save Library runtime authority cutover.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or used as a baseline. PR #40 remains the detailed v1.3 salvage/audit record. PR #42 remains the original v1.3 runtime release PR.