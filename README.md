# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed asset revision:** `0.95.0-r3`  
**Current phase:** v0.95 Workstream 1 final browser/visual acceptance

## Development entry point

The design phase is complete. Do not restart planning or replace the architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact current implementation, locked rules, architecture and roadmap status.
2. `NEXT_TASK.md` — current `0.95.0-r3` browser acceptance gate.
3. `CHANGELOG.md` — implementation and stabilization history.
4. Current source code — highest authority for implemented behavior.
5. Original Project Bible — long-term blueprint where later owner decisions/current source have not intentionally superseded it.

The historical v0.10–v0.16 builds were implementation/stabilization work. The release path remains the original **v0.95 → v1.0** roadmap.

## Current v0.95 focus

The carried-forward original v0.7 Club Assignment requirement is implemented as:

**League Confirmed → Manager 1 Reveal → Manager 2 Reveal → VS Presentation → Explicit Rivalry Confirmation → Showdown Home**

The assignment transaction remains permanent and no-reroll: the pair is generated once and persisted before theatrical reveal begins. `Clubs Assigned` is a confirmation-pending checkpoint, so refresh/Continue restores the same pair rather than drawing again.

`0.95.0-r2` repaired the first browser-tested reveal implementation by fixing a stale diagnostics version check and replacing misaligned/skewed Chromebook reveal geometry with equal cards and shorter finite motion.

`0.95.0-r3` performs a wider v0.95 visual-consistency pass. Repository inspection found that older optional Rule Book/Analytics/Legacy child colors were still designed for dark cards while the current unified shell had converted several containers to light panels. r3 normalizes those lazy screens to one coherent, high-contrast visual language without moving them into startup.

## Current visual architecture

- One core initial stylesheet: `css/app.css`.
- Rule Book, Legacy and Analytics/Trophy styles remain lazy-loaded.
- Main application uses original FIFA-17-era-inspired blue/cyan/yellow/ink/paper design tokens.
- Dark heroes are used intentionally for major rivalry/presentation moments.
- Light data/rule cards use dark text and clear accent bars.
- Generated club identities replace official badges.
- No proprietary FIFA font or copied EA menu/FUT card artwork is bundled.
- Soundtrack/trailer media stays user-initiated through YouTube embeds.
- Chromebook low-height and mobile breakpoints are preserved.

## Locked competition rules

- Exactly two managers, one device/browser.
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
- generated club visual identities

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

Gameplay engines and Rule Book/Legacy/Analytics/Trophy modules remain on demand. Do not solve optional-screen styling by moving those assets into startup.

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

Automated checks supplement browser visual testing; they do not prove visual quality.

## Original roadmap

- v0.6.1 — Application Framework
- v0.7 — Showdown Creation / Club Reveal
- v0.8 — Season Management
- v0.9 — Scoring / Statistics / Legacy
- **v0.95 — Polish / Experience / Blueprint Alignment (current)**
- v1.0 — Complete Release

After the current r3 browser acceptance, the finite remaining v0.95 work is:

1. Settings blueprint alignment.
2. Main Menu Statistics alignment using existing analytics.
3. Season pre-commit review/confirmation inspection.
4. Final accessibility/responsive/performance/regression pass.
5. v1.0.

No post-v1.0 ideas should interrupt that sequence.

## Fan-project / legal presentation

This is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied EA/FUT graphics are not bundled. Menu media is played through user-initiated YouTube embeds rather than copied audio/video files.
