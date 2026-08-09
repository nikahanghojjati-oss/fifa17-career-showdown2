# Career Mode Showdown

A two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed asset revision:** `0.95.0-r1`  
**Current phase:** owner browser acceptance of the staged club reveal / rivalry confirmation workstream

## Development entry point

The design phase is complete. Do not restart planning or replace the architecture.

Read in this order:

1. `PROJECT_STATE.md` — current implementation, locked rules, architecture and roadmap status.
2. `NEXT_TASK.md` — exact v0.95.0-r1 browser acceptance matrix.
3. `CHANGELOG.md` — implementation history.
4. Current source code — highest authority for implemented behavior.
5. Original Project Bible — long-term blueprint where later owner decisions/current source have not intentionally superseded it.

The owner accepted `v0.16.0-r3`, closing responsive stabilization. Development has now returned to the original roadmap at **v0.95**, followed directly by **v1.0**.

## Current v0.95.0-r1 highlight

The original v0.7 club-assignment experience is now implemented as a staged, lightweight rivalry reveal:

**League Confirmed → Reveal Begins → Manager 1 Club → Manager 2 Club → VS Presentation → Explicit Rivalry Confirmation → Showdown Home**

The final confirmation shows:

- showdown name;
- selected league;
- season count;
- Manager 1 + club;
- Manager 2 + club;
- central VS treatment;
- explicit Confirm Rivalry & Start Showdown action.

The presentation is built around the existing reliable club-assignment transaction. It does not replace or weaken it.

## Club assignment integrity

- Both clubs come from the selected league.
- Clubs must be different.
- The pair is generated once.
- The pair is persisted before theatrical reveal begins.
- Failed persistence rolls the assignment back.
- Reveal animation phases do not write storage.
- Saved clubs cannot be rerolled.
- `Clubs Assigned` means the permanent pair exists but final rivalry confirmation is still pending.
- Refresh/Continue in that state returns to Club Assignment with the same pair.
- League Wheel, Dashboard and Transfer Challenge cannot bypass pending confirmation.
- Successful confirmation advances the showdown to `Ready` and opens Showdown Home.
- Reveal timers are finite and protected against stale showdown/league callbacks.
- Reduced-motion users receive the same club information and confirmation without the theatrical staging.

## Version 1.0 competition rules

- Exactly two managers.
- One device / one browser / one active showdown.
- Both managers play separate FIFA 17 Career Mode saves.
- League selected once.
- Clubs assigned once and permanent for all seasons of that showdown.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Current top-five FIFA-17-era European league pool.
- Transfer Challenge each season: 15 minutes, max three signings, three opponent guesses, league or nationality, correctly guessed signing must be released.
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
- staged permanent club assignment/reveal
- rivalry confirmation checkpoint
- Showdown Home
- Transfer Challenge
- Season Results and automatic scoring
- Season Summary
- multi-season progression
- Completed Showdown Home
- Legacy archive/history
- Rivalry Statistics
- cumulative analytics / manager records
- Trophy Room
- Rule Book
- safe delete/reset controls
- user-initiated FIFA 17 soundtrack/trailer media
- original FIFA-17-era-inspired responsive interface

## Runtime architecture

### Initial shell

Only one stylesheet and seven JavaScript files load initially:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI retains a 145,000-byte initial local-asset ceiling.

### Lazy gameplay package

Loaded only when gameplay is entered/resumed:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

The new reveal remains inside this lazy package and adds no startup script.

### Lazy secondary modules

- Legacy
- analytics
- Rivalry Statistics
- Trophy Room
- Rule Book
- diagnostics
- optional view styles

## Navigation contract

`js/screens.js` is the only route/history authority.

- Back history is state-aware.
- Illegal/stale routes are rejected.
- Saved clubs permanently invalidate League Wheel.
- `Clubs Assigned` keeps only final Club Assignment confirmation legal.
- `Ready` invalidates Club Assignment and allows Showdown Home.
- Completed Transfer Challenge cannot be resurrected.
- Completed showdown resumes to Completed Showdown Home.
- Pending writes flush before navigation.
- No other module manipulates `screenHistory`.

## Persistence contract

Browser keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Critical transitions save immediately. Transfer drafts remain debounced/deduplicated. Failed critical transitions use rollback where practical. Completed active saves remain safe if Legacy synchronization temporarily fails.

No new storage schema was needed for v0.95.0-r1.

## Cache contract

`index.html` owns the deployed asset revision through:

`<meta name="app-asset-revision" content="0.95.0-r1">`

Initial and dynamically loaded local assets use that value. Do not reuse it after deployed CSS/JS/data bytes change.

## Automated validation

GitHub Actions validates the exact repository head, including:

- JavaScript syntax;
- locked max-11 scoring behavior;
- grouped bonuses and tie rules;
- canonical navigation matrix;
- confirmation-pending refresh/resume route;
- setup-route restrictions after clubs are saved;
- completed-showdown restrictions;
- contextual Back behavior;
- cache revision coherence;
- one stylesheet / maximum seven initial scripts;
- startup byte budget;
- required/duplicate HTML IDs;
- staged reveal source contract;
- reduced-motion reveal path;
- centralized route-history authority;
- Chromebook layout guards;
- absence of obsolete prototype files.

The implementation validation run at commit `704e8420743991c921b982149d5b331fe9ce833d` passed. Real Chromebook/mobile browser acceptance remains required before the reveal workstream is declared complete.

## Remaining original roadmap

### v0.95 Workstream 1 — staged reveal / rivalry confirmation

Implemented in source as `v0.95.0-r1`; owner acceptance pending. See `NEXT_TASK.md`.

After acceptance:

1. Settings blueprint alignment.
2. Main Menu Statistics alignment using existing analytics.
3. Season pre-commit review if still missing.
4. Final responsive/accessibility/performance/regression polish.
5. Move directly to **v1.0**.

Do not start an open-ended unrelated feature sequence before Version 1.0.

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menus. The reveal uses generated initials/colors, CSS geometry and original layouts rather than official badges, copied FUT card artwork, proprietary FIFA fonts or downloaded reveal media. Menu songs/trailer remain user-initiated YouTube embeds; separately licensed imagery retains its attribution.
