# CHANGELOG — Career Mode Showdown

This file preserves project continuity so later development does not reconstruct the project from old chats or mistake temporary implementation builds for a replacement roadmap.

Two forms of versioning exist in project history:

1. **Original Project Bible milestones:** `v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`.
2. **Implementation/stabilization builds:** later numbers introduced while the functional product was being corrected, hardened, optimized and polished.

The implementation builds are real history, but they do not replace the original long-term destination. After current stabilization, the project returns to **v0.95**, then **v1.0**.

---

# v0.16.0-r3 — Chromebook / Responsive Home Stabilization

Status: **current stabilization candidate**

## Problem reported

Mobile presentation was clean, but the desktop/laptop Home layout looked poor on ChromeOS/Chromebook:

- some Home sections could visually overlap;
- soundtrack/trailer placement felt disconnected from the main Career navigation;
- media expansion could collide with later rows;
- short Chromebook browser viewports had too much vertical pressure.

## Root cause

The desktop Home CSS grid used fixed `108px` tracks.

The soundtrack/trailer tile occupied one of those fixed rows, but after a YouTube iframe loaded the tile raised its own minimum height to roughly `165px`. The grid track itself remained fixed, so the media item could overflow its row and visually cover the following Career/menu row.

The mobile layout did not show the same defect because the mobile breakpoint already used auto-sized rows.

## Fix

- Replaced the desktop Home grid's fixed row model with content-sized tracks.
- Moved core Career/navigation tiles into the first two rows.
- Moved soundtrack/trailer media into the third row below primary navigation.
- Media row now grows naturally when an iframe is loaded.
- Converted the desktop media selector from a long horizontal strip to a compact four-column grid.
- Added a low-height desktop/laptop breakpoint for typical Chromebook-style browser heights.
- Reduced header/menu/footer vertical pressure at low desktop heights while keeping `main` vertically scrollable.
- Kept the existing tablet/mobile flow intact.
- Preserved user-initiated-only YouTube loading and one-iframe behavior.

## Cache integrity

- Advanced deployed local-asset revision to `0.16.0-r3`.
- Updated `index.html` initial asset URLs.
- Updated lazy-module fallback revision while retaining the shell-owned revision architecture.

## Project continuity

- Updated `PROJECT_STATE.md` to record r3 as a stabilization fix, not a new milestone.
- Updated `NEXT_TASK.md` to make Chromebook/mobile verification the current release gate.
- Updated `README.md` while retaining the original `v0.95 → v1.0` direction.

---

# v0.16.0-r2 — Back / Cache / Blueprint Re-anchor

Status: **implemented; superseded as deployed revision by r3**

## Navigation

- Fixed contextual Back behavior from Completed Showdown Home.
- Legacy, Trophy Room and New Showdown can return to the completed hub when opened from there.
- The same screens still return to Main Menu when Main Menu was their origin.
- Added deterministic navigation regression cases.

## Cache architecture

- Fixed the possibility of newer source reusing an older `r1` cache identity.
- Added a single shell-owned `<meta name="app-asset-revision">` value.
- Initial assets use it.
- Lazy assets derive from it.
- Diagnostics validate against it.
- CI derives the expected value from it.

## Roadmap continuity

- Rebuilt Project State around current source + original Project Bible.
- Separated original blueprint from later owner-approved amendments.
- Restored the original `v0.95 → v1.0` release destination.
- Identified finite remaining blueprint gaps instead of opening another feature sequence.
- Restored this Changelog as a permanent continuity artifact.

---

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Status: **implemented foundation retained in r3**

## Performance

- Replaced accumulated multi-generation core styles with unified `css/app.css`.
- Reduced startup to seven JavaScript files and one stylesheet.
- Moved gameplay engines/data behind an on-demand gameplay package.
- Kept Legacy/analytics/Statistics/Trophy Room/Rule Book lazy.
- Kept diagnostics off the critical startup path.
- Added startup byte-budget validation.
- Removed obsolete prototype files and superseded core CSS layers.

## Navigation

- Established `js/screens.js` as single route/history authority.
- Replaced competing hard-coded Back behavior with state-aware routing.
- Bounded route history.
- Added route legality checks based on actual showdown state.
- Prevented locked clubs from reopening setup.
- Prevented completed Transfer Challenge from reopening obsolete transfer state.
- Prevented completed showdowns from reopening setup/transfer/results-entry state.

## Completed-showdown recovery

- Introduced Completed Showdown Home instead of a terminal completed page.
- Preserved valid onward routes to Final Summary, Legacy, Trophy Room, Rivalry Statistics, New Showdown and Main Menu.
- Added accurate `Legacy sync pending` state if archiving fails while active completed save remains safe.

## Validation

- Added GitHub Actions `node --check` across JavaScript/data source.
- Added executable scoring regression cases.
- Added canonical route/state regression tests.
- Added release shell / startup budget / route-history architecture checks.

---

# v0.15.x — Stability / Performance Consolidation

Status: **implemented foundation retained**

Major surviving systems from this phase include:

- transaction-aware localStorage operations;
- failure-aware Legacy/reset operations;
- race-safe League Wheel callbacks;
- race-safe Club Assignment reveal callbacks;
- persisted real transfer deadline;
- debounced/deduplicated transfer drafts;
- hidden/off-screen timer shutdown;
- stabilized Season Entry and progression;
- lazy secondary modules;
- lightweight menu media controller;
- runtime diagnostics.

Do not revert to eager, unguarded or duplicated versions of these systems.

---

# v0.10.1 — Season / Routing / Persistence Stabilization

Status: **implemented**

This followed the reported failure where Complete Season could appear to do nothing.

Major fixes:

- deterministic/cache-versioned asset loading;
- atomic Complete Season behavior;
- persistence rollback on save failure;
- visible runtime error/success feedback;
- safer screen routing;
- hardened localStorage handling;
- stronger runtime error boundary.

It established the rule that a critical season transition must either save successfully or preserve/restore the previous valid state.

---

# v0.10 — Statistics / Trophy Room Expansion

Status: **implemented and preserved**

Added:

- read-only rivalry analytics;
- cumulative manager analytics;
- records;
- Trophy Room;
- statistics UI;
- analytics presentation.

The data remains derived from saved showdowns rather than manually editable.

---

# v0.9 — Legacy / Data Management

Status: **implemented and owner-tested during development**

Implemented:

- completed-showdown archive;
- season-by-season Legacy history;
- final scores/outcomes;
- individual Legacy deletion;
- delete-all Legacy;
- data-management protections.

This fulfilled the original v0.9 requirement that a complete rivalry remain available as history.

---

# v0.8 — Transfer Challenge / Finalized Competitive Rules

Status: **implemented and owner-tested during development**

Established the later owner-approved Transfer Challenge:

- 15-minute window;
- maximum three signings per manager;
- three opponent guesses;
- guess is league or nationality;
- correctly guessed signing must be released.

Also established the authoritative scoring amendment:

- 100 points and/or 100 goals share one +1;
- Top Scorer and/or Top Assist share one +1;
- maximum season score = 11;
- equal non-zero totals = draw;
- only 0-0 uses league position then league points.

This supersedes older Project Bible wording that can be read as four independent bonus points.

---

# v0.7 — Working Showdown / Season Progression

Status: **implemented**

By this phase the application contained the usable rivalry flow required to move through seasons:

- Showdown Home;
- result entry;
- scoring integration;
- Season Summary;
- configured-season progression;
- active-save continuity.

The original v0.7 setup requirements—new showdown, league setup and permanent club assignment—were also already implemented across the setup flow.

---

# Original roadmap foundations

## v0.6.1 — Application Framework

Original goals now fulfilled/hardened:

- application shell;
- navigation;
- Back behavior;
- storage;
- reusable UI behavior.

The implementation responsibility evolved into current modules such as `screens.js`; obsolete filenames should not be recreated merely for historical symmetry.

## v0.6 — Wheel System

- League Wheel
- selection animation
- league result
- visual presentation

Later builds added persistence locking and operation-identity protection.

## v0.5 — Data Foundation

- league database
- club database
- data engine

## v0.4 — Functional Prototype

- first functional HTML/CSS/JS website
- basic navigation and presentation

## v0.3 — UI Direction

- FIFA-17-era-inspired menu direction
- tile navigation
- game-like UX
- FUT-inspired club reveal concept

## v0.2 — Experience Design

Defined the shared rivalry concept, league selection, permanent clubs, season flow and history.

## v0.1 — Project Foundation

Established the product objective: turn two separate FIFA Career Mode saves into one persistent competitive rivalry.

---

# Next planned original milestone

## v0.95 — Polish / Blueprint Alignment Release Candidate

Status: **pending successful v0.16.0-r3 owner regression**

Finite remaining alignment work:

- Settings blueprint surface;
- Main Menu cumulative Statistics alignment using existing analytics/Trophy Room/Rivalry Statistics systems;
- pre-final Season review/confirmation safety if the browser experience still lacks an equivalent step;
- final Chromebook/laptop/mobile/accessibility/performance polish;
- complete persistence/navigation/gameplay regression.

After v0.95 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.
