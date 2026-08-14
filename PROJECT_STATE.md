# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Production previous known-good runtime: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

Owner visual/product acceptance remains separate from automated technical proof and is not inferred here.

## Active development authority

The owner authorized Local Profiles / Save Library after v1.3 production closure.

Feature release version remains intentionally unassigned. Do not reuse the obsolete historical `v1.3.0` planning label because `v1.3.0 — Recovery & Device Resilience Hardening` is already the shipped production release.

The Local Profiles / Save Library identity foundation and canonical persistence integration are now complete.

Foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.

Canonical persistence PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692` after exact-head validation and expected-head merge protection.

## Identity foundation state

`js/saveLibraryFoundation.js` remains pure, unloaded identity/migration planning logic.

Stable deterministic opaque identities remain:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for manager identities.

Identity is never inferred merely from display-name equality. Two managers with identical display names remain distinct. Ambiguous historical Legacy manager identity remains explicit future mapping work rather than automatic normalized-name linking.

The foundation fails closed on corrupt raw source, malformed registry state, same-ID/different-content Legacy conflicts, missing Showdown identity and invalid or duplicate Season numbering.

## Canonical persistence integration state

PR #48 added the bounded non-UI persistence transition machinery without activating Save Library as the production runtime authority.

`js/storage.js` remains sole public canonical persistence/destructive mutation authority.

`js/storageTransaction.js` remains the raw transaction engine.

`js/saveLibraryPersistence.js` is a non-eager orchestrator that performs no direct localStorage access.

Migration can reason about the temporary four-slot set:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

This is not a four-key permanent canonical production model.

Migration stages Legacy and Save Library bytes before retiring the singleton. `activeShowdown` retirement is the commit point. Strict raw snapshot authority, complete in-memory planning, exact preconditions, all-slot last-moment prewrite checks, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, interruption/retry idempotence and critical recovery remain protected.

A valid Save Library plus a still-live singleton is accepted only as a deterministically verified interrupted staging state. Any mismatch fails closed as a dual-authority conflict with zero mutation.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` and was not changed to use Candidate A backup inputs.

## Persistence integration validation

PR #48 implementation head `a71362710c96630e7c25e9edd53d55559df430b0` passed all 13 normal PR workflow families.

Final validated PR head `9abf9a1761bda4269557dce5fbf96f47514253ed` passed a second fresh 13/13 generation.

Authoritative eager startup after integration:

- raw: `164967` bytes;
- gzip: `37425` bytes.

Locked ceilings remain `165000` raw and `37500` gzip. No budget was raised.

After merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`, all 14 permanent push-triggered workflow families succeeded.

Post-merge Stability `31762998592` passed repository contracts, canonical Chromium integration and deployed-site-smoke job `94653355400`.

That deployed smoke passed exact public runtime bytes, runtime provenance, Home visual audit, crop-safe football photography, Candidate A export, Candidate B analysis, Candidate C restore/recovery, Installable Offline App boundary and the complete public stateful journey.

Release Integration Burn-In `31762998620` passed 2/2 complete stateful journeys.

## Current production persistence authority

Production has not yet been cut over to Save Library runtime ownership.

Exactly three localStorage keys remain canonical in the public application:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.saveLibrary` remains the proposed future registry key and is not a fourth permanent canonical production key at this boundary.

`js/saveLibraryFoundation.js` and `js/saveLibraryPersistence.js` remain absent from eager production HTML. Existing singleton create/load/save behavior remains active until a separately proven runtime authority cutover.

Service Worker and Cache Storage remain application-byte authorities only and are never canonical user-data authority.

## Next persistence candidate

The next dependency-ordered engineering task is a separately bounded runtime authority cutover.

Its purpose is to make Save Library the actual production authority for active and in-progress Showdowns while preventing the old singleton writer from recreating `careerModeShowdown.activeShowdown` after successful migration.

Do not begin visible Save Library UI by default as part of this candidate.

The next candidate must start from a freshly verified current `main`, preserve the proven persistence transaction and recovery semantics, and choose the narrowest safe runtime loading/ownership path under the extremely tight eager startup budget.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C remains the only import stage allowed to mutate canonical restore state and retains strict `captureCareerModeRawRestoreSnapshot()` authority.

Visible Save Library screens, profile creation/rename UI, historical mapping UI, backup/import envelope evolution, cloud, accounts, QR pairing, synchronization and remote transport remain later work unless newer owner authority explicitly changes ordering.

Do not assign a feature release version yet.

## Installable Offline App authority

Current whole shell: `1.3.0-r1`
Immediate previous known-good shell: `1.2.0-r2`

Preserve verified atomic cache population, explicit safe update activation, Candidate C busy/recovery gating, whole-runtime selection, previous-known-good recovery, fail-closed behavior when no coherent shell exists, app-namespace-only cleanup, unrelated-cache preservation, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Install/update controls remain Settings-only.

## Protected presentation and product rules

Preserve the installed iOS loading composition, proven FIFA 17-inspired menu shell and subject-safe football photography.

Exactly two managers. Showdown lengths are 1, 3, 5 or 10. Same selected league, different permanent clubs. Champions League +5. League +3. Domestic Cup +1. 100 League Points and/or 100 League Goals combined maximum +1. Top Scorer and/or Top Assist combined maximum +1. Maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position then league points.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Performance locks

Eager raw <= `165000`
Eager gzip <= `37500`
Startup Marco Reus portrait <= `95000`
Combined first-party startup <= `260000`
Normal loading minimum `2700 ms`
Reduced-motion loading `220 ms`

Do not raise limits to make CI pass.

## Validation topology

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

## Branch authority and historical warnings

PR #46 is the merged identity foundation authority.

PR #48 is the merged canonical persistence integration authority.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or used as a baseline. PR #40 remains the detailed v1.3 salvage/audit record. PR #42 is the v1.3 runtime release PR.

No visible Save Library UI, cloud, accounts, synchronization, QR pairing, gameplay/scoring changes or framework migration was authorized by the completed persistence integration candidate.