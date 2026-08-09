# PROJECT STATE — Career Mode Showdown

## Purpose

This document is the continuation authority for the current implementation.

The project is already designed. Do not restart planning, replace the architecture, reinterpret implementation revisions as a new roadmap, or discard working systems simply because older documentation described an earlier implementation.

Authority order when sources disagree:

1. current source code on `main`;
2. explicit later owner amendments recorded here and in `ROADMAP_AMENDMENTS.md`;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. original Project Bible / architecture / release documentation;
7. older historical records and conversations.

Current source remains the implementation authority. A roadmap requirement is not implemented merely because it is documented.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed runtime asset revision:** `0.95.0-r3`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 1A — r3 browser acceptance  
**Next workstream after acceptance:** Workstream 1B — FIFA 17 typography + original club identity + two-pack reveal  
**Following core workstream:** Workstream 2 — split Transfer Guess/Signing phases + complete FIFA 17 transfer metadata/selectors  
**Owner acceptance:** `v0.16.0-r3` accepted; current v0.95 Workstream 1A not yet closed

The documentation-only roadmap commits after r3 do not change the deployed runtime. No CSS/JS/gameplay/state code was changed by the roadmap amendment itself.

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
- The Showdown club-assignment pool remains the current FIFA-17-era top-five European leagues.
- Results are entered manually.
- Browser localStorage remains the Version 1.0 persistence layer.
- No accounts, backend, cloud synchronization, QR pairing or real-time two-device mode in Version 1.0.

Important distinction introduced by the owner amendment:

> The future Transfer Challenge former-league dataset may contain the full FIFA 17 league universe without expanding the Showdown League Wheel beyond the locked top-five pool.

Post-v1.0 two-device concepts may build on v0.95 state/UI boundaries but must not interrupt the one-device v1.0 release unless the owner explicitly changes scope.

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

## Transfer Challenge — gameplay rules remain locked

Each season includes:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is league or nationality;
- a correctly guessed signing must be released.

The owner-approved split Guess/Signing screens change **entry sequence and UI/state separation**, not these rules.

Do not add a separate guess timer unless the owner explicitly requests a new timing rule.

## Match-play rule

- Career Mode matches are normally simulated.
- Champions League final may be played or simulated.
- Main domestic cup final may be played or simulated.

---

# Current implemented systems

Implemented and to be preserved:

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
- current combined post-window signing/guess recording UI;
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
- current generated palette/initial club identity placeholder;
- user-initiated lazy soundtrack/trailer embeds.

Not yet implemented merely because they are now approved:

- new FIFA-17-like safely licensed typography hierarchy;
- original custom/procedural crest system for every current Showdown club;
- two-pack sequential suspense reveal;
- separate Guess Entry and Signing Entry transfer phases/screens;
- complete FIFA 17 Transfer Challenge league metadata dataset;
- complete FIFA 17 player-nationality dataset;
- searchable controlled league/nationality selectors;
- post-v1.0 two-device/private-manager flow.

---

# Club assignment integrity — permanent lock

The current Club Assignment transaction is correct and every future visual upgrade must be built around it.

When Open Showdown Pack is pressed:

1. one valid pair is selected from the already locked league;
2. both clubs belong to that league;
3. clubs are different;
4. pair is placed in memory;
5. status becomes `Clubs Assigned`;
6. pair/status are saved immediately;
7. if save fails, previous club/status state is restored;
8. only after successful persistence does theatrical reveal begin.

Animation phases never write to localStorage.

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

Reveal timers are finite and guarded by operation identity, showdown identity and selected-league identity. Leaving/resetting/replacing state invalidates stale callbacks.

Reduced motion changes presentation only. Assignment, persistence and confirmation rules remain identical.

---

# v0.95.0-r2 retained Club Reveal repair

Owner browser testing of the first reveal implementation found:

- stale diagnostics expecting `0.16.0` and reporting valid v0.95 runtime as corrupt;
- misaligned/skewed Club Reveal cards on Chromebook;
- an unsatisfactory sweeping reveal effect.

Current code therefore retains:

- diagnostics expected runtime derived from shell revision;
- equal-width/equal-height Club Reveal geometry;
- no active angled reveal `clip-path`;
- low-height Chromebook reveal breakpoint;
- finite short reveal staging;
- no rejected sweeping white bar;
- no continuous reveal animation.

Workstream 1B's pack-opening animation must preserve these fixes.

---

# v0.95.0-r3 visual consistency / contrast polish

Owner inspection identified weak Rule Book font distinction and requested a wider visual audit.

Root cause found:

- `css/app.css` had evolved to normalize several optional-screen containers into the current light panel system;
- older lazy `rulebook.css`, `analytics.css`, and `legacy.css` child colors still assumed dark cards;
- pale/white child text could therefore survive on light panels;
- optional screens looked visually split from the newer Home/gameplay shell.

r3 normalized those lazy visual modules while preserving lazy loading.

## Rule Book r3

- dark hero with yellow accent;
- cyan/white hero hierarchy;
- light rule cards;
- dark headings/body copy;
- distinct section accents;
- readable scoring rows;
- blue scoring values;
- yellow max-11 callout;
- Chromebook/mobile density safeguards.

## Statistics / Trophy Room r3

- light stat/record cards with dark text;
- intentionally dark rivalry hero retained;
- light comparison/progression tables;
- readable manager cabinets/trophy counts;
- horizontally safe standings;
- long-name wrapping safeguards.

## Legacy r3

- light summary cards;
- intentionally dark historical showdown cards;
- readable history details;
- light Data Management panel with dark copy;
- current-theme compact/danger controls;
- wrapping/responsive safeguards.

Permanent visual lesson:

- optional CSS is module-specific but must remain compatible with the final `app.css` cascade;
- text color and background must be checked together;
- do not solve optional styling by moving everything into startup;
- prefer component-level fixes over arbitrary `!important` accumulation.

---

# Owner-approved roadmap amendment — August 2026

Detailed acceptance intent is also recorded in `ROADMAP_AMENDMENTS.md` and `NEXT_TASK.md`.

These amendments are now part of v0.95 planning authority.

## A. FIFA 17 typography hierarchy

The interface, particularly Home/Main Menu, should move materially closer to FIFA 17 through typography and text styling.

Direction:

- do not use proprietary EA/FIFA font files without clear permission;
- evaluate safely licensed open-source condensed/geometric alternatives such as Barlow Condensed or comparable OFL choices;
- do not automatically apply the display face to every paragraph/form control;
- use FIFA-like display typography where it improves menu tiles, titles, scores, major values, headings and compact metadata;
- tune weight, tracking, size, casing and line-height together;
- preserve readable body/forms;
- verify contrast and wrapping after font changes;
- font loading must fail gracefully and must not create blank text or significant layout shift;
- Chromebook/mobile remain first-class.

## B. Original per-club custom crest identity

The existing generated palette + initials treatment is now an interim placeholder.

Workstream 1B should provide every club in the current top-five Showdown pool with a deterministic original crest/emblem that includes more than two colors plus initials.

Preferred implementation:

- original procedural/custom crest system;
- multiple shield/roundel/diamond shapes;
- stripe/half/chevron/quadrant patterns;
- original abstract motifs;
- club-specific palettes;
- optional monogram only as supporting detail;
- same crest across all club surfaces;
- lightweight CSS/inline-SVG/data approach preferred.

Official club badges are not the default solution. Public visibility of an official crest does not automatically remove copyright/trademark concerns.

Acceptance: two assigned clubs should be visually distinguishable before reading their names.

## C. Two-pack suspense reveal

Workstream 1B should replace the current sealed-card presentation with two closed Showdown packs/parcels that open sequentially.

Target presentation:

**pair already saved  
→ Pack 1 + Pack 2 closed  
→ Pack 1 opens / Manager 1 revealed  
→ short suspense beat  
→ Pack 2 opens / Manager 2 revealed  
→ VS presentation  
→ explicit rivalry confirmation**

Requirements:

- a few seconds of deliberate suspense;
- finite DOM/CSS animation;
- no canvas/WebGL/video requirement;
- no idle animation loop;
- no rejected white sweep;
- no card resize/skew regression;
- same persistence/no-reroll transaction;
- reduced-motion fast reveal;
- stale callbacks remain cancellable/identity-safe.

## D. Transfer Challenge Guess/Signing separation

This moves ahead of Settings because it changes a core gameplay workflow and establishes the right state boundaries before future two-device work.

Current source already stores `signings` and `guesses` separately, but records both on the same post-window UI.

Target v0.95 flow:

**15-minute transfer window  
→ Opponent Guess Entry phase/screen  
→ lock/persist guesses  
→ Signing Entry phase/screen  
→ lock/persist signings  
→ evaluate release matches  
→ Transfer Results  
→ Season Results**

Guesses come first so future private/two-device entry does not require another transfer-model redesign.

Version 1.0 itself remains one-device/browser.

Backward compatibility requirements:

- existing current saves must survive;
- old `recording` challenges require a safe compatibility/migration path;
- prefer an explicit transfer sub-phase over duplicate challenge records;
- phase transitions are critical saves;
- failed save blocks/rolls back transition;
- draft persistence remains debounced/deduplicated;
- canonical routing/Back/Continue must understand the active transfer sub-phase.

## E. Complete FIFA 17 Transfer Challenge league data

The full league dataset is for previous-league metadata and guesses only.

Do not expand the Showdown League Wheel.

Research requirement before release:

- cross-check the historical FIFA 17 competition list against at least two sources;
- include all actual domestic league competitions represented in FIFA 17, including lower divisions where present;
- canonical ID;
- FIFA-17-era display name;
- country;
- tier/division where applicable;
- grouping metadata;
- deliberate `Rest of World / Other` fallback where required.

Historical references inspected during roadmap work show a much broader competition set than the current five-league Showdown pool.

## F. Complete FIFA 17 player-nationality data

Do not use only playable men's national teams.

FIFA 17 includes players from many nationalities without corresponding selectable national teams.

Implementation must use a FIFA 17 player/nation database as the primary source and a second historical source as cross-check.

Canonical values must normalize naming/accent variants reliably for gameplay evaluation.

## G. Smart responsive selectors

Signing Entry:

- Player Name — text;
- Previous League — controlled searchable selector;
- Nationality — controlled searchable selector.

Guess Entry:

- Guess Type — League or Nationality;
- Guess Value — controlled selector from the chosen canonical dataset.

UX requirements:

- responsive on phone and Chromebook;
- fast type-to-filter;
- large touch targets;
- keyboard navigation;
- visible focus;
- screen-reader/ARIA support;
- constrained popover/list that cannot overflow viewport;
- country grouping for leagues where useful;
- canonical stored value separate from display label;
- graceful fallback;
- no heavy component framework.

Guess evaluation should use canonical IDs/normalized values, not arbitrary strings.

---

# Navigation architecture — current lock

`js/screens.js` remains the sole route/history authority.

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

Workstream 2 may add transfer sub-phase awareness, but it must extend this centralized authority rather than create a second router.

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

Workstream 2 may require a small transfer-state/schema compatibility change. If so, it must preserve old saves and be explicitly validated.

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

Future full Transfer Challenge option data should remain out of startup unless measured evidence justifies otherwise. A dedicated lazy transfer-options data file is acceptable and preferable to bloating the initial shell.

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
- avoid unnecessary DOM replacement;
- no heavy UI framework for selectors;
- font/crest enhancements must remain lightweight.

---

# Release-cache architecture

`index.html` owns deployed runtime identity through:

`<meta name="app-asset-revision" content="0.95.0-r3">`

Current deployed runtime revision remains **`0.95.0-r3`** until runtime CSS/JS/data changes are implemented.

Documentation-only roadmap changes do not require pretending a new runtime build exists.

Never reuse an asset revision after deployed CSS/JS/data bytes change.

---

# Automated validation — current and future

GitHub Actions is the exact-head machine-validation authority.

Current suite protects:

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
- shell-owned cache revision;
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
- balanced braces in current visual stylesheets;
- absence of obsolete prototype files.

Workstream 1B should extend deterministic protection for:

- crest identity determinism/coverage;
- reveal pack stage order and finite timing;
- assignment persistence-before-reveal;
- typography fallback/loading contract where practical.

Workstream 2 should extend protection for:

- old transfer-state compatibility;
- Guess → Signing order;
- critical phase persistence/rollback;
- canonical route recovery per transfer sub-phase;
- complete/canonical league and nationality data;
- guess-type/value coupling;
- normalized/canonical evaluation;
- selector fallback and responsive overflow guards where deterministic testing is practical.

Automated checks do not prove visual quality. Owner Chromebook/mobile browser acceptance remains required.

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
| v0.7 | Showdown creation + reveal + confirmation | mechanics implemented; final experiential acceptance remains in v0.95 Workstream 1 |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / experience / blueprint alignment | **active milestone with owner-approved inserted workstreams** |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

Historical v0.10–v0.16 builds were implementation/stabilization work. They did not replace this roadmap.

---

# Revised finite v0.95 work order

## Workstream 1A — current r3 browser acceptance

Test the deployed `0.95.0-r3` build before modifying runtime again.

Required acceptance areas:

- no startup integrity warning;
- Club Reveal r2 equal geometry/motion remains clean on Chromebook;
- same-pair refresh/Continue recovery remains correct;
- no reroll path;
- Rule Book hierarchy/contrast is improved;
- Statistics/Trophy Room no longer contain pale/white text on light cards;
- Legacy data-management/history presentation remains readable;
- optional screens remain clean on Chromebook/mobile;
- no gameplay/navigation/storage regression.

Detailed checks are in `NEXT_TASK.md`.

## Workstream 1B — FIFA 17 presentation + Club Reveal identity polish

After Workstream 1A acceptance:

1. improve FIFA-17-like copyright-safe typography hierarchy, especially Home/Main Menu;
2. replace generic club initials with original deterministic per-club crest/emblem treatment;
3. create two-pack sequential suspense reveal;
4. preserve persistence/no-reroll/reduced-motion/Chromebook geometry;
5. extend deterministic validation;
6. deploy a new cache revision;
7. owner browser acceptance.

## Workstream 2 — Transfer Challenge phase + canonical data foundation

Before Settings:

1. separate Guess Entry and Signing Entry;
2. guesses come first;
3. preserve the 15-minute transfer rule and current max-3 / 3-guesses / release rules;
4. add complete FIFA 17 former-league metadata dataset separate from the Showdown wheel;
5. add complete FIFA 17 player-nationality dataset;
6. build responsive searchable controlled selectors;
7. canonicalize guess matching;
8. preserve/migrate existing saves;
9. extend routing/persistence/data tests;
10. owner browser acceptance.

## Workstream 3 — Settings blueprint alignment

Implement the small Settings surface from the original screen plan using existing architecture.

Appropriate scope:

- application information;
- animation/reduced-motion preference if useful;
- existing safe data-management access.

No accounts/cloud/online systems.

## Workstream 4 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a second analytics engine.

## Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible completion if an equivalent safeguard is still absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 polish/regression

- cross-screen typography/contrast consistency;
- responsive consistency;
- accessibility/focus usability;
- feedback/transitions;
- performance/startup discipline;
- full persistence/navigation/gameplay regression;
- documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Post-v1.0 direction

Two-device/private-manager play is a later architecture.

Workstream 2 intentionally creates the Transfer Challenge phase boundaries needed for that future mode, but Version 1.0 remains local/one-device.

Do not invent v1.0 work for:

- backend/cloud/accounts;
- real-time multiplayer/QR pairing;
- community/public rankings;
- screenshot upload/match notes;
- completed-season editing.

---

# Blueprint differences intentionally superseded

Do not revert:

- old four-independent-bonus interpretation → grouped max-11 scoring;
- early design without Transfer Challenge → approved Transfer Challenge;
- combined Guess/Signing recording UI → approved to be replaced in Workstream 2 by Guess-first then Signing phase separation;
- separate `router.js` concept → current `screens.js` route authority;
- forced final-season jump directly to Legacy → automatic archive + Completed Showdown Home;
- old multi-file core CSS → unified initial `css/app.css` plus lazy module styles;
- generic palette/initial club identity → retained only until Workstream 1B custom crest replacement;
- proprietary/copy-exact FIFA presentation → copyright-safe inspired presentation remains mandatory.

---

# Continuation rule

Implementation mode remains active:

**inspect current source → identify the exact active workstream → implement the root requirement without unrelated redesign → preserve locked gameplay/state/persistence/performance contracts → machine-check exact head → owner-test visual/browser behavior → synchronize project state → advance once the current gate passes.**

Avoid planning loops, duplicate feature systems and repeatedly reopening already accepted work. The revised order in this file and `NEXT_TASK.md` is now the roadmap to follow.
