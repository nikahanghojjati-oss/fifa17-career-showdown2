# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry tracker built for GitHub Pages with plain HTML, CSS, JavaScript, and browser localStorage.

Current release: **v0.16.0 — Smart Navigation & Lightweight Runtime**

## Product scope

Career Mode Showdown is designed for two friends playing separate FIFA 17 Career Mode saves while tracking one shared rivalry on a single device.

The app provides:

- New and resumable showdowns
- FIFA 17-era league selection
- Permanent randomized club assignment
- Per-season Transfer Challenge
- Season results and scoring
- Season summaries and cumulative rivalry score
- Completed-showdown recovery hub
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

## v0.16 architecture

The application remains framework-free, backend-free and static-hosting friendly.

### Initial runtime

The Home screen intentionally starts with only seven JavaScript files and one stylesheet:

- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`
- `css/app.css`

The CI budget prevents gameplay engines from silently returning to the startup bundle.

### On-demand gameplay runtime

Gameplay code is loaded together only when the user starts or resumes a showdown:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

Hovering or focusing Continue/Start may predictively warm this package, but Home does not parse it during ordinary startup.

### On-demand history and analytics

These remain lazy and load only when requested:

- `js/legacy.js` + `css/legacy.css`
- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `js/ruleBook.js` + `css/rulebook.css`
- `css/analytics.css`

`js/optionalModules.js` owns dependency order, deduplication, timeout/retry behavior, gameplay loading and stale-navigation protection.

## Smart navigation contract

`js/screens.js` is the single navigation authority.

- Every ordinary `.backButton`, including buttons created later by lazy modules, is intercepted centrally before local module handlers can run.
- Destructive `.dangerButton` controls are excluded from Back interception.
- Back history is advisory, not authoritative.
- Each screen has a small legal set of safe parents.
- A route is accepted only when it is valid for the current showdown state.
- If history is stale or impossible, the router derives a canonical route from the active showdown.
- Club assignment permanently invalidates the league/club setup path.
- A completed transfer challenge cannot be revived as an obsolete Transfer Challenge route.
- A completed showdown cannot be sent back into league, club, transfer or results-entry setup.
- Completed showdown resume always resolves to Showdown Home.
- Completed Showdown Home exposes Final Summary, Legacy, Trophy Room, Rivalry Statistics, New Showdown and Main Menu instead of becoming a dead-end page.
- Pending transfer/storage writes are flushed before navigation. A failed critical flush blocks the route rather than silently losing data.

No other module should read or mutate `screenHistory` directly. CI enforces this rule.

## Persistence

The application uses two browser-local keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

There is no account, cloud database, server process or cross-device synchronization.

Persistence guarantees:

- Critical transitions save immediately.
- Transfer text entry is debounced and deduplicated.
- Pending transfer drafts flush before navigation/page hiding.
- Failed critical writes roll in-memory mutations back where possible.
- League and club delayed operations use showdown/operation identity guards.
- Destructive Legacy operations check storage success and use rollback paths where possible.
- Completed showdowns are archived idempotently by showdown ID/revision.
- If final-season Legacy sync fails, the completed active save remains safe and the UI reports `Legacy sync pending` rather than claiming success.

## Performance and stability contract

Future development must preserve these constraints unless an explicit architecture change is approved:

1. **Exactly one core stylesheet at initial load:** `css/app.css`.
2. **Maximum seven initial JavaScript files.** Gameplay engines remain on demand.
3. **Initial local CSS/JS budget stays below the CI ceiling.** A larger initial bundle requires a measured, intentional decision.
4. **Do not normalize/recalculate the full showdown on keystrokes or timer ticks.** Full normalization belongs at creation/load/migration boundaries.
5. **Do not write localStorage on every keypress.** Draft writes remain debounced and deduplicated; critical transitions remain immediate.
6. **Only one transfer timer interval may run**, and it stops when Transfer Challenge or the browser tab is hidden.
7. **Only one YouTube iframe may exist.** Media remains unloaded until Play.
8. **Heavy gameplay/history/analytics modules remain lazy-loaded.**
9. **Async UI operations are identity-safe.** Old league spins, club reveals and lazy loads cannot mutate or navigate a newer state.
10. **The router is the only Back/history authority.** Modules do not manipulate route history.
11. **Navigation flushes pending writes before leaving data-entry screens.**
12. **Rendering avoids unnecessary DOM writes.** Use cached elements, fragments, revision caches and unchanged-text checks.
13. **All deployed local assets use one coherent cache revision.**
14. **No proprietary FIFA fonts, copied EA UI graphics, official club badges or downloaded soundtrack files are bundled.**

## Runtime diagnostics and automated validation

`js/diagnostics.js` is itself lazy-loaded during browser idle time. It understands the gameplay runtime's `idle/loading/ready/error` states and does not mistake intentionally unloaded gameplay code for missing code.

It checks storage availability, bindings, route state, route-history bounds, hidden timer/selection-operation leaks, optional-module failures/duplicates, bundle revisions and visual shell integrity.

`.github/workflows/validate-static-app.yml` runs on every push/PR and checks:

- every `js/` and `data/` JavaScript file with `node --check`
- one coherent release/cache revision
- required and duplicate HTML IDs
- exactly one initial stylesheet
- maximum seven initial JavaScript files
- no eager gameplay modules in `index.html`
- startup local-byte budget
- no legacy `data-back` routing
- centralized Back authority
- no direct `screenHistory` manipulation outside `screens.js`
- completed-showdown recovery UI
- absence of dead prototype files

## Development philosophy

- Current working source code is the implementation source of truth.
- Preserve locked competition rules and completed features.
- Do not restart planning or redesign the project direction during ordinary bug fixing.
- Inspect the current implementation before changing it.
- Prefer focused, testable improvements over speculative rewrites.
- Optimize hot paths and startup work before adding abstraction.
- Avoid background work when its screen is not visible.
- Keep optional/history functionality out of the critical startup path.
- Fix regressions before moving to the next feature milestone.

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists, or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menu design. Club identities are generated locally from text rather than using official club badges. No proprietary FIFA font or copied EA menu artwork is bundled. Menu songs and the gameplay trailer are played through user-initiated YouTube embeds rather than copied audio/video files. The Marco Reus photograph used by the menu treatment is sourced separately from Wikimedia Commons with its attribution/license link displayed in the application.
