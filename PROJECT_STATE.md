# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-15 ET

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name. `00_WORK_ENVIRONMENT_CONTINUITY.md` owns development-environment continuity and does not alter product/runtime authority.

## Development continuity infrastructure

The repository includes the Work Environment Continuity system through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. It measures only observable development-session signals, leaves unknown usage unknown, includes fresh-environment ramp-up cost and produces a safe-boundary transition alert plus ready-to-paste handoff.

This infrastructure is excluded from the website runtime, Service Worker shell, browser persistence and user interface. It assigns no product candidate and changes none of the production authority below.

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`
Validated PR #61 final head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The application milestone remains v1.3.0. Later Local Profiles / Save Library, explicit manager-identity linkage and Identity-Safe Career Analytics advanced production functionality without assigning a new application feature version. Runtime maintenance r2 now gives the changed Save Library JavaScript/CSS a coherent whole-shell installed-app identity while retaining r1 as the immediate recovery predecessor.

## Local Profile display-label production maintenance

The bounded Local Profile display-label candidate was based exactly on sealed production main `eee3b0c62be4d023b7d83fb22447d37db8a8b9b6`, validated on frozen head `cfedec8dccde51a7a9932a1bd3a92cc91514e579`, and merged through PR #61 with expected-head protection to `67095a02188ebd246da0d0f2cd61158b8e9e504e`.

Production runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Status: merged, deployed, exact-byte verified and technically production-proven

Production changes only `profile.displayName` through existing Save Library authority. Stable IDs and saved/in-memory/Legacy Showdown manager labels remain unchanged. Same-name profiles remain legal and separate. Invalid input fails before write, unchanged input is a no-op, and Analytics/Trophy/identity-link presentation consumes the updated label without changing identity. Application version remains v1.3.0 and Service Worker behavior is unchanged.

## Completed local identity and Analytics chain

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.
5. Explicit cross-Save/historical manager identity linkage foundation — PR #57, merge `95e98c13bbb4cac485531565c3577ae31286d0af`.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59, merge `c5c7d50cc3a2d9003e057d1813744c877323c068`.
7. Local Profile display-label editing and r2 whole-shell delivery — PR #61, merge `67095a02188ebd246da0d0f2cd61158b8e9e504e`.

All seven layers are shipped and production-proven. Do not describe Save Library, stable Local Profile identity, explicit manager linkage, identity-safe longitudinal Career Analytics or display-label editing as unfinished foundation work.

## Identity-Safe Career Analytics state

`js/analytics.js` is the Career Analytics calculation authority. Longitudinal manager aggregation now uses authoritative stable `profile_*` references rather than normalized visible manager names.

Production behavior includes:

- distinct Local Profiles with the same visible display name remaining distinct longitudinal career identities;
- one Local Profile explicitly reused across different Saves aggregating into one longitudinal manager career;
- unresolved historical manager roles remaining explicit and never guessed from name similarity;
- unresolved roles excluded only from identity-dependent manager totals, leaderboards, cabinets and comparisons;
- identity-independent completed Showdown/Season totals, points, trophies and Showdown/Season-scoped records remaining complete even when identity is unresolved;
- Local Profile `displayName` remaining presentation only;
- Local Profile `displayName` being user-editable through exact guarded Save Library mutation authority without rewriting Showdown or Legacy labels;
- Career Statistics and Trophy Room consuming the same stable-identity Analytics authority;
- Local Profile presentation remaining available through existing read-only exact Save Library snapshot authority even before Save Library mutation runtime activation;
- Analytics/Trophy Room revisioning incorporating identity and Local Profile presentation state so explicit mapping or label changes invalidate stale derived presentation;
- Rivalry Statistics remaining Showdown-scoped and semantically unchanged.

`tests/contracts/identity-safe-career-analytics-contracts.cjs` protects the deterministic identity semantics. `tests/browser/identity-safe-career-analytics-audit.cjs` protects same-name separation, explicit reuse, unresolved history, explicit historical mapping, inactive-runtime presentation, Trophy Room coherence and singleton non-resurrection in Chromium and deployed Pages.

The final Trophy Room test correction does not disable `.managerCabinet { content-visibility:auto; }` and does not weaken the visible assertion. The audit proves DOM/revision coherence, scrolls the exact stable-profile cabinet into view, then requires rendered `innerText()` to show the updated three-Showdown record.

## Exact PR #59 and production proof

PR #59 final validated head:

`a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1`

All 13 normal pull-request workflow families passed that one exact unchanged head before promotion. The promotion gate independently verified unchanged production base `8c6fad42e38b4964d848128e40569442c3fa06d5`, exact 16-file scope, mergeability, no submitted reviews, no unresolved review threads and no head movement.

PR #59 merged with expected-head protection to:

`c5c7d50cc3a2d9003e057d1813744c877323c068`

On that exact runtime merge:

- 15 push/deployment workflow runs succeeded, comprising the permanent product validation set plus GitHub Pages deployment;
- exact-head workflow failures: 0;
- exact-head workflow cancellations: 0;
- Release Integration Burn-In run `31827619182` passed both complete stateful integration repetitions;
- Candidate C Atomic Restore run `31827619121` passed restore contracts and authoritative restore/recovery browser proof;
- Stability run `31827619109` passed repository contracts, canonical Chromium integration and deployed-site smoke;
- deployed-site-smoke job `94855938131` passed exact runtime-byte verification, runtime error provenance, Home, visible Save Library, manager identity linkage, Identity-Safe Career Analytics, crop-safe football visuals, Candidate A, Candidate B, Candidate C, Installable Offline App/offline boundary and the complete deployed production journey.

Identity-Safe Career Analytics is therefore merged, deployed, exact-byte verified and technically production-proven.

## Exact PR #61 and r2 production proof

PR #61 exact frozen head `cfedec8dccde51a7a9932a1bd3a92cc91514e579` passed all 13 normal pull-request workflow families. The independent promotion gate verified unchanged base/head, clean mergeability, zero submitted reviews, zero comments and zero unresolved review threads.

Expected-head merge `67095a02188ebd246da0d0f2cd61158b8e9e504e` passed all 15 exact-merge push/deployment runs with zero failures or cancellations. Pages run `31894832195`, deployment `5922244376`, Release Integration Burn-In `31894832592`, Stability `31894832637` and deployed-site-smoke job `95036682319` all succeeded.

Independent deployed verification matched 71 runtime files plus `service-worker.js` and `manifest.webmanifest` byte for byte. A public browser journey verified runtime `1.3.0-r2`, guarded profile-label editing, whitespace-only rejection, stable `profile_*`/`save_*` identity, unchanged saved Showdown manager presentation and coherent identity-link presentation.

`V1.3.0_R2_PRODUCTION_PROOF.md` owns the frozen release evidence.

## Visible Save Library and identity-link product state

Current production still includes:

- Home-visible Local / Save Library through established Settings ownership;
- lazy Save Library UI inside Settings;
- empty, one-save and multi-save states;
- additive New Showdown creation;
- one explicit `activeSaveId`;
- stable-ID switching and exact one-Save deletion;
- visible Local Profiles;
- guarded presentation-only Local Profile display-label editing;
- same-name profiles remaining separate stable identities;
- profiles retained after Save deletion;
- explicit reuse of an existing Local Profile across Save manager roles;
- no automatic identity matching by display name;
- exact stable-save-ID-only matching Legacy propagation;
- historical-only Legacy manager roles explicitly mappable to an existing Local Profile or returnable to unresolved/null;
- display labels remaining unchanged when stable identity links change;
- one Local Profile blocked from representing both rival roles in one Showdown;
- old-singleton compatibility and fail-closed corrupt/dual/unverifiable authority behavior;
- lazy Save Library assets in the verified offline whole shell.

`js/saveLibraryRuntime.js` remains product-level Save Library and manager-identity mutation authority. Analytics and UI remain detached from raw canonical browser-storage ownership.

## Storage state

Before explicit Save Library cutover on an old singleton device, public canonical storage is exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, public canonical storage is exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is only a migration/recovery compatibility slot after cutover and must never become a permanent fourth key.

`js/storage.js` remains sole public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. Save Library and manager-identity mutations use strict exact raw preconditions and transaction-owned mutation/fail-closed behavior.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority and must never substitute `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

The current v1 backup envelope still projects the active Save rather than serializing the complete Save Library registry. Complete fresh-device multi-Save portability remains a separate future candidate and is not implied by Analytics completion.

## Installable Offline App state

Whole-shell label remains exactly `1.3.0-r2`.
Previous known-good whole shell remains `1.3.0-r1`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Locked ceilings remain unchanged:

- eager raw `162782` <= `165000` bytes
- eager gzip `37416` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251274` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Identity-Safe Career Analytics and Local Profile display-label editing do not require an eager Save Library runtime or startup architecture change.

## Protected product surfaces and gameplay

Preserve Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

Exactly two managers.
Showdown lengths: `1`, `3`, `5`, `10`.
Same selected league, different permanent clubs.
Champions League +5, League +3, Domestic Cup +1.
100 League Points and/or 100 League Goals combined maximum +1.
Top Scorer and/or Top Assist combined maximum +1.
Maximum Season score 11.
Equal non-zero scores are Draws.
Only 0–0 invokes league position and then league points.

## Current clean boundary

Identity-Safe Career Analytics and Local Profile display-label editing are complete, merged, deployed and production-proven.

No new runtime candidate has shipped after Local Profile display-label editing. A later owner handoff authorizes PR #65 infrastructure completion followed by one bounded complete fresh-device multi-Save portability candidate if current source confirms it remains incomplete and unblocked. Profile merge/delete or generic CRUD, broader Analytics 2.0, optional content and cloud/network work remain unauthorized.
