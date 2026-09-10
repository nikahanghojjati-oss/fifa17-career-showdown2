# START NEXT SESSION — PR #235 r12 History Convergence → MDP100 Safe Transfer

Date: 2026-09-09 America/New_York
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Transition decision: `TRANSITION`
Operating authority: POS20 over the frozen POS10 safety kernel
Primary owner objective: reach genuine `MDP 100.00/100` first; after MDP100, pivot to genuine `SSJR 100/100`.

This is a continuity/handoff package only. It earns zero MDP credit and zero SSJR credit. Live repository, GitHub Actions, review, deployment, provider and runtime evidence always override this file.

## 1. Mandatory opening sequence for the successor

Open the live repository first and independently resolve current `main`, PR #235, PR #236, their exact live heads, exact-head Actions, review threads/comments, production/runtime state, `MILESTONE_DELIVERY_PROGRESS.json`, `SHARED_SHOWDOWN_JOURNEY_READINESS.json`, `NEXT_TASK.md`, and permanent zero-billing guards. Read this file as stopping-point orientation, not as authority.

Never combine CI or review evidence across different heads. If any head in this handoff has moved, discard the stale status and validate the new exact head. Use expected-head merge protection. Do not weaken any gate to make a PR green.

POS20 has retired handoff-percentage authority. Preserve the categorical continuity decision instead of reviving handoff-proximity percentages inside machine/process authority.

## 2. Permanent owner direction

The main development objective is now explicit:

1. Build all remaining milestone capabilities through their full engineering lifecycle until `MDP 100.00/100` is genuinely earned.
2. Automate every proof that can reasonably be automated before requesting owner physical testing.
3. After MDP100, conduct the bounded real-production two-account/two-device evidence work required to move `SSJR` toward 100.
4. Do not inflate MDP from reusable foundations or partial feature code. Do not award SSJR production credit from browser mocks, emulator-only proof, isolated tests, or deployment existence.
5. Do not spend a session on process/handoff machinery when product work is available. Product progress has priority.

## 3. Permanent product/provider guards

These remain non-negotiable:

- Firebase billing stays permanently OFF.
- Firebase plan stays Spark-only.
- No Blaze requirement, Cloud Functions, Cloud Run, paid provider service, or paid workaround.
- No public discovery, public matchmaking, community/rankings or public rivalry data.
- Exactly two managers.
- Pairing + exact ACTIVE private session must exist before league or club selection.
- Both managers use the same league and different permanent clubs.
- Clubs remain fixed across all seasons of one Showdown.
- Season lengths remain 1 / 3 / 5 / 10.
- Canonical local storage remains `careerModeShowdown.saveLibrary`, `.legacyShowdowns`, `.preferences`; `activeShowdown` is not canonical authority.
- Candidate C remains the only destructive remote-to-local apply path.
- Shared read/projection capabilities must not silently mutate canonical local saves.
- Never put Admin credentials or secrets in client/repository code.
- Preserve exact-account, exact-device, exact-rivalry, exact-session and stable profile/save identity checks.
- Avoid collection-list permissions when deterministic exact document addressing can satisfy the feature.

Canonical scoring remains frozen: Champions League +5, League title +3, Main Domestic Cup +1, performance pair bonus max +1 for 100 League Points / 100 League Goals, awards pair bonus max +1 for Top Scorer / Top Assist. Scoring tiebreak behavior must remain the r11 canonical behavior; do not invent a second scoring policy in History/Statistics.

## 4. Authoritative repaired r11 product state

The r11 Canonical Scoring integration defect discovered during this session was real and has been repaired.

The defect: `productionSharedCanonicalScoring.refresh()` could refresh the r10 Season Commit provider before the cached r10 commit had reached terminal `ACKNOWLEDGED` revision 3. This allowed r11 scoring errors to leak into valid earlier r9/r10 journey states.

Repair: r11 now remains dormant until cached r10 Season Commit authority is already `ACKNOWLEDGED` revision 3, and only then performs fresh provider verification/scoring.

Evidence:

- PR #233 exact hotfix candidate head: `ba8c57604b2e0bd70e7ecc43db13ca676e7aa9a5`
- PR #233 candidate POS20: run #257, fully green including exact-head cognitive seal.
- PR #233 merged with expected-head protection.
- Repaired product `main`: `61e16bb0357352a5c38c02aa072233e851226caf`
- Production application: `v1.9.1`
- Production runtime revision: `1.9.1-r11`
- GitHub Pages run #111: success on repaired main.
- Main POS20 run #259: success on repaired main.
- Release Integration Burn-In run #368: success; both independent stateful integration passes succeeded.

Therefore Canonical Scoring has genuinely completed all six MDP lifecycle stages.

Engineering evidence supports `MDP 65.80/100`.

`SSJR` remains exactly `0/100` because genuine production-two-account evidence has not yet been accepted.

## 5. PR #236 — persist the earned MDP 65.80 accounting

PR: #236 `MDP: record r11 Canonical Scoring integration at 65.80`
Branch: `chore/mdp-r11-integration-accounting`
Exact head at handoff: `39459ed2cacab7bd70d35ca8d3cc5fa049122a52`
Base product main when opened: `61e16bb0357352a5c38c02aa072233e851226caf`

Purpose is evidence/accounting only. It changes no runtime/provider behavior. It records Canonical Scoring as integrated in `MILESTONE_DELIVERY_PROGRESS.json`, records r11 as zero-credit SSJR production evidence in `SHARED_SHOWDOWN_JOURNEY_READINESS.json`, and updates the deterministic MDP anti-inflation contract.

A reviewer correctly found that the first accounting edit accidentally dropped two existing r10 deployment-evidence assertions. Those were restored on the current head:

- preserve the r10 GitHub Pages run #108 assertion;
- preserve the r10 Zero Billing run #8 attempt 2 assertion.

The review thread was replied to with the exact repair/head. Do not merge an older PR #236 head.

At the final handoff check, POS20 #266 on exact head `39459ed2...` had selector, deterministic census, operations, benchmark, INLINE and STATIC green; VISUAL, STORAGE, REMOTE and FULL were still running. This status is intentionally not treated as final. Re-resolve live state.

Immediate handling:

- If exact head `39459ed2...` is still current and POS20 #266 is completely green including the exact-head cognitive seal, re-read reviews/threads. Resolve the fixed thread if still unresolved, then merge PR #236 using expected head `39459ed2cacab7bd70d35ca8d3cc5fa049122a52`.
- After merge, independently validate current main and the deterministic MDP ledger. Because #236 is evidence-only, do not claim a new product runtime revision from this accounting merge.
- If #266 fails, inspect only the exact failed job/log. Do not reuse #261 or older green evidence for the new head.

Until #236 merges, the product evidence has earned 65.80, but default-branch `MILESTONE_DELIVERY_PROGRESS.json` may still physically show the older 59.50 ledger. Preserve this distinction.

## 6. PR #235 — r12 Shared History Convergence implementation track

PR: #235 `SSJR r12: build shared history convergence`
Branch: `feat/ssjr-history-convergence-r12`
Draft: yes
Exact product head frozen for handoff: `1165598f346eb8911b6c954a1820fc194ad42522`
Base at creation: repaired r11 main `61e16bb0357352a5c38c02aa072233e851226caf`
Review threads at last check: none.

POS20 #265 on exact head `1165598f...` completed fully green, including:

- exact selector;
- selected deterministic census;
- operations authority;
- cognitive benchmark;
- STATIC;
- INLINE;
- VISUAL;
- STORAGE;
- REMOTE;
- FULL;
- exact-head cognitive seal.

Do not reuse POS20 #265 if PR #235 head changes, including a rebase/merge from updated main.

### r12 code already built

`js/sharedHistoryConvergence.js`

Deterministic read-only convergence core. It accepts only contiguous terminal seasons starting at season 1, requires r10 terminal `ACKNOWLEDGED` commit authority plus r11 `SCORING_RECONCILED` authority, requires identical accepted `resultsRevision` and `resultsContentHash`, binds exactly two stable manager profile/save identities, preserves canonical r11 scores/winner semantics, derives immutable season history, manager records and trophy attribution, and performs no provider or canonical-local writes.

`js/sparkSharedHistoryConvergence.js`

Read-only provider layer. It verifies exact active rivalry/setup authority and exact manager slots, then asks the already hardened r10 Season Commit and r11 Canonical Scoring providers for exact `season_1 ... season_N` addresses. It exposes no write operation, uses no collection listing, requires no new paid service, and adds no new Firestore Rules write authority.

`tests/contracts/shared-history-convergence-contracts.cjs`

Covers deterministic core plus provider behavior, including contiguous multi-season projection, exact revision/hash convergence, identity binding, perfect-season scoring, nonzero draw behavior, zero-score tiebreak behavior, aggregate manager records, trophy attribution, immutable projection, tamper rejection, score mismatch, revision mismatch, identity collision, skipped-season rejection, upstream provider/session denial, exact-season ordering and no list/write authority.

`POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`

The History Convergence contract is permanently registered with POS20 and owns both the deterministic core and provider file.

`tests/operations/pos20-control-plane.test.mjs`

Updated so POS20 explicitly owns the new History Convergence supplemental contract. The first r12 run caught this closed-list mismatch; it was fixed by extending the explicit ownership list, not by weakening the operations gate.

### Important MDP accounting boundary for History Convergence

Despite substantial r12 code and a fully green exact-head POS20 run, do not award new History Convergence MDP credit yet.

Reason: the capability is not yet end-to-end complete. The production adapter/presentation and browser/adversarial journey are not built. Under MDP-1, reusable/partial implementation cannot independently mark the whole feature implementation/test/regression stages complete.

So the truthful current MDP remains 65.80 evidence-supported, with History Convergence still ledgered at design-only 10% until the remaining end-to-end work is completed and proven.

## 7. Immediate next product task after resolving PR #236

Continue PR #235 and finish History Convergence end-to-end.

First integrate the new accounting main into PR #235 after #236 merges. That branch update creates a new exact head, so run fresh POS20 and never combine #265 with the new head.

Then build the production layer. Expected architecture:

- add a production History Convergence adapter/presenter, likely `js/productionSharedHistoryConvergence.js` or the architecture-consistent equivalent;
- keep it dormant unless exact paired account/device/rivalry/session authority is valid and the required terminal r10/r11 season sources exist;
- use `CareerModeSharedHistoryConvergence` / `CareerModeSparkSharedHistoryConvergence` as the authoritative projection source;
- expose the same accepted projection on both manager contexts;
- reuse the mature read-only analytics engine where appropriate. `analytics.js` already supports `buildCareerAnalytics(history)` with an explicit history argument, so shared history can be supplied without reading/writing Legacy storage;
- do not copy shared history into canonical local `saveLibrary`/`legacyShowdowns`; Local Reconciliation is a later separate capability;
- preserve stable profile IDs for manager records and trophy ownership; do not infer identity from display names;
- avoid a second scoring implementation. Use canonical r11 scoring values already accepted by History Convergence.

Add a two-context browser/adversarial audit for the complete production path. At minimum prove both contexts converge to the same season history, manager records and trophies, plus rejection/dormancy for stale/missing commit, hash/revision mismatch, identity mismatch, session/provider denial and incomplete season sequences. Also prove canonical local storage remains byte-for-byte unchanged by read-only History Convergence.

Only after production code + browser proof + regression correction are complete and a single exact candidate head is fully POS20 green should History Convergence be eligible for its 90% pre-integration MDP state.

History Convergence weight = 5.

- Current design-only contribution = 0.50.
- Fully proven pre-integration 90% contribution = 4.50.
- Therefore candidate MDP target = `69.80/100` (+4.00 from 65.80).
- After expected-head merge + coherent main/product deployment/integration proof, 100% contribution = 5.00.
- Therefore integrated MDP target = `70.30/100` (+0.50 more).

Do not write 69.80 or 70.30 into the ledger until the corresponding lifecycle evidence actually exists.

## 8. r12 publication expectations

Do not publish r12 merely because the current core/provider head is green. First finish the production layer and browser/adversarial proof.

When a complete exact candidate is green, publish one coherent r12 shell following the established r9/r10/r11 pattern:

- runtime current `1.9.1-r12`, previous `1.9.1-r11`;
- service-worker shell includes all required r12 History modules in correct dependency order;
- normal revisioned asset references move coherently to r12;
- update `index.html`, `js/app.js`, `js/menuExperience.js`, `manifest.webmanifest` and release/static contracts only as required by the established release model;
- create `RELEASE_V1.9.1_R12.md` describing Shared History Convergence, its read-only authority, zero-billing behavior and non-goals;
- no new Firestore Rules publication should be invented if the final provider genuinely uses only already-authorized exact reads. If code changes create a new Rules requirement, prove why and keep it Spark/zero-billing;
- run fresh exact-head POS20 after publication. Pre-publication green evidence is stale for the publication head.

Review all threads/comments before ready/merge. Merge only with exact expected-head protection. Then validate main, Pages/runtime readback and any genuinely affected provider authority before awarding product-integration MDP credit.

## 9. MDP staircase to 100

Using the frozen MDP/SSJR weights and assuming each remaining capability completes its full lifecycle, the integrated targets are:

- current evidence-supported Canonical Scoring complete: `65.80`
- History Convergence complete: `70.30`
- Multi-Season complete: `77.50`
- Journey Reconnect complete: `82.00`
- Journey Conflicts complete: `86.50`
- Local Reconciliation complete: `91.00`
- Final Reconciliation complete: `93.70`
- Terminal Close complete: `95.50`
- Physical Journey engineering capability complete: `98.20`
- Stable Journey Release complete: `100.00`

These are integrated-stage targets, not permission to jump the ledger. Each capability must still pass the six-stage lifecycle independently: design, implementation, automated test, defect resolution, regression retest, product integration.

Continue in model/roadmap order unless live evidence reveals a hard dependency requiring a bounded reordering. Do not create sidequests.

## 10. After MDP100: SSJR100

MDP and SSJR remain deliberately separate.

MDP asks: has the feature been designed, built, automated, fixed, retested and integrated?

SSJR asks: has the required real production two-account journey evidence been accepted for the frozen readiness capability?

The owner wants engineering completed first. After MDP reaches genuine 100, pivot decisively to SSJR production acceptance. Design the physical/two-account campaign so one bounded end-to-end journey can prove as many already-built capabilities as possible instead of repeatedly asking the owner to redo the same setup after every runtime revision.

Until then, do not request physical testing while an automatable product/test blocker exists.

No browser mock, emulator proof, Pages deployment, provider contract or isolated two-context test by itself earns `production-two-account` SSJR credit.

## 11. Exact provenance rules

- Live GitHub/provider/deployment evidence overrides handoff text.
- One exact head = one evidence set.
- Never combine green jobs from different heads.
- Any source edit makes prior exact-head candidate evidence stale.
- Inspect the exact failing lane before editing; do not shotgun changes.
- Do not weaken tests/provider checks to manufacture green.
- Preserve existing regression assertions when extending contracts.
- Re-read review threads after the final candidate head.
- Merge with expected-head protection only.
- Main/deployment proof is separate from candidate proof.
- MDP may decrease if a proven regression invalidates a previously credited lifecycle stage.
- Process/handoff work earns zero product credit.

## 12. Continuity branch / clean stopping point

This file lives on continuity branch:

`handoff/pr235-r12-history-mdp100-2026-09-09`

The branch was created from the exact fully-green r12 product head `1165598f346eb8911b6c954a1820fc194ad42522` so the handoff does not mutate PR #235 or invalidate POS20 #265.

Do not merge this continuity branch for product credit. It is orientation/continuity only.

## 13. Immediate successor command

Work genuinely and relentlessly toward `MDP 100.00/100`.

Start by independently resolving live `main`, PR #236 and PR #235. Close PR #236 only from its current exact green head and preserve the r10 deployment-evidence guards. Then bring PR #235 onto the resulting current main, run fresh exact-head validation, finish r12 Shared History Convergence production presentation/browser proof, publish/merge/integrate it only when justified, and continue through the remaining frozen MDP capabilities without sidequests. Keep billing permanently OFF and Firebase Spark-only. Keep SSJR at truthful zero credit until real production-two-account evidence is accepted. After genuine MDP100, pivot to genuine SSJR100.

TRANSITION is intentional here: r11 is repaired and production-proven; r12 has a deterministic + provider implementation and a fully green exact-head checkpoint; the remaining r12 production/UI/browser work is a distinct next engineering unit suitable for a fresh session.
