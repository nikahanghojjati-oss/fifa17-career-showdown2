# Career Mode Showdown — Visible Save Library UI Production-Proof Continuation Handoff

Last updated: 2026-08-14 ET
Status: PR #53 runtime/product work merged and exact post-merge production proof complete; documentation closure remains isolated in draft PR #54
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production main proven by this handoff: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Documentation continuation branch: `agent/visible-save-library-ui-post-merge-handoff`
Documentation closure PR: #54 `Record visible Save Library production proof`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

=====================================================================
IMMEDIATE INSTRUCTION TO THE NEXT DEVELOPER
=====================================================================

Do not restart planning.

Do not reimplement Save Library identity, canonical persistence, runtime authority, migration, backup/import or recovery.

Do not begin cloud/accounts/synchronization.

Do not begin profile rename/edit automatically.

Do not infer the next feature from old roadmaps or external reviews.

First fetch live `main` independently.

This handoff proves production main `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`, but that SHA must be treated as historical evidence, not an assumption about the future branch head.

If live `main` advanced after this handoff, inspect every newer commit and open PR before touching PR #54 or beginning another candidate.

Never force a stale expected-head operation.

The correct immediate continuation, if `main` is still the proven SHA, is documentation-only closure of the completed Visible Save Library candidate. Keep that closure separate from new product development.

=====================================================================
EXACT PRODUCTION BOUNDARY COMPLETED
=====================================================================

The development session began from exact production main:

`2ac04b2327710a0aa05959179d1d865c210a7587`

The bounded next product candidate was:

Visible Local Profiles / Save Library Core UI

Implementation pull request:

PR #53 — `Expose Local Profiles and Save Library UI`

Exact corrected final PR #53 implementation head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Exact PR #53 merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

PR #53 was merged only after:

- live `main` was re-fetched and still exactly matched the intended base;
- all 13 normal PR workflow families passed on the exact final head;
- the merge used an expected-head guard;
- no test was weakened;
- no timeout or performance ceiling was raised;
- no release version was assigned.

Live `main` was re-fetched after merge and confirmed to equal the PR #53 merge SHA.

=====================================================================
REPOSITORY AUTHORITY RECONSTRUCTED BEFORE IMPLEMENTATION
=====================================================================

The following files were read in the required order before code changes:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`

Current source plus later authority documents proved that Save Library foundations were already complete even though `00_DEVELOPER_START_HERE.md` still contained stale pre-cutover wording.

That stale bootstrap wording was treated as documentation debt, not as authority to roll back working systems.

Completed dependency layers that remain production foundations:

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

Previous Save Library runtime-cutover production proof:

Release Integration Burn-In `31768712755`

Stability Lane `31768712798`

Documentation closure PR #52 merge:

`2ac04b2327710a0aa05959179d1d865c210a7587`

=====================================================================
BOUNDED PRODUCT DECISION FOR PR #53
=====================================================================

Candidate name:

Save Library Core UI

The established Save Library foundation was exposed as a product layer rather than reimplemented.

The existing Home Settings entry remains the navigation owner.

Its presentation is relabeled so the user can visibly discover `SAVE LIBRARY` / `LOCAL`, while its existing button ID and routing ownership remain intact.

Opening it still crosses the existing lazy local-data/cutover boundary.

A FIFA 17-inspired Save Library panel is mounted first inside the existing Settings overlay.

Application Settings remain available beneath it.

The overlay heading becomes:

`SAVE LIBRARY & SETTINGS`

This avoided adding a new eager route solely for Save Library and avoided unnecessary changes to global Smart Back ownership.

Included product behavior:

- empty Save Library state;
- one-save state;
- multi-save state;
- clear active-Save presentation;
- additive New Showdown creation;
- explicit active-Save switching;
- deletion of exactly one Save;
- clear distinction between single-Save deletion and full reset;
- visible read-only Local Profiles;
- identical visible manager names retaining separate stable identities;
- non-mutating old-singleton compatibility state;
- blocked/read-only fail-closed state when authority cannot be proven;
- keyboard and focus accessibility;
- Chromebook containment;
- phone containment;
- reduced-motion containment;
- Installable Offline App shell inclusion.

=====================================================================
EXPLICITLY DEFERRED SCOPE
=====================================================================

The following are not unfinished pieces of PR #53:

- profile rename/edit semantics;
- standalone orphan profile creation outside New Showdown;
- historical manager auto-linking;
- name-normalization identity mapping;
- cloud;
- accounts;
- authentication;
- QR pairing;
- synchronization;
- remote transport;
- network multiplayer;
- device IDs;
- writer IDs;
- distributed revisions;
- tombstones or conflict clocks;
- backup-envelope redesign;
- import-format redesign;
- gameplay/scoring changes;
- Transfer Challenge redesign unrelated to Save Library;
- Statistics redesign unrelated to Save Library;
- Legacy redesign unrelated to Save Library;
- Trophy Room redesign;
- global Smart Back redesign;
- global visual redesign;
- loading-screen redesign;
- music redesign;
- a new release-version assignment.

Profile rename/edit was deliberately deferred because current Showdown records also contain manager display labels.

Renaming safely requires an explicit propagation/history-label policy and should be designed as its own bounded dependency rather than introduced casually as a CRUD control.

=====================================================================
RUNTIME BEHAVIOR ADDED BY PR #53
=====================================================================

`js/saveLibraryRuntime.js` remains the mutation authority.

The UI does not write canonical browser storage directly.

New narrow runtime consumer APIs:

### `getLibrarySnapshot()`

Returns a detached clone only after exact runtime authority verification.

The clone cannot be mutated by UI code to alter canonical state.

### `switchActiveSave(saveId)`

Resolves one stable `save_*` identity.

The current identity foundation emits 24 lowercase hexadecimal characters after the `save_` prefix.

The switch path:

- resolves the requested stable Save;
- primes the target Showdown's season identity cache;
- re-verifies exact owned Save Library bytes immediately before commit;
- changes registry active selection only through authoritative runtime commit;
- sets `currentShowdown` only after successful commit;
- clears primed season cache if a post-prime validation or commit fails.

### `deleteSave(saveId)`

Deletes exactly one stable Save.

Deleting a non-active Save leaves active ownership unchanged.

Deleting the active Save leaves:

- `activeSaveId = null`
- `currentShowdown = null`

It does not silently choose another Save.

The user explicitly selects a remaining Save.

Stable Local Profiles remain retained in this candidate rather than being automatically garbage-collected.

### additive `createShowdown(candidate)`

A new Showdown no longer replaces the previous active Save.

The new candidate receives stable save/profile identity before authoritative persistence.

Existing Saves remain.

Existing Local Profiles remain.

The newly created Save becomes active.

Confirmed Start still crosses the same lazy Save Library cutover/activation gate.

All of these product mutations continue to fail closed on:

- exact-byte drift;
- stale/cross-tab authority changes;
- singleton reappearance after cutover;
- critical-recovery lock;
- transaction failure.

Post-cutover operations never recreate singleton active-showdown authority.

=====================================================================
CANONICAL STORAGE AUTHORITY REMAINS UNCHANGED
=====================================================================

Before explicit Save Library activation on an old singleton device, canonical public keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, canonical public keys remain exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` remains only a transitional migration/recovery compatibility slot after cutover.

PR #53 does not introduce a four-key permanent model.

`js/storage.js` remains sole public raw `localStorage` authority.

=====================================================================
IDENTITY AUTHORITY REMAINS UNCHANGED
=====================================================================

Stable identity prefixes remain:

- `save_*`
- `season_*`
- `profile_*`

Display names remain labels only.

Display-name equality is not identity authority.

Case-normalized or spelling-normalized equality is not identity authority.

Two Local Profiles may use the exact same visible name while remaining separate identities.

The permanent browser evidence deliberately creates multiple Showdowns in which every visible manager uses the same name and verifies separate stable profile identities.

=====================================================================
VISIBLE SAVE LIBRARY PRODUCT LAYER
=====================================================================

New lazy product files:

- `js/saveLibraryUI.js`
- `css/saveLibrary.css`

The product layer stays behind the established lazy Settings/local-data boundary.

`js/saveLibraryUI.js` contains no direct `localStorage` access.

It uses the established exact raw snapshot boundary to classify state and delegates all mutations to `CareerModeSaveLibraryRuntime`.

Visible modes:

### Empty

No singleton and no Save Library exists.

The panel explains that the first New Showdown creates stable local manager and Save identities.

### Compatibility

An old singleton active Showdown exists and Save Library has not been activated.

Opening Save Library does not migrate or rewrite it.

The user may explicitly Continue the existing career, which crosses the already-proven one-time cutover boundary.

### Ready

Canonical Save Library exists and runtime authority is established.

The panel shows local Save cards, active selection and Local Profiles.

### Blocked

Authority cannot safely be established, including corrupt or dual-authority conditions.

The UI states that Save Library is unavailable and that no local data was changed.

Mutation controls are withheld.

Corrupt bytes remain preserved.

=====================================================================
SAVE CARD INFORMATION
=====================================================================

Current cards surface:

- short stable Save identity hint;
- Showdown name;
- manager matchup;
- season progress / completion state;
- league status;
- club pairing status;
- last-updated/local state context;
- active/local state;
- Continue action for active Save;
- Make Active for non-active Saves;
- Delete This Save action.

Single-Save deletion confirmation explicitly states that other local Saves, Local Profiles, Legacy history and application settings remain.

=====================================================================
LOCAL PROFILES PRESENTATION
=====================================================================

Local Profiles are read-only in this candidate.

The panel explicitly explains:

`Names are labels, not identity keys.`

Profiles show stable identity hints and current Save-reference context.

Deleting a Save does not silently delete the associated Local Profiles.

Do not add profile garbage collection incidentally in a future patch.

=====================================================================
FOCUS AND ACCESSIBILITY OWNERSHIP
=====================================================================

Settings remains the sole modal/focus owner.

The existing Settings overlay continues to own:

- focus trap;
- Escape close behavior;
- opener-focus restoration;
- inert background handling.

PR #53 does not add a competing global Escape handler.

The new Save Library product uses `saveLibraryUIRestoreMutationFocus()` after switch/delete rerenders.

That function restores focus to a surviving/new primary Save Library control inside `#settingsDialog`, with dialog fallback.

This is required because mutation rerenders replace the previously focused control.

Permanent browser evidence verifies focus remains inside Settings after:

- mouse Save switching;
- non-active Save deletion;
- active Save deletion;
- keyboard Save switching.

It also proves Escape still closes through the existing Settings key handler after a mutation rerender.

=====================================================================
INSTALLABLE OFFLINE APP AUTHORITY
=====================================================================

The exact phrase remains:

Installable Offline App

Current whole-shell/runtime revision remains:

`1.3.0-r1`

Previous known-good shell remains:

`1.2.0-r2`

PR #53 added these lazy assets to the complete shell list:

- `css/saveLibrary.css`
- `js/saveLibraryUI.js`

No runtime revision or feature version was changed.

Service Worker and Cache Storage continue to own application bytes only, never canonical user data.

=====================================================================
PERFORMANCE PROOF
=====================================================================

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

The candidate reduced eager startup relative to the PR #51 comparison boundary by removing the obsolete destructive replacement branch while placing the new product code behind lazy loading.

Never raise these ceilings to obtain green CI.

=====================================================================
PERMANENT DETERMINISTIC EVIDENCE
=====================================================================

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

The suite now protects the stronger additive Save Library invariant while retaining corrupt-singleton fail-closed evidence.

### `tests/browser/save-library-ui-audit.cjs`

Protects:

- old singleton opening is byte-for-byte non-mutating;
- corrupt Save Library remains byte-preserved and visibly blocked;
- empty state;
- three local Saves created through user UI;
- six distinct Local Profiles when every visible manager name is identical;
- explicit active Save ownership;
- switching;
- reload persistence of active selection;
- non-active Save deletion preserving active ownership;
- active Save deletion leaving no implicit replacement;
- profile retention after deletion;
- keyboard switching;
- mutation-focus containment;
- Escape ownership after rerender;
- Chromebook `1366 × 768` containment;
- mobile `390 × 844` containment;
- reduced-motion mobile behavior;
- screenshot/JSON evidence.

The audit was added to the existing Stability family rather than creating a new workflow family.

It is also part of permanent post-merge deployed-site smoke.

Original Stability timeouts remain unchanged:

- Chromium: 18 minutes
- deployed-site smoke: 36 minutes

=====================================================================
EXACT PR #53 PRE-MERGE PROOF
=====================================================================

First broad implementation head:

`2899c020c717d9fa8b59f4c687432d7b0d1b566f`

Twelve of 13 normal workflow families passed on that head.

The one failing family was the new Stability browser journey.

Stability run:

`31770735442`

Failed Chromium job:

`94676002232`

The reproduced focus defect was fixed, then the exact corrected final implementation head became:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

On that exact head all 13 normal PR workflow families passed.

Important final-head runs:

- Stability: `31771109094` — success
- Candidate C Atomic Restore: `31771109180` — success
- Static App: `31771109225` — success

The successful Stability Chromium job explicitly proved that:

- compatibility open remained non-mutating;
- corrupt authority failed closed;
- additive Saves switched/reloaded/deleted safely;
- mutation rerenders retained keyboard focus inside Settings;
- equal visible names remained separate identities;
- Chromebook/mobile containment passed.

PR Stability artifact ID:

`9208187823`

=====================================================================
FAILURE AND CORRECTION LEDGER
=====================================================================

### 1. Incorrect stable Save ID length assumption

Initial lookup validation assumed `save_*` used 32 hexadecimal characters.

Current identity foundation uses 24 lowercase hexadecimal characters after `save_`.

Correction:

The guard was changed to the actual current foundation contract before UI publication, and permanent product contracts exercise current stable IDs.

### 2. Failed-transition season identity cache contamination risk

Initial switch/create work primed `seasonIdentityByRound` before final commit but did not clear it if the final transition failed.

Risk:

A failed uncommitted target could leave season-ID cache state associated with the wrong Showdown.

Correction:

Switch and additive-create paths now clear primed season identity cache on post-prime validation/commit failure.

`currentShowdown` changes only after successful switch commit.

### 3. Wrong test helper style

The first browser audit draft used `assert.poll`, which is unavailable in this repository's plain Node/Playwright audit style.

Correction:

It was replaced with `page.waitForFunction` plus explicit Node assertions before authoritative proof.

### 4. Temporary workflow-timeout increase

While wiring browser evidence, Stability timeouts were temporarily increased.

Correction:

This was recognized as unnecessary gate relaxation and immediately reverted.

Existing 18/36 minute limits remain unchanged.

### 5. Local clone unavailable in execution container

A local Git clone attempt could not resolve external GitHub hosts from the execution container.

Correction:

No source conclusions were drawn from that environment failure.

Exact GitHub Actions heads were used as executable proof authority.

### 6. Save Library mutation focus regression

The first Chromium Stability execution on implementation head `2899c020c717d9fa8b59f4c687432d7b0d1b566f` timed out after switching the active Save and pressing Escape because `#settingsOverlay` remained open.

Root cause:

`MAKE ACTIVE` correctly committed and rerendered Save Library, but the rerender removed the button that owned browser focus.

Focus fell outside the Settings overlay.

The established Escape handler intentionally belongs to the overlay, so Escape no longer bubbled through Settings.

This was an accessibility/focus lifecycle defect in the new product layer, not a persistence, exact-byte or transaction defect.

Correction:

No global Escape handler was added.

The product now restores focus inside `#settingsDialog` after mutation rerenders.

Browser evidence asserts focus containment after every relevant mouse/keyboard mutation before relying on Escape/Tab behavior.

The corrected final head passed the full Stability browser journey.

### 7. Post-merge workflow-discovery wrapper mismatch

Immediately after merge, `fetch_commit_workflow_runs` returned no runs.

Root cause:

That connector wrapper filters to pull-request-triggered workflow runs and therefore does not expose the push-triggered post-merge matrix.

Correction:

The exact push matrix was fetched through the repository Actions API using the merge SHA.

This was a tooling/query-boundary issue, not missing CI.

### 8. In-progress job log returned temporary 404

While deployed-site-smoke was still executing, direct job-log download returned a transient blob-not-found 404.

Root cause:

GitHub had not yet finalized the downloadable log blob for the running job.

Correction:

No failure was inferred from unavailable live logs.

Authoritative workflow job/step state was used instead.

The job later completed successfully.

=====================================================================
EXACT MERGE PROCESS
=====================================================================

After all 13 normal PR families passed on:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

PR #53 was marked ready.

Live `main` was fetched again immediately before merge and remained:

`2ac04b2327710a0aa05959179d1d865c210a7587`

Merge used exact expected PR head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Merge result:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

Live `main` was then re-fetched and confirmed to equal that merge SHA.

=====================================================================
POST-MERGE PRODUCTION PROOF — COMPLETE
=====================================================================

The exact merged runtime:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

received the full push-triggered permanent proof matrix.

No reproduced post-merge failure remains open at this boundary.

### Release Integration Burn-In

Run:

`31771269732`

Final status:

SUCCESS

Both stateful integration passes succeeded:

- `integration-burnin-pass-1` — success
- `integration-burnin-pass-2` — success

Both evidence uploads succeeded.

### Candidate C Atomic Restore

Run:

`31771269835`

Final status:

SUCCESS

Proven:

- restore contracts — success
- authoritative Candidate C restore/recovery browser audit — success
- Candidate C evidence upload — success

### Stability Lane

Run:

`31771269740`

Final status:

SUCCESS

Jobs:

- `stability-contracts` — success
- `chromium-stability` — success
- `deployed-site-smoke` — success

Canonical Stability artifact:

- artifact name: `canonical-stability-31771269740`
- artifact ID: `9208242863`
- size: `315169` bytes
- digest: `sha256:032662b171693c1b166c6248328e858860286fea9aca62630170ebe619577f6a`

### Exact deployed GitHub Pages proof

`deployed-site-smoke` job:

`94677863736`

Final status:

SUCCESS

Every deployed step passed:

1. Pages deployment and exact runtime-byte verification — success
2. runtime-error provenance audit — success
3. Home visual audit — success
4. visible Save Library audit — success
5. crop-safe football-photo audit — success
6. Candidate A backup export audit — success
7. Candidate B import analysis — success
8. Candidate C atomic restore/recovery audit — success
9. Installable Offline App/offline boundary audit — success
10. complete deployed-site journey — success

This is the production proof that the visible Save Library is not merely green in PR/local Chromium but is working in the deployed GitHub Pages shell with the existing recovery, offline, visual, backup/import and full-journey systems intact.

### Other observed post-merge specialist families

Specialist push workflows observed green include:

- Settings Workstream `31771269739`
- Final Polish `31771269691`
- V1 Visual Immersion `31771269754`
- League Confirmation `31771269755`
- Season Review `31771269679`
- Transfer Workstream `31771269730`

The complete push-associated run list for the exact merge contained the permanent workflow matrix and showed no reproduced failing family at closure.

=====================================================================
DOCUMENTATION-ONLY CLOSURE LINE
=====================================================================

After runtime proof completed, a documentation-only branch was created from exact production merge:

`agent/visible-save-library-ui-post-merge-handoff`

The first full continuation handoff commit on that branch was:

`b091a4c04a573e8dc5db1016c8abe906a6d219a2`

Draft documentation closure PR:

PR #54 — `Record visible Save Library production proof`

Its base at creation was exact production main:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

PR #54 must remain documentation-only.

It must not modify:

- runtime source;
- tests;
- workflows;
- Service Worker bytes;
- gameplay;
- scoring;
- visual assets;
- performance ceilings.

The next developer may use PR #54 to update core authority Markdown files and seal the production proof, but must first re-fetch current `main` and ensure no concurrent work has superseded this branch.

=====================================================================
NEXT DEVELOPER CHECKLIST
=====================================================================

1. Fetch live default branch and exact `main` SHA.
2. Inspect open PRs and recent commits.
3. Confirm whether PR #54 is still based cleanly on current authority.
4. Read this handoff plus current `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`, and the prior runtime cutover handoff.
5. Verify PR #53 merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` is recorded correctly if it is still the relevant production boundary.
6. Verify post-merge proof remains:
   - Burn-In `31771269732` success;
   - Candidate C `31771269835` success;
   - Stability `31771269740` success;
   - deployed-site-smoke job `94677863736` success.
7. Update the core authority Markdown files in PR #54 as a documentation-only closure.
8. Keep runtime, tests, workflows, Service Worker, gameplay/scoring and assets untouched in that closure unless a reproduced current-main defect independently requires a new implementation PR.
9. Mark/merge documentation closure only from an exact green/current head.
10. Stop at a clean boundary after documentation closure.
11. Reconstruct the next dependency from live `NEXT_TASK.md` and explicit owner direction before beginning any new feature.
12. Do not automatically begin profile edit, cloud, accounts, synchronization or historical manager mapping.

=====================================================================
CORE ARCHITECTURE LOCKS FOR ALL FUTURE WORK
=====================================================================

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

The strict recovery architecture is deliberate future-facing infrastructure for eventual multi-device evolution.

Do not simplify it merely because the current product is local-first.

=====================================================================
PERMANENT GAMEPLAY RULES REMAIN UNCHANGED
=====================================================================

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

Maximum Season score:

11

Equal non-zero scores:

Draw

Only 0–0 invokes:

- league position;
- then league points.

Do not alter these while performing Save Library documentation closure or future Local Profiles work.

=====================================================================
CLEAN CONTINUATION BOUNDARY
=====================================================================

The first visible Local Profiles / Save Library product candidate is implemented, merged and production-proven.

Exact implementation head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Exact production merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

All 13 normal PR workflow families passed before merge.

Post-merge Release Integration Burn-In passed.

Post-merge Candidate C passed.

Post-merge Stability passed.

The public GitHub Pages deployment passed exact runtime-byte verification, visible Save Library audit, backup/import/restore, offline boundary, visual audits and the complete journey.

There is no unfinished runtime implementation work in this candidate at the handoff boundary.

The only remaining task in this development line is documentation-only production-proof closure through PR #54, assuming live repository authority has not advanced.

After that closure, stop and reconstruct the next task from current source, current `NEXT_TASK.md` and explicit owner direction.

Do not use stale branches, old roadmap mockups, old external AI reviews or this handoff itself as authority over a newer live repository state.
