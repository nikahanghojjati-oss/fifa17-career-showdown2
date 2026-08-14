# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns implementation authorization unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and production-proof documents remain frozen evidence for the release they name.

## Active owner-authorized implementation

Owner instruction received 2026-08-14 ET explicitly authorizes the next bounded candidate: investigate and implement the smallest correct cross-Save/profile manager identity linkage and historical mapping foundation required for identity-safe longitudinal Analytics.

Required constraints from that instruction:

- do not simply replace name-based Analytics keys with profile IDs;
- first reconstruct existing profile creation/reuse, Save Library, `identity.managerProfileIds`, Legacy migration/mappings, deletion/retention, Candidate A/B/C projection, Analytics caching and Trophy Room dependencies;
- preserve gameplay, persistence, recovery, PWA/offline, visuals and performance behavior;
- add deterministic and browser regression coverage for same-name distinct managers, one manager across multiple Saves, unresolved historical identities and deletion/recovery behavior;
- continuously record decisions, evidence, failures and corrections here;
- do not expand into cloud, accounts, synchronization or unrelated roadmap work.

Verified live base before branch creation:

`56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`

Active implementation branch:

`agent/manager-identity-linkage-foundation`

The branch was created directly from that exact live `main` SHA. Investigation is in progress. No runtime/data-model mutation has yet been committed after branch creation.

## Current repository boundary before this candidate

Verified pre-audit-merge `main`:

`a8a34ee2d64b63a68ec471f2623a2f27ff9e8c8b`

Completed audit branch:

`agent/identity-analytics-roadmap-audit`

Final validated audit head:

`64afd874516af0b104a30f438514d43c8e0eb253`

PR:

PR #56 — `Audit identity, Analytics and roadmap authority`

PR #56 was promoted from draft and merged after independently verifying that:

- live `main` had not advanced beyond the audited base;
- the PR remained mergeable;
- there were no submitted reviews or unresolved review threads;
- the exact final head above passed all 13 normal pull-request workflow families;
- the changed-file scope was documentation plus deterministic contract/test narration only, with no runtime application files changed.

Exact PR #56 merge:

`58c92dfbabd3fcdcb5cf03cce6baffe882901e4e`

Post-merge documentation authority was then sealed through `56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`. Future developers must still fetch live `main` rather than assuming any SHA in this handoff remains current.

## Production/runtime authority remains unchanged

Application milestone:

`v1.3.0 — Recovery & Device Resilience Hardening`

Installable Offline App runtime:

`1.3.0-r1`

Immediate previous known-good whole shell:

`1.2.0-r2`

Current shipped product layer:

Visible Local Profiles / Save Library Core UI

Current production runtime feature merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

Feature release version:

intentionally unassigned

The identity-linkage branch must not change release identity unless separately authorized.

## Audit conclusions now merged into current authority

1. Stable `profile_*`, `save_*` and `season_*` identities already exist. Save Library foundation and core UX are shipped and production-proven.
2. Current Career Analytics is not identity-safe across all history because `js/analytics.js` aggregates career managers primarily by normalized display name and does not use `identity.managerProfileIds` as career aggregation authority.
3. Two distinct authoritative profiles with the same visible name can therefore collapse into one Career Analytics manager row.
4. A direct profile-ID key swap is not sufficiently correct because current New Showdown creation creates fresh Local Profiles per Save/manager role. That could split one real manager across multiple career identities.
5. Historical Legacy manager/profile relationships may deliberately remain unresolved when source does not prove them. Visible-name equality is never mapping authority.
6. Full identity-safe longitudinal manager Analytics therefore depends on explicit cross-Save/historical manager identity semantics first. Showdown- or Season-scoped work does not automatically share that dependency.
7. Candidate A/B/C compatibility does not mean the current v1 backup envelope is a complete fresh-device export of every non-active Save Library entry. Full multi-Save portability remains a separate future candidate.
8. `CLOUD_STORAGE_FOUNDATION.md` had stale current-facing prose that treated the already-shipped Save Library layer as future work. PR #56 corrected that drift and strengthened semantic coherence contracts.
9. Current documentation ownership is intentionally split: `PROJECT_STATE.md` for production state, `NEXT_TASK.md` for authorization, `POST_V1_ROADMAP_EXECUTION.md` for dependency direction, this file for rolling evidence, and release/proof files for frozen release evidence.
10. Historical numeric roadmap labels are not current release assignments unless explicitly reauthorized.

## Validation history

Earlier audit candidate:

`05779624a378eb74b049553ac83acb5e40e7f06c`

At that head, Static App and Stability failed only because a newly added cloud-coherence assertion was punctuation-sensitive. Preceding runtime/product contracts were green. The semantic requirement itself was not the problem.

Correction:

`5ac72b6235bb4b467105c825e911fe6ca948de6a`

That commit changed the brittle assertion so it tested the intended semantic condition without punctuation sensitivity. All 13 normal PR workflow families then passed.

Final sealed audit head:

`64afd874516af0b104a30f438514d43c8e0eb253`

All 13 normal PR workflow families passed again on that exact head, including Statistics, Static App, Stability with Chromium journey, Candidate B, Candidate C with browser recovery audit, Home, League Confirmation, Season Review, Transfer, Settings, Final Polish, V1 Visual Immersion and Licensed Football Visuals.

Do not weaken product guarantees to obtain green CI, and do not confuse brittle test syntax with a meaningful product invariant.

### Post-merge handoff seal validation

Initial post-merge handoff seal:

`2433e80358cc70494e1360a9c0f39c510f5f26bf`

`Validate Static App` failed on that documentation-only commit. The failure was not a runtime/product regression. `tests/contracts/release-authority-coherence.cjs` requires the current handoff to preserve the semantic marker `concise rolling handoff`; the first seal had changed that phrase to `concise rolling evidence trail`. The same contract also protects the conclusion that a direct profile-ID key swap is not sufficiently correct.

Correction:

`dc9a7c494dab834a6fec731b370937cf45b6aff1`

The correction restored both protected semantic markers without weakening the contract or changing runtime files. On that exact head, every push validation workflow triggered by the documentation change passed: Statistics, Static App, Home Bootstrap, League Confirmation, Season Review, Transfer, Settings, Final Polish, V1 Visual Immersion and Licensed Football Visuals. GitHub Pages build/deployment also passed.

Final post-merge handoff authority before this new candidate:

`56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`

## Open historical drafts

PR #37 / `agent/v13-hardening` remains an obsolete historical draft.

PR #35 / `agent/v1.2-installable-offline-r2` remains an obsolete historical draft.

Neither is a development baseline. Do not revive or merge either over current `main` without a new current-source justification.

## Identity-linkage investigation checklist

Before changing canonical data semantics, inspect and record:

- profile creation and whether reuse can be introduced without weakening stable-ID meaning;
- current profile registry shape and normalization/validation contracts;
- all writers/readers of `identity.managerProfileIds`;
- singleton migration and Legacy same-Showdown inheritance versus unresolved mappings;
- deletion/retention semantics and orphan profile behavior;
- Candidate A active-Save projection and Candidate B/C restore preparation/apply behavior;
- Analytics cache keys/invalidation and any stable-identity assumptions;
- Trophy Room consumption of career Analytics;
- transaction ownership and exact raw rollback/recovery boundaries;
- same-name distinct-manager and same-person-multi-Save regression fixtures;
- treatment of historical labels versus future identity links.

No name-based inference is permitted. Explicitly unresolved historical relationships must remain representable.

## Next legal action

Continue source reconstruction on `agent/manager-identity-linkage-foundation`. Only after the dependency chain is understood should the branch introduce the smallest explicit linkage/mapping domain and its transaction-safe mutations. Analytics calculation changes remain outside this candidate unless separately authorized after the identity foundation itself is proven.
