# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Application milestone: v1.4.0 — Product Deepening
Current production runtime: `1.4.0-r1`
Previous known-good whole shell: `1.3.0-r2`
Current shipped product layer: Phase B Save Library Experience 2.0 first slice + Phase C Showdown Home first slice
Current runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (multi-Save); Phase B `65b6c9db…`; Phase C `dec1d3ba…`
Feature release version: **v1.4.0** (visible on public site footer + app-asset-revision)
Release status: merged, deployed, and production-proven
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

v1.4.0 formalizes the Product Deepening first slices (Save Library UX + Showdown Home) under a visible application version. The completed v1.3.0 — Recovery & Device Resilience Hardening baseline, multi-Save formatVersion 2 portability, identity-safe Analytics, and private two-manager locks remain protected.

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
12. `RELEASE_V1.4.0.md`
13. `CAREER_MODE_SHOWDOWN_V1.4.0_MAINTENANCE_HANDOFF.md`
14. `V1.3.0_R2_PRODUCTION_PROOF.md` for historical frozen production evidence
15. `POST_V1_ROADMAP_EXECUTION.md`

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

The completed dependency chain includes identity foundation, canonical persistence, runtime authority cutover, visible Save Library UI, explicit manager identity, Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 multi-Save portability (PR #67), Phase B first slice (PR #70), and Phase C first slice (PR #73).

Stable prefixes remain `save_*`, `season_*` and `profile_*`. Display names are labels, never identity keys.

## Architecture and data safety

Navigation/history/Smart Back authority: `js/screens.js`.
Public raw browser-storage authority: `js/storage.js`.
Raw transaction engine: `js/storageTransaction.js`.
Save Library runtime mutation authority: `js/saveLibraryRuntime.js`.
Analytics authority: `js/analytics.js`.

Public canonical localStorage keys after cutover:
1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C is the only destructive import Apply stage.

## Installable Offline App

Current whole shell: `1.4.0-r1`. Previous known-good: `1.3.0-r2`.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- explicit Update Ready activation at safe boundaries;
- current/previous-known-good recovery using `1.4.0-r1` then `1.3.0-r2`.

## Current continuation boundary

Phase B first slice and Phase C first slice are complete and production-proven under formal **v1.4.0**.

**No product candidate is currently authorized.** Stop until a further explicit owner instruction.

Public community / global leaderboard remain **ELIMINATED**. Private remote joining remains **BLOCKED**.

PR #37 and PR #35 remain historical draft work and are not current authority.
