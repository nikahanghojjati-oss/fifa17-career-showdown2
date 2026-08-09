# PROJECT STATE — Career Mode Showdown

## Purpose / authority

This is the continuation authority for the current implementation. The project is already designed. Do not restart planning, replace established architecture, or discard working systems because older documentation described an earlier implementation.

Authority when sources disagree:

1. current source on `main`;
2. explicit later owner amendments;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. original Project Bible / architecture / release documentation;
7. older historical records/conversations.

Current source is the implementation authority. Browser acceptance remains required for visual/interaction work even after machine validation succeeds.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r6`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 3 — Settings / application motion preference  
**Source status:** implemented and machine-validated  
**Owner/browser status:** r6 acceptance pending  
**Accepted gates:** `0.95.0-r4` Workstream 1B and `0.95.0-r5` Workstream 2  
**Next after r6 acceptance:** Workstream 4 — Main Menu Statistics alignment

`0.95.0-r6` is a v0.95 implementation/cache revision, not a replacement roadmap.

---

# Product mission

Career Mode Showdown turns two separate FIFA 17 Career Mode saves into one persistent two-manager rivalry.

Target flow:

Main Menu  
→ Create Showdown  
→ League Selection  
→ Club Assignment / Two-Pack Reveal  
→ Rivalry Confirmation  
→ Showdown Home  
→ Transfer Window  
→ Guess Entry  
→ Signing Entry  
→ Transfer Verdicts  
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
- League selected once per showdown.
- Two different clubs assigned once per showdown.
- Assigned clubs remain permanent for every season in that showdown.
- Club reuse across separate showdowns is allowed.
- Showdown length is 1, 3, 5 or 10 seasons.
- Showdown Club/League pool remains the FIFA-17-era top-five European leagues.
- Transfer metadata may cover the broader FIFA 17 competition/nationality universe without expanding the Showdown League Wheel.
- Results are entered manually.
- Browser localStorage remains the v1 persistence layer.
- No accounts, backend, cloud sync, QR pairing or real-time two-device mode in v1.

Post-v1 two-device/private-manager concepts may build on the transfer sub-phase boundaries created in r5 but must not interrupt the local v1 release unless the owner changes scope.

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

## Season winner

1. Higher scoring total wins.
2. Equal non-zero totals are a draw.
3. Only when both totals are 0:
   - better league position wins;
   - if position is equal, more league points wins;
   - otherwise draw.

## Transfer Challenge

Each season:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is League or Nationality;
- a signing matching a correct guess must be released.

r5 changed the entry/state sequence, not these gameplay rules.

## Match-play rule

- Career Mode matches normally simulated.
- Champions League final may be played or simulated.
- Main domestic cup final may be played or simulated.

---

# Implemented systems to preserve

- lightweight bootstrap and GitHub Pages deployment;
- FIFA-17-era-inspired Home with fallback-safe Barlow Condensed display hierarchy;
- user-initiated lazy soundtrack/trailer media;
- showdown name/managers/1-3-5-10 season setup;
- five-league League Wheel and persisted league lock;
- same-league/different-club assignment;
- atomic club save/rollback and permanent no-reroll lock;
- original deterministic procedural crest identities for all 98 Showdown clubs;
- two sealed-pack sequential Club Reveal;
- explicit Rivalry Confirmation;
- Showdown Home and cumulative scoreboard;
- per-season phased Transfer Challenge;
- persisted transfer deadline and hidden-tab timer optimization;
- Window → Guess Entry → Signing Entry → Verdicts state sequence;
- old transfer-record compatibility/migration;
- canonical FIFA 17 transfer League and player-nationality options;
- searchable accessible controlled League/Nationality selectors;
- canonical-ID guess evaluation;
- debounced/deduplicated transfer drafts;
- critical transfer phase save/rollback;
- Season Results and automatic scoring;
- Season Summary and multi-season progression;
- completed showdown recovery hub;
- Legacy archive/history and data controls;
- Rivalry Statistics/cumulative analytics;
- Trophy Room;
- Rule Book;
- **r6 lazy Settings modal**;
- **r6 persistent Follow Device / Reduce Motion preference**;
- safe delete/reset behavior;
- centralized smart Back navigation;
- release-cache coherence;
- runtime diagnostics;
- Chromebook/laptop/mobile responsive layouts.

---

# Club Assignment integrity — accepted r4 baseline

The r4 transaction remains locked:

1. one valid same-league/different-club pair is generated;
2. pair placed in memory;
3. status becomes `Clubs Assigned`;
4. pair/status saved immediately;
5. save failure restores prior state;
6. only after successful persistence does the pack reveal begin.

Reveal animation never writes to localStorage.

`Clubs Assigned` means a valid permanent pair exists but Rivalry Confirmation is still pending. Refresh/Continue restores that same pair. Only explicit successful confirmation changes status to `Ready`.

r6 only changes how quickly the theatrical reveal proceeds when effective reduced motion is active. It does not change generation, persistence, pair identity, no-reroll behavior or explicit confirmation.

---

# Transfer Challenge architecture — accepted r5 baseline

The existing per-season Transfer Challenge record remains authoritative. No duplicate record or second route was created.

Challenge status remains routing-compatible:

- `not_started`
- `active`
- `recording`
- `completed`

Persistent `phase` provides sub-state:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Both post-window entry phases intentionally keep `status: recording`. `js/screens.js` remains the sole route/history authority and canonical route remains `transferChallenge` while either phase is active.

Flow:

**Transfer Window → Guess Entry → critical guess lock → Signing Entry → critical signing lock → canonical evaluation → Verdicts → Season Results**

Critical phase transitions use immediate persistence with challenge/status snapshots and rollback/block on failure. Draft editing remains debounced/deduplicated. Signing Entry cannot rewrite already locked guesses.

Old `status: recording` records without `phase` resolve to Guess Entry. Existing old drafts survive. Known historical aliases are mapped to canonical IDs; unknown values remain visible and require valid re-selection.

Transfer metadata remains lazy and separate from the five-league Showdown Wheel:

- 36 Transfer League options: 35 FIFA 17 domestic competitions + Rest of World;
- 164 FIFA 17 player nationalities.

Release evaluation compares canonical IDs, not arbitrary free text.

---

# Settings / motion architecture — current r6

## UI architecture

Settings is a lazy optional module:

- `js/settings.js`
- `css/settings.css`

The Home shell contains only `#settingsButton`. Opening Settings loads the optional assets through `js/optionalModules.js`.

Settings is a modal over the current screen, not a new `screens.js` route. This intentionally leaves central route/history behavior unchanged.

Settings contains only:

- application/build information;
- motion/accessibility preference;
- a gateway to the existing Legacy Data Management surface.

No account/cloud/backend/theme/notification preference system was added.

## Application preference storage

Storage authority remains `js/storage.js`.

Keys are now:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

The preferences object currently has schema version 1 and one user preference:

`reducedMotion: boolean`

Default `false` means **Follow Device**, not “force full motion.”

Effective reduced motion is:

**user Reduce Motion override OR operating-system/browser reduced-motion request**.

There is deliberately no user setting that can force full motion against a device accessibility request.

`initializeStorageLifecycle()` applies the effective motion state during core bootstrap and watches system/cross-tab preference changes.

The document receives:

- `data-motion-preference="system" | "reduced"`
- `data-motion-reduced="true" | "false"`

## Reset semantics

`clearAllCareerModeData()` still resets Showdown competition data only:

- active showdown;
- Legacy history.

It intentionally preserves application preferences. The Settings UI does not duplicate destructive storage primitives and instead opens the established Legacy Data Management controls.

## Motion consumers

### Club Assignment

`isReducedClubMotionPreferred()` consumes the shared effective preference. Reduced motion skips theatrical stage timers and moves the already-saved pair directly to confirmation.

### League Wheel

Standard timing remains 4000 ms spin + 700 ms advance.

Effective reduced motion uses 80 ms spin resolution + 120 ms advance, preventing the previous hidden four-second delay while retaining the exact same random selection/persistence/rollback transaction.

### CSS

`css/app.css` minimizes animations/transitions for both:

- `html[data-motion-reduced="true"]`;
- `@media(prefers-reduced-motion: reduce)`.

## Settings accessibility

Preserve:

- modal dialog semantics;
- background `inert` while open;
- Escape/backdrop close;
- Tab containment;
- focus restoration to opener;
- motion radiogroup/radio semantics;
- roving tab stop;
- Arrow/Home/End choice navigation;
- focus retention after dynamic preference rerender;
- low-height Chromebook and mobile viewport guards.

---

# Navigation architecture — locked

`js/screens.js` remains the sole route/history authority.

Preserve:

- centralized ordinary Back interception;
- advisory/bounded history;
- state-aware destination validation;
- critical write flush before navigation;
- failed critical flush blocking navigation;
- saved clubs invalidating League Wheel;
- `Clubs Assigned` preserving Club Assignment only until confirmation;
- confirmed clubs invalidating Club Assignment;
- active/recording transfer state canonicalizing to Transfer Challenge;
- completed Transfer Challenge invalidating obsolete transfer route;
- completed showdown canonicalizing to Showdown Home;
- contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

Settings does not enter route history.

---

# Persistence architecture — locked

Storage authority: `js/storage.js`.

Preserve:

- immediate critical state saves;
- debounced/deduplicated transfer drafts;
- lifecycle/route flushes;
- rollback on failed critical transitions;
- Legacy revision caching;
- idempotent completed-showdown archiving;
- failure-aware destructive actions;
- active completed save retained if Legacy sync fails;
- accurate failure messaging;
- isolated application preference persistence.

Do not move user preferences into active Showdown records or Legacy history.

---

# Performance architecture — locked

## Initial shell

Initial local assets remain exactly one local stylesheet plus seven scripts:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

Settings JS/CSS remains lazy and does not change that startup count.

## Lazy gameplay package

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- `css/transfer.css`
- `data/transferOptions.js`
- `js/transferSelector.js`
- `js/transferChallenge.js`
- `js/seasonEngine.js`

## Lazy optional modules

- Legacy
- analytics / Rivalry Statistics
- Trophy Room
- Rule Book
- Settings
- diagnostics

Runtime discipline remains:

- one transfer timer interval maximum;
- no hidden/off-screen transfer timer loop;
- one YouTube iframe maximum;
- no media iframe before user Play;
- no localStorage write per keypress;
- bounded transfer selectors/no framework;
- no core gameplay data fetch from third-party APIs at runtime.

---

# Release-cache architecture

`index.html` owns deployed runtime identity:

`<meta name="app-asset-revision" content="0.95.0-r6">`

Lazy assets derive their revision from this shell value. Never reuse a deployed asset revision after local CSS/JS/data bytes change.

---

# Automated validation

Three exact-head GitHub Actions gates now exist.

## Validate Static App

Protects established:

- JavaScript syntax;
- max-11 scoring/grouped bonuses;
- draw/tiebreak rules;
- canonical route matrix;
- Club Assignment no-reroll/confirmation recovery;
- original 98-club procedural crest coverage;
- finite two-pack reveal;
- startup asset limits;
- centralized Back authority;
- optional-screen/Chromebook guards.

## Validate Transfer Workstream

Protects accepted r5:

- 36 transfer competition options;
- 164 player nationalities;
- unique canonical IDs;
- historical lower-division coverage and aliases;
- Showdown Wheel remaining five leagues;
- old recording-save migration;
- Guess → Signing ordering;
- canonical RELEASE/SAFE matching;
- selector accessibility/responsiveness;
- transfer assets remaining lazy.

## Validate Settings Workstream

Protects r6:

- Follow Device default;
- persistent Reduce Motion override;
- OS/browser reduced-motion precedence;
- preference survival across Showdown-data reset;
- lazy Settings architecture;
- Settings Home binding;
- modal/radio/focus keyboard contracts;
- no direct localStorage use in Settings UI;
- no duplicated destructive storage logic;
- Legacy Data Management reuse;
- Club Reveal/League Wheel shared motion-consumer contract;
- materially shortened reduced League Wheel timing;
- user-forced reduced-motion CSS;
- Chromebook/mobile Settings viewport structure.

Machine validation does not prove visual quality. Owner Chromebook/mobile acceptance is still required for r6.

---

# Remaining v0.95 roadmap

## Workstream 3 — current gate

`0.95.0-r6` is implemented and machine-validated. Owner browser acceptance is pending. Use `NEXT_TASK.md` for the exact browser checklist.

Do not advance while a real r6 defect remains unresolved.

## Workstream 4 — Main Menu Statistics alignment

After r6 acceptance, align the original Main Menu Statistics blueprint with the already-existing Rivalry Statistics / Trophy Room / analytics architecture. Do not create a second analytics engine.

## Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible completion if an equivalent safeguard is absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 polish/regression

Cross-screen typography/contrast, responsive behavior, accessibility/focus, feedback/transitions, performance, persistence/navigation/gameplay regression and documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Continuation rule

**Inspect current source → identify exact active workstream → implement root requirement without unrelated redesign → preserve locked gameplay/state/persistence/performance contracts → machine-check exact head → owner-test browser behavior → synchronize project state → advance only when the current gate passes.**

Avoid planning loops, duplicate systems and reopening accepted work without a real regression.
