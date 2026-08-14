# Career Mode Showdown — Local Profiles / Save Library Handoff

Last updated: 2026-08-14 ET
Status: identity, canonical persistence, runtime authority and visible product UI complete, merged and production-proven
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Current production runtime merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned

## Completed dependency chain

The Local Profiles / Save Library chain now has four completed production layers:

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

Do not describe visible Save Library UI as future work. It is now shipped and production-proven.

Do not reimplement any of these layers in later work.

## PR #53 visible product boundary

Exact final PR head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Exact merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

The existing Home Settings/local-data route remains the navigation owner and is visibly presented as `LOCAL / SAVE LIBRARY`.

The FIFA 17-inspired Save Library product is lazy and mounts first inside the existing Settings overlay. It intentionally does not create a separate storage owner, new eager route or competing Smart Back/modal system.

Current visible behavior includes:

- empty, one-save and multi-save states;
- clear active-Save presentation;
- additive New Showdown creation;
- explicit active-Save switching;
- deletion of one Save at a time;
- no implicit replacement after deleting the active Save;
- full-reset semantics remain separate;
- read-only Local Profiles;
- same visible manager names remain distinct identities;
- retained Local Profiles after single-Save deletion;
- compatibility state for unmigrated singleton devices;
- blocked fail-closed state for corrupt/dual/unverifiable authority;
- keyboard/focus lifecycle integrated with existing Settings ownership;
- phone, Chromebook and reduced-motion containment;
- Installable Offline App whole-shell inclusion.

## Identity authority

Stable identity prefixes remain:

- `save_*`
- `season_*`
- `profile_*`

Current generation uses 24 lowercase hexadecimal characters after each prefix.

Display names are labels only.

Never use display-name equality, normalized spelling or case folding as identity authority.

Two Local Profiles may legitimately have exactly the same visible name.

Never auto-link historical managers solely because names match.

Historical ambiguous mapping remains a separate future product problem unless explicitly authorized.

## Profile semantics in the shipped candidate

The visible UI exposes profile identity and display labels read-only.

A profile may show how many current Saves refer to it through stable identity.

Deleting a Save does not automatically garbage-collect profiles in this candidate.

This was intentional: identity/history destruction should not be smuggled into a single-Save deletion operation.

Profile rename/edit was intentionally deferred.

Because Showdown records also contain manager display labels, a future rename feature must define whether and how current Save labels, completed seasons, Legacy records or other historical presentation are propagated. Identity must remain stable regardless of display-name changes.

Do not add a generic edit textbox before those semantics are explicitly designed and authorized.

## Canonical persistence authority

Before explicit Save Library activation on an old singleton device, public canonical keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, public canonical keys remain exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a permanent fourth key after cutover. It is only a transitional migration/recovery compatibility slot.

`js/storage.js` remains sole public raw `localStorage` authority.

The visible Save Library UI contains no direct canonical `localStorage` access.

## Runtime authority

`js/saveLibraryCutover.js` stays lazy.

Only confirmed Start/Continue may trigger old-singleton migration/activation.

Opening Save Library/Settings or Legacy on an old singleton device is non-mutating.

`js/saveLibraryRuntime.js` remains exact runtime authority.

The visible product consumes narrow runtime APIs for:

- detached library snapshots;
- additive creation;
- active switching;
- single-Save deletion.

Those operations preserve the existing exact-byte authority boundary and transaction layer.

Runtime continues to fail closed on stale/cross-tab drift, singleton reappearance, critical-recovery lock, exact-byte mismatch or transaction failure.

Do not add a second UI-owned persistence path.

## Additive creation semantics

New Showdown creation is no longer a destructive active-Save replacement model.

The new Showdown receives stable `save_*` and manager `profile_*` identity before authoritative persistence.

Existing Save entries remain.

Existing Local Profiles remain.

The newly created Save becomes active.

Post-cutover creation never recreates singleton active-showdown authority.

## Active switching semantics

Switching resolves exactly one stable `save_*` entry.

The selected Showdown's season-identity cache is prepared, exact authority is rechecked immediately before commit, and `currentShowdown` changes only after successful authoritative commit.

If a post-prime transition fails, the primed season cache is cleared.

The UI rerender restores focus inside `#settingsDialog`, preserving the established Settings Escape/Tab behavior.

## Single-Save deletion semantics

Deletion resolves one stable `save_*` identity.

Deleting a non-active Save leaves `activeSaveId` unchanged.

Deleting the active Save sets `activeSaveId` to null and clears `currentShowdown` rather than automatically activating another Save.

The user must explicitly choose a remaining Save.

The UI confirmation explicitly distinguishes this from full data reset and states that other Saves, Local Profiles, Legacy history and app settings remain.

## Recovery authority remains unchanged

Candidate A remains a non-mutating export.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()`.

Preserve exact raw snapshots, last-moment preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

The defensive architecture is intentional future-facing infrastructure for eventual multi-device/private-room evolution.

## Installable Offline App

Whole-shell label remains `1.3.0-r1`.

Previous known-good whole shell remains `1.2.0-r2`.

PR #53 added:

- `js/saveLibraryUI.js`
- `css/saveLibrary.css`

to the verified complete shell without changing the revision.

Service Worker/Cache Storage own application bytes only, never user-data authority.

## Performance authority

Exact final PR #53 measurements:

- eager raw `162781` bytes;
- eager gzip `37415` bytes;
- lazy feedback `4845` bytes;
- Reus startup portrait `88492` bytes;
- combined first-party startup `251273` bytes.

Locked ceilings remain unchanged. The eager gzip ceiling remains particularly tight.

Do not raise limits to make later work pass. Preserve lazy boundaries when a future candidate does not need eager startup ownership.

## Permanent evidence

The production chain is protected by:

- identity foundation contracts;
- Save Library persistence contracts;
- Save Library runtime contracts;
- `tests/contracts/save-library-product-contracts.cjs`;
- additive final-release hardening invariant;
- `tests/browser/save-library-ui-audit.cjs`;
- existing Settings accessibility/focus tests;
- Stability canonical runtime/browser lane;
- permanent deployed-site Save Library audit;
- Candidate A/B/C tests;
- offline lifecycle and exact-byte shell proof.

The Save Library browser audit proves old singleton non-mutation, corrupt-state fail-closed preservation, empty/multi-save presentation, three UI-created Saves, six distinct same-name profiles, switch/reload, scoped delete behavior, focus containment, Escape ownership, keyboard switching, Chromebook containment, mobile containment and reduced motion.

## Exact proof

All 13 normal PR workflow families passed exact final head `2021a0a2eaed26f0aca6639278de82afe2a28d6d`.

PR Stability `31771109094` — success.
Candidate C `31771109180` — success.
Static App `31771109225` — success.

All 14 permanent push workflow families passed exact merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

Release Integration Burn-In `31771269732` — success with both complete integration passes.

Post-merge Stability `31771269740` — success.

Deployed-site-smoke job `94677863736` verified 71 `1.3.0-r1` runtime files byte-for-byte and passed runtime provenance, Home, Save Library, football-photo, Candidate A/B/C, Installable Offline App/offline and full deployed journey proof.

The full deployed journey recorded 70 checkpoints and 36 accessibility scans.

## Future boundary

This Local Profiles / Save Library phase is complete.

Do not automatically begin profile editing, historical mapping, cloud, accounts, authentication, QR pairing, sync, remote transport, device/writer IDs, distributed revisions or backup/import redesign.

Those remain separately bounded future dependencies requiring current repository reconstruction and explicit owner authorization.
