# PROJECT STATE — Career Mode Showdown

## Purpose

This document is the continuation authority for the current implementation. The project is already designed. Do not restart planning, replace established architecture, reinterpret implementation revisions as a replacement roadmap, or discard working systems because older documentation described an earlier implementation.

Authority order when sources disagree:

1. current source code on `main`;
2. explicit later owner amendments recorded here and in `ROADMAP_AMENDMENTS.md`;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. original Project Bible / architecture / release documentation;
7. older historical records and conversations.

Current source is the implementation authority. A roadmap item is not complete because a filename, comment, label, or plan says it exists; verify actual acceptance criteria against behavior.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r4`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 1B — FIFA-era presentation / club identity / two-pack reveal  
**Source status:** implemented and machine-validated  
**Owner/browser status:** acceptance pending  
**Next workstream after acceptance:** Workstream 2 — Transfer Guess/Signing phase split + canonical FIFA 17 transfer metadata/selectors

`0.95.0-r4` is a v0.95 presentation/cache revision, not a new gameplay milestone or a replacement roadmap.

---

# Product mission

Career Mode Showdown turns two separate FIFA 17 Career Mode saves into one persistent two-manager rivalry.

Target flow:

Main Menu  
→ Create Showdown  
→ League Selection  
→ Club Assignment / two-pack reveal  
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

Important scope distinction:

> Workstream 2 may use the full historical FIFA 17 league/nationality universe for Transfer Challenge metadata without expanding the Showdown League Wheel beyond the locked five-league pool.

Future two-device/private-manager play may build on the v0.95 Transfer phase boundaries, but it remains post-v1.0 unless the owner explicitly changes scope.

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

Gameplay rules remain:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is league or nationality;
- a correctly guessed signing must be released.

Workstream 2 changes entry order/state separation, not these competition rules. Do not invent a second guess timer unless explicitly requested.

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
- staged two-pack Club Reveal and final Rivalry Confirmation;
- original deterministic procedural crest identity for all 98 current Showdown clubs;
- selective FIFA-17-era-inspired display typography using Barlow Condensed with system fallbacks;
- Showdown Home;
- per-season Transfer Challenge;
- persisted transfer deadline and debounced draft persistence;
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
- user-initiated lazy soundtrack/trailer embeds.

Approved but **not yet implemented**:

- separate Guess Entry and Signing Entry Transfer phases/screens;
- complete FIFA 17 Transfer Challenge former-league dataset;
- complete FIFA 17 player-nationality dataset;
- searchable controlled league/nationality selectors;
- Settings blueprint surface;
- Main Menu cumulative Statistics alignment;
- Season pre-commit review/confirmation;
- post-v1.0 two-device/private-manager flow.

---

# Workstream 1B — implemented source contract

## A. Typography / FIFA-era hierarchy

`0.95.0-r4` introduces a selectively applied display typography system rather than replacing every font.

- `Barlow Condensed` is requested externally for display roles with `display=swap`.
- System/local condensed fallbacks remain in the CSS stack so text is immediately visible if the font service is slow or unavailable.
- No font binary is stored in the repository.
- The condensed display face is emphasized for Home tiles, major headings, navigation, scores, wheel labels, reveal presentation and compact metadata.
- Body copy, forms and long explanatory text keep the readable UI stack where appropriate.
- Font size, weight, tracking, line height and casing were adjusted together rather than changing only `font-family`.
- Main Menu primary/supporting tile hierarchy remains responsive and retains the accepted Chromebook media placement.

Third-party/source details are recorded in `THIRD_PARTY_NOTICES.md`.

## B. Original club crest identity system

The old generic two-color/initial block is no longer the current identity system.

`js/visualIdentity.js` now provides:

- explicit club-associated palette data for all 98 clubs in the locked five-league Showdown pool;
- deterministic original procedural SVG crests;
- five original base crest geometries;
- six original pattern families;
- seven original abstract motif families;
- club monogram as a supporting detail rather than the whole badge;
- deterministic cache by club name;
- the same crest identity across Club Reveal, rivalry confirmation, Showdown Home, Transfer Challenge, Season screens and summary surfaces where club identity is rendered.

Official club badge images/vector paths are not used by this identity engine. The goal is differentiated fan-project identity, not a replica of protected official marks.

Automated validation currently confirms:

- locked five-league pool contains 98 unique club names;
- all 98 have explicit palettes;
- all 98 produce distinct deterministic SVG crest data;
- crest engine contains no external `<image>` embedding or official `assets/logos` fallback.

## C. Two-pack sequential reveal

The authoritative presentation now lives in `css/app.css`; `clubAssignment.js` no longer injects a second runtime stylesheet.

Current presentation:

**pair persisted  
→ two sealed Showdown packs visible  
→ Pack 01 opens / Manager 1 club revealed  
→ suspense beat  
→ Pack 02 opens / Manager 2 club revealed  
→ VS impact  
→ rivalry confirmation**

Current finite timing contract:

- Manager 1 reveal: about 650 ms;
- Manager 2 reveal: about 1750 ms;
- VS: about 2850 ms;
- confirmation: about 3300 ms.

No idle reveal loop, canvas, WebGL or reveal video is used. Reduced-motion users receive the same assignment/confirmation information without theatrical delay.

## D. Club assignment transaction — permanent lock

Presentation must never weaken the correct transaction:

1. choose one valid same-league/different-club pair;
2. place pair in memory;
3. set status to `Clubs Assigned`;
4. save pair/status immediately;
5. roll back if that save fails;
6. only then begin presentation;
7. reveal stages make no persistence writes;
8. explicit confirmation changes status to `Ready` only after successful save;
9. no reroll path exists after assignment.

`Clubs Assigned` remains the persisted confirmation checkpoint. Refresh/Continue must restore the same pair at final confirmation, never generate a new pair.

Reveal timers remain operation/showdown/league identity guarded and cancellable.

---

# Retained stabilization lessons

## r2 Club Reveal / diagnostics repair

Do not reintroduce:

- hard-coded old runtime version expectations in diagnostics;
- skewed/unequal Chromebook reveal geometry;
- rejected sweeping white-bar effect;
- continuous reveal animation.

Diagnostics derives expected runtime from the shell-owned revision. Pack geometry remains equal and responsive.

## r3 optional-screen visual consistency

Rule Book, Statistics/Trophy Room and Legacy were normalized to the current light/dark component system after old dark-theme child colors created poor contrast on newer light panels.

Preserve:

- Rule Book dark hero + readable light cards;
- Statistics/Trophy light data cards and intentional dark rivalry hero;
- Legacy readable light summaries/data management and intentional dark history cards;
- long-name wrapping;
- Chromebook/mobile density rules;
- lazy optional styles rather than moving optional modules into startup.

---

# Navigation architecture — current lock

`js/screens.js` remains the sole route/history authority.

Preserve:

- centralized ordinary Back interception;
- advisory/bounded history;
- state-aware route validation;
- critical write flush before navigation;
- failed critical flush blocking navigation;
- locked clubs invalidating League Wheel;
- `Clubs Assigned` keeping Club Assignment canonical until explicit confirmation;
- confirmed clubs invalidating Club Assignment;
- completed Transfer Challenge invalidating obsolete transfer state;
- completed showdown invalidating setup/transfer/results-entry routes;
- Completed Showdown Home as completed canonical destination;
- contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

Workstream 2 may add Transfer sub-phase awareness, but it must extend this router rather than create a second route system.

---

# Persistence architecture — current lock

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Preserve:

- immediate critical state saves;
- debounced/deduplicated Transfer drafts;
- lifecycle/route flushes;
- rollback on failed critical transitions where practical;
- Legacy revision caching;
- idempotent completed-showdown archiving;
- failure-aware destructive actions;
- safe active completed save if Legacy synchronization fails;
- accurate `Legacy sync pending` UI.

Workstream 1B required no storage schema migration.

Workstream 2 may require a small Transfer sub-phase/schema compatibility addition. Existing saves must remain valid and require deterministic regression coverage.

---

# Performance architecture — current lock

## Initial local shell

The local initial asset contract remains:

- exactly one local stylesheet: `css/app.css`;
- maximum seven initial local JavaScript files;
- no eager gameplay package;
- local initial CSS/JS below the CI 145,000-byte ceiling.

Initial scripts remain:

- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

The Barlow Condensed request is an external display-font stylesheet and is not a second local application stylesheet. `display=swap` plus the existing local fallback stack prevents blank text if the font is unavailable.

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

The larger custom crest palette/generator remains inside the lazy gameplay package and therefore does not burden ordinary Home startup.

## Lazy optional/history package

- `css/legacy.css` + `js/legacy.js`
- `css/analytics.css` + analytics/statistics/Trophy Room scripts
- `css/rulebook.css` + `js/ruleBook.js`
- `js/diagnostics.js`

Future full Transfer option data should stay out of initial startup. A dedicated lazy Transfer metadata file is preferred.

## Runtime discipline

- one Transfer timer interval maximum;
- no hidden/off-screen timer loop;
- one YouTube iframe maximum;
- no iframe before explicit Play;
- no full-showdown normalization on keypress/timer ticks;
- no localStorage write per keypress;
- delayed League/Club operations identity-safe;
- reveal stages finite/cancellable;
- no reveal-phase persistence churn;
- no heavy selector/UI framework;
- avoid unnecessary DOM replacement.

---

# Release-cache architecture

`index.html` owns deployed local-runtime identity through:

`<meta name="app-asset-revision" content="0.95.0-r4">`

Initial and dynamically loaded local CSS/JS/data use the same shell-owned revision.

Current runtime revision: **`0.95.0-r4`**.

Never reuse an asset revision after deployed local CSS/JS/data bytes change.

---

# Automated validation

GitHub Actions is the exact-head machine-validation authority.

The suite now protects:

- JavaScript syntax across `js/` and `data/`;
- max-11 scoring;
- grouped bonus behavior;
- non-zero draw / 0-0 tiebreak behavior;
- canonical route matrix;
- `Clubs Assigned` recovery/no-reroll lock;
- completed-transfer/completed-showdown restrictions;
- contextual Back parents;
- shell-owned cache revision;
- exactly one initial local stylesheet;
- maximum seven initial scripts;
- no eager gameplay package;
- initial local-byte budget;
- required/duplicate HTML IDs;
- two-pack reveal stage order and finite duration;
- reduced-motion reveal path;
- no JS-injected Club Reveal stylesheet;
- all 98 current Showdown clubs covered by explicit palettes;
- 98 distinct deterministic original SVG crests;
- no external badge-image embedding in the crest engine;
- Barlow Condensed `display=swap` / fallback wiring;
- centralized Back authority;
- no route-history manipulation outside `screens.js`;
- completed-showdown recovery UI;
- Chromebook Home/reveal layout guards;
- balanced current stylesheets;
- absence of obsolete prototype files.

Automated checks cannot prove visual quality. Chromebook/mobile owner acceptance is still required before Workstream 1B closes.

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
| v0.7 | Showdown creation + reveal + confirmation | mechanics implemented; Workstream 1B presentation implemented, owner acceptance pending |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / experience / blueprint alignment | **active milestone** |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

Historical v0.10–v0.16 builds were implementation/stabilization work and do not replace this roadmap.

---

# Revised finite v0.95 work order

## Workstream 1B — current r4 browser acceptance

Workstream 1A/r3 lessons are retained. The current owner gate is now `0.95.0-r4`.

Verify:

- FIFA-era typography improves Home/menu without reducing readability;
- font fallback remains acceptable if the external font is blocked;
- two sealed packs remain equal/aligned on Chromebook and mobile;
- Pack 01 → Pack 02 → VS → confirmation feels deliberate, not awkward;
- generated crests are visually distinct and readable;
- long club/manager names do not break geometry;
- same-pair refresh/Continue recovery remains correct;
- no reroll path;
- r3 Rule Book/Statistics/Trophy/Legacy contrast remains intact;
- no gameplay/navigation/storage regression.

Detailed acceptance is in `NEXT_TASK.md`.

## Workstream 2 — Transfer Challenge phase + canonical data foundation

After r4 acceptance:

1. split post-window flow into **Guess Entry first**, then **Signing Entry**;
2. preserve current 15-minute/max-3/three-guesses/release rules;
3. add explicit Transfer sub-phase state with old-save compatibility;
4. add complete historical FIFA 17 former-league metadata dataset, separate from Showdown wheel;
5. add complete FIFA 17 player-nationality dataset;
6. build responsive searchable controlled selectors;
7. store/evaluate canonical IDs rather than arbitrary typed strings;
8. extend central routing/persistence/data regression coverage;
9. owner browser acceptance.

## Workstream 3 — Settings blueprint alignment

Small Settings surface only: application information, useful animation/reduced-motion preference, and existing safe data-management access. No accounts/cloud/online systems.

## Workstream 4 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a duplicate analytics engine.

## Workstream 5 — Season pre-commit review

Add/confirm lightweight review before irreversible season completion if still absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 regression/polish

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

Two-device/private-manager play is later architecture. Workstream 2 intentionally creates the right Transfer phase/privacy boundaries now so future two-device work does not require redesigning the Transfer model again.

Do not introduce backend/cloud/accounts/realtime multiplayer/QR/community systems into v1.0 unless explicitly requested.

---

# Continuation rule

Implementation mode remains active:

**inspect current source → identify the exact active workstream → implement root requirements without unrelated redesign → preserve locked gameplay/state/persistence/performance contracts → machine-check exact head → owner-test browser/visual behavior → synchronize project state → advance only when the gate passes.**

Avoid planning loops, duplicate systems and reopening accepted work. Follow this file plus `NEXT_TASK.md` and `ROADMAP_AMENDMENTS.md`.