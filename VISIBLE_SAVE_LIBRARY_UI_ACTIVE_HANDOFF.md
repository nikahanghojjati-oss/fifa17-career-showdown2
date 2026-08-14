# Career Mode Showdown — Visible Save Library UI Post-Merge Continuation Handoff

Last updated: 2026-08-14 ET
Status: production merge complete; exact post-merge proof in progress
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production main at handoff creation: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Documentation continuation branch: `agent/visible-save-library-ui-post-merge-handoff`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Immediate instruction to the next developer

Do not restart planning.

Do not reimplement Save Library identity, persistence, runtime authority or recovery.

Do not begin another product feature until the exact post-merge production proof for PR #53 is complete and recorded.

Your first action must be to fetch live `main` independently. Do not assume `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` is still current merely because it is the production SHA recorded here.

If live `main` is still the PR #53 merge, finish or verify the permanent post-merge workflow proof, especially Stability deployed-site smoke. If `main` advanced, reconstruct what changed before touching this documentation branch or starting new development.

Do not force a stale expected-head operation. Re-fetch exact branch/file heads before every write if another commit appears.

## Exact production boundary completed in this development session

The session began from exact production `main`:

`2ac04b2327710a0aa05959179d1d865c210a7587`

The next dependency-ordered product candidate was implemented as:

Visible Local Profiles / Save Library Core UI

Pull request:

PR #53 — `Expose Local Profiles and Save Library UI`

Exact corrected final PR #53 implementation head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Exact PR #53 merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

PR #53 was merged only after live `main` was re-fetched and remained exactly `2ac04b2327710a0aa05959179d1d865c210a7587`, all 13 normal PR workflow families were green on the exact final head, and the merge used an expected-head guard.

The merge did not assign a new product release version or Service Worker revision.

## Repository authority reconstructed before implementation

The following files were read in the required order before code changes:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`

The source and later authority documents proved that Save Library foundations were already complete even though `00_DEVELOPER_START_HERE.md` still contained stale pre-cutover wording.

That stale bootstrap wording was treated as documentation debt, not as permission to roll back completed Save Library work.

Completed foundations that remain production authority:

Identity foundation PR #46 merge:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

Canonical persistence PR #48 merge:

`d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

Runtime authority cutover PR #51 merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

PR #51 exact substantive implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

PR #51 exact final head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

Previous production proof:

Release Integration Burn-In `31768712755`

Stability Lane `31768712798`

Documentation closure PR #52 merge:

`2ac04b2327710a0aa05959179d1d865c210a7587`

## Scope that PR #53 intentionally implemented

The candidate was bounded as Save Library Core UI.

It exposes the already-proven Save Library foundation safely without creating a second persistence system.

The existing Home Settings entry remains the navigation owner. Its presentation is relabeled to visibly advertise `SAVE LIBRARY` / `LOCAL`, while the existing button ID and route ownership are preserved.

Opening that entry still uses the existing lazy local-data/cutover boundary.

A FIFA 17-inspired Save Library product panel is mounted first inside the existing Settings overlay. Application Settings remain available beneath it. The overlay heading becomes `SAVE LIBRARY & SETTINGS` after the product surface is mounted.

This integration avoided adding a new eager route solely for Save Library and avoided disturbing global Smart Back ownership.

The visible candidate includes:

- empty Save Library state;
- one-save state;
- multi-save state;
- clear active-Save presentation;
- additive New Showdown creation;
- explicit active-Save switching;
- deletion of exactly one Save;
- clear distinction between single-Save deletion and full data reset;
- visible read-only Local Profiles;
- stable identity presentation without exposing opaque IDs as user concepts more than necessary;
- identical visible manager names remaining separate stable identities;
- old singleton compatibility state that remains non-mutating on panel open;
- blocked/read-only fail-closed state when canonical authority cannot be proven;
- keyboard and focus accessibility;
- Chromebook-scale containment;
- phone-scale containment;
- reduced-motion containment;
- Installable Offline App whole-shell inclusion.

## Explicitly deferred scope

Do not treat these as unfinished pieces of PR #53:

- profile rename/edit semantics;
- standalone orphan profile creation outside New Showdown;
- historical manager auto-linking or name-based mapping;
- cloud;
- accounts;
- authentication;
- QR pairing;
- synchronization;
- remote transport;
- device IDs;
- writer IDs;
- distributed revisions;
- tombstones or conflict clocks;
- backup-envelope redesign;
- import-format redesign;
- gameplay or scoring changes;
- Transfer Challenge redesign unrelated to Save Library;
- Statistics redesign unrelated to Save Library;
- Legacy redesign unrelated to Save Library;
- Trophy Room redesign;
- global Smart Back redesign;
- global visual redesign;
- loading-screen redesign;
- music redesign;
- a new release-version assignment.

Profile rename/edit was deliberately deferred because current Showdown records also contain manager display labels. Renaming safely requires an explicit propagation/history-label policy and should be designed as its own bounded candidate instead of being smuggled into a CRUD edit button.

## Runtime behavior added by PR #53

`js/saveLibraryRuntime.js` remains the product mutation authority.

The UI never writes canonical `localStorage` directly.

New runtime consumer operations:

### `getLibrarySnapshot()`

Returns a detached clone only after exact runtime authority verification.

The returned object is not live persistence authority and cannot be mutated by UI code to change canonical state.

### `switchActiveSave(saveId)`

Resolves one stable `save_*` identity.

The current stable identity shape remains `save_` plus 24 lowercase hexadecimal characters.

The switch path primes the selected Showdown's season identity cache, re-verifies exact owned Save Library bytes immediately before commit, mutates only the active registry selection, and changes `currentShowdown` only after successful authoritative commit.

If the transition fails after priming season identity state, the primed cache is cleared so failed uncommitted state cannot contaminate later gameplay persistence.

### `deleteSave(saveId)`

Deletes exactly one Save.

Deleting a non-active Save leaves active ownership unchanged.

Deleting the active Save leaves `activeSaveId` null and `currentShowdown` null rather than silently choosing another Save.

The user must explicitly select a remaining Save.

Stable Local Profiles are retained in this candidate rather than automatically garbage-collected.

### additive `createShowdown(candidate)`

A new Showdown no longer replaces the prior active Save.

The candidate receives stable save/profile identity before authoritative persistence, existing Saves remain, existing profiles remain, and the new Save becomes active.

Confirmed Start still crosses the same lazy Save Library cutover/activation gate.

## Canonical storage authority remains unchanged

Before explicit cutover on an old singleton device, public canonical keys remain:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, public canonical keys remain:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is still only a transitional compatibility/recovery slot after cutover.

PR #53 does not introduce a four-key permanent model.

Post-cutover product operations never recreate singleton active-showdown authority.

`js/storage.js` remains sole public raw browser-storage authority.

## Identity authority remains unchanged

Stable identity prefixes remain:

- `save_*`
- `season_*`
- `profile_*`

Display names remain labels only.

Display-name equality, case normalization or spelling normalization must never become identity authority.

Two visible profiles may have exactly the same display name while remaining distinct identities.

The browser evidence deliberately creates multiple Showdowns in which every visible manager uses the same name and verifies separate profile identities.

## Visible Save Library behavior

New lazy files:

- `js/saveLibraryUI.js`
- `css/saveLibrary.css`

The product layer is fully lazy behind the established Settings/local-data boundary.

`js/saveLibraryUI.js` uses the established exact raw snapshot boundary to classify visible state and delegates mutations to `CareerModeSaveLibraryRuntime`.

It contains no direct `localStorage` access.

Visible modes:

### Empty

No singleton and no Save Library exists.

The panel explains that the first New Showdown creates stable local manager and Save identities.

### Compatibility

An old singleton active Showdown exists and Save Library has not yet been activated.

Opening Save Library does not migrate or rewrite it.

The user may explicitly Continue the existing career, which crosses the already-proven one-time cutover boundary.

### Ready

Canonical Save Library exists and runtime authority has been established.

The panel shows local Save cards, active selection and Local Profiles.

### Blocked

Authority cannot safely be established, including corrupt or dual-authority conditions.

The product states that Save Library is unavailable and that no local data was changed.

Mutation controls are withheld.

Corrupt bytes are preserved.

## Save card information

Current cards surface:

- short stable Save identity hint;
- Showdown name;
- manager matchup;
- season progress / completion state;
- league status;
- club pairing status;
- last-updated/local-save context;
- clear active/local state;
- Continue for active Save;
- Make Active for non-active Saves;
- Delete This Save action.

Single-Save deletion confirmation explicitly states that other local Saves, Local Profiles, Legacy history and application settings remain.

## Local Profiles presentation

Local Profiles are read-only in this candidate.

The panel explicitly explains:

`Names are labels, not identity keys.`

Profiles show stable identity hints and current Save-reference context.

If a Save is deleted, the associated profiles remain retained rather than being silently destroyed.

Do not add profile garbage collection incidentally in a future UI patch.

## Focus and accessibility ownership

Settings remains the sole modal/focus owner.

The existing Settings overlay continues to own:

- focus trap;
- Escape close behavior;
- opener-focus restoration;
- inert background handling.

PR #53 does not add a competing global Escape handler.

The new Save Library product uses `saveLibraryUIRestoreMutationFocus()` after switch/delete rerenders so focus is restored to a surviving/new control inside `#settingsDialog`, with dialog fallback.

This is necessary because mutation rerenders replace the previously focused button.

The browser audit permanently asserts that focus remains inside Settings after:

- mouse Save switching;
- non-active Save deletion;
- active Save deletion;
- keyboard Save switching.

It also proves Escape still closes through the existing Settings key handler after a mutation rerender.

## Installable Offline App authority

The exact phrase remains:

Installable Offline App

Current whole-shell/runtime revision remains:

`1.3.0-r1`

Previous known-good shell remains:

`1.2.0-r2`

PR #53 added these lazy assets to the complete shell list:

- `css/saveLibrary.css`
- `js/saveLibraryUI.js`

No runtime revision or feature release version was changed.

Service Worker/Cache Storage still own application bytes only, never canonical user data.

## Performance proof

No performance ceiling was increased.

Exact final PR #53 Static App proof on corrected head:

- eager raw: `162781` bytes
- eager gzip: `37415` bytes
- lazy feedback: `4845` bytes

Locked ceilings remain:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

The candidate actually reduced eager startup versus the PR #51 comparison boundary by removing the obsolete destructive replacement prompt/branch while placing new visible Save Library code behind lazy loading.

Never raise these ceilings to make a future feature pass.

## Permanent deterministic evidence added/updated

### `tests/contracts/save-library-product-contracts.cjs`

Protects:

- no raw storage access from visible Save Library UI;
- lazy UI/CSS integration;
- Home Save Library discoverability without a second navigation system;
- exact visible state classification;
- detached read snapshots;
- additive multi-save creation;
- existing Save retention;
- stable profile retention;
- same-name profile identity separation;
- explicit active switching;
- active/non-active deletion semantics;
- no singleton resurrection;
- stale-authority fail-closed behavior;
- focus restoration ownership after mutation rerenders;
- offline shell inclusion;
- phone/reduced-motion presentation contracts.

The contract is wired into the canonical `tests/support/run-contract-suite.cjs` runner.

### `tests/contracts/final-release-hardening.cjs`

The obsolete assertion that New Showdown must use a destructive active-save replacement prompt was retired.

It now protects the stronger additive Save Library invariant while retaining corrupt-singleton fail-closed evidence.

### `tests/browser/save-library-ui-audit.cjs`

Protects:

- old singleton opening remains byte-for-byte non-mutating;
- corrupt Save Library remains byte-preserved and visibly blocked;
- empty state;
- creation of three local Saves through user UI;
- six distinct Local Profiles with identical visible manager names;
- exactly one active Save when active ownership exists;
- active switching;
- reload persistence of active selection;
- non-active Save deletion preserving active ownership;
- active Save deletion leaving no implicit replacement;
- profile retention after Save deletion;
- keyboard switch activation;
- mutation-focus containment;
- Escape ownership after rerender;
- Chromebook `1366 × 768` containment;
- mobile `390 × 844` containment;
- reduced-motion mobile behavior;
- screenshot/JSON evidence.

The audit was added to the existing Stability family rather than creating a new workflow family.

It is also included in permanent post-merge deployed-site smoke.

Original Stability timeouts remain unchanged:

- Chromium: 18 minutes
- deployed-site smoke: 36 minutes

## Exact PR #53 pre-merge proof

The first implementation head used for broad CI was:

`2899c020c717d9fa8b59f4c687432d7b0d1b566f`

Twelve of 13 normal workflow families passed on that head.

Stability run:

`31770735442`

failed only in its new Save Library browser journey, job:

`94676002232`

The corrected final implementation head became:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

On this exact head all 13 normal PR workflow families passed.

Important final-head runs include:

- Stability: `31771109094` — success
- Candidate C Atomic Restore: `31771109180` — success
- Static App: `31771109225` — success

The successful Stability Chromium job explicitly reported that compatibility remained non-mutating, corrupt authority failed closed, additive Saves switched/reloaded/deleted safely, mutation rerenders retained keyboard focus inside Settings, equal visible names remained separate identities, and Chromebook/mobile containment passed.

The PR Stability run uploaded four Save Library/Stability evidence files.

Artifact ID:

`9208187823`

## Failure and correction ledger

### 1. Incorrect stable Save ID length assumption

Initial new runtime lookup validation assumed `save_*` carried 32 hexadecimal characters.

Current identity foundation actually emits 24 lowercase hexadecimal characters after `save_`.

Correction:

The guard was changed to the current foundation contract before UI publication, and permanent product contracts exercise current stable IDs.

### 2. Failed-transition season identity cache contamination risk

Initial switch/create work primed `seasonIdentityByRound` before the final transaction but did not clear it if the final transition failed.

Risk:

A failed, uncommitted target could leave season-ID cache state associated with the wrong Showdown.

Correction:

Switch and additive-create paths now clear primed season identity cache on post-prime validation/commit failure. `currentShowdown` is changed only after successful switch commit.

### 3. Wrong test helper style

The first browser audit draft used `assert.poll`, which is not available in this repository's plain Node/Playwright audit style.

Correction:

It was replaced with `page.waitForFunction` plus explicit Node assertions before authoritative proof.

### 4. Temporary workflow-timeout increase

While wiring browser evidence, Stability timeouts were temporarily increased.

Correction:

This was recognized as unnecessary gate relaxation and immediately reverted. Existing 18/36 minute limits remain unchanged.

### 5. Local clone unavailable in execution container

A local Git clone attempt could not resolve external GitHub hosts from the execution container.

Correction:

No conclusions were drawn from the environment failure. Exact GitHub Actions heads became the executable proof authority.

### 6. Save Library mutation focus regression

The first Chromium Stability execution on implementation head `2899c020c717d9fa8b59f4c687432d7b0d1b566f` timed out after switching the active Save and pressing Escape because `#settingsOverlay` stayed open.

Root cause:

`MAKE ACTIVE` correctly committed and rerendered the Save Library, but the rerender removed the button that owned browser focus. Focus fell outside the Settings overlay. The established Escape key handler intentionally belongs to the overlay, so the next Escape event did not bubble through Settings.

This was an accessibility/focus-lifecycle defect in the new product layer, not a persistence, exact-byte or transaction defect.

Correction:

No global Escape handler was added. The product now restores focus inside `#settingsDialog` after mutation rerenders. Browser evidence asserts this after every relevant mouse/keyboard mutation before relying on Escape or Tab behavior.

The corrected final head passed the full Stability browser journey.

## Exact merge process

After all 13 normal PR workflow families passed on `2021a0a2eaed26f0aca6639278de82afe2a28d6d`, PR #53 was marked ready.

Live `main` was fetched again immediately before merge and remained:

`2ac04b2327710a0aa05959179d1d865c210a7587`

The merge used the exact expected PR head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Merge result:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

Live `main` was then re-fetched and confirmed to equal that merge SHA.

## Post-merge proof status at this handoff revision

Post-merge workflow discovery initially appeared empty when using `fetch_commit_workflow_runs` because that connector wrapper filters to pull-request-triggered runs.

This was a tooling/query-boundary issue, not an absence of push CI.

The exact push workflow matrix was then retrieved through the repository Actions API using the merge SHA.

Fifteen push-associated workflow runs were returned, including the 14 permanent push families and the repository/platform publication activity.

### Release Integration Burn-In

Run:

`31771269732`

Status:

SUCCESS

Both stateful integration passes succeeded:

- `integration-burnin-pass-1` — success
- `integration-burnin-pass-2` — success

Both evidence uploads succeeded.

This is the permanent post-merge integration authority for the PR #53 merge candidate.

### Candidate C Atomic Restore

Run:

`31771269835`

At the last detailed job inspection:

- `restore-contracts` completed success;
- the authoritative Candidate C browser audit execution completed success;
- Candidate C evidence upload completed success;
- cleanup and Complete job steps completed success.

The workflow API briefly continued to report the outer job/run as in-progress due to status propagation lag even though every executable and completion step was green.

Re-fetch the final run object before claiming closure, but there is no reproduced Candidate C failure at this boundary.

### Stability Lane

Run:

`31771269740`

At the last detailed job inspection:

- `stability-contracts` completed success;
- `chromium-stability` completed its full canonical runtime, Save Library, offline lifecycle and complete integration journey successfully;
- canonical Stability evidence upload was finishing;
- deployed-site-smoke had not yet started/appeared because it depends on completion of Chromium Stability.

The full Chromium product journey therefore passed on exact merged `main` before this handoff was written.

The remaining proof hinge is deployed production.

Do not call PR #53 production-proof closure complete until Stability `deployed-site-smoke` has appeared and succeeded against GitHub Pages.

The deployed job is expected to prove the exact live application through:

- Pages deployment/runtime-byte verification;
- runtime-error provenance;
- Home visual audit;
- crop-safe licensed football-photo audit;
- Candidate A backup export;
- Candidate B import analysis;
- Candidate C atomic restore/recovery;
- Installable Offline App/offline boundary;
- Save Library UI browser audit against deployed Pages;
- complete deployed-site journey.

### Other post-merge specialist families

Multiple specialist push workflows were already observed completed successfully, including:

- Settings Workstream `31771269739`;
- Final Polish `31771269691`;
- V1 Visual Immersion `31771269754`;
- League Confirmation `31771269755`;
- Season Review `31771269679`;
- Transfer Workstream `31771269730`.

Before final closure, query all workflow runs for exact merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` and verify that every permanent push family concluded `success` rather than inferring full matrix health from this partial list.

## Next developer checklist

If this handoff is used before documentation closure is merged, perform these actions in order:

1. Fetch live default branch and exact current `main` SHA.
2. If `main` is no longer `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`, inspect every newer commit/PR before continuing.
3. Inspect open PRs and avoid reviving stale draft PR #37 or #35 as authority.
4. Fetch Stability run `31771269740`.
5. Verify `chromium-stability` completed success.
6. Verify `deployed-site-smoke` exists and completed success.
7. Inspect deployed-site-smoke steps/logs and confirm the deployed Save Library UI audit itself passed, not merely the outer job.
8. Fetch Release Integration Burn-In `31771269732` and confirm final run conclusion remains `success` with both integration passes green.
9. Fetch Candidate C run `31771269835` and confirm final outer conclusion is `success`.
10. Fetch the entire push run list for exact merge SHA and verify every permanent workflow family is green.
11. If any failure exists, reproduce/classify it. Do not weaken tests, timeouts, exact-byte checks, rollback, Candidate C or performance ceilings.
12. If all post-merge proof is green, update this handoff with exact final statuses and any deployed artifact/run IDs.
13. Update current authority Markdown files in a documentation-only closure change. Do not modify runtime source, tests, workflows, Service Worker bytes, gameplay, scoring, visual assets or performance limits merely for closure.
14. Open a documentation-only closure PR from a branch based on current exact `main`, or safely rebase/cherry-pick this documentation branch only after verifying `main` has not advanced incompatibly.
15. Merge documentation closure only with exact-head safety.
16. Stop at a clean boundary. Do not auto-start profile editing, cloud/synchronization or another roadmap candidate without reconstructing current `NEXT_TASK.md` and owner direction.

## Documentation branch warning

This file is being maintained on:

`agent/visible-save-library-ui-post-merge-handoff`

That branch was created from exact PR #53 merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

Its purpose is to preserve full continuation context without modifying the production runtime while deployed proof is still completing.

Do not blindly merge the branch later if `main` has moved.

Re-fetch current `main`, compare the documentation branch, and use expected-head-safe writes/merge operations.

## Core architecture locks for all future work

Never weaken or casually replace:

- exact Save Library byte ownership;
- stale/cross-tab drift rejection;
- fail-closed runtime behavior;
- singleton reappearance rejection after cutover;
- stable opaque save/profile/season identities;
- Candidate C strict raw snapshot authority;
- transaction-owned mutation;
- ownership-scoped reverse rollback;
- anti-clobber verification;
- exact post-write verification;
- byte-for-byte rollback verification;
- corrupt-byte preservation;
- retry/idempotence;
- critical recovery when authority cannot be established;
- lazy Save Library activation boundaries;
- non-mutating predictive warm-up;
- non-mutating Settings/Legacy open on unmigrated singleton devices;
- PWA whole-shell exactness;
- existing gameplay/scoring rules;
- locked startup/performance ceilings.

The recovery architecture is deliberately future-facing infrastructure for eventual multi-device evolution. Do not simplify it because the present product remains local-first.

## Permanent gameplay rules remain unchanged

Exactly two managers.

Showdown lengths:

- 1
- 3
- 5
- 10

Both managers use the same selected league.

Managers use different permanent clubs.

Scoring:

- Champions League: +5
- League: +3
- Domestic Cup: +1
- 100 League Points and/or 100 League Goals: combined maximum +1
- Top Scorer and/or Top Assist: combined maximum +1

Maximum Season score: 11.

Equal non-zero scores are a Draw.

Only 0–0 invokes league position, then league points.

Do not alter these while working on Save Library follow-up or documentation closure.

## Clean continuation boundary

Runtime/product implementation for the first visible Save Library candidate is merged.

The implementation has full exact-head PR proof.

The exact merged runtime has already passed post-merge Release Integration Burn-In and merged-main Chromium Stability product journeys.

The only unsealed boundary at this handoff revision is final deployed GitHub Pages proof plus documentation-only production-proof closure.

Finish that boundary first.

Then reconstruct the next dependency from live repository authority and explicit owner direction.

Do not use historical roadmap prose, stale branches or external AI reviews as implementation authority over current source and current handoff files.
