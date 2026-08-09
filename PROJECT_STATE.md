# PROJECT STATE — Career Mode Showdown

## Purpose

This is the continuation authority for the current implementation.

The project is already designed. Future development must not restart planning, reinterpret implementation/build numbers as a replacement roadmap, or discard reliable architecture simply because an older document used a different filename or earlier rule.

The long-term objective remains the original Project Bible objective: finish a complete Version 1.0 Career Mode Showdown experience while preserving every later owner-approved rule and every reliability/performance lesson learned during implementation.

---

# Current implementation

**Application version:** v0.16.0 — Smart Navigation & Lightweight Runtime  
**Current deployed asset revision:** `0.16.0-r3`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + unified CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current phase:** stabilization / original-roadmap alignment  
**Feature expansion:** frozen until current v0.16.0-r3 owner regression is accepted

`0.16.0-r3` is a stabilization/deployment revision, not a new gameplay milestone.

---

# Authority hierarchy

When sources disagree:

1. current source on `main`;
2. explicit later owner amendments recorded here;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. original Project Bible / architecture / release documentation;
6. older historical records/conversations.

The Project Bible remains the long-term product blueprint wherever current source or a later owner decision has not intentionally superseded it.

---

# Product mission

Career Mode Showdown turns two separate FIFA 17 Career Mode saves into one persistent two-manager rivalry.

Target experience:

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

The application should feel like a football-game companion rather than an administrative website: quick, obvious, immersive, persistent, coherent and reliable.

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
- Browser localStorage is the Version 1.0 persistence layer.
- No accounts/backend/cloud sync/QR pairing/realtime two-device mode in Version 1.0.

Post-v1.0 ideas must not interrupt this release path.

---

# Locked gameplay amendments

## Scoring — final current rule

Per manager per season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- Top Scorer and/or Top Assist: **+1 maximum for the pair**

**Maximum: 11 points per manager per season.**

## Season winner — final current rule

1. Higher scoring total wins.
2. Equal non-zero totals are a draw.
3. Only when both totals are 0:
   - better league position wins;
   - if position is equal, more league points wins;
   - otherwise draw.

## Transfer Challenge — established current phase

Each season includes:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is league or nationality;
- a correctly guessed signing must be released.

## Match-play rule

Current Rule Book behavior remains:

- Career Mode matches normally simulated;
- Champions League final may be played or simulated;
- main domestic cup final may be played or simulated.

---

# Current implemented systems

## Core mechanics implemented

- loading/bootstrap;
- Main Menu;
- New Showdown;
- manager/showdown names;
- 1/3/5/10 season selection;
- League Wheel;
- persisted league lock;
- random two-club assignment from selected league;
- different-club validation;
- atomic club save/rollback;
- permanent club lock/no reroll;
- Showdown Home;
- Continue Career;
- Transfer Challenge + persisted real deadline;
- transfer draft persistence;
- guess/release verdicts;
- Season Results;
- automatic scoring;
- Season Summary;
- multi-season progression;
- final completion;
- Completed Showdown Home;
- Legacy archive/history;
- Rivalry Statistics;
- cumulative analytics;
- Trophy Room;
- Rule Book;
- safe delete/reset behavior.

## Presentation implemented

- original FIFA-17-era-inspired tile system;
- unified `css/app.css` visual system;
- deterministic generated club visual identities rather than official badges;
- user-initiated soundtrack/trailer menu media;
- Marco Reus menu treatment using separately licensed imagery;
- responsive Chromebook/laptop/mobile layouts;
- visible runtime notices;
- reduced-motion support.

---

# CRITICAL ROADMAP CORRECTION — CLUB ASSIGNMENT PRESENTATION

The owner correctly identified that current source does **not** yet contain the FUT-style club reveal promised by the original blueprint.

This distinction is now authoritative.

## What current source actually does

`js/clubAssignment.js` already has strong assignment mechanics:

- gets one random valid pair;
- pair is different and from the selected league;
- uses operation/showdown/league identity guards;
- uses a finite delayed operation;
- writes both clubs atomically;
- rolls back if persistence fails;
- permanently locks the pair;
- prevents rerolls.

But the current visual behavior is basic:

- two simple cards begin with `?`;
- user presses Open Club Pack;
- after roughly one delay, both assigned names become visible;
- both cards are effectively revealed together;
- there is no meaningful first-club/second-club staging;
- there is no dedicated final rivalry VS tableau;
- there is no explicit final confirmation of league + clubs + showdown + season count before entering Showdown Home.

The source/header wording that calls the current screen “FUT Style Reveal” must not be used as evidence that the blueprint requirement is complete.

## What the original v0.7 blueprint requires

The intended reveal sequence is:

**Selected League Confirmed  
→ Club Reveal Begins  
→ First Club Revealed  
→ Second Club Revealed  
→ VS Presentation  
→ User Confirmation  
→ Showdown Begins**

The purpose is emotional impact: creating a rivalry should feel like an event, not merely displaying two random database values.

## Correct milestone classification

The correct status is:

**v0.7 club-assignment mechanics: COMPLETE**  
**v0.7 FUT-style reveal / rivalry-confirmation acceptance: INCOMPLETE**

We will not reopen the old architecture or create a separate retroactive v0.7 branch. The unfinished original v0.7 experience obligation is carried forward into **v0.95 Polish / Blueprint Alignment**, where it will be completed using the hardened current architecture.

This is blueprint completion, not feature creep.

---

# FUT reveal implementation contract for v0.95

The future implementation must build presentation **around the current reliable assignment engine**, not replace it.

Required experience:

1. Selected league confirmation.
2. Lightweight reveal/opening stage begins.
3. Manager 1 club identity reveals.
4. Manager 2 club identity reveals separately.
5. Final rivalry/VS tableau appears.
6. Tableau includes:
   - league;
   - showdown name;
   - season count;
   - Manager 1 + club;
   - Manager 2 + club;
   - strong central VS treatment.
7. User explicitly confirms/starts the rivalry.
8. Showdown Home opens.

### Integrity requirements

- One pair only.
- No reroll.
- Same league, different clubs.
- Assignment persists atomically.
- Save failure rolls back.
- A stale reveal callback must never mutate a replacement showdown.
- Refresh/resume after saved assignment must never generate a second pair.
- Club lock continues to invalidate obsolete setup routes.
- Confirmation may accept the pair but cannot alter it.

### Performance/presentation requirements

Preserve lightweight architecture:

- CSS transforms/opacity/clip/gradients rather than WebGL/canvas/video effects;
- reuse deterministic `visualIdentity.js` colors/initials;
- no official badges;
- no copied EA/FUT card artwork;
- no proprietary FIFA fonts;
- no downloaded reveal media bundle;
- no continuous animation loop;
- no storage writes for theatrical animation phases;
- finite/cancellable stages only;
- reduced-motion users receive the same information/confirmation with minimal motion;
- responsive on Chromebook/laptop/mobile;
- remains inside lazy gameplay package and does not increase initial shell script count.

---

# Navigation architecture — current lock

`js/screens.js` remains the only route/history authority.

- ordinary Back is centrally intercepted;
- route history is advisory and state-aware;
- stale/illegal routes are rejected;
- pending critical writes flush before route changes;
- failed critical flush blocks navigation;
- locked clubs invalidate League/Club setup;
- completed Transfer Challenge invalidates old transfer state;
- completed showdown invalidates setup/transfer/results-entry routes;
- Completed Showdown Home is the completed canonical destination;
- optional-screen Back returns to the actual legal origin.

No other module may manipulate `screenHistory`.

---

# Persistence architecture — current lock

Storage authority: `js/storage.js`

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

---

# Performance architecture — current lock

Initial shell remains:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI preserves one initial stylesheet, maximum seven initial JS files, no eager gameplay engine and startup byte budget.

Gameplay remains lazy:

- league/club data;
- data engine;
- visual identity;
- showdown UI;
- League Wheel;
- Club Assignment;
- Transfer Challenge;
- Season Engine.

Runtime discipline remains:

- one transfer timer interval max;
- no hidden/off-screen timer loop;
- one YouTube iframe max;
- no iframe before explicit Play;
- no full showdown normalization on keystrokes/timer ticks;
- no localStorage write per keypress;
- delayed League/Club operations identity-safe;
- avoid unnecessary DOM replacement.

---

# Release-cache architecture

`index.html` owns one deployment revision via:

`<meta name="app-asset-revision" ...>`

Current value: **`0.16.0-r3`**.

This roadmap/documentation correction does not change deployed application bytes, so it does **not** require a new asset revision.

---

# v0.16.0-r3 responsive stabilization

r3 fixed the Chromebook Home overlap root cause:

- desktop fixed 108px rows were replaced by content-sized rows;
- primary Career tiles moved above media;
- media row grows naturally when YouTube iframe loads;
- desktop media selector uses a compact grid;
- low-height laptop/Chromebook breakpoint reduces vertical pressure;
- mobile/tablet behavior remains preserved.

This remains part of the v0.16 stabilization gate.

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
| v0.7 | Showdown creation + FUT reveal + confirmation | **mechanics complete; reveal/confirmation acceptance incomplete** |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / experience / blueprint alignment | substantially implemented; remaining obligations below |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

The v0.10–v0.16 sequence represents implementation, correction, stabilization and optimization work while converging toward the original v0.95/v1.0 destination. It does not create a replacement roadmap.

After v0.16 stabilization is accepted, development moves to **v0.95**, then directly to **v1.0**.

---

# Blueprint differences intentionally superseded

Do not “fix” these back to old text:

- old four-independent-bonus interpretation → superseded by grouped max-11 scoring;
- early design without Transfer Challenge → superseded by approved Transfer Challenge;
- separate `router.js` → responsibility now correctly lives in `screens.js`;
- forced final-season jump directly to Legacy → superseded by automatic archive + Completed Showdown Home;
- old multi-file core CSS structure → superseded by unified `css/app.css` for stability/performance;
- Trophy Room, Rule Book, generated identities and user-initiated menu media are established current features.

---

# Remaining v0.95 blueprint-alignment obligations

Finite and ordered:

## A — FUT-style club reveal / final rivalry confirmation

Highest-priority carried-forward v0.7 obligation. Complete the implementation contract above without weakening assignment integrity/performance.

## B — Settings

Original screen plan includes Settings. Implement a small surface for appropriate application info/preferences/data-management access without accounts/cloud/online scope or a second visual architecture.

## C — Main Menu Statistics alignment

Original blueprint expects cumulative Statistics from Main Menu. Reuse the existing analytics/Trophy Room/Rivalry Statistics systems. Do not create a duplicate analytics engine.

## D — Season pre-commit review

Original Season Engine expects review of entered results/points before irreversible completion. If current browser experience lacks an equivalent safeguard, add a lightweight pre-commit review/confirmation. Historical seasons remain read-only.

## E — final polish/release regression

- responsive consistency;
- Chromebook/laptop/mobile quality;
- accessibility/focus usability;
- clear feedback;
- coherent finite transitions;
- performance;
- complete persistence/navigation/gameplay regression.

---

# Not Version 1.0 gaps

Do not invent work for:

- backend/cloud/accounts;
- realtime multiplayer/QR pairing;
- community/public rankings;
- official club badges;
- copied EA artwork/fonts;
- screenshots/match notes;
- new leagues;
- completed-season editing.

---

# Current release gate

Immediate: owner-test `v0.16.0-r3`, especially Chromebook Home/responsive behavior plus the established rivalry/persistence/navigation regression.

The current Club Assignment test only validates **mechanics/integrity**. Do not mark FUT presentation complete based on the existing basic two-card reveal.

After r3 acceptance:

### v0.95 — Polish / Blueprint Alignment Release Candidate

1. complete FUT-style reveal/rivalry confirmation;
2. Settings alignment;
3. Main Menu Statistics alignment;
4. Season pre-commit review if missing;
5. final responsive/accessibility/performance/regression work;
6. synchronize documentation.

Then:

### v1.0 — Complete Release Candidate / Final Release

v1.0 release requires the full rivalry to work end-to-end **and** the original v0.7 reveal/confirmation experience to be genuinely complete without sacrificing permanence, persistence, navigation or performance.

---

# Development philosophy — permanent continuation rule

**IMPLEMENTATION MODE**

- Project design is complete.
- Keep a hawk-eye distinction between what source truly implements and what a historical label claims it implements.
- Do not mark a milestone complete from filenames/comments alone; verify its acceptance criteria against current behavior.
- Do not restart planning.
- Do not redesign reliable architecture to match obsolete filenames.
- Preserve later owner-approved rules.
- Preserve working stability/performance patches.
- Fix root causes.
- Add deterministic regression coverage when practical.
- Regression-test old functionality after meaningful changes.
- Update Project State / Next Task / Changelog / README when reality changes.
- Continue the active milestone instead of branching into unrelated work.
- Keep original **v0.95 → v1.0** destination visible.
- Finish Version 1.0 before post-v1.0 expansion.
