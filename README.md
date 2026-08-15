# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime: `1.3.0-r2`
Previous known-good whole shell: `1.3.0-r1`
Current shipped product layer: presentation-only Local Profile display-label editing
Current runtime feature merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`
Feature release version: intentionally unassigned
Release status: merged, deployed, exact-byte verified and technically production-proven
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The v1.3 release remains the application baseline. The later Local Profiles / Save Library, explicit manager-identity, Identity-Safe Career Analytics and display-label chain advanced production behavior without assigning a new application version. Runtime maintenance r2 gives changed Save Library JavaScript/CSS one coherent installed-app shell and retains r1 as its immediate recovery predecessor.

Current verified source wins over stale historical status prose. Technical production proof does not fabricate owner visual acceptance.

## Development entry point

Read in this order:

1. `AGENTS.md`
2. `00_HANDOFF_GOLDEN_RULE.md`
3. `00_WORK_ENVIRONMENT_CONTINUITY.md`
4. `WORK_ENVIRONMENT_STATUS.json`
5. `WORK_ENVIRONMENT_HISTORY.md`
6. `00_DEVELOPER_START_HERE.md`
7. `00_CURRENT_HANDOFF.md`
8. `PROJECT_STATE.md`
9. `NEXT_TASK.md`
10. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
11. `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`
12. `V1.3.0_R2_PRODUCTION_PROOF.md` for current frozen production evidence
13. `V1.3.0_PRODUCTION_PROOF.md` when original r1 release-baseline history is relevant
14. `RELEASE_V1.3.0_R2.md`
15. `CAREER_MODE_SHOWDOWN_V1.3.0_R2_MAINTENANCE_HANDOFF.md`
16. `POST_V1_ROADMAP_EXECUTION.md`

Always fetch live `main` before relying on a SHA in documentation.

Run `npm run work:continuity:validate` and `npm run work:assess` after bootstrap and at the protocol's meaningful checkpoints. The Work Environment Continuity system records observable context and reliability signals, uses only explicit usage evidence, weighs fresh-environment ramp-up cost and generates `npm run work:handoff` output when a safe transition is preferable. It is repository development infrastructure and is not included in the website runtime.

Older release/proof documents remain immutable rollback/history evidence for their own runtimes.

## Locked product model

Career Mode Showdown is a rivalry companion, not a browser football simulator and not yet a cloud/account product.

- exactly two managers;
- one local browser/device today, with multiple local Showdown Saves supported by the Save Library;
- at most one explicit active Save selected by `activeSaveId`;
- manual FIFA 17 result entry;
- one selected league for both managers;
- different permanent clubs;
- Showdown lengths 1 / 3 / 5 / 10;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Local Profiles / Save Library product

The production application includes a lazy FIFA 17-inspired local Save Library inside the established Settings navigation/focus owner.

The completed dependency chain is:

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. Explicit cross-Save / historical manager identity linkage — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59.
7. Presentation-only Local Profile display-label editing — PR #61.

The visible product supports:

- empty, one-save and multi-save states;
- additive New Showdown creation rather than destructive replacement;
- explicit active-Save switching by stable `save_*` identity;
- deletion of exactly one Save without full-reset semantics;
- no implicit replacement after deleting the active Save;
- visible Local Profiles with explicit stable-identity reuse across Saves;
- presentation-only Local Profile display-label editing through guarded Save Library authority;
- same visible manager names remaining distinct `profile_*` identities;
- explicit historical profile mapping/unmapping with unresolved identity remaining legal;
- retained Local Profiles after single-Save deletion;
- non-mutating old-singleton compatibility opening;
- fail-closed presentation when storage authority is corrupt, dual or otherwise unverifiable;
- keyboard/focus integration with the existing Settings dialog;
- phone, Chromebook and reduced-motion containment.

Stable prefixes remain `save_*`, `season_*` and `profile_*`. Display names are labels, never identity keys.

Local Profile display-label editing does not rewrite saved or historical Showdown manager labels and does not authorize profile merge/delete, generic CRUD or standalone profile creation.

## Architecture and data safety

Navigation/history/Smart Back authority: `js/screens.js`.

Public raw browser-storage authority: `js/storage.js`.

Raw transaction engine: `js/storageTransaction.js`.

Save Library runtime mutation authority: `js/saveLibraryRuntime.js`.

Scoring authority: `js/scoring.js`.

Analytics authority: `js/analytics.js`.

Before explicit Save Library activation on an old singleton device, the public canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful cutover, the public canonical localStorage keys remain exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It is only a migration/recovery compatibility slot.

UI code never owns canonical `localStorage` directly.

`js/saveLibraryCutover.js` remains lazy. Confirmed Start/Continue may activate or migrate old singleton state. Opening Save Library/Settings or Legacy on an unmigrated singleton device remains non-mutating.

Runtime writes preserve exact owned-byte authority and fail closed on stale/cross-tab drift, singleton reappearance, critical-recovery lock, exact-byte mismatch or failed transactions.

Candidate A remains non-mutating export.

Candidate B remains strictly read-only import analysis.

Candidate C is the only import stage permitted to commit canonical restore state. Candidate C preserves immutable confirmed intent, strict exact raw snapshot/precondition handling through `captureCareerModeRawRestoreSnapshot()`, last-moment exact-byte checks, transaction-owned mutation and ownership-scoped reverse rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery on uncertainty.

Service Worker and Cache Storage contain application bytes only and are never canonical user-data storage.

## Installable Offline App

The current `1.3.0-r2` runtime preserves the v1.3 resilience/offline architecture and adds coherent delivery for the shipped Save Library JavaScript/CSS.

Runtime r2 uses `1.3.0-r1` as its immediate previous known-good whole shell because changed Save Library JavaScript and CSS require a new atomic installed-app cache identity.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- no automatic install-time activation;
- explicit Update Ready activation at safe Home / Showdown Home boundaries;
- Candidate C busy/recovery protection around activation;
- whole-runtime cache selection, never per-file revision mixing;
- current/previous-known-good recovery using `1.3.0-r2` then `1.3.0-r1`;
- worker-owned connectivity verification;
- explicit nonfatal offline degradation for external media;
- lazy PWA controller;
- install/update presentation only inside Settings;
- lazy Save Library UI and CSS included in the verified complete shell.

`CMS_ACTIVATE_UPDATE` verifies the complete shell, awaits successful `skipWaiting()`, and only then acknowledges activation acceptance.

## Protected visual baseline

The r2 iOS standalone loading correction is structural: safe-area/viewport behavior is separated from the visual composition. Mobile loading uses a bounded width-owned top band, independent subject-safe Marco Reus image box and opacity/filter-only animation that cannot move protected geometry.

Do not restore floating/sticky global install UI, viewport-height-driven image sizing or random object-position/crop/brightness hacks.

Preserve the current FIFA 17-inspired Home and Save Library presentation unless a reproduced defect or separately authorized product candidate requires change.

## Current production proof

PR #61 exact final head `cfedec8dccde51a7a9932a1bd3a92cc91514e579` passed all 13 normal PR workflow families.

Runtime feature merge `67095a02188ebd246da0d0f2cd61158b8e9e504e` passed all 15 exact-merge push/deployment runs.

Release Integration Burn-In `31894832592` passed its complete stateful integration journeys.

Post-merge Stability `31894832637` passed, including deployed-site-smoke job `95036682319`.

The deployed smoke verified 71 `1.3.0-r2` runtime files byte for byte and passed runtime provenance, Home, visible Save Library, explicit manager identity, Identity-Safe Career Analytics, licensed football visuals, Candidate A, Candidate B, Candidate C, Installable Offline App/offline boundary and complete deployed journey proof. Independent checks also matched Service Worker and manifest bytes and passed the public profile-label journey with stable IDs and unchanged saved Showdown labels.

## Validation and performance locks

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation PRs generally run 13 families; Release Integration Burn-In is main/manual release authority.

Protected ceilings:

- eager raw <=165,000 bytes;
- eager gzip <=37,500 bytes;
- Marco Reus startup portrait <=95,000 bytes;
- combined first-party startup <=260,000 bytes;
- normal loading minimum 2700 ms;
- reduced-motion loading 220 ms.

The locked ceilings remain authoritative. Current r2 eager measurements are 162782 raw and 37416 compressed bytes.

Do not raise limits, relax timeouts or weaken assertions to make a change pass.

## Current continuation boundary

Identity-Safe Career Analytics and Local Profile display-label editing are complete and production-proven.

No new substantial runtime product candidate is authorized. Stop with no runtime change unless a later explicit owner instruction names a new bounded candidate.

Profile merge/delete or generic CRUD, cloud, accounts, QR pairing, synchronization, remote transport, distributed revision/device identity systems, backup/import redesign, gameplay changes and framework rewrites are not authorized.

PR #37 and PR #35 remain historical draft work and are not current authority.
