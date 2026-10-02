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
