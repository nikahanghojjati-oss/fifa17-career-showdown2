# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-15 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical bootstrap for a new developer session.

## Sixty-second state

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Active candidate runtime: `1.3.0-r2`, with production r1 as its recovery predecessor
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current production runtime feature merge: `c5c7d50cc3a2d9003e057d1813744c877323c068`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, and Identity-Safe Career Analytics / Trophy Room longitudinal consumption are complete, merged, deployed and production-proven.

Completed dependency chain:

1. identity foundation — PR #46;
2. canonical persistence integration — PR #48;
3. runtime authority cutover — PR #51;
4. visible Local Profiles / Save Library Core UI — PR #53;
5. explicit cross-Save/historical manager identity linkage foundation — PR #57;
6. identity-safe longitudinal Career Analytics / Trophy Room correction — PR #59.

PR #59 exact validated head: `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`.
Production runtime feature merge: `c5c7d50cc3a2d9003e057d1813744c877323c068`.
Production Stability run: `31827619109`.
Deployed-site-smoke job: `94855938131`.

No application or Service Worker release number was assigned to the later Save Library / manager identity / Analytics feature chain.

## Authority ownership map

One current fact should have one primary owner. Do not copy a fact into a new document merely to make it easier to find.

- `00_HANDOFF_GOLDEN_RULE.md` owns permanent session/handoff operating policy.
- `PROJECT_STATE.md` is the primary owner of current deployed product, identity, storage, recovery, performance and production-proof state.
- `NEXT_TASK.md` is the sole primary owner of the current implementation authorization boundary. A roadmap item is not a task unless this file or a later explicit owner instruction makes it one.
- `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction and current roadmap classification. It does not assign release versions and does not authorize implementation by itself.
- `00_CURRENT_HANDOFF.md` is the concise rolling production/evidence handoff and retains the prior identity/Analytics candidate failure history and production proof.
- `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` is retained as the closed branch-specific evidence trail for PR #59 and its validation failures/corrections. It is historical after production promotion and does not override current authority.
- release and production-proof files own frozen evidence for the release/candidate they name. Historical proof may accurately describe an older canonical storage model and must not be mistaken for current product authority.
- Local Profiles / Save Library handoffs preserve rationale and implementation chronology for that completed chain.
- `00_MASTER_DEVELOPER_CONTEXT.md` and older handoffs are historical rationale only.
- external reviews are non-authoritative hypotheses. They never override current source, current repository authority or later explicit owner decisions.

## Required read order

Always fetch live `main`, recent commits and open PRs first.

Then read:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `POST_V1_ROADMAP_EXECUTION.md`
7. `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` when PR #59 failure chronology is relevant
8. Local Profiles / Save Library historical handoffs only when their rationale is relevant
9. current release/proof documents only when their frozen evidence is relevant
10. `00_MASTER_DEVELOPER_CONTEXT.md` only when deeper history is required.

Current verified source plus later explicit owner decisions outrank stale historical narration.

## Current development boundary

The owner-authorized Identity-Safe Career Analytics candidate is no longer an active branch task. It is production-proven.

Production semantics now include:

- authoritative longitudinal manager identity is a valid stable `profile_*` reference;
- same visible names never imply the same manager identity;
- one explicitly reused Local Profile across multiple Saves aggregates as one career identity;
- distinct same-name profiles remain distinct career identities;
- unresolved historical roles remain unresolved and are excluded from identity-dependent manager totals/leaderboards/cabinets rather than guessed from labels;
- overall Showdown/Season totals and Showdown/Season-scoped records remain complete when identity is unresolved;
- Local Profile display names remain presentation only;
- read-only Career Statistics can obtain canonical profile presentation without eager Save Library mutation-runtime activation;
- Analytics and Trophy Room caches/renders refresh when identity mapping or consumed profile presentation changes;
- Rivalry Analytics remains scoped to one Showdown and does not become a cross-history identity consumer.

One later explicit owner continuation authorized the bounded Local Profile display-label editing candidate. It changes only `profile.displayName`, never stable identity or saved/historical Showdown labels. No second candidate, broader profile CRUD, backup portability, broader Analytics 2.0, Legacy/Achievements, optional content or cloud work is authorized.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After reconstructing live repository state and reading current authority:

1. verify live `main`, deployed Pages and current authority before trusting any recorded SHA;
2. inspect `NEXT_TASK.md` and `00_CURRENT_HANDOFF.md` for the exact Local Profile display-label candidate base, head, failures and validation state;
3. continue only that exact candidate through guarded runtime/UI proof, coherent `1.3.0-r2` whole-shell delivery identity, exact-head CI and deployed verification;
4. preserve r1 as production authority until r2 is merged and publicly proven, and stop after sealing this one candidate.

Do not ask the owner to reconstruct already-recorded repository history.

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

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains Save Library product and manager-identity mutation authority. `js/analytics.js` remains derived/read-only Analytics authority. UI and Analytics code do not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C destructive Apply must use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority, never `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

## Installable Offline App and performance locks

Current production Installable Offline App whole shell remains `1.3.0-r1`; previous production recovery shell remains `1.2.0-r2`. The active `1.3.0-r2` candidate uses r1 as its immediate previous known-good whole shell.

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

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation/authority PRs generally exercise 13; Release Integration Burn-In is main/manual release authority.

PR #59 exact final head `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1` passed all 13 normal PR workflow families. Exact runtime merge `c5c7d50cc3a2d9003e057d1813744c877323c068` had 15 successful push/deployment workflow runs, zero failures and zero cancellations. Stability run `31827619109` passed contracts, canonical Chromium and deployed-site proof; deployed-site-smoke job `94855938131` passed every public production gate through the complete journey.

Automated proof and owner visual/product acceptance remain separate evidence channels.

## Historical branch warning

PR #37 / `agent/v13-hardening` and PR #35 remain historical draft work based on obsolete snapshots. Do not revive or merge them over current `main` without a new current-source justification.
