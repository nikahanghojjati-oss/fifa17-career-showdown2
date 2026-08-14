# Identity-Safe Career Analytics — Active Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Active branch: `agent/identity-safe-career-analytics`
Exact branch base: `8c6fad42e38b4964d848128e40569442c3fa06d5`
Production site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This file is the active evidence trail for the owner-authorized identity-safe longitudinal Career Analytics candidate. It supplements, and does not replace or erase, the existing PR #57/#58 history in `00_CURRENT_HANDOFF.md`. At a coherent promotion or stop boundary, current evidence must be folded back into the rolling handoff/authority without deleting prior failures.

## IMMEDIATE NEXT TASK AFTER FULL STUDY — MANDATORY

This is the first concrete work the next developer must perform after becoming fully caught up. Do not finish the repository study and then infer a new task from the roadmap.

### Phase 1 — bootstrap/study before touching the candidate

Independently verify current repository authority first:

1. fetch live `main`, recent commits and all open PRs;
2. fetch `agent/identity-safe-career-analytics` and record its exact current head;
3. verify whether a PR for this branch now exists; at this handoff boundary no Analytics PR had intentionally been opened;
4. compare the branch against production base `8c6fad42e38b4964d848128e40569442c3fa06d5` and inspect the complete changed-file scope;
5. read, in order:
   - `00_HANDOFF_GOLDEN_RULE.md`;
   - `00_DEVELOPER_START_HERE.md`;
   - `00_CURRENT_HANDOFF.md`;
   - `PROJECT_STATE.md`;
   - `NEXT_TASK.md`;
   - `POST_V1_ROADMAP_EXECUTION.md`;
   - this active handoff;
6. inspect current source/history only as needed to verify the already implemented Analytics candidate rather than restarting its design.

Only after those steps are complete should active engineering work begin.

### Phase 2 — FIRST ENGINEERING TASK: review and test the existing Analytics candidate

The immediate task is not to invent another feature and not to rewrite Career Analytics from scratch.

The first engineering task is to deeply review and validate the already-written identity-safe Career Analytics candidate before any PR promotion.

Review these files as the primary candidate surface:

- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `tests/contracts/statistics-fixtures.cjs`
- `tests/contracts/identity-safe-career-analytics-contracts.cjs`
- `tests/browser/identity-safe-career-analytics-audit.cjs`
- `tests/support/run-contract-suite.cjs`
- `.github/workflows/validate-stability-lane.yml`
- `00_DEVELOPER_START_HERE.md`
- `NEXT_TASK.md`
- `POST_V1_ROADMAP_EXECUTION.md`
- `tests/contracts/cloud-foundation-contracts.cjs`
- `tests/contracts/release-authority-coherence.cjs`
- this handoff

The review must specifically prove or disprove all of the following before opening a PR:

1. longitudinal manager aggregation is keyed only by valid stable `profile_*` identity, never display-name equality;
2. two distinct same-name profiles remain distinct career identities;
3. one explicitly reused profile across Saves aggregates into one career identity;
4. unresolved historical roles stay unresolved and cannot leak into an identified manager row by visible name;
5. unresolved roles are excluded only from identity-dependent manager totals/leaderboards, while identity-independent Showdown/Season totals and records remain complete;
6. Local Profile `displayName` affects presentation only and never becomes identity authority;
7. Rivalry Analytics remains Showdown-scoped and unchanged in semantics;
8. Analytics calculation cache, Career Statistics render cache and Trophy Room render cache all refresh coherently after explicit identity mapping changes;
9. the deterministic fixtures actually exercise stable identities rather than accidentally preserving old name-grouping assumptions;
10. the Chromium fixture is valid against the real page/runtime and proves Career Statistics plus Trophy Room behavior, including unresolved-to-mapped refresh;
11. semantic-coherence regular expressions in release/cloud contracts match the intended new authorization state without accidentally weakening unrelated boundaries;
12. Candidate A/B/C, Save Library mutation authority, storage/recovery, offline/PWA behavior, gameplay/scoring and performance ceilings remain untouched except for the intended read-only Analytics consumption path.

If this source review finds an actual defect, correct only that defect, add or strengthen regression evidence, update this handoff with the exact finding/root cause, and then re-review the corrected head.

If the source review finds no defect, do not make speculative cleanup changes merely to create activity. Proceed directly to the next gate below.

### Phase 3 — SECOND TASK: open the draft PR and obtain exact-head validation

After the source/test review is complete:

1. open a draft PR from `agent/identity-safe-career-analytics` to `main`;
2. freeze one exact candidate SHA;
3. run all normal PR workflow families against that exact SHA;
4. ensure the permanent repository contract suite includes `identity-safe-career-analytics-contracts.cjs`;
5. ensure the Stability Chromium lane runs `identity-safe-career-analytics-audit.cjs`;
6. record every failure in this handoff with exact SHA, run/job, failure class, root cause and correction;
7. if any correction moves the branch head, full exact-head proof must be obtained again. Never transfer green evidence from an older SHA to a newer candidate.

The success condition for this phase is one exact final candidate head with all normal PR workflow families green and no known unreviewed source/test issue.

### Phase 4 — THIRD TASK: promotion gate and exact-head merge

Only after Phase 3 is green:

1. re-fetch live `main` and verify drift from the expected base;
2. verify branch ahead/behind state and exact changed-file scope;
3. verify PR mergeability;
4. inspect submitted reviews;
5. inspect unresolved review threads;
6. merge only the exact candidate head that received the complete green proof.

Do not merge a moved or unproven head.

### Phase 5 — FOURTH TASK: production and deployed-Pages proof

After merge, validate the exact `main` merge through all permanent push/deployment workflow families.

Production proof must include the existing protected gates plus the new identity-safe Career Analytics browser audit:

- exact runtime byte verification;
- runtime error provenance;
- Home visual audit;
- visible Save Library audit;
- manager identity linkage audit;
- identity-safe Career Analytics audit;
- licensed/crop-safe football-photo audit;
- Candidate A backup export;
- Candidate B read-only import analysis;
- Candidate C atomic restore/recovery;
- Installable Offline App/offline boundary;
- complete production journey.

The success condition is exact-merge green workflow/deployment proof and successful deployed Pages Analytics evidence. Do not call the runtime production-proven before this is complete.

### Phase 6 — FIFTH TASK: smallest authority seal, then stop

Only after exact runtime production proof:

1. update `PROJECT_STATE.md` from the old production defect to the exact shipped Analytics state;
2. close this candidate in `NEXT_TASK.md`;
3. advance the roadmap from `AUTHORIZED / IN PROGRESS` to the proven completed classification;
4. fold this handoff's exact commits, failures, PR evidence, merge SHA and deployment proof into `00_CURRENT_HANDOFF.md` without erasing PR #57/#58 history;
5. advance semantic contracts from candidate truth to production truth;
6. preserve Cloud Readiness/Cloud Backup boundaries and all recovery/PWA locks;
7. keep the feature release version intentionally unassigned unless the owner explicitly authorizes a version change;
8. ensure the resulting handoff again contains a new explicit `IMMEDIATE NEXT TASK AFTER FULL STUDY` section under the permanent golden rule;
9. stop before another substantial roadmap candidate.

### Explicit do-not-start boundary

While completing the tasks above, do not begin backup portability, generic profile editing/CRUD, broader Analytics 2.0 presentation expansion, Legacy expansion, cloud/accounts/sync, gameplay/scoring changes, global visual redesign, Smart Back redesign, music/loading redesign or release-version assignment.

The current work is review, validation, promotion and production proof of the already implemented narrow Analytics candidate.

## Owner authorization

On 2026-08-14 ET the owner instructed the developer to correct inconsistencies in the project record and then work independently according to the roadmap toward the next step with maximum attention to detail and accuracy.

This is treated as explicit authorization for the roadmap's smallest source-supported next product candidate: narrow identity-safe longitudinal Career Analytics and its Trophy Room consumption. It is not authorization for unrelated roadmap work.

Hard exclusions remain:

- no cloud, accounts, authentication or synchronization;
- no backup-envelope redesign;
- no generic profile CRUD or profile editing;
- no gameplay or scoring changes;
- no global visual redesign;
- no Smart Back redesign;
- no release/version assignment;
- no weakening of Candidate A/B/C, PWA/offline or validation guarantees.

## Independent repository bootstrap

Before implementation, live repository authority was independently fetched.

Verified live `main`:

`8c6fad42e38b4964d848128e40569442c3fa06d5`

Recent history confirmed the preceding authority-seal merge `ab5f4082c520a464a894318bfed1e0511763805f` and runtime identity-linkage feature merge `95e98c13bbb4cac485531565c3577ae31286d0af`.

Open PRs were only historical drafts #37 and #35. Neither was used as a baseline.

The six current authority documents were read in required order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `POST_V1_ROADMAP_EXECUTION.md`

Current source remains implementation authority.

## Record inconsistency found and corrected on the branch

`00_DEVELOPER_START_HERE.md` was partially stale relative to the newer authority chain. Its sixty-second dependency list stopped at PR #53 and its development-boundary wording still treated cross-Save/profile linkage as future work.

Current source, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md` and `POST_V1_ROADMAP_EXECUTION.md` establish that PR #57 shipped the explicit cross-Save/historical manager identity-linkage foundation and that merge `95e98c13bbb4cac485531565c3577ae31286d0af` is production-proven.

The branch now corrects that bootstrap inconsistency without inventing a release version. `NEXT_TASK.md` and the roadmap also record the owner's later explicit Analytics authorization while continuing to distinguish branch status from production truth.

## Source reconstruction and root cause

Production `js/analytics.js` had two distinct longitudinal authority defects:

1. `getOrCreateManagerStats()` keyed career managers by `analyticsNormalizeName(name)`, so different stable `profile_*` identities with equal visible labels collapsed into one career row.
2. the Career Analytics and presentation render cache key used Legacy revision plus only active Showdown ID/timestamp, so an active completed identity remap could leave derived identity output stale when the Showdown timestamp itself did not change.

Trophy Room consumes the same Career Analytics manager rows and manager leader records, so it inherited the longitudinal identity defect.

The source-grounded identity semantics already shipped by PR #57 are sufficient for a correct narrow solution:

- stable `profile_*` refs are authoritative when present;
- same visible names never imply identity equality;
- explicit reuse of one profile across Saves means one longitudinal career identity;
- historical roles may legitimately have null/unresolved identity;
- unresolved history must not be guessed from display labels;
- Rivalry Analytics is scoped to one Showdown's roles and does not require cross-history identity.

## Chosen Analytics semantics

The candidate intentionally separates identified longitudinal manager output from identity-independent historical totals/records.

Identified manager rows, manager cabinets and manager leaderboards:

- key only by valid stable `profile_*` identity;
- aggregate one explicitly reused profile across multiple Saves;
- preserve same-name distinct profiles as separate identities;
- use Local Profile `displayName` as the current identified-career label when the runtime profile registry is safely readable;
- fall back to the Showdown label only as presentation, never as an identity key;
- exclude unresolved historical roles rather than assigning them by name.

Unresolved historical roles are excluded from identified manager totals/leaderboards until explicitly mapped. This is deliberate identity honesty, not data loss.

Identity-independent output remains complete:

- completed Showdown count;
- seasons played;
- total Showdown points;
- total trophies;
- Showdown/season-scoped records such as highest Season score, highest league points/goals and biggest Showdown margin.

Career Statistics and Trophy Room visibly report how many historical manager roles remain unresolved and explain that those roles are excluded from longitudinal manager totals/leaderboards until explicitly mapped.

Rivalry Analytics remains label-scoped and otherwise unchanged.

## Cache / refresh semantics

`js/analytics.js` now exports one shared `getCareerAnalyticsRevisionKey()`.

The key includes:

- current Legacy storage revision; and
- the completed active Showdown's ID, revision timestamp and both stable manager profile refs (or explicit `unresolved` markers).

Career Statistics and Trophy Room use the same revision key, so an identity mapping change invalidates both derived calculation and presentation caches coherently.

## Implementation and authority-alignment commits so far

All writes are on `agent/identity-safe-career-analytics`; production `main` is unchanged.

Runtime and regression layer:

- `1bc5bec1246c79b2762a80466405e7498ec6668b` — make Career Analytics stable-profile keyed, preserve unresolved identity explicitly and centralize identity-aware cache revision.
- `74c46984e6896cd89aed074a61267dd10f7eb16a` — make Career Statistics consume the shared revision and surface unresolved identity honestly.
- `a58ad0f1b64e136eccd74a6cdb6335e3af887d67` — keep Trophy Room manager cabinets/leaderboards identity-coherent while preserving overall records.
- `e18c5130fd172d0bcf96f28d4f348fb9e4103d34` — migrate legacy Statistics fixtures from implicit name grouping to explicit stable profile identities without changing established scoring/trophy assertions.
- `a7441649624e951209909549d7ea8086bf194b48` — add deterministic identity-safe Career Analytics contracts for same-name separation, explicit reuse, unresolved history, season-record completeness and cache invalidation.
- `2ba87beec794788a00e54005e80baa7da1053daa` — wire the new contract into the permanent repository suite.
- `b73840ee91e73964ca15cc967f0b0da9d93b7ee3` — add Chromium identity-safe Career Analytics regression covering Career Statistics, explicit historical mapping and Trophy Room.
- `63d0e1f373e010a8fd96f12a0a5597fc28d24dea` — integrate local and deployed Analytics browser evidence into the existing Stability workflow.

Record / semantic authority layer:

- `e6381fdcbd7e76fedd9d80e28fed18129ea971dc` — correct `00_DEVELOPER_START_HERE.md` so the completed chain includes PR #57 and distinguish production truth from the active Analytics branch.
- `298710c8e7474da696cbb28bb3ae13a6afaa7455` — advance `NEXT_TASK.md` from pre-authorization future-candidate wording to the exact owner-authorized Analytics scope.
- `3e0ca9ec22bb9b7e85fc524fc9cd6cd421a48bf0` — advance roadmap classification to `AUTHORIZED / IN PROGRESS` while keeping production, cloud and release identity separate.
- `5204b370dfa57e335cbbf17cc403d60b833f3557` — advance the cloud coherence contract without weakening Cloud Readiness/Backup gates.
- `538765e14d5fff8f9e09362b0fc8777597d7e121` — advance release-authority coherence to protect the new authorization state, PR #57 bootstrap correction and cloud boundary.
- `6957e5a44b2f19890dd8b717f69e01fcb2582ea3` — record the branch authority-alignment checkpoint before promotion work.
- `56d677dfd3493a612c6407b93e588558d2d70f5e` — strengthen `00_HANDOFF_GOLDEN_RULE.md` so every future handoff must name the concrete immediate next task after repository study rather than only broad roadmap direction.

## Operational note

The local `gh` CLI is not installed in the current execution environment, so the normal local `yeet` publish path cannot be used. No repository action was faked or delegated to the owner. The connected GitHub capability supports exact branch creation, scoped file writes, PR creation, workflow/review inspection and expected-head merge, so repository work used connector-native GitHub operations.

## Quality-first stop and tool-routing mistakes

After the coherent candidate branch had reached head `6957e5a44b2f19890dd8b717f69e01fcb2582ea3`, two consecutive non-mutating branch-creation calls were issued accidentally while the intended next action was PR creation.

Failure 1:

- attempted `create_branch` with an invalid mutually exclusive parameter combination;
- connector returned HTTP 400 / `INVALID_ARGUMENT` requiring exactly one source selector;
- no repository ref or file changed.

Failure 2:

- a second accidental `create_branch` call targeted the already-existing `agent/identity-safe-career-analytics` ref;
- connector returned HTTP 422 / `Reference already exists`;
- no repository ref or file changed.

These are operational/tool-routing mistakes, not runtime, source, CI or data-integrity failures. However, `00_HANDOFF_GOLDEN_RULE.md` explicitly treats repeated tool-routing mistakes as evidence that the current session should stop at the nearest coherent repository boundary rather than continue into promotion/merge work.

Therefore this session deliberately stops before draft PR creation. No PR has been intentionally opened, no merge attempted, `main` remains untouched, and no CI result is being claimed.

## Validation status at handoff

Validation is not yet claimed green.

The record inconsistency and known pre-authorization semantic-contract wording are corrected on the branch. Deterministic and Chromium regression code is present, but no PR workflow evidence has yet been collected for the current candidate head.

The next developer must independently verify repository state before trusting any SHA in this handoff.

The authoritative immediate work sequence is the `IMMEDIATE NEXT TASK AFTER FULL STUDY — MANDATORY` section near the top of this file. In condensed form: independently reconstruct authority, deeply review and test the existing candidate, open a draft PR only after that review, obtain exact-head PR proof, promote only the exact proven head, obtain exact production/deployed proof, seal authority, then stop.

Do not assign a release version merely because this functionality ships.
