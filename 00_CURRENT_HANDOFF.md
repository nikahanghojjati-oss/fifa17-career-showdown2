# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns implementation authorization unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and frozen proof documents remain evidence for the release/candidate they name.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After independently fetching live `main`, recent commits and open PRs and reading the permanent authority files:

1. verify live production and current authority still agree that Identity-Safe Career Analytics is shipped and production-proven;
2. check `NEXT_TASK.md` and later owner instructions for a genuinely newer authorized bounded candidate;
3. if none exists, make no runtime mutation and preserve the clean stop boundary;
4. when a later owner request does exist, inspect only the relevant current source/history, classify the smallest correct scope, and implement only that explicit request without reopening solved architecture.

Do not autonomously choose backup portability, profile editing, broader Analytics 2.0, Legacy/Achievements, optional content, cloud or another roadmap item merely because the prior dependency is complete.

## Current production authority

Application milestone remains `v1.3.0 — Recovery & Device Resilience Hardening`.
Installable Offline App runtime remains `1.3.0-r1`.
Previous known-good whole shell remains `1.2.0-r2`.
Feature release version remains intentionally unassigned.

Current production runtime feature merge:

`c5c7d50cc3a2d9003e057d1813744c877323c068`

That merge shipped PR #59, Identity-Safe Career Analytics / Trophy Room longitudinal consumption, without changing the application or Service Worker release identity.

## Completed manager identity dependency chain

The Local Profiles / Save Library and manager-identity chain remains production-proven:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53;
5. explicit cross-Save/historical manager identity linkage foundation — PR #57, merge `95e98c13bbb4cac485531565c3577ae31286d0af`;
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59, merge `c5c7d50cc3a2d9003e057d1813744c877323c068`.

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

Installable Offline App runtime remains `1.3.0-r1`; previous whole shell remains `1.2.0-r2`.

Locked performance ceilings remain eager raw <= 165000, eager gzip <= 37500, Reus portrait <= 95000, combined first-party startup <= 260000, normal loading minimum 2700 ms and reduced-motion loading 220 ms.

Gameplay/scoring and accepted FIFA 17-inspired presentation remain unchanged.

## Clean stop

The Identity-Safe Career Analytics workstream is complete, merged, deployed and production-proven. This authority seal exists only to make repository current-state documents and semantic contracts agree with that proven runtime.

No new substantial runtime/product candidate is automatically authorized. Future work requires `NEXT_TASK.md` or a later explicit owner instruction.
