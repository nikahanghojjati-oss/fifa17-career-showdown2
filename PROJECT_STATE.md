# PROJECT STATE — Career Mode Showdown

## Purpose

This document is the continuation authority for the current implementation.

The project is already designed. Do not restart planning, replace the architecture, reinterpret implementation revisions as a new roadmap, or discard working systems simply because older documentation described an earlier implementation.

Authority order when sources disagree:

1. current source code on `main`;
2. explicit later owner amendments recorded here;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. original Project Bible / architecture / release documentation;
6. older historical records and conversations.

The original Project Bible remains the long-term product blueprint wherever current source or later owner decisions have not intentionally superseded it.

Do not mark a roadmap item complete from a filename, comment, version label, or partial behavior. Verify the actual acceptance criteria against current behavior.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed asset revision:** `0.95.0-r3`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 1 final browser/visual acceptance of Club Reveal plus v0.95 visual-consistency repair  
**Next workstream after acceptance:** Settings blueprint alignment  
**Owner acceptance:** `v0.16.0-r3` accepted; v0.95 Workstream 1 not yet closed

`v0.95.0-r3` is a polish/cache revision inside the same milestone. It is not a new gameplay milestone and does not create a v0.96/v0.97 feature sequence.

---

# Product mission

Career Mode Showdown turns two separate FIFA 17 Career Mode saves into one persistent two-manager rivalry.

Target flow:

Main Menu  
→ Create Showdown  
→ League Selection  
→ Club Assignment / Reveal  
→ Rivalry Confirmation  
→ Showdown Home  
→ Transfer Challenge  
→ Season Results  
→ Season Summary  
→ Next Season / Final Winner  
→ Permanent Legacy / Statistics

The product should feel like a football-game companion rather than an administrative website: fast, obvious, immersive, persistent, coherent and reliable.

---

# Locked Version 1.0 scope

- Exactly two managers.
- One device / one browser.
- One active showdown at a time.
- Each manager plays a separate FIFA 17 Career Mode save.
- Both clubs come from the same selected league.
- League is selected once per showdown.
- Two different clubs are assigned once per showdown.
- Assigned clubs remain permanent for every season in that showdown.
- Club reuse across separate showdowns is allowed.
- Showdown length is 1, 3, 5 or 10 seasons.
- Current FIFA-17-era top-five European league pool remains Version 1.0 scope.
- Results are entered manually.
- Browser localStorage remains the Version 1.0 persistence layer.
- No accounts, backend, cloud synchronization, QR pairing or real-time two-device mode in Version 1.0.

Post-v1.0 concepts must not interrupt the current release path.

---

# Locked competition rules

## Scoring

Per manager per season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- Top Scorer and/or Top Assist: **+1 maximum for the pair**

**Maximum: 11 points per manager per season.**

Do not restore four independent bonus points or a maximum of 13.

## Season winner

1. Higher scoring total wins.
2. Equal non-zero totals are a draw.
3. Only when both totals are 0:
   - better league position wins;
   - if position is equal, more league points wins;
   - otherwise draw.

Do not add goal difference, goals scored or head-to-head without owner approval.

## Transfer Challenge

Each season includes:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is league or nationality;
- a correctly guessed signing must be released.

## Match-play rule

- Career Mode matches are normally simulated.
- Champions League final may be played or simulated.
- Main domestic cup final may be played or simulated.

---

# Current implemented systems

Preserve all of the following:

- lightweight application bootstrap;
- Main Menu / Continue Career / New Showdown;
- showdown name and manager entry;
- 1 / 3 / 5 / 10 season selection;
- League Wheel and persisted league lock;
- same-league two-club random assignment;
- different-club validation;
- atomic club save/rollback;
- permanent no-reroll club lock;
- staged Club Reveal and final Rivalry Confirmation;
- Showdown Home;
- per-season Transfer Challenge;
- persisted transfer deadline and draft persistence;
- guess evaluation / release verdicts;
- Season Results and automatic scoring;
- Season Summary and multi-season progression;
- final completion and Completed Showdown Home;
- Legacy archive/history;
- Rivalry Statistics and cumulative analytics;
- Trophy Room;
- Rule Book;
- safe active-showdown/history/reset deletion behavior;
- centralized smart Back navigation;
- release-cache coherence;
- runtime diagnostics;
- reduced-motion support;
- responsive Chromebook/laptop/mobile layouts;
- generated club identities instead of official badges;
- user-initiated lazy soundtrack/trailer embeds.

---

# v0.95 Workstream 1 — Club Reveal / Rivalry Confirmation

The original v0.7 specification required more than random club selection. It required a staged presentation and explicit rivalry confirmation.

Current sequence:

**Selected League Confirmed  
→ Reveal Begins  
→ Manager 1 Club Revealed  
→ Manager 2 Club Revealed  
→ Final VS Rivalry Presentation  
→ User Confirms Rivalry  
→ Showdown Home**

## Assignment transaction — locked

When Open Showdown Pack is pressed:

1. one valid pair is selected from the already locked league;
2. the pair is placed in memory;
3. status becomes `Clubs Assigned`;
4. pair/status are saved immediately;
5. if save fails, previous club/status state is restored;
6. only after successful persistence does theatrical reveal begin.

Animation phases never write to localStorage.

## Confirmation checkpoint — locked

`Clubs Assigned` means:

> a valid permanent club pair exists, but the rivalry has not yet been explicitly confirmed.

While pending:

- Club Assignment is canonical;
- League Wheel is invalid;
- Showdown Home is invalid;
- Transfer Challenge is invalid;
- pair cannot reroll;
- refresh/Continue restores the same pair at final confirmation.

Only successful explicit confirmation changes status to `Ready` and opens Showdown Home. Failed confirmation persistence rolls status back and leaves the user at confirmation.

## Reveal safety — locked

Reveal timers are finite and guarded by:

- reveal operation identity;
- showdown identity;
- selected-league identity.

Leaving/resetting/replacing state invalidates stale callbacks.

Reduced motion changes presentation only. Assignment, persistence and explicit confirmation remain identical.

## r2 repair retained

`0.95.0-r2` repaired the first reveal implementation after owner testing found:

- a false startup integrity warning caused by diagnostics still expecting runtime `0.16.0`;
- misaligned/skewed Club Reveal cards on Chromebook;
- an unsatisfactory sweeping reveal effect.

Current code therefore retains:

- diagnostics runtime version derived from shell revision;
- equal-width/equal-height Club Reveal geometry;
- no angled reveal `clip-path` in the active runtime presentation;
- a low-height Chromebook reveal breakpoint;
- finite shorter reveal staging;
- no continuous reveal animation.

Do not reintroduce the r1 geometry or hard-coded diagnostic runtime version.

---

# v0.95.0-r3 — Visual Consistency / Contrast Polish

Owner inspection identified poor Rule Book font distinction and requested a wider repository visual audit before moving to the next workstream.

The audit found one cross-screen root cause:

- `css/app.css` had evolved to force several optional-screen containers into the current light FIFA-style panel system;
- older lazy stylesheets (`rulebook.css`, `analytics.css`, `legacy.css`) were still authored for a dark-card era;
- child text colors from those old styles therefore survived on top of newer light containers;
- this could produce white/pale-blue text on light panels and inconsistent hierarchy.

The fix is a coherent optional-screen visual normalization rather than isolated color overrides.

## Rule Book

`css/rulebook.css` now uses:

- dark hero with yellow left accent;
- high-contrast cyan eyebrow and white title/body in the hero;
- light rule cards with dark section headings/body copy;
- distinct blue/cyan/yellow/neutral section accents;
- dark readable scoring labels;
- blue score values;
- yellow maximum-11 callout with dark text;
- tighter low-height Chromebook layout;
- mobile single-column behavior.

The result should make rules easier to scan by section rather than presenting every line in nearly the same pale color.

## Statistics / Trophy Room

`css/analytics.css` now aligns with the current visual system:

- summary/stat cards are light with dark text and blue/cyan accents;
- the rivalry hero intentionally remains dark;
- comparison tables and season progression rows are light/readable;
- career standings are light and horizontally safe when necessary;
- manager cabinets use dark text on light panels;
- trophy counts and record cards use readable current-theme colors;
- long manager/club/record text is constrained with `min-width:0` / wrapping;
- Chromebook low-height and mobile density are explicitly handled.

## Legacy

`css/legacy.css` now uses:

- light high-contrast summary cards;
- intentional dark historical showdown cards;
- readable history details and season rows;
- light Data Management panel with dark heading/body copy;
- current-theme compact/danger buttons;
- long-name wrapping and responsive safeguards.

## Visual architecture lesson — permanent

Optional styles are lazy-loaded before the main `app.css`, so `app.css` remains the final cascade authority.

Future visual work must obey this contract:

- optional CSS may add module-specific structure/presentation;
- it must not assume a dark container when `app.css` intentionally normalizes that container to a light panel;
- child text/background colors must be checked together;
- optional modules must remain lazy and must not be moved into startup merely to solve styling;
- contrast fixes should be made at the component system level rather than stacking arbitrary `!important` patches.

CI now checks balanced braces for `app.css`, `analytics.css`, `legacy.css`, and `rulebook.css` rather than validating only the core stylesheet.

---

# Navigation architecture — current lock

`js/screens.js` is the only route/history authority.

Preserve:

- centralized ordinary Back interception;
- advisory/bounded route history;
- state-aware destination validation;
- critical write flush before navigation;
- failed critical flush blocking navigation;
- saved clubs permanently invalidating League Wheel;
- `Clubs Assigned` preserving Club Assignment only for final confirmation;
- confirmed clubs invalidating Club Assignment;
- completed Transfer Challenge invalidating obsolete transfer state;
- completed showdown invalidating setup/transfer/results-entry routes;
- Completed Showdown Home as completed canonical destination;
- contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

---

# Persistence architecture — current lock

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Preserve:

- immediate critical state saves;
- debounced/deduplicated transfer drafts;
- lifecycle/route flushes;
- rollback on failed critical transitions where practical;
- Legacy revision caching;
- idempotent completed-showdown archiving;
- failure-aware destructive actions;
- safe active completed save if Legacy synchronization fails;
- accurate `Legacy sync pending` UI.

No storage schema migration was required by the v0.95 reveal or r3 visual work.

---

# Performance architecture — current lock

## Initial shell

Initial local assets remain exactly one stylesheet plus seven scripts:

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
- 145,000-byte initial local-asset ceiling.

The r3 Rule Book/Analytics/Legacy polish stays lazy and therefore does not increase initial startup asset count.

## Lazy gameplay package

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

## Lazy optional/history package

- `css/legacy.css` + `js/legacy.js`
- `css/analytics.css` + analytics/statistics/Trophy Room scripts
- `css/rulebook.css` + `js/ruleBook.js`
- `js/diagnostics.js`

## Runtime discipline

- one transfer timer interval maximum;
- no hidden/off-screen transfer timer loop;
- one YouTube iframe maximum;
- no iframe before explicit Play;
- no full-showdown normalization on keypress/timer ticks;
- no localStorage write per keypress;
- delayed League/Club operations identity-safe;
- reveal stages finite and cancellable;
- no reveal-phase persistence churn;
- avoid unnecessary DOM replacement.

---

# Release-cache architecture

`index.html` owns deployment identity through:

`<meta name="app-asset-revision" content="0.95.0-r3">`

Initial and dynamically loaded local assets derive from this identity.

Current asset revision: **`0.95.0-r3`**.

Never reuse a revision after deployed CSS/JS/data bytes change.

---

# Automated validation

GitHub Actions remains the exact-head machine-validation authority.

The suite protects:

- JavaScript syntax across `js/` and `data/`;
- max-11 scoring;
- grouped performance/award bonuses;
- equal-nonzero draws;
- 0-0 league-position/league-points tiebreak;
- canonical route matrix;
- `Clubs Assigned` confirmation recovery;
- no-reroll setup-route lock;
- completed-transfer/completed-showdown restrictions;
- contextual Back parents;
- one shell-owned cache revision;
- one initial stylesheet;
- maximum seven initial scripts;
- no eager gameplay package;
- initial local-byte budget;
- required/duplicate HTML IDs;
- staged reveal state/timing/reduced-motion contracts;
- centralized Back authority;
- no route-history manipulation outside `screens.js`;
- completed-showdown recovery UI;
- Chromebook Home layout guards;
- balanced braces in all four visual stylesheets;
- absence of obsolete prototype files.

Automated checks cannot judge visual quality. Owner Chromebook/mobile browser acceptance remains required.

---

# Original roadmap alignment

| Original milestone | Intent | Current status |
| --- | --- | --- |
| v0.1 | Project foundation | complete historically |
| v0.2 | Experience design | complete historically |
| v0.3 | FIFA-17-inspired UI direction | complete historically |
| v0.4 | Functional prototype | complete historically |
| v0.5 | Data foundation | complete |
| v0.6 | League Wheel | complete |
| v0.6.1 | Framework/navigation/storage | complete and hardened |
| v0.7 | Showdown creation + FUT-style reveal + confirmation | mechanics complete; reveal/confirmation implemented, browser acceptance still open |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / experience / blueprint alignment | **active milestone** |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

Historical v0.10–v0.16 builds were implementation/stabilization work. They did not replace this roadmap.

---

# Blueprint differences intentionally superseded

Do not revert:

- old four-independent-bonus interpretation → grouped max-11 scoring;
- early design without Transfer Challenge → approved Transfer Challenge;
- separate `router.js` concept → current `screens.js` route authority;
- forced final-season jump directly to Legacy → automatic archive + Completed Showdown Home;
- old multi-file core CSS → unified initial `css/app.css` plus lazy module styles;
- later Trophy Room, Rule Book, generated club identities and user-initiated menu media are established features.

---

# Remaining v0.95 work

## Current gate — Workstream 1 browser acceptance

Test `0.95.0-r3` before advancing.

Required acceptance areas:

- no startup integrity warning;
- Club Reveal r2 geometry/motion remains clean on Chromebook;
- same-pair refresh/Continue recovery remains correct;
- no reroll path;
- Rule Book hierarchy/contrast is clearly improved;
- Statistics/Trophy Room no longer contain pale/white text on light cards;
- Legacy data-management/history presentation remains readable;
- optional screens remain clean on Chromebook and mobile;
- no core gameplay/navigation/storage regression.

Detailed checks are in `NEXT_TASK.md`.

## Workstream 2 — Settings blueprint alignment

After Workstream 1 acceptance, implement the small Settings surface from the original screen plan using existing architecture. No accounts/cloud/online systems.

## Workstream 3 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a second analytics engine.

## Workstream 4 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible completion if an equivalent safeguard is still absent. Completed historical seasons remain read-only.

## Workstream 5 — final v0.95 polish/regression

- responsive consistency;
- accessibility/focus usability;
- feedback/transitions;
- performance;
- full persistence/navigation/gameplay regression;
- documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Not Version 1.0 gaps

Do not invent work for:

- backend/cloud/accounts;
- real-time multiplayer/QR pairing;
- community/public rankings;
- official club badges;
- copied EA artwork/fonts;
- screenshot upload/match notes;
- new leagues;
- completed-season editing.

---

# Continuation rule

Implementation mode remains active:

**inspect current source → identify exact unfinished requirement or regression → implement root-cause fix → preserve locked architecture/rules → machine-check exact head → owner-test visual/browser behavior → update project state → advance only when the current acceptance gate is satisfied.**
