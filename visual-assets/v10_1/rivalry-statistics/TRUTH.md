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


## Data contract

Binding source: `project-documents/factory/DATA_CONTRACT_V1.md` §0 and §5 (agreed with Team G). Manager roles map `playerOne → daniel` and `playerTwo → nik`; Daniel is always first/left.

E = exists on `main` now. A = Team G / integration work still has to add or wire it.

| Contract field | E/A | Source on `main` | Level | Factory use |
| --- | --- | --- | --- | --- |
| `status` | contract state | DATA_CONTRACT_V1 §0; adapter state around provider/current data | screen read | One of `loading`, `empty`, `unavailable`, `partial`, `ready`. |
| `coverage` | contract state support | DATA_CONTRACT_V1 §0 | screen read | Required when `status="partial"`; never call partial data all-time/career-complete. |
| `interimLabel` | contract state support | DATA_CONTRACT_V1 §0 | screen read | Exact interim copy: `Current Showdown only. Career history is not yet available.` |
| `leagueId` | E | current Showdown/shared setup; `js/sharedHistoryConvergence.js` `hcBuild()` returns projection `leagueId` | per Showdown | League identity; fixture values only from the five contract ids. |
| `clubs.daniel`, `clubs.nik` | E | current `showdown.clubs.playerOne/playerTwo`; `buildRivalryManagerStats()` in `js/analytics.js` also attaches the manager club | per Showdown | Text club names plus our original code-drawn crests. |
| `season` | E | current round / shared multi-season cursor on `main` | per Showdown current state | Current season number. |
| `totalSeasons` | E | shared setup `totalSeasons`; `js/sharedHistoryConvergence.js` `hcBuild()` | per Showdown | Only 1, 3, 5 or 10. |
| `score.daniel`, `score.nik` | E | accumulated canonical season scores; `js/sharedHistoryConvergence.js` `hcAccumulate()` → `managerRecords.*.totalPoints`; legacy renderer also derives totals through `buildRivalryManagerStats()` | per Showdown | Current Showdown point totals. |
| `managerRecords.daniel.seasonWins` / `.nik...` | E | `js/sharedHistoryConvergence.js` `hcAccumulate()` | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.seasonDraws` | E | same | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.seasonLosses` | E | same | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.championsLeagues` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.leagueTitles` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.domesticCups` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.totalTrophies` | E | `js/sharedHistoryConvergence.js` `hcFinalize()` | per Showdown aggregate | Sum of the three recorded trophy wins. |
| `managerRecords.*.hundredPointSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Recorded threshold occurrence count. |
| `managerRecords.*.hundredGoalSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Recorded threshold occurrence count. |
| `managerRecords.*.topScorerSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Yes/no per season accumulated to a count; no player name. |
| `managerRecords.*.topAssistSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Yes/no per season accumulated to a count; no player name. |
| `managerRecords.*.perfectSeasons` | E | `hcAccumulate()` when canonical season score is 11 | per Showdown aggregate | Perfect-season count. |
| `managerRecords.*.bestSeasonScore` | E | `hcAccumulate()` | per Showdown aggregate | Best canonical season score. |
| `seasons[].season` | E | `seasonHistory[].roundNumber` from `js/sharedHistoryConvergence.js` `hcBuild()`; legacy `buildRivalryAnalytics()` maps `round.roundNumber` | per season | Display season number. |
| `seasons[].score.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.scoring.total`; legacy `getAnalyticsScoring()` | per season | Canonical computed score, max 11. |
| `seasons[].winner` | E | canonical `seasonHistory[].winner` from `hcScoring()` / `hcBuild()` | per season | Adapter maps `playerOne` → `daniel`, `playerTwo` → `nik`, `draw` → draw. |
| `seasons[].leaguePosition.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leaguePosition` | per season | Position within league team count. |
| `seasons[].leaguePoints.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leaguePoints` | per season | 0..(teams−1)×6. |
| `seasons[].leagueGoals.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leagueGoals` | per season | 0..300. |
| `transfers.status` | A (G-10) | no model-true Rivalry Statistics adapter yet | transfer read | Same five-state vocabulary; transfer failure must not zero or block non-transfer stats. |
| per-season transfer guess/signing summary | A (G-10) | Transfer War data exists elsewhere on `main`, but the agreed history projection/adapter is not yet delivered | per season | Show only when transfer history is actually available. |
| provider-state adapter for this screen | A (G-5) | `js/productionSharedHistoryConvergence.js` already reads provider-backed converged history and exposes `getState()`; Rivalry Statistics still renders from local `currentShowdown` | screen adapter | Job 104 later replaces sample fixtures with model-true fixtures / provider view-model data. |

### Contract states

The factory build must design exactly these five top-level read states:

1. `loading`
2. `empty` — a successful read for a new career / nothing recorded yet
3. `unavailable` — the read failed; never represent it as empty or all-zero
4. `partial` — some Showdowns/read segments are unavailable; show `coverage`
5. `ready`

Transfers independently carry `transfers.status` using the same five values. A transfer read failure never blocks the points, season or trophy sections and never renders transfer signings as zero.

Before provider career history is real, owner-review previews may carry only this exact interim label:

`Current Showdown only. Career history is not yet available.`

### Contract-enforced drops from the current `main` renderer

DATA_CONTRACT_V1 says anything not listed for this screen is dropped. Therefore the factory screen must not preserve these current `main` rows/tiles as standalone stats:

- `Performance Bonuses`
- `Awards Bonuses`
- `Average Season Score`
- `Best League Points`
- `Best League Goals`
- `Signings Released` / `RELEASED SIGNINGS`

`Transfer Signings` survives only through the contract transfer summary and only when `transfers.status` makes that history available.

DATA_CONTRACT_V1 §9 also forbids clean sheets, biggest single-match win, non-Champions-League European wins, player names, player-based leaders/photos, match-by-match results, possession and any per-match stat. Top scorer and top assist are boolean season achievements, never player names.
