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

## Live buttons and strings

Source: `main/js/statistics.js`. Text below is copied exactly from the live renderer. Dynamic text is shown as its template and the changing part is called out.

### Buttons

| Live text | Id / class | Behaviour | State |
| --- | --- | --- | --- |
| `CURRENT RIVALRY STATISTICS` | `#careerStatisticsRivalryButton.menuButton` | Calls `openRivalryStatistics()`. | Hidden when there is no `currentShowdown`; visible when one exists. |
| `OPEN TROPHY ROOM` | `#careerStatisticsTrophyButton.menuButton` | Calls `window.openOptionalModule("trophyRoom")`. | Always created. |
| `BACK TO MAIN MENU` | `.backButton` | Shared smart Back; legal target for this route is `mainMenu`. | Always created. |

There are no Career Statistics-specific `aria-label` strings on these buttons in `main`; their accessible names come from their visible text.

### Headings, labels and fixed visible strings

- `CAREER STATISTICS`
- `COMPLETED SHOWDOWNS`
- `SEASONS PLAYED`
- `CAREER POINTS`
- `TROPHIES WON`
- `CAREER TABLE`
- Career table headers: `#`, `Manager`, `Showdowns`, `Season W-D-L`, `Points`, `Trophies`
- `MANAGER COMPARISON`
- Hero score label: `SHOWDOWN POINTS`
- Manager comparison rows: `Showdown Wins`, `Showdown Win Rate`, `Season Wins`, `Career Points`, `Average Season Score`, `Best Season Score`, `Average League Points`, `Average League Goals`, `Perfect 11-Point Seasons`, `Transfer Signings`, `Signings Released`
- `CAREER LEADERS`
- Leader cards: `MOST SHOWDOWN WINS`, `MOST CAREER POINTS`, `MOST TROPHIES`, `MOST SEASON WINS`, `BEST AVG SEASON SCORE`, `BEST SEASON SCORE`
- Empty leader detail: `No completed record yet`
- Fallback manager detail: `Unknown Manager`
- Fallback club text used by the shared manager hero: `Club`
- Average / score suffix used by leader cards: ` pts`

### State-dependent live strings

- No managers and no identity warning: `Career Statistics will build automatically after the first completed showdown. Current-showdown statistics remain available from Showdown Home.`
- Unresolved role notice, exact live template:
  `${unresolved} historical manager role${unresolved === 1 ? " remains" : "s remain"} unresolved. ${unresolved === 1 ? "It is" : "They are"} excluded from longitudinal manager totals and leaderboards until explicitly linked to Local Profiles. Overall Showdown, season, points, trophies and season records remain complete.`
- Comparison title: `${one.name} vs ${two.name}`
- Comparison meta: `${analytics.totals.showdowns} completed showdown${analytics.totals.showdowns === 1 ? "" : "s"}`
- Manager hero sublabel: `${manager.showdownWins} showdown win${manager.showdownWins === 1 ? "" : "s"}`
- Career table W-D-L strings are generated as `${wins}-${draws}-${losses}`.

### Live state gaps

The current `main` implementation is synchronous local-history presentation. It does not provide Career Statistics-specific visible strings for provider `loading`, provider `unavailable`, provider `partial` coverage, or provider read errors. Those are contract states handled in the next sections; they must not be filled with invented old-product copy.
