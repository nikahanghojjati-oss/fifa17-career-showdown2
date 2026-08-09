# Career Mode Showdown

A two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current deployed asset revision:** `0.16.0-r3`  
**Current phase:** Chromebook/responsive stabilization before the original v0.95 polish milestone

## Development entry point

The design phase is complete. Do not restart planning or replace the architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact current implementation, locked amendments, architecture and original-roadmap alignment.
2. `NEXT_TASK.md` — current browser regression gate and the finite next milestone.
3. `CHANGELOG.md` — implementation history and why later build numbers do not replace the original roadmap.
4. Current source code — highest authority for implemented behavior.
5. Original Project Bible — long-term product blueprint where later owner decisions/current source have not superseded it.

After v0.16 stabilization passes, development returns to the original roadmap at **v0.95 Polish / Blueprint Alignment**, then moves directly to **v1.0**. Do not create an open-ended v0.17/v0.18 feature sequence.

## Version 1.0 scope

Career Mode Showdown is for two friends playing separate FIFA 17 Career Mode saves while tracking one shared rivalry on one device.

Current capabilities include:

- New and resumable showdowns
- FIFA-17-era league selection
- permanent randomized club assignment
- per-season Transfer Challenge
- Season Results and automatic scoring
- Season Summary and cumulative rivalry score
- multi-season progression
- completed-showdown recovery hub
- Legacy archive and season history
- Rivalry Statistics
- cumulative analytics / manager records
- Trophy Room
- Rule Book
- safe deletion/reset controls
- user-initiated FIFA 17 soundtrack/trailer media
- original FIFA-17-era-inspired responsive interface

## Locked competition rules

- Exactly two managers.
- One device / one browser / one active showdown.
- Both clubs come from the same selected league.
- League is selected once.
- Club assignment happens once and remains fixed for the full showdown.
- Showdowns contain 1, 3, 5 or 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings per manager, three opponent guesses, each guess league or nationality; correctly guessed signings must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: **11**.
- Equal non-zero season scores are a draw.
- Only a 0-0 scoring tie uses league position, then league points.

These later owner-approved scoring rules supersede conflicting older Project Bible wording.

## Original roadmap

The original Project Bible milestones remain the release destination:

- v0.6.1 — Application Framework
- v0.7 — Showdown Creation
- v0.8 — Season Management
- v0.9 — Scoring / Statistics / Legacy
- v0.95 — Polish and Experience
- v1.0 — Complete Release

Current source functionally covers the v0.7, v0.8 and v0.9 core and already includes substantial v0.95 stability/performance/presentation work.

Remaining finite v0.95 alignment work is documented in `PROJECT_STATE.md` and `NEXT_TASK.md`:

- Settings surface from the original screen plan;
- Main Menu Statistics alignment using the existing analytics/Trophy Room/Rivalry Statistics systems;
- pre-final Season review/confirmation safety if the current browser flow still lacks an equivalent step;
- final responsive/accessibility/performance/regression polish.

## Current responsive design architecture

The Home screen uses one unified stylesheet: `css/app.css`.

`v0.16.0-r3` specifically fixes the Chromebook/laptop Home layout without redesigning the mobile experience:

- core Career/navigation tiles occupy the first two desktop rows;
- soundtrack/trailer media sits below the primary navigation;
- desktop rows size to their content instead of remaining hard-fixed at 108px;
- loading a YouTube iframe expands the media row instead of overlapping another tile;
- desktop media choices use a compact four-column selector grid;
- low-height desktop/laptop viewports receive denser spacing while remaining vertically scrollable;
- tablet/mobile breakpoints retain their established auto-flow/single-column behavior.

## Runtime architecture

### Initial shell

Only seven JavaScript files and one stylesheet load initially:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

### Lazy gameplay package

Loaded only when gameplay is started/resumed:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

### Lazy secondary modules

- Legacy
- analytics
- Rivalry Statistics
- Trophy Room
- Rule Book
- diagnostics
- optional screen styles

## Cache contract

`index.html` owns one deployment asset revision through:

`<meta name="app-asset-revision" ...>`

Initial and dynamically loaded local assets use that value. Diagnostics and CI validate against the same value. Do not reuse an asset revision after deployed CSS/JS/data bytes change.

## Navigation contract

`js/screens.js` is the only route/history authority.

- Back history is advisory and state-aware.
- illegal/stale routes are rejected.
- locked clubs invalidate setup routes.
- completed Transfer Challenge invalidates obsolete transfer state.
- completed showdown resumes to Completed Showdown Home.
- pending writes flush before route changes.
- no other module manipulates `screenHistory`.

## Persistence contract

Browser keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Critical transitions save immediately. Transfer drafts are debounced/deduplicated. Failed critical writes use rollback paths where practical. Completed active save remains safe even if Legacy synchronization temporarily fails.

## Automated validation

GitHub Actions validates the exact repository head on every push/PR, including:

- `node --check` for JavaScript/data sources;
- locked scoring regression cases;
- navigation state matrix;
- completed-showdown restrictions;
- contextual Back behavior;
- release/cache coherence;
- initial script/stylesheet/startup-byte limits;
- centralized route-history authority;
- required HTML IDs;
- absence of obsolete prototype files.

The assistant runtime may not be able to clone GitHub locally due network/DNS restrictions. Do not claim a local repository syntax run unless it actually occurred; use the exact-head GitHub Actions result for repository-backed machine validation.

## Development philosophy

- Current source is the implementation source of truth.
- Original Project Bible is the long-term product blueprint where not superseded.
- Preserve locked rules and working stability/performance fixes.
- Do not restart planning.
- Do not redesign working architecture to match obsolete filenames.
- Fix root causes rather than stacking patches.
- Regression-test previously working behavior before advancing.
- Finish original v0.95 and v1.0 before post-v1.0 expansion.

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menus. It does not bundle proprietary FIFA fonts, copied EA menu artwork, official club badges or downloaded soundtrack files. Menu songs/trailer use user-initiated YouTube embeds, and the Marco Reus image treatment uses separately licensed Wikimedia imagery with attribution in the application.
