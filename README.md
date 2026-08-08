# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry tracker built for GitHub Pages with plain HTML, CSS, JavaScript, and browser localStorage.

Current release: **v0.15.1 — Core Stabilization & Performance**

## Product scope

Career Mode Showdown is designed for two friends playing separate FIFA 17 Career Mode saves while tracking one shared rivalry on a single device.

The app provides:

- New and resumable showdowns
- FIFA 17-era league selection
- Permanent randomized club assignment
- Per-season Transfer Challenge
- Season results and scoring
- Season summaries and cumulative rivalry score
- Legacy archive
- Rivalry Statistics
- Trophy Room
- Rule Book
- FIFA 17 soundtrack/trailer menu media through lazy YouTube embeds
- Original FIFA-17-era-inspired interface and generated club identities

## Locked competition rules

- Exactly two managers in the current product scope.
- Both clubs come from the same selected league.
- Club assignment happens once and stays fixed for the full showdown.
- Showdowns contain 1, 3, 5, or 10 seasons.
- Transfer Challenge: 15 minutes, maximum 3 signings per manager, 3 opponent guesses, each guess is a league or nationality; correctly guessed signings must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: 11.
- Equal non-zero season scores are a draw. Only a 0-0 scoring tie falls back to league position, then league points.

## Architecture

The application deliberately remains framework-free and backend-free.

### Core runtime

- `index.html` — application shell and core screens
- `js/app.js` — centralized bootstrap, runtime error boundary, diagnostics scheduling, visibility lifecycle
- `js/screens.js` — screen routing, route history, navigation lifecycle and save flushing
- `js/showdown.js` — showdown model, migration, integrity repair and core state helpers
- `js/storage.js` — active-save and Legacy persistence
- `js/scoring.js` — scoring rules and season winner calculation

### Gameplay flow

- `js/leagueWheel.js` — one-time league selection
- `js/clubAssignment.js` — permanent randomized club pair
- `js/transferChallenge.js` — timer, signing/guess entry and verdicts
- `js/seasonEngine.js` — results entry, completion transaction and season summary
- `js/showdownUI.js` — Showdown Home rendering

### Presentation

- `js/menuExperience.js` — menu tiles, soundtrack/trailer controller and licensed Marco Reus image treatment
- `js/visualIdentity.js` — deterministic original club crest-style identities generated from club names; no club badge images are bundled
- `css/fifa17-theme.css` — original FIFA-17-era-inspired visual system

### On-demand views

Heavy view-only modules stay out of the initial startup path and load only when requested:

- `js/legacy.js`
- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `js/ruleBook.js`

`js/optionalModules.js` owns their dependency order, load timeout, retry behavior and navigation race protection.

## Persistence

The application uses two browser-local keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

There is no account, cloud database, server process or cross-device synchronization in the current architecture.

Persistence rules:

- Critical transitions save immediately.
- Transfer text entry is debounced and deduplicated.
- Pending transfer drafts flush before navigation/page hiding.
- Failed critical writes roll in-memory mutations back where possible.
- Destructive Legacy operations check storage success and use rollback paths where possible.
- Completed showdowns are archived idempotently by showdown ID/revision.

## Performance and stability contract

Future development should preserve these constraints unless the architecture is intentionally redesigned:

1. **Do not normalize/recalculate the full showdown on keystrokes or timer ticks.** Full normalization belongs at creation/load/migration boundaries.
2. **Do not write localStorage on every keypress.** Draft writes must remain debounced/deduplicated; critical transitions remain immediate.
3. **Only one transfer timer interval may run**, and it must stop when the Transfer Challenge is hidden or the browser tab is hidden.
4. **Only one YouTube iframe may exist.** Media remains completely unloaded until the user presses Play.
5. **Heavy archive/analytics views remain lazy-loaded.** Their assets must not return to the initial startup bundle without a measured reason.
6. **Async UI operations must be identity-safe.** Delayed league spins, club reveals and lazy view loads must never mutate/navigate a newer showdown or newer route.
7. **Navigation must flush pending writes before leaving data-entry screens.** Failed flushes block navigation rather than silently losing data.
8. **Rendering should avoid unnecessary DOM writes.** Reuse cached element references, DocumentFragments, revision caches and existing rendered DOM when data did not change.
9. **All deployed local assets use one coherent cache revision.** Do not mix file versions in a release.
10. **No proprietary FIFA fonts, EA UI graphics, club badges or downloaded soundtrack files are bundled.** The visual treatment is original and inspired by the era; soundtrack/video playback uses external embeds.

## Runtime diagnostics

`js/diagnostics.js` runs after startup during browser idle time. It checks critical elements/functions, event bindings, localStorage availability, asset revision coherence, lazy-module failures/duplicates, route-history bounds and hidden timer/selection-operation leaks.

Runtime failures should surface through the in-app notice instead of appearing as silent dead buttons.

## Development philosophy

- Existing working behavior is the implementation source of truth.
- Preserve locked competition rules.
- Prefer focused fixes over rewrites.
- Keep the application static-hosting friendly.
- Optimize hot paths before adding abstraction.
- Avoid background work when the relevant screen is not visible.
- Keep optional/history functionality out of the critical startup path.

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists, or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menu design. Club identities are generated locally from text rather than using official club badges. No proprietary FIFA font or copied EA menu artwork is bundled. Menu songs and the gameplay trailer are played through user-initiated YouTube embeds rather than copied audio/video files. The Marco Reus photograph used by the menu treatment is sourced separately from Wikimedia Commons with its attribution/license link displayed in the application.
