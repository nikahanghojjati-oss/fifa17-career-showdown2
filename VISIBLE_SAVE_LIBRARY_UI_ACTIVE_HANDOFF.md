# Career Mode Showdown — Visible Save Library UI Active Handoff

Last updated: 2026-08-14 ET
Status: active implementation and proof
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/visible-save-library-ui`
Pull request: #53 `Expose Local Profiles and Save Library UI`
Exact base `main`: `2ac04b2327710a0aa05959179d1d865c210a7587`
Production application/runtime labels: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Owner instruction

Begin the next dependency-ordered phase: Visible Local Profiles / Save Library product UI. Reconstruct current repository authority first, preserve all proven Save Library identity, persistence, runtime, recovery, Candidate A/B/C, PWA/offline, gameplay, scoring, navigation, accessibility, visual and performance contracts, then implement the smallest coherent visible product candidate. Do not begin cloud/accounts/synchronization, historical manager auto-linking, backup/import redesign, distributed revision/device/writer identity work, gameplay/scoring redesign or a new release-version assignment.

## Repository authority reconstructed

Live `main` was independently fetched and is exactly `2ac04b2327710a0aa05959179d1d865c210a7587`, matching the handoff boundary. No newer production commit existed when the branch was created.

Open pull requests at session start were only historical draft PR #37 and PR #35. Current authority documents explicitly warn that PR #37 is untrusted historical work and must not be revived. This branch was created directly from exact live `main`.

Required authority reads completed in the mandated order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`

`00_DEVELOPER_START_HERE.md` contains stale pre-cutover prose claiming Save Library persistence is still future work. This conflicts with later authority and current source. The later current handoff, project state, next task and current implementation prove PR #48 canonical persistence and PR #51 runtime cutover are complete. The stale bootstrap text is documentation debt, not implementation authority.

The public GitHub Pages URL was queried through the available web fetch path at session start, but that environment returned a cache miss/no indexed result. No fresh pre-implementation browser claim was made from that failed fetch. Post-merge deployed-site smoke remains the required production proof.

## Completed technical foundation that remains authority

Identity foundation PR #46 merge: `b76baf3be8107a57c5898f691d5178ae1d8a8547`

Canonical persistence PR #48 merge: `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`

Runtime authority cutover PR #51 merge: `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

Exact PR #51 substantive implementation head: `46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Exact PR #51 final head: `bda19f8181598d880c7b1eb7f4e9446464d015e6`

Post-merge Burn-In run `31768712755` and Stability run `31768712798` succeeded, including deployed-site smoke.

## Reconstructed source findings

The production Home menu already had a Settings tile behind the exact non-mutating Save Library cutover/data-tool boundary. A brand-new eager navigation route would require touching `js/screens.js`/route ownership while the eager gzip ceiling had only 25 bytes of prior measured headroom.

`js/saveLibraryCutover.js` remains lazy. Start and Continue may activate/migrate. Settings and Legacy remain non-mutating on unmigrated singleton devices.

`js/saveLibraryRuntime.js` already owns exact-byte runtime authority. Before this candidate it intentionally blocked creation when non-active Save Library entries existed because visible multi-save product workflow did not yet exist. That was the exact missing product boundary, not a reason to create another persistence system.

The Save Library schema already supports multiple `saves`, one `activeSaveId`, and stable `profiles`. Stable identity prefixes remain `save_*`, `profile_*` and `season_*`; the current foundation emits 24 lowercase hex characters after each prefix. Display-name equality is never identity authority.

`js/settings.js` already owns a responsive focus-trapped modal overlay with Escape close, opener focus restoration and inert background handling. `js/optionalModules.js` already owns lazy script/style loading.

## Bounded first product candidate

Candidate name: Save Library Core UI.

Final integration boundary for this PR:

- the existing Home Settings tile remains the one-click entry point;
- opening it still crosses the existing non-mutating local-data preparation boundary;
- a dedicated FIFA 17-styled `SAVE LIBRARY` product panel is mounted first inside the already lazy Settings overlay;
- application Settings remain available below it;
- the overlay header becomes `SAVE LIBRARY & SETTINGS` once the product surface is mounted;
- this avoids adding a new eager route or changing global Smart Back ownership solely for this candidate.

Included:

- empty, one-save and multi-save states;
- clear active-save state;
- save cards surfacing stable short identity, Showdown name, manager matchup, league/clubs, season progress/status and last-updated context;
- safe active-save switching through runtime authority;
- deletion of exactly one Save, visibly and behaviorally distinct from full Settings/Legacy reset;
- New Showdown is additive under Save Library authority: existing Saves and profiles remain and the newly created Showdown becomes active;
- visible read-only Local Profiles derived from stable registry identities;
- explicit UI explanation that equal manager display names do not merge identity;
- Local Profiles retained after single-Save deletion rather than implicitly garbage-collected;
- keyboard/touch controls and responsive Chromebook/mobile containment;
- fail-closed visible state when Save Library authority cannot be established;
- old singleton compatibility state that remains non-mutating until confirmed Continue/Start;
- no direct `localStorage` access from `js/saveLibraryUI.js`;
- permanent deterministic contracts plus browser journey evidence;
- lazy UI/CSS included in the complete Installable Offline App shell without changing `1.3.0-r1`.

Explicitly deferred:

- profile rename/edit semantics;
- standalone orphan profile creation outside New Showdown;
- historical manager-profile mapping;
- cloud/accounts/authentication/QR/synchronization/remote transport;
- deviceId/writerId/distributed revision/conflict architecture;
- backup/import format redesign;
- gameplay/scoring changes;
- global visual redesign;
- global Smart Back redesign;
- release-version assignment.

Profile editing is deferred because current Showdown records also contain manager display labels. Renaming safely requires an explicit propagation/history-label policy and should not be introduced incidentally while exposing the registry.

## Implemented runtime/product behavior

`js/saveLibraryRuntime.js` now exposes narrow consumer operations while preserving the established exact owned-byte commit path:

- `getLibrarySnapshot()` returns a detached clone only after exact authority verification;
- `switchActiveSave(saveId)` resolves one stable `save_*` identity, primes that Showdown's season identity cache, rechecks authority immediately before commit, changes only `activeSaveId`, and sets `currentShowdown` only after a successful commit;
- `deleteSave(saveId)` removes exactly one stable Save; deleting a non-active Save leaves active ownership unchanged; deleting the active Save leaves `activeSaveId` null and `currentShowdown` null rather than silently selecting another Save;
- stable Local Profiles are retained during single-Save deletion;
- `createShowdown(candidate)` appends the newly identity-prepared Save instead of replacing the previous active entry, merges stable profiles, retains every existing Save, and makes the new Save active;
- all product mutations continue to fail closed on exact-byte drift, singleton reappearance, critical-recovery lock or transaction failure;
- product operations never recreate `careerModeShowdown.activeShowdown` after cutover.

`js/showdown.js` no longer presents the retired destructive "replace the active save" confirmation. Confirmed Start still passes through the same lazy activation/cutover gate before additive creation.

`js/saveLibraryUI.js` and `css/saveLibrary.css` are entirely lazy. The UI classifies state using the established exact raw read boundary and delegates every mutation to Save Library runtime APIs.

`js/saveLibraryCutover.js` now mounts the lazy Save Library product after opening Settings. If local Save Library authority cannot be prepared, Settings still opens and the product panel is explicitly blocked/read-only rather than hiding the failure or lying that persistence is healthy.

## Permanent evidence added/updated

`tests/contracts/save-library-product-contracts.cjs` protects:

- no raw storage access from visible UI;
- lazy product loading;
- exact read-state classification;
- additive create retaining saves/profiles;
- detached UI snapshots;
- same-name manager identity separation;
- explicit switching;
- active and non-active single-Save deletion semantics;
- no singleton resurrection;
- stale-authority fail-closed writes;
- offline shell inclusion;
- mobile/reduced-motion presentation contracts.

The new contract is wired into `tests/support/run-contract-suite.cjs`.

`tests/contracts/final-release-hardening.cjs` no longer protects the obsolete destructive replacement prompt. It now protects the stronger additive Save Library invariant while retaining all corrupt-singleton fail-closed evidence.

`tests/browser/save-library-ui-audit.cjs` protects:

- old singleton panel open is byte-for-byte non-mutating;
- corrupt Save Library state opens blocked/read-only and preserves corrupt bytes;
- empty state;
- three user-created local Saves;
- six distinct stable profiles when every visible manager name is identical;
- one explicit active Save;
- switch then reload persistence;
- non-active deletion without active ownership change;
- active deletion leaving no implicit replacement;
- profile retention after deletion;
- keyboard activation;
- Chromebook containment;
- mobile + reduced-motion containment;
- screenshots and JSON evidence.

The audit is inside the existing `Validate Stability Lane` Chromium job and the permanent post-merge deployed-site smoke. The workflow family count remains unchanged. Original Stability timeouts remain 18 minutes for Chromium and 36 minutes for deployed smoke.

## Installable Offline App

`service-worker.js` now includes:

- `css/saveLibrary.css`
- `js/saveLibraryUI.js`

in the complete shell list.

`RUNTIME_REVISION` remains exactly `1.3.0-r1`. No release/version label was assigned.

## Performance locks

No performance ceiling was raised.

Proven PR #51 implementation values remain the comparison boundary: eager raw 162935 bytes, eager gzip 37475 bytes, lazy feedback 4845 bytes. Ceilings remain eager raw <=165000, eager gzip <=37500, Reus startup portrait <=95000, combined first-party startup <=260000.

The candidate deliberately removes the old eager destructive-replacement prompt/branch from `js/showdown.js` while keeping the new product code lazy. Exact Static App CI on PR #53 is the authority for the final candidate budget.

## PR #53 proof status

Draft PR #53 was opened from the exact branch and base. At the first full current-head CI observation, the following workflow families were already green:

- Validate Static App, including JavaScript syntax, dynamic static release architecture, complete repository contracts and workflow topology;
- Validate Settings Workstream, including lazy architecture, accessibility/focus lifecycle and install ownership;
- Validate Home Bootstrap;
- Validate Transfer Workstream;
- Validate League Confirmation;
- Validate Final Polish;
- Validate V1 Visual Immersion;
- Validate Statistics Workstream;
- Validate Season Review.

The Stability contract job is green, including the new Save Library product contract. The Chromium Stability job and several independent browser/recovery workflows were still running when this handoff update was written. Do not interpret this partial status as merge permission; only exact final-head green proof counts.

## Failure and correction ledger

1. Initial runtime lookup guard expected `save_*` plus 32 hex characters.

Root cause: assumption instead of reading the current identity contract closely enough.

Correction: changed the guard to the actual current foundation shape, prefix plus 24 lowercase hex characters, before publishing UI behavior. Permanent product contracts exercise current stable IDs.

2. Initial switch/create implementation primed `seasonIdentityByRound` before the final transaction but did not clear the primed cache if that final transition failed.

Risk: a failed uncommitted target transition could leave a season-ID cache associated with the wrong Showdown.

Correction: switch and additive-create paths now clear the cache on post-prime validation/commit failure. `currentShowdown` is changed only after successful switch commit.

3. The first browser audit draft used `assert.poll`, which is not available in this repository's plain Node/Playwright audit style.

Correction: replaced it before proof with `page.waitForFunction` plus explicit Node assertions.

4. While wiring the new browser audit, workflow timeouts were temporarily increased.

Correction: the increase was unnecessary gate relaxation and was reverted immediately. Existing 18/36 minute limits are preserved.

5. Local container cloning was attempted for direct local execution but the container cannot resolve external GitHub hosts.

Correction: no source assumptions were made from that failure. GitHub Actions on exact PR heads is being used as the executable proof authority.

## Remaining closure work

- let all 13 normal PR workflow families finish on the exact final implementation head;
- classify and repair any reproduced failures without weakening tests or limits;
- update this handoff and core authority docs with exact final PR head/run proof;
- mark PR #53 ready only when product/browser evidence is complete;
- merge only with exact expected-head safety after re-fetching live `main` and confirming no newer concurrent work;
- run/observe permanent post-merge workflows, especially Release Integration Burn-In and Stability deployed-site smoke;
- record exact merge SHA, run IDs, deployed proof and clean next boundary;
- stop without beginning unrelated profile editing/cloud/synchronization work.
