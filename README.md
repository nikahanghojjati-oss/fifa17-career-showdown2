# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed asset revision:** `0.95.0-r3`  
**Current phase:** v0.95 Workstream 1A browser/visual acceptance  
**Approved next work:** FIFA 17 typography + custom club identity + two-pack reveal, followed by Transfer Challenge phase/data redesign

## Development entry point

The design phase is complete. Do not restart planning or replace the architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact current implementation, locked rules and architecture.
2. `ROADMAP_AMENDMENTS.md` — explicit later owner-approved additions and revised v0.95 order.
3. `NEXT_TASK.md` — exact current gate and implementation sequence.
4. `CHANGELOG.md` — implemented/stabilization history; planned work is not complete merely because it is mentioned elsewhere.
5. Current source code — highest authority for implemented behavior.
6. Original Project Bible — long-term blueprint where later owner decisions/current source have not intentionally superseded it.

The historical v0.10–v0.16 builds were implementation/stabilization work. The release path remains the original **v0.95 → v1.0** roadmap, now with owner-approved v0.95 workstreams inserted before final release.

## Current v0.95 focus

The carried-forward original v0.7 Club Assignment requirement is implemented as:

**League Confirmed → Manager 1 Reveal → Manager 2 Reveal → VS Presentation → Explicit Rivalry Confirmation → Showdown Home**

The assignment transaction remains permanent and no-reroll: the pair is generated once and persisted before theatrical reveal begins. `Clubs Assigned` is a confirmation-pending checkpoint, so refresh/Continue restores the same pair rather than drawing again.

`0.95.0-r2` repaired the first browser-tested reveal implementation by fixing a stale diagnostics version check and replacing misaligned/skewed Chromebook reveal geometry with equal cards and shorter finite motion.

`0.95.0-r3` performs a wider visual-consistency pass. Repository inspection found that older optional Rule Book/Analytics/Legacy child colors were still designed for dark cards while the current unified shell had converted several containers to light panels. r3 normalizes those lazy screens to one coherent, high-contrast visual language without moving them into startup.

## Approved visual direction after r3

The next visual pass is no longer limited to generic cleanup. It must deliberately move closer to the FIFA 17 era while remaining original and copyright-safe.

Approved requirements:

- improve Home/Main Menu typography, weights, spacing and hierarchy using a safely licensed FIFA-17-like display face where appropriate;
- do not replace every body/form font if readability would be worse;
- replace the current generic two-color/initials club identity with deterministic original custom crest/emblem treatment for every club in the existing top-five Showdown pool;
- upgrade Club Assignment to two closed packs/parcels that open sequentially with a few seconds of finite suspense before VS/confirmation;
- preserve persistence-before-reveal, no-reroll, equal-card geometry, reduced-motion and Chromebook/mobile safety;
- do not bundle official club badges, copied EA/FUT graphics or proprietary FIFA fonts by default.

## Approved Transfer Challenge redesign after visual acceptance

The current Transfer Challenge stores signings and guesses separately but records both on one post-window screen. Before Settings work, v0.95 will split that into distinct phases:

**15-minute transfer window → Guess Entry → Signing Entry → Transfer Results → Season Results**

Guesses come before signing details are entered. This creates a clean future privacy boundary for two-device play without adding two-device/backend scope to Version 1.0.

Transfer metadata will gain separate canonical FIFA 17 datasets:

- complete historical FIFA 17 domestic league options for a signing's former league;
- every nationality represented by FIFA 17 players;
- responsive searchable League/Nationality controls instead of free typing;
- canonical values for reliable guess matching regardless of accents/spelling variants.

This **does not** expand the Showdown League Wheel. Rivalry club assignment remains the locked top-five European league pool.

## Current visual architecture

- One core initial stylesheet: `css/app.css`.
- Rule Book, Legacy and Analytics/Trophy styles remain lazy-loaded.
- Main application uses original FIFA-17-era-inspired blue/cyan/yellow/ink/paper design tokens.
- Dark heroes are used intentionally for major rivalry/presentation moments.
- Light data/rule cards use dark text and clear accent bars.
- Current generated club identities are an interim copyright-safe system scheduled for Workstream 1B replacement.
- No proprietary FIFA font or copied EA menu/FUT card artwork is bundled.
- Soundtrack/trailer media stays user-initiated through YouTube embeds.
- Chromebook low-height and mobile breakpoints are preserved.

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

## Current implemented feature set

- New/resumable showdowns
- League Wheel
- staged permanent club assignment/reveal and rivalry confirmation
- Showdown Home
- per-season Transfer Challenge
- Season Results and automatic scoring
- Season Summary and multi-season progression
- completed-showdown recovery hub
- Legacy archive/history and data controls
- Rivalry Statistics
- cumulative career analytics
- Trophy Room
- Rule Book
- safe reset/deletion controls
- lazy FIFA 17 soundtrack/trailer media
- generated interim club visual identities

Do not list the newly approved typography, custom crests, two-pack reveal, split Transfer screens or complete FIFA 17 transfer metadata as implemented until source and acceptance prove they are complete.

## Performance contract

Initial Home remains limited to:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI enforces one initial stylesheet, maximum seven initial scripts, no eager gameplay package, and a 145 KB local startup-asset ceiling.

Gameplay engines and Rule Book/Legacy/Analytics/Trophy modules remain on demand. New typography/crest/selector work must respect this performance discipline and must not casually pull large libraries/assets into startup.

## Reliability contract

Preserve:

- one-pair/no-reroll club assignment;
- transaction-safe critical persistence and rollback;
- persisted confirmation-pending club state;
- persisted transfer deadline and debounced drafts;
- one transfer timer interval maximum;
- state-aware centralized Back navigation;
- completed-showdown recovery;
- shell-owned asset revision for initial and lazy files;
- runtime diagnostics deriving version from shell revision;
- stale delayed-operation identity guards;
- reduced-motion support.

## Automated validation

GitHub Actions validates JavaScript syntax, locked scoring cases, navigation states, confirmation-pending recovery, cache identity, startup budget, required IDs, centralized Back authority, Chromebook Home invariants and balanced structure of all current visual stylesheets (`app.css`, `analytics.css`, `legacy.css`, `rulebook.css`).

Future work should extend deterministic coverage for crest determinism, reveal order, Transfer Challenge sub-phases, canonical data lists and selector/value coupling.

Automated checks supplement browser visual testing; they do not prove visual quality.

## Original roadmap + owner-approved v0.95 insertion

- v0.6.1 — Application Framework
- v0.7 — Showdown Creation / Club Reveal
- v0.8 — Season Management
- v0.9 — Scoring / Statistics / Legacy
- **v0.95 — Polish / Experience / Blueprint Alignment (current)**
  1. Workstream 1A — current r3 visual/Club Reveal browser acceptance
  2. Workstream 1B — FIFA 17 typography + original club crests + two-pack suspense reveal
  3. Workstream 2 — split Guess/Signing Transfer phases + complete FIFA 17 league/nationality metadata/selectors
  4. Workstream 3 — Settings blueprint alignment
  5. Workstream 4 — Main Menu Statistics alignment
  6. Workstream 5 — Season pre-commit review/confirmation
  7. Workstream 6 — final accessibility/responsive/performance/regression pass
- v1.0 — Complete reliable one-device local release
- post-v1.0 — two-device/private-manager architecture may build on the already separated Transfer Challenge phases

## Fan-project / legal presentation

This is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied EA/FUT graphics are not bundled. Menu media is played through user-initiated YouTube embeds rather than copied audio/video files.
