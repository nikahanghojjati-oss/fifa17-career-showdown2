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
| Accessible screen title | `careerStatisticsScreenTitle` | assigned by `prepareScreenAccessibility()` to the screen `h2`; used by `aria-labelledby` and route focus |
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
- Central navigation assigns the `h2` id `careerStatisticsScreenTitle`, `tabindex="-1"` and `data-route-focus-target="true"`, then sets the section `aria-labelledby="careerStatisticsScreenTitle"`.

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

## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md` §6 Career Statistics, including its "What counts" table; global state and bounds come from §0. Contract §9 defines stats that are never recorded. The E/A value below follows the contract, not whether a similarly named local-only field happens to exist in today's analytics object.

### Career fields

| Contract field | E/A | Source / analogue on `main` | Level | Product note |
| --- | --- | --- | --- | --- |
| `managers.{daniel,nik}.seasonWins` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Counts accepted season wins. |
| `managers.{daniel,nik}.seasonDraws` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Counts accepted season draws. |
| `managers.{daniel,nik}.seasonLosses` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Counts accepted season losses. |
| `managers.{daniel,nik}.championsLeagues` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Count of Champions League wins. |
| `managers.{daniel,nik}.leagueTitles` | A | `accumulateRoundStats()`, `js/analytics.js` | career | League position 1. |
| `managers.{daniel,nik}.domesticCups` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Count of domestic cup wins. |
| `managers.{daniel,nik}.totalTrophies` | A | `finalizeManagerCareerStats()`, `js/analytics.js` | career | `leagueTitles + domesticCups + championsLeagues`. |
| `managers.{daniel,nik}.hundredPointSeasons` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Seasons with league points ≥ 100. |
| `managers.{daniel,nik}.hundredGoalSeasons` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Seasons with league goals ≥ 100. |
| `managers.{daniel,nik}.topScorerSeasons` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Counts boolean `topScorer` season flags, never player names. |
| `managers.{daniel,nik}.topAssistSeasons` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Counts boolean `topAssist` season flags, never player names. |
| `managers.{daniel,nik}.perfectSeasons` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Season score exactly 11. |
| `managers.{daniel,nik}.bestSeasonScore` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Best computed season score. |
| `managers.{daniel,nik}.careerPoints` | A | local analogue `totalPoints` in `createManagerCareerStats()` / `accumulateRoundStats()`, `js/analytics.js` | career | Sum of counted season scores; contract name is `careerPoints`. |
| `managers.{daniel,nik}.seasons` | A | `createManagerCareerStats()` / `accumulateRoundStats()`, `js/analytics.js` | career | Counted accepted seasons. |
| `managers.{daniel,nik}.averageSeasonScore` | A | `finalizeManagerCareerStats()`, `js/analytics.js` | career | Combined sum / combined season count, never average of averages. |
| `managers.{daniel,nik}.averageLeaguePoints` | A | `finalizeManagerCareerStats()`, `js/analytics.js` | career | Combined league-point sum / seasons. |
| `managers.{daniel,nik}.averageLeagueGoals` | A | `finalizeManagerCareerStats()`, `js/analytics.js` | career | Combined league-goal sum / seasons. |
| `managers.{daniel,nik}.bestLeaguePoints` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Best single accepted season league points. |
| `managers.{daniel,nik}.bestLeagueGoals` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Best single accepted season league goals. |
| `managers.{daniel,nik}.bestLeaguePosition` | A | `accumulateRoundStats()`, `js/analytics.js` | career | Lowest numeric finishing position. |
| `managers.{daniel,nik}.performanceBonuses` | A | `accumulateRoundStats()` using computed scoring, `js/analytics.js`; scoring source `calculatePlayerSeasonScore()`, `js/scoring.js` | career | One performance bonus max per season. |
| `managers.{daniel,nik}.awardsBonuses` | A | `accumulateRoundStats()` using computed scoring, `js/analytics.js`; scoring source `calculatePlayerSeasonScore()`, `js/scoring.js` | career | One awards bonus max per season. |
| `showdowns.{daniel,nik}.completed` | A | local analogue `stats.showdowns` in `calculateCareerAnalytics()`, `js/analytics.js` | career / completed Showdowns | Closed with verified Terminal Close only for outcome accounting. |
| `showdowns.{daniel,nik}.wins` | A | local analogue `showdownWins` in `calculateCareerAnalytics()`, `js/analytics.js` | career / completed Showdowns | Completed Showdowns only. |
| `showdowns.{daniel,nik}.draws` | A | local analogue `showdownDraws` in `calculateCareerAnalytics()`, `js/analytics.js` | career / completed Showdowns | Completed Showdowns only. |
| `showdowns.{daniel,nik}.losses` | A | local analogue `showdownLosses` in `calculateCareerAnalytics()`, `js/analytics.js` | career / completed Showdowns | Completed Showdowns only. |
| `biggestShowdownWin.manager` | A | local analogue `findBiggestShowdownMargin()`, `js/analytics.js` | career record | Contract carries the winning manager role, not free-form player identity. |
| `biggestShowdownWin.margin` | A | local analogue `findBiggestShowdownMargin()`, `js/analytics.js` | per Showdown record / career leader | Absolute Showdown-points margin. |
| `biggestShowdownWin.showdownRef` | A | no exact field on `main`; local analogue records the Showdown name in `findBiggestShowdownMargin()`, `js/analytics.js` | per Showdown record / career leader | Team G provides the stable Showdown reference. |
| `coverage.readable` | A | no provider-history equivalent on `main` | career read state | Number of readable indexed Showdowns. |
| `coverage.indexed` | A | no provider-history equivalent on `main` | career read state | Number of indexed Showdowns considered. |

Managers are keyed by role only: `playerOne → daniel` and `playerTwo → nik`. Daniel is always the first / left presentation.

### Showdown outcome field shape

Keep the contract/fixture shape nested by manager role: `showdowns.daniel.completed`, `showdowns.daniel.wins`, `showdowns.daniel.draws`, `showdowns.daniel.losses`, with the same four fields under `showdowns.nik`. In particular, `showdowns.daniel.wins` stays exactly in that shape; do not flatten or rename it. Trophy Room is being aligned to the same nested outcome shape.

### What counts

From DATA_CONTRACT_V1 §6:

| Showdown state | Seasons count toward career totals | Showdown outcome counts |
| --- | --- | --- |
| Pending pairing | no | no |
| Active | accepted / acknowledged seasons only | no |
| Final result reconciled, Terminal Close pending | all accepted seasons | no; it is a `completion-pending` result |
| Closed with verified Terminal Close | all accepted seasons | exactly one |
| Abandoned (closed without Terminal Close) | none, including seasons shown before | none; History row only |
| Unreadable | nothing invented | nothing; screen goes `partial` |

Abandoned Showdowns count for nothing; abandoning rebuilds the whole model (records, bests, averages, trophies), not a subtraction.

### Contract screen states

The Career Statistics view model uses exactly one of these five states:

- `loading`: provider history read is in progress.
- `empty`: read succeeded and there is no career history yet.
- `unavailable`: provider history read failed. Never render zeroes as if they were real.
- `partial`: some Showdowns are unreadable. Show `coverage.readable` of `coverage.indexed`; do not label the result "all-time" or "career" without the coverage qualification.
- `ready`: the indexed career history needed for the screen is readable.

For an owner-review interim build before provider history is real, the only permitted interim label is exactly:

`Current Showdown only. Career history is not yet available.`

It is not a launch state.

### Provider-state copy

These strings are factory copy because current `main` has no provider-history wording for these states. Each entry has `source: "new"`.

| State | Heading | Body | Source |
| --- | --- | --- | --- |
| `loading` | `LOADING CAREER HISTORY` | `Loading career history…` | `new` |
| `partial` | `PARTIAL CAREER HISTORY` | `Some Showdowns could not be read. Statistics below use readable Showdowns only.` | `new` |
| `unavailable` | `CAREER HISTORY UNAVAILABLE` | `Career history could not be loaded. No statistics are being shown.` | `new` |

The partial state must also show the existing coverage line `{READABLE} of {INDEXED} Showdowns readable` directly with the partial heading/body.

### Fields from current `main` that do not survive this contract

These currently rendered Career Statistics fields are not listed in contract §6 and therefore are dropped from the factory screen:

- `showdownWinRate` / visible row `Showdown Win Rate`
- transfer `signings` / visible row `Transfer Signings`
- transfer `releasedSignings` / visible row `Signings Released`
- the local identity-link warning / Local Profiles notice, because the contract keys managers directly by `daniel` and `nik` role

Contract §9 also drops, everywhere: clean sheets, biggest single-match win, European wins other than Champions League wins, player names, player-based leaders or photos, match-by-match results, possession and all per-match stats. `topScorer` and `topAssist` remain yes/no season achievements, never player-name stats.

### Presentation decision for headline tiles

The old combined summary values are not separate contract fields. The new screen may still present sums derived only from the contracted Daniel and Nik values, but any such tile must be explicitly labelled `Together`. Where a number is manager-specific, the screen shows Daniel first / left and Nik second / right rather than implying one anonymous career total.

## Screen states and preview frames

Career Statistics is a career-history view. The screen state comes from DATA_CONTRACT_V1 §0, not from one Showdown's lifecycle or from which manager is viewing.

| State | Meaning | Rendering rule |
| --- | --- | --- |
| `loading` | Provider career-history read is in flight. | Show the stable Career Statistics shell and manager order only; never show placeholder zeroes as facts. |
| `empty` | Read succeeded and there is no counted career history yet. | New-career treatment. Daniel remains first/left and Nik second/right; no leader is invented. |
| `partial` | Some indexed Showdowns are unreadable. | Show only readable aggregates plus a visible `coverage.readable` of `coverage.indexed` line; avoid unqualified "all-time" / complete-career claims. |
| `unavailable` | Provider read failed. | Honest unavailable treatment; no career value is rendered as zero just because the read failed. |
| `ready` | Required indexed history is readable. | Render the full contracted career comparison and leaders. |

There is no sixth contract `error` state: a history read failure maps to `unavailable`.

There is no Career Statistics `active` or `completed` screen state. Active / completion-pending / completed are source-Showdown conditions governed by the "What counts" rules above.

There is no Daniel-view versus Nik-view data variant. Viewer role does not reorder the comparison: `daniel` is always first/left and `nik` always second/right.

### Career Table order and rank

Career Table presentation order is fixed: Daniel's row is always first and Nik's row is always second, matching the product-wide manager order. The `#` cell shows each manager's actual career rank; it does not become the row index. Preserve the live `main/js/analytics.js` ranking rule for this table: Showdown wins first, then total trophies, then career points. Therefore a Nik-leading frame still renders Daniel first with `#2`, then Nik with `#1`. `expectedCareerTableRows` in fixtures is a presentation test oracle, not a provider field.

### Final comparison rows

The rebuilt comparison uses only contract-backed fields and keeps Daniel on the left:

1. `LEAGUE TITLES` → `leagueTitles`
2. `DOMESTIC CUPS` → `domesticCups`
3. `CHAMPIONS LEAGUE WINS` → `championsLeagues`
4. `SEASON WINS` → `seasonWins`
5. `AVERAGE LEAGUE POINTS` → `averageLeaguePoints`
6. `AVERAGE LEAGUE GOALS` → `averageLeagueGoals`

This replaces mockup rows for European wins, clean sheets and biggest single-match win, and also removes current-main comparison rows that are not in contract §6.

### Career Leaders categories

Career Leaders are manager records, never player records or player photos. Allowed cards are derived from the contracted fields:

- `MOST SEASON WINS` → max `seasonWins`
- `MOST TROPHIES` → max `totalTrophies`
- `MOST CAREER POINTS` → max `careerPoints`
- `BEST SEASON SCORE` → max `bestSeasonScore`
- `HIGHEST LEAGUE POINTS` → max `bestLeaguePoints` (best single season; live label from `js/trophyRoom.js`)
- `MOST LEAGUE GOALS` → max `bestLeagueGoals`
- `BIGGEST SHOWDOWN WIN` → `biggestShowdownWin`

Ties are shown as shared manager leadership. Cards use the manager portrait crop from this screen's approved plate, or an original club crest plus initials. No player imagery is permitted.

### Preview frames

- `CS1` · `ready` · several Showdowns. Fictional but internally coherent career history, Daniel first/left and Nik right, all comparison rows and Career Leaders populated.
- `CS2` · `empty` · new career. Successful read with no counted history; no leader or zero-filled fake career table is invented.
- `CS3` · `partial` · readable-history values plus visible coverage note. Example fixture coverage is `3 of 4 Showdowns readable`.
- `CS4` · `unavailable` · provider history cannot be read; no numeric values are presented as facts.
- `CS5` · `loading` · added because `loading` is a distinct required contract state even though the job's four named frames omit it. Reserve the layout with Daniel first and Nik second, but show no fake data.
- `CS6` · `ready` · Nik leads the career ranking. Daniel's row still renders first with `#2`; Nik renders second with `#1`, proving that presentation order never flips.

If owner review temporarily uses current-Showdown-only data before provider career history exists, the only permitted interim copy is exactly `Current Showdown only. Career history is not yet available.` That interim mode is not a launch state.

## Mockup reconciliation

The mockup is visual reference, not product authority. PRODUCT_TRUTH.md, DATA_CONTRACT_V1.md and the live route/button behaviour on `main` win wherever they disagree.

| Mockup element | Product answer |
| --- | --- |
| Career Statistics title / data-screen composition | KEEP as visual direction. Use the live title `CAREER STATISTICS`. |
| Daniel / Nik comparison | KEEP, with Daniel always first/left and Nik second/right. Never mirror either character. |
| Headline statistic tiles | KEEP the hierarchy, but values must be contract-backed. `COMPLETED SHOWDOWNS` may be clearly labelled `Together`; per-manager `SEASONS PLAYED`, `CAREER POINTS` and `TROPHIES WON` show Daniel and Nik separately rather than one ambiguous number. |
| League titles comparison | KEEP with contract field `leagueTitles`. |
| Domestic cups comparison | KEEP with contract field `domesticCups`. |
| `EUROPEAN WINS` | CHANGE to `CHAMPIONS LEAGUE WINS` and use only `championsLeagues`. Other European wins are not recorded. |
| League points comparison | CHANGE to `AVERAGE LEAGUE POINTS` using `averageLeaguePoints`, the contracted career field that matches the current live comparison. |
| League goals comparison | CHANGE to `AVERAGE LEAGUE GOALS` using `averageLeagueGoals`, the contracted career field that matches the current live comparison. |
| Season wins comparison | KEEP with `seasonWins`. |
| `CLEAN SHEETS` | DROP. The game never records clean sheets. |
| `BIGGEST WIN` when it means a single match | DROP. The game records no match-by-match results. The separate contracted `BIGGEST SHOWDOWN WIN` may appear only as a Career Leader record based on Showdown-points margin. |
| Comparison bars | KEEP the visual idea. Daniel uses the Daniel shared-token accent on the left; Nik uses the Nik shared-token accent on the right. |
| Career Leaders section | KEEP, but leaders are managers, never players. |
| Player portrait / player-card treatment in Career Leaders | CHANGE to the leading manager portrait crop from this screen's approved plate, or an original club crest plus initials. No player photos. |
| `Cian Cheets` | DROP. It is a typo and an unrecorded/player-style stat. |
| Most season wins leader | KEEP as `MOST SEASON WINS`. |
| Most trophies leader | KEEP as `MOST TROPHIES`. |
| Career points leader | KEEP as `MOST CAREER POINTS`. |
| Best season score leader | KEEP as `BEST SEASON SCORE`. |
| League-points record | KEEP as `HIGHEST LEAGUE POINTS` (live `js/trophyRoom.js` label) using contracted `bestLeaguePoints`; it is a best single season, not a total. |
| League-goals record | KEEP as `MOST LEAGUE GOALS` using contracted `bestLeagueGoals`. |
| Biggest Showdown margin record | KEEP as `BIGGEST SHOWDOWN WIN` using contracted `biggestShowdownWin`. |
| Player names as statistical leaders | DROP. Top scorer / top assist are yes/no season achievements, not recorded player identities. |
| Real club crests / league logos / trophies / player imagery | CHANGE to original Showdown art only; no real crests, league logos, trophies or players. |
| Manager names, scores, totals, stat values or coverage baked into art | CHANGE to live DOM text from the view model / fixtures. |
| `CURRENT RIVALRY STATISTICS` button | KEEP with live wording and behaviour; hide only when no `currentShowdown` exists. |
| `OPEN TROPHY ROOM` button | KEEP with live wording and optional-module route. |
| `BACK TO MAIN MENU` button | KEEP with live wording and shared Smart Back to `mainMenu`. |
| Any extra mockup button with no live product behaviour | DROP. |
| Complete-career / all-time implication | KEEP only in `ready`. CHANGE in `partial` to show coverage such as `3 of 4 Showdowns readable`; never imply complete history. |
| New-career state | CHANGE to contract `empty`; do not populate fake zero leader records. |
| Failed history read | CHANGE to contract `unavailable`; never present a failed read as zero career totals. |
| In-flight history read | CHANGE to contract `loading`; no fake values. |
| Pre-provider owner-review history | CHANGE to exactly `Current Showdown only. Career history is not yet available.` |
| Mockup sub-navigation strip `CAREER HUB > CAREER STATISTICS \| TROPHY ROOM \| TRANSFERS \| HISTORY` | DROP. The product has no such sub-tabs; Trophy Room is reached by `OPEN TROPHY ROOM` (and its Home tile), History by the Home/CAREER routes. |
| Mockup Career Table columns `SHOWDOWNS · SEASONS · POINTS · TROPHIES · WIN %` | CHANGE to the live headers `#`, `Manager`, `Showdowns`, `Season W-D-L`, `Points`, `Trophies` mapped to `showdowns.completed`, `seasonWins/seasonDraws/seasonLosses`, `careerPoints`, `totalTrophies`. DROP `WIN %` (showdown win rate is not a §6 field). |
| Mockup Career Leaders `TOP SCORER · 102 Goals` and `TOP ASSISTS · 48 Assists` | DROP. Goal/assist totals by player are not recorded; top scorer/top assist are yes/no per season. |
| Mockup Career Leaders `MOST CLEAN SHEETS` | DROP. Clean sheets are not recorded (§9). |
| Mockup comparison rows `LEAGUE WINS` / `CUP WINS` / `GOALS SCORED` | `LEAGUE WINS` → `LEAGUE TITLES`; `CUP WINS` → `DOMESTIC CUPS`; `GOALS SCORED` → `AVERAGE LEAGUE GOALS` (see rows above). |
| Phone layout (393 × 660, no page scroll) | CHANGE to stacked sections / tabs with Daniel first or left; never shrink labels to fit. |
| Shared top navigation, if shown in the mockup | CHANGE to HOME / CAREER / STANDINGS / STATS / RULES plus settings; no ABOUT, search or profile destination. |

The repository mockup is a binary PNG and the GitHub text connector in this chat does not expose its pixels. This table therefore resolves every Career Statistics mockup element explicitly called out by JOB-003, plus every data, rights, button, manager-order and history-state element governed by the binding product papers, without inventing unverified decorative details.

## Open questions

None blocking.

The binding product papers and agreed Team G data contract answer Career Statistics manager order, routes, counted-history rules, allowed fields, dropped stats, five provider states and rights constraints. The current live screen does not supply bespoke provider-loading, provider-unavailable or partial-history prose; the rebuild must therefore present those contract states honestly without pretending that legacy copy exists. Where copy is explicitly fixed by the contract, use it exactly, including `Current Showdown only. Career history is not yet available.` and visible partial coverage.

The repository mockup's pixels are not exposed through this chat's GitHub text connector. That is not a product question: JOB-003 names the product-sensitive mockup corrections explicitly, and those plus the binding product papers are fully reconciled above. Decorative spacing, motion, exact plate composition and responsive layout remain implementation decisions for later visual jobs and may not change this truth sheet.
