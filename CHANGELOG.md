# CHANGELOG — Career Mode Showdown

This file preserves project continuity so later development does not reconstruct the project from old chats or mistake temporary implementation revisions for a replacement roadmap.

Two forms of versioning exist in project history:

1. **Original Project Bible milestones:** `v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`.
2. **Implementation/stabilization revisions:** builds introduced while the product was being corrected, hardened, optimized and polished.

The project is currently inside the original **v0.95** milestone. v0.95 is a finite convergence phase followed directly by v1.0.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency / Contrast Polish

Status: **implemented and deployed candidate; owner browser acceptance pending**

Owner requested stronger Rule Book font distinction and a wider visual audit before moving to the next v0.95 workstream.

## Root cause found

The current unified `css/app.css` had evolved to normalize several optional module containers into light FIFA-style panels, while the older lazy stylesheets still contained child colors authored for dark cards.

Because optional styles load before `app.css`, container backgrounds could become light while their child text stayed white or pale blue. This created inconsistent hierarchy and poor contrast in Rule Book, Trophy Room/Statistics and parts of Legacy.

## Rule Book

Rebuilt `css/rulebook.css` around the current visual language:

- compact dark hero with yellow left accent;
- cyan hero eyebrow and white hero title/body;
- light rule cards with dark headings/body copy;
- distinct section accents;
- dark scoring labels with blue values;
- yellow high-contrast maximum-11 callout;
- Chromebook low-height density rules;
- single-column mobile behavior.

## Statistics / Trophy Room

Normalized `css/analytics.css`:

- light summary/stat cards with dark values;
- intentional dark rivalry hero retained;
- light comparison tables and season progression;
- readable manager cabinets and trophy counts;
- horizontally contained career standings;
- long name/record wrapping safeguards;
- Chromebook/mobile density improvements.

## Legacy

Normalized `css/legacy.css`:

- light summary cards;
- intentional dark completed-showdown history cards;
- safer long-name/history wrapping;
- readable light Data Management panel;
- current-theme compact/danger controls;
- Chromebook/mobile refinements.

## Performance / validation

- Optional visual styles remain lazy-loaded; no new startup asset was added.
- Deployment revision advanced to `0.95.0-r3` so browsers cannot reuse old optional CSS.
- CI now validates balanced brace structure for `app.css`, `analytics.css`, `legacy.css`, and `rulebook.css`.
- Existing startup, scoring, navigation and reveal integrity checks remain.

---

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Status: **implemented; retained by r3**

Owner testing of r1 found two defects:

1. startup displayed a false integrity warning claiming runtime `0.95.0` was a version mismatch;
2. the staged Club Reveal looked misaligned and awkward on Chromebook.

## Diagnostics repair

The diagnostics module had retained a hard-coded `0.16.0` expectation. It now derives expected runtime version from the shell-owned asset revision, preventing a valid `0.95.0` runtime from being reported as corrupt after release-number changes.

## Reveal geometry repair

The active lazy Club Assignment presentation was changed to:

- equal-width/equal-height cards;
- no active angled card `clip-path`;
- constrained manager/club-name geometry;
- equal generated-identity space;
- dedicated low-height Chromebook/laptop rules;
- clean stacked mobile layout.

## Reveal motion repair

The r1 sweep was removed from the active runtime presentation. Reveal became a shorter finite sequence:

- Manager 1 around 360 ms;
- Manager 2 around 860 ms;
- VS around 1360 ms;
- confirmation around 1680 ms.

The one-pair/no-reroll persistence contract remained unchanged.

---

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Status: **source implementation established; browser defects corrected by r2/r3**

The original v0.7 Club Assignment specification required more than random club selection. It required:

**Selected League Confirmed  
→ Reveal Begins  
→ First Club Revealed  
→ Second Club Revealed  
→ VS Presentation  
→ User Confirmation  
→ Showdown Begins**

The previous implementation had reliable permanent club assignment but only a basic delayed two-card name reveal. r1 introduced the staged reveal around the existing hardened assignment transaction.

## Assignment integrity introduced

The pair is persisted **before** theatrical reveal begins:

1. generate one same-league/different-club pair;
2. set status to `Clubs Assigned`;
3. save immediately;
4. roll back pair/status if save fails;
5. begin staged reveal only after persistence succeeds.

There are no localStorage writes for individual reveal phases.

`Clubs Assigned` became the explicit persisted checkpoint for a valid permanent pair awaiting final rivalry confirmation. Refresh/Continue restores that same pair rather than drawing again.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Status: **owner accepted**

Fixed the desktop/laptop Home layout after owner testing showed overlapping sections and poor media placement on Chromebook.

- replaced fixed Home grid row behavior with content-sized rows;
- moved soundtrack/trailer rail below the primary Career tiles;
- converted desktop media choices to a four-column selector;
- added a low-height Chromebook/laptop density breakpoint;
- preserved successful mobile behavior;
- advanced cache identity and added CI guards against reintroducing the fixed-row overlap pattern.

This closed the pre-v0.95 responsive stabilization gate.

---

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

Status: **implemented; superseded by r3 presentation revision**

- fixed contextual Back from Completed Showdown Home into Legacy/Trophy/New Showdown;
- consolidated cache revision ownership into the application shell;
- re-established exact project-state documentation and original `v0.95 → v1.0` destination;
- restored project Changelog continuity.

---

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Status: **implemented foundation**

- unified initial `css/app.css`;
- seven-script initial runtime;
- gameplay package lazy loading;
- optional history/analytics modules lazy loading;
- centralized state-aware Back authority in `js/screens.js`;
- completed-showdown recovery hub;
- exact-head GitHub Actions validation;
- startup local-byte budget;
- removal of obsolete prototype files.

---

# v0.15.x — Stability / Performance Consolidation

Established the reliability foundation carried into current source:

- transaction-safe persistence and Legacy operations;
- race-safe League Wheel and Club Assignment delayed operations;
- persisted Transfer Challenge deadline;
- debounced/deduplicated transfer drafts;
- off-screen timer shutdown;
- stabilized Season progression;
- lazy secondary modules;
- lightweight menu media;
- runtime diagnostics.

---

# v0.10.1 — Season / Routing / Persistence Stabilization

Followed a reported failure where Complete Season could appear to do nothing.

Key principles established:

- deterministic cache-versioned loading;
- safe season persistence/rollback;
- visible errors instead of silent failures;
- route validation before hiding current screens;
- hardened localStorage failure handling.

---

# v0.10 — Statistics / Trophy Room Expansion

Added the established current historical/analytics capabilities:

- rivalry analytics;
- cumulative manager statistics;
- career records;
- Trophy Room;
- Statistics UI.

Analytics remains derived from saved showdowns rather than manually editable.

---

# v0.9 — Legacy / Data Management

Implemented completed-showdown archive, season history, final scores/outcomes, individual history deletion, delete-all history and local data-management protections.

---

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established the approved Transfer Challenge and later authoritative scoring correction:

- 15-minute transfer phase;
- max three signings;
- three league/nationality guesses;
- correctly guessed signing released;
- grouped performance bonus;
- grouped awards bonus;
- maximum 11;
- equal nonzero totals draw;
- only 0-0 uses league position/league points.

---

# v0.7 — Working Showdown / Season Progression

Working application had advanced beyond setup-only behavior and included Showdown Home, Season Results, scoring integration, Season Summary, multi-season progression and active save continuity.

The original v0.7 club-reveal experiential acceptance requirement was later completed in source during v0.95 and refined through r2/r3 browser polish.

---

# Original foundation milestones

## v0.6.1 — Application Framework

Framework/navigation/storage foundation. Current architecture later evolved to `js/screens.js` route authority rather than a separate router file.

## v0.6 — Wheel System

League wheel selection and presentation foundation.

## v0.5 — Data Foundation

League/club data and data-engine foundation.

## v0.4 — Functional Prototype

First working HTML/CSS/JS application.

## v0.3 — UI Direction

FIFA-17-era-inspired tile presentation and FUT-inspired reveal direction.

## v0.2 — Experience Design

Showdown, league selection, permanent club pairing, season progression and Legacy concepts.

## v0.1 — Project Foundation

Established the objective: turn two separate Career Mode saves into one persistent competitive rivalry.

---

# Remaining original roadmap

## v0.95 — Active

After current r3 owner acceptance:

1. Settings blueprint alignment;
2. Main Menu Statistics alignment using existing analytics;
3. Season pre-commit review/confirmation inspection;
4. final responsive/accessibility/performance/regression pass.

## v1.0 — Final destination

A complete, reliable local two-manager rivalry from creation through multi-season play and permanent history.
