# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns implementation authorization. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and production-proof documents remain frozen evidence for the release they name.

## Current repository boundary

Verified pre-merge `main`:

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

This handoff seal is a post-merge documentation-only update made from that exact merge boundary. Future developers must still fetch live `main` rather than assuming the merge SHA above remains current.

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

PR #56 changed no gameplay, persistence, recovery, Save Library runtime, Analytics calculation, PWA/offline bytes, visuals, performance limits or release identity.

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

This section records that completed evidence. The commit containing this record is itself documentation-only and follows the green correction head above; future developers must fetch live `main` and verify its workflows rather than treating any SHA in this handoff as permanently current.

## Open historical drafts

PR #37 / `agent/v13-hardening` remains an obsolete historical draft.

PR #35 / `agent/v1.2-installable-offline-r2` remains an obsolete historical draft.

Neither is a development baseline. Do not revive or merge either over current `main` without a new current-source justification.

## Current authorization boundary

No new substantial runtime/product implementation candidate is automatically authorized.

The smallest source-supported future product candidate is explicit cross-Save/profile manager identity linkage and historical mapping semantics. It remains only a candidate until the owner explicitly authorizes that scope and its exact semantic model is investigated.

Do not begin an Analytics runtime correction, generic profile CRUD, historical name-based mapping, backup-format redesign, cloud work, accounts/authentication, pairing/synchronization, gameplay changes, global visual redesign or release-version assignment merely because PR #56 is merged.

If a later owner instruction authorizes identity work, investigate profile creation/reuse, profile registry schema, `identity.managerProfileIds`, migration and Legacy mappings, deletion/retention behavior, Candidate A/B/C projection, Analytics caching, Trophy Room consumption, same-name tests, transaction ownership and historical-label policy before changing data.

## Next-session bootstrap

1. Fetch live `main`, recent commits and all open PRs.
2. Read `00_HANDOFF_GOLDEN_RULE.md`.
3. Read `00_DEVELOPER_START_HERE.md`.
4. Read this file.
5. Read `PROJECT_STATE.md`.
6. Read `NEXT_TASK.md`.
7. Read `POST_V1_ROADMAP_EXECUTION.md`.
8. Inspect deeper Save Library, recovery, release or historical handoffs only when the current task requires their rationale.
9. Treat current source as implementation authority and do not invent the next feature when `NEXT_TASK.md` does not authorize one.

## Clean stop

The Identity × Legacy × Analytics × Roadmap audit is complete and merged. Production runtime behavior is unchanged. The repository is at a coherent documentation/authority boundary. Stop before starting the identity-linkage candidate or any other substantial runtime work unless a newer explicit owner instruction authorizes it.