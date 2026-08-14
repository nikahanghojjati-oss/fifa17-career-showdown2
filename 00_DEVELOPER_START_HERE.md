# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical bootstrap for a new developer session.

## Sixty-second state

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Visible Local Profiles / Save Library Core UI is complete, merged, deployed and production-proven. Its feature release version is intentionally unassigned.

Completed dependency chain:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53.

PR #53 exact final head: `2021a0a2eaed26f0aca6639278de82afe2a28d6d`.
Production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

No application or Service Worker release number was assigned to the later Save Library feature chain.

## Authority ownership map

One current fact should have one primary owner. Do not copy a fact into a new document merely to make it easier to find.

- `00_HANDOFF_GOLDEN_RULE.md` owns permanent session/handoff operating policy.
- `PROJECT_STATE.md` is the primary owner of current deployed product, identity, storage, recovery, performance and production-proof state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary. A roadmap item is not a task unless this file or a later explicit owner instruction makes it one.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification. It does not assign release versions and does not authorize implementation by itself.
- `00_CURRENT_HANDOFF.md` is the concise rolling evidence trail for the active investigation/branch. It references current authority rather than restating the entire project history.
- release and production-proof files own frozen evidence for the release/candidate they name. Historical proof may accurately describe an older canonical storage model and must not be mistaken for current product authority.
- Local Profiles / Save Library handoffs preserve rationale and implementation chronology for that completed chain.
- `00_MASTER_DEVELOPER_CONTEXT.md` and older handoffs are historical rationale only.
- external reviews are non-authoritative hypotheses. They never override current source, current repository authority or later explicit owner decisions.

A machine-readable authority manifest is not currently justified. The existing deterministic coherence contracts should protect the small set of important cross-file invariants instead of creating another authority source.

## Required read order

Always fetch live `main`, recent commits and open PRs first.

Then read:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `POST_V1_ROADMAP_EXECUTION.md`
7. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
8. `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`
9. deeper Save Library handoffs only when their rationale is relevant
10. current release/proof documents only when their frozen evidence is relevant
11. `00_MASTER_DEVELOPER_CONTEXT.md` only when deeper history is required.

Current verified source plus later explicit owner decisions outrank stale historical narration.

## Current development boundary

Save Library is shipped. Stable local identity exists. Multi-save creation, switching and scoped deletion exist.

There is no automatically authorized next substantial product implementation after the Save Library Core UI.

The current source-grounded audit has identified a real identity-consumption problem in Career Analytics, but a naive runtime fix is not authorized or semantically sufficient: `js/analytics.js` groups career managers by normalized display name, while current Save creation produces fresh stable Local Profiles per Save/manager role and historical Legacy mappings may intentionally remain unresolved.

Never auto-link profiles or historical managers because labels match.

Future identity/profile linkage, historical mapping, Analytics behavior, profile editing, backup-envelope evolution and cloud remain separately bounded candidates.

## Permanent product and identity locks

Exactly two managers.
Showdown lengths: `1`, `3`, `5`, `10`.
Both managers use the same selected league and different permanent clubs.

Scoring remains:

- Champions League +5
- League +3
- Domestic Cup +1
- 100 League Points and/or 100 League Goals combined maximum +1
- Top Scorer and/or Top Assist combined maximum +1

Maximum Season score: 11.
Equal non-zero scores are Draws.
Only 0–0 invokes league position and then league points.

Stable prefixes remain `profile_*`, `save_*` and `season_*`. Display names are labels only and same-name profiles are legal.

Protected product surfaces include Home, Continue Career, Create Showdown, league and club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

## Canonical storage and mutation locks

Before explicit Save Library cutover on an old singleton device, the public canonical keys are exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful cutover, they are exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is never a permanent fourth post-cutover key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library product mutation authority. UI code does not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C destructive Apply must use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority, never `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

## Installable Offline App and performance locks

Current Installable Offline App whole shell remains `1.3.0-r1`; previous known-good whole shell remains `1.2.0-r2`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve atomic verified cache population, explicit update activation, Candidate C activation gating, current/previous whole-shell recovery and Settings-owned install/update presentation.

Locked ceilings remain:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Never raise performance or timeout limits merely to obtain green CI.

## Validation topology and proof

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation PRs generally exercise 13; Release Integration Burn-In is main/manual release authority.

PR #53 exact final head passed all 13 normal PR workflow families. Exact runtime merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` passed all 14 permanent push workflow families. Release Integration Burn-In `31771269732` and post-merge Stability `31771269740` succeeded, including deployed-site proof.

Automated proof and owner visual/product acceptance remain separate evidence channels.

## Historical branch warning

PR #37 / `agent/v13-hardening` and PR #35 remain historical draft work based on obsolete snapshots. Do not revive or merge them over current `main` without a new current-source justification.
