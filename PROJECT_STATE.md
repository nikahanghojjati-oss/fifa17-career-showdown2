# PROJECT STATE — Career Mode Showdown

## Purpose

This is the continuation authority for the current implementation.

The project is already designed. Future development must not restart planning, reinterpret patch/build numbers as a new roadmap, or discard working architecture simply because an older document names a different file or earlier rule.

The goal is still the original long-term Project Bible goal: finish a complete Version 1.0 Career Mode Showdown experience, while preserving every later owner-approved rule and every reliability lesson learned during implementation.

---

# Current implementation

**Application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current deployed asset revision:** `0.16.0-r3`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + unified CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current phase:** stabilization / responsive-design regression / original-roadmap alignment  
**Feature expansion:** frozen until the current stabilization regression is accepted

`0.16.0-r3` is a deployment/stabilization revision of v0.16.0. It is not a new gameplay milestone and does not replace the original release roadmap.

---

# Authority hierarchy

When sources disagree, use this order:

1. current source code on `main`;
2. explicit later owner amendments recorded here;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current Project Bible / architecture / release documentation;
6. older historical documents and conversations.

The original Project Bible remains the long-term product blueprint wherever a later owner decision or working implementation has not intentionally superseded it.

---

# Product mission

Career Mode Showdown is a football-game companion for two friends playing separate FIFA 17 Career Mode saves.

The application turns those separate saves into one persistent rivalry:

Main Menu  
→ Create Showdown  
→ League Selection  
→ Permanent Club Assignment  
→ Showdown Home  
→ Transfer Challenge  
→ Season Results  
→ Season Summary  
→ Next Season  
→ Final Winner  
→ Permanent Legacy / statistics

The experience should feel like a football-game menu companion rather than an administrative website: fast, obvious, immersive, persistent, coherent and reliable.

---

# Locked Version 1.0 product scope

Unless the owner explicitly changes them, these remain locked:

- exactly two managers;
- one device / one browser;
- one active showdown at a time;
- each manager plays a separate FIFA 17 Career Mode save;
- both managers compete in the same selected league;
- league is selected once;
- two different clubs are assigned once;
- clubs remain permanent for the entire showdown;
- club reuse across different showdowns is allowed;
- showdown length is 1, 3, 5 or 10 seasons;
- current top-five FIFA-17-era European league database remains the Version 1.0 pool;
- results are entered manually;
- no screenshots or match notes are required;
- localStorage remains the Version 1.0 persistence layer;
- no accounts, backend, cloud synchronization, QR pairing or real-time two-device play in Version 1.0.

Post-v1.0 ideas must not interrupt the release path:

- online multiplayer;
- two-device synchronization;
- cloud saves;
- accounts;
- community systems;
- public rankings;
- unrelated feature expansion.

---

# Locked gameplay amendments

The following later decisions supersede conflicting historical Bible wording.

## Scoring — final current rule

Per manager per season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- League Top Scorer and/or Top Assist: **+1 maximum for the pair**

**Maximum: 11 points per manager per season.**

Do not restore four independent bonus points or a maximum of 13.

## Season winner — final current rule

1. Higher scoring total wins.
2. Equal non-zero totals are a draw.
3. Only if both managers score 0:
   - better league position wins;
   - if positions are equal, more league points wins;
   - otherwise draw.

Do not introduce goal difference, league goals or head-to-head as another tiebreak without owner approval.

## Transfer Challenge — established current season phase

Every season includes:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- every guess is either league or nationality;
- correctly guessed signings must be released.

## Match-play rule

Current Rule Book behavior remains:

- career matches are normally simulated;
- Champions League final may be played or simulated;
- main domestic cup final may be played or simulated.

---

# Current implemented experience

These systems exist and must be preserved rather than re-planned.

## Core rivalry flow

- loading/bootstrap;
- Main Menu;
- New Showdown;
- manager names and showdown name;
- 1 / 3 / 5 / 10 season choice;
- League Wheel;
- persisted league lock;
- FUT-inspired Club Assignment/reveal;
- different-club validation;
- permanent club lock;
- Showdown Home;
- Continue Career;
- per-season Transfer Challenge;
- persisted real transfer deadline;
- transfer draft persistence;
- guess evaluation/release verdict;
- Season Results;
- automatic scoring;
- Season Summary;
- multi-season progression;
- final completion;
- completed-showdown recovery hub.

## History / analytics

- Legacy archive;
- season-by-season history;
- specific Legacy deletion;
- delete-all Legacy;
- full local-data reset;
- Rivalry Statistics;
- cumulative analytics engine;
- Trophy Room / manager records;
- Rule Book.

## Presentation

- original FIFA-17-era-inspired tile system;
- unified `css/app.css` visual system;
- generated club visual identities rather than official badges;
- user-initiated soundtrack/trailer selector;
- Marco Reus menu treatment using separately licensed imagery;
- responsive layouts;
- visible runtime notices/errors;
- reduced-motion support.

---

# Current application flow

## New rivalry

Application  
→ Main Menu  
→ New Showdown  
→ League Wheel  
→ Club Assignment  
→ Showdown Home

## Resume

Application  
→ Main Menu  
→ Continue Career  
→ canonical destination derived from persisted state

Canonical state rules:

- no selected league → League Wheel;
- selected league without valid clubs → Club Assignment;
- active/recording Transfer Challenge → Transfer Challenge;
- ordinary active showdown → Showdown Home;
- completed showdown → Completed Showdown Home.

## Season cycle

Showdown Home  
→ Transfer Challenge  
→ Season Results  
→ Season Summary  
→ next Transfer Challenge / Completed Showdown Home

## Completed showdown

Completed Showdown Home exposes safe routes to:

- Final Season Summary;
- Legacy;
- Trophy Room;
- Rivalry Statistics;
- New Showdown;
- Main Menu.

The completed hub intentionally supersedes the older forced-direct-to-Legacy ending because it prevents a terminal/dead-end experience while still preserving the completed rivalry automatically.

---

# Navigation architecture — current lock

`js/screens.js` is the only route/history authority.

The old Project Bible expected a separate `router.js`, but the responsibility evolved into `screens.js`. Do not recreate an obsolete file solely to match an old filename.

Current guarantees:

- ordinary `.backButton` events are intercepted centrally;
- destructive `.dangerButton` controls are excluded;
- `screenHistory` is advisory only;
- legal Back destinations depend on both route history and current showdown state;
- stale/illegal history falls back to a deterministic safe route;
- pending transfer/storage writes flush before leaving entry screens;
- failed critical flush blocks navigation instead of silently discarding data;
- locked clubs invalidate obsolete League/Club setup routes;
- completed Transfer Challenge invalidates the obsolete transfer route;
- completed showdown invalidates League, Club, Transfer and Season Results-entry routes;
- Completed Showdown Home is the canonical completed destination;
- Legacy/Trophy Room/New Showdown return to Completed Showdown Home when opened from that hub and return to Main Menu when Main Menu was the actual origin.

No other module may manipulate `screenHistory`. CI enforces this.

---

# Persistence architecture — current lock

Storage authority: `js/storage.js`

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Current guarantees:

- critical state changes save immediately;
- transfer typing is debounced/deduplicated;
- pending writes flush on route/page lifecycle boundaries;
- failed critical writes roll back affected in-memory transitions where practical;
- active-save presence is cached but invalidated correctly;
- Legacy reads use revision caching;
- completed-showdown archiving is idempotent;
- destructive operations verify storage success;
- reset/delete paths are failure-aware;
- completed active save remains safe even if Legacy synchronization temporarily fails;
- UI reports `Legacy sync pending` rather than falsely claiming archive success.

Completed history must never be silently overwritten or corrupted.

---

# Performance architecture — current lock

## Initial shell

Initial local assets remain deliberately small:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI enforces:

- exactly one initial stylesheet;
- maximum seven initial JavaScript files;
- no eager gameplay package;
- startup local-byte ceiling.

## Lazy gameplay package

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

## Lazy secondary modules

- Legacy;
- analytics;
- Rivalry Statistics;
- Trophy Room;
- Rule Book;
- diagnostics;
- optional view styles.

## Runtime discipline

- one transfer timer interval maximum;
- no off-screen timer loop;
- one YouTube iframe maximum;
- no media iframe before explicit Play;
- no full showdown normalization on keypress/timer ticks;
- no localStorage write on every keypress;
- delayed League/Club callbacks must be operation/showdown identity-safe;
- avoid unnecessary DOM replacement.

---

# Release-cache architecture

`index.html` owns the authoritative deployment revision through:

`<meta name="app-asset-revision" ...>`

Current value: **`0.16.0-r3`**

Initial assets use this value. Dynamic gameplay/history assets derive the value from the shell. Diagnostics validate against it. CI derives its expected revision from it.

Do not reuse an asset revision after deployed local CSS/JS/data bytes change.

---

# v0.16.0-r3 Chromebook / desktop stabilization

This revision addresses a real responsive-layout defect reported on ChromeOS/Chromebook while preserving the mobile layout that was already working well.

## Root cause

The desktop Home grid previously used fixed `108px` grid rows. The soundtrack/trailer tile occupied one of those fixed rows but changed its own minimum height to `165px` when a media iframe loaded. CSS Grid therefore allowed the item to overflow its track and visually collide with the following menu row.

Mobile did not exhibit the same problem because its responsive breakpoint already used auto-sized rows.

## r3 layout correction

Desktop/laptop Home now uses content-sized tracks:

- first two rows contain Career/menu navigation;
- media lives in the third row below the core navigation;
- the third row grows naturally when YouTube media is loaded;
- media can no longer overlap the Career tiles merely because its iframe becomes taller.

The desktop media selector changed from a long horizontal overflow rail to a compact four-column selector grid, providing a cleaner Chromebook/laptop presentation.

For low-height desktop/laptop viewports (`min-width: 901px` and `max-height: 800px`):

- header height is reduced slightly;
- Home heading spacing is reduced;
- menu tile rows are more compact;
- media controls/selectors are slightly denser;
- footer/main vertical padding is reduced;
- main content remains scrollable rather than being forced to overlap.

At `900px` and below, the existing tablet/mobile auto-flow layout is retained. At `700px` and below, the established single-column mobile presentation remains intact.

This is a stabilization/polish fix, not a redesign of the product direction.

---

# Original roadmap alignment

Later implementation build numbers do not replace the Project Bible milestones.

| Original milestone | Intent | Current reality |
| --- | --- | --- |
| v0.1 | Project foundation | complete historically |
| v0.2 | Experience design | complete historically |
| v0.3 | FIFA-17-inspired UI direction | complete historically |
| v0.4 | Functional prototype | complete historically |
| v0.5 | League/data foundation | complete |
| v0.6 | League wheel | complete |
| v0.6.1 | Framework/navigation/storage | complete and hardened |
| v0.7 | Full showdown creation | functionally complete |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / feedback / UI / performance | substantially implemented, still open |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

The v0.10–v0.16 sequence represents implementation, correction, stabilization and optimization work performed while progressing from the functional v0.9 core toward the original v0.95 quality target.

**After v0.16 stabilization is accepted, development rejoins the original roadmap at v0.95, then moves directly to v1.0.**

Do not create an endless unrelated v0.17/v0.18 feature roadmap.

---

# Blueprint items intentionally superseded

These differences are not bugs:

- older four-independent-bonus scoring → superseded by grouped max-11 scoring;
- early Bible without Transfer Challenge → superseded by approved Transfer Challenge;
- separate `router.js` → superseded by current `screens.js` route authority;
- forced final jump directly into Legacy → superseded by automatic archive + Completed Showdown Home;
- old multi-file core CSS architecture → superseded by unified `css/app.css` for reliability/performance;
- later Trophy Room, Rule Book, generated visual identities and user-initiated menu media are established current features and must be preserved.

---

# Remaining original v0.95 blueprint-alignment gaps

These are finite. They are not invitations to add unrelated features.

## Gap A — Settings

The original screen plan includes Settings. Current source has no Settings screen.

v0.95 should implement a small Settings surface using existing architecture and existing safe data-reset logic where relevant.

Appropriate scope:

- application information;
- animation/reduced-motion preference where useful;
- safe data-management access;
- theme preference only if it does not create a second competing visual system.

Not appropriate:

- accounts;
- cloud settings;
- online multiplayer settings;
- post-v1.0 systems.

## Gap B — Main Menu Statistics alignment

The original blueprint exposed cumulative Statistics from Main Menu.

Current source already has:

- cumulative analytics engine;
- Trophy Room from Main Menu;
- Rivalry Statistics from active/completed Showdown Home.

v0.95 should resolve the navigation/presentation requirement by reusing these systems. Do not create a second analytics engine and do not remove Trophy Room.

## Gap C — pre-commit season review

The original Season Engine describes reviewing entered results/points before permanently finalizing a season.

Current implementation saves when `COMPLETE SEASON` is pressed and shows read-only Season Summary afterward.

During v0.95, inspect the actual browser experience. If no equivalent safety step exists, add a lightweight pre-commit review/confirmation before the irreversible season write.

Completed historical seasons remain read-only.

## Gap D — final polish/release regression

v0.95 is primarily a quality milestone:

- responsive consistency;
- Chromebook/laptop/mobile usability;
- clear feedback;
- coherent transitions;
- focus/accessibility usability;
- performance;
- complete persistence/navigation regression;
- no major visual or gameplay regression.

---

# Items that are NOT Version 1.0 gaps

Do not invent work for:

- backend;
- cloud backup;
- online multiplayer;
- QR joining;
- accounts;
- community features;
- official club badges;
- copied EA artwork/fonts;
- screenshot upload;
- match notes;
- new leagues;
- completed-season editing;
- public ranking systems.

---

# Automated validation

GitHub Actions is the exact-head machine-validation environment.

The local assistant runtime may be unable to clone GitHub because of network/DNS restrictions. Never claim a local repository `node --check` unless it actually ran.

The repository workflow currently validates:

- `node --check` across `js/` and `data/`;
- locked max-11 scoring cases;
- grouped bonuses;
- equal-nonzero draw behavior;
- 0-0 tiebreak behavior;
- canonical navigation state matrix;
- completed-showdown route restrictions;
- contextual Back parents;
- shell-owned cache revision coherence;
- one initial stylesheet;
- maximum seven initial scripts;
- no eager gameplay package;
- startup local-byte budget;
- required/duplicate HTML IDs;
- centralized Back authority;
- no `screenHistory` access outside `screens.js`;
- completed-showdown recovery UI;
- absence of obsolete prototype files.

Automated validation supplements real browser testing; it does not replace the owner's Chromebook/mobile regression.

---

# Current release gate

Before v0.95 starts, validate `v0.16.0-r3` in the browser.

Highest-priority visual checks now include:

- Chromebook Home at normal browser zoom;
- no overlap among Home tiles;
- Career tiles appear before media rail;
- media selector looks coherent and usable;
- Play expands the media row without covering another tile;
- Pause/Mute still work;
- mobile layout remains as clean as before;
- low-height laptop/Chromebook window scrolls naturally;
- New Showdown / League / Club / Dashboard / Transfer / Season screens remain unaffected.

Then complete the broader persistence/navigation regression in `NEXT_TASK.md`.

---

# What happens next

## Immediate

Finish owner validation of **v0.16.0-r3** and fix only regressions discovered in this stabilization gate.

## Then

Resume the original roadmap at:

### v0.95 — Polish / Blueprint Alignment Release Candidate

Finite scope:

1. Settings blueprint gap;
2. Main Menu Statistics alignment using existing analytics;
3. pre-final Season review/confirmation safety if still missing;
4. owner-discovered responsive/accessibility/visual/performance polish;
5. complete regression;
6. synchronize state/next-task/changelog/README.

## Then

### v1.0 — Complete Release Candidate / Final Release

v1.0 is a release-completion phase, not another feature-expansion phase.

Release gate:

- end-to-end rivalry works;
- multi-season progression works;
- save/resume works;
- league/club invariants hold;
- Transfer Challenge works each season;
- scoring is correct;
- final completion works;
- Legacy/history is accurate;
- statistics are coherent;
- destructive actions are safe;
- Back never strands the user;
- responsive layout is coherent on Chromebook/laptop/mobile;
- automated validation passes;
- owner browser regression passes;
- documentation matches the shipped implementation.

---

# Development philosophy — permanent continuation rule

**IMPLEMENTATION MODE**

- Project design is complete.
- Do not restart planning.
- Do not redesign working architecture to match obsolete filenames.
- Do not repeatedly reopen settled decisions.
- Inspect current source first.
- Preserve later owner-approved amendments.
- Preserve working stability/performance patches.
- Fix root causes rather than stacking patches.
- Add deterministic regression checks when practical.
- Test previously working behavior after every meaningful change.
- Update project-state documents when reality changes.
- Continue the active milestone.
- Ask the owner only when a genuinely new product decision is required.
- Keep the original v0.95 → v1.0 destination visible.
- Finish Version 1.0 before entertaining post-v1.0 expansion.
