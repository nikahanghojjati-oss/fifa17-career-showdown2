# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r5`  
**Current phase:** Workstream 2 browser acceptance  
**Previous gate:** `0.95.0-r4` FIFA-era presentation / original club identities / two-pack reveal — owner accepted  
**Next after r5 acceptance:** Workstream 3 — Settings blueprint alignment

## Development entry point

The project design phase is complete. Do not restart planning or replace the established architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact implementation, locked rules, architecture and roadmap status.
2. `ROADMAP_AMENDMENTS.md` — later owner-approved requirements and their acceptance intent.
3. `NEXT_TASK.md` — current browser gate and exact next workstream.
4. `CHANGELOG.md` — implementation/stabilization history.
5. `THIRD_PARTY_NOTICES.md` — intentional external font/media source/license notes.
6. Current source code — highest authority for actual implemented behavior.
7. Original Project Bible — long-term blueprint where later decisions/current source have not intentionally superseded it.

Historical v0.10–v0.16 builds were implementation/stabilization work. The release path remains the original **v0.95 → v1.0** convergence roadmap.

## Current r5 Transfer Challenge

The competition rules are unchanged, but data entry is now split into explicit persistent phases:

**15-minute Transfer Window  
→ Guess Entry  
→ lock/persist guesses  
→ Signing Entry  
→ lock/persist signings  
→ canonical release verdicts  
→ Season Results**

### State / persistence

The existing Transfer Challenge record remains authoritative. r5 does not create a second record or router.

Challenge status remains compatible with central routing:

- `not_started`
- `active`
- `recording`
- `completed`

Persistent `phase` adds:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Both Guess Entry and Signing Entry intentionally use `status: recording`, keeping `js/screens.js` as the sole route/history authority.

Critical phase transitions save immediately with snapshot/rollback. Ordinary field drafts remain debounced/deduplicated. Only the currently editable phase is captured, so Signing Entry cannot silently rewrite locked guesses.

### Backward compatibility

Old combined-form `recording` saves without a phase migrate to Guess Entry. Existing old signing/guess drafts remain present. Known historical values are mapped to canonical FIFA 17 options; unknown values remain visible and must be reselected rather than being silently guessed into the wrong option.

### FIFA 17 Transfer metadata

`data/transferOptions.js` is a lazy metadata module separate from the five-league Showdown Wheel.

It currently provides:

- **36 Transfer League options** — 35 historical FIFA 17 domestic league competitions plus Rest of World fallback;
- **164 FIFA 17 player nationalities**;
- stable canonical IDs;
- historical aliases for common naming variants.

The Showdown League Wheel remains exactly five leagues.

### Searchable controlled selectors

`js/transferSelector.js` provides framework-free comboboxes for:

- Previous League;
- player Nationality;
- Guess Value after League/Nationality Guess Type selection.

Behavior includes type-to-filter, bounded results, League country/tier context, Arrow-key navigation, Enter selection, Escape close, ARIA combobox/listbox wiring, visible focus and viewport-contained mobile results.

Release evaluation compares canonical IDs rather than arbitrary free-text strings.

## Accepted r4 presentation foundation

r5 preserves the accepted Workstream 1B presentation:

- Barlow Condensed selectively for display roles with `display=swap` and system fallbacks;
- original deterministic procedural crest identities for all 98 Showdown clubs;
- two sealed packs revealing the permanent club pair sequentially;
- save-before-reveal / rollback / no-reroll Club Assignment transaction;
- refresh/Continue recovery at explicit Rivalry Confirmation;
- responsive Chromebook/mobile geometry and reduced-motion behavior.

Official club badge images/vector paths and proprietary FIFA/EA font files are not bundled.

## Locked competition rules

- Exactly two managers, one device/browser in Version 1.0.
- Both clubs come from the same selected league and remain permanent for the showdown.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings, three opponent guesses, League or Nationality, correctly guessed signing must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: **11**.
- Equal non-zero scores are a draw.
- Only 0-0 uses league position, then league points.

## Current feature set

- New/resumable showdowns
- five-league League Wheel
- one-pair permanent club assignment
- original 98-club procedural crest identities
- two-pack Club Reveal / Rivalry Confirmation
- Showdown Home
- phased per-season Transfer Challenge
- historical FIFA 17 transfer League/Nationality metadata
- searchable controlled Transfer selectors
- canonical RELEASE / SAFE verdicts
- Season Results / automatic scoring
- Season Summary / multi-season progression
- completed-showdown recovery hub
- Legacy archive/history and data controls
- Rivalry Statistics / cumulative analytics
- Trophy Room
- Rule Book
- safe reset/deletion controls
- lazy FIFA 17 soundtrack/trailer media
- responsive Chromebook/laptop/mobile presentation
- centralized state-aware Back navigation
- runtime diagnostics and exact-head GitHub Actions validation

## Performance contract

Initial local runtime remains limited to:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI enforces one initial local stylesheet, maximum seven initial JavaScript files, no eager gameplay package and a 145 KB local startup-asset ceiling.

Workstream 2 assets remain lazy:

- `css/transfer.css`
- `data/transferOptions.js`
- `js/transferSelector.js`
- `js/transferChallenge.js`

The crest generator, Rule Book, Legacy, Analytics and Trophy modules also remain lazy. Menu media still creates no iframe until Play.

## Reliability contract

Preserve:

- one-pair/no-reroll Club Assignment;
- save-before-reveal transaction and rollback;
- persisted `Clubs Assigned` confirmation checkpoint;
- refresh/Continue same-pair recovery;
- explicit Transfer Window → Guess → Signing → Completed phases;
- old transfer-save migration;
- canonical-ID guess evaluation;
- critical Transfer phase save/rollback;
- debounced/deduplicated active-phase drafts;
- persisted Transfer deadline and one timer interval maximum;
- centralized state-aware Back routing;
- completed-showdown recovery;
- shell-owned asset revision;
- stale async-operation identity guards;
- reduced-motion behavior;
- Chromebook/mobile viewport guards.

## Automated validation

Two GitHub Actions gates protect the current implementation.

### Validate Static App

Protects JavaScript syntax, scoring, route/state matrix, Club Assignment recovery/no-reroll, cache/startup budgets, central Back authority, responsive layout guards, all 98 procedural crest identities and finite two-pack reveal contracts.

### Validate Transfer Workstream

Protects:

- 36 Transfer competition options;
- 164 player nationalities;
- unique canonical IDs;
- important lower-division FIFA 17 coverage;
- the Showdown Wheel remaining five leagues;
- historical alias resolution;
- old `recording` save migration and draft preservation;
- Guess → Signing phase order;
- canonical RELEASE / SAFE evaluation;
- critical save/rollback markers;
- selector keyboard/ARIA contracts;
- bounded Chromebook/mobile popovers;
- transfer assets remaining outside the initial shell.

Automated checks do not prove visual quality; r5 still requires owner testing on the real Chromebook/mobile browser.

## Remaining v0.95 path

1. **Workstream 2 — current r5 browser acceptance**
2. **Workstream 3 — Settings blueprint alignment**
3. **Workstream 4 — Main Menu Statistics alignment using existing analytics**
4. **Workstream 5 — Season pre-commit review**
5. **Workstream 6 — final v0.95 accessibility/responsive/performance/regression pass**
6. **v1.0 Complete Release Candidate / Final Release**

## Fan-project / legal presentation

Career Mode Showdown is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses original design work inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied FUT/menu artwork are not bundled. Barlow is separately licensed under the SIL Open Font License 1.1 and requested externally with system fallbacks. Club crests are original procedural SVG compositions. Menu songs/trailer are user-initiated YouTube embeds rather than copied media files.

See `THIRD_PARTY_NOTICES.md` for source/license notes.
