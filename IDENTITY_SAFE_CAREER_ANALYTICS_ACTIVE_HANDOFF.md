# Identity-Safe Career Analytics — Closed Candidate Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Implementation branch: `agent/identity-safe-career-analytics`
PR: #59 — `Make longitudinal Career Analytics identity safe`
Exact branch base: `8c6fad42e38b4964d848128e40569442c3fa06d5`
Exact validated PR head: `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`
Exact runtime merge: `c5c7d50cc3a2d9003e057d1813744c877323c068`
Production site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Status: implementation complete, merged, deployed and production-proven

This file is retained as the branch-specific evidence trail for the completed Identity-Safe Career Analytics candidate. It is historical after promotion. Current deployed product truth belongs to `PROJECT_STATE.md`; implementation authorization belongs to `NEXT_TASK.md`.

## IMMEDIATE NEXT TASK AFTER FULL STUDY — MANDATORY

### Phase 1 — bootstrap/study

Before any mutation:

1. fetch live `main`, recent commits and all open PRs;
2. read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md` and `POST_V1_ROADMAP_EXECUTION.md`;
3. use this file only when PR #59 implementation/failure history is relevant;
4. confirm whether a later owner instruction authorizes a newer bounded candidate.

### Phase 2 — FIRST ENGINEERING TASK: preserve the sealed production boundary

PR #59 is no longer an implementation task. Its runtime is production-proven.

If `NEXT_TASK.md` and later owner instructions contain no newer product authorization, make no runtime change. Do not autonomously select a future roadmap feature.

When the owner later authorizes a new product request, reconstruct only the relevant current source/history, preserve the locks in current authority, and implement the smallest correct bounded candidate.

Success condition for a fresh continuation without newer owner authorization: live authority is coherent, production remains healthy, and no runtime mutation is made.

## Owner authorization and original candidate scope

On 2026-08-14 ET the owner authorized correcting repository record inconsistencies and independently advancing the smallest source-supported next roadmap candidate with maximum attention to detail and accuracy. That authorization covered only the narrow identity-safe longitudinal Career Analytics/Trophy Room candidate plus evidence, correction, promotion and authority work required to prove it.

The candidate changed exactly 16 files versus its production base:

- `.github/workflows/validate-stability-lane.yml`
- `00_DEVELOPER_START_HERE.md`
- `00_HANDOFF_GOLDEN_RULE.md`
- `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md`
- `NEXT_TASK.md`
- `POST_V1_ROADMAP_EXECUTION.md`
- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `tests/browser/identity-safe-career-analytics-audit.cjs`
- `tests/contracts/cloud-foundation-contracts.cjs`
- `tests/contracts/handoff-immediate-next-task-contracts.cjs`
- `tests/contracts/identity-safe-career-analytics-contracts.cjs`
- `tests/contracts/release-authority-coherence.cjs`
- `tests/contracts/statistics-fixtures.cjs`
- `tests/support/run-contract-suite.cjs`

No Service Worker revision, application release number, gameplay/scoring rule, recovery guarantee or performance budget was changed.

## Shipped identity-safe semantics

Longitudinal manager aggregation uses only valid stable `profile_*` references. Visible manager-name equality can never merge identities. Two same-name profile IDs remain separate; one explicitly reused profile aggregates across Saves.

Unresolved historical roles remain unresolved and are excluded from identified manager totals/leaderboards, Trophy Room manager cabinets and identity-scoped longitudinal comparisons until explicitly mapped. They are never guessed from visible-name equality.

Identity-independent history remains complete, including completed Showdown count, seasons played, overall points, overall trophies, highest Season score, highest league points, highest league goals, biggest Showdown margin and other Showdown/Season-scoped records.

Local Profile `displayName` is presentation only. Rivalry Analytics remains Showdown-scoped and semantically unchanged.

`js/analytics.js` exposes shared `getCareerAnalyticsRevisionKey()` for Career Statistics and Trophy Room. The key includes the state actually consumed by Analytics, including Legacy/active identity and Local Profile presentation state.

When Save Library mutation runtime is ready, Analytics uses its validated identity mapping snapshot for labels. When valid post-cutover Save Library bytes exist but mutation runtime has not been activated, Analytics uses the existing exact raw Save Library snapshot authority from `storage.js` only to read Local Profile presentation labels. It never activates Save Library, migrates, writes storage or changes identity.

`js/storage.js` remains raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library and manager-identity mutation authority. Analytics remains read-only derived consumption.

## Regression evidence

`tests/contracts/identity-safe-career-analytics-contracts.cjs` protects same-name separation, explicit profile reuse, unresolved identity, complete identity-independent records, Local Profile labels, identity remap cache invalidation, inactive-runtime post-cutover profile presentation, presentation cache invalidation and unchanged Rivalry labels.

`tests/browser/identity-safe-career-analytics-audit.cjs` proves read-only Career Statistics while mutation authority remains inactive, mirrors the real lazy Save Library cutover/activation path before explicit historical mapping, verifies the mapping refresh, verifies Trophy Room stable-profile coherence and confirms retired singleton authority remains absent.

`.github/workflows/validate-stability-lane.yml` permanently runs that audit in canonical Chromium and against deployed Pages after merge.

## Failure history — retained, never erased

### Failure 1 — release-authority handoff wording

Failing head: `7f566ef32428d1d1a00311ee8e8716df6973c03b`
Workflow/run/job: `Validate Static App` / `31824404149` / `94844989903`
Failure: active handoff no longer matched the protected `Exact branch base:` marker.
Classification: documentation contract drift.
Correction: `5b005e481ef0972adff0dbc2e78399eb5e1558d0` restored the canonical marker rather than weakening the contract.

### Failure 2 — inactive-runtime Local Profile presentation

Failing head: `5b005e481ef0972adff0dbc2e78399eb5e1558d0`
Workflow/run/job: `Validate Stability Lane` / `31824548015` / `94845511900`
Failure: expected Local Profile label `Canonical Manager`, received historical label `Same Name` when Career Statistics opened before Save Library mutation runtime activation.
Classification: real runtime integration defect.
Correction: read presentation labels through existing read-only exact Save Library snapshot authority while keeping stable profile IDs as identity. This did not activate or write Save Library.

### Failure 3 — syntax typo during correction

Failing head: `da9f04ffd890476716a2f513b4dfbf64ec4deca9`
Workflow/run/job: `Validate Static App` / `31825346002` / `94848041517`
Failure: `js/analytics.js` syntax error from a mismatched closing bracket.
Classification: developer correction mistake.
Correction: `86c69560db6b17e7c320c7f526f71ac684c90068` changed only the typo.

### Failure 4 — deterministic source-literal mismatch

Failing head: `c61e15ddd3ea59e06b0c02107e2b60a469b37bb4`
Static run/job: `31825526402` / `94848620686`
Stability run/job: `31825526429` / `94848620565`
Failure: deterministic contract looked for `profilePresentation.signature` while implementation used `presentation.signature`.
Classification: test source-literal mismatch.
Correction: `37f8e9543b5931930eb30a766336270b6b2c14a0` aligned only the inaccurate literal assertion; dynamic cache-invalidation proof remained.

### Failure 5 — mapping API called before mutation authority activation

Failing head: `1b6c1f128764f0c5cddb3d022ef4abd733d818b1`
Workflow/run/job: `Validate Stability Lane` / `31825746735` / `94849445595`
Failure: browser audit called `assignLegacyManagerProfile()` while Save Library mutation runtime was intentionally inactive.
Classification: browser test orchestration defect.
Correction: explicitly activate canonical Save Library authority before mapping.

### Failure 6 — activation helper itself was lazy

Failing head: `75792ded09fb7bbd88f0e8228217f8cd498f0fd1`
Workflow/run/job: `Validate Stability Lane` / `31825982051` / `94850240854`
Failure: `window.ensureSaveLibraryRuntimeAuthority` was unavailable because `saveLibraryCutover.js` itself had not yet been lazy-loaded on the Statistics-only path.
Classification: second browser test orchestration defect.
Correction: `ab721dc8f4901ebebc4973d9cab1c36969d33ade` mirrors production by loading `js/saveLibraryCutover.js` through `loadRuntimeScript(...)` before canonical authority activation.

### Failure 7 — offscreen Trophy cabinet rendered-text assertion

Failing head: `42bd947caaa776e348bc927dfd0a4877b0241bee`
Workflow: `Validate Stability Lane`
Run: `31826301498`
Contracts job: `94851210592` — success
Chromium job: `94851264584` — failure
Failure: Trophy Room assertion expected `ACROSS 3 SHOWDOWNS`, but Playwright `innerText()` returned an empty string for the exact stable-profile cabinet.

Investigation proved before Trophy Room opened that `window.buildCareerAnalytics()` already reported the explicitly mapped profile across 3 Showdowns with the correct 19 points and zero unresolved roles. Source review proved `renderTrophyRoom()` consumes that Analytics model synchronously and `createManagerCabinet()` writes `across ${manager.showdowns} showdowns` synchronously. `.managerCabinet` uses `content-visibility:auto`.

Correction commit: `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`.

The correction changed only `tests/browser/identity-safe-career-analytics-audit.cjs`. It now proves Analytics/Trophy revision equality, proves the exact cabinet DOM contains the three-Showdown record, records computed content visibility/bounds/viewport, scrolls the exact stable-profile cabinet into view, then still requires visible rendered `innerText()` to contain `ACROSS 3 SHOWDOWNS`.

The green rerun showed the cabinet initially entirely below the 900px viewport with `content-visibility:auto`; DOM and revision state were correct. Pre-scroll `innerText()` happened to be available in the green rerun, so the evidence does not support claiming `content-visibility:auto` deterministically empties `innerText`. Classification: transient/offscreen rendered-text assertion issue, not a demonstrated Analytics or Trophy Room runtime/cache defect.

No production CSS or runtime was changed to satisfy this failure.

## Exact PR #59 proof

Final exact candidate head:

`a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`

All 13 normal pull-request workflow families passed this exact unchanged head.

Stability PR run `31827326750` passed repository contracts and Chromium Stability. Its strengthened Analytics audit proved the mapped Local Profile at three Showdowns and validated the exact Trophy cabinet after scrolling into view.

Promotion gate then independently verified:

- live `main` remained exact base `8c6fad42e38b4964d848128e40569442c3fa06d5`;
- branch was 35 commits ahead / 0 behind;
- changed-file scope remained exactly the 16 intended files;
- PR was mergeable;
- no submitted reviews existed;
- no unresolved review threads existed;
- no PR comments contained an unresolved concern;
- every required PR workflow belonged to exact head `a0aa98e3...`.

PR #59 was promoted from draft and merged using expected-head protection.

## Exact production proof

Runtime merge:

`c5c7d50cc3a2d9003e057d1813744c877323c068`

The merge has parents exact previous main `8c6fad42e38b4964d848128e40569442c3fa06d5` and validated PR head `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`.

On that exact runtime merge:

- 15 push/deployment workflow runs succeeded;
- failures: 0;
- cancellations: 0;
- Release Integration Burn-In run `31827619182` passed both complete stateful integration repetitions;
- Candidate C Atomic Restore run `31827619121` passed restore contracts and authoritative browser recovery proof;
- Stability run `31827619109` passed `stability-contracts`, `chromium-stability` and `deployed-site-smoke`;
- deployed-site-smoke job `94855938131` passed exact runtime-byte verification, runtime error provenance, Home visual audit, visible Save Library, manager identity linkage, Identity-Safe Career Analytics, crop-safe football visuals, Candidate A export, Candidate B analysis, Candidate C atomic restore/recovery, Installable Offline App/offline boundary and the complete deployed production journey.

The public GitHub Pages site is therefore production-proven for PR #59.

## Permanent product locks

Application milestone remains `v1.3.0 — Recovery & Device Resilience Hardening`. Runtime remains `1.3.0-r1`; previous known-good whole shell remains `1.2.0-r2`; feature release version remains intentionally unassigned.

Stable identity prefixes remain `profile_*`, `save_*`, `season_*`. Display names are labels only.

Post-cutover canonical keys remain exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `careerModeShowdown.activeShowdown` must never become a permanent fourth key.

Candidate A remains non-mutating export, Candidate B remains read-only analysis, and Candidate C remains the only destructive Apply stage using strict exact raw `captureCareerModeRawRestoreSnapshot()` authority and transaction-owned mutation/recovery semantics.

PWA/offline guarantees are unchanged. Performance ceilings remain eager raw <= 165000, eager gzip <= 37500, Reus startup portrait <= 95000, combined first-party startup <= 260000, normal loading minimum 2700 ms and reduced-motion loading 220 ms.

Gameplay and accepted visual behavior remain unchanged.

## Closed boundary

The narrow Identity-Safe Career Analytics candidate is complete. Do not restart it, redesign it, or use this historical branch handoff as permission to begin another roadmap feature.

The authority-seal work after runtime proof is documentation/semantic-contract only. After that seal reaches current `main`, stop unless a later explicit owner instruction authorizes a new bounded candidate.
