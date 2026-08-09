# CHANGELOG — Career Mode Showdown

This file preserves project continuity so later development does not reconstruct the project from old chats or mistake temporary implementation builds for a replacement roadmap.

Two forms of versioning exist in project history:

1. **Original Project Bible milestones:** `v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`.
2. **Implementation/stabilization revisions:** builds introduced while the product was being corrected, hardened, optimized and polished.

The project has now returned to the original **v0.95** milestone. v0.95 is a finite convergence phase, followed directly by v1.0.

---

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Status: **implemented in source; owner browser acceptance pending**

The owner accepted `v0.16.0-r3`, closing the Chromebook/responsive stabilization gate and authorizing the next original-roadmap milestone.

## Roadmap obligation completed in source

The original v0.7 Club Assignment specification required more than random club selection. It required:

**Selected League Confirmed  
→ Reveal Begins  
→ First Club Revealed  
→ Second Club Revealed  
→ VS Presentation  
→ User Confirmation  
→ Showdown Begins**

The previous implementation had reliable permanent club assignment but only a basic delayed two-card name reveal. v0.95.0-r1 replaces that presentation with a staged reveal while retaining all hardened assignment rules.

## New reveal presentation

Added:

- League Confirmed header;
- five-stage reveal-progress strip;
- sealed Manager 1 and Manager 2 club cards;
- separate Manager 1 reveal;
- separate Manager 2 reveal;
- finite reveal sweep;
- generated club identity colors/initials;
- central rivalry VS stage;
- final rivalry confirmation tableau;
- showdown name in final tableau;
- selected league in final tableau;
- season count in final tableau;
- manager + club pairing on both sides;
- explicit `CONFIRM RIVALRY & START SHOWDOWN` action.

The presentation remains original/copyright-safe: no official badges, copied FUT card artwork, proprietary FIFA fonts, canvas/WebGL engine or downloaded reveal media.

## Assignment integrity

The random pair is now persisted **before** theatrical reveal begins.

Transaction:

1. generate one same-league/different-club pair;
2. set status to `Clubs Assigned`;
3. save immediately;
4. roll back pair/status if save fails;
5. begin the staged reveal only after persistence succeeds.

There are no localStorage writes for individual reveal phases.

## Confirmation-pending recovery

`Clubs Assigned` is now the explicit persisted checkpoint for a valid permanent pair awaiting owner confirmation.

While pending:

- canonical route is Club Assignment;
- League Wheel is invalid;
- Dashboard is invalid;
- Transfer Challenge is invalid;
- pair cannot reroll;
- refresh + Continue restores the same pair and final confirmation.

Successful final confirmation changes status to `Ready` only after persistence succeeds. A failed confirmation save restores the previous status and keeps the user at confirmation.

## Async safety

Reveal uses finite timers guarded by:

- operation identity;
- showdown identity;
- selected-league identity.

Cancel/reset/navigation clears pending reveal timers so stale callbacks cannot mutate replacement state.

## Accessibility / reduced motion

`prefers-reduced-motion: reduce` retains all assignment information and explicit final confirmation while effectively skipping theatrical staging.

## Responsive presentation

- desktop/laptop: two-card VS composition;
- narrow/mobile: cards and final matchup stack cleanly;
- prior accepted Chromebook Home/media layout rules remain intact;
- short viewports continue to scroll instead of overlapping.

## Runtime/performance preservation

- reveal remains in lazy `js/clubAssignment.js` gameplay package;
- no additional initial JavaScript file;
- still one initial stylesheet;
- maximum seven initial scripts remains enforced;
- 145,000-byte initial local-asset ceiling remains unchanged;
- no continuous reveal animation loop;
- no new external reveal assets.

## Cache/version

- application version advanced to `v0.95.0`;
- shell-owned asset revision advanced to `0.95.0-r1`;
- initial CSS/JS references use the new revision;
- lazy modules derive the same revision from the shell;
- footer/version labels updated to `Polish & Blueprint Alignment`.

## Validation

GitHub Actions was expanded to cover:

- confirmation-pending canonical route;
- Club Assignment legal while confirmation pending;
- League Wheel invalid after saved clubs;
- Dashboard and Transfer blocked until confirmation;
- Ready state returning to normal Dashboard behavior;
- required reveal/confirmation DOM IDs;
- staged reveal source contract;
- reduced-motion source contract;
- existing max-11 scoring and tie rules;
- existing navigation, startup-budget, cache, Chromebook and route-history guards.

Exact-head validation for implementation commit `704e8420743991c921b982149d5b331fe9ce833d` completed successfully.

Owner real-browser acceptance remains required before original v0.7 reveal/confirmation acceptance is marked fully complete.

---

# Roadmap Audit Correction — FUT-style Club Reveal

Before v0.95.0-r1, the roadmap was corrected after direct comparison of the Project Bible, current HTML and `clubAssignment.js`.

The correction established:

**v0.7 club-assignment mechanics: COMPLETE**  
**v0.7 FUT-style reveal / rivalry-confirmation acceptance: INCOMPLETE**

This prevented the project from incorrectly reaching v1.0 while the original experience requirement was still represented only by a basic delayed two-card reveal.

v0.95.0-r1 is the implementation response to that audit.

---

# v0.16.0-r3 — Chromebook / Responsive Home Stabilization

Status: **owner accepted; foundation preserved in v0.95**

Fixed a desktop/ChromeOS layout defect where fixed Home grid rows could allow expanded YouTube media to overlap later navigation content.

Changes retained:

- content-sized desktop Home rows;
- Career/navigation tiles before media;
- media row grows naturally;
- desktop media selector grid;
- low-height laptop/Chromebook density breakpoint;
- preserved tablet/mobile flow;
- user-initiated one-iframe media architecture.

---

# v0.16.0-r2 — Back / Cache / Blueprint Re-anchor

Retained foundations:

- contextual Back from Completed Showdown Home;
- Legacy/Trophy Room/New Showdown return to actual legal origin;
- shell-owned asset revision in `index.html`;
- lazy modules/diagnostics/CI derive deployment identity from shell;
- original `v0.95 → v1.0` roadmap restored as long-term destination;
- Project State / Next Task / Changelog continuity discipline.

---

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Retained foundations:

- unified `css/app.css` core visual system;
- seven-script / one-stylesheet initial shell;
- lazy gameplay package;
- lazy Legacy/analytics/Statistics/Trophy Room/Rule Book;
- `js/screens.js` as sole state-aware route/history authority;
- obsolete routes rejected from persisted state;
- Completed Showdown Home recovery hub;
- GitHub Actions syntax/scoring/navigation/shell validation.

---

# v0.15.x — Stability / Performance Consolidation

Retained foundations:

- transaction-aware localStorage operations;
- failure-aware Legacy/reset behavior;
- race-safe League Wheel callbacks;
- race-safe Club Assignment operations;
- persisted real transfer deadline;
- debounced/deduplicated transfer drafts;
- hidden/off-screen transfer timer shutdown;
- stabilized Season Entry/progression;
- lazy secondary modules;
- lightweight menu media controller;
- runtime diagnostics.

Do not revert to eager, unguarded or duplicated variants of these systems.

---

# v0.10.1 — Season / Routing / Persistence Stabilization

Established the rule that critical transitions must save successfully or preserve/restore the previous valid state.

Major retained fixes:

- deterministic/cache-versioned asset loading;
- atomic Complete Season behavior;
- persistence rollback on save failure;
- visible runtime errors/success feedback;
- safer routing;
- hardened localStorage handling;
- runtime error boundary.

---

# v0.10 — Statistics / Trophy Room Expansion

Added and retained:

- read-only rivalry analytics;
- cumulative manager analytics;
- records;
- Trophy Room;
- statistics UI.

Analytics remain derived from saved showdowns rather than manually editable.

---

# v0.9 — Legacy / Data Management

Implemented and retained:

- completed-showdown archive;
- season-by-season Legacy history;
- final scores/outcomes;
- individual Legacy deletion;
- delete-all Legacy;
- data-management protections.

---

# v0.8 — Transfer Challenge / Finalized Competitive Rules

Established and retained:

- 15-minute window;
- max three signings per manager;
- three opponent guesses;
- guess type league or nationality;
- correctly guessed signing must be released.

Authoritative scoring amendment retained:

- 100 points and/or 100 goals share one +1;
- Top Scorer and/or Top Assist share one +1;
- maximum season score 11;
- equal non-zero total is a draw;
- only 0-0 uses league position then league points.

---

# Original roadmap foundations

## v0.7 — Showdown Creation

Club-assignment mechanics were implemented historically. Its original staged reveal/final confirmation acceptance requirement is now implemented in source by v0.95.0-r1 and awaits owner browser acceptance.

## v0.6.1 — Application Framework

Navigation/storage/framework requirements are implemented and hardened in the current architecture. Obsolete filenames must not be recreated merely for historical symmetry.

## v0.6 — League Wheel

League selection/wheel behavior is implemented and later hardened with persistence locking and race-safe operation identity.

## v0.5 — Data Foundation

League/club database and data engine implemented.

## v0.4 — Functional Prototype

Initial functional HTML/CSS/JavaScript application.

## v0.3 — UI Direction

Established FIFA-17-era-inspired tile/game-like UI and FUT-inspired club reveal concept.

## v0.2 — Experience Design

Defined two-manager rivalry, league selection, permanent clubs, season flow and history.

## v0.1 — Project Foundation

Established the product objective: turn two separate FIFA Career Mode saves into one persistent competitive rivalry.

---

# Remaining v0.95 roadmap after reveal acceptance

After owner acceptance of v0.95.0-r1:

1. **Settings blueprint alignment** — small settings surface using existing architecture; no accounts/cloud/online expansion.
2. **Main Menu Statistics alignment** — reuse existing analytics/Trophy Room/Rivalry Statistics.
3. **Season pre-commit review** — add lightweight review/confirmation if current irreversible Complete Season flow lacks an equivalent safeguard.
4. **Final v0.95 polish/regression** — responsive/accessibility/feedback/performance/persistence/navigation regression.
5. Move directly to **v1.0 Complete Release Candidate / Final Release**.

Do not create an open-ended feature sequence before Version 1.0.
