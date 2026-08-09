# PROJECT STATE — Career Mode Showdown

## Authority / continuation rule

This project is already designed and implemented through the current v0.95 convergence milestone. Do not restart planning, replace established architecture, or recreate accepted systems from older documentation.

Authority when sources disagree:

1. current source on `main`;
2. explicit later owner amendments;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. original Project Bible / architecture / release documentation;
7. older historical records/conversations.

Current source is implementation authority. Browser acceptance remains required for visual/interaction work even after exact-head machine validation succeeds.

---

# Current implementation

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Current runtime asset revision:** `0.95.0-r8`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device/browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 4 — Main Menu Statistics alignment / stabilization  
**Source status:** implemented and machine-validated  
**Owner/browser status:** r8 acceptance pending while owner continues Workstream 4/r7 feature testing  
**Owner-accepted gates:** `0.95.0-r4`, `0.95.0-r5`, `0.95.0-r6`  
**Next after Workstream 4 acceptance:** Workstream 5 — Season pre-commit review

`0.95.0-r8` is a v0.95 stabilization/cache revision, not a replacement roadmap.

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
→ Permanent Legacy / Career Statistics

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

Post-v1 private/two-device concepts may build on r5 Transfer sub-phases but must not interrupt the local v1 release unless the owner changes scope.

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

# Accepted implementation baselines

## r4 — presentation / Club Assignment

Owner accepted.

Preserve:

- Barlow Condensed display hierarchy with system fallbacks;
- original deterministic procedural crests for all 98 Showdown clubs;
- exactly two sealed Showdown packs;
- one permanent same-league/different-club pair;
- save-before-reveal transaction;
- rollback if persistence fails;
- `Clubs Assigned` as confirmation-pending checkpoint;
- no reroll after successful save;
- explicit Rivalry Confirmation changing status to `Ready`;
- refresh/Continue restoring the exact same pair;
- reduced-motion fast path changing presentation timing only.

Reveal animation never writes to localStorage.

## r5 — Transfer Challenge

Owner accepted.

Existing per-season Transfer Challenge record remains authoritative.

Routing-compatible statuses:

- `not_started`
- `active`
- `recording`
- `completed`

Persistent sub-phases:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Flow:

**Transfer Window → Guess Entry → critical guess lock → Signing Entry → critical signing lock → canonical evaluation → Verdicts → Season Results**

Preserve:

- immediate save + snapshot/rollback for critical transitions;
- debounced/deduplicated active-phase drafts;
- Signing Entry unable to rewrite locked guesses;
- old `recording` save migration to Guess Entry;
- old draft preservation;
- known historical alias mapping;
- unknown values remaining visible until valid reselection;
- 36 lazy Transfer League options (35 FIFA 17 domestic competitions + Rest of World);
- 164 FIFA 17 player nationalities;
- canonical-ID RELEASE/SAFE matching;
- searchable controlled combobox selectors;
- one persisted transfer deadline / one visible timer loop maximum.

Showdown League Wheel remains exactly five leagues.

## r6 — Settings / motion accessibility

Owner accepted.

Settings remains a lazy modal, not a `screens.js` route:

- `js/settings.js`
- `css/settings.css`

Application preference key:

`careerModeShowdown.preferences`

Current preference schema version: 1.

`reducedMotion: false` means **Follow Device**.  
`reducedMotion: true` means **Reduce Motion**.

Effective reduced motion is:

**user Reduce Motion override OR device/browser reduced-motion request**.

There is no force-full-motion option that can override an accessibility request.

Preserve:

- document motion state applied during core storage initialization;
- system media-query/cross-tab synchronization;
- motion preference surviving Showdown-data reset;
- Settings reusing Legacy Data Management rather than duplicating destructive controls;
- dialog semantics, inert background, Escape/backdrop close, focus trap/restoration;
- radiogroup/keyboard controls;
- low-height Chromebook/mobile guards;
- League Wheel 4000/700 ms standard timing and 80/120 ms reduced timing;
- Club Reveal consuming the same effective preference.

---

# r7 Career Statistics architecture — Workstream 4 baseline

## Information architecture

The Main Menu has one blueprint-aligned **STATISTICS** tile instead of a competing top-level Trophy Room tile.

Analytics surfaces have three distinct jobs:

### Career Statistics

Top-level Home destination for permanent all-time completed-career data.

Dynamic route id: `careerStatistics`.

Current content:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won;
- Career Table;
- two-manager comparison when exactly two manager identities exist in completed history;
- Career Leaders;
- Current Rivalry bridge when a showdown is loaded;
- Trophy Room bridge;
- empty state before completed history exists.

### Rivalry Statistics

Contextual current-showdown analytics only.

Route id: `statistics`.

It remains available from Showdown Home and, when current state exists, from Career Statistics.

It must never silently include other archived showdowns.

### Trophy Room

Honours/cabinet destination, not a second Home Statistics tile.

Route id: `trophyRoom`.

It preserves:

- all-time summary;
- Career Table;
- manager cabinets;
- trophy counts;
- supporting achievements;
- all-time records.

Trophy Room reuses `createCareerStandingsTable()` from `js/statistics.js`; do not restore a duplicated table renderer.

## Analytics authority

`js/analytics.js` remains the **only analytics calculation engine**.

Preserve its two public data views:

- `buildCareerAnalytics()` — completed-history/career scope;
- `buildRivalryAnalytics(showdown)` — one-showdown scope.

Do not create `analytics2`, `careerAnalytics`, a parallel accumulator, a second manager identity system or a new statistics storage key.

Career/Trophy statistics are derived from existing active/Legacy records at read time.

## r7 lazy-loading contract

Career Statistics must not load the full gameplay package.

Opening the Home Statistics tile lazy-loads only the shared analytics presentation package:

- `css/analytics.css`
- `js/analytics.js`
- `js/statistics.js`

Trophy Room additionally loads:

- `js/trophyRoom.js`

None of these files belong in initial Home startup.

Read-only `statistics` and `careerStatistics` are not `GAMEPLAY_SCREENS`.

## r7 navigation contract

`js/screens.js` remains sole route/history authority.

Preserve:

- Career Statistics → Main Menu;
- Rivalry Statistics → Showdown Home / Main Menu;
- Trophy Room safe targets → Showdown Home, Career Statistics, Main Menu;
- advisory history returning Trophy Room to Career Statistics when it was opened there;
- completed-showdown Trophy Room returning to Showdown Home;
- no direct `screenHistory` use outside `screens.js`.

---

# r8 Home bootstrap stabilization — current gate

During r7 owner browser acceptance, startup diagnostics reported that `menuMediaSelector` was missing, Play/Mute were unbound, and zero of seven media choices existed.

Root cause was a stale coupling in `js/menuExperience.js`: r7 replaced the Home `#trophyRoomButton` with `#careerStatisticsButton`, but `initializeMenuExperience()` still required the removed Trophy Room id in an all-or-nothing navigation-tile guard. The initializer therefore returned before media selector creation, media bindings and the rest of the Home enhancement pass.

This was a deterministic source bug, not a browser race, YouTube failure, localStorage failure or Chromebook-specific behavior.

## Permanent prevention contract

Preserve these r8 rules:

- Home navigation tile decoration is independent per tile; an unrelated missing/renamed optional tile must not abort the media subsystem.
- `#careerStatisticsButton` is the current Statistics Home id; do not restore `#trophyRoomButton` as a competing Home tile.
- Media selector creation and Play/Mute binding are their own required initialization steps.
- `getMenuExperienceIntegrity()` verifies selector existence, the exact seven accepted media keys, and both `musicBound` control markers immediately after initialization.
- Incomplete required Home initialization throws a concrete error instead of silently returning with a partial interface.
- The dedicated `Validate Home Bootstrap` workflow couples current Home ids to `initializeMenuExperience()` so future tile renames/removals cannot strand the media system unnoticed.
- Feature/workstream validation must not hard-code one cache revision when it is intended to protect behavior across later stabilization revisions; cache identity belongs to shell/release validation.

Accepted media catalog remains exactly:

- Two Door Cinema Club — Are We Ready? (Wreck)
- Bastille — Send Them Off!
- Glass Animals — Youth
- Porter Robinson & Madeon — Shelter
- Saint Motel — Move
- Empire Of The Sun — High And Low
- FIFA 17 Gameplay Trailer

No YouTube iframe may exist before explicit Play.

---

# Implemented systems to preserve

- lightweight bootstrap and GitHub Pages deployment;
- FIFA-17-era-inspired Home;
- lazy soundtrack/trailer media;
- New/Continue Showdown;
- five-league League Wheel;
- permanent Club Assignment / two-pack reveal / confirmation;
- procedural 98-club visual identities;
- Showdown Home and cumulative scoreboard;
- phased Transfer Challenge and canonical selectors;
- Season Results / automatic locked scoring;
- Season Summary / multi-season progression;
- completed-showdown recovery hub;
- Legacy history and Data Management;
- Career Statistics;
- current Rivalry Statistics;
- Trophy Room;
- Rule Book;
- Settings / motion preference;
- safe delete/reset behavior;
- centralized Smart Back;
- release-cache coherence;
- runtime diagnostics;
- Chromebook/laptop/mobile responsive presentation.

---

# Navigation architecture — locked

`js/screens.js` is the sole route/history authority.

Preserve:

- centralized ordinary Back interception;
- advisory/bounded history;
- state-aware destination validation;
- critical write flush before navigation;
- failed critical flush blocking navigation;
- saved clubs invalidating League Wheel;
- `Clubs Assigned` preserving Club Assignment only until confirmation;
- confirmed clubs invalidating Club Assignment;
- active/recording Transfer state canonicalizing to Transfer Challenge;
- completed Transfer Challenge invalidating obsolete Transfer route;
- completed showdown canonicalizing to Showdown Home;
- contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

Settings does not enter route history.

---

# Persistence architecture — locked

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Preserve:

- immediate critical state saves;
- debounced/deduplicated drafts;
- lifecycle/route flushes;
- rollback on failed critical transitions;
- Legacy revision caching;
- idempotent completed-showdown archiving;
- failure-aware destructive actions;
- active completed save retained if Legacy sync fails;
- accurate failure messaging;
- isolated application preference persistence.

Statistics remain derived; do not create a statistics persistence layer.

---

# Performance architecture — locked

## Initial shell

Exactly one local initial stylesheet plus seven local scripts:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI enforces the startup byte ceiling and prevents gameplay/analytics/Settings modules from returning to the initial shell.

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

- Career/Rivalry analytics;
- Trophy Room;
- Legacy;
- Rule Book;
- Settings;
- diagnostics.

Runtime discipline:

- one Transfer timer interval maximum;
- no hidden/off-screen Transfer timer loop;
- one YouTube iframe maximum;
- no media iframe before Play;
- no localStorage write per keypress;
- bounded selectors/no framework;
- no core gameplay third-party data fetch.

---

# Release-cache architecture

`index.html` owns deployed runtime identity:

`<meta name="app-asset-revision" content="0.95.0-r8">`

All local shell asset references use that revision. Lazy assets derive the same revision through `getApplicationAssetRevision()`.

Never reuse a deployed revision after changing local runtime bytes.

---

# Automated validation

Five exact-head GitHub Actions gates protect current r8:

## Validate Static App

Protects:

- JS syntax;
- locked scoring/tiebreaks;
- canonical Showdown + analytics route matrix;
- 98 original procedural crests;
- Club Reveal transaction/timing;
- startup asset limits;
- centralized Back and route-history isolation;
- Chromebook/mobile Home guards;
- completed-showdown recovery.

## Validate Home Bootstrap

Protects the r8 startup root-cause boundary:

- current `careerStatisticsButton` Home contract;
- deprecated top-level `trophyRoomButton` absence;
- removal of the stale all-or-nothing navigation-tile prerequisite;
- exact seven-choice media catalog;
- selector creation;
- Play/Mute binding markers;
- immediate Home integrity verification;
- coherent shell cache revision.

## Validate Transfer Workstream

Protects accepted r5 Transfer dataset/state/selector/persistence contracts.

## Validate Settings Workstream

Protects accepted r6 preference/accessibility/reset-isolation contracts.

## Validate Statistics Workstream

Protects Workstream 4 with executable history fixtures plus architecture assertions:

- completed Showdown/Season totals;
- Career points/trophies;
- manager Showdown records;
- Transfer signing/release accumulation;
- highest Season/league records;
- current Rivalry analytics;
- Home Statistics entry;
- one analytics engine only;
- lazy analytics loading;
- Statistics not loading full gameplay;
- shared Career Table renderer;
- central route ownership.

Machine validation does not prove visual quality. r8/Workstream 4 still requires owner Chromebook/mobile acceptance.

---

# Remaining v0.95 roadmap

## Workstream 4 — current r8 browser gate

Use `NEXT_TASK.md` for the exact acceptance sequence. Fix any real Workstream 4 defect before advancing.

## Workstream 5 — Season pre-commit review

After Workstream 4 owner acceptance, inspect Complete Season and add a lightweight review/confirmation before irreversible Season completion if an equivalent safeguard is absent.

Preserve draft data on cancel/edit and preserve existing transactional save/rollback on final confirmation.

## Workstream 6 — final v0.95 polish/regression

Accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and final documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Continuation rule

**Inspect current source → identify exact active workstream → implement root requirement without unrelated redesign → preserve accepted gameplay/state/persistence/performance contracts → machine-check exact head → owner-test browser behavior → synchronize project state → advance only when the current gate passes.**

Avoid planning loops, duplicate systems and reopening accepted work without a real regression.