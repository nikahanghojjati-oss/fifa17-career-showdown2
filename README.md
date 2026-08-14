# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`
Current shipped product layer: Visible Local Profiles / Save Library Core UI
Current runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned
Release status: merged, deployed, exact-byte verified and technically production-proven
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The v1.3 release remains the whole-shell application baseline. The later Local Profiles / Save Library chain advanced production behavior without assigning a new application version or Service Worker revision.

Current verified source wins over stale historical status prose. Technical production proof does not fabricate owner visual acceptance.

## Development entry point

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
7. `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`
8. `V1.3.0_PRODUCTION_PROOF.md` when original release-baseline history is relevant
9. `RELEASE_V1.3.0.md`
10. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
11. `POST_V1_ROADMAP_EXECUTION.md`

Always fetch live `main` before relying on a SHA in documentation.

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

The visible product supports:

- empty, one-save and multi-save states;
- additive New Showdown creation rather than destructive replacement;
- explicit active-Save switching by stable `save_*` identity;
- deletion of exactly one Save without full-reset semantics;
- no implicit replacement after deleting the active Save;
- read-only Local Profiles;
- same visible manager names remaining distinct `profile_*` identities;
- retained Local Profiles after single-Save deletion;
- non-mutating old-singleton compatibility opening;
- fail-closed presentation when storage authority is corrupt, dual or otherwise unverifiable;
- keyboard/focus integration with the existing Settings dialog;
- phone, Chromebook and reduced-motion containment.

Stable prefixes remain `save_*`, `season_*` and `profile_*`. Display names are labels, never identity keys.

Profile rename/edit, historical profile mapping and standalone profile creation remain separate future candidates unless explicitly authorized.

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

The current `1.3.0-r1` runtime preserves the v1.2 offline architecture and adds resilience proof around activation, corruption, restart and exact local-data preservation.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- no automatic install-time activation;
- explicit Update Ready activation at safe Home / Showdown Home boundaries;
- Candidate C busy/recovery protection around activation;
- whole-runtime cache selection, never per-file revision mixing;
- current/previous-known-good recovery using `1.3.0-r1` then `1.2.0-r2`;
- worker-owned connectivity verification;
- explicit nonfatal offline degradation for external media;
- lazy PWA controller;
- install/update presentation only inside Settings;
- lazy Save Library UI and CSS included in the verified complete shell.

`CMS_ACTIVATE_UPDATE` verifies the complete candidate shell, awaits successful `skipWaiting()`, and only then acknowledges activation acceptance.

## Protected visual baseline

The r2 iOS standalone loading correction is structural: safe-area/viewport behavior is separated from the visual composition. Mobile loading uses a bounded width-owned top band, independent subject-safe Marco Reus image box and opacity/filter-only animation that cannot move protected geometry.

Do not restore floating/sticky global install UI, viewport-height-driven image sizing or random object-position/crop/brightness hacks.

Preserve the current FIFA 17-inspired Home and Save Library presentation unless a reproduced defect or separately authorized product candidate requires change.

## Current production proof

PR #53 exact final head `2021a0a2eaed26f0aca6639278de82afe2a28d6d` passed all 13 normal PR workflow families.

Runtime feature merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa` passed all 14 permanent push workflow families.

Release Integration Burn-In `31771269732` passed both complete stateful integration journeys.

Post-merge Stability `31771269740` passed, including deployed-site-smoke job `94677863736`.

The deployed smoke verified 71 `1.3.0-r1` runtime files byte-for-byte and passed runtime provenance, Home, visible Save Library, licensed football visuals, Candidate A, Candidate B, Candidate C, Installable Offline App/offline boundary and complete deployed journey proof.

## Validation and performance locks

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation PRs generally run 13 families; Release Integration Burn-In is main/manual release authority.

Protected ceilings:

- eager raw <=165,000 bytes;
- eager gzip <=37,500 bytes;
- Marco Reus startup portrait <=95,000 bytes;
- combined first-party startup <=260,000 bytes;
- normal loading minimum 2700 ms;
- reduced-motion loading 220 ms.

Exact final PR #53 measurements were eager raw 162,781 bytes, eager gzip 37,415 bytes, lazy feedback 4,845 bytes, Reus startup portrait 88,492 bytes and combined first-party startup 251,273 bytes.

Do not raise limits, relax timeouts or weaken assertions to make a change pass.

## Current continuation boundary

Visible Local Profiles / Save Library Core UI is complete and production-proven.

No next substantial product candidate is automatically assigned.

Preserve and observe the proven baseline unless new evidence or an explicitly authorized later milestone requires focused work.

Profile editing, historical mapping, cloud, accounts, QR pairing, synchronization, remote transport, distributed revision/device identity systems, backup/import redesign, gameplay changes and framework rewrites are not implicitly authorized.

PR #37 and PR #35 remain historical draft work and are not current authority.
