# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Runtime asset revision:** `0.95.0-r7`  
**Current phase:** Workstream 4 Career Statistics browser acceptance  
**Owner-accepted gates:** `0.95.0-r4`, `0.95.0-r5`, `0.95.0-r6`  
**Next after r7 acceptance:** Workstream 5 — Season pre-commit review

## Development entry point

The project design phase is complete. Do not restart planning or replace established architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact implementation, locked rules, architecture and roadmap status.
2. `ROADMAP_AMENDMENTS.md` — later owner-approved requirements.
3. `NEXT_TASK.md` — current browser gate and exact next workstream.
4. `CHANGELOG.md` — implementation/stabilization history.
5. `THIRD_PARTY_NOTICES.md` — intentional external font/media source/license notes.
6. current source — highest authority for implemented behavior.
7. original Project Bible — blueprint where later decisions/current source have not intentionally superseded it.

The release path remains **v0.95 → v1.0**.

---

## Current r7 — Main Menu Statistics alignment

The Home information architecture now matches the intended blueprint without adding another analytics engine or another Home row.

The former top-level Trophy Room tile is now **STATISTICS**.

The analytics surfaces have clear responsibilities:

- **Career Statistics** — permanent all-time career data from completed showdowns; Home destination.
- **Rivalry Statistics** — statistics for the currently loaded showdown only; contextual Showdown Home destination.
- **Trophy Room** — detailed honours cabinets and all-time records; accessible from Career Statistics and completed Showdown Home.

All three use the established `js/analytics.js` calculation engine.

### Career Statistics content

Career Statistics currently renders:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won;
- Career Table;
- two-manager comparison when completed history contains exactly two manager identities;
- Career Leaders;
- Current Rivalry bridge when a showdown is loaded;
- Trophy Room bridge;
- clean empty state before any completed showdown exists.

Career statistics are derived from completed history at read time. No statistics storage key was introduced.

### Lightweight analytics loading

The Home Statistics tile does not wake the gameplay runtime.

Opening Career Statistics lazy-loads:

- `css/analytics.css`
- `js/analytics.js`
- `js/statistics.js`

Opening Trophy Room then adds only:

- `js/trophyRoom.js`

Analytics/Statistics/Trophy assets remain outside the initial Home bundle.

### Navigation

Central routing remains owned by `js/screens.js`.

- Career Statistics → Back → Home.
- Rivalry Statistics → Back → Showdown Home / Home.
- Trophy Room opened from Career Statistics → Back returns to Career Statistics through route history.
- Trophy Room opened from completed Showdown Home → Back returns to Showdown Home.

Read-only analytics routes are not gameplay-runtime routes.

---

## Accepted r6 — Settings / motion accessibility

Settings remains a lazy modal rather than a new route.

It provides:

- application/build information;
- **Follow Device** / **Reduce Motion** preference;
- safe access to existing Legacy Data Management.

Application preferences use:

`careerModeShowdown.preferences`

A system/browser reduced-motion request always wins. The preference survives Showdown-data reset.

Effective reduced motion also controls JavaScript timing:

- League Wheel standard: 4000 ms + 700 ms advance;
- League Wheel reduced: 80 ms + 120 ms advance;
- Club Reveal skips theatrical stage waits after the permanent pair is safely persisted.

No gameplay transaction changes under reduced motion.

---

## Accepted r5 — phased Transfer Challenge

Competition rules remain unchanged:

**15-minute Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Accepted r5 includes:

- persistent Transfer sub-phases;
- save/rollback at critical transitions;
- debounced active-phase drafts;
- old-save migration;
- 36 historical FIFA 17 Transfer League options;
- 164 FIFA 17 player nationalities;
- searchable controlled selectors;
- canonical-ID RELEASE/SAFE evaluation;
- one persisted deadline / one visible timer loop maximum.

Transfer metadata remains separate from the five-league Showdown Wheel.

---

## Accepted r4 — FIFA-era presentation / Club Reveal

Preserve:

- fallback-safe Barlow Condensed display hierarchy;
- original deterministic procedural crest identities for all 98 Showdown clubs;
- exactly two sealed Showdown packs;
- save-before-reveal and rollback;
- permanent no-reroll club pair;
- `Clubs Assigned` confirmation checkpoint;
- explicit Rivalry Confirmation;
- Chromebook/mobile presentation.

No official club badge images/vector paths or proprietary FIFA/EA font files are bundled.

---

## Locked competition rules

- Exactly two managers, one device/browser in v1.
- Same selected league, two different permanent clubs.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings each, three opponent guesses, League or Nationality, correctly guessed signing must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: **11**.
- Equal non-zero scores are a draw.
- Only 0-0 uses league position, then league points.

---

## Current feature set

- New/resumable showdowns
- five-league League Wheel
- permanent same-league Club Assignment
- 98 original procedural club identities
- two-pack Club Reveal / Rivalry Confirmation
- Showdown Home
- phased Transfer Challenge
- canonical FIFA 17 Transfer selectors
- Season Results / automatic scoring
- Season Summary / multi-season progression
- completed-showdown recovery hub
- Legacy history / Data Management
- Career Statistics
- current Rivalry Statistics
- Trophy Room
- Rule Book
- Settings / persistent motion accessibility
- lazy soundtrack/trailer media
- centralized state-aware Back navigation
- runtime diagnostics
- Chromebook/laptop/mobile responsive presentation

---

## Performance contract

Initial local runtime remains exactly:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

CI enforces one initial local stylesheet, seven initial JavaScript files, no eager gameplay/analytics/Settings package and a 145 KB local startup-asset ceiling.

Menu media still creates no iframe until the user presses Play.

---

## Reliability contract

Preserve:

- one-pair/no-reroll Club Assignment;
- save-before-reveal rollback;
- refresh/Continue same-pair recovery;
- explicit Transfer Window → Guess → Signing → Completed phases;
- canonical Transfer values and verdicts;
- critical Transfer save/rollback;
- debounced/deduplicated drafts;
- persisted Transfer deadline;
- centralized state-aware Back routing;
- completed-showdown recovery;
- isolated Settings preferences;
- one analytics engine;
- derived/read-only career analytics;
- shell-owned asset revision;
- stale async-operation identity guards;
- reduced-motion behavior;
- Chromebook/mobile viewport guards.

---

## Automated validation

Four GitHub Actions gates protect r7:

- **Validate Static App** — syntax, scoring, route matrix, Club Assignment, original crests, startup budget, Back authority and responsive shell.
- **Validate Transfer Workstream** — accepted r5 Transfer state/data/selectors.
- **Validate Settings Workstream** — accepted r6 preference/accessibility/reset isolation.
- **Validate Statistics Workstream** — executable completed-history analytics fixtures plus r7 lazy/shared-analytics/navigation architecture.

Automated checks do not replace owner Chromebook/mobile acceptance. See `NEXT_TASK.md` for the r7 browser checklist.

---

## Remaining release path

1. **Workstream 4 — current r7 Career Statistics browser acceptance**
2. **Workstream 5 — Season pre-commit review**
3. **Workstream 6 — final v0.95 accessibility/responsive/performance/regression pass**
4. **v1.0 Complete Release Candidate / Final Release**

---

## Fan-project / legal presentation

Career Mode Showdown is a personal fan project and is not affiliated with or endorsed by EA SPORTS, FIFA, football leagues, clubs, artists or rights holders.

The interface uses original design work inspired by mid-2010s football-game presentation. Official club badges, proprietary FIFA fonts and copied FUT/menu artwork are not bundled. Barlow is separately licensed under SIL Open Font License 1.1 and requested externally with system fallbacks. Club crests are original procedural SVG compositions. Menu songs/trailer are user-initiated YouTube embeds rather than copied media files.

See `THIRD_PARTY_NOTICES.md` for source/license notes.