# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-13 ET
Status: canonical persistence integration merged and post-merge proven; next substantial candidate is runtime authority cutover
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Feature release version: intentionally unassigned

## Clean boundary reached

The owner-authorized canonical persistence integration candidate is complete, merged, independently re-fetched on `main`, and proven by normal PR validation, post-merge push validation, deployed GitHub Pages smoke and release burn-in.

No visible Save Library UI was started.

No profile creation, rename or historical mapping UI was started.

No cloud, accounts, QR pairing, synchronization or remote transport was added.

No gameplay, scoring, Smart Back, protected football visual, iOS loading composition, Settings install/update presentation, backup-envelope or import-envelope behavior was redesigned.

No feature release version was assigned.

The production app remains `v1.3.0` with whole runtime `1.3.0-r1` and immediate previous whole runtime `1.2.0-r2`.

## Repository authority

The session began by independently fetching `main` before mutation.

Verified session base:

`e2208b18a4b7ee321a351fed5874b0ae8da9a05d`

The owner-provided handoff SHA had not advanced.

Implementation branch:

`agent/save-library-canonical-persistence`

Pre-implementation public handoff checkpoint:

`a69c6f17eba65e7f44bb90e08910b54dc30c2a3d`

Implementation head:

`a71362710c96630e7c25e9edd53d55559df430b0`

Final validated PR head:

`9abf9a1761bda4269557dce5fbf96f47514253ed`

Pull request:

#48 — Add atomic Save Library persistence transition

Merge commit:

`d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

The merge used expected-head protection against exact head `9abf9a1761bda4269557dce5fbf96f47514253ed`.

After merge, `main` was independently fetched again and resolved exactly to `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.

This closure handoff is being published from a separate documentation-only branch based on that verified merge.

## Authority reconstruction before implementation

The session read the ten owner-required current authority documents in the specified order before changing source, then deeply inspected:

- `js/storage.js`;
- `js/storageTransaction.js`;
- `js/saveLibraryFoundation.js`;
- `js/backup.js`;
- `js/importAnalysis.js`;
- `js/restore.js`;
- startup and optional-module load ownership;
- the current singleton active-save runtime path;
- Candidate A backup contracts and browser audit;
- Candidate B import-analysis contracts and browser audit;
- all Candidate C restore contract families and browser audits;
- current static/performance, stability, final-hardening and release-authority contracts.

The reconstruction confirmed that Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()`, that Candidate C's exact-byte preconditions and rollback ownership are permanent contracts, and that Candidate A backup inputs cannot substitute for destructive snapshot authority.

It also confirmed the production eager shell had only 437 raw bytes of headroom before this candidate, so the approximately 20 KB identity foundation could not simply become an eager production script.

## Implemented persistence transition

The implementation is deliberately non-UI and non-eager.

### `js/storage.js`

`js/storage.js` remains the sole public canonical persistence and destructive mutation authority.

It now exposes a dedicated strict four-slot Save Library migration snapshot over:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

Candidate C's existing `captureCareerModeRawRestoreSnapshot()` remains a strict three-slot destructive restore snapshot and was not replaced or weakened.

The public `getCareerModeStorageKeys()` contract still reports exactly the three currently canonical production keys. The internal ability to address `saveLibrary` for migration does not declare it a fourth permanent production authority.

### `js/storageTransaction.js`

The raw transaction engine now recognizes the transitional Save Library slot while preserving existing Candidate C default behavior and the relative ordering of its original three slots.

For Save Library migration only, it supports:

- validated custom transaction ordering;
- rejection of unknown or incomplete plans;
- exact all-requested-slot last-moment prewrite guards before every affected migration write;
- final exact verification across all requested migration slots;
- ownership-scoped reverse rollback;
- anti-clobber ownership checks;
- byte-for-byte rollback verification;
- existing `rollback-failed-critical` escalation when ownership becomes uncertain.

Migration order is:

1. `legacyShowdowns`;
2. `saveLibrary`;
3. `preferences` as an unchanged exact guard/no-op;
4. `activeShowdown` last.

The old singleton active-save slot is therefore retired only after registry staging and verification. Singleton retirement is the commit point.

### `js/saveLibraryPersistence.js`

The new orchestrator performs no direct localStorage access and remains absent from production `index.html`.

It:

- flushes pending application writes before snapshot capture;
- requires the dedicated strict four-slot snapshot;
- completes migration and identity planning fully in memory before mutation;
- submits exact expected raw bytes through `js/storage.js` and the established raw transaction engine;
- rejects stale-state boundaries without accepting an unverified result;
- preserves critical recovery on rollback uncertainty;
- returns an idempotent zero-write result for a completed valid Save Library with no singleton active slot;
- never accepts simultaneous Save Library and singleton active bytes merely because both parse.

When Save Library and singleton active bytes coexist, the state is treated only as a possible interrupted staging state. The orchestrator deterministically rebuilds the migration from the still-live singleton and current Legacy bytes, validates the existing registry, compares the canonical Save Library identity/save core, and requires exact migrated Legacy bytes. Only an exact verified interrupted state may resume by retiring the singleton.

Any mismatch fails closed as `dual-authority-conflict` with zero mutation.

This prevents independent dual active-save truth from being silently reconciled.

## Focused regression evidence

`tests/contracts/save-library-persistence-contracts.cjs` is now part of the permanent repository contract suite.

It protects:

- strict four-slot migration snapshot authority;
- no direct localStorage access from the persistence orchestrator;
- unchanged Candidate C strict restore snapshot ownership;
- unchanged public current three-key production contract;
- singleton-last initial migration;
- completed-migration zero-write idempotence;
- retry after interruption following only Legacy migration;
- retry after Legacy plus registry staging;
- retry with deterministic duplicate Legacy deduplication;
- conflicting dual authority failing closed with zero writes;
- corrupt raw source-byte preservation;
- strict snapshot read failure causing zero writes;
- exact rollback after registry-write failure;
- exact reverse rollback after singleton-retirement failure;
- cross-slot preference drift blocking retirement without clobbering the external write;
- anti-clobber ownership conflict escalating to critical recovery while retaining old singleton authority;
- invalid and unknown transaction plan rejection.

The complete repository contract suite now contains 23 files and explicitly reports the Save Library canonical persistence transition PASS line.

## Performance proof

Authoritative eager startup after this candidate:

- raw: `164967` bytes;
- gzip: `37425` bytes.

Locked ceilings remain unchanged:

- raw <= `165000`;
- gzip <= `37500`.

No budget was raised.

The Save Library identity foundation and persistence orchestrator remain non-eager, so this candidate did not add their full module payload to startup.

## PR validation proof

Implementation head `a71362710c96630e7c25e9edd53d55559df430b0` passed all 13 normal PR workflow families with no failure and no rerun.

First-generation workflow runs:

- Validate Statistics Workstream `31762717933`;
- Validate Licensed Football Visuals `31762717913`;
- Validate Static App `31762717954`;
- Validate Candidate C Atomic Restore `31762717923`;
- Validate Final Polish `31762717938`;
- Validate Season Review `31762717928`;
- Validate League Confirmation `31762717951`;
- Validate Home Bootstrap `31762717969`;
- Validate Stability Lane `31762717961`;
- Validate Settings Workstream `31762717966`;
- Validate V1 Visual Immersion `31762717989`;
- Validate Transfer Workstream `31762718016`;
- Validate Candidate B Import Analysis `31762718029`.

Validate Static App job `94652249001` passed JavaScript syntax, dynamic release architecture, the complete 23-file repository contract suite and permanent workflow topology.

After the public handoff seal, final PR head `9abf9a1761bda4269557dce5fbf96f47514253ed` passed a second fresh 13/13 generation, again with no failure or rerun:

- Transfer `31762860333`;
- Final Polish `31762860337`;
- Settings `31762860332`;
- Statistics `31762860335`;
- League Confirmation `31762860341`;
- Static App `31762860374`;
- Candidate B `31762860385`;
- Season Review `31762860382`;
- Home Bootstrap `31762860412`;
- Candidate C `31762860446`;
- Licensed Football Visuals `31762860431`;
- V1 Visual Immersion `31762860498`;
- Stability `31762860450`.

PR #48 was marked ready only after the exact final head was green, then merged using expected-head protection.

## Post-merge production proof

Merge commit:

`d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

Exactly 14 push-triggered workflow families started on the merge. Final result:

- `14/14` succeeded;
- `0` failed.

Post-merge Candidate C run:

`31762998805`

Its restore-contracts job `94653090685` passed.

Its authoritative restore-browser job `94653129053` passed.

Post-merge canonical Stability run:

`31762998592`

Its stability-contracts job `94653089889` passed.

Its Chromium canonical runtime/offline/complete integration journey job `94653125477` passed.

Its deployed-site-smoke job `94653355400` passed every public-production step:

- exact GitHub Pages runtime-byte verification;
- runtime error provenance audit;
- Home visual audit;
- crop-safe football-photo audit;
- Candidate A backup export audit;
- Candidate B import analysis audit;
- Candidate C atomic restore and recovery audit;
- Installable Offline App boundary audit;
- complete public stateful journey.

Post-merge Candidate B run `31762998622` passed.

Post-merge Release Integration Burn-In run:

`31762998620`

Both complete stateful journeys passed:

- pass 1 job `94653090123`;
- pass 2 job `94653090250`.

This is technical/developer proof. It remains separate from owner visual/product acceptance. PR #48 has no visible Save Library product/UI delta requiring a new owner visual acceptance gate.

## Current production persistence authority

The production application has not been cut over to Save Library runtime authority yet.

The currently canonical production localStorage keys therefore remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Proposed future registry key:

`careerModeShowdown.saveLibrary`

The proposed registry is not a fourth permanent canonical production key at this boundary.

`js/saveLibraryFoundation.js` and `js/saveLibraryPersistence.js` remain absent from eager production HTML, and the existing singleton create/load/save runtime path remains active.

That distinction is intentional: the atomic migration machinery is now proven, but production runtime ownership has not yet been transferred.

## Identity foundation remains locked

Foundation PR #46 merge:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

Foundation final validated head:

`44606296ab734ab429ac34020d377cb3ca2c077f`

The foundation remains pure identity and migration-planning logic and performs no localStorage mutation.

Stable deterministic SHA-256-derived opaque identities remain:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for manager identities.

Display-name equality is never identity authority. Two managers with identical display names remain distinct identities.

Historical Legacy identities that cannot be proven from exact current Showdown identity remain explicit future mapping work and are not auto-linked by normalized name.

## Tool, command and failure record

Current canonical persistence session:

1. A read-only local clone attempt failed because the execution environment could not resolve `github.com`: `Could not resolve host: github.com`. No repository mutation occurred. GitHub connector state remained repository authority and GitHub Actions remained the authoritative full-repository execution environment.

2. After the final PR head had passed twice, a PR-body metadata update incorrectly supplied `maintainer_can_modify` to a same-repository pull request. GitHub returned HTTP 422: `Fork collab can only be enabled on cross-repo pull requests`. This was classified as connector/API metadata misuse. No branch or runtime source changed. The identical PR-body update was retried without the inapplicable field and succeeded.

3. During post-merge public proof, a read-only attempt to fetch the still-running deployed-site-smoke live log returned GitHub `404 BlobNotFound`. The job itself remained healthy and continued through normal Actions status APIs. No repository mutation occurred. The deployed-site-smoke later completed successfully in full.

PR #48 produced no CI failure, no implementation correction after publication, no test weakening, no budget increase and no rerun.

Relevant prior foundation/documentation history remains important:

- the first connector handoff-file creation attempt in the foundation session was blocked before mutation and was rerouted through Git object operations;
- the first full-body PR #46 creation attempt was blocked before mutation, after which a minimal PR creation succeeded and its body was updated;
- the first PR #46 mark-ready call was blocked before mutation; an attempted direct merge while still draft returned HTTP 405 and did not merge; a later mark-ready succeeded and merge used expected-head protection;
- during the foundation documentation seal, the first handoff replacement connector attempt was blocked before mutation and was rerouted through Git object operations;
- PR #47 initial head `777e82e538c6bd3bd868c3a95b2e2c24bafe245d` had one Validate Static App failure, run `31759464388`, job `94642505926`, because `NEXT_TASK.md` had accidentally removed the protected phrase `Installable Offline App`; this was correctly classified as a documentation-contract mismatch, the required wording was restored, no test was weakened and no runtime source changed.

No blocked or failed operation above is production state.

## Next substantial engineering candidate

Do not begin visible Save Library UI by default from this boundary.

The next dependency-ordered candidate is runtime authority cutover.

Its purpose is to make Save Library the actual production authority for active and in-progress Showdowns without allowing the old singleton writer to recreate `careerModeShowdown.activeShowdown` after a successful migration.

That later candidate must independently reconstruct the new merged `main`, preserve the atomic migration evidence in this handoff, and decide the narrowest safe runtime loading and ownership path under the extremely tight eager startup budget.

It must continue to preserve Candidate A as non-mutating export, Candidate B as read-only analysis, Candidate C as the only import mutation stage with strict `captureCareerModeRawRestoreSnapshot()` authority, and all current PWA/runtime/performance/gameplay/visual locks.

Visible Save Library screens, profile editing, historical mapping UI and backup/import format evolution remain later concerns unless a future owner instruction explicitly changes their ordering.

## Handoff decision

The canonical persistence integration candidate has reached a clean technical boundary.

Do not push deeper into runtime cutover in this session.

A fresh development session should begin from the final merged documentation `main`, independently re-fetch repository authority, read this handoff and current top-level authority files, and only then start the separately bounded runtime authority cutover candidate.
