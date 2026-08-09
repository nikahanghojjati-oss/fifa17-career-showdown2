# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r6`  
**Current phase:** Workstream 3 Settings browser acceptance  
**Accepted gates:** `0.95.0-r4` presentation/club reveal and `0.95.0-r5` phased Transfer Challenge  
**Next after r6 acceptance:** Workstream 4 — Main Menu Statistics alignment

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

## Current r6 Settings

Workstream 3 adds a small lazy Settings surface without creating a second route system or changing competition rules.

Settings provides only:

- application/build information;
- a persistent accessibility motion preference;
- a gateway to the existing Legacy Data Management controls.

There are no accounts, cloud saves, backend settings, themes, notifications or online systems.

### Lazy Settings architecture

The Home shell contains the Settings tile, while these assets load only when Settings is opened:

- `js/settings.js`
- `css/settings.css`

Settings is a modal over Home/current screen rather than a new `screens.js` route. Central route/history authority remains unchanged.

### Motion preference

Application preferences use a separate localStorage key:

`careerModeShowdown.preferences`

Current choices:

- **Follow Device** — default; follows operating-system/browser `prefers-reduced-motion`.
- **Reduce Motion** — forces non-essential motion to be minimized.

A device accessibility request always wins. There is intentionally no “force full motion” option.

The effective state is applied during core storage initialization, before lazy Settings code loads.

With effective reduced motion:

- CSS transitions/animations are minimized;
- the accepted r4 Club Reveal skips theatrical stage delays after the permanent pair is safely saved;
- League Wheel removes its former hidden four-second JavaScript wait and resolves/advances near-immediately while preserving the same random selection/save/rollback transaction.

### Settings accessibility

The modal includes dialog semantics, inert background content, Escape/backdrop close, focus containment/restoration, a keyboard-operable radio group, visible focus, and low-height Chromebook/mobile viewport guards.

### Data Management reuse

Settings does not duplicate destructive storage logic. **Open Legacy & Data Management** opens the existing Legacy module, where established confirmation/rollback protections remain authoritative.

Reset All Showdown Data removes active/Legacy competition data but intentionally preserves the application motion preference.

## Accepted r5 Transfer Challenge

The competition rules are unchanged, but post-window entry uses explicit persistent phases:

**15-minute Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical release verdicts → Season Results**

The existing Transfer Challenge record remains authoritative; no second router or record was created.

r5 includes:

- backward-compatible old `recording` save migration;
- 36 historical FIFA 17 Transfer League options;
- 164 FIFA 17 player nationalities;
- canonical IDs and historical aliases;
- framework-free searchable League/Nationality selectors;
- canonical RELEASE/SAFE evaluation;
- immediate rollback-protected critical phase transitions;
- debounced/deduplicated active-phase drafts.

The Showdown League Wheel remains exactly five leagues.

## Accepted r4 presentation foundation

- fallback-safe Barlow Condensed display hierarchy;
- original deterministic procedural crest identities for all 98 Showdown clubs;
- two sealed packs revealing the permanent club pair sequentially;
- save-before-reveal / rollback / no-reroll transaction;
- refresh/Continue recovery at explicit Rivalry Confirmation;
- responsive Chromebook/mobile presentation.

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
- lazy Settings / persistent motion preference
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

Settings, Transfer metadata/selectors, crests, Rule Book, Legacy, Analytics and Trophy modules remain lazy. Menu media still creates no iframe until Play.

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
- isolated application preferences;
- OS reduced-motion precedence;
- shell-owned asset revision;
- stale async-operation identity guards;
- Chromebook/mobile viewport guards.

## Automated validation

Three GitHub Actions gates protect the current implementation.

### Validate Static App

Protects JavaScript syntax, scoring, route/state matrix, Club Assignment recovery/no-reroll, cache/startup budgets, central Back authority, responsive layout guards, all 98 procedural crest identities and finite two-pack reveal contracts.

### Validate Transfer Workstream

Protects the accepted r5 datasets, old-save migration, Guess → Signing ordering, canonical matching, selector keyboard/ARIA behavior and lazy-loading boundaries.

### Validate Settings Workstream

Protects:

- Follow Device default;
- persistent Reduce Motion override;
- operating-system reduced-motion precedence;
- preference survival across Showdown-data reset;
- lazy Settings assets;
- Home Settings binding;
- modal/focus/radio keyboard accessibility contracts;
- Settings avoiding direct localStorage/destructive primitives;
- Legacy Data Management reuse;
- Club Reveal/League Wheel shared effective motion preference;
- materially shortened reduced-motion League Wheel timing;
- forced reduced-motion CSS state;
- Chromebook/mobile Settings layout guards.

Automated checks do not prove visual quality; r6 still requires owner testing on the real Chromebook/mobile browser.

## Remaining v0.95 path

1. **Workstream 3 — current r6 browser acceptance**
2. **Workstream 4 — Main Menu Statistics alignment using existing analytics**
3. **Workstream 5 — Season pre-commit review**
4. **Workstream 6 — final v0.95 accessibility/responsive/performance/regression pass**
5. **v1.0 Complete Release Candidate / Final Release**

## Fan-project / legal presentation

Career Mode Showdown is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses original design work inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied FUT/menu artwork are not bundled. Barlow is separately licensed under the SIL Open Font License 1.1 and requested externally with system fallbacks. Club crests are original procedural SVG compositions. Menu songs/trailer are user-initiated YouTube embeds rather than copied media files.

See `THIRD_PARTY_NOTICES.md` for source/license notes.
