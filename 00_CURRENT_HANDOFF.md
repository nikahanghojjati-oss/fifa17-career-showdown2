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

The shipped runtime remains technically production-proven. Owner visual/product acceptance is a separate evidence channel and must not be inferred from CI or developer verification.

## Current development authority

The active product direction remains Local Profiles / Save Library, with feature release version intentionally unassigned.

The historical roadmap label that once called this feature `v1.3.0` is obsolete because `v1.3.0 — Recovery & Device Resilience Hardening` is already the production release.

The identity foundation and canonical persistence integration are now both complete.

Detailed active-feature authority lives in `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.

## Identity foundation — complete

Foundation PR: #46
Final validated head: `44606296ab734ab429ac34020d377cb3ca2c077f`
Merge: `b76baf3be8107a57c5898f691d5178ae1d8a8547`

`js/saveLibraryFoundation.js` remains pure identity and migration-planning logic. It performs no localStorage writes and is not loaded by the production application.

Stable IDs remain deterministic opaque SHA-256-derived identifiers:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for manager identities.

Display-name equality is never identity authority. Two managers with identical display names remain separate identities. Ambiguous historical Legacy manager identity remains explicit future mapping work and must not be auto-linked by normalized name.

## Canonical persistence integration — complete

Persistence PR: #48 — Add atomic Save Library persistence transition
Session base: `e2208b18a4b7ee321a351fed5874b0ae8da9a05d`
Implementation head: `a71362710c96630e7c25e9edd53d55559df430b0`
Final validated PR head: `9abf9a1761bda4269557dce5fbf96f47514253ed`
Merge: `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

PR #48 merged only after the exact final head passed a fresh second 13/13 normal PR workflow generation, and the merge used expected-head protection.

The merged candidate added a non-eager `js/saveLibraryPersistence.js`, a dedicated strict four-slot migration snapshot in `js/storage.js`, and migration-specific transaction ordering and all-slot prewrite guards in `js/storageTransaction.js`.

The migration temporarily reasons about:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

This is not a four-key permanent canonical model.

Migration ordering stages migrated Legacy bytes and the Save Library before retiring `activeShowdown`. Singleton retirement is the commit point. Exact raw preconditions, last-moment all-slot byte checks, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery remain protected.

A valid Save Library plus a still-live singleton is never accepted as two independent canonical authorities. It is treated only as a possible interrupted staging state and may resume only when deterministic reconstruction proves the registry and migrated Legacy bytes exactly match. Otherwise migration fails closed as a dual-authority conflict with zero mutation.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()`. Candidate A backup inputs were not substituted for destructive snapshot authority.

## Persistence integration validation

PR #48 implementation head `a71362710c96630e7c25e9edd53d55559df430b0` passed all 13 normal PR workflow families with no failure or rerun.

Final PR head `9abf9a1761bda4269557dce5fbf96f47514253ed` passed a second fresh 13/13 generation with no failure or rerun.

Authoritative eager startup after the candidate:

- raw: `164967` bytes;
- gzip: `37425` bytes.

Locked ceilings remain `165000` raw and `37500` gzip. No budget was raised.

After merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`, all 14 permanent push-triggered workflow families succeeded.

Post-merge Stability:

`31762998592` — success.

Deployed-site-smoke job:

`94653355400` — success.

The public deployment passed:

- exact GitHub Pages runtime-byte verification;
- runtime error provenance;
- Home visual audit;
- crop-safe football-photo audit;
- Candidate A backup/export;
- Candidate B import analysis;
- Candidate C atomic restore/recovery;
- Installable Offline App boundary;
- complete public stateful journey.

Release Integration Burn-In:

`31762998620` — success, 2/2 complete independent stateful journeys.

This is technical/developer proof. It does not fabricate owner visual/product acceptance. PR #48 introduced no visible Save Library UI delta.

## Current production persistence authority

Production runtime activation has intentionally not happened yet.

Exactly three localStorage keys therefore remain canonical in the public application:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Proposed future registry key:

`careerModeShowdown.saveLibrary`

That key is not a fourth permanent canonical production key at this boundary.

`js/saveLibraryFoundation.js` and `js/saveLibraryPersistence.js` remain absent from eager production HTML. Existing singleton create/load/save behavior remains the live runtime path until a later cutover candidate explicitly transfers authority.

`js/storage.js` remains sole public canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. `js/screens.js` remains navigation/history/Smart Back authority. `js/scoring.js` and `js/analytics.js` retain their existing authorities.

Service Worker and Cache Storage remain application-byte authorities only and may never become canonical user-data storage.

## Protected recovery model

Candidate A remains non-mutating export.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to commit canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` strict exact raw authority. `captureCareerModeRawBackupInputs()` must never substitute as destructive mutation authority.

Preserve complete in-memory planning, immutable confirmed intent where relevant, stale-state barriers, exact preconditions, last-moment exact-byte checks, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery on uncertainty.

## PWA, visual and product locks

Current whole shell remains `1.3.0-r1`; immediate previous known-good whole shell remains `1.2.0-r2`.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Preserve the installed iOS loading composition, Settings-only install/update presentation, protected FIFA 17-inspired visual shell and subject-safe football photography.

Exactly two managers. Showdown lengths remain 1 / 3 / 5 / 10. Same selected league, different permanent clubs. Champions League +5, League +3, Domestic Cup +1, 100 League Points and/or 100 League Goals combined maximum +1, Top Scorer and/or Top Assist combined maximum +1, maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position and then league points.

## Performance locks

Eager raw <= `165000`
Eager gzip <= `37500`
Reus startup portrait <= `95000`
Combined first-party startup <= `260000`
Normal loading minimum `2700 ms`
Reduced-motion loading `220 ms`

Do not raise limits to make CI green.

## Next legal engineering task

The next dependency-ordered candidate is a separate runtime authority cutover.

Its purpose is to make Save Library the actual production authority for active and in-progress Showdowns without allowing the old singleton writer to recreate `careerModeShowdown.activeShowdown` after a successful migration.

Do not begin visible Save Library UI by default from this boundary.

The runtime cutover must begin from a freshly verified merged `main`, preserve the proven atomic migration machinery, and choose the narrowest safe loading/ownership path under the extremely tight eager startup budget.

It must preserve Candidate A as non-mutating, Candidate B as read-only, Candidate C as the only import mutation stage with strict restore-snapshot authority, all PWA locks, all gameplay/scoring locks, protected visuals and all performance ceilings.

Visible Save Library screens, profile rename/create UI, historical profile mapping UI, backup/import envelope evolution, cloud, accounts, QR pairing, synchronization and remote transport remain outside this next candidate unless newer owner authority explicitly changes ordering.

Do not assign a feature release version yet.

## Tool and failure record

The persistence session had no CI failure and required no rerun, test weakening or budget increase.

A read-only local clone attempt failed because the execution environment could not resolve `github.com`; no repository mutation occurred.

A PR-body metadata update once supplied `maintainer_can_modify` to a same-repository PR and GitHub returned HTTP 422. This was classified as API metadata misuse, caused no branch mutation, and the update succeeded when retried without that field.

During post-merge public proof, a read-only attempt to fetch logs for the still-running deployed smoke returned GitHub `404 BlobNotFound`; normal Actions status remained healthy and the job later passed completely.

During final closure, another read-only local clone attempt failed with the same DNS resolution error. No mutation occurred.

PR #47's earlier documentation-only failure remains historical evidence: its initial head removed the protected `Installable Offline App` wording from `NEXT_TASK.md`, causing Static App run `31759464388`, job `94642505926`, to fail. The wording was restored without weakening tests or changing runtime source.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be revived or merged.

## Quality-first continuation boundary

Canonical persistence integration is merged and publicly proven. This is a clean repository boundary.

Do not push into runtime authority cutover in the same context-heavy session. A fresh developer session must independently fetch current `main`, read `00_HANDOFF_GOLDEN_RULE.md`, this file, `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`, `PROJECT_STATE.md` and `NEXT_TASK.md`, then reconstruct current source before making runtime changes.