# Rivalry Statistics · product truth

Authority: `main` product code plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`.
This sheet describes the build target for factory jobs. Where the current `main` renderer exposes fields outside DATA_CONTRACT_V1 §5, the contract wins for the factory screen.

## Ids and routes

### Screen creation and render

Source: `main/js/statistics.js`.

- `createStatisticsScreen()` lazily creates `section#statistics.screen.hidden.analyticsScreen`.
- The screen heading is `RIVALRY STATISTICS`.
- `div#rivalryStatisticsContent.analyticsContent` is the render mount used by `renderRivalryStatistics()`.
- `openRivalryStatistics()` requires `currentShowdown`, creates the screen, renders it, then calls `showScreen("statistics")`.
- `getRivalryStatisticsRenderKey()` keys rerenders from `currentShowdown.id`, `updatedAt`, `status`, and the rounds length.

### Inbound routes

Source: `main/js/optionalModules.js`, `main/js/statistics.js`, and `main/js/showdownUI.js`.

- Active Showdown / dashboard: `ensureStatisticsDashboardButtonShell()` creates `button#rivalryStatisticsButton.menuButton` labelled `RIVALRY STATISTICS`; `initializeOptionalModules()` binds it to `openOptionalModule("statistics")`, which lazy-loads and calls `openRivalryStatistics()`.
- Career Statistics: `button#careerStatisticsRivalryButton.menuButton` is labelled `CURRENT RIVALRY STATISTICS` and calls `openRivalryStatistics()` when `currentShowdown` exists.
- Completed Showdown hub: the `RIVALRY STATISTICS` completion action calls `openOptionalModule("statistics")`.

### Back route

Source: `main/js/statistics.js` and `main/js/screens.js`.

- The screen creates a class-only `button.backButton` with visible text `BACK TO SHOWDOWN HOME`; it has no dedicated id.
- `initializeSmartBackDelegation()` captures clicks on `.backButton` and calls `navigateBackSmart()`.
- `SAFE_BACK_TARGETS.statistics` is `["dashboard", "mainMenu"]`. Screen history is preferred when legal; otherwise the first legal valid fallback is used.
- `statistics` itself is route-valid only when a Showdown exists.

### Stable ids and classes used by product code / styling

Ids:
- `statistics`
- `rivalryStatisticsContent`
- inbound `rivalryStatisticsButton`
- inbound `careerStatisticsRivalryButton`

Classes created or consumed by the live Rivalry Statistics renderer:
- `screen hidden analyticsScreen`
- `analyticsContent`
- `analyticsActions`
- `backButton`
- `rivalryStatisticsHero`
- `rivalryStatisticsOverview`
- `rivalryStatisticsMatchup`
- `rivalryManagerHero`
- `analyticsClubName`
- `rivalryHeroScore`
- `analyticsSectionHeading`
- `analyticsStatsGrid`
- `analyticsStatCard`
- `comparisonTable`
- `comparisonRow`
- `comparisonLeader`
- `seasonProgressionList`
- `seasonProgressionRow`
- `seasonProgressionLabel`
- `seasonStatSide` and modifier `right`
- `seasonStatTop`
- `seasonPointTrack`
- `seasonPointFill`
- `analyticsEmpty`

The factory build may restyle these, but must preserve route and test-critical ids and equivalent semantics.


## Buttons and visible strings on `main`

Source: `main/js/statistics.js`, `main/js/screens.js`, and the lazy-entry notice in `main/js/optionalModules.js`.

### Buttons

| Control | Exact visible text | Behaviour |
| --- | --- | --- |
| Screen Back button | `BACK TO SHOWDOWN HOME` | Class `.backButton`; smart Back resolves to the active Showdown dashboard when valid, otherwise Main Menu. |

There are no other module-local buttons created inside `#statistics` on `main`. The shared factory top bar is a separate component (job 125), not a string invented by this screen.

### Static strings copied exactly from live code

- `RIVALRY STATISTICS`
- `BACK TO SHOWDOWN HOME`
- `SHOWDOWN POINTS`
- `RIVALRY TOTALS`
- `SEASONS COMPLETED`
- `TROPHIES WON`
- `TRANSFER SIGNINGS`
- `RELEASED SIGNINGS`
- `PERFECT SEASONS`
- `11-point seasons`
- `HEAD-TO-HEAD`
- `Showdown Points`
- `Season Wins`
- `Season Draws`
- `Total Trophies`
- `Champions Leagues`
- `League Titles`
- `Domestic Cups`
- `Performance Bonuses`
- `Awards Bonuses`
- `100-Point Seasons`
- `100-Goal Seasons`
- `Top Scorer Seasons`
- `Top Assist Seasons`
- `Perfect 11-Point Seasons`
- `Average Season Score`
- `Best Season Score`
- `Best League Points`
- `Best League Goals`
- `Transfer Signings`
- `Signings Released`
- `SEASON-BY-SEASON`
- `No season has been completed yet. Statistics will build automatically as seasons are finished.`
- `No active showdown is available.`
- `League not selected`
- `Club`
- `Draw`

The lazy-entry guard outside the screen can show the exact notice `No active showdown is available for Rivalry Statistics.` when a Rivalry Statistics route is requested without an active Showdown.

### State-dependent / templated live strings

- Showdown title: `analytics.showdown.name`.
- Overview meta: `{league name} · {showdown status}`; league fallback is exactly `League not selected`.
- Manager names, current club names and Showdown point totals are live values.
- Rivalry total progress subtext: `of {totalRounds}`.
- Season label: `SEASON {season}`.
- Season winner text: `{manager name} won`, or exactly `Draw`.
- Season point values are live computed scores; the bar width is score / 11.

### Accessibility text

`prepareScreenAccessibility("statistics", ...)` assigns the heading id `statisticsScreenTitle`, gives it `tabindex="-1"`, and sets `#statistics[aria-labelledby="statisticsScreenTitle"]`. The Back button has no separate `aria-label`; its accessible name is its visible text. The live Rivalry Statistics renderer defines no other module-specific aria-label strings.

### Important live-versus-contract note

This section records what `main` currently writes. DATA_CONTRACT_V1 §5 is stricter. Step 3 below defines the factory field set and therefore which of these live stat labels survive the new screen.
