# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Current production authority

Application label: `v1.3.0`
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Current production runtime merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Current product feature: Visible Local Profiles / Save Library Core UI
Feature release version: intentionally unassigned

PR #53 — `Expose Local Profiles and Save Library UI`

Exact final PR #53 head:

`2021a0a2eaed26f0aca6639278de82afe2a28d6d`

Exact PR #53 merge:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

PR #53 is merged, deployed and production-proven. It did not change the application release label or Service Worker revision.

Owner visual/product acceptance remains a separate evidence channel and is never inferred from CI.

## Local Profiles / Save Library dependency chain

The completed dependency chain is now:

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

These are production foundations. Do not reimplement or simplify them merely because later roadmap work may add more UI or multi-device capability.

## Visible Save Library product now in production

The existing Home local-data entry visibly presents `LOCAL / SAVE LIBRARY` while preserving the established Settings navigation/focus owner.

The Save Library product is lazy and mounted first inside the existing Settings overlay. Application Settings remain below it. This avoids a second persistence system, avoids a new eager route, and preserves global Smart Back ownership.

Production behavior includes:

- empty, one-save and multi-save states;
- additive New Showdown creation rather than destructive replacement;
- one explicit `activeSaveId`;
- explicit switching by stable `save_*` identity;
- deletion of exactly one Save without full-reset semantics;
- deleting a non-active Save leaves active ownership unchanged;
- deleting the active Save leaves no implicit replacement and requires explicit future selection;
- visible read-only Local Profiles;
- equal visible manager names remain distinct `profile_*` identities;
- Local Profiles are retained after single-Save deletion in this candidate;
- old singleton devices open the Save Library surface non-mutating and migrate only through confirmed Start/Continue;
- corrupt, dual-authority or otherwise unverifiable state fails closed with no mutation controls;
- mutation rerenders restore keyboard focus inside the existing Settings dialog;
- Chromebook/mobile/reduced-motion containment;
- Save Library lazy JS/CSS included in the verified Installable Offline App whole shell.

Profile rename/edit is not part of PR #53. Current Showdown records also carry manager display labels, so safe rename semantics require an explicit propagation/history-label policy in a separately authorized candidate.

## Identity authority

Stable prefixes remain exactly:

- `save_*`
- `season_*`
- `profile_*`

Current generated IDs use 24 lowercase hexadecimal characters after the prefix.

Display names are labels only. Display-name equality, normalized spelling or case equality never establishes identity.

Never auto-link historical managers solely by visible name.

## Canonical storage authority

Before explicit Save Library activation on an old singleton device, public canonical keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, public canonical keys remain exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent key. After cutover it is only a migration/recovery compatibility slot.

Normal post-cutover Save Library operations never recreate singleton active-showdown authority.

`js/storage.js` remains sole public raw `localStorage` authority. UI code does not manipulate canonical browser storage directly.

## Runtime authority locks

`js/saveLibraryCutover.js` remains lazy.

Confirmed Start/Continue may activate or migrate. Opening Save Library/Settings or Legacy on an unmigrated singleton device remains non-mutating.

`js/saveLibraryRuntime.js` owns exact runtime authority and now exposes narrow multi-save product operations including detached library inspection, additive creation, active switching and single-Save deletion.

Runtime authority continues to track exact owned Save Library bytes and fail closed on stale/cross-tab drift, singleton reappearance, critical-recovery lock, unverifiable storage or failed transactions.

Do not bypass these rules from UI code.

## Backup / import / recovery authority

Candidate A export remains non-mutating.

Candidate B import analysis remains strictly read-only.

Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Never replace it with `captureCareerModeRawBackupInputs()`.

Preserve:

- exact preconditions;
- last-moment raw guards;
- transaction-owned mutation;
- ownership-scoped reverse rollback;
- anti-clobber verification;
- exact post-write verification;
- byte-for-byte rollback verification;
- corrupt-byte preservation;
- retry/idempotence;
- critical recovery when authority cannot be established.

The strict recovery architecture is deliberate future-facing infrastructure for eventual multi-device evolution. Do not simplify it for conceptual neatness.

## Performance authority

Exact final PR #53 Static App measurements:

- eager raw: `162781` bytes
- eager gzip: `37415` bytes
- lazy feedback: `4845` bytes
- Reus startup portrait: `88492` bytes
- combined first-party startup: `251273` bytes

Locked ceilings remain:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

No ceiling was raised for PR #53. Do not increase a limit to obtain green CI.

## Exact PR #53 pre-merge proof

The first broad-CI implementation head `2899c020c717d9fa8b59f4c687432d7b0d1b566f` passed 12 of 13 normal workflow families and exposed one new accessibility/focus defect in Stability.

The defect was repaired at its root. The exact corrected final head `2021a0a2eaed26f0aca6639278de82afe2a28d6d` then passed all 13 normal PR workflow families.

Important exact final-head runs:

- Stability: `31771109094` — success.
- Candidate C Atomic Restore: `31771109180` — success.
- Static App: `31771109225` — success.

The PR Stability evidence included the visible Save Library journey and four Save Library/Stability artifacts.

## Exact post-merge production proof

Current runtime merge under proof:

`9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

All 14 permanent push workflow families completed successfully on that exact merge. GitHub Pages deployment activity was additional to those 14 permanent families.

Release Integration Burn-In:

`31771269732` — success.

Both complete stateful integration passes succeeded.

Post-merge Stability Lane:

`31771269740` — success.

Jobs:

- `stability-contracts` — success;
- `chromium-stability` — success;
- `deployed-site-smoke` job `94677863736` — success.

The deployed smoke verified `71` runtime files for `1.3.0-r1` byte-for-byte on GitHub Pages and then passed:

- runtime-error provenance;
- Home visual audit;
- visible Save Library audit;
- permanent 11-screen licensed football-photo audit;
- Candidate A backup export;
- Candidate B read-only import analysis;
- Candidate C atomic restore/recovery and maintenance races;
- Installable Offline App/offline boundary;
- complete deployed Chromebook/mobile journey.

The complete deployed journey recorded `70` checkpoints and `36` accessibility scans.

The deployed Save Library audit explicitly proved that compatibility opening remains non-mutating, corrupt authority fails closed, additive saves switch/reload/delete safely, mutation rerenders retain keyboard focus inside Settings, equal manager names remain separate stable profiles, and Chromebook/mobile containment passes.

## PR #53 failure/correction record

1. A new Save lookup guard initially assumed 32 hex characters. Current identity foundation uses 24. The guard and contracts were corrected before release.
2. Initial switch/create code could leave a primed season-ID cache after a failed final transition. Failure paths now clear the cache; `currentShowdown` changes only after successful switch commit.
3. The first browser audit draft used unavailable `assert.poll`; it was replaced with repository-standard `page.waitForFunction` plus explicit assertions before authoritative proof.
4. Stability timeouts were temporarily raised while wiring the new audit. That unnecessary gate relaxation was immediately reverted; existing 18/36-minute limits remain.
5. A local clone attempt failed because the execution container could not resolve external GitHub hosts. No product conclusion was drawn from that environment failure; exact GitHub Actions heads were used as executable proof authority.
6. First Chromium Stability on head `2899c020...` found that Save Library rerender removed the focused Make Active button, leaving focus outside Settings so Escape no longer reached the established modal handler. The product now restores focus inside `#settingsDialog` after switch/delete rerenders. No competing global Escape handler was added, and browser evidence protects all mutation-focus paths.

## Protected experience

Preserve working behavior across Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, football photography and FIFA 17-inspired presentation.

## Permanent gameplay rules

Exactly two managers.

Showdown lengths: `1`, `3`, `5`, `10`.

Both managers use the same selected league and different permanent clubs.

Scoring:

- Champions League: +5
- League: +3
- Domestic Cup: +1
- 100 League Points and/or 100 League Goals: combined maximum +1
- Top Scorer and/or Top Assist: combined maximum +1

Maximum Season score: 11.

Equal non-zero scores are a Draw.

Only 0–0 invokes league position, then league points.

## Clean development boundary

Visible Local Profiles / Save Library Core UI is complete and production-proven.

No next substantial implementation candidate is assigned by this closure.

Do not automatically begin profile editing, cloud, accounts, authentication, synchronization, remote transport, device/writer IDs, distributed revisions, historical name linking, backup/import redesign or an unrelated global redesign.

The next developer must fetch live `main`, read `00_HANDOFF_GOLDEN_RULE.md`, this file, `PROJECT_STATE.md`, `NEXT_TASK.md`, `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md` and `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`, inspect any newer commits/PRs, then follow the owner-authorized next dependency.
