# Career Mode Showdown — Save Library Runtime Authority Cutover Handoff

Last updated: 2026-08-13 ET
Status: implementation complete; exact runtime code head fully green; documentation closure requires the normal exact-head workflow rerun before merge
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Pull request: `#51` — Cut over runtime authority to Save Library
Implementation branch: `agent/save-library-runtime-authority-cutover`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Authority and branch base

The candidate was created from independently verified live `main`:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

Immediately before this documentation closure, `main` was rechecked and still pointed to the same SHA. The raw GitHub PR record reported the implementation branch as mergeable, rebaseable and `mergeable_state: clean` against that exact base.

The final fully validated runtime/test code head before this documentation-only closure was:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

All thirteen normal PR workflow families completed successfully on that same exact code head. This handoff update is documentation-only and therefore creates a new branch SHA; the new exact head must still complete the normal workflow generation before merge. Do not weaken, skip or reinterpret that requirement.

## Owner-authorized scope

This candidate implements only Save Library runtime authority cutover.

It does not add visible Save Library UI, profile creation/rename UI, historical profile mapping UI, cloud accounts, synchronization, remote transport, gameplay/scoring changes, visual redesign, Smart Back redesign, loading-screen changes, Settings install/update redesign, or a feature release-version assignment.

The purpose is narrow and architectural:

- `careerModeShowdown.saveLibrary` becomes authoritative for active/in-progress Showdown persistence after cutover;
- `careerModeShowdown.activeShowdown` becomes a migration/recovery compatibility slot rather than a normal runtime writer;
- normal gameplay retains the existing synchronous `saveCurrentShowdown()` facade;
- the already-proven migration and raw transaction machinery remains the authority beneath the cutover.

## Implemented runtime architecture

### Lazy cutover boundary

`js/saveLibraryCutover.js` owns the lazy authority transition.

The module is absent from eager production HTML and is loaded only when an explicit relevant user action occurs. It then lazy-loads, as needed:

- `js/saveLibraryFoundation.js`;
- `js/storageTransaction.js`;
- `js/saveLibraryPersistence.js`;
- `js/saveLibraryRuntime.js`.

Start and Continue are the actual migration/activation actions.

Settings and Legacy are intentionally different:

- opening Settings or Legacy on an unmigrated singleton device must remain read-only and must not migrate competition data merely because a data/settings surface was opened;
- on an already-migrated Save Library device, the data tools may load/reactivate Save Library compatibility authority so backup/restore/Legacy can interpret the new canonical state correctly.

This distinction was required by the offline storage-preservation audit and is now permanent behavior.

### Eager Showdown boundary

`js/showdown.js` contains only a small explicit-action capture gate for:

- `#continueCareer`;
- `#startShowdown`;
- `#legacyButton`;
- `#settingsButton`.

The gate lazy-loads `js/saveLibraryCutover.js` and delegates the action. The heavy Save Library stack is not absorbed into `app.js` or eager startup.

New Showdown creation no longer establishes singleton runtime authority. It requires ready Save Library runtime authority and calls the runtime creation boundary so stable identity exists before authoritative persistence.

Creation is promise-deduplicated so rapid repeated Start activation cannot create duplicate logical saves.

### Storage facade

`js/storage.js` remains the sole public raw `localStorage` authority.

Before runtime activation, the historical public current-storage-key contract remains the existing three keys:

1. `careerModeShowdown.activeShowdown`;
2. `careerModeShowdown.legacyShowdowns`;
3. `careerModeShowdown.preferences`.

The dedicated four-slot migration/recovery snapshot still includes:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

Normal `saveCurrentShowdown()` no longer writes singleton bytes. It succeeds only when Save Library runtime authority is ready and then routes through that authority.

Pre-cutover destructive compatibility remains intentionally narrow: old singleton reset/delete behavior may remove old bytes when no Save Library exists, but normal gameplay cannot re-create singleton authority.

The shared `cloneForStorage()` compatibility helper remains available because Transfer Challenge uses it to snapshot in-memory state before guarded synchronous mutations. Its accidental removal during cutover was caught by the complete browser journey and corrected before closure.

### Save Library runtime authority

`js/saveLibraryRuntime.js` performs runtime orchestration without direct `localStorage` access.

After activation it overrides the existing persistence facade so callers continue using familiar synchronous functions while the implementation is Save Library-backed.

Important guarantees:

- the singleton must be retired before authority is accepted;
- the runtime records exact owned Save Library raw bytes;
- each normal write rechecks exact authority and rejects stale/cross-tab drift;
- in-memory Showdown `saveId` must match registry `activeSaveId`;
- singleton reappearance after cutover invalidates authority and blocks writes;
- completed Seasons require stable `season_*` identity;
- new Showdowns receive stable `save_*` and role-specific `profile_*` identity before first authoritative write;
- same display names still receive distinct manager-profile identities;
- replacing the active save preserves unrelated profile identity records;
- active-save deletion is distinct from full data reset;
- full reset preserves application preferences;
- runtime transaction failure is fail-closed and does not accept unverified storage as authoritative.

After activation the runtime public key contract reflects the post-cutover authority set:

- `saveLibrary`;
- `legacyShowdowns`;
- `preferences`.

`activeShowdown` remains visible only to migration/recovery transaction machinery, not as a normal active writer.

### Backup compatibility

Candidate A format remains unchanged.

Backup projection is read-only. When Save Library is authoritative and singleton bytes are absent, Candidate A projects the active Save Library Showdown into the existing backup envelope without mutating canonical storage.

If singleton and Save Library bytes coexist ambiguously, or Save Library is unreadable, backup projection does not silently pick an authority. It reports recovery evidence instead.

### Candidate B

Candidate B remains strictly read-only analysis. The runtime cutover did not broaden its authority.

### Candidate C restore compatibility

Candidate C retains the mandatory three-slot strict destructive snapshot boundary:

`captureCareerModeRawRestoreSnapshot()`

The old singleton-format restore path keeps its original transaction call shape and expected three-slot raw state.

On an already-migrated Save Library device, Candidate C additionally captures exact four-slot raw state, guards Save Library bytes, prepares an identity-safe active replacement through the runtime, commits Save Library last, and reactivates runtime authority after a successful restore.

Dual singleton plus Save Library authority is treated as a conflict rather than silently reconciled.

All stale-state, immutable-confirmed-intent, first-write-clean-failure, ownership-scoped rollback and critical-recovery behavior remains intact.

### PWA/offline boundary

The lazy cutover files are part of the verified whole application shell even though they are not eager HTML assets.

`service-worker.js` includes:

- `js/saveLibraryCutover.js`;
- `js/saveLibraryFoundation.js`;
- `js/saveLibraryPersistence.js`;
- `js/saveLibraryRuntime.js`.

Offline/cache operations continue to preserve canonical user data exactly. Opening Settings while offline must not migrate an old singleton merely because the offline UI was inspected.

No application/runtime version label was changed in this candidate.

## Permanent regression coverage added or advanced

The focused Save Library runtime contract suite covers, among other cases:

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

The complete Stability browser audit was also updated to the actual post-cutover authority model:

- corrupt singleton bytes fail closed at Start rather than being silently replaced;
- no Save Library authority is fabricated from corrupt singleton bytes;
- quota failure is injected against `careerModeShowdown.saveLibrary`, not the retired singleton writer;
- retry after quota recovery uses the established race-safe programmatic Start activation pattern;
- rapid Start asserts exactly one logical Save Library entry and zero singleton writes;
- the full Chromebook and mobile journeys exercise league, club, Transfer, Season, reload/history, optional modules, Settings, accessibility and responsive containment under Save Library authority.

`tests/contracts/final-release-hardening.cjs` now permanently locks the corrupt fail-closed and Save Library quota model instead of the superseded singleton replacement choreography.

## Failure and correction ledger

The following failures occurred during implementation and were resolved without weakening existing validation.

### 1. Eager `app.js` cutover violated the protected startup budget

An early implementation put several kilobytes of cutover gate logic into eager `app.js`, which already had only tens of raw bytes of protected headroom.

Correction:

- restore `app.js` to production bytes;
- move cutover loading behind existing explicit asynchronous user boundaries;
- later move the heavier loader into lazy `js/saveLibraryCutover.js`.

Result:

- Static App and Final Polish protected budgets returned green without raising any ceiling.

### 2. Predictive gameplay warm-up accidentally became mutating

An intermediate storage wrapper could activate Save Library during predictive Start/Continue warm-up such as focus/hover.

Correction:

- remove migration from predictive warm-up;
- keep activation on confirmed explicit actions only.

### 3. Candidate C four-slot snapshot initially became mandatory everywhere

The first cutover version required the new four-slot snapshot even in the legacy three-slot Candidate C harness.

Correction:

- three-slot strict snapshot remains mandatory everywhere;
- Save Library snapshot is an additional exact guard only when that authority exists;
- explicit legacy and Save Library transaction branches remain visible in source.

### 4. Candidate C maintenance assertions were formatting-brittle

Source compaction caused a maintenance contract to fail despite equivalent intent-freeze behavior.

Correction:

- retain explicit readable intent-freeze declarations;
- make the source-level transaction-branch assertion formatting-agnostic while keeping behavioral restore tests unchanged.

### 5. Pre-cutover Settings reset compatibility regressed

An intermediate storage facade allowed reset only after Save Library runtime activation, breaking unmigrated Settings reset behavior.

Correction:

- preserve exact pre-cutover singleton reset/delete compatibility when no Save Library exists;
- any state containing Save Library bytes still requires runtime authority or fails closed.

### 6. Settings focus return broke at the cutover gate

The gate temporarily disabled the Settings tile before the modal could record its opener, so Escape could not restore focus.

Correction:

- only Start/Continue use disabled busy-state controls;
- Settings/Legacy retain focusability while the lazy data boundary prepares.

### 7. Opening Settings/Legacy mutated old singleton data

The complete offline audit proved that merely opening Settings migrated the seeded singleton, violating the rule that offline/settings inspection must not alter competition bytes.

Correction:

- Settings/Legacy do not activate migration for an unmigrated singleton;
- already-migrated Save Library devices may load/reactivate compatibility authority for data tools.

### 8. Corrupt singleton behavior was initially interpreted using the old replacement-dialog contract

An older Stability expectation waited for a replacement confirmation. Under the new cutover design, corrupt bytes are explicitly required to fail closed.

Correction:

- advance the browser and permanent hardening contracts to the post-cutover rule;
- preserve corrupt singleton bytes;
- leave `saveLibrary` absent;
- do not fabricate authority or silently overwrite the source bytes.

A short-lived experimental corrupt-replacement path was removed once the authoritative new contract was confirmed.

### 9. Quota fixture still targeted the retired singleton writer

After cutover the old quota test no longer exercised the real authoritative write.

Correction:

- inject quota failure against `careerModeShowdown.saveLibrary`;
- assert no singleton resurrection and no accepted Save Library state after failed write;
- verify a subsequent retry succeeds after storage is restored.

### 10. Quota retry hit a Playwright actionability race

The successful retry navigated fast enough to hide the Start button while Playwright was still waiting on the click target.

Correction:

- use the same page-context `button.click()` pattern already used by rapid activation coverage;
- observe the resulting route/state instead of racing the disappearing button.

No production behavior changed for this correction.

### 11. Transfer Window start failed because `cloneForStorage()` was accidentally removed

This was the final substantive browser regression.

The complete Stability journey reached Transfer Challenge, clicked Start Window and then timed out waiting for End Window Early. Root-cause inspection showed `startTransferWindow()` calls the shared global `cloneForStorage()` before mutating the timer state. The cutover rewrite of `storage.js` had accidentally dropped that production utility.

Correction:

- restore the structured-clone/JSON-fallback compatibility helper;
- retain a lazy compatibility fallback in the cutover module for already-loaded gameplay contexts.

The next exact Stability browser run passed the entire Chromebook and mobile journey, including Transfer phases and draft reload recovery.

### 12. Safe concurrency conflicts while the branch advanced

Multiple repository writes were attempted while another branch actor committed to the same PR branch. GitHub returned `409` conflicts for stale blob SHAs.

Correction:

- no force writes were used;
- each rejected write was treated as safe non-mutation;
- live PR head and exact file content were re-read before proceeding;
- newer branch work was preserved when it already implemented the intended correction.

## Exact validation proof for final runtime code head

Runtime/test code head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

All thirteen normal PR workflow families completed with `success` on that exact SHA:

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

The final Stability Chromium run completed the canonical runtime/offline/browser journey with:

- 70 checkpoints;
- 36 axe accessibility scans;
- successful canonical Stability evidence upload.

Observed Stability proof included:

- corrupt singleton fail-closed behavior;
- Save Library quota rejection and retry;
- rapid Start deduplication with one Save Library entry and zero singleton writes;
- league select/reload/confirmation recovery;
- permanent club assignment;
- Transfer Window, Guess Entry, Signing Entry and Verdicts;
- rapid Transfer draft reload recovery;
- Season Results, Review and Summary;
- double Season confirmation guard;
- completed-showdown reload plus browser Back/Forward recovery;
- Legacy, Statistics, Trophy Room, Rule Book and Settings coverage;
- Chromebook and mobile responsive containment;
- clean runtime/local-asset assertions.

Candidate C contract and browser jobs also completed successfully on the same exact runtime code head.

## Merge/readiness rule after this documentation closure

This handoff update changes only documentation and therefore creates a new PR head after the already-proven runtime code head above.

Before merge:

1. re-read the live PR head;
2. require the normal workflow generation on that exact documentation-closure head to be fully green;
3. re-check raw GitHub PR state is mergeable and clean;
4. re-check `main` has not advanced unexpectedly;
5. do not change production/runtime version labels merely for this cutover;
6. do not continue into visible Save Library/profile UI in PR #51.

If those checks are green, the engineering scope of PR #51 is complete and the only remaining action is the owner-authorized merge/publication workflow.

## Next developer rule

Do not redesign or reopen the cutover architecture if the exact-head checks remain green.

If a future failure appears, classify it against the final architecture above and the exact green `46d3e9d...` runtime reference before making changes. Preserve the migration transaction engine, Candidate C ownership, protected startup budgets, offline exact-byte guarantees, corrupt fail-closed behavior, and the synchronous gameplay persistence facade.
