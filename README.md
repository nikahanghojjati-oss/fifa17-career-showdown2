# Career Mode Showdown

A two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Current application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current deployed asset revision:** `0.16.0-r3`  
**Current phase:** stabilization before the original v0.95 Polish / Blueprint Alignment milestone

## Development entry point

The design phase is complete. Do not restart planning or replace working architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact current implementation, locked amendments, architecture, roadmap audit and remaining blueprint obligations.
2. `NEXT_TASK.md` — current browser regression gate and finite v0.95 workstreams.
3. `CHANGELOG.md` — historical continuity and corrections to earlier milestone classifications.
4. Current source code — highest authority for what is actually implemented.
5. Original Project Bible — long-term product blueprint where later owner decisions/current source have not intentionally superseded it.

After v0.16 stabilization passes, development returns to the original roadmap at **v0.95**, then directly to **v1.0**. Do not create an open-ended v0.17/v0.18 feature sequence.

---

## Version 1.0 scope

Career Mode Showdown is for two friends playing separate FIFA 17 Career Mode saves while tracking one persistent rivalry on one device.

Current working capabilities include:

- new and resumable showdowns;
- FIFA-17-era league selection;
- reliable permanent randomized club assignment;
- per-season Transfer Challenge;
- Season Results + automatic scoring;
- Season Summary + cumulative rivalry score;
- multi-season progression;
- Completed Showdown Home;
- Legacy archive/history;
- Rivalry Statistics;
- cumulative analytics/manager records;
- Trophy Room;
- Rule Book;
- safe delete/reset controls;
- user-initiated FIFA 17 soundtrack/trailer media;
- responsive FIFA-17-era-inspired presentation.

### Important club-reveal status

The **club-assignment mechanics are implemented and hardened**, but the original v0.7 **FUT-style staged reveal and final rivalry-confirmation experience are not yet complete**.

Current source reveals two basic cards after a short delay. The original blueprint requires a meaningful sequence:

**League Confirmed → Manager 1 Club → Manager 2 Club → Final VS Rivalry Presentation → User Confirmation → Showdown Home**

This is now the first v0.95 blueprint-alignment obligation. It must be implemented without weakening permanent club locking, save rollback, race-safety, navigation, responsiveness or performance.

---

## Locked competition rules

- Exactly two managers.
- One device / one browser / one active showdown.
- Both clubs come from the same selected league.
- League selected once per showdown.
- Club pair assigned once and permanent for the full showdown.
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

Later owner-approved scoring/Transfer Challenge rules supersede conflicting older Bible wording.

---

## Original roadmap

The original Project Bible milestones remain the release destination:

- v0.6.1 — Application Framework
- v0.7 — Showdown Creation
- v0.8 — Season Management
- v0.9 — Scoring / Statistics / Legacy
- v0.95 — Polish and Experience
- v1.0 — Complete Release

Current audit:

- v0.6.1: complete and hardened;
- v0.7 mechanics: complete;
- v0.7 FUT reveal + final rivalry confirmation: **incomplete**;
- v0.8 functional season management: complete, expanded by approved Transfer Challenge;
- v0.9 scoring/history/analytics core: functionally complete;
- v0.95 quality work: substantially implemented, remaining finite obligations below;
- v1.0: not yet declared complete.

Remaining v0.95 convergence work, in order:

1. complete the carried-forward original v0.7 FUT-style reveal + final rivalry confirmation;
2. Settings blueprint surface;
3. Main Menu cumulative Statistics alignment using existing analytics/Trophy Room/Rivalry Statistics;
4. pre-final Season review/confirmation safety if the current flow lacks an equivalent safeguard;
5. final Chromebook/laptop/mobile/accessibility/performance/regression polish.

---

## FUT reveal implementation boundary

The future reveal must reuse the current assignment engine and `visualIdentity.js` rather than inventing a new graphics/data architecture.

Preserve:

- same-league/different-club validation;
- one assignment only / no reroll;
- atomic save + rollback;
- operation/showdown/league identity guards;
- smart route authority in `screens.js`;
- lazy gameplay package;
- unified `css/app.css`;
- startup budget;
- Chromebook/mobile responsiveness.

Presentation remains lightweight and legally distinct:

- CSS transforms/opacity/clip/gradients;
- deterministic generated initials/colors;
- finite/cancellable reveal stages;
- reduced-motion path;
- no canvas/WebGL/video reveal engine;
- no official club badges;
- no copied EA/FUT card artwork;
- no proprietary FIFA font;
- no downloaded reveal media bundle;
- no continuous animation loop.

---

## Current responsive design architecture

`v0.16.0-r3` fixed a real Chromebook/laptop Home overlap root cause:

- desktop Home rows now size to content;
- Career/navigation tiles come before media;
- soundtrack/trailer media sits below primary navigation;
- YouTube player expansion pushes content down instead of overlapping tiles;
- desktop media selector uses a compact grid;
- low-height laptop/Chromebook viewport receives denser spacing while remaining scrollable;
- tablet/mobile auto-flow/single-column behavior remains preserved.

---

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

---

## Cache / navigation / persistence contracts

`index.html` owns one deployment asset revision via `<meta name="app-asset-revision">`. Initial and dynamically loaded assets derive from it. Do not reuse a revision after deployed app bytes change.

`js/screens.js` is the single route/history authority. History is state-aware; locked/completed states invalidate obsolete routes; pending critical writes flush before leaving entry screens.

Browser persistence keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Critical transitions save immediately; transfer drafts are debounced/deduplicated; failed critical writes use rollback where practical; completed active save remains safe if Legacy synchronization temporarily fails.

---

## Development philosophy

- Current source is the implementation truth.
- Original Project Bible is the long-term product blueprint where not superseded.
- Verify milestone acceptance criteria against behavior; do not trust filenames/comments alone.
- Preserve locked rules and hard-earned stability/performance fixes.
- Do not restart planning.
- Do not redesign reliable architecture to match obsolete filenames.
- Fix root causes rather than stack patches.
- Add deterministic regression coverage when practical.
- Regression-test previously working systems before advancing.
- Finish **v0.95 → v1.0** before post-v1.0 expansion.

---

## Legal / fan-project presentation

This is a personal fan-project tracker and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses an original visual system inspired by mid-2010s football-game menus. It does not bundle proprietary FIFA fonts, copied EA/FUT artwork, official club badges or downloaded soundtrack files. Menu media uses user-initiated YouTube embeds; the Marco Reus image treatment uses separately licensed Wikimedia imagery with attribution in the application.
