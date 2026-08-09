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
**Current runtime asset revision:** `0.95.0-r9`  
**Hosting:** GitHub Pages  
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage  
**Product mode:** two managers, one device/browser, one active showdown  
**Current milestone:** original v0.95 Polish / Blueprint Alignment  
**Current workstream:** Workstream 5 — Season pre-commit review  
**Source status:** implemented and exact-head machine-validated  
**Owner/browser status:** r9 acceptance pending  
**Owner-accepted gates:** `0.95.0-r4`, `0.95.0-r5`, `0.95.0-r6`, `0.95.0-r8`  
**Next after r9 acceptance:** Workstream 6 — final v0.95 polish/regression, then v1.0

`0.95.0-r9` is a v0.95 implementation/cache revision, not a replacement roadmap.

---

# Product mission

Career Mode Showdown turns two separate FIFA 17 Career Mode saves into one persistent two-manager rivalry.

Current target flow:

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
→ **Season Review**  
→ Confirm & Save  
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

## Match-play rule

- Career Mode matches normally simulated.
- Champions League final may be played or simulated.
- Main domestic cup final may be played or simulated.

---

# Owner-accepted implementation baselines

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
- old `recording` migration to Guess Entry;
- old draft preservation;
- known historical alias mapping;
- unknown values remaining visible until valid reselection;
- 36 lazy Transfer League options;
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

Effective reduced motion is user Reduce Motion override OR device/browser reduced-motion request. There is no force-full-motion option that can override an accessibility request.

Preserve:

- document motion state applied during core storage initialization;
- system media-query/cross-tab synchronization;
- motion preference surviving Showdown-data reset;
- Settings reusing Legacy Data Management rather than duplicating destructive controls;
- dialog semantics, inert background, Escape/backdrop close, focus trap/restoration;
- radiogroup/keyboard controls;
- low-height Chromebook/mobile guards;
- League Wheel standard/reduced timings;
- Club Reveal consuming the same effective preference.

## r8 — Workstream 4 / Career Statistics + Home bootstrap stabilization

Owner accepted.

The Main Menu has one blueprint-aligned **STATISTICS** tile.

Analytics surfaces remain distinct:

### Career Statistics

Top-level Home destination for permanent all-time completed-career data.

Dynamic route id: `careerStatistics`.

Includes completed Showdowns, Seasons Played, Career Points, Trophies Won, Career Table, two-manager comparison where applicable, Career Leaders, current Rivalry bridge, Trophy Room bridge and empty state.

### Rivalry Statistics

Route id: `statistics`.

Current loaded Showdown only. It must never silently include other archived showdowns.

### Trophy Room

Route id: `trophyRoom`.

Honours/cabinet destination with all-time summary, shared Career Table, manager cabinets, trophy counts, supporting achievements and all-time records.

`js/analytics.js` remains the only analytics calculation engine. No separate statistics persistence layer exists.

### r8 Home-bootstrap prevention contract

r7 replaced Home `#trophyRoomButton` with `#careerStatisticsButton`, while an old all-or-nothing prerequisite in `initializeMenuExperience()` still required the removed id and aborted media initialization. r8 fixed the root cause.

Preserve:

- Home navigation tile decoration independent per tile;
- `#careerStatisticsButton` as current Home Statistics id;
- media selector creation and Play/Mute binding as their own required subsystem;
- exact seven accepted media sources;
- `getMenuExperienceIntegrity()` immediate post-init validation;
- incomplete required Home initialization failing loudly;
- dedicated **Validate Home Bootstrap** behavioral gate;
- behavioral workstream tests revision-independent rather than hard-coded to one cache revision.

No YouTube iframe may exist before explicit Play.

---

# r9 — Season pre-commit review — current gate

## Root requirement

Before r9, `completeCurrentSeason()` validated Season Results and immediately called persistence. There was no opportunity to inspect the complete calculated result before making the Season read-only.

r9 implements the original blueprint safeguard without adding a new route or persistence model.

Current flow:

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

## Same-route review architecture

Season Review is an in-place state of `seasonEntry`, not a new `screens.js` route.

Preserve:

- `js/screens.js` as sole route/history authority;
- original Season form values remaining in the DOM during review;
- no new route/history entry;
- completed historical Seasons remaining read-only.

## Non-persistent Review boundary

Pressing **REVIEW SEASON** must only:

- validate both manager forms;
- read current raw values;
- calculate canonical score through `calculatePlayerSeasonScore()`;
- determine canonical winner through `determineSeasonWinner()`;
- create a memory-only isolated snapshot;
- create a deterministic review fingerprint;
- render raw values, achievement states, all score lines, Season totals, projected winner and projected overall Showdown score.

It must **not**:

- call `saveCurrentShowdown()`;
- append a round;
- change currentRound/status/score;
- archive a showdown;
- create a localStorage key;
- create a completion timestamp.

## Edit Results contract

**EDIT RESULTS** returns to the same form with all entered values intact and clears the previous review snapshot. Any changed value must be reviewed again before confirmation.

## Final confirmation contract

**CONFIRM & SAVE SEASON** is the only new Season persistence boundary.

Before persistence it must:

1. verify the same Showdown is still active;
2. verify the same current Season;
3. verify the Transfer Challenge remains complete;
4. reject a Season already present in rounds;
5. rebuild canonical scoring/winner data from reviewed raw values;
6. verify the rebuilt fingerprint exactly matches the reviewed fingerprint;
7. create `completedAt` only at final confirmation;
8. retain a double-submit guard.

Only then may it call the established `persistCompletedSeason()` transaction.

## Existing critical rollback retained

`persistCompletedSeason()` remains authoritative for the completed-Season write.

Before mutating current Showdown state it snapshots:

- rounds length;
- currentRound;
- status;
- completedAt;
- score.

If `saveCurrentShowdown()` fails, all those fields are restored and an error is surfaced. r9 must not weaken this.

A failed final save leaves the Review available to retry or edit.

If persistence succeeds but Summary rendering fails, the saved Season is still authoritative and the UI falls back safely to Showdown Home with an accurate error notice.

## Review presentation / loading

New lazy style:

- `css/season.css`

It loads with the gameplay package and does not enter the initial Home bundle.

Review presentation includes:

- final-check status strip;
- manager/club cards;
- position/points/goals;
- explicit four achievement states;
- all five scoring components, including zero-value lines for verification;
- Season score;
- projected winner;
- projected overall Showdown score;
- clear final/read-only warning;
- Confirm & Save / Edit Results actions.

Responsive guards cover low-height Chromebook, mobile and small-phone layouts.

## r9 self-diagnostics / CI

`getSeasonReviewIntegrity()` verifies the dynamic Review UI and binding markers.

Runtime diagnostics check:

- `confirmCurrentSeason`;
- `editSeasonResults`;
- `getSeasonReviewIntegrity`;
- Confirm binding;
- Edit binding;
- Review self-integrity.

Dedicated workflow **Validate Season Review** protects:

- canonical max-11 preview scoring;
- canonical winner;
- preview timestamp remaining null;
- deterministic fingerprint;
- final-confirmation timestamp creation;
- changed/tampered snapshot rejection;
- Review path forbidden from persistence;
- Confirm path as the only persistence boundary;
- rollback preservation;
- no new review storage key;
- lazy Review CSS;
- responsive guards;
- revision-independent behavior checks.

Owner browser acceptance is still required before Workstream 5 is closed.

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
- **Season pre-commit Review / Confirm safeguard**;
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

Preserve centralized ordinary Back interception, advisory/bounded history, state-aware destination validation, critical write flush before navigation, failed critical flush blocking navigation, state-canonical routes, completed-showdown recovery and contextual optional-screen Back behavior.

No other module may manipulate `screenHistory` directly.

Settings does not enter route history. Season Review does not enter route history.

---

# Persistence architecture — locked

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Preserve immediate critical state saves, debounced/deduplicated drafts, lifecycle/route flushes, rollback on failed critical transitions, Legacy revision caching, idempotent completed-showdown archiving, failure-aware destructive actions, active completed save retained if Legacy sync fails, accurate failure messaging and isolated application preferences.

Statistics remain derived. Season Review remains ephemeral. Do not create persistence layers for either.

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
- `css/season.css`
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
- no Season Review localStorage write;
- bounded selectors/no framework;
- no core gameplay third-party data fetch.

---

# Release-cache architecture

`index.html` owns deployed runtime identity:

`<meta name="app-asset-revision" content="0.95.0-r9">`

All local shell asset references use that revision. Lazy assets derive the same revision through `getApplicationAssetRevision()`.

Never reuse a deployed revision after changing local runtime bytes.

Behavioral workstream gates must validate coherent current revision rather than hard-code one historical revision unless they explicitly test migration/history.

---

# Automated validation

Six exact-head GitHub Actions gates protect current v0.95:

1. **Validate Static App** — syntax, scoring/tiebreaks, routes, crests, Club Reveal, startup budget, centralized Back and responsive shell.
2. **Validate Home Bootstrap** — current Home IDs, exact seven media choices, selector/bindings/self-integrity and cache coherence.
3. **Validate Transfer Workstream** — accepted r5 Transfer dataset/state/selector/persistence contracts.
4. **Validate Settings Workstream** — accepted r6 preference/accessibility/reset-isolation contracts.
5. **Validate Statistics Workstream** — completed-history analytics fixtures, shared engine, lazy loading and route contracts.
6. **Validate Season Review** — r9 review snapshot, scoring/fingerprint, confirmation-only persistence, rollback and responsive contracts.

Machine validation does not prove visual quality. r9 still requires owner Chromebook/mobile acceptance.

---

# Remaining v0.95 roadmap

## Workstream 5 — current r9 browser gate

Use `NEXT_TASK.md` for the exact acceptance sequence. Fix any real Workstream 5 defect before advancing.

## Workstream 6 — final v0.95 polish/regression

Final accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and documentation synchronization.

Owner-requested quality-gated addition is now formally recorded in `ROADMAP_AMENDMENTS.md`:

### FIFA-era navigation feedback experiment

- super-smooth football-game-style route transition integrated with `js/screens.js`, not a second router;
- compositor-friendly transform/opacity rather than layout-heavy animation;
- short enough to improve polish without delaying navigation;
- critical writes/route validation always remain authoritative;
- stale callbacks/double-navigation blocked;
- reduced-motion bypass/simplification with no artificial wait;
- original/safely-created very short click cue, never copied EA/FIFA audio;
- explicit user-interaction only, no autoplay, no stacked sounds, no navigation dependency on audio;
- Chromebook/mobile real-device quality gate.

Per owner instruction, ship these feedback features only if they materially improve quality. If they introduce lag, choppiness, route risk or cheap/generic audio, simplify or omit them rather than degrading the application.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.

---

# Continuation rule

**Inspect current source → identify exact active workstream → implement root requirement without unrelated redesign → preserve accepted gameplay/state/persistence/performance contracts → machine-check exact head → owner-test browser behavior → synchronize project state → advance only when the current gate passes.**

Avoid planning loops, duplicate systems and reopening accepted work without a real regression.