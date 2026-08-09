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
**Current runtime asset revision:** `0.95.0-r5`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device, one browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 2 — phased Transfer Challenge + canonical FIFA 17 transfer metadata/selectors  
**Source status:** implemented and machine-validated  
**Owner/browser status:** r5 acceptance pending  
**Previous gate:** Workstream 1B / `0.95.0-r4` owner accepted  
**Next workstream after r5 acceptance:** Workstream 3 — Settings blueprint alignment

`0.95.0-r5` is a v0.95 implementation/cache revision, not a replacement roadmap.

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

## Transfer Challenge rules

Each season:

- 15-minute transfer window;
- maximum three signings per manager;
- three opponent guesses;
- each guess is League or Nationality;
- a signing matching a correct guess must be released.

r5 changes the **entry/state sequence**, not these gameplay rules.

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
- per-season Transfer Challenge;
- persisted transfer deadline and hidden-tab timer optimization;
- **r5 phased Transfer Challenge:** Window → Guess Entry → Signing Entry → Verdicts;
- old transfer-record compatibility/migration;
- canonical FIFA 17 transfer League and player-nationality options;
- searchable accessible controlled League/Nationality selectors;
- canonical-ID guess evaluation;
- debounced/deduplicated transfer drafts;
- critical transfer phase save/rollback;
- Season Results and automatic scoring;
- Season Summary and multi-season progression;
- completed showdown recovery hub;
- Legacy archive/history;
- Rivalry Statistics/cumulative analytics;
- Trophy Room;
- Rule Book;
- safe delete/reset behavior;
- centralized smart Back navigation;
- release-cache coherence;
- runtime diagnostics;
- reduced-motion support;
- Chromebook/laptop/mobile responsive layouts.

---

# Club assignment integrity — permanent lock

The accepted r4 transaction remains unchanged:

1. one valid same-league/different-club pair is generated;
2. pair placed in memory;
3. status becomes `Clubs Assigned`;
4. pair/status saved immediately;
5. save failure restores prior state;
6. only after successful persistence does the pack reveal begin.

Reveal animation never writes to localStorage.

`Clubs Assigned` means a valid permanent pair exists but rivalry confirmation is still pending. Refresh/Continue restores that same pair. Only explicit successful confirmation changes status to `Ready`.

r4 owner acceptance is complete. Do not reopen the old generic-card/reveal architecture unless a real regression is reported.

---

# r5 Transfer Challenge architecture

## Persistent record

The existing per-season Transfer Challenge record remains authoritative. r5 did **not** create duplicate records.

Challenge status remains routing-compatible:

- `not_started`
- `active`
- `recording`
- `completed`

New persistent `phase` adds sub-state:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Both post-window data-entry phases intentionally keep `status: recording`. `js/screens.js` therefore remains the sole route/history authority and canonical route remains `transferChallenge` while either phase is active.

## Flow

**Transfer Window  
→ Guess Entry  
→ critical guess lock  
→ Signing Entry  
→ critical signing lock  
→ canonical evaluation  
→ Verdicts  
→ Season Results**

Guesses are locked before completed signings are entered. This gives a clean future private/two-device boundary without changing v1 into a two-device product.

## Critical persistence

Critical phase transitions use immediate persistence with challenge/status snapshots and rollback/block on failure:

- active window → Guess Entry;
- Guess Entry → Signing Entry;
- Signing Entry → Completed.

Draft editing remains debounced/deduplicated. Only the active phase's form is captured, so Signing Entry cannot rewrite already locked guesses.

## Legacy transfer compatibility

Old `status: recording` records without `phase` resolve to `guess_entry`.

Existing old signing and guess drafts remain in the record. Recognized historical free-text values are mapped to canonical IDs. Unknown values remain visible and require a valid controlled re-selection before locking rather than being silently guessed.

## Canonical transfer data

`data/transferOptions.js` is lazy transfer metadata, separate from `data/leagues.js` Showdown selection data.

Current deterministic dataset:

- 36 Transfer League options: 35 FIFA 17 domestic league competitions + Rest of World fallback;
- 164 FIFA 17 player nationalities.

It includes FIFA 17 lower divisions represented historically, including England's four tiers and second tiers in France, Germany, Italy and Spain.

Canonical option entries provide IDs plus historical aliases. Release evaluation compares IDs, not arbitrary normalized text.

## Searchable selectors

`js/transferSelector.js` provides lightweight framework-free comboboxes with:

- type-to-filter;
- bounded results;
- League country/tier context;
- keyboard navigation and Escape;
- ARIA combobox/listbox/active-descendant wiring;
- canonical value separate from label;
- mobile viewport-constrained list;
- visible focus;
- low-height Chromebook behavior.

Guess Value switches between League/Nationality datasets based on Guess Type.

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
- `active`/`recording` transfer state canonicalizing to Transfer Challenge;
- completed Transfer Challenge invalidating obsolete transfer route;
- completed showdown canonicalizing to Showdown Home;
- contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

Resume path explicitly calls `openTransferChallenge()` when canonical route is Transfer Challenge, so r5 migration/render executes after refresh in both Guess and Signing phases.

---

# Persistence architecture — locked

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`

Preserve:

- immediate critical state saves;
- debounced/deduplicated transfer drafts;
- lifecycle/route flushes;
- rollback on failed critical transitions;
- Legacy revision caching;
- idempotent completed-showdown archiving;
- failure-aware destructive actions;
- active completed save retained if Legacy sync fails;
- accurate failure messaging.

r5 extends data inside existing Transfer Challenge records; it does not replace localStorage architecture.

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

CI still enforces the initial script/style/byte budget.

## Lazy gameplay package

Existing lazy gameplay assets plus r5 Transfer assets:

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

Transfer option data does not load on initial Home startup.

## Runtime discipline

- one transfer timer interval maximum;
- no hidden/off-screen timer loop;
- one YouTube iframe maximum;
- no media iframe before user Play;
- no localStorage write per keypress;
- transfer selectors bounded/no framework;
- phase transitions finite and explicit;
- avoid unnecessary DOM replacement;
- no core gameplay data fetch from third-party APIs at runtime.

---

# Release-cache architecture

`index.html` owns deployed runtime identity:

`<meta name="app-asset-revision" content="0.95.0-r5">`

Lazy assets derive their revision from this shell value. Never reuse a deployed asset revision after local CSS/JS/data bytes change.

---

# Automated validation

Two exact-head GitHub Actions gates now exist.

## Validate Static App

Protects established:

- JavaScript syntax;
- max-11 scoring/grouped bonuses;
- draw/tiebreak rules;
- canonical route matrix;
- Club Assignment no-reroll/confirmation recovery;
- original 98-club procedural crest coverage;
- finite two-pack reveal/reduced-motion;
- startup asset limits;
- centralized Back authority;
- optional-screen/Chromebook guards.

## Validate Transfer Workstream

Protects r5:

- exactly 36 transfer competition options;
- exactly 164 player nationalities;
- unique canonical IDs;
- historical lower-division coverage;
- Showdown Wheel remaining five leagues;
- historical alias resolution;
- old recording-save migration to Guess Entry;
- old signing-draft preservation;
- Guess → Signing ordering;
- canonical ID release/non-release matching;
- critical save/rollback markers;
- selector ARIA and keyboard behavior contracts;
- bounded desktop/mobile selector presentation;
- Chromebook and reduced-motion transfer styling;
- transfer option/selector/style files absent from the initial shell.

Machine validation does not prove visual quality. Owner Chromebook/mobile acceptance is still required for r5.

---

# Current gate / remaining v0.95 roadmap

## Workstream 2 — current gate

`0.95.0-r5` is implemented and machine-validated. Owner browser acceptance is pending. The exact browser checklist is in `NEXT_TASK.md`.

Do not begin Settings while a real r5 defect remains unresolved.

## Workstream 3 — Settings

After r5 acceptance, implement the small original-blueprint Settings surface using current architecture: application information, useful animation/reduced-motion preference if valuable, and safe existing data-management access. No accounts/cloud/online systems.

## Workstream 4 — Main Menu Statistics alignment

Reuse existing analytics/Trophy Room/Rivalry Statistics. Do not create a second analytics engine.

## Workstream 5 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible completion if an equivalent safeguard is absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 polish/regression

Cross-screen typography/contrast, responsive behavior, accessibility/focus, feedback/transitions, performance, persistence/navigation/gameplay regression and documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Continuation rule

**Inspect current source → identify exact active workstream → implement root requirement without unrelated redesign → preserve locked gameplay/state/persistence/performance contracts → machine-check exact head → owner-test browser behavior → synchronize project state → advance only when the current gate passes.**

Avoid planning loops, duplicate systems and reopening accepted work without a real regression.
