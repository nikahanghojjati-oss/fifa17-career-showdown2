# Career Statistics · product truth

Authority: `main` product code plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`. The build must follow the contract where it intentionally replaces current local-history behaviour.

## Ids and routes

### Screen and entry points

- Screen id: `careerStatistics`.
- Screen factory: `createCareerStatisticsScreen()` in `js/statistics.js`.
- Renderer: `renderCareerStatistics(force = false)` in `js/statistics.js`.
- Public opener: `openCareerStatistics()` creates the screen, renders it, then calls `showScreen("careerStatistics")`.
- `js/screens.js` lists `careerStatistics` as a routable screen, considers it valid without an active Showdown, and calls `renderCareerStatistics()` before entry.
- Legal Back target: `SAFE_BACK_TARGETS.careerStatistics = ["mainMenu"]`. Shared `.backButton` delegation therefore returns this screen to Home / main menu.
- Top navigation contract: STATS opens `careerStatistics`; Rivalry Statistics is reached from inside Statistics.

### Stable ids

| Element | Id | Product dependency |
| --- | --- | --- |
| Career Statistics section | `careerStatistics` | route target used by `showScreen` / `screens.js` |
| Main dynamic content host | `careerStatisticsContent` | read by `renderCareerStatistics()` |
| Rivalry Statistics action | `careerStatisticsRivalryButton` | click opens current-rivalry statistics; renderer hides it when no `currentShowdown` |
| Trophy Room action | `careerStatisticsTrophyButton` | click calls `window.openOptionalModule("trophyRoom")`; Trophy Room can Back to Career Statistics |

### Product classes created on this screen

These are live presentation hooks emitted by `js/statistics.js`; the factory build may restyle them but must preserve the route / control ids above and equivalent semantic behaviour.

- Screen shell: `screen hidden analyticsScreen`
- Content: `analyticsContent`
- Actions: `dashboardActions`; buttons use `menuButton` and shared `backButton`
- Summary: `analyticsStatsGrid trophyRoomSummary`; cards use `analyticsStatCard`
- Empty / notice state: `analyticsEmpty`; unresolved-identity notice additionally uses `analyticsIdentityNotice`
- Career table: `careerStandings`, `careerStandingsRow`, header variant `careerStandingsRow header`
- Section headings: `analyticsSectionHeading`
- Manager comparison: `rivalryStatisticsHero`, `rivalryStatisticsOverview`, `rivalryStatisticsMatchup`, `rivalryManagerHero`, `analyticsClubName`, `rivalryHeroScore`, `comparisonTable`, `comparisonRow`, leader marker `comparisonLeader`
- Career leaders: `recordsGrid`, `recordCard`

### Route notes

- `careerStatistics` is allowed with or without an active Showdown.
- `CURRENT RIVALRY STATISTICS` is visible only when `currentShowdown` exists.
- `OPEN TROPHY ROOM` routes through the optional-module loader.
- Back is not a bespoke handler on this screen. The shared smart-back delegation intercepts `.backButton`; for Career Statistics the only legal target is `mainMenu`.
