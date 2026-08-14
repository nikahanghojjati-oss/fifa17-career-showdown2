# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-13 ET
Status: canonical persistence integration implemented; final PR-head validation pending
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Feature release version: intentionally unassigned

## Current canonical persistence session

Owner-authorized scope: implement only the next bounded Local Profiles / Save Library candidate, canonical persistence integration. Do not expose Save Library UI, profile creation/rename/historical-mapping UI, redesign the backup/import envelope, add cloud/accounts/QR/synchronization, change gameplay/scoring/navigation/visual ownership, or assign a feature release version.

Independently verified session base `main`:

`e2208b18a4b7ee321a351fed5874b0ae8da9a05d`

The handoff-provided SHA was independently fetched from GitHub before any mutation and had not advanced.

Active branch:

`agent/save-library-canonical-persistence`

Branch base:

`e2208b18a4b7ee321a351fed5874b0ae8da9a05d`

Pre-implementation handoff checkpoint:

`a69c6f17eba65e7f44bb90e08910b54dc30c2a3d`

Implementation head:

`a71362710c96630e7c25e9edd53d55559df430b0`

Pull request:

#48 — Add atomic Save Library persistence transition

The PR remains draft until its final documentation head receives a fresh normal validation generation.

## Authority reconstruction completed before source mutation

The session read the ten owner-required current authority documents in the specified order, then deeply inspected:

- `js/storage.js`;
- `js/storageTransaction.js`;
- `js/saveLibraryFoundation.js`;
- `js/backup.js`;
- `js/importAnalysis.js`;
- `js/restore.js`;
- startup and optional-module load ownership;
- the current singleton active-save runtime path;
- Candidate A backup contracts/browser audit;
- Candidate B import-analysis contracts/browser audit;
- all four Candidate C restore contract families and both Candidate C browser audits;
- static/performance, stability, final-hardening and release-authority contracts.

The reconstruction confirmed:

- Candidate C destructive Apply still depends on `captureCareerModeRawRestoreSnapshot()`;
- Candidate C's existing transaction-owned exact-byte preconditions, rollback ownership, anti-clobber behavior and critical recovery are permanent contracts;
- eager startup before this candidate was `164563` raw / `37355` gzip, leaving insufficient room to load the ~20 KB Save Library foundation eagerly;
- the foundation planner intentionally treats any valid existing Save Library as `already-migrated`, even if old singleton bytes also exist, so persistence integration must separately distinguish a verified interrupted staging state from conflicting dual authority;
- the old raw transaction engine knew only `activeShowdown`, `legacyShowdowns`, and `preferences`, with its default relative ordering protected by Candidate C evidence.

## Implemented persistence candidate

The implementation is deliberately non-UI and non-eager.

### `js/storage.js`

`js/storage.js` remains sole public canonical persistence/destructive mutation authority.

It now provides a dedicated strict exact four-slot migration snapshot over:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

Candidate C's `captureCareerModeRawRestoreSnapshot()` remains a strict three-slot destructive restore snapshot and was not replaced with Candidate A backup inputs.

The public `getCareerModeStorageKeys()` contract intentionally still reports the existing three currently canonical production keys. The proposed Save Library key is not declared a fourth permanent canonical production key by this candidate.

The canonical storage wrapper continues to own localStorage access and passes migration-only transaction options internally while preserving its protected public source signature.

### `js/storageTransaction.js`

The raw engine now recognizes the transitional `saveLibrary` slot while preserving the existing Candidate C default relative order and behavior for three-key restore transactions.

For Save Library migration only, it supports:

- an explicit validated write order;
- rejection of unknown slots or incomplete custom order definitions;
- an all-requested-slot exact prewrite guard before each affected write;
- final exact verification across all requested migration slots;
- the existing ownership-scoped reverse rollback;
- anti-clobber ownership checks;
- exact byte-for-byte rollback verification;
- existing `rollback-failed-critical` escalation when ownership becomes uncertain.

The migration-specific order is:

1. `legacyShowdowns`;
2. `saveLibrary`;
3. `preferences` as an exact guard/no-op when unchanged;
4. `activeShowdown` last.

This makes retirement of the old singleton active-save slot the migration commit point rather than allowing old authority to disappear before the registry has been staged and verified.

### `js/saveLibraryPersistence.js`

This new orchestrator performs no direct localStorage access and remains absent from production `index.html`.

It:

- flushes pending application writes before snapshot capture;
- requires the dedicated strict four-slot snapshot;
- completes identity/migration planning in memory before mutation;
- submits candidate and exact expected raw bytes through `js/storage.js` into the existing raw transaction engine;
- rejects stale-state preconditions without accepting an unverified result;
- propagates critical rollback uncertainty rather than masking it;
- treats an already-completed valid Save Library with no singleton active slot as an idempotent zero-write result;
- never accepts a valid Save Library plus a still-live singleton merely because the registry parses.

When both Save Library and singleton active bytes exist, the orchestrator treats them as a possible interrupted staging state only. It rebuilds the deterministic migration from the still-live singleton and current Legacy bytes, validates the existing registry, compares the canonical identity/save core, and requires the current Legacy raw bytes to exactly equal the deterministic migrated Legacy candidate. Only that verified interrupted state may resume by retiring the singleton. Any mismatch fails closed as `dual-authority-conflict` with zero writes.

This prevents two independently diverged active-save authorities from being silently reconciled.

## Runtime activation boundary

This candidate does not activate Save Library as the production runtime authority yet.

`js/saveLibraryFoundation.js` and `js/saveLibraryPersistence.js` remain absent from the eager production HTML. Existing singleton runtime create/load/save behavior therefore remains unchanged on the public application, and the proposed `careerModeShowdown.saveLibrary` key remains transitional/proposed rather than current production authority.

This boundary is intentional. Live runtime cutover requires the later Save Library runtime/profile path to own new-save and ongoing-save identity so the old singleton cannot be recreated after migration. That is a distinct substantial candidate and must not be smuggled into this persistence proof.

No service-worker, cache, production HTML, gameplay, scoring, Smart Back, protected visual, loading-screen, Settings install/update, backup-envelope or import-envelope source changed in PR #48.

## Focused regression evidence

`tests/contracts/save-library-persistence-contracts.cjs` was added to the permanent repository contract suite.

It protects:

- strict four-slot migration snapshot authority;
- no direct localStorage access from the orchestrator;
- unchanged Candidate C strict restore snapshot ownership;
- unchanged public current three-key production contract;
- initial migration with singleton retirement last;
- completed-migration zero-write idempotence;
- retry after interruption following only Legacy migration;
- retry after Legacy plus registry staging;
- retry where exact duplicate Legacy records were deterministically deduplicated;
- fail-closed conflicting dual authority;
- corrupt source byte preservation;
- blocked strict snapshot reads causing zero writes;
- exact rollback after registry-write failure;
- exact reverse rollback after singleton-retirement failure;
- cross-slot preference drift blocking singleton retirement while preserving the external write;
- anti-clobber rollback ownership conflict escalating to critical recovery while retaining old singleton authority;
- invalid/unknown raw transaction plan rejection.

The focused contract passed locally against a representative foundation harness before PR publication. GitHub CI then ran the same contract against the actual merged foundation and it passed.

## First authoritative PR validation generation

Implementation head:

`a71362710c96630e7c25e9edd53d55559df430b0`

All 13 normal PR workflow families passed with no failure and no rerun:

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

Validate Static App job `94652249001` passed syntax, dynamic release architecture, the complete 23-file repository contract suite and permanent workflow topology.

Authoritative eager startup after this candidate:

- raw: `164967` bytes;
- gzip: `37425` bytes.

Locked ceilings remain unchanged at `165000` raw / `37500` gzip. No budget was raised.

The full repository suite explicitly printed:

`PASS Save Library canonical persistence transition: strict four-slot snapshots, singleton-last retirement, interruption retry, dual-authority rejection, exact rollback, cross-slot stale guards and anti-clobber critical recovery are protected.`

Candidate C's contract job passed and its authoritative restore/recovery browser job `94652288620` passed. Canonical Stability's contract job passed and Chromium stability job `94652300316` passed the canonical runtime/offline/complete integration journey.

Technical/developer proof remains separate from owner visual/product acceptance. This candidate has no visible product/UI delta requiring a new owner visual acceptance gate.

## Current persistence authority

Until a later runtime-activation candidate explicitly changes production ownership, the currently canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Proposed future registry key:

`careerModeShowdown.saveLibrary`

Do not interpret the internal migration transaction's ability to address `saveLibrary` as declaring a fourth permanent canonical production key.

## Foundation candidate — complete

Foundation PR #46 merged at:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

Foundation final validated head:

`44606296ab734ab429ac34020d377cb3ca2c077f`

The foundation remains pure identity and migration-planning logic. It performs no localStorage mutation and remains unloaded by production.

Its stable deterministic SHA-256-derived opaque IDs remain:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for manager identities.

Display-name equality is never identity authority. Historical Legacy identities without exact current Showdown identity remain explicit future mapping work.

After the foundation merge, all 14 permanent push-triggered workflow families passed. Post-merge Stability `31758874808`, deployed-site-smoke job `94641012805`, and Release Integration Burn-In `31758874804` all passed.

## Tool and failure history

Current persistence session:

- a read-only local `git clone` attempt failed because the execution environment could not resolve `github.com` (`Could not resolve host: github.com`); no repository mutation occurred;
- GitHub connector state was therefore used as repository authority and GitHub Actions as the authoritative full-repository execution environment;
- PR #48's first validation generation produced no CI failure, so no implementation correction, test weakening, budget change or rerun was required.

Relevant prior foundation/documentation history retained for future developers:

- the first connector handoff-file creation attempt in the foundation session was blocked before mutation; the handoff was then published through Git object operations;
- the first full-body PR #46 creation attempt was blocked before mutation; a minimal PR creation succeeded and its body was updated afterward;
- the first PR #46 mark-ready call was blocked before mutation; a direct merge while the PR was still draft returned HTTP 405 and did not merge; a later mark-ready succeeded and PR #46 merged only with expected-head protection;
- during documentation sealing, the first handoff replacement connector attempt was blocked before mutation and was rerouted through Git object operations;
- PR #47's initial head `777e82e538c6bd3bd868c3a95b2e2c24bafe245d` had one Validate Static App failure, run `31759464388`, job `94642505926`, because `NEXT_TASK.md` had accidentally removed the protected phrase `Installable Offline App`; this was classified as a documentation-contract mismatch, the required baseline wording was restored, no test was weakened, and no runtime source changed.

No blocked or failed operation above is production state.

## Final validation and merge boundary

This handoff update creates the final documentation head for PR #48. Do not merge merely because the implementation head passed once.

Required next actions in this same bounded candidate:

1. verify the new exact PR head;
2. require a fresh normal PR workflow generation to pass on that exact head;
3. mark PR #48 ready only after that exact-head validation is green;
4. merge only with expected-head protection;
5. independently verify the resulting `main` SHA and normal post-merge push workflows/public smoke;
6. publish the final merged-state handoff before moving into any later runtime activation or visible Save Library work.

The next substantial engineering task after clean closure of this candidate is not visible Save Library UI by default. It is the separately bounded runtime authority cutover needed to make Save Library the actual active/in-progress save owner without allowing the old singleton writer to recreate `activeShowdown` after migration. That later task should begin from a freshly verified merged `main` under the same quality-first handoff rule.
