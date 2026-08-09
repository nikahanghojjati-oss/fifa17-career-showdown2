# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r4`  
**Current phase:** Workstream 1B browser acceptance  
**Next after acceptance:** Transfer Challenge Guess-first / Signing-second phase and canonical FIFA 17 metadata redesign

## Development entry point

The project design phase is complete. Do not restart planning or replace the established architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact implementation, locked rules, architecture and roadmap status.
2. `ROADMAP_AMENDMENTS.md` — later owner-approved requirements and their acceptance intent.
3. `NEXT_TASK.md` — current browser gate and exact next workstream.
4. `CHANGELOG.md` — implementation/stabilization history.
5. `THIRD_PARTY_NOTICES.md` — intentionally referenced external font/media licensing/source notes.
6. Current source code — highest authority for actual implemented behavior.
7. Original Project Bible — long-term blueprint where later decisions/current source have not intentionally superseded it.

Historical v0.10–v0.16 builds were implementation/stabilization work. The release path remains the original **v0.95 → v1.0** convergence roadmap.

## Current v0.95 presentation build

`0.95.0-r4` implements the owner-approved Workstream 1B presentation upgrades while preserving the hardened Club Assignment transaction.

### FIFA-era typography

- Barlow Condensed is used selectively for display roles through an external `display=swap` stylesheet request.
- Local/system condensed fonts remain immediate fallbacks.
- Main Menu tiles, major headings, scores, navigation and Club Reveal receive the stronger condensed hierarchy.
- Body/form text remains on the readable UI stack where appropriate.
- No proprietary FIFA/EA font file is bundled.

### Original club crest system

- All 98 clubs in the current top-five Showdown pool have explicit club-associated palettes.
- `js/visualIdentity.js` generates original deterministic inline-SVG crests using project-owned shapes, patterns and abstract motifs.
- Official club badge images/vector paths are not used by this system.
- The same identity follows the club into Reveal, confirmation, Showdown Home, Transfer Challenge, Season screens and summary surfaces where identity is rendered.

### Two-pack reveal

The current Club Assignment presentation is:

**saved permanent pair → two sealed packs → Pack 01 reveal → Pack 02 reveal → VS → explicit rivalry confirmation**

The pair is still generated and persisted once before presentation begins. There is no reroll path. Refresh/Continue while confirmation is pending restores the same pair.

Presentation is owned by `css/app.css`; Club Assignment JavaScript now focuses on state/persistence/timing instead of injecting a second stylesheet.

## Locked competition rules

- Exactly two managers, one device/browser in Version 1.0.
- Both clubs come from the same selected league and remain permanent for the showdown.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings, three opponent guesses, league or nationality, correctly guessed signing must be released.
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
- League Wheel
- one-pair permanent club assignment
- two-pack staged reveal and rivalry confirmation
- original deterministic club crest identities
- Showdown Home
- per-season Transfer Challenge
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
- runtime diagnostics and GitHub Actions validation

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

CI enforces one initial local stylesheet, maximum seven initial JavaScript files, no eager gameplay package, and a 145 KB local startup-asset ceiling.

The crest generator remains in the lazy gameplay package. Rule Book/Legacy/Analytics/Trophy modules remain lazy. Menu media still creates no iframe until Play.

## Reliability contract

Preserve:

- one-pair/no-reroll Club Assignment;
- save-before-reveal transaction and rollback;
- persisted `Clubs Assigned` confirmation checkpoint;
- refresh/Continue same-pair recovery;
- finite cancellable reveal stages;
- transaction-safe critical persistence;
- persisted Transfer deadline and debounced drafts;
- one Transfer timer interval maximum;
- centralized state-aware Back routing;
- completed-showdown recovery;
- shell-owned asset revision;
- stale async-operation identity guards;
- reduced-motion behavior;
- Chromebook/mobile layout guards.

## Automated validation

GitHub Actions validates, among other invariants:

- JavaScript syntax;
- locked scoring cases;
- route/state matrix;
- confirmation-pending recovery;
- cache identity;
- startup budget;
- required/duplicate IDs;
- centralized Back authority;
- Chromebook layout invariants;
- visual stylesheet structure;
- all 98 Showdown clubs covered by explicit identity palettes;
- 98 distinct deterministic procedural crests;
- no external badge-image embedding in the crest engine;
- finite two-pack reveal order/timing;
- reduced-motion path;
- no runtime Club Reveal CSS injection;
- Barlow Condensed fallback-safe `display=swap` wiring.

Automated tests do not prove visual quality; the current r4 gate still requires owner testing on Chromebook/mobile.

## Revised v0.95 path

1. **Workstream 1B — current r4 browser acceptance**
   - FIFA-era typography
   - original club crests
   - two-pack reveal
2. **Workstream 2 — Transfer Challenge structural/data redesign**
   - 15-minute window
   - Guess Entry first
   - lock guesses
   - Signing Entry second
   - lock signings
   - evaluate verdicts
   - complete historical FIFA 17 former-league data
   - complete FIFA 17 player-nationality data
   - responsive searchable canonical selectors
   - old-save compatibility
3. **Workstream 3 — Settings blueprint alignment**
4. **Workstream 4 — Main Menu Statistics alignment**
5. **Workstream 5 — Season pre-commit review**
6. **Workstream 6 — final v0.95 accessibility/responsive/performance/regression pass**
7. **v1.0 Complete Release Candidate / Final Release**

The Showdown League Wheel remains the locked top-five league pool. The larger FIFA 17 league universe planned for Workstream 2 is only for Transfer Challenge former-league/guess metadata.

## Fan-project / legal presentation

Career Mode Showdown is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses original design work inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied FUT/menu artwork are not bundled. Barlow is separately licensed under the SIL Open Font License 1.1 and is requested externally with system fallbacks. Club crests are original procedural SVG compositions. Menu songs/trailer are user-initiated YouTube embeds rather than copied media files.

See `THIRD_PARTY_NOTICES.md` for source/license notes.