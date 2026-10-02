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

### Rebuilt history-state copy

These strings do not exist on the legacy `main` Trophy Room. They are contract-required new copy and are marked `source: "new"` in fixtures.

| State / slot | Copy | Source |
| --- | --- | --- |
| Loading body | `Loading career history…` | `new` |
| Partial body | `Some Showdowns could not be read. Showing {READABLE} of {INDEXED} Showdowns.` | `new` |
| Partial records heading | `AVAILABLE RECORDS` | `new` |
| Unavailable body | `Career history is unavailable right now.` | `new` |

When `status = partial`, `AVAILABLE RECORDS` replaces `ALL-TIME RECORDS`; the incomplete frame must never make an all-time or complete-career claim.

### Accessibility text

- The Trophy Room Back button has no explicit `aria-label`; its accessible name is the visible text `BACK`.
- Central navigation assigns the `h2` id `trophyRoomScreenTitle`, `tabindex="-1"`, and `data-route-focus-target="true"`, then sets the section's `aria-labelledby="trophyRoomScreenTitle"`.
- `aria-hidden` changes with route visibility. No other Trophy Room-specific aria-label string is authored in `js/trophyRoom.js`.


## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md` v1.0, especially §0 (global state/key rules), §6 ("what counts" and career aggregates), §7 (Trophy Room), and §9 (dropped stats). The agreed contract is newer than the legacy local-history presentation on `main`; this section defines the rebuilt screen.

Managers are keyed by slot role only: `playerOne = daniel` and `playerTwo = nik`. Daniel is always the left/first manager. Career history is provider history; abandoned Showdowns contribute nothing.

### Fields the rebuilt Trophy Room may use

| Contract field | E/A | Source/equivalent on `main` | Level | Trophy Room use |
| --- | --- | --- | --- | --- |
| `status` = `loading | empty | unavailable | partial | ready` | A | No five-state Trophy Room model exists on main; `renderTrophyRoom()` assumes a synchronous local read. | Career view | Drives the whole screen state. Failed reads are never drawn as zero. |
| `coverage.{readable,indexed}` | A | No provider coverage field on main. §6 defines it for career history. | Career view | Required when `status = partial`; the screen must show coverage and must not call partial data "all-time" or "career". |
| `interimLabel` | A | No equivalent on main. | Career view | Before provider history exists, owner-review current-Showdown previews use exactly: `Current Showdown only. Career history is not yet available.` Never a launch state. |
| `championsLeagues` per manager | A | `accumulateRoundStats()` in `js/analytics.js` increments the legacy local aggregate when `player.championsLeague` is true. | Per career, per manager | Cabinet count; one win = one trophy. |
| `leagueTitles` per manager | A | `accumulateRoundStats()` increments when `leaguePosition === 1`. | Per career, per manager | Cabinet count. |
| `domesticCups` per manager | A | `accumulateRoundStats()` increments when `player.domesticCup` is true. | Per career, per manager | Cabinet count. |
| `totalTrophies` per manager | A | `finalizeManagerCareerStats()` computes `leagueTitles + domesticCups + championsLeagues`. | Per career, per manager | Cabinet total; counts wins, not scoring points. |
| `careerPoints` per manager | A | Legacy equivalent is `manager.totalPoints`, accumulated from each accepted season score by `accumulateRoundStats()`. | Per career, per manager | Primary Trophy Room standings sort/display value. |
| `seasonWins` per manager | A | Legacy local equivalent is incremented from `round.winner` in `accumulateRoundStats()`. | Per career, per manager | Secondary standings tiebreak/display value. |
| `showdowns.{daniel,nik}.wins` | A | Main equivalent: `manager.showdownWins` in `calculateCareerAnalytics()`. | Per career, per manager | Showdown-record shape used by Career Statistics. `showdowns.daniel.wins` and `showdowns.nik.wins` power the Showdown Champion card/category; do not nest this under `managers.*`; it remains separate from §7 `totalTrophies`. |
| `standings` | A | `calculateCareerAnalytics()` currently sorts legacy managers by Showdown wins, then trophies, then points; `createCareerStandingsTable()` renders that order. | Per career | Contract overrides the legacy order: sort by `careerPoints`, then `seasonWins`, else level/shared rank. |
| `records[]` | A | `buildCareerRecords()` in `js/analytics.js` builds the legacy local record set. | Per career | Only the five contract record families below. Each item is `{label, manager or "shared", value, ref}`. |
| `records[].label` | A | Legacy labels are authored in `renderAllTimeRecords()` in `js/trophyRoom.js`. | Per career record | Human-readable record name. |
| `records[].manager` or `"shared"` | A | Legacy `findSeasonRecord()` can return multiple holders; `findManagerLeaders()` also returns ties. | Per career record | Holder identity; ties normalize to `"shared"`. |
| `records[].value` | A | Legacy record helpers compute numeric maxima/counts. | Per career record | Numeric record value. |
| `records[].ref` | A | Main uses ad-hoc `showdown`, `season`, and club text rather than one normalized ref. | Record → season/Showdown reference | Stable source reference supplied by Team G. |

The five allowed `records[]` families from §7 are:

1. Highest season score. Main equivalent: `findSeasonRecord(history, player => getAnalyticsScoring(player).total)`.
2. Highest league points. Main equivalent: `findSeasonRecord(history, player => player.leaguePoints)`.
3. Highest league goals. Main equivalent: `findSeasonRecord(history, player => player.leagueGoals)`.
4. Biggest Showdown win. Main equivalent: `findBiggestShowdownMargin(history)`.
5. Most perfect seasons. Main equivalent: `findManagerLeaders(managers, "perfectSeasons")`, where `accumulateRoundStats()` increments at season score 11.

### Standings row order and rank

The visual row order is fixed for identity consistency: Daniel is always the first row and Nik is always the second row. Do not sort or swap the rows when the leader changes. The `#` column carries the computed career rank instead: `#1` for the leader, `#2` for the other manager, and the same rank for a level tie. This keeps Daniel-first presentation while still showing who leads by `careerPoints`, then `seasonWins`.

### What counts

Per DATA_CONTRACT_V1 §6:

| Showdown state | Seasons count toward career totals | Showdown outcome counts |
| --- | --- | --- |
| Pending pairing | no | no |
| Active | accepted/acknowledged seasons only | no |
| Final result reconciled, Terminal Close pending | all accepted seasons | no; visible as completion-pending elsewhere |
| Closed with verified Terminal Close | all accepted seasons | exactly one |
| Abandoned | none, including previously visible seasons | none |
| Unreadable | nothing invented | nothing; Trophy Room is `partial` and shows coverage |

If a Showdown is abandoned, the provider rebuilds career trophies, standings and records from counted history; the UI never subtracts locally.

### Five screen states

The rebuilt Trophy Room uses only the contract states:

- `loading`: history read is in progress. Do not render zeros as data.
- `empty`: history read succeeded and this is a new career. All four original trophy types remain visible; unwon cards are dark and say `Not won yet`.
- `unavailable`: history read failed. Do not render empty/zero trophy counts as though they were real.
- `partial`: some Showdowns are unreadable. Render the readable results plus `coverage.{readable,indexed}`; do not use an "all-time" or "career" claim for incomplete coverage.
- `ready`: provider career history is readable and the contract fields above may render normally.

There is no separate contract `error` state; a career-history read failure is `unavailable`.

### Legacy fields that are not allowed on the rebuilt Trophy Room

The current `main` Trophy Room exposes more legacy analytics than DATA_CONTRACT_V1 §7. Those do not carry forward here unless another contract revision explicitly adds them:

- Overall summary totals: completed Showdowns, seasons played, combined Showdown points.
- Manager Showdown W-D-L and Showdown count.
- Safe signings and club-history strings.
- 100-point seasons, 100-goal seasons, performance-bonus counts and awards-bonus counts as cabinet supporting stats.
- Legacy record cards for most Showdown wins, most career points, most trophies, most Champions Leagues, most league titles and most domestic cups.

`careerPoints` and `seasonWins` remain allowed only because §7 defines the standings order using them and §6 defines those career aggregates. Trophy counts remain the four per-manager cabinet fields in §7.

DATA_CONTRACT_V1 §9 also forbids clean sheets, biggest single-match win, European wins other than Champions League, player names/player leaders/photos, match-by-match results, possession and all per-match stats. Top scorer/top assist are season booleans, not player-name statistics, and are not Trophy Room fields.


## Screen states and preview frames

Trophy Room is a career-history view. It uses the contract's five states, not a single Showdown's lifecycle status.

| State | Meaning | Rendering rule |
| --- | --- | --- |
| `loading` | Provider history read is in flight. | Stable shell only; never present placeholder zeroes as facts. |
| `empty` | Read succeeded and no counted career history exists. | Daniel first/left, Nik second/right; all four trophy cards remain visible, dark, with `Not won yet`. |
| `unavailable` | History read failed. | Honest unavailable treatment; no trophy or record values are invented. |
| `partial` | Some indexed Showdowns are unreadable. | Show readable data plus `coverage.{readable,indexed}`; use `AVAILABLE RECORDS` instead of `ALL-TIME RECORDS`; never label incomplete data "all-time" or complete career history. |
| `ready` | Counted provider history is readable. | Full cabinets, standings and the five contract record families. |

A generic read error maps to `unavailable`; there is no sixth `error` state. There is no Trophy Room `active` or `completed` state: those are source-Showdown conditions handled by the §6 counting rules. There is no viewer-role variant; Daniel and Nik remain fixed in that order.

### Trophy/category sources

Required categories are `ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE`.

- Showdown Champion: `showdowns.daniel.wins` / `showdowns.nik.wins` from §6. This Showdown record is a sibling of `managers`; `managers.daniel.showdowns.wins` / `managers.nik.showdowns.wins` is not the contract shape.
- League Title: `leagueTitles`.
- Domestic Cup: `domesticCups`.
- Champions League: `championsLeagues`.
- `totalTrophies` remains the agreed §7 season-trophy total; Showdown Champion is displayed separately rather than silently changing that field's meaning.

### TR1 derivation check

The fixture validation source is never rendered. Its five fictional Premier League seasons are grouped into valid 1-, 3-, and 1-season Showdowns: season 1 is `preview-showdown-1`, seasons 2–4 are `preview-showdown-2`, and season 5 is `preview-showdown-3`. A league title is derived only from `leaguePosition === 1`. At this step's grouping, the scoring formula recomputes TR1 to Daniel 27 career points / 3 season wins / 6 season trophies and Nik 22 / 2 / 6; the Showdowns resolve to Daniel 2 wins and Nik 1, with Daniel's 8-point `preview-showdown-1` win the biggest. TR3's two readable Showdowns are the first four seasons and recompute to Daniel 26 points / 3 season wins / 6 trophies and Nik 16 / 1 / 4.

### Preview frames

- TR1 · ready · both managers have trophies. Category `ALL`; fictional provider values; Daniel left/first, Nik right/second; standings rows remain Daniel-first and the `#` rank shows Daniel leading; includes all five allowed record families.
- TR2 · empty · new career. All four original trophy cards stay visible at zero, dark, each unwon card saying exactly `Not won yet`; no record holder is invented.
- TR3 · partial · readable-history values plus visible coverage. If owner review temporarily uses current-Showdown-only data before provider history exists, the only interim copy is exactly `Current Showdown only. Career history is not yet available.`
- TR4 · ready · category `LEAGUE TITLES`. This replaces the suggested Daniel-only filter: neither live main nor PRODUCT_TRUTH defines a manager-only filter, and both managers must stay comparable. Daniel remains left/first and Nik right/second.
- TR5 · unavailable. Added because this is a distinct required contract state; no zero values are presented as provider facts.
- TR6 · loading. Added because this is a distinct required contract state; layout order is reserved but no fake counts or records appear.
- TR7 · ready · Nik leads the career standings. The rows still render Daniel first and Nik second; the `#` column shows Daniel `#2` and Nik `#1`.

All populated preview numbers are fictional, visibly labelled `Preview data`, and must obey DATA_CONTRACT_V1 §0 bounds. No separate `error`, `active`, `completed`, or Daniel-only preview frame exists.


## Phone

- Trophy Room is a hub screen, so reserve the shared 56 px bottom bar plus safe-area space; the screen content must fit above it.
- At 393 × 660 there is no page scroll. Keep the 360 × 640 safety target, and keep the primary action visible at 375 × 553.
- Put both managers in the top band with Daniel first/left and Nik second/right; never swap them to reflect rank.
- The trophy shelf becomes a sideways-swipe rail rather than a vertically stacked shelf. On every trophy card, Daniel's count is the left/first value and Nik's is the right/second value.

## Mockup reconciliation

The mockup is reference, not product authority. Every product-sensitive element explicitly identified by JOB-002 is resolved below.

| Mockup element | Product answer |
| --- | --- |
| Trophy Room stadium / gold-black ceremony composition | KEEP as visual direction. Daniel stays left and Nik right; names and counts remain live DOM text. |
| `TROPHY ROOM` title | KEEP with product wording `TROPHY ROOM`. |
| `ALL` | KEEP. Show all four original trophy families for both managers. |
| `SHOWDOWN` | KEEP. Use `showdowns.daniel.wins` / `showdowns.nik.wins` for Showdown Champion. |
| `LEAGUE TITLES` | KEEP. Use `leagueTitles`. |
| `DOMESTIC CUPS` | KEEP. Use `domesticCups`. |
| Mockup `CONTINEENTAL` | CHANGE to `CHAMPIONS LEAGUE`. |
| Duplicate `ABOUT` | DROP. It is not a Trophy Room action and shared navigation has no ABOUT tab. |
| `SPECIAL` | DROP. The agreed contract has no special-trophy field. |
| Showdown trophy | CHANGE to our original Showdown Champion trophy art. |
| League-title trophy | CHANGE to our original League Title trophy art; never a real league trophy. |
| Domestic-cup trophy | CHANGE to our original Domestic Cup trophy art; never a real cup trophy. |
| Continental / Champions League trophy | CHANGE to our original Champions League cup art; never the real UEFA trophy or marks. |
| Real league/competition logos | CHANGE to original `getLeagueMark` output only. The §7 career counts carry no per-league split, so a league badge may appear only where the view model supplies a `leagueId` (for example a current-Showdown card); never invent a per-league count. |
| Daniel cabinet/counts | KEEP with live data. Daniel is always first/left. |
| Nik cabinet/counts | KEEP with live data. Nik is always second/right. |
| Trophy type with zero wins | CHANGE: keep the card visible, dark, with exactly `Not won yet`. |
| Baked manager names, counts, scores, records or league names | CHANGE to live DOM data; never bake them into imagery. |
| Trophy total | KEEP only as contract `totalTrophies`. Showdown Champion remains separate so §7 total meaning is not silently changed. |
| Career standings | KEEP with contract order: `careerPoints`, then `seasonWins`, else level/shared rank. |
| Career points / season wins used for standings | KEEP as contract-backed live data. |
| Highest season score | KEEP; §7 record. |
| Highest league points | KEEP; §7 record. |
| Highest league goals | KEEP; §7 record. |
| Biggest Showdown win | KEEP; §7 record based on Showdown point margin, not a match score. |
| Most perfect seasons | KEEP; §7 record, perfect means computed score 11. |
| Clean sheets | DROP; not recorded. |
| Biggest single-match win | DROP; match-by-match results are not recorded. |
| European wins other than Champions League | DROP; not recorded. |
| Assists totals / goalscorer-name leaderboards | DROP; top scorer/top assist are season booleans, not player statistics. |
| Player photo/portrait | DROP; player photos are not allowed. |
| Possession or any per-match statistic | DROP; excluded by DATA_CONTRACT_V1 §9. |
| Legacy supporting cabinet stats: 100-point seasons, 100-goal seasons, performance/awards bonus counts, safe signings, club-history lists | DROP from Trophy Room because §7 does not list them. |
| `ALL-TIME` / complete-career wording | KEEP only in `ready`. CHANGE in `partial`: show coverage and avoid all-time/complete-career claims. |
| Pre-provider current-Showdown preview | CHANGE to exactly `Current Showdown only. Career history is not yet available.` |
| New-career state | CHANGE to `empty`: both managers and all trophy families remain visible with `Not won yet`. |
| Failed history read | CHANGE to `unavailable`; never present failed data as zero trophies. |
| In-flight history read | CHANGE to `loading`; no fake zero values. |
| Back control | KEEP with live wording `BACK` and centralized Smart Back. |
| Any extra mockup button with no product behaviour | DROP. |
| Mockup sub-navigation strip `CAREER HUB > TROPHIES \| TRANSFERS \| HISTORY \| RECORDS` | DROP. The product has no such sub-tabs; records live on this screen, History is its own Home destination. |
| Mockup category tab `LEAGUE` | CHANGE to `LEAGUE TITLES`. |
| Mockup per-competition trophy cards `PREMIER LEAGUE ×1`, `CHAMPIONS LEAGUE ×0`, `LALIGA ×1`, `FA CUP ×1`, `COPA DEL REY ×0` | CHANGE to the four original trophy families (Showdown Champion, League Title, Domestic Cup, Champions League), each card showing Daniel's count left and Nik's right. |
| Mockup `SUPERCOPA ×0` card | DROP. Super cups are not recorded. |
| Phone trophy shelf | CHANGE to a sideways-swipe shelf (Nik's review), Daniel's count left on every card; 393 × 660 with no page scroll. |
| Mockup top navigation, if present | CHANGE to shared HOME / CAREER / STANDINGS / STATS / RULES plus settings; no ABOUT, search or profile destinations. |

The binary mockup cannot be decoded by this chat's repository text connector. This table therefore resolves every Trophy Room mockup element explicitly enumerated by JOB-002 and every rights/data/navigation-sensitive element governed by the binding product papers, without inventing unverified decorative elements.


## Open questions

None blocking.

The product papers and agreed Team G contract answer the Trophy Room's data, states, manager order, categories, rights, counting and navigation behavior. Remaining choices such as decorative spacing, motion, exact trophy-art placement and responsive composition are visual implementation decisions and may not change the truth above. The repository mockup binary could not be decoded through the text-only GitHub connector in this chat; JOB-002's explicit mockup corrections and the binding product papers were used for every product-sensitive reconciliation, so this does not create a product question.
