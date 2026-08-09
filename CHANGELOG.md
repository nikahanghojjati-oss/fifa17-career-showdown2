# CHANGELOG — Career Mode Showdown

This file records meaningful project progression so future development can continue without reconstructing history from old conversations or commit fragments.

Two forms of versioning appear in project history:

1. **Original Project Bible milestones** — the planned path toward v1.0 (`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`).
2. **Implementation builds** — additional versions created while the functional core was implemented, corrected, stabilized and optimized between the original milestones.

Implementation build numbers do not replace the original release destination. The current project should converge back into the original `v0.95` polish milestone and then `v1.0`.

---

## v0.16.0-r2 — Stabilization / Blueprint Re-anchor

Status: **Current stabilization candidate**

### Reliability fixes

- Fixed contextual Back policy for screens opened from Completed Showdown Home.
- Legacy opened from Completed Showdown Home can return to that hub.
- Trophy Room opened from Completed Showdown Home can return to that hub.
- New Showdown opened from Completed Showdown Home can return to that hub.
- The same screens still return to Main Menu when Main Menu is their actual origin.
- Expanded automated navigation regression cases for these contextual-parent routes.

### Cache/deployment integrity

- Advanced the deployed asset revision from `0.16.0-r1` to `0.16.0-r2` because v0.16 source bytes changed after the original r1 key had been introduced.
- Added one shell-owned `<meta name="app-asset-revision">` value.
- Initial CSS/JavaScript asset URLs use that revision.
- Lazy gameplay/history module URLs now derive their revision from the shell instead of maintaining an independent hard-coded release key.
- Runtime diagnostics derive the expected revision from the same shell value.
- CI derives its expected revision from the same shell value and rejects mixed revisions.

### Project continuity

- Rebuilt `PROJECT_STATE.md` around current source plus the original Project Bible roadmap.
- Explicitly separated current implementation reality from historical/superseded Bible text.
- Recorded the later max-11 scoring amendment and Transfer Challenge as authoritative current rules.
- Re-established the original `v0.95 → v1.0` destination.
- Identified finite blueprint-alignment work remaining after current regression: Settings surface, Main Menu Statistics alignment, and pre-final season review/confirmation inspection.
- Rewrote `NEXT_TASK.md` as a stabilization gate followed by finite v0.95 alignment, rather than another open-ended build sequence.
- Restored this Changelog as required by the original development workflow.

---

## v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Status: **Implemented; superseded by r2 asset revision**

### Runtime / performance

- Replaced the accumulated multi-generation core CSS stack with one unified `css/app.css`.
- Reduced the initial application shell to seven JavaScript files and one stylesheet.
- Moved league/club data and gameplay engines behind an on-demand gameplay package.
- Kept Legacy, analytics, Statistics, Trophy Room and Rule Book lazy-loaded.
- Kept diagnostics off the critical startup path.
- Added a startup local-byte budget to CI.
- Removed obsolete prototype stubs and superseded CSS files.

### Navigation

- Replaced competing hard-coded Back destinations/history behavior with a single state-aware route authority in `js/screens.js`.
- Centralized ordinary `.backButton` interception.
- Made route history advisory and bounded.
- Added legal route validation from actual showdown state.
- Prevented locked club assignments from reopening obsolete League/Club setup.
- Prevented completed Transfer Challenges from reopening obsolete transfer state.
- Prevented completed showdowns from returning to setup/transfer/results-entry screens.
- Completed showdowns resume to Completed Showdown Home.

### Completion recovery

- Replaced the old terminal completed dashboard state with a completion hub.
- Added valid routes to Final Summary, Legacy, Trophy Room, Rivalry Statistics, New Showdown and Main Menu.
- Distinguished successful Legacy synchronization from `Legacy sync pending` while retaining the safe active completed save.

### Validation

- Added GitHub Actions validation for every JavaScript/data source file using `node --check`.
- Added executable scoring regression cases.
- Added executable canonical-route regression cases.
- Added checks for cache revision, initial asset budget, required IDs, centralized Back authority and history encapsulation.

---

## v0.15.x — Pre-v0.16 stability / performance consolidation

Status: **Implemented foundation carried into v0.16**

Current source headers and surviving systems show the major stabilization direction completed before the v0.16 shell rewrite:

- transaction-safe localStorage persistence and Legacy operations;
- race-safe League Wheel delayed operations;
- race-safe Club Assignment reveal operations;
- high-performance Transfer Challenge behavior;
- real persisted transfer deadline rather than timer-state dependence;
- debounced/deduplicated transfer drafts;
- hidden/off-screen timer shutdown;
- stabilized Season Entry / progression logic;
- lazy secondary modules;
- lightweight menu media behavior;
- runtime diagnostics.

These systems remain part of the current implementation. Do not revert to older synchronous/eager or unguarded behavior.

---

## v0.10.1 — Season / Routing / Persistence Stabilization

Status: **Implemented**

This stabilization pass followed a reported failure where pressing Complete Season could appear to do nothing.

Major corrections included:

- deterministic/cache-versioned asset loading;
- stronger Complete Season persistence and rollback handling;
- visible error/success feedback instead of silent failure;
- safer routing that did not hide the current screen before a target was known to be valid;
- hardened browser-storage error handling;
- improved application runtime error reporting;
- removal/disablement of dead-looking controls until their actual module behavior was available.

This pass established the principle that a season must either save successfully or preserve/restore its previous valid state.

---

## v0.10 — Statistics / Trophy Room expansion

Status: **Implemented; subsequently stabilized**

Added current historical/analytics capabilities including:

- read-only rivalry analytics;
- cumulative manager statistics;
- career records;
- Trophy Room presentation;
- statistics UI;
- analytics styling.

The analytics system derives results from saved showdowns rather than allowing manual statistic editing.

These additions went beyond the minimum original v0.9 history surface but are now established current features and should be preserved.

---

## v0.9 — Legacy / Data Management

Status: **Implemented and owner-tested during development**

Implemented the persistent completed-rivalry history layer:

- completed showdown archive;
- season-by-season Legacy history;
- final scores and rivalry outcomes;
- individual completed-showdown deletion;
- delete-all Legacy history;
- local data-management protections.

This fulfilled the core original v0.9 requirement that a full showdown could finish and remain visible as history.

---

## v0.8 — Transfer Challenge / Corrected Competitive Rules

Status: **Implemented and owner-tested during development**

Established the owner-approved Transfer Challenge season phase:

- 15-minute window;
- maximum three signings per manager;
- three opponent guesses;
- guess type league or nationality;
- correct match means signing must be released.

Also established the later authoritative scoring correction:

- 100 league points and/or 100 league goals share one +1 bonus;
- Top Scorer and/or Top Assist share one +1 bonus;
- maximum season score is 11;
- equal non-zero scoring totals are a draw;
- only 0-0 uses league-position/league-points fallback.

This supersedes older Project Bible text that can be read as four separate +1 bonus awards.

---

## v0.7 — Working Season / Showdown Progression

Status: **Implemented and owner-tested during development**

During implementation, build numbering no longer mapped one-to-one to the original roadmap headings. By this stage the working application had moved beyond the original setup-only definition and included the usable season flow required to continue the rivalry.

Established working pieces included:

- Showdown Home;
- season result entry;
- scoring integration;
- Season Summary;
- progression between configured seasons;
- saved active showdown continuity.

The original roadmap's v0.7 showdown-creation requirements were also already implemented across the setup/league/club flow.

---

# Original roadmap history

The following entries describe the original Project Bible milestones and early project development direction.

## v0.6.1 — Application Framework

Status: **Complete in current implementation**

Original goals:

- application shell;
- header/footer;
- main content container;
- router/navigation;
- Back behavior;
- storage foundation;
- reusable UI behavior.

The exact implementation architecture evolved later, especially with route authority living in `js/screens.js` rather than a separate `router.js`.

---

## v0.6 — Wheel System

Status: **Complete**

- league wheel concept;
- wheel rotation;
- league selection;
- league labels during selection;
- styling improvements.

Later builds added persistence locks, identity-safe callbacks and race protection.

---

## v0.5 — Data Foundation

Status: **Complete**

- league database;
- club data structure;
- data-engine foundation.

---

## v0.4 — Functional Prototype

Status: **Complete historically**

- initial HTML structure;
- first working website prototype;
- basic styling and navigation.

---

## v0.3 — UI Direction

Status: **Complete historically**

- FIFA-17-inspired visual direction;
- tile-based presentation;
- game-menu navigation philosophy;
- animation/presentation focus;
- FUT-inspired club reveal direction.

---

## v0.2 — Experience Design

Status: **Complete historically**

Defined the overall rivalry experience:

- Showdown concept;
- league selection;
- permanent club pairing;
- season progression;
- Legacy/history concept.

---

## v0.1 — Project Foundation

Status: **Complete historically**

Established the project objective: turn two separate FIFA Career Mode saves into one persistent competitive rivalry that tracks seasons, trophies, points and long-term history.

---

# Planned next roadmap milestone

## v0.95 — Polish / Blueprint Alignment Release Candidate

Status: **Pending v0.16.0-r2 owner regression acceptance**

The original roadmap defines v0.95 as the polish/experience milestone. Current v0.16 work has already implemented a large part of that objective.

Remaining finite alignment work is recorded in `PROJECT_STATE.md` and `NEXT_TASK.md` and must not expand into unrelated features.

After v0.95 acceptance, the project moves to **v1.0 Complete Release Candidate / Final Release**.
