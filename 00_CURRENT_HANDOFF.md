# Career Mode Showdown — Current Handoff

Last updated: 2026-08-15 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns implementation authorization unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and frozen proof documents remain evidence for the release/candidate they name.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After independently fetching live `main`, recent commits and open PRs and reading the permanent authority files:

1. verify live production still descends from runtime merge `67095a02188ebd246da0d0f2cd61158b8e9e504e` or reconstruct every newer change before proceeding;
2. verify PR #61, the r2 production proof, open PRs/branches/releases, current tests and deployed Pages before trusting any recorded state;
3. preserve guarded Local Profile display-label editing, stable identity, unchanged Showdown/Legacy presentation, recovery, offline behavior, gameplay, visuals and performance locks;
4. if no later explicit owner instruction authorizes a bounded candidate, make no runtime mutation;
5. keep this rolling handoff current when repository state changes, but do not manufacture a roadmap assignment.

Do not reopen display-label editing or begin Showdown/Legacy label rewriting, profile merge/delete, standalone profile creation, backup portability, broader Analytics 2.0, Legacy/Achievements, optional content, cloud, gameplay or Service Worker behavior changes without a later explicit owner instruction.

## Closed bounded continuation — Local Profile display labels

Later owner continuation instruction on 2026-08-15 ET explicitly superseded the prior no-new-candidate stop boundary and authorized selection of exactly one smallest meaningful local-first roadmap candidate after full reconstruction.

Live repository and production reconstruction found:

- exact live `main` and branch base: `eee3b0c62be4d023b7d83fb22447d37db8a8b9b6`;
- open PRs: historical draft PR #35 and PR #37 only, both based on obsolete snapshots;
- tags/releases: public releases remain `v1.0.0` and `v1.0.1`; later runtime/product functionality remains intentionally unversioned;
- authority-seal main workflow proof: 15 of 15 exact-head push/deployment runs successful, including Stability run `31829081373` and deployed-site-smoke job `94860761943`;
- latest Pages deployment: `5911426296`, SHA `eee3b0c...`, successful;
- independent deployed verification: all 71 runtime files match local `1.3.0-r1` source byte for byte;
- local pre-change contract baseline: all 28 repository contract files passed after the explicit static release contract.

Selected candidate:

`Local Profile display-label editing`

Active branch:

`agent/local-profile-display-label-edit`

Exact branch base:

`eee3b0c62be4d023b7d83fb22447d37db8a8b9b6`

Source-grounded semantic boundary:

- only `profile.displayName` changes;
- stable `profile_*`, `save_*` and `season_*` identities never change;
- saved Showdown manager labels and Legacy manager labels remain unchanged historical presentation;
- equal visible profile labels remain legal and are never identity authority;
- mutation remains inside `js/saveLibraryRuntime.js` and uses the existing exact guarded Save Library transaction boundary;
- UI remains inside the lazy Save Library/Settings surface and never accesses canonical browser storage directly;
- Career Statistics and Trophy Room continue to consume the shared profile-presentation revision authority already protected by Identity-Safe Career Analytics.
- the changed JavaScript/CSS ships as production runtime `1.3.0-r2`, with production-proven `1.3.0-r1` as its immediate previous whole-shell recovery target.

First implementation checkpoint:

`e21e6656a6e19283856ccd6b8c8ad7748265c813`

Commit subject: `Add Local Profile display-label editing`

This checkpoint contains the complete bounded runtime/UI implementation, `1.3.0-r2` whole-shell candidate identity, deterministic and browser regression proof, candidate release/handoff records and all authority updates. The following handoff-freeze commit changes documentation only so the remote branch head can enter exact-head pull-request validation without an unrecorded implementation boundary.

Final frozen PR head:

`cfedec8dccde51a7a9932a1bd3a92cc91514e579`

PR #61 expected-head merge:

`67095a02188ebd246da0d0f2cd61158b8e9e504e`

### Retained local validation failure 1 — cross-realm assertion

The first focused `save-library-product-contracts.cjs` run failed while comparing the successful runtime result as one deep-equal object. The runtime result originated in the VM test realm, so Node rejected prototype equality even though `ok`, `changed`, `profileId` and `displayName` all matched.

Classification: test harness assertion defect, not a runtime product defect.

Correction: compare the four contract fields explicitly. No production behavior changed to satisfy the test.

### Retained local validation failure 2 — isolated server session

The first Chromium audit attempt could not connect to `127.0.0.1:4173` even though the separately yielded test-server session reported that it was listening. The server process and browser command were isolated by the execution environment.

Classification: local orchestration/infrastructure failure, not application or browser-audit behavior.

Correction: start the static server and Chromium audit in one controlled shell with cleanup ownership. The unchanged implementation then passed the complete Save Library browser audit on Chromebook and mobile reduced-motion viewports.

### Retained pre-publication finding — stale installed-app delivery identity

Initial candidate planning preserved `1.3.0-r1` and excluded Service Worker/release identity work. Source inspection then proved that the worker installs and selects an atomic whole-shell cache by runtime revision. Changed Save Library JavaScript and CSS published under the unchanged r1 worker/cache identity would not reliably update an existing installed client and would violate the repository's no-mixed-shell production claim.

Classification: deterministic production-delivery correctness issue discovered before publication, not authorization for a second feature.

Correction: keep application milestone `v1.3.0`, advance only the whole-shell revision to `1.3.0-r2`, set `1.3.0-r1` as its immediate previous known-good shell, and preserve all Service Worker behavior. `RELEASE_V1.3.0_R2.md` and `CAREER_MODE_SHOWDOWN_V1.3.0_R2_MAINTENANCE_HANDOFF.md` own the release boundary. Production remained r1 at that pre-publication point; r2 is now exact-head validated, merged and publicly proven.

### Retained local validation failure 3 — wrong static-server helper path

The first post-r2 browser rerun invoked nonexistent `tests/support/serve-static.cjs`, so the controlled server exited before Chromium and the audit failed with `ERR_CONNECTION_REFUSED`.

Classification: local test-orchestration command error, not product or browser behavior.

Correction: use the repository-owned `tests/support/static-server.cjs` helper in the same cleanup-owned shell. The unchanged r2 candidate then passed the complete Chromebook and mobile reduced-motion Save Library audit, including new exact profile-card screenshots.

### Retained local validation failure 4 — real collapsed Save Library grid item

The first visually useful editor capture showed only a thin slice of the profile card with later Settings panels painted over it. Added geometry proof measured the edited card at about 298 px high while its Save Library parent had collapsed to 28 px; the next Settings panel started inside the card's bounds.

Root cause: `.saveLibraryProductPanel { overflow:hidden; }` made the large first CSS Grid item a hidden scroll container with a zero automatic minimum size inside the constrained Settings scroller. Focus-driven automation could silently scroll that 28 px clipped box, so earlier horizontal-only containment checks passed while the real visible panel was unusable.

Classification: deterministic production UI layout defect exposed by the candidate's required visual proof.

Correction: use non-scroll-container `overflow:clip` for the same decorative containment, and permanently assert that editor children remain inside the profile card, the card remains inside the Save Library panel, and the following Settings panel begins after the Save Library panel. Re-run and screenshot proof are required at Chromebook and mobile reduced-motion widths.

### Retained local validation failure 5 — newly exposed Save fact contrast

After the collapsed-panel correction made the full Save Library participate in the visible Settings layout, the complete Chromium journey reached the Settings accessibility scan and reported four identical serious contrast violations. The 8 px Save fact labels used `#667681` on `#eef3f4`, a measured 4.19:1 ratio below the required 4.5:1.

Classification: real existing accessibility defect that had been hidden from the visible scan by the collapsed panel.

Correction: darken only those metadata labels to `#596a75` for about 5.01:1 contrast, preserving typography and hierarchy. Re-run the complete stability journey rather than suppressing the axe rule.

### Retained local validation failure 6 — aggregate legacy-workflow wrapper interruption

Two attempts to run the monolithic `npm run test:legacy-workflows` wrapper were interrupted by the Work execution environment with `network approval was cancelled` while that wrapper nested several long-running browser owners. The cancellation did not identify an application assertion failure, and the wrapper could not complete as one local process.

Classification: local aggregate-runner/session infrastructure interruption, not a demonstrated product or test-owner failure.

Correction: do not report the monolithic wrapper as green. Run the exact affected repository-owned test owners directly under controlled server/process ownership. Candidate C restore/recovery browser and maintenance, Candidate B import browser, football visual audit, Home visual audit, bundled loading/install, Settings install/focus and the full stability journey all passed directly on the unchanged candidate.

### Retained local validation failure 7 — resource-heavy chained loading target closure

After a resource-heavy sequence of Chromium owners, one standalone loading visual run lost its single shared browser target with a target-closed error before completing its cases.

Classification: local browser-process lifecycle/resource failure, not a loading-screen assertion failure.

Correction: rerun the repository-owned loading visual audit with `CMS_CHROMIUM_MULTI_CONTEXT=1`, preserving the same product assertions while isolating its browser contexts. All loading cases passed, including the normal 2700 ms minimum and reduced-motion 220 ms boundary.

### Current focused local evidence

- all 28 repository contract files: pass, including static release identity `1.3.0-r2`;
- repository JavaScript/CJS/MJS syntax scan: pass;
- `git diff --check`: pass;
- Save Library product contracts: pass after the cross-realm assertion correction;
- Save Library Chromium audit: pass for compatibility, corrupt fail-closed behavior, three-Save/six-profile creation, keyboard label editing, invalid-input no-write behavior, stable identity, unchanged Showdown labels, Analytics presentation revision, switching, deletion, focus, Chromebook containment, mobile containment and reduced motion;
- profile-editor screenshot review: pass at Chromebook and mobile reduced-motion widths after the real grid-collapse correction;
- manager identity linkage, Identity-Safe Career Analytics and Trophy Room browser owners: pass;
- offline boundary, offline cache lifecycle v2 and runtime error provenance: pass with r2 current, r1 previous, restart/corruption recovery and fail-closed behavior intact;
- full stability journey: pass across 70 checkpoints and 36 axe scans on Chromebook and mobile;
- Candidate C restore/recovery browser and maintenance, Candidate B import browser, football visual, Home visual, loading/install and Settings install/focus owners: pass directly;
- monolithic `npm run test:legacy-workflows`: not claimed green because the local Work session interrupted the nested aggregate wrapper; every exact affected owner passed directly.

### Post-merge verification infrastructure note

The first direct local Chromium attempt against public Pages returned `ERR_EMPTY_RESPONSE` because the packaged serverless Chromium runtime intentionally blocks external DNS. A temporary network-enabled retry reached the environment HTTPS proxy but the packaged Chromium did not trust its local CA; a further retry was cancelled by the Work network-approval layer before test execution.

Classification: local browser/network infrastructure, not deployed application behavior.

Correction: keep trusted HTTPS exact-byte verification separate from browser interaction. The repository verifier matched 71 runtime files, and separate HTTPS checks matched Service Worker and manifest bytes. The production Stability deployed-site-smoke passed in GitHub Actions, and an independent cloud browser then passed the exact public Local Profile edit and invalid-input journey without bypassing production application checks.

## PR #61 exact validation, merge and production proof

Frozen head `cfedec8dccde51a7a9932a1bd3a92cc91514e579` passed all 13 normal pull-request workflow families with zero failures or cancellations. The independent gate verified unchanged base/head, a clean merge state, mergeability, zero submitted reviews, zero comments and zero unresolved review threads.

PR #61 merged with expected-head protection to `67095a02188ebd246da0d0f2cd61158b8e9e504e`. The merge tree exactly matches the validated head and has expected parents `eee3b0c...` and `cfedec8...`.

All 15 exact-merge push/deployment runs succeeded. Key evidence:

- Pages run `31894832195`, deployment `5922244376` and build `1153293091`;
- Release Integration Burn-In `31894832592`;
- Candidate B `31894832632` and Candidate C `31894832804`;
- Licensed Football Visuals `31894832763`;
- Stability `31894832637`, Chromium job `95036465423` and deployed-site-smoke job `95036682319`.

Independent deployed proof matched 71 runtime files plus `service-worker.js` and `manifest.webmanifest` byte for byte. The public browser reported `1.3.0-r2` and proved whitespace-only rejection, successful label editing, unchanged exact `profile_*`/`save_*` IDs, unchanged saved Showdown manager label and updated identity-link presentation.

`V1.3.0_R2_PRODUCTION_PROOF.md` owns frozen evidence.

## Current production authority

Application milestone remains `v1.3.0 — Recovery & Device Resilience Hardening`.
Current production Installable Offline App runtime is `1.3.0-r2`.
Its immediate previous known-good whole shell is `1.3.0-r1`.
Feature release version remains intentionally unassigned.

Current production runtime feature merge:

`67095a02188ebd246da0d0f2cd61158b8e9e504e`

That merge shipped PR #61, presentation-only Local Profile display-label editing and coherent r2 whole-shell delivery, while preserving application v1.3.0 and Service Worker behavior.

## Completed manager identity dependency chain

The Local Profiles / Save Library and manager-identity chain remains production-proven:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53;
5. explicit cross-Save/historical manager identity linkage foundation — PR #57, merge `95e98c13bbb4cac485531565c3577ae31286d0af`;
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59, merge `c5c7d50cc3a2d9003e057d1813744c877323c068`.
7. Local Profile display-label editing / r2 whole-shell delivery — PR #61, merge `67095a02188ebd246da0d0f2cd61158b8e9e504e`.

A direct profile-ID key swap is not sufficiently correct by itself. The shipped implementation also preserves intentionally unresolved historical roles, identity-independent historical totals/records, Local Profile display names as presentation only, read-only inactive-runtime profile presentation, coherent revision invalidation and Showdown-scoped Rivalry semantics.

## Retained PR #57 / #58 production history

PR #57 exact final head:

`9bf4cc19c6ec6485c28a7dd542cbac74052d44bc`

PR #57 merge:

`95e98c13bbb4cac485531565c3577ae31286d0af`

PR #57 shipped explicit cross-Save Local Profile reuse, same-name profile separation, exact stable-save-ID matching Legacy propagation, explicit historical map/unmap, unresolved historical identity as a valid state, profile retention after Save deletion and Candidate A/C preservation of active stable profile references.

Its production Stability run `31812858587` passed exact-byte deployed proof and the full recovery/offline journey.

Because repository authority still described the newly shipped manager-identity prerequisite as future work, documentation/semantic authority seal PR #58 followed.

PR #58 exact final validated head:

`e8ed4994ef331749dc3d94707f9bb80e0b5de80c`

PR #58 merge:

`ab5f4082c520a464a894318bfed1e0511763805f`

PR #58 retained two documentation/semantic-coherence validation failures rather than weakening contracts:

- initial head `3306028fb04f45eba0a7fdb1c2716c3090e0bb5b` exposed stale cloud-foundation assertions still expecting pre-PR-#57 roadmap classifications; correction advanced the contract while keeping cloud future/non-authorized;
- later head `d1adbef1d06705af0b5d9bd3d9d1fbd27fd5a203` exposed a protected canonical roadmap marker/order mismatch; correction restored the exact `Local Profiles and Save Library — completed dependency milestone, feature version unassigned` heading rather than weakening dependency-order protection.

Final PR #58 head passed all 13 normal PR workflow families. Merge `ab5f4082...` passed all permanent push/deployment families and Stability run `31814624830` including deployed-site smoke.

This prior history remains relevant because it established the quality rule used during PR #59: semantic contracts are repository authority, and stale tests must be classified rather than casually weakened.

## PR #59 — Identity-Safe Career Analytics implementation

Owner-authorized implementation branch:

`agent/identity-safe-career-analytics`

Exact production branch base:

`8c6fad42e38b4964d848128e40569442c3fa06d5`

Final exact validated PR head:

`a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`

PR #59 changed exactly 16 files and stayed inside the intended Analytics/evidence/authority scope. Runtime changes were limited to `js/analytics.js`, `js/statistics.js` and `js/trophyRoom.js`; the candidate did not modify Service Worker/release identity, gameplay/scoring, Candidate C restore implementation, storage transaction architecture or performance budgets.

### Shipped Analytics semantics

Longitudinal career manager identity is a stable `profile_*` reference, never a normalized display name.

Production now guarantees:

- two different Local Profiles with the same visible name remain separate career identities;
- one explicitly reused Local Profile across different Saves aggregates into one career identity;
- unresolved historical manager roles remain unresolved and are never guessed from label similarity;
- unresolved roles are excluded only from identity-dependent manager totals, leaderboards, Trophy cabinets and identity-scoped comparisons;
- completed Showdown/Season totals, points, trophies and Showdown/Season-scoped records remain complete even with unresolved identity;
- Local Profile display names remain presentation only;
- Career Statistics and Trophy Room consume shared stable-identity Analytics authority;
- Local Profile presentation remains available read-only before Save Library mutation runtime activation through existing exact raw Save Library snapshot authority;
- identity and consumed profile-presentation changes invalidate Analytics/Trophy derived caches/renders;
- Rivalry Statistics remains Showdown-scoped and semantically unchanged.

## PR #59 failure history — retained, never erased

### Failure 1 — canonical handoff wording drift

Head `7f566ef32428d1d1a00311ee8e8716df6973c03b`, Static run `31824404149`, job `94844989903`.

The active handoff renamed the protected `Exact branch base:` marker. Correction restored the marker; the release-authority contract was not weakened.

### Failure 2 — real inactive-runtime Local Profile presentation defect

Head `5b005e481ef0972adff0dbc2e78399eb5e1558d0`, Stability run `31824548015`, Chromium job `94845511900`.

Career Statistics opened before Save Library mutation runtime activation and showed historical label `Same Name` rather than canonical Local Profile display name `Canonical Manager`.

Correction added read-only presentation through existing exact Save Library snapshot authority. Stable profile ID remained sole identity; Analytics did not activate Save Library, migrate or write storage.

### Failure 3 — syntax typo during correction

Head `da9f04ffd890476716a2f513b4dfbf64ec4deca9`, Static run `31825346002`, job `94848041517`.

A mismatched closing bracket caused invalid `js/analytics.js`. Correction `86c69560...` changed only the syntax typo.

### Failure 4 — source-literal contract mismatch

Head `c61e15ddd3ea59e06b0c02107e2b60a469b37bb4`, Static run `31825526402`, Stability run `31825526429`.

A deterministic assertion expected literal `profilePresentation.signature` while implementation used `presentation.signature`. Correction aligned the inaccurate literal assertion while preserving dynamic cache-invalidation proof.

### Failure 5 — browser mapping before mutation authority activation

Head `1b6c1f128764f0c5cddb3d022ef4abd733d818b1`, Stability run `31825746735`, Chromium job `94849445595`.

The audit intentionally proved mutation authority inactive, then incorrectly called its mapping API directly. Correction activated canonical authority before mapping.

### Failure 6 — lazy activation helper orchestration

Head `75792ded09fb7bbd88f0e8228217f8cd498f0fd1`, Stability run `31825982051`, Chromium job `94850240854`.

`ensureSaveLibraryRuntimeAuthority()` was unavailable because `saveLibraryCutover.js` itself is intentionally lazy. Correction `ab721dc8...` mirrored real application behavior using `loadRuntimeScript("save-library-cutover", "js/saveLibraryCutover.js", ...)` before canonical authority activation.

### Failure 7 — offscreen Trophy cabinet rendered-text assertion

Head `42bd947caaa776e348bc927dfd0a4877b0241bee`, Stability run `31826301498`, contracts job `94851210592` green, Chromium job `94851264584` failed.

The exact Trophy cabinet returned empty Playwright `innerText()` when the audit expected `ACROSS 3 SHOWDOWNS`.

Investigation proved before Trophy Room opened that `window.buildCareerAnalytics()` already reported the mapped profile across 3 Showdowns, 19 points and zero unresolved roles. Source showed Trophy Room synchronously builds manager cabinet text from that model. The target cabinet uses `content-visibility:auto`.

Correction head `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1` changed only the browser audit. It proves Analytics/Trophy revision equality and raw cabinet DOM text, records viewport/bounds/content visibility, scrolls the exact stable-profile cabinet into view, then still requires visible rendered `innerText()` to contain `ACROSS 3 SHOWDOWNS`.

The green rerun showed the cabinet initially below the viewport with `content-visibility:auto`. Pre-scroll `innerText()` happened to be available in that rerun, so the final classification is a transient/offscreen rendered-text assertion issue, not a demonstrated production Analytics/Trophy cache defect. Production CSS was not changed merely to satisfy Playwright.

## Exact PR #59 validation and promotion

All 13 normal PR workflow families passed exact final head:

`a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`

Stability PR run `31827326750` passed contracts and Chromium on that exact head.

The independent promotion gate verified:

- live `main` still exact base `8c6fad42e38b4964d848128e40569442c3fa06d5`;
- candidate 35 commits ahead / 0 behind;
- exact 16-file changed scope;
- PR mergeable;
- no submitted reviews;
- no unresolved review threads;
- no unresolved PR-comment concern;
- all required checks belonged to exact head `a0aa98e3...`.

PR #59 was promoted from draft and merged with expected-head protection.

## Exact production proof

Runtime merge:

`c5c7d50cc3a2d9003e057d1813744c877323c068`

The merge has parents previous production main `8c6fad42e38b4964d848128e40569442c3fa06d5` and validated candidate `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`.

Exact-merge workflow evidence:

- successful push/deployment workflow runs: 15;
- failures: 0;
- cancellations: 0;
- Release Integration Burn-In run `31827619182`: both full stateful repetitions green;
- Candidate C Atomic Restore run `31827619121`: restore contracts and authoritative recovery browser proof green;
- Stability run `31827619109`: `stability-contracts`, `chromium-stability` and deployed-site smoke green;
- deployed-site-smoke job `94855938131`: exact runtime bytes, runtime provenance, Home, visible Save Library, manager identity linkage, Identity-Safe Career Analytics, crop-safe football visuals, Candidate A, Candidate B, Candidate C, Installable Offline App/offline boundary and complete deployed journey all green.

The public GitHub Pages runtime is therefore production-proven for Identity-Safe Career Analytics.

## Current protected boundaries

Stable identities remain `profile_*`, `save_*`, `season_*`; display names are labels only.

Before Save Library cutover, canonical browser keys remain active Showdown + Legacy + preferences. After cutover, canonical keys remain Save Library + Legacy + preferences. `careerModeShowdown.activeShowdown` never becomes a permanent fourth post-cutover key.

`js/storage.js` remains raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority. `js/analytics.js` remains read-only derived Analytics authority.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage and continues to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority with transaction-owned mutation, ownership-scoped rollback, anti-clobber checks and exact verification.

Current production Installable Offline App runtime is `1.3.0-r2`. Runtime `1.3.0-r1` is its immediate previous known-good whole shell.

Locked performance ceilings remain eager raw <= 165000, eager gzip <= 37500, Reus portrait <= 95000, combined first-party startup <= 260000, normal loading minimum 2700 ms and reduced-motion loading 220 ms.

Gameplay/scoring and accepted FIFA 17-inspired presentation remain unchanged.

## Current clean boundary

Identity-Safe Career Analytics and Local Profile display-label editing are complete, merged, deployed and production-proven.

Current runtime feature authority is merge `67095a02188ebd246da0d0f2cd61158b8e9e504e`. No new substantial runtime candidate is authorized; completion of PR #61 authorizes no second roadmap area.
