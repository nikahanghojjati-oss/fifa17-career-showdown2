# CHANGELOG — Career Mode Showdown

This file preserves continuity so later development does not reconstruct the project from old chats or mistake implementation revisions for a replacement roadmap.

The original release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project is currently inside the original **v0.95** convergence milestone.

---

# v0.95.0-r5 — Phased Transfer Challenge / Canonical FIFA 17 Transfer Data

Status: **implemented and machine-validated; owner browser acceptance pending**

Workstream 2 replaces the old combined post-window signing/guess form with an explicit persistent sequence while preserving every locked competition rule.

## Transfer phase model

The existing Transfer Challenge record remains authoritative. No duplicate challenge record or second router was introduced.

Status remains:

- `not_started`
- `active`
- `recording`
- `completed`

New persistent `phase` adds:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Both Guess Entry and Signing Entry intentionally remain `status: recording`, allowing `js/screens.js` to remain the single route/history authority.

Current flow:

**15-minute window → Guess Entry → locked guesses → Signing Entry → locked signings → canonical verdicts → Season Results**

## Persistence / recovery

- Window → Guess, Guess → Signing and Signing → Completed are critical immediate saves.
- Each critical transition snapshots challenge/showdown state first.
- Failed persistence restores the prior state and blocks progression.
- Ordinary transfer draft entry remains debounced/deduplicated.
- Only the active phase form is captured, preventing Signing Entry edits from rewriting locked guesses.
- Continue Career still canonicalizes active/recording transfer state to Transfer Challenge and calls `openTransferChallenge()` so the exact phase/form is restored after refresh.

## Old-save compatibility

Old pre-r5 `recording` challenge records without a `phase` migrate safely to `guess_entry`.

- existing signing drafts remain present;
- existing guesses remain present;
- recognized historical free-text values are mapped to canonical IDs;
- unknown values remain visible and must be reselected rather than silently converted to the wrong option.

Regression coverage includes historical aliases such as Calcio A, Liga BBVA, EFL Championship, Czechia, North Macedonia, Türkiye and South Korea.

## FIFA 17 transfer metadata

Added lazy `data/transferOptions.js`, deliberately separate from the five-league Showdown Wheel.

- 36 Transfer League options: 35 historical FIFA 17 domestic competitions plus Rest of World fallback;
- 164 FIFA 17 player nationalities;
- stable canonical IDs;
- historical aliases;
- lower divisions represented in FIFA 17, including England's four tiers and second divisions in France, Germany, Italy and Spain.

The Showdown League Wheel remains exactly five leagues.

## Searchable controlled selectors

Added lazy `js/transferSelector.js` and `css/transfer.css`.

Signing Entry uses:

- free-text Player Name;
- controlled searchable Previous League;
- controlled searchable Nationality.

Guess Entry uses:

- League/Nationality Guess Type;
- controlled searchable Guess Value from the corresponding dataset.

Selector behavior includes:

- type-to-filter;
- bounded results;
- country/tier League context;
- Arrow-key navigation;
- Enter select / Escape close;
- ARIA combobox/listbox/active-descendant wiring;
- explicit accessible input labels;
- canonical ID separate from display label;
- mobile viewport-constrained results;
- low-height Chromebook handling;
- no component framework.

## Canonical release evaluation

Release matching now compares canonical League/Nationality IDs rather than arbitrary normalized strings. Historical display aliases can resolve to the same canonical value without creating false matches between genuinely different options.

## Presentation

- Four-step Transfer progress strip: Window / Guess / Signing / Verdicts.
- Guess Entry and Signing Entry render as distinct phase states rather than one combined form.
- Dead `00:00` timer/hero is hidden after the Transfer Window closes.
- Locked-guess summary is rendered with safe text nodes rather than interpolating manager names through HTML.
- r4 visual/club identity treatment remains active across Transfer screens.

## Performance

New assets stay inside the lazy gameplay package:

- `css/transfer.css`
- `data/transferOptions.js`
- `js/transferSelector.js`

No Transfer metadata or selector code was added to initial Home startup. The one-transfer-timer and hidden-tab shutdown contracts remain.

## Validation

Added a separate `Validate Transfer Workstream` exact-head workflow covering:

- 36 competitions and 164 nationalities;
- unique canonical IDs;
- historical lower-division coverage;
- five-league Showdown Wheel isolation;
- historical alias resolution;
- old-save migration/draft preservation;
- Guess → Signing order;
- canonical RELEASE / SAFE matching;
- critical save/rollback markers;
- selector keyboard/ARIA contracts;
- bounded Chromebook/mobile selector presentation;
- reduced-motion styling;
- lazy-loading isolation from startup.

The established `Validate Static App` gate remains in parallel to protect scoring, routing, startup, Club Assignment and r4 presentation contracts.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **owner browser accepted; retained by r5**

Workstream 1B implemented the owner-approved presentation amendments without changing competition rules, scoring, storage architecture, season progression or central navigation.

## Typography

- Barlow Condensed preferred for selected display roles via external `display=swap` request.
- local/system condensed fonts remain immediate fallbacks;
- body/forms retain readable UI typography;
- no proprietary FIFA/EA font file bundled.

## Original club identity

- all 98 Showdown clubs have explicit club-associated palettes;
- five original base crest geometries;
- six original pattern families;
- seven abstract motif families;
- deterministic inline SVG generation/caching;
- same identity reused across reveal, confirmation, Home, Transfer, Season and Summary surfaces;
- no official club badge image/vector path used by the identity engine.

CI verifies 98 distinct deterministic generated crest strings.

## Two-pack Club Reveal

**pair saved → Pack 01 → Manager 1 club → Pack 02 → Manager 2 club → VS → explicit rivalry confirmation**

Finite presentation remains around 3.3 seconds total, with reduced-motion fast path.

The permanent transaction remains:

- pair generated once;
- pair persisted before reveal;
- save failure rolls back;
- reveal phases write nothing to localStorage;
- no reroll path;
- `Clubs Assigned` is the confirmation-pending checkpoint;
- refresh/Continue restores the same pair;
- explicit confirmation changes status to `Ready`.

Club Reveal presentation was consolidated back into `css/app.css`; `clubAssignment.js` no longer injects a second visual stylesheet.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency / Contrast Polish

Status: **implemented; retained**

- normalized Rule Book light/dark hierarchy;
- corrected Statistics/Trophy Room light-panel contrast;
- corrected Legacy summary/data-management contrast while retaining intentional dark history cards;
- kept optional styles lazy-loaded;
- added visual stylesheet structural validation.

---

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Status: **implemented; retained**

Corrected the r1 false runtime-version warning, Chromebook Club Reveal geometry and rejected white sweep effect. Established equal reveal geometry, low-height Chromebook rules and finite reveal motion.

---

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established `Clubs Assigned` as the persisted permanent-pair/confirmation checkpoint and implemented the original staged reveal/confirmation flow around save-before-animation integrity.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Status: **owner accepted**

- content-sized Home rows;
- soundtrack/trailer rail below Career tiles;
- compact desktop media selector;
- low-height Chromebook density handling;
- mobile layout preserved;
- CI guard against fixed-row overlap regression.

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

- fixed contextual Back from Completed Showdown Home;
- centralized cache revision ownership;
- re-established original `v0.95 → v1.0` roadmap authority;
- restored continuation documentation.

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

- unified initial `css/app.css`;
- seven-script startup;
- lazy gameplay and optional modules;
- centralized state-aware Back authority;
- completed-showdown recovery hub;
- exact-head CI/startup budget;
- obsolete prototype removal.

# v0.15.x — Stability / Performance Consolidation

Established transaction-safe persistence, race-safe delayed operations, persisted Transfer deadline, debounced Transfer drafts, hidden timer shutdown, stabilized Seasons, lazy secondary modules, lightweight media and diagnostics.

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe season persistence/rollback, visible errors, route validation and hardened localStorage failure behavior.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, records, Trophy Room and Statistics UI.

# v0.9 — Legacy / Data Management

Added completed-showdown archive/history and protected deletion/data-management flows.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established 15-minute Transfer Challenge and authoritative max-11 grouped-bonus scoring/tiebreak rules.

# v0.7 — Working Showdown / Season Progression

Established Showdown Home, Season Results, scoring, Season Summary, multi-season progression and active-save continuity.

# v0.6.1 and earlier — Foundation

- v0.6.1: application framework/navigation/storage foundation.
- v0.6: League Wheel.
- v0.5: league/club/data foundation.
- v0.4: functional HTML/CSS/JS prototype.
- v0.3: FIFA-17-era UI direction.
- v0.2: rivalry experience design.
- v0.1: project foundation.

---

# Remaining v0.95 roadmap

## Current gate

Owner browser acceptance of **`0.95.0-r5` Workstream 2**.

## Workstream 3 — Settings

Small original-blueprint Settings surface using current architecture.

## Workstream 4 — Main Menu Statistics alignment

Reuse current analytics/Trophy/Rivalry engines.

## Workstream 5 — Season pre-commit review

Add/confirm review before irreversible season completion.

## Workstream 6 — final v0.95 regression/polish

Accessibility, responsive consistency, typography/contrast, feedback, performance and full gameplay/persistence/navigation regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
