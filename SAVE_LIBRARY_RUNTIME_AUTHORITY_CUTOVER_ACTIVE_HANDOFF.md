# Career Mode Showdown — Save Library Runtime Authority Cutover Handoff

Last updated: 2026-08-14 ET
Status: implementation complete, merged to production `main`, exact post-merge validation complete
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Pull request: `#51` — Cut over runtime authority to Save Library
Implementation branch: `agent/save-library-runtime-authority-cutover`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Final production authority

The runtime authority cutover is complete and must no longer be described as a pending PR.

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Exact final PR #51 head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

Pre-merge `main`:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

Exact merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

The merge commit parents are exactly the pre-merge `main` SHA and exact green PR head `bda19f8181598d880c7b1eb7f4e9446464d015e6`.

PR #51 was merged with expected-head protection after live GitHub reported it clean and mergeable. No force overwrite was used.

All 13 normal PR workflow families passed on the exact final PR head.

All 14 permanent push-triggered workflow families passed on exact merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.

Release Integration Burn-In run `31768712755` passed both `integration-burnin-pass-1` and `integration-burnin-pass-2`, each repeating the complete stateful integration journey and uploading pass evidence.

Stability Lane run `31768712798` passed:

- `stability-contracts`;
- `chromium-stability`;
- `deployed-site-smoke`.

The deployed-site smoke verified every expected runtime byte on GitHub Pages, then passed runtime-error provenance, Home visual, crop-safe football-photo, Candidate A backup export, Candidate B import analysis, Candidate C atomic restore/recovery, install/offline boundary and complete deployed-site journey audits.

No test was weakened. No performance ceiling was raised.

## Owner-authorized scope

This candidate implements only Save Library runtime authority cutover.

It does not add visible Save Library UI, profile creation/rename UI, historical profile mapping UI, cloud accounts, synchronization, remote transport, gameplay/scoring changes, visual redesign, Smart Back redesign, loading-screen changes, Settings install/update redesign, backup/import envelope redesign or a feature release-version assignment.

The architectural purpose is narrow:

- `careerModeShowdown.saveLibrary` becomes authoritative for active/in-progress Showdown persistence after cutover;
- `careerModeShowdown.activeShowdown` becomes a migration/recovery compatibility slot rather than a normal runtime writer;
- normal gameplay retains the existing synchronous `saveCurrentShowdown()` facade;
- the already-proven migration and raw transaction machinery remains the authority beneath the cutover.

## Implemented runtime architecture

### Lazy cutover boundary

`js/saveLibraryCutover.js` owns the lazy authority transition and remains absent from eager production HTML.

It lazy-loads, as needed:

- `js/saveLibraryFoundation.js`;
- `js/storageTransaction.js`;
- `js/saveLibraryPersistence.js`;
- `js/saveLibraryRuntime.js`.

Start and Continue are the actual migration/activation actions.

Opening Settings or Legacy on an unmigrated singleton device remains read-only and must not migrate competition data merely because a data/settings surface was opened.

On an already-migrated Save Library device, Settings or Legacy may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy can interpret canonical state correctly.

Predictive hover/focus gameplay warm-up remains non-mutating.

Start and Continue are synchronously locked before lazy loading begins so rapid double activation cannot race the loader gap.

### Eager Showdown boundary

`js/showdown.js` contains only the small explicit-action capture gate for Continue, Start, Legacy and Settings.

The gate lazy-loads `js/saveLibraryCutover.js` and delegates. The heavy Save Library stack is not absorbed into `app.js` or eager startup.

New Showdown creation requires ready Save Library runtime authority so stable identity exists before authoritative persistence.

Creation remains promise-deduplicated so rapid repeated Start activation cannot create duplicate logical saves.

### Storage facade

`js/storage.js` remains the sole public raw localStorage authority.

Before explicit runtime activation, the compatibility-facing public current-storage-key contract remains exactly:

1. `careerModeShowdown.activeShowdown`;
2. `careerModeShowdown.legacyShowdowns`;
3. `careerModeShowdown.preferences`.

After successful runtime cutover, public canonical authority becomes exactly:

1. `careerModeShowdown.saveLibrary`;
2. `careerModeShowdown.legacyShowdowns`;
3. `careerModeShowdown.preferences`.

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It remains only a transitional migration/recovery slot.

The dedicated migration/recovery snapshot may reason over `saveLibrary`, `activeShowdown`, `legacyShowdowns` and `preferences`; that temporary four-slot view never creates a permanent four-key public authority model.

Normal `saveCurrentShowdown()` no longer writes singleton bytes after activation. It succeeds only when Save Library runtime authority is ready and routes through that authority.

Pre-cutover destructive compatibility remains intentionally narrow: old singleton reset/delete behavior may remove old bytes when no Save Library exists, but normal gameplay cannot recreate singleton authority.

The shared `cloneForStorage()` compatibility helper remains available because Transfer Challenge uses it to snapshot in-memory state before guarded synchronous mutations.

### Save Library runtime authority

`js/saveLibraryRuntime.js` performs runtime orchestration without direct localStorage access.

After activation it preserves the existing synchronous gameplay persistence facade while the implementation is Save Library-backed.

Permanent guarantees include:

- singleton retirement before Save Library authority is accepted;
- exact owned Save Library raw-byte tracking;
- exact authority recheck before each normal write;
- stale/cross-tab drift rejection;
- in-memory `saveId` matching registry `activeSaveId`;
- singleton reappearance invalidating authority and blocking writes;
- stable `season_*` identity for completed Seasons;
- stable `save_*` and role-specific `profile_*` identity before first authoritative write for new Showdowns;
- distinct profile identity even when manager display names are identical;
- active-save replacement preserving unrelated profile identity records;
- active-save deletion remaining distinct from full data reset;
- full reset preserving application preferences;
- fail-closed transaction behavior when storage authority cannot be verified.

Display-name equality is never identity authority. Historical ambiguous manager identities remain explicit future mapping work.

### Backup compatibility

Candidate A format remains v1 and export remains non-mutating.

When Save Library is authoritative and singleton bytes are absent, Candidate A may project the authoritative active Save Library Showdown into the existing backup active-Showdown field without mutating canonical data.

If singleton and Save Library bytes coexist ambiguously, or Save Library is unreadable, backup projection must fail closed rather than silently choose authority.

### Candidate B

Candidate B remains strictly read-only analysis. Runtime cutover did not broaden its authority.

### Candidate C restore compatibility

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply retains the mandatory three-slot:

`captureCareerModeRawRestoreSnapshot()`

This is strict exact raw snapshot authority.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The old singleton-format restore path keeps its original three-slot transaction shape.

On an already-migrated Save Library device, Candidate C additionally captures exact Save Library state, guards exact bytes, prepares identity-safe active replacement through runtime authority, commits Save Library through the guarded transaction path and reactivates runtime authority after successful restore.

Dual singleton plus Save Library authority is a conflict and fails closed.

All stale-state, immutable-confirmed-intent, first-write-clean-failure, transaction-owned mutation, ownership-scoped rollback, anti-clobber and critical-recovery behavior remains intact.

### PWA/offline boundary

The lazy cutover files are part of the verified whole application shell even though they are not eager HTML assets.

`service-worker.js` includes the cutover, foundation, persistence and runtime modules in whole-shell authority.

Offline/cache operations preserve canonical user data exactly. Opening Settings while offline must not migrate an old singleton merely because offline UI was inspected.

Service Worker and Cache Storage remain application-byte authorities only, never canonical user-data authority.

No application/runtime release label was changed in PR #51.

## Permanent regression coverage

The Save Library runtime contract suite permanently covers, among other cases:

- pre-activation normal singleton writer cannot reappear;
- migration followed by runtime writes never recreates singleton bytes;
- stable save/profile identity across ongoing writes;
- identical manager display names still receive distinct profile IDs;
- stable Season identity through completion and Legacy archive;
- new Showdown identity before first authoritative write;
- active replacement preserving historical/non-active profile identity;
- active deletion remaining separate from full reset;
- restore-active preparation preserving non-active Save Library entries and profiles;
- reload/idempotent activation retaining identity;
- stale Save Library bytes fail closed;
- singleton reappearance after cutover fails closed;
- transaction-boundary drift rolls back only transaction-owned bytes;
- corrupt Save Library activation fails closed;
- Candidate A projection remains non-mutating;
- full reset uses canonical transaction authority and preserves preferences.

The complete Stability browser journey permanently exercises the post-cutover authority model, including corrupt singleton fail-closed behavior, Save Library quota rejection/retry, rapid Start deduplication, zero singleton writes, league/club flows, Transfer Challenge, Season review, reload/history, optional modules, Settings, accessibility and responsive containment.

## Failure and correction ledger

The following implementation failures were resolved without weakening validation.

### 1. Eager cutover violated startup budget

An early implementation put cutover gate logic into eager `app.js`.

Correction: restore `app.js` and move cutover activation behind the lazy explicit-action boundary.

### 2. Predictive warm-up became mutating

An intermediate wrapper could activate migration during hover/focus warm-up.

Correction: migration occurs only on confirmed Start/Continue actions.

### 3. Candidate C four-slot snapshot became mandatory everywhere

The first cutover version incorrectly required the migration snapshot in legacy three-slot restore paths.

Correction: the three-slot strict destructive snapshot remains mandatory; Save Library protection is additive only when relevant.

### 4. Candidate C source compaction broke frozen-intent/source-shape contracts

Correction: readable intent-freeze source and established singleton transaction call shape were restored.

### 5. Pre-cutover Settings reset compatibility regressed

Correction: preserve exact old singleton reset/delete compatibility only when Save Library is absent; state containing Save Library still requires runtime authority or fails closed.

### 6. Settings focus return broke at the cutover gate

Correction: only Start/Continue use disabled busy-state controls; Settings/Legacy retain focusability during lazy data preparation.

### 7. Opening Settings/Legacy mutated old singleton data

Correction: unmigrated Settings/Legacy openings remain non-mutating; already-migrated devices may reactivate Save Library compatibility authority.

### 8. Corrupt singleton behavior briefly followed an obsolete replacement-dialog model

Correction: corrupt singleton bytes fail closed and are preserved. Save Library authority is not fabricated from corrupt bytes.

### 9. Quota fixture targeted the retired singleton writer

Correction: quota failure targets `careerModeShowdown.saveLibrary`, asserts no singleton resurrection and verifies safe retry after storage recovery.

### 10. Quota retry hit a Playwright actionability race

Correction: use the established page-context activation pattern and observe resulting state rather than racing the disappearing Start control. No production behavior changed.

### 11. Transfer Window failed because `cloneForStorage()` was accidentally removed

This was the final substantive browser regression.

`startTransferWindow()` depends on the shared helper before timer-state mutation. The storage cutover rewrite had accidentally removed it.

Correction: restore structured clone with JSON fallback compatibility and preserve a lazy cutover fallback for already-loaded gameplay contexts.

After this correction, exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed the complete Stability browser journey and all 13 normal PR workflow families.

### 12. Safe concurrency conflicts while the branch advanced

Multiple repository writes encountered HTTP 409 because the branch advanced concurrently.

Correction: treat stale expected-head/blob conflicts as safe non-mutation, re-fetch live head and exact file contents, and never force overwrite newer work.

## Exact validation proof

Runtime/test implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed all 13 normal PR workflow families.

Final PR head `bda19f8181598d880c7b1eb7f4e9446464d015e6` also passed all 13:

1. Validate Static App
2. Validate Final Polish
3. Validate Home Bootstrap
4. Validate Settings Workstream
5. Validate League Confirmation
6. Validate Transfer Workstream
7. Validate Season Review
8. Validate Statistics Workstream
9. Validate V1 Visual Immersion
10. Validate Licensed Football Visuals
11. Validate Candidate B Import Analysis
12. Validate Candidate C Atomic Restore
13. Validate Stability Lane

The exact merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2` then passed all 14 permanent push-triggered workflow families, including Release Integration Burn-In.

Final performance proof remains:

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

## Installable Offline App lock

The shipped Installable Offline App whole-shell label remains `1.3.0-r1`, with `1.2.0-r2` as immediate previous known-good shell.

Preserve atomic cache population, coherent whole-runtime selection, previous-known-good recovery, Candidate C gating, app-namespace-only cleanup, unrelated-cache preservation, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

## Closure boundary and next developer rule

PR #51 is complete, merged and production-proven. Do not reopen its runtime architecture merely to begin the visible product phase.

The next substantial candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate and must begin in a fresh development session after independently re-fetching current `main` and reconstructing exact owner/repository UI scope.

Do not automatically include historical manager auto-linking by display-name equality, cloud, accounts, QR pairing, synchronization, remote transport, backup/import envelope redesign, gameplay/scoring changes, protected visual redesign or feature release-version assignment.

No visible Save Library UI is implemented yet.

If a future runtime failure appears, classify it against current `main`, this production-proof chain and the exact green `46d3e9d...` implementation reference before making changes. Preserve the migration transaction engine, Candidate C ownership, protected startup budgets, offline exact-byte guarantees, corrupt fail-closed behavior and synchronous gameplay persistence facade.