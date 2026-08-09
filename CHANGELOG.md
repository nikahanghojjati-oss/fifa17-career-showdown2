# CHANGELOG — Career Mode Showdown

This file preserves project continuity so later development does not reconstruct the project from old chats or mistake temporary implementation builds for a replacement roadmap.

Two forms of versioning exist in project history:

1. **Original Project Bible milestones:** `v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`.
2. **Implementation/stabilization builds:** later numbers introduced while the product was being corrected, hardened, optimized and polished.

Implementation builds are real history but do not replace the original long-term destination. After current stabilization, the project returns to **v0.95**, then **v1.0**.

---

# Roadmap Audit Correction — FUT-style Club Reveal

Status: **recorded before v0.95 implementation**

A direct comparison of the original Project Bible with current `index.html` and `js/clubAssignment.js` found an incorrect earlier milestone classification.

## Original requirement

The original v0.7 Showdown Creation milestone required:

- club-assignment integration;
- FUT-style reveal;
- final showdown/rivalry confirmation.

The Club Assignment specification required the experiential sequence:

**Selected League Confirmed  
→ Reveal Begins  
→ First Club Revealed  
→ Second Club Revealed  
→ VS Presentation  
→ User Confirmation  
→ Showdown Begins**

## Current source reality

Current club-assignment **mechanics are strong and complete**:

- one random pair;
- same selected league;
- different clubs;
- operation/showdown/league identity guards;
- atomic persistence;
- rollback on failure;
- permanent club lock;
- no reroll after assignment.

Current presentation, however, is only a basic two-card reveal after a short delay. It does not contain a staged first/second club ceremony, complete final VS tableau, or explicit rivalry confirmation.

## Corrected classification

`v0.7` is now recorded as:

**Mechanics complete; original FUT-style reveal / rivalry-confirmation acceptance incomplete.**

This unfinished v0.7 obligation is carried into the finite **v0.95 Polish / Blueprint Alignment** milestone rather than reopening old architecture or inventing a new build-number roadmap.

## Future implementation guardrails

The v0.95 reveal must preserve all later reliability/performance improvements:

- current assignment engine and no-reroll invariant;
- atomic save/rollback;
- identity-safe delayed operations;
- smart navigation;
- lazy gameplay runtime;
- unified CSS;
- Chromebook/mobile responsiveness;
- existing deterministic `visualIdentity.js` generated club identities;
- reduced-motion support;
- no heavy canvas/WebGL/video reveal engine;
- no official badges/copied EA/FUT artwork/proprietary FIFA fonts;
- no continuous animation loops or animation-phase storage churn.

---

# v0.16.0-r3 — Chromebook / Responsive Home Stabilization

Status: **current stabilization candidate**

## Problem / fix

Mobile was clean, but ChromeOS/Chromebook Home could overlap because desktop Home used fixed grid tracks while the media iframe could grow taller than its track.

r3:

- replaced fixed desktop Home rows with content-sized tracks;
- placed Career/navigation before soundtrack/trailer media;
- allowed media row to grow naturally;
- changed desktop media selection to a compact grid;
- added low-height laptop/Chromebook density rules;
- preserved tablet/mobile layout;
- preserved lazy one-iframe media loading.

## Cache / validation

- deployed asset revision advanced to `0.16.0-r3`;
- lazy assets remain shell-revision driven;
- CI protects the responsive layout invariants plus existing syntax/scoring/navigation/startup-budget contracts.

---

# v0.16.0-r2 — Back / Cache / Blueprint Re-anchor

- Fixed contextual Back from Completed Showdown Home.
- Legacy/Trophy Room/New Showdown return to completed hub when opened there, Main Menu when opened there.
- Centralized deployment revision ownership in `index.html` meta.
- Lazy loader/diagnostics/CI derive from the same revision.
- Re-established original `v0.95 → v1.0` release destination.
- Restored Project State / Next Task / Changelog continuity discipline.

---

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

- Unified core visual system into `css/app.css`.
- Reduced initial runtime to seven JavaScript files and one stylesheet.
- Moved gameplay package on demand.
- Kept Legacy/analytics/Statistics/Trophy Room/Rule Book lazy.
- Established `js/screens.js` as single state-aware route/history authority.
- Prevented completed/locked state from reviving obsolete routes.
- Added Completed Showdown Home recovery hub.
- Added GitHub Actions syntax/scoring/navigation/shell validation.

---

# v0.15.x — Stability / Performance Consolidation

Surviving foundations include:

- transaction-aware localStorage operations;
- failure-aware Legacy/reset behavior;
- race-safe League Wheel and Club Assignment operations;
- persisted real transfer deadline;
- debounced/deduplicated transfer drafts;
- hidden/off-screen timer shutdown;
- stabilized Season Engine;
- lazy optional modules;
- lightweight menu media;
- runtime diagnostics.

These must be preserved by v0.95 work.

---

# v0.10.1 — Season / Routing / Persistence Stabilization

Following a Complete Season failure report, this phase strengthened:

- deterministic/cache-versioned loading;
- atomic season persistence/rollback;
- visible runtime error feedback;
- safe routing;
- localStorage failure handling;
- application error boundaries.

Core principle established: a critical transition must save successfully or preserve/restore the previous valid state.

---

# v0.10 — Statistics / Trophy Room Expansion

Added and preserved:

- read-only rivalry analytics;
- cumulative manager analytics;
- records;
- Trophy Room;
- Statistics UI/presentation.

Analytics remain derived from saved showdowns rather than manually editable.

---

# v0.9 — Legacy / Data Management

Status: **functionally complete**

Implemented completed-showdown history, season history, outcomes, individual deletion, delete-all and data-management protections.

---

# v0.8 — Transfer Challenge / Finalized Competitive Rules

Status: **functionally complete**

Established owner-approved Transfer Challenge:

- 15-minute window;
- max three signings each;
- three opponent guesses;
- league or nationality guesses;
- correctly guessed signing released.

Established authoritative scoring amendment:

- 100 points and/or 100 goals share one +1;
- Top Scorer and/or Top Assist share one +1;
- maximum season score 11;
- equal non-zero totals draw;
- only 0-0 uses league position then league points.

---

# v0.7 — Showdown Creation

Status: **mechanics complete; original reveal/confirmation acceptance incomplete**

Implemented mechanics include:

- showdown creation;
- manager names;
- season count;
- League Wheel integration;
- selected league persistence;
- random permanent club assignment;
- same-league/different-club validation;
- saved club lock/no reroll;
- progression into Showdown Home.

Still required by the original v0.7 blueprint:

- genuinely staged FUT-style club reveal;
- separate first/second club reveal moments;
- final complete VS rivalry presentation;
- explicit user confirmation before Showdown Home.

This obligation is intentionally carried forward into v0.95 using the hardened modern implementation.

---

# Original roadmap foundations

## v0.6.1 — Application Framework

Application shell, navigation, Back behavior, storage and reusable UI behavior are implemented and substantially hardened.

## v0.6 — Wheel System

League Wheel/selection exists; later builds added persistence locking and operation-identity protection.

## v0.5 — Data Foundation

League database, club database and data engine complete.

## v0.4 — Functional Prototype

Initial functional HTML/CSS/JS site and navigation complete historically.

## v0.3 — UI Direction

Established FIFA-17-era-inspired tile navigation, game-like UX and FUT-inspired club-reveal intention.

## v0.2 — Experience Design

Established rivalry concept, league selection, permanent clubs, season flow and history.

## v0.1 — Project Foundation

Established the product objective: turn two separate Career Mode saves into one persistent competition.

---

# Next original milestone

## v0.95 — Polish / Blueprint Alignment Release Candidate

Status: **pending successful v0.16.0-r3 owner regression**

Finite work, in order:

1. complete the carried-forward v0.7 FUT-style reveal + rivalry confirmation;
2. Settings blueprint surface;
3. Main Menu cumulative Statistics alignment using existing analytics/Trophy Room/Rivalry Statistics;
4. pre-final Season review/confirmation safety if still missing;
5. final Chromebook/laptop/mobile/accessibility/performance polish;
6. complete persistence/navigation/gameplay regression.

After v0.95 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.
