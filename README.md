# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current deployed asset revision:** `0.16.0-r2`  
**Current phase:** stabilization / owner regression before the original v0.95 polish milestone

## Start here before development

The project design phase is complete. Do not restart planning or create a replacement architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact current implementation, locked amendments, original-roadmap alignment and remaining gaps.
2. `NEXT_TASK.md` — immediate regression gate and the finite next milestone.
3. `CHANGELOG.md` — historical continuity and explanation of roadmap milestones versus implementation builds.
4. Current source code — highest authority for what is actually implemented.
5. Original Project Bible — authoritative design blueprint where it has not been explicitly superseded by later owner decisions/current state.

The project is not heading toward an open-ended v0.17/v0.18 feature sequence. After the current v0.16 regression is accepted, development rejoins the original roadmap at **v0.95 Polish / Blueprint Alignment**, then moves to **v1.0 Complete Release**.

## Product scope

Career Mode Showdown is designed for two friends playing separate FIFA 17 Career Mode saves while tracking one shared rivalry on a single device.

The current app provides:

- New and resumable showdowns
- FIFA 17-era league selection
- Permanent randomized club assignment
- Per-season Transfer Challenge
- Season results and automatic scoring
- Season summaries and cumulative rivalry score
- Completed-showdown recovery hub
- Legacy archive and season history
- Rivalry Statistics
- cumulative analytics / manager records
- Trophy Room
- Rule Book
- safe deletion/reset controls
- FIFA 17 soundtrack/trailer menu media through lazy YouTube embeds
- original FIFA-17-era-inspired interface and generated club identities

## Locked competition rules

- Exactly two managers in Version 1.0.
- One device / one browser / one active showdown.
- Both clubs come from the same selected league.
- League selection happens once per showdown.
- Club assignment happens once and stays fixed for the full showdown.
- Showdowns contain 1, 3, 5 or 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings per manager, three opponent guesses, each guess is a league or nationality; correctly guessed signings must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: **11**.
- Equal non-zero season scores are a draw.
- Only a 0-0 scoring tie falls back to league position, then league points.

These scoring rules are later owner-approved amendments and supersede conflicting older Project Bible wording.

## Original roadmap alignment

The original Project Bible roadmap remains the release destination:

- v0.6.1 — Application Framework
- v0.7 — Showdown Creation
- v0.8 — Season Management
- v0.9 — Scoring / Statistics / Legacy
- v0.95 — Polish and Experience
- v1.0 — Complete Release

Current source functionally covers the v0.7, v0.8 and v0.9 core and already implements a substantial amount of v0.95 performance/navigation/presentation work.

The remaining v0.95 blueprint-alignment areas are intentionally finite and documented in `PROJECT_STATE.md` / `NEXT_TASK.md`:

- Settings surface from the original screen specification;
- resolve the original Main Menu Statistics surface against the existing Trophy Room/Rivalry Statistics analytics architecture;
- inspect/close the original pre-final season review/confirmation safety requirement;
- complete owner-found regression, responsive, accessibility and polish issues.

No post-v1.0 features should interrupt this path.

## v0.16 architecture

The application remains framework-free, backend-free and static-hosting friendly.

### Initial runtime

Home intentionally starts with only seven JavaScript files and one stylesheet:

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

Hovering/focusing Continue or Start may predictively warm this package, but Home does not parse it during ordinary startup.

### On-demand history and analytics

These remain lazy and load only when requested:

- `js/legacy.js` + `css/legacy.css`
- `js/analytics.js`
- `js/statistics.js`
- `js/trophyRoom.js`
- `js/ruleBook.js` + `css/rulebook.css`
- `css/analytics.css`
- `js/diagnostics.js`

`js/optionalModules.js` owns dependency order, deduplication, timeout/retry behavior, gameplay loading and stale-navigation protection.

## Release cache contract

`index.html` owns the deployed local-asset revision through one:

`<meta name="app-asset-revision" ...>`

Initial assets, dynamically loaded assets, diagnostics and CI all derive/validate against that shell-owned revision.

This prevents the browser from combining newer source with an older cached gameplay/style generation under a reused revision key.

## Smart navigation contract

`js/screens.js` is the single navigation authority.

- Every ordinary `.backButton`, including buttons created later by lazy modules, is intercepted centrally before local module handlers can run.
- Destructive `.dangerButton` controls are excluded from Back interception.
- Back history is advisory, not authoritative.
- Each screen has a finite legal set of logical parents.
- A history destination must also be valid for the current showdown state.
- If history is stale/impossible, the router derives a canonical safe route from the active showdown.
- Club assignment permanently invalidates obsolete League/Club setup routes.
- A completed Transfer Challenge cannot be revived as an active transfer route.
- A completed showdown cannot return to league, club, transfer or results-entry setup.
- Completed-showdown resume resolves to Completed Showdown Home.
- Completed Showdown Home exposes Final Summary, Legacy, Trophy Room, Rivalry Statistics, New Showdown and Main Menu instead of becoming a dead-end page.
- Legacy/Trophy/New Showdown opened from the completed hub can Back to that hub; when opened from Main Menu, Back returns to Main Menu.
- Pending transfer/storage writes are flushed before navigation. A failed critical flush blocks the route rather than silently losing data.

No other module may read or mutate `screenHistory` directly. CI enforces this rule.

## Persistence

The application uses two browser-local keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

There is no account, cloud database, server process or cross-device synchronization in Version 1.0.

Persistence guarantees:

- critical transitions save immediately;
- transfer text entry is debounced and deduplicated;
- pending drafts flush before navigation/page hiding;
- failed critical writes roll in-memory mutations back where possible;
- League/Club delayed operations use showdown/operation identity guards;
- destructive Legacy operations check storage success and use rollback paths where possible;
- completed showdowns archive idempotently by showdown ID/revision;
- if final-season Legacy sync fails, the completed active save remains safe and the UI reports `Legacy sync pending` rather than claiming success.

## Performance and stability contract

Future development must preserve these constraints unless an explicit architecture change is approved:

1. Exactly one core stylesheet at initial load: `css/app.css`.
2. Maximum seven initial JavaScript files; gameplay engines remain on demand.
3. Initial local CSS/JS stays below the CI budget.
4. Do not normalize/recalculate the full showdown on keystrokes or timer ticks.
5. Do not write localStorage on every keypress.
6. Only one transfer timer interval may run, and it stops off-screen/hidden.
7. Only one YouTube iframe may exist and media remains unloaded until Play.
8. Heavy gameplay/history/analytics modules remain lazy-loaded.
9. Async League/Club operations remain showdown/operation identity-safe.
10. `js/screens.js` remains the Back/history authority.
11. Navigation flushes pending writes before leaving data-entry screens.
12. Rendering avoids unnecessary DOM writes.
13. All local deployed assets share the shell-owned cache revision.
14. No proprietary FIFA fonts, copied EA UI graphics, official club badges or downloaded soundtrack files are bundled.

## Runtime diagnostics and automated validation

`js/diagnostics.js` is lazy-loaded during browser idle time. It understands gameplay runtime `idle/loading/ready/error` states and does not mistake intentionally unloaded gameplay code for missing code.

`.github/workflows/validate-static-app.yml` runs on every push/PR and checks, among other invariants:

- every `js/` and `data/` file with `node --check`;
- locked scoring regression cases;
- canonical showdown-route matrix;
- completed-showdown restrictions;
- contextual Back parents;
- one shell-owned cache revision;
- required / duplicate HTML IDs;
- exactly one initial stylesheet;
- maximum seven initial JavaScript files;
- no eager gameplay modules in `index.html`;
- startup local-byte budget;
- no legacy `data-back` routing;
- centralized Back authority;
- no `screenHistory` manipulation outside `screens.js`;
- completed-showdown recovery UI;
- absence of dead prototype files.

The assistant runtime has previously been unable to clone GitHub locally because of its network/DNS environment. Do not claim a local repository `node --check` unless it actually runs. Exact-head GitHub Actions validation is the repository-backed machine check used for this project.

## Development philosophy

- Current working source is the implementation source of truth.
- The original Project Bible remains the product/release blueprint where not explicitly superseded.
- Preserve locked competition rules and completed features.
- Do not restart planning.
- Do not create a new architecture to match historical filenames.
- Inspect current implementation before changing it.
- Fix root causes rather than stacking patches.
- Add deterministic regression coverage when practical.
- Regression-test old systems before advancing.
- Keep optional/history work off the critical startup path.
- Finish v0.95 and v1.0 before entertaining post-v1.0 expansion.

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menu design. Club identities are generated locally from text rather than official club badges. No proprietary FIFA font or copied EA menu artwork is bundled. Menu songs and the gameplay trailer are played through user-initiated YouTube embeds rather than copied audio/video files. The Marco Reus photograph used by the menu treatment is sourced separately from Wikimedia Commons with its attribution/license link displayed in the application.
