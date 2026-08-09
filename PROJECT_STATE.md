# PROJECT STATE — Career Mode Showdown

## Purpose

This is the continuation authority for the current implementation.

The project is already designed. Do not restart planning, replace the architecture, reinterpret implementation revisions as a new roadmap, or discard working systems simply because an older document used a different filename or earlier rule.

Current source on `main` is the implementation authority. The original Project Bible remains the long-term product blueprint wherever current source or a later owner decision has not intentionally superseded it.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current deployed asset revision:** `0.95.0-r1`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + unified CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current phase:** v0.95 Workstream 1 browser acceptance — staged club reveal / rivalry confirmation  
**Machine validation:** exact-head GitHub Actions validation passed for the implemented reveal architecture before documentation synchronization  
**Owner acceptance:** pending real-browser test of v0.95.0-r1

The owner accepted `v0.16.0-r3`, closing the responsive-stabilization gate and authorizing the move into the original **v0.95** roadmap milestone.

---

# Authority hierarchy

When sources disagree:

1. current source code on `main`;
2. explicit later owner amendments recorded here;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. original Project Bible / architecture / release documentation;
6. older historical records/conversations.

Do not mark a roadmap item complete from filenames, comments, labels, or partial behavior. Compare actual source behavior against its acceptance criteria.

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

# Locked gameplay amendments

## Scoring — final current rule

Per manager per season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- Top Scorer and/or Top Assist: **+1 maximum for the pair**

**Maximum: 11 points per manager per season.**

Do not restore four independent bonus points or a maximum of 13.

## Season winner — final current rule

1. Higher scoring total wins.
2. Equal non-zero totals are a draw.
3. Only when both totals are 0:
   - better league position wins;
   - if position is equal, more league points wins;
   - otherwise draw.

Do not add goal difference, goals scored or head-to-head as another tiebreak without owner approval.

## Transfer Challenge — established current phase

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

## Core rivalry mechanics

Implemented and preserved:

- loading/bootstrap;
- Main Menu;
- New Showdown;
- showdown/manager names;
- 1 / 3 / 5 / 10 season selection;
- League Wheel;
- persisted league lock;
- random same-league two-club assignment;
- different-club validation;
- atomic club persistence/rollback;
- permanent club lock/no reroll;
- Showdown Home;
- Continue Career;
- per-season Transfer Challenge;
- persisted real transfer deadline;
- transfer draft persistence;
- guess evaluation/release verdicts;
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
- safe active-showdown/history/reset deletion behavior.

## Presentation foundation

- original FIFA-17-era-inspired visual system;
- unified `css/app.css`;
- deterministic generated club identities instead of official badges;
- user-initiated soundtrack/trailer media;
- Marco Reus treatment using separately licensed imagery;
- responsive Chromebook/laptop/mobile layouts;
- visible runtime notices/errors;
- reduced-motion support.

---

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

This build completes the **source implementation** of the missing original v0.7 experiential requirement. Browser acceptance is still pending and the original v0.7 acceptance criterion must not be declared fully closed until the owner tests it.

## Implemented reveal sequence

**Selected League Confirmed  
→ Reveal Begins  
→ Manager 1 Club Revealed  
→ Manager 2 Club Revealed  
→ Final VS Rivalry Presentation  
→ User Confirms Rivalry  
→ Showdown Home**

## Presentation implementation

The Club Assignment screen now contains:

- league-confirmed header;
- five-step reveal-progress strip;
- sealed Manager 1 and Manager 2 club cards;
- separate Manager 1 and Manager 2 reveal stages;
- finite CSS reveal sweep;
- generated club-color/initial identity presentation;
- central rivalry VS state;
- final locked-rivalry tableau;
- showdown name;
- selected league;
- season count;
- Manager 1 + club;
- Manager 2 + club;
- explicit `CONFIRM RIVALRY & START SHOWDOWN` action.

Visual implementation stays copyright-safe and lightweight:

- no official club badges;
- no copied EA/FUT card artwork;
- no proprietary FIFA fonts;
- no downloaded reveal video/audio bundle;
- no canvas/WebGL engine;
- no continuous animation loop.

---

# Club assignment integrity — v0.95.0-r1 lock

The staged presentation is built **around** the existing reliable assignment engine.

## Assignment transaction

When Open Showdown Pack is pressed:

1. one valid pair is selected from the already locked league;
2. the pair is placed in memory;
3. status becomes `Clubs Assigned`;
4. the pair/status are saved immediately;
5. if save fails, previous club/status state is restored and reveal does not proceed;
6. only after successful persistence does the theatrical reveal begin.

The animation itself does not write to localStorage.

## Confirmation checkpoint

`Clubs Assigned` now has an explicit semantic meaning:

> valid permanent club pair exists, but the rivalry has not yet been explicitly confirmed.

While in this state:

- Club Assignment is the canonical route;
- League Wheel is invalid;
- Showdown Home is invalid;
- Transfer Challenge is invalid;
- the pair cannot be rerolled;
- refresh/Continue returns to final Club Assignment confirmation with the same pair.

Only successful explicit confirmation changes status to `Ready` and opens Showdown Home.

If confirmation persistence fails, status is rolled back and the user remains at the final confirmation.

## Async/race integrity

Reveal stages are finite timers guarded by:

- reveal operation identity;
- showdown identity;
- selected-league identity.

Leaving/resetting/replacing state cancels pending reveal timers. A stale callback cannot mutate a replacement showdown.

## Reduced motion

If `prefers-reduced-motion: reduce` is active:

- assignment/persistence behavior is unchanged;
- theatrical stages are effectively skipped;
- full club information and final rivalry confirmation are still presented;
- explicit confirmation remains mandatory.

---

# Navigation architecture — current lock

`js/screens.js` remains the only route/history authority.

Current guarantees:

- Back is centrally intercepted;
- history is advisory and state-aware;
- illegal/stale routes are rejected;
- pending critical writes flush before route changes;
- failed critical flush blocks navigation;
- saved clubs invalidate League Wheel permanently;
- `Clubs Assigned` preserves Club Assignment only for final confirmation;
- confirmed clubs invalidate Club Assignment;
- completed Transfer Challenge invalidates obsolete transfer state;
- completed showdown invalidates setup/transfer/results-entry routes;
- Completed Showdown Home is the completed canonical destination;
- optional-screen Back returns to the actual legal origin.

No other module may manipulate `screenHistory`.

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

No storage schema migration was required for v0.95.0-r1; the established `status` field carries the confirmation checkpoint.

---

# Performance architecture — current lock

## Initial shell

Initial local assets remain:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI continues to enforce:

- exactly one initial stylesheet;
- maximum seven initial JavaScript files;
- no eager gameplay package;
- 145,000-byte initial local-asset ceiling.

## Lazy gameplay package

Still loaded only when gameplay is needed:

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

## Runtime discipline

- one transfer timer interval maximum;
- no hidden/off-screen transfer loop;
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

`index.html` owns the authoritative deployment identity through:

`<meta name="app-asset-revision" content="0.95.0-r1">`

Initial and dynamically loaded local assets derive from this identity.

Current asset revision: **`0.95.0-r1`**.

Never reuse this revision after deployed CSS/JS/data bytes change.

---

# Automated validation

GitHub Actions remains the exact-head machine-validation authority.

The v0.95 validation suite now checks:

- `node --check` across `js/` and `data/`;
- max-11 scoring;
- grouped performance/award bonuses;
- equal-nonzero draw behavior;
- 0-0 league-position/league-points tiebreak;
- no-save / no-league / no-club route states;
- `Clubs Assigned` confirmation-pending recovery;
- League Wheel invalidation after clubs are saved;
- Dashboard/Transfer blocking until confirmation;
- confirmed Ready → Showdown Home route;
- active/recording/completed Transfer Challenge route rules;
- completed-showdown route restrictions;
- contextual Back parents;
- shell-owned cache revision coherence;
- one initial stylesheet;
- maximum seven initial scripts;
- no eager gameplay package;
- initial local-byte budget;
- required/duplicate HTML IDs;
- required reveal/confirmation IDs;
- staged reveal state/timing source contract;
- reduced-motion reveal path;
- centralized Back authority;
- no route-history manipulation outside `screens.js`;
- completed-showdown recovery UI;
- Chromebook Home layout guards;
- absence of obsolete prototype files.

The exact-head validation run for the implementation commit `704e8420743991c921b982149d5b331fe9ce833d` completed successfully. Documentation commits follow the same workflow and must remain green before the build is considered repository-clean.

Automated validation supplements the owner's real Chromebook/mobile/browser acceptance; it does not replace visual testing.

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
| v0.7 | Showdown creation + FUT reveal + confirmation | mechanics complete; reveal/confirmation **implemented in v0.95.0-r1, owner acceptance pending** |
| v0.8 | Season management | functionally complete; expanded by approved Transfer Challenge |
| v0.9 | Scoring/statistics/Legacy | functionally complete |
| v0.95 | Polish / experience / blueprint alignment | active milestone |
| v1.0 | Complete reliable local rivalry | not yet declared complete |

The historical v0.10–v0.16 implementation/stabilization sequence did not replace the original roadmap. The project is now back on the original v0.95 → v1.0 release path.

---

# Blueprint differences intentionally superseded

Do not revert these:

- old four-independent-bonus interpretation → grouped max-11 scoring;
- early design without Transfer Challenge → approved Transfer Challenge;
- separate `router.js` → current `screens.js` route authority;
- forced final-season jump directly to Legacy → automatic archive + Completed Showdown Home;
- old multi-file core CSS → unified `css/app.css`;
- later Trophy Room, Rule Book, generated club identities and user-initiated menu media are established current features.

---

# Remaining v0.95 work

## Workstream 1 — FUT-style reveal / final rivalry confirmation

**Source implementation complete in v0.95.0-r1. Owner browser acceptance pending.**

Acceptance checklist is in `NEXT_TASK.md`.

Do not close the original v0.7 presentation requirement until the owner verifies the staged sequence, confirmation-pending refresh recovery, no-reroll behavior and responsive presentation.

## Workstream 2 — Settings blueprint alignment

After Workstream 1 acceptance, implement the small Settings surface from the original screen plan using existing architecture. No accounts/cloud/online systems.

## Workstream 3 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a second analytics engine.

## Workstream 4 — Season pre-commit review

Inspect current Complete Season UX and add a lightweight review/confirmation before irreversible season completion if an equivalent safeguard is still absent. Historical completed seasons stay read-only.

## Workstream 5 — final polish / release regression

- responsive consistency;
- Chromebook/laptop/mobile quality;
- accessibility/focus usability;
- clear feedback;
- coherent finite transitions;
- performance;
- complete persistence/navigation/gameplay regression;
- documentation synchronization.

Then move directly to **v1.0**.

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

# Current release gate

The immediate task is real-browser acceptance of **v0.95.0-r1**.

Highest-priority checks:

- staged M1 → M2 → VS sequence;
- full final rivalry tableau;
- explicit confirmation;
- no reroll anywhere after the pair is saved;
- refresh before final confirmation → Continue → same pair + confirmation screen;
- Dashboard/Transfer inaccessible while confirmation is pending;
- Chromebook/mobile presentation remains coherent;
- reduced-motion information parity;
- old core rivalry flow remains intact after confirmation.

See `NEXT_TASK.md` for the exact test matrix.

---

# Development philosophy — permanent continuation rule

**IMPLEMENTATION MODE**

- Project design is complete.
- Keep a hawk-eye distinction between actual behavior and historical labels.
- Verify acceptance criteria against source and browser behavior.
- Do not restart planning.
- Do not redesign reliable architecture to match obsolete filenames.
- Preserve owner-approved rules.
- Preserve stability/performance patches.
- Fix root causes rather than stacking patches.
- Add deterministic regression coverage when practical.
- Regression-test previously working behavior after meaningful changes.
- Update Project State / Next Task / Changelog / README when reality changes.
- Continue the active milestone rather than branching into unrelated work.
- Keep original **v0.95 → v1.0** destination visible.
- Finish Version 1.0 before post-v1.0 expansion.
