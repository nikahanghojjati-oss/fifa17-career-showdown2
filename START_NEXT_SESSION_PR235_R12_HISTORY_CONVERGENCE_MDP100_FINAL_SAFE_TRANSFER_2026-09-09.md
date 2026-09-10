# START NEXT SESSION — PR #235 r12 History Convergence → MDP100 FINAL Safe Transfer

Date: 2026-09-09 America/New_York
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Transition decision: `TRANSITION`
Operating authority: POS20 over the frozen POS10 safety kernel
Owner priority: reach genuine `MDP 100.00/100` first; after MDP100, pivot to genuine `SSJR 100/100`.

This is the final successor handoff for this session and supersedes the earlier non-final handoff on the continuity branch. It earns zero product credit. Live GitHub, deployment, provider, runtime, MDP and SSJR evidence always override this document.

## 1. Mandatory successor opening sequence

Open the live repository and independently resolve current `main`, PR #235, its exact head, exact-head Actions, review threads/comments, production/runtime state, `MILESTONE_DELIVERY_PROGRESS.json`, `SHARED_SHOWDOWN_JOURNEY_READINESS.json`, `NEXT_TASK.md`, and permanent zero-billing guards before editing.

The last known main at final handoff is:

`32723b900dee45f689391908dc976f0ce5d06dd5`

Do not assume it is still current. If live state moved, use live state.

Never combine CI/review/deployment evidence across heads. Any source edit, merge-main/rebase, or publication commit creates a new exact head and requires fresh evidence. Merge only with expected-head protection. Do not weaken gates to manufacture green.

POS20 retired handoff-percentage authority. Preserve the categorical `TRANSITION` decision; do not revive handoff-proximity percentage as machine/process authority.

## 2. Current milestone truth

`MDP = 65.80/100` is now persisted on default-branch main.

`SSJR = 0/100` remains correct.

Main `MILESTONE_DELIVERY_PROGRESS.json` at `32723b900dee45f689391908dc976f0ce5d06dd5` was directly verified after the accounting merge and contains:

- `currentScore: 65.8`
- `formattedScore: 65.80/100`
- 20 total frozen capabilities
- 11 fully lifecycle-delivered capabilities
- 9 design-only remaining capabilities
- Canonical Scoring = 100% integrated, weighted contribution 7
- History Convergence = design-only 10%, weighted contribution 0.5

Do not award History Convergence credit merely because substantial r12 code exists. Its complete production/browser lifecycle is not yet finished.

## 3. r11 Canonical Shared Scoring is repaired and fully integrated

A real post-publication r11 defect was found during this session: `productionSharedCanonicalScoring.refresh()` could refresh the r10 Season Commit provider before cached r10 authority had reached terminal `ACKNOWLEDGED` revision 3, allowing r11 scoring errors to leak into valid earlier r9/r10 journey states.

The repair keeps r11 dormant until cached r10 Season Commit authority is already terminal, then performs fresh provider verification and scoring.

Exact evidence:

- PR #233 hotfix candidate: `ba8c57604b2e0bd70e7ecc43db13ca676e7aa9a5`
- POS20 #257: fully green including exact-head cognitive seal
- PR #233 merged with expected-head protection
- repaired product main after #233: `61e16bb0357352a5c38c02aa072233e851226caf`
- application `v1.9.1`
- runtime `1.9.1-r11`
- GitHub Pages #111: success
- main POS20 #259: success
- Release Integration Burn-In #368: success on both independent stateful passes

That evidence legitimately completed all six MDP lifecycle stages for Canonical Scoring.

## 4. PR #236 accounting is finished and merged

PR #236: `MDP: record r11 Canonical Scoring integration at 65.80`

Final candidate head:

`39459ed2cacab7bd70d35ca8d3cc5fa049122a52`

A reviewer caught a genuine regression in the first accounting contract edit: two pre-existing r10 deployment-evidence assertions had been dropped. They were restored rather than weakening the contract:

- r10 GitHub Pages run #108 evidence assertion
- r10 Zero Billing run #8 attempt 2 evidence assertion

The review thread was replied to and resolved.

POS20 #266 on exact head `39459ed2...` completed fully green, including FULL and the exact-head cognitive seal.

PR #236 was then squash-merged with expected-head protection to:

`32723b900dee45f689391908dc976f0ce5d06dd5`

The default-branch MDP ledger was directly read after merge and confirmed at `65.80/100`. This accounting merge did not introduce a new product runtime; production remains `v1.9.1 / 1.9.1-r11` until a genuine r12 product publication occurs.

At the final session cutoff, the push-triggered POS20 run #267 on main `32723b...` had selector, deterministic census, operations, benchmark, INLINE and STATIC green; VISUAL, STORAGE, REMOTE and FULL were still in progress. Several other normal main-push workflows were also still running/queued. Do not infer their final result from this handoff. Re-resolve main Actions immediately on entry. If a failure exists, inspect only that exact main/head failure before continuing.

## 5. PR #235 — active r12 Shared History Convergence build

PR #235: `SSJR r12: build shared history convergence`
Branch: `feat/ssjr-history-convergence-r12`
State: draft
Exact frozen product head at handoff:

`1165598f346eb8911b6c954a1820fc194ad42522`

PR #235 had no review threads at the last explicit review check.

POS20 #265 on exact head `1165598f...` completed fully green across selector, deterministic census, operations, benchmark, STATIC, INLINE, VISUAL, STORAGE, REMOTE, FULL and exact-head cognitive seal.

Important: PR #235 was validated before PR #236 merged. It is therefore now behind current main `32723b...`. Before extending r12, bring current main into PR #235 using the repository's normal safe branch-update method. That creates a new exact PR head, so POS20 #265 becomes historical evidence only. Run fresh exact-head validation and never combine #265 with later-head jobs.

### r12 implementation already present

`js/sharedHistoryConvergence.js`

Deterministic read-only convergence core. It accepts only contiguous terminal seasons beginning at season 1; requires terminal r10 `ACKNOWLEDGED` commit authority plus r11 `SCORING_RECONCILED` authority; cross-checks exact `resultsRevision` and `resultsContentHash`; binds exactly two stable manager profile/save identities; preserves canonical r11 score/winner semantics; derives immutable season history, manager records and trophy attribution; and performs no provider or canonical-local writes.

`js/sparkSharedHistoryConvergence.js`

Read-only provider layer. It verifies exact active rivalry/setup and manager-slot authority, then calls the already hardened r10 Season Commit and r11 Canonical Scoring providers for exact `season_1 ... season_N` addresses. It exposes no write operation, performs no collection listing, requires no paid provider service, and adds no new Firestore write authority.

`tests/contracts/shared-history-convergence-contracts.cjs`

Covers deterministic core and provider behavior: contiguous multi-season projection; exact revision/hash convergence; stable identity binding; canonical score preservation; perfect season; nonzero draw semantics; zero-score tiebreak semantics; aggregate manager records; trophy attribution; deep immutability; tamper rejection; scoring/revision mismatch; identity collision; skipped-season rejection; upstream provider/session denial; exact-season ordering; and no list/write authority.

`POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`

History Convergence is permanently registered as a blocking POS20 supplemental contract and owns the core/provider surfaces.

`tests/operations/pos20-control-plane.test.mjs`

Explicitly owns the new History Convergence supplemental contract. The first r12 run correctly caught the missing closed-list ownership; it was fixed by extending the explicit ownership list rather than weakening POS20.

## 6. Immediate next product task

Work genuinely toward MDP100, not process churn.

First re-resolve current main push validation for `32723b...`. Then update PR #235 from current main and validate that new exact head. If clean, continue the unfinished History Convergence lifecycle.

Build the production History Convergence layer, likely `js/productionSharedHistoryConvergence.js` or the architecture-consistent equivalent. It should remain dormant unless exact paired account/device/rivalry/session authority is valid and required terminal r10/r11 sources exist. Use `CareerModeSharedHistoryConvergence` and `CareerModeSparkSharedHistoryConvergence` as the authoritative projection source.

Expose the same accepted shared projection in both manager contexts. Reuse the mature read-only analytics engine where appropriate: `analytics.js` already supports `buildCareerAnalytics(history)` with an explicit history argument, allowing shared history to feed manager records/trophy/statistics presentation without treating local Legacy storage as remote truth.

Do not copy shared history into `careerModeShowdown.saveLibrary` or `.legacyShowdowns`. Local Reconciliation is a later independent capability. Do not infer identity from display names; preserve stable profile IDs/save IDs. Do not implement a second scoring policy; consume the already accepted canonical r11 scoring values.

Add a production two-context browser/adversarial audit that proves both contexts converge on identical season history, manager records and trophy attribution. Also prove fail-closed/dormant behavior for missing or stale terminal commit, hash/revision mismatch, identity mismatch, provider/session denial and incomplete season sequences, plus byte-for-byte canonical local-storage non-mutation.

Only after production implementation + automated browser/adversarial proof + defect resolution/regression retest are complete on one exact head may History Convergence move to its 90% pre-integration MDP state.

## 7. History Convergence MDP targets

History Convergence frozen milestone weight = 5.

Current design-only contribution = 0.50.

A fully proven pre-integration 90% state contributes 4.50. From current MDP 65.80, that would make the candidate target:

`69.80/100`

Only after expected-head merge plus coherent main/runtime/deployment integration proof does History reach 100%, contribution 5.00, producing:

`70.30/100`

These are target calculations, not permission to edit the ledger early.

## 8. r12 publication gate

Do not publish r12 merely because the existing core/provider head is green. Finish the production layer and browser/adversarial proof first.

When a complete exact candidate is green, publish one coherent r12 shell using the established release pattern:

- current runtime `1.9.1-r12`
- previous runtime `1.9.1-r11`
- service-worker shell includes required r12 History modules in dependency-safe order
- normal revisioned asset references move coherently to r12
- update `index.html`, `js/app.js`, `js/menuExperience.js`, `manifest.webmanifest` and release/static contracts only as required by the established release model
- create `RELEASE_V1.9.1_R12.md`
- do not invent a Firestore Rules deployment if exact existing read authority is sufficient; if a genuine new Rules requirement emerges, justify it and keep Spark/zero-billing
- after publication, run fresh exact-head POS20; pre-publication green evidence is stale for the publication head
- re-read all review threads/comments before ready/merge
- merge only with exact expected-head protection
- validate post-merge main, Pages/runtime readback and genuinely affected provider authority before awarding product-integration MDP credit

## 9. MDP staircase to genuine 100

Integrated-stage targets from the frozen SSJR/MDP weights:

- current: `65.80`
- History Convergence complete: `70.30`
- Multi-Season complete: `77.50`
- Journey Reconnect complete: `82.00`
- Journey Conflicts complete: `86.50`
- Local Reconciliation complete: `91.00`
- Final Reconciliation complete: `93.70`
- Terminal Close complete: `95.50`
- Physical Journey engineering capability complete: `98.20`
- Stable Journey Release complete: `100.00`

Each capability must independently complete all six MDP lifecycle stages: design, implementation, automated test, defect resolution, regression retest, product integration. Reusable predecessor code and partial implementation do not automatically complete a stage. A proven regression can reduce MDP.

Continue in frozen roadmap/dependency order unless live evidence proves a bounded dependency-driven reorder is necessary. Avoid sidequests.

## 10. After MDP100 — pivot to SSJR100

MDP and SSJR remain separate by design.

MDP asks whether each feature has been designed, built, automated, fixed, retested and integrated.

SSJR asks whether the required genuine production two-account evidence has been accepted for the readiness capabilities.

The owner direction is to finish engineering maturity first. After genuine MDP100, pivot decisively to SSJR100. Design the real two-account/two-device campaign so a bounded end-to-end physical journey can prove as many already-built capabilities as possible rather than making the owner repeat the same workflow after every runtime revision.

Until then, do not request physical testing while an automatable product or test blocker exists.

Browser mocks, emulator tests, CI, Pages deployment and provider-contract proof do not by themselves earn the `production-two-account` SSJR layer.

## 11. Permanent safety/product guards

- billing permanently OFF
- Firebase Spark-only
- no Blaze / Cloud Functions / Cloud Run / paid workaround
- no public discovery, matchmaking, rankings or community data
- exactly two managers
- pairing + exact ACTIVE private session before league/clubs
- same league, different permanent clubs
- clubs fixed across every season in the Showdown
- season lengths 1 / 3 / 5 / 10
- canonical local storage remains `careerModeShowdown.saveLibrary`, `.legacyShowdowns`, `.preferences`
- `activeShowdown` is not canonical authority
- Candidate C only for destructive remote-to-local apply
- shared read/projection work must not silently mutate local canonical saves
- no Admin credentials/secrets in client/repository
- preserve exact account/device/rivalry/session and stable profile/save identity checks
- prefer exact document addressing over collection-list authority

Canonical scoring is frozen: Champions League +5; League +3; Main Domestic Cup +1; performance pair bonus max +1 for 100 League Points / 100 League Goals; awards pair bonus max +1 for Top Scorer / Top Assist. Preserve r11 canonical winner/tiebreak behavior.

## 12. Provenance discipline

Live source and live provider/deployment evidence override this file.

One exact head = one evidence set. Never stitch green lanes from different heads. Any source change invalidates prior candidate proof for publication. Inspect the exact failed job before editing. Do not shotgun changes. Do not weaken product/provider/operations gates. Preserve existing regression assertions when extending contracts. Review conversations must be clean on the final head. Candidate proof and post-merge production proof are separate. Process/handoff artifacts earn zero MDP and zero SSJR credit.

## 13. Continuity location

Continuity branch:

`handoff/pr235-r12-history-mdp100-2026-09-09`

This final file is intentionally on that continuity branch so creation of the handoff does not mutate PR #235 and does not invalidate r12 POS20 #265.

This continuity branch/file is not product work and should not be merged for product credit.

## 14. Immediate successor command

Open this handoff first, then independently verify live authority. Work genuinely and relentlessly toward `MDP 100.00/100`. Start from current main `32723b900dee45f689391908dc976f0ce5d06dd5` and draft PR #235, reconcile the accounting merge into the r12 branch, validate the resulting exact head, finish Shared History Convergence production presentation/browser proof and coherent r12 integration, then continue through the remaining frozen MDP capabilities without sidequests. Keep billing permanently OFF and Firebase Spark-only. Keep SSJR truthful at zero until real production-two-account evidence is accepted. Once genuine MDP100 is reached, pivot to genuine SSJR100.

Transition is intentional and clean: r11 is repaired and fully integrated; MDP 65.80 is persisted on main; r12 History Convergence already has a deterministic + read-only provider foundation with an exact-head fully green POS20 checkpoint; the remaining production/presentation/browser lifecycle is a distinct next engineering unit for the successor session.
