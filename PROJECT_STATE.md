# PROJECT STATE — Career Mode Showdown

## Current implementation

**Version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Release cache revision:** `0.16.0-r1`  
**Hosting model:** GitHub Pages / static HTML + CSS + vanilla JavaScript + localStorage  
**Current phase:** stabilization and owner regression validation  
**Feature expansion:** paused until v0.16.0 passes manual browser regression

## Authority

When implementation sources disagree, use this order:

1. Current source code on `main`
2. `PROJECT_STATE.md`
3. `NEXT_TASK.md`
4. Current Project Bible / architecture documentation
5. Older historical documentation

Do not revert working source merely because older documentation describes a previous implementation.

## Core product invariant

Career Mode Showdown is a two-manager, one-device tracker for two separate FIFA 17 Career Mode saves.

- Exactly two managers.
- Same league for both managers.
- League selected once.
- Two different clubs assigned once.
- Clubs remain fixed for the entire showdown.
- Showdowns contain 1, 3, 5 or 10 seasons.
- Static/local architecture; no backend, account or cloud synchronization in the current product.

## Locked scoring

Per manager per season:

- Champions League winner: +5
- League winner: +3
- Main domestic cup winner: +1
- 100 league points and/or 100 league goals: +1 maximum for the pair
- Top Scorer and/or Top Assist: +1 maximum for the pair
- Maximum: 11

Season winner:

- Higher score wins.
- Equal non-zero scores are a draw.
- Only 0-0 uses league position, then league points, then draw.

Do not split the two grouped bonuses back into four independent bonuses.

## Locked Transfer Challenge

Each season:

- 15-minute transfer window
- maximum 3 signings per manager
- opponent gets 3 guesses
- each guess is either league or nationality
- correctly matched signings must be released

## Current screens/features

Implemented and preserved:

- Main Menu
- New Showdown
- Continue Career
- League Wheel
- permanent Club Assignment / reveal
- Showdown Home
- Transfer Challenge
- Season Results
- Season Summary
- Legacy
- Rivalry Statistics
- Trophy Room
- Rule Book
- local persistence and resume
- specific Legacy deletion
- delete-all Legacy
- reset all local data
- soundtrack/trailer selector
- generated club visual identities
- completed-showdown recovery hub

Menu media currently preserved:

- Two Door Cinema Club — Are We Ready? (Wreck)
- Bastille — Send Them Off!
- Glass Animals — Youth
- Porter Robinson & Madeon — Shelter
- Saint Motel — Move
- Empire of the Sun — High and Low
- FIFA 17 gameplay trailer

## v0.16 architecture

### Initial shell

Only these application assets are loaded initially:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

### Lazy gameplay package

Loaded only when starting/resuming gameplay:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

### Lazy history/analytics

Loaded only when requested:

- Legacy
- analytics/statistics
- Trophy Room
- Rule Book
- diagnostics

## Smart Back / navigation invariant

`js/screens.js` is the only route-history authority.

- All ordinary `.backButton` clicks are intercepted centrally at capture phase.
- `.dangerButton` controls are excluded.
- `screenHistory` is advisory only.
- Back candidates must be legal for both the current screen and current showdown state.
- If history is stale, a deterministic safe fallback is used.
- A completed showdown cannot return to league selection, club assignment, Transfer Challenge or Season Results entry.
- A completed showdown resumes to Showdown Home.
- Showdown Home after completion has safe onward routes to Final Summary, Legacy, Trophy Room, Rivalry Statistics, New Showdown and Main Menu.

No module outside `js/screens.js` may manipulate `screenHistory`. CI enforces this.

## Persistence and rollback invariant

- Critical state transitions save immediately.
- Transfer typing is debounced/deduplicated.
- Pending transfer writes flush before navigation/page hide.
- Save failure rolls back the affected in-memory critical transition where possible.
- League spin and club reveal use operation/showdown identity guards.
- Hidden/off-screen transfer timer loops stop.
- Completed active save remains valid even if Legacy archiving temporarily fails.
- Legacy UI must never claim archive success when synchronization is pending.
- Destructive Legacy/reset operations use failure-aware rollback paths.

## Performance invariant

- One initial stylesheet only: `css/app.css`.
- Maximum seven initial JavaScript files.
- Gameplay is not eager-loaded from `index.html`.
- History/analytics remain lazy.
- One YouTube iframe maximum and only after explicit Play.
- Avoid full showdown normalization on keystrokes/timer ticks.
- Avoid localStorage writes on every keypress.
- Avoid duplicated DOM writes and unnecessary rerendering.
- Async delayed callbacks may not mutate a replacement/newer showdown.
- CI has a startup local-byte ceiling and fails architecture regressions.

## Removed obsolete architecture

Do not restore without an explicit design decision:

- multi-layer core CSS stack (`style.css`, `layout.css`, `animations.css`, `screens.css`, `wheel.css`, `stability.css`, `polish.css`, `menu.css`, `fifa17-theme.css`)
- prototype stubs `data/rules.js`, `js/router.js`, `js/scoreboard.js`, `js/ui.js`, `js/wheels.js`
- old HTML `data-back` navigation
- direct route-history mutation by feature modules

## Automated validation

GitHub Actions validates every push/PR.

Required checks include:

- `node --check` over all JavaScript in `js/` and `data/`
- release/cache revision coherence
- duplicate/critical HTML IDs
- exactly one initial stylesheet
- maximum seven initial scripts
- no eager gameplay modules in the shell
- startup byte budget
- no `data-back`
- centralized Back interception
- no `screenHistory` references outside `screens.js`
- completed-showdown recovery state
- no dead prototype files

The local assistant container may be unable to clone GitHub because of DNS/network restrictions. That is not a source-validation blocker: use the GitHub Actions run for the exact head commit and report its actual result; never claim a local `node --check` when it was not run locally.

## Current manual validation status

Automated validation has passed during the v0.16 stabilization work. A final exact-head Actions run must be checked after the last stabilization commit.

Owner manual browser regression is still required before moving to the next feature phase.

## Development philosophy

- Implementation mode, not planning mode.
- Inspect source first.
- Preserve current working behavior and locked gameplay.
- Do not redesign the product direction during ordinary bug fixing.
- Do not repeat settled architecture discussions.
- Fix root causes instead of stacking patches.
- Keep the runtime light.
- Prefer one authoritative system over competing mechanisms.
- Test/regression-check before advancing.
- If a task is clear, implement rather than asking for confirmation.
