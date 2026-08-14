# Career Mode Showdown — Visible Save Library UI Active Handoff

Last updated: 2026-08-14 ET
Status: active implementation
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/visible-save-library-ui`
Exact base `main`: `2ac04b2327710a0aa05959179d1d865c210a7587`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Owner instruction

Begin the next dependency-ordered phase: Visible Local Profiles / Save Library product UI. Reconstruct current repository authority first, preserve all proven Save Library identity, persistence, runtime, recovery, Candidate A/B/C, PWA/offline, gameplay, scoring, navigation, accessibility, visual and performance contracts, then implement the smallest coherent visible product candidate. Do not begin cloud/accounts/synchronization, historical manager auto-linking, backup/import redesign, distributed revision/device/writer identity work, gameplay/scoring redesign or a new release-version assignment.

## Repository authority reconstructed

Live `main` was independently fetched and is exactly `2ac04b2327710a0aa05959179d1d865c210a7587`, matching the handoff boundary. No newer production commit exists after the handoff.

Open pull requests at session start are only historical draft PR #37 and PR #35. Current authority documents explicitly warn that PR #37 is untrusted historical work and must not be revived. This branch is based only on exact live `main`.

Required authority reads completed:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`

`00_DEVELOPER_START_HERE.md` contains stale pre-cutover prose claiming Save Library persistence is still future work. This conflicts with later authority and current source. The later current handoff, project state, next task and current implementation prove PR #48 canonical persistence and PR #51 runtime cutover are complete. The stale bootstrap text is documentation debt, not implementation authority.

The public GitHub Pages URL was also queried through the available web fetch path, but that environment returned a cache miss and no indexed result. Current deployed behavior remains grounded by exact source plus the post-merge deployed-site smoke recorded in the authority documents; no claim of a fresh independent visual browser observation is made yet.

## Completed technical foundation that must not be reimplemented

Identity foundation PR #46 merge: `b76baf3be8107a57c5898f691d5178ae1d8a8547`

Canonical persistence PR #48 merge: `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

Runtime authority cutover PR #51 merge: `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

Exact PR #51 substantive implementation head: `46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Exact PR #51 final head: `bda19f8181598d880c7b1eb7f4e9446464d015e6`

Post-merge Burn-In run `31768712755` and Stability run `31768712798` succeeded, including deployed-site smoke.

## Current source findings

The production Home menu has Continue Career and New Showdown but no Save Library route.

`js/saveLibraryCutover.js` remains lazy. Start and Continue may activate/migrate. Settings and Legacy use the non-mutating data-tool preparation path on unmigrated singleton devices.

`js/saveLibraryRuntime.js` already owns exact-byte runtime authority and intentionally blocks new Showdown replacement when non-active Save Library entries exist, with the explicit error that visible Save Library workflow is future work. Therefore the visible phase must extend this established runtime API rather than create a second UI-owned persistence system.

The Save Library schema already supports multiple `saves`, one `activeSaveId`, and stable `profiles`. Stable identity prefixes remain `save_*`, `profile_*` and `season_*`. Display-name equality is never identity authority.

`js/screens.js` owns navigation/history/Smart Back and route focus. New visible routing must integrate there rather than bypass it.

`js/optionalModules.js` provides existing lazy script/style infrastructure, so the new UI should remain lazy to protect the tight eager gzip ceiling.

## Bounded first product candidate

Candidate name: Save Library Core UI.

Included:

- dedicated FIFA 17-consistent Save Library entry from Home;
- dedicated Save Library screen integrated with Smart Back and route-focus accessibility;
- empty, one-save and multi-save states;
- clear active-save state;
- save cards surfacing Showdown name, managers, league/club progress, season progress/status and last-updated context when present;
- safe active-save switching through Save Library runtime authority;
- deletion of exactly one Save, visibly distinct from full Settings reset;
- New Showdown becomes additive under migrated Save Library authority: existing Saves are retained and the newly created Showdown becomes active;
- visible Local Profiles panel derived from stable registry identities, including distinct presentation when visible names are identical;
- keyboard/touch usable controls and responsive containment;
- fail-closed UI when Save Library authority cannot be established;
- no direct localStorage access from UI;
- permanent deterministic contracts plus browser evidence.

Explicitly deferred from this candidate:

- profile rename/edit semantics;
- standalone orphan profile creation outside New Showdown;
- historical manager-profile mapping;
- cloud/accounts/authentication/QR/synchronization/remote transport;
- deviceId/writerId/distributed revision/conflict architecture;
- backup/import format redesign;
- gameplay/scoring changes;
- global visual redesign;
- release-version assignment.

Profile editing is deferred because current Showdown records also contain manager display labels. Renaming safely requires an explicit propagation/history-label policy and should not be introduced incidentally while exposing the registry.

## Runtime design direction

Extend the existing Save Library runtime with narrow consumer APIs that continue to use exact owned-byte authority and transaction commits:

- non-mutating cloned library snapshot for UI rendering;
- switch active save by stable `saveId`;
- delete one save by stable `saveId`;
- additive new Showdown creation retaining existing Save entries and profiles.

Switching or deleting must recheck exact authority immediately before commit and never recreate singleton active storage.

Deleting the active Save will leave `activeSaveId` null rather than silently choosing another Save. Other saves remain available in the library until the user explicitly selects one. Deleting a non-active Save leaves the active Save unchanged. Profiles are retained in this first candidate rather than garbage-collected automatically, avoiding accidental identity/history destruction.

Opening Save Library on an unmigrated singleton device must remain non-mutating. It should explain that the existing career remains available through Continue Career; confirmed Continue/Start remains the migration boundary.

## Performance and PWA locks

Do not increase any ceiling. Proven PR #51 implementation values: eager raw 162935 bytes, eager gzip 37475 bytes, lazy feedback 4845 bytes. Ceilings: eager raw <=165000, eager gzip <=37500, Reus startup portrait <=95000, combined first-party startup <=260000.

New Save Library UI JavaScript/CSS should load lazily. Whole-shell offline authority must include any new runtime assets without changing the shell label unless separately authorized.

## Validation planned

Add contracts for additive create, switch, deletion, profile identity preservation, no singleton resurrection, and lazy route integration. Add browser evidence for empty/one/multi-save UI, same-name distinct profiles, switch/reload, delete/reload, keyboard focus, phone/Chromebook/desktop containment, and fail-closed/unmigrated behavior. Run the existing canonical suites and exact PR workflows without weakening tests or raising budgets.

## Failure ledger

No implementation failure yet in this candidate.
