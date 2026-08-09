# CHANGELOG — Career Mode Showdown

This file preserves continuity so later development does not reconstruct the project from old chats or mistake implementation revisions for a replacement roadmap.

The release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project is currently inside the original **v0.95** convergence milestone.

---

# v0.95.0-r7 — Main Menu Career Statistics Alignment

Status: **implemented and machine-validated; owner browser acceptance pending**

Workstream 4 aligns the Main Menu with the Statistics blueprint by clarifying existing analytics destinations rather than creating another data engine.

## Home information architecture

- Replaced the top-level **TROPHY ROOM** Home tile with **STATISTICS**.
- Preserved the accepted Home tile count, Continue Career hierarchy, Settings placement and media rail geometry.
- Trophy Room remains fully available as an honours destination rather than competing with Statistics at the top level.

The three analytics surfaces now have explicit jobs:

1. **Career Statistics** — permanent all-time completed-career data from Home.
2. **Rivalry Statistics** — the currently loaded showdown only, contextual to Showdown Home.
3. **Trophy Room** — detailed honours cabinets and all-time records.

## Career Statistics

Added dynamic lazy route `careerStatistics` in the existing Statistics presentation module.

Current content:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won;
- Career Table;
- two-manager Career comparison when the completed archive contains exactly two manager identities;
- Career Leaders for Showdown wins, Career points, trophies, Season wins, average Season score and best Season score;
- Current Rivalry bridge when a showdown is loaded;
- Trophy Room bridge;
- explicit empty state when no completed history exists.

Career Statistics reads the existing completed-history data. No new statistics storage record/key was added.

## One analytics engine

`js/analytics.js` remains the only calculation engine.

- `buildCareerAnalytics()` powers permanent Career Statistics and Trophy Room.
- `buildRivalryAnalytics(showdown)` powers current Rivalry Statistics.

No `analytics2`, parallel accumulator, duplicated manager-record model or statistics persistence layer was introduced.

## Shared presentation

The Career Table renderer now lives in `js/statistics.js` and is reused by Trophy Room.

Trophy Room no longer contains its own duplicate `createCareerStandingsTable()` implementation.

Existing Trophy Room manager cabinets and all-time-record views remain intact.

Existing Rivalry Statistics head-to-head and Season-by-Season presentation remains intact.

## Lazy/performance architecture

Career Statistics no longer requires the gameplay package merely to read saved history.

Opening Statistics from Home lazy-loads only:

- `css/analytics.css`;
- `js/analytics.js`;
- `js/statistics.js`.

Trophy Room adds `js/trophyRoom.js` only when requested.

Read-only Statistics routes are not `GAMEPLAY_SCREENS`.

The initial shell remains one local stylesheet and seven local JavaScript files.

## Navigation

`js/screens.js` remains sole route/history authority.

- Career Statistics safe Back target: Main Menu.
- Rivalry Statistics safe Back target: Showdown Home / Main Menu.
- Trophy Room safe targets: Showdown Home → Career Statistics → Main Menu.
- Advisory history returns Trophy Room to Career Statistics when it was opened there.
- Completed Showdown Home remains a valid Trophy Room parent.
- No page-specific `screenHistory` manipulation was introduced.

## Diagnostics

Runtime diagnostics now verify:

- Home Career Statistics tile exists;
- Career Statistics lazy binding exists;
- Career Statistics is represented in optional-module state.

## Validation

Added **Validate Statistics Workstream**.

Its executable completed-history fixtures verify:

- completed Showdown count;
- Season count;
- total Career points;
- total trophies;
- manager Showdown records;
- manager Career points/trophies;
- Transfer signing/release accumulation;
- highest league points/goals;
- highest Season score;
- current Rivalry analytics.

Its architecture checks verify:

- Home label/id alignment;
- no top-level competing Trophy Room tile;
- analytics remains lazy;
- Career Statistics does not load the gameplay package;
- one analytics engine only;
- Trophy Room reuses the shared Career Table;
- analytics routes remain centrally owned.

The established Static App, Transfer Workstream and Settings Workstream gates remain in parallel.

---

# v0.95.0-r6 — Settings / Persistent Motion Accessibility

Status: **owner browser accepted; retained by r7**

Workstream 3 added the small lazy Settings surface without changing competition rules, Transfer state or central routing.

## Settings architecture

- Home Settings tile.
- Lazy `js/settings.js` + `css/settings.css`.
- Accessible modal instead of a new route.
- Application/build information.
- Motion/accessibility preference.
- Gateway to existing Legacy Data Management.
- No account/backend/cloud/theme/notification/online preference expansion.

## Application preference

Storage key:

`careerModeShowdown.preferences`

Schema version 1 currently stores:

`reducedMotion: boolean`

- false = Follow Device;
- true = force reduced non-essential motion.

System/browser reduced-motion always wins. There is no force-full-motion override.

Showdown-data reset intentionally preserves this application preference.

## Motion integration

- Club Reveal consumes the centralized effective preference.
- League Wheel standard timing remains 4000 ms + 700 ms.
- League Wheel reduced timing is 80 ms + 120 ms.
- User-forced and OS-requested reduced motion share one CSS/JS contract.

This fixed the prior hidden-delay case where visual animation could be suppressed while JavaScript still waited four seconds.

## Accessibility

Preserve modal semantics, inert background, Escape/backdrop close, focus containment/restoration, keyboard radiogroup navigation, selected-option focus preservation and Chromebook/mobile viewport guards.

---

# v0.95.0-r5 — Phased Transfer Challenge / Canonical FIFA 17 Transfer Data

Status: **owner browser accepted; retained by r7**

Workstream 2 established:

**Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Preserved competition rules while adding:

- explicit persistent Transfer phases;
- critical save/rollback transitions;
- debounced active-phase drafts;
- old-record migration;
- 36 FIFA 17 Transfer League options;
- 164 FIFA 17 player nationalities;
- controlled searchable selectors;
- canonical-ID RELEASE/SAFE matching;
- viewport/keyboard/ARIA selector behavior;
- lazy Transfer metadata.

The Showdown League Wheel remains five leagues.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **owner browser accepted; retained by r7**

Workstream 1B established:

- fallback-safe Barlow Condensed display typography;
- original deterministic procedural crest identities for all 98 Showdown clubs;
- two sealed club packs;
- save-before-reveal / rollback / permanent no-reroll transaction;
- `Clubs Assigned` confirmation checkpoint;
- explicit Rivalry Confirmation;
- same-pair refresh/Continue recovery;
- Chromebook/mobile reveal layout.

No official club badge vectors/images or proprietary FIFA/EA font files are bundled.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency

Normalized Rule Book, Statistics, Trophy Room and Legacy contrast while keeping optional styles lazy.

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Corrected runtime-version diagnostics and Chromebook Club Reveal geometry.

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established `Clubs Assigned` as the persisted pair/confirmation checkpoint and staged reveal flow.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Owner accepted. Established content-sized Home rows, media rail below navigation and low-height Chromebook density handling.

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

Fixed contextual completed-showdown Back behavior, centralized cache revision ownership and restored v0.95 → v1.0 roadmap authority.

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Established one unified initial stylesheet, seven-script startup, lazy gameplay/optional modules, centralized state-aware Back, completed-showdown recovery and exact-head CI/startup budgets.

# v0.15.x — Stability / Performance Consolidation

Established transaction-safe persistence, race-safe delayed operations, persisted Transfer deadline, debounced drafts, hidden timer shutdown, stabilized Seasons, lazy secondary modules and diagnostics.

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe Season persistence/rollback, visible errors, route validation and hardened localStorage failure behavior.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, records, Trophy Room and Statistics UI.

# v0.9 — Legacy / Data Management

Added completed-showdown archive/history and protected deletion/reset flows.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established 15-minute Transfer Challenge and authoritative max-11 grouped-bonus scoring/tiebreak rules.

# v0.7 — Working Showdown / Season Progression

Established Showdown Home, Season Results, scoring, Season Summary, multi-season progression and active-save continuity.

# v0.6.1 and earlier — Foundation

Application framework/navigation/storage, League Wheel, league/club data, functional static prototype and FIFA-17-era UI direction.

---

# Remaining v0.95 roadmap

## Current gate

Owner browser acceptance of **`0.95.0-r7` Workstream 4 Career Statistics alignment**.

## Workstream 5 — Season pre-commit review

Inspect Complete Season and add a lightweight review/confirmation before irreversible Season completion if an equivalent safeguard is absent. Preserve drafts on edit/cancel and existing transactional save/rollback on final commit.

## Workstream 6 — final v0.95 regression/polish

Accessibility, responsive consistency, typography/contrast, feedback, performance and full gameplay/persistence/navigation regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.