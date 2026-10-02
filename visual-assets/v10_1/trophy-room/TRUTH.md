# Trophy Room · product truth

Source of live behaviour: `main` @ `2de237391e17c7de2c6deb606b102b68ee640212` (read only).
Factory authority: `PRODUCT_TRUTH.md`, `DATA_CONTRACT_V1.md`, and JOB-002. Where the legacy live screen exposes fields outside the agreed contract, the contract wins for the future build.

## Ids and routes

### Renderer and screen creation

- `createTrophyRoomScreen()` in `js/trophyRoom.js` creates the screen lazily. It exits if `#trophyRoom` already exists.
- `renderTrophyRoom(force = false)` is the live renderer. It reads `buildCareerAnalytics()`, builds a fragment, and replaces `#trophyRoomContent`.
- `openTrophyRoom()` creates the screen, renders it, then calls `showScreen("trophyRoom")`.
- `window.renderTrophyRoom` and `window.openTrophyRoom` are the exported screen APIs.
- `getTrophyRoomRenderKey()` shares `getCareerAnalyticsRevisionKey()` when available; the browser identity audit verifies that the Trophy Room refreshes when career identity mapping changes.

### Open route

Current live route on `main`:

1. Career Statistics renders `#careerStatisticsTrophyButton` with the visible text `OPEN TROPHY ROOM`.
2. Clicking it calls `window.openOptionalModule("trophyRoom")`.
3. `js/optionalModules.js` runs `ensureTrophyRoomModule()`: loads `css/analytics.css`, the shared football visual experience, `js/analytics.js`, `js/statistics.js`, then `js/trophyRoom.js`.
4. `openOptionalModule("trophyRoom")` calls `window.openTrophyRoom()`.
5. `openTrophyRoom()` calls `showScreen("trophyRoom")`.

The current architecture contract explicitly requires no competing `#trophyRoomButton` on Home. This differs from the new factory `PRODUCT_TRUTH.md §5`, which makes Trophy Room a Home destination for the rebuilt navigation. JOB-002 records the live route; later navigation work owns the new Home/top-bar route.

### Back route

- The Trophy Room Back control is a button with class `.backButton`; it has no bespoke click handler.
- `initializeSmartBackDelegation()` in `js/screens.js` captures `.backButton` clicks and calls `navigateBackSmart()`.
- `SAFE_BACK_TARGETS.trophyRoom` is exactly `["dashboard", "careerStatistics", "mainMenu"]`.
- Smart Back first uses the most recent legal entry in `screenHistory`. If no legal history entry exists, it tries the safe targets in the order above, then the canonical route, then `mainMenu`.
- `trophyRoom` is registered in the central `screens` array and is not a `GAMEPLAY_SCREENS` route.

### IDs

| ID | Owner | Dependency / meaning |
| --- | --- | --- |
| `trophyRoom` | `createTrophyRoomScreen` | Screen route target; `showScreen`, navigation tests and browser audits depend on it. |
| `trophyRoomContent` | `createTrophyRoomScreen` | Renderer host replaced by `renderTrophyRoom`. |
| `trophyRoomScreenTitle` | `prepareScreenAccessibility` | Assigned lazily to the screen's `h2`; becomes the section's `aria-labelledby` target and focus target after navigation. |
| `careerStatisticsTrophyButton` | `createCareerStatisticsScreen` | Current live entry point; optional-module busy state and the browser identity audit depend on it. |

### Classes and data attributes used by live code/tests

The lazy Trophy Room DOM currently emits these structural classes. They are part of the live selectors/styling surface and must not be silently renamed by a replacement build without updating its integration:

- Screen shell: `.screen`, `.hidden`, `.analyticsScreen`, `.analyticsContent`, `.analyticsActions`, `.backButton`.
- Summary/table: `.analyticsStatsGrid`, `.trophyRoomSummary`, `.analyticsSectionHeading`, `.careerStandings`, `.careerStandingsRow`, `.header`.
- Cabinets: `.managerCabinetList`, `.managerCabinet`, `.managerCabinetHeader`, `.managerRank`, `.managerCareerPoints`, `.trophyShelf`, `.trophyCount`, `.trophyGlyph`, `.cabinetSupportingStats`, `.cabinetAchievementStrip`.
- Records/states: `.recordsGrid`, `.recordCard`, `.analyticsEmpty`, `.analyticsIdentityNotice`.
- Live data attributes: `data-profile-id` on manager rows/cabinets and `data-unresolved-roles` on the identity notice.
- The browser audit directly selects `#trophyRoom .managerCabinet[data-profile-id]` and `#trophyRoom .analyticsIdentityNotice`.


## Live buttons and strings

### Buttons on the live Trophy Room

The live `main` Trophy Room itself has exactly one button:

| Visible text | Element | Behaviour |
| --- | --- | --- |
| `BACK` | `button.backButton` | Delegated to `navigateBackSmart()`; legal Trophy Room targets are dashboard, Career Statistics, then Main Menu as described above. |

There are no live category/filter buttons inside Trophy Room on `main`. The only current entry control is outside the screen: Career Statistics has `OPEN TROPHY ROOM` on `#careerStatisticsTrophyButton`, which lazy-loads and opens this module.

### Static visible strings copied from `js/trophyRoom.js`

These are literal strings emitted by the live screen:

- `TROPHY ROOM`
- `BACK`
- `CAREER POINTS`
- `Champions League`
- `League Titles`
- `Domestic Cups`
- `UCL`
- `LGE`
- `CUP`
- `TOTAL TROPHIES`
- `SEASON WINS`
- `PERFECT SEASONS`
- `11 points`
- `100-POINT SEASONS`
- `100-GOAL SEASONS`
- `SAFE SIGNINGS`
- `No club history`
- `—`
- `No completed record yet`
- `0`
- `No manager has recorded this achievement yet`
- `ALL-TIME RECORDS`
- `MOST SHOWDOWN WINS`
- `MOST CAREER POINTS`
- `MOST TROPHIES`
- `MOST CHAMPIONS LEAGUES`
- `MOST LEAGUE TITLES`
- `MOST DOMESTIC CUPS`
- `PERFECT 11-POINT SEASONS`
- `HIGHEST SEASON SCORE`
- `HIGHEST LEAGUE POINTS`
- `MOST LEAGUE GOALS`
- `BIGGEST SHOWDOWN WIN`
- `COMPLETED SHOWDOWNS`
- `SEASONS PLAYED`
- `TROPHIES WON`
- `SHOWDOWN POINTS`
- `CAREER TABLE`
- `MANAGER CABINETS`
- `The Trophy Room is empty. Complete a showdown and its managers, trophies, records, and career statistics will appear here automatically.`

The shared Career Table renderer in `js/statistics.js`, which Trophy Room calls, adds these exact header strings:

- `#`
- `Manager`
- `Showdowns`
- `Season W-D-L`
- `Points`
- `Trophies`

### Dynamic visible templates copied from `js/trophyRoom.js`

- Manager rank: `#${rank}`.
- Manager record: `${manager.showdownWins}W · ${manager.showdownDraws}D · ${manager.showdownLosses}L across ${manager.showdowns} showdown${manager.showdowns === 1 ? "" : "s"}`.
- Achievement strip: `${manager.performanceBonuses} performance bonus${manager.performanceBonuses === 1 ? "" : "es"} · ${manager.awardsBonuses} awards bonus${manager.awardsBonuses === 1 ? "" : "es"}`.
- Club history when non-empty: `${manager.clubs.length} club${manager.clubs.length === 1 ? "" : "s"}: ${manager.clubs.join(", ")}`.
- Record-holder names: `record.holders.map(holder => holder.name).join(" · ")`.
- Season-record detail: `${holder.manager} · ${holder.club} · Season ${holder.season} · ${holder.showdown}${tied}`.
- Multi-holder suffix: ` · ${record.holders.length}-way tie`.
- Record value suffixes used by cards: ` pts` and ` goals`.
- Biggest Showdown win value: `${records.biggestShowdownMargin.value} pts`.
- Biggest Showdown win detail: `${records.biggestShowdownMargin.manager} · ${records.biggestShowdownMargin.score} · ${records.biggestShowdownMargin.showdown}`.
- Identity notice: `${unresolved} historical manager role${unresolved === 1 ? " remains" : "s remain"} unresolved. ${unresolved === 1 ? "It is" : "They are"} excluded from manager cabinets and longitudinal leaderboards until explicitly linked to Local Profiles. Overall trophy totals and Showdown or season records remain complete.`

### State-dependent live strings

- Empty manager history: the long `The Trophy Room is empty...` message above appears only when there are no manager cabinets and there is no unresolved-identity notice.
- Unresolved identity: the identity-notice template appears only when `analytics.identity.unresolvedRoleCount > 0`.
- No record yet: `—` plus `No completed record yet`.
- A recorded achievement whose leading value is zero: `0` plus `No manager has recorded this achievement yet`.
- No club history: `No club history`; otherwise the dynamic club-count/history string.
- `BIGGEST SHOWDOWN WIN` is rendered only when `records.biggestShowdownMargin` exists.
- `ALL-TIME RECORDS` is rendered only when `analytics.totals.showdowns` is non-zero.

The current live implementation has no Trophy Room loading, unavailable, partial, or generic error copy inside `#trophyRoom`. While the optional module is loading, the external entry button gets `aria-busy="true"`. A module-open failure is surfaced through the global application notice with context `Unable to open trophyRoom` plus the underlying loader error. The contract-specific history state copy is defined below and overrides this legacy omission for the rebuilt screen.

### Accessibility text

- The Trophy Room Back button has no explicit `aria-label`; its accessible name is the visible text `BACK`.
- Central navigation assigns the `h2` id `trophyRoomScreenTitle`, `tabindex="-1"`, and `data-route-focus-target="true"`, then sets the section's `aria-labelledby="trophyRoomScreenTitle"`.
- `aria-hidden` changes with route visibility. No other Trophy Room-specific aria-label string is authored in `js/trophyRoom.js`.
