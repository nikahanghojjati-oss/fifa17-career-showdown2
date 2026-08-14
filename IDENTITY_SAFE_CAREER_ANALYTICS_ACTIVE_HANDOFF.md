# Identity-Safe Career Analytics — Active Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Active branch: `agent/identity-safe-career-analytics`
Exact branch base: `8c6fad42e38b4964d848128e40569442c3fa06d5`
Production site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This file is the active evidence trail for the owner-authorized identity-safe longitudinal Career Analytics candidate. It supplements, and does not replace or erase, the existing PR #57/#58 history in `00_CURRENT_HANDOFF.md`. At a coherent promotion or stop boundary, current evidence must be folded back into the rolling handoff/authority without deleting prior failures.

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

## Record inconsistency found

`00_DEVELOPER_START_HERE.md` is partially stale relative to the newer authority chain. Its sixty-second dependency list still stops at PR #53 and its development-boundary wording still treats cross-Save/profile linkage as future work.

Current source, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md` and `POST_V1_ROADMAP_EXECUTION.md` establish that PR #57 shipped the explicit cross-Save/historical manager identity-linkage foundation and that merge `95e98c13bbb4cac485531565c3577ae31286d0af` is production-proven.

This inconsistency must be corrected without inventing a release version.

## Source reconstruction and root cause

Current `js/analytics.js` had two distinct longitudinal authority defects:

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

## Implementation commits so far

All writes are on `agent/identity-safe-career-analytics`; production `main` is unchanged.

- `1bc5bec1246c79b2762a80466405e7498ec6668b` — make Career Analytics stable-profile keyed, preserve unresolved identity explicitly and centralize identity-aware cache revision.
- `74c46984e6896cd89aed074a61267dd10f7eb16a` — make Career Statistics consume the shared revision and surface unresolved identity honestly.
- `a58ad0f1b64e136eccd74a6cdb6335e3af887d67` — keep Trophy Room manager cabinets/leaderboards identity-coherent while preserving overall records.
- `e18c5130fd172d0bcf96f28d4f348fb9e4103d34` — migrate legacy Statistics fixtures from implicit name grouping to explicit stable profile identities without changing established scoring/trophy assertions.
- `a7441649624e951209909549d7ea8086bf194b48` — add deterministic identity-safe Career Analytics contracts for same-name separation, explicit reuse, unresolved history, season-record completeness and cache invalidation.
- `2ba87beec794788a00e54005e80baa7da1053daa` — wire the new contract into the permanent repository suite.
- `b73840ee91e73964ca15cc967f0b0da9d93b7ee3` — add Chromium identity-safe Career Analytics regression covering Career Statistics, explicit historical mapping and Trophy Room.
- `63d0e1f373e010a8fd96f12a0a5597fc28d24dea` — integrate local and deployed Analytics browser evidence into the existing Stability workflow.

## Operational note

The local `gh` CLI is not installed in the current execution environment, so the normal local `yeet` publish path cannot be used. No repository action was faked or delegated to the owner. The connected GitHub capability supports exact branch creation, scoped file writes, PR creation, workflow/review inspection and expected-head merge, so work is proceeding entirely through repository-native GitHub operations.

## Validation status

Validation is not yet claimed green.

The candidate still requires:

- correction of current authority/documentation inconsistency;
- advancement of stale semantic contracts that still encode the pre-authorization Analytics state;
- draft PR creation;
- all normal PR workflow families on one exact final candidate SHA;
- main-drift, changed-file, mergeability, review and unresolved-thread promotion checks;
- exact expected-head merge only if all gates are green;
- all permanent production/push workflow families on the exact merge;
- deployed Pages proof including the new identity-safe Career Analytics browser audit;
- final authority seal only after runtime production proof.

No failed validation has occurred yet in this candidate. Any failure must be recorded here with its exact SHA/job/root cause and retained after correction.
